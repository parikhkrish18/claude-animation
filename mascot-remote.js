// mascot-remote.js
// Talks to the choreography worker: given an exact status string, gets back
// a validated JSON spec (icon + custom keyframes + label) and turns it into
// a real, running CSS animation. Session-caches in memory so the same exact
// phrase within one page session doesn't refetch (the worker itself also
// caches globally in KV, this is just an extra local layer).

// TODO: replace with your deployed worker URL (see worker/README.md).
const WORKER_URL = 'https://claude-mascot-choreo.YOUR-SUBDOMAIN.workers.dev';

const sessionCache = new Map();
let keyframeCounter = 0;

const FALLBACK_SPEC = {
  label: '',
  icon: 'generic',
  duration_ms: 1600,
  easing: 'ease-in-out',
  keyframes: [
    { offset: 0, transform: 'translateY(0)', opacity: 1 },
    { offset: 0.5, transform: 'translateY(-3px)', opacity: 1 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
};

function normalizeKey(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

async function fetchChoreography(statusText) {
  const key = normalizeKey(statusText);
  if (sessionCache.has(key)) {
    return sessionCache.get(key);
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusText }),
    });
    if (!res.ok) throw new Error(`Worker error: ${res.status}`);
    const data = await res.json();
    const spec = data.spec || FALLBACK_SPEC;
    sessionCache.set(key, spec);
    return spec;
  } catch (err) {
    console.warn('[claude-mascot] choreography fetch failed, using fallback', err);
    sessionCache.set(key, FALLBACK_SPEC);
    return FALLBACK_SPEC;
  }
}

// Injects a unique @keyframes rule for this spec and returns the CSS needed
// to play it (animation-name/duration/easing). One <style> tag, appended to,
// reused across the page's lifetime.
let styleEl = null;
function getStyleEl() {
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'claude-mascot-dynamic-keyframes';
    document.head.appendChild(styleEl);
  }
  return styleEl;
}

function buildKeyframeCSS(name, keyframes) {
  const steps = keyframes
    .slice()
    .sort((a, b) => a.offset - b.offset)
    .map((kf) => {
      const pct = Math.round(kf.offset * 100);
      const opacity = typeof kf.opacity === 'number' ? kf.opacity : 1;
      return `${pct}% { transform: ${kf.transform}; opacity: ${opacity}; }`;
    })
    .join(' ');
  return `@keyframes ${name} { ${steps} }`;
}

function registerAnimation(spec) {
  keyframeCounter += 1;
  const name = `claude-mascot-anim-${keyframeCounter}`;
  const css = buildKeyframeCSS(name, spec.keyframes);
  getStyleEl().appendChild(document.createTextNode(css + '\n'));
  return {
    name,
    css: `${name} ${spec.duration_ms}ms ${spec.easing} infinite`,
  };
}

window.__MASCOT_REMOTE = { fetchChoreography, registerAnimation };
