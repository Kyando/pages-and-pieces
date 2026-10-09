import { FREE_CHAPTERS, SHELVES, type Book, type ShelfId } from '../core/books.ts';
import { t, tn } from '../i18n/index.ts';
import { barButton, screenBar, wordmark } from './bar.ts';
import { h } from './dom.ts';
import { ICONS } from './icons.ts';

export interface ShelfBook {
  key: string;
  book: Book;
  /** Chapters finished, out of `total`. */
  done: number;
  total: number;
  /** On a paid shelf the player doesn't own: only its free chapters count. */
  sample: boolean;
}

export interface ShelfOptions {
  books: ShelfBook[];
  onOpen(key: string): void;
  onSettings(): void;
}

/** Each book's cloth, in shelf order. */
const CLOTHS = ['#6f2f2a', '#2f4f5c', '#5a6b2f', '#4a3a68', '#7a5a22'];

/**
 * The first screen: the books, standing on a shelf, the free classics first and the kids’ edition
 * on a shelf of their own. Each cover shows how far the player has read; opening one leads to its
 * chapters.
 */
export class Shelf {
  readonly el: HTMLElement;

  constructor(opts: ShelfOptions) {
    // The game's name once, in the bar; the shelf itself is the screen's title.
    const bar = screenBar(null, wordmark(t('game.name')), barButton(t('top.settings'), ICONS.settings, () => opts.onSettings()));
    const head = h('header', { class: 'shelf-head' }, h('h1', { class: 'visually-hidden' }, t('shelf.title')), h('p', { class: 'shelf-intro' }, t('shelf.intro')));
    // The free books first, then each paid shelf (its first chapters free), then the kids’ edition.
    const groups = [
      { name: t('shelf.free'), note: '', books: opts.books.filter((b) => !b.book.kids && !b.book.shelf) },
      ...(Object.keys(SHELVES) as ShelfId[]).map((id) => ({
        name: SHELVES[id].title,
        note: opts.books.some((b) => b.book.shelf === id && b.sample) ? t('shelf.sample', { count: FREE_CHAPTERS }) : '',
        books: opts.books.filter((b) => b.book.shelf === id),
      })),
      { name: t('shelf.kids'), note: t('shelf.kidsNote'), books: opts.books.filter((b) => b.book.kids) },
    ].filter((g) => g.books.length);
    const sections = groups.map((g) =>
      h(
        'section',
        { class: 'volume' },
        h('h2', { class: 'volume-title' }, g.name, g.note ? h('small', {}, g.note) : ''),
        h('ol', { class: 'bookcase' }, ...g.books.map((b) => h('li', {}, this.book(b, opts.books.indexOf(b), opts)))),
      ),
    );
    this.el = h('section', { class: 'library shelf-view', 'aria-label': t('shelf.label') }, bar, h('div', { class: 'library-inner' }, head, ...sections));
  }

  private book({ key, book, done, total, sample }: ShelfBook, i: number, opts: ShelfOptions): HTMLElement {
    const status =
      done === 0 ? (sample ? t('shelf.sampleStatus', { count: total }) : t('shelf.new')) : done === total && !sample ? t('shelf.finished') : tn('shelf.progress', total, { done });
    return h(
      'button',
      {
        type: 'button',
        class: `book${done ? ' is-started' : ''}${done === total ? ' is-finished' : ''}`,
        style: `--cloth: ${CLOTHS[i % CLOTHS.length]}; --read: ${total ? done / total : 0}`,
        'aria-label': `${book.title}, ${book.author}. ${status}`,
        onclick: () => opts.onOpen(key),
      },
      h(
        'span',
        { class: 'book-cover' },
        book.young ? h('span', { class: 'book-age' }, t('shelf.age')) : '',
        h('span', { class: 'book-plate' }, h('img', { src: book.cover, alt: '', loading: 'lazy', decoding: 'async' })),
        h('span', { class: 'book-title' }, book.title),
        h('span', { class: 'book-author' }, book.author),
      ),
      h(
        'span',
        { class: 'book-meta' },
        h('span', { class: 'book-blurb' }, book.blurb),
        h('span', { class: 'book-progress', 'aria-hidden': 'true' }, h('span', {})),
        h('span', { class: 'book-status' }, status),
      ),
    );
  }

  destroy(): void {}
}
