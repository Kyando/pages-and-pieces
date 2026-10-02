import type { Word } from '../core/puzzle.ts';
import type { StoryDef } from '../core/types.ts';
import { h } from './dom.ts';

/**
 * A chapter's passage, with each {WORD} handed to `blank` (the level's word of that text) so the
 * caller decides how a blank looks: empty until found in play, filled in on the win screen.
 */
export function passage(story: StoryDef, words: Word[], blank: (w: Word) => Node): HTMLElement {
  const parts = story.text.split(/\{([A-Z]+)\}/);
  const used = new Map<string, number>();
  return h(
    'p',
    { class: 'passage' },
    ...parts.map((part, i) => {
      if (i % 2 === 0) return part;
      const n = used.get(part) ?? 0;
      used.set(part, n + 1);
      return blank(words.filter((w) => w.text === part)[n]);
    }),
  );
}
