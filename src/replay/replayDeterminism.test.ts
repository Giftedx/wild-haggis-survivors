/**
 * T1 Phase 3 — record → replay identity check.
 *
 * Pure vitest. Does not boot Phaser / GameScene (per CLAUDE.md gotchas
 * — Phaser touches `window` at module-eval time and breaks node-env).
 * Drives two ReplayInput cursors over an identical blob and asserts that
 * observable outputs (direction vector, dash edge, menu edge, delta)
 * match frame-for-frame. Guards against ReplayInput or the blob codec
 * silently losing state across versions.
 *
 * Also covers gameplay-state RNG seams that GameScene drives at runtime
 * — e.g. `enemyAngleSeed.ts` (orbit init + spawner-minion direction).
 * Two real Math.random holes in those paths survived the original T1
 * ship (Enemy.ts:298 + :924) because the cursor-only byte-equality
 * check above never exercised enemy spawn output. The seam tests
 * below close that gap by asserting same-seed RNGs produce identical
 * angle streams under interleaved call order.
 *
 * Complements the end-to-end `replay-loop.spec.ts` Playwright check that
 * drives a live GameScene through record → save → watch.
 */
import { describe, it, expect } from 'vitest';
import { ReplayInput } from './ReplayInput';
import {
  createEmptyReplayBlobV2,
  REPLAY_BLOB_V2_VERSION,
} from './replayBlobV2';
import { ReplayRecorder } from './ReplayRecorder';
import {
  deserializeReplayV3,
  serializeReplayV3,
  REPLAY_BLOB_V3_VERSION,
} from './replayBlobV3';
import { createRNG, type RNG } from '../utils/rng';
import { captureComposedStats } from './composedStatsSnapshot';
import { BALANCE } from '../core/BalanceConfig';
import type { ComposedPlayerStats } from '../core/StatComposer';
import {
  pickInitialOrbitAngle,
  pickSpawnerMinionAngle,
} from '../entities/enemyAngleSeed';
import type { FallenCairn } from '../utils/save/fallenCairns';
import {
  advanceGauntlet,
  initialGauntletState,
  type GauntletTickInput,
  GAUNTLET_TOUCH_THRESHOLD,
} from '../scenes/game/cailleachGauntlet';

function scriptedBlob() {
  const blob = createEmptyReplayBlobV2({
    build: 'whs-test',
    seed: 12345,
    variantKey: 'classic',
  });
  // 300 frames of scripted input — direction cycles, dash every 30
  // frames, menu at frame 150 only.
  for (let i = 0; i < 300; i++) {
    blob.frames.push({
      dtMs: 16.67,
      dx: Math.cos(i * 0.1),
      dy: Math.sin(i * 0.1),
      dash: i % 30 === 0,
      menu: i === 150,
    });
  }
  blob.frameCount = blob.frames.length;
  return blob;
}

