/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

/**
 * task_08 cloud-save Worker — vitest config.
 *
 * Scoped to `cloudflare/test/**`. Does not inherit from the root
 * `vite.config.ts` (which targets the game bundle and has Phaser/PWA
 * plugins that don't apply here).
 *
 * The integration test bundles the Worker via esbuild then runs it
 * inside miniflare with an in-memory D1 binding — no live Cloudflare
 * account required. See `test/worker.integration.test.ts` for the
 * boot dance.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    // Integration test starts miniflare; D1 :memory: + esbuild bundle
    // brings the cold-boot to ~1–2s. Keep generous default timeout.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
