import { findPaths, isPath } from './grid.ts';
import { BOOKS } from './books.ts';
import type { LevelDef } from './types.ts';

export interface Word {
  index: number;
  text: string;
  path: number[];
}

/** An empty cell in the grid: not part of the board at all. */
export const HOLE_LETTER = '.';

export interface Puzzle {
  def: LevelDef;
  rows: number;
  cols: number;
  /** All letters, row by row. */
  letters: string;
  words: Word[];
}

/** The {WORD} blanks of a passage, in reading order. */
export const blanksOf = (text: string): string[] => [...text.matchAll(/\{([A-Z]+)\}/g)].map((m) => m[1]);

/**
 * Everything a chapter must satisfy: every letter in exactly one word, words spelled along orthogonal
 * paths, each word traceable in exactly one place (so a found word is never ambiguous), and the
 * passage's blanks matching the words.
 */
export function validateLevel(def: LevelDef): string[] {
  const errors: string[] = [];
  const { rows, cols } = def;
  const letters = def.grid.join('');
  if (def.grid.length !== rows || def.grid.some((r) => r.length !== cols)) errors.push('grid size does not match rows/cols');
  if (!/^[A-Z.]*$/.test(letters)) errors.push('grid must be uppercase A-Z (or . for an empty cell)');
  if (!BOOKS[def.book]) errors.push(`unknown book ${def.book}`);

  const owner = new Array<number>(rows * cols).fill(-1);
  const seen = new Set<string>();
  def.words.forEach((w, index) => {
    if (seen.has(w.text)) errors.push(`${w.text} appears twice`);
    seen.add(w.text);
    if (!/^[A-Z]{2,}$/.test(w.text)) errors.push(`${w.text} is not a valid word`);
    if (w.path.length !== w.text.length || !isPath(w.path, rows, cols)) {
      errors.push(`${w.text} has an invalid path`);
      return;
    }
    w.path.forEach((cell, i) => {
      if (owner[cell] >= 0) errors.push(`${w.text} overlaps ${def.words[owner[cell]].text}`);
      owner[cell] = index;
      if (letters[cell] !== w.text[i]) errors.push(`${w.text} is misspelled on the grid`);
    });
  });
  if (owner.some((o, cell) => (o < 0) !== (letters[cell] === HOLE_LETTER))) errors.push('every letter must belong to exactly one word');
  if (errors.length) return errors;

  for (const w of def.words) {
    const n = findPaths(letters, rows, cols, w.text).length;
    if (n !== 1) errors.push(`${w.text} can be traced in ${n} places`);
  }
  if ([...blanksOf(def.story.text)].sort().join() !== def.words.map((w) => w.text).sort().join()) {
    errors.push('story blanks do not match the level words');
  }
  return errors;
}

export function buildPuzzle(def: LevelDef): Puzzle {
  const errors = validateLevel(def);
  if (errors.length) throw new Error(`${def.id}: ${errors.join('; ')}`);
  return {
    def,
    rows: def.rows,
    cols: def.cols,
    letters: def.grid.join(''),
    words: def.words.map((w, index) => ({ index, text: w.text, path: w.path })),
  };
}

/** The word whose path is exactly `trace`, read in either direction; -1 if none. */
export function matchTrace(puzzle: Puzzle, trace: number[]): number {
  const same = (path: number[]) =>
    path.length === trace.length && (path.every((c, i) => c === trace[i]) || path.every((c, i) => c === trace[trace.length - 1 - i]));
  return puzzle.words.findIndex((w) => same(w.path));
}
