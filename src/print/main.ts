/**
 * The paper edition, as a prototype: the first chapters laid out as A4 pages to print and play with
 * a pencil. Each chapter is one sheet: the puzzle on the front (the scene with blanks, the words to
 * find, the grid) and, overleaf, its reward (the illustration and the whole scene). Printed
 * double-sided, turning the page reveals the picture, as finishing the chapter does in the game.
 *   /print.html?levels=1-4
 */
import './print.css';
import { BOOKS } from '../core/books.ts';
import type { Puzzle } from '../core/puzzle.ts';
import { CATALOG, type CatalogEntry } from '../levels/catalog.ts';
import { roman } from '../ui/desk.ts';
import { h } from '../ui/dom.ts';
import { loadPicture } from '../ui/picture.ts';

const GAME = 'Twice Told Tales';
const URL_TEXT = 'kyando.github.io/twice-told-tales';

/** The chapters to print, from ?levels=first-last (1-based), the first four by default. */
function chosen(): CatalogEntry[] {
  const m = new URLSearchParams(location.search).get('levels')?.match(/^(\d+)(?:-(\d+))?$/);
  const first = m ? Math.max(1, Number(m[1])) : 1;
  const last = m ? Number(m[2] ?? m[1]) : 4;
  return CATALOG.slice(first - 1, Math.max(first, last));
}

const page = (cls: string, ...children: (Node | string | null)[]) => h('section', { class: `page ${cls}` }, ...children);

/** A grid of letters. With `solved`, each word's cells are fenced off by a thick line, like a mosaic. */
function grid(p: Pick<Puzzle, 'rows' | 'cols' | 'letters'> & { words: { path: number[] }[] }, cellMm: number, solved = false): HTMLElement {
  const owner = new Array<number>(p.rows * p.cols).fill(-1);
  p.words.forEach((w, i) => w.path.forEach((c) => (owner[c] = i)));
  const firsts = new Set(p.words.map((w) => w.path[0]));
  const el = h('div', { class: `grid${solved ? ' is-solved' : ''}`, style: `--cols: ${p.cols}; --rows: ${p.rows}; --cell: ${cellMm}mm` });
  for (let cell = 0; cell < p.rows * p.cols; cell++) {
    const r = Math.floor(cell / p.cols);
    const c = cell % p.cols;
    const fence = (other: number, inside: boolean) => (!inside || owner[other] !== owner[cell] ? 'var(--fence)' : 'var(--line)');
    const style = solved
      ? `border-top: ${fence(cell - p.cols, r > 0)}; border-left: ${fence(cell - 1, c > 0)}; border-bottom: ${fence(cell + p.cols, r < p.rows - 1)}; border-right: ${fence(cell + 1, c < p.cols - 1)}`
      : '';
    el.append(h('div', { class: `cell${firsts.has(cell) ? ' is-first' : ''}`, style }, p.letters[cell]));
  }
  return el;
}

/** The scene, with each hidden word as a row of letter boxes to fill in, or (`answers`) printed in place. */
function passage(text: string, answers: boolean): HTMLElement {
  const el = h('p', { class: 'scene' });
  for (const [i, part] of text.split(/\{([A-Z]+)\}/).entries()) {
    if (i % 2 === 0) el.append(part);
    else if (answers) el.append(h('strong', { class: 'found' }, part.toLowerCase()));
    else el.append(h('span', { class: 'blank', 'aria-label': `${part.length} letters` }, ...[...part].map(() => h('i'))));
  }
  return el;
}

