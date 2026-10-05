/**
 * Downloads the books' illustrations into public/art/, so the game serves its own pictures:
 * - Pride and Prejudice: Hugh Thomson's 1894 edition, complete, from Project Gutenberg (ebook
 *   #1342, the illustrated HTML edition): every plate and chapter heading, and his illustrated
 *   initials; and the Thomson and C. E. Brock (1895) scans on Wikimedia Commons, which the first
 *   levels were made with (their crops are measured on these files);
 * - Alice's Adventures in Wonderland: John Tenniel's 42 drawings, and the 20 he coloured for The
 *   Nursery "Alice" (1890), scans on Wikimedia Commons;
 * - The Three Little Pigs: L. Leslie Brooke's 1904 picture book, from Project Gutenberg (#18155).
 * Only public-domain files are kept. public/art/catalog.json records each file's chapter, caption
 * and source.
 *   npm run art:fetch              every source
 *   npm run art:fetch -- tenniel   only some (see SOURCES)
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const out = join(root, 'public', 'art');
const UA = { 'User-Agent': 'twice-told-tales/0.1 (https://github.com/Kyando/twice-told-tales; public-domain illustrations)' };
/** Longest side kept: sharp on a phone's screen, light enough to ship. */
const MAX = 1600;

interface Entry {
  file: string;
  artist: string;
  edition: string;
  /** The chapter the picture belongs to (0: before the first). */
  chapter: number | null;
  caption: string;
  kind: 'plate' | 'heading' | 'initial' | 'scan';
  source: string;
  license: string;
}

const catalog: Entry[] = [];
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetches politely: on "too many requests", waits as asked (or a little longer each time) and tries again. */
async function download(url: string): Promise<Buffer> {
  for (let tries = 0; ; tries++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if ((r.status !== 429 && r.status < 500) || tries >= 6) throw new Error(`${url}: ${r.status}`);
    await pause(Number(r.headers.get('retry-after') ?? 0) * 1000 || 2000 * 2 ** tries);
  }
}
const roman = (s: string) => {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let n = 0;
  for (let i = 0; i < s.length; i++) n += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]];
  return n;
};
const text = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\[[^\]]*\]/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

async function save(input: Buffer, file: string, png = false): Promise<void> {
  mkdirSync(join(out, file, '..'), { recursive: true });
  const img = sharp(input).resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  if (png) await img.png({ compressionLevel: 9 }).toFile(join(out, file));
  else await img.flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true }).toFile(join(out, file));
}

// ── Thomson, 1894, complete (Project Gutenberg) ───────────────────────────────

