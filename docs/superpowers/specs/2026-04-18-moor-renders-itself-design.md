# The Moor Renders Itself — design spec (v3, no-time-box, 25-ship-surface)

> **Spec status (2026-05-09):** Phase 0 prototype shipped — see [`docs/PHASE_0_GATE_NOTES.md`](../../PHASE_0_GATE_NOTES.md). Phases 1–4 superseded by separate flagships (W71 rig + secondary motion, B5 biomes charter, art-music polish passes). The references below to `docs/ACCESSORY_AUTHORING.md`, `docs/BIOME_DRESSING.md`, and `docs/AUDIO_AUTHORING.md` are **deferred deliverables** — those authoring docs were never produced because the work moved into status trackers + memory snapshots + per-feature plans instead. Treat this v3 spec as historical scope intent, not a live deliverables list.

**Date:** 2026-04-18 (third rewrite after three tear-down passes)
**Scope:** Multi-phase procedural-art push at handcrafted quality.
Ships when the craft bar is met, not when a clock runs out. Explicitly
produces ~25 discrete shippable pieces across Phases 0-4 + 2.5-4.5.

> **Version history.** v1 (`f256684`) → torn down (advocacy, scope lies).
> v2 (`d834fd1`) → torn down (math under by 3×, 30% timeline compression,
> bible overclaim, "blind playtester" fiction, variant-shape contradiction,
> dev affordances missing, "25-ships" frame quietly dropped). v3 accepts
> user directive "no time-boxing, done when done" and fixes the
> remaining items.

---

## 1. Problem statement (revised)

### Observation

Twenty-plus procedural enemy sprites shipped in recent sessions prove
the craft bar is achievable in code: `dean_apparition`, `tome_wraith`,
`redcap`, `ceilidh_caller`, `auditor_priest`, `ledger_wraith`,
`edinburgh_ghost_guide`, `buckfast_ned`, `traffic_cone_totem`,
`seelie_piper`, `unseelie_fiddler`, `barghest`, `kelpie_foal`,
`blue_man_of_minch`, `haar_wraith`, `gale_wraith`. Each is 60-140 lines
of hand-placed shape primitives composited with layered depth +
highlights + character detail. Each reads as handcrafted and Scottish.

The gap is **not the pipeline**. The gap is:

1. Sprites are static — no animation beyond `setScale` wobble.
2. The haggis body has no compositional layer for worn items — no
   Isaac-style visible build.
3. The moor is empty — flora, weather, wildlife absent.
4. The game leans on words where art could carry the beat.

### Player outcome

- Haggis silhouette changes every run and reads its build at a glance.
- The moor feels like a place — flora sways, mist drifts, hares hop.
- Animation is present on every entity that matters.
- Text retreats to the moments it earns: boss warnings, banter soul
  beats, accessibility captions, damage numbers.

### Craft outcome

Every new sprite, drawer, animation, and ambient hits the same bar the
existing enemy sprites demonstrate. Zero exceptions. Any drawer below
the bar gets reworked until it clears. **Ships when done.**

---

## 2. Quality charter (non-negotiable)

### Visual charter

1. **Defined silhouette.** Subject identifiable at a glance by shape
   alone, independent of colour. Squint test: still reads?
2. **Light model.** Every NEW drawer respects: primary light upper-left,
   fill upper-right at 50%, ambient occlusion at base underside.
   (Existing sprites are inconsistent on this — that's why the charter
   exists. Retrofit opportunistically when a sprite is touched.)
3. **Layered depth.** Minimum 3 tonal passes: dark base → mid body →
   highlight rim → (optional) detail accent. No flat fills on focal
   shapes.
4. **Focal hierarchy.** One primary focal point, one secondary, tertiary
   is texture. The eye lands right.
5. **Palette discipline.** 2-4 main colours + 1-2 accents, pulled from
   `src/art/palettes.ts` (new — curated at Phase 0). No stray hex
   constants.
6. **Anchor details.** Belts, stripes, spots, trim — breaks up mass so
   sprites read at distance.
7. **Character pose.** Every sprite has posture / attitude. Tilt, lean,
   stance. Not neutral mannequin.
8. **Squash/rest proportions per variant** — deferred to Phase 2.5
   (see §11). MVP variants ship with shared body shape + palette
   differentiation.

