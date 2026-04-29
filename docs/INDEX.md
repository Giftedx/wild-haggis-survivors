# `docs/` — Top-Level Map

Entry point for the docs tree. AI agents and humans should start here.

> **Source-of-truth hierarchy** (when files disagree):
> 1. `~/.claude/projects/.../memory/MEMORY.md` + per-initiative `project_*_status.md` — most current.
> 2. [`superpowers/plans/INDEX.md`](superpowers/plans/INDEX.md) — index over per-file STATUS markers.
> 3. [`dispatch/2026-04-26/00_task_list.md`](dispatch/2026-04-26/00_task_list.md) + `Execution_Log.md` + `task_01..10.md` — current dispatch.
> 4. `git log --oneline` + working-tree files — ground truth for code claims.

---

## Quick reference

| Looking for | Read |
|---|---|
| What's currently being worked on? | [dispatch/2026-04-26/](dispatch/2026-04-26/) — `00_task_list.md` + `Execution_Log.md` + `task_01..10.md` |
| Is feature X shipped? | [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md), then memory `project_*_status` |
| What's the project about? | [PRD.md](PRD.md), [DESIGN_SOUL.md](DESIGN_SOUL.md) |
| How do I write copy / art / banter in voice? | [VOICE_CARD.md](VOICE_CARD.md), [ART_STYLE_BIBLE.md](ART_STYLE_BIBLE.md), [BANTER_AUTHORING.md](BANTER_AUTHORING.md) |
| Why was this technical decision made? | [adr/README.md](adr/README.md) |
| What research grounds this? | [research/README.md](research/README.md) |
| What human-gated reviews block release? | [status/cultural/CULTURAL_REVIEW_PACKET.md](status/cultural/CULTURAL_REVIEW_PACKET.md), [status/a11y/A1_PEAT_AUDIT.md](status/a11y/A1_PEAT_AUDIT.md), [status/mobile/MOBILE_DEVICE_TEST_MATRIX.md](status/mobile/MOBILE_DEVICE_TEST_MATRIX.md), [archive/top-10-2026-04-26-batch/blocked/](archive/top-10-2026-04-26-batch/blocked/) |
| Status of accessibility / cultural / mobile / cloud / engine work? | [status/](status/) — per-domain trackers |
| Auditing for bugs / regressions? | **Read [§For audit / review agents](#for-audit--review-agents) below first.** |
| What was the historical state before this session? | [archive/](archive/) |

---

## For audit / review agents

Before flagging any "missing X", "silently absent X", "X is broken", or "X looks expensive" finding, run this checklist. ~50% of audit recommendations on the 2026-04-29 deep review were false positives because this step was skipped.

1. **Cross-check the design intent.** Grep `docs/` for the system name. Start with [superpowers/specs/INDEX.md](superpowers/specs/INDEX.md) (initiative-keyed rows) and the [status/](status/) trackers below. If a `*_CALLSITES.md`, design spec, or ADR documents the behaviour as deliberate (e.g. "UI hidden until X is wired", "feature gated behind Y flag"), treat that note as a **veto** over your finding.
2. **Verify perf claims against library behaviour.** Don't extrapolate complexity from call-site count. Phaser `Group.getChildren()` returns the internal array reference; the cast is a runtime no-op. Site count × array length ≠ per-frame cost — check whether sites are conditional or have early-exits.
3. **Treat memory snapshots as point-in-time.** If a memory entry says "X tests" or "Y LOC", verify against current code before citing as truth.
4. **A finding becomes ship-work only after the synthesizer (the human or coordinator) cross-checks the design doc.** "Audit said it's a bug" is not enough.

If your finding survives all four steps, report it. If a design doc vetoes it, drop it from the punch list and note the doc that vetoed.

Concrete examples of design-intent vetoes that exist today:
- [`status/a11y/A1_ASSIST_MODE_CALLSITES.md`](status/a11y/A1_ASSIST_MODE_CALLSITES.md) — Assist Mode UI is **deliberately hidden**; only the invincibility toggle is wired, others await balance + replay-determinism passes.
- [`adr/0002-deterministic-replay-format.md`](adr/0002-deterministic-replay-format.md) — Replay determinism contract; spawn positions affecting game state must use seeded `runRng`, not `Math.random()`.
- [`status/cultural/CULTURAL_REVIEW_PACKET.md`](status/cultural/CULTURAL_REVIEW_PACKET.md) — Native-speaker reviews are explicitly human-gated; flagging "needs review" on already-flagged content is noise.

---

## Design canon (north stars — root level)

Every player-facing change should pass the Soul Check + voice + art + research grounding. These are the foundational docs and stay at the root because CLAUDE.md cites them as primary refs.

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product roadmap; 2026-04-26 snapshot at top |
| [DESIGN_SOUL.md](DESIGN_SOUL.md) | Soul charter, weave matrix, tonal spectrum, Great Moment Recipe, Soul Check |
| [VOICE_CARD.md](VOICE_CARD.md) | Hearth + Edge registers, variant voices, Burns guidance, Do/Don't examples |
| [ART_STYLE_BIBLE.md](ART_STYLE_BIBLE.md) | Palette anchors, tonal palette map, signature motifs |
| [DESIGN_IDEAS.md](DESIGN_IDEAS.md) | Sketchpad — ideas not yet flagship-scoped |
| [BANTER_AUTHORING.md](BANTER_AUTHORING.md) | Recipe doc for adding banter leaves |
| [HUGE_INITIATIVES_MASTER_PLAN.md](HUGE_INITIATIVES_MASTER_PLAN.md) | Flagship roster; partially live — uses strikethrough for shipped rows |

---

## Subdirectories

| Directory | Purpose | Entry point |
|---|---|---|
| [status/](status/) | Living trackers grouped by domain (a11y, cultural, mobile, cloud, engine, banter, art) | (sub-tables below) |
| [dispatch/](dispatch/) | Per-session dispatch sets — current and future. Each session lives in its own dated subdir. | [dispatch/2026-04-26/00_task_list.md](dispatch/2026-04-26/00_task_list.md) |
| [archive/](archive/) | Historical snapshots, superseded plans, reconciled dispatch batches, dev journal | (sub-table below) |
| [research/](research/) | 8 deep reference docs (~150k words) — roguelite, Scottish ×2, game feel, music/art tech, accessibility, cultural sensitivities, narrative | [research/README.md](research/README.md) |
| [superpowers/specs/](superpowers/specs/) | Design specs (chronological, date-prefixed) | [superpowers/specs/INDEX.md](superpowers/specs/INDEX.md) |
| [superpowers/plans/](superpowers/plans/) | Implementation plans (chronological, date-prefixed) | [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md) |
| [adr/](adr/) | Architecture Decision Records (numbered) | [adr/README.md](adr/README.md) |

---

## What lives in `status/`

Living trackers — most are `M`-flagged in git when work is in flight. Treat as the running state for their respective domains.

### `status/a11y/` — Accessibility (A1)

| File | Purpose |
|---|---|
| [status/a11y/A1_PEAT_AUDIT.md](status/a11y/A1_PEAT_AUDIT.md) | 25-row PEAT photosensitivity audit (PEAT human-gated) |
| [status/a11y/A1_COLORBLIND_AUDIT.md](status/a11y/A1_COLORBLIND_AUDIT.md) | Palette × CVD matrix (Coblis/Color Oracle human-gated) |
| [status/a11y/A1_NON_COLOUR_ALONE.md](status/a11y/A1_NON_COLOUR_ALONE.md) | Non-colour-alone signal census (WCAG 1.4.1) |
| [status/a11y/A1_CAPTIONS_INDEX.md](status/a11y/A1_CAPTIONS_INDEX.md) | Captioned-event catalogue + gap list |
| [status/a11y/A1_ASSIST_MODE_CALLSITES.md](status/a11y/A1_ASSIST_MODE_CALLSITES.md) | Assist Mode toggle → call-site map |
| [status/a11y/A1_DOM_FOCUS_LAYER.md](status/a11y/A1_DOM_FOCUS_LAYER.md) | T407 DOM-visible focus layer pattern + adoption notes |

### `status/cultural/` — Cultural review (C2 / C-content)

| File | Purpose |
|---|---|
| [status/cultural/CULTURAL_REVIEW_PACKET.md](status/cultural/CULTURAL_REVIEW_PACKET.md) | **Reviewer-facing** entry point for Doric / Shetlandic / Burns / Gaelic gates |
| [status/cultural/CULTURAL_REVIEW_STATUS.json](status/cultural/CULTURAL_REVIEW_STATUS.json) | Machine-readable line manifest; CI-enforced via `src/data/culturalReviewStatus.test.ts` (path is hardcoded — coordinate moves with the test) |
| [status/cultural/C2_DIALECT_REVIEW.md](status/cultural/C2_DIALECT_REVIEW.md) | Doric + Shetlandic native-speaker review brief |
| [status/cultural/C2_BURNS_PROVENANCE.md](status/cultural/C2_BURNS_PROVENANCE.md) | Burns citation provenance against Kinsley + Canongate |
| [status/cultural/C2_VOICE_AUDIT.md](status/cultural/C2_VOICE_AUDIT.md) | Lore-tier voice consistency audit |

### `status/mobile/` — Mobile (W95)

| File | Purpose |
|---|---|
| [status/mobile/MOBILE_DEVICE_TEST_MATRIX.md](status/mobile/MOBILE_DEVICE_TEST_MATRIX.md) | T203 hardware playtest matrix (12 device rows pending) |
| [status/mobile/MOBILE_QUIRKS.md](status/mobile/MOBILE_QUIRKS.md) | Running notebook of mobile-only behaviour |

### `status/cloud/` — Cloud / backend (P3)

| File | Purpose |
|---|---|
| [status/cloud/P3_BACKEND_DECISION_MATRIX.md](status/cloud/P3_BACKEND_DECISION_MATRIX.md) | Backend selection rationale (awaiting stakeholder approval) |

### `status/engine/` — Engine / refactor

| File | Purpose |
|---|---|
| [status/engine/SCENE_REFACTOR_GAP_AUDIT.md](status/engine/SCENE_REFACTOR_GAP_AUDIT.md) | Spec-vs-live audit for Phase A biomes / Phase B endless |
| [status/engine/PHASE_0_GATE_NOTES.md](status/engine/PHASE_0_GATE_NOTES.md) | W71 Phase 0 prototype gate evidence |

### `status/banter/` — Banter (B1)

| File | Purpose |
|---|---|
| [status/banter/BANTER_GAPS.md](status/banter/BANTER_GAPS.md) | Banter pool coverage audit (B1 phases) |

### `status/art/` — Art

| File | Purpose |
|---|---|
| [status/art/ART_AUDIT.md](status/art/ART_AUDIT.md) | Per-sprite priority audit (P0–P3) |

---

## What lives in `archive/`

| Path | What |
|---|---|
| [archive/HUGE_INITIATIVES_VERDICT.md](archive/HUGE_INITIATIVES_VERDICT.md) | 2026-04-16 verdict against master plan; superseded by current memory + plans INDEX |
| [archive/progress-log.md](archive/progress-log.md) | Ralph-mode developer journal from 2026-04-10 onwards (~1,168 lines, ad-hoc bracket-tag format) |
| [archive/reports/](archive/reports/) | 2026-04-26 multi-model audit reports (Claude Opus 4.7, GPT-5.5, Composer 2 Fast) + reconciled backlog — basis for the triple-audit plan |
| [archive/prompts/](archive/prompts/) | Historical session prompts (particle budget, polish onboarding, perf balance, visual art review) |
| [archive/top-10-2026-04-26-batch/](archive/top-10-2026-04-26-batch/) | 2026-04-26 morning top-10 dispatch — all 10 charters reconciled to `master` (tip `89ca11a`). Includes `00-INDEX.md`, `01..10` charters, `Execution_Log_2026-04-26-batch.md`, and `blocked/` human-gated stubs. The current dispatch lives at `docs/dispatch/2026-04-26/`, not here. |

---

## Conventions

- **Plan files** carry a `STATUS:` marker on line 3. See [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md) for the canonical schema.
- **ADR files** are numbered `NNNN-kebab-case-title.md`. DRAFT ADRs get a `.draft.md` suffix until accepted. See [adr/README.md](adr/README.md).
- **Status trackers** live under `status/<domain>/`. Forward-looking placeholder paths (e.g. `docs/status/mobile/MOBILE_PLAYTEST_LOG.md`) follow the same convention even when the file doesn't yet exist.
- **`status/cultural/CULTURAL_REVIEW_STATUS.json`** is read by `src/data/culturalReviewStatus.test.ts` via a hardcoded relative path — moving or renaming requires a code change.
- **One `Execution_Log.md` per dispatch session.** The active dispatch log is at `dispatch/2026-04-26/Execution_Log.md`. The 2026-04-26 morning batch's log is preserved at `archive/top-10-2026-04-26-batch/Execution_Log_2026-04-26-batch.md` (renamed to disambiguate). Future dispatches should follow the per-session-subdir pattern under `dispatch/`.
- **Design canon stays at root** because CLAUDE.md cites those paths as primary references and they're evergreen, not per-domain status.

---

## Updating this index

- Add a new `dispatch/YYYY-MM-DD/` subdir for each fresh dispatch session.
- When a dispatch session completes (charters reconciled to `master`), move it to `archive/` with a clarifying suffix (e.g. `top-10-YYYY-MM-DD-batch`) so the dir name signals "historical".
- Add a row to the relevant `status/<domain>/` table when shipping a new tracker. Create a new domain dir if one doesn't fit.
- Re-categorise when a status doc graduates to evergreen (rare) or vice versa.
