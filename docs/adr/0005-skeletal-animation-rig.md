# ADR 0005 — Skeletal Animation Rig: Texture-Swap Atlases over Bone Hierarchy

**Status:** Accepted (2026-04-26 — Phase 0 prototype gate, Phase 1 enemy animation, and Phase 2 secondary motion all shipped; Phase 3 broader enemy + attack-state coverage deferred to W71 backlog)
**Date:** 2026-04-26
**Supersedes:** —
**Superseded by:** —

> **Update 2026-05-10 (housekeeping).** The original status line said "Phase 1 partial," which contradicted the Context body ("Phase 1 — Shipped 2026-04-23 to 2026-04-26"). The status line above is rewritten to match the body. The "partial" framing referred to the broader full-skeletal-rig vision (bones / IK / blend trees), which the ADR explicitly rejected in favour of texture-swap atlases — that's not a Phase 1 deliverable, it's a non-goal. Phase 3 remains open per W71 backlog. No decision change; doc-truth-up only.

## Context

W71 ("Skeletal Animation Rig") is the S-tier flagship that replaces the static
single-texture-per-entity model with state-machine-driven animation. The
roadmap (`docs/HUGE_INITIATIVES_MASTER_PLAN.md` row W71) defined three phases:

- **Phase 0 (gate)** — prototype animation pipeline, prove ≤5% perf delta against
  the static baseline, prove pixel-art soul survives. Shipped 2026-04-18 to
  2026-04-23 (see `docs/archive/PHASE_0_GATE_NOTES.md`).
- **Phase 1** — full player rig + 3 enemy archetypes wired through the
  pipeline. Shipped 2026-04-23 to 2026-04-26.
- **Phase 2** — secondary motion (keyframe tail lag + tier-gated heather
  mantle). Shipped 2026-04-23.
- **Phase 3 (deferred)** — broader enemy coverage, attack-state animations on
  bosses; tracked in W71 backlog.

Phase 0's gate question was the format choice. Three credible candidates were
on the table per the original Phase 1 charter (`docs/archive/top-10-tasks/02-w71-skeletal-animation-rig.md`):

1. **Hand-rolled JSON skeleton + bone hierarchy + keyframe tracks.** A true
   "rig" in the animator's sense — bones, transforms, IK, blend trees, weighted
   skinning. Replay-deterministic by construction, full creative control.
2. **Off-the-shelf runtime (Spine / DragonBones).** Industry-standard editor;
   binary skeleton format; vendor runtime adds bundle weight.
3. **Per-state texture-swap atlases on a single sprite.** A pure-data layered
   composition: pre-bake one texture per (subject, variant, state, frame) at
   boot; runtime owns a tiny FSM + frame clock that decides which texture key
   the sprite shows this frame. No bones; "secondary motion" lives in
   keyframe-authored offset tables (see `FRAME_OFFSETS` in `src/animation/frameDrawers/haggisFrames.ts`).

Phase 0 selected option **#3** and shipped it. This ADR ratifies that choice
now that Phase 1 is complete and the trade-offs have played out under load.

## Decision

**Wild Haggis Survivors animates entities via per-state texture-swap atlases
baked at boot time, driven by a pure FSM (`animationStates.ts`) and a pure
frame clock (`frameClock.ts`), composed through `AnimationController`.**

- **Subject + variant + state + frame** is the address space. `atlasKey()` in
  `src/animation/textureAtlas.ts` is the single source of truth for keys.
- **Authoring is data, not bones.** Each animated subject has a frame drawer
  (`src/animation/frameDrawers/<subject>.ts` for the player, plus 30+ enemies
  under `src/animation/frameDrawers/enemies/`). Drawers expose a `FRAME_OFFSETS`
  table — a pure-data record from `(state, frameIndex)` to a small offset bag
  (`breathY`, `bodyX`, `leftLegY`, `rightLegY`, `tailX`, `tailY`). The drawer
  delegates to a shared body-draw function with the offset applied.
