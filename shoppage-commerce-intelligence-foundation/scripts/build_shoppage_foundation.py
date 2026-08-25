from __future__ import annotations

import csv
import hashlib
import json
import urllib.request
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


OUT = Path(__file__).resolve().parents[1]
RAW = OUT / "raw"
REF = OUT / "data" / "reference"
SEED = OUT / "data" / "seed"

SOURCES = {
    "geonames_zw": "https://download.geonames.org/export/dump/ZW.zip",
    "geonames_admin1": "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
    "geonames_admin2": "https://download.geonames.org/export/dump/admin2Codes.txt",
    "isic_rev5": "https://unstats.un.org/unsd/classifications/Econ/Download/In%20Text/ISIC_Rev_5_english_structure.csv",
    "cpc_v3": "https://unstats.un.org/unsd/classifications/Econ/Download/In%20Text/CPC_Ver_3.0_Structure_30Jun2025.csv",
}

GEONAMES_COLUMNS = [
    "geonameid", "name", "asciiname", "alternatenames", "latitude", "longitude",
    "feature_class", "feature_code", "country_code", "cc2", "admin1_code",
    "admin2_code", "admin3_code", "admin4_code", "population", "elevation",
    "dem", "timezone", "modification_date",
]


def download(url: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size > 0:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "ShoppageCommerceGraph/0.1"})
    with urllib.request.urlopen(req, timeout=120) as response, path.open("wb") as target:
        target.write(response.read())


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_reference_csv(source: Path, destination: Path) -> int:
    destination.parent.mkdir(parents=True, exist_ok=True)
    raw = source.read_bytes()
    text = None
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise RuntimeError(f"Unable to decode {source}")
    lines = text.splitlines()
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return max(len(lines) - 1, 0)


def load_admin_names(path: Path, expected_prefix: str) -> dict[str, str]:
    result: dict[str, str] = {}
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2 and parts[0].startswith(expected_prefix):
                result[parts[0]] = parts[1]
    return result


def build_places(archive: Path, admin1_path: Path, admin2_path: Path) -> dict[str, object]:
    REF.mkdir(parents=True, exist_ok=True)
    SEED.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as bundle:
        name = next(item for item in bundle.namelist() if item.upper() == "ZW.TXT")
        rows = [line.decode("utf-8").rstrip("\n").split("\t") for line in bundle.open(name)]

    admin1 = load_admin_names(admin1_path, "ZW.")
    admin2 = load_admin_names(admin2_path, "ZW.")
    full_path = REF / "zimbabwe_places_geonames.csv"
    seed_path = SEED / "place_market_candidates.csv"

    feature_counts: Counter[str] = Counter()
    population_places = 0
    market_candidates = 0
    with full_path.open("w", newline="", encoding="utf-8") as full_handle, seed_path.open(
        "w", newline="", encoding="utf-8"
    ) as seed_handle:
        full_writer = csv.DictWriter(full_handle, fieldnames=GEONAMES_COLUMNS + ["admin1_name", "admin2_name", "source_url"])
        seed_fields = [
            "place_external_id", "name", "place_type_candidate", "feature_code", "latitude", "longitude",
            "admin1_name", "admin2_name", "population", "market_candidate_reason", "source_url",
        ]
        seed_writer = csv.DictWriter(seed_handle, fieldnames=seed_fields)
        full_writer.writeheader()
        seed_writer.writeheader()

        for parts in rows:
            if len(parts) < len(GEONAMES_COLUMNS):
                continue
            row = dict(zip(GEONAMES_COLUMNS, parts))
            row["admin1_name"] = admin1.get(f"ZW.{row['admin1_code']}", "")
            row["admin2_name"] = admin2.get(f"ZW.{row['admin1_code']}.{row['admin2_code']}", "")
            row["source_url"] = SOURCES["geonames_zw"]
            full_writer.writerow(row)
            feature_counts[f"{row['feature_class']}.{row['feature_code']}"] += 1

            population = int(row["population"] or 0)
            if row["feature_class"] == "P":
                population_places += 1
            is_candidate = (
                row["feature_class"] == "P"
                or row["feature_code"] in {"ADM1", "ADM2", "ADM3", "MALL", "MKT", "BLDG", "STRT", "AIRP", "RSTN"}
            )
            if not is_candidate:
                continue
            market_candidates += 1
            if row["feature_class"] == "P":
                place_type = "settlement"
                reason = "Populated place; validate its role as city, town, suburb, growth point or locality."
            elif row["feature_code"].startswith("ADM"):
                place_type = "administrative_area"
                reason = "Administrative unit; reconcile to ZIMSTAT boundary data before production use."
            else:
                place_type = "commercial_or_access_place"
                reason = "Potential commercial, landmark or access node; requires field/OSM/merchant confirmation."
            seed_writer.writerow({
                "place_external_id": f"geonames:{row['geonameid']}",
                "name": row["name"],
                "place_type_candidate": place_type,
                "feature_code": row["feature_code"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "admin1_name": row["admin1_name"],
                "admin2_name": row["admin2_name"],
                "population": population,
                "market_candidate_reason": reason,
                "source_url": SOURCES["geonames_zw"],
            })

    return {
        "geonames_rows": len(rows),
        "populated_place_rows": population_places,
        "place_market_candidates": market_candidates,
        "top_feature_codes": feature_counts.most_common(20),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    downloaded: dict[str, Path] = {}
    for name, url in SOURCES.items():
        suffix = ".zip" if url.endswith(".zip") else Path(url).suffix or ".txt"
        target = RAW / f"{name}{suffix}"
        download(url, target)
        downloaded[name] = target

    isic_rows = normalize_reference_csv(downloaded["isic_rev5"], REF / "isic_rev5.csv")
    cpc_rows = normalize_reference_csv(downloaded["cpc_v3"], REF / "cpc_v3.csv")
    place_metrics = build_places(downloaded["geonames_zw"], downloaded["geonames_admin1"], downloaded["geonames_admin2"])

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "foundation_seed_not_production_truth",
        "counts": {"isic_rows": isic_rows, "cpc_rows": cpc_rows, **place_metrics},
        "downloads": {
            key: {"url": SOURCES[key], "sha256": sha256(path), "bytes": path.stat().st_size}
            for key, path in downloaded.items()
        },
        "production_note": "ZIMSTAT administrative boundaries must control official hierarchy; GeoNames is a discovery seed requiring reconciliation.",
    }
    (OUT / "foundation_metrics.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
