// worker/index.js
// Cloudflare Worker: given a Claude status string, returns a small JSON
// "choreography spec" (icon + custom CSS keyframes + label) that the
// extension renders instantly. Results are cached in KV keyed by the
// normalized status text — so any exact phrase only ever costs one LLM
// call, EVER, across all users. Everyone else after that is a free cache
// hit. Cost scales with the number of distinct status phrases that exist
// in the wild, not with request volume.
//
// Bindings required (see wrangler.toml):
//   - CHOREO_CACHE   (KV namespace)
//   - ANTHROPIC_API_KEY (secret)

const VALID_ICONS = [
  'pdf', 'spreadsheet', 'web', 'code', 'image', 'doc', 'email', 'slides',
  'chart', 'magnifier', 'terminal', 'pencil', 'drive', 'calendar',
  'thoughtbubble', 'generic',
];

const SYSTEM_PROMPT = `You design tiny CSS micro-animations for a mascot widget that reacts to an AI assistant's current status (e.g. "Reading Q3_forecast.xlsx", "Searching the web for flight prices").

Given the exact status text, respond with ONLY a JSON object, no prose, no markdown fences, matching this schema:

{
  "label": string,           // short human label, <= 28 chars, lowercase, e.g. "reading revenue sheet"
  "icon": string,            // MUST be exactly one of: ${VALID_ICONS.join(', ')}
  "duration_ms": number,     // 300-2200, how long one loop takes
  "easing": string,          // a valid CSS easing keyword or cubic-bezier(...)
  "keyframes": [             // 3 to 6 steps describing ONE loop, offsets ascending 0 to 1
    { "offset": number, "transform": string, "opacity": number }
  ]
}

Rules:
- "transform" must only use: translateX, translateY, rotate, scale, scaleX, scaleY — combined with spaces, e.g. "rotate(4deg) translateY(-2px)". No other CSS.
- Keep motion small and tasteful: translations under 8px, rotations under 15deg, scale between 0.9 and 1.15.
- The FIRST and LAST keyframe (offset 0 and offset 1) must be visually identical (loop must be seamless).
- Make the motion genuinely evocative of the specific action described, not generic — e.g. a spreadsheet read might tilt left-right like scanning columns, a chart-building action might have a subtle "growing" pulse, a code-run action might have a quick jitter.
- Pick the closest matching icon from the list; use "generic" only if truly nothing fits.
- Output nothing but the JSON object.`;

function normalizeKey(statusText) {
  return statusText.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://claude.ai',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function validateSpec(spec) {
  if (typeof spec !== 'object' || spec === null) return false;
  if (typeof spec.label !== 'string' || spec.label.length > 40) return false;
  if (!VALID_ICONS.includes(spec.icon)) return false;
  if (typeof spec.duration_ms !== 'number' || spec.duration_ms < 200 || spec.duration_ms > 4000) return false;
  if (typeof spec.easing !== 'string') return false;
  if (!Array.isArray(spec.keyframes) || spec.keyframes.length < 2 || spec.keyframes.length > 8) return false;
  for (const kf of spec.keyframes) {
    if (typeof kf.offset !== 'number' || kf.offset < 0 || kf.offset > 1) return false;
    if (typeof kf.transform !== 'string' || kf.transform.length > 200) return false;
    // reject anything that isn't just transform functions (defense in depth
    // against the model producing arbitrary CSS/JS)
    if (!/^[\d.\-a-z%,()\s]+$/i.test(kf.transform)) return false;
  }
  return true;
}

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

async function generateSpec(statusText, apiKey, workspaceId) {
 const res = await fetch('https://api.anthropic.com/v1/messages', {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json',
     'x-api-key': apiKey,
     'anthropic-version': '2023-06-01',
     ...(workspaceId ? { 'anthropic-workspace-id': workspaceId } : {}),
   },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Status: "${statusText}"` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const textBlock = data.content?.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text block in response');

  const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
  const spec = JSON.parse(cleaned);
  if (!validateSpec(spec)) throw new Error('Spec failed validation');
  return spec;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return jsonResponse({});
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'POST only' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const statusText = (body.status || '').toString();
    if (!statusText || statusText.length > 300) {
      return jsonResponse({ error: 'Missing or too-long status text' }, 400);
    }

    const key = normalizeKey(statusText);

    // 1. Cache lookup — the common path, ~free.
    const cached = await env.CHOREO_CACHE.get(key, { type: 'json' });
    if (cached) {
      return jsonResponse({ spec: cached, cached: true });
    }

    // 2. Cache miss — generate, validate, store, serve.
    try {
      const spec = await generateSpec(statusText, env.ANTHROPIC_API_KEY, env.ANTHROPIC_WORKSPACE_ID);
      await env.CHOREO_CACHE.put(key, JSON.stringify(spec));
      return jsonResponse({ spec, cached: false });
    } catch (err) {
      // Fail soft: never break the UI, just hand back a generic bob.
      return jsonResponse({ spec: { ...FALLBACK_SPEC, label: statusText.slice(0, 28) }, cached: false, error: String(err) });
    }
  },
};
