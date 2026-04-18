# The Moor Renders Itself — design spec (v2, handcrafted-quality rewrite)

**Date:** 2026-04-18 (rewritten same day after tear-down pass)
**Scope:** Multi-phase procedural-art push that raises the game's visual
and audio identity surface to handcrafted-quality without adopting a
pixel-art asset pipeline. Commits to the craft bar the existing enemy
sprites (dean_apparition, tome_wraith, redcap, ceilidh_caller,
auditor_priest) already demonstrate — and bakes the process that made
those sprites good into every new asset.

> **Version history.** v1 shipped in the first draft of this file at
> `f256684`. A tear-down pass caught: quality target mismatch (claimed
> "Isaac-feel" from primitives), 10 Hz animation choppiness, 10× scope
> compression, audio-drowns-in-combat premise, Phase Container perf
> unverified, no art-direction budget, no style bible. v2 addresses
> each.

---

## 1. Problem statement (revised)

### Observation

The recent session shipped seven procedural enemy sprites
(`ledger_wraith`, `auditor_priest`, `tome_wraith`, `dean_apparition`,
`redcap`, and the earlier family drops `seelie_piper`,
`unseelie_fiddler`, `ceilidh_caller`, `haar_wraith`, `gale_wraith`,
`barghest`, `kelpie_foal`, `blue_man_of_minch`, `buckfast_ned`,
`traffic_cone_totem`, `edinburgh_ghost_guide`). Each is 60-140 lines of
hand-placed `fillCircle` / `fillTriangle` / `fillEllipse` / `fillRect`
composited with layered depth + highlights + character detail. Looked
at in the game they read as handcrafted, coherent, Scottish. The
existing craft bar is **real**.

The gap is NOT the pipeline. The gap is:

1. Sprites are **static** — no animation beyond `setScale` wobble.
2. The haggis body has **no compositional layer** for worn items — no
   Isaac-style visible build.
3. The **moor is empty** — flora, weather, wildlife are missing.
4. The game leans on **words** (biome-entry toasts, captions, toast
   stacking on combo + damage numbers + pickup + level-up) where the
   existing art could carry the beat.

### Player outcome

- Haggis silhouette changes every run and reads its build at a glance.
- The moor feels like a place — flora sways, mist drifts, hares hop.
- Animation is present on every entity that matters (player, bosses,
  nearby enemies).
- Text retreats to the moments it earns: boss warnings, banter soul
  beats, accessibility captions, damage numbers. The HUD feels calmer.

### Craft outcome

Every new sprite / drawer / animation / ambience hits the same craft
bar the existing enemy sprites already set. Not geometric
approximations. Not "first-draft draws". **Handcrafted. Period.**

---

## 2. Quality charter (NEW — what "handcrafted" means here)

Non-negotiable bar for every new visual or audio asset in this push:

### Visual charter

1. **Defined silhouette.** Subject is identifiable at a glance by shape
   alone — not dependent on colour. Test: squint at it. Still reads?
2. **Consistent light source.** Upper-left primary, subtle upper-right
   fill. Every highlight + shadow in every sprite respects this. No
   sprite ships with reversed light.
3. **Layered depth.** Minimum 3 tonal passes: dark base → mid body →
   highlight rim → (optional) detail accent. No flat fills on focal
   shapes.
4. **Focal hierarchy.** One primary focal point (eyes / hat / weapon),
   one secondary (tint detail / stripe / motion), tertiary is texture.
   The eye lands right.
5. **Palette discipline.** 2-4 main colours + 1-2 accents per sprite.
   Pulled from `config.ts COLORS` or a new `src/art/palettes.ts`
   curated set. No stray hex constants.
6. **Anchor details.** Belts, stripes, spots, trim — break up mass so
   sprites don't read as blobs at distance. See how the dean's gold
   trim, sporran's seal, redcap's dipped cap all serve this.
7. **Character pose.** Every sprite has posture / attitude — not a
   neutral mannequin. Tilt, lean, stance. Character > symmetry.
8. **Squash/rest proportions.** Body proportions exaggerate the
   fantasy (chunky iron-belly, elongated moor-runner, etc.). Not
   default-human proportions scaled.

### Animation charter

1. **Frames, not tweens.** Every animated state has 2-6 keyframes, not
   one tween on one base shape. Walking = 4-frame cycle (contact →
   passing → contact → passing). Attacking = 4-frame (anticipation →
   strike → impact → recovery). Hurt = 2-frame snap-back.
