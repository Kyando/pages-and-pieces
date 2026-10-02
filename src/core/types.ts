/** A word laid on the grid. `path` lists cell indices (row * cols + col) from the first letter to the last. */
export interface WordDef {
  text: string;
  path: number[];
}

/** A chapter's scene: a passage whose blanks are the words to find, over the book's own illustration. */
export interface StoryDef {
  /** The passage, with each word to find written as {WORD}. */
  text: string;
  /** Illustration URL. */
  image: string;
  /** What the picture shows: its original caption. */
  caption: string;
  credit: string;
}

export interface LevelDef {
  id: string;
  /** Key into BOOKS. */
  book: string;
  /** The book's chapter this scene comes from. */
  chapter: number;
  title: string;
  rows: number;
  cols: number;
  /** One string per row, for readability; must match the word paths. '.' is an empty cell. */
  grid: string[];
  words: WordDef[];
  story: StoryDef;
}
