# A1 — Accessibility foundation implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the six accessibility foundation sub-items specified in `docs/superpowers/specs/2026-04-23-accessibility-foundation-design.md`: PEAT photosensitivity audit + refactoring, colorblind audit + colorblind modes, full key + gamepad remapping, captions scope expansion, `reduceFlashing` toggle + photosensitivity warning splash, Assist Mode scaffold.

**Architecture:** Additive extension of existing Comfort matrix (`DESIGN_SOUL.md`). New settings persist via `SaveManager` with schema bump. New `PostFXPipeline` for colorblind LUT remap (depends on F1 `ShaderRegistry` — if F1 ships later, A1 ships with colorblind-modes disabled until F1 lands). New `SettingsInputScene` for remapping UI. Caption infrastructure centralises SFX/music/ambient caption events through a new `captionBus`.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright. Path alias `@/*` → `./src/*`.

**Commit cadence:** One commit per TDD cycle (test + impl). Separate commits for pure refactors. Milestone ship commits carry summary bodies. All commits include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` trailer.

**Branch:** `master`.

**Guardrails on every task:**
- Run `npm test` after each impl step. Must stay green.
- Run `npm run lint` after multi-file changes.
- Never skip hooks. Never add `as any`. Zero TODO / FIXME markers.

---

## File structure

### New files

| Path | Responsibility |
|------|----------------|
| `docs/ACCESSIBILITY_PEAT_AUDIT.md` | Living doc recording PEAT results per VFX component. |
| `src/systems/accessibility/CaptionFormatter.ts` | Pure: `formatCaption(event) → string` with speaker + direction + SFX brackets. |
| `src/systems/accessibility/CaptionFormatter.test.ts` | Unit coverage. |
| `src/scenes/game/captionBus.ts` | Central dispatcher for caption events. |
| `src/scenes/game/captionBus.test.ts` | Subscription + fire tests. |
| `src/systems/accessibility/ColorblindMode.ts` | `PostFXPipeline` subclass; per-mode LUT remap. Gated on F1 shader infra availability. |
| `src/systems/accessibility/ColorblindMode.test.ts` | LUT application test (Phaser renderer mocked). |
| `src/scenes/SettingsInputScene.ts` | Key + gamepad remapping UI. |
| `src/scenes/SettingsInputScene.smoke.test.ts` | Headless scene-load smoke. |
| `src/ui/PhotosensitivityWarningSplash.ts` | First-launch splash overlay. |
| `src/systems/accessibility/AssistMode.ts` | Setting reader + effect applier stub (Phase 2 fills in effects). |
| `src/systems/accessibility/AssistMode.test.ts` | Settings round-trip. |

### Modified files

| Path | Change |
|------|--------|
| `src/utils/save.ts` | `SAVE_SCHEMA_VERSION` bump. Add `reduceFlashing`, `colorblindMode`, `keyBindings`, `gamepadBindings`, `assistMode{,GameSpeed,ExtendedIFrames,ExtendedComboWindow,Invincibility}`, `photosensitivityWarningSeen` to `Settings` interface. Migration adds defaults. |
| `src/utils/save.test.ts` | Migration test + round-trip coverage. |
| `src/core/SettingsManager.ts` | Register new settings with defaults. |
| `src/core/SettingsManager.test.ts` | Defaults + round-trip. |
| `src/scenes/SettingsScene.ts` | Add "Accessibility" tab; route to `SettingsInputScene`. |
| `src/systems/JuiceSystem.ts` | Respect `reduceFlashing`. Cap flash amplitudes and rates; replace flash events with sustained-brightness alternatives when setting on. |
| `src/systems/JuiceSystem.test.ts` | New tests confirm reduceFlashing behaviour. |
| `src/systems/music/Conductor.ts` | Emit caption events via `captionBus` on music-layer transitions (pibroch swell, bodhrán enter, fiddle enter). |
| `src/systems/AudioSystem.ts` | SFX playback emits caption events. |
| `src/scenes/BootScene.ts` | Show `PhotosensitivityWarningSplash` on first-ever launch (read `photosensitivityWarningSeen`). |
| `e2e/comfort-smoke.spec.ts` | Extend to cover `reduceFlashing on`, each `colorblindMode`, full keyboard navigation, caption verification. |
| `e2e/input-remap.spec.ts` | New: rebind dash to arrow-left, verify in-game. |
| `e2e/photosensitivity-warning.spec.ts` | New: first-launch splash flow. |

---

## Milestone plan

- **M1 — Photosensitivity audit + refactor** (tasks 1–8). PEAT audit entire game; fix any VFX that fails. Ship audit doc + refactored VFX. Ship gate: zero unresolved high-severity findings.
- **M2 — Colorblind audit + modes** (tasks 9–16). Coblis audit of five tonal palettes. ColorblindMode shader + settings wire. Ship gate: all palettes pass each simulator.
- **M3 — Key + gamepad remapping** (tasks 17–24). SettingsInputScene + bindings persistence. Ship gate: smoke-test rebind works.
- **M4 — Captions scope expansion** (tasks 25–32). CaptionFormatter + captionBus + coverage audit. Ship gate: all SFX/music/banter events caption.
- **M5 — reduceFlashing + warning splash** (tasks 33–38). New setting + JuiceSystem compliance + splash. Ship gate: PEAT re-run with toggle passes stricter bar.
- **M6 — Assist Mode scaffold** (tasks 39–42). Settings + read-write + UI (effects stubbed for Phase 2). Ship gate: settings persist, UI reads them.

Each milestone ends with a ship gate. Tasks within a milestone are committed one-per-TDD-cycle.

---

## M1 — Photosensitivity audit + refactor

### Task 1: Audit doc scaffold

**Files:** Create `docs/ACCESSIBILITY_PEAT_AUDIT.md`.

- [ ] **Step 1:** Create doc with headers: *Audit log*, *Tool*, *Methodology*, *Per-VFX findings*, *Refactoring applied*, *Next review date*.
- [ ] **Step 2:** Commit: `docs(a11y): scaffold PEAT audit log`.

### Task 2: PEAT audit — kill bursts

**Files:** Append findings to `docs/ACCESSIBILITY_PEAT_AUDIT.md`.

- [ ] **Step 1:** Run a 5-minute high-density combat session (AoE weapon at Level 5; act 2 peak spawn). Capture via OBS.
- [ ] **Step 2:** Feed capture through PEAT.
- [ ] **Step 3:** Record findings per flash category (general / red). Document thresholds.
- [ ] **Step 4:** If fail: identify specific kill-burst VFX that triggers. Move to Task 3.
- [ ] **Step 5:** Commit: `docs(a11y): PEAT audit — kill bursts`.

### Task 3: Refactor flagged kill-burst VFX

**Files:** `src/systems/JuiceSystem.ts`, `src/systems/JuiceSystem.test.ts`.

- [ ] **Step 1:** Write failing test for flash-amplitude cap (e.g., `expect(juice.killBurst({ color: 0xff0000 }).alpha).toBeLessThan(0.6)` when saturated red).
- [ ] **Step 2:** Implement desaturation + alpha cap in `JuiceSystem.killBurst()`.
- [ ] **Step 3:** Test passes.
- [ ] **Step 4:** Re-run PEAT on same capture. Confirm pass.
- [ ] **Step 5:** Commit: `fix(juice): desaturate saturated reds in kill bursts`.

### Task 4: PEAT audit — crit confirms

**Files:** Audit doc + possible JuiceSystem refactor.

- [ ] **Step 1:** Capture crit-heavy session. Feed to PEAT.
- [ ] **Step 2:** If fail: refactor `JuiceSystem.critFlash()` per same desaturate/cap pattern.
- [ ] **Step 3:** Record in audit doc.
- [ ] **Step 4:** Commit.

### Task 5: PEAT audit — evolution pickup + boss death spectacle

- [ ] **Step 1:** Capture evolution pickup + boss-kill spectacle in isolated scenes.
- [ ] **Step 2:** PEAT run.
- [ ] **Step 3:** Refactor if needed; spectacle events already have per-event budgets.
- [ ] **Step 4:** Commit per refactor.

### Task 6: PEAT audit — combo milestones (100, 250, 500, 1000)

- [ ] **Step 1:** Capture combo 1000 specifically — the reserved celebration.
- [ ] **Step 2:** Ensure it is designed seizure-safe from day one.
- [ ] **Step 3:** Record.
- [ ] **Step 4:** Commit.

### Task 7: PEAT audit — shader transitions (chromatic aberration + existing palette shifts)

- [ ] **Step 1:** Capture biome-transition + crit-shader events.
- [ ] **Step 2:** PEAT.
- [ ] **Step 3:** Refactor if needed.
- [ ] **Step 4:** Commit.

### Task 8: M1 Ship gate

- [ ] Audit doc complete with findings per VFX.
- [ ] All flagged VFX refactored.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(a11y): M1 — photosensitivity audit complete (no unresolved findings)`.

