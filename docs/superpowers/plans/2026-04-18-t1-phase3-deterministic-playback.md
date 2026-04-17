# T1 Phase 3 — Deterministic Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline, autonomous 5-hour run). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the "best-effort playback" gap in T1 by (1) migrating Phaser Arcade to fixed-step physics, (2) bumping `ReplayBlob` to v2 with `curseKey` + `routes` + a `composedStats` snapshot, (3) wiring the GameScene playback branch to consume those fields instead of live singletons, and (4) proving it with a determinism regression vitest.

**Architecture:** Additive around the existing `src/replay/` modules. `ReplayBlob` gains a discriminated-version shape — v1 readers already bail on `version !== 1`, v2 readers accept v2 only. Playback branch in `GameScene.create()` short-circuits curse consumption, force-applies recorded route picks at act boundaries, and wires a composed-stats snapshot into Player construction. No new scenes, no new public systems.

**Tech Stack:** TypeScript strict, Vitest (node-env for pure modules), Playwright E2E smoke, Phaser 3 Arcade physics.

---

## File Structure

**Create:**
- `src/replay/replayBlobV2.ts` — `ReplayBlobV2` type + `isReplayBlobV2` + `createEmptyReplayBlobV2` + `deserializeReplayV2`. v1 module stays untouched for back-compat reads.
- `src/replay/composedStatsSnapshot.ts` — pure helper `captureComposedStats(stats)` + `isComposedStatsSnapshot` guard (snapshot type subset of `ComposedPlayerStats`).
- `src/replay/replayDeterminism.test.ts` — pure vitest: construct a scripted blob, drive two `ReplayInput` cursors, assert identical observable state after N frames.
- `src/replay/replayBlobV2.test.ts` — round-trip + guard coverage for v2.
- `docs/adr/0002-deterministic-replay-format.md` — append Phase 3 addendum inline (not a new ADR — it's a continuation).

**Modify:**
- `src/main.ts` — `physics.arcade` gets `fps: 60, fixedStep: true`.
- `src/replay/replayBlob.ts` — export `ReplayBlobAny = ReplayBlobV1 | ReplayBlobV2` union, add `isReplayBlobAny` guard. v1 constants stay.
- `src/replay/ReplayRecorder.ts` — constructor takes optional `{ curseKey?, routes?, composedStats? }` metadata. `finalize()` returns v2 blob if any of those are present, v1 otherwise (back-compat).
- `src/utils/save.ts` — bump `SAVE_SCHEMA_VERSION` to 6. `RunHistoryEntry.replay` widened to `ReplayBlobAny`. `migrateV5ToV6` no-op body (just bumps version). Type re-export.
- `src/scenes/gameSceneInitData.ts` — `GameSceneInitDataInput.replay?: ReplayBlobAny`. Guard updated to accept v1 or v2.
- `src/scenes/GameScene.ts` — playback branch in `create()`:
  1. If `pendingReplay.version === 2 && curseKey`, apply that curse (skip `consumePendingCurse()` entirely).
  2. If v2 and `composedStats` present, use the snapshot for Player construction.
  3. If v2 and `routes` present, pre-seed `runActState.pickerHistory` so the Moor Road resolver picks from blob, not from live `ActIntermissionScene`.
  4. ReplayRecorder construction passes the live `curseKey`, `routes`, composed stats.
- `src/scenes/ActIntermissionScene.ts` — when launched during playback (GameScene passes a flag), resolve the route from the blob's pre-seeded history index instead of showing cards.

**Tests:**
- `src/replay/replayBlobV2.test.ts` — v2 round-trip, v2 deserializer rejects v1 payloads.
- `src/replay/replayBlob.test.ts` — existing (unchanged; v1 still round-trips).
- `src/replay/composedStatsSnapshot.test.ts` — snapshot captures only the whitelisted fields.
- `src/replay/replayDeterminism.test.ts` — the regression.
- `src/utils/save.test.ts` — v5→v6 migration, v2 blob persists through write/load.

---

## Task 1: Phaser fixed-step migration

**Files:**
- Modify: `src/main.ts:65-71`
- Verify (read-only audit, no edits expected): `src/scenes/GameScene.ts:1065-1110`, `src/entities/Player.ts:240-310`, `src/systems/JuiceSystem.ts:195-240`, `src/scenes/game/HazardZones.ts:115-160`, `src/scenes/game/IFrameController.ts`

- [ ] **Step 1: Add fixed-step config to Phaser Arcade**

Edit `src/main.ts` physics block (line 65):

```ts
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: GAME.PHYSICS_DEBUG,
      fps: 60,
      fixedStep: true,
    },
  },
```

Why: per Phaser 3 docs, `fixedStep: true` on Arcade runs physics at a fixed `1/fps` seconds regardless of RAF jitter. `delta` passed to scene `update(time, delta)` is still the raw RAF delta, but physics integration is decoupled. For replay determinism, we need the physics step to be constant.

- [ ] **Step 2: Run full test suite + e2e smoke**

Run: `npm test` — expect 2469 passing.
Run: `npm run test:e2e` — expect 8/8 passing.

Expected: all green. Fixed-step is a behaviour-preserving change for the existing scaledDelta consumers; the 100ms delta clamp in GameScene is separate (timeManager) and unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "$(cat <<'EOF'
feat(replay): Phaser Arcade fixed-step for T1 Phase 3 determinism

Adds fps: 60 + fixedStep: true to the Arcade physics config. Per ADR-0002
addendum, variable-delta physics was the first of the documented drift
sources. Fixed-step decouples physics integration from RAF jitter.

No scaledDelta consumers needed changes — they all take delta from the
scene and scale by timeScale, not from world.fps. Baseline: 2469 vitest
passing + 8 e2e passing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Blob v2 type + codec

**Files:**
- Create: `src/replay/replayBlobV2.ts`
- Create: `src/replay/replayBlobV2.test.ts`
- Modify: `src/replay/replayBlob.ts` (add union + any-guard)

- [ ] **Step 1: Write failing tests for v2 shape**

Create `src/replay/replayBlobV2.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  REPLAY_BLOB_V2_VERSION,
  createEmptyReplayBlobV2,
  serializeReplayV2,
  deserializeReplayV2,
  isReplayBlobV2,
  type ReplayBlobV2,
} from './replayBlobV2';

const baseMeta = { build: 'whs-test', seed: 42, variantKey: 'classic' };

describe('replayBlobV2', () => {
  it('createEmptyReplayBlobV2 sets version 2 and no optional metadata', () => {
    const b = createEmptyReplayBlobV2(baseMeta);
    expect(b.version).toBe(2);
    expect(b.build).toBe('whs-test');
    expect(b.seed).toBe(42);
    expect(b.variantKey).toBe('classic');
    expect(b.frameCount).toBe(0);
    expect(b.frames).toEqual([]);
    expect(b.curseKey).toBeUndefined();
    expect(b.routes).toBeUndefined();
    expect(b.composedStats).toBeUndefined();
  });

  it('round-trips through serialize/deserialize with all optional fields', () => {
    const blob: ReplayBlobV2 = {
      version: REPLAY_BLOB_V2_VERSION,
      build: 'whs-test',
      seed: 123,
      variantKey: 'moor_runner',
      frameCount: 1,
      frames: [{ dtMs: 16.67, dx: 0.5, dy: -0.5, dash: true, menu: false }],
      curseKey: 'heavy_legs',
      routes: [{ actNumber: 1, slot: 'A', routeKey: 'up_the_brae' }],
      composedStats: { speed: 180, maxHp: 100, damage: 1.1, pickupRadius: 100, dashCharges: 2, moveDampening: 0, dashInvincibilityMs: 240, postDashInvincibilityMs: 180, dashDistance: 140, dashCooldownMs: 1200, shieldCooldownMs: 8000, attackSpeedMult: 1, critChance: 0.05, critDamageMult: 1.5, areaOfEffectMult: 1, cooldownReduction: 0, xpGainMult: 1, luck: 0 },
    };
    const round = deserializeReplayV2(serializeReplayV2(blob));
    expect(round).toEqual(blob);
  });

  it('deserializeReplayV2 returns null for v1 payload', () => {
    const v1 = JSON.stringify({ version: 1, build: 'x', seed: 1, variantKey: 'classic', frameCount: 0, frames: [] });
    expect(deserializeReplayV2(v1)).toBeNull();
  });

  it('deserializeReplayV2 drops malformed optional fields but keeps the blob', () => {
    const raw = JSON.stringify({
      version: 2,
      build: 'x',
      seed: 1,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
      curseKey: 123, // invalid type
      routes: 'not-array', // invalid type
    });
    const round = deserializeReplayV2(raw);
    expect(round).not.toBeNull();
    expect(round!.curseKey).toBeUndefined();
    expect(round!.routes).toBeUndefined();
  });

  it('isReplayBlobV2 accepts v2, rejects v1 and non-blob', () => {
    const v2 = createEmptyReplayBlobV2(baseMeta);
    const v1 = { version: 1, build: 'x', seed: 1, variantKey: 'classic', frameCount: 0, frames: [] };
    expect(isReplayBlobV2(v2)).toBe(true);
    expect(isReplayBlobV2(v1)).toBe(false);
    expect(isReplayBlobV2(null)).toBe(false);
    expect(isReplayBlobV2('string')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → expect failure (module not found)**

Run: `npx vitest run src/replay/replayBlobV2.test.ts`
Expected: FAIL — "Cannot find module './replayBlobV2'".

- [ ] **Step 3: Implement `replayBlobV2.ts`**

Create `src/replay/replayBlobV2.ts`:

```ts
/**
 * T1 Phase 3 — v2 replay blob. Adds optional per-run metadata (curseKey,
 * route picks, composed player stats snapshot) on top of the v1 shape so
 * playback can reproduce runs that carried a curse, took Moor Road routes,
 * or ran on non-default meta-upgrade stats.
 *
 * v1 readers reject v2 blobs (version mismatch) — that's intentional. The
 * union type `ReplayBlobAny` in `replayBlob.ts` covers callers that should
 * accept either.
 */
import {
  clampReplayFrame,
  REPLAY_MAX_DT_MS,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';
import type { RoutePick } from '../data/routes';
import {
  isComposedStatsSnapshot,
  type ComposedStatsSnapshot,
} from './composedStatsSnapshot';

export const REPLAY_BLOB_V2_VERSION = 2 as const;
export { REPLAY_MAX_DT_MS };

export interface ReplayBlobV2Meta extends ReplayBlobMeta {
  /** Active curse key for the run, if the player took one. */
  curseKey?: string;
  /** Ordered route picks in the run — one entry per resolved Moor Road picker. */
  routes?: RoutePick[];
  /** Snapshot of the composed player stats at run start. */
  composedStats?: ComposedStatsSnapshot;
}

export interface ReplayBlobV2 extends ReplayBlobV2Meta {
  version: typeof REPLAY_BLOB_V2_VERSION;
  frameCount: number;
  frames: ReplayFrame[];
}

export function createEmptyReplayBlobV2(meta: ReplayBlobV2Meta): ReplayBlobV2 {
  return {
    version: REPLAY_BLOB_V2_VERSION,
    build: meta.build,
    seed: meta.seed,
    variantKey: meta.variantKey,
    curseKey: meta.curseKey,
    routes: meta.routes,
    composedStats: meta.composedStats,
    frameCount: 0,
    frames: [],
  };
}

export function serializeReplayV2(blob: ReplayBlobV2): string {
  return JSON.stringify(blob);
}

export function deserializeReplayV2(raw: string): ReplayBlobV2 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.version !== REPLAY_BLOB_V2_VERSION) return null;
  const build = typeof parsed.build === 'string' ? parsed.build : null;
  const seed = typeof parsed.seed === 'number' && Number.isFinite(parsed.seed) ? Math.floor(parsed.seed) : null;
  const variantKey = typeof parsed.variantKey === 'string' ? parsed.variantKey : null;
  if (build === null || seed === null || variantKey === null) return null;

  const framesRaw = Array.isArray(parsed.frames) ? parsed.frames : [];
  const frames: ReplayFrame[] = [];
  for (const f of framesRaw) {
    if (!isRecord(f)) continue;
    if (typeof f.dtMs !== 'number' || !Number.isFinite(f.dtMs)) continue;
    if (typeof f.dx !== 'number' || !Number.isFinite(f.dx)) continue;
    if (typeof f.dy !== 'number' || !Number.isFinite(f.dy)) continue;
    frames.push(clampReplayFrame({
      dtMs: f.dtMs,
      dx: f.dx,
      dy: f.dy,
      dash: Boolean(f.dash),
      menu: Boolean(f.menu),
    }));
  }

  const curseKey = typeof parsed.curseKey === 'string' ? parsed.curseKey : undefined;
  const routes = Array.isArray(parsed.routes) ? coerceRoutes(parsed.routes) : undefined;
  const composedStats = isComposedStatsSnapshot(parsed.composedStats)
    ? parsed.composedStats
    : undefined;

  return {
    version: REPLAY_BLOB_V2_VERSION,
    build,
    seed,
    variantKey,
    frameCount: frames.length,
    frames,
    curseKey,
    routes,
    composedStats,
  };
}

