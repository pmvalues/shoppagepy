import sqlite3
import time

DATABASE_PATH = "shoppage-commerce-intelligence-foundation/data/study/sa_nationwide_merchants.sqlite"
conn = sqlite3.connect(DATABASE_PATH)
cur = conn.cursor()

print("================================================================================")
print("[Verification] Inspecting Enrichment Completeness across All 3,109,299 Records")
print("================================================================================")

total = cur.execute("SELECT count(*) FROM swept_merchants").fetchone()[0]
print(f"Total Rows: {total:,}\n")

queries = [
    ("With CIPC Registration Number", "cipc_number IS NOT NULL AND cipc_number != ''"),
    ("With National Treasury CSD Number", "csd_number IS NOT NULL AND csd_number != ''"),
    ("With Verified B-BBEE Rating", "bbbee_level IS NOT NULL AND bbbee_level != ''"),
    ("With SARS Tax Compliance PIN", "tax_pin IS NOT NULL AND tax_pin != ''"),
    ("With Overture Maps GERS ID", "overture_id IS NOT NULL AND overture_id != ''"),
    ("With OpenStreetMap Node ID", "osm_id IS NOT NULL AND osm_id != ''"),
    ("With Local Payment Rails (Ozow/Cards/SnapScan)", "payment_methods IS NOT NULL AND payment_methods != ''"),
    ("With Commercial Facilities & Solar Backup", "facilities IS NOT NULL AND facilities != ''"),
    ("With Delivery & Fulfillment Rails", "delivery_options IS NOT NULL AND delivery_options != ''"),
    ("With Regional Languages Spoken", "languages_spoken IS NOT NULL AND languages_spoken != ''"),
    ("With Curated Storefront Image", "storefront_image IS NOT NULL AND storefront_image != ''"),
    ("With Operating Years in Business", "years_in_business IS NOT NULL AND years_in_business > 0"),
    ("With WhatsApp Response Time Metric", "response_time_mins IS NOT NULL AND response_time_mins > 0"),
    ("With Direct E.164 Phone / WhatsApp", "phone_e164 IS NOT NULL AND phone_e164 != ''"),
    ("With Geocoded Coordinates (Lat / Lng)", "latitude != 0 AND longitude != 0"),
    ("Solar / Building Merchants with CIDB Grading", "cidb_grade IS NOT NULL"),
    ("Solar Energy Merchants with DoEL Wireman CoC", "wireman_number IS NOT NULL"),
]

for label, cond in queries:
    t0 = time.time()
    count = cur.execute(f"SELECT count(*) FROM swept_merchants WHERE {cond}").fetchone()[0]
    pct = (count / total) * 100
    print(f" - {label:<48}: {count:>10,} ({pct:6.2f}%)")

print("\n--- Sample Enriched Row Inspection ---")
row = cur.execute("SELECT name, province, cipc_number, bbbee_level, tax_pin, payment_methods, facilities, languages_spoken, storefront_image, years_in_business, response_time_mins FROM swept_merchants WHERE merchant_id = 'loc_za_ga_000001'").fetchone()

if row:
    print(f"Store Name       : {row[0]}")
    print(f"Province         : {row[1]}")
    print(f"CIPC Enterprise  : {row[2]}")
    print(f"B-BBEE Level     : {row[3]}")
    print(f"SARS Tax PIN     : {row[4]}")
    print(f"Payment Rails    : {row[5]}")
    print(f"Facilities       : {row[6]}")
    print(f"Languages        : {row[7]}")
    print(f"Storefront Image : {row[8]}")
    print(f"Years Active     : {row[9]} Years")
    print(f"WhatsApp Response: {row[10]} Minutes")

conn.close()
