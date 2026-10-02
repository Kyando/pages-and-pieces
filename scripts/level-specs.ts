import type { LevelSpec } from '../src/core/generate.ts';

/**
 * The chapters, in play order. `npm run levels:generate` lays them out.
 * Passages retell each scene in plain modern English, keeping Austen's famous lines; every {WORD}
 * is a word to find, and their letters fill the grid exactly. The grid's shape follows the
 * illustration's, so the reveal crops as little of it as possible.
 */

const PP = 'pride-and-prejudice';
const THOMSON = 'Hugh Thomson, 1894';
const commons = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

export const SPECS: LevelSpec[] = [
  {
    id: 'pp-01-good-fortune',
    book: PP,
    chapter: 1,
    title: 'A Single Man of Good Fortune',
    rows: 7,
    cols: 6,
    story: {
      text: 'It is a truth universally acknowledged that a single man with a good {FORTUNE} must be in want of a {WIFE}. So when {NETHERFIELD} Park is finally let to a rich young gentleman, Mr. {BINGLEY}, Mrs. Bennet can think of nothing but seeing one of her five daughters {MARRIED} to him. Mr. Bennet only teases her, and she protests that he has no pity for her poor {NERVES}.',
      image: commons('4/4d/Thomson-PP03.jpg'),
      caption: 'Mr. and Mrs. Bennet',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-03-the-party-enters',
    book: PP,
    chapter: 3,
    title: 'The Party Enters',
    rows: 8,
    cols: 6,
    story: {
      text: 'At the {ASSEMBLY} in Meryton, every head turns when Mr. {BINGLEY} arrives with his two {SISTERS} and his friend, Mr. {DARCY}: tall, handsome and {NOBLE} in bearing. Within five minutes the whole room has heard he has ten {THOUSAND} a year. Within the hour, everyone has decided he is the {PROUDEST} man in the world.',
      image: commons('8/85/Thomson-PP04.jpg'),
      caption: 'When the party entered',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-03-tolerable',
    book: PP,
    chapter: 3,
    title: 'She Is Tolerable',
    rows: 7,
    cols: 7,
    story: {
      text: 'Across the {BALL} at {MERYTON}, {BINGLEY} begs his friend to dance with {ELIZABETH}. {DARCY} barely glances at her: “She is {TOLERABLE}, but not {HANDSOME} enough to tempt me.” Elizabeth hears every word, and turns it into a story that makes all her friends laugh.',
      image: commons('d/d6/Thomson-PP05.jpg'),
      caption: 'She is tolerable',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-07-rain',
    book: PP,
    chapter: 7,
    title: 'A Ride in the Rain',
    rows: 7,
    cols: 6,
    story: {
      text: 'An {INVITATION} arrives from Netherfield: the Bingley sisters ask {JANE} to dine. Mrs. Bennet has a {SCHEME}. Jane must go on {HORSEBACK}, because it looks like {RAIN}, and then she will simply have to stay the {NIGHT}. The plan works all too well: Jane arrives soaked, and wakes up with a terrible {COLD}.',
      image: commons('thumb/b/b3/Thompson-PP-Ch7.JPG/1280px-Thompson-PP-Ch7.JPG'),
      caption: 'Cheerful prognostics',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-09-mamma-calls',
    book: PP,
    chapter: 9,
    title: 'Mamma Comes to Call',
    rows: 7,
    cols: 7,
    story: {
      text: 'Mrs. Bennet comes to Netherfield to see poor Jane, bringing her youngest girls, {KITTY} and {LYDIA}. She praises the {COUNTRY} to Mr. {DARCY}’s face, as if to put him in his place, while {ELIZABETH} wishes the floor would swallow her whole. Then bold Lydia reminds Mr. {BINGLEY} of his {PROMISE} to throw a {BALL}.',
      image: commons('thumb/5/50/Thompson-PP-Ch9.JPG/1280px-Thompson-PP-Ch9.JPG'),
      caption: 'Mrs. Bennet and her two youngest girls',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-11-by-the-fire',
    book: PP,
    chapter: 11,
    title: 'By the Fire',
    rows: 7,
    cols: 8,
    story: {
      text: 'When {JANE} is well enough to come downstairs, Mr. {BINGLEY} has eyes for no one else. He piles up the {FIRE}, moves her away from the {DOOR} so she won’t feel a chill, and sits beside her all {EVENING}. Across the room, {CAROLINE} Bingley tries every bit of {FLATTERY} she knows to win Mr. {DARCY}’s {ATTENTION}.',
      image: commons('0/0f/Thomson-PP07.jpg'),
      caption: 'Piling up the fire',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-14-sermons',
    book: PP,
    chapter: 14,
    title: 'Mr. Collins Reads Aloud',
    rows: 8,
    cols: 6,
    story: {
      text: 'Mr. {COLLINS}, the {COUSIN} who will one day inherit {LONGBOURN}, has come to stay, and cannot stop praising his patroness, Lady {CATHERINE} de Bourgh. Asked to read to the family, he refuses to touch a {NOVEL} and picks a book of {SERMONS} instead. Three pages in, {LYDIA} interrupts him to gossip about the officers.',
      image: commons('2/24/Thomson-PP08.jpg'),
      caption: 'Protested that he never read novels',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-15-a-stranger',
    book: PP,
    chapter: 15,
    title: 'A Stranger in Town',
    rows: 8,
    cols: 6,
    story: {
      text: 'On a walk into {MERYTON}, the sisters meet a stranger full of easy {CHARM}: Mr. {WICKHAM}, about to join the {REGIMENT} with the other {OFFICERS}. Then Mr. {DARCY} rides by. The two men catch sight of each other, and one turns {WHITE}, the other {RED}. Whatever happened between them?',
      image: commons('8/82/Thomson-PP09.jpg'),
      caption: 'The officers of the ——shire',
      credit: THOMSON,
    },
  },
];
