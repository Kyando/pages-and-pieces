import { BOOKS } from '../core/books.ts';
import { emptyProgress, loadSave, writeSave, type LevelProgress } from '../game/save.ts';
import { Session } from '../game/session.ts';
import { detectLocale, setLocale, t, type MessageKey } from '../i18n/index.ts';
import { CATALOG } from '../levels/catalog.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { FONTS } from './desk.ts';
import { turnPage } from './fx.ts';
import { LevelView } from './level-view.ts';
import { Library, type ChapterState } from './library.ts';
import { openModal } from './overlay.ts';
import { Sfx } from './sfx.ts';
import { Shelf } from './shelf.ts';

const iconButton = (label: string, glyph: string, onClick: () => void) =>
  h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

export class App {
  private readonly save = loadSave();
  private readonly sfx = new Sfx(this.save.settings.sound);
  private readonly main: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  /** Back one step: from a chapter to its book's chapters, from those to the shelf. */
  private readonly backBtn: HTMLButtonElement;
  private view: LevelView | Library | Shelf | null = null;
  /** The book open (its key in BOOKS), or '' on the shelf. */
  private book = '';
  /** The chapter open (its index in CATALOG), or -1 in a menu. */
  private index = -1;
  /**
   * Chapters started since leaving the menus, so the arrows can step away (to look back at the
   * story) and return to the board as it was. Never saved: forgotten back in a menu.
   */
  private readonly playing = new Map<string, LevelProgress>();

