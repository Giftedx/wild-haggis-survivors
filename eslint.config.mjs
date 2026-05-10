import tseslint from 'typescript-eslint';

/**
 * 2026-05-10 — codified the bar's "no bypassing safety nets" practice as
 * lint gates so future agents can't drift past audit. The rules below are
 * green in the working tree as of this commit; CI fails on regression.
 *
 *   - `no-console` (src) — prevents debug logs from shipping to prod.
 *     `console.warn` / `error` / `info` allowed for legitimate runtime
 *     surfacing (e.g. structured save failure logs in `saveFailure.ts`).
 *     One inline disable in `dev/TuningPanel.ts:184` for the dev-only
 *     "copy overrides as JSON" fallback log.
 *   - `no-restricted-syntax` — bans committed test focus / skip
 *     (`it.skip` / `it.only` / `xit` / `xtest` / `describe.skip` /
 *     `describe.only` / `xdescribe` / `test.skip` / `test.only`). These
 *     suppress entire test cases; if a test is broken, fix it or delete.
 *
 * Deferred (Phase 2):
 *   - `@typescript-eslint/no-explicit-any` → `error` (still `off`; the
 *     working tree is genuinely zero in production code, but tightening
 *     would block a wide blast-radius of legitimate test-shape `as`
 *     casts).
 *   - Custom no-Math.random rule with allowlist (138 sites need triage
 *     for cosmetic-vs-state before this can land — see review S4).
 */

const NO_FOCUSED_OR_SKIPPED_TESTS = [
  // it.skip( / it.only( / it.todo(
  "CallExpression[callee.type='MemberExpression'][callee.object.name='it'][callee.property.name=/^(skip|only|todo)$/]",
  // test.skip( / test.only( / test.todo(
  "CallExpression[callee.type='MemberExpression'][callee.object.name='test'][callee.property.name=/^(skip|only|todo)$/]",
  // describe.skip( / describe.only(
  "CallExpression[callee.type='MemberExpression'][callee.object.name='describe'][callee.property.name=/^(skip|only|todo)$/]",
  // xit( / xtest( / xdescribe(
  "CallExpression[callee.name=/^(xit|xtest|xdescribe)$/]",
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Phaser / game code uses many `any`-shaped externals; keep noise down without disabling type-safety in TS.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-restricted-syntax': [
        'error',
        ...NO_FOCUSED_OR_SKIPPED_TESTS.map((selector) => ({
          selector,
          message: 'Committed test focus / skip / todo is forbidden — fix or delete the test.',
        })),
      ],
    },
  },
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts', 'vite.config.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Playwright specs legitimately use `test.skip(condition, reason)` for
      // runtime browser-feature gating (e.g. WebM codec on Firefox). The
      // static `test.skip()` declaration form would also be allowed — accept
      // the trade-off; vitest-side restriction below is the load-bearing one.
      // Console logs in specs are intentional CI telemetry; don't block.
    },
  },
);
