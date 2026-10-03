# Twice Told Tales

A word puzzle that retells classic books, one illustrated chapter at a time.

Each chapter is a scene from the book. Its key words are listed above the grid, and every letter in the grid belongs to exactly one of them. Words never go diagonal or cross, but they can bend into L, Z or square shapes, like Tetris pieces. Each word you find uncovers its piece of the chapter's original illustration. Find them all and the finished drawing lifts off the board onto a desk, beside the pages of the scene with every word in place.

The game opens on the library: the book's chapters as prints on a table, volume by volume. Finished chapters show their illustration, the next one waits as a blank sheet, and the rest stay face down until the story reaches them.

The first book is **Pride and Prejudice** (Jane Austen, 1813): 41 chapters covering the whole story, with Hugh Thomson's 1894 illustrations and, where he left a scene undrawn, C. E. Brock's from 1895. The passages retell each scene in plain modern English and keep Austen's best-known lines.

## Playing

```bash
npm install
npm run dev
```

- `npm test`: core tests, plus validation of every chapter
- `npm run build`: production build in `dist/`
- `npm run deploy`: build and publish `dist/` to the `gh-pages` branch

## Chapters

Chapters are described in `scripts/level-specs.ts`: book, chapter number, title, grid size and the passage. Each `{WORD}` in the passage is a word to find, and their letters must add up to rows × cols exactly. The generator lays them out:

```bash
npm run levels:generate              # all chapters
npm run levels:generate -- 3 --seed 7   # redo only the third, with another layout
```

It randomizes layouts and only accepts grids where each word can be traced in **exactly one place**. It keeps the bendiest valid layout. Pick a grid shape close to the illustration's, so the reveal crops as little of it as possible. Most chapters use 6×7 to 7×8; on phones, 8 columns is the practical limit. A picture that is a scan of a whole page takes a `crop` (fractions of the image) to keep only the drawing.

Books are listed in `src/core/books.ts`.

## Languages

All interface text goes through `t()` in `src/i18n/`. To add a language, add a catalog next to `en.ts` with the same keys. Counted messages use `_one` / `_other` keys, picked by `Intl.PluralRules`.

Book content (passages, and the words in the grid) is per language too. A translated chapter needs its own grid, because the words to find change.

## Rights

Only public-domain texts and illustrations: Austen's text, Thomson's 1894 drawings (he died in 1920) and Brock's 1895 drawings (he died in 1938). The game serves its own copies from `public/art/`: all of Thomson's edition from Project Gutenberg (ebook #1342: every plate, chapter heading and illustrated initial), plus the Thomson and Brock scans on Wikimedia Commons. `npm run art:fetch` downloads them again, and `public/art/catalog.json` records each picture's chapter, caption and source. Page scans are trimmed in the browser with each level's `crop`.
