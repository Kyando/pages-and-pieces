# App icon

The icon is two pieces kept apart, put together by `npm run app:icons` (`scripts/make-icons.ts`):

- `portrait.jpg`: the painting alone, with nothing over it. AI-generated in Canva (media `MAHXiGUrt3I`, 1264 × 1264, a tile-free edit of `MAHXh8jq_t8`). **This copy is only 200 × 200**, the largest Canva lets us fetch; for a sharp icon, download the full-size one from Canva and put it in this one's place (as `portrait.png`, `.jpg` or `.webp`).
- `grid.svg`: the letter board alone, on a transparent background, as a vector, so it scales to any size. `grid.png` is the same at 256 px per tile (1331 × 2867). Both come from `npm run app:grid` (`scripts/icon-grid.ts`), which holds the board's words: SMART, TALES (traced, in gold), READING, FUN.
- `icon-1024.png`: the result, the board placed over the portrait by `PLACEMENT` in `scripts/make-icons.ts`.
