import sqlite3
import time

DATABASE_PATH = "shoppage-commerce-intelligence-foundation/data/study/sa_nationwide_merchants.sqlite"
conn = sqlite3.connect(DATABASE_PATH)
cur = conn.cursor()

print("Building high-speed compound indexes for 3.1M records...")
t0 = time.time()
cur.execute("CREATE INDEX IF NOT EXISTS idx_prov_cat ON swept_merchants(province, category);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_merchant_id ON swept_merchants(merchant_id);")
conn.commit()
print(f"Index creation complete in {time.time() - t0:.2f}s")

# Test query with compound index
t1 = time.time()
res = cur.execute("SELECT name, province, cipc_number, bbbee_level FROM swept_merchants WHERE province = 'Gauteng' AND category = 'solar_energy' LIMIT 10").fetchall()
ms = (time.time() - t1) * 1000
print(f"Compound Index Query Latency: {ms:.2f}ms (Returned {len(res)} rows)")

conn.close()
