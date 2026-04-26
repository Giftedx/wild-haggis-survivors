# Prompt #5 — Scene Refactor + Biomes + Endless Mode

## Goal

Land the three-phase cascade in `docs/superpowers/specs/2026-04-13-scene-refactor-biomes-endless-design.md`:
- **Phase A** — extract `CollisionRouter`, `LevelUpFlow`, `RunLifecycle`, `OverlayStack`, `SceneResetter` from the GameScene monolith. Take it from ~2898 lines to ~400 with zero behaviour change.
- **Phase B** — Biome system (4 biomes minimum, biome-aware spawn weighting, tile classification, ambient SFX integration).
- **Phase C** — Endless mode (Post-Bell escalation already partial; add elite variants, overcharge evolution, retention curve).

Estimated 4–6 weeks. High regression surface but well-isolated phases.

## Why this is #5

The scene refactor portion overlaps with T401 (#10 in this list) — Phase A is the infrastructure that T401 builds on. Biomes and Endless are user-facing features the game has been missing despite the data-driven scaffolding existing. `docs/PRD.md` flags Endless as a stretch but well-spec'd.

It's behind A1/W71/P3/W95 because all four of those are public-ship blockers on the platform side. Scene refactor can wait until they're scoped, then unblocks faster work after.

## Source documents

1. `docs/superpowers/specs/2026-04-13-scene-refactor-biomes-endless-design.md` — primary spec, three-phase.
2. `docs/superpowers/specs/2026-04-13-gamescene-demonolith-design.md` — Phase A details.
3. `docs/PRD.md` — Endless mode PRD section.
4. `src/scenes/GameScene.ts` — current monolith.
5. `src/core/PostBellEscalation.ts` + `src/core/PostBellEscalation.test.ts` — partial Endless infrastructure already in place.
6. `src/systems/BiomeManager.ts` + `BiomeManager.test.ts` — biome scaffolding exists.
7. `src/data/biomeI18n.smoke.test.ts` — biome i18n hook already wired.
8. `docs/research/ROGUELITE_RESEARCH.md` §1 — Endless precedents (Vampire Survivors curse cycles, Brotato wave spike).

## Scope

### Phase A — GameScene de-monolith
Extract five modules:
1. **`CollisionRouter`** — owns physics overlap registrations + handlers. GameScene currently has ~30 overlap setups inline.
2. **`LevelUpFlow`** — owns the level-up presentation + card draw + reroll + pause-resume cycle. Currently inline + `UpgradeCardsUI`.
3. **`RunLifecycle`** — owns `start` / `pause` / `resume` / `victory` / `death` transitions + state cleanup. Memory: composer audit B21 (boss kill + player death same frame race) lives here.
4. **`OverlayStack`** — owns the priority-ordered overlay queue (Pause vs Level-up vs Curse vs ActIntermission vs GameOver). Today the order is implicit and edge cases bite.
5. **`SceneResetter`** — owns `create()` reset of all transient state (per CLAUDE.md gotcha: scene reuse means field initializers don't re-run). Currently top of `GameScene.create()` is the one source of truth and it's fragile.

Each module:
- Pure interfaces over Phaser scene refs.
- Vitest-coverable in node env (split testable logic from Phaser glue).
- Backwards-compatible on first ship (no behaviour change).

### Phase B — Biome system
1. Already-existing `BiomeManager` extends to:
   - Four biomes minimum: Moor (today's default), Burn (river crossing), Wood (forest cover), Bothy (shelter / interior).
   - Biome-aware spawn weights (see `SpawnSystem` data).
   - Per-biome ambient SFX (`AudioSystem` + music engine cross-fade).
   - Tile classification (path / cover / water / hazard) read by enemy AI for cover-seeking.
   - Biome-specific banter pool overrides (B1 already has biome bucket; ensure overrides cleanly).
2. Biome transitions in W2 Moor Road act flow — pick a route → biome transition. Routes already pick "lay of the land" effects; biome change adds visual + audio dimension.

### Phase C — Endless mode
1. **Entry point.** MainMenu → "Endless" alongside "Normal Run". Unlock-gate this behind first taxman victory (or same).
2. **Escalation curve.** `PostBellEscalation` already partial — extend to:
   - HP / damage / speed scaling per minute past minute 30.
   - Elite variant introductions (random elite affixes from `data/eliteAffixes.ts` cycle in).
   - Overcharge evolution (max-level evolved weapons get +n% scaling each cycle, capped).
   - Curse stacking (each cycle adds a Curse).
2. **Soft-cap retention.** Beyond 60 min, escalation flattens; player can run "forever" but the curve avoids one-shot frustration. Per `ROGUELITE_RESEARCH.md` curse-cycle precedent.
3. **Endless-specific banter.** Pull from B1 banter pools; "still goin'" + "ye're a haggis possessed" variants. Coordinate with B1 Phase 4+5 (#6) so endless pool isn't duplicated.
4. **Replay support.** Endless runs are deterministic via T1 (replay v3); confirm save schema covers extended frame counts.
5. **Almanac / Chronicle hooks** — endless-only achievements, visible in C1 Almanac (already shipped per memory).

## Sub-tasks

1. ADR-0007 phase-A extraction boundaries.
2. `CollisionRouter` extracted, tests cover overlap registration round-trip.
3. `LevelUpFlow` extracted, tests cover card draw + reroll + pause + resume.
4. `RunLifecycle` extracted, tests cover boss-vs-death race (T201 fix lands here).
5. `OverlayStack` extracted, tests cover priority + dismissal order.
6. `SceneResetter` extracted, tests cover full scene-restart parity.
7. Phase A regression sweep — full e2e + unit suite, all green.
8. ADR-0008 biome system.
9. Biome data tables (`src/data/biomes.ts`).
10. BiomeManager extends to 4 biomes.
11. Per-biome SFX + music transitions.
12. Biome-aware spawn weights.
13. Tile classification + AI cover-seeking adapter.
14. Phase B e2e covering biome transitions in W2.
15. Endless mode entry point in MenuScene.
16. PostBellEscalation extends to elite + overcharge cycles.
17. Endless-specific banter wires (coord with B1).
18. Endless replay schema audit.
19. Endless playtest loop (30 min runs documenting feel).

## Acceptance criteria

- `GameScene.ts` ≤500 lines after Phase A.
- Phase A: zero behaviour change. Full e2e + unit pass identical results.
- Phase B: 4 biomes ship; transitions feel at run-time; ambient SFX changes.
- Phase C: Endless mode loop sustains 60+ min on baseline hardware without crash; escalation curve documented + tunable.
- Replays of endless runs decode and replay deterministically.
- Soul Check covered: biome transitions hit Hearth-to-Wild emotional palette shifts; endless retains warmth (per `DESIGN_SOUL.md`).
- `npm run ci:all` green.
- Three ADRs merged.

## Anti-patterns to avoid

- **Don't combine phases in one PR.** Phase A is its own ship; Phase B layers on; Phase C layers on. Each must be independently revertible.
- **Don't break the bag-vs-cached-field rule** — Biome changes that mutate `RunModifiers` mid-run must use the setter pattern (per CLAUDE.md gotcha + memory). Adding new fields to `RouteModifierDeltaKey` requires the matching setter call in `GameScene.launchActIntermission.onResolve`.
- **Don't redesign W2 Moor Road in Phase B.** Biomes layer on top of routes; routes still pick the modifier deltas, biome system adds visual + audio. M1 Moor Road already shipped — don't disturb it.
- **Don't move tests during extraction.** When you extract `CollisionRouter`, leave the existing tests in place initially; add new tests on the extracted module; merge to one set after Phase A is green.
- **Don't ship Endless without Curse stacking.** It's the retention mechanic. Without it the loop flattens.

## Verification path

```
npm run lint
npm run build
npm test                # all phases — extracted module unit tests
npm run test:e2e        # smoke + biome transition + endless 5-min loop
npm run preview         # 30-min endless playtest
```

Plus:
- Replay determinism regression `src/replay/replayDeterminism.test.ts` after Phase A.
- 30-min Endless playtest log + screenshots → `docs/ENDLESS_PLAYTEST_LOG.md`.

## CLAUDE.md gotchas relevant here

- **Phaser imports break in node-env vitest.** Extracted modules must be pure; the scene-side adapter binds them to Phaser.
- **`scene.time.delayedCall` respects timeScale.** Endless overcharge evolutions during slow-mo must use `TimeManager.scheduleRealTime` for wall-clock timed pieces.
- **Bag-vs-cached-field divergence.** Biome modifiers + endless escalation modifiers must respect setter pattern.
- **Arcade fixed-step is part of T1 contract.** Endless mode replays must remain deterministic; perf hits to physics integration would break replay.
- **Phaser depth budget** (memory): biome ambient ≤ 60; endless escalation banter 80–92.

## Soul checks

- Biome transitions are Great Moments per `DESIGN_SOUL.md` recipe — coordinate with Voice Card for transition copy.
- Endless mode tone: never punishing. Player should feel "look how far ye've gone" not "give up". Reference `NARRATIVE_RESEARCH.md` §6.4.
- `ART_STYLE_BIBLE.md` palette per biome (Hearth for Bothy, Wild for Moor + Wood, Grave or Fey for Burn at dusk).
