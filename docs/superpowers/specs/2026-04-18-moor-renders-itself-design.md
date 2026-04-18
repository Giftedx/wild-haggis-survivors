# The Moor Renders Itself — design spec

**Date:** 2026-04-18
**Scope:** Multi-phase art / animation / world / audio push that shifts the
game's identity surface from text-heavy toasts + captions + banter to
procedurally-rendered visuals + reactive sound. Procedural-only (no PNG
assets, no external art team). Each phase ships standalone as a flagship.

---

## 1. Problem statement

### Player outcome

The game currently leans hard on words to carry identity — banter toasts,
caption strips, entry announcements, boss warnings, moor-moment narration,
reliquary grant copy, stone-boon descriptions, route-pick verbiage. Recent
pass (W18 Phase B, W2 Moor Road) added ~300+ new leaf keys. The screen is
dense with text during combat, the player's eye is pulled away from the
action, and the game's strongest features (art and music) are
underrepresented.

The player outcome: **the haggis looks different every run, the moor feels
alive around it, the music + sound tell more of the story than the text
ever could, and text retreats to the places it genuinely earns its keep
(boss warnings, banter soul moments, accessibility captions).**

### Design / craft outcome

Every shipped system in this push compounds on the previous:

- An **animation layer** makes every subsequent visual change live.
- A **compositional haggis body** turns passive/weapon pickups into
  Isaac-style visible build accumulation — "this run's silhouette is
  this run's story".
- **World depth** (flora + weather + wildlife + terrain) turns the moor
  from an empty canvas into a place.
- **Reactive music + sound** reads from every system above and replaces
  redundant text with audio cues.

The craft outcome: a procedural-art maturity leap that honours the
DESIGN_SOUL charter (handcrafted, warm, coherent, Scottish) without
spending money on an art team, adopting pixel atlases, or breaking the
offline-first + replay-determinism contracts.

---

## 2. Non-goals

Explicitly out of scope for this spec:

- **No PNG / pixel-art assets.** No art-team dependency. No atlas pipeline.
  All visuals stay in `BootScene` + runtime `Graphics` compositing.
- **No skeletal animation rig** (W71 stays rejected at this scope).
- **No online / multiplayer** (W82 offline-first doctrine preserved).
- **No 3D or alternate camera.**
- **No voice acting** (banter stays text, just reduced in density).
- **No live-instrument music** (CP1 stays rejected — procedural engine
  only).
- **No ECS / engine rewrite.** Current `src/scenes/game/` modular layout
  from R3/R3a stays authoritative.
- **No save-schema content-pack system** (the prior "Moor as Platform"
  pitch was torn apart and rejected — see session transcript).
- **No reverb / 3D audio spatialisation.**
- **No day/night cycle or seasonal MoorState** — possible follow-up
  flagships but not in this push.

---

## 3. Design principles

1. **Procedural depth over procedural breadth.** Draw fewer things with
   more craft per drawing. Layered compositions beat single-texture
   sprites.
2. **State-reactive, not wall-clock random.** Every animation, every
   audio trigger, every weather state is a pure function of game state +
   seeded RNG + scaled time. Preserves T1 replay determinism.
3. **Hot-path aware.** Off-screen entities skip draw(); animation clock
   runs at 10 Hz not 60 Hz; flora batched per voronoi cell; wildlife
   capped per biome; audio throttled via existing `SFXManager`.
4. **Each phase ships as a flagship.** No phase depends on a later phase
   existing. Reversible.
5. **Text stays where it earns its keep.** Cut biome-entry toasts, cut
   low-HP toast, reduce moor-moment frequency. Keep boss warnings, keep
   banter (the soul), keep accessibility captions.
6. **Pattern over volume.** Each phase ships an MVP that proves the
   pattern — 3-6 accessories, 1 biome, 1 wildlife, 1 weather. Follow-up
   ships apply the pattern to the long tail.

---

## 4. Phase 1 — Animation Foundation

### Component

Runtime procedural animation layer. State machine + per-frame drawing
dispatcher + shared frame clock.

### New modules

```
src/animation/
├── animationStates.ts      · pure state-transition logic (tested)
├── frameClock.ts           · shared 10 Hz clock from scaledDelta
├── AnimationController.ts  · per-entity state + clock owner
└── frameDrawers/
    ├── haggisFrames.ts     · player body poses per state
    ├── enemyFrames.ts      · shared enemy-animation primitives
    └── bossFrames.ts       · boss-specific
```

