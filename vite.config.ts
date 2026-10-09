import { defineConfig } from 'vitest/config';
import { pruneArt } from './scripts/prune-art.ts';

export default defineConfig({
  // Relative base so the build works from any folder (itch.io, GitHub Pages, file server).
  base: './',
  // Only the pictures the game shows ship with it (see scripts/prune-art.ts).
  plugins: [pruneArt()],
  build: {
    // The game, and the printable paper editions (loose A4 sheets, and book spreads).
    rollupOptions: { input: { main: 'index.html', print: 'print.html', book: 'book.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
