from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
SEED = ROOT / "data" / "seed"
QUALITY = ROOT / "quality"
SOURCE_URL = "https://www.zera.co.zw/liquid-fuels-licensees/"
SOURCE_AS_OF = "2026-06-08"


def text(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return " ".join(str(value).replace("\u00a0", " ").split())


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    value = re.sub(r"\b(pvt|private|limited|ltd|plc|inc|company|co)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def activity(license_types: set[str]) -> tuple[str, str, str, str]:
    if any(item.startswith("PROD") for item in license_types):
        return "1920", "manufacture or blending of refined petroleum products", "petroleum_manufacturer", "0.90"
    if "WHOLESALE" in license_types or "PROCUREMENT" in license_types:
        return "4671", "wholesale or procurement of petroleum and fuel products", "petroleum_wholesaler_or_distributor", "0.88"
    return "4730", "retail sale of automotive fuel", "fuel_retailer", "0.92"


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    SEED.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "ShoppageCommerceGraph/0.2"})
    with urllib.request.urlopen(req, timeout=120) as response:
        html = response.read()
    raw_path = RAW / "zera_liquid_fuels_licensees_2026-06-08.html"
    raw_path.write_bytes(html)
    tables = pd.read_html(io.StringIO(html.decode("utf-8", errors="replace")))
    if len(tables) != 1:
        raise ValueError(f"Expected one ZERA licence table, found {len(tables)}")
    frame = tables[0].copy()
    expected_columns = ["Registered Name", "Trade Name", "Type of License", "License No.", "Surburb.", "Expiry Date"]
    if list(frame.columns) != expected_columns:
        raise ValueError(f"ZERA table schema changed: {list(frame.columns)}")
    frame = frame.dropna(how="all")
    rows: list[dict[str, str]] = []
    for source_index, item in frame.iterrows():
        registered = text(item["Registered Name"])
        license_number = text(item["License No."])
        if not registered or not license_number:
            continue
        rows.append({
            "license_record_id": f"zera:petroleum:{SOURCE_AS_OF}:{license_number}",
            "registered_name": registered,
            "normalized_registered_name": normalize_name(registered),
            "trade_name": text(item["Trade Name"]),
            "license_type": text(item["Type of License"]),
            "license_number": license_number,
            "suburb_or_location": text(item["Surburb."]),
            "expiry_date": text(item["Expiry Date"]),
            "source_url": SOURCE_URL,
            "source_as_of": SOURCE_AS_OF,
            "source_authority": "Zimbabwe Energy Regulatory Authority",
            "verification_state": "regulator_licensed_scope_only",
        })
    if len(rows) < 1000:
        raise ValueError(f"ZERA licence extraction unexpectedly small: {len(rows)} rows")
    license_ids = [row["license_record_id"] for row in rows]
    if len(license_ids) != len(set(license_ids)):
        raise ValueError("ZERA licence numbers are not unique at the extracted grain")

    licence_path = SEED / "zera_petroleum_license_rows.csv"
    with licence_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    grouped: defaultdict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        grouped[row["normalized_registered_name"]].append(row)
    organisations: list[dict[str, str]] = []
    for normalized, group in grouped.items():
        name_counts = Counter(row["registered_name"] for row in group)
        canonical = sorted(name_counts, key=lambda value: (-name_counts[value], -len(value), value))[0]
        aliases = sorted({row["registered_name"] for row in group} | {row["trade_name"] for row in group if row["trade_name"]})
        license_types = {row["license_type"] for row in group}
        code, summary, role, confidence = activity(license_types)
        organisations.append({
            "candidate_id": "zera:petroleum:org:" + hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:20],
            "name": canonical,
            "normalized_name": normalized,
            "aliases_and_trade_names": json.dumps(aliases, ensure_ascii=False),
            "license_types": "; ".join(sorted(license_types)),
            "license_count": str(len(group)),
            "license_numbers": "; ".join(sorted(row["license_number"] for row in group)),
            "locations": "; ".join(sorted({row["suburb_or_location"] for row in group if row["suburb_or_location"]})),
            "activity_description": summary,
            "shoppage_role_candidate": role,
            "isic_rev5_candidate": code,
            "isic_mapping_confidence": confidence,
            "source_url": SOURCE_URL,
            "source_as_of": SOURCE_AS_OF,
            "source_authority": "Zimbabwe Energy Regulatory Authority",
            "verification_state": "regulator_licensed_scope_only",
            "activity_mapping_state": "candidate_requires_entity_and_activity_review",
        })
    org_path = SEED / "zera_petroleum_organisation_candidates.csv"
    with org_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(organisations[0]))
        writer.writeheader()
        writer.writerows(sorted(organisations, key=lambda row: row["normalized_name"]))

    profile = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_as_of": SOURCE_AS_OF,
        "raw_html_sha256": hashlib.sha256(html).hexdigest(),
        "table_rows_before_blank_removal": int(len(tables[0])),
        "licence_rows": len(rows),
        "unique_licence_ids": len(set(license_ids)),
        "organisation_candidates": len(organisations),
        "unique_normalized_registered_names": len(grouped),
        "license_type_counts": dict(Counter(row["license_type"] for row in rows)),
        "missing_trade_name_rows": sum(not row["trade_name"] for row in rows),
        "missing_location_rows": sum(not row["suburb_or_location"] for row in rows),
        "missing_expiry_rows": sum(not row["expiry_date"] for row in rows),
        "quality_status": "regulator_licensed_scope_only_entity_resolution_and_current_operation_review_required",
    }
    (QUALITY / "zera_petroleum_licensees_profile.json").write_text(json.dumps(profile, indent=2), encoding="utf-8")
    print(json.dumps({"licence_output": str(licence_path), "organisation_output": str(org_path), **profile}, indent=2))


if __name__ == "__main__":
    main()