async function gutenberg(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'pp-gutenberg-'));
  try {
    const zip = join(dir, 'pg1342-h.zip');
    writeFileSync(zip, await download('https://www.gutenberg.org/cache/epub/1342/pg1342-h.zip'));
    try {
      execSync(`unzip -q "${zip}" -d "${dir}"`);
    } catch {
      execSync(`tar -xf "${zip}" -C "${dir}"`);
    }
    const htmlName = readdirSync(dir).find((f) => f.endsWith('.html')) ?? '';
    const base = htmlName ? dir : join(dir, readdirSync(dir).find((f) => existsSync(join(dir, f, 'images'))) ?? '');
    const html = readFileSync(join(base, readdirSync(base).find((f) => f.endsWith('.html'))!), 'utf8');

    // Walk the book in order: a chapter's anchor starts it; its heading picture follows the anchor.
    const re = /<a id="CHAPTER_([IVXLC]+)"><\/a>|<img[^>]*src="images\/([^"]+)"[^>]*>(?=([\s\S]{0,600}))/gi;
    let chapter = 0;
    const seen = new Set<string>();
    for (let m; (m = re.exec(html)); ) {
      if (m[1]) {
        chapter = roman(m[1].toUpperCase());
        continue;
      }
      const name = m[2];
      if (seen.has(name) || name === 'cover.jpg') continue;
      seen.add(name);
      const after = m[3];
      const cap = after.match(/class="caption"[^>]*>([\s\S]*?)<\/(?:span|div)>\s*(?:<\/div>)?/i)?.[1] ?? '';
      const initial = /_b\.png$/.test(name);
      const plate = /^i_\d+\.jpg$/.test(name);
      const kind: Entry['kind'] = initial ? 'initial' : plate ? 'plate' : 'heading';
      const ch = String(chapter).padStart(2, '0');
      const file = initial ? `thomson-1894/initials/ch${ch}-${name}` : `thomson-1894/ch${ch}-${name.replace(/\.png$/, '.jpg')}`;
      await save(readFileSync(join(base, 'images', name)), file, initial);
      catalog.push({
        file,
        artist: 'Hugh Thomson',
        edition: 'Pride and Prejudice, George Allen, 1894',
        chapter,
        caption: text(cap).replace(/^“|”$|^"|"$/g, '').replace(/\.$/, ''),
        kind,
        source: `https://www.gutenberg.org/ebooks/1342 (images/${name})`,
        license: 'Public domain',
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ── Thomson and Brock scans (Wikimedia Commons) ────────────────────────────────

const strip = (v?: { value: string }) => text(v?.value ?? '');

async function commons(category: string, folder: string, artist: string, edition: string): Promise<void> {
  const pages: Record<string, { title: string; imageinfo?: { url: string; thumburl?: string; extmetadata?: Record<string, { value: string }> }[] }> = {};
  let cont: Record<string, string> = {};
  for (;;) {
    const q = new URLSearchParams({
      action: 'query', generator: 'categorymembers', gcmtitle: `Category:${category}`, gcmlimit: '500', gcmtype: 'file',
      prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(MAX), format: 'json', ...cont,
    });
    const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA })).json();
    for (const p of Object.values(j.query.pages) as (typeof pages)[string][]) {
      pages[p.title] ??= p;
      if (p.imageinfo) pages[p.title].imageinfo = p.imageinfo;
    }
    if (!j.continue) break;
    cont = j.continue;
  }
  for (const p of Object.values(pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const license = strip(ii.extmetadata?.LicenseShortName);
    // A modern photograph of the book, under a share-alike licence: not ours to ship.
    if (license !== 'Public domain') continue;
    const name = p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
    const file = `${folder}/${slug(name.replace(/^Illustration by C E Brock for Pride and Prejudice - /, ''))}.jpg`;
    await save(await download(ii.thumburl ?? ii.url), file);
    catalog.push({
      file,
      artist,
      edition,
      chapter: null,
      caption: strip(ii.extmetadata?.ObjectName) || name,
      kind: 'scan',
      // Without Commons' tracking parameters.
      source: ii.url.replace(/\?.*$/, ''),
      license,
    });
    await pause(1000);
  }
}

// ── Tenniel, 1865 (Wikimedia Commons) ──────────────────────────────────────────

/**
 * John Tenniel's 42 drawings for Alice's Adventures in Wonderland, from the clean scans of the 1869
 * German edition (Macmillan printed it from the same woodblocks), in the book's order.
 */
async function tenniel(): Promise<void> {
  const titles = Array.from({ length: 42 }, (_, i) => `File:De Alice's Abenteuer im Wunderland Carroll pic ${String(i + 1).padStart(2, '0')}.jpg`);
  for (let i = 0; i < titles.length; i += 20) {
    const q = new URLSearchParams({
      action: 'query', titles: titles.slice(i, i + 20).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(MAX), format: 'json',
    });
    const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA })).json();
    const pages = Object.values(j.query.pages) as { title: string; imageinfo?: { url: string; thumburl?: string; extmetadata?: Record<string, { value: string }> }[] }[];
    for (const p of pages.sort((a, b) => a.title.localeCompare(b.title))) {
      const ii = p.imageinfo?.[0];
      if (!ii || strip(ii.extmetadata?.LicenseShortName) !== 'Public domain') continue;
      const n = p.title.match(/pic (\d+)/)![1];
      const file = `tenniel-1865/alice-${n}.jpg`;
      await save(await download(ii.thumburl ?? ii.url), file);
      catalog.push({
        file,
        artist: 'John Tenniel',
        edition: 'Alice’s Adventures in Wonderland, Macmillan, 1865 (the woodblocks as reprinted in 1869)',
        chapter: null,
        caption: '',
        kind: 'plate',
        source: ii.url.replace(/\?.*$/, ''),
        license: 'Public domain',
      });
      await pause(1500);
    }
  }
}

// ── The Nursery "Alice", 1890 (Wikimedia Commons) ──────────────────────────────

/**
 * Twenty of Tenniel's drawings, enlarged and coloured under his eye for Carroll's own retelling for
 * small children: the whole scans of its plates (not the cropped copies), and the British Library's
 * White Rabbit (CC0).
 */
