/**
 * Resilient PostgreSQL Connection & Query Resolver for Shoppage Kernel
 *
 * Provides a production-grade database resolver for PostgreSQL 16 + pgvector.
 * Adheres strictly to the Zero-Degradation architecture principle: if PostgreSQL
 * is offline or unconfigured, it safely returns null or executes the provided
 * fallback function.
 */

export interface PostgresResolverConfig {
  connectionString?: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
}

let cachedClient: any = null;
let healthCache: { healthy: boolean; checkedAt: number } | null = null;
const HEALTH_TTL_MS = 10000; // 10s health check cache

export function getPostgresConnectionString(): string | null {
  if (process.env.DATABASE_URI) {
    return process.env.DATABASE_URI;
  }
  if (process.env.POSTGRES_DB && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD) {
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = process.env.POSTGRES_PORT || '5432';
    return `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${host}:${port}/${process.env.POSTGRES_DB}`;
  }
  return null;
}

/**
 * Returns true if PostgreSQL connection string is configured and responsive
 */
export async function isPostgresHealthy(forceCheck = false): Promise<boolean> {
  const now = Date.now();
  if (!forceCheck && healthCache && now - healthCache.checkedAt < HEALTH_TTL_MS) {
    return healthCache.healthy;
  }

  const connStr = getPostgresConnectionString();
  if (!connStr) {
    healthCache = { healthy: false, checkedAt: now };
    return false;
  }

  try {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const req = typeof globalThis !== 'undefined' && (globalThis as any).__non_webpack_require__
      ? (globalThis as any).__non_webpack_require__
      : (typeof eval !== 'undefined' ? eval('require') : null);
      let pg: any;
      try {
        pg = req('pg');
      } catch {
        // Driver not installed or running in browser/edge
        healthCache = { healthy: false, checkedAt: now };
        return false;
      }

      const client = new pg.Client({ connectionString: connStr, connectionTimeoutMillis: 2000 });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      healthCache = { healthy: true, checkedAt: now };
      return true;
    }
  } catch {
    // Database container offline or unreachable
  }

  healthCache = { healthy: false, checkedAt: now };
  return false;
}

/**
 * Executes a PostgreSQL query with automatic zero-degradation fallback
 */
export async function withPostgresOrFallback<T>(
  pgFn: (client: any) => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  const healthy = await isPostgresHealthy();
  if (!healthy) {
    return fallbackFn();
  }

  try {
    const req = typeof globalThis !== 'undefined' && (globalThis as any).__non_webpack_require__
      ? (globalThis as any).__non_webpack_require__
      : (typeof eval !== 'undefined' ? eval('require') : null);
    const pg = req('pg');
    const connStr = getPostgresConnectionString();
    const pool = cachedClient || new pg.Pool({ connectionString: connStr, max: 10 });
    cachedClient = pool;
    return await pgFn(pool);
  } catch {
    // If query fails, seamlessly execute fallback
    return fallbackFn();
  }
}

/**
 * Reset connection pool (useful for testing)
 */
export function resetPostgresResolver(): void {
  if (cachedClient) {
    try {
      cachedClient.end();
    } catch {}
  }
  cachedClient = null;
  healthCache = null;
}
