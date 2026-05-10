import { describe, expect, it } from 'vitest';
import {
  createEmptyReplayBlobV3,
  deserializeReplayV3,
  isReplayBlobV3,
  REPLAY_BLOB_V3_VERSION,
  serializeReplayV3,
} from './replayBlobV3';
import { isReplayBlobAny } from './replayBlob';
import { REPLAY_BLOB_V2_VERSION } from './replayBlobV2';
import type { NodeOutcome } from '../data/nodeTypes';

function baseMeta() {
  return { build: 'test-build', seed: 42, variantKey: 'classic' };
}

describe('replayBlobV3', () => {
  it('createEmptyReplayBlobV3 stamps version 3 + carries metadata', () => {
    const blob = createEmptyReplayBlobV3({
      ...baseMeta(),
      nodeOutcomes: [{ nodeKey: 'a1_rest_bothy', visitedAtGameTimeSec: 100 }],
    });
    expect(blob.version).toBe(REPLAY_BLOB_V3_VERSION);
    expect(blob.seed).toBe(42);
    expect(blob.nodeOutcomes).toHaveLength(1);
    expect(blob.frameCount).toBe(0);
  });

  it('serialize + deserialize round-trips nodeOutcomes', () => {
    const outcomes: NodeOutcome[] = [
      { nodeKey: 'a1_thistle_ambush', visitedAtGameTimeSec: 60 },
      { nodeKey: 'a2_shrine_fairy_ring', chosenRewardKey: 'buff_luck', visitedAtGameTimeSec: 420 },
    ];
    const src = createEmptyReplayBlobV3({ ...baseMeta(), nodeOutcomes: outcomes });
    const raw = serializeReplayV3(src);
    const back = deserializeReplayV3(raw);
    expect(back?.nodeOutcomes).toEqual(outcomes);
  });

  it('drops malformed nodeOutcomes during deserialization', () => {
    const raw = JSON.stringify({
      version: REPLAY_BLOB_V3_VERSION,
      ...baseMeta(),
      frameCount: 0,
      frames: [],
      nodeOutcomes: [
        { nodeKey: 'valid', visitedAtGameTimeSec: 1 },
        { nodeKey: '', visitedAtGameTimeSec: 2 },
        { visitedAtGameTimeSec: 3 },
        null,
        { nodeKey: 'no_time' },
      ],
    });
    const blob = deserializeReplayV3(raw);
    expect(blob?.nodeOutcomes).toEqual([
      { nodeKey: 'valid', visitedAtGameTimeSec: 1 },
      { nodeKey: 'no_time', visitedAtGameTimeSec: 0 },
    ]);
  });

  it('isReplayBlobV3 rejects v1 / v2 blobs', () => {
    const v2 = { version: REPLAY_BLOB_V2_VERSION, build: 'b', seed: 1, variantKey: 'classic', frameCount: 0, frames: [] };
    expect(isReplayBlobV3(v2)).toBe(false);
  });

  it('ReplayBlobAny accepts v1 / v2 / v3', () => {
    const v1 = { version: 1, build: 'b', seed: 1, variantKey: 'classic', frameCount: 0, frames: [] };
    const v2 = { version: REPLAY_BLOB_V2_VERSION, build: 'b', seed: 1, variantKey: 'classic', frameCount: 0, frames: [] };
    const v3 = createEmptyReplayBlobV3(baseMeta());
    expect(isReplayBlobAny(v1)).toBe(true);
    expect(isReplayBlobAny(v2)).toBe(true);
    expect(isReplayBlobAny(v3)).toBe(true);
  });

  it('rejects non-v3 version numbers', () => {
    const raw = JSON.stringify({
      version: 99,
      ...baseMeta(),
      frameCount: 0,
      frames: [],
    });
    expect(deserializeReplayV3(raw)).toBeNull();
  });

  describe('S1 Phase 2 — sporranPicks', () => {
    it('createEmptyReplayBlobV3 carries sporranPicks meta through', () => {
      const blob = createEmptyReplayBlobV3({
        ...baseMeta(),
        sporranPicks: ['boon_silver', 'curse_heavy_legs', 'quirk_haggis_blooded'],
      });
      expect(blob.sporranPicks).toEqual([
        'boon_silver',
        'curse_heavy_legs',
        'quirk_haggis_blooded',
      ]);
    });

    it('deserialize round-trips known sporranPicks', () => {
      const src = createEmptyReplayBlobV3({
        ...baseMeta(),
        sporranPicks: ['boon_coal', 'boon_whisky', 'curse_thin_hide'],
      });
      const back = deserializeReplayV3(serializeReplayV3(src));
      expect(back?.sporranPicks).toEqual(['boon_coal', 'boon_whisky', 'curse_thin_hide']);
    });

    it('drops unknown / malformed sporranPicks at deserialize', () => {
      const raw = JSON.stringify({
        version: REPLAY_BLOB_V3_VERSION,
        ...baseMeta(),
        frameCount: 0,
        frames: [],
        sporranPicks: ['boon_silver', '', null, 42, 'not_a_card', 'curse_heavy_legs'],
      });
      const blob = deserializeReplayV3(raw);
      expect(blob?.sporranPicks).toEqual(['boon_silver', 'curse_heavy_legs']);
    });

    it('omits sporranPicks when all entries are stale', () => {
      const raw = JSON.stringify({
        version: REPLAY_BLOB_V3_VERSION,
        ...baseMeta(),
        frameCount: 0,
        frames: [],
        sporranPicks: ['nope_a', 'nope_b'],
      });
      expect(deserializeReplayV3(raw)?.sporranPicks).toBeUndefined();
    });

    it('absent sporranPicks deserializes to undefined (back-compat)', () => {
      const raw = JSON.stringify({
        version: REPLAY_BLOB_V3_VERSION,
        ...baseMeta(),
        frameCount: 0,
        frames: [],
      });
      expect(deserializeReplayV3(raw)?.sporranPicks).toBeUndefined();
    });
  });
});