### Animation charter

1. **Frames, not just tweens.** Every animated state has 2-6 keyframes.
   Walking = 4-frame cycle. Attacking = 4-frame (anticipation → strike
   → impact → recovery). Hurt = 2-frame snap-back.
2. **24 fps nominal.** Texture-swap, not live Graphics redraw.
3. **Easing per state.** Hurt = sharp compress then slow release.
   Walking = sinusoidal bob. Not linear.
4. **Motion serves character.** Haggis walks round-bellied with hip
   sway; ghost drifts; berserker pumps. Per-entity authored motion.

### Authoring process

1. **Reference-driven.** Every drawer opens with a comment linking 1-3
   references (Scottish attire photos, Mackintosh roses, Glasgow Boys
   palette, Limmy promo stills, Still Game character art, Trainspotting
   typography).
2. **Iterate until craft bar met.** No fixed pass count. First draft →
   review against charter → refine → review in-game → refine again →
   repeat until the drawer clears the bar.
3. **24-hour cooldown review.** Between finishing a drawer and declaring
   it "bar met," wait ≥ 24 hours. Review fresh. If it no longer reads as
   bar-met, rework. Mitigates sunk-cost bias.
4. **External review gate (per phase MVP).** Post a 30-second clip or
   screenshot grid of the MVP output to a non-developer reviewer —
   Discord, friends, r/HaggisSurvivors, anywhere with outside eyes.
   Ask the specific question ("which 3 of these 6 accessories is the
   haggis wearing?"). If <60% correct, rework. See §14.
5. **Combination preview tool** (see §9) renders the full variant ×
   accessory matrix so visual conflicts surface before ship.
6. **Quality-bar failure = rework, period.** Not "lower the bar."

---

## 3. Style bible

Commit `docs/ART_STYLE_BIBLE.md` + `src/art/palettes.ts` at Phase 0
before any drawer work begins. The bible codifies:

- **Palette anchors** (hex-validated): peat browns, heather purples,
  loch blues, whisky golds, stone greys, Scots-red accents. Curated
  from the existing sprite inventory where coherent, authored where
  inconsistent.
- **Light model** (the charter version). Applied to NEW drawers; flagged
  as retrofit-on-touch for existing sprites — don't block forward
  progress on retrofits.
- **Line weight / stroke convention.** No strokes on procedural sprites;
  mass is carried by tonal layering. Exception: gold trim at 1 px
  `0xc8a040`.
- **Composition rules.** Head occupies upper 1/3 of silhouette; body
  mid 1/3; shadow anchor lower 1/6. Centred x, biased-down y.
- **Inspiration wall.** Linked reference images + URLs. Procedural or
  not, the references anchor the voice.

---

## 4. Non-goals

- **No PNG / pixel-art assets.** Procedural only — at the craft bar the
  existing sprites set.
- **No skeletal animation rig** (W71 stays rejected).
- **No online / multiplayer** (W82 offline-first doctrine preserved).
- **No 3D / alternate camera / ECS rewrite.**
- **No voice acting.**
- **No content-pack system / MoorState / day-night cycle.**
- **No per-accessory / per-weapon audio signatures** (drown in combat
  noise — see §12).
- **No real-time Graphics-redraw animation** (replaced by texture-swap).
- **No time-boxed phase budgets.** Each phase ships when the craft bar
  is met. No exceptions.

---

## 5. Design principles

1. **Quality is the only gate.** No clock. No deadline. Ships when the
   charter + external review both pass.
2. **Charter + process + external review are load-bearing.** A drawer
   that compiles but fails the charter is not shipped. A drawer the
   outside reviewer can't decode is not shipped.
3. **Texture-swap animation.** Pre-generate atlases at boot; runtime
   swaps texture keys only. No Graphics allocation per frame.
4. **State-reactive determinism.** Everything reads from game state +
   `scaledDelta` + seeded RNG. T1 replay contract preserved.
5. **Pattern proves before scale.** Phase 0 validates one haggis + one
   accessory end-to-end at handcrafted bar before Phases 1-4 start.
6. **Text reduces by tightening and by clear replacement.** Toast
   choreography (stagger, fade, layout) lands first. Cut only toasts a
   matching visual clearly replaces. Banter stays.
7. **Per-phase MVP is fixed; iteration inside it is unbounded.** The
   scope of each phase is declared; the time inside it isn't. Prevents
   scope creep while allowing quality pursuit.

---

## 6. Architecture — texture-swap animation (corrected)

### v2 error recap

v1 used live Graphics redraw → choppy at 10 Hz + hot-path cost. v2
pivoted to texture-swap atlases + 24 fps. Correct pivot. Math was off
and mobile impact ignored. v3 fixes both.

### v3 architecture

At boot (or lazy-per-variant on MenuScene transition), pre-generate
texture atlases:

```
for each variant (9):
  for each state (6 — idle/walking/attacking/hurt/celebrating/dying):
    for each frame (1-6 per state, totalling 19 frames/variant):
      procedurally draw via Graphics
      .generateTexture('<variant>_<state>_<frame>')
      destroy Graphics

Runtime:
  AnimationController tracks (state, frameIndex)
  setTexture('<variant>_<state>_<frame>') on frame change
  no per-frame Graphics alloc / destroy
```

### Memory budget (corrected)

Single haggis texture: 60 × 60 × 4 bytes RGBA = **14 KB**.

Haggis atlas: 9 variants × 19 frames = 171 textures × 14 KB ≈ **2.4 MB**.

Enemies: 3 archetypes × 6 states × ~4 frames × 14 KB ≈ **1 MB**.

Accessories (Phase 2): 9 passives × 9 variants × 2 states (idle + walking)
× 3 avg frames × 14 KB ≈ **6.8 MB**. Plus 8 weapons at similar scale:
~6 MB. **Phase 2 accessory atlas total: ~13 MB.**

Flora + wildlife (Phase 3): ~2-3 MB.

**Full Phase 1-3 atlas memory budget: 18-22 MB GPU.**

Desktop: trivial.

**Mobile impact (W95 flagship — backlog but real):** 20+ MB texture
atlases compete with mobile browser's per-tab budget (~512 MB total,
but shared with DOM, audio, game state). Meaningful but not fatal.
Low-end Android devices with older GL drivers may have per-texture
minimum allocation padding (e.g. 128 × 128 instead of 60 × 60 = 4.5×
waste). Worst-case mobile memory: ~90 MB. **Flagged as W95 tradeoff —
future mobile push may need LOD atlasing (fewer frames on mobile) or
runtime atlas packing.** Not a blocker for the current desktop-first
push; called out so the decision is explicit.

