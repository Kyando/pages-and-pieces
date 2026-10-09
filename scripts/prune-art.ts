/**
 * Vite plugin: the build ships only the pictures the game uses.
 *
 * public/art/ holds every illustration of each edition (about 70 MB), so new chapters can pick
 * from them while developing. Once built, any picture that no page, script or stylesheet in dist/
 * names is deleted from dist/art/, which leaves the few dozen the chapters, covers and paper
 * editions show. A path is only found if it's written out whole (`art/<edition>/<file>`), as the
 * chapters and books write them.
 */
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

export function pruneArt(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'prune-art',
    apply: 'build',
    configResolved(c) {
      config = c;
    },
    closeBundle() {
      const out = join(config.root, config.build.outDir);
      const art = join(out, 'art');
      const used = new Set<string>();
      for (const file of files(out)) {
        if (file.startsWith(art + sep) || !/\.(html|js|css)$/.test(file)) continue;
        for (const [path] of readFileSync(file, 'utf8').matchAll(/art\/[\w.-]+\/[\w.-]+\.(?:jpe?g|png|webp)/g)) used.add(path);
      }
      let kept = 0;
      let dropped = 0;
      for (const file of files(art)) {
        const path = relative(out, file).split(sep).join('/');
        if (used.has(path)) kept += statSync(file).size;
        else {
          dropped += statSync(file).size;
          rmSync(file);
        }
      }
      for (const path of used) statSync(join(out, path)); // throws if a chapter names a missing picture
      // Editions left with nothing go too.
      for (const dir of readdirSync(art)) if (!readdirSync(join(art, dir)).length) rmSync(join(art, dir), { recursive: true });
      const mb = (n: number) => (n / 2 ** 20).toFixed(1);
      config.logger.info(`prune-art: kept ${used.size} pictures (${mb(kept)} MB), dropped ${mb(dropped)} MB`);
    },
  };
}
