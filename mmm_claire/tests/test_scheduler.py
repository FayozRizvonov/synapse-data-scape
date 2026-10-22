import pytest

from src.workers import scheduler as s

PROJECT = "550e8400-e29b-41d4-a716-446655440000"


# ---------------------------------------------------------------------------
# a fake world: no Supabase, no Redis, no Celery
# ---------------------------------------------------------------------------

UNREADABLE = object()  # distinct from "not specified", which means "use the default"


class World:
    """Everything check_project touches, so the decision logic can be tested alone."""

    def __init__(self, files=None, store=None, active=False, create_ok=True):
        if files is UNREADABLE:
            self.files = None
        elif files is None:
            self.files = {"data.csv": "aaa", "info.csv": "bbb"}
        else:
            self.files = files
        self.store = dict(store or {})
        self.active = active
        self.create_ok = create_ok
        self.created = []
        self.enqueued = []

    def install(self, monkeypatch):
        monkeypatch.setattr(
            s, "dataset_fingerprint",
            lambda pid: None if self.files is None else {
                "fingerprint": "fp:" + ",".join(f"{k}={v}" for k, v in sorted(self.files.items())),
                "files": dict(self.files),
            },
        )
        monkeypatch.setattr(s, "get_known_fingerprint", lambda pid: self.store.get(pid))
        monkeypatch.setattr(
            s, "set_known_fingerprint",
            lambda pid, fp: (self.store.__setitem__(pid, fp), True)[1],
        )
        monkeypatch.setattr(s, "has_active_run", lambda pid: self.active)

        def create_run(project_id, dataset_info=None):
            if not self.create_ok:
                return None
            self.created.append((project_id, dataset_info))
            return f"job-{len(self.created)}"

        monkeypatch.setattr(s.run_repo, "create_run", create_run)

        class Task:
            @staticmethod
            def apply_async(args=None, task_id=None):
                self.enqueued.append((args, task_id))

        monkeypatch.setattr(s, "run_mmm_pipeline_task", Task)
        return self


# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------

def test_watching_is_off_by_default(monkeypatch):
    monkeypatch.delenv("MMM_WATCH_PROJECTS", raising=False)
    assert s.watched_projects() == []


def test_empty_watch_list_does_nothing(monkeypatch):
    monkeypatch.setenv("MMM_WATCH_PROJECTS", "   ")
    assert s.check_datasets() == {"watched": 0, "results": []}


def test_watch_list_is_parsed_and_trimmed(monkeypatch):
    monkeypatch.setenv("MMM_WATCH_PROJECTS", f" {PROJECT} , other ,, ")
    assert s.watched_projects() == [PROJECT, "other"]


def test_bad_interval_falls_back(monkeypatch):
    monkeypatch.setenv("MMM_WATCH_INTERVAL_SECONDS", "not-a-number")
    assert s.watch_interval_seconds() == 900.0


# ---------------------------------------------------------------------------
# the decision
# ---------------------------------------------------------------------------

def test_first_sight_records_a_baseline_and_enqueues_nothing(monkeypatch):
    """Turning the watcher on must not retrain everything it can see."""
    w = World().install(monkeypatch)
    r = s.check_project(PROJECT)

    assert r["action"] == "baseline_recorded"
    assert w.enqueued == [] and w.created == []
    assert PROJECT in w.store


def test_unchanged_data_does_nothing(monkeypatch):
    w = World().install(monkeypatch)
    s.check_project(PROJECT)          # baseline
    r = s.check_project(PROJECT)

    assert r["action"] == "unchanged"
    assert w.enqueued == []


def test_changed_data_enqueues_once(monkeypatch):
    w = World().install(monkeypatch)
    s.check_project(PROJECT)
    w.files["data.csv"] = "CHANGED"

    r = s.check_project(PROJECT)
    assert r["action"] == "enqueued"
    assert len(w.enqueued) == 1

    args, task_id = w.enqueued[0]
    assert args[1] == PROJECT and args[0] == task_id, "job id must be the celery task id"

    # the run records why it fired and against what data
    _, info = w.created[0]
    assert info["trigger"] == "dataset_changed"
    assert info["files"]["data.csv"] == "CHANGED"


