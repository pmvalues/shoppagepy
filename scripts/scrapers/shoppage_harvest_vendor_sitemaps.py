#!/usr/bin/env python3
"""
Shoppage vendor sitemap harvester: 100k+ REAL product URLs from REAL vendors.
--------------------------------------------------------------------------------
Reads only publisher-provided XML sitemaps (Takealot, Clicks, Builders) and
stores genuine product page URLs into sa_discovered_offers.sqlite for the
@shoppage/kernel DiscoveredOffersStore. No product pages are fetched, no prices
are invented: price/image/brand stay NULL unless the sitemap itself provides
an image. Safe to re-run: INSERT OR IGNORE makes every run idempotent.

Usage:
    python shoppage_harvest_vendor_sitemaps.py [--retailer takealot|clicks|builders|all]
"""

import argparse
import gzip
import hashlib
import re
import sqlite3
import sys
import time
import urllib.request
from pathlib import Path
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = REPO_ROOT / 'shoppage-commerce-intelligence-foundation' / 'data' / 'study' / 'sa_discovered_offers.sqlite'

UA = {'User-Agent': 'ShoppageCommerceBot/1.0 (+https://shoppage.co.za)'}
FETCH_DELAY = 0.4
FETCH_TIMEOUT = 30

RETAILERS = [
    {
        'key': 'takealot', 'name': 'Takealot.com', 'domain': 'takealot.com',
        'hint': 'National Distribution Centres (Johannesburg & Cape Town)',
        'index': 'https://www.takealot.com/sitemap.xml',
        'child_match': None,
        'max_children': 3,
        'pattern': re.compile(r'/PLID\d+'),
        'cap': 60000,
    },
    {
        'key': 'clicks', 'name': 'Clicks Group', 'domain': 'clicks.co.za',
        'hint': '850+ Clicks Pharmacy Stores Across South Africa',
        'index': 'https://clicks.co.za/sitemap.xml',
        'child_match': re.compile(r'/Product-\d+-'),
        'max_children': 3,
        'pattern': re.compile(r'/p/\d+$'),
        'exclude': re.compile(r'/medias/'),
        'cap': 30000,
    },
    {
        'key': 'builders', 'name': 'Builders Warehouse', 'domain': 'builders.co.za',
        'hint': '100+ Builders Warehouse & Express Stores Nationwide',
        'sitemaps': [
            'https://www.builders.co.za/ProductSitemap_%s.xml' % c for c in (
                'appliances', 'building_materials', 'deals', 'decor',
                'doors_windows', 'electrical', 'fasteners_adhesives',
                'installations', 'lighting', 'loadshedding', 'outdoor',
                'paint', 'plumbing', 'safety', 'smart_home', 'tiles_flooring',
                'tools_machinery', 'water_tanks',
            )
        ],
        'pattern': re.compile(r'/p/\d+'),
        'cap': 15000,
    },
]

EXCLUDE = re.compile(r'/search|/cart|/checkout|/account|/login|/register|/blog|/help|/contact|/about|storelocator|wishlist|compare|newsletter|robots|sitemap|\.xml$|\.(jpg|jpeg|png|gif|webp|pdf|css|js)(\?|$)', re.I)


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT) as r:
        data = r.read()
    if url.endswith('.gz') or data[:2] == b'\x1f\x8b':
        data = gzip.decompress(data)
    return data


def locs_of(root):
    out = []
    for el in root.iter():
        if el.tag.split('}')[-1] == 'loc' and (el.text or '').startswith('http'):
            out.append(el.text.strip())
    return out


def images_of(root):
    """Map page URL -> first image URL when sitemaps carry image:image blocks."""
    found = {}
    for url_el in root.iter():
        if url_el.tag.split('}')[-1] != 'url':
            continue
        loc = img = None
        for child in url_el:
            local = child.tag.split('}')[-1]
            if local == 'loc' and (child.text or '').startswith('http'):
                loc = child.text.strip()
            if local == 'image':
                for g in child.iter():
                    if g.tag.split('}')[-1] == 'loc' and g.text:
                        img = g.text.strip()
                        break
        if loc and img and loc not in found:
            found[loc] = img
    return found