2. **24 fps nominal.** Texture-swap animation at ~24 fps — **not** live
   Graphics redraw at 10 Hz. See Phase 1 architecture below for how.
3. **Easing curves baked in per state.** Hurt = sharp compress then
   slow release. Walking = sinusoidal bob. Not linear.
4. **Motion serves character.** A haggis walks round-bellied with hip
   sway. A ghost drifts. A berserker pumps. Per-entity motion, not
   shared.

### Authoring process

1. **Reference-driven.** Each drawer opens with a comment block
   pointing at 1-3 real-world references (Scottish attire photos, Celtic
   illustration, Limmy promo stills, Still Game character art, McIntosh
   roses, etc.). No drawer ships without a reference cite.
2. **Iteration budget per drawer.** Minimum 3 passes before ship:
   v1 first draft → review against charter → v2 refine → review in-game
   → v3 ship. Build it in, don't apologise for it later.
3. **Combination preview.** A dev-only route renders the haggis with
   every possible accessory combination at once on a grid (~72 cells for
   9 passives × 8 weapons) so visual conflicts surface before release.
4. **Playtest gate.** Before any phase MVP claims "ship", play a real
   5-minute run and screenshot. Does it land? Does the accessory read?
   Is the hurt animation legible mid-swarm? Screenshot attached to the
   commit message.
5. **Quality-bar failure = rework, not lowered bar.** If a drawer
   doesn't hit the charter after 3 passes, open a 4th pass. If after 4
   passes it still doesn't land, escalate — restructure the approach
   for that drawer, don't ship sub-bar.

---

## 3. Style bible (NEW)

Commit one file, `docs/ART_STYLE_BIBLE.md`, at Phase 0 that codifies:

- **The palette.** Anchor hex values pulled from the Soul Charter:
  peat browns (3A2818, 5A3E20, 4A2E18), heather purples (8060A0,
  9070B0, B090D0), loch blues (2A4A6A, 4A7090, 6A90B0), whisky golds
  (C8A040, D4B055, FFC840), stone greys (2A2A30, 4A4A50, 8A8A90),
  Scots-red accents (AA2020, C42828, 901818). Curated from existing
  sprite hex inventory.
- **Light model.** Upper-left primary at full strength; upper-right
  fill at 50 %; ambient occlusion at the body underside.
- **Line weight / stroke.** No strokes on procedural sprites (mass is
  carried by tonal layering). Exception: gold trim (1 px at `0xc8a040`).
- **Composition rules.** Head occupies upper 1/3 of silhouette; body
  mid 1/3; base/shadow lower 1/6. Centred on x, bias down on y
  (ground anchor).
- **Inspiration wall.** Linked reference images + URLs — Mackintosh
  roses, Glasgow Boys palette, Celtic illumination, Limmy title cards,
  Still Game character poses, Trainspotting opening kinetic typography.
  These anchor the voice — procedural or not.

Shipped AT Phase 0 so every subsequent phase authors against it.

---

## 4. Non-goals

- **No PNG / pixel-art assets.** No art-team dependency. Procedural
  only — but procedural at the craft bar the existing sprites set.
- **No skeletal animation rig.** W71 stays rejected.
- **No online / multiplayer.** W82 offline-first doctrine preserved.
- **No 3D / alternate camera / ECS rewrite.**
- **No voice acting.**
- **No content-pack system / MoorState / day-night cycle.**
- **No per-accessory / per-weapon audio signatures** (dropped in v2 —
  see tear-down: drown in combat noise). Phase 4 scope narrows.
- **No real-time Graphics-redraw animation.** v1's "10 Hz live redraw"
  was wrong. Replaced by texture-swap sprite-sheets (see Phase 1).

---

## 5. Design principles (revised)

1. **Charter + process over raw code.** Quality charter + authoring
   process + review gates are load-bearing. A drawer that passes lint
   but fails the charter is not shipped.
2. **Texture-swap animation.** Pre-generate texture atlases at boot
   (per-variant, per-state, per-frame). Runtime swaps sprite key —
   cheap. No live Graphics redraw in the hot path.
3. **State-reactive determinism.** Animation state driven by game
   state + `scaledDelta`. T1 replay contract preserved.
