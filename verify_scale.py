import sqlite3
import time

DATABASE_PATH = "shoppage-commerce-intelligence-foundation/data/study/sa_nationwide_merchants.sqlite"
conn = sqlite3.connect(DATABASE_PATH)
cur = conn.cursor()

t0 = time.time()
total = cur.execute("SELECT count(merchant_id) FROM swept_merchants").fetchone()[0]
print(f"Total Live Ingested South African Companies: {total:,}")

# Test query performance for paginated searches
t_query = time.time()
results = cur.execute("SELECT name, province, cipc_number, bbbee_level FROM swept_merchants WHERE province = 'Gauteng' AND category = 'solar_energy' LIMIT 10").fetchall()
query_ms = (time.time() - t_query) * 1000
print(f"Sample Query Latency: {query_ms:.2f}ms (Returned {len(results)} rows)")
for r in results[:3]:
    print(f" - {r[0]} | {r[1]} | CIPC: {r[2]} | {r[3]}")

conn.close()
