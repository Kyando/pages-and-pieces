/**
 * Makes the app's icon, and from it every size the Android and iOS projects need, the splash
 * screens and the store icon.
 *   npm run app:icons
 *
 * The icon is two pieces kept apart: the portrait (`store/icon/portrait.*`, a painting with
 * nothing on it) and the letter board (`store/icon/grid.png`, from `npm run app:grid`). The board
 * is placed over the portrait by hand, with PLACEMENT below.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { PAD, PITCH } from './icon-grid.ts';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'store/icon');
const S = 1024;

/**
 * Where the board sits on the 1024 × 1024 icon: the top-left corner of its first tile, and the
 * distance from one tile to the next. As drawn, it runs into the top, right and bottom edges.
 */
const PLACEMENT = { x: +(process.env.X ?? 576), y: +(process.env.Y ?? 0), pitch: +(process.env.P ?? 112) };

const PAPER = '#f5ead6';

const portraitFile = readdirSync(dir).find((f) => /^portrait\.(png|jpe?g|webp)$/.test(f));
if (!portraitFile) throw new Error('store/icon/portrait.png (or .jpg) is missing');
const portrait = await sharp(join(dir, portraitFile)).resize(S, S, { fit: 'cover' }).png().toBuffer();

/** The portrait, filling the square, with the board laid over it. */
async function compose(): Promise<Buffer> {
  const k = PLACEMENT.pitch / PITCH;
  const grid = sharp(join(dir, 'grid.png'));
  const { width = 0, height = 0 } = await grid.metadata();
  const layer = await grid.resize(Math.round(width * k), Math.round(height * k)).png().toBuffer();
  // The board may run past the edges: lay it on a canvas wide enough for it, then cut the square out.
  const left = Math.round(PLACEMENT.x - PAD * k);
  const top = Math.round(PLACEMENT.y - PAD * k);
  const m = Math.ceil(Math.max(width, height) * k);
  const big = await sharp({ create: { width: S + 2 * m, height: S + 2 * m, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: portrait, left: m, top: m },
      { input: layer, left: m + left, top: m + top },
    ])
    .png()
    .toBuffer();
  return sharp(big).extract({ left: m, top: m, width: S, height: S }).flatten({ background: PAPER }).png().toBuffer();
}

const icon = await compose();
await sharp(icon).toFile(join(dir, 'icon-1024.png'));

/** The icon at `size`, square or cut to a circle. */
const sized = (size: number, shape: 'square' | 'round' = 'square') => {
  const img = sharp(icon).resize(size, size);
  if (shape === 'square') return img.png();
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
  return img.composite([{ input: mask, blend: 'dest-in' }]).png();
};

/** The icon with rounded corners, centred on paper: the splash screens. */
async function splash(w: number, h: number, size: number, out: string) {
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}"/></svg>`);
  const art = await sharp(icon).resize(size, size).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 3, background: PAPER } }).composite([{ input: art, gravity: 'centre' }]).png().toFile(out);
}

const res = join(root, 'android/app/src/main/res');
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs: Promise<unknown>[] = [];
for (const [d, k] of Object.entries(densities)) {
  const out = join(res, `mipmap-${d}`);
  jobs.push(sized(48 * k).toFile(join(out, 'ic_launcher.png')));
  jobs.push(sized(48 * k, 'round').toFile(join(out, 'ic_launcher_round.png')));
  // Newer Android shows the middle 72 of the foreground's 108 units, cut to the launcher's shape:
  // the whole icon goes in that middle, over the portrait's own background colour.
  const fg = 108 * k;
  jobs.push(
    sized(Math.round(72 * k))
      .toBuffer()
      .then((b) => sharp({ create: { width: fg, height: fg, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: b, gravity: 'centre' }]).png().toFile(join(out, 'ic_launcher_foreground.png'))),
  );
}
// That colour: the portrait's left edge, the side the board leaves bare.
const { dominant } = await sharp(portrait).extract({ left: 0, top: 0, width: 40, height: S }).stats();
const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
writeFileSync(join(res, 'values/ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${hex}</color>\n</resources>\n`);

for (const d of readdirSync(res).filter((f) => f.startsWith('drawable'))) {
  const file = join(res, d, 'splash.png');
  try {
    const { width = 0, height = 0 } = await sharp(file).metadata();
    jobs.push(splash(width, height, Math.round(Math.min(width, height) * 0.38), file));
  } catch {
    // No splash in this folder.
  }
}

const ios = join(root, 'ios/App/App/Assets.xcassets');
// The App Store refuses an icon with transparency; iOS rounds the corners itself.
jobs.push(sized(1024).toFile(join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png')));
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) jobs.push(splash(2732, 2732, 560, join(ios, 'Splash.imageset', name)));

mkdirSync(join(root, 'store'), { recursive: true });
jobs.push(sized(512).toFile(join(root, 'store/icon-512.png')));

await Promise.all(jobs);
console.log(`store/icon/icon-1024.png and ${jobs.length} app pictures (Android icon background ${hex})`);
