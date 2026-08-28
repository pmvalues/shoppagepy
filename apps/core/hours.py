"""Structured opening hours shared by merchants and markets.

Stored as JSON keyed by weekday, e.g.
    {"mon": {"open": "08:30", "close": "17:30"}, "sat": {"open": "09:00", "close": "13:00"}, "sun": None}
A missing key and an explicit ``None`` both mean "no confirmed hours", which is
deliberately different from "closed" so the UI never invents an open state.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

DAY_KEYS = ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
DAY_LABELS = {
    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday',
    'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
}
DAY_ALIASES = {
    'monday': 'mon', 'tuesday': 'tue', 'wednesday': 'wed', 'thursday': 'thu',
    'friday': 'fri', 'saturday': 'sat', 'sunday': 'sun',
    'mon': 'mon', 'tue': 'tue', 'tues': 'tue', 'wed': 'wed', 'thu': 'thu',
    'thur': 'thu', 'thurs': 'thu', 'fri': 'fri', 'sat': 'sat', 'sun': 'sun',
}
FALLBACK_TIMEZONE = 'UTC'
DEFAULT_TIMEZONE_BY_COUNTRY = {
    'ZA': 'Africa/Johannesburg',
    'ZW': 'Africa/Harare',
    'KE': 'Africa/Nairobi',
    'NG': 'Africa/Lagos',
    'GB': 'Europe/London',
    'US': 'America/New_York',
}


def resolve_timezone(value: str | None, country: str | None = '') -> str:
    candidate = (value or '').strip()
    if candidate:
        try:
            ZoneInfo(candidate)
            return candidate
        except (ZoneInfoNotFoundError, ValueError):
            pass
    return DEFAULT_TIMEZONE_BY_COUNTRY.get((country or '').upper(), FALLBACK_TIMEZONE)


def parse_clock(value: Any) -> time | None:
    if isinstance(value, time):
        return value
    text = str(value or '').strip()
    if not text:
        return None
    text = text.replace('–', '-').replace('—', '-')
    hour_part = text.split(':')[0].strip()
    if not hour_part.isdigit():
        return None
    try:
        hour = int(hour_part)
        minute = int(text.split(':')[1][:2]) if ':' in text else 0
    except ValueError:
        return None
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return None
    return time(hour, minute)


def normalize_hours(raw: Any) -> dict[str, dict[str, str] | None]:
    """Coerce arbitrary stored shapes into the canonical weekday mapping (or {})."""
    if not isinstance(raw, dict) or not raw:
        return {}
    out: dict[str, dict[str, str] | None] = {}
    for key, value in raw.items():
        day = DAY_ALIASES.get(str(key).strip().lower())
        if day is None:
            continue
        if value in (None, '', 'closed', 'Closed', False):
            out[day] = None
            continue
        if isinstance(value, dict):
            opening, closing = parse_clock(value.get('open')), parse_clock(value.get('close'))
        elif isinstance(value, str):
            parts = [p for p in value.replace(',', ' ').split() if p]
            paired = next((p.split('-') for p in parts if '-' in p), None)
            opening, closing = (parse_clock(paired[0]), parse_clock(paired[1])) if paired else (None, None)
        else:
            opening = closing = None
        out[day] = (
            {'open': opening.strftime('%H:%M'), 'close': closing.strftime('%H:%M')}
            if opening and closing else None
        )
    return {k: v for k, v in out.items() if v is not None} or {}


def has_structured_hours(raw: Any) -> bool:
    return bool(normalize_hours(raw))


def _window(day: date, window: dict[str, str]) -> tuple[datetime, datetime, bool]:
    opening = parse_clock(window['open'])
    closing = parse_clock(window['close'])
    start = datetime.combine(day, opening)
    end = datetime.combine(day, closing)
    spans_midnight = end <= start
    if spans_midnight:
        end += timedelta(days=1)
    return start, end, spans_midnight


def open_status(hours: Any, timezone: str = FALLBACK_TIMEZONE, country: str = '', at: datetime | None = None):
    """Return the live open/closed state, or None when hours are unconfirmed."""
    schedule = normalize_hours(hours)
    if not schedule:
        return None
    tz_name = resolve_timezone(timezone, country)
    try:
        tz = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        return None
    now = (at or datetime.now(tz)).astimezone(tz)
    today = now.date()

    windows = []
    for offset in (-1, 0, 1, 2, 3, 4, 5, 6, 7):
        day = today + timedelta(days=offset)
        key = DAY_KEYS[day.weekday()]
        window = schedule.get(key)
        if not window:
            continue
        start, end, _ = _window(day, window)
        windows.append((key, start.astimezone(tz), end.astimezone(tz)))

    for key, start, end in windows:
        if start <= now < end:
            return {
                'is_open': True,
                'day_key': key,
                'opens_at': start.strftime('%H:%M'),
                'closes_at': end.strftime('%H:%M'),
                'minutes_left': int((end - now).total_seconds() // 60),
                'closing_soon': (end - now) <= timedelta(minutes=60),
                'timezone': tz_name,
            }
    upcoming = [(start, end, key) for key, start, end in windows if start > now]
    if upcoming:
        start, end, key = min(upcoming, key=lambda item: item[0])
        label = DAY_LABELS[key] if start.date() != today else 'today'
        return {
            'is_open': False,
            'day_key': key,
            'opens_at': start.strftime('%H:%M'),
            'closes_at': end.strftime('%H:%M'),
            'reopens_label': f'{label} {start.strftime("%H:%M")}',
            'timezone': tz_name,
        }
    return {'is_open': False, 'closed_all_week': True, 'timezone': tz_name}


def day_rows(hours: Any, unconfirmed_label: str = 'Not confirmed'):
    """Seven-row hours table data: (day label, '08:30–17:30' | unconfirmed)."""
    schedule = normalize_hours(hours)
    return [
        (
            DAY_LABELS[key],
            f"{schedule[key]['open']}–{schedule[key]['close']}" if schedule.get(key) else unconfirmed_label,
        )
        for key in DAY_KEYS
    ]


def schedule_label(hours: Any) -> str:
    """Compact human summary, grouping runs of consecutive identical days."""
    schedule = normalize_hours(hours)
    if not schedule:
        return ''
    runs: list[tuple[list[str], str]] = []
    for key in DAY_KEYS:
        window = schedule.get(key)
        if not window:
            continue
        label = f"{window['open']}–{window['close']}"
        if runs and runs[-1][1] == label and DAY_KEYS.index(runs[-1][0][-1]) == DAY_KEYS.index(key) - 1:
            runs[-1][0].append(key)
        else:
            runs.append(([key], label))
    parts = []
    for days, label in runs:
        if len(days) == 1:
            parts.append(f'{DAY_LABELS[days[0]][:3]} {label}')
        else:
            parts.append(f'{DAY_LABELS[days[0]][:3]}–{DAY_LABELS[days[-1]][:3]} {label}')
    return ' · '.join(parts)
