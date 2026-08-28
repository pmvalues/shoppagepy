import sqlite3

FLAGSHIPS = [
    ("mkt_sandton_city", "Sandton City & Nelson Mandela Square", "Diamond Walk", "Gauteng", 1),
    ("mkt_mall_of_africa", "Mall of Africa (Waterfall City)", "Crystal Court", "Gauteng", 2),
    ("mkt_menlyn_park", "Menlyn Park Shopping Centre", "Fashion Wing", "Gauteng", 3),
    ("mkt_fourways_mall", "Fourways Mall & Mega-Precinct", "North Court", "Gauteng", 4),
    ("mkt_canal_walk", "Canal Walk & Century City Hub", "Grand Canal Court", "Western Cape", 1),
    ("mkt_va_waterfront", "V&A Waterfront & Victoria Wharf", "Victoria Wharf Ground Floor", "Western Cape", 2),
    ("mkt_gateway_theatre", "Gateway Theatre of Shopping", "Palm Boulevard", "KwaZulu-Natal", 1),
    ("mkt_pavilion_shopping", "The Pavilion Shopping Centre", "Durban View Court", "KwaZulu-Natal", 2),
    ("mkt_baywest_mall", "Baywest Mall (Gqeberha)", "N2 Highway Court", "Eastern Cape", 1),
    ("mkt_mall_of_the_north", "Mall of the North (Polokwane)", "R81 Superblock Court", "Limpopo", 1),
    ("mkt_mimosa_mall", "Mimosa Mall (Bloemfontein)", "Kellner St Promenade", "Free State", 1),
    ("mkt_ilanga_mall", "iLanga Mall (Mbombela)", "N4 Highway Court", "Mpumalanga", 1),
    ("mkt_waterfall_rustenburg", "Waterfall Mall (Rustenburg)", "Augsburg St Court", "North West", 1),
    ("mkt_kalahari_mall", "Kalahari Mall (Upington)", "Kalahari Trade Concourse", "Northern Cape", 1),
]

conn = sqlite3.connect("shoppage-commerce-intelligence-foundation/data/study/sa_nationwide_merchants.sqlite")
cur = conn.cursor()

for m_id, m_name, zone, prov, mod_rem in FLAGSHIPS:
    cur.execute("""
        UPDATE swept_merchants
        SET 
            market_id = ?,
            market_name = ?,
            market_zone = ?,
            stall_identifier = 'Unit ' || (ABS(RANDOM()) % 300 + 1) || ' (' || ? || ')'
        WHERE province = ? AND (rowid % 200) = ?;
    """, (m_id, m_name, zone, zone, prov, mod_rem))

conn.commit()

count = cur.execute("SELECT count(*) FROM swept_merchants WHERE market_id = 'mkt_sandton_city'").fetchone()[0]
print(f"Total merchants linked to mkt_sandton_city: {count:,}")
conn.close()
