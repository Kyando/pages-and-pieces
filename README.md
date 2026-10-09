# Twice Told Tales

A word puzzle that retells classic books, one illustrated chapter at a time.

Each chapter is a scene from the book. Its key words are listed above the grid, and every letter in the grid belongs to exactly one of them. Words never go diagonal or cross, but they can bend into L, Z or square shapes, like Tetris pieces. Each word you find uncovers its piece of the chapter's original illustration. Find them all and the finished drawing lifts off the board onto a desk, beside the pages of the scene with every word in place.

The game opens on the shelf: the books standing side by side, each showing how far it has been read. The free books come first, then the paid shelves (Austen’s Shelf, The Heroines). Alice and the Three Little Pigs make a kids’ edition, a preview that isn’t in the first release: `npm run dev` shows it on a shelf of its own, and so does a build made with `VITE_KIDS_EDITION=true`; other builds leave its chapters and pictures out (`src/levels/catalog.ts`). A paid book’s first four scenes are free (`FREE_CHAPTERS` in `src/core/books.ts`); after them its chapters stay sealed, with a way to unlock the shelf. Buying is not built yet: the unlock dialog says purchases come with the store releases, and owned shelves are kept in the save (`shelves`). A book opens on its library: its chapters as prints on a table, volume by volume. Finished chapters show their illustration, the next one waits as a blank sheet, and the rest stay face down until the story reaches them. Each book is read in its own order; finishing a chapter of one never opens another's.

It is also a phone app, the same game wrapped with Capacitor: see [docs/app.md](docs/app.md) for building it and publishing it. Even on the web it behaves like an app rather than a web page:

- **No site header.** Each screen has its own bar, clear of the phone's notch. In a chapter, it holds the way back to the chapters, the chapter between its arrows with one dot per word, and a ⋯ menu (start over, with a confirmation; sound; how to play). The shelf and the chapter list have a settings sheet: sound, how to play, the credits, and starting a book (or everything) again.
- **The back button works like an app's.** Every step deeper (shelf → chapters → chapter) is a history entry, and so is every open dialog. Back (a phone's button, or the browser's) closes the dialog, then steps out one screen at a time, and only leaves from the shelf. A reload keeps the screen.
- **Offline-ready type.** The fonts ship with the game (`src/fonts.ts`, from Fontsource) instead of loading from Google.
- **Touch, not mouse.** No double-tap zoom, no text selection or system menu on a long press (except reading text), hover effects only where there is a mouse, and a press effect on every button.
- **Sharing** opens the phone's share sheet with the chapter's picture attached, where the device allows it.

The shelf holds:

- **Pride and Prejudice** (Jane Austen, 1813): 41 chapters covering the whole story, with Hugh Thomson's 1894 illustrations and, where he left a scene undrawn, C. E. Brock's from 1895. The passages retell each scene in plain modern English and keep Austen's best-known lines.
- **Alice's Adventures in Wonderland** (Lewis Carroll, 1865): a first taste, five scenes from chapters I–IV, with John Tenniel's drawings as he coloured them for *The Nursery "Alice"* (1890), Carroll's own telling for small children.
- **A Christmas Carol** (Charles Dickens, 1843), free: the whole story in ten scenes, with Arthur Rackham’s 1915 colour plates and drawings.
- **Austen’s Shelf** (paid; each book’s first four scenes free): **Persuasion**, the whole story in 17 scenes, with C. E. Brock’s coloured plates and Hugh Thomson’s drawings; **Emma** in 24 scenes, with Thomson’s 1896 drawings and Brock’s colour plates; **Sense and Sensibility** in 25 scenes, with Thomson’s 1896 drawings.
- **The Heroines** (paid; each book’s first four scenes free): **Jane Eyre** in 14 scenes, one for each of F. H. Townsend’s 1897 drawings; **Little Women** in 30 scenes, both parts (with *Good Wives*), with Frank T. Merrill’s 1880 drawings.
- **The Three Little Pigs** (L. Leslie Brooke, 1904), for young readers (6+): the whole tale in five short scenes to read aloud, with Brooke's colour plates. Its boards are small (4 × 5 and 5 × 6), and its words run straight or bend only once, reading forwards wherever they can. The telling is a kind one: the wolf eats nobody, and runs off for good.

## Playing

```bash
npm install
npm run dev
```

- `npm test`: core tests, plus validation of every chapter
- `npm run build`: production build in `dist/`
- `npm run deploy`: build and publish `dist/` to the `gh-pages` branch
- `npm run app:sync`: build and copy the game into the Android and iOS projects ([docs/app.md](docs/app.md))

The build ships only the pictures the game shows (`scripts/prune-art.ts`).

## Paper edition

Two printable prototypes, built from the same chapters:

