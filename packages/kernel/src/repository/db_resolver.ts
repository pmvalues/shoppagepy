import * as path from 'path';

const dbCache = new Map<string, any>();
const missingCache = new Set<string>();

/**
 * Resolves and opens a SQLite database from possible monorepo locations
 */
export function getSqliteDatabase(filename: string, options: { readOnly?: boolean } = { readOnly: true }): any {
  const cacheKey = `${filename}:${options.readOnly ? 'ro' : 'rw'}`;
  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey);
  }
  if (missingCache.has(cacheKey)) {
    return null;
  }

  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
      const fs = req('fs');
      const { DatabaseSync } = req('node:sqlite');

      const cwd = process.cwd();
      const possiblePaths = [
        path.resolve(cwd, 'shoppage-commerce-intelligence-foundation/data/study', filename),
        path.resolve(cwd, '../shoppage-commerce-intelligence-foundation/data/study', filename),
        path.resolve(cwd, '../../shoppage-commerce-intelligence-foundation/data/study', filename),
        path.resolve(cwd, '../../../shoppage-commerce-intelligence-foundation/data/study', filename),
        path.resolve(cwd, filename),
        path.resolve(cwd, '..', filename),
        'C:/Users/Maga/OneDrive/Docs/Documents A/Shoppage/shoppage-commerce-intelligence-foundation/data/study/' + filename,
        'C:/Users/Maga/OneDrive/Docs/Documents A/Shoppage/' + filename,
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const db = new DatabaseSync(p, { open: true, readOnly: options.readOnly ?? true });
          // Wait for concurrent readers (parallel test workers / web workers) instead of failing with SQLITE_BUSY
          db.exec('PRAGMA busy_timeout = 10000;');
          dbCache.set(cacheKey, db);
          return db;
        }
      }
    }
  } catch (err) {
    // Edge/browser or fallback
  }

  missingCache.add(cacheKey);
  return null;
}

/**
 * Clear cached database instances (useful for testing)
 */
export function clearDatabaseCache(): void {
  dbCache.clear();
  missingCache.clear();
}
