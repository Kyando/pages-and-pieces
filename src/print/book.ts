/**
 * The paper edition as a bound book: each PDF page is one open spread, two book pages side by side,
 * to judge what the reader sees at once. The pages are A5 (a spread prints on one A4 sheet,
 * landscape), or 19 × 23.5 cm with size=large. A chapter takes two spreads:
 *   play:   [the scene, with its blanks | the grid]       solved side by side, without turning
 *   reward: [the whole scene            | the illustration]  revealed by the turn of the page
 * The picture sits on a right-hand page, where the eye lands after a turn, and its back is the next
 * chapter's text rather than a grid, so nothing shows through while solving. Options: see parts.ts.
 *   /book.html?levels=1-4
 */
import './print.css';
import './book.css';
import { BOOKS } from '../core/books.ts';
import type { CatalogEntry } from '../levels/catalog.ts';
import { h } from '../ui/dom.ts';
import {
  answer, caption, chapterHead, chosen, inkImage, CREDITS, example, fitToScreen, GAME, givenWord, grid, optionsQuery, passage, plate,
  questions, readOptions, roman, rules, toolbar, upsideList, URL_TEXT, versionName, wordList, type Options,
} from './parts.ts';

/**
 * Each size's printed sheet (one spread) and what fits a page: the grid's room ([width, height] in
 * mm, and the largest cell), the example grid's cells, and each answer grid's room.
 */
const SIZES: Record<Options['size'], { sheet: string; screenPx: number; grid: [number, number, number]; example: number; answer: [number, number] }> = {
  a5: { sheet: 'A4 landscape', screenPx: 1180, grid: [118, 140, 18], example: 11, answer: [76, 52] },
  large: { sheet: '380mm 235mm', screenPx: 1500, grid: [150, 168, 21], example: 15, answer: [92, 70] },
};

/** A book page's content; its side and number come from where it falls in the book. */
interface Leaf {
  cls: string;
  children: (Node | string | null)[];
  /** Pages without a printed number: title, blanks, part openings. */
  bare?: boolean;
}

const leaf = (cls: string, ...children: (Node | string | null)[]): Leaf => ({ cls, children });
const bare = (cls: string, ...children: (Node | string | null)[]): Leaf => ({ cls, children, bare: true });
const blank = (): Leaf => bare('is-blank');

/** The book's pages in order, from the first left-hand page (0, inside the cover). */
class Book {
  readonly pages: Leaf[] = [];

  /** Starts on a left-hand page, leaving a blank right-hand page before it if needed. */
  left(...pages: Leaf[]): void {
    if (this.pages.length % 2) this.pages.push(blank());
    this.pages.push(...pages);
  }

  right(...pages: Leaf[]): void {
    if (this.pages.length % 2 === 0) this.pages.push(blank());
    this.pages.push(...pages);
  }

  spreads(): HTMLElement[] {
    if (this.pages.length % 2) this.pages.push(blank());
    const out: HTMLElement[] = [];
    for (let i = 0; i < this.pages.length; i += 2) {
      const page = (p: Leaf, n: number, side: 'left' | 'right') =>
        h('div', { class: `leaf ${side} ${p.cls}` }, ...p.children, p.bare ? null : h('span', { class: 'folio' }, String(n)));
      out.push(h('section', { class: 'spread' }, page(this.pages[i], i, 'left'), page(this.pages[i + 1], i + 1, 'right')));
    }
    return out;
  }
}

/** Opposite the title, as in the 1894 edition: Thomson's own hand-lettered title page. */
const frontispiece = (): Leaf =>
  bare(
    'frontispiece',
    inkImage('art/thomson-1894/ch00-front.jpg', { alt: 'The 1894 title page' }),
    h('p', { class: 'credit' }, 'The title page of the 1894 edition, lettered by Hugh Thomson'),
  );

function titlePage(entries: CatalogEntry[], o: Options): Leaf {
  const book = BOOKS[entries[0].def.book];
  return bare(
    'title-page',
    h('p', { class: 'cover-game' }, GAME),
    h('h1', {}, book.title),
    h('p', { class: 'cover-author' }, `${book.author} · ${book.year}`),
    inkImage('art/thomson-1894/ch00-peacock-1894.jpg', { class: 'peacock' }),
    h('p', { class: 'cover-sub' }, 'A story in word puzzles'),
    h('p', { class: 'cover-note' }, `Book prototype · ${entries.length} scenes, chapters ${roman(entries[0].def.chapter)}–${roman(entries[entries.length - 1].def.chapter)}`),
    h('p', { class: 'cover-version' }, `Version: ${versionName(o)}`),
  );
}

const LIST_WHERE = {
  above: 'Their list is under the scene.',
  foot: 'Work them out from the scene: the lines tell you how many letters. If you’re stuck, the list is printed upside down under the grid.',
  back: 'Work them out from the scene: the lines tell you how many letters. If you’re stuck, the lists are at the back.',
};

