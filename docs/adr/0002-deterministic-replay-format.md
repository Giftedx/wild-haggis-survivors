# ADR 0002 — Deterministic replay format: seed + per-frame input + delta

**Status:** Accepted (record side shipped; playback engine deferred)
**Date:** 2026-04-17
**Relates to:** T1 flagship (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)

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
