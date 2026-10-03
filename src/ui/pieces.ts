import { colOf, rowOf } from '../core/grid.ts';
import { pieceOutline } from './shape.ts';
import { loadPicture, sketchPicture, type Crop } from './picture.ts';

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
 * Only a fallback: normally the sketch is drawn once as an image (see sketchPicture), since a live
 * filter makes Safari stutter.
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

/** The pencil's colour, from the theme (--pencil). */
function pencilColour(): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = 'var(--pencil, #5b4a3c)';
  document.body.append(probe);
  const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [91, 74, 60];
  probe.remove();
  return [m[0], m[1], m[2]];
}

/**
 * An ink blot's outline: a ragged ring of bumps around (x, y), drawn as one smooth path. Its
 * roughness is in the shape itself, so growing it costs nothing to draw.
 */
function blotPath(x: number, y: number, r: number): string {
  const n = 13;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.25;
    const reach = r * (0.78 + Math.random() * 0.34);
    return [x + Math.cos(a) * reach, y + Math.sin(a) * reach];
  });
  const mid = (i: number) => {
    const [ax, ay] = pts[i % n];
    const [bx, by] = pts[(i + 1) % n];
    return [(ax + bx) / 2, (ay + by) / 2];
  };
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(mid(0)[0])},${f(mid(0)[1])}`;
  for (let i = 1; i <= n; i++) {
    const [cx, cy] = pts[i % n];
    const [mx, my] = mid(i);
    d += `Q${f(cx)},${f(cy)} ${f(mx)},${f(my)}`;
  }
  return d + 'Z';
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
  private readonly source: string;
  private blobUrl: string | null = null;
  /** The pencil sketch, drawn once from the picture; until then (or if it can't be) a live filter stands in. */
  private sketch: string | null = null;
  private destroyed = false;
  private readonly id = `pieces-${++uid}`;
  private readonly defs: SVGDefsElement;
  private readonly piecesG: SVGGElement;
  private readonly wholeG: SVGGElement;
  /** Drawn pieces, by word index. */
  private readonly drawn = new Map<number, SVGGElement>();
  private layout: Layout | null = null;

  /** `crop` trims a scanned page down to its drawing; such a picture only shows once it's trimmed. */
  constructor(image: string, crop?: Crop) {
    this.source = image;
    this.href = crop ? '' : image;
    this.preload(image, crop);
    this.el = el('svg', { class: 'pieces', 'aria-hidden': 'true' });
    this.defs = el('defs');
    this.defs.append(sketchFilter(`${this.id}-sketch`));
    this.piecesG = el('g');
    this.wholeG = el('g', { class: 'pieces-whole' });
    this.el.append(this.defs, this.piecesG, this.wholeG);
  }

  /**
   * Downloads the picture as the chapter opens, not when the first word is found. Keeps a local
   * copy when the host allows it (Wikimedia does); otherwise the browser cache still has it, untrimmed.
   */
  private preload(image: string, crop?: Crop): void {
    loadPicture(image, crop)
      .then((blob) => {
        if (this.destroyed) return;
        this.blobUrl = URL.createObjectURL(blob);
        this.show(this.blobUrl);
        return sketchPicture(blob, pencilColour()).then((drawn) => {
          if (this.destroyed) return;
          this.sketch = URL.createObjectURL(drawn);
          this.el.querySelectorAll('image.piece-pic').forEach((n) => this.sketchOn(n as SVGImageElement));
        });
      })
      .catch(() => this.show(image));
  }

  private show(href: string): void {
    this.href = href;
    this.el.querySelectorAll('image:not(.is-sketch)').forEach((n) => n.setAttribute('href', href));
  }

  /** Shows a piece's picture as the drawn sketch, or the live filter while there's none. */
  private sketchOn(image: SVGImageElement): void {
    if (this.sketch) {
      image.setAttribute('href', this.sketch);
      image.removeAttribute('filter');
      image.classList.add('is-sketch');
    } else {
      image.setAttribute('href', this.href);
      image.setAttribute('filter', `url(#${this.id}-sketch)`);
    }
  }

  /** The picture's address: the local copy once it has downloaded. */
  get picture(): string {
    return this.href || this.source;
  }

  /** Frees the local copy of the picture. */
  destroy(): void {
    this.destroyed = true;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    if (this.sketch) URL.revokeObjectURL(this.sketch);
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
    this.clear();
  }

  /** Removes every piece and the finished picture (a restart). */
  clear(): void {
    this.drawn.forEach((g) => g.remove());
    this.drawn.clear();
    this.defs.querySelectorAll('clipPath, mask').forEach((c) => c.remove());
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
    const image = el('image', { class: 'piece-pic', x: 0, y: 0, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' });
    this.sketchOn(image);
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
    const blots = el('g');
    mask.append(blots);
    this.defs.append(mask);
    temp.push(mask);
    path.forEach((c, i) => {
      const [x, y] = center(c);
      const blot = el('path', { class: 'ink-blot', d: blotPath(x, y, cell * 0.98), fill: '#fff' });
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

    // The letters themselves, left on the paper by their tiles: each thickens as it soaks in, and fades.
    const ink = el('g', { class: 'piece-letters' });
    g.insertBefore(ink, line);
    temp.push(ink);
    path.forEach((c, i) => {
      const [x, y] = center(c);
      const letter = el('text', { class: 'piece-letter', x, y, 'font-size': cell * 0.48 });
      letter.textContent = letters[i];
      ink.append(letter);
      letter.animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)', strokeWidth: '0px' },
          { opacity: 0.9, transform: `translateY(${cell * 0.03}px) scale(1.06)`, strokeWidth: `${cell * 0.05}px`, offset: 0.35 },
          { opacity: 0, transform: `translateY(${cell * 0.1}px) scale(1.25)`, strokeWidth: `${cell * 0.1}px` },
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
