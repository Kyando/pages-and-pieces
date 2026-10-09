import type { LevelSpec } from '../src/core/generate.ts';

/**
 * The chapters, in play order. `npm run levels:generate` lays them out.
 *
 * Passages retell each scene in plain modern English, keeping Austen's famous lines. Every {WORD} is
 * a word to find, and their letters fill the grid exactly. What to hide:
 * - words the sentence itself points to ("ten {THOUSAND} a year", the famous quotes);
 * - names the player has already met: a character or place appears in plain text first, in an
 *   earlier chapter or earlier in the same passage, and only then becomes a blank (the tests check
 *   this against the book's `names`). Finding it is remembering the story, not guessing.
 *
 * The grid's shape follows the illustration's, so the reveal crops as little of it as possible.
 * Thomson's drawings come from the complete Gutenberg edition, Brock's from Commons scans of whole
 * pages: `crop` trims a picture to the drawing, above its caption (Thomson's hand-lettered, Brock's
 * printed) and the copyright line.
 */

const PP = 'pride-and-prejudice';
const THOMSON = 'Hugh Thomson, 1894';
/** A picture the game serves itself, from public/art (see scripts/fetch-art.ts and its catalog.json). */
const art = (file: string) => `art/${file}`;
const BROCK = 'C. E. Brock, 1895';

