# Pages & Pieces

A word puzzle that retells classic books, one illustrated chapter at a time.

Each chapter is a scene from the book. Its key words are listed above the grid, and every letter in the grid belongs to exactly one of them. Words never go diagonal or cross, but they can bend into L, Z or square shapes, like Tetris pieces. Each word you find uncovers its piece of the chapter's original illustration. Find them all and the whole picture closes over the board, while the word list turns into the scene's passage with every word in place.

The first book is **Pride and Prejudice** (Jane Austen, 1813), with Hugh Thomson's 1894 illustrations. The passages retell each scene in plain modern English and keep Austen's best-known lines.

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

It randomizes layouts and only accepts grids where each word can be traced in **exactly one place**. It keeps the bendiest valid layout. Pick a grid shape close to the illustration's, so the reveal crops as little of it as possible. Most chapters use 6×7 to 7×8; on phones, 8 columns is the practical limit.

Books are listed in `src/core/books.ts`.

## Languages

All interface text goes through `t()` in `src/i18n/`. To add a language, add a catalog next to `en.ts` with the same keys. Counted messages use `_one` / `_other` keys, picked by `Intl.PluralRules`.

Book content (passages, and the words in the grid) is per language too. A translated chapter needs its own grid, because the words to find change.

## Rights

Only public-domain texts and illustrations: Austen's text, and Thomson's 1894 drawings (he died in 1920). For now the images load from Wikimedia Commons. Before release they should ship with the game, as cleaned-up crops without the page captions.
