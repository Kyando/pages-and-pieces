import { BOOKS } from '../core/books.ts';
import { emptyProgress, loadSave, writeSave, type LevelProgress } from '../game/save.ts';
import { Session } from '../game/session.ts';
import { detectLocale, setLocale, t, type MessageKey } from '../i18n/index.ts';
import { CATALOG } from '../levels/catalog.ts';
import { h } from './dom.ts';
import { ICONS } from './icons.ts';
import { FONTS } from './desk.ts';
import { turnPage } from './fx.ts';
import { LevelView } from './level-view.ts';
import { Library, type ChapterState } from './library.ts';
import { confirmAction, openModal, openSheet, popHandled, type SheetItem } from './overlay.ts';
import { Sfx } from './sfx.ts';
import { Shelf } from './shelf.ts';

/** Where the player is: the shelf, a book's chapters, or a chapter (by its index in CATALOG). */
type Route = { screen: 'shelf' } | { screen: 'library'; book: string } | { screen: 'level'; index: number };

/**
 * What each history entry holds: the screen, and how deep it is (shelf 0, chapters 1, a chapter 2),
 * so stepping back knows which way to turn the page.
 */
interface Entry {
  route: Route;
  depth: number;
  /** Pushed by the game over its parent screen: stepping back leads there. */
  pushed?: boolean;
}

const depthOf = (route: Route): number => ({ shelf: 0, library: 1, level: 2 })[route.screen];

/**
 * The game, screen by screen, as an app: shelf → a book's chapters → a chapter. Each screen has its
 * own bar (no site header). Every step deeper is a history entry, so the back button (a phone's,
 * or the browser's) steps back out the same way, one screen at a time, and leaves the game only
 * from the shelf; dialogs take part too (see overlay.ts).
 */
export class App {
  private readonly save = loadSave();
  private readonly sfx = new Sfx(this.save.settings.sound);
  private readonly main: HTMLElement;
  private view: LevelView | Library | Shelf | null = null;
  private route: Route = { screen: 'shelf' };
  /**
   * Chapters started since leaving the menus, so the arrows can step away (to look back at the
   * story) and return to the board as it was. Never saved: forgotten back in a menu.
   */
  private readonly playing = new Map<string, LevelProgress>();

  constructor(root: HTMLElement) {
    setLocale(detectLocale());
    document.title = t('game.name');
    this.main = h('div', { class: 'main' });
    root.append(this.main);
    // The finished-chapter desk's typefaces, fetched early so it never waits for them.
    FONTS.forEach((f) => void document.fonts?.load(f).catch(() => undefined));

    if (!CATALOG.length) {
      this.main.append(h('p', { class: 'empty' }, t('empty')));
      return;
    }
    window.addEventListener('popstate', (e) => this.onBack(e.state as Partial<Entry> | null));
    // A reload keeps the screen the player was on; anything else starts on the shelf.
    const was = history.state as Partial<Entry> | null;
    const kept = was?.route && this.valid(was.route);
    const start = kept ? was.route! : { screen: 'shelf' as const };
    history.replaceState({ route: start, depth: depthOf(start), pushed: kept && was.pushed } satisfies Entry, '');
    this.show(start, true);

    if (!this.save.settings.seenHelp) {
      this.save.settings.seenHelp = true;
      this.persist();
      this.openHelp();
    }
  }

  private persist(): void {
    writeSave(this.save);
  }

  // ── navigation ──────────────────────────────────────────────────────────

  /** Can this screen be shown now? A chapter not yet reached can't. */
  private valid(route: Route): boolean {
    if (route.screen === 'library') return !!BOOKS[route.book] && this.chaptersOf(route.book).length > 0;
    if (route.screen === 'level') return !!CATALOG[route.index] && this.stateOf(route.index) !== 'locked';
    return true;
  }

  /** Goes deeper (a new history entry), or across (replacing this one: chapter to chapter). */
  private go(route: Route, how: 'push' | 'replace'): void {
    if (!this.valid(route)) return;
    // Across keeps how this entry came to be: a chapter reached from the chapters still leads back there.
    const pushed = how === 'push' || !!(history.state as Entry | null)?.pushed;
    const entry: Entry = { route, depth: depthOf(route), pushed };
    if (how === 'push') history.pushState(entry, '');
    else history.replaceState(entry, '');
    this.show(route);
  }

  /** One screen up: back through the history when it leads there, so the stack stays true. */
  private up(): void {
    const depth = depthOf(this.route);
    if (depth === 0) return;
    const parent: Route = depth === 2 ? { screen: 'library', book: this.book } : { screen: 'shelf' };
    const here = history.state as Entry | null;
    if (here?.pushed && here.depth === depth) {
      history.back();
      return;
    }
    // Reached without its parent beneath (a link, a fresh start): the parent takes this entry's place.
    history.replaceState({ route: parent, depth: depthOf(parent), pushed: false } satisfies Entry, '');
    this.show(parent);
  }

