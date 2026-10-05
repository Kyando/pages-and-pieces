/** A chapter's illustration, fetched once and trimmed to the drawing. */

export type Crop = [number, number, number, number];

/**
 * Downloads a picture as a local copy, trimmed to `crop` (fractions of the image) and, for a
 * thumbnail, scaled down to `maxWidth`. A trimmed black-and-white scan is whitened too, unless
 * `colour` says the picture is a coloured plate. Rejects if the host won't share it.
 */
export async function loadPicture(url: string, crop?: Crop, maxWidth = Infinity, colour = false): Promise<Blob> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const blob = await r.blob();
  if (!crop && maxWidth === Infinity) return blob;
  const bmp = await createImageBitmap(blob);
  const [left, top, right, bottom] = crop ?? [0, 0, 1, 1];
  const sx = left * bmp.width;
  const sy = top * bmp.height;
  const sw = (right - left) * bmp.width;
  const sh = (bottom - top) * bmp.height;
  const scale = Math.min(1, maxWidth / sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // A scanned page's paper has yellowed: brought back to white, like the other prints.
    if (crop && !colour) ctx.filter = 'grayscale(1) brightness(1.14) contrast(1.15)';
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('crop failed'))), 'image/jpeg', 0.9));
}

/** A smaller copy of a Wikimedia Commons image (one of its standard widths); other addresses as they are. */
export function commonsThumb(url: string, width: 250 | 330 | 500 | 960 | 1280): string {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/)(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2}\/)([^/]+)/);
  return m ? `${m[1]}thumb/${m[2]}${m[3]}/${width}px-${m[3]}` : url;
}

/**
 * The picture as a pencil sketch, drawn once: its dark lines become strokes in `pencil` on a clear
 * ground (the paper drops out), wobbled a little as if a hand drew them and broken up by grain.
 * A plain image is cheap to show; the same look as a live SVG filter made phones stutter (Safari
 * redraws filters on every frame of any animation nearby).
 */
export async function sketchPicture(picture: Blob, pencil: [number, number, number], maxWidth = 1100): Promise<Blob> {
  const bmp = await createImageBitmap(picture);
  const scale = Math.min(1, maxWidth / bmp.width);
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const dst = out.data;

  // The hand's wobble: smooth noise, about a dozen bumps across, shifting lines by a pixel or two.
  const cells = 12;
  const gw = cells + 2;
  const gh = Math.ceil((cells * h) / w) + 2;
  const lattice = () => Float32Array.from({ length: gw * gh }, () => Math.random() * 2 - 1);
  const nx = lattice();
  const ny = lattice();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const sample = (grid: Float32Array, u: number, v: number) => {
    const i = Math.floor(u);
    const j = Math.floor(v);
    const fu = smooth(u - i);
    const fv = smooth(v - j);
    const at = (a: number, b: number) => grid[Math.min(gh - 1, b) * gw + Math.min(gw - 1, a)];
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fu;
    const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fu;
    return top + (bottom - top) * fv;
  };
  const reach = w * 0.004;
  const per = cells / w;
  const [r, g, b] = pencil;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w - 1, Math.max(0, Math.round(x + sample(nx, x * per, y * per) * reach)));
      const sy = Math.min(h - 1, Math.max(0, Math.round(y + sample(ny, x * per, y * per) * reach)));
      const s = (sy * w + sx) * 4;
      // How dark the picture is there, firmed up so the paper's tone drops out.
      const dark = 1 - (0.2126 * src[s] + 0.7152 * src[s + 1] + 0.0722 * src[s + 2]) / 255;
      const line = Math.min(1, Math.max(0, dark * 1.7 - 0.3));
      const grain = Math.min(1, Math.random() * 1.1 + 0.3);
      const d = (y * w + x) * 4;
      dst[d] = r;
      dst[d + 1] = g;
      dst[d + 2] = b;
      dst[d + 3] = Math.round(line * grain * 255);
    }
  }
  ctx.putImageData(out, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sketch failed'))), 'image/png'));
}
