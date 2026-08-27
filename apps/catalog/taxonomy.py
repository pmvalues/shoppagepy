"""Google Product Taxonomy resolver for Shoppage category_ref values.

The full 5,591-node tree lives in taxonomy_data.GOOGLE_TAXONOMY (generated from
packages/kernel/src/taxonomy/google_taxonomy.ts). This module maps Shoppage's
free-text category_ref slugs onto official Google category IDs so product feeds
and browse pages can emit g:google_product_category / g:product_type.
"""
from .taxonomy_data import GOOGLE_TAXONOMY

# id -> (id, name, full_path, parent_id, level, slug)
_BY_ID = {row[0]: row for row in GOOGLE_TAXONOMY}

# Shoppage category_ref -> official Google category id (defaults; overridable via CategoryMapping)
CATEGORY_REF_MAP = {
    'solar_energy': 127,          # Hardware > Power & Electrical Supplies
    'hardware_tools': 1167,       # Hardware > Tools
    'hardware': 632,              # Hardware
    'building_materials': 115,    # Hardware > Building Materials
    'smartphones_electronics': 222,  # Electronics
    'smartphones': 267,           # Electronics > Communications > Telephony > Mobile Phones
    'appliances_home': 604,       # Home & Garden > Household Appliances
    'automotive_tyres': 911,      # Vehicles & Parts > ... > Motor Vehicle Tires
}


def google_category_by_id(category_id):
    """Return (id, name, full_path) for a Google category id, or None."""
    row = _BY_ID.get(category_id)
    if not row:
        return None
    return row[0], row[1], row[2]


def resolve_google_category(category_ref, override_id=None):
    """Resolve a Shoppage category_ref to (id, name, full_path).

    override_id (from CategoryMapping) takes precedence over CATEGORY_REF_MAP.
    Returns None when no mapping exists.
    """
    google_id = override_id if override_id else CATEGORY_REF_MAP.get(category_ref)
    if not google_id:
        return None
    return google_category_by_id(google_id)


def breadcrumb_path(category_id):
    """Return list of (id, name) from root down to category_id."""
    path = []
    current = _BY_ID.get(category_id)
    seen = set()
    while current and current[0] not in seen:
        seen.add(current[0])
        path.append((current[0], current[1]))
        if not current[3]:
            break
        current = _BY_ID.get(current[3])
    path.reverse()
    return path


def all_categories():
    """Return the full taxonomy list (id, name, full_path, parent_id, level, slug)."""
    return GOOGLE_TAXONOMY
