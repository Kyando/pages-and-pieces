/** The books chapters come from, in their order on the shelf. Only public-domain texts and illustrations. */
export interface Book {
  title: string;
  author: string;
  year: number;
  /** The book's face on the shelf: a picture from the edition that no chapter reveals. */
  cover: string;
  /** One line on the shelf, under the title. */
  blurb: string;
  /**
   * For young readers (6+): small boards whose words run straight or bend once, read forwards where
   * they can, and short scenes made to be read aloud.
   */
  young?: boolean;
  /**
   * The book's characters and places, as written in the grid. A passage may only hide one of these
   * after the player has met it in plain text (see `unintroducedNames`).
   */
  names: string[];
  /** The book's parts, by the chapter each begins with. */
  volumes?: { from: number; name: string; title: string }[];
}

export const BOOKS: Record<string, Book> = {
  'pride-and-prejudice': {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: 1813,
    cover: 'art/thomson-1894/ch00-front.jpg',
    blurb: 'Five sisters, one proud gentleman, and a first impression that is all wrong.',
    names: [
      'BENNET', 'ELIZABETH', 'LIZZY', 'JANE', 'MARY', 'KITTY', 'LYDIA',
      'BINGLEY', 'CAROLINE', 'HURST', 'DARCY', 'GEORGIANA', 'WICKHAM', 'DENNY',
      'COLLINS', 'CATHERINE', 'CHARLOTTE', 'LUCAS', 'GARDINER', 'FITZWILLIAM',
      'LONGBOURN', 'NETHERFIELD', 'MERYTON', 'ROSINGS', 'PEMBERLEY', 'HUNSFORD', 'LONDON', 'BRIGHTON',
    ],
    volumes: [
      { from: 1, name: 'Volume I', title: 'First Impressions' },
      { from: 24, name: 'Volume II', title: 'The Truth Comes Out' },
      { from: 43, name: 'Volume III', title: 'Second Impressions' },
    ],
  },
  'alice-in-wonderland': {
    title: 'Alice’s Adventures in Wonderland',
    author: 'Lewis Carroll',
    year: 1865,
    cover: 'art/nursery-alice-1890/c06544-02.jpg',
    blurb: 'A girl follows a White Rabbit down a hole, and nothing makes sense ever after.',
    names: ['ALICE', 'DINAH', 'DODO', 'BILL', 'WONDERLAND'],
  },
  'three-little-pigs': {
    title: 'The Three Little Pigs',
    author: 'L. Leslie Brooke',
    year: 1904,
    cover: 'art/brooke-1904/pigs-title.jpg',
    blurb: 'Straw, sticks or bricks? A story to read together.',
    young: true,
    names: [],
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