async function nurseryAlice(): Promise<void> {
  const q = new URLSearchParams({
    action: 'query', generator: 'categorymembers', gcmtitle: 'Category:The_Nursery_Alice_(1890)', gcmtype: 'file', gcmlimit: '100',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(MAX), format: 'json',
  });
  const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA })).json();
  const pages = Object.values(j.query.pages) as { title: string; imageinfo?: { url: string; thumburl?: string; extmetadata?: Record<string, { value: string }> }[] }[];
  for (const p of pages.sort((a, b) => a.title.localeCompare(b.title))) {
    const ii = p.imageinfo?.[0];
    const plate = p.title.match(/The Nursery Alice \(1890\) - ([\w ]+)\.jpg$/)?.[1];
    const rabbit = /White Rabbit \(Tenniel\) - The Nursery Alice/.test(p.title);
    if (!ii || (!plate && !rabbit)) continue;
    const license = strip(ii.extmetadata?.LicenseShortName);
    if (license !== 'Public domain' && license !== 'CC0') continue;
    const file = `nursery-alice-1890/${rabbit ? 'white-rabbit' : slug(plate!)}.jpg`;
    await save(await download(ii.thumburl ?? ii.url), file);
    catalog.push({
      file,
      artist: 'John Tenniel',
      edition: 'The Nursery “Alice”, Macmillan, 1890',
      chapter: null,
      caption: '',
      kind: 'plate',
      source: ii.url.replace(/\?.*$/, ''),
      license,
    });
    await pause(1500);
  }
}

// ── L. Leslie Brooke, 1904 (Project Gutenberg) ─────────────────────────────────

/** Every picture in The Story of the Three Little Pigs (Warne, 1904; ebook #18155), with its caption. */
async function brooke(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'pigs-gutenberg-'));
  try {
    const zip = join(dir, 'pg18155-h.zip');
    writeFileSync(zip, await download('https://www.gutenberg.org/cache/epub/18155/pg18155-h.zip'));
    try {
      execSync(`unzip -q "${zip}" -d "${dir}"`);
    } catch {
      execSync(`tar -xf "${zip}" -C "${dir}"`);
    }
    const html = readFileSync(join(dir, readdirSync(dir).find((f) => f.endsWith('.html'))!), 'utf8');
    for (const m of html.matchAll(/<img alt="([^"]*)" src="images\/([^"]+)"/g)) {
      const [, caption, name] = m;
      if (/cover|inside/.test(name)) continue;
      const file = `brooke-1904/${name.replace(/^img/, 'pigs-')}`;
      await save(readFileSync(join(dir, 'images', name)), file);
      catalog.push({
        file,
        artist: 'L. Leslie Brooke',
        edition: 'The Story of the Three Little Pigs, Frederick Warne, 1904',
        chapter: null,
        caption,
        kind: /plate/.test(name) ? 'plate' : 'heading',
        source: `https://www.gutenberg.org/ebooks/18155 (images/${name})`,
        license: 'Public domain',
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Each source and the folders it fills. `npm run art:fetch -- tenniel` fetches only that one again,
 * keeping the others' files and catalog entries.
 */
const SOURCES: Record<string, { folders: string[]; fetch: () => Promise<void> }> = {
  thomson: {
    folders: ['thomson-1894'],
    fetch: async () => {
      await gutenberg();
      await commons('Pride_and_Prejudice_(Hugh_Thomson)', 'thomson-1894/commons', 'Hugh Thomson', 'Pride and Prejudice, George Allen, 1894');
    },
  },
  brock: { folders: ['brock-1895'], fetch: () => commons('Pride_and_Prejudice_(C.E._Brock)', 'brock-1895', 'C. E. Brock', 'Pride and Prejudice, Macmillan, 1895') },
  tenniel: { folders: ['tenniel-1865'], fetch: tenniel },
  nursery: { folders: ['nursery-alice-1890'], fetch: nurseryAlice },
  brooke: { folders: ['brooke-1904'], fetch: brooke },
};

const chosen = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SOURCES);
const unknown = chosen.filter((s) => !SOURCES[s]);
if (unknown.length) throw new Error(`unknown source ${unknown.join(', ')}: pick from ${Object.keys(SOURCES).join(', ')}`);
const folders = chosen.flatMap((s) => SOURCES[s].folders);
const listed = join(out, 'catalog.json');
// The other sources' pictures stay as they are.
if (existsSync(listed)) {
  catalog.push(...(JSON.parse(readFileSync(listed, 'utf8')) as Entry[]).filter((e) => !folders.some((f) => e.file.startsWith(`${f}/`))));
}
for (const f of folders) rmSync(join(out, f), { recursive: true, force: true });
for (const s of chosen) await SOURCES[s].fetch();
writeFileSync(listed, JSON.stringify(catalog, null, 1) + '\n');
console.log(`${catalog.length} pictures in public/art`);
