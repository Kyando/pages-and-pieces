/**
 * What changes when the game runs as a phone app (Capacitor) rather than a web page. On the web,
 * every function here falls back to what the browser offers.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';

export const isApp = Capacitor.isNativePlatform();

/**
 * The save is read and written through localStorage, which the game needs at hand straight away.
 * In the app, the phone may clear a WebView's storage when it runs short of space (iOS does), so
 * each write is copied to the app's own preferences too, and at launch the copy comes back.
 */
export async function restoreStored(key: string): Promise<void> {
  if (!isApp) return;
  try {
    const { value } = await Preferences.get({ key });
    if (value !== null && localStorage.getItem(key) === null) localStorage.setItem(key, value);
  } catch {
    // Nothing kept, or no storage: start afresh.
  }
}

export function keepStored(key: string, value: string): void {
  if (isApp) void Preferences.set({ key, value }).catch(() => undefined);
}

/** A tap felt in the hand: `light` for a word found, `land` for the picture settling, `win` for a chapter done. */
export function buzz(kind: 'light' | 'land' | 'win'): void {
  if (isApp) {
    const done = kind === 'win' ? Haptics.notification({ type: NotificationType.Success }) : Haptics.impact({ style: kind === 'light' ? ImpactStyle.Light : ImpactStyle.Medium });
    void done.catch(() => undefined);
    return;
  }
  navigator.vibrate?.(kind === 'win' ? [20, 60, 30] : kind === 'land' ? 14 : 12);
}

/**
 * Opens the phone's share sheet with a picture and a line of text. Returns false where there's no
 * share sheet (a desktop browser), so the caller can copy the text instead. Closing the sheet
 * without sharing isn't an error.
 */
export async function sharePicture(picture: Blob | null, name: string, text: string): Promise<boolean> {
  if (isApp) {
    let files: string[] | undefined;
    if (picture) {
      // The share sheet takes files, not blobs: the picture goes through the app's cache.
      const { uri } = await Filesystem.writeFile({ path: name, data: await base64(picture), directory: Directory.Cache });
      files = [uri];
    }
    await Share.share({ text, files }).catch((err: Error) => {
      if (!/cancel/i.test(err?.message ?? '')) throw err;
    });
    return true;
  }
  if (!navigator.share) return false;
  const files = picture ? [new File([picture], name, { type: picture.type || 'image/jpeg' })] : [];
  try {
    await navigator.share(files.length && navigator.canShare?.({ files }) ? { files, text } : { text });
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') throw err;
  }
  return true;
}

const base64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
