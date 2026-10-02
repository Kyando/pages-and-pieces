import { BOOKS } from '../core/books.ts';
import { adjacent, colOf, rowOf } from '../core/grid.ts';
import { HOLE_LETTER, matchTrace, type Word } from '../core/puzzle.ts';
import type { Session } from '../game/session.ts';
import { t, tn } from '../i18n/index.ts';
import { h, svg } from './dom.ts';
import { replay } from './fx.ts';
import { ICONS } from './icons.ts';
import { toast } from './overlay.ts';
import { PieceLayer } from './pieces.ts';
import type { Sfx } from './sfx.ts';
import { passage } from './story.ts';

/** How a found word's tiles turn into the picture (being play-tested, switchable in How to play). */
export type RevealStyle = 'flip' | 'ink';

export interface LevelViewOptions {
  session: Session;
  sfx: Sfx;
  reveal: RevealStyle;
  onSolved(): void;
  /** Absent on the first / last chapter. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Where the button leads after the last chapter. */
  onChapters(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADII = ['13px 10px 14px 11px', '10px 14px 11px 13px', '14px 11px 10px 12px', '11px 13px 12px 10px'];
/** Share of a cell, around its centre, that a dragging finger must reach: keeps diagonal slides from skipping. */
const HIT = 0.78;
/** A found word plays out letter by letter: this far apart (ms), each taking REVEAL_MS. */
const STAGGER_MS = 55;
const REVEAL_MS = 480;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * One chapter: the words to find on top, the letters below. Each word found uncovers its slice of
 * the chapter's illustration; at the end the full picture closes over the board and the panel turns
 * into the scene's passage, every found word in place.
 */
export class LevelView {
  readonly el: HTMLElement;
  private readonly s: Session;
  private readonly opts: LevelViewOptions;
  private readonly boardWrap: HTMLElement;
  private readonly board: HTMLElement;
  private readonly links: SVGSVGElement;
  /** Only loads the picture, for its natural size (the tiles' slices need it); never shown. */
  private readonly picture: HTMLImageElement;
  private readonly pieces: PieceLayer;
  /** Words found whose letters are still flying to their chip. */
  private readonly flying = new Set<number>();
  private readonly tiles: HTMLElement[] = [];
  private readonly traceEl: HTMLElement;
  private readonly counter = h('span', { class: 'counter' });
  private readonly nextBtn: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private readonly panelLabel: HTMLElement;
  private readonly wordList: HTMLElement;
  private readonly passageEl: HTMLElement;
  /** Word chips by word index. */
  private readonly chips: HTMLElement[] = [];
  private readonly resizeObserver: ResizeObserver;
  private trace: number[] = [];
  private gesture: { moved: boolean; onEnd: boolean } | null = null;
  private cellPx = 0;
  /** Cell size the pieces were last drawn at. */
  private piecesCell = 0;
  /** The panel shows the scene's passage (only once the finished picture has settled). */
  private reading = false;
  private gapPx = 0;

  constructor(opts: LevelViewOptions) {
    this.opts = opts;
    this.s = opts.session;
    const p = this.s.puzzle;
    const def = p.def;
    const story = def.story;

    // Heading flanked by arrows, so chapters are always one tap away.
    const arrow = (label: string, glyph: string, go?: () => void) =>
      h('button', { type: 'button', class: 'icon-btn level-arrow', 'aria-label': label, title: label, disabled: !go, onclick: () => go?.() }, svg(glyph));
    const heading = h(
      'header',
      { class: 'chapter' },
      arrow(t('level.prev'), ICONS.prev, opts.onPrev),
      h(
        'div',
        { class: 'chapter-text' },
        h('p', { class: 'eyebrow' }, h('span', {}, t('level.eyebrow', { book: BOOKS[def.book].title, chapter: def.chapter }))),
        h('h1', {}, def.title),
      ),
      arrow(t('level.next'), ICONS.next, opts.onNext),
    );

    // While playing, a compact list of the words to find (alphabetical, so it doesn't spoil the
    // story's order). Once the chapter is complete, the scene itself: the passage with every word in place.
    this.wordList = h(
      'ul',
      { class: 'word-list', 'aria-label': t('level.words') },
      ...[...p.words]
        .sort((a, b) => a.text.localeCompare(b.text))
        .map((w) => {
          const chip = h('li', { class: 'word-chip' }, w.text);
          this.chips[w.index] = chip;
          return chip;
        }),
    );
    this.passageEl = passage(story, p.words, (w) => h('span', { class: 'story-word' }, w.text));
    this.panelLabel = h('span', {});
    this.panel = h(
      'section',
      { class: 'story-panel' },
      h('header', { class: 'story-head' }, this.panelLabel, this.counter),
      this.wordList,
      this.passageEl,
    );
    const panel = this.panel;

    // Board: tiles underneath, the trace line in an SVG layer, letters on top, and the full picture
    // waiting above everything for the end.
    this.board = h('div', { class: 'board', role: 'grid', 'aria-label': t('level.board') });
    this.board.style.setProperty('--rows', String(p.rows));
    this.board.style.setProperty('--cols', String(p.cols));
    this.board.style.setProperty('--picture', `url("${story.image}")`);
    for (let cell = 0; cell < p.rows * p.cols; cell++) {
      const tile = h(
        'div',
        { class: p.letters[cell] === HOLE_LETTER ? 'tile is-hole' : 'tile', style: `border-radius: ${RADII[(rowOf(cell, p.cols) * 3 + colOf(cell, p.cols)) % RADII.length]}` },
        h('span', { class: 'tile-letter' }, p.letters[cell]),
      );
      this.tiles.push(tile);
      this.board.append(tile);
    }
    this.links = document.createElementNS(SVG_NS, 'svg');
    this.links.classList.add('links');
    this.links.setAttribute('aria-hidden', 'true');
    this.pieces = new PieceLayer(story.image);
    this.picture = h('img', { class: 'picture-probe', src: story.image, alt: '' }) as HTMLImageElement;
    this.picture.addEventListener('load', () => this.fit());
    this.board.classList.add(`reveal-${opts.reveal}`);
    this.board.append(this.pieces.el, this.links, this.picture);
    this.bindPointer();

    this.traceEl = h('div', { class: 'trace', role: 'status', 'aria-live': 'polite' }, h('span', { class: 'trace-hint' }, t('level.hint')));
    // The bubble sits right above the board, where the eye already is while tracing.
    this.boardWrap = h('div', { class: 'board-wrap' }, this.traceEl, this.board);
    const restartBtn = h(
      'button',
      { type: 'button', class: 'btn btn--tool', onclick: () => this.restart() },
      svg(ICONS.restart),
      h('span', { class: 'btn-label' }, t('level.restart')),
    );
    // Shown once the chapter is complete: closing the win popup never leaves the player stuck.
    this.nextBtn = opts.onNext
      ? h('button', { type: 'button', class: 'btn btn--primary next-btn', onclick: () => opts.onNext!() }, h('span', {}, t('level.nextButton')), svg(ICONS.arrow))
      : h('button', { type: 'button', class: 'btn btn--primary next-btn', onclick: () => opts.onChapters() }, svg(ICONS.book), h('span', {}, t('level.lastButton')));

    this.el = h(
      'main',
      { class: 'stage' },
      heading,
      h('div', { class: 'play' }, panel, h('div', { class: 'board-area' }, this.boardWrap, h('nav', { class: 'tools' }, restartBtn, this.nextBtn))),
    );

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this.boardWrap);
    this.render();
    if (this.s.solved) this.revealPicture(false);
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  // ── tracing ─────────────────────────────────────────────────────────────

  /** Cell under a point. `strict` only counts the middle of the cell, so a drag can't cut corners. */
  private cellAt(x: number, y: number, strict: boolean): number {
    const p = this.s.puzzle;
    // Measured from the tiles' layout (unaffected by their pop animations), so it holds even
    // before the resize observer catches up.
    const rect = this.board.getBoundingClientRect();
    const size = this.tiles[0].offsetWidth;
    const step = this.tiles[1].offsetLeft - this.tiles[0].offsetLeft;
    const lx = x - rect.left;
    const ly = y - rect.top;
    const c = Math.floor(lx / step);
    const r = Math.floor(ly / step);
    if (r < 0 || c < 0 || r >= p.rows || c >= p.cols) return -1;
    if (strict) {
      const margin = (size * (1 - HIT)) / 2;
      const ix = lx - c * step;
      const iy = ly - r * step;
      if (ix < margin || iy < margin || ix > size - margin || iy > size - margin) return -1;
    }
    return r * p.cols + c;
  }

  private free(cell: number): boolean {
    return cell >= 0 && this.s.ownerAt(cell) < 0 && this.s.puzzle.letters[cell] !== HOLE_LETTER;
  }

  private bindPointer(): void {
    const b = this.board;
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.s.solved) return;
      const cell = this.cellAt(e.clientX, e.clientY, false);
      if (!this.free(cell)) {
        this.setTrace([]);
        return;
      }
      e.preventDefault();
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic pointers can't be captured; their moves still reach the board.
      }
      const tr = this.trace;
      const end = tr[tr.length - 1];
      const onEnd = cell === end && tr.length >= 2;
      if (cell === end) {
        // Keep going from the end of the trace.
      } else if (tr.length && adjacent(end, cell, this.s.puzzle.cols) && !tr.includes(cell)) {
        this.setTrace([...tr, cell]);
      } else if (tr.includes(cell)) {
        this.setTrace(tr.slice(0, tr.indexOf(cell) + 1));
      } else {
        this.setTrace([cell]);
      }
      this.gesture = { moved: false, onEnd };
    });

    b.addEventListener('pointermove', (e) => {
      if (!this.gesture) return;
      const cell = this.cellAt(e.clientX, e.clientY, true);
      const tr = this.trace;
      const end = tr[tr.length - 1];
      if (!this.free(cell) || cell === end) return;
      if (tr.length >= 2 && cell === tr[tr.length - 2]) {
        this.setTrace(tr.slice(0, -1));
        this.gesture.moved = true;
      } else if (adjacent(end, cell, this.s.puzzle.cols) && !tr.includes(cell)) {
        this.setTrace([...tr, cell]);
        this.gesture.moved = true;
      }
    });

    const finish = (cancelled: boolean) => {
      const g = this.gesture;
      this.gesture = null;
      if (!g || cancelled) return;
      // A trace that is a word is taken at once; otherwise a drag (or a tap on the end) submits it.
      if (matchTrace(this.s.puzzle, this.trace) >= 0 || (g.moved && this.trace.length > 1) || g.onEnd) this.submit();
    };
    b.addEventListener('pointerup', () => finish(false));
    b.addEventListener('pointercancel', () => finish(true));
  }

  private setTrace(next: number[]): void {
    if (next.length > this.trace.length) this.opts.sfx.tick(next.length);
    this.trace = next;
    this.render();
  }

  private submit(): void {
    const trace = this.trace;
    this.trace = [];
    if (trace.length < 2) {
      this.render();
      return;
    }
    const letters = trace.map((c) => this.s.puzzle.letters[c]).join('');
    const result = this.s.submit(trace);
    if (result.kind === 'miss') {
      this.opts.sfx.nope();
      trace.forEach((c) => replay(this.tiles[c], 'miss'));
      this.showTrace(letters, 'is-miss');
      this.render();
      return;
    }
    // A word found plays out in three beats: its letters fly up to cross it off the list, its tiles
    // turn into the picture one by one (page flip or ink, in the order it was traced), then they snap
    // together into one piece.
    const { word } = result;
    const calm = reducedMotion();
    const settle = calm ? 0 : (word.path.length - 1) * STAGGER_MS + REVEAL_MS;
    if (!calm) this.flyLetters(word);
    this.render();
    if (!calm) {
      word.path.forEach((c, i) => {
        this.tiles[c].style.setProperty('--delay', `${i * STAGGER_MS}ms`);
        replay(this.tiles[c], 'reveal');
      });
    }
    this.pieces.add(word.index, word.path, settle);
    this.showTrace(word.text, 'is-found');
    this.opts.sfx.piece(word.path.length, STAGGER_MS);
    navigator.vibrate?.(12);
    if (result.solved) window.setTimeout(() => this.celebrate(), settle + 350);
  }

  /** The found word's letters lift off the board and fly into its chip, which then crosses itself off. */
  private flyLetters(word: Word): void {
    const chip = this.chips[word.index];
    const to = chip.getBoundingClientRect();
    const tx = to.left + to.width / 2;
    const ty = to.top + to.height / 2;
    this.flying.add(word.index);
    const anims = word.path.map((c, i) => {
      const from = this.tiles[c].getBoundingClientRect();
      const x = from.left + from.width / 2;
      const y = from.top + from.height / 2;
      const letter = h('span', { class: 'fly-letter', 'aria-hidden': 'true' }, word.text[i]);
      letter.style.cssText = `left:${x}px;top:${y}px;font-size:${this.cellPx * 0.48}px`;
      document.body.append(letter);
      const dx = tx - x;
      const dy = ty - y;
      const anim = letter.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.12}px), calc(-50% + ${dy * 0.12 - 22}px)) scale(1.2)`, opacity: 1, offset: 0.3 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0.5 },
        ],
        { duration: 620, delay: i * STAGGER_MS, easing: 'cubic-bezier(0.45, 0, 0.7, 0.2)', fill: 'backwards' },
      );
      anim.onfinish = () => letter.remove();
      return anim;
    });
    anims[anims.length - 1].finished.then(() => {
      this.flying.delete(word.index);
      this.render();
      replay(chip, 'pop');
    });
  }

  private restart(): void {
    if (!this.s.foundCount) return;
    this.s.reset();
    this.board.classList.remove('is-complete');
    this.reading = false;
    this.pieces.clear();
    this.flying.clear();
    this.trace = [];
    this.traceEl.replaceChildren(h('span', { class: 'trace-hint' }, t('level.hint')));
    this.render();
    toast(t('level.restarted'));
  }

  /** The last piece settles, then the gaps between pieces close over the whole illustration. */
  private celebrate(): void {
    this.opts.sfx.win();
    navigator.vibrate?.([20, 60, 30]);
    this.revealPicture(true);
    window.setTimeout(() => this.opts.onSolved(), 2600);
  }

  /** The whole picture, still showing its pieces' seams, with its caption above. */
  private revealPicture(animate: boolean): void {
    const story = this.s.puzzle.def.story;
    this.board.classList.add('is-complete');
    this.pieces.showWhole((cell) => this.s.ownerAt(cell), animate);
    this.traceEl.replaceChildren(h('span', { class: 'trace-pill picture-caption' }, h('strong', {}, story.caption), h('small', {}, story.credit)));
    if (!animate) {
      this.reading = true;
      this.render();
      return;
    }
    replay(this.traceEl.firstElementChild as HTMLElement, 'is-new');
    // The scene's passage takes more room than the word list, which shrinks the board: wait until
    // the picture has settled, so the resize never cuts its animation short.
    window.setTimeout(() => {
      if (!this.s.solved) return;
      this.reading = true;
      this.render();
      replay(this.passageEl, 'fade-in');
    }, 1500);
  }

  // ── rendering ───────────────────────────────────────────────────────────

  /** The word being traced (or the last result) above the board. */
  private showTrace(text: string, state = ''): void {
    const pill = h('span', { class: `trace-pill ${state}` }, text);
    this.traceEl.replaceChildren(pill);
    if (state) replay(pill, 'is-new');
  }

  private render(): void {
    const p = this.s.puzzle;
    const traced = new Set(this.trace);
    const end = this.trace[this.trace.length - 1];
    this.tiles.forEach((tile, cell) => {
      tile.classList.toggle('is-found', this.s.ownerAt(cell) >= 0);
      tile.classList.toggle('is-trace', traced.has(cell));
      tile.classList.toggle('is-end', cell === end && this.trace.length > 0);
    });
    if (this.trace.length) this.showTrace(this.trace.map((c) => p.letters[c]).join(''));
    this.board.classList.toggle('is-tracing', this.trace.length > 0);
    p.words.forEach((w) => this.chips[w.index].classList.toggle('is-found', this.s.isFound(w.index) && !this.flying.has(w.index)));
    // The words list while playing; the scene itself once the picture is complete.
    this.panel.classList.toggle('is-reading', this.reading);
    this.panelLabel.textContent = t(this.reading ? 'level.passage' : 'level.words');
    this.counter.textContent = tn('level.wordCount', p.words.length, { found: this.s.foundCount });
    this.nextBtn.hidden = !this.s.solved;
    this.drawTrace();
  }

  /** A pencil line along the live trace; found words show their picture instead. */
  private drawTrace(): void {
    const p = this.s.puzzle;
    if (!this.trace.length) {
      this.links.replaceChildren();
      return;
    }
    const step = this.cellPx + this.gapPx;
    const point = (cell: number) => `${colOf(cell, p.cols) * step + this.cellPx / 2},${rowOf(cell, p.cols) * step + this.cellPx / 2}`;
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'link link--trace');
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', this.trace.map(point).join(' '));
    const [x, y] = point(this.trace[0]).split(',');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', String(this.cellPx * 0.11));
    g.append(poly, dot);
    this.links.replaceChildren(g);
  }

  /** Sizes cells to the space available. */
  private fit(): void {
    const p = this.s.puzzle;
    const wrap = this.boardWrap.getBoundingClientRect();
    const width = wrap.width;
    const height = wrap.height - this.traceEl.offsetHeight - 6;
    const gap = width < 480 ? 5 : 7;
    const byWidth = (width - gap * (p.cols - 1)) / p.cols;
    const byHeight = (height - gap * (p.rows - 1)) / p.rows;
    const size = Math.max(34, Math.min(92, Math.floor(Math.min(byWidth, byHeight))));
    this.cellPx = size;
    this.gapPx = gap;
    this.el.style.setProperty('--cell', `${size}px`);
    this.el.style.setProperty('--gap', `${gap}px`);
    const w = p.cols * size + (p.cols - 1) * gap;
    const hgt = p.rows * size + (p.rows - 1) * gap;
    this.links.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
    this.links.setAttribute('width', String(w));
    this.links.setAttribute('height', String(hgt));
    this.links.style.setProperty('--stroke-w', `${size * 0.15}px`);
    this.slicePicture(w, hgt, size + gap);
    // Redraw the pieces at a new size, without animation (an unchanged size keeps them, mid-animation or not).
    if (size === this.piecesCell) {
      this.drawTrace();
      return;
    }
    this.piecesCell = size;
    this.pieces.setLayout({ rows: p.rows, cols: p.cols, cell: size, gap });
    for (const word of p.words) if (this.s.isFound(word.index)) this.pieces.add(word.index, word.path, 0);
    if (this.board.classList.contains('is-complete')) this.pieces.showWhole((cell) => this.s.ownerAt(cell), false);
    this.drawTrace();
  }

  /**
   * Gives each tile its own slice of the picture, cropped to cover the whole board like the
   * final reveal does, so the pieces line up with it exactly.
   */
  private slicePicture(w: number, hgt: number, step: number): void {
    const img = this.picture;
    if (!img.naturalWidth) return;
    const scale = Math.max(w / img.naturalWidth, hgt / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const cols = this.s.puzzle.cols;
    this.tiles.forEach((tile, cell) => {
      tile.style.backgroundSize = `${sw}px ${sh}px`;
      tile.style.backgroundPosition = `${(w - sw) / 2 - colOf(cell, cols) * step}px ${(hgt - sh) / 2 - rowOf(cell, cols) * step}px`;
    });
  }
}
