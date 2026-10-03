import { BOOKS } from '../core/books.ts';
import { adjacent, colOf, rowOf } from '../core/grid.ts';
import { HOLE_LETTER, matchTrace, type Word } from '../core/puzzle.ts';
import { steer } from '../core/steer.ts';
import type { Session } from '../game/session.ts';
import { t, tn } from '../i18n/index.ts';
import { Desk } from './desk.ts';
import { h, svg } from './dom.ts';
import { replay } from './fx.ts';
import { ICONS } from './icons.ts';
import { toast } from './overlay.ts';
import { INK_STAGGER_MS, inkDuration, PieceLayer } from './pieces.ts';
import { pieceOutline } from './shape.ts';
import type { Sfx } from './sfx.ts';

export interface LevelViewOptions {
  session: Session;
  sfx: Sfx;
  /** Absent on the first / last chapter. */
  onPrev?: () => void;
  onNext?: () => void;
  /** The next chapter isn't reached until this one is finished: its arrow waits until then. */
  nextLocked?: boolean;
  /** The next chapter's title, for the finished chapter's desk. */
  nextTitle?: string;
  /** Deal the chapter in: heading, word chips and tiles arrive one after another. */
  intro?: boolean;
  /** Back to the library: the button after the last chapter. */
  onChapters(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A heading arrow to the previous or next chapter; disabled without somewhere to go. */
const arrow = (label: string, glyph: string, go?: () => void) =>
  h('button', { type: 'button', class: 'icon-btn level-arrow', 'aria-label': label, title: label, disabled: !go, onclick: () => go?.() }, svg(glyph));
const RADII = ['13px 10px 14px 11px', '10px 14px 11px 13px', '14px 11px 10px 12px', '11px 13px 12px 10px'];
/** Longest stretch (in cells) between two finger positions read on their own, so fast swipes and cut corners step through every cell. */
const SAMPLE = 0.2;
/** A found word's tiles leave one after another, this far apart (ms), each flight taking FLIGHT_MS. */
const STAGGER_MS = INK_STAGGER_MS;
/**
 * The chapter's arrival (ms): the word chips pop up CHIP_STEP apart after the title and panel. The
 * tiles are dealt in a diagonal wave from the top-left corner, one diagonal every DIAG_STEP, each card
 * a little early or late (up to CARD_JITTER) and flying for CARD_FLIGHT; then the grid hops once, a
 * wave crossing it HOP_STEP per diagonal.
 */
const CHIP_START = 560;
const CHIP_STEP = 85;
const DIAG_STEP = 110;
const CARD_JITTER = 60;
const CARD_FLIGHT = 600;
const HOP_STEP = 60;
const FLIGHT_MS = 760;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * One chapter: the words to find on top, the letters below, and the chapter's illustration under
 * the letters, cut into one piece per word. When a word is found its tiles fly off to the word
 * list, uncovering that piece (shown soft while playing). At the end the picture comes into focus,
 * seams and all, and the panel turns into the scene's passage, every found word in place.
 */
export class LevelView {
  readonly el: HTMLElement;
  private readonly s: Session;
  private readonly opts: LevelViewOptions;
  private readonly boardWrap: HTMLElement;
  private readonly board: HTMLElement;
  private readonly links: SVGSVGElement;
  private readonly pieces: PieceLayer;
  /** Words found whose tiles are still flying to their chip. */
  private readonly flying = new Set<number>();
  private readonly tiles: HTMLElement[] = [];
  private readonly traceEl: HTMLElement;
  private readonly counter = h('span', { class: 'counter' });
  /** The finished chapter, laid out on the desk. */
  private desk: Desk | null = null;
  private readonly panel: HTMLElement;
  private readonly wordList: HTMLElement;
  /** Word chips by word index. */
  private readonly chips: HTMLElement[] = [];
  private readonly resizeObserver: ResizeObserver;
  private trace: number[] = [];
  /** The drag in progress: the last finger position (in cells, see toCells) and the last step taken. */
  private gesture: { moved: boolean; onEnd: boolean; u: number; v: number; dir: number } | null = null;
  private cellPx = 0;
  /** Cell size the pieces were last drawn at. */
  private piecesCell = 0;
  private gapPx = 0;
  private readonly heading: HTMLElement;
  private nextArrow!: HTMLButtonElement;

  constructor(opts: LevelViewOptions) {
    this.opts = opts;
    this.s = opts.session;
    const p = this.s.puzzle;
    const def = p.def;
    const story = def.story;

    // Heading flanked by arrows, so chapters are always one tap away.
    const heading = (this.heading = h(
      'header',
      { class: 'chapter' },
      arrow(t('level.prev'), ICONS.prev, opts.onPrev),
      h(
        'div',
        { class: 'chapter-text' },
        h('p', { class: 'eyebrow' }, h('span', {}, t('level.eyebrow', { book: BOOKS[def.book].title, chapter: def.chapter }))),
        h('h1', {}, def.title),
      ),
      (this.nextArrow = opts.nextLocked ? arrow(t('level.nextLocked'), ICONS.next) : arrow(t('level.next'), ICONS.next, opts.onNext)),
    ));

    // While playing, a compact list of the words to find (alphabetical, so it doesn't spoil the
    // story's order). The scene itself waits for the end, on the desk.
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
    this.panel = h(
      'section',
      { class: 'story-panel' },
      h(
        'header',
        { class: 'story-head' },
        h('span', {}, t('level.words')),
        h(
          'span',
          { class: 'story-head-end' },
          this.counter,
          // On phones "Start over" lives here, so the board gets the row it would take.
          h('button', { type: 'button', class: 'head-restart', 'aria-label': t('level.restart'), title: t('level.restart'), onclick: () => this.restart() }, svg(ICONS.restart)),
        ),
      ),
      this.wordList,
    );
    const panel = this.panel;

    // Board: the picture's pieces at the bottom, the letter tiles over them, then the trace line.
    this.board = h('div', { class: 'board', role: 'grid', 'aria-label': t('level.board') });
    this.board.style.setProperty('--rows', String(p.rows));
    this.board.style.setProperty('--cols', String(p.cols));
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
    this.pieces = new PieceLayer(story.image, story.crop);
    this.board.append(this.pieces.el, this.links);
    this.bindPointer();

    this.traceEl = h('div', { class: 'trace', role: 'status', 'aria-live': 'polite' }, h('span', { class: 'trace-hint' }, t('level.hint')));
    // The bubble sits right above the board, where the eye already is while tracing (on phones it
    // floats over the chapter title instead, so the board can take the whole width).
    this.boardWrap = h('div', { class: 'board-wrap' }, this.traceEl, this.board);
    const restartBtn = h(
      'button',
      { type: 'button', class: 'btn btn--tool', onclick: () => this.restart() },
      svg(ICONS.restart),
      h('span', { class: 'btn-label' }, t('level.restart')),
    );
    this.el = h(
      'main',
      { class: 'stage' },
      heading,
      h('div', { class: 'play' }, panel, h('div', { class: 'board-area' }, this.boardWrap, h('nav', { class: 'tools' }, restartBtn))),
    );

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this.boardWrap);
    this.render();
    if (this.s.solved) this.finish(false);
    else if (opts.intro && !reducedMotion()) {
      // Hidden until the deal starts, once the board is in the page and measured.
      this.el.classList.add('is-entering', 'is-dealing');
      requestAnimationFrame(() => this.dealIn());
    }
  }

  /**
   * The chapter arrives from the top down: the title, then the word panel with its words popping up
   * one by one, then the letter tiles dealt like cards. Each flies up from the bottom edge of the
   * screen, a little turned, and lands in its cell. They come in a diagonal wave from the top-left,
   * rows and columns together, so a card never crosses one already down; once all are down the
   * grid gives one hop, like a crowd's wave, and settles.
   */
  private dealIn(): void {
    // Going back, this page swings in rotated: tiles measured now would land in the wrong places.
    const turning = this.el.classList.contains('is-turning') ? this.el.getAnimations() : [];
    if (turning.length) {
      void Promise.allSettled(turning.map((a) => a.finished)).then(() => this.dealIn());
      return;
    }
    this.fit();
    const sfx = this.opts.sfx;
    // No sound before the player has touched the page (browsers would hold it back anyway).
    const audible = navigator.userActivation?.hasBeenActive ?? true;

    const chips = [...this.wordList.children] as HTMLElement[];
    const anims: Animation[] = [];
    chips.forEach((chip, i) =>
      anims.push(
      chip.animate(
        [
          { transform: 'scale(0.3)', opacity: 0 },
          { transform: 'scale(1.14)', opacity: 1, offset: 0.6 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 380, delay: CHIP_START + i * CHIP_STEP, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)', fill: 'backwards' },
      )),
    );

    // The deal starts as the last word chip pops up, so their sounds don't pile up.
    const start = CHIP_START + Math.max(2, chips.length) * CHIP_STEP;
    const cols = this.s.puzzle.cols;
    const diagonal = (cell: number) => rowOf(cell, cols) + colOf(cell, cols);
    const cards = this.tiles
      .map((tile, cell) => ({ tile, cell }))
      .filter(({ tile, cell }) => !tile.classList.contains('is-hole') && this.s.ownerAt(cell) < 0);
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const lands: number[] = [];
    let last = start;
    cards.forEach(({ tile, cell }) => {
      const r = tile.getBoundingClientRect();
      const delay = start + diagonal(cell) * DIAG_STEP + Math.random() * CARD_JITTER;
      // The tap sounds as the card touches down, at the very end of its flight.
      lands.push((delay + CARD_FLIGHT) / 1000);
      last = Math.max(last, delay + CARD_FLIGHT);
      const side = Math.random() < 0.5 ? -1 : 1;
      // From the bottom edge, around the middle of the screen, turned as if just flicked off a deck.
      const dx = viewW / 2 + (Math.random() - 0.5) * 90 - (r.left + r.width / 2);
      const dy = viewH + r.height * 0.6 - r.top;
      const spin = side * (12 + Math.random() * 22);
      // Some cards stay a touch askew where they land.
      if (Math.random() < 0.45) tile.style.rotate = `${(Math.random() - 0.5) * 4}deg`;
      // Eased per stretch, so each keyframe's offset is also its moment: it glides in, hovers, and drops.
      anims.push(tile.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(1.08)`, easing: 'cubic-bezier(0.2, 0.65, 0.35, 1)' },
          { transform: 'translate(0, -6px) rotate(0deg) scale(1.06)', offset: 0.8, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)' },
          { transform: 'none' },
        ],
        { duration: CARD_FLIGHT, delay, fill: 'backwards' },
      ));
    });

    // All down: one hop runs across the grid, the same way the cards came.
    const hop = last + 120;
    cards.forEach(({ tile, cell }) =>
      tile.animate(
        [
          { transform: 'none' },
          { transform: 'translateY(-6px) scale(1.05)', offset: 0.4 },
          { transform: 'translateY(1px) scale(0.99)', offset: 0.75 },
          { transform: 'none' },
        ],
        { duration: 560, delay: hop + diagonal(cell) * HOP_STEP, easing: 'ease-in-out' },
      ),
    );
    // Sounds are timed from when the animations really start (a busy first frame can hold them back)
    // and played early by the speaker's own delay, so each lands with its card.
    const first = anims[0];
    if (audible && first) {
      void first.ready.then(() => {
        const now = Number(document.timeline.currentTime ?? 0);
        const skew = (now - Number(first.startTime ?? now)) / 1000 + sfx.latency;
        const at = (ms: number) => ms / 1000 - skew;
        sfx.pops(chips.length, at(CHIP_START + 25), CHIP_STEP / 1000);
        sfx.deal(at(start), lands.map((s) => s - skew));
        sfx.settle(at(hop));
      }).catch(() => undefined);
    }
    this.el.classList.remove('is-dealing');
    window.setTimeout(() => this.el.classList.remove('is-entering'), last);
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.pieces.destroy();
    this.desk?.destroy();
  }

  // ── tracing ─────────────────────────────────────────────────────────────

  /**
   * A point on the board in cells, so that the centre of the tile at (row, col) is (col, row).
   * Measured from the tiles' layout (unaffected by their animations), so it holds even before the
   * resize observer catches up.
   */
  private toCells(x: number, y: number): { u: number; v: number } {
    const rect = this.board.getBoundingClientRect();
    const size = this.tiles[0].offsetWidth;
    const step = this.tiles[1].offsetLeft - this.tiles[0].offsetLeft;
    return { u: (x - rect.left - size / 2) / step, v: (y - rect.top - size / 2) / step };
  }

  /** The cell under a point, gaps included; -1 off the board. */
  private cellAt(x: number, y: number): number {
    const p = this.s.puzzle;
    const { u, v } = this.toCells(x, y);
    const c = Math.round(u);
    const r = Math.round(v);
    return r < 0 || c < 0 || r >= p.rows || c >= p.cols ? -1 : r * p.cols + c;
  }

  private free(cell: number): boolean {
    return cell >= 0 && this.s.ownerAt(cell) < 0 && this.s.puzzle.letters[cell] !== HOLE_LETTER;
  }

  private bindPointer(): void {
    const b = this.board;
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.s.solved) return;
      const cell = this.cellAt(e.clientX, e.clientY);
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
      this.gesture = { moved: false, onEnd, ...this.toCells(e.clientX, e.clientY), dir: 0 };
    });

    // The trace follows the finger's motion (see steer): every position the browser saw, with the
    // stretches between them filled in, so nothing is skipped however fast or loose the drag.
    b.addEventListener('pointermove', (e) => {
      const g = this.gesture;
      if (!g) return;
      const { rows, cols } = this.s.puzzle;
      const free = (cell: number) => this.free(cell);
      let state = { trace: this.trace, dir: g.dir };
      const seen = e.getCoalescedEvents?.() ?? [];
      for (const ev of seen.length ? seen : [e]) {
        const { u, v } = this.toCells(ev.clientX, ev.clientY);
        const n = Math.max(1, Math.ceil(Math.hypot(u - g.u, v - g.v) / SAMPLE));
        for (let i = 1; i <= n; i++) state = steer(state, g.u + ((u - g.u) * i) / n, g.v + ((v - g.v) * i) / n, rows, cols, free);
        g.u = u;
        g.v = v;
      }
      g.dir = state.dir;
      if (state.trace !== this.trace) {
        g.moved = true;
        this.setTrace(state.trace);
      }
    });

    const finish = (cancelled: boolean) => {
      const g = this.gesture;
      this.gesture = null;
      if (!g || cancelled) return;
      // A drag that ran one tile past a word still counts as the word.
      const short = this.trace.slice(0, -1);
      if (g.moved && short.length > 1 && matchTrace(this.s.puzzle, this.trace) < 0 && matchTrace(this.s.puzzle, short) >= 0) this.trace = short;
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
    // A found word's tiles lift off the board one after another and fly to its chip in the word
    // list, each along its own curve. Their letters stay behind as ink, which melts into the paper
    // underneath and spreads out into the word's piece of the picture.
    const { word } = result;
    const calm = reducedMotion();
    if (!calm) this.flyTiles(word);
    this.render();
    this.pieces.add(word.index, word.path, calm ? undefined : word.path.map((c) => this.s.puzzle.letters[c]));
    this.showTrace(word.text, 'is-found');
    this.opts.sfx.piece(word.path.length, STAGGER_MS);
    navigator.vibrate?.(12);
    const settle = calm ? 0 : Math.max((word.path.length - 1) * STAGGER_MS + FLIGHT_MS, inkDuration(word.path.length));
    // The finish begins while the last piece's outline is still being drawn.
    if (result.solved) window.setTimeout(() => this.celebrate(), Math.max(0, settle - 150));
  }

  /**
   * Copies of the found word's tiles fly from the board to its chip, which crosses itself off when
   * the last one lands. Each takes its own arc (one side or the other, wider or tighter) and spins
   * as it goes, like a card flicked off a table; the real tiles are hidden at once, so the picture
   * shows wherever a copy has left.
   */
  private flyTiles(word: Word): void {
    const chip = this.chips[word.index];
    const to = chip.getBoundingClientRect();
    const tx = to.left + to.width / 2;
    const ty = to.top + to.height / 2;
    this.flying.add(word.index);
    const anims = word.path.map((c, i) => {
      const tile = this.tiles[c];
      const from = tile.getBoundingClientRect();
      const copy = tile.cloneNode(true) as HTMLElement;
      copy.className = 'tile fly-tile';
      // Only the paper flies: the letter stays on the board, as ink.
      copy.querySelector('.tile-letter')?.remove();
      copy.setAttribute('aria-hidden', 'true');
      copy.style.left = `${from.left}px`;
      copy.style.top = `${from.top}px`;
      copy.style.width = `${from.width}px`;
      copy.style.height = `${from.height}px`;
      copy.style.setProperty('--cell', `${from.width}px`);
      document.body.append(copy);

      // A quadratic curve from the tile to the chip, bowed to a random side.
      const dx = tx - (from.left + from.width / 2);
      const dy = ty - (from.top + from.height / 2);
      const side = Math.random() < 0.5 ? -1 : 1;
      const len = Math.hypot(dx, dy) || 1;
      const bow = (50 + Math.random() * 80) * side;
      const cx = dx / 2 + (-dy / len) * bow;
      const cy = dy / 2 + (dx / len) * bow - 40;
      const spin = side * (120 + Math.random() * 160);
      const tilt = side * (4 + Math.random() * 5);
      // The tile keeps its inner rings; only the drop shadow grows as it lifts.
      const rings = 'inset 0 0 0 3px var(--panel), inset 0 0 0 4.5px var(--faint)';
      const frames: Keyframe[] = [
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', boxShadow: `${rings}, 0 4px 0 var(--stroke)`, opacity: 1, offset: 0 },
        { transform: `translate(0, -10px) rotate(${tilt}deg) scale(1.14)`, boxShadow: `${rings}, 0 16px 20px rgb(0 0 0 / 0.28)`, opacity: 1, offset: 0.16 },
      ];
      for (let k = 1; k <= 6; k++) {
        const t = k / 6;
        const x = 2 * (1 - t) * t * cx + t * t * dx;
        const y = 2 * (1 - t) * t * cy + t * t * dy - 10 * (1 - t);
        frames.push({
          transform: `translate(${x}px, ${y}px) rotate(${tilt + spin * t ** 1.4}deg) scale(${1.14 - 0.86 * t})`,
          boxShadow: `${rings}, 0 16px 20px rgb(0 0 0 / 0.2)`,
          opacity: t < 0.75 ? 1 : 1 - (t - 0.75) * 3.2,
          offset: 0.16 + 0.84 * t,
        });
      }
      const anim = copy.animate(frames, { duration: FLIGHT_MS, delay: i * STAGGER_MS, easing: 'cubic-bezier(0.35, 0, 0.45, 1)', fill: 'both' });
      anim.finished.then(() => copy.remove(), () => copy.remove());
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
    this.desk?.destroy();
    this.desk?.el.remove();
    this.desk = null;
    this.board.classList.remove('is-complete');
    this.el.classList.remove('is-complete', 'is-leaving');
    this.fit();
    this.pieces.clear();
    this.flying.clear();
    this.trace = [];
    this.traceEl.replaceChildren(h('span', { class: 'trace-hint' }, t('level.hint')));
    this.render();
    toast(t('level.restarted'));
    // A fresh deal.
    if (!reducedMotion()) {
      this.el.classList.add('is-entering', 'is-dealing');
      requestAnimationFrame(() => this.dealIn());
    }
  }

  /**
   * The last piece settles and the whole picture comes into focus on the board; then it lifts off
   * onto the desk, with the chapter's scene on the pages under it.
   */
  private celebrate(): void {
    this.opts.sfx.win();
    navigator.vibrate?.([20, 60, 30]);
    this.finish(true);
  }

  /**
   * The picture comes into focus while the desk is prepared out of sight (its typefaces and picture
   * loaded); then the word list and title fold away and the drawing lifts off onto it.
   */
  private finish(animate: boolean): void {
    this.board.classList.add('is-complete');
    // Finishing reaches the next chapter.
    const next = this.opts.onNext;
    if (next && this.nextArrow.disabled) {
      const open = arrow(t('level.next'), ICONS.next, next);
      this.nextArrow.replaceWith(open);
      this.nextArrow = open;
    }
    this.pieces.showWhole((cell) => this.s.ownerAt(cell), animate);
    const desk = this.makeDesk();
    if (!animate) {
      this.el.classList.add('is-complete');
      this.el.append(desk.el);
      return;
    }
    window.setTimeout(() => {
      if (this.desk === desk) this.el.classList.add('is-leaving');
    }, 850);
    window.setTimeout(() => void this.openDesk(desk), 1150);
  }

  private makeDesk(): Desk {
    const def = this.s.puzzle.def;
    this.desk = new Desk({
      def,
      words: this.s.puzzle.words,
      image: this.pieces.picture,
      nextTitle: this.opts.nextTitle,
      onNext: () => (this.opts.onNext ?? this.opts.onChapters)(),
      onRestart: () => this.restart(),
      onTurn: () => this.opts.sfx.sheet(),
      onShare: () => {
        const text = t('desk.shareText', { game: t('game.name'), book: BOOKS[def.book].title, chapter: def.chapter, title: def.title });
        navigator.clipboard?.writeText(text).then(
          () => toast(t('desk.copied')),
          () => toast(t('desk.copyFailed')),
        );
      },
    });
    return this.desk;
  }

  private async openDesk(desk: Desk): Promise<void> {
    await desk.ready();
    if (this.desk !== desk) return;
    const from = this.board.getBoundingClientRect();
    this.el.classList.remove('is-leaving');
    this.el.classList.add('is-complete');
    this.el.append(desk.el);
    const at = desk.arrive(from);
    const sfx = this.opts.sfx;
    window.setTimeout(() => {
      sfx.land();
      navigator.vibrate?.(14);
    }, at.land);
    window.setTimeout(() => sfx.sheet(), at.pages);
  }

  // ── rendering ───────────────────────────────────────────────────────────

  /** The word being traced (or the last result) above the board. */
  private showTrace(text: string, state = ''): void {
    const pill = h('span', { class: `trace-pill ${state}` }, text);
    this.traceEl.replaceChildren(pill);
    if (!state) return;
    replay(pill, 'is-new');
    // A result clears after a moment (on phones it covers the chapter title).
    window.setTimeout(() => {
      if (pill.isConnected && !this.trace.length) this.traceEl.replaceChildren(h('span', { class: 'trace-hint' }, t('level.hint')));
    }, 1400);
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
    this.counter.textContent = tn('level.wordCount', p.words.length, { found: this.s.foundCount });
    this.drawTrace();
  }

  /**
   * The word being traced is a piece in the making: its tiles join into one kraft-paper shape (the
   * same shape its piece of the picture will take), drawn under the letters.
   */
  private drawTrace(): void {
    const p = this.s.puzzle;
    if (!this.trace.length) {
      this.links.replaceChildren();
      return;
    }
    const d = pieceOutline(this.trace, p.cols, this.cellPx, this.gapPx, this.cellPx * 0.2);
    const shape = (cls: string) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', cls);
      path.setAttribute('d', d);
      return path;
    };
    this.links.replaceChildren(shape('trace-shadow'), shape('trace-shape'));
  }

  /** Sizes cells to the space available. */
  private fit(): void {
    const p = this.s.puzzle;
    // Layout sizes, not the on-screen box: while the page is turning in, it is rotated and looks narrower.
    const wrap = { width: this.boardWrap.offsetWidth, height: this.boardWrap.offsetHeight };
    const width = wrap.width;
    const floating = getComputedStyle(this.traceEl).position === 'absolute';
    if (floating) {
      this.traceEl.style.setProperty('--head-top', `${this.heading.offsetTop}px`);
      this.traceEl.style.setProperty('--head-h', `${this.heading.offsetHeight}px`);
    }
    const height = wrap.height - (floating ? 0 : this.traceEl.offsetHeight + 6);
    const gap = width < 480 ? 4 : 7;
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
    // Redraw the pieces at a new size (an unchanged size keeps them, mid-animation or not).
    if (size !== this.piecesCell) {
      this.piecesCell = size;
      this.pieces.setLayout({ rows: p.rows, cols: p.cols, cell: size, gap });
      for (const word of p.words) if (this.s.isFound(word.index)) this.pieces.add(word.index, word.path);
      if (this.board.classList.contains('is-complete')) this.pieces.showWhole((cell) => this.s.ownerAt(cell), false);
    }
    this.drawTrace();
  }
}
