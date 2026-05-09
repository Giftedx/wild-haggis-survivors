# ADR 0002 — Deterministic replay format: seed + per-frame input + delta

**Status:** Accepted — fully shipped 2026-04-17/18
**Date:** 2026-04-17 (initial); 2026-04-18 (Phase 3 fixed-step physics + ReplayBlob v2); 2026-04-24 (Moor Road bumped to ReplayBlobAny v3)
**Relates to:** T1 flagship (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)

> **Update 2026-04-18 / 24:** All three phases live. Phase 1 — recorder + ReplayBlob v1 + GameScene record wire. Phase 2 — `IInput` + `ReplayInput` DI + Chronicle ▶ Watch + auto-return. Phase 3 — Phaser Arcade `fps:60, fixedStep:true`; ReplayBlob v2 (`curseKey` / `routes` / `composedStats`); save v5 → v6 with `ReplayBlobAny` union. M1 Moor Road later widened the union to v3 with `nodeOutcomes?` (auto-upgraded by `ReplayRecorder.pushNodeOutcome`). Memory `project_t1_replay_status` confirms remaining non-determinism is intentional (cosmetic-RNG paths per `rng.ts` policy).

## Context

T1 (deterministic replay) is one of the last remaining S-tier flagships on
the master plan. The goal is a run reproducibility layer strong enough to
power speedrun verification, ghost replays, and a highlight reel.

Audit found the codebase ~80% ready: every gameplay-affecting random roll
(card draws, elite spawn, crit, variant-loot) already routes through the
seeded mulberry32 PRNG in `src/utils/rng.ts`. The remaining 20% was two
specific drift sources:

1. `HazardZones.spawn()` used `new Phaser.Math.RandomDataGenerator(['zones'])`
   — a hardcoded string seed unrelated to the run's RNG. Lava/heal zone
   positions were identical across all seeds but couldn't be varied per seed
   for daily challenges.
2. `SpawnSystem.pauseSpawnsFor(ms)` used `Date.now()` wall-clock epoch, so
   the W2 `buckie_pitstop` route's 15-second spawn pause drifted relative to
   gameplay under hit-freeze / pause / tab-backgrounding.

Both were fixed ahead of replay recording.

What *wasn't* ready: the engine does not run on a fixed physics step. Phaser
Arcade is configured without `fps`/`fixedTimeStep`, so `delta` is whatever
the browser's RAF produces (clamped at 100 ms). A perfect playback engine
requires fixed-step integration, which is an engine-level migration beyond
the scope of a single-session MVP.

The question: what format do we capture *now* so a future playback engine
can consume it?

## Decision

Capture a versioned `ReplayBlob`:

```ts
interface ReplayFrame {
  dtMs: number;   // clamped [0, 100]
  dx: number;     // direction x, clamped to unit disc
  dy: number;
  dash: boolean;  // dash edge this frame
  menu: boolean;  // pause-menu edge this frame
}

interface ReplayBlob {
  version: 1;
  build: string;          // commit or package version
  seed: number;           // 32-bit normalized seed
  variantKey: string;     // roster variant chosen
  frameCount: number;
  frames: ReplayFrame[];
}
```

Attached as optional `replay?: ReplayBlob` on `RunHistoryEntry`, save
schema v5. Written only when replay-record mode is active (resolved from
`globalThis.__REPLAY_MODE__` > `localStorage['whs_replay_mode']` > off).

The blob captures everything a future playback engine needs to drive the
game: the seed re-establishes RNG, per-frame direction + dash + menu edges
reproduces input, and the captured `dtMs` sequence reproduces delta exactly
if the playback loop can be driven in fixed-step mode.

## Alternatives considered

- **Capture full game state per tick.** Safer (no dependency on
  deterministic simulation) but the blob would be hundreds of KB per run —
  breaks localStorage quota. Rejected.
- **Event-delta capture (only on change).** Smaller blob, but the reader
  still needs `dtMs` for each simulation step, so the savings are marginal
  for an input stream that changes most frames. Rejected — simpler uniform
  shape beats cleverness here.
- **Lean on `rng.determinism.test.ts` alone.** Covers RNG but not input or
  timing — insufficient for a replay system. Rejected.
- **Wait for fixed-step engine work before recording anything.** Losing
  months of potential recording data during that migration. Rejected —
  recording the blob now costs little and documents intent.

## Consequences

- **Pros.**
  - Recording surface is minimal: one new module (`ReplayRecorder`), one
    save schema bump, one GameScene wire-up.
  - Every non-replay run is untouched — flag-gated.
  - Blob round-trips through JSON; localStorage-friendly.
  - Foundation matches format most replay-using survivor-likes land on:
    seed + input stream + delta, no per-frame state dump.

