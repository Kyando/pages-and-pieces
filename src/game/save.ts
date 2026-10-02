/** Local persistence (per browser). Progress is keyed by word text, so regenerated layouts keep it. */

export interface LevelProgress {
  /** The words found so far. */
  found: string[];
  done: boolean;
  /** Traces that weren't a word. */
  misses: number;
}

export type ThemeChoice = 'system' | 'light' | 'dark';
/** How found words turn into the picture (being play-tested). */
export type RevealChoice = 'flip' | 'ink';

export interface SaveData {
  version: 1;
  levels: Record<string, LevelProgress>;
  settings: { theme: ThemeChoice; sound: boolean; seenHelp: boolean; lastLevel: string | null; reveal: RevealChoice };
}

const KEY = 'pages-and-pieces:v1';

const defaults = (): SaveData => ({
  version: 1,
  levels: {},
  settings: { theme: 'system', sound: true, seenHelp: false, lastLevel: null, reveal: 'flip' },
});

export const emptyProgress = (): LevelProgress => ({ found: [], done: false, misses: 0 });

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return defaults();
    return { ...defaults(), ...data, settings: { ...defaults().settings, ...data.settings } };
  } catch {
    return defaults();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode, quota): the game still works for this session.
  }
}