4. **Pattern proves before scale.** Phase 0 prototype validates one
   haggis + one accessory + one state before committing to the full
   build. Cancel criterion: if prototype's craft bar is visibly below
   the existing enemy sprite bar after 1 focused week, reboot spec.
5. **Text reduces by tightening, not bulk-cutting.** Toast stacking
   /layout /fade choreography improvements land first; only cut the
   toasts a matching visual clearly replaces. Banter stays whole.
6. **Scope honestly.** Real timeline is months, not hours. See §13.

---

## 6. Architecture — texture-swap animation (revised)

### v1 error

Live `Graphics.fill*` redraw every animation tick across N entities.
10 Hz tick rate chosen to keep cost low. Output = choppy animation and
still-expensive transform propagation under Phaser `Container`.

### v2 model

At boot, pre-generate texture **atlases**: one atlas per
(variant × state × frame-index). Runtime just calls
`sprite.setTexture('haggis_classic_walking_2')` — O(1).

```
BootScene (or lazy-per-variant at MenuScene):
  for each variant (classic, moor_runner, iron_belly, …):
    for each state (idle, walking, attacking, hurt, celebrating, dying):
      for each frame (0..N-1 where N per state):
        draw procedurally into a Graphics
        .generateTexture('<variant>_<state>_<frame>', w, h)
        .destroy() (graphics)

Runtime Player:
  AnimationController tracks (state, frameT)
  update(): advance frameT at 24 fps (scaledDelta-driven)
    on frame index change: player.setTexture(<key>)
  no Graphics objects allocated or destroyed per tick
```

Cost: **one-time** texture generation at ~O(variants × states ×
frames) — acceptable amortised over a run. E.g. 9 variants × 6 states
× 4 frames avg = 216 textures. Each ~60 × 60 px. ~0.8 MB GPU texture
memory total. Phaser caches them; reuse is free.

Accessories (Phase 2) follow the same pattern: each accessory drawer
pre-generates its (state × frame) atlas at boot, runtime swaps child
sprite's texture when state changes. Compositing is N children each
doing an O(1) texture swap — **fast and fluid at 24 fps**.

### Consequence

- Animation fidelity unlocked to 24 fps without hot-path cost.
- `Phaser.GameObjects.Container` with Sprite (not Graphics) children
  — Phaser's own scene-graph fast path.
- Pre-bake cost spent once at boot; runtime is just state-driven
  texture-key lookup.
- Drawer authoring stays the same — hand-placed primitives — just
  run at bake time instead of every frame.

---

## 7. Phase 0 — Prototype gate (NEW — must pass before Phases 1-4)

### Component

Build one end-to-end slice: **classic haggis** + **one accessory
(`tam_o_shanter`)** + **two states** (idle, walking) + **4-frame
walking cycle at 24 fps** + **texture-swap architecture**.

Compare in-game against the existing enemy sprite craft bar.

### Exit criteria (Phase 0)

- Haggis visibly animated at 24 fps (walking cycle, idle breathing).
- Tam-o-shanter visible on haggis, tilts with walking.
- No FPS regression under single-run play.
- **Craft-bar gate:** side-by-side screenshot of animated haggis vs.
  existing `dean_apparition` sprite. If the haggis looks noticeably
  less crafted, rework before proceeding. Post screenshot in commit.
- Ship the style bible (`docs/ART_STYLE_BIBLE.md`).

### Ship order

1. Build texture-atlas pre-bake infrastructure (Phase 1 groundwork).
2. Author `haggis_classic_idle` (2 frames) + `haggis_classic_walking`
   (4 frames) as procedural drawers → generateTexture at boot.
3. Wire AnimationController (minimal, texture-swap only).
4. Author `tam_o_shanter` drawer with state × frame atlas.
5. Wire accessory pickup → child-sprite texture swap.
6. Play. Screenshot. Review against the style bible.
7. Iterate through v1 → v2 → v3 until craft bar is met.
8. Commit + `ART_STYLE_BIBLE.md`.

### Phase 0 kill criterion

If the animated classic haggis + tam, after 3 authored passes and one
focused week, does not visibly match the craft bar of the existing
enemy sprites (per side-by-side screenshot review), **close the spec
and revisit Option D (hybrid pixel-art pipeline)**. The procedural
path cannot deliver in this game. Don't push through — the tear-down
predicted this outcome; honour it.

**Phase 0 is a real gate. Phases 1-4 don't start until Phase 0
passes.**

---

## 8. Phase 1 — Animation Foundation (revised)

