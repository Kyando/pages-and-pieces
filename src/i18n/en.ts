/** English interface text. Other languages copy these keys; `Messages` keeps them complete. */
export const en = {
  'game.name': 'Pages & Pieces',

  'top.chapters': 'Chapters',
  'top.help': 'How to play',
  'top.sound': 'Sound',
  'top.theme': 'Theme',

  'theme.system': 'System theme',
  'theme.light': 'Light theme',
  'theme.dark': 'Dark theme',

  'level.prev': 'Previous chapter',
  'level.next': 'Next chapter',
  'level.eyebrow': '{book} · Chapter {chapter}',
  'level.words': 'Find these words',
  'level.passage': 'The scene',
  'level.board': 'Letters',
  'level.hint': 'Drag across the letters',
  'level.restart': 'Start over',
  'level.restarted': 'Board cleared.',
  'level.nextButton': 'Next chapter',
  'level.lastButton': 'All chapters',
  'level.wordCount_one': '{found}/{count} word',
  'level.wordCount_other': '{found}/{count} words',

  'chapters.title': 'Chapters',
  'chapters.meta': 'Chapter {chapter} · {rows}×{cols}',
  'chapters.by': 'by {author}, {year}',

  'win.title': 'Chapter complete!',
  'win.words_one': 'word',
  'win.words_other': 'words',
  'win.misses_one': 'miss',
  'win.misses_other': 'misses',
  'win.share': 'Share',
  'win.next': 'Next',
  'win.chapters': 'Chapters',
  'win.shareText': '{game} · {book}, chapter {chapter}\n{verdict}',
  'win.flawless': '✨ no misses',
  'win.missCount_one': '{count} miss',
  'win.missCount_other': '{count} misses',
  'win.copied': 'Result copied!',
  'win.copyFailed': 'Could not copy',

  'help.title': 'How to play',
  'help.intro': 'Each chapter is a scene from a classic book. Its words are hidden in the grid, and {strong} belongs to one of them.',
  'help.introStrong': 'every letter',
  'help.drag': 'Drag across neighbouring letters to spell a word. No diagonals, but words can {strong}: into an L, a Z, even a square.',
  'help.dragStrong': 'bend',
  'help.reveal': 'Each word you find uncovers its piece of the chapter’s illustration.',
  'help.both': 'Words read either way, and you can also tap letter by letter.',
  'help.finish': 'Find them all to see the whole picture and read the scene they tell.',
  'help.go': 'Let’s read',

  'modal.close': 'Close',
  'empty': 'No valid chapters found in src/levels.',
} as const;

export type Messages = { readonly [K in keyof typeof en]: string };
