"""GS1 / marketplace identifier validation.

Publishing a barcode that fails its own check digit is worse than publishing no
barcode: search engines and feeds treat it as a "invalid identifier" defect, so
every outbound surface must gate identifiers through here.
"""
from __future__ import annotations

GTIN_LENGTHS = (8, 12, 13, 14)
SCHEMA_FIELD_BY_LENGTH = {8: 'gtin8', 12: 'gtin12', 13: 'gtin13', 14: 'gtin14'}


def clean_gtin(value: object) -> str | None:
    if value is None:
        return None
    digits = ''.join(ch for ch in str(value) if ch.isdigit())
    if not digits:
        return None
    if len(digits) == 14:
        return digits
    if len(digits) == 13:
        return digits
    if len(digits) == 12:
        return digits
    if len(digits) == 8:
        return digits
    if len(digits) == 11:
        return digits.zfill(12)
    return None


def has_valid_check_digit(digits: str) -> bool:
    if not digits.isdigit() or len(digits) not in GTIN_LENGTHS:
        return False
    body = digits.zfill(14)[-13:] if len(digits) == 14 else digits
    total = sum(int(d) * (3 if i % 2 else 1) for i, d in enumerate(body[:-1]))
    return (10 - total % 10) % 10 == int(body[-1])


def is_valid_gtin(value: object) -> bool:
    digits = clean_gtin(value)
    return digits is not None and has_valid_check_digit(digits)


def gtin_schema_field(digits: str) -> str:
    return SCHEMA_FIELD_BY_LENGTH[len(digits)]


def valid_gtin_pairs(pairs) -> list[tuple[str, str]]:
    """Accept (schema_field, raw_value) tuples, drop any that fail GS1 checksum."""
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for field, raw in pairs:
        digits = clean_gtin(raw)
        if not digits or not has_valid_check_digit(digits) or digits in seen:
            continue
        seen.add(digits)
        out.append((gtin_schema_field(digits), digits))
    return out


def is_valid_asin(value: object) -> bool:
    text = (str(value).strip().upper() if value else '')
    if len(text) != 10:
        return False
    if text.startswith('B0'):
        return text[2:].isalnum()
    return text.isdigit()


def is_valid_mpn(value: object) -> bool:
    text = str(value).strip() if value else ''
    return 2 <= len(text) <= 100
