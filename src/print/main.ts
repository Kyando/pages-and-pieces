/**
 * The paper edition as loose A4 sheets: the first chapters to print at home and play with a pencil.
 * Each chapter is one sheet: the puzzle on the front (the scene with blanks, the grid) and, overleaf,
 * its reward (the illustration and the whole scene). Printed double-sided, turning the page reveals
 * the picture, as finishing the chapter does in the game. Options: see parts.ts.
 *   /print.html?levels=1-4
 */
import './print.css';
import { BOOKS } from '../core/books.ts';
import type { CatalogEntry } from '../levels/catalog.ts';
import { h } from '../ui/dom.ts';
import {
  answer, caption, chapterHead, chosen, CREDITS, example, fitToScreen, GAME, givenWord, grid, optionsQuery, passage, plate,
  questions, readOptions, roman, rules, toolbar, upsideList, URL_TEXT, versionName, wordList, type Options,
} from './parts.ts';

const page = (cls: string, ...children: (Node | string | null)[]) => h('section', { class: `page ${cls}` }, ...children);

function puzzlePage(entry: CatalogEntry, n: number, o: Options): HTMLElement {
  const { def, puzzle } = entry;
  const cell = Math.min(160 / puzzle.cols, 140 / puzzle.rows, 20);
  const given = o.given ? givenWord(puzzle) : null;
  return page(
    'puzzle',
    chapterHead(entry),
    passage(def.story.text, { given: given?.text, firsts: o.firsts }),
    wordList(entry, o),
    h('div', { class: 'grid-wrap' }, grid(puzzle, cell, { given: given?.path, dots: o.dots })),
    o.list === 'foot' ? upsideList(entry) : null,
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
  return page(
    'reward',
    h('figure', {}, plate(def), caption(def)),
    h('div', { class: 'told' }, h('p', { class: 'chapter-no' }, `Chapter ${roman(def.chapter)} · ${def.title}`), passage(def.story.text, { answers: true })),
    h('footer', { class: 'foot' }, h('span', {}, `${n}`), h('span', {}, `Play it again on screen: ${URL_TEXT}`)),
  );
}

function cover(entries: CatalogEntry[], o: Options): HTMLElement {
  const book = BOOKS[entries[0].def.book];
  return page(
    'cover',
    h('p', { class: 'cover-game' }, GAME),
    h('h1', {}, book.title),
    h('p', { class: 'cover-author' }, `${book.author} · ${book.year}`),
    h('img', { class: 'peacock', src: 'art/thomson-1894/ch00-peacock-1894.jpg', alt: '' }),
    h('p', { class: 'cover-sub' }, 'A story in word puzzles'),
    h('p', { class: 'cover-note' }, `Print prototype · ${entries.length} scenes, chapters ${roman(entries[0].def.chapter)}–${roman(entries[entries.length - 1].def.chapter)}`),
    h('p', { class: 'cover-version' }, `Version: ${versionName(o)}`),
    h('p', { class: 'cover-credit' }, 'Illustrations by Hugh Thomson (1894) and C. E. Brock (1895)'),
  );
}

const LIST_WHERE = {
  above: 'Their list is above it.',
  foot: 'Work them out from the scene: the lines tell you how many letters. If you’re stuck, the list is printed upside down at the foot of the page.',
  back: 'Work them out from the scene: the lines tell you how many letters. If you’re stuck, the lists are at the back.',
};

function rulesPage(o: Options): HTMLElement {
  return page(
    'rules',
    h('h2', {}, 'How to play'),
    ...rules(o, LIST_WHERE),
    example(14),
    h('p', { class: 'tip' }, 'Stuck? Start with the longest word, or with a letter that appears only once. The answers are at the back.'),
    h('p', { class: 'tip' }, 'Printing: print double-sided (flip on the long edge), so each picture is on the back of its puzzle. Thicker paper keeps it from showing through.'),
  );
}

const answersPage = (entries: CatalogEntry[]) =>
  page('answers', h('h2', {}, 'Answers'), h('div', { class: 'answer-list' }, ...entries.map((e) => answer(e, 70, 58))));

const notesPage = () =>
  page(
    'notes',
    h('h2', {}, 'Your notes'),
    h('p', { class: 'tip' }, 'This is a first paper prototype. A few words about how it felt help shape the real book.'),
    questions(),
    h('p', { class: 'credits' }, CREDITS),
  );

const root = document.getElementById('print')!;
document.title = `${GAME}: Print Prototype`;

function render(o: Options): void {
  history.replaceState(null, '', optionsQuery(o));
  const entries = chosen(o.levels);
  root.replaceChildren(
    toolbar('a4', o, render),
    cover(entries, o),
    rulesPage(o),
    ...entries.flatMap((e, i) => [puzzlePage(e, 3 + i * 2, o), rewardPage(e, 4 + i * 2)]),
    answersPage(entries),
    notesPage(),
  );
}

render(readOptions());
fitToScreen(root, 840);
