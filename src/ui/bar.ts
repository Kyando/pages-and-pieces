import { h, svg } from './dom.ts';

/** A round icon button for a screen's bar. */
export const barButton = (label: string, glyph: string, onClick: () => void, className = ''): HTMLButtonElement =>
  h('button', { type: 'button', class: `icon-btn bar-btn ${className}`, 'aria-label': label, title: label, onclick: onClick }, svg(glyph));

/**
 * A screen's own bar, as apps have: what leads back on the left, what the screen is in the middle,
 * its menu on the right. It stays at the top while the screen scrolls, clear of the phone's notch.
 */
export function screenBar(start: Node | null, middle: Node | null, end: Node | null): HTMLElement {
  return h(
    'header',
    { class: 'screen-bar' },
    h('div', { class: 'screen-bar-side' }, start),
    h('div', { class: 'screen-bar-middle' }, middle),
    h('div', { class: 'screen-bar-side end' }, end),
  );
}

/** The game's name, set as a small wordmark. */
export const wordmark = (name: string): HTMLElement =>
  h('span', { class: 'wordmark' }, h('span', { class: 'wordmark-mark', 'aria-hidden': 'true' }, '✦'), name);
