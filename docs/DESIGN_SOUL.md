# Design polish & UX hardening — Soul charter

This document anchors **player-facing tone**, **UX priorities**, and **where “soul” must show up** so shipped work stays coherent. Implementation details live in code (`src/core/i18n.ts`, scenes, `JuiceSystem`, HUD, etc.); this file is the **north star**.

---

## Soul charter (non-negotiable)

- The game must feel **handcrafted, warm, playful, and brave** in every player-facing moment.
- The **haggis fantasy** (scrappy drift, stubborn survival, cheeky Scottish flavor) is the **emotional center**.
- **Failure** is **informative and compassionate**, never shaming.
- **Progression beats** feel **celebratory and human**, not transactional.
- No major surface ships with **placeholder-feeling** UI, art, copy, or sound.

---

## Soul design principles

1. **Kindness in friction** — Always explain consequences and next steps clearly.
2. **Joy in motion** — Movement and combat feedback feel alive and characterful.
3. **Pride in mastery** — Improvements reward learning, not only stat stacking.
4. **Cozy between storms** — Non-combat spaces emotionally decompress the player.
5. **Craft coherence** — Typography, icons, wording, and audio feel like **one authored world**.

---

## The tonal spectrum

Scotland is a real place with real emotional complexity. Masterpiece-grade Scottish feel ranges fluidly across five registers — the game should *move* across them, not pick one. Each register calls for its own palette, music texture, pacing, and voice.

| Register | Feeling | Calls for |
|----------|---------|-----------|
| **Hearth** | warm, welcoming, affectionate | Gran's croft; Moor Road intermissions; golden light; hearth voice; soft low tempo |
| **Wild** | windswept, lonely, vast | Cairngorm plateau; empty moors at dawn; slow pibroch drone; silence; open compositions |
| **Fey** | otherworldly, tricksy, magical | Seelie/Unseelie encounters; fairy pools; crystalline SFX; shifting palette; ambiguous banter |
| **Grave** | heavy, historical, sombre | Culloden echoes; Glencoe memorial; desaturated palette; respectful banter; held silence |
| **Wild Comedy** | absurd, cheeky, sharp | Buckie ned scuffles; Limmy-edge moments; deep-fried Mars bar pickups; sodium-amber streetlights |

**Rule.** *Design every scene to sit deliberately in one register, then transition into the next with care.* Peaks-and-valleys across a run is a tonal journey, not just a difficulty curve.

---

## Soul weave matrix (where soul must appear)

| Area | Intent |
|------|--------|
| **Run start** | Identity handoff (variant fantasy + intent) in the **first few seconds**. |
| **Combat** | Readable, flavorful weapon feedback; meaningful micro-celebrations. |
| **Level-up & evolution** | Excitement **plus** clarity; avoid sterile “spreadsheet choice” feeling. |
| **Failure & recovery** | Supportive language, clear takeaway, hopeful replay path. |
| **Meta & menus** | Tactile responsiveness, clear purpose, cozy tone; no dead/silent flow. |
| **Accessibility / readability** | Comfort is part of kindness, not an optional afterthought. |

---

## The Great Moment Recipe

Every moment that's meant to land — evolution pickup, boss kill, act complete, first-time encounter, lineage beat — follows the same seven-ingredient stack. If a moment feels flat, diagnose by checking which ingredient is missing.

1. **Pre-condition** — the moment is *earned* (skill, time, patience, rarity). Never automatic.
2. **Anticipation beat** — a visible/audible build-up tells the player something's coming.
3. **Short peak** — 200–800 ms of time-dilation or focused attention. Not longer; not shorter.
4. **Multi-channel feedback** — audio + visual + input + music + camera all fire together.
5. **Narrative reframe** — the moment *means something* in the game's world, not just mechanically.
6. **Rest beat after** — 500 ms of held silence lets the moment land. Never cut straight to the next event.
7. **First-time bonus (optional)** — reserved banter/music/VFX that *only* fires on the first occurrence of this event, ever.

Reference: `docs/research/GAME_FEEL_RESEARCH.md` §2 for eight deconstructed examples.

---

## The Warmth Audit

Before shipping any new system, ask: *does this make the player feel warm, or cold?*

**Cold systems:**
- Punitive mechanics without kindness.
- Information hidden to manufacture difficulty.
- Unspoken "you failed because you're bad."
- UI that fights the player.
- Features that grind for their own sake.
- Voice that goes clinical or corporate.

**Warm systems:**
- Forgiveness and cushion (buffer frames, coyote time, edge-snap).
- Transparent mechanics explained in-context.
- Every failure has a reframe (*"ye learned summit, eh?"*).
- UI that anticipates the player's next want.
- Every investment of time has a visible return.
- Voice that's an arm around the shoulder.

*Apply every few months, and every time a new system ships.*

---

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

---

## Objectives (execution order)

1. **Stabilize high-impact UX first** — Truthful HUD, non-overlapping results, clear progression language.
2. **Prevent regressions** — Turn critical design assumptions into **tests** where practical (i18n keys, layout contracts, copy that must not regress).
3. **Defer broader foundation** — Icons/accessibility schema expansions **after** shipping blockers are resolved.
4. **Ship bar** — Each shipped change should satisfy the Soul Charter in **function**, **tone**, and **feel**.

---

## The Soul Check (pre-ship gate)

Before merging any player-facing change, walk through these six quick questions:

1. **Warmth** — does this feel like an arm around the shoulder? (Run the Warmth Audit above.)
2. **Clarity** — can a first-time player parse what's happening in 3 seconds?
3. **Tone** — is the register (Hearth / Wild / Fey / Grave / Wild Comedy) deliberate?
4. **Voice** — if there's copy, does it match `VOICE_CARD.md` and sit in the right register?
5. **Moment stack** — if this is a "moment" (evolution, boss kill, etc.), does it tick the 7-ingredient recipe?
6. **Kindness** — does failure feel supportive? Does success feel earned?

A "no" on any question doesn't block the change — but the author should know *why* and have a plan. Soul isn't about perfection; it's about intention.

---

## For contributors

- Prefer **data-driven** balance in `src/config.ts` and `src/data/*`; prefer **copy** in `src/core/i18n.ts` for player-facing strings.
- **HUD, pause overlay, boss warnings, treasure toasts, upgrade feedback, and boot splash title** should use `t('ui…')` (or card/evolution keys resolved through `t`) — not hardcoded literals in scenes — so voice and future locales stay coherent.
- When adding toasts, banners, or overlays: match existing **warm Scots-tinged** voice; avoid cold system jargon unless it is clearly diegetic.
- Before claiming work is done: `npm test` and, for shippable changes, `npm run build` (see `AGENTS.md`).

---

## Research foundation

The deep material that underpins this charter. Consult when designing new systems, writing new specs, or onboarding:

- `docs/research/ROGUELITE_RESEARCH.md` — 25 roguelite games deconstructed; structural patterns; WHS gap analysis.
- `docs/research/SCOTTISH_RESEARCH.md` — folklore, geography, history, culture (gazetteer-style); immediate content mining.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md` — comprehensive Scottish reference across 25 topics; the encyclopaedia companion.
- `docs/research/GAME_FEEL_RESEARCH.md` — craft canon (Nijman, Sakurai, Thorson, Korb); moment anatomy; toolkit.
- `docs/research/MUSIC_ART_TECH_RESEARCH.md` — Phaser 3 + Web Audio + WebGL technical layer; procedural music; shader patterns.

Citations from specs and plans back into these docs keep the knowledge graph alive.
