import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const defaultWinGo = 'C:\\Program Files\\Go\\bin\\go.exe';
const goCmd = process.platform === 'win32' && existsSync(defaultWinGo) ? defaultWinGo : 'go';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/go-run.mjs <go-subcommand> [args...]');
  process.exit(0);
}

const child = spawn(`"${goCmd}"`, args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => {
  process.exit(code ?? 0);
});
child.on('error', (err) => {
  console.error('Failed to run Go command:', err);
  process.exit(1);
});
