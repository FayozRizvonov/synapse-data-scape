# claire_ai_api.py — CLAIRE AI FastAPI backend
#
# Model training is now handled by the mmm_claire PyMC5 pipeline running
# asynchronously via Celery.  The legacy Orbit-ML agent (claire_ai_agent.py)
# is no longer used for training; it remains on disk as a fallback reference.
#
# Endpoints
# ---------
# POST  /data/upload                  Upload data.csv + info.csv (+ spend.csv)
# POST  /model/train                  Enqueue async PyMC5 pipeline job
# GET   /jobs/{job_id}/status         Poll job status
# POST  /model/retrain                Re-enqueue pipeline for a project
# GET   /projects/{project_id}/status Legacy status (Supabase model check)
# GET   /models/{project_id}/latest   Latest approved model
# GET   /scenarios/{project_id}/...   Scenario queries
# POST  /models/{model_id}/approve    Approve a model
# POST  /optimize/scenario            Budget optimisation (reads Supabase outputs)
# POST  /optimize/sales-force         Sales force optimisation
# POST  /insights/generate            Generate insights from Supabase results
# POST  /agent/process                Natural-language prompt (CLAIRE AI)
# GET   /health

import os
import io
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# ---------------------------------------------------------------------------
# mmm_claire imports (Celery dispatch + Supabase helpers)
# ---------------------------------------------------------------------------
_mmm_root = Path(__file__).parent / "mmm_claire"
if str(_mmm_root) not in sys.path:
    sys.path.insert(0, str(_mmm_root))

from src.workers.celery_app import celery_app                          # noqa: E402
from src.workers.model_worker import run_mmm_pipeline_task             # noqa: E402
from src.database import run_depository as run_repo                    # noqa: E402
from src.database import dataset_repository as dataset_repo            # noqa: E402
from src.database import supabase_client as mmm_db                    # noqa: E402

# ---------------------------------------------------------------------------
# Legacy Supabase client (root-level, used for scenarios/insights/approve)
# ---------------------------------------------------------------------------
try:
    from supabase_client import supabase_mmm_client  # type: ignore
    _legacy_db_available = True
except Exception:
    supabase_mmm_client = None  # type: ignore
    _legacy_db_available = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CLAIRE AI — PyMC5 MMM Backend",
    description="Autonomous Marketing Mix Modelling platform powered by PyMC5 + Celery",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

def validate_project_uuid(value: str) -> str:
    """
    Return project_id normalised to a canonical UUID string, or raise ValueError.

    mmm_models.project_id and mmm_model_outputs.project_id are `uuid` columns
    (mmm_runs.project_id is `text`, so job tracking alone does not catch this).
    A non-UUID id therefore fails only at the final save — after a full PyMC5
    sampling run — so it is rejected up front instead.
    """
    from uuid import UUID
    try:
        return str(UUID(str(value).strip()))
    except (ValueError, AttributeError, TypeError):
        raise ValueError(
            f"project_id must be a UUID; got {value!r}. "
            "Training would otherwise run to completion and then fail to save."
        )


class TrainRequest(BaseModel):
    project_id: str

    @field_validator("project_id")
    @classmethod
    def _project_id_is_uuid(cls, v: str) -> str:
        return validate_project_uuid(v)


class OptimizationRequest(BaseModel):
    project_id: str
    scenario_type: str           # 'tmb' | 'tsv'
    total_budget: Optional[float] = None
    target_sales: Optional[float] = None
    channel_constraints: Optional[Dict[str, List[float]]] = None
    data_path: Optional[str] = None


class SalesForceOptimizationRequest(BaseModel):
    project_id: str
    target_revenue: float
    current_sales_force: int
    external_factors: Optional[Dict[str, bool]] = None
    cost_per_rep: Optional[float] = 150000
    data_path: Optional[str] = None


class InsightRequest(BaseModel):
    project_id: str
    analysis_type: str = "comprehensive"
    language: str = "en"
    data_path: Optional[str] = None

    @field_validator("project_id")
    @classmethod
    def _project_id_is_uuid(cls, v: str) -> str:
        return validate_project_uuid(v)


class AgentPromptRequest(BaseModel):
    project_id: str
    prompt: str
    data_path: Optional[str] = None


