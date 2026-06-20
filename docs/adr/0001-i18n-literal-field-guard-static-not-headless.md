# ADR 0001 — i18n literal-field guard uses a static walk, not a headless Phaser render

**Status:** Accepted (commit 3ce8aae, 2026-04-17)
**Date:** 2026-04-17

## Context

Phase 6 C6 (`docs/archive/superpowers/plans/2026-04-12-soul-charter-phase-6-visual-bugs-redesign.md`)
called for a regression test that would catch a class of bug: a
translation template with `{placeholder}` tokens that call sites don't
pass. The original spec proposed a headless Phaser scene harness that
would render each scene with a sentinel locale (every string replaced by
`__TEST__<key>__`) and scan the rendered text for unsubstituted strings.

Building that harness is a half-day of infrastructure for one test —
Phaser's `Boot`/`Menu`/`Game` lifecycle doesn't start cleanly in a
node-env vitest worker (our CLAUDE.md already documents this), and a
dedicated jsdom + canvas shim for rendering would be the first such
harness in the codebase.

## Decision

Replace the runtime-render test with a static walk: flatten
`EN_STRINGS` and `SCS_STRINGS`, extract `{placeholder}` tokens via
regex, pass a sentinel object covering the template's own placeholders
to `t(key, sentinel)`, and assert the rendered output has zero
remaining `{…}` tokens. Add a cross-locale parity check: SCS
placeholder sets must be a subset of the matching EN set, since call
sites pass EN-shaped vars.

## Alternatives considered

- **Full headless Phaser render.** Higher fidelity — catches mistakes
  in the call-site layer as well as the template layer. Cost: ~1 day
  of harness, and every future Scene added to the game would need a
  sentinel-render test case.
- **Per-call-site unit tests.** Pull out every `t(key, …)` call site
  into a helper, then assert the call-site vars cover the template's
  placeholders. High coverage but requires a refactor-style change to
  every place that calls `t`.
- **Status quo (no test).** The existing `i18n.locale.test.ts` covers
  locale fallback and spot-checks, but nothing guards template-level
  placeholder well-formedness.

## Consequences

- **Pros:** One test file, ~120 lines, no infra changes. Runs in 9 ms.
  Catches the same regression class the original WI wave-objective
  bug (Phase 6 V1) was an instance of — a template placeholder that
  doesn't line up with the data the call site passes.
- **Cons:** Doesn't catch *call-site* mismatches. If a caller forgets
  to pass a documented placeholder, the rendered output still has a
  `{foo}` literal, but this test doesn't see that — only a runtime
  scene-render or a per-call-site unit test would. We accept that gap
  for now.
- **Follow-ups:** Revisit if we ship a second such regression through
  the call-site layer. At that point, the per-call-site approach
  (alternative 2 above) is the right next step.

## Rollback

Delete `src/core/i18nLiteralFieldGuard.test.ts`. No production code
touched; revert is a single-file delete.
