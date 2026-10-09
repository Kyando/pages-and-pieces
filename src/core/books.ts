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
   * Part of the kids’ edition, a shelf of its own. Not in the first release: only the dev server, or
   * a build with VITE_KIDS_EDITION=true, includes it (see src/levels/catalog.ts).
   */
  kids?: boolean;
  /**
   * The book's characters and places, as written in the grid. A passage may only hide one of these
   * after the player has met it in plain text (see `unintroducedNames`).
   */
  names: string[];
  /** The book's parts, by the chapter each begins with. */
  volumes?: { from: number; name: string; title: string }[];
  /**
   * The paid shelf the book belongs to; a book without one is free. A paid book's first
   * FREE_CHAPTERS scenes are free too, so the player meets the story before deciding.
   */
  shelf?: ShelfId;
}

/** Books sold together, as one purchase each. */
export type ShelfId = 'austen' | 'heroines';

export const SHELVES: Record<ShelfId, { title: string; blurb: string }> = {
  austen: { title: 'Austen’s Shelf', blurb: 'Persuasion, Emma, and Sense and Sensibility.' },
  heroines: { title: 'The Heroines', blurb: 'Jane Eyre and Little Women.' },
};

/** Scenes of a paid book anyone can play. */
export const FREE_CHAPTERS = 4;

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
  'a-christmas-carol': {
    title: 'A Christmas Carol',
    author: 'Charles Dickens',
    year: 1843,
    cover: 'art/rackham-1915/019-img07.jpg',
    blurb: 'One cold old miser, three spirits, and a single night to change his life.',
    names: ['SCROOGE', 'EBENEZER', 'MARLEY', 'JACOB', 'FRED', 'BOB', 'CRATCHIT', 'TIM', 'FEZZIWIG', 'BELLE', 'TOPPER', 'JOE'],
  },
  persuasion: {
    title: 'Persuasion',
    author: 'Jane Austen',
    year: 1817,
    cover: 'art/persuasion-brock-1898/pers-brock-13.jpg',
    blurb: 'Eight years after she was persuaded to give him up, he comes back.',
    shelf: 'austen',
    names: [
      'ANNE', 'ELLIOT', 'WALTER', 'ELIZABETH', 'MARY', 'RUSSELL', 'SHEPHERD', 'CROFT', 'SOPHIA',
      'WENTWORTH', 'FREDERICK', 'CHARLES', 'MUSGROVE', 'LOUISA', 'HENRIETTA', 'HARVILLE', 'BENWICK', 'CLAY',
      'KELLYNCH', 'UPPERCROSS', 'LYME', 'BATH',
    ],
  },
  emma: {
    title: 'Emma',
    author: 'Jane Austen',
    year: 1815,
    cover: 'art/emma-brock-1909/emma-ce-brock-1909-vol-iii-chapter-vii.jpg',
    blurb: 'Handsome, clever and rich, she means never to marry, only to arrange everyone else.',
    shelf: 'austen',
    names: [
      'EMMA', 'WOODHOUSE', 'KNIGHTLEY', 'GEORGE', 'TAYLOR', 'WESTON', 'HARRIET', 'SMITH', 'MARTIN', 'ROBERT',
      'ELTON', 'FRANK', 'CHURCHILL', 'JANE', 'FAIRFAX', 'BATES', 'ISABELLA',
      'HARTFIELD', 'HIGHBURY', 'DONWELL', 'RANDALLS', 'LONDON',
    ],
  },
  'sense-and-sensibility': {
    title: 'Sense and Sensibility',
    author: 'Jane Austen',
    year: 1811,
    cover: 'art/sense-thomson-1896/001-mr-dashwood-introduced-him-p-219.jpg',
    blurb: 'Two sisters, one all sense and one all feeling, and the men who test them both.',
    shelf: 'austen',
    names: [
      'DASHWOOD', 'HENRY', 'JOHN', 'FANNY', 'HARRY', 'ELINOR', 'MARIANNE', 'MARGARET', 'EDWARD', 'FERRARS',
      'WILLOUGHBY', 'BRANDON', 'MIDDLETON', 'JENNINGS', 'LUCY', 'STEELE', 'NORLAND', 'BARTON', 'LONDON',
    ],
  },
  'jane-eyre': {
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    year: 1847,
    cover: 'art/townsend-1897/007-i-said-my-evening-prayers.jpg',
    blurb: 'A plain, poor governess who will not be anyone’s possession, not even his.',
    shelf: 'heroines',
    names: [
      'JANE', 'EYRE', 'REED', 'JOHN', 'GATESHEAD', 'LOWOOD', 'BROCKLEHURST', 'HELEN', 'BURNS', 'TEMPLE',
      'THORNFIELD', 'ROCHESTER', 'EDWARD', 'ADELE', 'FAIRFAX', 'PILOT', 'GRACE', 'POOLE', 'BLANCHE', 'INGRAM',
    ],
  },
  'little-women': {
    title: 'Little Women',
    author: 'Louisa May Alcott',
    year: 1868,
    cover: 'art/merrill-1880/001-they-all-drew-to-the-fire.jpg',
    blurb: 'Four sisters, one hard winter, and a house full of love while their father is at war.',
    shelf: 'heroines',
    names: ['MEG', 'JO', 'BETH', 'AMY', 'MARCH', 'MARMEE', 'HANNAH', 'LAURIE', 'LAURENCE', 'HUMMEL', 'BROOKE'],
  },
  'alice-in-wonderland': {
    title: 'Alice’s Adventures in Wonderland',
    author: 'Lewis Carroll',
    year: 1865,
    cover: 'art/nursery-alice-1890/c06544-02.jpg',
    blurb: 'A girl follows a White Rabbit down a hole, and nothing makes sense ever after.',
    kids: true,
    names: ['ALICE', 'DINAH', 'DODO', 'BILL', 'WONDERLAND'],
  },
  'three-little-pigs': {
    title: 'The Three Little Pigs',
    author: 'L. Leslie Brooke',
    year: 1904,
    cover: 'art/brooke-1904/pigs-title.jpg',
    blurb: 'Straw, sticks or bricks? A story to read together.',
    young: true,
    kids: true,
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
