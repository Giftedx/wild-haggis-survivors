/**
 * task_08 cloud-save Worker — Cloudflare entrypoint.
 *
 * Binds the Cloudflare Workers `fetch` export to the pure
 * `dispatchRequest` function in `routes.ts`, wrapping the D1 binding
 * from `env.DB` in `D1Adapter`.
 *
 * Production deploy is OUT OF SCOPE for the spike (T423 follow-up).
 * The integration tests in `test/worker.integration.test.ts` boot
 * miniflare with this entrypoint + an in-memory D1 binding.
 *
 * See `README.md` for what's deliberately not done (auth, secrets,
 * deploy pipeline, privacy policy).
 */
import { D1Adapter } from './d1Adapter';
import { dispatchRequest } from './routes';
import type { Env } from './types';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          error: 'misconfigured',
          message: 'DB binding missing — apply schema and bind D1 in wrangler.toml',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const adapter = new D1Adapter(env.DB);
    return dispatchRequest(req, adapter, Date.now);
  },
};
