import random
import time
import json
import sqlite3
from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from django.conf import settings

PROVINCES_DATA = [
    ('Gauteng', ['City of Johannesburg', 'City of Tshwane', 'Ekurhuleni', 'Sedibeng', 'West Rand']),
    ('Western Cape', ['City of Cape Town', 'Cape Winelands', 'Garden Route', 'Overberg', 'West Coast']),
    ('KwaZulu-Natal', ['eThekwini', 'uMgungundlovu', 'King Cetshwayo', 'iLembe', 'Ugu']),
    ('Eastern Cape', ['Nelson Mandela Bay', 'Buffalo City', 'Sarah Baartman', 'OR Tambo']),
    ('Limpopo', ['Polokwane', 'Capricorn', 'Mopani', 'Vhembe', 'Waterberg']),
    ('Mpumalanga', ['Ehlanzeni', 'Nkangala', 'Gert Sibande', 'Mbombela']),
    ('Free State', ['Mangaung', 'Fezile Dabi', 'Thabo Mofutsanyana', 'Lejweleputswa']),
    ('North West', ['Bojanala Platinum', 'Dr Kenneth Kaunda', 'Ngaka Modiri Molema']),
    ('Northern Cape', ['Frances Baard', 'John Taolo Gaetsewe', 'Namakwa', 'ZF Mgcawu']),
]

MERCHANT_NAMES_PREFIX = [
    'Apex', 'Vanguard', 'Summit', 'Solar', 'EcoPower', 'GreenTech', 'Titan', 'Mega', 'Hyper', 'Pro', 'Express',
    'National', 'Crown', 'Mandela', 'Bafokeng', 'Kagiso', 'Ubuntu', 'Sakhile', 'Khula', 'Amandla', 'Mzansi',
    'Platinum', 'Diamond', 'Highveld', 'Karoo', 'Coastal', 'Savanna', 'Zambezi', 'Limpopo', 'Protea', 'Springbok'
]

MERCHANT_NAMES_SUFFIX = [
    'Solar & Energy', 'Wholesale Hub', 'Hardware Supplies', 'Electrical Depot', 'Building Merchants',
    'Tech & Mobile', 'Direct Importers', 'Commercial Traders', 'Distributors ZA', 'Industrial Supplies',
    'Electronics Store', 'Tool Mart', 'Power Solutions', 'Motors & Spares', 'Contractor Yard', 'Bazaar'
]

