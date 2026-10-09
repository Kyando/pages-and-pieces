/**
 * Lays out every chapter in scripts/level-specs.ts and writes src/levels/NN-<id>.json.
 *   npm run levels:generate              all chapters
 *   npm run levels:generate -- 3         only the third
 *   npm run levels:generate -- 3 --seed 7  the third, with another layout
 */
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateLevel } from '../src/core/generate.ts';
import { SPECS } from './level-specs.ts';

const dir = join(import.meta.dirname, '..', 'src', 'levels');
const args = process.argv.slice(2);
const seedAt = args.indexOf('--seed');
const seedOffset = seedAt >= 0 ? Number(args.splice(seedAt, 2)[1]) : 0;
const only = args.map(Number).filter(Boolean);

const hash = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

/** Compact JSON: one line per grid row and per word. */
function format(def: object): string {
  return JSON.stringify(def, null, 2)
    .replace(/\[\s+([\d,\s]+?)\s+\]/g, (_, nums: string) => `[${nums.split(/,\s*/).join(', ')}]`);
}

let failed = 0;
SPECS.forEach((spec, i) => {
  const n = i + 1;
  if (only.length && !only.includes(n)) return;
  const prefix = `${String(n).padStart(3, '0')}-`;
  const file = `${prefix}${spec.id}.json`;
  const started = performance.now();
  const def = generateLevel(spec, hash(spec.id) + seedOffset);
  const ms = Math.round(performance.now() - started);
  if (!def) {
    console.error(`✗ ${file}: no valid layout (${ms} ms) — try another --seed`);
    failed++;
    return;
  }
  for (const old of readdirSync(dir)) if (old.startsWith(prefix) && old.endsWith('.json')) rmSync(join(dir, old));
  writeFileSync(join(dir, file), `${format(def)}\n`);
  console.log(`✓ ${file} (${ms} ms)\n${def.grid.map((r) => `    ${r.split('').join(' ')}`).join('\n')}`);
});
process.exit(failed ? 1 : 0);