  /** The back button pressed (or a dialog closed itself): show the screen of the entry reached. */
  private onBack(state: Partial<Entry> | null): void {
    if (popHandled()) return;
    const route = state?.route && this.valid(state.route) ? state.route : { screen: 'shelf' as const };
    if (this.same(route)) return;
    this.show(route);
  }

  private same(route: Route): boolean {
    const now = this.route;
    if (route.screen !== now.screen) return false;
    if (route.screen === 'library' && now.screen === 'library') return route.book === now.book;
    if (route.screen === 'level' && now.screen === 'level') return route.index === now.index;
    return true;
  }

  /** The book open now: the library's, or the chapter's. */
  private get book(): string {
    const r = this.route;
    return r.screen === 'library' ? r.book : r.screen === 'level' ? CATALOG[r.index].def.book : '';
  }

  /**
   * Puts a screen up. Going deeper into the book turns the page forward, coming back turns it back;
   * between chapters, it turns the way the story goes. `still` swaps without turning.
   */
  private show(route: Route, still = false): void {
    const from = this.route;
    const deeper = depthOf(route) - depthOf(from);
    const forward = deeper !== 0 ? deeper > 0 : route.screen === 'level' && from.screen === 'level' ? route.index >= from.index : true;
    // Leaving the chapters for a menu forgets boards in progress.
    if (route.screen !== 'level') this.playing.clear();
    this.route = route;
    const view = route.screen === 'shelf' ? this.makeShelf() : route.screen === 'library' ? this.makeLibrary(route.book) : this.makeLevel(route.index);
    const old = this.view;
    old?.destroy();
    this.view = view;
    if (old && !still) turnPage(this.main, old.el, view.el, forward);
    else this.main.replaceChildren(view.el);
    if (view instanceof Library) view.reveal();
  }

  /** The same screen again, rebuilt (after its progress changed), without turning a page. */
  private refresh(): void {
    this.show(this.route, true);
  }

  // ── chapters ────────────────────────────────────────────────────────────

  /** A book's chapters, as indices into CATALOG, in reading order. */
  private chaptersOf(book: string): number[] {
    return CATALOG.flatMap((entry, i) => (entry.def.book === book ? [i] : []));
  }

  /** The chapter before or after this one in the same book; undefined at either end. */
  private neighbour(index: number, step: -1 | 1): number | undefined {
    const chapters = this.chaptersOf(CATALOG[index].def.book);
    return chapters[chapters.indexOf(index) + step];
  }

  private isDone(index: number): boolean {
    return !!this.save.levels[CATALOG[index].def.id]?.done;
  }

  /**
   * Each book's chapters open in order: the first, any finished, and the one after a finished
   * chapter. Names are only hidden once the story has introduced them, so it reads in order.
   */
  private stateOf(index: number): ChapterState {
    if (this.isDone(index)) return 'done';
    const prev = this.neighbour(index, -1);
    if (prev === undefined || this.isDone(prev)) return 'open';
    return 'locked';
  }

  /** Where to pick up in a book: its first chapter not yet finished; undefined once it's done. */
  private currentChapter(book: string): number | undefined {
    return this.chaptersOf(book).find((i) => this.stateOf(i) === 'open');
  }

  // ── screens ─────────────────────────────────────────────────────────────

  /** The first screen: every book, with how far the player has read it. */
  private makeShelf(): Shelf {
    const books = Object.entries(BOOKS).flatMap(([key, book]) => {
      const chapters = this.chaptersOf(key);
      return chapters.length ? [{ key, book, total: chapters.length, done: chapters.filter((i) => this.isDone(i)).length }] : [];
    });
    return new Shelf({
      books,
      onOpen: (key) => this.go({ screen: 'library', book: key }, 'push'),
      onSettings: () => this.openSettings(),
    });
  }

  /** A book's chapters, finished ones showing their picture. */
  private makeLibrary(book: string): Library {
    const chapters = this.chaptersOf(book);
    const current = this.currentChapter(book);
    return new Library({
      chapters: chapters.map((i) => ({ def: CATALOG[i].def, state: this.stateOf(i) })),
      current: current === undefined ? -1 : chapters.indexOf(current),
      onOpen: (i) => this.go({ screen: 'level', index: chapters[i] }, 'push'),
      onBack: () => this.up(),
      onSettings: () => this.openSettings(book),
    });
  }