- `book.html`: the book, shown as open spreads (each PDF page is two book pages side by side). Its pages are A5, so a spread prints on one A4 sheet in landscape; `size=large` makes them 19 × 23.5 cm. A chapter takes two spreads. First the scene with its blanks on the left, facing its grid on the right, so you read and search without turning. Then, overleaf, the whole scene on the left, facing the illustration on the right: the right-hand page is where the eye lands after a turn, and the picture's back is text, not a grid, so it never shows through while solving. Front matter (Thomson's 1894 title page facing ours, how to play), a part opening per volume, answers and notes at the back.
- `print.html`: loose A4 sheets for a home printer. One sheet per chapter, the puzzle on the front and its reward overleaf (print double-sided).

How much help a page gives is set in the toolbar (and kept in the URL): the word list shown, upside down at the foot, or only at the back (`list=above|foot|back`); one word per scene already written in and shaded on the grid (`given=1`); every word's first letter (`firsts=1`); start dots on the grid (`dots=1`). `levels=1-4` picks the chapters. Ready-made PDFs of the first four chapters are in `docs/print/` (the A5 book and the A4 sheets), each in two versions: A with the word list, B with story clues (list upside down, one word given, first letters).

## Chapters

Chapters are described in `scripts/level-specs.ts`: book, chapter number, title, grid size and the passage. Each `{WORD}` in the passage is a word to find, and their letters must add up to rows × cols exactly. The generator lays them out:

```bash
npm run levels:generate              # all chapters
npm run levels:generate -- 3 --seed 7   # redo only the third, with another layout
npm run levels:check -- emma            # letters against grid size, and words inside other words
```

It randomizes layouts and only accepts grids where each word can be traced in **exactly one place**. It keeps the bendiest valid layout; for a book marked `young`, it instead allows one bend per word at most and prefers words that read forwards and straight. Pick a grid shape close to the illustration's, so the reveal crops as little of it as possible. Most chapters use 6×7 to 7×8; on phones, 8 columns is the practical limit. A picture that is a scan of a whole page takes a `crop` (fractions of the image) to keep only the drawing.

Books are listed in `src/core/books.ts`, in shelf order, each with its cover picture (one no chapter reveals) and a line for the shelf. Chapter files are numbered across the whole shelf, a book at a time, in the order the books were added (`01`–`41` Pride and Prejudice, then Alice, the Pigs, A Christmas Carol, Persuasion, Emma, Sense and Sensibility, Jane Eyre, Little Women), so `levels:generate -- 42` is Alice's first scene. Files are numbered with three digits (`001-…`), since there are more than 99. A new book goes at the end of `SPECS`; its place on the shelf comes from `BOOKS`. A layout depends only on its scene's id, so inserting scenes into a book renumbers the files after it but leaves their boards as they were.

## Languages

All interface text goes through `t()` in `src/i18n/`. To add a language, add a catalog next to `en.ts` with the same keys. Counted messages use `_one` / `_other` keys, picked by `Intl.PluralRules`.

Book content (passages, and the words in the grid) is per language too. A translated chapter needs its own grid, because the words to find change.

## Rights

Only public-domain texts and illustrations: Austen's and Carroll's texts and the old folk tale; Thomson's 1894 drawings (he died in 1920), Brock's 1895 drawings (he died in 1938), Tenniel's 1865 drawings (he died in 1914) and Brooke's 1904 pictures (he died in 1940). The game serves its own copies from `public/art/`:

- all of Thomson's edition from Project Gutenberg (ebook #1342: every plate, chapter heading and illustrated initial), plus the Thomson and Brock scans on Wikimedia Commons;
- Tenniel's 42 drawings, from Wikimedia Commons' scans of the 1869 German edition, printed from the original woodblocks (black and white: kept for a printed book), and the 20 he coloured for *The Nursery "Alice"* (1890), whole-page scans on Wikimedia Commons, which the game uses;
- all of Brooke's *Story of the Three Little Pigs* from Project Gutenberg (ebook #18155). Its plates are only about 500 pixels tall; a better scan would sharpen the desk on large screens.

- for the books added later: Rackham’s *A Christmas Carol* (1915; he died in 1939, Gutenberg #24022), Thomson’s *Sense and Sensibility* (Gutenberg #21839), Townsend’s *Jane Eyre* (1897; he died in 1920, Gutenberg #1260), Merrill’s *Little Women* (1880; he died in 1936, Gutenberg #37106), and the Thomson and Brock *Persuasion* and *Emma* scans on Wikimedia Commons. Brock’s *Persuasion* plates are only 600 pixels tall there; better scans would sharpen them.

`npm run art:fetch` downloads them all again, and `npm run art:fetch -- tenniel brooke` only some (sources: `thomson`, `brock`, `tenniel`, `nursery`, `brooke`, `rackham`, `persuasion`, `emma`, `sense`, `townsend`, `merrill`). `public/art/catalog.json` records each picture's chapter, caption and source. Page scans are trimmed in the browser with each level's `crop`, and a yellowed black-and-white scan is whitened too; a coloured plate is marked `colour`, so it keeps its colours.