- **Cons.**
  - Without fixed-step physics, naïve playback will drift after ~seconds.
    We explicitly accept this: record now, playback lands alongside the
    fixed-step migration.
  - Blob size is proportional to run length × capture rate. Expect
    ~50-150 KB per 20-min run at 60 fps. localStorage quota is ~5 MB, so
    ~30 recent runs is the reasonable cap. The existing
    `MAX_RUN_HISTORY = 20` FIFO already bounds it.
  - Cross-build replay compat is not a v1 goal. Build hash gates playback
    — if the build differs, the replay is archive-only.

- **Follow-ups (trigger → action):**
  1. Fixed-step physics migration → playback engine MVP.
  2. Playback lands → `npm run test:e2e` gets a record→replay regression.
  3. Third-party replay upload (or sharing UI) → CRDT-style conflict
     resolution discussion, which belongs under P3 (cloud saves), not here.
  4. Compression → if blob size blows quota, switch `frames` to parallel
     typed-array encoding (Float32 + Uint8) with base64 wrapping.

## Rollback

Record side rolls back via `feat(replay)` commit revert. HazardZones +
SpawnSystem determinism fixes stay — they're value independent of replay
(daily challenges become truly seed-bound).

Save v5 migration is no-op (v4 → v5 just bumps the version integer), so
downgrading the schema constant back to 4 and re-running `migrateSave` is
a one-line safe revert.

---

## Addendum — Phase 2 (2026-04-18): best-effort playback wired

Phase 1 (record side, 2026-04-17) captured the blob but shipped no way
to watch it. Phase 2 added the playback path without waiting for the
fixed-step physics migration, on the understanding that v1 playback is
**best-effort**: drift is expected and accepted.

### What landed

- `src/utils/iInput.ts` — `IInput` interface (5-method read surface).
  `InputManager` and `ReplayInput` both declare `implements IInput`.
- `Player` constructor gains an optional trailing `inputSource?: IInput`
  parameter. Default still constructs `new InputManager(scene)` — no
  behaviour change for live play.
- `GameSceneInitData.replay?: ReplayBlob`. When present, `init()`
  overrides seed / variant from the blob, forces `isDaily = false`, and
  stashes the blob on `pendingReplay`.
- GameScene `create()` branches on the blob: record and playback are
  mutually exclusive. Playback constructs `ReplayInput`, passes it into
  Player, skips the recorder, and fires an `ui.replay.watching_toast`
  toast so the player knows the run is recorded.
- Each `update()` tick advances the blob cursor before Player reads
  input. Blob exhaustion → `scene.start('Chronicle')`; no run-history
  write, no XP/gold persistence.
- The `recordRun` hook short-circuits during playback so `runHistory`
  and daily/Ironmoor leaderboards stay untouched.
- `ChronicleScene` renders a small "▶" button at `x = width - 195` for
  every entry whose `replay` field passes `isReplayBlob`. Click launches
  `scene.start('Game', { replay })`.

### Known v1 limitations (drift sources)

1. **Variable Phaser delta.** Arcade physics has no `fps` / `fixedStep`
   set in `src/main.ts`. Playback receives whatever `dtMs` the recorder
   captured, but Phaser's RAF delivers its own variable delta underneath.
   Cumulative divergence after ~seconds is the norm.
2. **Curse effects not bundled.** The blob captures `seed + variantKey`
   but not the active curse. Chronicle → Watch clears the pending-curse
   singleton, so playback runs curse-free. Runs that bore a curse will
   diverge immediately.
3. **Moor Road picker state not bundled.** If the original run picked
   routes (act 1 / 2), the replayed run will hit the act intermissions
   as if it were a fresh attempt — not the recorded pick.
4. **`Math.random()` in cosmetic paths.** Per `rng.ts` policy, VFX keeps
   `Math.random()`. Playback visuals won't match the original run
   frame-for-frame. Gameplay state is what the record captures.
5. **Permanent upgrades + settings applied live.** If the player has
   spent gold since the original run, their stats differ at replay
   time. Seed stream is identical; player sheet isn't.

### What still needs to happen for byte-accurate playback

1. Phaser Arcade config `fps: 60, fixedStep: true` — tradeoff analysis
   pending (affects every system that reads `delta`).
2. Blob v2 schema: add `curseKey?`, `routes?`, snapshot `ComposedPlayerStats`.
3. GameScene replay branch: apply blob metadata instead of consuming
   live curse / settings / meta-upgrades.
4. Determinism regression test: record a known script, replay, assert
   identical `RunHistoryContext` (sans `replay` field).

These are substantial — kept out of Phase 2 on purpose. Phase 2 ships a
visible feature; Phase 3 ships determinism.

### Rollback (Phase 2 only)

Revert the Phase 2 feature commits. `IInput` interface extraction stays
because it's a good shape regardless of replay (matches the DI
precedent in `AnalyticsManager`, `ISceneContext`). No save / schema
changes in this phase.

