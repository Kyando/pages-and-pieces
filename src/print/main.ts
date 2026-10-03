/**
 * The paper edition, as a prototype: the first chapters laid out as A4 pages to print and play with
 * a pencil. Each chapter is one sheet: the puzzle on the front (the scene with blanks, the grid) and,
 * overleaf, its reward (the illustration and the whole scene). Printed double-sided, turning the
 * page reveals the picture, as finishing the chapter does in the game.
 *
 * How much help the page gives is a choice, so versions can be printed side by side and compared:
 *   /print.html?levels=1-4&list=above|foot|back&given=1&firsts=1&dots=1
 * - list: the words to find above the grid, upside down at the foot of the page, or only at the back;
 * - given: one word per scene (the longest) already written in, its cells shaded on the grid;
 * - firsts: the first letter of every word written in its first box;
 * - dots: a dot on the grid where each word starts.
 */
import './print.css';
import { BOOKS } from '../core/books.ts';
import type { Puzzle, Word } from '../core/puzzle.ts';
import { CATALOG, type CatalogEntry } from '../levels/catalog.ts';
import { roman } from '../ui/desk.ts';
import { h } from '../ui/dom.ts';
import { loadPicture } from '../ui/picture.ts';

const GAME = 'Twice Told Tales';
const URL_TEXT = 'kyando.github.io/twice-told-tales';

type ListPlace = 'above' | 'foot' | 'back';

interface Options {
  levels: string;
  list: ListPlace;
  given: boolean;
  firsts: boolean;
  dots: boolean;
}

function readOptions(): Options {
  const q = new URLSearchParams(location.search);
  const list = q.get('list');
  return {
    levels: q.get('levels') ?? '1-4',
    list: list === 'foot' || list === 'back' ? list : 'above',
    given: q.get('given') === '1',
    firsts: q.get('firsts') === '1',
    dots: q.get('dots') === '1',
  };
}

function writeOptions(o: Options): void {
  const q = new URLSearchParams({ levels: o.levels, list: o.list });
  if (o.given) q.set('given', '1');
  if (o.firsts) q.set('firsts', '1');
  if (o.dots) q.set('dots', '1');
  history.replaceState(null, '', `?${q}`);
}

/** The chapters to print, from levels=first-last (1-based). */
function chosen(levels: string): CatalogEntry[] {
  const m = levels.match(/^(\d+)(?:-(\d+))?$/);
  const first = m ? Math.max(1, Number(m[1])) : 1;
  const last = m ? Number(m[2] ?? m[1]) : 4;
  return CATALOG.slice(first - 1, Math.max(first, last));
}

/** The word written in for the player: the longest, which also clears the most of the grid. */
const givenWord = (p: Puzzle): Word => p.words.reduce((best, w) => (w.text.length > best.text.length ? w : best));

const page = (cls: string, ...children: (Node | string | null)[]) => h('section', { class: `page ${cls}` }, ...children);

interface GridOptions {
  /** Fence off every word, like a mosaic. */
  solved?: boolean;
  /** Cells already solved for the player: shaded and fenced. */
  given?: number[];
  dots?: boolean;
}

