/**
 * Cloud-save Worker — Cloudflare entrypoint.
 *
 * This file binds a Cloudflare Workers `fetch` export to the pure
 * `handleRequest` function in `handlers.ts`, plus chooses a storage
 * adapter from the `env` bindings.
 *
 * NOT imported from the game bundle. Sibling project; lives under
 * `server/worker/` so Vite never sees it.
 *
 * Deployment: `wrangler deploy` from `server/worker/`. See
 * `wrangler.toml.example` for binding shape. ADR 0006 covers the
 * decision rationale.
 *
 * Production runtime expects:
 *   - `env.DB`  → D1 binding (configured in wrangler.toml as `[[d1_databases]]`)
 *
 * In an environment without `env.DB` (e.g. `wrangler dev` without a
 * D1 binding) the Worker falls back to a process-wide `InMemoryStorage`.
 * This is for local-dev convenience only; data resets on Worker
 * restart.
 */
import { handleRequest } from './handlers';
import { D1Storage, InMemoryStorage, type D1LikeBinding, type Storage } from './storage';

interface Env {
  DB?: D1LikeBinding;
}

// Module-scope fallback so `wrangler dev` without a D1 binding can
// still round-trip a save during local development. Tests do NOT use
// this — they construct their own `InMemoryStorage` per test.
let devFallback: InMemoryStorage | null = null;

function pickStorage(env: Env): Storage {
  if (env.DB) return new D1Storage(env.DB);
  if (!devFallback) devFallback = new InMemoryStorage();
  return devFallback;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return handleRequest(req, pickStorage(env));
  },
};
