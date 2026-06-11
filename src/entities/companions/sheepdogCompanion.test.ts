import { describe, it, expect } from 'vitest';
import { stepFollow, tailPosition, type SheepdogState } from './sheepdogCompanion';
import { COMPANION_DEFS, MAX_COMPANIONS_PER_RUN } from './companionTypes';

const DEF = COMPANION_DEFS.sheepdog;

describe('sheepdogCompanion.tailPosition', () => {
  it('places the dog directly behind a moving player', () => {
    const tail = tailPosition({ x: 100, y: 100, vx: 50, vy: 0 }, DEF);
    expect(tail.x).toBeCloseTo(100 - DEF.followDistance);
    expect(tail.y).toBeCloseTo(100);
  });

  it('uses the +X tail when the player is stationary', () => {
    const tail = tailPosition({ x: 100, y: 100, vx: 0, vy: 0 }, DEF);
    expect(tail.x).toBeCloseTo(100 - DEF.followDistance);
    expect(tail.y).toBeCloseTo(100);
  });
});

describe('sheepdogCompanion.stepFollow', () => {
  function freshState(x: number, y: number): SheepdogState {
    return { x, y, animPhaseSec: 0 };
  }

  it('walks toward the tail position on each frame', () => {
    const state = freshState(80, 100);
    const player = { x: 200, y: 100, vx: 100, vy: 0 };
    const after = stepFollow(state, player, DEF, 1 / 60);
    expect(after.snapped).toBe(false);
    expect(after.x).toBeGreaterThan(state.x);
    expect(after.x).toBeLessThan(player.x - DEF.followDistance + 1);
  });

  it('clamps per-frame motion to maxSpeed * dt while inside tether', () => {
    // Player 80 px away, dog idle — well within tether so the cap path
    // is the one we're testing. Spring step ≈ 8 px, max budget at
    // 60 fps ≈ 3.67 px, so the clamp must engage.
    const state = freshState(0, 0);
    const player = { x: 80 + DEF.followDistance, y: 0, vx: 100, vy: 0 };
    const after = stepFollow(state, player, DEF, 1 / 60);
    expect(after.snapped).toBe(false);
    const moved = Math.hypot(after.x - state.x, after.y - state.y);
    const budget = DEF.maxSpeed / 60;
    expect(moved).toBeLessThanOrEqual(budget + 0.001);
  });

  it('tether-snaps when the companion strays beyond tetherDistance', () => {
    const state = freshState(0, 0);
    const player = {
      x: DEF.tetherDistance + 200,
      y: 0,
      vx: 0,
      vy: 0,
    };
    const after = stepFollow(state, player, DEF, 1 / 60);
    expect(after.snapped).toBe(true);
    expect(after.x).toBeCloseTo(player.x - DEF.followDistance);
    expect(after.y).toBeCloseTo(player.y);
  });

  it('settles near the tail when the player is still and time elapses', () => {
    const state = freshState(60, 100);
    const player = { x: 100, y: 100, vx: 0, vy: 0 };
    let s = { ...state };
    for (let i = 0; i < 240; i++) {
      const r = stepFollow(s, player, DEF, 1 / 60);
      s = { x: r.x, y: r.y, animPhaseSec: s.animPhaseSec + 1 / 60 };
    }
    expect(s.x).toBeCloseTo(100 - DEF.followDistance, 0);
    expect(s.y).toBeCloseTo(100, 0);
  });

  it('alternates the idle frame index over its period', () => {
    const state = freshState(0, 0);
    const player = { x: 0, y: 0, vx: 0, vy: 0 };
    const a = stepFollow(state, player, DEF, 0);
    expect(a.frameIndex).toBe(0);
    const b = stepFollow(
      { ...state, animPhaseSec: DEF.idleFrameSec + 0.01 },
      player,
      DEF,
      0,
    );
    expect(b.frameIndex).toBe(1);
  });
});

describe('companionTypes', () => {
  it('caps the run at one simultaneous companion (first slice rule)', () => {
    expect(MAX_COMPANIONS_PER_RUN).toBe(1);
  });

  it('declares a sheepdog def matching the standing-collie texture', () => {
    expect(COMPANION_DEFS.sheepdog.textureKeys).toEqual([
      'croft_sheepdog_stand_f0',
      'croft_sheepdog_stand_f1',
    ]);
  });
});
