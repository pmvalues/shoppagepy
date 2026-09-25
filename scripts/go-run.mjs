import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const defaultWinGo = 'C:\\Program Files\\Go\\bin\\go.exe';
const goCmd = process.platform === 'win32' && existsSync(defaultWinGo) ? defaultWinGo : 'go';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/go-run.mjs <go-subcommand> [args...]');
  process.exit(0);
}

// Production safeguards are the default (an unset SHOPPAGE_ENV is treated as
// production). Local `npm run dev` / `npm test` opt out explicitly unless the
// caller already chose an environment.
const envOverrides = {};
if (!process.env.SHOPPAGE_ENV && (args[0] === 'run' || args[0] === 'test')) {
  envOverrides.SHOPPAGE_ENV = args[0] === 'test' ? 'test' : 'development';
}

const child = spawn(`"${goCmd}"`, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...envOverrides } });
child.on('exit', (code) => {
  process.exit(code ?? 0);
});
child.on('error', (err) => {
  console.error('Failed to run Go command:', err);
  process.exit(1);
});
