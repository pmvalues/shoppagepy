#!/usr/bin/env python3
"""
Shoppage Autonomous Continuous Scouting & Ingestion Daemon
=============================================================================
Continuously scouts, scrapes, normalizes, and indexes:
  1. Guzzle Retail Circulars & Deals Hotspots (Live specials with direct URLs)
  2. Vendor Publisher Sitemaps (Takealot, Clicks, Builders Warehouse 100k+ SKUs)
  3. Discovered Offers & Live Market Prices (National retail chain pricing)
  4. Physical Merchants & Shopping Centre Linkages (3,296 malls + store mapping)
  5. Search Index Optimization & Typesense Sync (FTS5 + Typesense 26.0)

Usage:
  python shoppage_scouting_daemon.py --run-once
  python shoppage_scouting_daemon.py --daemon --interval-minutes 360
  python shoppage_scouting_daemon.py --job guzzle
=============================================================================
"""

import argparse
import datetime
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Fix Windows console UTF-8 encoding
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "shoppage-commerce-intelligence-foundation" / "data" / "study"
HISTORY_FILE = DATA_DIR / "scouting_history.json"
PYTHON_BIN = sys.executable

JOBS = [
    {
        "id": "guzzle",
        "name": "Guzzle Specials Harvester & Direct URL Resolver",
        "script": ROOT / "scripts" / "scrapers" / "shoppage_scrape_guzzle_specials.py",
        "args": ["--max-catalogues", "35"],
        "category": "circular_specials",
        "interval_hours": 6,
    },
    {
        "id": "sitemaps",
        "name": "Vendor Sitemaps Harvester (Takealot, Clicks, Builders)",
        "script": ROOT / "scripts" / "scrapers" / "shoppage_harvest_vendor_sitemaps.py",
        "args": ["--retailer", "all"],
        "category": "vendor_sitemaps",
        "interval_hours": 24,
    },
    {
        "id": "offers",
        "name": "Discovered Retail Offers & Price Sweeper",
        "script": ROOT / "scripts" / "scrapers" / "shoppage_sweep_all_discovered_offers.py",
        "args": [],
        "category": "price_monitoring",
        "interval_hours": 12,
    },
    {
        "id": "markets",
        "name": "Merchant & Shopping Centre Precinct Linker",
        "script": ROOT / "scripts" / "ingestion" / "shoppage_link_all_merchants_to_markets.py",
        "args": [],
        "category": "mall_linkage",
        "interval_hours": 48,
    },
    {
        "id": "index",
        "name": "SQLite FTS5 Optimization & Typesense Sync",
        "script": ROOT / "scripts" / "analytics" / "optimize_indexes.py",
        "args": [],
        "category": "search_optimization",
        "interval_hours": 24,
    },
]


def load_history():
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_history_entry(entry):
    history = load_history()
    history.append(entry)
    # Keep last 100 entries
    history = history[-100:]
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, default=str)


def run_job(job_config, fast_mode=False):
    job_id = job_config["id"]
    job_name = job_config["name"]
    script_path = job_config["script"]

    print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🚀 Executing Job: {job_name}")
    print(f"   Script: {script_path.name}")

    if not script_path.exists():
        print(f"   ⚠️ Script not found: {script_path}")
        return {"id": job_id, "status": "skipped", "error": "file_not_found"}

    cmd = [PYTHON_BIN, str(script_path)]
    if not fast_mode:
        cmd.extend(job_config.get("args", []))
    else:
        if job_id == "guzzle":
            cmd.extend(["--max-catalogues", "3"])

    start_time = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=1800,  # 30 min per job safety limit
            env=os.environ.copy(),
        )
        duration = round(time.time() - start_time, 2)
        success = proc.returncode == 0

        # Extract last few lines of stdout
        lines = [line.strip() for line in proc.stdout.split("\n") if line.strip()]
        snippet = " | ".join(lines[-3:]) if lines else "Done"

        print(f"   {'✓' if success else '✗'} Completed in {duration}s (Exit code: {proc.returncode})")
        if not success and proc.stderr:
            print(f"   ⚠️ Error output: {proc.stderr[:200]}...")

        entry = {
            "job_id": job_id,
            "job_name": job_name,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "duration_seconds": duration,
            "success": success,
            "snippet": snippet[:300],
        }
        save_history_entry(entry)
        return entry
    except subprocess.TimeoutExpired:
        duration = round(time.time() - start_time, 2)
        print(f"   ✗ Timeout after {duration}s")
        entry = {
            "job_id": job_id,
            "job_name": job_name,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "duration_seconds": duration,
            "success": False,
            "error": "timeout",
        }
        save_history_entry(entry)
        return entry
    except Exception as e:
        print(f"   ✗ Exception: {e}")
        return {"job_id": job_id, "success": False, "error": str(e)}


def run_cycle(selected_jobs=None, fast_mode=False):
    print("\n" + "=" * 80)
    print("🌐 STARTING AUTONOMOUS COMMERCE SCOUTING CYCLE")
    print(f"   Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Target DB: {DATA_DIR}")
    print("=" * 80)

    results = []
    for job in JOBS:
        if selected_jobs and job["id"] not in selected_jobs and "all" not in selected_jobs:
            continue
        res = run_job(job, fast_mode=fast_mode)
        results.append(res)

    print("\n" + "=" * 80)
    print("📊 SCOUTING CYCLE SUMMARY")
    print("=" * 80)
    for r in results:
        status_icon = "🟢" if r.get("success") else "🔴"
        print(f"  {status_icon} {r.get('job_id', 'job').upper()}: {r.get('job_name', '')} ({r.get('duration_seconds', 0)}s)")
    print("=" * 80 + "\n")
    return results


def main():
    parser = argparse.ArgumentParser(description="Shoppage Continuous Autonomous Scouting Daemon")
    parser.add_argument("--run-once", action="store_true", help="Run one complete scouting cycle and exit")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in the background on rolling timer")
    parser.add_argument("--fast", action="store_true", help="Run in quick verification mode with limited batch sizes")
    parser.add_argument("--job", type=str, default="all", help="Job filter: guzzle, sitemaps, offers, markets, index, or all")
    parser.add_argument("--interval-minutes", type=int, default=360, help="Interval between rolling passes (default: 360m / 6h)")

    args = parser.parse_args()
    selected = [args.job.lower()] if args.job != "all" else ["all"]

    if args.daemon:
        print("🤖 Shoppage Autonomous Scouting Daemon Started (Continuous Mode)")
        print(f"   Cycle Interval: Every {args.interval_minutes} minutes ({args.interval_minutes / 60:.1f} hours)")
        print("   Press Ctrl+C to terminate.")
        while True:
            try:
                run_cycle(selected_jobs=selected, fast_mode=args.fast)
                print(f"Sleeping for {args.interval_minutes} minutes until next scheduled sweep...")
                time.sleep(args.interval_minutes * 60)
            except KeyboardInterrupt:
                print("\n🛑 Daemon stopped by operator.")
                break
    else:
        run_cycle(selected_jobs=selected, fast_mode=args.fast)


if __name__ == "__main__":
    main()
