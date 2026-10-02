/** The books chapters come from. Only public-domain texts and illustrations. */
export interface Book {
  title: string;
  author: string;
  year: number;
  /**
   * The book's characters and places, as written in the grid. A passage may only hide one of these
   * after the player has met it in plain text (see `unintroducedNames`).
   */
  names: string[];
  /** Pressed into the wax seal on a finished chapter's letter. */
  monogram?: string;
}

export const BOOKS: Record<string, Book> = {
  'pride-and-prejudice': {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: 1813,
    monogram: 'P&P',
    names: [
      'BENNET', 'ELIZABETH', 'LIZZY', 'JANE', 'MARY', 'KITTY', 'LYDIA',
      'BINGLEY', 'CAROLINE', 'HURST', 'DARCY', 'GEORGIANA', 'WICKHAM', 'DENNY',
      'COLLINS', 'CATHERINE', 'CHARLOTTE', 'LUCAS', 'GARDINER', 'FITZWILLIAM',
      'LONGBOURN', 'NETHERFIELD', 'MERYTON', 'ROSINGS', 'PEMBERLEY', 'HUNSFORD', 'LONDON', 'BRIGHTON',
    ],
  },
};

/**
 * Names hidden before the player could know them. A character or place must first appear in plain
 * text (in an earlier chapter of the book, or earlier in the same passage) before it can be a blank:
 * finding it should feel like remembering the story, not guessing.
 */
export function unintroducedNames(passages: string[], names: string[]): string[] {
  const known = new Set<string>();
  const errors: string[] = [];
  passages.forEach((text, chapter) => {
    text.split(/\{([A-Z]+)\}/).forEach((part, i) => {
      if (i % 2 === 0) {
        for (const name of names) if (new RegExp(`\\b${name}\\b`, 'i').test(part)) known.add(name);
      } else {
        if (names.includes(part) && !known.has(part)) errors.push(`${part} is hidden in passage ${chapter + 1} before it is introduced`);
        known.add(part);
      }
    });
  });
  return errors;
}
