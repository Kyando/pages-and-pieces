import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works from any folder (itch.io, GitHub Pages, file server).
  base: './',
  build: {
    // The game, and the printable paper edition.
    rollupOptions: { input: { main: 'index.html', print: 'print.html' } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
