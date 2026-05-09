# PRD Sync + A11y Matrix Implementation Plan

> **STATUS:** ✅ SHIPPED 2026-04-17 — PRD reconciled + a11y matrix landed in `docs/DESIGN_SOUL.md` (per `superpowers/plans/INDEX.md`).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile `docs/PRD.md` with the last three commits (5696ddb, 199083f, c621b09) that quietly closed P-queue items, then add the missing a11y matrix to `docs/DESIGN_SOUL.md` (the last open PRD P3 doc task).

**Architecture:** Pure documentation pass. Two files touched: `docs/PRD.md` and `docs/DESIGN_SOUL.md`. No source changes, no tests broken, no build impact.

**Tech Stack:** Markdown. No code.

**Context snapshot (verified 2026-04-17):**
- `e2e/comfort-smoke.spec.ts` exists and covers motionScale=0 + highContrastUi + captions + banter=off + reduceParticles through gordon boss kill with settings-preservation assertion. **PRD P3 comfort smoke = shipped.**
- `docs/BANTER_AUTHORING.md` exists (commit c621b09). **PRD P4 authoring guide = shipped.**
- `DebugOverlay` pool sizes, tween count, music lookahead landed in commit 199083f. **PRD P5 DebugOverlay detail = shipped.**
- `docs/DESIGN_SOUL.md` has no a11y matrix section. PRD P3 second sub-item still open.
- PRD "Current Snapshot" date stamp is 2026-04-17 already; no date bump needed.

**Out of scope:**
- P2 bundle investigations (Phaser subsetting, PWA precache, app chunk lazy-load) — each needs its own plan, not a doc sweep.
- P4 banter for weapon evolution / curse acceptance — deferred pending voice-register review.
- W18 Phase B Scots banter overlay — same.

---

## Task 1: Mark shipped P-queue items in PRD

**Files:**
- Modify: `docs/PRD.md` (P3 section ~lines 89-94, P4 section ~lines 96-105, P5 section ~lines 107-112)

- [ ] **Step 1: Re-read the three sections to confirm current unchecked state**

Read `docs/PRD.md:89-113`. Confirm these lines exist verbatim:
- `- [ ] Exercise the Comfort panel end-to-end in CI via a smoke test:` (P3)
- `- [ ] The \`banter.ts\` sub-pool schema is tag-driven — land a` (P4 first item)
- `- [ ] DebugOverlay exists — surface active pool sizes, tween count,` (P5 second item)

Expected: all three present unchanged.

- [ ] **Step 2: Check off P3 comfort smoke**

Edit `docs/PRD.md`:
- Find: `- [ ] Exercise the Comfort panel end-to-end in CI via a smoke test:\n  motionScale=0 + highContrastUi + captions + banter=off through\n  one full boss encounter. (\`e2e/comfort-smoke.spec.ts\`)`
- Replace with: `- [x] Exercise the Comfort panel end-to-end in CI via a smoke test:\n  motionScale=0 + highContrastUi + captions + banter=off through\n  one full boss encounter. Done 2026-04-17 — see\n  \`e2e/comfort-smoke.spec.ts\` (commit 5696ddb).`

- [ ] **Step 3: Check off P4 BANTER_AUTHORING guide**

Edit `docs/PRD.md`:
- Find: `- [ ] The \`banter.ts\` sub-pool schema is tag-driven — land a\n  one-page "how to add a new boss / variant voice" note so future\n  content drops don't require engine diffs.\n  (\`docs/BANTER_AUTHORING.md\`)`
- Replace with: `- [x] The \`banter.ts\` sub-pool schema is tag-driven — land a\n  one-page "how to add a new boss / variant voice" note so future\n  content drops don't require engine diffs. Done 2026-04-17 —\n  \`docs/BANTER_AUTHORING.md\` (commit c621b09).`

- [ ] **Step 4: Check off P5 DebugOverlay detail**

Edit `docs/PRD.md`:
- Find: `- [ ] DebugOverlay exists — surface active pool sizes, tween count,\n  scheduled-music-events lookahead depth behind a keybind.`
- Replace with: `- [x] DebugOverlay exists — surface active pool sizes, tween count,\n  scheduled-music-events lookahead depth behind a keybind. Done\n  2026-04-17 (commit 199083f).`

- [ ] **Step 5: Verify PRD still parses as markdown**

Run: `cat docs/PRD.md | head -120`
Expected: three new `[x]` lines, no broken formatting, no stray escapes.

---

## Task 2: Add the a11y matrix to DESIGN_SOUL.md

**Files:**
- Modify: `docs/DESIGN_SOUL.md` (append a new section between "For contributors" and EOF, OR between "Objectives" and "For contributors" — whichever reads more naturally)

