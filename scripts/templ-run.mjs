/**
 * Cross-platform templ task runner.
 *
 *   node scripts/templ-run.mjs           # regenerate templates in every Go service
 *   node scripts/templ-run.mjs --check   # regenerate, then fail if any *_templ.go changed (CI gate)
 *
 * Why this exists: `templ generate` writes progress to stderr, which surfaces as a
 * spurious build failure in some shells and CI log parsers. This wrapper keeps output
 * quiet on success and reports the real exit code.
 *
 * --check semantics: content-hashes every *_templ.go file before and after regeneration.
 * If the hashes differ, the committed templates were stale. This works on a dirty tree
 * (it never compares against HEAD) so a developer with uncommitted template edits gets
 * the correct signal locally and in CI.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEMPL_VERSION = 'v0.3.1020';
const MODULES = ['services/consumer-web', 'services/merchant-os'];
const checkMode = process.argv.includes('--check');

const winGo = 'C:\\Program Files\\Go\\bin\\go.exe';
const goCmd = process.platform === 'win32' && existsSync(winGo) ? winGo : 'go';

function hashGeneratedTemplates() {
  const hash = createHash('sha256');
  for (const moduleDir of MODULES) {
    const dir = join(moduleDir, 'internal', 'templates');
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('_templ.go')).sort()) {
      hash.update(file + ':');
      hash.update(readFileSync(join(dir, file)));
      hash.update('\n');
    }
  }
  return hash.digest('hex');
}

function hasTemplOnPath() {
  const probe = spawnSync('templ', ['version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return probe.status === 0;
}

const usePathBinary = hasTemplOnPath();
const via = usePathBinary ? 'templ (PATH)' : `go run templ@${TEMPL_VERSION}`;
console.log(`[templ] generating in ${MODULES.length} modules via ${via}`);

const before = checkMode ? hashGeneratedTemplates() : null;

for (const moduleDir of MODULES) {
  const result = usePathBinary
    ? spawnSync('templ', ['generate'], { cwd: moduleDir, encoding: 'utf8', shell: process.platform === 'win32' })
    : spawnSync(goCmd, ['run', `github.com/a-h/templ/cmd/templ@${TEMPL_VERSION}`, 'generate'], {
        cwd: moduleDir,
        encoding: 'utf8',
      });

  if (result.status !== 0) {
    console.error(`[templ] FAILED in ${moduleDir}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(result.status ?? 1);
  }
  console.log(`[templ] ok ${moduleDir}`);
}

if (checkMode) {
  const after = hashGeneratedTemplates();
  if (before !== after) {
    console.error('[templ] generated files were stale — regenerate and commit the *_templ.go files');
    process.exit(1);
  }
  console.log('[templ] templates are in sync with their .templ sources');
}

process.exit(0);
