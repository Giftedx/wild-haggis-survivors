# A1 M1 — PEAT photosensitivity audit

> **Status:** Candidate audit log. Code-side cataloguing complete; PEAT
> tool-runs require a Windows machine with the
> [Photosensitive Epilepsy Analysis Tool](https://trace.umd.edu/peat/)
> installed and OBS captures of in-game moments. Fill rows as humans
> run the tool. See `docs/top-10-tasks/blocked/01-blocked-on-human.md`.

## Tool

- **PEAT** (Trace Center, Univ. of Maryland) — free for non-commercial
  web audit. WHS as a browser-delivered indie game qualifies.
- **WCAG 2.2 SC 2.3.1** thresholds applied:
  - ≤3 general flashes / second
  - ≤3 red flashes / second
  - Flash area ≤25% of screen at standard viewing
  - No sustained flashing > 5 seconds
  - No saturated-red strobing anywhere

For Steam release, upgrade to Harding FPA (commercial). PEAT covers v1.

## Methodology

1. Apply M5 `reduceFlashing: false` in Settings (worst case — strict bar
   needs both modes pass).
2. Capture 30s clip at 60fps via OBS at native 1280×720 game viewport.
3. Feed clip through PEAT desktop tool.
4. Record the General-flash, Red-flash, and Spatial-pattern reading per
   target.
5. If any reading **fails** (`>3 flashes/s` general or red, sustained
   >5s, saturated-red strobe), file the offending VFX path under
   *Refactoring applied* and re-run after the fix.
6. Re-run with `reduceFlashing: true`. The toggle MUST pass strictest
   bar.

## Per-VFX targets

| # | Moment | Code path | Capture scenario | reduceFlashing OFF — PEAT result | reduceFlashing ON — PEAT result | Notes |
|---|--------|-----------|------------------|-----------------------------------|----------------------------------|-------|
| 1 | Kill bursts (basic enemy) | `JuiceSystem.showKillBurst` (src/systems/JuiceSystem.ts:334) | AoE weapon at level 5, act-1 mid-density spawn, 60s | _PEAT pending_ | _PEAT pending_ | Uses `scaledFlashAlpha` already; capped at 0.4 under reduceFlashing. Saturated-red avoided (color is per-enemy tint). |
| 2 | Damage numbers | `JuiceSystem.showDamageNumber` (src/systems/JuiceSystem.ts:282) | High-DPS scenario (claymore swarm), 30s | _PEAT pending_ | _PEAT pending_ | Yellow CRIT_GOLD `#ffdd44` for crits, white for normal. No flash; pure motion. Photosensitivity-low risk by design. |
| 3 | flashWhite on hit-confirm | `JuiceSystem.flashWhite` (src/systems/JuiceSystem.ts:688) | Boss hit cycles, 30s | _PEAT pending_ | _PEAT pending_ | `scaledFlashAlpha(0.4)` base, duration 200ms default — meets photosensitive bar even without toggle. Honours reduceFlashing duration floor. |
| 4 | flashRed on player damage | `JuiceSystem.flashRed` (src/systems/JuiceSystem.ts:758) | Player-tank loadout, take 5+ hits in 30s | _PEAT pending_ | _PEAT pending_ | `scaledFlashAlpha(0.25)` base — well under WCAG general-flash threshold. Saturated-red caveat: `0xff0000` * 0.25 alpha ≈ low energy. Verify via PEAT. |
| 5 | Crit confirms (combo + flash) | Combined `flashWhite` + `showDamageNumber` | High-crit run, 30s | _PEAT pending_ | _PEAT pending_ | Combo + crit can emit ~10 flashes/s during a sustained burst. **Highest expected risk row.** Aggregator may be needed if PEAT flags. |
| 6 | Combo milestone burst (5/10/25/50/100) | `JuiceSystem.comboMilestoneBurst` (src/systems/JuiceSystem.ts:720) | 100-combo chain via slot machine, 30s | _PEAT pending_ | _PEAT pending_ | Uses `scaledParticleCount`. Particle count scales but emit cadence does not. |
| 7 | Combo milestone 250/500/1000 | `JuiceSystem.comboMilestoneBurst` reserved tier | Run with maxed area + ricochet, push past 250, 30s | _PEAT pending_ | _PEAT pending_ | Reserved celebrations — design from day one to be seizure-safe. Likely under-tested in real runs. |
| 8 | Boss death spectacle | `JuiceSystem.bossDeathSpectacle` (src/systems/JuiceSystem.ts:860) | Defeat Gordon (act 1 boss), capture full sequence | _PEAT pending_ | _PEAT pending_ | 30 particles + 2 rings + 1 delayed ring. Spectacle is one-shot — sustained-flash risk low. PEAT focus: red-flash threshold in expanding rings. |
| 9 | Mid-run boss death | `JuiceSystem.midRunBossDeathSpectacle` (src/systems/JuiceSystem.ts:948) | Defeat any non-act-completion boss | _PEAT pending_ | _PEAT pending_ | 15 particles + 1 ring. Lighter than full spectacle. |
| 10 | Evolution chest pickup ceremony | `JuiceSystem.evolutionSpectacle` (src/systems/JuiceSystem.ts:1010) | Pick weapon at level 5, then matching passive, then evolution card | _PEAT pending_ | _PEAT pending_ | Multi-stage moment: legendary gold beam + screen-wide glow. Watch for sustained-flash >5s. |
| 11 | Hit-freeze transitions | `JuiceSystem.hitFreeze` (src/systems/JuiceSystem.ts:1153) | Kill chain, 60s | _PEAT pending_ | _PEAT pending_ | 20ms `timeScale = 0`. Visual artefact: very brief still-frame. Not a flash per se; included for completeness. |
| 12 | Slow-motion onset | `JuiceSystem.slowMotion` (src/systems/JuiceSystem.ts:1172) | Boss low-HP trigger, 30s | _PEAT pending_ | _PEAT pending_ | Time-dilation transition. No flash; included for ramp-rate audit. |
| 13 | Victory sparkle rain | `JuiceSystem.victorySparkleRain` (src/systems/JuiceSystem.ts:1181) | Defeat taxman (final boss) | _PEAT pending_ | _PEAT pending_ | Long-duration celebration. **Sustained-flash >5s risk.** Watch closely. |
| 14 | Biome entry burst | `JuiceSystem.biomeEntryBurst` (src/systems/JuiceSystem.ts:1218) | Cross biome boundary | _PEAT pending_ | _PEAT pending_ | Per-biome tint burst. Soft brief; low risk. |
| 15 | Haar shader transitions | `src/systems/shaders/HaarFog.ts` + `JuiceSystem` haar fade | Biome → Moor act intermission, 30s | _PEAT pending_ | _PEAT pending_ | F1 shipped 2026-04-24. Density ramp time ≥ 2s under reduceFlashing per `scaledHaarRampMs`. Verify ramp rate. |
| 16 | Level-up flash | `LevelUpFlow` panel render (src/scenes/game/LevelUpFlow.ts) + JuiceSystem flashWhite | Hit level-up at full speed, 30s | _PEAT pending_ | _PEAT pending_ | Uses shared `scaledFlashAlpha` path. |
| 17 | Spawn impact ring (xp pickup) | `JuiceSystem.spawnImpactRing` (src/systems/JuiceSystem.ts:192) | XP-vacuum pickup chain (post-Lure relic), 30s | _PEAT pending_ | _PEAT pending_ | Per-pickup ring. Density during XP-magnet pulse risks ≥3/s. |
| 18 | Trail particles | `JuiceSystem.spawnTrail` (src/systems/JuiceSystem.ts:314) | Fast move with bagpipe-trail loadout, 30s | _PEAT pending_ | _PEAT pending_ | Continuous emit, low alpha per particle. Aggregator unlikely to fail; verify regardless. |
| 19 | Toast notifications (achievement / unlock) | `JuiceSystem.showToast` (src/systems/JuiceSystem.ts:591) | Trigger 3 achievements in 60s | _PEAT pending_ | _PEAT pending_ | Single-lane queue (P2.6 fix). Toast tween fade is 350ms. Brightness bump on entry — verify general-flash bar. |
| 20 | Boss enrage feedback | EventBus `bossEnraged` → `JuiceSystem.flashRed` + screen tint | Boss low-HP enter, 30s | _PEAT pending_ | _PEAT pending_ | One-shot red flash, gated by `scaledFlashAlpha`. Saturated-red caveat. |
| 21 | Beltane fire overlay (seasonal) | `src/scenes/game/seasonalOverlays/BeltaneOverlay` | Beltane active, 30s gameplay | _PEAT pending_ | _PEAT pending_ | Background palette shift. **Sustained-saturated-red risk** if not capped. |
| 22 | Burns Night confetti / pipes stinger | Burns event audio + JuiceSystem celebration | Burns Night active, trigger pipes stinger | _PEAT pending_ | _PEAT pending_ | Sparkle burst + audio cue. Audio out of PEAT scope; visual: brief. |
| 23 | Standing-stones boon flash | `GameScene.caption('standing_stones_pick'…)` + JuiceSystem moor moment | Resolve standing-stones moor moment | _PEAT pending_ | _PEAT pending_ | Single bright pulse on pick. Low risk; included for completeness. |
| 24 | Curse application overlay | `CurseScene` activation | Apply any curse via Crone | _PEAT pending_ | _PEAT pending_ | Static panel; no flash. Listed for completeness. |
| 25 | Damage vignette (curse-active) | `JuiceSystem.update` low-HP fraction tween | Drop below 30% HP | _PEAT pending_ | _PEAT pending_ | Pulse rate scales with HP fraction — at 5% HP could approach 1Hz. Verify never exceeds 3/s. |

## Photosensitivity guarantees already in place (M5)

The following ship with audited code paths and unit-test coverage:

- `scaledFlashAlpha(base)` — caps flash alpha at **0.4** when
  `reduceFlashing: true` (`src/core/a11yMotion.ts`).
- `scaledFlashDurationMs(base)` — floors flash durations at **200ms**
  under `reduceFlashing` (turns strobes into ramps).
- `scaledParticleCount(base, min)` — caps particle emit per-event.
- `JuiceSystem.flashWhite/flashRed/showKillBurst` all route through
  `scaledFlashAlpha`. (Confirmed in `src/systems/JuiceSystem.test.ts`.)
- `HaarFog` density ramp floored to 2000ms under reduceFlashing.

Therefore a PEAT pass with reduceFlashing **on** should be near-trivial.
The risk is reduceFlashing **off** — that is the path most players use.

## Refactoring applied

_Empty until PEAT runs flag specific failures. When a row fails:_

1. _Identify offending emitter from the table above._
2. _Apply one of: lower base alpha (cap below 0.5), lengthen duration
    above the strobe-rate threshold, desaturate red component, drop a
    whole emitter to motion-only._
3. _Re-run PEAT with reduceFlashing both off and on._
4. _Note refactor commit hash + retest result in this section._

## Re-audit cadence

Every player-facing release that touches `JuiceSystem`, `LevelUpFlow`,
`BootScene` boot effects, biome shaders, or boss spectacle code MUST be
re-PEATed before ship. CI cannot enforce this; the discipline lives
here in the audit log. Add a row per fresh capture; never overwrite a
row.

## Cross-references

- `docs/research/ACCESSIBILITY_RESEARCH.md` §2.5 — photosensitivity
  engineering playbook.
- `docs/superpowers/specs/2026-04-23-accessibility-foundation-design.md`
  §S1 — original spec.
- `docs/superpowers/plans/2026-04-24-a1-m5-manual-playtest-followups.md`
  F1 — PEAT re-audit followup created at M5 ship.
- `docs/A1_COLORBLIND_AUDIT.md` — sister audit for hue accessibility.
