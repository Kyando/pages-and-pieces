import { BOOKS } from '../core/books.ts';
import { emptyProgress, loadSave, writeSave, type LevelProgress, type ThemeChoice } from '../game/save.ts';
import { Session } from '../game/session.ts';
import { detectLocale, setLocale, t, tn, type MessageKey } from '../i18n/index.ts';
import { CATALOG } from '../levels/catalog.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { LevelView } from './level-view.ts';
import { openModal, toast } from './overlay.ts';
import { Sfx } from './sfx.ts';
import { passage } from './story.ts';

const THEME_LABEL: Record<ThemeChoice, MessageKey> = { system: 'theme.system', light: 'theme.light', dark: 'theme.dark' };

const iconButton = (label: string, glyph: string, onClick: () => void) =>
  h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

/** "ELIZABETH" → "Elizabeth", for the finished passage. */
const asWritten = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();

export class App {
  private readonly save = loadSave();
  private readonly sfx = new Sfx(this.save.settings.sound);
  private readonly main: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private view: LevelView | null = null;
  private index = 0;

  constructor(root: HTMLElement) {
    setLocale(detectLocale());
    document.title = t('game.name');
    this.applyTheme();
    this.soundBtn = iconButton(t('top.sound'), ICONS.soundOn, () => this.toggleSound());
    this.updateSoundIcon();

    const header = h(
      'header',
      { class: 'topbar' },
      h('div', { class: 'topbar-side' }, iconButton(t('top.chapters'), ICONS.book, () => this.openChapters())),
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '✦'), t('game.name')),
      h(
        'div',
        { class: 'topbar-side end' },
        iconButton(t('top.help'), ICONS.help, () => this.openHelp()),
        this.soundBtn,
        iconButton(t('top.theme'), ICONS.theme, () => this.cycleTheme()),
      ),
    );
    this.main = h('div', { class: 'main' });
    root.append(header, this.main);

    if (!CATALOG.length) {
      this.main.append(h('p', { class: 'empty' }, t('empty')));
      return;
    }
    const last = CATALOG.findIndex((l) => l.def.id === this.save.settings.lastLevel);
    const firstOpen = CATALOG.findIndex((l) => !this.save.levels[l.def.id]?.done);
    this.openLevel(last >= 0 ? last : Math.max(0, firstOpen));

    if (!this.save.settings.seenHelp) {
      this.save.settings.seenHelp = true;
      this.persist();
      this.openHelp();
    }
  }

  private persist(): void {
    writeSave(this.save);
  }

  private openLevel(index: number): void {
    this.view?.destroy();
    this.index = index;
    const entry = CATALOG[index];
    const progress: LevelProgress = (this.save.levels[entry.def.id] ??= emptyProgress());
    const session = new Session(entry.puzzle, progress, () => this.persist());
    this.view = new LevelView({
      session,
      sfx: this.sfx,
      onSolved: () => this.showWin(session),
      onPrev: index > 0 ? () => this.openLevel(index - 1) : undefined,
      onNext: index < CATALOG.length - 1 ? () => this.openLevel(index + 1) : undefined,
      onChapters: () => this.openChapters(),
    });
    this.main.replaceChildren(this.view.el);
    // The next chapter's picture, so it's ready when the player gets there.
    const next = CATALOG[index + 1];
    if (next) new Image().src = next.def.story.image;
    this.save.settings.lastLevel = entry.def.id;
    this.persist();
  }

  // ── modals ──────────────────────────────────────────────────────────────

  /** Every chapter, grouped by book. */
  private openChapters(): void {
    const books = [...new Set(CATALOG.map((e) => e.def.book))];
    const modal = openModal({
      title: t('chapters.title'),
      className: 'modal--chapters',
      body: h(
        'div',
        { class: 'books' },
        ...books.map((bookId) => {
          const book = BOOKS[bookId];
          return h(
            'section',
            { class: 'book' },
            h('h3', { class: 'book-title' }, book.title, h('small', {}, t('chapters.by', { author: book.author, year: book.year }))),
            h(
              'ol',
              { class: 'chapters' },
              ...CATALOG.map((entry, i) => ({ entry, i }))
                .filter(({ entry }) => entry.def.book === bookId)
                .map(({ entry, i }) => {
                  const done = this.save.levels[entry.def.id]?.done;
                  const classes = ['chapter-card', i === this.index && 'is-current', done && 'is-done'];
                  return h(
                    'li',
                    {},
                    h(
                      'button',
                      {
                        type: 'button',
                        class: classes.filter(Boolean).join(' '),
                        onclick: () => {
                          modal.close();
                          this.openLevel(i);
                        },
                      },
                      // A finished chapter shows its picture; the others stay closed books.
                      done
                        ? h('img', { class: 'chapter-thumb', src: entry.def.story.image, alt: '' })
                        : h('span', { class: 'chapter-thumb is-locked', 'aria-hidden': 'true' }, String(i + 1)),
                      h('span', { class: 'chapter-title' }, entry.def.title),
                      h('span', { class: 'chapter-meta' }, t('chapters.meta', { chapter: entry.def.chapter, rows: entry.def.rows, cols: entry.def.cols })),
                    ),
                  );
                }),
            ),
          );
        }),
      ),
    });
  }

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

  private showWin(session: Session): void {
    const { def, words } = session.puzzle;
    const misses = session.progress.misses;
    const hasNext = this.index < CATALOG.length - 1;
    const book = BOOKS[def.book];
    const stat = (value: number, label: string) => h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));

    const share = () => {
      const verdict = misses === 0 ? t('win.flawless') : tn('win.missCount', misses);
      const text = t('win.shareText', { game: t('game.name'), book: book.title, chapter: def.chapter, verdict });
      navigator.clipboard?.writeText(text).then(
        () => toast(t('win.copied')),
        () => toast(t('win.copyFailed')),
      );
    };

    const modal = openModal({
      title: t('win.title'),
      className: 'modal--win',
      body: h(
        'div',
        { class: 'win' },
        h('img', { class: 'win-picture', src: def.story.image, alt: def.story.caption }),
        passage(def.story, words, (w) => h('strong', {}, asWritten(w.text))),
        h('p', { class: 'win-credit' }, `“${def.story.caption}”, ${def.story.credit}`),
        h('div', { class: 'stats' }, stat(words.length, tn('win.words', words.length)), stat(misses, tn('win.misses', misses))),
      ),
      actions: [
        h('button', { type: 'button', class: 'btn', onclick: share }, svg(ICONS.share), h('span', {}, t('win.share'))),
        hasNext
          ? h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { modal.close(); this.openLevel(this.index + 1); } }, h('span', {}, t('win.next')), svg(ICONS.arrow))
          : h('button', { type: 'button', class: 'btn btn--primary', onclick: () => { modal.close(); this.openChapters(); } }, h('span', {}, t('win.chapters'))),
      ],
    });
  }

  // ── settings ────────────────────────────────────────────────────────────

  private applyTheme(): void {
    const theme = this.save.settings.theme;
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }

  private cycleTheme(): void {
    const order: ThemeChoice[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.save.settings.theme) + 1) % order.length];
    this.save.settings.theme = next;
    this.applyTheme();
    this.persist();
    toast(t(THEME_LABEL[next]));
  }

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
