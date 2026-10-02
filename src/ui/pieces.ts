import { colOf, rowOf } from '../core/grid.ts';
import { pieceOutline } from './shape.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

/** The ink's timing (ms): letters melt one after another, the ink spreads, then the pen outlines the piece. */
export const INK_STAGGER_MS = 65;
const INK_MELT_MS = 620;
const INK_SPREAD_MS = 760;
const INK_PEN_MS = 480;
const inkPenDelay = (letters: number) => (letters - 1) * INK_STAGGER_MS + 420;
/** How long a word's ink takes to settle completely. */
export const inkDuration = (letters: number) => inkPenDelay(letters) + INK_PEN_MS;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

/**
 * The picture while the chapter is unfinished, as a pencil sketch: the engraving's dark lines
 * become strokes in pencil (the paper drops out), wobbled a little as if a hand
 * drew them and broken up by grain. It sits quietly in the page, and comes into focus as the
 * real picture only when the chapter is complete. The colour comes from CSS (`.piece-pencil`).
 */
function sketchFilter(id: string): SVGFilterElement {
  const filter = el('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' });
  const lines = el('feComponentTransfer', { in: 'dark', result: 'lines' });
  // Drops the paper's tone and firms up the strokes.
  lines.append(el('feFuncA', { type: 'linear', slope: 1.7, intercept: -0.3 }));
  filter.append(
    // Alpha = how dark the picture is there.
    el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 0 1', result: 'dark' }),
    lines,
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.03, numOctaves: 2, seed: 3, result: 'wobble' }),
    el('feDisplacementMap', { in: 'lines', in2: 'wobble', scale: 3, xChannelSelector: 'R', yChannelSelector: 'G', result: 'drawn' }),
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.85, numOctaves: 1, seed: 7, result: 'noise' }),
    el('feColorMatrix', { in: 'noise', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.1 0 0 0 0.3', result: 'grain' }),
    el('feComposite', { in: 'drawn', in2: 'grain', operator: 'arithmetic', k1: 1, k2: 0, k3: 0, k4: 0, result: 'strokes' }),
    el('feFlood', { class: 'piece-pencil', result: 'pencil' }),
    el('feComposite', { in: 'pencil', in2: 'strokes', operator: 'in' }),
  );
  return filter;
}

interface Layout {
  rows: number;
  cols: number;
  cell: number;
  gap: number;
}

/**
 * The picture, as pieces, under the letter tiles: each found word is one joined shape of the
 * chapter's illustration with an ink outline, separated from its neighbours by the board's gaps, so
 * the board fills up like a puzzle being assembled. While playing the picture is a pencil sketch; once every
 * word is found it comes into focus, whole, with ink seams still showing the pieces it was made of.
 */
export class PieceLayer {
  readonly el: SVGSVGElement;
  /** The picture's address; a local copy once it has downloaded, so pieces show it at once. */
  private href: string;
  private blobUrl: string | null = null;
  private destroyed = false;
  private readonly id = `pieces-${++uid}`;
  private readonly defs: SVGDefsElement;
  private readonly piecesG: SVGGElement;
  private readonly wholeG: SVGGElement;
  /** Drawn pieces, by word index. */
  private readonly drawn = new Map<number, SVGGElement>();
  private layout: Layout | null = null;
  /** Roughens the ink blots' edges, scaled to the cells (see setLayout). */
  private readonly ragged: SVGFilterElement;
  private readonly raggedNoise: SVGFETurbulenceElement;
  private readonly raggedShift: SVGFEDisplacementMapElement;

