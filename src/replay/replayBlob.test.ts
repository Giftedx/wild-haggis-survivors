import { describe, expect, it } from 'vitest';
import {
  REPLAY_BLOB_VERSION,
  clampReplayFrame,
  createEmptyReplayBlob,
  deserializeReplay,
  isReplayBlob,
  serializeReplay,
} from './replayBlob';

const META = {
  build: 'wh-haggis-0.1.0-dev',
  seed: 1234,
  variantKey: 'classic',
};

describe('replayBlob', () => {
  describe('createEmptyReplayBlob', () => {
    it('returns a well-formed empty blob', () => {
      const blob = createEmptyReplayBlob(META);
      expect(blob.version).toBe(REPLAY_BLOB_VERSION);
      expect(blob.build).toBe(META.build);
      expect(blob.seed).toBe(META.seed);
      expect(blob.variantKey).toBe(META.variantKey);
      expect(blob.frameCount).toBe(0);
      expect(blob.frames).toEqual([]);
    });
  });

  describe('clampReplayFrame', () => {
    it('clamps dtMs into [0, 100]', () => {
      expect(clampReplayFrame({ dtMs: -5, dx: 0, dy: 0, dash: false, menu: false }).dtMs).toBe(0);
      expect(clampReplayFrame({ dtMs: 250, dx: 0, dy: 0, dash: false, menu: false }).dtMs).toBe(100);
      expect(clampReplayFrame({ dtMs: 16.67, dx: 0, dy: 0, dash: false, menu: false }).dtMs).toBeCloseTo(16.67);
    });

    it('clamps direction into unit disc', () => {
      const out = clampReplayFrame({ dtMs: 16, dx: 2, dy: 2, dash: false, menu: false });
      const len = Math.hypot(out.dx, out.dy);
      expect(len).toBeLessThanOrEqual(1 + 1e-6);
    });

    it('coerces non-boolean edge flags', () => {
      const f = clampReplayFrame({
        dtMs: 16,
        dx: 0,
        dy: 0,
        dash: 1 as unknown as boolean,
        menu: undefined as unknown as boolean,
      });
      expect(f.dash).toBe(true);
      expect(f.menu).toBe(false);
    });
  });

  describe('serialize / deserialize round-trip', () => {
    it('empty blob round-trips', () => {
      const blob = createEmptyReplayBlob(META);
      const parsed = deserializeReplay(serializeReplay(blob));
      expect(parsed).toEqual(blob);
    });

    it('blob with three frames round-trips', () => {
      const blob = createEmptyReplayBlob(META);
      blob.frames.push(
        clampReplayFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false }),
        clampReplayFrame({ dtMs: 16, dx: 0, dy: 0, dash: true, menu: false }),
        clampReplayFrame({ dtMs: 32, dx: -0.5, dy: 0.5, dash: false, menu: true }),
      );
      blob.frameCount = blob.frames.length;

      const parsed = deserializeReplay(serializeReplay(blob));
      expect(parsed).not.toBeNull();
      expect(parsed!.frameCount).toBe(3);
      expect(parsed!.frames).toHaveLength(3);
      expect(parsed!.frames[1].dash).toBe(true);
      expect(parsed!.frames[2].menu).toBe(true);
    });

    it('deserializeReplay returns null for non-JSON', () => {
      expect(deserializeReplay('nope')).toBeNull();
    });

    it('deserializeReplay returns null for wrong version', () => {
      const bad = JSON.stringify({ ...createEmptyReplayBlob(META), version: 999 });
      expect(deserializeReplay(bad)).toBeNull();
    });

    it('deserializeReplay returns null for missing seed', () => {
      const raw: Record<string, unknown> = { ...createEmptyReplayBlob(META) };
      delete raw.seed;
      expect(deserializeReplay(JSON.stringify(raw))).toBeNull();
    });

    it('deserializeReplay drops malformed frames without nulling the whole blob', () => {
      const blob = createEmptyReplayBlob(META);
      const raw = {
        ...blob,
        frames: [
          { dtMs: 16, dx: 0, dy: 0, dash: false, menu: false },
          { dtMs: 'nope', dx: 0, dy: 0, dash: false, menu: false },
          null,
          { dtMs: 16, dx: 0, dy: 0, dash: true, menu: false },
        ],
        frameCount: 4,
      };
      const parsed = deserializeReplay(JSON.stringify(raw));
      expect(parsed).not.toBeNull();
      expect(parsed!.frames).toHaveLength(2);
      expect(parsed!.frameCount).toBe(2);
    });
  });

  describe('isReplayBlob', () => {
    it('accepts well-formed blob', () => {
      expect(isReplayBlob(createEmptyReplayBlob(META))).toBe(true);
    });
    it('rejects plain objects', () => {
      expect(isReplayBlob({})).toBe(false);
      expect(isReplayBlob(null)).toBe(false);
      expect(isReplayBlob('string')).toBe(false);
    });
  });
});
