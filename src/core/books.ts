/** The books chapters come from. Only public-domain texts and illustrations. */
export interface Book {
  title: string;
  author: string;
  year: number;
}

export const BOOKS: Record<string, Book> = {
  'pride-and-prejudice': { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
};
