/**
 * What both paper prototypes share: the options (how much help a page gives), the grid, the scene
 * with its blanks, the rules and the toolbar. print.html lays them out as A4 sheets, book.html as
 * the spreads of a bound book.
 */
import { BOOKS } from '../core/books.ts';
import type { Puzzle, Word } from '../core/puzzle.ts';
import type { LevelDef } from '../core/types.ts';
import { CATALOG, type CatalogEntry } from '../levels/catalog.ts';
import { roman } from '../ui/desk.ts';
import { h } from '../ui/dom.ts';
import { loadPicture } from '../ui/picture.ts';

export const GAME = 'Twice Told Tales';
export const URL_TEXT = 'kyando.github.io/twice-told-tales';

export type ListPlace = 'above' | 'foot' | 'back';

/**
 * How much help each page gives, kept in the URL so every printed version has its own address:
 *   ?levels=1-4&list=above|foot|back&given=1&firsts=1&dots=1
 * - list: the words to find shown, upside down at the foot of the page, or only at the back;
 * - given: one word per scene (the longest) already written in, its cells shaded on the grid;
 * - firsts: the first letter of every word written in on its first line;
 * - dots: a dot on the grid where each word starts.
 */
export interface Options {
  levels: string;
  /** The book's page size (book.html only): A5, a spread to an A4 sheet; or 19 × 23.5 cm. */
  size: 'a5' | 'large';
  list: ListPlace;
  given: boolean;
  firsts: boolean;
  dots: boolean;
}

export function readOptions(): Options {
  const q = new URLSearchParams(location.search);
  const list = q.get('list');
  return {
    levels: q.get('levels') ?? '1-4',
    size: q.get('size') === 'large' ? 'large' : 'a5',
    list: list === 'foot' || list === 'back' ? list : 'above',
    given: q.get('given') === '1',
    firsts: q.get('firsts') === '1',
    dots: q.get('dots') === '1',
  };
}

export function optionsQuery(o: Options): string {
  const q = new URLSearchParams({ levels: o.levels, list: o.list });
  if (o.given) q.set('given', '1');
  if (o.firsts) q.set('firsts', '1');
  if (o.dots) q.set('dots', '1');
  if (o.size === 'large') q.set('size', 'large');
  return `?${q}`;
}

/** The chapters to print, from levels=first-last (1-based). */
export function chosen(levels: string): CatalogEntry[] {
  const m = levels.match(/^(\d+)(?:-(\d+))?$/);
  const first = m ? Math.max(1, Number(m[1])) : 1;
  const last = m ? Number(m[2] ?? m[1]) : 4;
  return CATALOG.slice(first - 1, Math.max(first, last));
}

/** The word written in for the player: the longest, which also clears the most of the grid. */
export const givenWord = (p: Puzzle): Word => p.words.reduce((best, w) => (w.text.length > best.text.length ? w : best));

export const sortedWords = (p: Puzzle): string[] => p.words.map((w) => w.text).sort();

interface GridOptions {
  /** Fence off every word, like a mosaic. */
  solved?: boolean;
  /** Cells already solved for the player: shaded and fenced. */
  given?: number[];
  dots?: boolean;
}

