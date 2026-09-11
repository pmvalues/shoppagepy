/**
 * Production environment validation (WS-1.2).
 *
 * Runs at server boot (imported from middleware and the ops health route) and fails
 * loudly if the deployment is misconfigured. The goal is to convert every silent
 * security degradation into a visible, immediate, actionable error.
 *
 * Design rules:
 *  - Never throw in development or test; only warn.
 *  - In production, throw on anything that would expose the platform.
 *  - Every message names the exact env var and the exact remediation command.
 */

export interface EnvIssue {
  variable: string;
  severity: 'fatal' | 'warning';
  message: string;
}

const PLACEHOLDERS = new Set([
  'admin123',
  'password',
  'changeme',
  '••••••••••••',
  'replace_with_a_super_secure_random_32_byte_string',
  'replace_with_secure_postgres_password',
  'replace_with_secure_redis_password',
  'replace_with_secure_typesense_api_key',
  'shoppage-local-dev-secret-key-32-chars-min',
]);

const MIN_SECRET_LENGTH = 32;

function looksWeak(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.length < MIN_SECRET_LENGTH) return true;
  for (const p of PLACEHOLDERS) {
    if (v === p || v.startsWith(p)) return true;
  }
  // Reject genuinely degenerate secrets (e.g. 'aaaa....' or 'ababab....').
  // Threshold is deliberately low: a random base64 secret sits well above it, and
  // false positives here would block correct deployments.
  if (new Set(v).size < 6) return true;
  return false;
}

/**
 * Inspects the environment and returns every problem found. Pure — performs no I/O
 * and never throws, so it is safe to call from anywhere and easy to unit test.
 */
export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProduction = env.NODE_ENV === 'production';
  const fatal = (variable: string, message: string) =>
    issues.push({ variable, severity: 'fatal', message });
  const warn = (variable: string, message: string) =>
    issues.push({ variable, severity: 'warning', message });

  const report = isProduction ? fatal : warn;

  // --- Session signing secret ------------------------------------------------
  const authSecret = (env.SHOPPAGE_AUTH_SECRET || env.PAYLOAD_SECRET || '').trim();
  if (!authSecret) {
    report(
      'SHOPPAGE_AUTH_SECRET',
      'Not set. Session tokens cannot be signed. Generate one with: openssl rand -base64 48'
    );
  } else if (isProduction && looksWeak(authSecret)) {
    report(
      'SHOPPAGE_AUTH_SECRET',
      'Weak or a known placeholder. Generate a new one with: openssl rand -base64 48'
    );
  }

  // --- Superadmin credential -------------------------------------------------
  const adminPassword = (env.SHOPPAGE_ADMIN_PASSWORD || '').trim();
  if (!adminPassword) {
    report(
      'SHOPPAGE_ADMIN_PASSWORD',
      'Not set. The platform superadmin cannot sign in, and no fallback is permitted.'
    );
  } else if (isProduction && (adminPassword.length < 12 || PLACEHOLDERS.has(adminPassword.toLowerCase()))) {
    report(
      'SHOPPAGE_ADMIN_PASSWORD',
      'Weak or a known placeholder. Set a unique password of at least 12 characters.'
    );
  }

  // --- Development auth must never be on in production -----------------------
  if (isProduction && env.SHOPPAGE_ALLOW_DEV_AUTH === 'true') {
    fatal(
      'SHOPPAGE_ALLOW_DEV_AUTH',
      'Dev auth is enabled in a production environment. This opens every merchant ' +
        'account to the placeholder password. Remove this variable.'
    );
  }
  if (env.SHOPPAGE_ALLOW_DEV_AUTH === 'true' && !isProduction) {
    warn(
      'SHOPPAGE_ALLOW_DEV_AUTH',
      'Dev auth is enabled. Placeholder passwords will work. This is expected locally only.'
    );
  }

  // --- Merchant secrets ------------------------------------------------------
  const merchantSecretVars = Object.keys(env).filter((k) =>
    k.startsWith('SHOPPAGE_MERCHANT_SECRET_')
  );
  if (isProduction && merchantSecretVars.length === 0) {
    warn(
      'SHOPPAGE_MERCHANT_SECRET_*',
      'No merchant secrets configured. No merchant will be able to sign in to the Merchant OS.'
    );
  }
  for (const key of merchantSecretVars) {
    const value = (env[key] || '').trim();
    if (isProduction && (value.length < 12 || PLACEHOLDERS.has(value.toLowerCase()))) {
      report(
        key,
        'Weak or a known placeholder. Each merchant must have a unique, strong secret.'
      );
    }
    // Detect the original bug: every merchant sharing one secret.
    const duplicate = merchantSecretVars.find(
      (other) => other !== key && (env[other] || '').trim() === value
    );
    if (isProduction && duplicate) {
      report(
        key,
        `Shares its value with ${duplicate}. Merchant secrets must be unique per store, ` +
          'otherwise compromising one store compromises all of them.'
      );
    }
  }

  // --- Public origin ---------------------------------------------------------
  const siteUrl = (env.NEXT_PUBLIC_SERVER_URL || '').trim();
  if (isProduction && (!siteUrl || siteUrl.includes('localhost'))) {
    warn(
      'NEXT_PUBLIC_SERVER_URL',
      'Missing or pointing at localhost in production. Canonical URLs, sitemaps and ' +
        'structured data will be wrong.'
    );
  }

  // --- LLM key ---------------------------------------------------------------
  if (!(env.GEMINI_API_KEY || '').trim()) {
    warn('GEMINI_API_KEY', 'Not set. The grounded assistant will be unavailable.');
  }

  return issues;
}

/**
 * Throws if any fatal issue exists. Call this from server startup paths.
 */
export function assertEnvironmentIsSafe(env: NodeJS.ProcessEnv = process.env): void {
  const issues = validateEnvironment(env);
  const fatalIssues = issues.filter((i) => i.severity === 'fatal');

  for (const issue of issues) {
    const label = issue.severity === 'fatal' ? 'FATAL' : 'WARN';
    console.error(`[env-check][${label}] ${issue.variable}: ${issue.message}`);
  }

  if (fatalIssues.length > 0) {
    throw new Error(
      `Refusing to start: ${fatalIssues.length} fatal environment misconfiguration(s). ` +
        `See the [env-check][FATAL] lines above.`
    );
  }
}
