/**
 * Build-time constants injected by Vite `define`.
 *
 * These are NOT available in Vitest by default — tests do not run the
 * Vite `define` transform. Any test that imports code using these
 * constants should provide its own value or keep the import off the
 * hot path.
 */
declare const __APP_VERSION__: string;