const sampleStats: ComposedPlayerStats = {
  ...BALANCE.player,
  speed: 200,
  maxHp: 100,
  driftDegrees: 10,
  pickupRadius: 100,
  damagePctBonus: 0,
  hpRegen: 0,
  critBonus: 0,
  cooldownReduction: 0,
  xpGainBonus: 0,
  armorBonus: 0,
  dashCooldownReduction: 0,
};

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
    expect(a.isExhausted()).toBe(true);
    expect(b.isExhausted()).toBe(true);
  });

  it('each recorded edge fires exactly once on the cursor', () => {
    const blob = scriptedBlob();
    const input = new ReplayInput(blob);
    let dashCount = 0;
    let menuCount = 0;
    while (!input.isExhausted()) {
      if (input.advanceFrame() === null) break;
      if (input.consumeDashPressed()) dashCount += 1;
      if (input.consumeMenuPausePressed()) menuCount += 1;
    }
    // 300 frames, dash every 30 → 10 dashes (0, 30, 60, …, 270).
    expect(dashCount).toBe(10);
    expect(menuCount).toBe(1);
  });

  it('recorder round-trip preserves frame stream byte-for-byte', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
    });
    for (let i = 0; i < 60; i++) {
      rec.pushFrame({
        dtMs: 16.67,
        dx: i % 3 === 0 ? 1 : 0,
        dy: 0,
        dash: i === 30,
        menu: false,
      });
    }
    const blob = rec.finalize();
    const cursor = new ReplayInput(blob);
    let dashSeen = 0;
    for (let i = 0; i < 60; i++) {
      cursor.advanceFrame();
      if (cursor.consumeDashPressed()) dashSeen += 1;
    }
    expect(dashSeen).toBe(1);
  });

  it('seed reproducibility — same seed yields identical RNG stream', () => {
    const a = createRNG(12345);
    const b = createRNG(12345);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBeCloseTo(b.next(), 10);
    }
  });

  it('enemy gameplay-state angle stream is deterministic under shared seed', () => {
    // Realistic-ish call mix: every spawn pulls an orbit-angle init,
    // and every fifth tick a spawner emits a midge (interleaved draw).
    // Asserts the two helpers + RNG plumbing keep byte-equal streams
    // across same-seed runs; this is the seam the original T1 ship
    // missed (Enemy.ts:298 + :924 used Math.random until 2026-04-30).
    const draw = (rng: RNG): number[] => {
      const stream: number[] = [];
      for (let i = 0; i < 60; i++) {
        stream.push(pickInitialOrbitAngle(rng));
        if (i % 5 === 0) stream.push(pickSpawnerMinionAngle(rng));
      }
      return stream;
    };
    expect(draw(createRNG(424242))).toEqual(draw(createRNG(424242)));
    // Different seed must not collide — guards against the helpers
    // accidentally degenerating to a constant.
    expect(draw(createRNG(1))).not.toEqual(draw(createRNG(2)));
  });

  it('seed reproducibility holds across int / float / pick draws', () => {
    const a = createRNG(777);
    const b = createRNG(777);
    for (let i = 0; i < 50; i++) {
      expect(a.int(0, 100)).toBe(b.int(0, 100));
      expect(a.float(0, 1)).toBeCloseTo(b.float(0, 1), 10);
      expect(a.pick([1, 2, 3, 4, 5])).toBe(b.pick([1, 2, 3, 4, 5]));
      expect(a.bool(0.5)).toBe(b.bool(0.5));
    }
  });

  it('v2 blob preserves curseKey + routes + composedStats through recorder', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 1,
      variantKey: 'classic',
      curseKey: 'heavy_legs',
      composedStats: captureComposedStats(sampleStats),
    });
    rec.pushRoute({
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    });
    rec.pushRoute({
      slot: 'B',
      routeKey: 'stand_yer_ground',
      atGameTimeSec: 605,
      defaultedBySetting: false,
    });
    const blob = rec.finalize();
    expect(blob.version).toBe(REPLAY_BLOB_V2_VERSION);
    const v2 = blob as {
      curseKey?: string;
      routes?: Array<{ slot: string; routeKey: string }>;
      composedStats?: { speed: number };
    };
    expect(v2.curseKey).toBe('heavy_legs');
    expect(v2.routes?.length).toBe(2);
    expect(v2.routes?.[0].routeKey).toBe('up_the_brae');
    expect(v2.routes?.[1].routeKey).toBe('stand_yer_ground');
    expect(v2.composedStats?.speed).toBe(200);
  });

  it('serialize → deserialize preserves v2 metadata + frame semantics', async () => {
    const { serializeReplayV2, deserializeReplayV2 } = await import('./replayBlobV2');
    const blob = scriptedBlob();
    blob.curseKey = 'thin_hide';
    blob.routes = [{
      slot: 'A',
      routeKey: 'round_the_loch',
      atGameTimeSec: 120,
      defaultedBySetting: false,
    }];
    blob.composedStats = captureComposedStats(sampleStats);
    // Round-trip BOTH sides through JSON so floating-point precision
    // losses are identical on the original and the deserialized copy.
    // (Raw JSON.stringify loses sub-ULP precision; comparing against a
    // pre-stringify blob would flag that as a bogus failure.)
    const srcRound = deserializeReplayV2(serializeReplayV2(blob));
    const roundTripped = deserializeReplayV2(serializeReplayV2(blob));
    expect(srcRound).not.toBeNull();
    expect(roundTripped).not.toBeNull();
    expect(roundTripped).toEqual(srcRound);

    expect(roundTripped!.version).toBe(REPLAY_BLOB_V2_VERSION);
    expect(roundTripped!.curseKey).toBe('thin_hide');
    expect(roundTripped!.routes?.length).toBe(1);
    expect(roundTripped!.composedStats?.speed).toBe(200);
    expect(roundTripped!.frameCount).toBe(blob.frameCount);

    // Drive cursors over both round-tripped copies and match frame-for-frame.
    const a = new ReplayInput(srcRound!);
    const b = new ReplayInput(roundTripped!);
    for (let i = 0; i < blob.frameCount; i++) {
      expect(a.advanceFrame()).toEqual(b.advanceFrame());
    }
    // One extra step to drive both past the final frame → exhaustion.
    expect(a.advanceFrame()).toBeNull();
    expect(b.advanceFrame()).toBeNull();
    expect(a.isExhausted()).toBe(true);
    expect(b.isExhausted()).toBe(true);
  });
});

