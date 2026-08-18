"""
Dataset repository — uploads/downloads data.csv, info.csv, spend.csv
to/from Supabase Storage (bucket: rawdata).

Storage paths follow:  mmm/{project_id}/{filename}
"""
import os
from pathlib import Path
from typing import Optional, Tuple

from src.database import supabase_client as db

BUCKET = "rawdata"


def _storage_key(project_id: str, filename: str) -> str:
    return f"mmm/{project_id}/{filename}"


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

def upload_dataset(
    project_id: str,
    data_bytes: bytes,
    info_bytes: bytes,
    spend_bytes: Optional[bytes] = None,
) -> dict:
    """
    Upload data.csv and info.csv (and optionally spend.csv) to Supabase Storage.
    Returns a dict of storage keys that can be stored in mmm_runs.dataset_info.
    """
    keys: dict = {}

    data_key = _storage_key(project_id, "data.csv")
    info_key = _storage_key(project_id, "info.csv")

    ok_data = db.upload_file(BUCKET, data_key, data_bytes)
    ok_info = db.upload_file(BUCKET, info_key, info_bytes)

    if not (ok_data and ok_info):
        raise RuntimeError("Failed to upload data.csv or info.csv to Supabase Storage.")

    keys["data_key"] = data_key
    keys["info_key"] = info_key

    if spend_bytes is not None:
        spend_key = _storage_key(project_id, "spend.csv")
        db.upload_file(BUCKET, spend_key, spend_bytes)
        keys["spend_key"] = spend_key

    return keys


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def download_dataset(
    project_id: str,
    tmp_dir: str,
    dataset_info: Optional[dict] = None,
) -> Tuple[str, str, Optional[str]]:
    """
    Download the dataset files for a project to `tmp_dir`.

    Returns (data_path, info_path, spend_path | None).

    If `dataset_info` is provided (from mmm_runs.dataset_info), its keys
    override the default storage paths.
    """
    info = dataset_info or {}
    data_key   = info.get("data_key",  _storage_key(project_id, "data.csv"))
    info_key   = info.get("info_key",  _storage_key(project_id, "info.csv"))
    spend_key  = info.get("spend_key", None)

    data_bytes  = db.download_file(BUCKET, data_key)
    info_bytes  = db.download_file(BUCKET, info_key)

    if data_bytes is None or info_bytes is None:
        raise RuntimeError(
            f"Failed to download dataset for project {project_id} from Supabase Storage."
        )

    data_path = os.path.join(tmp_dir, "data.csv")
    info_path = os.path.join(tmp_dir, "info.csv")

    Path(data_path).write_bytes(data_bytes)
    Path(info_path).write_bytes(info_bytes)

    spend_path: Optional[str] = None
    if spend_key:
        spend_bytes = db.download_file(BUCKET, spend_key)
        if spend_bytes:
            spend_path = os.path.join(tmp_dir, "spend.csv")
            Path(spend_path).write_bytes(spend_bytes)

    return data_path, info_path, spend_path
