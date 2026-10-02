import { colOf, rowOf } from '../core/grid.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

/**
 * The picture while the chapter is unfinished: a little blurred, warmed to sepia and with its
 * contrast eased (`slope`, `intercept` per channel), so the hard black-on-white engraving sits
 * quietly in the page. It comes into focus only when the chapter is complete.
 * CSS picks the light or dark variant (`.piece-pic`).
 */
function softFilter(id: string, slope: number, intercept: number): SVGFilterElement {
  const filter = el('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' });
  const transfer = el('feComponentTransfer');
  for (const ch of ['feFuncR', 'feFuncG', 'feFuncB'] as const) transfer.append(el(ch, { type: 'linear', slope, intercept }));
  filter.append(
    el('feGaussianBlur', { stdDeviation: 0.9, edgeMode: 'duplicate' }),
    // Sepia.
    el('feColorMatrix', { type: 'matrix', values: '0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0' }),
    transfer,
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
 * the board fills up like a puzzle being assembled. While playing the picture is soft; once every
 * word is found it comes into focus, whole, with ink seams still showing the pieces it was made of.
 */
export class PieceLayer {
  readonly el: SVGSVGElement;
  private readonly image: string;
  private readonly id = `pieces-${++uid}`;
  private readonly defs: SVGDefsElement;
  private readonly piecesG: SVGGElement;
  private readonly wholeG: SVGGElement;
  /** Drawn pieces, by word index. */
  private readonly drawn = new Map<number, SVGGElement>();
  private layout: Layout | null = null;

  constructor(image: string) {
    this.image = image;
    this.el = el('svg', { class: 'pieces', 'aria-hidden': 'true' });
    this.defs = el('defs');
    // The outline: the piece's shape grown by a little, minus the shape itself, filled with ink.
    const filter = el('filter', { id: `${this.id}-outline`, x: '-10%', y: '-10%', width: '120%', height: '120%' });
    filter.append(
      el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 2, result: 'grown' }),
      el('feComposite', { in: 'grown', in2: 'SourceAlpha', operator: 'out', result: 'ring' }),
      el('feFlood', { class: 'piece-ink', result: 'ink' }),
      el('feComposite', { in: 'ink', in2: 'ring', operator: 'in' }),
    );
    this.defs.append(filter, softFilter('pp-soft', 0.9, 0.06), softFilter('pp-soft-dark', 0.62, 0.02));
    this.piecesG = el('g');
    this.wholeG = el('g', { class: 'pieces-whole' });
    this.el.append(this.defs, this.piecesG, this.wholeG);
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
    this.defs.querySelectorAll('clipPath').forEach((c) => c.remove());
    this.wholeG.replaceChildren();
    this.el.classList.remove('is-whole');
  }

  has(index: number): boolean {
    return this.drawn.has(index);
  }

  /** Draws word `index` as one piece: its cells join across the gaps between them. */
  add(index: number, path: number[]): void {
    if (!this.layout || this.drawn.has(index)) return;
    const { cols, cell, gap } = this.layout;
    const step = cell + gap;
    const r = Math.min(5, cell * 0.1);
    const mine = new Set(path);
    const rects: SVGRectElement[] = [];
    const rect = (x: number, y: number, w: number, h: number, rx = 0) => rects.push(el('rect', { x, y, width: w, height: h, rx }));
    for (const c of path) {
      const x = colOf(c, cols) * step;
      const y = rowOf(c, cols) * step;
      rect(x, y, cell, cell, r);
      const right = colOf(c, cols) < cols - 1 && mine.has(c + 1);
      const below = mine.has(c + cols);
      // Bridges over the gaps to same-word neighbours, overlapping the rounded corners so the joins are flat.
      if (right) rect(x + cell - r, y, gap + 2 * r, cell);
      if (below) rect(x, y + cell - r, cell, gap + 2 * r);
      if (right && below && mine.has(c + cols + 1)) rect(x + cell - r, y + cell - r, gap + 2 * r, gap + 2 * r);
    }
    const clipId = `${this.id}-clip-${index}`;
    const clip = el('clipPath', { id: clipId });
    clip.append(...rects.map((n) => n.cloneNode() as SVGRectElement));
    this.defs.append(clip);

    const g = el('g', { class: 'piece' });
    // The picture inside a group: the group clips (crisp edges), the image itself takes the soft filter.
    const pic = el('g', { 'clip-path': `url(#${clipId})` });
    pic.append(el('image', { class: 'piece-pic', href: this.image, x: 0, y: 0, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' }));
    const outline = el('g', { class: 'piece-outline', filter: `url(#${this.id}-outline)` });
    outline.append(...rects);
    g.append(outline, pic);
    this.piecesG.append(g);
    this.drawn.set(index, g);
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
      el('image', { href: this.image, x: 0, y: 0, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' }),
      el('path', { class: 'pieces-seams', d }),
      el('rect', { class: 'pieces-frame', x: 0, y: 0, width: '100%', height: '100%', rx: 6 }),
    );
    this.el.classList.add('is-whole');
    this.el.classList.toggle('no-anim', !animate);
  }
}