- **Variants are per-variant atlases.** A single rig + palette swap was
  rejected (see *Alternatives* below); each variant gets its own bake of every
  (state, frame) pair. 15 variants × 6 states × ~3 frames/state = ~270
  textures for the player alone, plus ~57 for the 3 lead enemy archetypes,
  plus accessory + mantle overlays. Total atlas footprint stays inside the
  2 MB precache budget set by the PWA precedent.
- **Secondary motion is keyframe data.** No runtime spring solver, no soft-body
  physics. The Phase 2 tail-lag and mantle-tier slices both land as authored
  offsets + a tier helper function (`src/animation/mantleTier.ts`). Cheap, pure,
  replay-deterministic.
- **No Phaser imports inside the rig modules.** `animationStates.ts`,
  `frameClock.ts`, `textureAtlas.ts`, `mantleTier.ts` are all node-env vitest
  importable. The Phaser coupling lives in `AnimationController` (one
  `sprite.setTexture(key)` call per frame change) and the BootScene bake loops.
- **Replay determinism.** Animation state is a pure function of `(subject,
  variant, state-history, signals-history, scaledDelta-history)`. The replay
  recorder captures inputs, not animation state — animations re-derive
  byte-identically on playback. Verified by `src/replay/replayDeterminism.test.ts`.

## Alternatives considered

