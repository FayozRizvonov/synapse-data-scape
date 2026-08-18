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
from typing import Any, Dict, List, Optional, Union

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
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
from src.optimizer import budget_allocator                            # noqa: E402

# Auth + tenant scoping (see api_auth.py)
from api_auth import Principal, authorize_project, get_principal      # noqa: E402

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
    # Either the documented rule form — {"min_ratio": .., "max_ratio": ..,
    # "fixed_spend": .., "min_spend": .., "max_spend": ..} — or a plain
    # [min_spend, max_spend] pair.
    channel_constraints: Optional[Dict[str, Union[Dict[str, float], List[float]]]] = None
    data_path: Optional[str] = None

    @field_validator("project_id")
    @classmethod
    def _project_id_is_uuid(cls, v: str) -> str:
        return validate_project_uuid(v)


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
    principal: Principal = Depends(get_principal),
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

    authorize_project(principal, project_id)

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
async def train_model(request: TrainRequest, principal: Principal = Depends(get_principal)):
    """
    Enqueue an async PyMC5 MMM training job.

    1. Creates an mmm_runs row (status=queued)
    2. Dispatches a Celery task (run_mmm_pipeline_task)
    3. Returns job_id immediately — poll /jobs/{job_id}/status for progress
    """
    authorize_project(principal, request.project_id)
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
async def get_job_status(job_id: str, principal: Principal = Depends(get_principal)):
    """
    Poll the status of an async training job.

    status values: queued | running | done | failed
    """
    # First check Supabase mmm_runs (authoritative)
    run = run_repo.get_run(job_id)
    if run:
        # A job carries no tenant of its own — authorise via the project it ran for.
        if run.get("project_id"):
            authorize_project(principal, str(run["project_id"]))
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
async def retrain_model(request: TrainRequest, principal: Principal = Depends(get_principal)):
    """Re-enqueue the pipeline for a project (same as /model/train)."""
    return await train_model(request, principal)


# ---------------------------------------------------------------------------
# Legacy project status (reads from Supabase mmm_models)
# ---------------------------------------------------------------------------

@app.get("/projects/{project_id}/status")
async def get_project_status(project_id: str, principal: Principal = Depends(get_principal)):
    authorize_project(principal, project_id)
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
async def approve_model(
    model_id: str,
    approval_notes: Optional[str] = None,
    principal: Principal = Depends(get_principal),
):
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")

    # A model carries no tenant of its own — authorise via its project.
    try:
        owner = (
            supabase_mmm_client.client
            .from_("mmm_models").select("project_id").eq("id", model_id).limit(1).execute()
        )
        rows = owner.data or []
    except Exception as exc:
        logger.warning(f"approve: model lookup failed for {model_id}: {exc}")
        raise HTTPException(status_code=503, detail="Could not resolve model owner")

    if not rows:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    authorize_project(principal, str(rows[0]["project_id"]))

    success = supabase_mmm_client.approve_model(model_id, principal.user_id, approval_notes)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to approve model")

    return ResponseModel(
        status="success",
        message="Model approved successfully",
        data={"model_id": model_id},
    )


@app.get("/models/{project_id}/latest", response_model=ResponseModel)
async def get_latest_approved_model(project_id: str, principal: Principal = Depends(get_principal)):
    authorize_project(principal, project_id)
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

def _latest_optimizer_inputs(project_id: str):
    """
    Fetch marginal_roi_curves + roi_key_points for a project's newest model.

    Both come from the PyMC5 pipeline; ordering by generated_at picks the most
    recent run rather than requiring an approval step (PyMC5 rows are written
    with is_approved=False, so get_latest_approved_model never matches them).
    """
    from supabase_client import supabase_mmm_client as _sb  # type: ignore

    pid = validate_project_uuid(project_id)
    rows = (
        _sb.client
        .from_("mmm_model_outputs")
        .select("output_type, output_data, model_id, generated_at")
        .eq("project_id", pid)
        .in_("output_type", ["marginal_roi_curves", "roi_key_points", "roi"])
        .order("generated_at", desc=True)
        .limit(3)
        .execute()
    )

    curves, key_points, roi_rows, model_id = None, None, None, None
    for row in rows.data or []:
        model_id = model_id or row.get("model_id")
        if row["output_type"] == "marginal_roi_curves" and curves is None:
            curves = row["output_data"]
        elif row["output_type"] == "roi_key_points" and key_points is None:
            key_points = row["output_data"]
        elif row["output_type"] == "roi" and roi_rows is None:
            roi_rows = row["output_data"]

    return curves or [], key_points or [], roi_rows or [], model_id


def _model_governance(model_id: Optional[str]) -> dict:
    """
    Approval state and convergence evidence for a model.

    Governance requires a model to pass diagnostics and business validation
    before approval, so callers are told when a scenario was built on an
    unapproved model rather than silently receiving one.
    """
    if not model_id:
        return {"model_id": None, "approved": False, "governance": None}
    try:
        from supabase_client import supabase_mmm_client as _sb  # type: ignore
        res = (
            _sb.client
            .from_("mmm_models")
            .select("id, is_approved, model_config")
            .eq("id", model_id)
            .limit(1)
            .execute()
        )
        row = (res.data or [{}])[0]
        config = row.get("model_config") or {}
        if isinstance(config, str):
            config = json.loads(config or "{}")
        return {
            "model_id": model_id,
            "approved": bool(row.get("is_approved")),
            "governance": config.get("governance"),
        }
    except Exception as exc:  # never fail a scenario over metadata
        logger.warning(f"governance lookup failed for {model_id}: {exc}")
        return {"model_id": model_id, "approved": False, "governance": None}