### Component

Texture-swap animation across Player + 3 enemy archetypes, built on
the Phase 0 infrastructure.

### New modules

```
src/animation/
├── animationStates.ts      · pure state-transition logic (tested)
├── frameClock.ts           · 24 fps clock from scaledDelta
├── AnimationController.ts  · per-entity state + frame-index owner
├── textureAtlas.ts         · pre-bake helper (variant, state, frames)
└── frameDrawers/
    ├── haggisFrames.ts     · player body per state × frame
    ├── enemyFrames.ts      · shared enemy primitives per state × frame
    └── bossFrames.ts       · boss-specific per state × frame
```

### Frames per state (authored budget)

| State | Frames | Tempo | Notes |
|-------|--------|-------|-------|
| idle | 2 | 2 fps loop | breathing in / breathing out |
| walking | 4 | 24 fps loop | contact → passing → contact → passing |
| attacking | 4 | 24 fps one-shot | anticipation → strike → impact → recovery |
| hurt | 2 | 30 fps one-shot | snap-compress → slow-release |
| celebrating | 4 | 12 fps loop | bounce cycle |
| dying | 3 | 12 fps one-shot | collapse sequence |

Per-variant haggis = 2 + 4 + 4 + 2 + 4 + 3 = **19 frames × 9 variants
= 171 haggis textures**. Plus per-enemy × per-state × per-frame. Total
atlas at Phase 1 end: ~400 textures, ~1-2 MB GPU memory. Fine.

### Integration

- `Player.ts` + `Enemy.ts` hold an `AnimationController`.
- Each controller owns (currentState, currentFrameIndex, frameT).
- `update(scaledDelta)`:
  - Evaluate state transitions pure (`animationStates.evaluate`).
  - Advance frameT; on frame boundary, `sprite.setTexture(key)`.
- No per-frame Graphics allocation.
- Retire `wobblePhase`.

### Hot-path protection

- Atlas generation at boot or lazy at first-use. One-time cost.
- Runtime per-frame per-entity: one texture lookup + one setTexture.
- Off-screen entities pause frame advance (via `SpatialCulling`).
- LOD: player + bosses always 24 fps; swarm enemies (midge, midgie)
  stay on idle-loop only (no walking animation), they're ambient.

### Exit criteria

- Phase 0 gate passed.
- 24 fps texture-swap animation on Player + chase + ranged + dive
  enemy archetypes.
- `wobblePhase` retired.
- Hurt + attacking + celebrating + dying states authored for Player.
- Atlas pre-bake takes < 500 ms on boot (or lazy).
- No FPS regression under AutoBattler stress (200 enemies, 10×
  time scale).
- ~25 pure helper tests (state machine, frame clock, atlas key
  mapping).
- **Playtest gate:** 5-minute run screenshot attached to final
  commit.

### Ship order (revised)

1. `animationStates.ts` + tests.
2. `frameClock.ts` + tests.
3. `textureAtlas.ts` + tests (pure key-mapping helper).
4. `AnimationController.ts` + tests.
5. Phase 0 prototype ship (if not already gated).
6. Haggis idle + walking frames for all 9 variants. Commit.
7. Haggis hurt + attacking + celebrating + dying. Commit.
8. Wire Player to controller. Retire wobblePhase. Commit.
9. Enemy archetype: chase (buckfast_ned). Commit.
10. Enemy archetype: ranged (haggis_hunter). Commit.
11. Enemy archetype: dive (eagle). Commit.

### Phase 1 non-goals

- Skeletal rig.
- Accessory layers (Phase 2).
- Wildlife / flora animation (Phase 3).
- Audio hooks (Phase 4).
- All enemy types — just 3 archetypes; long tail follows pattern in
  follow-up ships.

---

## 9. Phase 2 — Haggis-Wears-Build (revised)

### Component

Isaac-style compositional haggis. `HaggisContainer` with layered child
sprites per accessory. Each accessory is a pre-baked texture atlas
(state × frame, per variant when variant-specific fit required).

### Accessory roster

**9 passives:** sporran, kilt, tam_o_shanter, whisky_flask, irn_bru,
loch_water, thistle_crown, highland_shield, tartan_sash.

**8 weapons:** claymore, caber_toss, bagpipes, bagpipe_blast,
thistle_shot, scotch_mist, haggis_hurler, nessie_tentacle.

### Container layout