def humanize(url):
    path = urlparse(url).path.strip('/')
    segs = [s for s in path.split('/') if s]
    while segs and re.fullmatch(r'(PLID\d+|\d+_EA|\d{6,}|p)', segs[-1], re.I):
        segs.pop()
    seg = segs[-1] if segs else ''
    seg = re.sub(r'\.html?$', '', seg, flags=re.I)
    seg = re.sub(r'[-_]+', ' ', seg).strip()
    seg = re.sub(r'\s+', ' ', seg)
    return seg[:160] if seg else 'Listed product'


def slug_ref(domain_key, url):
    path = urlparse(url).path.strip('/').lower()
    slug = re.sub(r'[^a-z0-9]+', '_', path).strip('_')[:80] or 'item'
    digest = hashlib.md5(url.encode()).hexdigest()[:6]
    return 'ext_%s_%s_%s' % (domain_key, slug, digest)


def harvest_retailer(cfg, conn, seen_before):
    cur = conn.cursor()
    try:
        if 'index' in cfg:
            children = locs_of(ET.fromstring(fetch(cfg['index'])))
            if cfg.get('child_match'):
                children = [c for c in children if cfg['child_match'].search(c)]
            children = children[:cfg['max_children']]
        else:
            children = cfg['sitemaps']
    except Exception as e:
        print('[%s] index failed: %s' % (cfg['key'], str(e)[:100]), flush=True)
        return 0
    time.sleep(FETCH_DELAY)

    stored = 0
    files_ok = 0
    for child in children:
        if stored >= cfg['cap']:
            break
        try:
            root = ET.fromstring(fetch(child))
        except Exception as e:
            print('[%s] child failed: %s' % (cfg['key'], str(e)[:80]), flush=True)
            time.sleep(FETCH_DELAY)
            continue
        time.sleep(FETCH_DELAY)
        if root.tag.split('}')[-1] == 'sitemapindex':
            continue
        images = images_of(root)
        batch = []
        for loc in locs_of(root):
            if stored + len(batch) >= cfg['cap']:
                break
            if not cfg['pattern'].search(loc):
                continue
            if EXCLUDE.search(loc):
                continue
            if loc in seen_before:
                continue
            seen_before.add(loc)
            digest = hashlib.md5(loc.encode()).hexdigest()
            batch.append((
                'smp_%s_%s' % (cfg['key'], digest[:12]),
                slug_ref(cfg['key'], loc),
                humanize(loc),
                images.get(loc) or '',
                cfg['name'], cfg['domain'], loc,
                cfg['hint'],
                'EXT-%s-%s' % (cfg['key'].upper(), digest[:8].upper()),
            ))
        if batch:
            cur.executemany(
                """INSERT OR IGNORE INTO discovered_offers
                   (id, master_product_ref, product_title, brand, category,
                    image_url, merchant_name, source_website, source_url,
                    discovered_price_zar, raw_price_text, availability_text,
                    discovery_source, confidence_score, discovered_at, status,
                    location_hint, sku)
                   VALUES (?, ?, ?, '', 'general', ?, ?, ?, ?, -1, '',
                           'See live listing', 'sitemap_harvest', 0.9,
                           datetime('now'), 'discovered', ?, ?)""",
                batch,
            )
            conn.commit()
            stored += cur.rowcount if cur.rowcount and cur.rowcount > 0 else len(batch)
            files_ok += 1
    print('[%s] stored=%d files_ok=%d' % (cfg['key'], stored, files_ok), flush=True)
    return stored


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--retailer', default='all',
                    choices=['all'] + [r['key'] for r in RETAILERS])
    args = ap.parse_args()

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_disc_url '
        'ON discovered_offers(source_website, source_url)'
    )
    seen = set(r[0] for r in conn.execute(
        'SELECT source_url FROM discovered_offers'))
    print('db=%s existing_urls=%d' % (DB_PATH, len(seen)), flush=True)

    total = 0
    for cfg in RETAILERS:
        if args.retailer != 'all' and cfg['key'] != args.retailer:
            continue
        total += harvest_retailer(cfg, conn, seen)

    final = conn.execute('SELECT COUNT(*) FROM discovered_offers').fetchone()[0]
    print('TOTAL_STORED_THIS_RUN=%d GRAND_TOTAL=%d' % (total, final))
    conn.close()


if __name__ == '__main__':
    sys.exit(main())