/** A grid of letters, with each word's region (or just the given one) fenced off by a thick line. */
export function grid(p: Pick<Puzzle, 'rows' | 'cols' | 'letters'> & { words: { path: number[] }[] }, cellMm: number, o: GridOptions = {}): HTMLElement {
  const owner = new Array<number>(p.rows * p.cols).fill(-1);
  if (o.solved) p.words.forEach((w, i) => w.path.forEach((c) => (owner[c] = i)));
  else o.given?.forEach((c) => (owner[c] = 0));
  const firsts = new Set(p.words.map((w) => w.path[0]));
  const el = h('div', { class: `grid${o.solved ? ' is-solved' : ''}`, style: `--cols: ${p.cols}; --rows: ${p.rows}; --cell: ${cellMm}mm` });
  for (let cell = 0; cell < p.rows * p.cols; cell++) {
    const r = Math.floor(cell / p.cols);
    const c = cell % p.cols;
    const fenced = owner[cell] >= 0;
    const side = (other: number, inside: boolean) => (fenced && (!inside || owner[other] !== owner[cell]) ? 'var(--fence)' : 'var(--line)');
    const style = `border-top: ${side(cell - p.cols, r > 0)}; border-left: ${side(cell - 1, c > 0)}; border-bottom: ${side(cell + p.cols, r < p.rows - 1)}; border-right: ${side(cell + 1, c < p.cols - 1)}`;
    const cls = ['cell', o.dots && firsts.has(cell) && !(o.given ?? []).includes(cell) ? 'is-first' : '', !o.solved && fenced ? 'is-given' : ''];
    el.append(h('div', { class: cls.filter(Boolean).join(' '), style }, p.letters[cell]));
  }
  return el;
}

/**
 * The scene, with each hidden word as a writing line per letter, or (`answers`) printed in place.
 * Help comes as letters already written in: a whole word, or every word's first letter.
 */
export function passage(text: string, o: { answers?: boolean; given?: string; firsts?: boolean } = {}): HTMLElement {
  const el = h('p', { class: 'scene' });
  for (const [i, part] of text.split(/\{([A-Z]+)\}/).entries()) {
    if (i % 2 === 0) el.append(part);
    else if (o.answers) el.append(h('strong', { class: 'found' }, part.toLowerCase()));
    else {
      const whole = part === o.given;
      // An empty line still holds a non-breaking space, so every line sits on the text's baseline.
      const lines = [...part].map((letter, j) => h('i', {}, whole || (o.firsts && j === 0) ? letter : ' '));
      el.append(h('span', { class: `blank${whole ? ' is-given' : ''}`, 'aria-label': `${part.length} letters` }, ...lines));
    }
  }
  return el;
}

export function chapterHead(entry: CatalogEntry): HTMLElement {
  const { def } = entry;
  const book = BOOKS[def.book];
  const volume = [...(book.volumes ?? [])].reverse().find((v) => def.chapter >= v.from);
  return h(
    'header',
    { class: 'chapter-head' },
    h('p', { class: 'eyebrow' }, `${book.title}${volume ? ` · ${volume.name}: ${volume.title}` : ''}`),
    h('p', { class: 'chapter-no' }, `Chapter ${roman(def.chapter)}`),
    h('h2', {}, def.title),
  );
}

/** The words to find, as a list with tick boxes (the given one already ticked). */
export function wordList(entry: CatalogEntry, o: Options): HTMLElement {
  const given = o.given ? givenWord(entry.puzzle).text : null;
  const words = sortedWords(entry.puzzle);
  return o.list === 'above'
    ? h(
        'div',
        { class: 'find' },
        h('p', { class: 'label' }, `Find these ${words.length} words`),
        h('ul', { class: 'words' }, ...words.map((w) => h('li', {}, h('span', { class: `tick${w === given ? ' is-ticked' : ''}` }), w))),
      )
    : h('div', { class: 'find is-quiet' }, h('p', { class: 'label' }, `${words.length} words to find`));
}

/** The list for when you're stuck, printed upside down so reading it is a choice. */
export const upsideList = (entry: CatalogEntry): HTMLElement =>
  h('p', { class: 'upside' }, h('b', {}, 'Stuck? The words: '), sortedWords(entry.puzzle).join(' · '));

/**
 * A scanned drawing as ink alone: its paper becomes transparent, so on a tinted page the drawing
 * sits on that page's own paper, as if printed there, instead of on a white rectangle.
 */
export async function inkOnly(source: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(source);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    // How dark the scan is here: the paper's off-white counts as none, the ink's black as all.
    const dark = 1 - (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    d[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (dark - 0.06) / 0.7)));
    d[i] = 0x1d;
    d[i + 1] = 0x17;
    d[i + 2] = 0x12;
  }
  ctx.putImageData(image, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('ink failed'))), 'image/png'));
}

