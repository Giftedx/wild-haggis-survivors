import tseslint from 'typescript-eslint';

/**
 * 2026-05-10 — codified the bar's "no bypassing safety nets" practice as
 * lint gates so future agents can't drift past audit. The rules below are
 * green in the working tree as of this commit; CI fails on regression.
 *
 * Phase 1 (committed earlier today):
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
 * Phase 2 (this commit):
 *   - `@typescript-eslint/no-explicit-any` → `error` in production `src/`
 *     code, `off` in `*.test.ts` files. Tests legitimately cast through
 *     `any` to mock private fields and partial Phaser shapes; production
 *     prod files must not. Two prod files (`SubscriptionBag.ts` +
 *     `ShaderRegistry.ts`) carry inline disables for Phaser variadic
 *     callback shapes — both reviewed, both load-bearing.
 *   - `no-debugger` → `error`. Zero existing hits in `src/`.
 *
 * Deferred (Phase 3):
 *   - `eqeqeq` → `error`. Working tree has 20+ files with loose-equality
 *     comparisons; a sweep pass needs to convert each before lint can
 *     enforce.
 *   - Custom no-Math.random rule with allowlist (S4 closed via static
 *     allowlist test at `src/replay/replayMathRandomAllowlist.test.ts`;
 *     lint rule would be redundant).
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
      // Production prod code must not reach for `any`. Two carve-out files
      // (`SubscriptionBag.ts`, `ShaderRegistry.ts`) ship with inline disables
      // documenting why their Phaser variadic boundary needs `any`. Tests
      // override this back to `off` below — they legitimately cast for mock
      // shapes that aren't worth full typing.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-debugger': 'error',
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
    // Test files carry partial-shape mocks + private-field reads that don't
    // pay back the cost of fully-typed fixtures. Keep `any` available; the
    // rest of the prod-side rules still apply.
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
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
