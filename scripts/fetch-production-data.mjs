#!/usr/bin/env node
// Production boot helper: ensures sqlite datasets exist before `next start`.
// Downloads each missing file ONCE (into the persistent volume path) and never
// blocks boot: any failure degrades to seed-fallback mode with exit code 0.
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { get } from 'node:https';
import { inflateRawSync } from 'node:zlib';

const APP_ROOT = process.cwd();

const FILES = [
  {
    env: 'SHOPPAGE_DATA_URL_DISCOVERED',
    fallback:
      'https://github.com/pmvalues/shoppagepy/releases/download/data-v1/sa_discovered_offers.sqlite.zip',
    dest: 'shoppage-commerce-intelligence-foundation/data/study/sa_discovered_offers.sqlite',
  },
  {
    env: 'SHOPPAGE_DATA_URL_MALLS',
    fallback:
      'https://github.com/pmvalues/shoppagepy/releases/download/data-v1/sa_malls_and_shopping_centres.sqlite.zip',
    dest: 'shoppage-commerce-intelligence-foundation/data/study/sa_malls_and_shopping_centres.sqlite',
  },
];

export async function unzipSingle(zipPath, destPath) {
  const buf = await readFile(zipPath);
  let eocd = -1;
  const scanFrom = Math.max(0, buf.length - 22 - 65557);
  for (let i = buf.length - 22; i >= scanFrom; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const cdCount = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdCount < 1) throw new Error('empty zip');
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) throw new Error('bad zip directory');
  const method = buf.readUInt16LE(cdOffset + 10);
  const compSize = buf.readUInt32LE(cdOffset + 24);
  const localOffset = buf.readUInt32LE(cdOffset + 42);
  if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('bad zip entry');
  const lhNameLen = buf.readUInt16LE(localOffset + 26);
  const lhExtraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
  const comp = buf.subarray(dataStart, dataStart + compSize);
  let raw;
  if (method === 0) raw = comp;
  else if (method === 8) raw = inflateRawSync(comp);
  else throw new Error('unsupported zip method ' + method);
  await writeFile(destPath, raw);
}

function fetchToFile(url, dest, redirects = 0) {
  return new Promise((resolveP, reject) => {
    if (redirects > 5) {
      reject(new Error('too many redirects'));
      return;
    }
    get(url, { headers: { 'User-Agent': 'ShoppageProdBoot/1.0' } }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        fetchToFile(next, dest, redirects + 1).then(resolveP, reject);
        return;
      }
      if (status !== 200) {
        res.resume();
        reject(new Error('HTTP ' + status));
        return;
      }
      const out = createWriteStream(dest + '.part');
      res.pipe(out);
      out.on('finish', () => out.close(resolveP));
      out.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function ensureFile(entry) {
  const dest = resolve(APP_ROOT, entry.dest);
  try {
    const st = await stat(dest);
    if (st.size > 1024) {
      console.log('[data] present: ' + entry.dest);
      return;
    }
  } catch {
    // missing -> download below
  }
  const url = (process.env[entry.env] || entry.fallback || '').trim();
  if (!url) {
    console.log('[data] no URL configured, skipping ' + entry.dest);
    return;
  }
  await mkdir(dirname(dest), { recursive: true });
  const zipTmp = dest + '.zip';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log('[data] downloading (attempt ' + attempt + '/3): ' + entry.dest);
      await fetchToFile(url, zipTmp);
      await rename(zipTmp + '.part', zipTmp);
      const zs = await stat(zipTmp);
      if (zs.size < 1024) throw new Error('download too small, likely an error page');
      await unzipSingle(zipTmp, dest);
      const st = await stat(dest);
      if (st.size < 1024) throw new Error('extracted file too small');
      try {
        await unlink(zipTmp);
      } catch {
        // ignore cleanup errors
      }
      console.log('[data] ready: ' + entry.dest);
      return;
    } catch (err) {
      console.log('[data] attempt failed: ' + (err && err.message ? err.message : err));
      for (const tmp of [zipTmp, zipTmp + '.part', dest]) {
        try {
          await unlink(tmp);
        } catch {
          // ignore cleanup errors
        }
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.log('[data] giving up on ' + entry.dest + ' - booting without it (degraded mode)');
}

async function main() {
  for (const entry of FILES) {
    try {
      await ensureFile(entry);
    } catch (err) {
      console.log('[data] skipping ' + entry.dest + ': ' + (err && err.message ? err.message : err));
    }
  }
}

const isMain =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().then(
    () => process.exit(0),
    () => process.exit(0),
  );
}