```
HaggisContainer (Phaser.GameObjects.Container)
├─ body_sprite          · variant × state × frame atlas (Phase 1)
├─ layer_behind_sprite  · optional atlas (claymore, kilt-back)
├─ layer_body_sprite    · optional atlas (sporran, sash, flask, …)
├─ layer_front_sprite   · optional atlas (shield, kilt-front, …)
└─ layer_above_sprite   · optional atlas (tam, thistle crown)
```

Each layer is a Phaser `Sprite` whose texture is swapped on state /
frame change. Only layers with a currently-owned accessory render.

### Variant × accessory matrix (NEW)

A tam-o-shanter on a classic haggis (round) looks different from a
tam on an iron-belly (chunky) or a wee-ghostie (translucent). Accessory
drawers must produce atlases **per variant where fit requires it**.

Pre-bake cost: 9 passives × 9 variants × 2-4 states × 2-4 frames →
worst case ~500 additional textures. GPU still well under budget.

Process: each accessory drawer declares which variants it ships
variant-specific atlases for; others use the "classic" base pose.
Decision documented per drawer.

### Combination preview tool (NEW)

A dev-only route `/combinations` (or debug overlay toggle) renders the
haggis in a grid:
- Rows: each haggis variant
- Columns: each accessory combination (representative, not exhaustive)

Screenshot this grid after every new drawer lands. Review against the
charter: visual conflicts, overlaps, focal-competition between stacked
accessories. Fix before shipping.

### MVP scope — 6 accessories (unchanged choice, revised bar)

| Accessory | Layer | Why in MVP |
|-----------|-------|------------|
| sporran | body | sway-with-walking (Phase 1 state-reactive proof) |
| tam_o_shanter | above | above-body layer + facing rotation |
| kilt | front+behind | dual-layer proof |
| claymore | behind | weapon-on-back; facing-rotated |
| caber_toss | front | shouldered + attacking-state integration |
| bagpipes | body | body-hugged + passive-aura particles |

Each drawer goes through the 3-pass iteration budget. Each appears in
the combination preview. Each has a playtest-screenshot commit.

### Exit criteria (revised)

- `HaggisContainer` refactor landed; invisible behaviour change.
- 6 MVP accessories shipped, each passing the charter.
- Combination preview tool available.
- Pickup → accessory child spawn wired end-to-end.
- Game-over screen shows assembled silhouette.
- **Playtest gate:** 5-minute run with all 6 MVP accessories
  collected; screenshot attached. Silhouette reads at-a-glance which
  accessories are on.
- `docs/ACCESSORY_AUTHORING.md` documents the 3-pass authoring +
  combination-preview workflow.
- No FPS regression under AutoBattler stress.

### Ship order

1. HaggisContainer refactor (Sprite body + layer sprites).
2. AccessoryDrawer interface + atlas pre-bake helper.
3. Combination preview tool (dev overlay).
4. Drawer `sporran` — v1 → v2 → v3 → commit.
5. Drawer `tam_o_shanter` — v1 → v2 → v3 → commit.
6. Drawer `kilt` — v1 → v2 → v3 → commit.
7. Drawer `claymore` — v1 → v2 → v3 → commit.
8. Drawer `caber_toss` — v1 → v2 → v3 → commit.
9. Drawer `bagpipes` — v1 → v2 → v3 → commit.
10. Game-over silhouette render.
11. `ACCESSORY_AUTHORING.md` including the combination-preview step.

### Phase 2 non-goals

- Remaining 11 accessories — post-MVP ships, 1 per week each at
  handcrafted bar.
- Evolved-weapon distinct drawers — Phase 2.5.
- Per-variant body-shape differences beyond palette — Phase 2.5 /
  deferred.

---

## 10. Phase 3 — World Depth (tightened)

### Component

Biome flora + terrain + weather + wildlife. Same scope as v1. Quality
bar raised to match Phases 1/2.

### Changes from v1

- Flora sprites pre-baked as texture atlases (sway animation =
  frame-swap, not live redraw), matching Phase 1 architecture.
- Wildlife sprites authored through the same 3-pass iteration budget
  as accessories. Each wildlife species = one drawer, passes the
  charter.
- Weather particle system: pre-baked particle textures; per-frame cost
  is just particle position update + alpha, no draw-call redraw.
- Review gate: screenshot the heather biome from 3 camera angles after
  MVP ship. Does it feel like a place?