### Bake-time budget (measured, not guessed)

Phase 0 prototype measures actual `generateTexture` wall time on the
developer machine. That number sets the budget expectation for Phases
1-3. If it exceeds 3 s on the dev machine, consider lazy-per-variant
baking on MenuScene transition. Don't pretend the number is "< 500
ms" without measuring.

### Consequence

- Animation fidelity unlocked to 24 fps without hot-path cost.
- Accessories (Phase 2) extend the pattern: child sprite per layer,
  texture-swapped on state/frame change.
- Pre-bake cost is one-time amortised over a run.
- Mobile tradeoff explicit, not hidden.

---

## 7. Phase 0 — Prototype gate + dev affordances + style bible

### Component

Build one end-to-end slice at handcrafted bar before any other phase
starts. No time-box. Phase 0 ships when Phase 0 gate passes.

### Scope

1. Texture-atlas pre-bake infrastructure:
   - `animationStates.ts` (pure state machine)
   - `frameClock.ts` (24 fps clock from scaledDelta)
   - `AnimationController.ts` (state + frame-index owner)
   - `textureAtlas.ts` (pure key-mapping helper + tests)

2. **Dev affordances** (new — addresses iteration-loop overhead):
   - Debug hotkey to force-equip any accessory on the player mid-run.
   - Debug hotkey to force-transition animation state (idle / walking /
     attacking / hurt / celebrating / dying) without triggering gameplay.
   - Debug hotkey to toggle `/combinations` preview scene (grid of
     haggis × accessory permutations).
   - Debug hotkey to capture current haggis sprite as a reference
     screenshot, saved to `.superpowers/captures/`.

3. Classic haggis authored at bar:
   - Idle state: 2 frames (breathing in / breathing out, ~2 fps loop).
   - Walking state: 4 frames (contact → passing → contact → passing,
     24 fps loop).

