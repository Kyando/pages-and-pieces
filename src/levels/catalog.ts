import { buildPuzzle, type Puzzle } from '../core/puzzle.ts';
import type { LevelDef } from '../core/types.ts';

export interface CatalogEntry {
  def: LevelDef;
  puzzle: Puzzle;
}

/**
 * The kids’ edition (Alice and the Three Little Pigs, `kids` in BOOKS) is a preview, not in the
 * first release: the dev server shows it, and so does a build made with VITE_KIDS_EDITION=true.
 * Any other build leaves its chapters out, and with them its pictures (see scripts/prune-art.ts);
 * a book without chapters isn't on the shelf.
 */
export const KIDS_EDITION = import.meta.env.DEV || import.meta.env.VITE_KIDS_EDITION === 'true';

// Levels are ordered by file name (01-..., 02-...). The kids' files are named after their books.
const modules = KIDS_EDITION
  ? import.meta.glob<LevelDef>('./*.json', { eager: true, import: 'default' })
  : import.meta.glob<LevelDef>(['./*.json', '!./*-alice-*.json', '!./*-pigs-*.json'], { eager: true, import: 'default' });

export const CATALOG: CatalogEntry[] = Object.keys(modules)
  .sort()
  .flatMap((path) => {
    try {
      const def = modules[path];
      return [{ def, puzzle: buildPuzzle(def) }];
    } catch (err) {
      console.error(`Nível ignorado (${path}):`, err);
      return [];
    }
  });
