# Prompt #2 — W71 Skeletal Animation Rig (Phase 1+)

## Goal

Replace procedural sprite-draw on player + key enemy archetypes with a skeletal rig + state machine, building on the Phase 0 prototype + Phase 2 secondary-motion slice already shipped (2026-04-23). Phase 1 covers full player rig with state-machine animation; Phase 3 covers three enemy archetypes (humanoid, beast, large boss). This is the largest engine-touching change on the roadmap.

## Why this is #2

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` flags W71 as S-tier with explicit Phase 0 gate before any Phase 1 work. The decision affects:
- BootScene (the 6760-line monolith currently programmatic for every entity).
- Asset pipeline (rig serialization, runtime loading, hot-reload story).
- Perf budget (keyframe sampling per entity, vertex-or-mesh-deformation cost).
- Variant system (each haggis variant currently re-tints procedural draw — rig would mean per-variant skeletal layer or palette swap).
- Replay determinism (animation state must be deterministic or excluded from the replay byte budget).

Estimated 8–12 weeks across phases. High regression surface. Memory says Phase 0 prototype shipped (2026-04-23 phaser4-migration era) and Phase 2 secondary-motion (keyframe tail lag + tier-gated mantle) shipped same day — Phase 1 base rig has not been started.

## Source documents

1. `docs/superpowers/plans/2026-04-20-phase1-enemy-animation.md` — Phase 1 enemy-animation plan (likely the start of this).
2. `docs/superpowers/plans/2026-04-23-secondary-motion.md` — Phase 2 plan (already executed, useful as reference for cadence).
3. `docs/superpowers/specs/2026-04-23-secondary-motion-design.md` — Phase 2 design.
4. `docs/PHASE_0_GATE_NOTES.md` — Phase 0 gate criteria + outcomes.
5. `docs/superpowers/plans/2026-04-18-moor-phase-0-prototype-plan.md` — earlier Moor phase-0 work (different but informative for the gate process).
6. `docs/research/MUSIC_ART_TECH_RESEARCH.md` §Phaser shader / animation sections.
7. `docs/research/GAME_FEEL_RESEARCH.md` §Anim cadence + secondary motion.
8. `docs/ART_STYLE_BIBLE.md` — palette + signature motifs (must survive the rig change).
9. `docs/ART_AUDIT.md` — variant-aware accessory offsets, pipe_breath clash already noted as follow-ups.

## Scope

### Phase 1 — Player rig + state machine
1. **Pick the rig format.** Options:
   - Hand-rolled JSON skeleton + bone hierarchy + keyframe tracks (matches existing programmatic BootScene philosophy; full control; replay-deterministic).
   - Spine / DragonBones runtime (Phaser 4 supports both; off-the-shelf editor; binary format).
   - Phaser 4 native sprite-sheet animation at higher fidelity (cheapest, least flexible).
   The Phase 0 prototype has answered this — read `PHASE_0_GATE_NOTES.md` first; don't reopen the format choice unless the gate says to.

2. **Build the player rig.** Bones for body, head, four legs (drift!), tail, accessory anchor (cap, scarf, mantle). Mantle anchor already exists from Phase 2.

3. **State machine.** States: idle, walk, run, hit, dash (if added), level-up, death. Transitions must respect drift (clockwise rotation during walk = visible in the rig).

4. **Variant overlays.** Each of the 14 variants currently re-tints procedural draw. Two strategies:
   - **Palette swap only** — single rig, per-variant palette texture. Cheapest.
   - **Per-variant overlay layer** — rig stays, each variant adds a costume sprite (Cailleach robe, etc.). Better visual variety.
   Pick one; document in ADR.

5. **Perf budget gate.** Frame time on representative scene (200 enemies + player + projectiles) must not regress >10%. Phaser 4 fixed-step at 60 fps must stay deterministic — animation state read-only during physics step.

### Phase 3 — Three enemy archetypes
After Phase 1 ships:
1. **Humanoid** (bandit/priest/laird's man) — biped rig, walk + attack + hit + death.
2. **Beast** (dog/wolf/highland coo) — quadruped rig, lower bone count.
3. **Large boss** (gordon/tour_bus/taxman) — multi-segment, scripted attack-state animations.

Don't expand to all enemy types in this prompt — stop at three archetypes and reuse them across enemy data definitions in `src/data/enemies.ts`.

## Sub-tasks

1. Re-read Phase 0 gate notes; confirm format choice. Block on Phase 0 not yet passed.
2. ADR for rig format + variant overlay strategy → `docs/adr/0005-skeletal-animation-rig.md`.
3. Build rig editor / authoring tool OR adopt off-the-shelf. If hand-rolled, plain JSON in `src/animation/rigs/*.json`.
4. Implement runtime: `src/animation/SkeletalRig.ts`, `src/animation/StateMachine.ts`, `src/animation/AnimationPlayer.ts`. Pure modules — no Phaser imports — so vitest can cover them in node env.
5. Wire rig into Player. Keep procedural fallback behind a feature flag (`USE_SKELETAL_PLAYER`) for first month so revert is one flag.
6. Per-variant palette / overlay system. Validate all 14 variants render correctly.
7. Perf benchmark spec (`src/animation/SkeletalRig.bench.test.ts` or e2e perf gate). Compare procedural baseline to rigged.
8. Phase 3 enemies (humanoid first, beast second, boss third).
9. Update `BootScene` to no longer generate procedural textures for migrated entities.
10. Replay determinism regression — re-run `src/replay/replayDeterminism.test.ts` to confirm rig animation doesn't bleed into replay byte budget.

## Acceptance criteria

- Player + 3 enemy archetypes render via skeletal rig in production builds.
- All 14 variants visually distinct.
- Frame-time regression ≤10% on the perf-bench scene.
- Drift visibly readable in the player walk cycle.
- Replay byte size unchanged ±5%; determinism test green.
- Procedural fallback flag still works for emergency revert (first 30 days).
- ADR-0005 merged with format + variant decision rationale.
- `npm run ci:all` green.
- Soul Check covered: warmth (player rig should keep "wee haggis" energy), animation cadence per `GAME_FEEL_RESEARCH.md`.

## Anti-patterns to avoid

- **Don't import Phaser inside the rig modules.** Phaser eval touches `window` at import — breaks vitest node env. Keep `SkeletalRig` / `StateMachine` pure; the binding to `Phaser.GameObjects.Container` happens in a thin adapter in scene code.
- **Don't bypass `core.fixedStep`.** ADR-0002 Phase 3 — physics integration must stay 60 fps deterministic. Animation update happens in Phaser's RAF loop, which is fine; just don't read animation state inside the physics step.
- **Don't tint over a rig that already has palette layers.** `clearTint()` clears all tints — see CLAUDE.md gotcha. If rig uses tint-on-bone for variant palette, hit-flash damage tint must restore it via a `baseTint` field per bone.
- **Don't ship without a fallback flag.** This is too big to revert at PR-level if a perf issue surfaces post-deploy.
- **Don't re-write BootScene in this prompt.** BootScene de-monolithing is a separate effort (related to T401 #10 in this list). Migrate textures one entity at a time, leave the rest procedural.

## Verification path

```
npm run lint
npm run build
npm test                # incl. SkeletalRig + StateMachine vitest
npm run test:e2e        # playwright smoke
npm run preview         # eyeball in browser, all 14 variants, drift cycle, hit reactions
```

Plus:
- Perf-bench scene at 200 enemies, frame time before vs after.
- Loom recording of all 14 variants idle + walk + hit for visual review.

## Soul checks

- `GAME_FEEL_RESEARCH.md` §Anim cadence — squash/stretch, anticipation frames, follow-through. Cite specific section in PR.
- `ART_STYLE_BIBLE.md` palette anchors must survive the rig (no off-palette pixels introduced via interpolation).
- Drift mechanic must remain visually readable — it's the core identity. If walk cycle hides the clockwise bias, the rig has failed Soul Check.

## CLAUDE.md gotchas relevant here

- Phaser ScenePlugin vs SceneManager — rig hot-reload (DEV only) goes through `game.scene.getScene('Game')`.
- Pixel art: rendering is `pixelArt: true, roundPixels: true`. Rig must not interpolate sub-pixel positions or visual style breaks. Quantize to integer pixels each frame.
- Player visual scaling on level-up uses `setCircle()` with unscaled radius — rig anchor must scale equivalently when level-up bumps player size.