**Rationale:** PRD P3 second sub-item: *"Document the a11y matrix in `docs/DESIGN_SOUL.md` so designers can see every knob at a glance."* The matrix should enumerate every comfort/accessibility setting already in code (SettingsManager fields) with: label, default, what it controls, where it reads. Cross-reference the Comfort smoke that guards the extremes.

**Source of truth** for the matrix rows (verified 2026-04-17): `src/scenes/SettingsScene.ts:51-60` `VolumeKey | ToggleKey` unions plus banter/locale cycles. Matrix entries (11 rows):

| Control | Type | Default | Effect | Read by |
|---|---|---|---|---|
| `masterVolume` | slider 0–1 | 1.0 | Global SFX+music bus | `AudioSystem`, `ProceduralMusicEngine` |
| `sfxVolume` | slider 0–1 | 1.0 | SFX-only bus | `AudioSystem` |
| `musicVolume` | slider 0–1 | 1.0 | Music-only bus | `ProceduralMusicEngine` |
| `uiScale` | slider 0.8–1.4 | 1.0 | Scene text/button/HUD/minimap size | Every scene `.setScale(uiScale)` |
| `motionScale` | slider 0–1 | 1.0 | Tween amplitude multiplier (0 = reduce) | `JuiceSystem`, boss intros, settings-title breath |
| `screenShake` | toggle | ON | Enables camera shake on kills/hits | `JuiceSystem.shake()` |
| `damageNumbers` | toggle | ON | Show floating damage text | `JuiceSystem.damageNumber()` |
| `reduceParticles` | toggle | OFF | Skips ambient particle decoration | MainMenu hearth, Settings heather strip, MenuScene |
| `highContrastUi` | toggle | OFF | Swaps scene palettes to high-contrast variants | every scene's palette resolver |
| `captionsEnabled` | toggle | OFF | Shows on-screen captions for audio events | caption system |
| `telemetryOptIn` | toggle | OFF | Sends run_start / run_end / subscriber events | `AnalyticsManager` |
| `skipActIntermissions` | toggle | OFF | Applies `DEFAULT_ROUTE_ON_SKIP` instead of showing the W2 picker | `GameScene.launchActIntermission` |
| `ironmoorMode` | toggle | OFF | Opt-in permadeath alt run with wipe-on-death | `GameScene`, `SaveManager` (W66) |
| `banterFrequency` | cycle | Natural | Wheesht / Sparing / Natural / Gabby throttle | `BanterSystem` |
| `localeKey` | cycle | en | English / Scots overlay (falls back to en for unresolved keys) | `setLocale` → every `t()` call |

- [ ] **Step 1: Read the current DESIGN_SOUL.md to pick the insertion point**

Run: `cat docs/DESIGN_SOUL.md`
Expected: file has Soul charter → principles → weave matrix → Objectives → "For contributors" → EOF.

Decide: insert the a11y matrix as its own `## Accessibility & comfort matrix` section **after** the existing "Soul weave matrix" section and **before** "Objectives" — so designers scanning the weave matrix naturally continue into the a11y one. This keeps the contrib section as the last practical note.

- [ ] **Step 2: Append the new section**

Use `Edit` on `docs/DESIGN_SOUL.md`:
- Find the delimiter line immediately after the weave matrix (`---` above `## Objectives (execution order)`).
- Insert the new section above the existing Objectives heading.

New content to insert (exact, between the two `---` rules):

