import { h, svg } from './dom.ts';
import { t } from '../i18n/index.ts';
import { ICONS } from './icons.ts';

let toastEl: HTMLElement | null = null;
let toastTimer = 0;

/** Short message under the header, Termo-style. */
export function toast(message: string, ms = 2200): void {
  toastEl ??= document.body.appendChild(h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }));
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove('is-visible'), ms);
}

/**
 * Dialogs take part in the history, like screens: opening one adds an entry, so the back button
 * (a phone's, or the browser's) closes it instead of leaving the screen beneath.
 */
const open: HTMLDialogElement[] = [];
/** Steps back taken by a dialog closing itself: not the player pressing back. */
let ownSteps = 0;
/** Whether the latest step back belonged to a dialog (see popHandled). */
let handled = false;

window.addEventListener('popstate', () => {
  handled = true;
  if (ownSteps > 0) {
    ownSteps--;
    return;
  }
  // Back pressed: the topmost dialog goes, its history entry already gone.
  const top = open.at(-1);
  if (top) {
    top.dataset.popped = '1';
    top.close();
    return;
  }
  handled = false;
});

/**
 * Did the step back just taken belong to a dialog (closing it)? Then the screen beneath stays.
 * Listeners registered after this module's (the App's) ask it from their own popstate handler.
 */
export const popHandled = (): boolean => handled;

/** Shows a <dialog> as modal, with its own history entry; `onClose` runs once it's gone. */
function present(dialog: HTMLDialogElement, onClose?: () => void): () => void {
  const close = () => dialog.close();
  // Clicks on the backdrop land on the <dialog> itself.
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  dialog.addEventListener('close', () => {
    open.splice(open.indexOf(dialog), 1);
    dialog.remove();
    if (dialog.dataset.popped || !history.state?.dialog) {
      onClose?.();
      return;
    }
    // Closed from inside (a button, the backdrop, Escape): its history entry goes too, and only
    // then does whatever follows run, so a dialog it opens gets an entry of its own.
    ownSteps++;
    window.addEventListener('popstate', () => onClose?.(), { once: true });
    history.back();
  });
  document.body.append(dialog);
  open.push(dialog);
  history.pushState({ ...history.state, dialog: true }, '');
  dialog.showModal();
  return close;
}

export interface ModalOptions {
  title: string;
  body: Node;
  actions?: Node[];
  className?: string;
  onClose?: () => void;
}

export function openModal({ title, body, actions, className, onClose }: ModalOptions): { close(): void } {
  const dialog = h('dialog', { class: `modal ${className ?? ''}` });
  dialog.append(
    h(
      'div',
      { class: 'modal-inner' },
      h('button', { type: 'button', class: 'icon-btn modal-close', 'aria-label': t('modal.close'), onclick: () => dialog.close() }, svg(ICONS.close)),
      h('h2', {}, title),
      body,
      actions?.length ? h('div', { class: 'modal-actions' }, ...actions) : null,
    ),
  );
  return { close: present(dialog, onClose) };
}

export interface SheetItem {
  icon: string;
  label: string;
  /** Picking it closes the sheet first, then acts; a switch flips in place instead. */
  onSelect(): void;
  /** A switch: shown on or off, and the sheet stays open when it's flipped. */
  on?: boolean;
  danger?: boolean;
}

/**
 * A menu that slides up from the bottom of the screen, where the thumb is: a title, then one row
 * per item.
 */
export function openSheet(title: string, items: SheetItem[]): { close(): void } {
  const dialog = h('dialog', { class: 'menu-sheet' });
  let picked: SheetItem | null = null;
  const row = (item: SheetItem) => {
    const button = h(
      'button',
      {
        type: 'button',
        class: `sheet-item${item.danger ? ' is-danger' : ''}`,
        ...(item.on === undefined ? {} : { role: 'switch', 'aria-checked': String(item.on) }),
      },
      svg(item.icon),
      h('span', { class: 'sheet-label' }, item.label),
      item.on === undefined ? '' : h('span', { class: 'sheet-switch', 'aria-hidden': 'true' }),
    );
    button.addEventListener('click', () => {
      if (item.on === undefined) {
        picked = item;
        dialog.close();
        return;
      }
      item.on = !item.on;
      button.setAttribute('aria-checked', String(item.on));
      item.onSelect();
    });
    return button;
  };
  dialog.append(
    h(
      'div',
      { class: 'sheet-inner' },
      h('span', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      h('h2', { class: 'sheet-title' }, title),
      h('div', { class: 'sheet-items' }, ...items.map(row)),
      h('button', { type: 'button', class: 'sheet-cancel', onclick: () => dialog.close() }, t('modal.close')),
    ),
  );
  // The item acts once the sheet (and its history entry) has gone, so what it opens stacks cleanly.
  return { close: present(dialog, () => picked?.onSelect()) };
}

/** Asks before something that can't be undone; `onConfirm` runs once the dialog has gone. */
export function confirmAction(opts: { title: string; body: string; cancel: string; confirm: string; onConfirm(): void }): void {
  let confirmed = false;
  const modal = openModal({
    title: opts.title,
    body: h('p', { class: 'erase-text' }, opts.body),
    actions: [
      h('button', { type: 'button', class: 'btn', onclick: () => modal.close() }, opts.cancel),
      h('button', { type: 'button', class: 'btn btn--danger', onclick: () => {
        confirmed = true;
        modal.close();
      } }, opts.confirm),
    ],
    onClose: () => confirmed && opts.onConfirm(),
  });
}
