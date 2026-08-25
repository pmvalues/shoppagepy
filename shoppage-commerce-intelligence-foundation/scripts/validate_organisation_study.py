from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / "data" / "study" / "zimbabwe_organisation_activity_study.csv"
ISIC = ROOT / "data" / "reference" / "isic_rev5.csv"
OUTPUT = ROOT / "quality" / "organisation_study_validation.json"


def main() -> None:
    with STUDY.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    with ISIC.open(encoding="utf-8-sig", newline="") as handle:
        isic_codes = {row["ISIC Rev 5 Code"] for row in csv.DictReader(handle)}

    required = [
        "study_record_id", "source_family", "source_candidate_id", "name", "normalized_name",
        "source_activity", "source_url", "source_authority", "verification_state",
    ]
    missing_by_field = {
        field: sum(1 for row in rows if not row[field])
        for field in required
    }
    ids = [row["study_record_id"] for row in rows]
    source_ids = [row["source_candidate_id"] for row in rows]
    mapped = [row for row in rows if row["isic_rev5_code"]]
    invalid_codes = sorted({row["isic_rev5_code"] for row in mapped if row["isic_rev5_code"] not in isic_codes})
    normalized_names = {row["normalized_name"] for row in rows}
    forbidden_verified = [row["study_record_id"] for row in rows if row["verification_state"] == "verified"]

    checks = {
        "at_least_5000_study_records": len(rows) >= 5000,
        "at_least_5000_unique_normalized_names": len(normalized_names) >= 5000,
        "study_record_ids_unique": len(ids) == len(set(ids)),
        "source_candidate_ids_unique": len(source_ids) == len(set(source_ids)),
        "required_fields_complete": all(count == 0 for count in missing_by_field.values()),
        "all_isic_codes_exist_in_reference": not invalid_codes,
        "isic_mapping_rate_at_least_90_percent": len(mapped) / len(rows) >= 0.90,
        "no_candidate_is_falsely_marked_verified": not forbidden_verified,
        "all_rows_require_human_review": all(row["needs_human_review"] == "true" for row in rows),
    }
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "passed" if all(checks.values()) else "failed",
        "checks": checks,
        "evidence": {
            "study_records": len(rows),
            "unique_normalized_names": len(normalized_names),
            "isic_mapped_records": len(mapped),
            "isic_mapping_rate": round(len(mapped) / len(rows), 6),
            "source_counts": dict(Counter(row["source_family"] for row in rows)),
            "missing_required_fields": missing_by_field,
            "duplicate_study_ids": len(ids) - len(set(ids)),
            "duplicate_source_candidate_ids": len(source_ids) - len(set(source_ids)),
            "invalid_isic_codes": invalid_codes,
            "falsely_verified_records": forbidden_verified,
        },
        "interpretation": "Passing proves a 5,000-plus source-backed candidate study with activity evidence. It does not prove 5,000 legally verified, currently operating companies.",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    if result["status"] != "passed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
