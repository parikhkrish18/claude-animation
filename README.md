# Claude Mascot (MVP)

A small animated character that appears bottom-right on claude.ai and reacts to
what Claude is currently doing (reading, writing, searching, browsing,
testing, thinking, coding).

## Load it locally (for testing)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (`claude-mascot-extension/`)
5. Open claude.ai and send a message that triggers a tool (web search, file
   read, code execution) — the mascot should appear bottom-right and switch
   states.

## How it works (AI-choreographed version)

- `mascot-states.js` — shared icon library (SVG props: PDF page, spreadsheet
  grid, magnifying glass, terminal, etc.)
- `mascot-remote.js` — on each detected status change, POSTs the **exact**
  status text to a Cloudflare Worker (see `worker/`). The worker returns a
  validated JSON spec: `{ label, icon, duration_ms, easing, keyframes }`.
  `mascot-remote.js` turns that into a real `@keyframes` rule injected into
  the page and applies it as the mascot's live animation.
- `content.js` broadly detects any short "*ing*"-containing status-like
  phrase in the DOM (deliberately loose, so novel/specific phrasing still
  gets picked up and sent to the AI rather than only matching a fixed local
  list), debounces, and drives the fetch/apply cycle. It also guards against
  race conditions if the status changes again before a fetch resolves.
- `worker/index.js` — the actual AI step. Given the exact status string, it
  calls Claude Haiku with a system prompt asking for a small, strictly
  validated choreography spec, and caches the result in KV **keyed by the
  normalized status text** — so any exact phrase only ever costs one LLM
  call, ever, across every user of the extension. Everyone after that is a
  free cache hit. See `worker/README.md` for deployment + cost shape.

### This is no longer a $0-infra, fully client-side product

Unlike the earlier local-pattern version, this one needs a live backend (the
worker + KV cache + your Anthropic API key) to generate and cache specs.
Cost is small and converges toward free as the cache fills, but it's not
zero — see `worker/README.md`. Before shipping, you must:

1. Deploy the worker (`worker/README.md`)
2. Put the deployed URL into `mascot-remote.js`'s `WORKER_URL` constant
3. Rebuild/reload the extension

### Fallback behavior

If the worker call fails (offline, deploy not done yet, rate-limited, bad
response), `mascot-remote.js` serves a generic small bob animation rather
than breaking the mascot or leaving it stuck. The worker itself also fails
soft the same way if the model call or JSON validation fails.


## Known limitations (MVP)

- Broad `*ing*` status detection is fuzzy — will need tuning against real
  claude.ai status copy, and will break if Anthropic changes exact wording.
- Worker must be deployed and its URL set in `mascot-remote.js` before this
  works end-to-end — see `worker/README.md`.
- No options page yet for toggling on/off or picking a skin.
- Not yet published to Chrome Web Store.

## Roadmap

1. Deploy the worker, wire up `WORKER_URL`, and watch real cache-miss specs
   it generates against real claude.ai status strings — tune the worker's
   system prompt based on what comes back
2. Add on/off toggle + position picker in popup
3. Sponsor slot in popup (flat "powered by" placement, per prior plan)
4. Package + submit to Chrome Web Store ($5 one-time dev fee)
