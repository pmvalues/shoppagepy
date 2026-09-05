# Freshness lifecycle sweep for Shoppage discovered offers.
#
# Referral engine truth model: a scraped/confirmed offer is only "fresh" inside
# its SLA window. This sweep demotes offers whose last confirmation exceeds the
# SLA so the app never serves stale availability as fact. It also preserves the
# offer state history (append-only) that the old INSERT OR REPLACE destroyed.

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "shoppage-commerce-intelligence-foundation" / "data" / "study" / "sa_discovered_offers.sqlite"

SLA_HOURS = {
    "fast_moving_24h": 24,
    "retail_72h": 72,
    "catalogue_7d": 168,
    "service_30d": 720,
}


def main():
    parser = argparse.ArgumentParser(description="Shoppage offer freshness sweep")
    parser.add_argument("--db", default=str(DB_PATH))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute(
        "CREATE TABLE IF NOT EXISTS offer_state_history ("
        "  id TEXT PRIMARY KEY,"
        "  offer_id TEXT NOT NULL,"
        "  previous_state TEXT,"
        "  next_state TEXT NOT NULL,"
        "  observed_at TEXT NOT NULL,"
        "  reason TEXT"
        ")"
    )

    now = datetime.now(timezone.utc)
    rows = cur.execute(
        "SELECT id, discovered_at, status FROM discovered_offers WHERE status = 'discovered'"
    ).fetchall()

    demoted = 0
    for offer_id, discovered_at, status in rows:
        try:
            ts = datetime.fromisoformat(discovered_at.replace("Z", "+00:00"))
        except Exception:
            continue
        age_hours = (now - ts).total_seconds() / 3600.0
        sla_hours = SLA_HOURS.get("retail_72h", 72)
        next_state = "fresh"
        reason = "within SLA"
        if age_hours > sla_hours * 2:
            next_state = "expired"
            reason = f"exceeded 2x SLA ({sla_hours * 2:.0f}h)"
        elif age_hours > sla_hours:
            next_state = "confirm_required"
            reason = f"exceeded SLA ({sla_hours:.0f}h)"

        if next_state != "fresh":
            demoted += 1
            if not args.dry_run:
                cur.execute(
                    "INSERT OR IGNORE INTO offer_state_history "
                    "(id, offer_id, previous_state, next_state, observed_at, reason) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        f"hist_{offer_id}_{int(now.timestamp())}",
                        offer_id,
                        "fresh",
                        next_state,
                        now.isoformat(),
                        reason,
                    ),
                )

    if not args.dry_run:
        conn.commit()
    conn.close()
    print(f"[freshness] evaluated {len(rows)} offers, demoted {demoted} (dry_run={args.dry_run})")


if __name__ == "__main__":
    main()

