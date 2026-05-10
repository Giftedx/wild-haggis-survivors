# Scene Refactor + Biomes + Endless Mode — Design Spec

**Date:** 2026-04-13
**Scope:** Three sequenced phases — `A → B → C` *(revised from C→A→B)*.

## Why this order

- **A first:** Biomes are additive, low-regression-risk, and deliver tangible player value. `GameScene.ts` refactor is deferred.
- **B second:** Endless builds naturally on biomes (inherits variety, re-seed cadence).
- **C last:** A refactor driven by concrete new requirements (biomes, endless) reveals which seams matter. Speculative refactor on a 2898-line file without visual regression testing is high-risk.

## Soul alignment

Every phase is measured against `docs/DESIGN_SOUL.md`:
- **Biomes** = Glesga-tinted world texture ("intae the bog, wee man").
- **Endless** = pride-in-mastery where it belongs; compassionate send-off.
- **Refactor** = craft coherence — one authored world, built clean.

---

## Phase C — GameScene de-monolith

**Target:** Reduce `src/scenes/GameScene.ts` from ~2898 lines to a thin orchestrator (~400 lines). Zero behavior change. All existing tests pass unchanged.

### Extractions (`src/scenes/game/`)

| Module | Responsibility |
|---|---|
| `CollisionRouter.ts` | All `physics.add.overlap/collider` wiring + handler callbacks. |
| `LevelUpFlow.ts` | Level-up modal trigger, card draw, reroll, evolution check, apply pipeline. |
| `RunLifecycle.ts` | State machine: idle → running → paused → victory/death. Owns pause/resume and end-of-run triggering. |
| `OverlayStack.ts` | Z-ordered overlay manager: level-up, pause, death, victory, tutorial. Prevents overlay-on-overlay bugs. |
| `SceneResetter.ts` | Pure "scene instance → blank slate" — the reset block currently at top of `create()`. |

### Contracts

Each module takes an `ISceneContext` (already exists in `src/core/ISceneContext.ts`) plus a minimal dependency object. No module reaches into `GameScene` directly; wiring is top-down.

### Gates

- `npm test` green (currently ~90 test files).
- `npm run build` clean.
- Manual smoke: start run → level up → pause → die → restart → victory path. No regressions.

---

## Phase A — Biome system

### Data (`src/data/biomes.ts`)

```ts
export type BiomeId = 'bog' | 'loch' | 'pine' | 'heather';
export type BiomeModifierKind = 'bogSlow' | 'lochKnockback' | 'pineConcealment' | 'heatherBloom';

export interface BiomeDef {
  id: BiomeId;
  nameKey: string;            // i18n
  paletteTint: number;        // ground tint
  textureKey: string;         // pre-baked 512x512 tileable
  ambientSfx?: string;
  spawnWeightMods: Partial<Record<string, number>>;   // enemyId → multiplier
  modifier: BiomeModifierKind;
  entryQuipKey: string;       // i18n toast
}
```

Four biomes for v1:
- **Bog** — brown/green palette, slows all entities ~15%, spawns more bogle-types.
- **Loch Edge** — blue/slate, knockback boost on player damage, fewer spawns (safer but exposed).
- **Pine Thicket** — dark green, visual concealment (enemies fade at >400px), more ambushers.
- **Heather Moor** — purple/pink bloom, XP gems worth +10%, more swift enemies.

### Spatial layout

- Seeded RNG (reuses `RunLifecycle.seed`) generates **4-6 voronoi seed points** across the world.
- Each seed gets a biome (even distribution + perturbation).
- Tile classification: `biomeAt(x,y)` = id of nearest seed. Precomputed on run start; cached in a grid.
- Daily seed → identical biome layout (important for leaderboard fairness in B).

### Renderer (`src/systems/BiomeRenderer.ts`)

- On first load: `BootScene` bakes 4 texture keys (512×512 tileable Graphics).
- Renders world floor in tiles; picks texture by nearest-seed lookup.
- Boundary blend: 64px soft gradient between adjacent biomes.
- Single tile layer — not per-biome layers — so draw count stays constant.

### Integrations

- `SpawnSystem.getNextEnemy()` multiplies weights by `biomes[playerBiome].spawnWeightMods`.
- `ProceduralMusicEngine.Conductor` gains `biome` axis → pad timbre preset per biome.
- `Minimap` tints regions.
- `Player.update()` applies current biome modifier.
- `JuiceSystem.toast()` on biome entry (throttled to once-per-biome-per-run).

### Gates

- New tests: `biomes.test.ts`, `BiomeRenderer.test.ts`, `SpawnSystem.biome.test.ts`.
- Daily seed produces identical biome layout twice in a row.
- Music transitions between biomes are smooth (no pops).

---

## Phase B — "After the Bell" endless mode

### Entry

Victory at 20:00 now shows two doors:
- **"Back tae the fire"** — existing shop/menu flow.
- **"Keep goin'?"** — Post-Bell begins. Run time keeps counting; state flips `postBell = true`.

### Escalation

Every 120s past victory:
- Enemy HP ×1.10 (compounding, capped at ×5).
- Enemy speed ×1.05 (capped at ×1.8).
- +1 elite slot.
- New **"Cursed"** enemy variants: existing enemies with purple particle aura + tint, +40% damage.
- Biome re-seed every 3 min (voronoi regenerates from new seeds; old regions fade out).

Boss cadence: 5min → 3min → 2min (stepped).

### Overcharged evolutions

- Once per weapon per run, after reaching legendary in Post-Bell: an **Overcharge** card can drop (rarity: mythic).
- Effect: +25% damage, +20% area, unique visual variant.
- Implemented via `data/upgrades.ts` new rarity tier and `WeaponSystem` level-6 handling.

### Closure

- Death in Post-Bell:
  - Unique Herd Chronicle entry: "Fell at {time} post-bell."
  - Updates `whs_save.endless.best` (saved via `SaveManager`).
  - Send-off toast: *"Ye went further than any haggis before ye."*
- New Deeds board tile: "First Post-Bell death", "10 min post-bell", "Any Overcharge taken".

### Integration

- `RunLifecycle.postBell: boolean` — gate for UI + escalation.
- `BiomeRenderer.reseed(time)` — called from RunLifecycle tick.
- `SpawnSystem.applyPostBellEscalation(secondsPast: number)`.
- `MainMenuScene` / Herd Chronicle surfaces endless best.

### Gates

- New tests: `postBellEscalation.test.ts`, `endlessSave.test.ts`.
- Saved `endless.best` survives version migration.
- No regression to normal 20-min victory for players who take door 1.

---

## Test strategy

- **C:** existing ~90 tests act as regression suite. No new tests required; if coverage gap found, backfill.
- **A:** 3 new test files. Deterministic seed tests are critical.
- **B:** 2 new test files. Save-migration test mandatory.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Refactor breaks subtle pause/restart edge cases | Smoke test checklist + existing scene-reuse tests. |
| Voronoi lookup hot path | Precompute grid (64×64) at run start; no per-frame voronoi math. |
| Music layer pops on biome transition | Crossfade over 1s in Conductor. |
| Endless invalidates daily leaderboard | Leaderboard scoped to "first death time", which is captured at 20:00 for victors. |

## Rollout

Each phase ships as its own commit chain. User reviews after each phase before next begins.

## Out of scope

- New enemies, new weapons (biome flavor uses existing roster via weight shifts).
- Online leaderboards (local only).
- New art assets beyond procedural biome textures.