PRODUCT_CATEGORIES = {
    'solar_energy': {
        'brands': ['Deye', 'Sunsynk', 'Growatt', 'Victron Energy', 'Must', 'Luxpower', 'Dyness', 'Pylontech', 'Hubble Lithium', 'Freedom Won', 'JA Solar', 'Canadian Solar', 'Longi', 'Felicity Solar', 'Kodak'],
        'types': ['Hybrid Inverter', 'LiFePO4 Lithium Battery', 'Tier-1 Monocrystalline Solar Panel', 'Off-Grid Inverter', 'High-Voltage Battery Module', 'Solar Charge Controller MPPT', 'Solar Geyser Conversion Kit']
    },
    'hardware_tools': {
        'brands': ['Bosch Professional', 'Makita', 'DeWalt', 'Ingco', 'Stanley', 'Ryobi', 'Total Tools', 'Milwaukee', 'Hitachi', 'Metabo'],
        'types': ['Brushless Impact Drill 18V', 'Angle Grinder 230mm', 'Rotary Hammer Drill SDS', 'Inverter Welder 200A', 'Industrial Air Compressor 50L', 'Mechanics Socket Set 150pc', 'Laser Distance Measurer 50m']
    },
    'building_materials': {
        'brands': ['PPC Cement', 'AfriSam', 'Lafarge', 'Duram', 'Dulux', 'Plascon', 'Gyproc', 'Isover', 'Sika', 'Weber'],
        'types': ['Surebuild 42.5N Cement 50kg', 'Wall & Ceiling Acrylic 20L', 'Rubber Flex Waterproofing 20L', 'RhinoBoard 12.7mm', 'Thermal Roof Insulation 135mm', 'Self-Leveling Floor Screed 20kg']
    },
    'smartphones_electronics': {
        'brands': ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Honor', 'Tecno', 'Hisense', 'Sony', 'Lenovo', 'Dell', 'HP'],
        'types': ['5G Smartphone 256GB', 'Rugged IP68 Smartphone 128GB', 'Core i7 Business Laptop 16GB', '4K UHD Smart Google TV 65"', 'Active Noise Cancelling Headphones', 'High-Speed Wi-Fi 6 Router']
    },
    'appliances_home': {
        'brands': ['Defy', 'KIC', 'Hisense', 'Samsung', 'LG', 'Bosch', 'Smeg', 'Whirlpool', 'Midea', 'Russell Hobbs'],
        'types': ['Double Door Fridge Freezer 340L', 'Front Loader Washing Machine 8kg', 'Gas Electric Freestanding Stove 90cm', 'Chest Freezer Solar Direct 210L', 'Microwave Grill 30L', 'Air Fryer XXL 7.2L']
    },
    'automotive_tyres': {
        'brands': ['Goodyear', 'Dunlop', 'Continental', 'Bridgestone', 'Pirelli', 'Michelin', 'Hankook', 'Castrol', 'Shell', 'Willard'],
        'types': ['All-Terrain 4x4 Tyre 265/65 R17', 'Passenger Tyre 205/55 R16', 'Synthetic Engine Oil 5W-30 5L', 'Heavy Duty Bakkie Battery 12V 70Ah', 'High-Pressure Washer 140 Bar', 'Hydraulic Trolley Jack 3-Ton']
    },
}

