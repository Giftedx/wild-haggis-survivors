import { describe, it, expect } from 'vitest';
import {
  REPLAY_BLOB_V2_VERSION,
  createEmptyReplayBlobV2,
  serializeReplayV2,
  deserializeReplayV2,
  isReplayBlobV2,
  type ReplayBlobV2,
} from './replayBlobV2';
import { BALANCE } from '../core/BalanceConfig';
import { captureComposedStats } from './composedStatsSnapshot';
import type { ComposedPlayerStats } from '../core/StatComposer';

const baseMeta = { build: 'whs-test', seed: 42, variantKey: 'classic' };

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

describe('replayBlobV2', () => {
  it('createEmptyReplayBlobV2 sets version 2 and no optional metadata', () => {
    const b = createEmptyReplayBlobV2(baseMeta);
    expect(b.version).toBe(REPLAY_BLOB_V2_VERSION);
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
      routes: [
        {
          slot: 'A',
          routeKey: 'up_the_brae',
          atGameTimeSec: 180,
          defaultedBySetting: false,
        },
      ],
      composedStats: captureComposedStats(sampleStats),
    };
    const round = deserializeReplayV2(serializeReplayV2(blob));
    expect(round).not.toBeNull();
    expect(round).toEqual(blob);
  });

  it('round-trips empty-optional blob as v1-shaped payload', () => {
    const blob = createEmptyReplayBlobV2(baseMeta);
    blob.frames.push({ dtMs: 16.67, dx: 0, dy: 0, dash: false, menu: false });
    blob.frameCount = 1;
    const round = deserializeReplayV2(serializeReplayV2(blob));
    expect(round?.version).toBe(REPLAY_BLOB_V2_VERSION);
    expect(round?.curseKey).toBeUndefined();
    expect(round?.routes).toBeUndefined();
    expect(round?.composedStats).toBeUndefined();
  });

  it('deserializeReplayV2 returns null for v1 payload', () => {
    const v1 = JSON.stringify({
      version: 1,
      build: 'x',
      seed: 1,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
    });
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
      curseKey: 123, // invalid type — dropped
      routes: 'not-array', // invalid type — dropped
      composedStats: { speed: 'nope' }, // invalid — dropped
    });
    const round = deserializeReplayV2(raw);
    expect(round).not.toBeNull();
    expect(round!.curseKey).toBeUndefined();
    expect(round!.routes).toBeUndefined();
    expect(round!.composedStats).toBeUndefined();
  });

  it('deserializeReplayV2 drops route entries with bogus slot / routeKey', () => {
    const raw = JSON.stringify({
      version: 2,
      build: 'x',
      seed: 1,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
      routes: [
        { slot: 'Z', routeKey: 'up_the_brae', atGameTimeSec: 0, defaultedBySetting: false }, // bad slot
        { slot: 'A', routeKey: 'not-a-route', atGameTimeSec: 0, defaultedBySetting: false }, // bad key
        { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 100, defaultedBySetting: true }, // valid
      ],
    });
    const round = deserializeReplayV2(raw);
    expect(round).not.toBeNull();
    expect(round!.routes?.length).toBe(1);
    expect(round!.routes?.[0].routeKey).toBe('up_the_brae');
  });

  it('isReplayBlobV2 accepts v2, rejects v1, null, primitives', () => {
    const v2 = createEmptyReplayBlobV2(baseMeta);
    const v1 = {
      version: 1,
      build: 'x',
      seed: 1,
      variantKey: 'classic',
      frameCount: 0,
      frames: [],
    };
    expect(isReplayBlobV2(v2)).toBe(true);
    expect(isReplayBlobV2(v1)).toBe(false);
    expect(isReplayBlobV2(null)).toBe(false);
    expect(isReplayBlobV2('string')).toBe(false);
    expect(isReplayBlobV2(42)).toBe(false);
  });
});