  constructor(root: HTMLElement) {
    setLocale(detectLocale());
    document.title = t('game.name');
    this.soundBtn = iconButton(t('top.sound'), ICONS.soundOn, () => this.toggleSound());
    this.updateSoundIcon();
    this.backBtn = iconButton(t('top.shelf'), ICONS.shelf, () => (this.index >= 0 ? this.openLibrary(this.book) : this.openShelf()));

    const header = h(
      'header',
      { class: 'topbar' },
      h('div', { class: 'topbar-side' }, this.backBtn),
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '✦'), t('game.name')),
      h(
        'div',
        { class: 'topbar-side end' },
        iconButton(t('top.help'), ICONS.help, () => this.openHelp()),
        this.soundBtn,
      ),
    );
    this.main = h('div', { class: 'main' });
    root.append(header, this.main);
    // The finished-chapter desk's typefaces, fetched early so it never waits for them.
    FONTS.forEach((f) => void document.fonts?.load(f).catch(() => undefined));

    if (!CATALOG.length) {
      this.main.append(h('p', { class: 'empty' }, t('empty')));
      return;
    }
    this.openShelf();

    if (!this.save.settings.seenHelp) {
      this.save.settings.seenHelp = true;
      this.persist();
      this.openHelp();
    }
  }

  private persist(): void {
    writeSave(this.save);
  }

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

  /** The back button: in a chapter it leads to the book's chapters, in those to the shelf; on the shelf it hides. */
  private setBack(where: 'shelf' | 'library' | 'level'): void {
    this.backBtn.classList.toggle('is-here', where === 'shelf');
    const label = t(where === 'level' ? 'top.library' : 'top.shelf');
    this.backBtn.setAttribute('aria-label', label);
    this.backBtn.title = label;
    this.backBtn.replaceChildren(svg(where === 'level' ? ICONS.book : ICONS.shelf));
  }

  /** Swaps the screen: going deeper into the book turns the page forward, coming back turns it back. */
  private show(view: LevelView | Library | Shelf, forward: boolean): void {
    const old = this.view;
    old?.destroy();
    this.view = view;
    if (old) turnPage(this.main, old.el, view.el, forward);
    else this.main.replaceChildren(view.el);
  }

  /** The first screen: every book, with how far the player has read it. */
  private openShelf(): void {
    if (this.view instanceof Shelf) return;
    this.book = '';
    this.index = -1;
    this.playing.clear();
    this.setBack('shelf');
    const books = Object.entries(BOOKS).flatMap(([key, book]) => {
      const chapters = this.chaptersOf(key);
      return chapters.length ? [{ key, book, total: chapters.length, done: chapters.filter((i) => this.isDone(i)).length }] : [];
    });
    this.show(new Shelf({ books, onOpen: (key) => this.openLibrary(key) }), false);
  }

  /** A book's chapters, finished ones showing their picture. */
  private openLibrary(book: string): void {
    if (this.view instanceof Library && this.book === book) return;
    // From the shelf, the book opens (forward); back from a chapter, the page turns back.
    const forward = this.view instanceof Shelf;
    this.book = book;
    this.index = -1;
    this.playing.clear();
    this.setBack('library');
    const chapters = this.chaptersOf(book);
    const current = this.currentChapter(book);
    const library = new Library({
      chapters: chapters.map((i) => ({ def: CATALOG[i].def, state: this.stateOf(i) })),
      current: current === undefined ? -1 : chapters.indexOf(current),
      onOpen: (i) => this.openLevel(chapters[i]),
      onErase: chapters.some((i) => this.isDone(i)) ? () => this.confirmErase(book) : undefined,
    });
    this.show(library, forward);
    library.reveal();
  }

  /** Opens a chapter; moving through the book turns the page, forward or back. */
  private openLevel(index: number): void {
    if (this.stateOf(index) === 'locked') return;
    const forward = index >= this.index;
    this.setBack('level');
    this.index = index;
    const entry = CATALOG[index];
    this.book = entry.def.book;
    const id = entry.def.id;
    // A chapter opens new, or finished; or as it was left, if the arrows only stepped away from it.
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
    const view = new LevelView({
      session,
      sfx: this.sfx,
      onPrev: prev === undefined ? undefined : () => this.openLevel(prev),
      onNext: next === undefined ? undefined : () => this.openLevel(next),
      nextLocked: next !== undefined && this.stateOf(next) === 'locked',
      nextTitle: next === undefined ? undefined : CATALOG[next].def.title,
      onChapters: () => this.openLibrary(this.book),
      intro: true,
    });
    this.show(view, forward);
    // The next chapter's picture, so it's ready when the player gets there.
    if (next !== undefined) new Image().src = CATALOG[next].def.story.image;
  }

  // ── modals ──────────────────────────────────────────────────────────────

  private openHelp(): void {
    const withStrong = (key: MessageKey, strongKey: MessageKey) => {
      const [before, after] = t(key).split('{strong}');
      return [before, h('b', {}, t(strongKey)), after ?? ''];
    };
    openModal({
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
      actions: [h('button', { type: 'button', class: 'btn btn--primary', onclick: (e: Event) => (e.target as HTMLElement).closest('dialog')?.close() }, t('help.go'))],
    });
  }

  /** Asks before wiping a book's progress; other books, sound and the seen help stay as they are. */
  private confirmErase(book: string): void {
    const modal = openModal({
      title: t('erase.title'),
      body: h('p', { class: 'erase-text' }, t('erase.body')),
      actions: [
        h('button', { type: 'button', class: 'btn', onclick: () => modal.close() }, t('erase.cancel')),
        h('button', { type: 'button', class: 'btn btn--danger', onclick: () => {
          modal.close();
          for (const i of this.chaptersOf(book)) delete this.save.levels[CATALOG[i].def.id];
          this.persist();
          const library = this.view;
          this.view = null;
          library?.destroy();
          this.main.replaceChildren();
          this.openLibrary(book);
        } }, t('erase.confirm')),
      ],
    });
  }

  // ── settings ────────────────────────────────────────────────────────────

  private toggleSound(): void {
    this.save.settings.sound = !this.save.settings.sound;
    this.sfx.enabled = this.save.settings.sound;
    this.updateSoundIcon();
    this.persist();
    if (this.sfx.enabled) this.sfx.pick();
  }

  private updateSoundIcon(): void {
    this.soundBtn.replaceChildren(svg(this.save.settings.sound ? ICONS.soundOn : ICONS.soundOff));
    this.soundBtn.setAttribute('aria-pressed', String(this.save.settings.sound));
  }
}
