/**
 * Type shim for the Vite-injected `import.meta.env`.
 *
 * The `HttpCloudSaveClient` class (`../../src/cloud/httpCloudSaveClient.ts`)
 * references `import.meta.env.PROD` at line 43. Vite resolves that at
 * build time for the game bundle. Vitest provides a sensible default
 * at runtime, but the cloudflare workspace's `tsc --noEmit` step has
 * no Vite plugin, so it sees `import.meta.env` as undefined.
 *
 * This declaration adds the minimum surface needed for the import
 * graph to type-check. It is test-only — no runtime effect.
 */
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