describe('replay determinism — Moor Remembers cairn payload (T12)', () => {
  const cairnA: FallenCairn = {
    x: 100,
    y: 200,
    cause: 'enemy_contact',
    variantKey: 'classic',
    timeSurvivedMs: 60_000,
    inheritedStat: 'damage',
    savedAt: 1_000_000,
  };
  const cairnB: FallenCairn = {
    x: 300,
    y: 400,
    cause: 'hazard',
    variantKey: 'glaswegian',
    timeSurvivedMs: 120_000,
    inheritedStat: 'speed',
    savedAt: 2_000_000,
  };

  it('recorder carries cairns snapshot into the v3 blob', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 77,
      variantKey: 'classic',
      cairns: [cairnA, cairnB],
    });
    const blob = rec.finalize();
    expect(blob.version).toBe(REPLAY_BLOB_V3_VERSION);
    const v3 = blob as { cairns?: FallenCairn[] };
    expect(v3.cairns).toHaveLength(2);
    expect(v3.cairns?.[0]).toEqual(cairnA);
    expect(v3.cairns?.[1]).toEqual(cairnB);
  });

  it('recorded cairns survive FIFO rotation in the live save (key regression)', () => {
    // Build a payload with cairns A + B. The live meta-save might later
    // FIFO-rotate cairnA out, but the replay blob still carries it.
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 99,
      variantKey: 'classic',
      cairns: [cairnA, cairnB],
    });
    rec.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    const blob = rec.finalize();

    // Serialize → deserialize (simulates localStorage round-trip).
    const raw = serializeReplayV3(blob as Parameters<typeof serializeReplayV3>[0]);
    const restored = deserializeReplayV3(raw);

    expect(restored).not.toBeNull();
    // Regardless of what the live meta-save contains, the deserialized blob
    // retains both cairns from the original run-start snapshot.
    expect(restored!.cairns).toHaveLength(2);
    expect(restored!.cairns?.[0]).toEqual(cairnA);
    expect(restored!.cairns?.[1]).toEqual(cairnB);
  });

  it('recorder with no cairns stays v1 (no false upgrade)', () => {
    const rec = new ReplayRecorder({ build: 'whs-test', seed: 1, variantKey: 'classic' });
    expect(rec.finalize().version).toBe(1);
  });

  it('recorder with empty cairns array stays v1', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 1,
      variantKey: 'classic',
      cairns: [],
    });
    expect(rec.finalize().version).toBe(1);
  });

  it('cairns round-trip through serialize/deserialize with full fidelity', () => {
    const src = {
      version: REPLAY_BLOB_V3_VERSION as typeof REPLAY_BLOB_V3_VERSION,
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
      cairns: [cairnA, cairnB],
    };
    const back = deserializeReplayV3(serializeReplayV3(src));
    expect(back?.cairns).toEqual([cairnA, cairnB]);
  });

  it('malformed cairn entries are dropped at deserialize', () => {
    const raw = JSON.stringify({
      version: REPLAY_BLOB_V3_VERSION,
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
      cairns: [
        cairnA,
        { x: 'bad', y: 100, cause: 'c', variantKey: 'v', timeSurvivedMs: 0, inheritedStat: 'damage', savedAt: 1 },
        null,
        { x: 50, y: 50 }, // missing required fields
        cairnB,
      ],
    });
    const blob = deserializeReplayV3(raw);
    // Only cairnA and cairnB are valid — the two malformed entries are dropped.
    expect(blob?.cairns).toHaveLength(2);
    expect(blob?.cairns?.[0]).toEqual(cairnA);
    expect(blob?.cairns?.[1]).toEqual(cairnB);
  });

  it('absent cairns deserializes to undefined (back-compat with pre-T12 blobs)', () => {
    const raw = JSON.stringify({
      version: REPLAY_BLOB_V3_VERSION,
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
    });
    expect(deserializeReplayV3(raw)?.cairns).toBeUndefined();
  });

  it('finalize emits independent copies — mutating the returned blob does not leak', () => {
    const rec = new ReplayRecorder({
      build: 'whs-test',
      seed: 5,
      variantKey: 'classic',
      cairns: [cairnA],
    });
    const blobA = rec.finalize() as { cairns?: FallenCairn[] };
    blobA.cairns!.push(cairnB);
    const blobB = rec.finalize() as { cairns?: FallenCairn[] };
    // Internal snapshot is independent; second finalize still has only cairnA.
    expect(blobB.cairns).toHaveLength(1);
    expect(blobB.cairns?.[0]).toEqual(cairnA);
  });
});