class Command(BaseCommand):
    help = 'Synthesizes the complete 1,000,000 Canonical Master Products and 3,100,000 Verified Merchants National Scale Commerce Grid'

    def add_arguments(self, parser):
        parser.add_argument('--products', type=int, default=1000000, help='Total Master Products to scale to (default 1,000,000)')
        parser.add_argument('--merchants', type=int, default=3100000, help='Total Merchants to scale to (default 3,100,000)')

    def handle(self, *args, **options):
        target_products = options['products']
        target_merchants = options['merchants']

        db_path = str(settings.DATABASES['default']['NAME'])
        self.stdout.write(self.style.NOTICE(
            f"==> Initiating High-Throughput National Scale Generation...\n"
            f"    Target Master Products: {target_products:,}\n"
            f"    Target Verified Merchants: {target_merchants:,}\n"
            f"    Target Database: {db_path}"
        ))

        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Ultra-fast bulk write tuning
        cur.execute("PRAGMA synchronous = OFF;")
        cur.execute("PRAGMA journal_mode = MEMORY;")
        cur.execute("PRAGMA cache_size = 100000;")
        cur.execute("PRAGMA temp_store = MEMORY;")

        now_iso = datetime.now(timezone.utc).isoformat()

        # =========================================================================
        # 1. SCALE MASTER PRODUCTS (1,000,000 Rows)
        # =========================================================================
        cur.execute("SELECT COUNT(*) FROM catalog_masterproduct")
        current_prod_count = cur.fetchone()[0]
        needed_products = max(0, target_products - current_prod_count)

        if needed_products > 0:
            self.stdout.write(self.style.NOTICE(f"[1/2] Generating {needed_products:,} Master Products..."))
            t0 = time.time()

            cat_keys = list(PRODUCT_CATEGORIES.keys())
            batch_size = 50000
            start_id = current_prod_count + 1

            insert_sql = """
            INSERT INTO catalog_masterproduct (
                id, created_at, updated_at, canonical_id, family_ref, category_ref,
                title, brand, model_number, gtin13, gtin14, mpn, asin, status,
                attributes, aliases, compliance, reviews_summary, guides, media_items,
                compatibility_edge_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """

            for batch_start in range(0, needed_products, batch_size):
                batch_count = min(batch_size, needed_products - batch_start)
                rows = []

                for i in range(batch_count):
                    sku_idx = start_id + batch_start + i
                    uid = f"prod_{sku_idx:027x}"
                    cat = cat_keys[sku_idx % len(cat_keys)]
                    cat_spec = PRODUCT_CATEGORIES[cat]
                    brand = cat_spec['brands'][sku_idx % len(cat_spec['brands'])]
                    item_type = cat_spec['types'][(sku_idx // len(cat_spec['brands'])) % len(cat_spec['types'])]

                    model_num = f"{brand[:3].upper()}-{100 + (sku_idx % 899)}-{(sku_idx % 99):02d}"
                    title = f"{brand} {model_num} {item_type}"
                    canonical_id = f"var_{cat[:4]}_{sku_idx:07d}"
                    gtin13 = f"600{(sku_idx * 7919) % 9000000000 + 1000000000:010d}"

                    attrs_json = json.dumps({'estimatedPriceZar': (sku_idx % 250) * 100 + 499, 'skuIndex': sku_idx})
                    comp_json = json.dumps({'sabsApproved': (sku_idx % 3 != 0), 'nrs097Certified': (cat == 'solar_energy')})
                    alias_json = json.dumps([{'phrase': title.lower(), 'locale': 'en', 'confidence': 1.0}])
                    rev_json = json.dumps({'averageRating': round(4.0 + (sku_idx % 10) * 0.1, 1), 'totalReviewsCount': (sku_idx % 80) + 5})

                    rows.append((
                        uid, now_iso, now_iso, canonical_id, f"fam_{cat}", cat,
                        title, brand, model_num, gtin13, None, model_num, None, 'ACTIVE',
                        attrs_json, alias_json, comp_json, rev_json, '[]', '[]',
                        0
                    ))

                cur.executemany(insert_sql, rows)
                conn.commit()
                pct = ((batch_start + batch_count) / needed_products) * 100
                self.stdout.write(f"    - Generated {batch_start + batch_count:,}/{needed_products:,} products ({pct:.1f}%)...")

            t1 = time.time()
            self.stdout.write(self.style.SUCCESS(f"[OK] Master Products scaled to {target_products:,} in {t1 - t0:.2f}s!"))
        else:
            self.stdout.write(self.style.SUCCESS(f"[OK] Master Products already at {current_prod_count:,}."))

        # =========================================================================
        # 2. SCALE VERIFIED MERCHANTS (3,100,000 Rows)
        # =========================================================================
        cur.execute("SELECT COUNT(*) FROM merchants_merchant")
        current_merch_count = cur.fetchone()[0]
        needed_merchants = max(0, target_merchants - current_merch_count)

        if needed_merchants > 0:
            self.stdout.write(self.style.NOTICE(f"[2/2] Generating {needed_merchants:,} Verified Merchants across SA..."))
            t0 = time.time()

            # Fetch existing market ids if any
            cur.execute("SELECT id FROM markets_market")
            market_rows = cur.fetchall()
            market_ids = [r[0] for r in market_rows] if market_rows else [None]

            batch_size = 100000
            start_id = current_merch_count + 1

            insert_sql = """
            INSERT INTO merchants_merchant (
                id, created_at, updated_at, canonical_id, name, country, claim_state,
                verification_state, whatsapp_number, telephone, email, website_url,
                stall_identifier, category, address_text, province,
                latitude, longitude, google_place_id, google_rating, google_reviews_count,
                google_reviews_url, google_maps_url, operating_hours, cipc_enterprise_number,
                csd_supplier_number, cidb_registration_number, cidb_grade,
                wireman_license_number, bbbee_level, tax_compliance_pin, storefront_photo_url,
                years_in_business, median_response_minutes, delivery_options, payment_methods,
                facilities, languages_spoken, trust_score, market_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """

            for batch_start in range(0, needed_merchants, batch_size):
                batch_count = min(batch_size, needed_merchants - batch_start)
                rows = []

                for i in range(batch_count):
                    m_idx = start_id + batch_start + i
                    uid = f"merc_{m_idx:027x}"
                    prov_idx = m_idx % len(PROVINCES_DATA)
                    province_name, metros = PROVINCES_DATA[prov_idx]
                    metro_name = metros[m_idx % len(metros)]

                    prefix = MERCHANT_NAMES_PREFIX[m_idx % len(MERCHANT_NAMES_PREFIX)]
                    suffix = MERCHANT_NAMES_SUFFIX[(m_idx // len(MERCHANT_NAMES_PREFIX)) % len(MERCHANT_NAMES_SUFFIX)]
                    name = f"{prefix} {suffix} {metro_name} #{m_idx}"
                    canonical_id = f"m_za_{m_idx:07d}"

                    whatsapp = f"277{(m_idx * 104729) % 90000000 + 10000000:08d}"
                    email = f"contact_{m_idx}@shoppage.co.za"
                    market_id = market_ids[m_idx % len(market_ids)] if market_ids else None
                    stall_id = f"Stall {(m_idx % 400) + 1}"
                    cat = list(PRODUCT_CATEGORIES.keys())[m_idx % len(PRODUCT_CATEGORIES)]
                    cipc = f"K202{(m_idx % 5)}/{((m_idx * 31) % 899999 + 100000)}/07"
                    score = 75 + (m_idx % 25)

                    rows.append((
                        uid, now_iso, now_iso, canonical_id, name, 'ZA', 'claimed',
                        'fully_verified', whatsapp, f"+{whatsapp}", email, None,
                        stall_id, cat, f"{stall_id}, {metro_name}, {province_name}", province_name,
                        -26.10 + ((m_idx % 100) * 0.01), 28.05 + ((m_idx % 100) * 0.01), None,
                        round(4.2 + (m_idx % 8) * 0.1, 1), (m_idx % 150) + 12, None, None,
                        'Mon-Fri: 08:00-17:00, Sat: 08:30-13:00', cipc,
                        f"MAAA{(m_idx % 999999):06d}", None, 'Grade 4EP' if cat == 'solar_energy' else None,
                        f"WML-{(m_idx % 89999 + 10000)}" if cat == 'solar_energy' else None,
                        'Level 1 Contributor (135% Recognition)', f"SARS-{(m_idx % 8999 + 1000)}-{(m_idx % 8999 + 1000)}",
                        None, (m_idx % 20) + 1, (m_idx % 10) + 2, '[]', '[]', '[]', '[]', score, market_id
                    ))

                cur.executemany(insert_sql, rows)
                conn.commit()
                pct = ((batch_start + batch_count) / needed_merchants) * 100
                self.stdout.write(f"    - Generated {batch_start + batch_count:,}/{needed_merchants:,} merchants ({pct:.1f}%)...")

            t1 = time.time()
            self.stdout.write(self.style.SUCCESS(f"[OK] Verified Merchants scaled to {target_merchants:,} in {t1 - t0:.2f}s!"))
        else:
            self.stdout.write(self.style.SUCCESS(f"[OK] Merchants already at {current_merch_count:,}."))

        conn.close()

        # Clean up scratch if exists
        self.stdout.write(self.style.SUCCESS(
            f"\n=========================================================================\n"
            f"[GRID SYNCHRONIZATION COMPLETE]\n"
            f"  - Canonical Master Products: {target_products:,}\n"
            f"  - Verified Registered Merchants: {target_merchants:,}\n"
            f"  - Coverage: 100% 9 Provinces of South Africa\n"
            f"=========================================================================\n"
        ))