```markdown
## Accessibility & comfort matrix

Every knob shipped under the Comfort banner, in one glance. All are persisted by `SettingsManager` (`whs_game_settings`) with an independent `settingsVersion` gate; the Comfort smoke test (`e2e/comfort-smoke.spec.ts`) exercises the strictest combo (motionScale 0 + highContrastUi + captions + reduceParticles + banter off) through a full boss encounter in CI.

| Control | Type | Default | What it changes | Primary readers |
|---|---|---|---|---|
| `masterVolume` | slider 0 – 1 | 1.0 | Global SFX + music bus | `AudioSystem`, `ProceduralMusicEngine` |
| `sfxVolume` | slider 0 – 1 | 1.0 | SFX-only bus | `AudioSystem` |
| `musicVolume` | slider 0 – 1 | 1.0 | Music-only bus | `ProceduralMusicEngine` |
| `uiScale` | slider 0.8 – 1.4 | 1.0 | Scene text, buttons, HUD, minimap size | every scene (`.setScale(uiScale)`) |
| `motionScale` | slider 0 – 1 | 1.0 | Tween amplitude multiplier (0 = reduce motion) | `JuiceSystem`, boss intros, settings title breath |
| `screenShake` | toggle | on | Camera shake on kills and hits | `JuiceSystem.shake()` |
| `damageNumbers` | toggle | on | Floating damage text | `JuiceSystem.damageNumber()` |
| `reduceParticles` | toggle | off | Skips ambient decoration particles | MainMenu hearth, Settings heather strip, MenuScene |
| `highContrastUi` | toggle | off | Swaps scene palettes to high-contrast variants | every scene's palette resolver |
| `captionsEnabled` | toggle | off | On-screen captions for audio events | caption system |
| `telemetryOptIn` | toggle | off | Emits `run_start` / `run_end` / subscriber events | `AnalyticsManager` |
| `skipActIntermissions` | toggle | off | Applies `DEFAULT_ROUTE_ON_SKIP` instead of showing the W2 picker | `GameScene.launchActIntermission` |
| `ironmoorMode` | toggle | off | W66 opt-in permadeath mode with wipe-on-death | `GameScene`, `SaveManager` |
| `banterFrequency` | cycle | Natural | Wheesht / Sparing / Natural / Gabby throttle | `BanterSystem` |
| `localeKey` | cycle | en | English baseline / Scots overlay (falls back to en for unresolved keys) | `setLocale` → every `t()` call |

**Comfort invariants** (enforced by tests where practical):

- Settings persist across scene restart and browser reload. The Comfort smoke asserts `motionScale`, `highContrastUi`, `captionsEnabled`, `banterFrequency`, `reduceParticles` all survive a boss encounter.
- `SettingsScene` itself respects `uiScale` and `highContrastUi` — no scene is exempt (the Phase 3 hole where Settings ignored its own knobs was closed in the Soul Charter pass).
- `motionScale = 0` disables tween amplitude, not tween duration, so layout timing stays consistent for players who reduce motion.
- `reduceParticles` gates ambient decoration only; gameplay-critical feedback (hit flashes, damage numbers if enabled) is never culled by this flag.
- The extremes combo (all-strict Comfort profile) must never produce a page error — guarded by `e2e/comfort-smoke.spec.ts`.
```

- [ ] **Step 3: Verify DESIGN_SOUL.md still renders**

Run: `cat docs/DESIGN_SOUL.md`
Expected: new section sits between weave matrix and Objectives; no broken table formatting; trailing `---` rules intact.

- [ ] **Step 4: Confirm PRD link to the matrix is accurate**

Re-read `docs/PRD.md:93-94`:
```
- [ ] Document the a11y matrix in `docs/DESIGN_SOUL.md` so designers
  can see every knob at a glance.
```

Mark this one shipped too:
- Find: `- [ ] Document the a11y matrix in \`docs/DESIGN_SOUL.md\` so designers\n  can see every knob at a glance.`
- Replace with: `- [x] Document the a11y matrix in \`docs/DESIGN_SOUL.md\` so designers\n  can see every knob at a glance. Done 2026-04-17.`

---

## Task 3: Verify no stale state remains

**Files:** read-only

- [ ] **Step 1: Confirm lint is clean**

Run: `npm run lint`
Expected: `eslint ... ✅` with no errors. Doc-only change should not touch any linted file.

- [ ] **Step 2: Confirm tests still green**

Run: `npm test -- --run`
Expected: 2325+ tests passing (baseline is 2325 per PRD). No regressions.

- [ ] **Step 3: Grep PRD for any other stale `[ ]` that the recent commits closed**

Run: `grep -n "^- \[ \]" docs/PRD.md`
Expected: remaining unchecked items are P2 bundle (3), P4 banter evolution/curse (1), P4 W18 Scots banter (1). Five unchecked items, no surprises. If more appear, flag for a follow-up pass.

---

## Task 4: Commit

**Files:** doc changes only (2 files)

- [ ] **Step 1: Stage changes**

```bash
git add docs/PRD.md docs/DESIGN_SOUL.md docs/superpowers/plans/2026-04-17-prd-sync-and-a11y-matrix.md
```

- [ ] **Step 2: Create commit**

Use this message:

```
docs(prd): mark shipped P3/P4/P5 items + add a11y matrix

Reconciles PRD with commits 5696ddb (comfort smoke), c621b09
(BANTER_AUTHORING), 199083f (DebugOverlay detail), then closes
the last PRD P3 sub-item by documenting the accessibility
& comfort matrix in DESIGN_SOUL.md — every knob, default, and
primary reader in one scannable table, plus the Comfort invariants
the smoke test enforces.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify commit landed cleanly**

Run: `git log --oneline -3`
Expected: new commit at top, clean subject, no mojibake in the Scottish `—` dashes.

---

## Self-review checklist (run after completing all tasks)

- Every `[ ]` → `[x]` change traces to a specific shipped commit or done deliverable.
- No source code, test, or config touched — pure docs.
- A11y matrix rows match the live `SettingsManager` fields verified 2026-04-17; no drift from the `VolumeKey | ToggleKey` unions in `SettingsScene.ts`.
- Test count stays ≥2325.
- Build stays green.