### States

```
idle | walking | attacking | hurt | celebrating | dying
```

Transition rules:

- `idle` → `walking`: velocity above threshold.
- `walking` → `idle`: velocity below threshold.
- `* → hurt`: `takeDamage` edge (fixed 120 ms window).
- `hurt → walking/idle`: timeout.
- `* → attacking`: weapon-fire edge (for melee weapons — claymore, caber).
  Projectile weapons skip this state.
- `* → celebrating`: boss kill / level up (time-bounded).
- `* → dying`: `hp <= 0`.

All transitions pure — evaluated in `animationStates.ts:evaluateTransition(current, signals): next`.

### Integration

- `Player.ts` + `Enemy.ts` each hold an `AnimationController`.
- `update()` calls `controller.tick(scaledDelta, signals)` then
  `controller.draw()` for on-screen entities.
- Existing procedural sprite textures become the idle base; animation
  overrides the `Graphics` object each clock tick.
- Existing `wobblePhase` on `Player` retires (replaced by walking
  cadence).

### Hot-path protection

- Off-screen entities skip `draw()` — use existing `SpatialCulling`.
- Animation clock ticks at 10 Hz (~100 ms), not every Phaser frame.
- Single shared `FrameClock` — one tick, many consumers.
- LOD: bosses + player redraw every clock tick; regular enemies skip
  every other tick.
- Frame-budget gate: no FPS regression under `AutoBattler` stress test
  (10× time scale, 200 enemies).

### Exit criteria

- `Player` uses `AnimationController` for all visual states.
- `wobblePhase` retired from `Player`.
- 3 enemy archetypes animated: `chase`, `ranged`, `dive`.
- Hurt-state animation on `takeDamage` for player + all enemies.
- ~25 pure helper tests (state transitions, frame math, clock math).
- No FPS regression under AutoBattler stress.
- All existing tests green; lint + build clean.

### Ship order

1. `animationStates.ts` + tests (state transitions, pure).
2. `frameClock.ts` + tests (tick math, LOD gating).
3. `AnimationController.ts` + tests (integration glue).
4. `haggisFrames.ts` — `idle` + `walking` + `hurt` first (3 of 6 states).
5. Wire `Player` → controller. Remove `wobblePhase`. Commit.
6. Add `celebrating` (boss kill / level up). Commit.
7. Add `dying`. Commit.
8. Add `attacking` for melee weapons. Commit.
9. Replicate to chase-archetype enemy (buckfast_ned). Commit.
10. Replicate to ranged + dive archetypes. Commit.

### Phase 1 non-goals

- Skeletal rig / bones.
- Accessory layers on haggis (Phase 2).
- Wildlife / terrain animation (Phase 3).
- Audio hooks into animation states (Phase 4).
- Projectile-weapon attack frames (static carry in Phase 2, attack
  animation as a later polish pass).

---

## 5. Phase 2 — Haggis-Wears-Build

### Component

Isaac-style compositional haggis body. The haggis becomes a `Container`
whose layered procedural children are the worn passives + carried weapons.
Every pickup visibly drapes.

### New module

```
src/entities/haggisComposition/
├── HaggisContainer.ts       · Container lifecycle, layer stack
├── AccessoryDrawer.ts       · interface + DrawCtx type
├── accessoryRegistry.ts     · id → drawer map
└── drawers/
    ├── sporran.ts
    ├── tamOShanter.ts
    ├── kilt.ts
    ├── claymore.ts
    ├── caberToss.ts
    └── bagpipes.ts
    └── … (11 more post-MVP)
```

### Container layout

```
HaggisContainer (Phaser.GameObjects.Container)
├─ body        · existing Sprite + procedural texture (variant palette)
├─ layer_behind  · claymore on back, kilt-back-flutter
├─ layer_body    · sporran, sash, flask, irn-bru, loch-vial
├─ layer_front   · kilt-front-flutter, shield on arm, held-weapon
└─ layer_above   · tam, thistle crown
```

Each layer is one `Graphics` object. On animation tick, iterate owned
accessories in depth order and redraw. Body stays a Sprite so existing
variant texture generation is unchanged.

### AccessoryDrawer contract