4. Tam-o-shanter accessory authored at bar:
   - Layer: `above`.
   - States: idle + walking (same atlas pattern as haggis body).
   - Iteration continues until charter + external review both pass.

5. `src/art/palettes.ts` — curated palette module.

6. `docs/ART_STYLE_BIBLE.md` — the full bible with reference images.

7. **Measure texture bake time** on the dev machine; record in the
   commit message. This number calibrates Phases 1-3 plans.

### Mechanical kill criterion (replaces "honour it")

Two gates. Both must pass before Phase 0 declares ship:

- **Gate A — charter conformance.** Developer, after 24-hour cooldown,
  reviews the animated haggis-with-tam side-by-side with at least 3
  existing enemy sprites (e.g. `dean_apparition`, `tome_wraith`,
  `redcap`). Binary self-assessment: meets bar / doesn't.
- **Gate B — external review.** Developer captures a 15-30 s clip of
  the animated haggis-with-tam in-game (walking, idle, hurt). Shares
  with ≥ 2 non-developer reviewers. Asks: "Does this look handcrafted
  / polished / Scottish?" If either reviewer says no, back to
  iteration.

If after multiple iteration cycles Gate A or Gate B cannot be passed,
**close the spec**. The procedural path cannot deliver in this game;
revisit Option D (hybrid pixel-art pipeline) in a new spec.

This is the most important gate in the entire spec. Phases 1-4 do not
start until Phase 0 ships.

---

## 8. Phase 1 — Animation Foundation

### Component

Texture-swap animation across Player (all 9 variants) + 3 enemy
archetypes, built on Phase 0 infrastructure.

### Frames per state (authored budget, as charter §2)

| State | Frames | Tempo | Notes |
|-------|--------|-------|-------|
| idle | 2 | 2 fps loop | breathing |
| walking | 4 | 24 fps loop | contact → passing → contact → passing |
| attacking | 4 | 24 fps one-shot | anticipation → strike → impact → recovery |
| hurt | 2 | 30 fps one-shot | snap-compress → slow-release |
| celebrating | 4 | 12 fps loop | bounce cycle |
| dying | 3 | 12 fps one-shot | collapse |

Total per variant: 19 frames. × 9 variants = **171 haggis textures**.

### Integration

- `Player.ts` + `Enemy.ts` hold `AnimationController`.
- `update(scaledDelta)`: evaluate transitions pure, advance frameT, on
  frame boundary call `sprite.setTexture(key)`.
- No per-frame Graphics allocation.
- Retire `wobblePhase`.

### Hot-path protection

- Atlas pre-bake at boot (or lazy per-variant).
- Off-screen entities pause frame advance (via existing
  `SpatialCulling`).
- LOD: swarm enemies (midge, midgie_swarm) stay idle-loop only — they
  are ambient density, not readable actors.

### Ship criteria (no time-box, quality gate only)

- Phase 0 passed.
- 24 fps texture-swap animation on Player (all 9 variants) + chase +
  ranged + dive archetypes.
- `wobblePhase` retired.
- All 6 states authored for Player.
- Atlas bake measured + within budget set by Phase 0 measurement.
- No FPS regression under AutoBattler stress (200 enemies, 10×
  time scale).
- Pure helper tests (state machine, frame clock, atlas key mapping,
  LOD gating) — ~30 tests.
- **Gate A** (self-review after 24 h cooldown) passes.
- **Gate B** (external review of in-game gameplay) passes for ≥ 2
  reviewers.

### Ship order

Sequential commits. No fixed time per step.

1. `animationStates.ts` + tests.
2. `frameClock.ts` + tests.
3. `textureAtlas.ts` + tests (key mapping).
4. `AnimationController.ts` + tests.
5. Classic haggis idle + walking (proving harness at Phase 0 scale).
6. Classic haggis hurt + attacking + celebrating + dying.
7. Remaining 8 variants — per-variant atlas.
8. Wire Player to controller. Retire wobblePhase.
9. Enemy archetype: chase (buckfast_ned).
10. Enemy archetype: ranged (haggis_hunter).
11. Enemy archetype: dive (eagle).

### Phase 1 non-goals

