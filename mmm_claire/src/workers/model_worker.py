"""
Celery task: run_mmm_pipeline_task

Lifecycle:
  1. FastAPI /model/train  → create mmm_runs row (status=queued)  → enqueue this task
  2. Worker picks up task  → status=running
  3. Downloads data from Supabase Storage to a temp dir
  4. Runs the full PyMC5 MMM pipeline
  5. Pushes all 12 output DataFrames to mmm_model_outputs
  6. status=done  (or status=failed on any exception)

The task ID in Celery is the same UUID as mmm_runs.id (job_id).
"""
import os
import sys
import tempfile
import traceback
import logging

# mmm_claire package root (contains run_mmm_pipeline.py)
_here = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _here not in sys.path:
    sys.path.insert(0, _here)


def _ensure_root_on_path() -> None:
    """
    Put the mmm_claire root back on sys.path.

    Doing this once at import time is not enough: inside the Celery prefork
    pool the task executes with a sys.path that no longer contains this entry
    (verified — sys.path holds only interpreter defaults by then), so
    `import run_mmm_pipeline` fails with ModuleNotFoundError. Call this
    immediately before importing anything from the package root.
    """
    if _here not in sys.path:
        sys.path.insert(0, _here)

from src.workers.celery_app import celery_app
from src.database import run_depository as repo
from src.database import dataset_repository as dataset_repo
from src.database import supabase_client as db

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="mmm_claire.workers.model_worker.run_mmm_pipeline_task",
    max_retries=0,        # don't auto-retry — a failed MMM run should stay failed
    acks_late=True,
)
def run_mmm_pipeline_task(self, job_id: str, project_id: str):
    """
    Async Celery task.  Called by the FastAPI /model/train endpoint.

    Parameters
    ----------
    job_id     : UUID of the mmm_runs row (created before this task is enqueued)
    project_id : Project identifier (string; may be numeric)
    """
    logger.info(f"[{job_id}] Task started for project {project_id}")
    repo.mark_running(job_id)

    try:
        # ----------------------------------------------------------------
        # 1. Fetch dataset_info from the mmm_runs row
        # ----------------------------------------------------------------
        run_row = repo.get_run(job_id)
        dataset_info = run_row.get("dataset_info") if run_row else None

        # ----------------------------------------------------------------
        # 2. Download dataset files from Supabase Storage
        # ----------------------------------------------------------------
        with tempfile.TemporaryDirectory(prefix=f"mmm_{job_id}_") as tmp_dir:
            out_dir = os.path.join(tmp_dir, "outputs")
            os.makedirs(out_dir, exist_ok=True)

            try:
                data_path, info_path, spend_path = dataset_repo.download_dataset(
                    project_id=project_id,
                    tmp_dir=tmp_dir,
                    dataset_info=dataset_info,
                )
                logger.info(f"[{job_id}] Dataset downloaded to {tmp_dir}")
            except RuntimeError as download_err:
                # No Supabase / files not uploaded yet — fall through to local defaults
                logger.warning(
                    f"[{job_id}] Could not download dataset from Supabase ({download_err}). "
                    "Falling back to local data/ directory."
                )
                data_path  = None
                info_path  = None
                spend_path = None

            # ----------------------------------------------------------------
            # 3. Run the PyMC5 pipeline
            # ----------------------------------------------------------------
            # Import here so the heavy PyMC5 imports only happen inside the worker
            _ensure_root_on_path()
            from run_mmm_pipeline import run_pipeline

            outputs = run_pipeline(
                data_path=data_path,
                info_path=info_path,
                spend_path=spend_path,
                out_dir=out_dir,
            )

            _meta             = outputs.get("_meta", {})
            stability_level   = _meta.get("stability_level", -1)
            detected_channels = _meta.get("detected_channels", {})
            fit_metrics       = outputs.get("fit_metrics", {})

            logger.info(
                f"[{job_id}] Pipeline complete — stability_level={stability_level} "
                f"r2={fit_metrics.get('r2')} mape={fit_metrics.get('mape')} "
                f"channel_groups={list(detected_channels)}"
            )

            # ----------------------------------------------------------------
            # 4. Persist model record + outputs to Supabase
            # ----------------------------------------------------------------
            model_id = db.save_model_record(
                project_id=project_id,
                job_id=job_id,
                stability_level=stability_level,
                fit_metrics=fit_metrics,
                detected_channels=detected_channels,
            )
            if not model_id:
                # save_model_record swallows DB errors and returns None; without
                # this check the job would be marked DONE having persisted nothing.
                raise RuntimeError(
                    "save_model_record returned no model_id — the mmm_models insert "
                    "failed (see preceding 'save_model_record:' warning for the "
                    "Postgres error). Refusing to mark this job done."
                )
            logger.info(f"[{job_id}] Model record saved: model_id={model_id}")

            # Remove internal meta key before saving outputs
            outputs_to_save = {k: v for k, v in outputs.items() if not k.startswith("_")}
            if not db.save_model_outputs(model_id, project_id, outputs_to_save):
                raise RuntimeError(
                    f"save_model_outputs failed for model_id={model_id} — pipeline "
                    "results were not persisted (see preceding 'save_model_outputs:' "
                    "warning). Refusing to mark this job done."
                )
            logger.info(f"[{job_id}] Model outputs saved to Supabase")

        # ----------------------------------------------------------------
        # 5. Mark done
        # ----------------------------------------------------------------
        repo.mark_done(job_id, stability_level=stability_level, model_id=model_id)
        logger.info(f"[{job_id}] Job marked DONE")
        return {"job_id": job_id, "status": "done", "model_id": model_id}

    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        logger.error(f"[{job_id}] Pipeline FAILED:\n{error_msg}")
        repo.mark_failed(job_id, error_message=error_msg)
        # Re-raise so Celery records the task as FAILURE
        raise
