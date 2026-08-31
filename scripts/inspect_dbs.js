const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbs = [
  'sa_nationwide_merchants.sqlite',
  'shoppage-commerce-intelligence-foundation/data/study/global_food_master_products.sqlite',
  'shoppage-commerce-intelligence-foundation/data/study/sa_discovered_offers.sqlite',
  'shoppage-commerce-intelligence-foundation/data/study/sa_malls_and_shopping_centres.sqlite',
  'shoppage-commerce-intelligence-foundation/data/study/sa_nationwide_merchants.sqlite',
  'db.sqlite3'
];

for (const dbPath of dbs) {
  if (fs.existsSync(dbPath)) {
    try {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log(`=== DB: ${dbPath} ===`);
      for (const t of tables) {
        try {
          const count = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
          console.log(`  Table ${t.name}: ${count.count} rows`);
        } catch (e) {
          console.log(`  Table ${t.name}: err (${e.message})`);
        }
      }
    } catch (e) {
      console.log(`Error reading ${dbPath}: ${e.message}`);
    }
  } else {
    console.log(`Missing: ${dbPath}`);
  }
}
