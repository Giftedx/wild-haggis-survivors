# Soul charter

Wild Haggis Survivors is a continuous-deployment passion project at [`wild-haggis-survivors.pages.dev`](https://wild-haggis-survivors.pages.dev). This doc is the north star for **what player-facing work feels like** when it lands well.

## Principles

1. **Handcrafted, warm, playful, brave.** Every player-facing moment should feel like one authored world — not generic survivors-genre furniture.
2. **The haggis fantasy is the centre.** Scrappy drift, stubborn survival, cheeky Scottish flavour. The drift is a feature; the warmth is a feature; the comedy is a feature.
3. **Failure is informative and compassionate.** Never shaming. A death screen is the right place for a warm Scots line and the next nudge.
4. **Progression beats are celebratory.** Level-ups, evolutions, boss kills, act completions — these are *moments*, not status updates.
5. **No placeholder feel.** UI, art, copy, sound. If a surface looks like it's waiting for the real version, it isn't ready.

## The pre-ship question

Before merging a player-facing change, ask:

> *Does this feel like a real game made by a person who cares?*

If yes, ship. If no, sit with what's missing — usually it's a moment that needs anticipation, payoff, or a beat of rest before the next event.

## For contributors

- **Balance data** lives in `src/config.ts` + `src/data/*`. Code consumes; balance work is data-only.
- **Player-facing copy** lives in `src/core/i18n.ts` + `src/core/i18n.scs.ts`, resolved via `t('namespace.key')`. No hardcoded strings in scenes.
- **Voice & tone** for new copy → [`VOICE_CARD.md`](VOICE_CARD.md). Two registers (Hearth + Edge), regional vocabulary, Do/Don't rewrites, anti-patterns.
- **Visuals** for new sprite work → [`ART_STYLE_BIBLE.md`](ART_STYLE_BIBLE.md). Palette anchors, signature motifs, silhouette test, inspiration wall.
- **Banter recipes** → [`BANTER_AUTHORING.md`](BANTER_AUTHORING.md). Two files per leaf (EN + SCS); the parity fence catches drift.
- **Engineering bar** → [`../CONTRIBUTING.md`](../CONTRIBUTING.md). The headline question, the CI gates, the chains, the invariants.

## Accessibility & comfort matrix

Every comfort knob in one glance. Persisted by `SettingsManager` (`whs_game_settings`) with an independent `settingsVersion` gate. `e2e/comfort-smoke.spec.ts` exercises the strictest combo (motionScale 0 + highContrastUi + captions + reduceParticles + banter off) through a full boss encounter in CI.

| Control | Type | Default | What it changes | Primary readers |
|---|---|---|---|---|
| `masterVolume` | slider 0–1 | 1.0 | Global SFX + music bus | `AudioSystem`, `ProceduralMusicEngine` |
| `sfxVolume` | slider 0–1 | 1.0 | SFX-only bus | `AudioSystem` |
| `musicVolume` | slider 0–1 | 1.0 | Music-only bus | `ProceduralMusicEngine` |
| `uiScale` | slider 0.8–1.4 | 1.0 | Scene text, buttons, HUD, minimap size | every scene |
| `motionScale` | slider 0–1 | 1.0 | Tween amplitude multiplier (0 = reduce motion) | `JuiceSystem`, boss intros, settings title breath |
| `screenShake` | toggle | on | Camera shake on kills and hits | `JuiceSystem.shake()` |
| `damageNumbers` | toggle | on | Floating damage text | `JuiceSystem.damageNumber()` |
| `reduceParticles` | toggle | off | Skips ambient decoration particles | MainMenu hearth, Settings heather strip, MenuScene |
| `reduceFlashing` | toggle | **on** | Caps screen flashes (≤ 0.4 alpha + 200 ms duration floor) | `JuiceSystem`, weapon VFX, scripts/check-flash-budget.mjs |
| `highContrastUi` | toggle | off | Swaps scene palettes to high-contrast variants | every scene's palette resolver |
| `captionsEnabled` | toggle | off | On-screen captions for audio events | caption system |
| `telemetryOptIn` | toggle | off | Emits `run_start` / `run_end` / subscriber events | `AnalyticsManager` |
| `skipActIntermissions` | toggle | off | Applies `DEFAULT_ROUTE_ON_SKIP` instead of the W2 picker | `GameScene.launchActIntermission` |
| `ironmoorMode` | toggle | off | W66 opt-in permadeath with wipe-on-death | `GameScene`, `SaveManager` |
| `banterFrequency` | cycle | Natural | Wheesht / Sparing / Natural / Gabby throttle | `BanterSystem` |
| `localeKey` | cycle | en | English baseline / Scots overlay (key-by-key fallback) | `setLocale` → every `t()` call |

**Comfort invariants** (enforced where practical):

- Settings persist across scene restart and browser reload (Comfort smoke asserts `motionScale`, `highContrastUi`, `captionsEnabled`, `banterFrequency`, `reduceParticles` all survive a boss encounter).
- `SettingsScene` respects its own `uiScale` + `highContrastUi`.
- `motionScale = 0` disables tween amplitude, not tween duration — layout timing stays consistent.
- `reduceParticles` gates ambient decoration only; gameplay-critical feedback (hit flashes, damage numbers if enabled) is never culled by this flag.
- The all-strict Comfort profile must never produce a page error (guarded by `e2e/comfort-smoke.spec.ts`).
- `reduceFlashing` defaults **on** because the live build's VFX has not been independently PEAT-audited. See README §"Photosensitivity" + `docs/A1_PEAT_AUDIT.md`.
