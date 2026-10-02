import { buildPuzzle, type Puzzle } from '../core/puzzle.ts';
import type { LevelDef } from '../core/types.ts';

export interface CatalogEntry {
  def: LevelDef;
  puzzle: Puzzle;
}

// Levels are ordered by file name (01-..., 02-...).
const modules = import.meta.glob<LevelDef>('./*.json', { eager: true, import: 'default' });

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