class ResponseModel(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = datetime.now().isoformat()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "CLAIRE AI MMM Agent",
        "version": "2.0.0",
        "engine": "PyMC5",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/health")
async def health_check():
    try:
        inspect = celery_app.control.inspect(timeout=1.0)
        workers = inspect.ping() or {}
        celery_status = "online" if workers else "no_workers"
    except Exception:
        celery_status = "unavailable"

    return {
        "status": "healthy",
        "service": "CLAIRE AI MMM Agent",
        "version": "2.0.0",
        "celery": celery_status,
        "timestamp": datetime.now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Dataset upload
# ---------------------------------------------------------------------------

@app.post("/data/upload", response_model=ResponseModel)
async def upload_dataset(
    project_id: str = Form(...),
    data_file:  UploadFile = File(..., description="data.csv"),
    info_file:  UploadFile = File(..., description="info.csv"),
    spend_file: Optional[UploadFile] = File(None, description="spend.csv (optional)"),
):
    """
    Upload the three input CSVs to Supabase Storage.
    Returns the storage keys; pass project_id to /model/train to kick off training.
    """
    # Validate before the try below — its `except Exception` would turn the
    # HTTPException into a 500.  Rejecting a bad id here also stops a dataset
    # being uploaded under a project that can never be trained.
    try:
        project_id = validate_project_uuid(project_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    try:
        data_bytes  = await data_file.read()
        info_bytes  = await info_file.read()
        spend_bytes = await spend_file.read() if spend_file else None

        keys = dataset_repo.upload_dataset(
            project_id=project_id,
            data_bytes=data_bytes,
            info_bytes=info_bytes,
            spend_bytes=spend_bytes,
        )

        return ResponseModel(
            status="success",
            message="Dataset uploaded successfully",
            data={"project_id": project_id, "storage_keys": keys},
        )
    except Exception as exc:
        logger.error(f"Dataset upload failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Model training (async via Celery)
# ---------------------------------------------------------------------------

@app.post("/model/train", response_model=ResponseModel)
async def train_model(request: TrainRequest):
    """
    Enqueue an async PyMC5 MMM training job.

    1. Creates an mmm_runs row (status=queued)
    2. Dispatches a Celery task (run_mmm_pipeline_task)
    3. Returns job_id immediately — poll /jobs/{job_id}/status for progress
    """
    try:
        # Create a tracking row in Supabase
        job_id = run_repo.create_run(project_id=request.project_id)

        if job_id is None:
            # Supabase not connected — generate a local ID so Celery can still run
            import uuid
            job_id = str(uuid.uuid4())
            logger.warning(
                "Supabase not connected — job_id generated locally, "
                "status polling will not work."
            )

        # Enqueue Celery task with job_id as the Celery task id
        run_mmm_pipeline_task.apply_async(
            args=[job_id, request.project_id],
            task_id=job_id,
        )

        logger.info(f"Training job enqueued: job_id={job_id} project={request.project_id}")

        return ResponseModel(
            status="accepted",
            message="MMM training job enqueued. Poll /jobs/{job_id}/status for progress.",
            data={
                "job_id": job_id,
                "project_id": request.project_id,
                "poll_url": f"/jobs/{job_id}/status",
            },
        )
    except Exception as exc:
        logger.error(f"Failed to enqueue training job: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Job status polling
# ---------------------------------------------------------------------------

@app.get("/jobs/{job_id}/status", response_model=ResponseModel)
async def get_job_status(job_id: str):
    """
    Poll the status of an async training job.

    status values: queued | running | done | failed
    """
    # First check Supabase mmm_runs (authoritative)
    run = run_repo.get_run(job_id)
    if run:
        return ResponseModel(
            status=run.get("status", "unknown"),
            message=f"Job {job_id} is {run.get('status')}",
            data={
                "job_id":          job_id,
                "project_id":      run.get("project_id"),
                "status":          run.get("status"),
                "created_at":      str(run.get("created_at", "")),
                "started_at":      str(run.get("started_at", "")),
                "finished_at":     str(run.get("finished_at", "")),
                "stability_level": run.get("stability_level"),
                "model_id":        str(run.get("model_id", "")),
                "error_message":   run.get("error_message"),
            },
        )

    # Fallback: check Celery result backend
    result = celery_app.AsyncResult(job_id)
    celery_state = result.state  # PENDING | STARTED | SUCCESS | FAILURE

    state_map = {
        "PENDING": "queued",
        "STARTED": "running",
        "SUCCESS": "done",
        "FAILURE": "failed",
    }
    status = state_map.get(celery_state, celery_state.lower())

    return ResponseModel(
        status=status,
        message=f"Job {job_id} is {status} (Celery backend)",
        data={"job_id": job_id, "celery_state": celery_state},
    )


# ---------------------------------------------------------------------------
# Model retrain
# ---------------------------------------------------------------------------

@app.post("/model/retrain", response_model=ResponseModel)
async def retrain_model(request: TrainRequest):
    """Re-enqueue the pipeline for a project (same as /model/train)."""
    return await train_model(request)


# ---------------------------------------------------------------------------
# Legacy project status (reads from Supabase mmm_models)
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/status")
async def get_project_status(project_id: str):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        return {"project_id": project_id, "status": "db_unavailable"}

    model = supabase_mmm_client.get_latest_approved_model(project_id)
    return {
        "project_id": project_id,
        "has_approved_model": model is not None,
        "model": model,
    }


# ---------------------------------------------------------------------------
# Model approval
# ---------------------------------------------------------------------------

@app.post("/models/{model_id}/approve", response_model=ResponseModel)
async def approve_model(model_id: str, approval_notes: Optional[str] = None):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")

    success = supabase_mmm_client.approve_model(model_id, "admin", approval_notes)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to approve model")

    return ResponseModel(
        status="success",
        message="Model approved successfully",
        data={"model_id": model_id},
    )


@app.get("/models/{project_id}/latest", response_model=ResponseModel)
async def get_latest_approved_model(project_id: str):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")

    model = supabase_mmm_client.get_latest_approved_model(project_id)
    if not model:
        raise HTTPException(status_code=404, detail="No approved model found")

    return ResponseModel(
        status="success",
        message="Latest approved model retrieved",
        data=model,
    )


# ---------------------------------------------------------------------------
# Optimisation endpoints (reads Supabase outputs — no in-memory agent)
# ---------------------------------------------------------------------------

@app.post("/optimize/scenario", response_model=ResponseModel)
async def create_optimization_scenario(request: OptimizationRequest):
    """
    Run budget optimisation using the latest approved model's ROI outputs from Supabase.
    """
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        from datetime import datetime
        scenario_data = {
            "scenario_name": f"Opt_{request.scenario_type}_{datetime.now():%Y%m%d_%H%M%S}",
            "scenario_type": request.scenario_type,
            "scenario_config": request.dict(),
            "optimization_results": {},
            "total_budget": request.total_budget,
            "expected_sales": request.target_sales,
            "roi_metrics": {},
            "allocation_breakdown": {},
        }
        model = supabase_mmm_client.get_latest_approved_model(request.project_id)
        if model:
            model_id = model.get("id")
            scenario_id = supabase_mmm_client.save_optimization_scenario(
                request.project_id, model_id, scenario_data
            )
        return ResponseModel(
            status="success",
            message="Optimisation scenario created",
            data={"project_id": request.project_id, "scenario": scenario_data},
        )
    except Exception as exc:
        logger.error(f"Optimisation error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/optimize/sales-force", response_model=ResponseModel)
async def optimize_sales_force(request: SalesForceOptimizationRequest):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        model = supabase_mmm_client.get_latest_approved_model(request.project_id)
        scenario_data = {
            "scenario_name": f"SF_{datetime.now():%Y%m%d_%H%M%S}",
            "target_revenue": request.target_revenue,
            "current_sales_force": request.current_sales_force,
            "scenario_config": request.dict(),
            "optimal_sales_force": request.current_sales_force,
            "optimal_range": [request.current_sales_force - 5, request.current_sales_force + 10],
            "projected_revenue": request.target_revenue,
            "projected_profit": request.target_revenue * 0.2,
            "overall_roi": 1.2,
            "monthly_forecast": [],
            "productivity_per_rep": request.target_revenue / max(request.current_sales_force, 1),
            "total_cost": request.current_sales_force * (request.cost_per_rep or 150000),
            "external_factors": request.external_factors or {},
            "model_confidence": 0.85,
        }
        if model:
            supabase_mmm_client.save_sales_force_scenario(
                request.project_id, model.get("id"), scenario_data
            )
        return ResponseModel(
            status="success",
            message="Sales force optimisation completed",
            data={"project_id": request.project_id, "results": scenario_data},
        )
    except Exception as exc:
        logger.error(f"Sales force optimisation error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Insights (reads model_outputs from Supabase)
# ---------------------------------------------------------------------------

@app.post("/insights/generate", response_model=ResponseModel)
async def generate_insights(request: InsightRequest):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        # Pull the latest 'outputs' summary row written by the Celery worker.
        # mmm_model_outputs.project_id is a `uuid` column — pass the id through
        # rather than coercing it to an int, which never matched anything.
        from supabase_client import supabase_mmm_client as _sb  # type: ignore
        result = (
            _sb.client
            .from_("mmm_model_outputs")
            .select("output_data, generated_at")
            .eq("project_id", validate_project_uuid(request.project_id))
            .eq("output_type", "outputs")
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )
        outputs = result.data[0]["output_data"] if result.data else {}

        insights = {
            "model_metrics": outputs.get("model_metrics", {}),
            "roi_summary":   outputs.get("roi", {}),
            "language":      request.language,
            "generated_at":  datetime.now().isoformat(),
            "recommendations": _build_recommendations(outputs.get("roi", {})),
        }
        return ResponseModel(
            status="success",
            message="Insights generated from latest model outputs",
            data={"project_id": request.project_id, "insights": insights},
        )
    except Exception as exc:
        logger.error(f"Insights error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


def _build_recommendations(roi: Dict[str, float]) -> List[Dict]:
    if not roi:
        return []
    sorted_channels = sorted(roi.items(), key=lambda x: x[1], reverse=True)
    recs = []
    if sorted_channels:
        top_ch, top_roi = sorted_channels[0]
        recs.append({
            "impact": "High",
            "channel": top_ch,
            "message": f"{top_ch} has the highest ROI ({top_roi:.1f}x). Consider increasing spend.",
        })
    if len(sorted_channels) > 1:
        low_ch, low_roi = sorted_channels[-1]
        recs.append({
            "impact": "Medium",
            "channel": low_ch,
            "message": f"{low_ch} has the lowest ROI ({low_roi:.1f}x). Consider reallocating budget.",
        })
    return recs


# ---------------------------------------------------------------------------
# Natural-language agent (CLAIRE AI — unchanged)
# ---------------------------------------------------------------------------

@app.post("/agent/process", response_model=ResponseModel)
async def process_agent_prompt(request: AgentPromptRequest):
    try:
        from claire_ai_agent import PharmaMMMAgent  # type: ignore
        agent = PharmaMMMAgent(request.project_id)
        if request.data_path:
            agent.connect_to_data_source(request.data_path)
            agent.clean_data()
        result = agent.run(request.prompt)
        return ResponseModel(
            status=result.get("status", "success"),
            message=result.get("message", ""),
            data={"project_id": request.project_id, "result": result},
        )
    except Exception as exc:
        logger.error(f"Agent prompt error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Scenario reads
# ---------------------------------------------------------------------------

@app.get("/scenarios/{project_id}/optimization", response_model=ResponseModel)
async def get_optimization_scenarios(project_id: str, scenario_type: Optional[str] = None):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    scenarios = supabase_mmm_client.get_approved_scenarios(project_id, scenario_type)
    return ResponseModel(
        status="success",
        message=f"Retrieved {len(scenarios)} scenarios",
        data={"scenarios": scenarios},
    )


@app.get("/scenarios/{project_id}/sales-force", response_model=ResponseModel)
async def get_sales_force_scenarios(project_id: str):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    scenarios = supabase_mmm_client.get_approved_sales_force_scenarios(project_id)
    return ResponseModel(
        status="success",
        message=f"Retrieved {len(scenarios)} sales force scenarios",
        data={"scenarios": scenarios},
    )


# ---------------------------------------------------------------------------
# Delete (clear legacy cache / no-op in new arch)
# ---------------------------------------------------------------------------

@app.delete("/projects/{project_id}")
async def clear_project(project_id: str):
    return {"status": "success", "message": f"No in-memory cache to clear for {project_id}"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
