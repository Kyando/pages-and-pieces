/** Quick check while writing chapters: each spec's letters against its grid, and words inside other words. */
import { SPECS } from './level-specs.ts';

const filter = process.argv[2] ?? '';
for (const [i, s] of SPECS.entries()) {
  if (!s.id.includes(filter)) continue;
  const words = [...s.story.text.matchAll(/\{([A-Z]+)\}/g)].map((m) => m[1]);
  const total = words.reduce((n, w) => n + w.length, 0);
  const need = s.rows * s.cols;
  const nested = words.flatMap((a) => words.filter((b) => a !== b && a.includes(b)).map((b) => `${b}⊂${a}`));
  const flag = total !== need || nested.length ? '✗' : '✓';
  console.log(`${flag} ${String(i + 1).padStart(3)} ${s.id.padEnd(40)} ${total}/${need} (${s.rows}×${s.cols})${total !== need ? ` off by ${total - need}` : ''} ${nested.join(' ')}`);
}
