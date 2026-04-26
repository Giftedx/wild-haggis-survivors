# Scene Refactor / Biomes / Endless — Gap Audit

**Audit date:** 2026-04-26
**Charter:** `docs/top-10-tasks/05-scene-refactor-biomes-endless.md`
**Spec:** `docs/superpowers/specs/2026-04-13-scene-refactor-biomes-endless-design.md`

This audit walks the spec line-by-line against the live codebase to determine
what shipped, what is partial, and what remains for the deferred sub-areas.
Phase A in the original spec (= "GameScene de-monolith") is **not** in this
prompt's scope (it is prompt #10 / T401).

## Phase A — Biome system (spec §"Phase A")

| Sub-area | State | Evidence |
|---|---|---|
| `BiomeId` union (4 ids) | Shipped | `src/data/biomes.ts` `BiomeId = 'bog' \| 'loch' \| 'pine' \| 'heather'` |
| `BiomeDef` data | Shipped | `BIOMES` const w/ tint, weights, modifier, mood, ambientHaarDensity |
| Voronoi seed layout, daily-deterministic | Shipped | `BiomeManager.createBiomeLayout` + `BiomeManager.test.ts` |
| Tile / cell lookup precompute | Shipped | `LOOKUP_GRID_RES = 48`, baked at construct |
| `BiomeRenderer` overlay | Shipped | `src/systems/BiomeRenderer.ts` (seed-radius soft ellipses) |
| `SpawnSystem` biome weight integration | Shipped | `pickWeightedEnemy` uses `getBiomeWeightMods()` |
| Biome modifier on Player | Shipped | `Player.setBiomeModifier` + `BiomeController.tick` |
| Biome entry toast (once-per-biome-per-run) | Shipped | `BiomeController.toasted` set |
| Biome entry particle burst | Shipped | `JuiceSystem.biomeEntryBurst` (per-biome colour) |
| Biome music timbre axis | Shipped | `Conductor.biomeTimbre` + `getSmoothedBiomeTimbre` |
| Biome entry music accent | Shipped | `musicEngine.playBiomeAccent(moodTimbre)` |
| Ambient bed reactive | Shipped | `AmbientBedLayer` (biome-driven harmonic pad) |
| Biome-reactive haar density | Shipped | `BiomeController.onBiomeEnter` → `biomeHaarTarget` |
| Biome banter triggers | Shipped | banter `biome_change` tag + per-biome lines |
| Wildlife biome gating | Shipped | `WildlifeSystem` hares in heather/pine |
| **Minimap biome tint regions** | **Gap** | `Minimap.update` does not consult `BiomeManager`. Spec §"Integrations": *"Minimap tints regions"* not delivered. |
| `musicStateScratch.biomeTimbre` per-frame source | Partial | `GameScene.update` sets biomeTimbre from BIOMES[id].moodTimbre — works, test coverage thin. |

## Phase B — "After the Bell" endless (spec §"Phase B")

| Sub-area | State | Evidence |
|---|---|---|
| Victory door 1 (back to fire) | Shipped | `RunLifecycle.handleVictory` → transitionToGameOver (default) |
| Victory door 2 (keep goin'/Enter) | Shipped | `installPostBellKeyHandler` listens for Enter |
| `postBell` flag | Shipped | `RunLifecycle.postBell` |
| `getSecondsPastBell()` | Shipped | RunLifecycle public + ISceneContext optional method |
| `computePostBellMultipliers` step function | Shipped | `core/PostBellEscalation.ts` (HP/speed/elite/cadence/cursed) |
| Step-function caps (HP×5, speed×1.8, elite×4, cursed 40%) | Shipped | `PostBellEscalation.test.ts` covers caps |
| Post-bell HP/speed scaling on spawn | Shipped | `Enemy.applyPostBellScaling` + `SpawnSystem.spawnBurst` |
| **Post-bell elite slot bump** | **Gap** | `bonusEliteSlots` returned but `SpawnSystem` never reads it. |
| **Post-bell boss cadence (300 → 180 → 120)** | **Gap** | `bossCadenceSec` returned but unread. |
| **Cursed enemy variants** | **Gap** | `cursedChance` returned, no implementation in Enemy / SpawnSystem. |
| **Biome re-seed every 3 min in post-bell** | **Gap** | No `BiomeRenderer.reseed`, no tick wiring. |
| **Overcharge evolution rarity tier** | **Gap** | `Rarity` no `'mythic'`, no upgrade card, no level-6 path. |
| Post-bell send-off toast | Shipped | `RunLifecycle.handleDeath` → `ui.gameOver.post_bell_sendoff` |
| Endless save (`bestEndlessSeconds`) | Shipped | `save.ts` `recordPostBellBest`, schema v17 |
| Endless save migration round-trip | Partial | No explicit version-stepping migration test. |
| GameOver postcard `postBellSec` tag | Shipped | `gameOverPayload.postBellSec` + `formatClockTime` |
| Endless leaderboard / chronicle | Shipped | `bestEndlessSeconds` chronicle row |
| Past the Bell / Endless Endurance achievements | Shipped | `deedsProgress` covers both |
| Endless replay schema audit | Partial | Replays don't blow up at 30+ min, no explicit assertion. |

## Sub-areas in scope for this prompt

Ordered by commit-chain:

1. **Cursed enemy variants** — wire `cursedChance` in spawn loop; add
   `Enemy.markAsCursed()` (purple aura visual + +40% damage); pure helper
   for the roll math; vitest coverage.
2. **Post-bell elite slot bump + boss cadence** — `SpawnSystem` consults
   `getPostBellMultipliers().bonusEliteSlots` (cap raise) and
   `bossCadenceSec` for boss cadence. (Pure helpers + tests.)
3. **Post-bell biome re-seed every 3 min** — `BiomeController.reseed(rng)`
   that rebuilds layout + renderer; tick from RunLifecycle / GameScene
   based on `secondsPastBell`. Pure helper: `shouldReseedAtSec(...)`.
4. **Overcharge evolution rarity** — extend `Rarity` to `'mythic'`; add
   weight; gate to post-bell + already-legendary; once-per-run.
5. **Endless save round-trip migration test** — explicit vitest covering a
   pre-v17 save (no `bestEndlessSeconds`) loading + writing back at v17
   with the field present and zeroed.
6. **Minimap biome tint regions** — feed `BiomeManager` into `Minimap`,
   tint each cell at minimap scale before drawing dots.

## Out of scope for this prompt

- Phase A spec ("GameScene de-monolith" = T401) → prompt #10.
- Endless 30-min playtest log + screenshots → human/playtest.
- Endless-specific banter pool authoring → coordinate with B1 #6.
- ADRs 0007/0008 → spec already merged.

## Save schema posture

Current `SAVE_SCHEMA_VERSION = 17`. `bestEndlessSeconds` and
`bestIronmoorSeconds` already merge through `coerceInteger(..., 0)` in
`finalizeSaveCandidate`, so older saves silently gain the field at zero.
**Round-trip test gap is procedural, not architectural.** No bump needed
for the deferred sub-areas in this prompt.

## Bundle delta target

Charter bound: **+15 KB gzip** ceiling. Cursed visuals and overcharge
cards are heaviest; minimap tint is a few KB; reseed reuses existing
infra. Realistic delta < 5 KB gzip.

## Verification path

```
npm run lint
npm test
npm run build
```
