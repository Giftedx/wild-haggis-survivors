# Architecture Decision Records (ADRs)

Short, dated records of a decision, the context that forced it, the
alternatives considered, and the expected consequences. ADRs exist so
the *why* behind a structural choice survives the inevitable time gap
between the decision and the next person who has to touch that code.

## When to write one

- Before picking between two credible framework / library / shape
  choices (e.g. state machine vs event bus, Phaser scene vs. DOM
  overlay).
- When introducing a convention that new code will follow (e.g.
  `ISceneContext` surfaces, banter tone register split).
- When deliberately *not* adopting a popular pattern (document the
  tradeoff so future reviewers don't re-open the debate cold).
- When reversing a previous ADR — superseding records stay, they don't
  get rewritten.

Don't write an ADR for:
- A routine bug fix — the commit message + PR description are the
  record.
- A tiny local refactor with no cross-file implications.
- A hot-take design opinion without a concrete decision attached.

## How to add one

1. Copy `0000-template.md` to `NNNN-kebab-case-title.md` where `NNNN`
   is the next sequential number padded to four digits.
2. Fill in every section — prefer brief over exhaustive. A 150-line
   ADR that captures the real tradeoff beats a 1000-line one that
   tries to document everything.
3. Update this README's index below.
4. Commit under the normal flow (`docs(adr): …`).

## Index

| # | Title | Status |
|---|-------|--------|
| [0000](0000-template.md) | Template | Reference |
| [0001](0001-i18n-literal-field-guard-static-not-headless.md) | i18n literal-field guard uses a static walk, not a headless Phaser render | Accepted (2026-04-17) |
| [0002](0002-deterministic-replay-format.md) | Deterministic replay format: seed + per-frame input + delta | Accepted (2026-04-17 record side; 2026-04-18 Phase 3 fixed-step physics + ReplayBlob v2; M1 Moor Road bumped to ReplayBlobAny v3) |
| [0003](0003-shader-registry-phaser-postfx-pipeline.md) | ShaderRegistry uses Phaser's filter render-node system, not a bespoke GL layer | Accepted (2026-04-23 original; 2026-04-24 Phaser 4 addendum rebases to `BaseFilterShader` + `Filters.Controller`) |
| [0004](0004-seasonal-event-calendar-gating.md) | SeasonalEventManager uses device-local date, not server time or in-game clock | Accepted (2026-04-24; cohort grew 6 → 8 events by 2026-04-29) |
| [0005](0005-skeletal-animation-rig.md) | Skeletal animation rig: texture-swap atlases over bone hierarchy | Accepted (2026-04-26) |
| [0006](0006-cloud-save-backend.md) | Cloud-save backend | Accepted (2026-05-09 — architectural choice ratified by lead dev; Cloudflare Workers + D1 + magic-link via Resend) |

When an ADR ships its decision (Proposed → Accepted), update both the file's `**Status:**` line and the row above. When superseding, leave both rows in place — never edit a historical Accepted ADR; record the reversal in a new ADR and link them via `**Supersedes:**` / `**Superseded by:**`.