```typescript
interface AccessoryDrawer {
  readonly id: PassiveKey | WeaponKey | EvolvedWeaponKey;
  readonly depth: 'behind' | 'body' | 'front' | 'above';
  draw(g: Phaser.GameObjects.Graphics, ctx: DrawCtx): void;
}

interface DrawCtx {
  cx: number;
  cy: number;
  bodyRadius: number;
  frameT: number;           // 0..1 within current animation frame
  state: AnimationState;    // from Phase 1
  velocity: { x: number; y: number };
  facing: number;           // player.rotation radians
  variantPalette: VariantPalette;
}
```

Pure — testable, replay-deterministic. Sway / bob / flutter computed
from `frameT + velocity + state`, not wall-clock time.

### Accessory roster

**9 passives:** sporran, kilt, tam_o_shanter, whisky_flask, irn_bru,
loch_water, thistle_crown, highland_shield, tartan_sash.

**8 weapons:** claymore, caber_toss, bagpipes, bagpipe_blast,
thistle_shot, scotch_mist, haggis_hurler, nessie_tentacle.

### MVP scope — 3 passives + 3 weapons

First six chosen to exercise every depth layer:

| Accessory | Layer | Proves |
|-----------|-------|--------|
| `sporran` | body | sway-with-walking animation from Phase 1 |
| `tam_o_shanter` | above | above-body layer + rotation-with-facing |
| `kilt` | front+behind | dual-layer (front flutter overlaps back) |
| `claymore` | behind | weapon-on-back; facing-rotated |
| `caber_toss` | front | shouldered with attacking-state swing |
| `bagpipes` | body | body-hugged + breath-puff particles |

After MVP: remaining 6 passives + 5 weapons each ≤1 hr using the same template.

### Integration

- `Player.ts` owns `ownedAccessories: AccessoryDrawer[]` array.
- On `addPassive(key)` / `addWeapon(key)` → push drawer from
  `accessoryRegistry`.
- On animation tick → sort by depth, redraw each layer via accessories'
  `draw(g, ctx)`.

### Exit criteria

- `HaggisContainer` refactor landed without breaking existing behaviour.
- 3 passives + 3 weapons draw + animate on the haggis.
- Pickup → accessory child spawn wired through existing passive/weapon
  code paths.
- Game-over screen shows assembled silhouette (the run's build in one
  image).
- ~20 pure drawer unit tests (layout math, depth ordering).
- No FPS regression under AutoBattler stress.
- Pattern doc `docs/ACCESSORY_AUTHORING.md` shipped.

### Ship order

1. `HaggisContainer` refactor (invisible change, groundwork). Commit.
2. `AccessoryDrawer` interface + `DrawCtx` + tests. Commit.
3. Drawer `sporran` + pickup wiring. Commit.
4. Drawer `tam_o_shanter`. Commit.
5. Drawer `kilt` (dual-layer proof). Commit.
6. Drawer `claymore`. Commit.
7. Drawer `caber_toss` (attacking-state integration). Commit.
8. Drawer `bagpipes`. Commit.
9. Game-over screen silhouette render. Commit.
10. `ACCESSORY_AUTHORING.md`. Commit.

### Phase 2 non-goals

- Remaining 11 accessories (post-MVP follow-ups).
- Evolved-weapon distinct drawers (Phase 2.5 follow-up).
- Per-variant body-shape differences beyond palette (Phase 2.5).
- Projectile-weapon attack frames (static carry in MVP).

---

## 6. Phase 3 — World Depth

### Component

Biome-driven procedural world rendering: flora, terrain features, weather,
wildlife. Text reduction of biome entry toasts happens here.

### New module

```
src/scenes/game/WorldRenderer/
├── BiomeFlora.ts          · flora species + placement + sway
├── floraConfig.ts         · per-biome species/density/clustering
├── TerrainFeatures.ts     · cairns, ruined crofts, waymarker stones
├── WeatherLayer.ts        · particle overlay + palette shift
├── weatherState.ts        · pure state (cycle timing, seed-deterministic)
├── Wildlife.ts            · entity pool, spawn, despawn
└── wildlifeBehavior.ts    · flee / graze / soar / cluster (pure)
```

### Sub-systems

