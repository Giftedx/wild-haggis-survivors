# T1 Deterministic Replay — Record-Side MVP Plan

> **Scope:** 5-hour agentic run. Ships record side of T1 flagship + fixes the two
> non-determinism blockers surfaced by the RNG/Timer audits. Playback engine is
> explicitly deferred — ADR-0002 captures the contract for the next session.

**Goal:** Land the foundation for T1 (Deterministic Replay) from
`docs/HUGE_INITIATIVES_MASTER_PLAN.md`. At the end of this plan:

1. A fresh run with the same seed + same input produces identical gameplay
   state (hazard zones, spawn pauses). The two known drift sources are fixed.
2. Every run optionally writes a compact "recording blob" to the save file —
   a serializable capture of the seed + per-frame input snapshots + delta
   sequence. The recording is schema-versioned and round-trips through JSON.
3. `ADR-0002` documents the replay format and the remaining playback
   prerequisites (fixed-step physics, audio-schedule accountability) so the
   next session can pick up cleanly.

**Non-goals for this 5-hour slice:**

- Playback engine. The audit identified variable-delta Phaser physics as a
  hard prerequisite. Out of scope here.
- Replay verification E2E ("re-run and assert identical outcome"). Requires
  playback, which is deferred.
- UI surfacing (Chronicle "watch replay" button). Deferred to next session.
- Cross-version replay compatibility. Replays valid only within one build.
- Migrating `Math.random()` cosmetic sites to `runRng`. Per `rng.ts` policy,
  VFX keeps `Math.random()` and that's intentional.

**Architecture:** Additive. New pure modules:

- `src/replay/ReplayRecorder.ts` — captures per-frame `{dirX, dirY, dashEdge, menuEdge, dtMs}`.
- `src/replay/replayBlob.ts` — `ReplayBlob` type + `serializeReplay` / `deserializeReplay`.
- `src/replay/replayConfig.ts` — env/localStorage flag resolver for record mode.

Modifications:

- `src/scenes/game/HazardZones.ts` — take `getRunRng` hook; seed RDG from it;
  route `spawnHealingCircle` through `runRng.int`.
- `src/systems/SpawnSystem.ts` — `pauseSpawnsFor(ms)` converts to
  `spawnsPausedUntilGameSec`, advanced by `gameTimeSec`. Wall-clock check removed.
- `src/utils/save.ts` — schema v4 → v5. Add optional `RunHistoryEntry.replay?: ReplayBlob`.
   Migration: v4 entries gain `replay: undefined` implicitly.
- `src/scenes/GameScene.ts` — instantiate `ReplayRecorder` when flag on;
  feed `getDirection()` / dash edges per tick; flush to save on run end via
  `RunHistoryContext.replay`.

**Tech stack:** TypeScript strict, Vitest for unit tests, Playwright smoke
not added (no UI surface).