---

## M2 — Colorblind audit + modes

### Task 9: Palette audit via Coblis

**Files:** Append to `docs/ACCESSIBILITY_PEAT_AUDIT.md` (rename to `docs/ACCESSIBILITY_AUDIT.md` for broader scope).

- [ ] **Step 1:** Screenshot each of five biome palettes (Hearth, Wild, Fey, Grave, Wild Comedy) in-gameplay.
- [ ] **Step 2:** Upload to Coblis. Record for protanopia, deuteranopia, tritanopia.
- [ ] **Step 3:** Document failures: which hue pairs become indistinguishable.
- [ ] **Step 4:** Commit: `docs(a11y): colorblind audit of tonal palettes`.

### Task 10: Fix non-colour-alone reliance

**Files:** `src/ui/HazardZones.ts`, `src/entities/Enemy.ts` (elite marker), etc. per audit findings.

- [ ] **Step 1:** For each flagged gameplay-critical colour signal, add shape/icon/motion cue.
  - Example: elite glow → add small star icon overlay.
  - Example: hazard tile → add pulsing animation.
- [ ] **Step 2:** Write test per change (e.g., `Enemy.elite.test.ts` assert icon present when `isElite`).
- [ ] **Step 3:** Commit per change.

### Task 11: Save schema bump for colorblind settings

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`.

- [ ] **Step 1:** Failing test for `colorblindMode` default.
- [ ] **Step 2:** Add field + migration.
- [ ] **Step 3:** Test passes.
- [ ] **Step 4:** Commit: `feat(save): add colorblindMode setting (schema bump)`.

### Task 12: ColorblindMode shader skeleton

**Files:** `src/systems/accessibility/ColorblindMode.ts`, `src/systems/accessibility/ColorblindMode.test.ts`.

- [ ] **Step 1:** Failing test for `ColorblindMode.setMode('deuteranopia')` changes active LUT.
- [ ] **Step 2:** Implement as `PostFXPipeline` subclass; use F1 ShaderRegistry if available, else no-op.
- [ ] **Step 3:** Test passes.
- [ ] **Step 4:** Commit: `feat(a11y): ColorblindMode shader (LUT remap)`.

### Task 13: LUT authoring for 4 modes

- [ ] **Step 1:** Author 4 LUTs (protanopia, deuteranopia, tritanopia, monochrome) as tiny inline tables.
- [ ] **Step 2:** Visual verification: re-screenshot biomes with shader active; compare against expected.
- [ ] **Step 3:** Commit: `feat(a11y): 4 colorblind LUTs`.

### Task 14: Settings UI wire-up

**Files:** `src/scenes/SettingsScene.ts`.

- [ ] **Step 1:** Add ColorblindMode cycle in Accessibility tab.
- [ ] **Step 2:** Wire save + apply shader on change.
- [ ] **Step 3:** Commit.

### Task 15: E2E smoke with each mode

**Files:** `e2e/comfort-smoke.spec.ts`.

- [ ] **Step 1:** Extend smoke to cycle through each ColorblindMode, verify no crash, screenshot-compare each.
- [ ] **Step 2:** Commit.

### Task 16: M2 Ship gate

- [ ] All five tonal palettes pass Coblis checks (or have mitigating icons/shapes).
- [ ] ColorblindMode shader functional.
- [ ] E2E coverage green.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(a11y): M2 — colorblind audit + modes complete`.

