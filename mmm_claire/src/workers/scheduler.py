"""
Automatic retraining, triggered by the data rather than by the clock.

Nothing has ever started a training run on its own — every model in the database exists
because a person asked for it. This closes that gap.

It deliberately does **not** retrain on a schedule. A nightly retrain of an unchanged
dataset burns 10-30 minutes of MCMC to produce the model you already had, and buries the
runs that mattered among hundreds that did not. What actually warrants a new model is new
data, so this watches for that instead: it polls each watched project's dataset
fingerprint and enqueues training only when it moves.

Fingerprinting costs one Storage `list()` call per project and no downloads, because
Supabase exposes each object's eTag, which is the md5 of its contents (verified against
`download()` for all three dataset files). Polling every few minutes is therefore cheap.

Safety, in the order it matters:

* **Off unless asked.** `MMM_WATCH_PROJECTS` is empty by default, and an empty watch list
  means this does nothing at all. The client demo cannot be retrained by accident.
* **First sight records a baseline and enqueues nothing.** Turning the watcher on must not
  immediately retrain every project it can see; it learns the current state and fires on
  the *next* change.
* **Never two runs at once for a project.** A change arriving while a run is in flight is
  noted and left for the next poll.
* **One project's failure does not stop the others.**
"""

from __future__ import annotations

import hashlib
import os
from typing import Dict, List, Optional

from src.database import run_depository as run_repo
from src.database import supabase_client as db
from src.logger import get_logger
from src.workers.celery_app import celery_app
from src.workers.model_worker import run_mmm_pipeline_task

logger = get_logger(__name__)

BUCKET = "rawdata"
FINGERPRINT_KEY = "mmm:dataset-fingerprint:{project_id}"

# Statuses that mean "this project already has work in flight".
ACTIVE_STATUSES = ("queued", "running")


# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------

def watched_projects() -> List[str]:
    """
    Projects to watch, from MMM_WATCH_PROJECTS (comma-separated uuids).

    Empty by default. An empty list disables the watcher entirely rather than defaulting
    to "everything", because the obvious default here is also the one that retrains a
    client demo at 3am.
    """
    raw = os.environ.get("MMM_WATCH_PROJECTS", "")
    return [p.strip() for p in raw.split(",") if p.strip()]


def watch_interval_seconds() -> float:
    try:
        return float(os.environ.get("MMM_WATCH_INTERVAL_SECONDS", "900"))
    except ValueError:
        logger.warning("MMM_WATCH_INTERVAL_SECONDS is not a number; using 900")
        return 900.0


# ---------------------------------------------------------------------------
# fingerprinting
# ---------------------------------------------------------------------------

def dataset_fingerprint(project_id: str) -> Optional[Dict]:
    """
    A content fingerprint of a project's dataset, from Storage metadata alone.

    Returns ``{"fingerprint": sha256, "files": {name: etag}}``, or None if the dataset
    cannot be listed — which is not the same as "unchanged" and must not be treated as it.
    """
    try:
        client = db._get_client()
        if client is None:
            logger.warning("No Supabase client; cannot fingerprint datasets")
            return None

        entries = client.storage.from_(BUCKET).list(f"mmm/{project_id}")
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"[{project_id}] could not list dataset: {exc}")
        return None

    files: Dict[str, str] = {}
    for entry in entries or []:
        name = entry.get("name")
        meta = entry.get("metadata") or {}
        etag = (meta.get("eTag") or "").strip('"')
        if not name or not etag:
            continue
        files[name] = etag

    if not files:
        logger.warning(f"[{project_id}] dataset folder is empty or unreadable")
        return None

    digest = hashlib.sha256(
        "\n".join(f"{n}:{files[n]}" for n in sorted(files)).encode()
    ).hexdigest()

    return {"fingerprint": digest, "files": files}


# ---------------------------------------------------------------------------
# state (Redis — this is scheduling state, not business data)
# ---------------------------------------------------------------------------

def _redis():
    """The Celery broker connection, reused so this needs no extra configuration."""
    return celery_app.broker_connection().default_channel.client


def get_known_fingerprint(project_id: str) -> Optional[str]:
    try:
        value = _redis().get(FINGERPRINT_KEY.format(project_id=project_id))
        return value.decode() if isinstance(value, bytes) else value
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"[{project_id}] could not read stored fingerprint: {exc}")
        return None


