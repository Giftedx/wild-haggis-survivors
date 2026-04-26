# Prompt #10 — T401 GameScene Decomposition (Orchestrator + Domain Facades)

## Goal

Reduce `src/scenes/GameScene.ts` from a ~2898-line monolith to a thin Phaser-scene shell delegating to a `GameSceneOrchestrator` and four domain facades (combat, progression, W2 nodes, persistence). Triple-audit (`docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`) explicitly P3-defers this — it's allowed post-ship but should land before another flagship lands on top.

Estimated 2–3 person-weeks. Zero behaviour change. Highest test-coverage risk of any task in this list.

## Why this is #10

It's last because it's pure engineering debt — no user-visible feature lands. But it must happen before T401 starts blocking every future change:
- The Scene Refactor + Biomes + Endless task (#5) Phase A overlaps heavily with this.
- W71 Skeletal Rig (#2) Phase 1 will collide with monolith hot-spots.
- A1 Accessibility Foundation (#1) M3 + M4 will add code to the GameScene; better to decomp first.
- U1 Runes M4 (#9) consumers will collide with the monolith.

So while no user sees this ship, it unblocks half the rest of the list.

## Source documents

1. `docs/superpowers/specs/2026-04-13-gamescene-demonolith-design.md` — original Phase A scoping.
2. `docs/superpowers/specs/2026-04-13-scene-refactor-biomes-endless-design.md` — how this fits the larger refactor (overlaps #5).
3. `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` §T401 (P3-deferred allowance).
4. `src/scenes/GameScene.ts` — current monolith.
5. Existing tests under `src/scenes/game/` — there's already partial extraction (memory: `IFrameController`, `RunEndTickers`, `FloatTextPool`, `ChestSpriteRegistry`, `installTreasureChestTimer`, `tickAutoBattleSteering` etc. exist as helpers). Build on the established pattern.

## Scope

### Phase 1 — Audit + ADR
1. Map the current 2898 lines into responsibility buckets:
   - Setup / create / shutdown
   - Update tick (per-frame physics + AI + cleanup)
   - Collisions + overlaps
   - Level-up flow + reward selection
   - Spawn loop + boss orchestration
   - W2 act intermissions + route resolution
   - Pause / resume / death / victory transitions
   - Run-end + persistence + chronicle
   - Banter dispatch (+ first-time triggers)
   - Curse / route effects mid-run
   - Debug hotkeys (DEV only — see triple-audit T312)
2. ADR-0009 names the four facades + orchestrator. Recommended split (per design spec):
   - **`CombatFacade`** — `WeaponSystem` + `EnemyManager` + collision-handling registration + damage-pipeline.
   - **`ProgressionFacade`** — `XPSystem` + `LevelUpFlow` + `MetaProgressSystem` + Curse / route effect application.
   - **`NodesFacade`** — `ActIntermissionScene` integration + `RunActState` + `RouteDef.modifierDeltas` resync (the bag-vs-cache pattern lives here).
   - **`PersistenceFacade`** — save / load + `ReplayRecorder` + `RunStatsTracker` + Chronicle.
   - **`GameSceneOrchestrator`** — wires the four facades + handles transitions between them. Owns the run-lifecycle state machine.

### Phase 2 — Extract per facade
For each:
1. Define interface (`ICombatFacade` etc. or just the class facade).
2. Move methods + private state from `GameScene` into the facade.
3. `GameScene` stores a single field per facade and forwards calls.
4. Vitest unit tests on each facade — pure logic in node env, no Phaser imports (continue the established pattern from `actIntermissionResolve.ts`).
5. Each facade is its own PR. Sequence: Combat → Progression → Nodes → Persistence (combat is biggest; learning curve front-loaded).

### Phase 3 — Orchestrator
1. After all four facades extracted, write `GameSceneOrchestrator` to coordinate.
2. `GameScene.ts` becomes ~400 lines of:
   - Phaser scene lifecycle (`create`, `update`, `shutdown`)
   - Orchestrator construction
   - Phaser-only integration (cameras, input plumbing, audio engine attach)
   - Forwarding to orchestrator

### Phase 4 — Test sweep + perf check
1. Full unit + e2e regression: zero behaviour change.
2. Replay determinism — `src/replay/replayDeterminism.test.ts` must pass byte-identical.
3. Frame-time perf: 200 enemies + boss; before vs after — must be ≤+2% (no regression budget).
4. Bundle size — pure refactor should be neutral; verify gzip stable.

## Sub-tasks (suggested order)

1. ADR-0009 facade boundaries.
2. CombatFacade extraction + tests + PR.
3. ProgressionFacade extraction + tests + PR.
4. NodesFacade extraction + tests + PR.
5. PersistenceFacade extraction + tests + PR.
6. Orchestrator wiring + final GameScene shell + PR.
7. Full regression sweep + replay determinism + perf check.
8. Triple-audit T401 closeout note.

Each PR independently revertible. The orchestrator PR is the riskiest; everything before it can land in isolation.

## Acceptance criteria

- `GameScene.ts` ≤500 lines (target ~400).
- Four facades exist, each with own test file.
- Zero behaviour change: `npm run ci:all` produces identical e2e + unit results before vs after.
- Replay determinism unchanged (byte-identical replay of pre-refactor saves).
- Frame-time regression ≤+2%.
- Bundle gzip ≤ original ±1 KB.
- ADR-0009 merged.
- Triple-audit T401 marked closed.

## Anti-patterns to avoid

- **Don't change behaviour mid-extraction.** If you find a bug, file it; fix in a separate PR. Mixing refactor + behaviour change is how regressions ship.
- **Don't break the existing helper pattern.** `IFrameController.ts`, `RunEndTickers.ts`, `installTreasureChestTimer.ts`, `tickAutoBattleSteering.ts` are already pure-helper extractions per CLAUDE.md gotcha (Phaser imports break in node-env vitest). Continue same pattern; build orchestrator + facades as the next layer up.
- **Don't import Phaser in facades.** Facades take a `Phaser.Scene` ref via constructor and call its API; they don't `import Phaser` at the top. Tests cover them via mock-scene helpers.
- **Don't skip bag-vs-cache resync.** NodesFacade owns route modifier deltas; setter pattern is mandatory (per CLAUDE.md gotcha).
- **Don't merge facade PRs out of order.** CombatFacade has the most existing test coverage; extract first to learn the lift. Persistence last because save/replay is the highest determinism risk.
- **Don't introduce new abstractions.** This is a pure decomposition. No new managers, no new event buses, no new patterns. The existing event bus (`GlobalEventBus`) stays as-is.
- **Don't mix this with #5 Phase A.** If #5 lands first, this becomes a no-op (#5 includes the same extraction). If this lands first, #5 Phase A becomes "do the rest of the refactor". Pick one as primary; coordinate.

## Verification path

```
npm run lint
npm run build
npm test                # all facade unit tests + existing GameScene tests
npm run test:e2e        # full smoke + visual regression
npm run preview         # 30-min playtest, full run + W2 acts + Croft visit
```

Plus:
- Replay determinism: `npm test -- replayDeterminism`. Must be byte-identical to baseline.
- Perf bench: 200-enemy stress test before vs after (`src/dev/StressTest.ts` exists).
- Bundle audit (gzip stats from `npm run build`).

## CLAUDE.md gotchas relevant here

- **Phaser imports break in node-env vitest.** Pure facades; Phaser-touching glue stays in scene shell.
- **Scene reuse + create() reset.** `SceneResetter` belongs to ProgressionFacade or Orchestrator. Currently lives at top of `GameScene.create()` (per CLAUDE.md gotcha) — preserve the discipline; the reset block remains the single source of truth, just owned by the orchestrator.
- **`scene.time.delayedCall` respects timeScale.** Facades that schedule callbacks during pause/intermission must use `TimeManager.scheduleRealTime`.
- **Arcade fixed-step is part of T1 contract.** Refactor must not change physics integration cadence.
- **Phaser ScenePlugin vs SceneManager.** `this.scene` (ScenePlugin) lives on Phaser scenes; orchestrator must accept the plugin via constructor, not look it up dynamically.
- **Stale callback guards.** Callbacks captured at facade-construction time may fire after scene restart. Match the existing reference-identity guard pattern.

## Soul checks

No user-facing soul work in this prompt — pure engineering. But confirm by playthrough:
- 30-min run feels identical pre vs post.
- All Soul Check moments (kill burst, evolution chime, boss death spectacle, intermission pickers, GameOver respect) tick exactly the same.
- No regression in `juice` cadence — Hit Freeze, screen shake, kill burst durations all preserved.

## Risk + descope levers

If timeline slips:
- Ship CombatFacade + ProgressionFacade only; defer NodesFacade + PersistenceFacade. GameScene shrinks ~50%; rest stays. (-1 week)
- Skip Orchestrator class; let GameScene continue calling facades directly. (-3 days)

If perf regresses:
- Inline the orchestrator dispatcher (single switch instead of method calls).
- Investigate v8 inline-cache invalidation around facade boundaries.

If determinism breaks:
- Roll back the offending facade PR. Re-extract with explicit determinism audit (which methods were called from physics step? are they still called identically?).

## Coordination with other top-10 tasks

- **#5 Scene Refactor + Biomes + Endless** — Phase A is this work. Pick one as primary; the other becomes "extend the new structure".
- **#1 A1 Accessibility** — M3 (remap) + M4 (captions) will add code to the scene shell. Land this first if A1 is in scope.
- **#2 W71 Skeletal Rig** — Player + enemy rendering touches Combat-adjacent code. Coordinate.
- **#9 U1 Runes M4** — Consumer wiring goes through facades cleanly. Land this first to unblock cleaner U1 wiring.