---

## Addendum — Phase 3 (2026-04-18): byte-accurate playback path

Phase 2 shipped best-effort playback with four documented drift
sources. Phase 3 closes the two most impactful: variable-delta physics
and the missing per-run metadata (curse, routes, composed stats).

### What landed

- `src/main.ts` — Phaser Arcade physics config gains `fps: 60,
  fixedStep: true`. Physics integration decouples from RAF jitter;
  recorded `dtMs` values remain accurate on playback. The 100 ms
  `delta` clamp in `GameScene.update()` is unchanged.
- `src/replay/replayBlobV2.ts` — `ReplayBlobV2` adds optional
  `curseKey`, `routes`, `composedStats` on top of v1 shape.
  `deserializeReplayV2` rejects v1 payloads (version mismatch) and
  silently drops malformed optional fields so a partially-corrupt v2
  blob still replays its frames.
- `src/replay/composedStatsSnapshot.ts` — pure
  `captureComposedStats(stats)` + `isComposedStatsSnapshot(value)`
  guard. Snapshot type is `Pick<ComposedPlayerStats, …>` — the exact
  11-field set `Player`'s constructor accepts. BALANCE.player
  constants (dash, shield, hitbox) are excluded — they're build-level.
- `src/replay/replayBlob.ts` — new `ReplayBlobAny = ReplayBlob |
  ReplayBlobV2` union + `isReplayBlobAny` guard. v1 type / guard stay
  for back-compat.
- `src/replay/ReplayRecorder.ts` — `ReplayRecorderMeta` extends
  `ReplayBlobMeta` with `curseKey?` and `composedStats?`. `pushRoute`
  appends one `RoutePick` per resolved intermission. `finalize()`
  emits a v1 blob when no v2 metadata was captured (back-compat
  default) and a v2 blob otherwise.
- `src/utils/save.ts` — `SAVE_SCHEMA_VERSION = 6`. `migrateV5ToV6` is
  a no-op version bump. `RunHistoryEntry.replay` +
  `RunHistoryContext.replay` widen to `ReplayBlobAny` so both v1 and
  v2 blobs round-trip through write/load.
- `src/scenes/GameScene.ts` — recorder construction relocates below
  the curse + composedStats resolution so the v2 blob captures the
  live metadata at run start. Playback branch reads `curseKey`,
  `composedStats`, and `routes` from a v2 blob and applies them in
  place of the live pending-curse singleton, live
  `StatComposer.getPlayerStats(metaSave)`, and live
  `ActIntermissionScene` card UI respectively. `launchActIntermission`
  short-circuits when a recorded pick is queued for the current slot.
- `src/replay/replayDeterminism.test.ts` — regression: two
  `ReplayInput` cursors on an identical v2 blob must yield
  frame-for-frame identical direction / dash / menu output; edges fire
  exactly once; seed reproducibility holds across int / float / pick /
  bool draws; serialize → deserialize preserves v2 metadata and frame
  semantics. Pure node-env, 7 tests.

### What's still not covered

- `Math.random()` cosmetic paths (VFX particles, ambient wisps). Per
  `rng.ts` policy these stay non-deterministic — gameplay state is
  deterministic under v2 playback, but pure visual rolls may still
  diverge frame-for-frame. Intentional.
- Cross-build playback. A blob's `build` string gates replay; a
  different build shows the archive-only state. Phase 2 decision.

### Follow-ups

1. A Chronicle indicator that a ▶ Watch entry is v2 (so the user
   knows curse / routes / stats will match) would be a small UI
   polish — Phase 3 shipped the mechanism; the Chronicle row currently
   doesn't distinguish.
2. A Playwright scenario that records a curse run, watches it, and
   asserts the HUD curse chip re-appears during playback. Not
   strictly needed — the vitest regression + the existing replay-loop
   e2e cover the two ends — but a nice cross-check.

### Rollback (Phase 3 only)

Reverse commit order:
1. `test(replay)` determinism regression → safe to revert alone.
2. `feat(replay)` playback consumes v2 metadata → live path unaffected
   (records still produce v2 blobs; playback falls back to consuming
   live singletons as in Phase 2).
3. `feat(replay)` GameScene feeds metadata to recorder → records
   revert to v1 only; existing v2 save entries stay readable via
   `ReplayBlobAny`.
4. `feat(replay)` recorder v2 metadata → recorder back to v1-only API.
5. `feat(save)` schema v6 + union widening → save v6 → v5 needs a
   manual schemaVersion bump if any v6 save exists on disk. If no v6
   save on disk yet, this is safe.
6. `feat(replay)` blob v2 + snapshot modules → removes v2 types.
7. `feat(replay)` Phaser fixed-step → single-line main.ts revert.

Phase 1 + Phase 2 stay independent and shipping.
