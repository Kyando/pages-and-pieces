import { BOOKS } from '../core/books.ts';
import type { LevelDef } from '../core/types.ts';
import { t } from '../i18n/index.ts';
import { roman } from './desk.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { commonsThumb, loadPicture } from './picture.ts';

export type ChapterState = 'done' | 'open' | 'locked';

export interface LibraryOptions {
  chapters: { def: LevelDef; state: ChapterState }[];
  /** The chapter to pick up: the one in progress, or the first not yet read. */
  current: number;
  onOpen(index: number): void;
}

/** Each print lies a little askew, like pictures dropped on a table. */
const TILTS = [-1.6, 1.1, -0.5, 1.7, -1.1, 0.6, 1.3, -1.8];

/** Trimmed thumbnails, made once per session. */
const covers = new Map<string, Promise<string>>();

function cover(def: LevelDef): Promise<string> {
  const { image, crop } = def.story;
  const thumb = commonsThumb(image, 330);
  if (!crop) return Promise.resolve(thumb);
  let made = covers.get(image);
  if (!made) {
    made = loadPicture(thumb, crop)
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
    const finished = chapters.every((c) => c.state === 'done');
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

    this.el = h('section', { class: 'library', 'aria-label': t('library.label') }, h('div', { class: 'library-inner' }, head, ...shelves.filter((s) => s !== null)));
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
    const classes = ['print', `is-${state}`, isCurrent && 'is-current'].filter(Boolean).join(' ');
    return h(
      'button',
      {
        type: 'button',
        class: classes,
        style: `--tilt: ${TILTS[i % TILTS.length]}deg`,
        disabled: state === 'locked',
        'aria-label': state === 'locked' ? t('library.locked', { chapter: number }) : `${number}: ${def.title}`,
        onclick: () => opts.onOpen(i),
      },
      pic,
      h('span', { class: 'print-number' }, number),
      state === 'locked' ? '' : h('span', { class: 'print-title' }, def.title),
    );
  }

  /** Brings the chapter to play next into view. */
  reveal(): void {
    this.el.querySelector('.print.is-current')?.scrollIntoView({ block: 'center' });
  }

  destroy(): void {}
}