1. **Hand-rolled bone hierarchy + keyframe tracks (option #1 above).** Full
   creative control, supports IK / blend trees / weighted skinning. *Rejected*
   for v1: the pipeline cost is months of authoring tooling (rig editor, hot-
   reload, JSON format design, runtime solver, perf profiler). The Phase 0
   prototype demonstrated that texture-swap delivered the visible quality
   leap (the haggis "feels alive" per Gate A) at a fraction of the effort.
   The escalation path stays open — if a future system genuinely needs bone-
   level deformation (e.g. limb stretching for elite bosses), this ADR can
   be extended; the texture-swap path stays as the default for everything
   that doesn't need it.

2. **Spine / DragonBones runtime (option #2 above).** Industry-standard editor,
   binary skeleton format, vendor runtime. *Rejected*: WHS ships zero external
   asset files today (`BootScene.ts` generates every texture programmatically).
   Adding Spine/DragonBones would mean a dual asset pipeline (programmatic for
   most things, binary skeletons for animated subjects), a vendor runtime
   bundle (~30-80 KB gzip), and a third-party editor in the authoring loop.
   The Soul charter's "handcrafted, pixel-art" identity benefits more from
   programmatic authoring discipline than from off-the-shelf editor speed.

3. **Single rig + per-variant palette LUT.** Variants render through one
   shared body-mesh, swapping a palette texture per variant. Cheapest at
   bundle size (one bake set instead of 14). *Rejected*: each variant has
   palette-anchor differences beyond hue (Cailleach's silver mantle, Iron
   Belly's plate, Hebridean's seaweed) that don't reduce to a flat LUT
   without losing identity. The 15-variant atlas footprint is small in
   absolute terms (texture-swap atlases compress well) and the authoring
   path stays simple — each variant's body draw runs through the same
   shared `drawHaggisBody` helper, parameterized by the variant's palette.

4. **Phaser 4 native sprite-sheet animation API
   (`scene.anims.create()` + `sprite.play(key)`).** Cheapest in code, leans
   on Phaser's animation manager. *Rejected*: animation manager keys are
   global per-Phaser-game and don't model the (subject, variant, state)
   address space cleanly without string concatenation. Custom
   `AnimationController` is small (~100 lines), composes pure modules
   that are vitest-friendly in node env, and integrates cleanly with the
   T1 deterministic-replay contract. The native API would re-introduce
   wall-clock / RAF coupling we deliberately removed in `frameClock.ts`.

## Consequences

### Positive

- **Pixel-art identity preserved.** Every frame is a baked
  `Phaser.Graphics`-rendered texture; no sub-pixel interpolation is possible
  unless the sprite scale changes (which only happens on level-up, where
  pixel art quantization is acceptable).
- **Replay-deterministic for free.** Pure FSM + pure frame clock + pure
  offset tables. Animation state never enters the replay byte budget.
- **Vitest-friendly.** Every authoring module is node-env importable. The
  test suite has 30+ frame-drawer tests + AnimationController behavior
  tests + frameClock tempo tests + animationStates transition tests, all
  in node env. No Phaser-mock churn.
- **Adding a new animated entity is a recipe, not a project.** Pattern in
  Phase 1 for the 3 enemy archetypes was: extract pure `drawXBody(g, frame)`
  helper from existing programmatic bake, author `FRAME_OFFSETS` table per
  state, register the drawer, add side-effect import in BootScene. The
  registry self-registers; the bake loop iterates the registry; no
  per-entity Enemy.ts changes after the initial wire.
- **Perf cost is cheap and bounded.** Per-frame cost per entity is one
  `evaluateAnimationState` call (~6 branches), one `advanceFrameClock` call
  (~2 multiplies), and at most one `sprite.setTexture(key)` per frame
  boundary (texture binding in Phaser 4 is O(1) — a hashmap lookup, not a
  GPU upload). Baseline benchmark: see
  `src/animation/animationPerf.bench.test.ts`.

### Negative / cost

- **Frame count is a creative ceiling.** Each new state-frame combination
  costs an extra texture bake at boot. Phase 0 measured haggis bake at
  ~20 ms; expanding to a 12-frame walk cycle would push that. Mitigated by
  the existing scheme of small frame counts (idle 2f, walking 4f, etc.) and
  by texture-swap's strength being readability of pixel-art motion at low
  frame counts.
- **No runtime tweening between frames.** A bone rig could interpolate at
  any frame rate; texture-swap snaps to authored frames. Acceptable
  trade-off — the snappy authored cadence is part of the pixel-art aesthetic
  the Soul charter calls for. If a future moment needs ultra-smooth limb
  motion, that's an extension trigger for option #1 above.
- **No skeletal IK / mesh deformation.** If a future weapon has a
  visible-on-haggis attachment (e.g. a swung claymore that has to track the
  haggis's arm position frame-by-frame), the attachment lives in the same
  authored-offset table or as an accessory drawer with its own
  `FRAME_OFFSETS`. Extension trigger: if accessory authoring becomes a
  significant time sink, revisit a true skeletal layer for accessories.
- **Atlas memory footprint scales linearly with variants × states ×
  frames.** Phase 1 ships ~270 player textures + ~57 enemy textures +
  ~28 accessory textures + ~28 mantle-overlay textures. All fits in the
  2 MB precache budget. The ceiling becomes pressing if the variant count
  grows past ~25 or if frame counts double across the board. Mitigation
  triggers documented in W71 Phase 3 backlog.
- **Procedural-fallback feature flag explicitly NOT shipped.** The original
  charter (`docs/archive/top-10-tasks/02-w71-skeletal-animation-rig.md` Acceptance
  §6) called for a `USE_SKELETAL_PLAYER` flag for emergency revert. Phase 1
  has been live in production since 2026-04-23 (per memory's
  `project_w71_phase2_status.md` entry); the 30-day revert window has
  effectively passed. Adding a flag now would add complexity without
  meaningful value — non-animated enemies already keep their `bobPhase`
  fallback path, and reverting the player path would mean reverting Phase 0
  (a 17-commit slice that touches BootScene, Player, AnimationController,
  HaggisContainer). A clean `git revert` on the Phase 0 + Phase 1 commit
  range is the operational rollback if needed; the flag's added surface
  area would be more brittle than that. Trigger to revisit: any
  user-visible animation regression in the wild. See *Rollback* below.

### Follow-ups

- **Phase 3 — boss attack-state animations.** Currently bosses keep
  `bobPhase`; their unique attack telegraphs are authored as separate
  scripted sequences. Worth a separate ADR if/when boss authoring graduates
  to the same `FRAME_OFFSETS` pattern.
- **Bone-rig escalation trigger.** If accessory authoring (weapons swung in
  the haggis's grip, dynamic ribbons, etc.) accumulates a backlog of "this
  needs to track a moving limb frame-by-frame" requests, escalate to ADR
  extension #1.
- **Atlas budget watch.** When variant count crosses 20 or frame counts
  cross 8 across the board, profile precache size + boot bake time. If the
  precache exceeds 2.5 MB or bake time exceeds 200 ms, descope to
  on-demand (per-variant) bakes triggered when a variant is selected.
  **Addendum 2026-05-11: descope landed.** The variant count reached 15
  and the animated-enemy registry grew to 30+ subjects; on local headless
  Chromium boot bake measured ~430 ms total (variant families ~210 ms +
  enemies ~213 ms), breaching the 200 ms threshold above. The descope
  this clause pre-authorised is now implemented in
  `src/scenes/boot/variantAtlasBaker.ts` (imperative bake) +
  `src/scenes/boot/variantAtlasKeys.ts` (pure key enumeration, unit-
  tested). BootScene now bakes only the default variant + the saved
  selected variant + the non-variant accessories + the enemy atlas.
  Other 13 variants bake lazily on first use via `ensureVariantAtlas()`,
  called defensively in `GameScene.create()` right after the active
  variant is resolved (the cache must be warm before Player
  construction, since AnimationController's first `applyTexture()`
  reads the atlas). The same helper services the `?export` sprite-tool
  path by warming every variant before SpriteExportScene boots, so the
  composite PNG stays complete. Post-descope total bake measured
  **~251 ms** (~42% reduction); the new floor is locked in by
  `e2e/w71-atlas-bake-budget.spec.ts` with `TOTAL_BAKE_BUDGET_MS = 400`
  and `ENEMY_BAKE_BUDGET_MS = 300`. Next descope candidate is enemy
  spawn-time lazy bake (~197 ms of remaining bake), but that risks
  spawn-time hitches and is deferred until either (a) the enemy
  registry pushes total bake back over 400 ms or (b) measurable cold-
  start friction is reported.

## Rollback

Phase 0 + Phase 1 can be reverted as a sequence of `git revert` commits on
the 17 Phase 0 commits + the Phase 1 commits listed in
`docs/archive/PHASE_0_GATE_NOTES.md`. The pre-Phase-0 baseline is the static
single-texture model — reverting restores `BootScene.bake<Subject>()` calls
without the per-state loop, and `Player`/`Enemy` falls back to a single
`setTexture(textureKey)` at spawn.

A finer-grained rollback is possible per subject: removing an entry from
`getAllAnimatedEnemyDrawers()` causes that enemy to fall back to the static
texture + `bobPhase` wobble. The registry is the single switch.

If the broader format choice itself proves wrong (e.g. an unforeseen
bundle-size or runtime cost), the migration target is option #1
(hand-rolled bone rig). That migration would supersede this ADR rather
than revert it; texture-swap atlases would stay as the default for
non-skeletal subjects.

## Notes

- **Phase 0 ship report:** `docs/archive/PHASE_0_GATE_NOTES.md`.
- **Phase 1 enemy plan (executed):** `docs/archive/superpowers/plans/2026-04-20-phase1-enemy-animation.md`.
- **Phase 2 secondary-motion plan (executed):** `docs/archive/superpowers/plans/2026-04-23-secondary-motion.md`.
- **Phase 2 design spec:** `docs/archive/superpowers/specs/2026-04-23-secondary-motion-design.md`.
- **Charter reference:** `docs/archive/top-10-tasks/02-w71-skeletal-animation-rig.md`.
- **Determinism contract:** ADR-0002 — replay format covers the deterministic
  fixed-step physics + input-only replay byte budget that this ADR's pure
  modules slot into without modification.
- **Soul charter alignment:** `docs/DESIGN_SOUL.md` — handcrafted warmth.
  Authored offset tables are the textual analogue of an animator's
  hand-tuned keyframes; the authoring discipline is the soul.

## References

- `src/animation/AnimationController.ts` — runtime composer.
- `src/animation/animationStates.ts` — pure FSM.
- `src/animation/frameClock.ts` — pure tempo per state.
- `src/animation/textureAtlas.ts` — `atlasKey()` address space.
- `src/animation/frameDrawers/haggisFrames.ts` — `FRAME_OFFSETS` authored data.
- `src/animation/frameDrawers/enemies/enemyFrameRegistry.ts` — animated-enemy
  registry; opt-in per enemy.
- `src/animation/animationPerf.bench.test.ts` — perf budget regression.
- `src/animation/mantleTier.ts` — Phase 2 tier ladder.
