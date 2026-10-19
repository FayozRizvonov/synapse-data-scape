#!/usr/bin/env python
"""
Restore the demo model exactly as it was when snapshotted.

The dashboard reads the *newest* `mmm_model_outputs` row by `generated_at`, so a
later training run shadows the demo model rather than deleting it. This script puts
the snapshotted rows back and, with --shadow-check, tells you whether anything newer
is currently winning.

Usage:
    python scripts/restore-demo-model.py --check                 # read-only report
    python scripts/restore-demo-model.py --restore               # upsert rows back
    python scripts/restore-demo-model.py --check --snapshot F    # a specific file

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (service role: server-side
only, never a browser).
"""

import argparse
import glob
import json
import os
import sys

from dotenv import load_dotenv
from supabase import create_client


def newest_snapshot():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = sorted(glob.glob(os.path.join(here, "backups", "demo-model-*.json")))
    if not files:
        sys.exit("No snapshot found in backups/. Nothing to restore from.")
    return files[-1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", help="snapshot file (default: newest in backups/)")
    ap.add_argument("--check", action="store_true", help="report only, change nothing")
    ap.add_argument("--restore", action="store_true", help="upsert the rows back")
    args = ap.parse_args()

    if not (args.check or args.restore):
        ap.error("pass --check or --restore")

    path = args.snapshot or newest_snapshot()
    snap = json.load(open(path))
    project_id, model_id = snap["project_id"], snap["model_id"]

    print(f"snapshot : {os.path.relpath(path)}")
    print(f"captured : {snap['captured_at'][:19]}")
    print(f"project  : {project_id}")
    print(f"model    : {model_id}")

    fm = [o for o in snap["mmm_model_outputs"] if o["output_type"] == "fit_metrics"]
    if fm:
        print(f"fit      : {fm[0]['output_data']}")

    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        sys.exit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env")
    sb = create_client(url, key)

    # --- what is the dashboard showing right now? ---
    live = (
        sb.from_("mmm_model_outputs")
        .select("model_id, generated_at")
        .eq("project_id", project_id)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
        .data
    )

    print("\n--- current state ---")
    if not live:
        print("  dashboard would show: NOTHING (no outputs rows for this project)")
    else:
        shown, when = live[0]["model_id"], live[0]["generated_at"][:19]
        if shown == model_id:
            print(f"  dashboard shows the snapshotted demo model ({when})  OK")
        else:
            print(f"  dashboard shows {shown} ({when})")
            print(f"  the demo model {model_id} is SHADOWED by a newer run.")
            print("  Restoring re-upserts the demo rows but does NOT delete the newer")
            print("  ones — they would still be newer. Delete them, or approve-pin the")
            print("  demo model, to put it back on screen.")

    present = (
        sb.from_("mmm_model_outputs")
        .select("output_type")
        .eq("project_id", project_id)
        .eq("model_id", model_id)
        .execute()
        .data
    )
    have = {r["output_type"] for r in present}
    want = {o["output_type"] for o in snap["mmm_model_outputs"]}
    print(f"  demo model rows in DB: {len(have)}/{len(want)}")
    if want - have:
        print(f"  MISSING: {sorted(want - have)}")

    if args.check:
        print("\n(--check: nothing was changed)")
        return

    # --- restore ---
    print("\n--- restoring ---")
    for row in snap["mmm_models"]:
        sb.from_("mmm_models").upsert(row).execute()
    print(f"  mmm_models        : {len(snap['mmm_models'])} row(s) upserted")

    for row in snap["mmm_model_outputs"]:
        sb.from_("mmm_model_outputs").upsert(row).execute()
    print(f"  mmm_model_outputs : {len(snap['mmm_model_outputs'])} row(s) upserted")

    after = (
        sb.from_("mmm_model_outputs")
        .select("output_type")
        .eq("project_id", project_id)
        .eq("model_id", model_id)
        .execute()
        .data
    )
    got = {r["output_type"] for r in after}
    if got >= want:
        print(f"\nverified: all {len(want)} output types present.")
    else:
        sys.exit(f"\nFAILED: still missing {sorted(want - got)}")


if __name__ == "__main__":
    main()