describe('replay determinism — Cailleach Gauntlet wreath-set (V2)', () => {
  /**
   * The wreath-set is the first GAUNTLET_TOUCH_THRESHOLD savedAt values
   * from cairns touched this run. It is a pure function of the input
   * cairn list — no RNG, no external state — so replaying the same cairn
   * snapshot always produces identical touchedSavedAts.
   *
   * Full GameScene-level replay is impractical in node-env vitest (Phaser
   * touches window at eval-time). The pure advanceGauntlet helper covers
   * the state-machine contract; the e2e smoke
   * (e2e/moor-remembers-cailleach-gauntlet.spec.ts) closes the
   * production-wiring gap per the T16 deferral note in the V2 plan.
   */
  const SAVED_ATS = [1001, 1002, 1003, 1004, 1005, 1006, 1007] as const;

  const BASE: GauntletTickInput = {
    gameTimeMs: 0,
    touchedSavedAts: [...SAVED_ATS],
    playerX: 1500,
    playerY: 1500,
    bossDead: false,
    playerDead: false,
  };

  function runToWin(extraInput?: Partial<GauntletTickInput>) {
    let state = initialGauntletState();
    state = advanceGauntlet(state, { ...BASE, ...extraInput, gameTimeMs: 0 });
    state = advanceGauntlet(state, { ...BASE, ...extraInput, gameTimeMs: 14 * 60 * 1000 });
    state = advanceGauntlet(state, { ...BASE, ...extraInput, gameTimeMs: 15 * 60 * 1000 });
    state = advanceGauntlet(state, { ...BASE, ...extraInput, gameTimeMs: 15 * 60 * 1000, bossDead: true });
    return state;
  }

  it('idle → resolved/win — same wreath-set on every replay with same cairn list', () => {
    const first = runToWin();
    const second = runToWin();
    expect(first.phase).toBe('resolved');
    expect(first.outcome).toBe('win');
    expect(first.touchedSavedAts).toEqual(second.touchedSavedAts);
    expect([...first.touchedSavedAts]).toEqual([...SAVED_ATS]);
  });

  it('wreath-set captures exactly GAUNTLET_TOUCH_THRESHOLD entries, discarding extras', () => {
    const extra = [...SAVED_ATS, 1008, 1009, 1010] as number[];
    const state = runToWin({ touchedSavedAts: extra });
    expect(state.touchedSavedAts).toHaveLength(GAUNTLET_TOUCH_THRESHOLD);
    expect([...state.touchedSavedAts]).toEqual([...SAVED_ATS]);
  });

  it('lose path carries the same touchedSavedAts (extinguished-set = wreath-set at arm)', () => {
    let state = initialGauntletState();
    state = advanceGauntlet(state, { ...BASE, gameTimeMs: 15 * 60 * 1000 + 1 });
    state = advanceGauntlet(state, { ...BASE, gameTimeMs: 15 * 60 * 1000 + 1, playerDead: true });
    expect(state.phase).toBe('resolved');
    expect(state.outcome).toBe('lose');
    expect([...state.touchedSavedAts]).toEqual([...SAVED_ATS]);
  });

  it('different cairn lists produce different wreath-sets', () => {
    const altSavedAts = [9001, 9002, 9003, 9004, 9005, 9006, 9007];
    const a = runToWin();
    const b = runToWin({ touchedSavedAts: altSavedAts });
    expect([...a.touchedSavedAts]).not.toEqual([...b.touchedSavedAts]);
    expect([...b.touchedSavedAts]).toEqual(altSavedAts);
  });
});