---

## M3 — Key + gamepad remapping

### Task 17: ActionKey enum + default bindings

**Files:** `src/core/actions.ts` (new), tests.

- [ ] **Step 1:** Failing test for `DEFAULT_KEYBINDINGS.move_up === 'ArrowUp'`.
- [ ] **Step 2:** Define `ActionKey` enum + default-binding map.
- [ ] **Step 3:** Commit.

### Task 18: Save schema extension

**Files:** `src/utils/save.ts`, tests.

- [ ] **Step 1:** Failing test for `keyBindings` defaulting to `DEFAULT_KEYBINDINGS`.
- [ ] **Step 2:** Add field + migration.
- [ ] **Step 3:** Commit: `feat(save): add keyBindings + gamepadBindings`.

### Task 19: Input abstraction layer

**Files:** `src/input/InputMapper.ts` (new), tests.

- [ ] **Step 1:** Failing test: `InputMapper.getKey('dash')` returns bound key from settings.
- [ ] **Step 2:** Implement — wraps Phaser input, reads current bindings, exposes semantic-key queries.
- [ ] **Step 3:** Migrate existing keyboard-check sites to `InputMapper`. Incremental — 1 site per commit.

### Task 20: SettingsInputScene scene scaffold

**Files:** `src/scenes/SettingsInputScene.ts`, smoke test.

