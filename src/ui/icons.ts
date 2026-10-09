const base = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  book: base('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>'),
  shelf: base('<path d="M3 20h18"/><path d="M5 20V6h3v14"/><path d="M10 20V4h3v16"/><path d="m15.4 7.3 2.9-.8 2.6 13-2.9.6z"/>'),
  help: base('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9"/><path d="M12 17.2h.01"/>'),
  soundOn: base('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>'),
  soundOff: base('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>'),
  check: base('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  restart: base('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'),
  close: base('<path d="m6 6 12 12"/><path d="M18 6 6 18"/>'),
  prev: base('<path d="m15 5-7 7 7 7"/>'),
  next: base('<path d="m9 5 7 7-7 7"/>'),
  arrow: base('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  /** Share: the box with an arrow leaving it, as phones show it. */
  share: base('<path d="M12 3.5v11"/><path d="m8 7.5 4-4 4 4"/><path d="M8.5 10.5H7a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2h-1.5"/>'),
  settings: base('<path d="M10.3 3.2a1.8 1.8 0 0 1 3.4 0l.4 1.2a1.8 1.8 0 0 0 2.4 1l1.2-.5a1.8 1.8 0 0 1 2.4 2.4l-.5 1.2a1.8 1.8 0 0 0 1 2.4l1.2.4a1.8 1.8 0 0 1 0 3.4l-1.2.4a1.8 1.8 0 0 0-1 2.4l.5 1.2a1.8 1.8 0 0 1-2.4 2.4l-1.2-.5a1.8 1.8 0 0 0-2.4 1l-.4 1.2a1.8 1.8 0 0 1-3.4 0l-.4-1.2a1.8 1.8 0 0 0-2.4-1l-1.2.5a1.8 1.8 0 0 1-2.4-2.4l.5-1.2a1.8 1.8 0 0 0-1-2.4l-1.2-.4a1.8 1.8 0 0 1 0-3.4l1.2-.4a1.8 1.8 0 0 0 1-2.4l-.5-1.2a1.8 1.8 0 0 1 2.4-2.4l1.2.5a1.8 1.8 0 0 0 2.4-1z"/><circle cx="12" cy="12" r="3.2"/>'),
  more: base('<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>'),
  /** The book's chapters, as a grid of prints. */
  chapters: base('<rect x="4" y="4" width="6.5" height="7" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="7" rx="1.2"/><rect x="4" y="14" width="6.5" height="6" rx="1.2"/><rect x="13.5" y="14" width="6.5" height="6" rx="1.2"/>'),
  info: base('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>'),
  lock: base('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
} as const;