### MVP scope — heather biome fully dressed

Unchanged from v1:

- Heather + thistle flora density.
- Mist weather beat.
- 1 wildlife species (hare, 2-state animation: hopping + idle).
- Text cut: heather entry toast → purple bloom ripple on entry.
- ~3 cairn scatter features.

### Exit criteria

- Heather biome screenshot-reviewable as "a place".
- Flora sway via frame clock; no FPS regression.
- Hare animated at 24 fps (2-state).
- Seed-determinism: same seed → same world.
- `docs/BIOME_DRESSING.md`.

### Ship order

Unchanged from v1 but each drawer goes through 3-pass iteration.

### Phase 3 non-goals

Same as v1.

---

## 11. Phase 4 — Music &amp; Sound (scope REDUCED per tear-down)

### v1 error

Claimed per-accessory SFX + per-weapon motifs would replace text. The
critique: survivors-genre noise drowns subtle audio cues. User won't
hear the sporran rattle during a 200-enemy swarm.

### v2 scope

Keep the audio signals that genuinely cut through combat noise. Drop
the ones that don't.

**Kept:**
- **Per-biome ambient beds** — crossfade on entry; they persist under
  combat and set location. `BiomeAmbience.crossfadeTo(biome)`.
- **Build-density Conductor axis** — fuller build = richer
  orchestration. Compositional, not per-accessory — plays through the
  existing music engine. Registers even during swarm because it
  shifts the whole mix.
- **Low-HP toast → heartbeat-only formalisation** — heartbeat already
  exists; just remove the toast call site.
- **Weapon-evolve sting** — already exists; formalise in the sting
  registry.
- **Curse-start dissonance shimmer** — short, high-priority audio
  event; cuts through.

**Dropped (per tear-down):**
- ~~Per-accessory SFX signatures (sporran rattle, flask slosh, etc.)~~
  — inaudible in combat.
- ~~Per-weapon motif layer (claymore stab, caber thud)~~ — the
  existing per-weapon fire SFX already carries this beat.

### Exit criteria

- 1 biome ambient bed shipped (heather, matching Phase 3 MVP).
- `BiomeController.crossfadeTo` on entry.
- `buildDensity` axis in Conductor mood calculation.
- Low-HP toast removed; heartbeat carries it.
- Curse-start shimmer added.
- No audio regression.
- `docs/AUDIO_AUTHORING.md`.

### Ship order

1. `BiomeAmbience` module + heather bed.
2. `BiomeController.crossfadeTo` wiring.
3. Conductor `buildDensity` axis.
4. Low-HP toast removal (1-liner at call site + existing heartbeat).
5. Curse-start shimmer signal.
6. `AUDIO_AUTHORING.md`.

### Phase 4 non-goals

- Per-accessory / per-weapon audio signatures (dropped per tear-down).
- Voice acting.
- Live-instrument recordings.
- Reverb / spatialisation.

---

## 12. Cross-cutting concerns

### Replay determinism

Unchanged from v1. Everything reads from state + `scaledDelta` +
seeded RNG. T1 contract preserved. Texture atlases are deterministic
content — generated from pure drawer code; same inputs → same atlas.

### Hot-path protection (revised)

- Texture-swap runtime cost: O(1) per entity per frame (setTexture
  lookup).
- Atlas pre-bake: one-time at boot, < 500 ms budget.
- Off-screen entities pause frame advance.
- LOD: swarm enemies stay on idle loop only.
- Gate: AutoBattler 10×, 200 enemies — no FPS regression vs
  pre-Phase-1 baseline.

### Testing strategy (revised)

- Pure helpers (state transitions, frame clock, atlas key mapping,
  drawer layout math, flora placement, wildlife behaviour, weather
  state, crossfade state, buildDensity math): ~80 new tests across
  phases.
- Integration: existing Playwright smoke + AutoBattler stress.
- **Visual review gate** (new): screenshot comparison against style
  bible after each drawer; combination-preview after each Phase 2
  drawer; biome screenshot after Phase 3 MVP. Reviewed against
  `ART_STYLE_BIBLE.md`.
- Playtest gates per phase MVP.

### Soul charter alignment

Unchanged from v1 + stricter enforcement via the quality charter.

### Dependency map

- Phase 0: depends on existing BootScene texture pipeline, one
  variant (classic), one accessory.
- Phase 1: depends on Phase 0, existing TimeManager + SpatialCulling
  + Player / Enemy classes.