**Flora:** procedural heather / thistle / grass tufts / pine / bog reeds
/ loch rushes. Drawn once per biome voronoi cell at seed time. Swaying
via Phase 1 clock. Static Sprites with procedural textures; batched into
single `Graphics` per voronoi cell.

**Terrain features:** rare static features — cairns, ruined crofts,
waymarker stones, bones, wheel ruts. Sparse handcrafted clusters.
Scatter count scales with world size. Sprites (not redrawn) since static.
Depth sorted below entities.

**Weather:** ambient overlay (rain streaks, mist wisps, snow drift,
aurora bands) + palette shift. Cycles over game-time (60–120 s cycles).
No mechanical effects (haar_wraith fog stays separate). Particle pool
reused.

**Wildlife:** non-combat entities — deer, hares, eagles, sheep, rooks,
otters. Flee / graze / soar / cluster behaviours. Pass-through overlap
(no damage, no XP). Animated via Phase 1 primitives.

### Text reduction (tabulated)

| Current toast / caption | Visual replacement | Verdict |
|-------------------------|--------------------|---------|
| `ui.biomes.bog.entry` | Flora bloom swirl + palette shift on entry | **CUT** |
| `biomes.loch.entry` | Water ripples + reed bloom | **CUT** |
| `biomes.pine.entry` | Pine shadow fall + needle drift | **CUT** |
| `biomes.heather.entry` | Purple bloom ripple outward | **CUT** |
| `banter.biome_change.*` | Variant voice per biome — keep | **KEEP** |
| `banter.moor_moment.*` | Ambient ecology carries some weight | **REDUCE** |
| Boss warning toasts | High-stakes moment, needs text | **KEEP** |
| Accessibility captions | WCAG compliance | **KEEP** |

Net: 4 biome-entry toasts removed; banter (soul) preserved; moor-moment
density reduced.

### MVP scope — heather biome fully dressed

- Heather clumps + thistle patches at density across heather voronoi
  cells.
- Sway animation tied to Phase 1 `frameClock`.
- 1 wildlife species — **hare** (hops, flees from player, despawns
  off-camera).
- 1 weather beat — **mist drift** (ambient; no mechanical effect;
  ~90 s cycle).
- Text cut: `biomes.heather.entry` toast removed → purple bloom ripple on
  entry.
- ~3 cairn / waymarker features scatter at biome seed time.

Follow-up ships after MVP: `bog` + `loch` + `pine` each ~1 day using the
pattern. Each = 1 flagship.

### Hot-path protection

- Flora batched per voronoi cell; only visible cells redraw.
- Wildlife capped active count (≤ 30 per biome).
- Weather particle pool.
- Off-screen flora cells skip sway updates entirely.
- Seed-determinism: flora placement + weather cycle from `runRng`.

### Exit criteria

- Heather biome fully dressed (flora + weather + 1 wildlife).
- Entry toast replaced with visual bloom.
- Pure helpers tested (flora placement, wildlife behaviour, weather
  state).
- No FPS regression under AutoBattler stress.
- Seed-determinism: same seed → same flora + wildlife + weather cycle.
- Pattern doc `docs/BIOME_DRESSING.md` shipped.

### Ship order

1. Flora species primitives (heather, thistle, grass tuft) + tests.
2. `BiomeFlora` placement into voronoi cells at biome seed. Commit.
3. Flora swaying via Phase 1 clock. Commit.
4. Hare wildlife — draw + flee behaviour + spawn logic. Commit.
5. `WeatherLayer` skeleton + mist beat. Commit.
6. Heather entry toast removal + bloom ripple VFX. Commit.
7. Terrain scatter (cairns, waymarkers). Commit.
8. `BIOME_DRESSING.md` doc. Commit.

### Phase 3 non-goals

- Dressing all 4 biomes (post-MVP per-biome follow-ups).
- Weather-as-gameplay (affecting enemy behaviour / player stats).
- Wildlife as gameplay entities (no damage / XP / pickup interaction).
- Day / night cycle.
- Seasonal shifts / MoorState.

---

## 7. Phase 4 — Music &amp; Sound

### Component

Reactive audio layer hooking into Phases 1–3. Replaces redundant text
cues with sound signatures. Extends existing `ProceduralMusicEngine` +
`AudioSystem` without rewriting either.

### New / extended modules