- Skeletal rig.
- Accessory layers (Phase 2).
- Wildlife / flora animation (Phase 3).
- Audio hooks (Phase 4).
- All enemy types — just the 3 archetypes; long tail is Phase 2.5+.
- Per-variant body-shape differences beyond palette (Phase 2.5).

---

## 9. Phase 2 — Haggis-Wears-Build

### Component

Compositional haggis. `HaggisContainer` with layered child sprites per
accessory. Each accessory is a pre-baked atlas.

### Container layout

```
HaggisContainer (Phaser.GameObjects.Container)
├─ body_sprite          · variant × state × frame atlas (Phase 1)
├─ layer_behind_sprite  · optional (claymore, kilt-back)
├─ layer_body_sprite    · optional (sporran, sash, flask, …)
├─ layer_front_sprite   · optional (shield, kilt-front, …)
└─ layer_above_sprite   · optional (tam, thistle crown)
```

### Variant × accessory handling

Each accessory atlas ships per-variant where the accessory shape
genuinely differs on different body shapes. Classic baseline; variant-
specific atlases authored only when the accessory sits visibly wrong on
the classic pose for another variant.

(Variant body-shape refactor is Phase 2.5 per §11 — in MVP all variants
share body shape. Accessory authoring targets the classic pose first;
per-variant tweaks land when the variant body shape lands.)

### Combination preview tool (NEW — real dev work budget)

`src/scenes/dev/CombinationsPreview.ts` — a full scene (not a mere
overlay) that:

- Iterates all passive × weapon × variant permutations.
- Renders haggis container instances in a paginated grid.
- Navigation (next/prev page, filter by variant or by accessory).
- Screenshot capture for external-review packaging.

Scoped as ~1-3 days focused work — NOT a quick overlay. Shipped at the
start of Phase 2 (step 3 in ship order), used by every subsequent
drawer.

### MVP accessory scope — 6 drawers

Each passes its own mini-gate (charter + 24 h cooldown + combination
preview visual-conflict check):

| Accessory | Layer | Proves |
|-----------|-------|--------|
| sporran | body | sway-with-walking (Phase 1 state-reactive) |
| tam_o_shanter | above | above-body + facing rotation |
| kilt | front+behind | dual-layer proof |
| claymore | behind | weapon-on-back, facing-rotated |
| caber_toss | front | shouldered + attacking-state integration |
| bagpipes | body | body-hugged + passive-aura particles |

### Ship criteria

- `HaggisContainer` refactor complete; invisible behaviour change.
- 6 MVP accessories shipped; each passed charter + cooldown review +
  combination preview.
- Pickup → accessory child spawn wired end-to-end.
- Game-over screen shows assembled silhouette (external reviewer can
  identify ≥ 3 of 6 accessories from the silhouette alone).
- No FPS regression under AutoBattler stress.
- `docs/ACCESSORY_AUTHORING.md` — workflow including 3-gate review +
  combination preview.
- **Gate A + Gate B** (per charter) on a full 5-minute run with all 6
  accessories collected.

### Ship order

1. HaggisContainer refactor.
2. AccessoryDrawer interface + atlas pre-bake helper.
3. Combination preview scene.
4. Drawer sporran — iterate until bar met.
5. Drawer tam_o_shanter — iterate until bar met.
6. Drawer kilt — iterate until bar met.
7. Drawer claymore — iterate until bar met.
8. Drawer caber_toss — iterate until bar met.
9. Drawer bagpipes — iterate until bar met.
10. Game-over silhouette render.
11. ACCESSORY_AUTHORING.md.

### Phase 2 non-goals

- Remaining 11 accessories (Phase 2.5).
- Evolved-weapon distinct drawers (Phase 2.5).
- Per-variant body-shape differences (Phase 2.5).

---

## 10. Phase 3 — World Depth

### Component

Biome flora + terrain + weather + wildlife at the same craft bar.

### Architecture

All flora / wildlife sprites ship as Phase 1 texture atlases.
Animation = texture-swap on frame change, same pattern. Weather
particle system uses pre-baked particle textures, runtime updates
position + alpha only.

### MVP scope — heather biome

