import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works from any folder (itch.io, GitHub Pages, file server).
  base: './',
  build: {
    // The game, and the printable paper editions (loose A4 sheets, and book spreads).
    rollupOptions: { input: { main: 'index.html', print: 'print.html', book: 'book.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