  constructor(image: string) {
    this.href = image;
    this.preload(image);
    this.el = el('svg', { class: 'pieces', 'aria-hidden': 'true' });
    this.ragged = el('filter', { id: `${this.id}-ragged`, x: '-40%', y: '-40%', width: '180%', height: '180%' });
    this.raggedNoise = el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.05, numOctaves: 3, seed: 11, result: 'noise' });
    this.raggedShift = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: 20, xChannelSelector: 'R', yChannelSelector: 'G' });
    this.ragged.append(this.raggedNoise, this.raggedShift);
    this.defs = el('defs');
    this.defs.append(sketchFilter(`${this.id}-sketch`), this.ragged);
    this.piecesG = el('g');
    this.wholeG = el('g', { class: 'pieces-whole' });
    this.el.append(this.defs, this.piecesG, this.wholeG);
  }

  /**
   * Downloads the picture as the chapter opens, not when the first word is found. Keeps a local
   * copy when the host allows it (Wikimedia does); otherwise the browser cache still has it.
   */
  private preload(image: string): void {
    const img = new Image();
    img.src = image;
    img.decode?.().catch(() => undefined);
    fetch(image)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (this.destroyed) return;
        this.blobUrl = URL.createObjectURL(blob);
        this.href = this.blobUrl;
        this.el.querySelectorAll('image').forEach((n) => n.setAttribute('href', this.href));
      })
      .catch(() => undefined);
  }

  /** Frees the local copy of the picture. */
  destroy(): void {
    this.destroyed = true;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  /** Sizes the layer to the board. Clears it: the caller redraws what's found, without animation. */
  setLayout(layout: Layout): void {
    this.layout = layout;
    const { rows, cols, cell, gap } = layout;
    const w = cols * cell + (cols - 1) * gap;
    const h = rows * cell + (rows - 1) * gap;
    this.el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.el.setAttribute('width', String(w));
    this.el.setAttribute('height', String(h));
    this.raggedNoise.setAttribute('baseFrequency', String(+(3.2 / cell).toFixed(4)));
    this.raggedShift.setAttribute('scale', String(Math.round(cell * 0.42)));
    this.clear();
  }

  /** Removes every piece and the finished picture (a restart). */
  clear(): void {
    this.drawn.forEach((g) => g.remove());
    this.drawn.clear();
    this.defs.querySelectorAll('clipPath, mask, filter[id*="-bleed-"]').forEach((c) => c.remove());
    this.wholeG.replaceChildren();
    this.el.classList.remove('is-whole');
  }

  has(index: number): boolean {
    return this.drawn.has(index);
  }

  /**
   * Draws word `index` as one piece: its cells joined across the gaps between them, on paper.
   * With `letters`, the word arrives as ink: each letter, left behind by its tile, melts into the
   * paper, and the ink spreads out from where it fell, drawing the sketch as it goes; last, a pen
   * goes once round the piece's outline.
   */
  add(index: number, path: number[], letters?: string[]): void {
    if (!this.layout || this.drawn.has(index)) return;
    const { cols, cell, gap } = this.layout;
    const d = pieceOutline(path, cols, cell, gap, cell * 0.16);
    const clipId = `${this.id}-clip-${index}`;
    const clip = el('clipPath', { id: clipId });
    clip.append(el('path', { d }));
    this.defs.append(clip);

    const g = el('g', { class: 'piece' });
    const paper = el('path', { class: 'piece-paper', d });
    // The picture inside a group: the group clips (crisp edges), the image itself takes the sketch filter.
    const pic = el('g', { 'clip-path': `url(#${clipId})` });
    const image = el('image', { class: 'piece-pic', href: this.href, filter: `url(#${this.id}-sketch)`, x: 0, y: 0, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' });
    pic.append(image);
    const line = el('path', { class: 'piece-line', d });
    g.append(paper, pic, line);
    this.piecesG.append(g);
    this.drawn.set(index, g);
    if (letters) this.inkIn(g, image, line, path, letters);
  }

  /** The ink arriving (see add). Leaves the piece exactly as a plain add() draws it. */
  private inkIn(g: SVGGElement, image: SVGImageElement, line: SVGPathElement, path: number[], letters: string[]): void {
    const { cols, cell, gap } = this.layout!;
    const step = cell + gap;
    const n = path.length;
    const center = (c: number) => [colOf(c, cols) * step + cell / 2, rowOf(c, cols) * step + cell / 2];
    const temp: Element[] = [];
    const spot = (i: number) => i * INK_STAGGER_MS;

    // The ink's reach: a blot per letter, growing from where it fell, with ragged edges.
    const maskId = `${this.id}-ink-${++uid}`;
    const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: -cell, y: -cell, width: '200%', height: '200%' });
    const blots = el('g', { filter: `url(#${this.id}-ragged)` });
    mask.append(blots);
    this.defs.append(mask);
    temp.push(mask);
    path.forEach((c, i) => {
      const [x, y] = center(c);
      const blot = el('circle', { class: 'ink-blot', cx: x, cy: y, r: cell * 0.98, fill: '#fff' });
      blots.append(blot);
      blot.animate(
        [
          { transform: 'scale(0)', offset: 0 },
          { transform: 'scale(0.42)', offset: 0.18 },
          { transform: 'scale(1)', offset: 1 },
        ],
        { duration: INK_SPREAD_MS, delay: spot(i) + 140, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' },
      );
    });
    image.setAttribute('mask', `url(#${maskId})`);

    // The letters themselves, left on the paper by their tiles: each softens and bleeds into a drop.
    const ink = el('g', { class: 'piece-letters' });
    g.insertBefore(ink, line);
    temp.push(ink);
    path.forEach((c, i) => {
      const [x, y] = center(c);
      const bleedId = `${this.id}-bleed-${++uid}`;
      const bleed = el('filter', { id: bleedId, x: '-50%', y: '-50%', width: '200%', height: '200%' });
      const grow = el('feMorphology', { operator: 'dilate', radius: 0 });
      const blur = el('feGaussianBlur', { stdDeviation: 0 });
      const animate = (node: Element, attributeName: string, to: number) => {
        const a = el('animate', { attributeName, from: 0, to, dur: `${INK_MELT_MS}ms`, begin: 'indefinite', fill: 'freeze' });
        node.append(a);
        return a;
      };
      const starts = [animate(grow, 'radius', cell * 0.05), animate(blur, 'stdDeviation', cell * 0.09)];
      bleed.append(grow, blur);
      this.defs.append(bleed);
      temp.push(bleed);
      const letter = el('text', { class: 'piece-letter', x, y, 'font-size': cell * 0.48, filter: `url(#${bleedId})` });
      letter.textContent = letters[i];
      ink.append(letter);
      starts.forEach((a) => a.beginElementAt((spot(i) + 60) / 1000));
      letter.animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0.9, transform: `translateY(${cell * 0.03}px) scale(1.06)`, offset: 0.35 },
          { opacity: 0, transform: `translateY(${cell * 0.1}px) scale(1.25)` },
        ],
        { duration: INK_MELT_MS, delay: spot(i) + 60, easing: 'ease-in', fill: 'both' },
      );
    });

    // The pen goes round the piece once the ink is down.
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    const pen = line.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: INK_PEN_MS,
      delay: inkPenDelay(n),
      easing: 'cubic-bezier(0.45, 0, 0.3, 1)',
      fill: 'both',
    });

    // Once the pen is done, the piece is left exactly as a plain add() draws it.
    const settle = () => {
      image.removeAttribute('mask');
      line.style.strokeDasharray = '';
      pen.cancel();
      temp.forEach((node) => node.remove());
    };
    pen.finished.then(settle, () => undefined);
  }

  /** The finished picture: whole, with thin seams where different words meet. */
  showWhole(owner: (cell: number) => number, animate: boolean): void {
    if (!this.layout) return;
    const { rows, cols, cell, gap } = this.layout;
    const step = cell + gap;
    const half = gap / 2;
    let d = '';
    for (let c = 0; c < rows * cols; c++) {
      const x = colOf(c, cols) * step;
      const y = rowOf(c, cols) * step;
      if (colOf(c, cols) < cols - 1 && owner(c) !== owner(c + 1)) d += `M${x + cell + half},${y - half}V${y + cell + half}`;
      if (rowOf(c, cols) < rows - 1 && owner(c) !== owner(c + cols)) d += `M${x - half},${y + cell + half}H${x + cell + half}`;
    }
    this.wholeG.replaceChildren(
      el('image', { href: this.href, x: 0, y: 0, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' }),
      el('path', { class: 'pieces-seams', d }),
      el('rect', { class: 'pieces-frame', x: 0, y: 0, width: '100%', height: '100%', rx: 6 }),
    );
    this.el.classList.add('is-whole');
    this.el.classList.toggle('no-anim', !animate);
  }
}