@app.post("/optimize/scenario", response_model=ResponseModel)
async def create_optimization_scenario(request: OptimizationRequest, principal: Principal = Depends(get_principal)):
    """
    Run budget optimisation using the latest approved model's ROI outputs from Supabase.
    """
    authorize_project(principal, request.project_id)
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    scenario_type = (request.scenario_type or "").strip().lower()
    if scenario_type not in ("tmb", "tsv"):
        raise HTTPException(
            status_code=422,
            detail="scenario_type must be 'tmb' (total media budget) or 'tsv' (total sales value)",
        )
    if scenario_type == "tmb" and request.total_budget is None:
        raise HTTPException(status_code=422, detail="total_budget is required for a 'tmb' scenario")
    if scenario_type == "tsv" and request.target_sales is None:
        raise HTTPException(status_code=422, detail="target_sales is required for a 'tsv' scenario")

    try:
        curves_rows, key_points, roi_rows, model_id = _latest_optimizer_inputs(request.project_id)
        if not curves_rows:
            raise HTTPException(
                status_code=409,
                detail=(
                    "No marginal ROI curves for this project — train a model first "
                    "(POST /model/train) and wait for the job to reach 'done'."
                ),
            )

        curves = budget_allocator.build_curves(curves_rows)
        current = budget_allocator.current_allocation(key_points)
        stability = budget_allocator.build_stability(roi_rows)
        base_revenue = budget_allocator.baseline_revenue(key_points) or 0.0

        common = {
            "constraints":   request.channel_constraints,
            "stability":     stability,
            "current_spend": current,
        }
        if scenario_type == "tmb":
            result = budget_allocator.allocate(
                curves, total_budget=float(request.total_budget), **common
            )
        else:
            # TSV targets total sales; the curves are incremental to baseline.
            target_incremental = float(request.target_sales) - base_revenue
            result = budget_allocator.allocate(
                curves, target_revenue=target_incremental, **common
            )

        expected_sales = base_revenue + result["total_incremental_revenue"]
        current_total = sum(current.values()) if current else None

        scenario_data = {
            "scenario_name": f"Opt_{scenario_type}_{datetime.now():%Y%m%d_%H%M%S}",
            "scenario_type": scenario_type,
            "scenario_config": request.dict(),
            "optimization_results": {
                "allocation":          result["allocation"],
                "incremental_revenue": result["incremental_revenue"],
                "binding_limit":       result["binding_limit"],
                "minimum_representable_spend": result.get("minimum_representable_spend"),
                "baseline_revenue":    base_revenue,
                "stability_weights":   result.get("stability_weights", {}),
            },
            "total_budget": result["total_spend"],
            "expected_sales": expected_sales,
            "roi_metrics": result["roi"],
            "allocation_breakdown": {
                media: {
                    "recommended_spend": spend,
                    "current_spend":     current.get(media),
                    "change":            (spend - current[media]) if media in current else None,
                    "roi":               result["roi"].get(media),
                }
                for media, spend in result["allocation"].items()
            },
        }

        model = supabase_mmm_client.get_latest_approved_model(request.project_id)
        if model:
            supabase_mmm_client.save_optimization_scenario(
                request.project_id, model.get("id"), scenario_data
            )

        return ResponseModel(
            status="success",
            message="Optimisation scenario created",
            data={
                "project_id": request.project_id,
                "scenario": scenario_data,
                # Shape consumed by the frontend OptimizationResponse type.
                "scenario_type":   scenario_type,
                "total_budget":    result["total_spend"],
                "allocation":      result["allocation"],
                "roi":             result["roi"],
                "expected_sales":  expected_sales,
                "current_allocation": current or None,
                "current_total_spend": current_total,
                "model": _model_governance(model_id),
                "response_curves": {
                    media: [[s, ir] for s, ir in pts] for media, pts in curves.items()
                },
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Optimisation error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/optimize/sales-force", response_model=ResponseModel)
async def optimize_sales_force(request: SalesForceOptimizationRequest, principal: Principal = Depends(get_principal)):
    authorize_project(principal, request.project_id)
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
async def generate_insights(request: InsightRequest, principal: Principal = Depends(get_principal)):
    authorize_project(principal, request.project_id)
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
async def process_agent_prompt(request: AgentPromptRequest, principal: Principal = Depends(get_principal)):
    authorize_project(principal, request.project_id)
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
async def get_optimization_scenarios(project_id: str, scenario_type: Optional[str] = None, principal: Principal = Depends(get_principal)):
    authorize_project(principal, project_id)
    if not _legacy_db_available or not supabase_mmm_client.is_connected():
        raise HTTPException(status_code=503, detail="Database not connected")
    scenarios = supabase_mmm_client.get_approved_scenarios(project_id, scenario_type)
    return ResponseModel(
        status="success",
        message=f"Retrieved {len(scenarios)} scenarios",
        data={"scenarios": scenarios},
    )


@app.get("/scenarios/{project_id}/sales-force", response_model=ResponseModel)
async def get_sales_force_scenarios(project_id: str, principal: Principal = Depends(get_principal)):
    authorize_project(principal, project_id)
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