def test_it_does_not_fire_twice_for_one_change(monkeypatch):
    w = World().install(monkeypatch)
    s.check_project(PROJECT)
    w.files["data.csv"] = "CHANGED"
    s.check_project(PROJECT)
    r = s.check_project(PROJECT)

    assert r["action"] == "unchanged"
    assert len(w.enqueued) == 1


def test_a_change_during_a_run_is_deferred_and_retried(monkeypatch):
    """
    The fingerprint must NOT advance while deferring, or the change is forgotten the
    moment the in-flight run finishes.
    """
    w = World().install(monkeypatch)
    s.check_project(PROJECT)
    before = w.store[PROJECT]

    w.files["data.csv"] = "CHANGED"
    w.active = True
    r = s.check_project(PROJECT)

    assert r["action"] == "deferred"
    assert w.enqueued == []
    assert w.store[PROJECT] == before, "a deferred change must stay pending"

    # once the run finishes, the next poll picks it up
    w.active = False
    assert s.check_project(PROJECT)["action"] == "enqueued"
    assert len(w.enqueued) == 1


def test_unreadable_dataset_is_not_treated_as_unchanged(monkeypatch):
    w = World(files=UNREADABLE).install(monkeypatch)
    r = s.check_project(PROJECT)

    assert r["action"] == "skipped"
    assert w.enqueued == []
    assert PROJECT not in w.store, "a failed read must not become the baseline"


def test_fingerprint_not_advanced_when_the_run_record_fails(monkeypatch):
    """If the work never got queued, the change must still be pending."""
    w = World(create_ok=False).install(monkeypatch)
    s.check_project(PROJECT)
    before = w.store[PROJECT]

    w.files["data.csv"] = "CHANGED"
    r = s.check_project(PROJECT)

    assert r["action"] == "failed"
    assert w.enqueued == []
    assert w.store[PROJECT] == before


def test_one_project_failing_does_not_stop_the_others(monkeypatch):
    monkeypatch.setenv("MMM_WATCH_PROJECTS", "good,bad")
    calls = []

    def flaky(project_id):
        calls.append(project_id)
        if project_id == "bad":
            raise RuntimeError("boom")
        return {"fingerprint": "x", "files": {}}

    monkeypatch.setattr(s, "dataset_fingerprint", flaky)
    monkeypatch.setattr(s, "get_known_fingerprint", lambda pid: "x")

    out = s.check_datasets()
    assert calls == ["good", "bad"]
    assert out["watched"] == 2
    assert [r["action"] for r in out["results"]] == ["unchanged", "failed"]


# ---------------------------------------------------------------------------
# fingerprint construction
# ---------------------------------------------------------------------------

def test_fingerprint_depends_on_content_not_ordering(monkeypatch):
    def entries(order):
        return [
            {"name": n, "metadata": {"eTag": f'"{e}"'}}
            for n, e in order
        ]

    class Storage:
        def __init__(self, order): self.order = order
        def from_(self, bucket): return self
        def list(self, path): return entries(self.order)

    class Client:
        def __init__(self, order): self.storage = Storage(order)

    a = [("data.csv", "1"), ("info.csv", "2")]
    b = [("info.csv", "2"), ("data.csv", "1")]

    monkeypatch.setattr(s.db, "_get_client", lambda: Client(a))
    fp_a = s.dataset_fingerprint(PROJECT)
    monkeypatch.setattr(s.db, "_get_client", lambda: Client(b))
    fp_b = s.dataset_fingerprint(PROJECT)

    assert fp_a["fingerprint"] == fp_b["fingerprint"]

    monkeypatch.setattr(s.db, "_get_client", lambda: Client([("data.csv", "9"), ("info.csv", "2")]))
    assert s.dataset_fingerprint(PROJECT)["fingerprint"] != fp_a["fingerprint"]


def test_fingerprint_is_none_when_the_folder_is_empty(monkeypatch):
    class Storage:
        def from_(self, bucket): return self
        def list(self, path): return []

    class Client:
        storage = Storage()

    monkeypatch.setattr(s.db, "_get_client", lambda: Client())
    assert s.dataset_fingerprint(PROJECT) is None


def test_has_active_run_is_true_when_the_check_fails(monkeypatch):
    """Refusing to enqueue is the safe failure; two PyMC5 runs on one box is not."""
    def boom():
        raise RuntimeError("db down")

    monkeypatch.setattr(s.db, "_get_client", boom)
    assert s.has_active_run(PROJECT) is True
