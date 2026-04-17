import { describe, expect, it } from 'vitest';
import { parseGameSceneInitData } from './gameSceneInitData';
import {
  REPLAY_BLOB_VERSION,
  type ReplayBlob,
} from '../replay/replayBlob';

const validReplay: ReplayBlob = {
  version: REPLAY_BLOB_VERSION,
  build: 'test',
  seed: 0xABCDEF,
  variantKey: 'moor_runner',
  frameCount: 0,
  frames: [],
};

describe('parseGameSceneInitData', () => {
  describe('empty / absent payload', () => {
    it('no data → every field null/false', () => {
      expect(parseGameSceneInitData()).toEqual({
        pendingRunSeed: null,
        runIsDaily: false,
        pendingForceVariantKey: null,
        pendingReplay: null,
      });
    });

    it('empty object → same default shape', () => {
      expect(parseGameSceneInitData({})).toEqual({
        pendingRunSeed: null,
        runIsDaily: false,
        pendingForceVariantKey: null,
        pendingReplay: null,
      });
    });
  });

  describe('seed + variant + daily flag', () => {
    it('captures numeric seed', () => {
      expect(parseGameSceneInitData({ seed: 999 }).pendingRunSeed).toBe(999);
    });

    it('ignores non-numeric seed', () => {
      expect(
        parseGameSceneInitData({ seed: null }).pendingRunSeed,
      ).toBeNull();
    });

    it('captures forceVariantKey', () => {
      expect(
        parseGameSceneInitData({ forceVariantKey: 'moor_runner' }).pendingForceVariantKey,
      ).toBe('moor_runner');
    });

    it('coerces truthy / falsy isDaily', () => {
      expect(parseGameSceneInitData({ isDaily: true }).runIsDaily).toBe(true);
      expect(parseGameSceneInitData({ isDaily: false }).runIsDaily).toBe(false);
    });
  });

  describe('replay blob precedence', () => {
    it('valid replay overrides seed + variant + forces daily off', () => {
      const resolved = parseGameSceneInitData({
        seed: 1,
        forceVariantKey: 'classic',
        isDaily: true,
        replay: validReplay,
      });
      expect(resolved.pendingReplay).toBe(validReplay);
      expect(resolved.pendingRunSeed).toBe(validReplay.seed);
      expect(resolved.pendingForceVariantKey).toBe(validReplay.variantKey);
      expect(resolved.runIsDaily).toBe(false);
    });

    it('malformed replay is dropped; other fields stand', () => {
      const resolved = parseGameSceneInitData({
        seed: 42,
        forceVariantKey: 'iron_belly',
        isDaily: false,
        // @ts-expect-error — deliberately malformed
        replay: { version: 99, build: 'x' },
      });
      expect(resolved.pendingReplay).toBeNull();
      expect(resolved.pendingRunSeed).toBe(42);
      expect(resolved.pendingForceVariantKey).toBe('iron_belly');
      expect(resolved.runIsDaily).toBe(false);
    });

    it('replay with different seed than caller passed — blob wins', () => {
      const resolved = parseGameSceneInitData({
        seed: 111,
        replay: { ...validReplay, seed: 222 },
      });
      expect(resolved.pendingRunSeed).toBe(222);
    });
  });
});
