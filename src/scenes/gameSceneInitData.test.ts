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
        pendingCurseKey: null,
        pendingSporranIds: null,
      });
    });

    it('empty object → same default shape', () => {
      expect(parseGameSceneInitData({})).toEqual({
        pendingRunSeed: null,
        runIsDaily: false,
        pendingForceVariantKey: null,
        pendingReplay: null,
        pendingCurseKey: null,
        pendingSporranIds: null,
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

  describe('curseKey (T303)', () => {
    it('captures string curseKey from caller payload', () => {
      expect(
        parseGameSceneInitData({ curseKey: 'heavy_legs' }).pendingCurseKey,
      ).toBe('heavy_legs');
    });

    it('null / undefined / empty curseKey resolves to null', () => {
      expect(parseGameSceneInitData({}).pendingCurseKey).toBeNull();
      expect(parseGameSceneInitData({ curseKey: null }).pendingCurseKey).toBeNull();
      expect(parseGameSceneInitData({ curseKey: '' }).pendingCurseKey).toBeNull();
    });

    it('replay blob with curseKey overrides caller-passed curseKey', () => {
      const resolved = parseGameSceneInitData({
        curseKey: 'thin_hide',
        replay: { ...validReplay, curseKey: 'heavy_legs' } as typeof validReplay & { curseKey: string },
      });
      expect(resolved.pendingCurseKey).toBe('heavy_legs');
    });

    it('replay blob without curseKey clears caller-passed curseKey', () => {
      const resolved = parseGameSceneInitData({
        curseKey: 'thin_hide',
        replay: validReplay,
      });
      expect(resolved.pendingCurseKey).toBeNull();
    });
  });

  describe('pickedSporranIds (S1 Phase 1)', () => {
    it('captures string array', () => {
      expect(
        parseGameSceneInitData({
          pickedSporranIds: ['boon_silver', 'boon_coal', 'curse_heavy_legs'],
        }).pendingSporranIds,
      ).toEqual(['boon_silver', 'boon_coal', 'curse_heavy_legs']);
    });

    it('null / undefined / empty → null', () => {
      expect(parseGameSceneInitData({}).pendingSporranIds).toBeNull();
      expect(
        parseGameSceneInitData({ pickedSporranIds: null }).pendingSporranIds,
      ).toBeNull();
      expect(
        parseGameSceneInitData({ pickedSporranIds: [] }).pendingSporranIds,
      ).toBeNull();
    });

    it('drops non-string / empty-string entries', () => {
      const resolved = parseGameSceneInitData({
        // @ts-expect-error — deliberately mixed
        pickedSporranIds: ['boon_silver', '', null, 42, 'boon_coal'],
      });
      expect(resolved.pendingSporranIds).toEqual(['boon_silver', 'boon_coal']);
    });

    it('all-bad list resolves to null (not an empty array)', () => {
      const resolved = parseGameSceneInitData({
        // @ts-expect-error — deliberately bad
        pickedSporranIds: [null, 0, ''],
      });
      expect(resolved.pendingSporranIds).toBeNull();
    });
  });
});
