import { BOOKS } from '../core/books.ts';
import type { Word } from '../core/puzzle.ts';
import type { LevelDef } from '../core/types.ts';
import { t } from '../i18n/index.ts';
import { h, reducedMotion } from './dom.ts';

export interface DeskOptions {
  def: LevelDef;
  words: Word[];
  /** The picture's address (a local copy when there is one). */
  image: string;
  /** The next chapter's title; absent on the last one. */
  nextTitle?: string;
  onNext(): void;
  onRestart(): void;
  onShare(): void;
}

const ROMAN: [number, string][] = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n: number) => ROMAN.reduce((out, [value, glyph]) => {
  while (n >= value) {
    out += glyph;
    n -= value;
  }
  return out;
}, '');

/**
 * The reward for a finished chapter: the picture the player pieced together, as a print lying on a
 * desk, with the chapter's scene as an old letter under it, sealed in wax. Nothing is lined up; a
 * draft from the window stirs the papers now and then. Tapping one brings it to the front.
 */
export class Desk {
  readonly el: HTMLElement;
  private readonly photo: HTMLElement;
  private readonly letter: HTMLElement;
  private readonly seal: HTMLElement;
  private readonly ribbon: HTMLElement;
  private readonly links: HTMLElement;
  private readonly image: HTMLImageElement;

  constructor(opts: DeskOptions) {
    const { def, words } = opts;
    const book = BOOKS[def.book];
    const story = def.story;

    this.image = h('img', { src: opts.image, alt: story.caption });
    this.seal = h('div', { class: 'desk-seal', 'aria-hidden': 'true' }, h('span', {}, book.monogram ?? book.title.charAt(0)));
    this.photo = h(
      'figure',
      { class: 'desk-photo' },
      h(
        'div',
        { class: 'desk-sway' },
        this.image,
        h('figcaption', {}, story.caption),
        this.seal,
      ),
    );

    this.letter = h(
      'article',
      { class: 'desk-letter' },
      h(
        'div',
        { class: 'desk-sway letter-paper' },
        h('p', { class: 'letter-chapter' }, t('desk.chapter', { n: roman(def.chapter) })),
        h('h2', { class: 'letter-title' }, def.title),
        letterBody(story.text, words, book.names),
        h(
          'p',
          { class: 'letter-sign' },
          book.title,
          h('span', {}, t('desk.by', { author: book.author, year: book.year })),
          h('span', {}, t('desk.illustration', { credit: story.credit })),
        ),
      ),
    );
    // Tapping a paper brings it to the front.
    this.photo.addEventListener('click', () => this.el.classList.remove('letter-front'));
    this.letter.addEventListener('click', () => this.el.classList.add('letter-front'));

    // The way on: a silk ribbon bookmark, always peeking at the bottom edge; two quiet links after the letter.
    this.ribbon = h(
      'button',
      { type: 'button', class: 'desk-ribbon', onclick: () => opts.onNext() },
      h('span', { class: 'ribbon-label' }, opts.nextTitle ? t('desk.next') : t('desk.chapters')),
      opts.nextTitle ? h('span', { class: 'ribbon-title' }, opts.nextTitle) : '',
    );
    this.links = h(
      'nav',
      { class: 'desk-links' },
      h('button', { type: 'button', class: 'desk-link', onclick: () => opts.onRestart() }, t('desk.again')),
      h('button', { type: 'button', class: 'desk-link', onclick: () => opts.onShare() }, t('desk.share')),
    );

    this.el = h('section', { class: 'desk', 'aria-label': t('desk.label') }, h('div', { class: 'desk-items' }, this.photo, this.letter), this.links, this.ribbon);
  }

  /** Resolves once the picture can be drawn, so the desk is laid out at its real size. */
  ready(): Promise<void> {
    return this.image.decode().catch(() => undefined);
  }

  /**
   * The arrival: the picture lifts off the board (`from`, its last place) and lands on the desk,
   * the letter slides out from under it, its found words inking in one by one, and the seal is
   * pressed. Call once the desk is in the page and ready(). Returns the moments worth a sound (ms
   * from now).
   */
  arrive(from: DOMRect | null): { letter: number; seal: number } {
    if (reducedMotion()) return { letter: 0, seal: 0 };
    this.el.classList.add('is-arriving');
    const easeOut = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
    const tilt = (el: HTMLElement) => getComputedStyle(el).getPropertyValue('--tilt').trim() || '0deg';
    const to = this.photo.getBoundingClientRect();
    if (from && to.width) {
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const scale = from.width / to.width;
      this.photo.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)` },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 24}px) scale(${1 + (scale - 1) * 0.4 + 0.04}) rotate(-5deg)`, offset: 0.55 },
          { transform: `rotate(${tilt(this.photo)})` },
        ],
        { duration: 1100, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
      );
    }
    this.letter.animate(
      [
        { transform: 'translate(-6%, -55%) rotate(-2deg) scale(0.92)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: `rotate(${tilt(this.letter)})`, opacity: 1 },
      ],
      { duration: 900, delay: 750, easing: easeOut, fill: 'backwards' },
    );
    this.seal.animate(
      [
        { transform: 'scale(1.9) rotate(-25deg)', opacity: 0 },
        { transform: 'scale(0.88) rotate(4deg)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ],
      { duration: 420, delay: 1750, easing: 'cubic-bezier(0.5, 0, 0.6, 1)', fill: 'backwards' },
    );
    this.ribbon.animate([{ translate: '0 110%' }, { translate: '0 0' }], { duration: 650, delay: 2300, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)', fill: 'backwards' });
    this.links.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 2300, fill: 'backwards' });
    return { letter: 750, seal: 1950 };
  }
}

/**
 * The scene's text with the found words inked in: names keep their capital, other words are
 * written as in the sentence (capitalised only where a sentence starts).
 */
function letterBody(text: string, words: Word[], names: string[]): HTMLElement {
  const parts = text.split(/\{([A-Z]+)\}/);
  let n = 0;
  return h(
    'p',
    { class: 'letter-body' },
    ...parts.map((part, i) => {
      if (i % 2 === 0) return part;
      const before = parts.slice(0, i).join('');
      const opensSentence = !before.trim() || /[.!?]["”’)]?\s*$/.test(before);
      const lower = part.toLowerCase();
      const written = names.includes(part) || opensSentence ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
      const known = words.some((w) => w.text === part);
      const word = h('em', { class: 'letter-word', style: `--i: ${n++}` }, written);
      return known ? word : written;
    }),
  );
}