- Heather + thistle flora density across heather voronoi cells.
- Sway animation (flora frame-atlas, 3-4 frames gentle cycle).
- 1 wildlife species — **hare** (2-state atlas: hopping + idle).
- 1 weather beat — **mist drift** (particle pool, ~90 s cycle).
- Text cut: `biomes.heather.entry` → purple bloom ripple VFX.
- Terrain scatter: ~3 cairn / waymarker features per biome cell.

### Ship criteria

- Heather biome passes external-review "a place, not an empty canvas"
  test.
- Flora sway via frame-clock; no FPS regression.
- Hare animated at 24 fps.
- Seed-determinism: same seed → same world.
- `docs/BIOME_DRESSING.md`.
- **Gate A + Gate B** on a 5-min run in the heather biome.

### Ship order

Each step iterates-until-bar-met:

1. Flora species primitives — heather + thistle + grass-tuft atlases.
2. `BiomeFlora` placement into voronoi cells at biome seed.
3. Flora swaying (frame-atlas driven).
4. Hare wildlife — draw + flee behaviour + 2-state animation.
5. `WeatherLayer` skeleton + mist beat.
6. Heather entry toast removal + bloom ripple VFX.
7. Terrain scatter (cairns, waymarkers).
8. BIOME_DRESSING.md.

### Phase 3 non-goals

- Dressing all 4 biomes (Phase 3.5).
- Weather-as-gameplay.
- Wildlife as gameplay entities.
- Day/night cycle.
- Seasonal / MoorState.

---

## 11. Phase 4 — Music & Sound (scope-reduced per v2 critique)

### Scope kept (audible over combat)

- **Per-biome ambient beds.** Crossfade on biome entry — persists under
  combat, sets location. `BiomeAmbience.crossfadeTo(biome)`.
- **buildDensity Conductor axis.** Fuller build = richer orchestration,
  read compositionally — registers through the whole mix.
- **Low-HP toast → heartbeat-only formalisation.** Heartbeat already
  exists; remove the toast call site.
- **Weapon-evolve sting** (already exists; formalise in the sting
  registry).
- **Curse-start dissonance shimmer.** Short, high-priority, cuts
  through.

### Scope dropped (drown in combat noise per v2 tear-down)

- ~~Per-accessory SFX signatures~~
- ~~Per-weapon motif layer~~

### Ship criteria

- Heather ambient bed shipped + crossfade on entry.
- `buildDensity` axis in Conductor mood calculation.
- Low-HP toast removed; heartbeat carries it.
- Curse-start shimmer signal.
- No audio regression.
- `docs/AUDIO_AUTHORING.md`.
- **Gate A + Gate B** on a 5-min run with biome transition + curse
  acceptance + low-HP state.

### Ship order

1. `BiomeAmbience` module + heather bed.
2. `BiomeController.crossfadeTo` wiring.
3. Conductor `buildDensity` axis.
4. Low-HP toast removal.
5. Curse-start shimmer signal.
6. AUDIO_AUTHORING.md.

---

## 12. Phases 2.5, 3.5, 4.5 — the long tail (elevated to first-class)

Previous spec versions buried these in "open follow-ups." v3 elevates
them — they are where the 25-ship count lives. Each phase ships when
craft bar + external review pass for that item, same as MVP phases.

### Phase 2.5 — accessory long tail + variant shape (~20 ships)

**11 remaining accessories, each a ship:**

| Ship | Scope |
|------|-------|
| whisky_flask | passive drawer across states |
| irn_bru | passive drawer across states |
| loch_water | passive drawer across states |
| thistle_crown | passive drawer (above layer) |
| highland_shield | passive drawer (front layer, facing-rotated) |
| tartan_sash | passive drawer (body layer, always-visible) |
| thistle_shot | weapon drawer (held/carry position) |
| scotch_mist | weapon drawer (waist charm) |
| haggis_hurler | weapon drawer (slingshot pose) |
| nessie_tentacle | weapon drawer (wrapping body) |
| bagpipe_blast | weapon drawer (small pipes) |

**Evolved-weapon distinct drawers (7 ships):** one per evolved form —
thistle-crown-evolved, claymore-evolved, caber-evolved, bagpipes-
evolved, etc. (bagpipes weapon is utility-only, no evolution.)

**Per-variant body-shape refactor (2 ships):**
- Body-shape parameterisation (iron_belly chunky, moor_runner
  elongated, wee_ghostie translucent, laird regal, etc.) lifted into
  the haggis atlas.
