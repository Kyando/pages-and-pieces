import { BOOKS } from '../core/books.ts';
import type { Word } from '../core/puzzle.ts';
import type { LevelDef } from '../core/types.ts';
import { t } from '../i18n/index.ts';
import { h, reducedMotion, svg } from './dom.ts';
import { ICONS } from './icons.ts';

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
  /** A sheet moved in the pile. */
  onTurn(): void;
}

const ROMAN: [number, string][] = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export const roman = (n: number): string =>
  ROMAN.reduce((out, [value, glyph]) => {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
    return out;
  }, '');

/** Each sheet's own lie on the desk (deg), and how far the ones below peek out (px), by depth. */
const TILTS = [-1.4, 2.6, -3, 1.8, -2.2, 3.2];
const DEPTH = [
  [0, 0],
  [12, 9],
  [-11, 15],
  [15, 19],
  [-13, 23],
];
const SWIPE = 40;
/** The fewest words the last page of a scene may hold. */
const LAST_PAGE_MIN = 14;
/** The desk's typefaces, which the browser only fetches once something uses them. */
export const FONTS = ['19px "EB Garamond"', 'italic 15px "IM Fell English"', '25px "IM Fell English"', '800 14px Fraunces'];

/**
 * The reward for a finished chapter: a small pile of loose sheets on the desk. On top, the drawing
 * the player pieced together; under it, the chapter's scene, on as many pages as it takes to fit
 * the screen. Tapping (or swiping) the top sheet slides it to the bottom of the pile. The sheets
 * lie flat and drift a little, as if a draft lifted them off the desk now and then.
 */
export class Desk {
  readonly el: HTMLElement;
  private readonly opts: DeskOptions;
  private readonly pile: HTMLElement;
  private readonly drawing: HTMLElement;
  private readonly image: HTMLImageElement;
  private readonly foot: HTMLElement;
  private readonly hint: HTMLElement;
  /** Every sheet; `order` lists them top first. */
  private sheets: HTMLElement[] = [];
  private order: HTMLElement[] = [];
  private readonly resizeObserver: ResizeObserver;
  private size = '';
  private busy = false;
  private readonly fonts: Promise<unknown>;