const rulesPage = (o: Options): Leaf => leaf('rules', h('h2', {}, 'How to play'), ...rules(o, LIST_WHERE));

const examplePage = (o: Options): Leaf =>
  leaf(
    'rules',
    h('h2', {}, 'For example'),
    example(SIZES[o.size].example),
    h('p', { class: 'tip' }, 'Each chapter opens across two pages: the scene on the left, its grid on the right, so you can read and search without turning. When every word is found, turn the page for the chapter’s illustration and the whole scene.'),
    h('p', { class: 'tip' }, 'Stuck? Start with the longest word, or with a letter that appears only once. The answers are at the back.'),
  );

const volumeOf = (entry: CatalogEntry) => [...(BOOKS[entry.def.book].volumes ?? [])].reverse().find((v) => entry.def.chapter >= v.from);

/** A part opening, on a right-hand page, as the novel was first published in three volumes. */
function volumeOpening(entry: CatalogEntry): Leaf {
  const volume = volumeOf(entry);
  return bare('volume', h('p', { class: 'cover-game' }, BOOKS[entry.def.book].title), h('h2', {}, volume?.name ?? ''), h('p', { class: 'volume-title' }, volume?.title ?? ''));
}

function scenePage(entry: CatalogEntry, o: Options): Leaf {
  const given = o.given ? givenWord(entry.puzzle) : null;
  return leaf('scene-page', chapterHead(entry), passage(entry.def.story.text, { given: given?.text, firsts: o.firsts }), wordList(entry, o));
}

function gridPage(entry: CatalogEntry, o: Options): Leaf {
  const { puzzle } = entry;
  const given = o.given ? givenWord(puzzle) : null;
  const [w, ht, most] = SIZES[o.size].grid;
  const cell = Math.min(w / puzzle.cols, ht / puzzle.rows, most);
  return leaf(
    'grid-page',
    h('div', { class: 'grid-wrap' }, grid(puzzle, cell, { given: given?.path, dots: o.dots })),
    o.list === 'foot' ? upsideList(entry) : null,
    h('p', { class: 'turn' }, o.list === 'back' ? 'Stuck? The words are at the back. Found them all? Write them in, then turn the page.' : 'Found them all? Write them into the scene, then turn the page.'),
  );
}

function toldPage(entry: CatalogEntry): Leaf {
  const { def } = entry;
  return leaf(
    'told-page',
    h('p', { class: 'chapter-no' }, `Chapter ${roman(def.chapter)}`),
    h('h2', {}, def.title),
    passage(def.story.text, { answers: true }),
    h('p', { class: 'replay' }, `Play it again on screen: ${URL_TEXT}`),
  );
}

const platePage = (entry: CatalogEntry): Leaf => leaf('plate-page', h('figure', {}, plate(entry.def, true), caption(entry.def)));

function build(o: Options): HTMLElement[] {
  const entries = chosen(o.levels);
  const book = new Book();
  book.left(frontispiece(), titlePage(entries, o));
  book.left(rulesPage(o), examplePage(o));
  let volume = '';
  for (const entry of entries) {
    const name = volumeOf(entry)?.name ?? '';
    if (name !== volume) {
      volume = name;
      book.right(volumeOpening(entry));
    }
    book.left(scenePage(entry, o), gridPage(entry, o), toldPage(entry), platePage(entry));
  }
  // The answers, two chapters to a page.
  const answers: Leaf[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    answers.push(leaf('answers', i === 0 ? h('h2', {}, 'Answers') : null, h('div', { class: 'answer-list' }, ...entries.slice(i, i + 2).map((e) => answer(e, ...SIZES[o.size].answer)))));
  }
  book.left(...answers);
  book.left(
    leaf('notes', h('h2', {}, 'Your notes'), h('p', { class: 'tip' }, 'This is a first prototype of the book. A few words about how it felt help shape the real one.'), questions()),
    bare('colophon', h('div', { class: 'credits' }, h('p', {}, CREDITS), h('p', {}, `${GAME} · ${URL_TEXT}`))),
  );
  return book.spreads();
}

const root = document.getElementById('print')!;
document.title = `${GAME}: Book Prototype`;
// The printed sheet: one spread, so two pages wide.
const sheet = document.head.appendChild(document.createElement('style'));
let current = readOptions();

function render(o: Options): void {
  current = o;
  history.replaceState(null, '', optionsQuery(o));
  sheet.textContent = `@page { size: ${SIZES[o.size].sheet}; margin: 0; }`;
  root.className = `size-${o.size}`;
  root.replaceChildren(toolbar('book', o, render), ...build(o));
}

render(current);
fitToScreen(root, () => SIZES[current.size].screenPx);