- [ ] **Step 1:** Failing smoke test: scene launches without error.
- [ ] **Step 2:** Scene scaffold with action-list layout + "Rebind" buttons per row.
- [ ] **Step 3:** Commit: `feat(a11y): SettingsInputScene scaffold`.

### Task 21: Rebind flow

- [ ] **Step 1:** Click "Rebind" → enter capture mode; next keypress = new binding.
- [ ] **Step 2:** Conflict detection — if new binding matches existing, highlight + warn.
- [ ] **Step 3:** Commit: `feat(a11y): rebind flow + conflict detection`.

### Task 22: Gamepad rebinding

- [ ] **Step 1:** Similar flow for gamepad buttons.
- [ ] **Step 2:** Commit.

### Task 23: "Reset to defaults" + persistence verification

- [ ] **Step 1:** Reset button wipes bindings → defaults.
- [ ] **Step 2:** Bindings persist across scene reload.
- [ ] **Step 3:** Commit.

### Task 24: M3 Ship gate + `e2e/input-remap.spec.ts`

- [ ] **Step 1:** Create `e2e/input-remap.spec.ts`: rebind dash to arrow-left, start run, press arrow-left, verify dash fires.
- [ ] **Step 2:** All tests green.
- [ ] **Step 3:** Commit: `feat(a11y): M3 — full input remapping shipped`.

---

## M4 — Captions scope expansion

### Task 25: CaptionFormatter pure function

**Files:** `src/systems/accessibility/CaptionFormatter.ts` + test.

- [ ] **Step 1:** Failing test: `formatCaption({ type: 'sfx', key: 'pibroch_swell' })` returns `"[pibroch swell]"`.
- [ ] **Step 2:** Implement with SFX-bracket, speaker-prefix, directional-arrow rules per `ACCESSIBILITY_RESEARCH.md §4.1`.
- [ ] **Step 3:** Commit.

### Task 26: captionBus dispatcher

- [ ] **Step 1:** Failing test: `captionBus.emit({...})` delivers to subscribed UI.
- [ ] **Step 2:** Implement simple pub-sub.
- [ ] **Step 3:** Commit.

### Task 27-30: Wire caption emissions

One task per emission site — `SpawnSystem` enemy-approach, `HazardZones` hazard-spawn, `BanterSystem` line-fire, `Conductor` music-cue, `AudioSystem` stinger.

Per task:
- [ ] **Step 1:** Failing test that caption event fires.
- [ ] **Step 2:** Emit event.
- [ ] **Step 3:** Commit.

### Task 31: Caption UI customisation (size/background/speaker)

**Files:** `src/ui/CaptionRenderer.ts` extend.

