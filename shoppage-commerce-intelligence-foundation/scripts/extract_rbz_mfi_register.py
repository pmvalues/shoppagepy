from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
SEED = ROOT / "data" / "seed"
QUALITY = ROOT / "quality"
SOURCE_URL = "https://www.rbz.co.zw/documents/bank_sup/Registered_Microfinance_/LIST_OF_REGISTERED_MICROFINANCE_INSTIUTIIONS_AS_AT_31_MARCH_2026.pdf"
SOURCE_DATE = "2026-03-31"

VERTICAL_LINES = [35.4, 69.4, 341.5, 551.5]

FIELDS = [
    "candidate_id", "register_section", "register_number", "name", "head_office_address",
    "activity_description", "isic_rev5_candidate", "source_url", "source_as_of",
    "source_authority", "verification_state", "activity_mapping_state", "source_document_sha256",
]


def clean(value: str | None) -> str:
    return " ".join((value or "").replace("\u00a0", " ").split())


def download(path: Path) -> None:
    if path.exists() and path.stat().st_size > 0:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "ShoppageCommerceGraph/0.2"})
    with urllib.request.urlopen(req, timeout=120) as response, path.open("wb") as handle:
        handle.write(response.read())


def append_text(base: str, addition: str) -> str:
    if not addition:
        return base
    return clean(f"{base} {addition}")


def parse(pdf_path: Path) -> tuple[list[dict[str, str]], dict]:
    records: list[dict[str, str]] = []

    with pdfplumber.open(pdf_path) as document:
        for page in document.pages:
            words = page.extract_words(x_tolerance=1, y_tolerance=3)
            number_words = [
                word for word in words
                if re.fullmatch(r"\d+", word["text"])
                and 35 <= word["x0"] and word["x1"] <= 70
            ]
            deposit_tops = [word["top"] for word in words if word["text"].upper() == "DEPOSIT"]
            deposit_top = min(deposit_tops) if deposit_tops else None
            vertical_edges = [
                edge for edge in page.edges
                if abs(edge["x0"] - edge["x1"]) < 0.2 and 30 < edge["x0"] < 40
            ]
            table_top = min((edge["top"] for edge in vertical_edges), default=98.06)
            number_column_lines = [
                edge["top"] for edge in page.edges
                if abs(edge["top"] - edge["bottom"]) < 0.2
                and edge["x0"] <= 36.5 and edge["x1"] >= 69
            ]
            boundaries = sorted(set([table_top] + number_column_lines))

            for word in sorted(number_words, key=lambda item: item["top"]):
                row_top = max(boundary for boundary in boundaries if boundary < word["top"])
                row_bottom = min(boundary for boundary in boundaries if boundary > word["bottom"])
                name = clean(page.crop((69.4, row_top, 341.5, row_bottom)).extract_text(x_tolerance=2, y_tolerance=3))
                address = clean(page.crop((341.5, row_top, 551.5, row_bottom)).extract_text(x_tolerance=2, y_tolerance=3))
                section = (
                    "deposit_taking_microfinance"
                    if deposit_top is not None and word["top"] > deposit_top
                    else "credit_only_microfinance"
                )
                records.append({
                    "register_section": section,
                    "register_number": word["text"],
                    "name": name,
                    "head_office_address": address,
                })

    credit = [row for row in records if row["register_section"] == "credit_only_microfinance"]
    deposit = [row for row in records if row["register_section"] == "deposit_taking_microfinance"]
    expected_credit = list(range(1, 333))
    expected_deposit = list(range(1, 8))
    credit_numbers = [int(row["register_number"]) for row in credit]
    deposit_numbers = [int(row["register_number"]) for row in deposit]
    if credit_numbers != expected_credit:
        missing = sorted(set(expected_credit) - set(credit_numbers))
        duplicates = sorted(number for number, count in Counter(credit_numbers).items() if count > 1)
        raise ValueError(f"Credit-only register sequence failed: missing={missing}, duplicates={duplicates}, rows={len(credit_numbers)}")
    if deposit_numbers != expected_deposit:
        raise ValueError(f"Deposit-taking register sequence failed: expected 1..7, got {deposit_numbers}")
    if any(not row["name"] for row in records):
        raise ValueError("At least one RBZ register row has a missing institution name")

    document_hash = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    for row in records:
        number = row["register_number"]
        section_code = "credit" if row["register_section"].startswith("credit") else "deposit"
        row.update({
            "candidate_id": f"rbz:mfi:{SOURCE_DATE}:{section_code}:{number}",
            "activity_description": "Registered microfinance institution",
            "isic_rev5_candidate": "6495 - Other credit granting activities",
            "source_url": SOURCE_URL,
            "source_as_of": SOURCE_DATE,
            "source_authority": "Reserve Bank of Zimbabwe",
            "verification_state": "regulator_listed_scope_only",
            "activity_mapping_state": "candidate_requires_isic_review",
            "source_document_sha256": document_hash,
        })

    names = [clean(row["name"]).lower() for row in records]
    profile = {
        "grain": "one numbered institution row in the RBZ register",
        "rows": len(records),
        "credit_only_rows": len(credit),
        "deposit_taking_rows": len(deposit),
        "unique_candidate_ids": len({row["candidate_id"] for row in records}),
        "unique_normalized_names": len(set(names)),
        "duplicate_normalized_names": [name for name, count in Counter(names).items() if count > 1],
        "missing_name_rows": sum(not row["name"] for row in records),
        "missing_address_rows": sum(not row["head_office_address"] for row in records),
        "source_pages": 20,
        "source_as_of": SOURCE_DATE,
        "source_document_sha256": document_hash,
        "quality_status": "regulator_listed_scope_only_not_trading_or_catalogue_verification",
    }
    return records, profile


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    SEED.mkdir(parents=True, exist_ok=True)
    QUALITY.mkdir(parents=True, exist_ok=True)
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else RAW / "rbz_registered_mfis_2026-03-31.pdf"
    download(pdf_path)
    records, profile = parse(pdf_path)
    output = SEED / "rbz_registered_mfi_candidates.csv"
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)
    profile["generated_at"] = datetime.now(timezone.utc).isoformat()
    (QUALITY / "rbz_registered_mfi_profile.json").write_text(json.dumps(profile, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(output), **profile}, indent=2))


if __name__ == "__main__":
    main()
