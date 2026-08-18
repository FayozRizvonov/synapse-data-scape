"""
Run depository — thin wrapper around supabase_client for mmm_runs CRUD.
Used by both the Celery worker and the FastAPI status endpoint.
"""
from datetime import datetime, timezone
from typing import Dict, Optional

from src.database import supabase_client as db


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_run(project_id: str, dataset_info: Optional[Dict] = None) -> Optional[str]:
    """Create a queued run entry.  Returns job_id (UUID) or None if DB unavailable."""
    return db.create_run(project_id, dataset_info)


def mark_running(job_id: str) -> None:
    db.update_run(job_id, status="running", started_at=now_iso())


def mark_done(job_id: str, stability_level: int, model_id: Optional[str]) -> None:
    db.update_run(
        job_id,
        status="done",
        finished_at=now_iso(),
        stability_level=stability_level,
        model_id=model_id,
    )


def mark_failed(job_id: str, error_message: str) -> None:
    db.update_run(
        job_id,
        status="failed",
        finished_at=now_iso(),
        error_message=str(error_message)[:2000],
    )


def get_run(job_id: str) -> Optional[Dict]:
    """Return the mmm_runs row for this job, or None."""
    return db.get_run(job_id)
