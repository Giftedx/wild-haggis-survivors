import { ensureLocaleReady } from './i18n';

/**
 * Vitest setup file — preloads the Scots overlay chunk once for the whole
 * test run. Production code uses lazy `import('./i18n.scs')` on first
 * Scots activation (English-only users never download it), but tests
 * written before lazy-load assume `setLocale('scs'); t(key)` resolves
 * synchronously against the Scots tree. Preloading here keeps those tests
 * unchanged.
 *
 * Registered via `test.setupFiles` in `vite.config.ts`.
 */
await ensureLocaleReady('scs');