```
src/systems/audio/
├── AudioSystem.ts               · existing — accessory + weapon hooks added
├── SFXManager.ts                · existing — throttling extended to accessories
├── AccessoryAudio.ts            · new — per-accessory signature routines
├── BiomeAmbience.ts             · new — per-biome ambient bed with crossfade
└── accessoryAudioConfig.ts      · new — { accessory: signature } map (data)

src/systems/music/
├── ProceduralMusicEngine.ts     · existing — add weapon-motif layer
├── Conductor.ts                 · existing — add build-density axis
└── weaponMotifs.ts              · new — per-weapon pitch/timbre params
```

### Five sub-systems

**Accessory SFX:** per-passive sound signatures. Examples: sporran coin
rattle on walking tick, kilt rustle on velocity change, shield clank on
`takeDamage`, flask slosh at low HP, irn-bru fizz on HP regen tick.

**Weapon motifs:** per-weapon musical layer in the music engine.
Examples: claymore low brass stab on swing, bagpipes drone layer
activates, caber wooden thud on impact, thistle harp pluck on cast.

**Biome ambience:** per-biome ambient bed. Examples: bog wet wind + bog
bubble; loch lap + gentle wind; pine needle rustle + distant crow;
heather wind + soft bird.

**Conductor axes:** new reactive input — **build density** (worn
accessory count). Fuller build = richer orchestration. Joins existing HP
/ combo / boss-proximity / time-past-bell axes.

**Text cuts:** low-HP toast → heartbeat only (heartbeat already exists,
just remove toast). Kill streak → music swell. Curse start →
dissonance shimmer + short banter retained. Weapon evolve sting.

### Integration with earlier phases

```
Phase 1 AnimationController → walking-state tick →
  AccessoryAudio.tickStep(ownedAccessories)

Phase 2 pickup wiring → AccessoryAudio.register(accessory) +
  build-density axis bump

Phase 3 BiomeController → on entry → BiomeAmbience.crossfadeTo(biome)

Phase 4 Conductor → reads build-density axis → mood feeds piano /
  drone / percussion layers
```

### MVP scope — B+A+C+D convergence

| Sub-system | MVP pick | Hooks into |
|------------|----------|------------|
| Accessory SFX | `sporran` coin rattle on walk | Phase 1 walking state + Phase 2 sporran drawer |
| Weapon motif | `claymore` low brass stab on swing | Phase 2 claymore drawer + music engine |
| Biome ambience | `heather` wind + bird bed | Phase 3 heather dressing |
| Conductor axis | **build density** mood input | Phase 2 pickup wiring |
| Text cut | low-HP toast → heartbeat only | Existing heartbeat layer |

Every subsequent accessory / weapon / biome follows the same template —
~1 hr ship work each.

### Exit criteria

- Sporran rattles on walk (tied to Phase 1 clock tick).
- Claymore plays motif on swing (weaponMotifs layer active).
- Heather biome has distinct ambient bed with crossfade on entry.
- Conductor reads `buildDensity` as new axis.
- Low-HP toast removed; heartbeat carries it.
- ~12 pure tests: signature config, crossfade state, density axis math.
- No audio regression (existing music layers + SFX still fire).
- `docs/AUDIO_AUTHORING.md` shipped.

### Ship order

1. `AccessoryAudio` module + `accessoryAudioConfig` data shape.
2. Sporran rattle signature + Phase 1 walking-tick hook. Commit.
3. `weaponMotifs` layer in music engine. Commit.
4. Claymore motif + fire-edge hook. Commit.
5. `BiomeAmbience` module + heather bed. Commit.
6. `BiomeController` crossfade on entry. Commit.
7. Conductor build-density axis. Commit.
8. Text cuts: remove `ui.hud.low_hp_warning`-style low-HP toast call
   sites (heartbeat carries it). Verify no other cuts needed —
   biome-entry cuts land in Phase 3; boss warnings + banter stay.
   Commit.
9. `AUDIO_AUTHORING.md`. Commit.

### Phase 4 non-goals

- Voice acting.
- Live-instrument recordings.
- Remaining accessory / weapon / biome signatures (follow-up ships).
- Reverb / spatialisation / 3D panning.
- Music export or loadout-remix share.

---

## 8. Cross-cutting concerns

### Replay determinism