  constructor(opts: DeskOptions) {
    this.opts = opts;
    const story = opts.def.story;

    this.image = h('img', { src: opts.image, alt: story.caption });
    this.drawing = this.sheet(
      'sheet--drawing',
      h('div', { class: 'plate' }, this.image),
      h('p', { class: 'plate-caption' }, story.caption, h('small', {}, story.credit)),
    );

    this.pile = h('div', { class: 'pile', role: 'button', tabindex: '0', 'aria-label': t('desk.turn') });
    this.hint = h('p', { class: 'desk-hint' }, t('desk.hint'));
    const next = h(
      'button',
      { type: 'button', class: 'btn btn--primary desk-next', onclick: () => opts.onNext() },
      h('span', {}, opts.nextTitle ? t('desk.next') : t('desk.chapters')),
      svg(ICONS.arrow),
    );
    // The way on in the middle, a round button either side: play again, and share the picture.
    const round = (label: string, glyph: string, act: () => void) =>
      h('button', { type: 'button', class: 'round-btn', 'aria-label': label, title: label, onclick: act }, svg(glyph));
    this.foot = h(
      'footer',
      { class: 'desk-foot' },
      this.hint,
      h(
        'nav',
        { class: 'desk-actions' },
        round(t('desk.again'), ICONS.restart, () => opts.onRestart()),
        next,
        round(t('desk.share'), ICONS.share, () => opts.onShare()),
      ),
    );
    this.el = h('section', { class: 'desk', 'aria-label': t('desk.label') }, this.pile, this.foot);

    this.bindGestures();
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(this.pile);
    // Pages are measured in their real typeface: lay them out again once it has arrived.
    this.fonts = Promise.all(FONTS.map((f) => document.fonts.load(f))).catch(() => undefined);
    void this.fonts.then(() => {
      this.size = '';
      this.layout();
    });
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  /** Resolves once the picture and the typefaces are in, so the desk is laid out at its real size. */
  async ready(): Promise<void> {
    await Promise.all([this.image.decode().catch(() => undefined), this.fonts]);
  }

  // ── the pile ────────────────────────────────────────────────────────────

  private sheet(kind: string, ...content: (Node | string)[]): HTMLElement {
    return h('div', { class: `sheet ${kind}` }, h('div', { class: 'sheet-float' }, h('div', { class: 'sheet-paper' }, ...content)));
  }

  /** Sizes the sheets to the space, and splits the scene into as many pages as that takes. */
  layout(): void {
    const w = this.pile.clientWidth;
    const hgt = this.pile.clientHeight;
    if (!w || !hgt) return;
    const sheetW = Math.round(Math.min(w - 40, 440, (hgt - 30) / 1.12));
    const sheetH = Math.round(Math.min(hgt - 30, sheetW * 1.5));
    const size = `${sheetW}x${sheetH}`;
    if (size === this.size) return;
    this.size = size;
    this.pile.style.setProperty('--sheet-w', `${sheetW}px`);
    this.pile.style.setProperty('--sheet-h', `${sheetH}px`);

    const topWasDrawing = !this.order.length || this.order[0] === this.drawing;
    this.sheets.forEach((s) => s !== this.drawing && s.remove());
    if (!this.drawing.isConnected) this.pile.append(this.drawing);
    const pages = this.paginate();
    this.sheets = [this.drawing, ...pages];
    this.sheets.forEach((s, i) => {
      s.style.setProperty('--tilt', `${TILTS[i % TILTS.length]}deg`);
      const paper = s.querySelector('.sheet-paper')!;
      const mark = paper.querySelector('.sheet-mark') ?? paper.appendChild(h('span', { class: 'sheet-mark' }));
      mark.textContent = `${i + 1} / ${this.sheets.length}`;
    });
    // A resize starts the pile over from the drawing, or from the first page if that was being read.
    this.order = topWasDrawing ? [...this.sheets] : [...pages, this.drawing];
    this.stack();
  }

  /** The scene, page by page: words flow onto a page until it is full. */
  private paginate(): HTMLElement[] {
    const { def, words } = this.opts;
    const book = BOOKS[def.book];
    const pages: HTMLElement[] = [];
    let body = h('p', { class: 'page-body' });
    const newPage = (first: boolean) => {
      body = h('p', { class: 'page-body' });
      const head = first
        ? h('header', { class: 'page-head' }, h('p', { class: 'page-chapter' }, t('desk.chapter', { n: roman(def.chapter) })), h('h2', { class: 'page-title' }, def.title))
        : '';
      const page = this.sheet('sheet--page', head, body);
      this.pile.append(page);
      pages.push(page);
    };
    const overflows = () => body.scrollHeight > body.clientHeight + 1;
    newPage(true);
    for (const token of tokens(def.story.text, words, book.names)) {
      body.append(token);
      if (overflows() && body.childNodes.length > 1) {
        token.remove();
        newPage(false);
        body.append(token);
      }
    }
    // The last page never holds just a few stray words, or the signature alone: it takes the end of
    // the passage back to a sentence break with it.
    const pullBack = (min: number) => {
      const prev = pages[pages.length - 2]?.querySelector('.page-body');
      if (!prev) return;
      // At most half the page before, so at worst the two share the text evenly.
      const limit = Math.floor(prev.childNodes.length / 2);
      for (let moved = 0; moved < limit; ) {
        const last = prev.lastChild!;
        body.prepend(last);
        if (overflows()) {
          prev.append(last);
          return;
        }
        moved++;
        if (moved >= min && /[.!?”"]\s*$/.test(prev.lastChild?.textContent ?? '')) return;
      }
    };
    if (pages.length > 1 && body.childNodes.length < LAST_PAGE_MIN) pullBack(LAST_PAGE_MIN - body.childNodes.length);
    const sign = h('p', { class: 'page-sign' }, book.title, h('span', {}, t('desk.by', { author: book.author, year: book.year })));
    body.append(sign);
    if (overflows()) {
      sign.remove();
      newPage(false);
      body.append(sign);
      pullBack(LAST_PAGE_MIN);
    }
    return pages;
  }

  /** Puts each sheet in its place in the pile. */
  private stack(): void {
    const n = this.order.length;
    this.order.forEach((s, depth) => {
      const [x, y] = DEPTH[Math.min(depth, DEPTH.length - 1)];
      s.style.zIndex = String(n - depth);
      s.style.setProperty('--x', `${x}px`);
      s.style.setProperty('--y', `${y}px`);
      s.classList.toggle('is-top', depth === 0);
    });
  }

  /** The top sheet slides off to one side and tucks under the pile; or the bottom one comes back up. */
  private turn(forward: boolean, side = forward ? -1 : 1): void {
    if (this.busy || this.order.length < 2) return;
    this.hint.classList.add('is-gone');
    this.opts.onTurn();
    const moving = forward ? this.order[0] : this.order[this.order.length - 1];
    this.order = forward ? [...this.order.slice(1), moving] : [moving, ...this.order.slice(0, -1)];
    if (reducedMotion()) {
      this.stack();
      return;
    }
    this.busy = true;
    const out = `translate(${side * 108}%, -4%) rotate(${side * 9}deg)`;
    const from = getComputedStyle(moving).transform;
    // Out to the side, clear of the pile, then in under (or on top of) it.
    const leave = moving.animate([{ transform: from }, { transform: out }], { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.7, 0.6)', fill: 'forwards' });
    leave.finished.then(() => {
      // Its new place, without the pile's own transition (the others glide to theirs).
      moving.style.transition = 'none';
      this.stack();
      leave.cancel();
      const to = getComputedStyle(moving).transform;
      moving.animate([{ transform: out }, { transform: to }], { duration: 320, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }).finished.finally(() => {
        moving.style.transition = '';
        this.busy = false;
      });
    });
  }

  private bindGestures(): void {
    let start: { x: number; y: number } | null = null;
    this.pile.addEventListener('pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY };
    });
    this.pile.addEventListener('pointerup', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) this.turn(dx < 0, Math.sign(dx));
      else if (Math.hypot(dx, dy) < 10) this.turn(true);
    });
    this.pile.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.turn(false);
      else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') this.turn(true);
      else return;
      e.preventDefault();
    });
  }

  /**
   * The arrival: the drawing lifts off the board (`from`, its last place) and lands on the pile,
   * the pages slide in under it, and the way on rises below. Call once the desk is in the page and
   * ready(). Returns the moments worth a sound (ms from now).
   */
  arrive(from: DOMRect | null): { land: number; pages: number } {
    this.layout();
    if (reducedMotion()) return { land: 0, pages: 0 };
    const pic = this.image.getBoundingClientRect();
    if (from && pic.width) {
      const dx = from.left + from.width / 2 - (pic.left + pic.width / 2);
      const dy = from.top + from.height / 2 - (pic.top + pic.height / 2);
      const scale = Math.max(from.width / pic.width, from.height / pic.height);
      const rest = getComputedStyle(this.drawing).transform;
      this.drawing.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 18}px) scale(${1 + (scale - 1) * 0.35 + 0.05}) rotate(-4deg)`, offset: 0.55 },
          { transform: rest },
        ],
        { duration: 950, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
      );
    }
    this.order.slice(1).forEach((page, i) => {
      const rest = getComputedStyle(page).transform;
      page.animate([{ transform: `translate(0, 40%) rotate(${i % 2 ? 6 : -6}deg)`, opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: rest, opacity: 1 }], {
        duration: 800,
        delay: 650 + i * 140,
        easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
        fill: 'backwards',
      });
    });
    this.foot.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 550, delay: 1200, easing: 'ease-out', fill: 'backwards' });
    return { land: 880, pages: 650 };
  }
}

/**
 * The scene as pieces for the pages: one per word with its trailing space, so pages break between
 * words. The found words are written as in the game, on their kraft chips. Punctuation sticks to
 * the word before it.
 */
function tokens(text: string, words: Word[], names: string[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  text.split(/\{([A-Z]+)\}/).forEach((part, k) => {
    if (k % 2 === 1) {
      const known = words.some((w) => w.text === part);
      const plain = names.includes(part) ? part.charAt(0) + part.slice(1).toLowerCase() : part.toLowerCase();
      out.push(h('span', {}, known ? h('span', { class: 'page-word' }, part) : plain));
      return;
    }
    for (const [, lead, word] of part.matchAll(/(\s*)(\S*\s*)/g)) {
      const last = out[out.length - 1];
      // Spaces end the piece before; a word with no space before it (punctuation after a found
      // word, say) sticks to it.
      if (lead && last) last.append(lead);
      if (!word) continue;
      if (last && !/\s$/.test(last.textContent ?? '')) last.append(word);
      else out.push(h('span', {}, word));
    }
  });
  return out;
}
