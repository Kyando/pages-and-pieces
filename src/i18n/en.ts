/** English interface text. Other languages copy these keys; `Messages` keeps them complete. */
export const en = {
  'game.name': 'Twice Told Tales',

  'top.library': 'All chapters',
  'top.help': 'How to play',
  'top.sound': 'Sound',

  'level.prev': 'Previous chapter',
  'level.next': 'Next chapter',
  'level.nextLocked': 'Finish this chapter to read on',
  'level.eyebrow': '{book} · Chapter {chapter}',
  'level.words': 'Find these words',
  'level.board': 'Letters',
  'level.hint': 'Drag across the letters',
  'level.restart': 'Start over',
  'level.restarted': 'Board cleared.',
  'level.wordCount_one': '{found}/{count} word',
  'level.wordCount_other': '{found}/{count} words',

  'desk.label': 'The finished chapter',
  'desk.chapter': 'Chapter {n}',
  'desk.by': '{author}, {year}',
  'desk.next': 'Next chapter',
  'desk.turn': 'The chapter’s pages: tap to turn',
  'desk.hint': 'Tap the drawing to read the scene',
  'desk.chapters': 'All chapters',
  'desk.again': 'Play again',
  'desk.share': 'Share',
  'desk.shareText': '{game} · I pieced together {book}, chapter {chapter}: “{title}”',
  'desk.copied': 'Copied!',
  'desk.copyFailed': 'Could not copy',

  'library.label': 'The book’s chapters',
  'library.by': '{author} · {year}',
  'library.begin': 'Begin the story',
  'library.continue': 'Continue reading',
  'library.finished': 'The End. Every chapter is yours to revisit.',
  'library.chapter': 'Chapter {n}',
  'library.locked': '{chapter}, not yet reached',
  'library.erase': 'Erase my progress',

  'erase.title': 'Start the book again?',
  'erase.body': 'Every chapter you have read will be forgotten, and its picture face down again. This cannot be undone.',
  'erase.cancel': 'Keep my progress',
  'erase.confirm': 'Erase it all',

  'help.title': 'How to play',
  'help.intro': 'Each chapter is a scene from a classic book. Its words are hidden in the grid, and {strong} belongs to one of them.',
  'help.introStrong': 'every letter',
  'help.drag': 'Drag across neighbouring letters to spell a word. No diagonals, but words can {strong}: into an L, a Z, even a square.',
  'help.dragStrong': 'bend',
  'help.reveal': 'Each word you find turns to ink and draws its piece of the chapter’s illustration.',
  'help.both': 'Words read either way, and you can also tap letter by letter.',
  'help.finish': 'Find them all to finish the picture, and receive the scene it tells.',
  'help.go': 'Let’s read',

  'modal.close': 'Close',
  'empty': 'No valid chapters found in src/levels.',
} as const;

export type Messages = { readonly [K in keyof typeof en]: string };