/** A grid of letters, with each word's region (or just the given one) fenced off by a thick line. */
function grid(p: Pick<Puzzle, 'rows' | 'cols' | 'letters'> & { words: { path: number[] }[] }, cellMm: number, o: GridOptions = {}): HTMLElement {
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
 * The scene, with each hidden word as a row of letter boxes to fill in, or (`answers`) printed in
 * place. Help comes as letters already written in: a whole word, or every word's first letter.
 */
function passage(text: string, o: { answers?: boolean; given?: string; firsts?: boolean } = {}): HTMLElement {
  const el = h('p', { class: 'scene' });
  for (const [i, part] of text.split(/\{([A-Z]+)\}/).entries()) {
    if (i % 2 === 0) el.append(part);
    else if (o.answers) el.append(h('strong', { class: 'found' }, part.toLowerCase()));
    else {
      const whole = part === o.given;
      const boxes = [...part].map((letter, j) => h('i', {}, whole || (o.firsts && j === 0) ? letter : ''));
      el.append(h('span', { class: `blank${whole ? ' is-given' : ''}`, 'aria-label': `${part.length} letters` }, ...boxes));
    }
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

function puzzlePage(entry: CatalogEntry, n: number, o: Options): HTMLElement {
  const { def, puzzle } = entry;
  const cell = Math.min(160 / puzzle.cols, 140 / puzzle.rows, 20);
  const given = o.given ? givenWord(puzzle) : null;
  const words = puzzle.words.map((w) => w.text).sort();
  const list =
    o.list === 'above'
      ? h(
          'div',
          { class: 'find' },
          h('p', { class: 'label' }, `Find these ${words.length} words`),
          h('ul', { class: 'words' }, ...words.map((w) => h('li', {}, h('span', { class: `tick${w === given?.text ? ' is-ticked' : ''}` }), w))),
        )
      : h('div', { class: 'find is-quiet' }, h('p', { class: 'label' }, `${words.length} words to find`));
  return page(
    'puzzle',
    chapterHead(entry),
    passage(def.story.text, { given: given?.text, firsts: o.firsts }),
    list,
    h('div', { class: 'grid-wrap' }, grid(puzzle, cell, { given: given?.path, dots: o.dots })),
    o.list === 'foot' ? h('p', { class: 'upside' }, h('b', {}, 'Stuck? The words: '), words.join(' · ')) : null,
    h(
      'footer',
      { class: 'foot' },
      h('span', {}, `${n}`),
      h('span', { class: 'turn' }, o.list === 'back' ? 'Stuck? The words are at the back. Found them all? Write them in, then turn the page.' : 'Found them all? Write them into the scene, then turn the page.'),
    ),
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
    h('div', { class: 'told' }, h('p', { class: 'chapter-no' }, `Chapter ${roman(def.chapter)} · ${def.title}`), passage(def.story.text, { answers: true })),
    h('footer', { class: 'foot' }, h('span', {}, `${n}`), h('span', {}, `Play it again on screen: ${URL_TEXT}`)),
  );
}

/** The version printed, in words, so testers' copies can be told apart. */
function versionName(o: Options): string {
  const list = { above: 'word list shown', foot: 'word list upside down', back: 'word list at the back' }[o.list];
  return [list, o.given ? 'one word given' : '', o.firsts ? 'first letters' : '', o.dots ? 'start dots' : ''].filter(Boolean).join(' · ');
}

function cover(entries: CatalogEntry[], o: Options): HTMLElement {
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
    h('p', { class: 'cover-version' }, `Version: ${versionName(o)}`),
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

function rulesPage(o: Options): HTMLElement {
  const where = {
    above: 'Their list is above it.',
    foot: 'Work them out from the scene: the boxes tell you how many letters. If you’re stuck, the list is printed upside down at the foot of the page.',
    back: 'Work them out from the scene: the boxes tell you how many letters. If you’re stuck, the lists are at the back.',
  }[o.list];
  const help = [
    o.given ? 'One word in each scene is already written in, and its letters are shaded on the grid, to get you started.' : '',
    o.firsts ? 'The first letter of every missing word is given.' : '',
  ].filter(Boolean);
  return page(
    'rules',
    h('h2', {}, 'How to play'),
    h(
      'ol',
      { class: 'steps' },
      h('li', {}, h('b', {}, 'Read the scene. '), 'Each chapter is a moment from the book, told in a few lines. Some of its words are missing.'),
      h('li', {}, h('b', {}, 'Find the missing words in the grid. '), `${where} Words run from letter to neighbouring letter, up, down, left or right, never diagonally, and they can `, h('b', {}, 'bend'), ' into L, Z or square shapes.'),
      h('li', {}, h('b', {}, 'Every letter belongs to exactly one word. '), 'Nothing is left over and words never cross, so when every letter is used, you have them all. Outline each word in pencil as you find it.'),
      h('li', {}, h('b', {}, 'Write the words into the scene, '), 'then turn the page: the chapter’s original illustration and the whole scene are waiting.'),
    ),
    help.length ? h('p', { class: 'help-note' }, ...help.map((t) => h('span', {}, t))) : null,
    h(
      'div',
      { class: 'example' },
      h('div', {}, h('p', { class: 'label' }, 'Find: BOOK · PEN · STORY'), grid(EXAMPLE, 14)),
      h('div', {}, h('p', { class: 'label' }, 'Solved'), grid(EXAMPLE, 14, { solved: true })),
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
        h(
          'div',
          { class: 'answer' },
          h('p', { class: 'label' }, `Chapter ${roman(e.def.chapter)} · ${e.def.title}`),
          grid(e.puzzle, Math.min(70 / e.puzzle.cols, 58 / e.puzzle.rows), { solved: true }),
          h('p', { class: 'answer-words' }, e.puzzle.words.map((w) => w.text).sort().join(' · ')),
        ),
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

function toolbar(o: Options, update: (o: Options) => void): HTMLElement {
  const check = (key: 'given' | 'firsts' | 'dots', text: string) =>
    h('label', {}, h('input', { type: 'checkbox', checked: o[key], onchange: (e: Event) => update({ ...o, [key]: (e.target as HTMLInputElement).checked }) }), ` ${text}`);
  const select = h(
    'select',
    { onchange: (e: Event) => update({ ...o, list: (e.target as HTMLSelectElement).value as ListPlace }) },
    ...(['above', 'foot', 'back'] as const).map((v) =>
      h('option', { value: v, selected: o.list === v }, { above: 'Word list above the grid', foot: 'Word list upside down at the foot', back: 'Word list only at the back' }[v]),
    ),
  );
  return h(
    'div',
    { class: 'toolbar' },
    h('strong', {}, `${GAME} · print prototype`),
    select,
    check('given', 'One word filled in'),
    check('firsts', 'First letters'),
    check('dots', 'Start dots on the grid'),
    h('span', { class: 'hint' }, 'A4 · double-sided, flip on the long edge'),
    h('button', { type: 'button', onclick: () => window.print() }, 'Print / Save as PDF'),
  );
}

const root = document.getElementById('print')!;
document.title = `${GAME}: Print Prototype`;

function render(o: Options): void {
  writeOptions(o);
  const entries = chosen(o.levels);
  root.replaceChildren(
    toolbar(o, render),
    cover(entries, o),
    rulesPage(o),
    ...entries.flatMap((e, i) => [puzzlePage(e, 3 + i * 2, o), rewardPage(e, 4 + i * 2)]),
    answersPage(entries),
    notesPage(),
  );
}

render(readOptions());