/** An image of ours shown as ink only (see inkOnly), or as it is if that fails. */
export function inkImage(src: string, attrs: Record<string, string> = {}): HTMLImageElement {
  const img = h('img', { ...attrs, alt: attrs.alt ?? '' });
  fetch(src)
    .then((r) => r.blob())
    .then(inkOnly)
    .then((blob) => (img.src = URL.createObjectURL(blob)))
    .catch(() => (img.src = src));
  return img;
}

/** The chapter's illustration, trimmed to the drawing (and whitened, for a scanned page); with `ink`, without its paper. */
export function plate(def: LevelDef, ink = false): HTMLImageElement {
  const img = h('img', { class: 'plate', alt: def.story.caption });
  loadPicture(def.story.image, def.story.crop)
    .then((blob) => (ink ? inkOnly(blob) : blob))
    .then((blob) => (img.src = URL.createObjectURL(blob)))
    .catch(() => (img.src = def.story.image));
  return img;
}

export const caption = (def: LevelDef): HTMLElement =>
  h('figcaption', {}, h('span', { class: 'caption' }, def.story.caption), h('span', { class: 'credit' }, def.story.credit));

/** The version printed, in words, so testers' copies can be told apart. */
export function versionName(o: Options): string {
  const list = { above: 'word list shown', foot: 'word list upside down', back: 'word list at the back' }[o.list];
  return [list, o.given ? 'one word given' : '', o.firsts ? 'first letters' : '', o.dots ? 'start dots' : ''].filter(Boolean).join(' · ');
}

/** A tiny solved example: three words, two of them bent. */
export const EXAMPLE = {
  rows: 3,
  cols: 4,
  letters: 'STOROOKYBPEN',
  words: [
    { text: 'STORY', path: [0, 1, 2, 3, 7] },
    { text: 'BOOK', path: [8, 4, 5, 6] },
    { text: 'PEN', path: [9, 10, 11] },
  ],
};

/** The rules, worded for where the list is and what help the page gives. */
export function rules(o: Options, listWhere: Record<ListPlace, string>): HTMLElement[] {
  const help = [
    o.given ? 'One word in each scene is already written in, and its letters are shaded on the grid, to get you started.' : '',
    o.firsts ? 'The first letter of every missing word is given.' : '',
  ].filter(Boolean);
  const steps = h(
    'ol',
    { class: 'steps' },
    h('li', {}, h('b', {}, 'Read the scene. '), 'Each chapter is a moment from the book, told in a few lines. Some of its words are missing.'),
    h('li', {}, h('b', {}, 'Find the missing words in the grid. '), `${listWhere[o.list]} Words run from letter to neighbouring letter, up, down, left or right, never diagonally, and they can `, h('b', {}, 'bend'), ' into L, Z or square shapes.'),
    h('li', {}, h('b', {}, 'Every letter belongs to exactly one word. '), 'Nothing is left over and words never cross, so when every letter is used, you have them all. Outline each word in pencil as you find it.'),
    h('li', {}, h('b', {}, 'Write the words into the scene, '), 'then turn the page: the chapter’s original illustration and the whole scene are waiting.'),
  );
  return help.length ? [steps, h('p', { class: 'help-note' }, ...help.map((t) => h('span', {}, t)))] : [steps];
}

export function example(cellMm: number): HTMLElement {
  return h(
    'div',
    { class: 'example' },
    h('div', {}, h('p', { class: 'label' }, 'Find: BOOK · PEN · STORY'), grid(EXAMPLE, cellMm)),
    h('div', {}, h('p', { class: 'label' }, 'Solved'), grid(EXAMPLE, cellMm, { solved: true })),
  );
}

