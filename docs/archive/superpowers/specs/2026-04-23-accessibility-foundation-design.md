# A1 — Accessibility foundation design spec

**Date:** 2026-04-23
**Initiative:** A1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** None — this flagship unblocks and underpins all player-facing work.

---

## 1. Problem statement

WHS's `DESIGN_SOUL.md` Comfort matrix ships a genuinely strong accessibility surface for an indie game: motion scale, screen shake toggle, damage numbers toggle, reduce particles, high contrast UI, captions, UI scale, banter frequency, bilingual locale, skip intermissions. This is *above* most indie baselines.

But `docs/research/ACCESSIBILITY_RESEARCH.md §8.2 Thin or Gap Areas` flagged specific holes that must close before a player-facing launch:

1. **No photosensitivity audit.** Zero verified evidence that WHS's particle-heavy combat is seizure-safe. WCAG 2.2 Success Criterion 2.3.1 is non-negotiable for a web-delivered game. **Critical.**
2. **No colorblind audit of the five tonal palettes.** Red-as-hazard / green-as-heal relies on hue. ~8% of male players (1 in 12) can't reliably distinguish.
3. **Key remapping status unclear.** Research flagged this; no documented implementation surface.
4. **Captions scope unclear.** Toggle exists but may cover dialogue-only, not SFX and music cues.
5. **No dedicated "Reduce Flashing" toggle** (separate from reduceParticles).
6. **No photosensitivity warning splash.** Standard industry practice; absent from WHS.
7. **No Assist Mode** (Celeste-style game-speed / extended timing / invincibility).

This flagship addresses items 1–6 (the non-optional foundation) and lays scaffolding for Assist Mode (item 7) as a follow-up phase.

### Player outcome

Every player, regardless of visual / motor / cognitive / photosensitivity status, can meaningfully play WHS. Known-harmful content is removed; known-inaccessible content has accessible alternatives; seasoned disabled players recognise the care in the implementation and spread the word.

### Why this is a flagship, not a polish ticket

Each sub-item is small; the *combination* is large. Doing them together lets us:
- Ship a single "accessibility foundation" milestone players can trust.
- Update Steam accessibility tags (2025 system, 16 features) accurately.
- Write the public ACCESSIBILITY.md statement (per `ACCESSIBILITY_RESEARCH.md §10.2`).
- Establish the testing tools and processes (PEAT, Coblis, Color Oracle) as shipped dev discipline.

Treating it as a flagship forces us to do it properly, not piecemeal.

---

## 2. Scope — six sub-items

### S1. Photosensitivity audit + PEAT-safe refactoring

