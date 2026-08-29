"""
Shoppage admin portal — modern sidebar navigation registry.

Groups every registered model into a human-friendly section with a
semantic icon and a stable sort key so the sidebar stays predictable as
new models are added. Adding a model here surfaces it in the nav without
any other changes.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class AdminNavItem:
    """A single item inside an admin sidebar section."""

    app_label: str
    model_name: str
    label: str
    icon: str
    url_name: str = ""

    def __post_init__(self) -> None:
        if not self.url_name:
            object.__setattr__(
                self,
                "url_name",
                f"admin:{self.app_label}_{self.model_name}_changelist",
            )


@dataclass(frozen=True)
class AdminNavSection:
    """A collapsible sidebar section: label, icon, ordered items."""

    key: str
    label: str
    icon: str
    items: tuple[AdminNavItem, ...]


# ---------------------------------------------------------------------------
# Section ordering — the tuple order below is the sidebar order.
# ---------------------------------------------------------------------------

ADMIN_NAV_SECTIONS: tuple[AdminNavSection, ...] = (
    AdminNavSection(
        key="overview",
        label="Overview",
        icon="grid",
        items=(
            # index URL is named 'admin:index'; auto-generated changelist name would 500 the palette
            AdminNavItem("admin", "index", "Dashboard", "layout-dashboard", url_name="admin:index"),
        ),
    ),
    AdminNavSection(
        key="merchants",
        label="Merchants",
        icon="store",
        items=(
            AdminNavItem("merchants", "merchant", "Merchants", "building-2"),
            AdminNavItem("merchants", "trustpassport", "Trust Passports", "shield-check"),
            AdminNavItem("merchants", "draft", "AI Drafts", "sparkles"),
            AdminNavItem("merchants", "agentrun", "Agent Runs", "bot"),
            AdminNavItem("merchants", "campaign", "Campaigns", "megaphone"),
            AdminNavItem("merchants", "merchantreview", "Reviews", "star"),
            AdminNavItem("merchants", "merchantquestion", "Questions", "message-circle"),
            AdminNavItem("merchants", "merchantphoto", "Photos", "image"),
            AdminNavItem("merchants", "merchantpost", "Posts", "file-text"),
            AdminNavItem("merchants", "follow", "Follows", "heart"),
        ),
    ),
    AdminNavSection(
        key="catalogue",
        label="Catalogue",
        icon="package",
        items=(
            AdminNavItem("catalog", "masterproduct", "Products", "package"),
            AdminNavItem("catalog", "category", "Categories", "folder-tree"),
            AdminNavItem("catalog", "categorypath", "Category Paths", "git-branch"),
            # Google taxonomy IS catalog.Category ("Google Taxonomy Category") — no separate model exists
        ),
    ),
    AdminNavSection(
        key="offers",
        label="Offers & Prices",
        icon="tag",
        items=(
            AdminNavItem("offers", "offer", "Confirmed Offers", "check-circle"),
            AdminNavItem("offers", "vendorproduct", "Vendor Listings", "clipboard-list"),
            AdminNavItem("offers", "discoveredoffer", "Discovered Offers", "search"),
            AdminNavItem("offers", "priceobservation", "Price Observations", "line-chart"),
            AdminNavItem("offers", "pricealert", "Price Alerts", "bell"),
            AdminNavItem("offers", "promotion", "Promotions", "gift"),
            AdminNavItem("offers", "urlhealthrecord", "Crawl Ledger", "activity"),
            AdminNavItem("offers", "urlimpression", "URL Impressions", "eye"),
            AdminNavItem("offers", "crawlrun", "Crawl Runs", "loader"),
        ),
    ),
    AdminNavSection(
        key="markets",
        label="Markets & Malls",
        icon="map",
        items=(
            AdminNavItem("markets", "market", "Markets / Malls", "map-pin"),
        ),
    ),
    AdminNavSection(
        key="evidence",
        label="Evidence & Rights",
        icon="scale",
        items=(
            AdminNavItem("evidence", "evidenceartifact", "Artifacts", "file-search"),
            AdminNavItem("evidence", "evidenceclaim", "Claims", "scroll-text"),
            AdminNavItem("evidence", "evidenceobservation", "Observations", "clock"),
            AdminNavItem("rights", "rightssource", "Rights Sources", "lock"),
        ),
    ),
    AdminNavSection(
        key="media",
        label="Media Hub",
        icon="play",
        items=(
            AdminNavItem("media_hub", "show", "Shows", "tv"),
            AdminNavItem("media_hub", "short", "Proof Shorts", "video"),
        ),
    ),
    AdminNavSection(
        key="intelligence",
        label="Intelligence",
        icon="brain",
        items=(
            AdminNavItem("core", "searchquerylog", "Search Queries", "search"),
            AdminNavItem("core", "searchclick", "Search Clicks", "mouse-pointer-click"),
        ),
    ),
    AdminNavSection(
        key="growth",
        label="Growth & Referrals",
        icon="trending-up",
        items=(
            AdminNavItem("referrals", "referralevent", "Referral Events", "share-2"),
            AdminNavItem("referrals", "affiliate", "Affiliates", "users"),
        ),
    ),
    AdminNavSection(
        key="system",
        label="System",
        icon="settings",
        items=(
            AdminNavItem("auth", "user", "Users", "user"),
            AdminNavItem("auth", "group", "Groups", "users"),
        ),
    ),
)


def build_admin_nav() -> tuple[AdminNavSection, ...]:
    """Public accessor so templates and views don't import the tuple directly."""
    return ADMIN_NAV_SECTIONS


# Map of app_label -> section key for quick lookups.
APP_TO_SECTION: dict[str, str] = {
    item.app_label: section.key
    for section in ADMIN_NAV_SECTIONS
    for item in section.items
}


def section_for(app_label: str) -> AdminNavSection | None:
    """Return the section that owns an app, or None when unregistered."""
    key = APP_TO_SECTION.get(app_label)
    for section in ADMIN_NAV_SECTIONS:
        if section.key == key:
            return section
    return None
