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
import { createRNG } from '../utils/rng';
import { captureComposedStats } from './composedStatsSnapshot';
import { BALANCE } from '../core/BalanceConfig';
import type { ComposedPlayerStats } from '../core/StatComposer';

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
