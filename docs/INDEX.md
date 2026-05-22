# `docs/` — Top-Level Map

Entry point for the docs tree. AI agents and humans should start here.

> **Source-of-truth hierarchy** (when files disagree):
> 1. **`git log` + working tree** — canonical for code. [`CONTRIBUTING.md`](../CONTRIBUTING.md) + [`PRD.md`](PRD.md) (**Current Snapshot** header) for the working agreement + shipped-state table.
> 2. [`superpowers/plans/INDEX.md`](superpowers/plans/INDEX.md) — in-repo initiative STATUS markers.
> 3. [`archive/dispatch/2026-04-26/`](archive/dispatch/2026-04-26/) — concluded dispatch + execution log (historical; mind the dates).
> 4. **Optional:** host-local Claude Code memory (`~/.claude/projects/.../memory/` + `project_*_status.md`) when present — may run ahead of or behind git; on contradiction, **(1) wins**.

---

## Quick reference

| Looking for | Read |
|---|---|
| The standard every change must clear? | [CONTRIBUTING.md](../CONTRIBUTING.md) — read first. |
| Most recent adversarial review of the project? | [REVIEW.md](REVIEW.md) — 2026-05-10 audit; 18 of 20 findings closed, 1 partial, 1 blocked on paid consultants. |
| Where is the LOC reporter / GameScene hard-ceiling defined? | [LOC_BUDGET.md](LOC_BUDGET.md) — `npm run loc-report` baseline + `GameScene.ts` 2200-line hard-fail. |
| What's currently being worked on? | Most recent dispatch — [dispatch/2026-04-26/](archive/dispatch/2026-04-26/) (concluded 2026-04-28; round 5). No flagship currently active per [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q8 — solo-dev mechanics sprint shipped 12 features 2026-05-09 (see [PRD.md](PRD.md) §"2026-05-09 mechanics ship sprint"). |
| Is feature X shipped? | [PRD.md](PRD.md) "Flagship status" table, then [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md), then memory `project_*_status` |
| What's the project about? | [PRD.md](PRD.md), [DESIGN_SOUL.md](DESIGN_SOUL.md), repo-root [README.md](../README.md) |
| How do I write copy / art / banter in voice? | [VOICE_CARD.md](VOICE_CARD.md), [ART_STYLE_BIBLE.md](ART_STYLE_BIBLE.md), [BANTER_AUTHORING.md](BANTER_AUTHORING.md) |
| Why was this technical decision made? | [adr/README.md](adr/README.md) |
| What research grounds this? | [research/README.md](research/README.md) |
| What human-gated reviews block release? | [status/cultural/CULTURAL_REVIEW_PACKET.md](status/cultural/CULTURAL_REVIEW_PACKET.md), [A1_PEAT_AUDIT.md](A1_PEAT_AUDIT.md) (root), [MOBILE_DEVICE_TEST_MATRIX.md](MOBILE_DEVICE_TEST_MATRIX.md) (root), [top-10-tasks/blocked/](archive/top-10-tasks/blocked/) |
| Status of accessibility / cultural / mobile / cloud / engine work? | A1: root `A1_*.md` + [status/a11y/](status/a11y/). Cultural: [status/cultural/](status/cultural/) + root `C2_*.md`. Mobile: root `MOBILE_*.md`. Cloud: [adr/0006-cloud-save-backend.md](adr/0006-cloud-save-backend.md) (decision matrix archived at [archive/P3_BACKEND_DECISION_MATRIX.md](archive/P3_BACKEND_DECISION_MATRIX.md)). Engine: [status/engine/](status/engine/) (one-off audit archived at [archive/SCENE_REFACTOR_AUDIT_2026-04-26.md](archive/SCENE_REFACTOR_AUDIT_2026-04-26.md)). Banter: shipped — coverage audit archived at [archive/BANTER_GAPS.md](archive/BANTER_GAPS.md). Art: root [ART_AUDIT.md](ART_AUDIT.md). |
| Auditing for bugs / regressions? | **Read [§For audit / review agents](#for-audit--review-agents) below first.** |
| Doc conventions (filename rules, where new docs go, STATUS markers) | [DOC_CONVENTIONS.md](DOC_CONVENTIONS.md) |
| Open questions or stakeholder decisions blocking work? | [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) |

---

## For audit / review agents

Before flagging any "missing X", "silently absent X", "X is broken", or "X looks expensive" finding, run this checklist. ~50% of audit recommendations on the 2026-04-29 deep review were false positives because this step was skipped.

1. **Cross-check the design intent.** Grep `docs/` for the system name. Start with [superpowers/specs/INDEX.md](superpowers/specs/INDEX.md) (initiative-keyed rows) and the [status/](status/) trackers below. If a `*_CALLSITES.md`, design spec, or ADR documents the behaviour as deliberate (e.g. "UI hidden until X is wired", "feature gated behind Y flag"), treat that note as a **veto** over your finding.
2. **Verify perf claims against library behaviour.** Don't extrapolate complexity from call-site count. Phaser `Group.getChildren()` returns the internal array reference; the cast is a runtime no-op. Site count × array length ≠ per-frame cost — check whether sites are conditional or have early-exits.
3. **Treat memory snapshots as point-in-time.** If a memory entry says "X tests" or "Y LOC", verify against current code before citing as truth.
4. **A finding becomes ship-work only after the synthesizer (the human or coordinator) cross-checks the design doc.** "Audit said it's a bug" is not enough.

If your finding survives all four steps, report it. If a design doc vetoes it, drop it from the punch list and note the doc that vetoed.

Concrete examples of design-intent vetoes that exist today:
- [`A1_ASSIST_MODE_CALLSITES.md`](A1_ASSIST_MODE_CALLSITES.md) — Assist Mode UI is **deliberately hidden**; only the invincibility toggle is wired, others await balance + replay-determinism passes.
- [`adr/0002-deterministic-replay-format.md`](adr/0002-deterministic-replay-format.md) — Replay determinism contract; spawn positions affecting game state must use seeded `runRng`, not `Math.random()`.
- [`status/cultural/CULTURAL_REVIEW_PACKET.md`](status/cultural/CULTURAL_REVIEW_PACKET.md) — Native-speaker reviews are explicitly human-gated; flagging "needs review" on already-flagged content is noise.

---

## Design canon (north stars — root level)

Player-facing changes should match the project's voice and visual direction. These are the foundational docs and stay at the root because CLAUDE.md cites them as primary refs.

| File | Purpose |
|---|---|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | **The working agreement for AI agents.** One headline question + CI gates + cross-cutting chains + sacred invariants. Read first. |
| [PRD.md](PRD.md) | Product roadmap / flagship table — dated **Current Snapshot** header at top of file (update when reality shifts). |
| [DESIGN_SOUL.md](DESIGN_SOUL.md) | Soul charter principles + accessibility matrix |
| [VOICE_CARD.md](VOICE_CARD.md) | Hearth + Edge registers, variant voices, Burns guidance, Do/Don't examples |
| [ART_STYLE_BIBLE.md](ART_STYLE_BIBLE.md) | Palette anchors, signature motifs, silhouette test |
| [DESIGN_IDEAS.md](DESIGN_IDEAS.md) | Sketchpad — ideas not yet flagship-scoped |
| [BANTER_AUTHORING.md](BANTER_AUTHORING.md) | Recipe doc for adding banter leaves |
| [HUGE_INITIATIVES_MASTER_PLAN.md](HUGE_INITIATIVES_MASTER_PLAN.md) | Flagship roster; partially live — uses strikethrough for shipped rows. **2026-05-09 — polish phase declared:** no flagship currently picked (see [PRD.md](PRD.md) §"Next flagship slot" + [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q8). |

---

## Subdirectories

| Directory | Purpose | Entry point |
|---|---|---|
| [status/](status/) | Partially-populated domain trackers (a11y, cultural, engine — others remain at `docs/` root, see "Status trackers" below) | (sub-tables below) |
| [dispatch/](archive/dispatch/) | Per-session dispatch sets. Each session lives in its own dated subdir; the dirname carries the *kickoff* date even if the dispatch ran multiple rounds (e.g. `2026-04-26/` ran rounds through 2026-04-28). | [dispatch/2026-04-26/00_task_list.md](archive/dispatch/2026-04-26/00_task_list.md) |
| [top-10-tasks/](archive/top-10-tasks/) | 2026-04-26 top-10 dispatch (reconciled to `master`); kept here as a self-contained record. | [top-10-tasks/00-INDEX.md](archive/top-10-tasks/00-INDEX.md) |
| [research/](research/) | 8 deep reference docs (~150k words) — roguelite, Scottish ×2, game feel, music/art tech, accessibility, cultural sensitivities, narrative | [research/README.md](research/README.md) |
| [superpowers/specs/](superpowers/specs/) | Design specs (chronological, date-prefixed) | [superpowers/specs/INDEX.md](superpowers/specs/INDEX.md) |
| [superpowers/plans/](superpowers/plans/) | Implementation plans (chronological, date-prefixed) | [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md) |
| [adr/](adr/) | Architecture Decision Records (numbered) | [adr/README.md](adr/README.md) |
| [prompts/](prompts/) | Live session prompts (currently 1 — `orchestrator-backlog-drain.md`). Archived prompts under [archive/prompts/](archive/prompts/). | — |
| [archive/](archive/) | Superseded / historical docs preserved for decision history. Move things here when INDEX classifies them as historical. | — |

---

## Status trackers — actual locations

> **Note (2026-05-08):** the original plan was to colocate every domain tracker under `docs/status/<domain>/`. Some moved (cultural, parts of a11y, parts of engine); most stayed at `docs/<NAME>.md` because they're cited from code/tests/specs by absolute path. This index reflects what's actually on disk. See [DOC_CONVENTIONS.md](DOC_CONVENTIONS.md) §"Status trackers" for the rule.

### Accessibility (A1)

| File | Purpose |
|---|---|
| [A1_PEAT_AUDIT.md](A1_PEAT_AUDIT.md) | 25-row PEAT photosensitivity audit (PEAT human-gated) |
| [A1_COLORBLIND_AUDIT.md](A1_COLORBLIND_AUDIT.md) | Palette × CVD matrix (Coblis/Color Oracle human-gated) |
| [A1_NON_COLOUR_ALONE.md](A1_NON_COLOUR_ALONE.md) | Non-colour-alone signal census (WCAG 1.4.1) |
| [A1_CAPTIONS_INDEX.md](A1_CAPTIONS_INDEX.md) | Captioned-event catalogue + gap list |
| [A1_ASSIST_MODE_CALLSITES.md](A1_ASSIST_MODE_CALLSITES.md) | Assist Mode toggle → call-site map |
| [status/a11y/A1_DOM_FOCUS_LAYER.md](status/a11y/A1_DOM_FOCUS_LAYER.md) | T407 DOM-visible focus layer pattern + adoption notes |
| [status/a11y/A1_FLASH_BUDGET.md](status/a11y/A1_FLASH_BUDGET.md) | A1 flash-alpha + duration budget evidence |

### Cultural review (C2 / C-content)

| File | Purpose |
|---|---|
| [status/cultural/CULTURAL_REVIEW_PACKET.md](status/cultural/CULTURAL_REVIEW_PACKET.md) | **Reviewer-facing** entry point for Doric / Shetlandic / Burns / Gaelic gates |
| `status/cultural/CULTURAL_REVIEW_STATUS.json` | Machine-readable line manifest; CI-enforced via `src/data/culturalReviewStatus.test.ts` (path is hardcoded — coordinate moves with the test) |
| [C2_DIALECT_REVIEW.md](C2_DIALECT_REVIEW.md) | Doric + Shetlandic native-speaker review brief |
| [C2_BURNS_PROVENANCE.md](C2_BURNS_PROVENANCE.md) | Burns citation provenance against Kinsley + Canongate |
| [C2_VOICE_AUDIT.md](C2_VOICE_AUDIT.md) | Lore-tier voice consistency audit |

### Mobile (W95)

| File | Purpose |
|---|---|
| [MOBILE_DEVICE_TEST_MATRIX.md](MOBILE_DEVICE_TEST_MATRIX.md) | T203 hardware playtest matrix (12 device rows pending) |
| [MOBILE_QUIRKS.md](MOBILE_QUIRKS.md) | Running notebook of mobile-only behaviour |

### Cloud / backend (P3)

| File | Purpose |
|---|---|
| [archive/P3_BACKEND_DECISION_MATRIX.md](archive/P3_BACKEND_DECISION_MATRIX.md) | Backend selection rationale — decision accepted 2026-05-09 (ADR-0006); archived 2026-05-10 |

### Engine / refactor

| File | Purpose |
|---|---|
| [status/engine/SCENE_REFACTOR_GAP_AUDIT.md](status/engine/SCENE_REFACTOR_GAP_AUDIT.md) | T401 running journal of GameScene-decomposition slices (chronological, newest first) |
| [archive/SCENE_REFACTOR_AUDIT_2026-04-26.md](archive/SCENE_REFACTOR_AUDIT_2026-04-26.md) | Spec-vs-live audit for Phase A biomes / Phase B endless (one-off, 2026-04-26; archived 2026-05-10) |
| [archive/PHASE_0_GATE_NOTES.md](archive/PHASE_0_GATE_NOTES.md) | W71 Phase 0 prototype gate evidence (archived 2026-05-10) |
| [status/engine/BUNDLE_BUDGET.md](status/engine/BUNDLE_BUDGET.md) | Per-feature bundle-size budget tracking |

### Banter (B1)

| File | Purpose |
|---|---|
| [archive/BANTER_GAPS.md](archive/BANTER_GAPS.md) | Banter pool coverage audit (B1 phases — all phases shipped; archived 2026-05-10) |

### Art

| File | Purpose |
|---|---|
| [ART_AUDIT.md](ART_AUDIT.md) | Per-sprite priority audit (P0–P3) |
| [archive/SPRITE_AUDIT_2026-04-27.md](archive/SPRITE_AUDIT_2026-04-27.md) | Sprite Round-2 lift audit (253 lifted + 38 new keys; archived 2026-05-10) |

### Other one-off audits / sessions at root

| File | Purpose |
|---|---|
| [HUGE_INITIATIVES_MASTER_PLAN.md](HUGE_INITIATIVES_MASTER_PLAN.md) | Initiatives — done / open / won't ship (reframed 2026-05-10) |
| [REVIEW.md](REVIEW.md) | 2026-05-10 adversarial audit (18 of 20 closed; tracks remaining open work) |
| [LOC_BUDGET.md](LOC_BUDGET.md) | LOC reporter baseline + GameScene.ts 2200-line hard ceiling |
| [CROSS_BROWSER_CALIBRATION.md](CROSS_BROWSER_CALIBRATION.md) | Per-browser e2e calibration data |
| [archive/HUGE_INITIATIVES_VERDICT.md](archive/HUGE_INITIATIVES_VERDICT.md) | Historical 2026-04-16 verdict against master plan; archived 2026-05-09, superseded by current PRD + plans INDEX |
| [archive/2026-04-26-multi-model-audit/](archive/2026-04-26-multi-model-audit/) | Historical 2026-04-26 multi-model audit reports + reconciled backlog (basis for top-10 dispatch) — archived 2026-05-09 |
| [prompts/orchestrator-backlog-drain.md](prompts/orchestrator-backlog-drain.md) | Live reusable orchestrator brief (the only prompts file still in active use) |
| [archive/prompts/](archive/prompts/) | 4 historical session prompts (particle budget, polish onboarding, perf balance, visual art review) — archived 2026-05-09 |
| [top-10-tasks/](archive/top-10-tasks/) | 2026-04-26 morning top-10 dispatch — all 10 charters reconciled to `master` (tip `89ca11a`). Includes `00-INDEX.md`, `01..10` charters, `Execution_Log.md`, and `blocked/` human-gated stubs. The next-session dispatch lives at `dispatch/2026-04-26/`. |

---

## Conventions

- **Plan files** carry a `STATUS:` marker on line 3. See [superpowers/plans/INDEX.md](superpowers/plans/INDEX.md) for the canonical schema and [DOC_CONVENTIONS.md](DOC_CONVENTIONS.md) for the values it accepts.
- **ADR files** are numbered `NNNN-kebab-case-title.md`. DRAFT ADRs get a `.draft.md` suffix until accepted. See [adr/README.md](adr/README.md).
- **Status trackers** — see [DOC_CONVENTIONS.md §"Status trackers"](DOC_CONVENTIONS.md#status-trackers) for the placement rule. Trackers cited from code/tests by absolute path live at `docs/<NAME>.md`; ones cited only from other docs may live under `docs/status/<domain>/`.
- **`status/cultural/CULTURAL_REVIEW_STATUS.json`** is read by `src/data/culturalReviewStatus.test.ts` via a hardcoded relative path — moving or renaming requires a code change.
- **One `Execution_Log.md` per dispatch session.** The active dispatch log is at `dispatch/2026-04-26/Execution_Log.md`. The 2026-04-26 morning batch's log lives at `top-10-tasks/Execution_Log.md`. Future dispatches should follow the per-session-subdir pattern under `dispatch/`.
- **Design canon stays at root** because CLAUDE.md cites those paths as primary references and they're evergreen, not per-domain status.

---

## Updating this index

- Add a new `dispatch/YYYY-MM-DD/` subdir for each fresh dispatch session.
- When a dispatch session completes (charters reconciled to `master`), leave it in place; the directory name carries the date and the `Execution_Log.md` records the reconciliation tip.
- When shipping a new tracker, add it under the right `status/<domain>/` directory (or `docs/` root if cited from code) and add a row in the relevant table above. Create a new domain dir under `status/` if one doesn't fit.
- Re-categorise when a status doc graduates to evergreen (rare) or vice versa.
