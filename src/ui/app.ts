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

const iconButton = (label: string, glyph: string, onClick: () => void) =>
  h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

export class App {
  private readonly save = loadSave();
  private readonly sfx = new Sfx(this.save.settings.sound);
  private readonly main: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly libraryBtn: HTMLButtonElement;
  private view: LevelView | Library | null = null;
  /** The chapter open, or -1 in the library. */
  private index = -1;

  constructor(root: HTMLElement) {
    setLocale(detectLocale());
    document.title = t('game.name');
    this.soundBtn = iconButton(t('top.sound'), ICONS.soundOn, () => this.toggleSound());
    this.updateSoundIcon();
    this.libraryBtn = iconButton(t('top.library'), ICONS.book, () => this.openLibrary());

    const header = h(
      'header',
      { class: 'topbar' },
      h('div', { class: 'topbar-side' }, this.libraryBtn),
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
    this.openLibrary();

    if (!this.save.settings.seenHelp) {
      this.save.settings.seenHelp = true;
      this.persist();
      this.openHelp();
    }
  }

  private persist(): void {
    writeSave(this.save);
  }

  /**
   * Chapters open in order: the first, any already started or finished, and the one after a
   * finished chapter. Names are only hidden once the story has introduced them, so it reads in order.
   */
  private stateOf(index: number): ChapterState {
    const progress = this.save.levels[CATALOG[index].def.id];
    if (progress?.done) return 'done';
    const prev = CATALOG[index - 1];
    if (!prev || progress?.found.length || this.save.levels[prev.def.id]?.done) return 'open';
    return 'locked';
  }

  /** Where to pick up: the last chapter played if it isn't finished, else the first open one; -1 once the book is done. */
  private currentChapter(): number {
    const last = CATALOG.findIndex((l) => l.def.id === this.save.settings.lastLevel);
    if (last >= 0 && this.stateOf(last) === 'open') return last;
    return CATALOG.findIndex((_, i) => this.stateOf(i) === 'open');
  }

  /** Swaps the screen: going deeper into the book turns the page forward, coming back turns it back. */
  private show(view: LevelView | Library, forward: boolean): void {
    const old = this.view;
    old?.destroy();
    this.view = view;
    if (old) turnPage(this.main, old.el, view.el, forward);
    else this.main.replaceChildren(view.el);
  }

  /** The main menu: every chapter of the book, finished ones showing their picture. */
  private openLibrary(): void {
    if (this.view instanceof Library) return;
    this.index = -1;
    this.libraryBtn.classList.add('is-here');
    const library = new Library({
      chapters: CATALOG.map((entry, i) => ({ def: entry.def, state: this.stateOf(i) })),
      current: this.currentChapter(),
      onOpen: (i) => this.openLevel(i),
      onErase: Object.values(this.save.levels).some((p) => p.found.length || p.done) ? () => this.confirmErase() : undefined,
    });
    this.show(library, false);
    library.reveal();
  }

  /** Opens a chapter; moving through the book turns the page, forward or back. */
  private openLevel(index: number): void {
    if (this.stateOf(index) === 'locked') return;
    const forward = index >= this.index;
    this.libraryBtn.classList.remove('is-here');
    this.index = index;
    const entry = CATALOG[index];
    const progress: LevelProgress = (this.save.levels[entry.def.id] ??= emptyProgress());
    const session = new Session(entry.puzzle, progress, () => this.persist());
    const hasNext = index < CATALOG.length - 1;
    const view = new LevelView({
      session,
      sfx: this.sfx,
      onPrev: index > 0 ? () => this.openLevel(index - 1) : undefined,
      onNext: hasNext ? () => this.openLevel(index + 1) : undefined,
      nextLocked: hasNext && this.stateOf(index + 1) === 'locked',
      nextTitle: CATALOG[index + 1]?.def.title,
      onChapters: () => this.openLibrary(),
      intro: true,
    });
    this.show(view, forward);
    // The next chapter's picture, so it's ready when the player gets there.
    const next = CATALOG[index + 1];
    if (next) new Image().src = next.def.story.image;
    this.save.settings.lastLevel = entry.def.id;
    this.persist();
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

  /** Asks before wiping every chapter's progress; sound and the seen help stay as they are. */
  private confirmErase(): void {
    const modal = openModal({
      title: t('erase.title'),
      body: h('p', { class: 'erase-text' }, t('erase.body')),
      actions: [
        h('button', { type: 'button', class: 'btn', onclick: () => modal.close() }, t('erase.cancel')),
        h('button', { type: 'button', class: 'btn btn--danger', onclick: () => {
          modal.close();
          this.save.levels = {};
          this.save.settings.lastLevel = null;
          this.persist();
          const library = this.view;
          this.view = null;
          library?.destroy();
          this.main.replaceChildren();
          this.openLibrary();
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