- Accessory drawers adapted per variant where the base-pose fit is
  visibly wrong.

**Phase 2.5 total: ~20 ships.** Each at craft bar.

### Phase 3.5 — remaining biomes (3 ships)

- Bog biome fully dressed.
- Loch biome fully dressed.
- Pine biome fully dressed.

Each = flora + terrain + wildlife + weather + text cut. Pattern from
Phase 3 MVP.

**Phase 3.5 total: 3 ships.**

### Phase 4.5 — audio accretions (ongoing)

Per-boss stings, additional conductor axes, weather audio beats — as
future systems demand. Not a fixed list; accretes over time.

### Total ship count

- Phase 0: **1 ship** (prototype + style bible).
- Phase 1: **4 ships** (player animation + 3 enemy archetypes).
- Phase 2: **6 ships** (MVP accessories) + container refactor.
- Phase 3: **1 ship** (heather biome fully dressed).
- Phase 4: **1 ship** (audio enrichment MVP).
- Phase 2.5: **~20 ships.**
- Phase 3.5: **3 ships.**
- Phase 4.5: **ongoing.**

**MVP (Phases 0-4): 13 discrete shipped pieces.**
**Full surface (Phases 0-4 + 2.5 + 3.5): ~36 discrete shipped pieces.**

This is the honest answer to the "25 HUGE things" frame. 25 shipped
pieces is achievable — and more — but over the full project surface,
not in 3-4 months. Each ship is bounded, each passes the same bar,
each lands in its own commit.

---

## 13. The "25 huge things" question, addressed directly

The user's original question was "what enables shipping 25 HUGE MASSIVE
things?" Across three spec iterations that question was only partially
honoured. v3 addresses it head-on:

**There is no meta-enabler that unlocks 25 huge things.** Every plan
that claimed one was inflating. What IS achievable, with no time-box
and relentless quality, is:

- **One flagship spec** (this document) spanning 5 phases of MVP (Phases
  0-4) + 2 phases of long tail (2.5, 3.5) + ongoing (4.5).
- **~36 discrete shippable pieces** across the full surface, each
  passing the charter + external review.
- **Each ship is a "huge" piece by the project's own scale** — an
  authored accessory at handcrafted bar is a real deliverable, not a
  line-change.
- **Shipped in sequence, no parallel phases.** Each prior phase gates
  the next. No "work on 5 things at once" fiction.

The 25-count is a natural consequence of commitment to craft, not a
marketing target. It emerges when the plan's full surface is shipped
honestly.

---

## 14. Kill criteria (mechanical, not aspirational)

Two gates, both hard pass/fail:

### Gate A — craft bar met

After 24-hour cooldown, developer reviews the new work side-by-side
with at least 3 existing reference sprites (e.g. `dean_apparition`,
`tome_wraith`, `redcap`). Binary self-assessment: bar met / not met.
If not met: rework. If repeatedly not met: escalate to Gate C.

### Gate B — external review

Developer captures 15-30 s gameplay clip + screenshot grid. Posts to
≥ 2 non-developer reviewers with a specific question:
- Phase 0: "Does this look handcrafted / polished / Scottish?"
- Phase 1: "Does the animation look right — not choppy, not stiff?"
- Phase 2: "Count the items equipped on the haggis in this
  screenshot." (Target: ≥ 60% correct.)
- Phase 3: "Does this look like a real place or an empty canvas?"
- Phase 4: "Does the audio-on moment feel better than audio-off?"

If the question's target fails across ≥ 2 reviewers: rework.

### Gate C — spec close

If a drawer cannot pass Gate A + Gate B after ≥ 5 iteration cycles on
the same drawer, **close the spec**. The procedural path cannot deliver
in this game at this bar. Revisit Option D (hybrid pixel-art pipeline)
in a new spec.

Phase-level FPS regression check is engineering hygiene, not a kill
criterion.

---

## 15. Cross-cutting concerns

### Replay determinism

Every new system reads from state + `scaledDelta` + seeded RNG.
Texture atlases are deterministic content — generated from pure drawer
code. T1 contract preserved.

### Hot-path protection

