# Choreography Worker

Generates and caches a small AI-authored animation spec per unique Claude
status string. First time a given phrase is seen, it costs one Haiku call;
every time after that (any user, forever) it's a free KV cache hit.

## Deploy

```bash
npm install -g wrangler
cd worker
wrangler login

# create the KV namespace, then paste the returned id into wrangler.toml
wrangler kv namespace create CHOREO_CACHE

# set your Anthropic API key as a secret (never goes in code/config)
wrangler secret put ANTHROPIC_API_KEY

wrangler deploy
```

This gives you a URL like `https://claude-mascot-choreo.<you>.workers.dev`.
Put that URL into the extension's `mascot-remote.js` (`WORKER_URL` constant)
and rebuild.

## Cost shape

- Cache hit: one KV read, effectively free at this volume (Cloudflare KV
  free tier: 100k reads/day).
- Cache miss: one Haiku call, short prompt + short JSON output — a small
  fraction of a cent. Cost scales with the number of *distinct* status
  phrases that exist across your entire user base, not with request volume,
  since identical phrasing is cached globally.
- Worker invocations: Cloudflare Workers free tier covers 100k requests/day.

## Safety notes

- The worker validates the model's JSON strictly (schema, transform syntax
  allow-list, numeric ranges) before caching or serving it — the model can
  only ever produce a small `transform` string, never arbitrary CSS/JS.
- On any failure (API error, bad JSON, failed validation) it fails soft:
  serves a generic bob animation rather than breaking the mascot or
  retrying in a way that costs you money on garbage input.
- CORS is locked to `https://claude.ai` in `index.js` — update if you also
  want to allow the Claude Code companion app origin later.
