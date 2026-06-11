import { describe, expect, it } from 'vitest';
import { ReplayInput } from './ReplayInput';
import { createEmptyReplayBlob, type ReplayBlob, type ReplayFrame } from './replayBlob';
import { createEmptyReplayBlobV3 } from './replayBlobV3';
import type { NodeOutcome } from '../data/nodeTypes';

function blobWith(frames: ReplayFrame[]): ReplayBlob {
  const b = createEmptyReplayBlob({ build: 't', seed: 1, variantKey: 'classic' });
  b.frames = frames;
  b.frameCount = frames.length;
  return b;
}

const F = (overrides: Partial<ReplayFrame> = {}): ReplayFrame => ({
  dtMs: 16,
  dx: 0,
  dy: 0,
  dash: false,
  menu: false,
  ...overrides,
});

describe('ReplayInput', () => {
  describe('cursor + exhaustion', () => {
    it('starts at index -1 (pre-first-advance) and exhausts after last frame', () => {
      const r = new ReplayInput(blobWith([F(), F(), F()]));
      expect(r.getFrameIndex()).toBe(-1);
      expect(r.isExhausted()).toBe(false);

      expect(r.advanceFrame()).not.toBeNull();
      expect(r.getFrameIndex()).toBe(0);
      expect(r.advanceFrame()).not.toBeNull();
      expect(r.advanceFrame()).not.toBeNull();
      expect(r.getFrameIndex()).toBe(2);

      // One more advance drives past the end.
      expect(r.advanceFrame()).toBeNull();
      expect(r.isExhausted()).toBe(true);
      // Calling again after exhaustion stays exhausted and returns null.
      expect(r.advanceFrame()).toBeNull();
    });

    it('empty blob is exhausted immediately', () => {
      const r = new ReplayInput(blobWith([]));
      expect(r.isExhausted()).toBe(false);
      expect(r.advanceFrame()).toBeNull();
      expect(r.isExhausted()).toBe(true);
    });
  });

  describe('input shape parity with InputManager', () => {
    it('getDirection returns the current frame direction', () => {
      const r = new ReplayInput(blobWith([
        F({ dx: 1, dy: 0 }),
        F({ dx: 0, dy: -1 }),
      ]));
      r.advanceFrame();
      expect(r.getDirection()).toEqual({ x: 1, y: 0 });
      r.advanceFrame();
      expect(r.getDirection()).toEqual({ x: 0, y: -1 });
    });

    it('consumeDashPressed fires exactly once per recorded dash frame', () => {
      const r = new ReplayInput(blobWith([
        F({ dash: true }),
        F({ dash: true }),
      ]));
      r.advanceFrame();
      expect(r.consumeDashPressed()).toBe(true);
      // Second poll within the same frame stays false.
      expect(r.consumeDashPressed()).toBe(false);

      // Next frame's dash must fire again.
      r.advanceFrame();
      expect(r.consumeDashPressed()).toBe(true);
      expect(r.consumeDashPressed()).toBe(false);
    });

    it('consumeMenuPausePressed behaves like dash — one fire per edge', () => {
      const r = new ReplayInput(blobWith([
        F(),
        F({ menu: true }),
        F(),
      ]));

      r.advanceFrame();
      expect(r.consumeMenuPausePressed()).toBe(false);

      r.advanceFrame();
      expect(r.consumeMenuPausePressed()).toBe(true);
      expect(r.consumeMenuPausePressed()).toBe(false);

      r.advanceFrame();
      expect(r.consumeMenuPausePressed()).toBe(false);
    });

    it('getDirection returns {0,0} before first advance and after exhaust', () => {
      const r = new ReplayInput(blobWith([F({ dx: 1, dy: 1 })]));
      expect(r.getDirection()).toEqual({ x: 0, y: 0 });
      r.advanceFrame();
      expect(r.getDirection()).toEqual({ x: 1, y: 1 });
      r.advanceFrame();
      expect(r.getDirection()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('replay of a 3-frame script reproduces the recorded edges', () => {
    it('captures dash at frame 0, menu at frame 2', () => {
      const script = [
        F({ dx: 1, dy: 0, dash: true }),
        F({ dx: 1, dy: 0 }),
        F({ dx: 0, dy: 0, menu: true }),
      ];
      const r = new ReplayInput(blobWith(script));
      const observed: string[] = [];

      while (!r.isExhausted()) {
        const frame = r.advanceFrame();
        if (frame === null) break;
        if (r.consumeDashPressed()) observed.push('dash');
        if (r.consumeMenuPausePressed()) observed.push('menu');
      }

      expect(observed).toEqual(['dash', 'menu']);
      expect(r.getFrameCount()).toBe(3);
    });
  });

  describe('getCurrentDeltaMs exposes the recorded delta', () => {
    it('returns per-frame dtMs so a playback driver can step the clock', () => {
      const r = new ReplayInput(blobWith([F({ dtMs: 16 }), F({ dtMs: 33 })]));
      r.advanceFrame();
      expect(r.getCurrentDeltaMs()).toBe(16);
      r.advanceFrame();
      expect(r.getCurrentDeltaMs()).toBe(33);
    });
  });

  describe('M1 F5 — nodeOutcome cursor', () => {
    const baseMeta = () => ({ build: 't', seed: 1, variantKey: 'classic' });

    it('peeks null when the blob carries no nodeOutcomes (v1/v2)', () => {
      const r = new ReplayInput(blobWith([F()]));
      expect(r.peekNextNodeOutcome()).toBeNull();
      expect(r.consumeNodeOutcome()).toBeNull();
      expect(r.getRemainingNodeOutcomeCount()).toBe(0);
    });

    it('peeks + consumes outcomes in order (v3 blob)', () => {
      const outcomes: NodeOutcome[] = [
        { nodeKey: 'shrine_standing_stone', chosenRewardKey: 'buff_damage', visitedAtGameTimeSec: 42 },
        { nodeKey: 'a1_thistle_ambush', visitedAtGameTimeSec: 110 },
        { nodeKey: 'bargain_wee_folk', chosenRewardKey: 'refused', visitedAtGameTimeSec: 205 },
      ];
      const blob = createEmptyReplayBlobV3({ ...baseMeta(), nodeOutcomes: outcomes });
      const r = new ReplayInput(blob);

      expect(r.getRemainingNodeOutcomeCount()).toBe(3);
      expect(r.peekNextNodeOutcome()).toEqual(outcomes[0]);
      // Peeking is non-destructive.
      expect(r.peekNextNodeOutcome()).toEqual(outcomes[0]);
      expect(r.getRemainingNodeOutcomeCount()).toBe(3);

      expect(r.consumeNodeOutcome()).toEqual(outcomes[0]);
      expect(r.getRemainingNodeOutcomeCount()).toBe(2);
      expect(r.consumeNodeOutcome()).toEqual(outcomes[1]);
      expect(r.consumeNodeOutcome()).toEqual(outcomes[2]);
      expect(r.consumeNodeOutcome()).toBeNull();
      expect(r.peekNextNodeOutcome()).toBeNull();
      expect(r.getRemainingNodeOutcomeCount()).toBe(0);
    });

    it('cursor is independent of the frame cursor', () => {
      const outcomes: NodeOutcome[] = [
        { nodeKey: 'x', chosenRewardKey: 'k', visitedAtGameTimeSec: 0 },
      ];
      const blob = createEmptyReplayBlobV3({ ...baseMeta(), nodeOutcomes: outcomes });
      blob.frames = [F(), F()];
      blob.frameCount = 2;
      const r = new ReplayInput(blob);

      // Advancing frames must not touch the outcome cursor.
      r.advanceFrame();
      r.advanceFrame();
      expect(r.peekNextNodeOutcome()).toEqual(outcomes[0]);
    });
  });
});