def set_known_fingerprint(project_id: str, fingerprint: str) -> bool:
    try:
        _redis().set(FINGERPRINT_KEY.format(project_id=project_id), fingerprint)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"[{project_id}] could not store fingerprint: {exc}")
        return False


# ---------------------------------------------------------------------------
# in-flight detection
# ---------------------------------------------------------------------------

def has_active_run(project_id: str) -> bool:
    """
    True if a run for this project is queued or running.

    On error this answers True — refusing to enqueue is the safe failure. Guessing False
    because a status query failed is how you end up with two PyMC5 runs on one machine.
    """
    try:
        client = db._get_client()
        if client is None:
            return True

        rows = (
            client.table("mmm_runs")
            .select("id,status")
            .eq("project_id", project_id)
            .in_("status", list(ACTIVE_STATUSES))
            .limit(1)
            .execute()
        ).data
        return bool(rows)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            f"[{project_id}] could not check for active runs ({exc}); "
            "assuming one is active and not enqueueing"
        )
        return True


# ---------------------------------------------------------------------------
# the task
# ---------------------------------------------------------------------------

def check_project(project_id: str) -> Dict:
    """Check one project and enqueue training if its data changed. Never raises."""
    try:
        current = dataset_fingerprint(project_id)
        if current is None:
            return {"project_id": project_id, "action": "skipped",
                    "reason": "dataset could not be fingerprinted"}

        digest = current["fingerprint"]
        known = get_known_fingerprint(project_id)

        if known is None:
            set_known_fingerprint(project_id, digest)
            logger.info(
                f"[{project_id}] baseline recorded ({digest[:12]}…); "
                "training will be enqueued on the next change"
            )
            return {"project_id": project_id, "action": "baseline_recorded",
                    "fingerprint": digest}

        if known == digest:
            return {"project_id": project_id, "action": "unchanged",
                    "fingerprint": digest}

        if has_active_run(project_id):
            logger.info(
                f"[{project_id}] data changed but a run is already in flight; "
                "leaving it for the next poll"
            )
            return {"project_id": project_id, "action": "deferred",
                    "reason": "a run is already queued or running"}

        job_id = run_repo.create_run(
            project_id=project_id,
            dataset_info={"fingerprint": digest, "files": current["files"],
                          "trigger": "dataset_changed"},
        )
        if job_id is None:
            logger.error(f"[{project_id}] data changed but the run record could not be created")
            return {"project_id": project_id, "action": "failed",
                    "reason": "could not create run record"}

        run_mmm_pipeline_task.apply_async(args=[job_id, project_id], task_id=job_id)

        # Only once the work is actually queued — otherwise a failure here would be
        # remembered as "handled" and the change would never be retried.
        set_known_fingerprint(project_id, digest)

        logger.info(
            f"[{project_id}] data changed ({(known or '')[:12]}… -> {digest[:12]}…); "
            f"training enqueued as job {job_id}"
        )
        return {"project_id": project_id, "action": "enqueued", "job_id": job_id,
                "fingerprint": digest}

    except Exception as exc:  # noqa: BLE001 - one project must not stop the rest
        logger.exception(f"[{project_id}] watcher failed")
        return {"project_id": project_id, "action": "failed", "reason": str(exc)}


@celery_app.task(name="mmm_claire.workers.scheduler.check_datasets")
def check_datasets() -> Dict:
    """
    Poll every watched project. Enqueues training for those whose data has changed.

    Scheduled by Celery beat; also safe to call by hand.
    """
    projects = watched_projects()
    if not projects:
        logger.debug("Dataset watcher: MMM_WATCH_PROJECTS is empty; nothing to do")
        return {"watched": 0, "results": []}

    logger.info(f"Dataset watcher: checking {len(projects)} project(s)")
    results = [check_project(p) for p in projects]

    enqueued = [r for r in results if r["action"] == "enqueued"]
    if enqueued:
        logger.info(
            "Dataset watcher: enqueued "
            + ", ".join(f"{r['project_id']} ({r['job_id']})" for r in enqueued)
        )

    return {"watched": len(projects), "results": results}