- [ ] **Step 1:** Add size preset cycle + background toggle (none/dim/dark).
- [ ] **Step 2:** Commit.

### Task 32: M4 Ship gate

- [ ] Manual check: all SFX categories caption.
- [ ] Music cues caption.
- [ ] E2E verify captions visible with `captionsEnabled: on`.
- [ ] Commit: `feat(a11y): M4 — captions scope expanded`.

---

## M5 — reduceFlashing + warning splash

### Task 33: Save schema + default

- [ ] **Step 1:** Failing test: `reduceFlashing` default `false`.
- [ ] **Step 2:** Add field.
- [ ] **Step 3:** Commit.

### Task 34: JuiceSystem reduceFlashing compliance

**Files:** `src/systems/JuiceSystem.ts` + test.

- [ ] **Step 1:** Failing test: when `reduceFlashing: true`, flash events have alpha ≤ 0.4 and duration ≥ 200ms.
- [ ] **Step 2:** Implement compliance.
- [ ] **Step 3:** Commit.

### Task 35: Chromatic aberration disable under reduceFlashing

- [ ] **Step 1:** If F1 chromatic-aberration ships: disable entirely when `reduceFlashing: true`.
- [ ] **Step 2:** Commit.

### Task 36: PhotosensitivityWarningSplash

**Files:** `src/ui/PhotosensitivityWarningSplash.ts` + test + `BootScene` integration.

- [ ] **Step 1:** Failing smoke test: splash shown on fresh-save, hidden on `photosensitivityWarningSeen: true`.
- [ ] **Step 2:** Implement overlay with "I Understand" dismiss button.
- [ ] **Step 3:** Wire in `BootScene`.
- [ ] **Step 4:** Commit.

### Task 37: e2e splash flow

**Files:** `e2e/photosensitivity-warning.spec.ts`.

- [ ] **Step 1:** Test: first-launch shows splash, subsequent don't.
- [ ] **Step 2:** Commit.

### Task 38: M5 Ship gate

- [ ] Re-run PEAT audit with `reduceFlashing: true`. Confirm stricter bar passes.
- [ ] E2E green.
- [ ] Commit: `feat(a11y): M5 — reduceFlashing + warning splash`.

---

## M6 — Assist Mode scaffold

### Task 39: Save schema for Assist Mode settings

- [ ] **Step 1:** Failing test: `assistMode` + subfields default correctly.
- [ ] **Step 2:** Add fields.
- [ ] **Step 3:** Commit.

### Task 40: AssistMode.ts read-write

**Files:** `src/systems/accessibility/AssistMode.ts` + test.

- [ ] **Step 1:** Failing test: `AssistMode.isEnabled()` reads from settings.
- [ ] **Step 2:** Implement — pure read-write. Effect-apply stubbed with TODO (Phase 2).
- [ ] **Step 3:** Commit.

### Task 41: Settings UI — Assist Mode sub-settings

**Files:** `src/scenes/SettingsScene.ts`.

- [ ] **Step 1:** Add Assist Mode toggle; gate sub-settings (game-speed slider, extended-iframes toggle, extended-combo toggle, invincibility toggle) behind it.
- [ ] **Step 2:** Label each sub-setting "(Phase 2)" where effects aren't wired.
- [ ] **Step 3:** Commit.

### Task 42: M6 Ship gate

- [ ] Settings persist across reload.
- [ ] UI reads state correctly.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(a11y): M6 — Assist Mode scaffold (effects pending Phase 2)`.

---

## Final ship gate (A1 complete)

- [ ] All six milestone gates passed.
- [ ] `docs/ACCESSIBILITY_AUDIT.md` complete with ongoing review cadence.
- [ ] `e2e/comfort-smoke.spec.ts` passes strictest combo: `motionScale 0 + highContrastUi + captions + reduceParticles + reduceFlashing + colorblindMode deuteranopia + remapped dash`.
- [ ] `npm run ci:all` green (lint + 3000+ vitest + build + e2e).
- [ ] Manual smoke on mid-range mobile device.
- [ ] Ship commit: `feat(a11y): A1 — accessibility foundation complete (6 sub-items shipped)`.