**Commit cadence:** One commit per logical milestone (see checklist below).
Commits include `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.

---

## Milestone plan

- **M1 — non-det fixes:** Steps 1 – 4. Ships HazardZones seed injection +
  SpawnSystem game-time pause. Standalone value: daily challenges become truly
  deterministic.
- **M2 — replay blob + recorder:** Steps 5 – 10. `ReplayRecorder` module,
  `ReplayBlob` type, save v5 migration, GameScene wire-up behind flag.
- **M3 — verify + ship:** Steps 11 – 13. Integration test, full CI gate,
  ADR, PRD / progress doc updates.

---

## M1 — Non-determinism fixes

### Step 1 — HazardZones: seed RDG from runRng

**Files:** `src/scenes/game/HazardZones.ts`, new test.

- [ ] Extend `HazardZonesHooks` with `getRunRng(): RNG`.
- [ ] `spawn()` replaces `new Phaser.Math.RandomDataGenerator(['zones'])` with
  a local RNG obtained from the hook. Use `runRng.int` for zone positions
  and tween-duration jitter (tween jitter is cosmetic, but we're already
  pulling from the seeded stream — cheap and avoids a second `Math.random`
  call site on the critical path).
- [ ] `spawnHealingCircle()` replaces `Phaser.Math.Between` calls with
  `runRng.int`.
- [ ] `src/scenes/game/HazardZones.seed.test.ts` — mock the hook, run `spawn()`
  twice with the same seed, assert lava/heal zone positions identical.
  Second run with different seed produces different positions.

### Step 2 — GameScene: pass `getRunRng` through to HazardZones

**Files:** `src/scenes/GameScene.ts`.

- [ ] Update the `HazardZonesHooks` literal in `create()` to include
  `getRunRng: () => this.runRng`. Already exposed via `getRunRng()` method.

### Step 3 — SpawnSystem: convert `pauseSpawnsFor` to game-time

**Files:** `src/systems/SpawnSystem.ts`, test.

- [ ] Rename `spawnsPausedUntilRealMs` → `spawnsPausedUntilGameSec`
  (private; no API surface break).
- [ ] `pauseSpawnsFor(ms)` sets `spawnsPausedUntilGameSec = gameTimeSec + ms/1000`.
- [ ] The gate check (old line 528) becomes
  `if (gameTimeSec < spawnsPausedUntilGameSec) return`.
- [ ] `resetRunState` zeroes the new field.
- [ ] `SpawnSystem.pause.test.ts` — advance `gameTimeSec` via public tick,
  call `pauseSpawnsFor(15000)` at t=5s, assert spawns suppressed until
  t=20s and resume thereafter. Cover the pre-existing wall-clock drift fix:
  the test runs with a scene where real-time advances faster than game-time
  (hit-freeze scenario) and asserts the pause window matches game-time.

### Step 4 — Smoke: daily-challenge determinism asserted

**Files:** `src/utils/rng.determinism.test.ts` (extend).

- [ ] Add a case: `spawn()` of a mock `HazardZones` with `dailyChallengeSeed()`
  yields the same positions across constructions. Uses the mock hook pattern
  from Step 1's test.
- [ ] Commit M1: `fix(replay): HazardZones + SpawnSystem determinism`.

---

## M2 — Replay blob + recorder

### Step 5 — `ReplayBlob` type + serializer (TDD)

**Files:** `src/replay/replayBlob.ts`, `src/replay/replayBlob.test.ts`.

- [ ] Define:
  ```ts
  export interface ReplayFrame {
    /** Game-time delta in ms applied by this frame. */
    dtMs: number;
    /** Movement direction (length ≤ 1). */
    dx: number;
    dy: number;
    /** Dash edge fired this frame. */
    dash: boolean;
    /** Menu pause edge fired this frame. */
    menu: boolean;
  }

  export interface ReplayBlob {
    /** Format version. Bump when the frame shape or semantics change. */
    version: 1;
    /** Build identifier (commit hash or package version). */
    build: string;
    /** 32-bit RNG seed the run was created with. */
    seed: number;
    /** Variant chosen for the run. */
    variantKey: string;
    /** Total frames captured. */
    frameCount: number;
    /** Compressed frame stream — deltas packed as two Float32Arrays-as-arrays for JSON friendliness. */
    frames: ReplayFrame[];
  }
  ```
- [ ] Tests:
  - `serializeReplay` → JSON.stringify round-trips.
  - `deserializeReplay` returns `null` for malformed input.
  - `deserializeReplay` coerces / rejects out-of-range values.
  - Empty-frames blob round-trips.

### Step 6 — `ReplayRecorder` module (TDD)

**Files:** `src/replay/ReplayRecorder.ts`, `.test.ts`.

- [ ] Class API:
  ```ts
  new ReplayRecorder({ seed, variantKey, build });
  recorder.pushFrame({ dtMs, dx, dy, dash, menu });
  recorder.finalize(): ReplayBlob;
  recorder.reset(): void;
  recorder.getFrameCount(): number;
  ```
- [ ] Tests:
  - Fresh recorder has 0 frames, finalize returns empty-frames blob.
  - Pushing 3 frames then finalize returns 3 frames in order.
  - `reset()` clears frames, preserves metadata.
  - Frame `dtMs` clamped to [0, 100] (matches GameScene delta clamp).
  - Direction clamped to length ≤ 1 (defensive; matches InputManager).

### Step 7 — `replayConfig` flag resolver (TDD)

**Files:** `src/replay/replayConfig.ts`, `.test.ts`.

- [ ] Resolves record mode from, in priority order:
  1. `globalThis.__REPLAY_MODE__` (E2E / dev override)
  2. `localStorage['whs_replay_mode']`
  3. `undefined` → off
- [ ] Tests cover all three paths + malformed values → off.

### Step 8 — Save schema v4 → v5

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`.