  /** A chapter: new, finished, or as it was left if the arrows only stepped away from it. */
  private makeLevel(index: number): LevelView {
    const entry = CATALOG[index];
    const id = entry.def.id;
    let progress = this.playing.get(id);
    if (!progress) {
      progress = this.save.levels[id]?.done
        ? { found: entry.puzzle.words.map((w) => w.text), done: true, misses: 0 }
        : emptyProgress();
      this.playing.set(id, progress);
    }
    const session = new Session(entry.puzzle, progress, () => {
      if (!progress.done || this.save.levels[id]) return;
      this.save.levels[id] = { done: true };
      this.persist();
    });
    const prev = this.neighbour(index, -1);
    const next = this.neighbour(index, 1);
    // The next chapter's picture, so it's ready when the player gets there.
    if (next !== undefined) new Image().src = CATALOG[next].def.story.image;
    return new LevelView({
      session,
      sfx: this.sfx,
      onPrev: prev === undefined ? undefined : () => this.go({ screen: 'level', index: prev }, 'replace'),
      onNext: next === undefined ? undefined : () => this.go({ screen: 'level', index: next }, 'replace'),
      nextLocked: next !== undefined && this.stateOf(next) === 'locked',
      nextTitle: next === undefined ? undefined : CATALOG[next].def.title,
      onChapters: () => this.up(),
      menuItems: () => [this.soundItem(), this.helpItem()],
      intro: true,
    });
  }

  // ── menus and dialogs ───────────────────────────────────────────────────

  private soundItem(): SheetItem {
    return { icon: ICONS.soundOn, label: t('settings.sound'), on: this.save.settings.sound, onSelect: () => this.toggleSound() };
  }

  private helpItem(): SheetItem {
    return { icon: ICONS.help, label: t('settings.help'), onSelect: () => this.openHelp() };
  }

  /** Settings, from the shelf or (with `book`) a book's chapters, where starting it again belongs. */
  private openSettings(book?: string): void {
    const items: SheetItem[] = [this.soundItem(), this.helpItem(), { icon: ICONS.info, label: t('settings.credits'), onSelect: () => this.openCredits() }];
    if (book && this.chaptersOf(book).some((i) => this.isDone(i))) {
      items.push({ icon: ICONS.restart, label: t('settings.eraseBook'), danger: true, onSelect: () => this.confirmErase(book) });
    } else if (!book && Object.keys(this.save.levels).length) {
      items.push({ icon: ICONS.restart, label: t('settings.eraseAll'), danger: true, onSelect: () => this.confirmErase() });
    }
    openSheet(t('settings.title'), items);
  }

  private openHelp(): void {
    const withStrong = (key: MessageKey, strongKey: MessageKey) => {
      const [before, after] = t(key).split('{strong}');
      return [before, h('b', {}, t(strongKey)), after ?? ''];
    };
    const modal = openModal({
      title: t('help.title'),
      className: 'modal--help',
      body: h(
        'div',
        { class: 'help' },
        h('p', {}, ...withStrong('help.intro', 'help.introStrong')),
        h(
          'ul',
          {},
          h('li', {}, ...withStrong('help.drag', 'help.dragStrong')),
          h('li', {}, t('help.reveal')),
          h('li', {}, t('help.both')),
          h('li', {}, t('help.finish')),
        ),
      ),
      actions: [h('button', { type: 'button', class: 'btn btn--primary', onclick: () => modal.close() }, t('help.go'))],
    });
  }

  /** The books, their authors, and whose pictures they carry: all in the public domain. */
  private openCredits(): void {
    const books = Object.entries(BOOKS).flatMap(([key, book]) => {
      const artists = [...new Set(this.chaptersOf(key).map((i) => CATALOG[i].def.story.credit))];
      return artists.length ? [h('li', {}, h('b', {}, book.title), ` · ${book.author}, ${book.year}`, h('br', {}), h('small', {}, artists.join(' · ')))] : [];
    });
    openModal({
      title: t('credits.title'),
      className: 'modal--credits',
      body: h('div', { class: 'credits-text' }, h('p', {}, t('credits.intro')), h('ul', {}, ...books)),
    });
  }

  /** Asks before wiping a book's progress (or, from the shelf, every book's); sound and the seen help stay. */
  private confirmErase(book?: string): void {
    confirmAction({
      title: t(book ? 'erase.title' : 'erase.allTitle'),
      body: t(book ? 'erase.body' : 'erase.allBody'),
      cancel: t('erase.cancel'),
      confirm: t('erase.confirm'),
      onConfirm: () => {
        if (book) for (const i of this.chaptersOf(book)) delete this.save.levels[CATALOG[i].def.id];
        else this.save.levels = {};
        this.persist();
        this.refresh();
      },
    });
  }

  private toggleSound(): void {
    this.save.settings.sound = !this.save.settings.sound;
    this.sfx.enabled = this.save.settings.sound;
    this.persist();
    if (this.sfx.enabled) this.sfx.pick();
  }
}
