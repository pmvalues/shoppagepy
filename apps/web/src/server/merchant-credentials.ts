/**
 * Merchant credential store — scrypt-hashed credentials at rest.
 *
 * Supports the self-service claim flow: a merchant who claims their store
 * receives a one-time credential that is stored hashed here and verified by
 * lib/auth.ts. Env-var credentials (SHOPPAGE_MERCHANT_SECRET_*) remain
 * authoritative when configured; stored credentials are the fallback for
 * self-provisioned merchants.
 *
 * NOTE: this module is reachable from lib/auth.ts, which middleware bundles for
 * the edge runtime — therefore every Node built-in is loaded lazily via
 * eval('require') and nothing Node-specific runs at module scope.
 */

const CREDENTIALS_DB_FILE = 'shoppage_merchant_credentials.sqlite';

interface NodeModules {
  fs: any;
  path: any;
  crypto: any;
  DatabaseSync: any;
}

function nodeModules(): NodeModules | null {
  try {
    if (typeof process === 'undefined' || !process.versions?.node) return null;
    const req = eval('require');
    return {
      fs: req('fs'),
      path: req('path'),
      crypto: req('node:crypto'),
      DatabaseSync: req('node:sqlite').DatabaseSync,
    };
  } catch {
    return null;
  }
}

function credentialsDbPath(mods: NodeModules): string {
  return mods.path.resolve(
    process.cwd(),
    'shoppage-commerce-intelligence-foundation',
    'data',
    'study',
    CREDENTIALS_DB_FILE
  );
}

function openDb(): { db: any; mods: NodeModules } | null {
  const mods = nodeModules();
  if (!mods) return null;
  try {
    const file = credentialsDbPath(mods);
    mods.fs.mkdirSync(mods.path.dirname(file), { recursive: true });
    const db = new mods.DatabaseSync(file, { open: true });
    db.exec(
      'CREATE TABLE IF NOT EXISTS merchant_credentials (' +
      '  merchant_id TEXT PRIMARY KEY,' +
      '  salt TEXT NOT NULL,' +
      '  hash TEXT NOT NULL,' +
      '  created_at TEXT NOT NULL' +
      ')'
    );
    return { db, mods };
  } catch {
    return null;
  }
}

export function generateMerchantCredential(): string {
  const mods = nodeModules();
  if (!mods) return '';
  try {
    return mods.crypto.randomBytes(24).toString('base64url');
  } catch {
    return '';
  }
}

export function storeMerchantCredential(merchantId: string, credential: string): boolean {
  const opened = openDb();
  if (!opened) return false;
  const { db, mods } = opened;
  try {
    const salt = mods.crypto.randomBytes(16).toString('hex');
    const hash = mods.crypto.scryptSync(credential, salt, 64).toString('hex');
    db.prepare(
      'INSERT OR REPLACE INTO merchant_credentials (merchant_id, salt, hash, created_at) VALUES (?, ?, ?, ?)'
    ).run(merchantId, salt, hash, new Date().toISOString());
    return true;
  } catch {
    return false;
  } finally {
    try { db.close(); } catch {}
  }
}

export function hasStoredCredential(merchantId: string): boolean {
  const opened = openDb();
  if (!opened) return false;
  const { db } = opened;
  try {
    const row = db.prepare('SELECT 1 AS present FROM merchant_credentials WHERE merchant_id = ?').get(merchantId);
    return Boolean(row);
  } catch {
    return false;
  } finally {
    try { db.close(); } catch {}
  }
}

export function verifyStoredMerchantCredential(merchantId: string, credential: string): boolean {
  if (!merchantId || !credential) return false;
  const opened = openDb();
  if (!opened) return false;
  const { db, mods } = opened;
  try {
    const row = db.prepare(
      'SELECT salt, hash FROM merchant_credentials WHERE merchant_id = ?'
    ).get(merchantId) as any;
    if (!row) return false;
    const expected = Buffer.from(String(row.hash), 'hex');
    const actual = mods.crypto.scryptSync(credential, String(row.salt), 64);
    if (expected.length !== actual.length) return false;
    return mods.crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  } finally {
    try { db.close(); } catch {}
  }
}