- [ ] Bump `SAVE_SCHEMA_VERSION` to 5.
- [ ] Add optional `replay?: ReplayBlob` to `RunHistoryEntry`.
- [ ] Add pass-through field to `RunHistoryContext` and `applyRunSummary`.
- [ ] `migrateV4ToV5(raw)` — no-op body, just bumps schemaVersion. Tests:
  - v4 save migrates to v5 with same history (no `replay` fields).
  - v3 save still migrates through v4 → v5.
  - v5 entry with `replay` round-trips through write/load.
  - `replay` absent on entries without a recording.

### Step 9 — GameScene wire-up

**Files:** `src/scenes/GameScene.ts`.

- [ ] In `create()` after `this.runRng` assignment, construct a recorder
  when `resolveReplayMode()` is `'record'`. Pass seed + variantKey + `__BUILD_ID__`.
- [ ] Hook into the `player.update` path: after `inputManager.getDirection()`
  and `consumeDashPressed()`, push a frame onto the recorder (dash edge value
  captured *before* the consume if needed; use a wrapper).
- [ ] Pass `build` from `import.meta.env.VITE_BUILD_ID` or fallback `'dev'`.
- [ ] On run end (`RunLifecycle.finalizeRun`), finalize the recorder and
  stash the blob on the `RunHistoryContext` passed to `recordRun`.
- [ ] Reset recorder in `resetTransientRunState()`.

### Step 10 — Integration test: record → blob present in save

**Files:** `src/replay/recorderIntegration.test.ts`.

- [ ] Pure test: construct a recorder, push 60 synthetic frames, finalize,
  round-trip through save write + load, assert the reloaded entry has a
  `replay` field with 60 frames and same seed/variantKey.
- [ ] No GameScene boot — keeps test in vitest-node env.

### Commit M2: `feat(replay): record-side MVP — recorder, blob, save v5`.

---

## M3 — Verify, doc, ship

### Step 11 — Run full CI gate

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (optional if time allows)

### Step 12 — ADR-0002 + PRD + progress

**Files:** `docs/adr/0002-deterministic-replay-format.md`, `docs/PRD.md`,
`docs/progress.txt`.

- [ ] ADR-0002 — format, non-goals, playback prerequisites.
- [ ] Update `HUGE_INITIATIVES_MASTER_PLAN.md` T1 row with "record-side MVP
  shipped — see plan doc for status".
- [ ] Append session summary to `docs/progress.txt`.

### Step 13 — Commit + reflect

- [ ] Commit M3 docs.
- [ ] Append reflection JSONL entry to `~/.claude/memory/reflections.jsonl`.

---

## Risks + mitigations

- **Risk:** `ReplayRecorder.pushFrame` on every tick is GC pressure.
  **Mitigation:** frames are plain objects; recorder keeps an array. If
  performance shows up on the profile, convert to parallel Float32Arrays.
  Out of scope this slice.
- **Risk:** Build ID isn't exposed via Vite. **Mitigation:** fallback to
  `package.json#version + '-dev'` until a Vite `define` config is added.
  Noted in ADR-0002 follow-ups.
- **Risk:** HazardZones tween-duration jitter change alters visible feel.
  **Mitigation:** both before and after are random; only the stream changes.
  Visual impact is zero. Smoke: scene-boot e2e passes unchanged.
- **Risk:** `SpawnSystem.pauseSpawnsFor` game-time conversion breaks the
  existing W2 Playwright smoke. **Mitigation:** W2 `buckie_pitstop` test
  runs through gameTimeSec anyway — should *improve* reliability.

## Rollback

Each milestone is a separate commit. Rollback = revert the latest commit.
HazardZones + SpawnSystem changes are behavior-preserving with the same-seed
case (only cross-seed determinism improves), so M1 is safe to keep even if
M2 gets reverted.