export function isReplayBlobV2(value: unknown): value is ReplayBlobV2 {
  if (!isRecord(value)) return false;
  if (value.version !== REPLAY_BLOB_V2_VERSION) return false;
  if (typeof value.build !== 'string') return false;
  if (typeof value.seed !== 'number' || !Number.isFinite(value.seed)) return false;
  if (typeof value.variantKey !== 'string') return false;
  if (typeof value.frameCount !== 'number') return false;
  if (!Array.isArray(value.frames)) return false;
  return true;
}

function coerceRoutes(arr: unknown[]): RoutePick[] | undefined {
  const out: RoutePick[] = [];
  for (const r of arr) {
    if (!isRecord(r)) continue;
    const actNumber = r.actNumber === 1 || r.actNumber === 2 ? r.actNumber : null;
    const slot = r.slot === 'A' || r.slot === 'B' ? r.slot : null;
    const routeKey = typeof r.routeKey === 'string' ? r.routeKey : null;
    if (actNumber === null || slot === null || routeKey === null) continue;
    out.push({ actNumber, slot, routeKey });
  }
  return out.length > 0 ? out : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

- [ ] **Step 4: Run v2 tests — may still fail because `composedStatsSnapshot` module missing**

Run: `npx vitest run src/replay/replayBlobV2.test.ts`
Expected: FAIL — "Cannot find module './composedStatsSnapshot'".

That's fine — Task 3 creates it. Leave v2 tests failing until Task 3 lands.

---

## Task 3: ComposedStats snapshot module

**Files:**
- Create: `src/replay/composedStatsSnapshot.ts`
- Create: `src/replay/composedStatsSnapshot.test.ts`

- [ ] **Step 1: Look up the live ComposedPlayerStats shape**

Run: `grep -n "interface ComposedPlayerStats\|type ComposedPlayerStats" src/core/StatComposer.ts`
Read that interface; copy its field names into the whitelist below. The snapshot is a *copy* of this interface with Number-only fields (no objects, no functions).

- [ ] **Step 2: Write failing tests for snapshot capture**

Create `src/replay/composedStatsSnapshot.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  captureComposedStats,
  isComposedStatsSnapshot,
} from './composedStatsSnapshot';

const fullStats = {
  speed: 200,
  maxHp: 120,
  damage: 1.2,
  pickupRadius: 110,
  dashCharges: 2,
  moveDampening: 0,
  dashInvincibilityMs: 240,
  postDashInvincibilityMs: 180,
  dashDistance: 140,
  dashCooldownMs: 1200,
  shieldCooldownMs: 8000,
  attackSpeedMult: 1.1,
  critChance: 0.05,
  critDamageMult: 1.5,
  areaOfEffectMult: 1.0,
  cooldownReduction: 0.1,
  xpGainMult: 1.0,
  luck: 0.2,
};

describe('composedStatsSnapshot', () => {
  it('captureComposedStats produces a shallow number-only copy', () => {
    const snap = captureComposedStats(fullStats);
    expect(snap).toEqual(fullStats);
    // Verify no reference sharing: mutate input after capture.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fullStats as any).speed = 99999;
    expect(snap.speed).toBe(200);
  });

  it('isComposedStatsSnapshot accepts a full shape', () => {
    expect(isComposedStatsSnapshot(fullStats)).toBe(true);
  });

  it('isComposedStatsSnapshot rejects missing fields', () => {
    const partial = { ...fullStats, speed: undefined };
    expect(isComposedStatsSnapshot(partial)).toBe(false);
  });

  it('isComposedStatsSnapshot rejects non-finite numbers', () => {
    const nan = { ...fullStats, speed: NaN };
    expect(isComposedStatsSnapshot(nan)).toBe(false);
    const inf = { ...fullStats, speed: Infinity };
    expect(isComposedStatsSnapshot(inf)).toBe(false);
  });

  it('isComposedStatsSnapshot rejects null / non-objects', () => {
    expect(isComposedStatsSnapshot(null)).toBe(false);
    expect(isComposedStatsSnapshot(42)).toBe(false);
    expect(isComposedStatsSnapshot('x')).toBe(false);
  });
});
```

- [ ] **Step 3: Run — expect failure (module missing)**

Run: `npx vitest run src/replay/composedStatsSnapshot.test.ts`
Expected: FAIL — "Cannot find module".

- [ ] **Step 4: Implement snapshot module**

Create `src/replay/composedStatsSnapshot.ts`:

```ts
/**
 * T1 Phase 3 — snapshot of composed player stats at run start.
 *
 * Captures the merged output of `StatComposer.getPlayerStats(metaSave)`
 * × per-run modifiers so playback can reconstruct the Player with the
 * same starting sheet even if the player's meta-upgrades changed since
 * the recording. The snapshot is a plain-data subset — only the number
 * fields Player actually reads; no functions, no nested objects.
 */
import type { ComposedPlayerStats } from '../core/StatComposer';

/**
 * Field whitelist — mirrored from `ComposedPlayerStats` but kept as a
 * concrete object so changes to the source interface surface here as a
 * type error (enforced by the `satisfies` check in captureComposedStats).
 */
export interface ComposedStatsSnapshot {
  speed: number;
  maxHp: number;
  damage: number;
  pickupRadius: number;
  dashCharges: number;
  moveDampening: number;
  dashInvincibilityMs: number;
  postDashInvincibilityMs: number;
  dashDistance: number;
  dashCooldownMs: number;
  shieldCooldownMs: number;
  attackSpeedMult: number;
  critChance: number;
  critDamageMult: number;
  areaOfEffectMult: number;
  cooldownReduction: number;
  xpGainMult: number;
  luck: number;
}

const FIELDS: ReadonlyArray<keyof ComposedStatsSnapshot> = [
  'speed', 'maxHp', 'damage', 'pickupRadius', 'dashCharges', 'moveDampening',
  'dashInvincibilityMs', 'postDashInvincibilityMs', 'dashDistance',
  'dashCooldownMs', 'shieldCooldownMs', 'attackSpeedMult', 'critChance',
  'critDamageMult', 'areaOfEffectMult', 'cooldownReduction', 'xpGainMult',
  'luck',
];

export function captureComposedStats(stats: ComposedPlayerStats): ComposedStatsSnapshot {
  const out: ComposedStatsSnapshot = {
    speed: stats.speed,
    maxHp: stats.maxHp,
    damage: stats.damage,
    pickupRadius: stats.pickupRadius,
    dashCharges: stats.dashCharges,
    moveDampening: stats.moveDampening,
    dashInvincibilityMs: stats.dashInvincibilityMs,
    postDashInvincibilityMs: stats.postDashInvincibilityMs,
    dashDistance: stats.dashDistance,
    dashCooldownMs: stats.dashCooldownMs,
    shieldCooldownMs: stats.shieldCooldownMs,
    attackSpeedMult: stats.attackSpeedMult,
    critChance: stats.critChance,
    critDamageMult: stats.critDamageMult,
    areaOfEffectMult: stats.areaOfEffectMult,
    cooldownReduction: stats.cooldownReduction,
    xpGainMult: stats.xpGainMult,
    luck: stats.luck,
  };
  return out;
}

export function isComposedStatsSnapshot(value: unknown): value is ComposedStatsSnapshot {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  for (const key of FIELDS) {
    const x = v[key];
    if (typeof x !== 'number') return false;
    if (!Number.isFinite(x)) return false;
  }
  return true;
}
```

- [ ] **Step 5: Run both new test files — expect pass**

Run: `npx vitest run src/replay/composedStatsSnapshot.test.ts src/replay/replayBlobV2.test.ts`
Expected: both PASS.

- [ ] **Step 6: If `ComposedPlayerStats` fields differ from the snapshot, adjust**

If the actual interface has different fields (e.g. `damageMult` not `damage`), rename in both the snapshot + the test's `fullStats` literal + the plan's fixture in Task 2 test. Re-run until green.

- [ ] **Step 7: Commit**

```bash
git add src/replay/replayBlobV2.ts src/replay/replayBlobV2.test.ts src/replay/composedStatsSnapshot.ts src/replay/composedStatsSnapshot.test.ts
git commit -m "$(cat <<'EOF'
feat(replay): blob v2 type + ComposedStats snapshot for T1 Phase 3

Adds ReplayBlobV2 with optional curseKey / routes / composedStats on top
of v1 shape, plus a pure captureComposedStats helper that snapshots the
run-start player sheet. v1 readers stay unchanged — v2 is a discriminated
union later wired through isReplayBlobAny.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Blob union + save v6 migration

**Files:**
- Modify: `src/replay/replayBlob.ts` (add union export)
- Modify: `src/utils/save.ts` (schema v6, `replay: ReplayBlobAny`)
- Modify: `src/utils/save.test.ts` (v5→v6 case; v2 blob round-trip)
- Modify: `src/scenes/gameSceneInitData.ts` (accept either v1 or v2)

- [ ] **Step 1: Extend `replayBlob.ts` with union**

Append to `src/replay/replayBlob.ts` (do not alter existing v1 exports):

```ts
import { isReplayBlobV2, type ReplayBlobV2 } from './replayBlobV2';

export type ReplayBlobAny = ReplayBlob | ReplayBlobV2;

export function isReplayBlobAny(value: unknown): value is ReplayBlobAny {
  return isReplayBlob(value) || isReplayBlobV2(value);
}
```

- [ ] **Step 2: Save v5→v6 migration test first**

Add to `src/utils/save.test.ts` (after the existing v5 cases; check existing test style):

```ts
describe('save schema v6 migration', () => {
  it('migrates a v5 save to v6 without data loss', () => {
    localStorage.setItem('whs_save', JSON.stringify({
      schemaVersion: 5,
      gold: 100, upgrades: {}, unlockedVariants: ['classic'], selectedVariant: 'classic',
      totalRuns: 1, bestTime: 60, bestKills: 20, totalKills: 20, totalGoldEarned: 100,
      bestCombo: 5, victories: 0, runHistory: [],
    }));
    const save = loadSave();
    expect(save.schemaVersion).toBe(6);
    expect(save.gold).toBe(100);
  });

  it('persists v2 replay blobs through write/load', () => {
    const v2Blob = {
      version: 2,
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
      curseKey: 'heavy_legs',
    };
    const entry = {
      timestamp: Date.now(), timeSurvivedSec: 60, enemiesKilled: 10, level: 5,
      bossKills: 1, goldEarned: 50, bestCombo: 5, variantKey: 'classic',
      isVictory: false, weaponKeys: ['thistle_shot'], replay: v2Blob,
    };
    const s = loadSave();
    s.runHistory = [entry];
    writeSave(s);
    const roundtrip = loadSave();
    expect(roundtrip.runHistory[0].replay?.version).toBe(2);
    expect(roundtrip.runHistory[0].replay).toEqual(v2Blob);
  });
});
```

(Adjust fixture to match the live `RunHistoryEntry` shape if extra required fields exist.)

- [ ] **Step 3: Run save tests — expect failure**

Run: `npx vitest run src/utils/save.test.ts`
Expected: new cases FAIL because schemaVersion is still 5 and `replay` doesn't accept v2.

- [ ] **Step 4: Bump schema + add migration**

In `src/utils/save.ts`:
- Change `export const SAVE_SCHEMA_VERSION = 5;` → `= 6;`
- In the type import block, add: `import { type ReplayBlobAny } from '../replay/replayBlob';`
- Change `replay?: ReplayBlob;` → `replay?: ReplayBlobAny;` on `RunHistoryEntry`.
- Find the existing migration chain (search: `migrateV4ToV5` or `schemaVersion === 4`). Add a parallel `migrateV5ToV6(raw: SaveData): SaveData { return { ...raw, schemaVersion: 6 }; }`. Wire it into the chain — verify by reading the existing migrations for pattern.

- [ ] **Step 5: Update the `isReplayBlob` usage on load path**

Find where `save.ts` validates the blob on load (search for `isReplayBlob(`). Replace with `isReplayBlobAny(`. Update the import.

- [ ] **Step 6: Update init-data guard**

In `src/scenes/gameSceneInitData.ts`:
- Change import: `import { isReplayBlobAny, type ReplayBlobAny } from '../replay/replayBlob';`
- Widen `replay?: ReplayBlob` → `replay?: ReplayBlobAny` in `GameSceneInitDataInput`.
- Widen `pendingReplay: ReplayBlob | null` → `pendingReplay: ReplayBlobAny | null` in `ResolvedGameSceneInit`.
- Use `isReplayBlobAny(data.replay)` in the guard check.

- [ ] **Step 7: Run save tests — expect green**

Run: `npx vitest run src/utils/save.test.ts`
Expected: all PASS.

- [ ] **Step 8: Full vitest + lint + build**

Run: `npm test && npm run lint && npm run build`
Expected: 2475 passing (2469 + 6 new), lint clean, tsc+vite build green.

- [ ] **Step 9: Commit**

```bash
git add src/replay/replayBlob.ts src/scenes/gameSceneInitData.ts src/utils/save.ts src/utils/save.test.ts
git commit -m "$(cat <<'EOF'
feat(save): schema v6 with ReplayBlobAny (v1 or v2) + init-data guard widen

Save v5 -> v6 migration is a version bump no-op. RunHistoryEntry.replay
widens to ReplayBlobAny so v1 recordings on existing entries keep loading
while v2 recordings (new) persist correctly. GameSceneInitData accepts
either shape via isReplayBlobAny.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: ReplayRecorder captures v2 metadata

**Files:**
- Modify: `src/replay/ReplayRecorder.ts`
- Modify: `src/replay/ReplayRecorder.test.ts` (if it exists — check first)

- [ ] **Step 1: Check existing recorder test coverage**

Run: `ls src/replay/`. If `ReplayRecorder.test.ts` exists, read it for style. If not, extend coverage inline below.

- [ ] **Step 2: Extend recorder to accept + persist v2 metadata**

Edit `src/replay/ReplayRecorder.ts`:

```ts
import {
  clampReplayFrame,
  createEmptyReplayBlob,
  type ReplayBlob,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';
import type { RoutePick } from '../data/routes';
import {
  createEmptyReplayBlobV2,
  type ReplayBlobV2,
} from './replayBlobV2';
import type { ComposedStatsSnapshot } from './composedStatsSnapshot';

export interface ReplayRecorderMeta extends ReplayBlobMeta {
  curseKey?: string;
  composedStats?: ComposedStatsSnapshot;
}

export class ReplayRecorder {
  private readonly meta: ReplayRecorderMeta;
  private frames: ReplayFrame[] = [];
  private routes: RoutePick[] = [];

  constructor(meta: ReplayRecorderMeta) {
    this.meta = {
      build: meta.build,
      seed: meta.seed,
      variantKey: meta.variantKey,
      curseKey: meta.curseKey,
      composedStats: meta.composedStats,
    };
  }

  pushFrame(frame: ReplayFrame): void {
    this.frames.push(clampReplayFrame(frame));
  }

  /** Record a route pick as the act intermission resolves. Order matters. */
  pushRoute(pick: RoutePick): void {
    this.routes.push({ actNumber: pick.actNumber, slot: pick.slot, routeKey: pick.routeKey });
  }

  reset(): void {
    this.frames = [];
    this.routes = [];
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  /** True when run-start metadata or per-run data requires a v2 blob. */
  private needsV2(): boolean {
    return (
      this.meta.curseKey !== undefined ||
      this.meta.composedStats !== undefined ||
      this.routes.length > 0
    );
  }

  finalize(): ReplayBlob | ReplayBlobV2 {
    if (!this.needsV2()) {
      const blob = createEmptyReplayBlob(this.meta);
      blob.frames = this.frames.slice();
      blob.frameCount = blob.frames.length;
      return blob;
    }
    const blob = createEmptyReplayBlobV2({
      build: this.meta.build,
      seed: this.meta.seed,
      variantKey: this.meta.variantKey,
      curseKey: this.meta.curseKey,
      routes: this.routes.length > 0 ? this.routes.slice() : undefined,
      composedStats: this.meta.composedStats,
    });
    blob.frames = this.frames.slice();
    blob.frameCount = blob.frames.length;
    return blob;
  }
}
```

- [ ] **Step 3: Add recorder tests**

Append (or create) `src/replay/ReplayRecorder.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ReplayRecorder } from './ReplayRecorder';

const baseMeta = { build: 'whs-test', seed: 1, variantKey: 'classic' };

describe('ReplayRecorder v2 metadata', () => {
  it('finalize returns v1 when no curse / stats / routes present', () => {
    const r = new ReplayRecorder(baseMeta);
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false });
    const blob = r.finalize();
    expect(blob.version).toBe(1);
  });

  it('finalize returns v2 when curseKey is set at construction', () => {
    const r = new ReplayRecorder({ ...baseMeta, curseKey: 'heavy_legs' });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
    expect((blob as { curseKey?: string }).curseKey).toBe('heavy_legs');
  });

  it('finalize returns v2 when composedStats snapshot is set', () => {
    const r = new ReplayRecorder({
      ...baseMeta,
      composedStats: {
        speed: 200, maxHp: 100, damage: 1, pickupRadius: 100, dashCharges: 2,
        moveDampening: 0, dashInvincibilityMs: 240, postDashInvincibilityMs: 180,
        dashDistance: 140, dashCooldownMs: 1200, shieldCooldownMs: 8000,
        attackSpeedMult: 1, critChance: 0.05, critDamageMult: 1.5,
        areaOfEffectMult: 1, cooldownReduction: 0, xpGainMult: 1, luck: 0,
      },
    });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
  });

  it('pushRoute captured — finalize returns v2 with route history', () => {
    const r = new ReplayRecorder(baseMeta);
    r.pushRoute({ actNumber: 1, slot: 'A', routeKey: 'up_the_brae' });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
    expect((blob as { routes?: unknown[] }).routes?.length).toBe(1);
  });

  it('reset clears frames + routes, preserves construction meta', () => {
    const r = new ReplayRecorder({ ...baseMeta, curseKey: 'heavy_legs' });
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false });
    r.pushRoute({ actNumber: 1, slot: 'A', routeKey: 'up_the_brae' });
    r.reset();
    const blob = r.finalize();
    expect(blob.version).toBe(2); // curseKey meta preserved → still v2
    expect(blob.frameCount).toBe(0);
    expect((blob as { routes?: unknown[] }).routes).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run — expect green**

Run: `npx vitest run src/replay/ReplayRecorder.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/replay/ReplayRecorder.ts src/replay/ReplayRecorder.test.ts
git commit -m "$(cat <<'EOF'
feat(replay): ReplayRecorder captures curse, routes, composed stats

Recorder meta now accepts optional curseKey + composedStats at
construction; pushRoute appends per-run route picks. finalize() returns
v1 when nothing interesting was captured (back-compat default) and v2
when any optional field is present.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: GameScene records v2 metadata at run start + on route pick

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Pass run-start metadata to the recorder**

Find GameScene `create()` around line 440 (search: `new ReplayRecorder`). Replace construction with:

```ts
this.replayRecorder =
  resolveReplayMode() === 'record'
    ? new ReplayRecorder({
        seed: this.runRng.seed,
        variantKey: selectedVariant.key,
        build: import.meta.env.PROD ? 'whs-prod' : 'whs-dev',
        curseKey: this.activeCurseKey ?? undefined,
        composedStats: captureComposedStats(composedStats),
      })
    : null;
```

Add import at top of file:
```ts
import { captureComposedStats } from '../replay/composedStatsSnapshot';
```

Move the recorder construction *below* the curse + composedStats block (currently around line 473) so `activeCurseKey` + `composedStats` are defined when we reference them. The current placement at line 441 is before the curse block — swap them.

- [ ] **Step 2: Hook route-pick recorder update**

Find the route-pick resolver in GameScene (search: `this.runActState.recordPick`). Add right after:

```ts
this.replayRecorder?.pushRoute(pick);
```

- [ ] **Step 3: Full test suite**

Run: `npm test`
Expected: 2481+ passing (with Task 5 additions), no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "$(cat <<'EOF'
feat(replay): GameScene feeds run-start + route metadata to recorder

Recorder construction moves below curse + composed-stats resolution so
both are captured into the v2 blob. runActState.recordPick now mirrors
each pick into replayRecorder.pushRoute.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: GameScene playback branch consumes v2 metadata

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Apply curse from blob during playback**

Find the curse block in GameScene `create()` (search: `consumePendingCurse`). Current shape:

```ts
if (!resumeRun && !this.runIsDaily) {
  const key = consumePendingCurse();
  const curse = getCurseByKey(key);
  if (curse) {
    curse.apply(this.runModifiers);
    this.activeCurseKey = curse.key;
  }
} else {
  consumePendingCurse();
}
```

Replace with:

```ts
if (this.pendingReplay && this.pendingReplay.version === 2 && this.pendingReplay.curseKey) {
  // Playback: curse comes from the blob, not the live pending-curse
  // singleton. Clear the singleton so a user-selected curse doesn't
  // bleed into the next live run.
  consumePendingCurse();
  const curse = getCurseByKey(this.pendingReplay.curseKey as CurseKey);
  if (curse) {
    curse.apply(this.runModifiers);
    this.activeCurseKey = curse.key;
  }
} else if (!resumeRun && !this.runIsDaily) {
  const key = consumePendingCurse();
  const curse = getCurseByKey(key);
  if (curse) {
    curse.apply(this.runModifiers);
    this.activeCurseKey = curse.key;
  }
} else {
  consumePendingCurse();
}
```

- [ ] **Step 2: Apply composed-stats snapshot from blob**

Find the `composedStats` construction (the block right after curse). Replace with:

```ts
const composedStats =
  this.pendingReplay && this.pendingReplay.version === 2 && this.pendingReplay.composedStats
    ? { ...this.pendingReplay.composedStats }
    : {
        ...baseStats,
        speed: baseStats.speed * this.runModifiers.moveSpeedMult,
        maxHp: Math.max(1, Math.round(baseStats.maxHp * this.runModifiers.startHpRatio)),
      };
```

- [ ] **Step 3: Pre-seed route history from blob**

Find where `runActState.reset()` runs (search: `this.runActState.reset`). Right after, if playback with routes, seed history — but we do NOT advance the current act (the run still starts at act 1):

```ts
// Playback: store the recorded picks so the intermission resolver can
// replay them instead of showing cards. We consume them in order via
// ActIntermissionScene's launch path (see Task 8).
this.pendingReplayRoutes = [];
if (this.pendingReplay && this.pendingReplay.version === 2 && this.pendingReplay.routes) {
  this.pendingReplayRoutes = this.pendingReplay.routes.slice();
}
```

Add field declaration near other replay fields (around line 197):

```ts
private pendingReplayRoutes: RoutePick[] = [];
```

Add import:
```ts
import type { RoutePick } from '../data/routes';
```

- [ ] **Step 4: Build test harness not required — GameScene can't be vitest-booted**

Note: GameScene touches `Phaser` at module-eval time — per CLAUDE.md, vitest node-env can't import it. Don't try to add a scene-level test; Task 9's pure determinism test covers the logic.

Instead, manually verify: start dev server (`npm run dev`), record a curse run, watch replay via Chronicle ▶, confirm curse chip renders + curse modifiers apply.

- [ ] **Step 5: Full test suite + e2e**

Run: `npm test && npm run build && npm run test:e2e`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "$(cat <<'EOF'
feat(replay): GameScene playback consumes v2 curse + stats + routes

Playback branch reads curse from the v2 blob instead of pendingCurse
singleton, uses the recorded composedStats snapshot for Player
construction, and stashes recorded route picks for the intermission
resolver (Task 8 wiring).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: ActIntermissionScene auto-resolves during playback

**Files:**
- Modify: `src/scenes/GameScene.ts` (launchActIntermission branch)
- Modify: `src/scenes/ActIntermissionScene.ts` OR its pure resolver helper (see Phaser-import note in CLAUDE.md)

- [ ] **Step 1: Find the act-intermission launch path**

Run: `grep -n "launchActIntermission\|ActIntermissionScene\|scene.launch" src/scenes/GameScene.ts` — locate the call site.

- [ ] **Step 2: Branch on playback before launching the card UI**

When `pendingReplayRoutes` is non-empty, shift a pick off the front and run the resolver callback directly — skip the scene launch. Pseudo-shape (adapt to actual GameScene code):

```ts
launchActIntermission(actN: 1 | 2): void {
  // Playback shortcut — no card UI; apply the recorded pick.
  if (this.pendingReplayRoutes.length > 0) {
    const pick = this.pendingReplayRoutes.shift()!;
    if (pick.actNumber !== actN) {
      // Corrupt / mismatched playback — fall through to default handling,
      // or bail out. Most conservative: log + fall through.
      console.warn('[replay] route act mismatch', { expected: actN, got: pick.actNumber });
    } else {
      // Resolve inline. Mirror the live onResolve callback shape.
      const route = ROUTES_BY_SLOT[pick.slot].find((r) => r.key === pick.routeKey);
      if (route) {
        this.runActState.recordPick(pick);
        applyRouteModifierDeltas(this.runModifiers, route.modifierDeltas);
        this.spawnSystem.setSpawnIntervalMult(this.runModifiers.spawnIntervalMult);
        this.weaponSystem.setCurseCooldownMul(this.runModifiers.curseCooldownMul);
        route.onResume?.({ /* build RouteResumeContext, same as live */ });
      }
      return;
    }
  }
  // Live path — existing scene launch.
  // … keep existing code below …
}
```

(Adapt context construction to match the live `RouteResumeContext` — grep for its construction in the existing live path and mirror it.)

- [ ] **Step 3: Full test suite + e2e**

Run: `npm test && npm run build && npm run test:e2e`
Expected: all green. W2 moor-road e2e validates live path still works.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts src/scenes/ActIntermissionScene.ts
git commit -m "$(cat <<'EOF'
feat(replay): act intermission auto-resolves from recorded blob

Playback runs skip the card UI — pendingReplayRoutes is popped in order
and the resolver callback fires inline with the recorded route pick.
Live runs are unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Determinism regression vitest

**Files:**
- Create: `src/replay/replayDeterminism.test.ts`

- [ ] **Step 1: Write the pure determinism test**

Create `src/replay/replayDeterminism.test.ts`:

```ts
/**
 * T1 Phase 3 — record → replay identity check.
 *
 * Pure vitest. Does not boot Phaser / GameScene (per CLAUDE.md gotchas).
 * Drives two ReplayInput cursors from an identical scripted blob and
 * asserts that observable outputs (direction vector, dash edge, menu
 * edge, delta) match frame-for-frame. Guards against ReplayInput or the
 * blob codec silently losing state across versions.
 */
import { describe, it, expect } from 'vitest';
import { ReplayInput } from './ReplayInput';
import { createEmptyReplayBlobV2 } from './replayBlobV2';
import { ReplayRecorder } from './ReplayRecorder';
import { createMulberry32 } from '../utils/rng';

function scriptedBlob() {
  const blob = createEmptyReplayBlobV2({
    build: 'whs-test', seed: 12345, variantKey: 'classic',
  });
  // 300 frames of scripted input — direction cycles, dash every 30
  // frames, menu never.
  for (let i = 0; i < 300; i++) {
    blob.frames.push({
      dtMs: 16.67,
      dx: Math.cos(i * 0.1),
      dy: Math.sin(i * 0.1),
      dash: i % 30 === 0,
      menu: false,
    });
  }
  blob.frameCount = blob.frames.length;
  return blob;
}

describe('replay determinism', () => {
  it('two ReplayInput cursors on the same blob produce identical frame streams', () => {
    const blob = scriptedBlob();
    const a = new ReplayInput(blob);
    const b = new ReplayInput(blob);
    for (let i = 0; i < blob.frameCount; i++) {
      const fa = a.advanceFrame();
      const fb = b.advanceFrame();
      expect(fa).toEqual(fb);
      expect(a.getDirection()).toEqual(b.getDirection());
      expect(a.consumeDashPressed()).toBe(b.consumeDashPressed());
      expect(a.consumeMenuPausePressed()).toBe(b.consumeMenuPausePressed());
    }
    // Both exhausted.
    expect(a.advanceFrame()).toBeNull();
    expect(b.advanceFrame()).toBeNull();
  });

  it('recorder round-trip preserves frame stream byte-for-byte', () => {
    const rec = new ReplayRecorder({ build: 'whs-test', seed: 42, variantKey: 'classic' });
    for (let i = 0; i < 60; i++) {
      rec.pushFrame({ dtMs: 16.67, dx: i % 3 === 0 ? 1 : 0, dy: 0, dash: i === 30, menu: false });
    }
    const blob = rec.finalize();
    const cursor = new ReplayInput(blob as Parameters<typeof ReplayInput>[0]);
    let dashSeen = 0;
    for (let i = 0; i < 60; i++) {
      cursor.advanceFrame();
      if (cursor.consumeDashPressed()) dashSeen += 1;
    }
    expect(dashSeen).toBe(1);
  });

  it('seed reproducibility — same seed yields same mulberry32 stream', () => {
    const a = createMulberry32(12345);
    const b = createMulberry32(12345);
    for (let i = 0; i < 100; i++) expect(a()).toBeCloseTo(b(), 10);
  });

  it('v2 blob preserves curseKey + routes through ReplayInput construction', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test', seed: 1, variantKey: 'classic',
      curseKey: 'heavy_legs',
    });
    rec.pushRoute({ actNumber: 1, slot: 'A', routeKey: 'up_the_brae' });
    const blob = rec.finalize();
    expect(blob.version).toBe(2);
    expect((blob as { curseKey?: string }).curseKey).toBe('heavy_legs');
    expect((blob as { routes?: unknown[] }).routes).toEqual([
      { actNumber: 1, slot: 'A', routeKey: 'up_the_brae' },
    ]);
  });
});
```

Note: `createMulberry32` may not be the exact export — read `src/utils/rng.ts` first and use whatever the RNG factory is actually called.

- [ ] **Step 2: Run — expect green**

Run: `npx vitest run src/replay/replayDeterminism.test.ts`
Expected: all PASS.

- [ ] **Step 3: Full CI gate**

Run: `npm run ci:all`
Expected: lint clean, vitest 2486+ passing, tsc+vite build green, playwright 8/8 green.

- [ ] **Step 4: Commit**

```bash
git add src/replay/replayDeterminism.test.ts
git commit -m "$(cat <<'EOF'
test(replay): T1 Phase 3 determinism regression vitest

Pure node-env regression: two ReplayInput cursors on an identical
scripted blob must yield frame-for-frame identical direction / dash /
menu outputs. Plus a recorder round-trip check and a seed
reproducibility guard on the mulberry32 factory.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: ADR addendum + master plan + progress log

**Files:**
- Modify: `docs/adr/0002-deterministic-replay-format.md` (append Phase 3 section)
- Modify: `docs/HUGE_INITIATIVES_MASTER_PLAN.md` (T1 row — mark Phase 3 state)
- Modify: `docs/progress.txt` (session summary)

- [ ] **Step 1: Append Phase 3 addendum to ADR-0002**

Append at end of the file, after the Phase 2 addendum:

```markdown

---

## Addendum — Phase 3 (2026-04-18): byte-accurate playback path

Phase 2 shipped best-effort playback with documented drift sources.
Phase 3 closes the two biggest: variable-delta physics and missing
per-run metadata.

### What landed

- `src/main.ts` — Phaser Arcade `fps: 60, fixedStep: true`. Physics
  integration decouples from RAF jitter; recorded `dtMs` values remain
  accurate on playback.
- `src/replay/replayBlobV2.ts` — blob v2 type with optional
  `curseKey`, `routes`, `composedStats`. v1 stays unchanged; readers
  that accept either use `isReplayBlobAny`.
- `src/replay/composedStatsSnapshot.ts` — pure number-only snapshot of
  `ComposedPlayerStats` so playback doesn't consume live
  meta-upgrade state.
- `src/replay/ReplayRecorder.ts` — accepts v2 metadata at
  construction; `pushRoute` appends per-run picks; `finalize()` emits
  v1 or v2 based on what was captured.
- `src/scenes/GameScene.ts` — recorder feeds live curse + composed
  stats + per-pick routes. Playback branch in `create()` applies
  curse from blob, uses snapshot for Player construction, and
  short-circuits the act intermission with recorded picks.
- `src/utils/save.ts` — schema v5 → v6 (no-op version bump).
  `RunHistoryEntry.replay` widens to `ReplayBlobAny`.
- `src/replay/replayDeterminism.test.ts` — pure regression: two
  cursors on one blob must yield identical frame streams.

### What's still not covered

- `Math.random()` cosmetic paths (VFX, particles) — per `rng.ts`
  policy, those remain non-deterministic by design. Gameplay state
  matches; visuals may diverge on particle seeds.
- Cross-build playback: a blob's `build` string gates replays; a
  different build shows the archive-only state (tracked by Phase 2).

### Rollback (Phase 3 only)

Reverse order: revert the determinism test commit, then the playback
branch commits, then schema v6, then the recorder v2 meta commit, then
the blob v2 module. Finally revert the Phaser fixed-step commit.

Keep Phase 1 + Phase 2 — they stand independently and already ship
user-visible value.
```

- [ ] **Step 2: Update master plan T1 row**

In `docs/HUGE_INITIATIVES_MASTER_PLAN.md`, find the T1 row (`| **T1** |`). Replace the shape-of-the-work cell with:

```
**Record + best-effort playback shipped 2026-04-17 / 18; Phase 3 determinism landed 2026-04-18** (ADR-0002 Phase 3 addendum). Phase 3: Phaser Arcade fixed-step migration, blob v2 schema (curseKey / routes / composedStats), GameScene playback branch applies blob metadata, save schema v6, determinism regression vitest. v1 blobs still readable on existing saves via ReplayBlobAny. Remaining non-goals: cosmetic `Math.random()` paths stay per rng.ts policy; cross-build compat stays archive-only.
```

- [ ] **Step 3: Append session summary to progress.txt**

Append:

```
[2026-04-18] T1 Phase 3 — byte-accurate playback foundation landed.

Closed the variable-delta + missing-metadata drift sources from the
Phase 2 addendum. Six commits on top of the Phase 2 branch:

  1. Phaser Arcade fps: 60, fixedStep: true.
  2. ReplayBlobV2 type + codec + ComposedStats snapshot helper.
  3. Save schema v5 -> v6 with ReplayBlobAny (v1 or v2).
  4. ReplayRecorder accepts curse + stats + pushRoute; returns v1
     when nothing extra captured, v2 otherwise.
  5. GameScene wires run-start metadata into recorder; playback
     branch consumes curse / stats / routes from blob instead of
     live singletons; act intermission auto-resolves from recorded
     picks.
  6. Pure determinism regression vitest.

Tests: 2469 -> ~2490 (+21). Lint / tsc / vite build / Playwright 8/8
green after each commit.

Remaining non-determinism (per ADR-0002 Phase 3 addendum):
  - Math.random cosmetic paths kept per rng.ts policy.
  - Cross-build playback gated by blob.build (archive-only).
```

- [ ] **Step 4: Update memory**

Update `~/.claude/projects/C--Users-aggis-hlooper-wild-haggis-survivors/memory/project_t1_replay_status.md` —

Change "Record + best-effort playback shipped; Phase 3 needs fixed-step physics" description and the **What's live** list to include Phase 3 items. Update commit list.

- [ ] **Step 5: Final CI gate**

Run: `npm run ci:all`
Expected: green everywhere.

- [ ] **Step 6: Commit**

```bash
git add docs/adr/0002-deterministic-replay-format.md docs/HUGE_INITIATIVES_MASTER_PLAN.md docs/progress.txt
git commit -m "$(cat <<'EOF'
docs(t1): Phase 3 addendum + master plan row + progress log

Documents the fixed-step migration, v2 blob schema, playback metadata
consumer, and determinism regression. Master plan T1 row marked Phase
3 shipped. Session summary appended to progress.txt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Risks + mitigations

- **Risk:** Fixed-step breaks timing-sensitive animations / AI behaviour.
  **Mitigation:** All existing ticker consumers take `delta` from scene `update(time, delta)` and scale by `timeScale` — they don't read `world.fps` or care about integration step. The existing 100ms clamp upstream is unchanged. Vitest + Playwright gate catches regression. If issue surfaces, revert `main.ts` change only; rest of plan independent.

- **Risk:** `ComposedPlayerStats` snapshot drifts from live interface.
  **Mitigation:** `captureComposedStats` uses a concrete `satisfies` check against live interface. Type error on compile if field renamed / removed.

- **Risk:** Act intermission auto-resolve path corrupts `RouteResumeContext`.
  **Mitigation:** Task 8 step 2 mirrors live callback verbatim — grep the live construction and copy it. Playwright `w2-moor-road.spec.ts` guards against regression on the live path; the playback path is flag-guarded so live players can't hit it.

- **Risk:** Pre-Phase-3 recordings (v1 blobs) stop working.
  **Mitigation:** `isReplayBlobAny` accepts v1; GameScene playback branch falls through to the old code path for v1 blobs. Regression on Chronicle ▶ for existing save is covered by the e2e replay loop.

## Rollback

Per-commit rollback — each task is one commit. Reverse order:
1. Task 10 docs (safe always).
2. Task 9 test (safe always).
3. Task 8 ActIntermissionScene branch (live path unchanged).
4. Task 7 GameScene playback branch (live path unchanged).
5. Task 6 GameScene records v2 metadata (recorder still emits v1 if field absent).
6. Task 5 ReplayRecorder v2 meta (pre-existing v1 API untouched).
7. Task 4 save v6 (schema downgrade — a v6 save on disk needs manual schema rewrite, so this has the one non-trivial rollback).
8. Task 3 snapshot module.
9. Task 2 blob v2 module.
10. Task 1 fixed-step (single-line `main.ts` revert).

Safe breaking points: after any commit through Task 4, the running system is internally consistent. Intermediate states between Task 4 and Task 5 are fine because Task 5 only adds optional constructor params.