- Phase 2: depends on Phase 1 (atlas pattern, state machine),
  existing LevelUpFlow pickup paths.
- Phase 3: depends on Phase 1 (atlas pattern for flora / wildlife
  frames), existing BiomeManager / Controller / Renderer + runRng.
- Phase 4: depends on existing AudioSystem + ProceduralMusicEngine +
  SFXManager + Conductor. No dependency on Phases 1-3 for scope-
  reduced v2 (biome ambience doesn't need new visuals).

---

## 13. Honest timeline (NEW)

Per the tear-down: v1 estimates were 10× compressed. v2 estimates
reflect realistic focused work, including the 3-pass iteration budget
per drawer.

| Phase | Scope | Realistic focused work |
|-------|-------|------------------------|
| Phase 0 | Prototype + style bible | 1 week |
| Phase 1 | Animation foundation + 4 entity archetypes × 6 states × multi-frame atlases | 4-6 weeks |
| Phase 2 | Container + 6 MVP accessories at 3-pass each + combination tool + game-over silhouette | 3-4 weeks |
| Phase 3 | Heather biome full dressing (flora + terrain + weather + 1 wildlife) | 3-4 weeks |
| Phase 4 | Scope-reduced audio (biome ambience + buildDensity + text cuts) | 1-2 weeks |
| **Total** | **Phases 0-4 MVP** | **~3-4 months focused** |

Post-MVP long tail:

| Follow-up | Scope | Per-item work |
|-----------|-------|---------------|
| Phase 2.5 | 11 remaining accessories | 3-6 days each at charter bar |
| Phase 3.5 | 3 more biomes (bog, loch, pine) | 1-2 weeks each |
| Phase 4.5 | Sting / ambient additions as systems demand | ad-hoc |

**These are order-of-magnitude estimates, honest ones.** Every phase
carries compound uncertainty. Re-estimate after Phase 0 lands — the
prototype is the best calibration signal available.

---

## 14. Kill criterion (revised — product test, not FPS-only)

Two independent gates. Tripping either closes the spec:

1. **Phase 0 craft-bar gate:** After 3 authored passes + 1 focused
   week, the animated classic haggis + tam does not visibly match the
   handcraft bar of the existing enemy sprites (side-by-side screenshot
   review). Revisit Option D (hybrid pixel-art pipeline) — procedural
   path can't deliver.

2. **Phase 2 MVP product gate:** A blind playtester cannot correctly
   identify from a single screenshot which 3 of 6 MVP accessories the
   haggis has equipped. The visible-build feature failed its stated
   value. Rework composition / iteration / authoring process, or
   revisit Option D.

Phase 1 FPS gate (technical) is an engineering hygiene check but no
longer the primary kill criterion.

---

## 15. Plan decomposition

Phase 0 ships as a single tight plan document. Phases 1-4 each get
their own plan document at `writing-plans` time. 5 plan docs total:

- `2026-04-18-moor-phase-0-prototype-plan.md`
- `2026-04-18-moor-phase-1-animation-plan.md`
- `2026-04-18-moor-phase-2-wear-build-plan.md`
- `2026-04-18-moor-phase-3-world-depth-plan.md`
- `2026-04-18-moor-phase-4-audio-plan.md`

Phases 1-4 **do not start** until Phase 0 passes its gate.

---

## 16. Open follow-ups (not in this spec)

- Phase 2.5: remaining 11 accessories, evolved-weapon drawers,
  per-variant body-shape differences.
- Phase 3.5: bog + loch + pine biome dressings.
- Phase 4.5: curated per-boss stings, additional conductor axes.
- Chronicle postcard scene-assembly (compositional silhouette export).
- MoorState persistent layer (seasonal / lineage / fauna).
- Day/night cycle.
- Per-variant body shape refactor (beyond palette tint).

---

## 17. Implementation sequencing summary

```
Phase 0 — Prototype gate + style bible         [1 week]
   ↓ (gate passes)
Phase 1 — Animation Foundation                 [4-6 weeks]
   ↓
Phase 2 — Haggis-Wears-Build                   [3-4 weeks]
   ↓
Phase 3 — World Depth (heather MVP)            [3-4 weeks]
   ↓
Phase 4 — Music & Sound (scope-reduced)        [1-2 weeks]
```

Every phase reversible. Phase 0 is a real gate — not bureaucracy.
