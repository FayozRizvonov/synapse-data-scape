"""
Celery application for the mmm_claire async pipeline.

Broker + result backend: Redis
  Set REDIS_URL env var (default: redis://localhost:6379/0)

Start a worker:
  cd mmm_claire
  celery -A src.workers.celery_app worker --loglevel=info --pool=solo

Use --pool=solo (or --pool=threads).  The default *prefork* pool runs tasks in
daemonic processes, which may not spawn children, so PyMC's parallel chains die
with "daemonic processes are not allowed to have children".  Under prefork,
sample_model falls back to cores=1 and each run is ~4x slower.

The pool is intentionally single-task because each PyMC5 run is CPU/memory heavy.
"""
import os
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "mmm_claire",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["src.workers.model_worker", "src.workers.scheduler"],
)

# Watch datasets for changes and retrain when they move. The schedule is registered
# unconditionally, but it only does anything when a beat process is running AND
# MMM_WATCH_PROJECTS lists something — so a plain worker is unaffected:
#   celery -A src.workers.celery_app beat --loglevel=info
_WATCH_INTERVAL = float(os.environ.get("MMM_WATCH_INTERVAL_SECONDS", "900"))

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Keep results for 24 h so the API can poll status
    result_expires=86400,
    # Long timeout — PyMC5 sampling can take 10-30 min
    task_soft_time_limit=3600,   # 60 min soft limit → raises SoftTimeLimitExceeded
    task_time_limit=4200,        # 70 min hard kill
    worker_prefetch_multiplier=1,
    task_acks_late=True,         # ack only after task completes (safe re-queue on crash)
    beat_schedule={
        "watch-datasets": {
            "task": "mmm_claire.workers.scheduler.check_datasets",
            "schedule": _WATCH_INTERVAL,
            # A check that has been waiting longer than the interval is stale — the next
            # one will see the same state, so running both achieves nothing.
            "options": {"expires": _WATCH_INTERVAL},
        }
    },
)
