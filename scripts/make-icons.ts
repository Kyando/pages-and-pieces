/**
 * Draws the app's icon and splash screens into the Android and iOS projects, and the store icon.
 *   npm run app:icons
 *
 * The mark is a word found on the board: three letter tiles bent into an L over the kraft shape a
 * traced word leaves, on the game's paper. T, T, T: Twice Told Tales.
 */
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const PAPER = '#f5ead6';
const PANEL = '#fffaf1';
const INK = '#3b2b20';
const KRAFT = '#e3c999';
const KRAFT_LINE = '#b9975c';

const woff = readFileSync(join(root, 'node_modules/@fontsource/fraunces/files/fraunces-latin-800-normal.woff'));
const font = opentype.parse(woff.buffer.slice(woff.byteOffset, woff.byteOffset + woff.byteLength));

/** The letter's outline, centred on (cx, cy). */
function letter(char: string, cx: number, cy: number, size: number): string {
  const box = font.getPath(char, 0, 0, size).getBoundingBox();
  return font.getPath(char, cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, size).toPathData(2);
}

/**
 * The mark on a 1024 canvas, `scale` of its natural size around the centre. `background` is the
 * paper behind it: a square, a circle, or nothing (an adaptive icon's foreground).
 */
function mark(scale: number, background: 'square' | 'round' | 'none'): string {
  // The L's weight sits low and left of its box: the drawing is nudged up and right to look centred.
  const tile = 270;
  const gap = 30;
  const step = tile + gap;
  const at = (col: number, row: number) => [227 + col * step, 227 + row * step] as const;
  const cells = [at(0, 0), at(0, 1), at(1, 1)];
  const stroke = 22;
  const r = 46;
  // The traced word's shape: an L running through the tiles' centres, as wide as a tile and a half.
  const half = tile / 2 + 34;
  const [ax, ay] = cells[0].map((v) => v + tile / 2);
  const [, by] = cells[1].map((v) => v + tile / 2);
  const [cx] = cells[2].map((v) => v + tile / 2);
  const trace = `M${ax - half} ${ay - half}H${ax + half}V${by - half}H${cx + half}V${by + half}H${ax - half}Z`;
  const tiles = cells
    .map(
      ([x, y]) => `
      <rect x="${x}" y="${y + 24}" width="${tile}" height="${tile}" rx="${r}" fill="${INK}"/>
      <rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${r}" fill="${PANEL}" stroke="${INK}" stroke-width="${stroke}"/>
      <path d="${letter('T', x + tile / 2, y + tile / 2 + 4, 200)}" fill="${INK}"/>`,
    )
    .join('');
  const paper = { square: `<rect width="1024" height="1024" fill="${PAPER}"/>`, round: `<circle cx="512" cy="512" r="512" fill="${PAPER}"/>`, none: '' }[background];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${paper}
    <g transform="translate(512 512) scale(${scale}) translate(-482 -542)">
      <path d="${trace}" fill="${KRAFT}" stroke="${KRAFT_LINE}" stroke-width="18" stroke-linejoin="round"/>
      ${tiles}
    </g>
  </svg>`;
}

const png = (svgText: string, size: number, out: string, opaque = false) => {
  let img = sharp(Buffer.from(svgText)).resize(size, size);
  if (opaque) img = img.flatten({ background: PAPER });
  return img.png().toFile(out);
};

/** The mark centred on paper, at `size` pixels across, in a w × h picture. */
const splash = async (w: number, h: number, size: number, out: string) =>
  sharp({ create: { width: w, height: h, channels: 3, background: PAPER } })
    .composite([{ input: await sharp(Buffer.from(mark(1, 'none'))).resize(size, size).png().toBuffer(), gravity: 'centre' }])
    .png()
    .toFile(out);

const res = join(root, 'android/app/src/main/res');
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs: Promise<unknown>[] = [];
for (const [d, k] of Object.entries(densities)) {
  const dir = join(res, `mipmap-${d}`);
  // Older Android: the icon comes ready-shaped. Newer: the launcher crops the foreground, which
  // has to keep within the middle 66 of its 108 units.
  jobs.push(png(mark(0.86, 'square'), 48 * k, join(dir, 'ic_launcher.png')));
  jobs.push(png(mark(0.72, 'round'), 48 * k, join(dir, 'ic_launcher_round.png')));
  jobs.push(png(mark(0.68, 'none'), 108 * k, join(dir, 'ic_launcher_foreground.png')));
}
for (const dir of readdirSync(res).filter((d) => d.startsWith('drawable'))) {
  const file = join(res, dir, 'splash.png');
  try {
    const { width = 0, height = 0 } = await sharp(file).metadata();
    jobs.push(splash(width, height, Math.round(Math.min(width, height) * 0.38), file));
  } catch {
    // No splash in this folder.
  }
}

const ios = join(root, 'ios/App/App/Assets.xcassets');
// The App Store refuses an icon with transparency.
jobs.push(png(mark(0.9, 'square'), 1024, join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png'), true));
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) jobs.push(splash(2732, 2732, 560, join(ios, 'Splash.imageset', name)));

mkdirSync(join(root, 'store'), { recursive: true });
jobs.push(png(mark(0.9, 'square'), 512, join(root, 'store/icon-512.png'), true));

await Promise.all(jobs);
console.log(`${jobs.length} pictures drawn`);
