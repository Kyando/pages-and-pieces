/** A chapter's illustration, fetched once and trimmed to the drawing. */

export type Crop = [number, number, number, number];

/**
 * Downloads a picture as a local copy, trimmed to `crop` (fractions of the image) and, for a
 * thumbnail, scaled down to `maxWidth`. Rejects if the host won't share it.
 */
export async function loadPicture(url: string, crop?: Crop, maxWidth = Infinity): Promise<Blob> {
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
    if (crop) ctx.filter = 'grayscale(1) brightness(1.14) contrast(1.15)';
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
