import { BOOKS, SHELVES, type ShelfId } from '../core/books.ts';
import type { LevelDef } from '../core/types.ts';
import { t } from '../i18n/index.ts';
import { roman } from './desk.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { barButton, screenBar } from './bar.ts';
import { toast } from './overlay.ts';
import { commonsThumb, loadPicture } from './picture.ts';

/** Finished, playable now, not reached yet, or part of a paid shelf the player doesn't own. */
export type ChapterState = 'done' | 'open' | 'locked' | 'sealed';

export interface LibraryOptions {
  chapters: { def: LevelDef; state: ChapterState }[];
  /** The chapter to pick up: the first not yet finished. */
  current: number;
  onOpen(index: number): void;
  /** Back to the shelf. */
  onBack(): void;
  /** The book's menu: sound, how to play, starting the book again. */
  onSettings(): void;
  /** The paid shelf the book is on, when the player doesn't own it: its chapters stop after the free ones. */
  shelf?: ShelfId;
  onUnlock(shelf: ShelfId): void;
}

/** Each print lies a little askew, like pictures dropped on a table. */
const TILTS = [-1.6, 1.1, -0.5, 1.7, -1.1, 0.6, 1.3, -1.8];

/** Trimmed thumbnails, made once per session. */
const covers = new Map<string, Promise<string>>();

function cover(def: LevelDef): Promise<string> {
  const { image, crop, colour } = def.story;
  const thumb = commonsThumb(image, 330);
  if (!crop) return Promise.resolve(thumb);
  let made = covers.get(image);
  if (!made) {
    made = loadPicture(thumb, crop, 330, colour)
      .then((blob) => URL.createObjectURL(blob))
      .catch(() => thumb);
    covers.set(image, made);
  }
  return made;
}

/**
 * The main menu: the book's chapters as prints on a table, volume by volume. A chapter the player
 * has finished shows its illustration; the one to play next waits as a blank sheet; the rest stay
 * face down, unnamed, so the story still has its surprises.
 */
export class Library {
  readonly el: HTMLElement;

  constructor(opts: LibraryOptions) {
    const { chapters, current } = opts;
    const first = chapters[0]?.def;
    const book = first ? BOOKS[first.book] : null;
    const started = chapters.some((c) => c.state === 'done');
    const shelf = opts.shelf;
    const finished = !shelf && chapters.every((c) => c.state === 'done');
    const unlock = (primary: boolean) =>
      shelf
        ? h('button', { type: 'button', class: `btn${primary ? ' btn--primary' : ''} library-unlock`, onclick: () => opts.onUnlock(shelf) }, svg(ICONS.lock), t('library.unlock', { shelf: SHELVES[shelf].title }))
        : '';
    const next = chapters[current];

    const head = h(
      'header',
      { class: 'library-head' },
      h('p', { class: 'eyebrow' }, book ? t('library.by', { author: book.author, year: book.year }) : ''),
      h('h1', { class: 'library-title' }, book?.title ?? ''),
      next && !finished
        ? h(
            'button',
            { type: 'button', class: 'btn btn--primary library-continue', onclick: () => opts.onOpen(current) },
            h('span', { class: 'library-continue-text' }, h('small', {}, t(started ? 'library.continue' : 'library.begin')), next.def.title),
            svg(ICONS.next),
          )
        : shelf
          ? unlock(true)
          : h('p', { class: 'library-end' }, t('library.finished')),
    );

    const shelves = (book?.volumes ?? [{ from: 1, name: '', title: '' }]).map((volume, v, all) => {
      const to = all[v + 1]?.from ?? Infinity;
      const items = chapters.map((c, i) => ({ ...c, i })).filter(({ def }) => def.chapter >= volume.from && def.chapter < to);
      if (!items.length) return null;
      return h(
        'section',
        { class: 'volume' },
        volume.name ? h('h2', { class: 'volume-title' }, volume.name, h('small', {}, volume.title)) : '',
        h('ol', { class: 'shelf' }, ...items.map(({ def, state, i }) => h('li', {}, this.print(def, state, i, i === current, opts)))),
      );
    });

    const bar = screenBar(barButton(t('top.shelf'), ICONS.prev, () => opts.onBack()), null, barButton(t('top.settings'), ICONS.settings, () => opts.onSettings()));
    // A free sample ends on where the story goes on, and the way there.
    const more =
      shelf && next ? h('aside', { class: 'library-more' }, h('p', {}, t('library.continues', { shelf: SHELVES[shelf].title })), unlock(false)) : '';
    this.el = h('section', { class: 'library', 'aria-label': t('library.label') }, bar, h('div', { class: 'library-inner' }, head, ...shelves.filter((s) => s !== null), more));
  }

  private print(def: LevelDef, state: ChapterState, i: number, isCurrent: boolean, opts: LibraryOptions): HTMLElement {
    const number = t('library.chapter', { n: roman(def.chapter) });
    const pic = h('span', { class: 'print-pic' });
    if (state === 'done') {
      const img = h('img', { alt: '', loading: 'lazy', decoding: 'async' });
      void cover(def).then((src) => (img.src = src));
      pic.append(img);
    } else {
      pic.append(h('span', { class: 'print-numeral', 'aria-hidden': 'true' }, roman(def.chapter)));
    }
    const closed = state === 'locked' || state === 'sealed';
    const classes = ['print', `is-${state}`, closed && 'is-locked', isCurrent && 'is-current'].filter(Boolean).join(' ');
    const shelf = opts.shelf ? SHELVES[opts.shelf].title : '';
    return h(
      'button',
      {
        type: 'button',
        class: classes,
        style: `--tilt: ${TILTS[i % TILTS.length]}deg`,
        'aria-disabled': closed ? 'true' : undefined,
        'aria-label':
          state === 'sealed' ? t('library.sealed', { chapter: number, shelf }) : state === 'locked' ? t('library.locked', { chapter: number }) : `${number}: ${def.title}`,
        onclick: (e: Event) => {
          if (!closed) {
            opts.onOpen(i);
            return;
          }
          if (state === 'sealed' && opts.shelf) {
            opts.onUnlock(opts.shelf);
            return;
          }
          // Not reached yet: a little shake, and what to read first.
          (e.currentTarget as HTMLElement).animate(
            [{ translate: '0' }, { translate: '-6px' }, { translate: '5px' }, { translate: '-3px' }, { translate: '0' }],
            { duration: 360, easing: 'ease-out' },
          );
          const before = opts.chapters[opts.current]?.def;
          if (before) toast(t('library.lockedHint', { title: before.title }));
        },
      },
      pic,
      h('span', { class: 'print-number' }, number),
      closed ? '' : h('span', { class: 'print-title' }, def.title),
    );
  }

  /** Brings the chapter to play next into view. */
  reveal(): void {
    this.el.querySelector('.print.is-current')?.scrollIntoView({ block: 'center' });
  }

  destroy(): void {}
}