const PRIDE: LevelSpec[] = [
  {
    id: 'pp-01-good-fortune',
    book: PP,
    chapter: 1,
    title: 'A Single Man of Good Fortune',
    rows: 7,
    cols: 6,
    story: {
      text: 'It is a truth universally acknowledged that a single man with a good {FORTUNE} must be in want of a {WIFE}. So when Netherfield Park is let at last to Mr. Bingley, a rich young {GENTLEMAN}, Mrs. Bennet can think of nothing but seeing one of her five {DAUGHTERS} {MARRIED} to him. Mr. Bennet only teases her, and she protests that he has no pity for her poor {NERVES}.',
      image: art('thomson-1894/ch01-i_034.jpg'),
      caption: 'Mr. and Mrs. Bennet',
      credit: THOMSON,
      crop: [0, 0, 1, 0.93],
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
      text: 'At the {ASSEMBLY} in Meryton, every head turns when Mr. {BINGLEY} arrives with his two {SISTERS} and his friend, Mr. Darcy: tall, handsome and {NOBLE} in bearing. Within five minutes the whole room has heard he has ten {THOUSAND} a year. Within the hour, everyone has decided he is the {PROUDEST} man in the {WORLD}.',
      image: art('thomson-1894/ch03-i_041.jpg'),
      caption: 'When the party entered',
      credit: THOMSON,
      crop: [0, 0, 1, 0.92],
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
      text: 'Across the {BALL} at {MERYTON}, {BINGLEY} begs his friend to dance with Elizabeth Bennet. {DARCY} barely glances at her: “She is {TOLERABLE}, but not {HANDSOME} enough to tempt me.” {ELIZABETH} hears every word, and turns it into a story that makes all her friends laugh.',
      image: art('thomson-1894/ch03-i_044.jpg'),
      caption: 'She is tolerable',
      credit: THOMSON,
      crop: [0, 0, 1, 0.925],
    },
  },
  {
    id: 'pp-06-fine-eyes',
    book: PP,
    chapter: 6,
    title: 'A Pair of Fine Eyes',
    rows: 8,
    cols: 6,
    story: {
      text: 'At Lucas Lodge, Sir William Lucas tries to {PRESENT} Elizabeth to Mr. Darcy as a {PARTNER} for the next {DANCE}, but she {REFUSES} with a smile. Darcy is left thinking about her pair of {FINE} {EYES}. Meanwhile Charlotte Lucas, Elizabeth’s closest {FRIEND}, warns that Jane hides her {FEELINGS} so well that Mr. Bingley may never know she cares.',
      image: art('brock-1895/mr-darcy-you-must-allow-me-to-present-this-young-lady-to-you-as-a-very-desirable.jpg'),
      caption: 'Mr. Darcy, you must allow me to present this young lady to you',
      credit: BROCK,
      crop: [0.044, 0.068, 0.95, 0.8],
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
      text: 'An {INVITATION} arrives from Netherfield: Caroline Bingley asks Jane, the eldest Bennet girl, to dine. Mrs. Bennet has a {SCHEME}. {JANE} must go on {HORSEBACK}, because it looks like {RAIN}, and then she will simply have to stay the {NIGHT}. The plan works all too well: Jane arrives soaked, and wakes up with a terrible {COLD}.',
      image: art('thomson-1894/ch07-i_069.jpg'),
      caption: 'Cheerful prognostics',
      credit: THOMSON,
      crop: [0, 0, 1, 0.925],
    },
  },
  {
    id: 'pp-07-mud',
    book: PP,
    chapter: 7,
    title: 'Three Miles of Mud',
    rows: 8,
    cols: 6,
    story: {
      text: 'Hearing that Jane is ill, Elizabeth {WALKS} three miles to Netherfield across wet fields, and arrives with her {PETTICOAT} six inches {DEEP} in {MUD}. The {APOTHECARY} says Jane must stay in bed. Caroline Bingley and her sister {SNEER} at Elizabeth’s wild appearance, but Mr. Darcy notices how her {FACE} glows from the {EXERCISE}.',
      image: art('brock-1895/neither-did-the-apothecary-think-it-at-all-advisable.jpg'),
      caption: 'Neither did the apothecary think it at all advisable',
      credit: BROCK,
      crop: [0.088, 0.08, 0.962, 0.838],
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
      text: 'Mrs. Bennet comes to Netherfield to see poor Jane, bringing her youngest girls, Kitty and Lydia. She praises the {COUNTRY} to Mr. {DARCY}’s face, as if to put him in his place, while {ELIZABETH} wishes the {FLOOR} would swallow her whole. Then bold {LYDIA} reminds Mr. {BINGLEY} of his {PROMISE} to throw a {BALL}.',
      image: art('thomson-1894/ch09-i_082_a.jpg'),
      caption: 'Mrs. Bennet and her two youngest girls',
      credit: THOMSON,
      crop: [0, 0, 1, 0.865],
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
      image: art('thomson-1894/ch11-i_098_a.jpg'),
      caption: 'Piling up the fire',
      credit: THOMSON,
      crop: [0, 0, 1, 0.85],
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
      text: 'A letter announces a visitor: Mr. Collins, the {COUSIN} who will one day inherit the family home, Longbourn. He arrives full of praise for his {PATRONESS}, Lady Catherine de Bourgh. Asked to read aloud, Mr. {COLLINS} refuses to touch {NOVELS} and picks a book of {SERMONS}. Three pages in, {LYDIA} interrupts him to gossip about the {OFFICERS}.',
      image: art('thomson-1894/ch14-i_116.jpg'),
      caption: 'Protested that he never read novels',
      credit: THOMSON,
      crop: [0, 0, 1, 0.9],
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
      text: 'On a walk into {MERYTON}, the sisters meet a stranger full of easy {CHARM}: Mr. Wickham, about to join the {REGIMENT} with the other {OFFICERS}. Then Mr. {DARCY} rides by. When the two men catch sight of each other, one turns {WHITE}, the other {RED}. What could have happened between Darcy and {WICKHAM}?',
      image: art('thomson-1894/ch16-i_126.jpg'),
      caption: 'The officers of the ——shire',
      credit: THOMSON,
      crop: [0, 0, 1, 0.905],
    },
  },
  {
    id: 'pp-16-wickhams-story',
    book: PP,
    chapter: 16,
    title: 'Wickham’s Story',
    rows: 8,
    cols: 6,
    story: {
      text: 'When the officers join the ladies at her aunt’s card party, Mr. {WICKHAM} takes the seat beside Elizabeth. He confides a sad {SECRET}: Darcy’s late {FATHER} meant him to have a {LIVING} in the church, but {DARCY} gave it away out of {JEALOUSY}. Elizabeth, already {PREJUDICED}, believes every word.',
      image: art('brock-1895/p-p16-arrivee-de-wickham-brocknb.jpg'),
      caption: 'The gentlemen did approach',
      credit: BROCK,
      crop: [0.038, 0.05, 0.95, 0.876],
    },
  },
  {
    id: 'pp-18-netherfield-ball',
    book: PP,
    chapter: 18,
    title: 'The Netherfield Ball',
    rows: 8,
    cols: 7,
    story: {
      text: 'At last, the {BALL} at Netherfield. Elizabeth finds herself dancing with Mr. {DARCY}, and Sir William Lucas stops them to praise their “very superior {DANCING}.” She tries to {TEASE} her partner into talking, then mentions {WICKHAM}. Darcy’s face {DARKENS}, and they {PART} in {SILENCE}, both {DISPLEASED}.',
      image: art('thomson-1894/ch18-i_147.jpg'),
      caption: 'Such very superior dancing is not often seen',
      credit: THOMSON,
      crop: [0, 0, 1, 0.89],
    },
  },
  {
    id: 'pp-19-mr-collins-proposes',
    book: PP,
    chapter: 19,
    title: 'Mr. Collins Proposes',
    rows: 7,
    cols: 7,
    story: {
      text: 'The morning after the ball, Mr. Collins asks for a private word with Elizabeth. He lists his {REASONS} for marrying: it is right for a {CLERGYMAN}, it will add to his {HAPPINESS}, and Lady Catherine {WISHES} it. Only then does he speak of {LOVE}. Elizabeth {REFUSES} him, but he takes it for {MODESTY}.',
      image: art('thomson-1894/ch19-i_161_a.jpg'),
      caption: 'To assure you in the most animated language',
      credit: THOMSON,
      crop: [0, 0, 1, 0.92],
    },
  },
  {
    id: 'pp-20-an-unhappy-alternative',
    book: PP,
    chapter: 20,
    title: 'An Unhappy Alternative',
    rows: 8,
    cols: 6,
    story: {
      text: 'Mrs. Bennet storms into the {LIBRARY}: “You must come and make Lizzy {MARRY} Mr. {COLLINS}!” Mr. Bennet gives his {VERDICT}: “An {UNHAPPY} alternative is before you, Elizabeth. From this day you must be a {STRANGER} to one of your {PARENTS}. Your mother will never see you again if you do not marry Mr. Collins, and I will never see you again if you do.”',
      image: art('brock-1895/you-must-come-and-make-lizzy-marry-mr-collins.jpg'),
      caption: 'You must come and make Lizzy marry Mr. Collins',
      credit: BROCK,
      crop: [0.032, 0.071, 0.9, 0.874],
    },
  },
  {
    id: 'pp-22-charlotte',
    book: PP,
    chapter: 22,
    title: 'Charlotte Says Yes',
    rows: 7,
    cols: 7,
    story: {
      text: 'Bingley has left Netherfield for the winter, and Jane tries to hide her sadness. Then comes startling {NEWS}: {CHARLOTTE} has {ACCEPTED} Mr. Collins. At twenty-seven, with no {FORTUNE}, she asks only for a comfortable {HOME}. Elizabeth is {SHOCKED} that her dearest {FRIEND} would marry without {LOVE}.',
      image: art('thomson-1894/ch22-i_185.jpg'),
      caption: 'So much love and eloquence',
      credit: THOMSON,
      crop: [0, 0.18, 1, 0.915],
    },
  },
  {
    id: 'pp-25-christmas',
    book: PP,
    chapter: 25,
    title: 'Christmas at Longbourn',
    rows: 8,
    cols: 6,
    story: {
      text: 'At Christmas, Mrs. Bennet’s brother and his wife arrive from London. Mrs. Gardiner hands out the {PRESENTS} and listens {KINDLY} to her sister’s {COMPLAINTS}. Seeing Jane’s quiet {SORROW}, she invites her to {TOWN}. And watching Elizabeth with {WICKHAM}, she gives a gentle {WARNING}: don’t fall for a man with no money.',
      image: art('brock-1895/the-first-part-of-mrs-gardiner-s-business-was-to-distribute-her-presents.jpg'),
      caption: 'The first part of Mrs. Gardiner’s business was to distribute her presents',
      credit: BROCK,
      crop: [0.06, 0.059, 0.936, 0.879],
    },
  },
  {
    id: 'pp-27-on-the-stairs',
    book: PP,
    chapter: 27,
    title: 'On the Stairs',
    rows: 7,
    cols: 6,
    story: {
      text: 'On her way to visit Charlotte in Kent, Elizabeth stops at the Gardiners’ house in {LONDON}, where a troop of little {COUSINS} waits on the {STAIRS}. Jane has news: she {CALLED} on Caroline, who {RETURNED} the visit weeks later, cold and brief. Jane’s {HOPES} of Bingley are {GONE}.',
      image: art('thomson-1894/ch27-i_218_a.jpg'),
      caption: 'On the stairs',
      credit: THOMSON,
      crop: [0, 0, 1, 0.945],
    },
  },
  {
    id: 'pp-29-lady-catherine',
    book: PP,
    chapter: 29,
    title: 'Dinner at Rosings',
    rows: 6,
    cols: 7,
    story: {
      text: 'Charlotte seems content in her parsonage at Hunsford, keeping Mr. Collins busy in his {GARDEN}. Soon they are all summoned to Rosings to dine with his {PATRONESS}, Lady {CATHERINE} de Bourgh, who gives her {OPINION} on everything. She is astonished that Elizabeth, not yet twenty-one, {DARES} to answer back with such {SPIRIT}.',
      image: art('thomson-1894/ch28-i_227.jpg'),
      caption: 'In conversation with the ladies',
      credit: THOMSON,
      crop: [0, 0, 1, 0.89],
    },
  },
  {
    id: 'pp-31-at-the-piano',
    book: PP,
    chapter: 31,
    title: 'At the Piano',
    rows: 8,
    cols: 6,
    story: {
      text: 'Mr. Darcy and his cousin, Colonel Fitzwilliam, come to {ROSINGS} for Easter. One evening Elizabeth plays the {PIANO}, and Darcy moves to stand {BESIDE} her. “You mean to {FRIGHTEN} me,” she laughs, and tells the Colonel how Darcy avoided {DANCING} at the ball. Darcy admits he lacks the {TALENT} of talking easily to {STRANGERS}.',
      image: art('brock-1895/you-mean-to-frighten-me-mr-darcy.jpg'),
      caption: 'You mean to frighten me, Mr. Darcy',
      credit: BROCK,
      crop: [0.086, 0.073, 0.934, 0.864],
    },
  },
  {
    id: 'pp-33-on-looking-up',
    book: PP,
    chapter: 33,
    title: 'A Walk in the Grove',
    rows: 7,
    cols: 6,
    story: {
      text: 'Walking in the {GROVE} at Rosings, Elizabeth meets Colonel {FITZWILLIAM}. Chatting, he lets slip that Darcy recently {SAVED} a friend from a most {IMPRUDENT} marriage. Elizabeth knows at once that he means {BINGLEY} and Jane. Back at the parsonage, she gives way to {TEARS}.',
      image: art('thomson-1894/ch33-i_257_a.jpg'),
      caption: 'On looking up',
      credit: THOMSON,
      crop: [0, 0, 1, 0.91],
    },
  },
  {
    id: 'pp-34-in-vain',
    book: PP,
    chapter: 34,
    title: 'In Vain I Have Struggled',
    rows: 8,
    cols: 6,
    story: {
      text: 'Elizabeth stays in alone, rereading Jane’s sad letters, when Mr. Darcy walks in. “In vain I have {STRUGGLED}. It will not do. My {FEELINGS} will not be {REPRESSED}. You must allow me to tell you how {ARDENTLY} I {ADMIRE} and {LOVE} you.” Yet he speaks just as much of her family’s low {RANK}.',
      image: art('brock-1895/you-must-allow-me-to-tell-you-how-ardently-i-admire-and-love-you.jpg'),
      caption: 'You must allow me to tell you how ardently I admire and love you',
      credit: BROCK,
      crop: [0.066, 0.103, 0.93, 0.843],
    },
  },
  {
    id: 'pp-34-the-last-man',
    book: PP,
    chapter: 34,
    title: 'The Last Man in the World',
    rows: 7,
    cols: 7,
    story: {
      text: 'Elizabeth turns him down. How could she accept the man who ruined her sister’s {HAPPINESS} and treated Mr. {WICKHAM} so cruelly? From the start, his {ARROGANCE}, his {CONCEIT} and his {SELFISH} disdain told her he was “the last man in the {WORLD} whom I could ever be prevailed on to {MARRY}.”',
      image: art('thomson-1894/ch34-i_264_a.jpg'),
      caption: 'The proposal at Hunsford',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-35-the-letter',
    book: PP,
    chapter: 35,
    title: 'A Letter in the Grove',
    rows: 8,
    cols: 6,
    story: {
      text: 'The next morning, Darcy finds her in the grove and hands her a {LETTER}: “Will you do me the {HONOUR} of reading that?” In it he explains himself. He {SEPARATED} Bingley from Jane because she seemed {INDIFFERENT}, and her family showed so little {PROPRIETY}. He does not ask her to {FORGIVE} him.',
      image: art('brock-1895/will-you-do-me-the-honour-of-reading-that-letter.jpg'),
      caption: 'Will you do me the honour of reading that letter?',
      credit: BROCK,
      crop: [0.08, 0.053, 0.954, 0.877],
    },
  },
  {
    id: 'pp-36-never-knew-myself',
    book: PP,
    chapter: 36,
    title: 'Till This Moment',
    rows: 8,
    cols: 6,
    story: {
      text: 'The letter goes on. Wickham squandered the money old Mr. Darcy left him, then tried to {ELOPE} with Darcy’s fifteen-year-old sister, Georgiana, for her {FORTUNE}. Elizabeth reads it again and again, {WEIGHING} every line, and sees she has been {BLINDED} by {PREJUDICE}. “Till this {MOMENT} I never knew {MYSELF}.”',
      image: art('thomson-1894/ch36-i_282_a.jpg'),
      caption: 'Any wish of doing him justice',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-40-the-secret',
    book: PP,
    chapter: 40,
    title: 'Keeping the Secret',
    rows: 6,
    cols: 8,
    story: {
      text: 'Back at Longbourn, Elizabeth can keep it in no longer. She tells {JANE} of Darcy’s {PROPOSAL} and of his {LETTER}. Jane, who thinks well of everyone, is {SADDENED} to learn what {WICKHAM} really is. Should they warn the town? The regiment leaves in a {FORTNIGHT}, and Darcy never asked them to speak. So the sisters agree to keep the {SECRET}, a silence Elizabeth will one day bitterly regret.',
      image: art('thomson-1894/ch40-i_307_a.jpg'),
      caption: 'Elizabeth and Jane, alone at last',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-41-brighton',
    book: PP,
    chapter: 41,
    title: 'Off to Brighton',
    rows: 6,
    cols: 7,
    story: {
      text: 'The regiment is leaving Meryton for Brighton, and {LYDIA} is invited along by the colonel’s young wife. She dreams of {TENTS}, scarlet {UNIFORMS} and tenderly {FLIRTING} with six {OFFICERS} at once. Elizabeth begs her father to keep her home, but Mr. Bennet lets her go: in {BRIGHTON}, he says, she will be too poor to tempt anyone.',
      image: art('thomson-1894/ch41-i_319.jpg'),
      caption: 'Tenderly flirting',
      credit: THOMSON,
      crop: [0, 0, 1, 0.87],
    },
  },
  {
    id: 'pp-43-the-portrait',
    book: PP,
    chapter: 43,
    title: 'The Portrait at Pemberley',
    rows: 8,
    cols: 6,
    story: {
      text: 'On a summer tour with the Gardiners, Elizabeth agrees to visit Pemberley, Darcy’s great house in Derbyshire, sure that he is away. The {HOUSEKEEPER} shows them round and cannot praise her master enough: the best {LANDLORD}, the best {BROTHER}, never a cross {WORD}. Before his {PORTRAIT}, Elizabeth stands a long time, {SPELLBOUND}.',
      image: art('brock-1895/she-stood-several-minutes-before-the-picture-in-earnest-contemplation.jpg'),
      caption: 'She stood several minutes before the picture',
      credit: BROCK,
      crop: [0.04, 0.028, 0.952, 0.857],
    },
  },
  {
    id: 'pp-43-by-the-river',
    book: PP,
    chapter: 43,
    title: 'By the River',
    rows: 7,
    cols: 6,
    story: {
      text: 'Walking the grounds, they turn a corner and there is Darcy himself, home a day {EARLY}. Elizabeth {BLUSHES} deeply, but he is {POLITE}, even {GENTLE}. He invites Mr. Gardiner to {FISH} in the {RIVER}, and asks if he may {INTRODUCE} his sister. Can this be the same proud man?',
      image: art('thomson-1894/ch45-i_356_a.jpg'),
      caption: 'Engaged by the river',
      credit: THOMSON,
      crop: [0, 0, 1, 0.945],
    },
  },
  {
    id: 'pp-44-georgiana',
    book: PP,
    chapter: 44,
    title: 'Miss Darcy',
    rows: 7,
    cols: 8,
    story: {
      text: 'The very next day, Darcy brings {GEORGIANA} to the {INN} at Lambton. Elizabeth expected a proud girl, and finds her only {SHY}. Bingley comes too, and asks {WISTFULLY} after Jane. Darcy works {HARD} to be {AGREEABLE} to Mr. and Mrs. {GARDINER}, and that night Elizabeth lies awake, {TRYING} to understand her own {HEART}. At Pemberley the next day, Caroline sneers at how brown she has grown. Darcy answers that he has long thought her one of the handsomest women of his acquaintance.',
      image: art('thomson-1894/ch44-i_350.jpg'),
      caption: 'To make herself agreeable to all',
      credit: THOMSON,
      crop: [0, 0, 1, 0.905],
    },
  },
  {
    id: 'pp-46-not-an-instant',
    book: PP,
    chapter: 46,
    title: 'Not an Instant to Lose',
    rows: 7,
    cols: 6,
    story: {
      text: 'Two letters from Jane arrive at once: {LYDIA} has {ELOPED} with {WICKHAM}, and no one knows if he means to marry her. Elizabeth runs to find her {UNCLE} and meets Darcy in the doorway. “I have not an {INSTANT} to lose!” She tells him all, sure that such a {DISGRACE} ends any {HOPE} between them.',
      image: art('thomson-1894/ch46-i_368.jpg'),
      caption: 'I have not an instant to lose',
      credit: THOMSON,
      crop: [0, 0, 1, 0.95],
    },
  },
  {
    id: 'pp-49-what-news',
    book: PP,
    chapter: 49,
    title: 'What News?',
    rows: 8,
    cols: 6,
    story: {
      text: 'Days of dread at Longbourn. Mr. Bennet comes home from {SEARCHING} {LONDON} empty-handed. Then an {EXPRESS} arrives from Mr. Gardiner: the couple are {FOUND}, and Wickham will {MARRY} Lydia for a small yearly {ALLOWANCE}. “Oh, papa, what news?” Her father wonders who paid Wickham, and why he came so {CHEAPLY}.',
      image: art('brock-1895/oh-papa-what-news-what-news.jpg'),
      caption: 'Oh, papa, what news? what news?',
      credit: BROCK,
      crop: [0.096, 0.059, 0.932, 0.841],
    },
  },
  {
    id: 'pp-50-exactly-the-man',
    book: PP,
    chapter: 50,
    title: 'Exactly the Man',
    rows: 6,
    cols: 7,
    story: {
      text: 'Meryton’s spiteful old {GOSSIPS} are disappointed: Lydia is to be married after all, not ruined. Mrs. Bennet is already choosing {CARRIAGES} and houses for her. Elizabeth only feels {SHAME}. Darcy could never wish to be {BROTHER} to Wickham now, and just as every {HOPE} is gone, she begins to {COMPREHEND} that he was exactly the man who would most suit her.',
      image: art('thomson-1894/ch50-i_406_a.jpg'),
      caption: 'The spiteful old ladies',
      credit: THOMSON,
      crop: [0, 0, 1, 0.895],
    },
  },
  {
    id: 'pp-51-lydia-comes-home',
    book: PP,
    chapter: 51,
    title: 'Lydia Comes Home',
    rows: 7,
    cols: 6,
    story: {
      text: 'Lydia comes home a married woman, flashing her {RING} without a trace of {SHAME}, and {WICKHAM} is as {DELIGHTED} with himself as ever. Then Lydia lets slip a {SECRET}: Mr. Darcy was at her {WEDDING}! Elizabeth writes to her {AUNT} at once to find out why.',
      image: art('thomson-1894/ch51-i_414_a.jpg'),
      caption: 'With an affectionate smile',
      credit: THOMSON,
      crop: [0, 0, 1, 0.915],
    },
  },
  {
    id: 'pp-52-aunts-letter',
    book: PP,
    chapter: 52,
    title: 'Mrs. Gardiner’s Letter',
    rows: 8,
    cols: 6,
    story: {
      text: 'Mrs. Gardiner’s reply is astonishing. Darcy found the couple, paid Wickham’s {DEBTS}, bought his {COMMISSION} and arranged the {MARRIAGE}, then begged them to keep it {QUIET}. Elizabeth is {HUMBLED}. When Wickham tries his old charm on her, she simply holds out her hand: “Come, we are brother and {SISTER} now. Do not let us {QUARREL} about the past.”',
      image: art('brock-1895/she-held-out-her-hand.jpg'),
      caption: 'She held out her hand',
      credit: BROCK,
      crop: [0.058, 0.056, 0.878, 0.869],
    },
  },
  {
    id: 'pp-53-darcy-with-him',
    book: PP,
    chapter: 53,
    title: 'Mr. Darcy with Him',
    rows: 7,
    cols: 7,
    story: {
      text: '{NETHERFIELD} is opened again: Bingley is coming back! Mrs. Bennet plans the finest {DINNER}, and Jane swears she feels nothing. When Bingley rides up the {LANE}, Kitty cries out that someone is with him: “Mr. {DARCY}, I vow!” Elizabeth sits {SILENT} over her {SEWING}, cheeks {BURNING}, while her mother is {RUDE} to the man who saved Lydia.',
      image: art('thomson-1894/ch53-i_433_a.jpg'),
      caption: 'Mr. Darcy with him',
      credit: THOMSON,
      crop: [0, 0, 1, 0.9],
    },
  },
  {
    id: 'pp-55-jane-says-yes',
    book: PP,
    chapter: 55,
    title: 'Jane Says Yes',
    rows: 8,
    cols: 6,
    story: {
      text: 'Bingley calls again and again. Mrs. Bennet keeps finding excuses to leave him alone with Jane, and {WINKS} at her other daughters to follow. At last Elizabeth walks in to find them standing {TOGETHER} by the fire. Bingley has {PROPOSED}! Jane is the {HAPPIEST} creature in the {WORLD}, and Mr. Bennet says they are so {GENEROUS} that they will always {EXCEED} their income.',
      image: art('brock-1895/she-perceived-her-sister-and-bingley-standing-together.jpg'),
      caption: 'She perceived her sister and Bingley standing together',
      credit: BROCK,
      crop: [0.096, 0.12, 0.972, 0.785],
    },
  },
  {
    id: 'pp-56-lady-catherine-calls',
    book: PP,
    chapter: 56,
    title: 'Lady Catherine Calls',
    rows: 7,
    cols: 8,
    story: {
      text: 'One morning Lady {CATHERINE} sweeps into Longbourn and orders Elizabeth into the {GARDEN}. She has heard a shocking {RUMOUR}: that Elizabeth means to marry her {NEPHEW}. Will she {PROMISE} never to accept him? Elizabeth will not: “I am only {RESOLVED} to act in that manner which will constitute my {HAPPINESS}.” Her Ladyship leaves very {ANGRY} indeed.',
      image: art('thomson-1894/ch56-i_460_a.jpg'),
      caption: 'Lady Catherine at Longbourn',
      credit: THOMSON,
    },
  },
  {
    id: 'pp-58-half-the-night',
    book: PP,
    chapter: 58,
    title: 'Half the Night',
    rows: 8,
    cols: 6,
    story: {
      text: 'Walking out together, Elizabeth thanks Darcy for all he did for Lydia. He answers: “If your {FEELINGS} are still what they were last {APRIL}, tell me so at once.” Hers have {CHANGED}, and she accepts him. As they walk on, he tells his side: Lady Catherine’s visit “taught me to {HOPE},” and he has told Bingley he was {MISTAKEN} about Jane. “By you, I was properly {HUMBLED}.” That night Elizabeth tells Jane, who can hardly believe it. “How long have you loved him?” “It has been coming on so {GRADUALLY}, I hardly know when it began.”',
      image: art('brock-1895/all-was-acknowledged-and-half-the-night-spent-in-conversation.jpg'),
      caption: 'All was acknowledged, and half the night spent in conversation',
      credit: BROCK,
      crop: [0.034, 0.037, 0.89, 0.856],
    },
  },
  {
    id: 'pp-59-not-a-syllable',
    book: PP,
    chapter: 59,
    title: 'Not a Syllable',
    rows: 7,
    cols: 7,
    story: {
      text: 'Mr. Bennet is alarmed: “{LIZZY}, I know you could be neither happy nor respectable unless you truly {ESTEEMED} your husband.” She tells him all that Darcy has done, and he is won over. Mrs. Bennet, hearing the news, sits quite {STILL}, unable to utter a {SYLLABLE}. Then: “How {RICH} you will be! What pin-money, what {JEWELS}! Ten {THOUSAND} a year! A {HOUSE} in town!”',
      image: art('thomson-1894/ch59-i_486_a.jpg'),
      caption: 'Unable to utter a syllable',
      credit: THOMSON,
      crop: [0, 0, 1, 0.895],
    },
  },
  {
    id: 'pp-60-be-sincere',
    book: PP,
    chapter: 60,
    title: 'Be Sincere',
    rows: 8,
    cols: 6,
    story: {
      text: '“Now, be {SINCERE}: did you admire me for my {IMPERTINENCE}?” Elizabeth teases, and Darcy owns that he did. Soon there is a double {WEDDING}. Jane and Bingley settle near {PEMBERLEY}, where Georgiana learns to {LAUGH}, and Darcy and Elizabeth stay forever {GRATEFUL} to the Gardiners, who brought them together.',
      image: art('brock-1895/now-be-sincere-did-you-admire-me-for-my-impertinence.jpg'),
      caption: 'Now, be sincere; did you admire me for my impertinence?',
      credit: BROCK,
      crop: [0.072, 0.04, 0.938, 0.841],
    },
  },
  {
    id: 'pp-61-ever-after',
    book: PP,
    chapter: 61,
    title: 'Ever After',
    rows: 5,
    cols: 8,
    story: {
      text: 'Mrs. Bennet is happy at last, with two daughters so well married. Mr. Bennet {MISSES} Lizzy, and loves to turn up at {PEMBERLEY} when least expected. Kitty, kept away from Lydia, grows far less silly. Mary stays at home with her {BOOKS}. Lydia writes only to ask for {MONEY}, for the Wickhams never stop {SPENDING}. Even Lady Catherine, after long {SULKING}, comes to visit.',
      image: art('thomson-1894/ch61-i_501_a.jpg'),
      caption: 'Seeing them off',
      credit: THOMSON,
    },
  },
];

/**
 * Alice: the first chapters, to try the book on the shelf. Carroll's own lines kept where they are
 * the ones people remember. The pictures are Tenniel's drawings as he coloured them for The Nursery
 * "Alice" (1890), Carroll's own telling for small children: whole-page scans, so `crop` trims the
 * plate number and the printed text around a drawing (to the grid's shape), and `colour` keeps them
 * in colour.
 */
const ALICE_BOOK = 'alice-in-wonderland';
const TENNIEL = 'John Tenniel, coloured for The Nursery “Alice”, 1890';
const nursery = (plate: string) => art(`nursery-alice-1890/${plate}.jpg`);

const ALICE: LevelSpec[] = [
  {
    id: 'alice-01-the-white-rabbit',
    book: ALICE_BOOK,
    chapter: 1,
    title: 'The White Rabbit',
    rows: 8,
    cols: 6,
    story: {
      text: 'Alice is sitting on the bank beside her {SISTER}, with nothing to do, when a White {RABBIT} with pink eyes runs close by her. “Oh dear! I shall be too {LATE}!” it says, and takes a {WATCH} out of its waistcoat {POCKET}. Burning with {CURIOSITY}, Alice {FOLLOWS} it down a large rabbit-hole, never once considering how in the world she is to get out {AGAIN}.',
      image: nursery('white-rabbit'),
      caption: 'Oh dear! I shall be too late!',
      credit: TENNIEL,
      crop: [0.04, 0.085, 0.98, 0.83],
      colour: true,
    },
  },
  {
    id: 'alice-01-drink-me',
    book: ALICE_BOOK,
    chapter: 1,
    title: 'Drink Me',
    rows: 8,
    cols: 6,
    story: {
      text: 'Down, down, down she falls, and lands on a heap of sticks and dry {LEAVES}. In a long hall she finds a tiny golden key, and behind a {CURTAIN} a little {DOOR} into the loveliest {GARDEN} you ever saw. But she is far too {LARGE} to get through. On a glass table stands a {BOTTLE}, labelled “{DRINK} ME”. Alice takes a sip, and shuts up like a {TELESCOPE}.',
      image: nursery('066110'),
      caption: 'Drink me',
      credit: TENNIEL,
      crop: [0, 0.045, 1, 0.95],
      colour: true,
    },
  },
  {
    id: 'alice-02-the-pool-of-tears',
    book: ALICE_BOOK,
    chapter: 2,
    title: 'The Pool of Tears',
    rows: 6,
    cols: 8,
    story: {
      text: '“{CURIOUSER} and curiouser!” Now Alice opens out like the largest telescope that ever was, until her {HEAD} strikes the ceiling. Poor Alice {CRIES}, shedding gallons of {TEARS}. Picking up the White Rabbit’s {FAN}, she {SHRINKS} again, slips, and {SPLASH}! She is up to her chin in a {POOL} of her own tears, swimming beside a {MOUSE}.',
      image: nursery('a80108-44'),
      caption: 'Swimming beside a mouse',
      credit: TENNIEL,
      crop: [0.03, 0, 0.973, 1],
      colour: true,
    },
  },
  {
    id: 'alice-03-a-caucus-race',
    book: ALICE_BOOK,
    chapter: 3,
    title: 'A Caucus-Race',
    rows: 7,
    cols: 7,
    story: {
      text: 'Everyone climbs out of the pool, dripping wet. The best thing to get them dry, says the Dodo, is a {CAUCUS} {RACE}: they all run round in a {CIRCLE}, starting and stopping whenever they like. After half an hour the {DODO} declares, “{EVERYBODY} has won, and all must have {PRIZES}!” Alice hands round her {COMFITS}, and the Dodo solemnly presents her with her own {THIMBLE}.',
      image: nursery('c06543-02'),
      caption: '“Hand it over here!” said the Dodo',
      credit: TENNIEL,
      crop: [0.02, 0.13, 0.975, 0.823],
      colour: true,
    },
  },
  {
    id: 'alice-04-little-bill',
    book: ALICE_BOOK,
    chapter: 4,
    title: 'Little Bill',
    rows: 9,
    cols: 4,
    story: {
      text: 'The White Rabbit sends Alice to his {HOUSE} to fetch his fan and gloves. There she drinks from another little bottle, and grows so big that she must put one arm out of the {WINDOW} and one foot up the {CHIMNEY}. Outside, the Rabbit orders Bill the Lizard to climb down. Alice {KICKS}, and up goes {BILL} like a {SKYROCKET}!',
      image: nursery('a80108-45'),
      caption: 'Up goes Bill like a sky-rocket',
      credit: TENNIEL,
      crop: [0.205, 0.045, 0.875, 0.855],
      colour: true,
    },
  },
];

/**
 * The Three Little Pigs, for young readers (6+), whole: five short scenes to read aloud, on small
 * boards. Kinder than the old telling: the wolf eats nobody, and runs off for good. Brooke's colour
 * plates, whole.
 */
const PIGS_BOOK = 'three-little-pigs';
const BROOKE = 'L. Leslie Brooke, 1904';

const PIGS: LevelSpec[] = [
  {
    id: 'pigs-1-off-they-go',
    book: PIGS_BOOK,
    chapter: 1,
    title: 'Off They Go',
    rows: 5,
    cols: 4,
    story: {
      text: 'Once upon a time there was an old {SOW} with three little {PIGS}. One day she sent them out to seek their fortune. The first little pig met a {MAN} with a bundle of {STRAW}, and built a {HOUSE} with it.',
      image: art('brooke-1904/pigs-plate-1.jpg'),
      caption: 'She sent them out to seek their fortune',
      credit: BROOKE,
    },
  },
  {
    id: 'pigs-2-huff-and-puff',
    book: PIGS_BOOK,
    chapter: 2,
    title: 'Huff and Puff',
    rows: 5,
    cols: 4,
    story: {
      text: 'Along came a {WOLF}. “Little pig, little pig, let me come in!” “No, no, not by the hair of my chinny chin {CHIN}!” “Then I’ll {HUFF}, and I’ll {PUFF}, and I’ll {BLOW} your house in!” And he did. The little pig ran to his brother’s house of sticks, but the wolf blew that down too.',
      image: art('brooke-1904/pigs-plate-2.jpg'),
      caption: 'Then I’ll huff and I’ll puff',
      credit: BROOKE,
    },
  },
  {
    id: 'pigs-3-a-house-of-bricks',
    book: PIGS_BOOK,
    chapter: 3,
    title: 'A House of Bricks',
    rows: 6,
    cols: 5,
    story: {
      text: 'The two little pigs ran to their brother, who had built his house with {BRICKS}. The wolf huffed and puffed, but he could not blow it {DOWN}. So he tried a {TRICK}: “Meet me at six, and we’ll dig {TURNIPS}!” But the little pig got up at {FIVE}, and was home {SAFE} before the wolf came.',
      image: art('brooke-1904/pigs-plate-3.jpg'),
      caption: 'He built his house with bricks',
      credit: BROOKE,
    },
  },
  {
    id: 'pigs-4-the-churn',
    book: PIGS_BOOK,
    chapter: 4,
    title: 'The Churn',
    rows: 6,
    cols: 5,
    story: {
      text: 'Next the wolf took the pig to pick {APPLES}. The pig {THREW} one far away, and ran home while the wolf chased it. Then they met at the {FAIR}. The pig hid in a butter {CHURN}, and it rolled down the {HILL}, right at the wolf. He was so {SCARED} that he ran all the way home!',
      image: art('brooke-1904/pigs-plate-7.jpg'),
      caption: 'So he got into the churn to hide',
      credit: BROOKE,
    },
  },
  {
    id: 'pigs-5-down-the-chimney',
    book: PIGS_BOOK,
    chapter: 5,
    title: 'Down the Chimney',
    rows: 6,
    cols: 5,
    story: {
      text: 'Now the wolf was very cross. He climbed on the {ROOF} to come down the {CHIMNEY}. But the little pig hung a big {POT} of {WATER} over the {FIRE}. Down came the wolf, splash, into the hot water! He ran off howling, and never came back, and the three little pigs lived {HAPPILY} ever after.',
      image: art('brooke-1904/pigs-plate-8.jpg'),
      caption: 'He hung on the pot full of water',
      credit: BROOKE,
    },
  },
];

/**
 * A Christmas Carol, the whole story in ten scenes, free for everyone. Arthur Rackham's 1915
 * edition (Gutenberg #24022): his twelve colour plates, and line drawings where a scene has none.
 * Its five parts are Dickens's staves; `chapter` is the stave.
 */
const CAROL_BOOK = 'a-christmas-carol';
const RACKHAM = 'Arthur Rackham, 1915';
const rackham = (file: string) => art(`rackham-1915/${file}.jpg`);

const CAROL: LevelSpec[] = [
  {
    id: 'carol-1-humbug',
    book: CAROL_BOOK,
    chapter: 1,
    title: 'Bah! Humbug!',
    rows: 6,
    cols: 7,
    story: {
      text: 'Marley was dead, to begin with. His old partner, Ebenezer Scrooge, is a {SQUEEZING}, grasping, {COVETOUS} old sinner. When his nephew Fred wishes him a merry {CHRISTMAS}, Scrooge answers: “Bah! {HUMBUG}!” And when two portly gentlemen ask him to give something to the poor, he only asks: are there no prisons? Are there no {WORKHOUSES}?',
      image: rackham('007-they-were-portly-gentlemen-pleasant-to-behold'),
      caption: 'They were portly gentlemen, pleasant to behold',
      credit: RACKHAM,
    },
  },
  {
    id: 'carol-1-marleys-ghost',
    book: CAROL_BOOK,
    chapter: 1,
    title: 'Marley’s Ghost',
    rows: 8,
    cols: 6,
    story: {
      text: 'That night, in his gloomy rooms, Scrooge hears the {CLANKING} of a chain. Through the locked door comes the ghost of Jacob {MARLEY}, wrapped in cash-boxes, keys and {PADLOCKS}. “How now?” says Scrooge, {CAUSTIC} and cold as ever. “I wear the chain I {FORGED} in life,” the ghost answers. Scrooge may yet {ESCAPE} his fate: three {SPIRITS} will come.',
      image: rackham('001-img01'),
      caption: '“How now?” said Scrooge, caustic and cold as ever',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-1-phantoms',
    book: CAROL_BOOK,
    chapter: 1,
    title: 'The Air Filled with Phantoms',
    rows: 8,
    cols: 6,
    story: {
      text: 'Marley’s ghost floats out of the open {WINDOW}, and Scrooge follows to look. The air is filled with {PHANTOMS}, wandering hither and thither, {MOANING} as they go. Each wears a chain, and each one {WEEPS} because it longs to help the {WRETCHED} people below, and has lost the {POWER} for ever. Scrooge closes the window and, {EXHAUSTED}, falls asleep at once.',
      image: rackham('012-img04'),
      caption: 'The air was filled with phantoms',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-2-fezziwig',
    book: CAROL_BOOK,
    chapter: 2,
    title: 'Old Fezziwig’s Ball',
    rows: 7,
    cols: 6,
    story: {
      text: 'At one o’clock the first of the three spirits, the Ghost of Christmas {PAST}, takes Scrooge back to his youth: to the {WAREHOUSE} of old Fezziwig, where he was an {APPRENTICE}. It is Christmas Eve, and the place is swept clean for a {BALL}. In comes a {FIDDLER}, and all the young people, and then old Fezziwig stands out to dance with Mrs. {FEZZIWIG}.',
      image: rackham('016-img05'),
      caption: 'Then old Fezziwig stood out to dance with Mrs. Fezziwig',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-2-belle',
    book: CAROL_BOOK,
    chapter: 2,
    title: 'Another Idol',
    rows: 6,
    cols: 7,
    story: {
      text: 'Then the spirit shows him a fair young {GIRL} named Belle, whom he once meant to {MARRY}. “Another {IDOL} has displaced me,” she tells him: a {GOLDEN} one. His love of {GAIN} has mastered him. So she sets him {FREE}, with a full {HEART}, and they {PARTED}. “Spirit!” Scrooge cries. “Show me no {MORE}!”',
      image: rackham('017-she-left-him-and-they-parted'),
      caption: 'She left him, and they parted',
      credit: RACKHAM,
    },
  },
  {
    id: 'carol-3-the-cratchits',
    book: CAROL_BOOK,
    chapter: 3,
    title: 'God Bless Us, Every One',
    rows: 8,
    cols: 6,
    story: {
      text: 'The second spirit, the Ghost of Christmas {PRESENT}, takes Scrooge to the little house of his clerk, Bob Cratchit. Bob comes home from church with Tiny Tim on his {SHOULDER}, a little {CRUTCH} in the boy’s hand. There is a {GOOSE}, and then Mrs. Cratchit brings in the {PUDDING}, blazing with {BRANDY}. Tim says, “God {BLESS} us, every one!” Scrooge asks if the child will {LIVE}.',
      image: rackham('025-with-the-pudding'),
      caption: 'With the pudding',
      credit: RACKHAM,
    },
  },
  {
    id: 'carol-3-blind-mans-buff',
    book: CAROL_BOOK,
    chapter: 3,
    title: 'Blind Man’s Buff',
    rows: 8,
    cols: 6,
    story: {
      text: 'At his nephew Fred’s house, everyone {LAUGHS} at Uncle Scrooge, though Fred only {PITIES} him. Then there is {MUSIC}, and a game of blind man’s {BUFF}. Topper is the blind man, and the way he goes after the plump {SISTER} in the lace tucker is an {OUTRAGE}! Scrooge, unseen, begs to {STAY}, and {GUESSES} as loud as anyone, full of {FUN}.',
      image: rackham('026-img08'),
      caption: 'The way he went after that plump sister in the lace tucker!',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-4-old-joe',
    book: CAROL_BOOK,
    chapter: 4,
    title: 'Yet to Come',
    rows: 8,
    cols: 6,
    story: {
      text: 'The last spirit, the Ghost of Christmas Yet to Come, never speaks; it only {POINTS}. In a filthy shop, old Joe buys a dead man’s things from those who {ROBBED} him: his {SHIRT}, his {BLANKETS}, even his bed-{CURTAINS}, rings and all. Nobody {MOURNS} the man. In a churchyard, the spirit points to a {GRAVE}, and Scrooge reads his own {NAME}.',
      image: rackham('029-img010'),
      caption: '“Bed-curtains!” “Ah!” returned the woman, laughing',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-5-christmas-day',
    book: CAROL_BOOK,
    chapter: 5,
    title: 'Your Uncle Scrooge',
    rows: 8,
    cols: 6,
    story: {
      text: 'Scrooge wakes in his own bed, and it is {CHRISTMAS} Day! He is as light as a {FEATHER}, as happy as an {ANGEL}, as merry as a {SCHOOLBOY}. He sends the prize {TURKEY} to Bob Cratchit, and walks to his {NEPHEW}’s door. “It’s I, your uncle Scrooge. I have come to {DINNER}. Will you let me in, Fred?”',
      image: rackham('031-img11'),
      caption: '“It’s I, your uncle Scrooge. I have come to dinner. Will you let me in, Fred?”',
      credit: RACKHAM,
      colour: true,
    },
  },
  {
    id: 'carol-5-every-one',
    book: CAROL_BOOK,
    chapter: 5,
    title: 'A Second Father',
    rows: 7,
    cols: 6,
    story: {
      text: 'Next morning Bob comes in {EIGHTEEN} minutes {LATE}. “Now, I’ll tell you what, my friend,” says Scrooge. “I am about to {RAISE} your {SALARY}!” He becomes as good a {FRIEND}, as good a man, as the good old {CITY} ever knew; and to Tiny Tim, who did not {DIE}, a second {FATHER}. God bless us, every one!',
      image: rackham('032-img12'),
      caption: '“Now, I’ll tell you what, my friend,” said Scrooge',
      credit: RACKHAM,
      colour: true,
    },
  },
];

/**
 * The paid shelves' free samples: each book's first four scenes. Brock's plates for Persuasion
 * and Emma are coloured, and framed with a hand-lettered caption, which `crop` leaves out; the
 * Thomson Emma plates are scans of whole pages.
 */
const PERSUASION_BOOK = 'persuasion';

const PERSUASION: LevelSpec[] = [
  {
    id: 'persuasion-01-the-baronetage',
    book: PERSUASION_BOOK,
    chapter: 1,
    title: 'The Baronetage',
    rows: 8,
    cols: 5,
    story: {
      text: 'Sir Walter Elliot of Kellynch Hall never takes up any book but the {BARONETAGE}, where he reads of himself. Vain of his looks and his rank, he has lived far beyond his {INCOME}. His agent, Mr. Shepherd, drops {UNWELCOME} hints: they must {RETRENCH}, or let Kellynch. And Anne, the {KINDEST} of his daughters, is nobody to him.',
      image: art('persuasion-brock-1898/2pers-01.jpg'),
      caption: 'The unwelcome hints of Mr. Shepherd, his agent',
      credit: 'C. E. Brock, 1898',
      crop: [0.1, 0.06, 0.92, 0.86],
      colour: true,
    },
  },
  {
    id: 'persuasion-03-that-old-fellow',
    book: PERSUASION_BOOK,
    chapter: 3,
    title: 'Eight Years Ago',
    rows: 8,
    cols: 6,
    story: {
      text: 'Admiral Croft will take Kellynch, though Sir Walter scorns {SAILORS} and their weathered faces. But the {ADMIRAL}’s wife has a brother, Frederick Wentworth. Eight years ago, Anne was {ENGAGED} to him, a young officer with no {FORTUNE}. Lady Russell, her mother’s old {FRIEND}, persuaded her to give him up. Anne has {REGRETTED} it ever since, and has lost her {BLOOM}.',
      image: art('persuasion-thomson-1897/persuasion-illustration-chapter-1.jpg'),
      caption: 'In the name of heaven, who is that old fellow?',
      credit: 'Hugh Thomson, 1897',
      crop: [0, 0, 1, 0.9],
    },
  },
  {
    id: 'persuasion-05-come-at-last',
    book: PERSUASION_BOOK,
    chapter: 5,
    title: 'So You Are Come at Last',
    rows: 7,
    cols: 5,
    story: {
      text: 'Anne goes to Uppercross {COTTAGE} to keep her sister Mary {COMPANY}. Mary is lying on the faded {SOFA}, sure she is ill. “So you are come at last!” she cries. “I can hardly {SPEAK}.” Mary married Charles Musgrove, heir of the Great House, where his young sisters are all {MUSIC} and {FASHION}.',
      image: art('persuasion-brock-1898/pers-brock-06.jpg'),
      caption: 'So you are come at last!',
      credit: 'C. E. Brock, 1909',
      crop: [0.1, 0.08, 0.92, 0.86],
      colour: true,
    },
  },
  {
    id: 'persuasion-08-divided',
    book: PERSUASION_BOOK,
    chapter: 8,
    title: 'Divided by Mrs. Musgrove',
    rows: 8,
    cols: 6,
    story: {
      text: 'Captain {WENTWORTH} comes at last, rich in prize money from the war. To Anne he is cold and {CEREMONIOUS}; she hears that he found her “so {ALTERED} he should not have known her again.” One evening they sit on the same sofa, divided only by Mrs. {MUSGROVE}, {SIGHING} for the {SAILOR} son she lost.',
      image: art('persuasion-brock-1898/pers-brock-09.jpg'),
      caption: 'They were divided only by Mrs. Musgrove',
      credit: 'C. E. Brock, 1909',
      crop: [0.1, 0.15, 0.92, 0.82],
      colour: true,
    },
  },
];

const EMMA_BOOK = 'emma';

const EMMA: LevelSpec[] = [
  {
    id: 'emma-01-the-match',
    book: EMMA_BOOK,
    chapter: 1,
    title: 'I Planned the Match',
    rows: 8,
    cols: 6,
    story: {
      text: 'Emma Woodhouse, handsome, {CLEVER} and rich, has lived nearly twenty-one years with very little to {DISTRESS} or vex her. Now her {GOVERNESS}, Miss Taylor, has married Mr. Weston, and Emma is sure she {PLANNED} the match herself. Her father sighs for “poor Miss Taylor”. Mr. Knightley, an old {FRIEND}, tells her it was a lucky {GUESS}, not {SUCCESS}.',
      image: art('emma-brock-1909/emma-ce-brock-1909-vol-i-chapter-i.jpg'),
      caption: 'I planned the match from that hour',
      credit: 'C. E. Brock, 1909',
      crop: [0.08, 0.06, 0.92, 0.82],
      colour: true,
    },
  },
  {
    id: 'emma-04-survey',
    book: EMMA_BOOK,
    chapter: 4,
    title: 'An Opportunity of Survey',
    rows: 8,
    cols: 5,
    story: {
      text: 'Emma takes up pretty Harriet Smith, a {PARLOUR} boarder at the school, and means to {IMPROVE} her. Harriet talks only of the Martins, whose {HOME} she shared one happy {SUMMER}. Then young Robert Martin meets them in the {LANE}, and Emma is glad of the chance to {SURVEY} him: a {FARMER}, quite beneath Harriet.',
      image: art('emma-thomson-1896/emma-frontispice-ch04.jpg'),
      caption: 'Emma was not sorry to have such an opportunity of survey',
      credit: 'Hugh Thomson, 1896',
      crop: [0.04, 0.03, 0.96, 0.89],
    },
  },
  {
    id: 'emma-06-the-portrait',
    book: EMMA_BOOK,
    chapter: 6,
    title: 'Frequently Coming to Look',
    rows: 8,
    cols: 5,
    story: {
      text: 'Emma decides that Mr. Elton, the handsome {VICAR}, is just the man for Harriet. To show off her friend, she {PAINTS} Harriet’s {PORTRAIT}, and Mr. Elton cannot keep still, {FREQUENTLY} coming to look. He {SIGHS} over every stroke, and offers to carry it to London to be {FRAMED}.',
      image: art('emma-brock-1909/emma-ce-brock-1909-vol-i-chapter-vi.jpg'),
      caption: 'Frequently coming to look',
      credit: 'C. E. Brock, 1909',
      crop: [0.08, 0.05, 0.92, 0.85],
      colour: true,
    },
  },
  {
    id: 'emma-08-great-spirits',
    book: EMMA_BOOK,
    chapter: 8,
    title: 'Rode Off in Great Spirits',
    rows: 8,
    cols: 5,
    story: {
      text: 'Mr. Elton rides off to London with the portrait, in great {SPIRITS}. Meanwhile Robert Martin writes Harriet a good, plain {LETTER} asking her to marry him, and Emma guides her to {REFUSE}. Mr. Knightley is {FURIOUS}: Martin is sensible and {WORTHY}, and Elton will never marry {UNWISELY}.',
      image: art('emma-thomson-1896/emma-ch08-i-8.jpg'),
      caption: 'Rode off in great spirits',
      credit: 'Hugh Thomson, 1896',
      crop: [0.03, 0.08, 1, 0.92],
    },
  },
];

const SENSE_BOOK = 'sense-and-sensibility';
const THOMSON_1896 = 'Hugh Thomson, 1896';
const sense = (file: string) => art(`sense-thomson-1896/${file}.jpg`);

const SENSE: LevelSpec[] = [
  {
    id: 'sense-01-norland',
    book: SENSE_BOOK,
    chapter: 1,
    title: 'Norland Park',
    rows: 8,
    cols: 5,
    story: {
      text: 'At Norland Park, old Mr. Dashwood leaves his {ESTATE} to his nephew Henry for life, and after him to Henry’s son John and John’s little {BOY}, whose {PRATTLE} had charmed the old man. A year later Henry dies, and his wife and three {DAUGHTERS}, Elinor, Marianne and Margaret, are left with very little money. Dying, he begs John to {PROVIDE} for them, and John {PROMISES}.',
      image: sense('002-his-son-s-son-a-child-of-four-years-old'),
      caption: 'His son’s son, a child of four years old',
      credit: THOMSON_1896,
    },
  },
  {
    id: 'sense-02-half-of-it',
    book: SENSE_BOOK,
    chapter: 2,
    title: 'How They Will Spend Half of It',
    rows: 8,
    cols: 6,
    story: {
      text: 'John thinks three thousand {POUNDS} would be generous. His wife Fanny fears it would {IMPOVERISH} their boy. Fifteen hundred, then? An {ANNUITY}? “I cannot imagine how they will spend half of it,” says Fanny. In the end, presents of {FISH} and game will do. But Fanny’s {BROTHER} Edward, {SHY} and {GENTLE}, quietly wins Elinor’s {HEART}.',
      image: sense('003-image_035'),
      caption: '“I cannot imagine how they will spend half of it”',
      credit: THOMSON_1896,
    },
  },
  {
    id: 'sense-10-they-sang-together',
    book: SENSE_BOOK,
    chapter: 10,
    title: 'They Sang Together',
    rows: 8,
    cols: 5,
    story: {
      text: 'At Barton Cottage, Marianne runs down a rainy hill, falls and twists her {ANKLE}. A handsome {STRANGER}, John Willoughby, {CARRIES} her home in his arms. He loves the same {MUSIC}, the same {POETS}, the same everything. They sing together, and soon the whole {VALLEY} says they are in {LOVE}. Only Colonel Brandon, silent and grave, looks on.',
      image: sense('005-they-sang-together'),
      caption: 'They sang together',
      credit: THOMSON_1896,
    },
  },
  {
    id: 'sense-12-a-lock-of-hair',
    book: SENSE_BOOK,
    chapter: 12,
    title: 'A Lock of Her Hair',
    rows: 8,
    cols: 5,
    story: {
      text: 'Margaret has seen it with her own eyes: Willoughby cut off a long {LOCK} of Marianne’s {HAIR}, {KISSED} it, and folded it into his {POCKETBOOK}. He offers her a {HORSE}, and calls her by her {NAME}. Surely they are {ENGAGED}? Elinor wonders why no one says so.',
      image: sense('006-he-cut-off-a-long-lock-of-her-hair'),
      caption: 'He cut off a long lock of her hair',
      credit: THOMSON_1896,
      crop: [0, 0, 1, 0.96],
    },
  },
];

const JANE_BOOK = 'jane-eyre';
const TOWNSEND = 'F. H. Townsend, 1897';
const townsend = (file: string) => art(`townsend-1897/${file}.jpg`);

const JANE: LevelSpec[] = [
  {
    id: 'jane-04-how-dare-i',
    book: JANE_BOOK,
    chapter: 4,
    title: 'How Dare I?',
    rows: 8,
    cols: 6,
    story: {
      text: '{ORPHANED} Jane Eyre grows up at Gateshead, unloved by her aunt, Mrs. Reed, and beaten by her {COUSIN} John. Locked in the red-room, she {FAINTS} with terror. Now she is to be sent to {SCHOOL}, called a {LIAR} before its stern master. At last Jane {SPEAKS} up: “How dare I, Mrs. Reed? Because it is the {TRUTH}!” She has never felt such {FREEDOM}.',
      image: townsend('001-how-dare-i-mrs-reed-how-dare-i-because-it-is-the-t'),
      caption: '“How dare I, Mrs. Reed? How dare I? Because it is the truth”',
      credit: TOWNSEND,
      crop: [0, 0, 1, 0.88],
    },
  },
  {
    id: 'jane-12-the-stranger',
    book: JANE_BOOK,
    chapter: 12,
    title: 'The Stranger in the Lane',
    rows: 7,
    cols: 6,
    story: {
      text: 'After eight hard years at Lowood school, Jane becomes {GOVERNESS} to little Adèle at Thornfield Hall. One icy {EVENING} in the lane, a great {DOG} runs past her, then a {HORSE} slips and falls with its rider. Jane helps the stern, dark {STRANGER} back into the {SADDLE}. Only at the hall does she learn his {NAME}.',
      image: townsend('002-i-was-mortally-afraid-of-its-trampling-forefeet'),
      caption: 'I was mortally afraid of its trampling forefeet',
      credit: TOWNSEND,
      crop: [0, 0, 1, 0.88],
    },
  },
  {
    id: 'jane-15-fire',
    book: JANE_BOOK,
    chapter: 15,
    title: 'Who Did It?',
    rows: 7,
    cols: 6,
    story: {
      text: 'Mr. Rochester, the master of {THORNFIELD}, is moody and abrupt, yet Jane loves to talk with him. One night she hears a {DEMONIAC} {LAUGH} outside her door, and {SMOKE}! His bed is in {FLAMES}. She drenches it with {WATER} and saves his life. “What is it and who did it?” he asks, and makes her swear to say nothing of his {BED}.',
      image: townsend('003-what-is-it-and-who-did-it-he-asked'),
      caption: '“What is it and who did it?” he asked',
      credit: TOWNSEND,
      crop: [0, 0, 1, 0.86],
    },
  },
  {
    id: 'jane-18-never-turned-a-page',
    book: JANE_BOOK,
    chapter: 18,
    title: 'She Never Turned a Page',
    rows: 8,
    cols: 6,
    story: {
      text: 'Thornfield fills with grand {GUESTS}, and Mr. Rochester seems set to marry the {PROUD}, {BEAUTIFUL} Blanche Ingram. Jane, unseen in a corner, watches, and her heart {ACHES}. Then an old {GYPSY} comes to tell {FORTUNES}. Blanche comes back from her, sits with a book and never turns a {PAGE}, her face growing {DARKER} every minute.',
      image: townsend('004-during-all-that-time-she-never-turned-a-page'),
      caption: 'During all that time she never turned a page',
      credit: TOWNSEND,
      crop: [0, 0, 1, 0.9],
    },
  },
];

const LITTLE_BOOK = 'little-women';
const MERRILL = 'Frank T. Merrill, 1880';
const merrill = (file: string) => art(`merrill-1880/${file}.jpg`);

const LITTLE: LevelSpec[] = [
  {
    id: 'little-01-presents',
    book: LITTLE_BOOK,
    chapter: 1,
    title: 'Without Any Presents',
    rows: 6,
    cols: 7,
    story: {
      text: '“Christmas won’t be Christmas without any {PRESENTS},” {GRUMBLES} Jo, lying on the rug. The four March sisters, Meg, Jo, Beth and Amy, are poor this year, with Father away at the war. Each has a {DOLLAR} to spend on herself, but they decide to buy gifts for their {MOTHER} instead. That night a cheerful {LETTER} comes from Father, and each girl {RESOLVES} to be better.',
      image: merrill('007-christmas-won-t-be-christmas-without-any-presents'),
      caption: '“Christmas won’t be Christmas without any presents”',
      credit: MERRILL,
    },
  },
  {
    id: 'little-02-procession',
    book: LITTLE_BOOK,
    chapter: 2,
    title: 'The Procession Set Out',
    rows: 5,
    cols: 8,
    story: {
      text: 'On Christmas morning Marmee asks a favour: a poor woman, Mrs. Hummel, has a new {BABY} and six children huddled in one bed, with no {FIRE} and no {FOOD}. The girls give up their own {BREAKFAST}, and the procession sets out through the {SNOW} with the {BUCKWHEATS}, the {BREAD} and the cream.',
      image: merrill('016-the-procession-set-out'),
      caption: 'The procession set out',
      credit: MERRILL,
    },
  },
  {
    id: 'little-03-the-laurence-boy',
    book: LITTLE_BOOK,
    chapter: 3,
    title: 'The Laurence Boy',
    rows: 6,
    cols: 7,
    story: {
      text: 'Meg and Jo go to a New Year’s {DANCE}, Meg in {BORROWED} gloves and Jo hiding the {SCORCH} on her dress. Jo slips into a curtained {RECESS}, and comes face to face with the Laurence boy from next door. Laurie is {SHY} too, and they talk and {LAUGH} like old friends, and even {POLKA} in the {HALL}.',
      image: merrill('025-face-to-face-with-the-laurence-boy'),
      caption: 'Face to face with the Laurence boy',
      credit: MERRILL,
    },
  },
  {
    id: 'little-08-i-burnt-it-up',
    book: LITTLE_BOOK,
    chapter: 8,
    title: 'I Burnt It Up',
    rows: 6,
    cols: 7,
    story: {
      text: 'Left behind when Jo and Meg go to the {THEATRE}, Amy takes her {REVENGE}: she {BURNS} the little book Jo has worked on for years. “I burnt it up,” she says, and Jo will not {FORGIVE} her. Next day Amy follows her to the river, and the {ICE} gives way. Laurie and Jo pull her out, and Jo, {SOBBING}, vows to master her {TEMPER}.',
      image: merrill('047-i-burnt-it-up'),
      caption: 'I burnt it up',
      credit: MERRILL,
    },
  },
];

/**
 * The shelf, book by book, each in reading order. New books go at the end, so the files already
 * made keep their numbers (and their layouts).
 */
export const SPECS: LevelSpec[] = [...PRIDE, ...ALICE, ...PIGS, ...CAROL, ...PERSUASION, ...EMMA, ...SENSE, ...JANE, ...LITTLE];
