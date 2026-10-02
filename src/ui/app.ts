import { BOOKS } from '../core/books.ts';
import { emptyProgress, loadSave, writeSave, type LevelProgress } from '../game/save.ts';
import { Session } from '../game/session.ts';
import { detectLocale, setLocale, t, type MessageKey } from '../i18n/index.ts';
import { CATALOG } from '../levels/catalog.ts';
import { h, svg } from './dom.ts';
import { ICONS } from './icons.ts';
import { LevelView } from './level-view.ts';
import { openModal } from './overlay.ts';
import { Sfx } from './sfx.ts';

const iconButton = (label: string, glyph: string, onClick: () => void) =>
  h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

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
      onPrev: index > 0 ? () => this.openLevel(index - 1) : undefined,
      onNext: index < CATALOG.length - 1 ? () => this.openLevel(index + 1) : undefined,
      nextTitle: CATALOG[index + 1]?.def.title,
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