export function answer(e: CatalogEntry, widthMm: number, heightMm: number): HTMLElement {
  return h(
    'div',
    { class: 'answer' },
    h('p', { class: 'label' }, `Chapter ${roman(e.def.chapter)} · ${e.def.title}`),
    grid(e.puzzle, Math.min(widthMm / e.puzzle.cols, heightMm / e.puzzle.rows), { solved: true }),
    h('p', { class: 'answer-words' }, sortedWords(e.puzzle).join(' · ')),
  );
}

export function questions(): HTMLElement {
  const q = (text: string) => h('li', {}, text, h('span', { class: 'lines' }));
  return h(
    'ol',
    { class: 'questions' },
    q('Which chapter did you enjoy most, and why?'),
    q('Did you get stuck anywhere? Where, and what helped?'),
    q('How did outlining bent words in pencil feel?'),
    q('Was turning the page to the picture a good moment?'),
    q('Did filling in the scene help you remember the words?'),
  );
}

export const CREDITS =
  'The texts retell Jane Austen’s Pride and Prejudice (1813). Illustrations: Hugh Thomson, 1894 (George Allen) and C. E. Brock, 1895 (Macmillan), both in the public domain.';

export type Format = 'a4' | 'book';

const FORMATS: Record<Format, { page: string; label: string; hint: string }> = {
  a4: { page: 'print.html', label: 'A4 sheets', hint: 'A4 · double-sided, flip on the long edge' },
  book: { page: 'book.html', label: 'Book spreads', hint: 'Each sheet is an open spread of two book pages' },
};

/** Screen-only controls: the format, the help options, and print. */
export function toolbar(format: Format, o: Options, update: (o: Options) => void): HTMLElement {
  const check = (key: 'given' | 'firsts' | 'dots', text: string) =>
    h('label', {}, h('input', { type: 'checkbox', checked: o[key], onchange: (e: Event) => update({ ...o, [key]: (e.target as HTMLInputElement).checked }) }), ` ${text}`);
  const select = h(
    'select',
    { onchange: (e: Event) => update({ ...o, list: (e.target as HTMLSelectElement).value as ListPlace }) },
    ...(['above', 'foot', 'back'] as const).map((v) =>
      h('option', { value: v, selected: o.list === v }, { above: 'Word list shown', foot: 'Word list upside down at the foot', back: 'Word list only at the back' }[v]),
    ),
  );
  const other: Format = format === 'a4' ? 'book' : 'a4';
  return h(
    'div',
    { class: 'toolbar' },
    h('strong', {}, `${GAME} · ${FORMATS[format].label}`),
    h('a', { href: `${FORMATS[other].page}${optionsQuery(o)}` }, `Switch to ${FORMATS[other].label.toLowerCase()}`),
    select,
    check('given', 'One word filled in'),
    check('firsts', 'First letters'),
    check('dots', 'Start dots on the grid'),
    format === 'book'
      ? h(
          'select',
          { onchange: (e: Event) => update({ ...o, size: (e.target as HTMLSelectElement).value === 'large' ? 'large' : 'a5' }) },
          h('option', { value: 'a5', selected: o.size === 'a5' }, 'A5 pages (spread on A4)'),
          h('option', { value: 'large', selected: o.size === 'large' }, '19 × 23.5 cm pages'),
        )
      : null,
    h('span', { class: 'hint' }, FORMATS[format].hint),
    h('button', { type: 'button', onclick: () => window.print() }, 'Print / Save as PDF'),
  );
}

/** On a narrow screen the sheets are scaled down to fit; printing always uses full size. */
export function fitToScreen(root: HTMLElement, sheetPx: number | (() => number)): void {
  const width = () => (typeof sheetPx === 'number' ? sheetPx : sheetPx());
  const zoom = (printing: boolean) => (printing || innerWidth <= 0 ? 1 : Math.min(1, innerWidth / width()));
  const fit = (printing = false) => (root.style.zoom = String(zoom(printing)));
  fit();
  addEventListener('resize', () => fit());
  matchMedia('print').addEventListener('change', (e) => fit(e.matches));
}

export { roman };
