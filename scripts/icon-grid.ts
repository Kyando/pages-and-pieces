/**
 * Draws the icon's letter board as a layer of its own, on a transparent background:
 *   npm run app:grid   → store/icon/grid.svg and grid.png
 *
 * The board is the user's, as drawn: SMART and TALES at the top, READING and FUN below, with
 * gaps where found words have flown off. TALES is being traced. Keep it as it is: this file only
 * draws it. `scripts/make-icons.ts` places it over the portrait.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

/** Each word and its tiles, as [row, column]. */
export const WORDS: [string, [number, number][]][] = [
  ['SMART', [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]]],
  ['TALES', [[1, 1], [1, 2], [2, 2], [2, 3], [3, 3]]],
  ['READING', [[5, 3], [6, 3], [6, 2], [7, 2], [8, 2], [9, 2], [9, 1]]],
  ['FUN', [[7, 3], [8, 3], [9, 3]]],
];
const TRACED = 'TALES';
export const COLS = 4;
export const ROWS = 10;
/** Pixels from one tile to the next in the layer. */
export const PITCH = 256;
/** Room around the board for the traced word's glow and the tiles' shadows. */
export const PAD = PITCH * 0.6;

const root = join(import.meta.dirname, '..');

const grid = new Map<string, string>();
for (const [w, path] of WORDS) path.forEach(([r, c], i) => grid.set(`${r},${c}`, w[i]));

/** In how many places a word can be traced, in any direction: one, for a fair board. */
function places(word: string): number {
  let n = 0;
  const walk = (r: number, c: number, i: number, seen: Set<string>) => {
    const k = `${r},${c}`;
    if (seen.has(k) || grid.get(k) !== word[i]) return;
    if (i === word.length - 1) return void n++;
    seen.add(k);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) walk(r + dr, c + dc, i + 1, seen);
    seen.delete(k);
  };
  for (const k of grid.keys()) {
    const [r, c] = k.split(',').map(Number);
    walk(r, c, 0, new Set());
  }
  return n;
}

const woff = readFileSync(join(root, 'node_modules/@fontsource/fraunces/files/fraunces-latin-800-normal.woff'));
const font = opentype.parse(woff.buffer.slice(woff.byteOffset, woff.byteOffset + woff.byteLength) as ArrayBuffer);
const n2 = (v: number) => v.toFixed(2);

/** The letter's outline centred on (cx, cy), written out in full: librsvg misreads opentype.js's packed number runs. */
function glyph(ch: string, cx: number, cy: number, size: number): string {
  const b = font.getPath(ch, 0, 0, size).getBoundingBox();
  return font
    .getPath(ch, cx - (b.x1 + b.x2) / 2, cy - (b.y1 + b.y2) / 2, size)
    .commands.map((c) =>
      c.type === 'Z' ? 'Z' : c.type === 'Q' ? `Q ${n2(c.x1)} ${n2(c.y1)} ${n2(c.x)} ${n2(c.y)}` : c.type === 'C' ? `C ${n2(c.x1)} ${n2(c.y1)} ${n2(c.x2)} ${n2(c.y2)} ${n2(c.x)} ${n2(c.y)}` : `${c.type} ${n2(c.x)} ${n2(c.y)}`,
    )
    .join(' ');
}

export function gridSvg(): string {
  const T = PITCH;
  const gap = T * 0.05;
  const size = T - gap;
  const rx = T * 0.13;
  const pos = ([r, c]: [number, number]) => [PAD + c * T + gap / 2, PAD + r * T + gap / 2];
  const traced = WORDS.find(([w]) => w === TRACED)![1];
  const isTraced = (k: string) => traced.some((p) => p.join(',') === k);

  // Aged ivory paper with a little grain, warm brown ink and a gold edge, to sit in the painting.
  const tile = (p: [number, number], ch: string) => {
    const [x, y] = pos(p);
    const on = isTraced(p.join(','));
    return `
    <rect x="${x}" y="${y + T * 0.05}" width="${size}" height="${size}" rx="${rx}" fill="#2a120c" opacity="0.55" filter="url(#soft)"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="url(#${on ? 'gold' : 'ivory'})"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="url(#grain)" opacity="0.35"/>
    <rect x="${x + T * 0.02}" y="${y + T * 0.02}" width="${size - T * 0.04}" height="${size - T * 0.04}" rx="${rx - T * 0.02}" fill="none" stroke="${on ? '#fff3c4' : '#fffaf0'}" stroke-width="${T * 0.025}" opacity="0.9"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="none" stroke="${on ? '#9a4a14' : '#b08850'}" stroke-width="${T * 0.03}"/>
    <path d="${glyph(ch, x + size / 2, y + size / 2 + T * 0.01, T * 0.6)}" fill="#3a2418"/>`;
  };

  // The traced word glows softly behind its gold tiles.
  const band = 'M' + traced.map((p) => pos(p).map((v) => n2(v + size / 2)).join(' ')).join(' L');
  const W = COLS * T + 2 * PAD;
  const H = ROWS * T + 2 * PAD;
  const cells = [...grid] as [string, string][];
  const at = (k: string) => k.split(',').map(Number) as [number, number];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ivory" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fcf3e0"/><stop offset="0.6" stop-color="#f1e1c0"/><stop offset="1" stop-color="#e2c99c"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#ffd978"/><stop offset="0.55" stop-color="#f4a838"/><stop offset="1" stop-color="#d9761f"/></linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${T * 0.05}"/></filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${T * 0.12}"/></filter>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="${0.9 * (105 / T)}" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 0.5 0"/></filter>
    <pattern id="grain" width="${W}" height="${H}" patternUnits="userSpaceOnUse"><rect width="${W}" height="${H}" filter="url(#noise)"/></pattern>
  </defs>
  <path d="${band}" fill="none" stroke="#ffd36b" stroke-width="${T * 1.6}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" filter="url(#glow)"/>
  ${cells.filter(([k]) => !isTraced(k)).map(([k, ch]) => tile(at(k), ch)).join('')}
  ${traced.map((p) => tile(p, grid.get(p.join(','))!)).join('')}
</svg>`;
}

if (import.meta.main) {
  for (const [w] of WORDS) if (places(w) !== 1) console.warn(`note: ${w} can be traced in ${places(w)} places`);
  const dir = join(root, 'store/icon');
  mkdirSync(dir, { recursive: true });
  const svg = gridSvg();
  writeFileSync(join(dir, 'grid.svg'), svg);
  await sharp(Buffer.from(svg)).png().toFile(join(dir, 'grid.png'));
  console.log('store/icon/grid.svg, grid.png');
}
