#!/usr/bin/env node
/**
 * Shoppage Typesense Sync Engine
 * Synchronizes Canonical Products, Discovered Offers, and Guzzle Specials into Typesense 26.0
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const TYPESENSE_URL = (process.env.TYPESENSE_URL || 'http://localhost:8108').replace(/\/+$/, '');
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'shoppage_typesense_secret_key';

const OFFERS_DB_PATH = path.join(
  ROOT,
  'shoppage-commerce-intelligence-foundation',
  'data',
  'study',
  'sa_discovered_offers.sqlite'
);

const MASTER_DB_PATH = path.join(
  ROOT,
  'shoppage-commerce-intelligence-foundation',
  'data',
  'study',
  'global_food_master_products.sqlite'
);

async function main() {
  console.log('========================================================================');
  console.log('⚡ SHOPPAGE TYPESENSE SYNCHRONIZATION ENGINE');
  console.log(`   Target Server: ${TYPESENSE_URL}`);
  console.log('========================================================================\n');

  // 1. Health check
  console.log('[1/4] Checking Typesense server connectivity...');
  try {
    const res = await fetch(`${TYPESENSE_URL}/health`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const health = await res.json();
    console.log(`  ✓ Connected to Typesense:`, health);
  } catch (err) {
    console.log(`  ⚠️ Typesense is currently OFFLINE at ${TYPESENSE_URL}`);
    console.log('     Reason:', err.message);
    console.log('\n  👉 To start Typesense locally using Docker:');
    console.log('     docker run -d -p 8108:8108 -v typesense_data:/data typesense/typesense:26.0 --data-dir /data --api-key=shoppage_typesense_secret_key --enable-cors');
    console.log('\n  👉 Or using docker compose:');
    console.log('     docker compose up -d typesense');
    console.log('\n  ℹ️  Note: Shoppage runtime seamlessly uses SQLite FTS5 in-process when Typesense is offline.');
    process.exit(0);
  }

  // 2. Ensure Collections
  console.log('\n[2/4] Initializing Typesense collections schema...');
  const collections = [
    {
      name: 'products',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'canonicalId', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'brand', type: 'string', facet: true },
        { name: 'categoryRef', type: 'string', facet: true },
        { name: 'modelNumber', type: 'string', optional: true },
        { name: 'gtin13', type: 'string', optional: true },
        { name: 'lowestPrice', type: 'float', optional: true, facet: true },
        { name: 'highestPrice', type: 'float', optional: true },
        { name: 'countryScope', type: 'string[]', facet: true },
      ],
      default_sorting_field: 'lowestPrice',
    },
    {
      name: 'specials',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'brand', type: 'string', facet: true },
        { name: 'merchantName', type: 'string', facet: true },
        { name: 'category', type: 'string', facet: true },
        { name: 'priceZar', type: 'float', facet: true },
        { name: 'oldPriceZar', type: 'float', optional: true },
        { name: 'discountPct', type: 'float', optional: true, facet: true },
        { name: 'sourceUrl', type: 'string' },
        { name: 'imageUrl', type: 'string', optional: true },
        { name: 'badge', type: 'string', optional: true },
      ],
      default_sorting_field: 'priceZar',
    },
  ];

  for (const c of collections) {
    const colRes = await fetch(`${TYPESENSE_URL}/collections/${c.name}`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
    });
    if (colRes.status === 404) {
      const createRes = await fetch(`${TYPESENSE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
        body: JSON.stringify(c),
      });
      if (createRes.ok) {
        console.log(`  ✓ Created collection '${c.name}'`);
      } else {
        console.error(`  ✗ Failed to create collection '${c.name}':`, await createRes.text());
      }
    } else {
      console.log(`  ✓ Collection '${c.name}' already active`);
    }
  }

  // 3. Index Specials & Discovered Offers
  console.log('\n[3/4] Indexing verified retail specials and discovered offers...');
  try {
    const offersDb = new DatabaseSync(OFFERS_DB_PATH, { readOnly: true });
    const rows = offersDb
      .prepare(
        'SELECT id, product_title, brand, merchant_name, category, discovered_price_zar, old_price_zar, discount_pct, source_url, image_url, deal_badge FROM discovered_offers WHERE discovered_price_zar > 0 LIMIT 5000'
      )
      .all();

    const specialDocs = rows.map((r) => ({
      id: String(r.id),
      title: r.product_title || 'Retail Special',
      brand: r.brand || r.merchant_name || 'Verified Brand',
      merchantName: r.merchant_name || 'Retail Partner',
      category: r.category || 'general',
      priceZar: Number(r.discovered_price_zar),
      oldPriceZar: r.old_price_zar ? Number(r.old_price_zar) : undefined,
      discountPct: r.discount_pct ? Number(r.discount_pct) : undefined,
      sourceUrl: r.source_url || 'https://shoppage.co.za',
      imageUrl: r.image_url || undefined,
      badge: r.deal_badge || undefined,
    }));

    if (specialDocs.length > 0) {
      const jsonl = specialDocs.map((d) => JSON.stringify(d)).join('\n');
      const importRes = await fetch(`${TYPESENSE_URL}/collections/specials/documents/import?action=upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
        body: jsonl,
      });

      if (importRes.ok) {
        console.log(`  ✓ Successfully imported ${specialDocs.length} specials into Typesense`);
      } else {
        console.error('  ✗ Import failed:', await importRes.text());
      }
    }
    offersDb.close();
  } catch (err) {
    console.log('  ⚠️ Could not read offers DB:', err.message);
  }

  // 4. Index Master Catalog Products
  console.log('\n[4/4] Indexing canonical master products...');
  try {
    const masterDb = new DatabaseSync(MASTER_DB_PATH, { readOnly: true });
    const products = masterDb
      .prepare(
        'SELECT master_product_id, product_name, brand, category_path, gtin, source_product_code FROM global_master_product LIMIT 10000'
      )
      .all();

    const prodDocs = products.map((p) => ({
      id: p.master_product_id.replace(/:/g, '_'),
      canonicalId: p.master_product_id.replace(/:/g, '_'),
      title: p.product_name || `Product #${p.master_product_id}`,
      brand: p.brand || 'General',
      categoryRef: p.category_path || 'general',
      modelNumber: p.source_product_code || undefined,
      gtin13: p.gtin && p.gtin.length === 13 ? p.gtin : undefined,
      lowestPrice: 100.0,
      highestPrice: 100.0,
      countryScope: ['ZA'],
    }));

    if (prodDocs.length > 0) {
      const jsonl = prodDocs.map((d) => JSON.stringify(d)).join('\n');
      const importRes = await fetch(`${TYPESENSE_URL}/collections/products/documents/import?action=upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
        body: jsonl,
      });

      if (importRes.ok) {
        console.log(`  ✓ Successfully imported ${prodDocs.length} canonical products into Typesense`);
      } else {
        console.error('  ✗ Import failed:', await importRes.text());
      }
    }
    masterDb.close();
  } catch (err) {
    console.log('  ⚠️ Could not read master DB:', err.message);
  }

  console.log('\n========================================================================');
  console.log('🎉 Typesense Synchronization Finished!');
  console.log('========================================================================');
}

main().catch(console.error);