**Tool:** [PEAT — Trace Center](https://trace.umd.edu/peat/) — free for non-commercial web audit (WHS's browser-game delivery qualifies). For Steam commercial release, upgrade to Harding FPA.

**Audit targets (per `ACCESSIBILITY_RESEARCH.md §2.5`):**
- Kill bursts across all weapons (high-density scenario: AoE-weapon swarm kills).
- Crit confirms (flash + colour-shift per hit).
- Evolution pickup celebration.
- Boss death spectacle (30 particles + 2 rings + 1 delayed ring).
- Damage numbers (at high DPS density).
- Hit freeze / time-dilation transitions.
- Combo milestone VFX at 5 / 10 / 25 / 50 / 100 / 250 / 500 / 1000 (latter reserved — design for safety from day one).
- Chromatic aberration shader (if shipped per F1 roadmap — audit before ship).
- Haar shader transitions (per F1 — cap density ramp speed at ≥2s for photosensitive users).
- Background palette shifts (biome changes, Beltane fire overlay).

**Criteria per WCAG 2.2 SC 2.3.1:**
- ≤ 3 general flashes per second.
- ≤ 3 red flashes per second.
- Flash area ≤ 25% of screen at standard viewing.
- No sustained flashing > 5 seconds.
- No saturated-red strobing anywhere.

**Refactoring patterns:**
- Desaturate any saturated red in flash effects.
- Use opacity fade rather than visibility toggle for "flashing" elements.
- Cap simultaneous flash events per frame (aggregator).
- Soft transitions (100-300ms) over hard cuts.

### S2. Colorblind audit + colorblind modes

**Tools:** [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/), [Color Oracle](https://colororacle.org/), Chrome DevTools → Rendering → Emulate Vision Deficiencies.

**Audit targets:**
- All five tonal palettes (`ART_STYLE_BIBLE.md §Tonal palette map`):
  - Hearth (warm golds, heather purples).
  - Wild (cool stones, mist).
  - Fey (violets, luminous heather).
  - Grave (desaturated greys, bracken red).
  - Wild Comedy (sodium amber, rust).
- Semantic colours: red=damage, green=heal, gold=treasure, yellow=crit.
- Enemy type encoding (elite gold glow, hazard orange, boss red).
- Hazard tiles (slick teal-blue, healing circle green, fog white).
- Thistle particles (heather purple) vs background heather.

**Deliverable:** audit spreadsheet listing each palette → each simulator result → any colour-pair that fails. Fixes where needed:
- Add icon / shape to elements currently colour-only (e.g., elite = gold + *star* icon).
- Add outline (per `ART_STYLE_BIBLE.md §Silhouette-first test`) where figure-ground contrast drops.
- Add motion differentiation (hazards pulse; safe tiles still).

**Colorblind modes:** new setting `colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome'`. Each mode applies a palette-swap shader (F1 ShaderRegistry infrastructure prereq) that remaps gameplay-critical colours. **UI chrome remains unchanged** — only gameplay-relevant colour signals are swapped.

### S3. Key + gamepad full remapping

**Audit:** current input handling across all scenes. Identify hardcoded key assumptions.

**New remapping UI:**
- New menu: Settings → Input.
- Every action appears as a row: action name + current key binding + "Rebind" button.
- Conflict detection: if a new binding duplicates an existing one, highlight + warn.
- Reset-to-defaults button.
- Gamepad profile parallel to keyboard.
- Stored in `SaveData.settings.keyBindings: Record<ActionKey, KeyCode>`. Schema bump.

**Actions to remap:**
- Move (up / down / left / right — arrows + WASD default).
- Dash.
- Burn Leap (double-tap direction; alternative: bindable button for each direction).
- Pause.
- Confirm (menu + card pick).
- Cancel.
- Sporran menu / Relic active.
- Skip dialogue / banter.
- Toggle minimap detail.

### S4. Captions scope expansion

**Audit:** current `captionsEnabled` toggle. Verify captions fire for:
- Banter lines (*should* already work — confirm).
- SFX categories: enemy approach (*should* pair with visual cue if missing), hazard appearance, chest spawn, boss warn, low-HP alarm, evolution pickup, level-up, combo milestone, pickup chain, route-pick confirmation, seasonal event activation, haggis-platter pickup.
- Music cues: pibroch swell pre-boss, bodhrán low-HP enter, fiddle combo-100 enter, pipe layer Burns-Night active.
- Environmental audio: wind, sea, bird calls, distant sheep, ambient crowd.

**New caption format (per Last of Us Part II reference in `ACCESSIBILITY_RESEARCH.md §4.1`):**
- Brackets around SFX: `[ominous pibroch swell]`, `[distant thunder]`.
- Speaker name for banter: `Gran: "ye did braw, hen."`
- Directional arrows for off-screen audio: `← [enemy approaching]` (when audio panned left + player can't see source).
- Customisation per Steam accessibility tag requirements: caption size (3 presets), caption background (none / dim / dark), caption font (default / dyslexia-friendly — see S6 below).

### S5. `reduceFlashing` dedicated toggle + photosensitivity warning splash

**New setting** `reduceFlashing: boolean`. Distinct from `reduceParticles` (which affects *density*; this affects *temporal change*). When enabled:
- All VFX that flash or strobe are replaced with static-glow equivalents.
- Combo-milestone celebrations use sustained brightness, not flash.
- Biome palette transitions slow from 300ms to 1s.
- Haar shader caps density ramp at ≥2s.
- Screen-shake already has its toggle (preserved).
- Chromatic aberration shader is disabled entirely.

**Photosensitivity warning splash:**
- Shown *once* on first-ever launch (persisted in save).
- "Warning: a small percentage of players may experience seizures when exposed to flashing lights or patterns. If you or anyone in your family has an epileptic condition or has experienced seizures of any kind, consult a doctor before playing."
- Dismissable with "I Understand" button.
- Accessible via Settings → Accessibility after first launch.

### S6. Assist Mode scaffold (Phase 2 prep)

Full Assist Mode is a follow-up ticket. This flagship lays scaffolding:

- New `assistMode: boolean` setting.
- Sub-settings (gated behind assistMode enabled):
  - `gameSpeed: 0.5–1.5` slider (affects fixed-step integration).
  - `extendedIFrames: boolean` — dash invuln 300ms → 600ms.
  - `extendedComboWindow: boolean` — 1500ms → 3000ms.
  - `invincibility: boolean` — player takes no damage (full-on).

Wiring the settings persists and reads correctly. Actual effect application lands in Assist Mode follow-up ticket (allows playtesting the interface before committing to balance).

Naming discipline (per Celeste's lesson in `ACCESSIBILITY_RESEARCH.md §5.4`):
- Call it **Assist Mode**, never "Easy Mode".
- No "intended" vs "assisted" framing. Assist Mode is just... help.

### Not in scope for A1

- Dyslexia-friendly font opt-in (Tier 2 per ACCESSIBILITY §10.3) — small add, future ticket.
- Mono-audio toggle (Tier 2) — future ticket.
- Content warnings for trauma biomes (Tier 2 — lands when trauma biomes ship).
- Screen reader full support (Tier 3 stretch).
- Audio description track (Tier 3 stretch).
- Blind-accessibility mode (Tier 3 stretch).
- Published ACCESSIBILITY.md — written in A1, but public Steam statement happens at Steam launch.

---

## 3. Non-goals

- **Not a complete accessibility audit.** We do Tier 1 per research, scaffold for Tier 2.
- **Not Steam tag claims before features ship.** No "Colorblind Modes" tag until colorblind modes are actually shipped and tested.
- **Not a redesign of shipped VFX.** If PEAT flags a specific VFX as unsafe, we fix that VFX; we don't redo the whole JuiceSystem.
- **Not third-party accessibility consultant review in v1.** Self-audit via tools (PEAT, Coblis). External consulting (AbleGamers, SpecialEffect) is a Phase 2 budget line.
- **Not custom controller haptic mappings.** Standard Phaser controller support; no custom PlayStation Access Controller / Xbox Adaptive Controller mapping for v1 (both work via standard-controller remapping).

---

## 4. Architecture

### New files

- `src/systems/accessibility/PhotoAuditLog.ts` — Records PEAT audit results per VFX component for future reference; not runtime (docs-as-code).
- `src/systems/accessibility/ColorblindMode.ts` — `PostFXPipeline` extending ShaderRegistry (F1 prereq) applying per-mode LUT-remap.
- `src/systems/accessibility/CaptionFormatter.ts` — pure function `formatCaption(event: CaptionEvent) → string` with speaker / direction / SFX-bracketed formatting.
- `src/ui/SettingsInputScene.ts` — remapping UI scene.
- `src/ui/PhotosensitivityWarningSplash.ts` — first-launch splash.
- `src/systems/accessibility/AssistMode.ts` — setting-reader + effect-applier (Phase 2 fills in effects).

### Files to modify

- `src/core/SaveManager.ts` + `src/utils/save.ts` — extend `SaveData.settings` with:
  - `reduceFlashing: boolean`
  - `colorblindMode: string`
  - `keyBindings: Record<ActionKey, KeyCode>`
  - `gamepadBindings: Record<ActionKey, GamepadButton>`
  - `assistMode: boolean`
  - `assistModeGameSpeed: number`
  - `assistModeExtendedIFrames: boolean`
  - `assistModeExtendedComboWindow: boolean`
  - `assistModeInvincibility: boolean`
  - `photosensitivityWarningSeen: boolean`
  - Schema bump.
- `src/scenes/SettingsScene.ts` — add Accessibility tab; add Input sub-menu route.
- `src/systems/JuiceSystem.ts` — respect `reduceFlashing`; cap flash amplitudes and rates.
- `src/systems/music/Conductor.ts` — caption music cues via `CaptionFormatter`.
- `src/scenes/game/captionBus.ts` (new or existing) — central dispatcher; all audio-emitting systems call `emitCaption(event)`.
- `e2e/comfort-smoke.spec.ts` — extend to exercise: `reduceFlashing on`, `colorblindMode each`, full keyboard navigation.

### Data shape

```typescript
type ActionKey =
  | 'move_up' | 'move_down' | 'move_left' | 'move_right'
  | 'dash' | 'burn_leap_up' | 'burn_leap_down' | 'burn_leap_left' | 'burn_leap_right'
  | 'pause' | 'confirm' | 'cancel'
  | 'sporran_menu' | 'skip_dialogue' | 'minimap_toggle';

interface ComfortSettingsV2 {
  // existing...
  reduceFlashing: boolean;
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
  keyBindings: Record<ActionKey, string>;
  gamepadBindings: Record<ActionKey, string>;
  assistMode: boolean;
  assistModeGameSpeed: number; // 0.5–1.5
  assistModeExtendedIFrames: boolean;
  assistModeExtendedComboWindow: boolean;
  assistModeInvincibility: boolean;
  photosensitivityWarningSeen: boolean;
}
```

### PEAT audit artefact

A living document [`docs/A1_PEAT_AUDIT.md`](../../A1_PEAT_AUDIT.md) records:
- Each VFX component tested.
- PEAT result (pass / fail / observation).
- Date audited.
- Mitigation applied if needed.

Re-audited each major release.

### Tests / fences

- `CaptionFormatter.test.ts` — pure function test for each formatting case.
- `AssistMode.test.ts` — settings persistence, read-write round-trip.
- `ColorblindMode.test.ts` — LUT application correct per mode.
- `save.test.ts` — new settings migration.
- `e2e/comfort-smoke.spec.ts` — extended to cover new settings combinations.
- `e2e/input-remap.spec.ts` — new smoke: rebind dash to arrow-left, verify in-game.
- `e2e/photosensitivity-warning.spec.ts` — first-launch shows splash, subsequent don't.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| PEAT audit identifies un-fixable VFX | Rebuild the VFX from design-first-prevention principles; no player-facing ship until safe. |
| Colorblind LUT shader breaks visual style | LUTs carefully tuned to preserve the Soul Charter's tonal spectrum while swapping specifically-problematic hues. |
| Remapping UI complexity confuses players | Default keyboard + gamepad bindings pre-set; remapping is opt-in. "Reset to defaults" prominent. |
| Caption timing lags combat | Caption events fire from audio-emit hook, not polling. Minimal latency. |
| Captions visually clutter screen | Customisable position (top / bottom), size (3 presets), max-on-screen-at-once cap. |
| Schema migration breaks existing saves | New settings all have defaults; missing fields pass through migration harmlessly. |
| `reduceFlashing` breaks feel for non-photosensitive players | It's opt-in; default off. Rest of JuiceSystem unchanged. |
| Assist Mode UI ships without effects wired | Intentional — Phase 2 fills in. Settings panel shows "(coming soon)" labels where applicable. |
| Remapping conflicts with future-added actions | `ActionKey` is a typed enum; new actions require adding to `ActionKey` + default bindings + migration. |

---

## 6. Kill criteria

- **Full PEAT audit complete** with no unresolved high-severity findings.
- **All five tonal palettes** pass Coblis simulator checks for protanopia + deuteranopia + tritanopia (no gameplay-critical hue confusion).
- **Remapping UI** works end-to-end on keyboard + gamepad (e2e smoke green).
- **Captions fire** for every SFX category + music cue + banter line (manual smoke against list).
- **Photosensitivity warning splash** shows on first launch, dismissed-once persists.
- **`reduceFlashing`** toggle actually reduces measurable flash frequency (re-run PEAT with toggle on).
- **`npm run ci:all`** green (lint + 3000+ vitest + build + e2e).
- **No crash path** with any combination of accessibility settings enabled.

If any of the six sub-items cannot be shipped within the sprint, drop the slowest (likely S6 Assist Mode scaffold) and ship the other five. S1 + S2 + S4 are the most critical.

---

## 7. Cross-references

- `docs/research/ACCESSIBILITY_RESEARCH.md` — full playbook this spec implements.
- `docs/DESIGN_SOUL.md` — Comfort matrix (existing) + Warmth Audit.
- `docs/ART_STYLE_BIBLE.md §Tonal palette map` — palette colour catalogue for colorblind audit.
- `docs/research/GAME_FEEL_RESEARCH.md §3.8, §7.5` — VFX decisions this audit retargets.
- `docs/research/MUSIC_ART_TECH_RESEARCH.md §6` — ShaderRegistry prereq (F1) for colorblind LUT.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §10.2` — content warning framework.

---

*Spec complete. Plan breaks into 6 milestones, one per sub-item: M1 PEAT audit + refactor, M2 colorblind audit + modes, M3 remapping UI, M4 captions scope, M5 reduceFlashing + splash, M6 Assist Mode scaffold.*
