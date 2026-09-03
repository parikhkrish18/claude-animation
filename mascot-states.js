// mascot-states.js
// Now just the shared icon library. Actual state detection + motion is
// handled remotely by the choreography worker (mascot-remote.js) — the
// AI picks one of these icon keys per status and designs the motion itself.
// See worker/index.js VALID_ICONS — keep these two lists in sync.

const ICONS = {
  pdf: `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#d97757" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  spreadsheet: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16" stroke="#d97757" stroke-width="1.2"/></svg>`,
  web: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" stroke="#d97757" stroke-width="1.2"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 6L2 12l6 6M16 6l6 6-6 6" stroke="#d97757" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><circle cx="9" cy="10" r="1.6" fill="#d97757"/><path d="M4 17l5-5 4 4 3-3 4 4" stroke="#d97757" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 2h9l4 4v16H6z" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M9 11h6M9 15h6M9 19h4" stroke="#d97757" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  email: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M4 6l8 7 8-7" stroke="#d97757" stroke-width="1.5" fill="none"/></svg>`,
  slides: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="13" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M8 21h8" stroke="#d97757" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10.5" r="2" fill="#d97757"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M11 20V4M18 20v-7" stroke="#d97757" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  magnifier: `<svg viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" fill="#fff" stroke="#d97757" stroke-width="1.8"/><path d="M15 15l5 5" stroke="#d97757" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" fill="#2b2b2b" stroke="#d97757" stroke-width="1.5"/><path d="M6 9l4 3-4 3" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-5L16 4l4 4L9 19l-5 1z" fill="#fff" stroke="#d97757" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  drive: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 3h8l6 10-4 8H6l-4-8z" fill="#fff" stroke="#d97757" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" fill="#fff" stroke="#d97757" stroke-width="1.5"/><path d="M3 10h18M8 3v4M16 3v4" stroke="#d97757" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  thoughtbubble: `<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="10" rx="8" ry="6" fill="#fff" stroke="#d97757" stroke-width="1.5"/><circle cx="6" cy="19" r="1.4" fill="#d97757"/><circle cx="9" cy="21.5" r="1" fill="#d97757"/></svg>`,
  generic: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#d97757" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="#d97757"/></svg>`,
};

window.__MASCOT_ICONS = ICONS;
