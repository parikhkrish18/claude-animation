// content.js
// Broadly detects any status-like phrase on the page, sends the EXACT text
// to the choreography worker (mascot-remote.js), and renders whatever
// custom animation spec comes back. Local mascot-states.js is only used as
// a lightweight fallback icon/label source if the remote call fails and
// even the generic fallback spec seems worth labeling.

(() => {
  const ICONS = window.__MASCOT_ICONS || {};
  const { fetchChoreography, registerAnimation } = window.__MASCOT_REMOTE || {};

  const POLL_DEBOUNCE_MS = 200;
  // Broad "looks like a status phrase" detector: short text containing a
  // gerund (*ing) — deliberately loose so novel/specific statuses ("Cross-
  // referencing invoice totals") still get picked up and sent to the AI,
  // rather than only recognizing a fixed local list.
  const STATUS_LIKE = /\b\w+ing\b/i;

  let currentText = null;
  let debounceTimer = null;
  let mascotEl = null;
  let iconEl = null;
  let labelEl = null;
  let bodyEl = null;
  let requestSeq = 0;

  function detectStatusText() {
    const candidates = document.querySelectorAll('body *');
    for (const el of candidates) {
      if (el.children.length > 0) continue; // leaf nodes only
      const text = el.textContent?.trim();
      if (!text || text.length > 80) continue;
      if (!STATUS_LIKE.test(text)) continue;
      if (!isVisible(el)) continue;
      return text;
    }
    return null;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  async function applyStatusText(text) {
    if (text === currentText) return;
    currentText = text;
    if (!mascotEl) return;

    if (!text) {
      mascotEl.setAttribute('data-state', 'idle');
      bodyEl.style.animation = '';
      iconEl.style.display = 'none';
      labelEl.textContent = '';
      return;
    }

    const mySeq = ++requestSeq;
    mascotEl.setAttribute('data-state', 'active');

    const spec = await fetchChoreography(text);

    // If the status changed again while we were waiting, drop this result.
    if (mySeq !== requestSeq) return;

    const anim = registerAnimation(spec);
    bodyEl.style.animation = anim.css;
    iconEl.innerHTML = ICONS[spec.icon] || ICONS.doc || '';
    iconEl.style.display = 'block';
    labelEl.textContent = spec.label || '';
  }

  function scheduleDetect() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyStatusText(detectStatusText());
    }, POLL_DEBOUNCE_MS);
  }

  function injectMascot() {
    if (document.getElementById('claude-mascot-root')) return;

    mascotEl = document.createElement('div');
    mascotEl.id = 'claude-mascot-root';
    mascotEl.setAttribute('data-state', 'idle');
    mascotEl.innerHTML = `
      <div class="claude-mascot-body">
        <div class="claude-mascot-face"></div>
        <div class="claude-mascot-icon"></div>
      </div>
      <div class="claude-mascot-label"></div>
    `;
    document.body.appendChild(mascotEl);

    bodyEl = mascotEl.querySelector('.claude-mascot-body');
    iconEl = mascotEl.querySelector('.claude-mascot-icon');
    labelEl = mascotEl.querySelector('.claude-mascot-label');
  }

  function start() {
    injectMascot();
    const observer = new MutationObserver(scheduleDetect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    scheduleDetect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
