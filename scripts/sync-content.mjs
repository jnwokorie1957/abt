import { copyFileSync, readFileSync } from 'node:fs';
const source = new URL('../src/content.json', import.meta.url);
const target = new URL('../mobile/src/content.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(source, 'utf8') !== readFileSync(target, 'utf8')) {
    throw new Error('Mobile content is out of date. Run node scripts/sync-content.mjs.');
  }
} else copyFileSync(source, target);
