"""
Supabase client for the mmm_claire pipeline.

Reads credentials from environment variables:
  SUPABASE_URL              — project URL
  SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS for worker writes)

All public methods are safe to call even when Supabase is unavailable
(they log a warning and return None/False rather than raising).
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or url == "YOUR_URL":
        logger.warning("Supabase credentials not set — DB integration disabled.")
        return None
    try:
        from supabase import create_client
        _client = create_client(url, key)
        logger.info("Supabase client initialised.")
        return _client
    except Exception as exc:
        logger.warning(f"Failed to create Supabase client: {exc}")
        return None


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------

def upload_file(bucket: str, storage_path: str, file_bytes: bytes,
                content_type: str = "text/csv") -> bool:
    """Upload bytes to Supabase Storage.  Returns True on success."""
    sb = _get_client()
    if sb is None:
        return False
    try:
        sb.storage.from_(bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return True
    except Exception as exc:
        logger.warning(f"upload_file({storage_path}): {exc}")
        return False


def download_file(bucket: str, storage_path: str) -> Optional[bytes]:
    """Download bytes from Supabase Storage.  Returns None on failure."""
    sb = _get_client()
    if sb is None:
        return None
    try:
        return sb.storage.from_(bucket).download(storage_path)
    except Exception as exc:
        logger.warning(f"download_file({storage_path}): {exc}")
        return None


# ---------------------------------------------------------------------------
# mmm_runs table helpers
# ---------------------------------------------------------------------------

def create_run(project_id: str, dataset_info: Optional[Dict] = None) -> Optional[str]:
    """Insert a new queued run and return its UUID."""
    sb = _get_client()
    if sb is None:
        return None
    try:
        row = {"project_id": str(project_id), "status": "queued"}
        if dataset_info:
            row["dataset_info"] = json.dumps(dataset_info)
        result = sb.table("mmm_runs").insert(row).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as exc:
        logger.warning(f"create_run: {exc}")
        return None


def update_run(job_id: str, **fields) -> bool:
    """Update arbitrary fields on an mmm_runs row."""
    sb = _get_client()
    if sb is None:
        return False
    try:
        sb.table("mmm_runs").update(fields).eq("id", job_id).execute()
        return True
    except Exception as exc:
        logger.warning(f"update_run({job_id}): {exc}")
        return False


def get_run(job_id: str) -> Optional[Dict]:
    """Fetch a single mmm_runs row by id."""
    sb = _get_client()
    if sb is None:
        return None
    try:
        result = sb.table("mmm_runs").select("*").eq("id", job_id).single().execute()
        return result.data
    except Exception as exc:
        logger.warning(f"get_run({job_id}): {exc}")
        return None


# ---------------------------------------------------------------------------
# mmm_models table helpers
# ---------------------------------------------------------------------------

def save_model_record(project_id: str, job_id: str, stability_level: int,
                      fit_metrics: Dict) -> Optional[str]:
    """Insert a row into mmm_models and return its UUID."""
    sb = _get_client()
    if sb is None:
        return None
    try:
        now = datetime.now(timezone.utc).isoformat()
        row = {
            "project_id":      int(project_id) if str(project_id).isdigit() else 0,
            "model_name":      f"PyMC5_MMM_{project_id}_{now[:10]}",
            "model_type":      "PYMC5",
            "model_version":   "2.0.0",
            "model_config":    json.dumps({"stability_level": stability_level}),
            "model_metrics":   json.dumps(fit_metrics),
            "detected_channels": json.dumps([]),
            "is_approved":     False,
            "training_date":   now,
        }
        result = sb.table("mmm_models").insert(row).execute()
        model_id = result.data[0]["id"] if result.data else None
        return model_id
    except Exception as exc:
        logger.warning(f"save_model_record: {exc}")
        return None


# ---------------------------------------------------------------------------
# mmm_model_outputs table helpers
# ---------------------------------------------------------------------------

def save_model_outputs(model_id: Optional[str], project_id: str,
                       outputs: Dict[str, Any]) -> bool:
    """
    Persist all pipeline output DataFrames to mmm_model_outputs.

    Each key in `outputs` (e.g. 'roi', 'coefficients') becomes one row
    with output_type=key and output_data=records list.

    Also writes a legacy 'outputs' summary row for frontend compatibility.
    """
    sb = _get_client()
    if sb is None:
        return False

    pid_int = int(project_id) if str(project_id).isdigit() else 0
    rows = []

    for output_type, df in outputs.items():
        if df is None:
            continue
        if hasattr(df, "to_dict"):
            data = df.to_dict(orient="records")
        else:
            data = df  # already a dict (fit_metrics)
        rows.append({
            "model_id":    model_id,
            "project_id":  pid_int,
            "output_type": output_type,
            "output_data": json.dumps(_make_serialisable(data)),
        })

    # Legacy summary row consumed by the frontend usePharmaMetrics hook
    fit = outputs.get("fit_metrics") or {}
    roi_df = outputs.get("roi")
    roi_summary: Dict[str, float] = {}
    if roi_df is not None and hasattr(roi_df, "itertuples"):
        for r in roi_df.itertuples():
            roi_summary[r.media] = float(r.roi_mean)
    rows.append({
        "model_id":    model_id,
        "project_id":  pid_int,
        "output_type": "outputs",
        "output_data": json.dumps({
            "model_metrics": {
                "r_squared": fit.get("r2", 0.0),
                "mape":      fit.get("mape", 0.0),
                "rmse":      fit.get("rmse", 0.0),
            },
            "roi": roi_summary,
        }),
    })

    try:
        sb.table("mmm_model_outputs").insert(rows).execute()
        return True
    except Exception as exc:
        logger.warning(f"save_model_outputs: {exc}")
        return False


def _make_serialisable(obj: Any) -> Any:
    """Recursively convert numpy/pandas types to plain Python."""
    import numpy as np
    if isinstance(obj, dict):
        return {k: _make_serialisable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_serialisable(i) for i in obj]
    if isinstance(obj, float) and (obj != obj):   # NaN
        return None
    if hasattr(obj, "item"):                       # numpy scalar
        return obj.item()
    if hasattr(obj, "tolist"):                     # numpy array
        return obj.tolist()
    return obj