- Atlas pre-bake: one-time; measured at Phase 0.
- Runtime per-frame cost: O(1) texture-key lookup + setTexture.
- Off-screen entities pause frame advance.
- LOD: swarm enemies idle-loop only.
- Gate: no AutoBattler regression vs pre-push baseline.

### Mobile tradeoff (W95 flagship, backlog)

Atlas memory budget ~20-22 MB GPU, worst-case mobile ~90 MB with
padding. Called out so the W95 mobile-native push (when elevated) can
plan for LOD atlasing or runtime packing. Not a blocker here.

### Testing strategy

- Pure helpers: state transitions, frame clock, atlas key math, drawer
  layout, flora placement, wildlife behaviour, weather state, crossfade
  state, buildDensity math — ~80+ new tests across phases.
- Integration: Playwright smoke + AutoBattler stress.
- Visual review: combination preview + external review gates per phase.
- Playtest: gate B per phase MVP.

### 24-hour cooldown

Every drawer's "ship" claim waits ≥ 24 hours before developer review.
Mitigates sunk-cost bias. Baked into §2 authoring process.

### Dependency map

- Phase 0: existing BootScene texture pipeline, classic variant, tam.
- Phase 1: Phase 0, TimeManager, SpatialCulling, Player, Enemy.
- Phase 2: Phase 1 (atlas pattern + state machine), LevelUpFlow
  pickup paths.
- Phase 3: Phase 1 (atlas pattern for wildlife), BiomeManager +
  Controller + Renderer + runRng.
- Phase 4: AudioSystem + ProceduralMusicEngine + SFXManager +
  Conductor — no cross-phase dependency for scope-reduced v3.
- Phase 2.5: Phase 2 (container + pattern).
- Phase 3.5: Phase 3 (dressing pattern).
- Phase 4.5: Phase 4 (audio registry).

---

## 16. Plan decomposition

Each phase ships as its own plan document at writing-plans time:

- `2026-04-18-moor-phase-0-prototype-plan.md`
- `2026-04-18-moor-phase-1-animation-plan.md`
- `2026-04-18-moor-phase-2-wear-build-plan.md`
- `2026-04-18-moor-phase-3-world-depth-plan.md`
- `2026-04-18-moor-phase-4-audio-plan.md`

Phase 2.5 / 3.5 / 4.5 plans get written AFTER each respective MVP
phase ships — they depend on lessons from the MVP to scope properly.

Phases 1-4 do NOT start until Phase 0 passes. Phase 2.5 / 3.5 / 4.5
do NOT start until their respective MVP phase ships.

No parallel phases. Strictly sequential.

---

## 17. Implementation sequencing

```
Phase 0 — Prototype + style bible + dev affordances
   ↓ (Gate A + B pass)
Phase 1 — Animation Foundation
   ↓ (Gate A + B pass)
Phase 2 — Haggis-Wears-Build
   ↓ (Gate A + B pass)
Phase 3 — World Depth (heather MVP)
   ↓ (Gate A + B pass)
Phase 4 — Music & Sound (scope-reduced)
   ↓ (Gate A + B pass)
Phase 2.5 — accessory long tail + variant shape
Phase 3.5 — remaining biome dressings
Phase 4.5 — audio accretions

No time-box. Each phase ships when the craft bar is met.
Phase 0 is a real gate — not bureaucracy.
External review gate (Gate B) is load-bearing — solo dev cannot
self-judge procedural art objectively without outside eyes.
```

---

## 18. What this spec commits to

- **Quality over time.** Every ship passes charter + 24 h cooldown +
  external review. No shortcuts.
- **No time-boxing.** Each phase ships when done, per user directive.
- **~36 shipped pieces** across Phases 0-4 + 2.5 + 3.5.
- **Mechanical kill criterion.** Gate C (≥ 5 iterations failing) closes
  the spec and escalates to a pipeline-change decision.
- **Mobile tradeoff flagged, not hidden.**
- **Texture memory math corrected** (18-22 MB desktop, ~90 MB mobile
  worst case).
- **Dev affordances baked into Phase 0** (force-equip + force-state +
  combinations preview + screenshot capture).
- **External review gate formalised** — the single most important
  mitigation for solo-dev craft-bar drift.

What this spec does NOT commit to: a timeline. That is the point.