All new systems read from state (velocity, HP, combat edges, seeded RNG,
`scaledDelta`) — never from wall-clock time or `Math.random()` on the
gameplay path. Existing T1 replay contract (ADR-0002 Phase 3) stays
intact. Cosmetic particle jitter may use `Math.random()` per
`src/utils/rng.ts` policy (same allowance as existing dash trail).

### Hot-path protection

- Phase 1 animation clock: 10 Hz ticks, not 60 Hz.
- Phase 2 accessory redraw: only visible haggis container; once per
  animation tick.
- Phase 3 flora: batched per voronoi cell, off-screen cells skip sway.
- Phase 3 wildlife: capped at ≤ 30 active per biome.
- Phase 4 audio: existing `SFXManager` throttling; new signatures add no
  per-frame hot code.

Gate: AutoBattler stress test (10× time scale, 200 enemies) must not
regress FPS vs pre-push baseline.

### Testing strategy

- Pure helpers (state transitions, frame math, drawer layout, flora
  placement, wildlife behaviour, weather state, signature config) all
  unit-tested — estimate ~60 new tests across four phases.
- Integration coverage via existing Playwright smoke + `AutoBattler`
  stress.
- Visual regression: out of scope (would require Playwright screenshot
  baselines — deferred).

### Soul charter alignment

- **Handcrafted, warm:** more craft per drawing; procedural sophistication
  over asset volume.
- **Failure informative + compassionate:** hurt-state animation reads
  clearly without shaming copy.
- **Progression celebratory:** compositional build visible at all times
  = constant "I earned this" feedback.
- **One authored world:** procedural-art coherence across entities +
  flora + weather.
- **Text reduces, banter stays:** banter is soul. Biome-entry toasts
  aren't.

### Dependency map

- **Phase 1** depends on: `TimeManager` (existing), `SpatialCulling`
  (existing), `Player` + `Enemy` entity classes.
- **Phase 2** depends on: Phase 1 (animation states + clock), existing
  passive / weapon pickup paths in `LevelUpFlow`.
- **Phase 3** depends on: Phase 1 (animation primitives for wildlife),
  existing `BiomeManager` + `BiomeController` + `BiomeRenderer` + voronoi
  seeding, `runRng`.
- **Phase 4** depends on: Phases 1–3 (reads state from each), existing
  `AudioSystem` + `ProceduralMusicEngine` + `SFXManager` + `Conductor`.

---

## 9. Kill criterion

**If Phase 1 FPS regresses > 10 % under AutoBattler stress and cannot be
recovered within one focused session of LOD tuning, the direction is
wrong.** Revert Phase 1 animation layer, keep existing wobble, close this
spec.

Phase 2 / 3 / 4 each have their own scope-tight exit criteria but inherit
the Phase 1 performance gate — if Phase 1 fails, nothing above it ships.

---

## 10. Open follow-ups (not in this spec)

- Phase 2.5: remaining 11 accessories + evolved-weapon distinct drawers +
  per-variant body-shape differences.
- Phase 3.5: bog + loch + pine biome full dressings.
- Phase 4.5: remaining accessory / weapon / biome audio signatures.
- Per-boss canon animations (integration with `Phase 1` bossFrames).
- Chronicle postcard scene-assembly (compositional silhouette export).
- MoorState persistent layer (seasonal / lineage / fauna populations) —
  stays deferred; not required for this push.
- Day/night cycle — separate flagship if elevated.

---

## 10a. Plan decomposition

Each of the four phases is flagship-scale on its own. The downstream
`writing-plans` step produces **four separate plan documents** — one per
phase — under `docs/superpowers/plans/2026-04-18-moor-*.md`, not a single
monolithic plan. Each plan can be executed independently in its own
session; the dependency chain (Phase 1 → 2 → 3 → 4) is the only cross-plan
contract.

---

## 11. Implementation sequencing summary

```
Phase 1 — Animation Foundation      [ships 10 commits over ~2-3 sessions]
   ↓
Phase 2 — Haggis-Wears-Build        [ships 10 commits over ~3-4 sessions]
   ↓
Phase 3 — World Depth (heather MVP) [ships 8 commits over ~2-3 sessions]
   ↓
Phase 4 — Music & Sound (convergent MVP) [ships 9 commits over ~2 sessions]
```

Each phase reversible, each standalone-shippable as a flagship, each
compounds on the previous. No phase gates on a later phase existing.
