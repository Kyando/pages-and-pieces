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
  share: base('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5C16 4.7 15.3 4 14.5 4h-9C4.7 4 4 4.7 4 5.5v9c0 .8.7 1.5 1.5 1.5H8"/>'),
} as const;