function chapterHead(entry: CatalogEntry): HTMLElement {
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

function puzzlePage(entry: CatalogEntry, n: number): HTMLElement {
  const { def, puzzle } = entry;
  const cell = Math.min(160 / puzzle.cols, 140 / puzzle.rows, 20);
  const words = [...puzzle.words].map((w) => w.text).sort();
  return page(
    'puzzle',
    chapterHead(entry),
    passage(def.story.text, false),
    h(
      'div',
      { class: 'find' },
      h('p', { class: 'label' }, `Find these ${words.length} words`),
      h('ul', { class: 'words' }, ...words.map((w) => h('li', {}, h('span', { class: 'tick' }), w))),
    ),
    h('div', { class: 'grid-wrap' }, grid(puzzle, cell)),
    h('footer', { class: 'foot' }, h('span', {}, `${n}`), h('span', { class: 'turn' }, 'Found them all? Write them into the scene, then turn the page.')),
  );
}

function rewardPage(entry: CatalogEntry, n: number): HTMLElement {
  const { def } = entry;
  const img = h('img', { class: 'plate', alt: def.story.caption });
  loadPicture(def.story.image, def.story.crop)
    .then((blob) => (img.src = URL.createObjectURL(blob)))
    .catch(() => (img.src = def.story.image));
  return page(
    'reward',
    h('figure', {}, img, h('figcaption', {}, h('span', { class: 'caption' }, def.story.caption), h('span', { class: 'credit' }, def.story.credit))),
    h('div', { class: 'told' }, h('p', { class: 'chapter-no' }, `Chapter ${roman(def.chapter)} · ${def.title}`), passage(def.story.text, true)),
    h('footer', { class: 'foot' }, h('span', {}, `${n}`), h('span', {}, `Play it again on screen: ${URL_TEXT}`)),
  );
}

function cover(entries: CatalogEntry[]): HTMLElement {
  const book = BOOKS[entries[0].def.book];
  const from = roman(entries[0].def.chapter);
  const to = roman(entries[entries.length - 1].def.chapter);
  return page(
    'cover',
    h('p', { class: 'cover-game' }, GAME),
    h('h1', {}, book.title),
    h('p', { class: 'cover-author' }, `${book.author} · ${book.year}`),
    h('img', { class: 'peacock', src: 'art/thomson-1894/ch00-peacock-1894.jpg', alt: '' }),
    h('p', { class: 'cover-sub' }, 'A story in word puzzles'),
    h('p', { class: 'cover-note' }, `Print prototype · ${entries.length} scenes, chapters ${from}–${to}`),
    h('p', { class: 'cover-credit' }, 'Illustrations by Hugh Thomson (1894) and C. E. Brock (1895)'),
  );
}

/** A tiny solved example: three words, two of them bent. */
const EXAMPLE = {
  rows: 3,
  cols: 4,
  letters: 'STOROOKYBPEN',
  words: [
    { text: 'STORY', path: [0, 1, 2, 3, 7] },
    { text: 'BOOK', path: [8, 4, 5, 6] },
    { text: 'PEN', path: [9, 10, 11] },
  ],
};

function rulesPage(): HTMLElement {
  return page(
    'rules',
    h('h2', {}, 'How to play'),
    h(
      'ol',
      { class: 'steps' },
      h('li', {}, h('b', {}, 'Read the scene. '), 'Each chapter is a moment from the book, told in a few lines. Some of its words are missing.'),
      h('li', {}, h('b', {}, 'Find the missing words in the grid. '), 'Their list is above it. Words run from letter to neighbouring letter, up, down, left or right, never diagonally, and they can ', h('b', {}, 'bend'), ' into L, Z or square shapes.'),
      h('li', {}, h('b', {}, 'Every letter belongs to exactly one word. '), 'Nothing is left over and words never cross, so when every letter is used, you have them all. Outline each word in pencil as you find it.'),
      h('li', {}, h('b', {}, 'Write the words into the scene, '), 'then turn the page: the chapter’s original illustration and the whole scene are waiting.'),
    ),
    h(
      'div',
      { class: 'example' },
      h('div', {}, h('p', { class: 'label' }, 'Find: BOOK · PEN · STORY'), grid(EXAMPLE, 14)),
      h('div', {}, h('p', { class: 'label' }, 'Solved'), grid(EXAMPLE, 14, true)),
    ),
    h('p', { class: 'tip' }, 'Stuck? Start with the longest word, or with a letter that appears only once. The answers are at the back.'),
    h('p', { class: 'tip' }, 'Printing: print double-sided (flip on the long edge), so each picture is on the back of its puzzle. Thicker paper keeps it from showing through.'),
  );
}

function answersPage(entries: CatalogEntry[]): HTMLElement {
  return page(
    'answers',
    h('h2', {}, 'Answers'),
    h(
      'div',
      { class: 'answer-list' },
      ...entries.map((e) =>
        h('div', { class: 'answer' }, h('p', { class: 'label' }, `Chapter ${roman(e.def.chapter)} · ${e.def.title}`), grid(e.puzzle, Math.min(70 / e.puzzle.cols, 62 / e.puzzle.rows), true)),
      ),
    ),
  );
}

function notesPage(): HTMLElement {
  const q = (text: string) => h('li', {}, text, h('span', { class: 'lines' }));
  return page(
    'notes',
    h('h2', {}, 'Your notes'),
    h('p', { class: 'tip' }, 'This is a first paper prototype. A few words about how it felt help shape the real book.'),
    h(
      'ol',
      { class: 'questions' },
      q('Which chapter did you enjoy most, and why?'),
      q('Did you get stuck anywhere? Where, and what helped?'),
      q('How did outlining bent words in pencil feel?'),
      q('Was turning the page to the picture a good moment?'),
      q('Did filling in the scene help you remember the words?'),
    ),
    h('p', { class: 'credits' }, 'The texts retell Jane Austen’s Pride and Prejudice (1813). Illustrations: Hugh Thomson, 1894 (George Allen) and C. E. Brock, 1895 (Macmillan), both in the public domain.'),
  );
}

function toolbar(): HTMLElement {
  const dots = h('input', { type: 'checkbox', onchange: (e: Event) => document.body.classList.toggle('show-firsts', (e.target as HTMLInputElement).checked) });
  return h(
    'div',
    { class: 'toolbar' },
    h('strong', {}, `${GAME} · print prototype`),
    h('label', {}, dots, ' Mark each word’s first letter (easier)'),
    h('span', { class: 'hint' }, 'A4 · print double-sided, flip on the long edge'),
    h('button', { type: 'button', onclick: () => window.print() }, 'Print / Save as PDF'),
  );
}

const entries = chosen();
const root = document.getElementById('print')!;
document.title = `${GAME}: Print Prototype`;
root.append(
  toolbar(),
  cover(entries),
  rulesPage(),
  ...entries.flatMap((e, i) => [puzzlePage(e, 3 + i * 2), rewardPage(e, 4 + i * 2)]),
  answersPage(entries),
  notesPage(),
);
