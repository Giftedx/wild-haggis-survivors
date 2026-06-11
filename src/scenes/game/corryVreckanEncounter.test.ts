import { describe, expect, it } from 'vitest';
import {
  advanceCorryVreckan,
  computeWhirlpoolPull,
  initialCorryVreckanState,
  CORRYVRECKAN_ACTIVE_DURATION_SEC,
  CORRYVRECKAN_INNER_RADIUS,
  CORRYVRECKAN_OUTER_RADIUS,
  CORRYVRECKAN_PULL_BASE,
  CORRYVRECKAN_TANGENTIAL_RATIO,
  CORRYVRECKAN_TRIGGER_SEC,
  CORRYVRECKAN_WARN_DURATION_SEC,
  CORRYVRECKAN_WARN_PULL_MUL,
} from './corryVreckanEncounter';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: {
  gameTimeSec?: number;
  currentBiomeId?: string | null;
  playerX?: number;
  playerY?: number;
  spawnX?: number;
  spawnY?: number;
  isPlayerDead?: boolean;
  isVictoryPending?: boolean;
}) {
  return {
    gameTimeSec: overrides.gameTimeSec ?? 0,
    currentBiomeId: overrides.currentBiomeId ?? null,
    playerX: overrides.playerX ?? 500,
    playerY: overrides.playerY ?? 500,
    spawnX: overrides.spawnX ?? 800,
    spawnY: overrides.spawnY ?? 300,
    isPlayerDead: overrides.isPlayerDead ?? false,
    isVictoryPending: overrides.isVictoryPending ?? false,
  };
}

// ── advanceCorryVreckan ──────────────────────────────────────────────────────

describe('advanceCorryVreckan', () => {
  it('stays idle when biome is not corryvreckan', () => {
    const s = initialCorryVreckanState();
    const next = advanceCorryVreckan(s, makeInput({ gameTimeSec: 200, currentBiomeId: 'bog' }));
    expect(next.phase).toBe('idle');
  });

  it('stays idle when biome matches but time < trigger', () => {
    const s = initialCorryVreckanState();
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC - 1, currentBiomeId: 'corryvreckan' }),
    );
    expect(next.phase).toBe('idle');
  });

  it('transitions idle → warning when biome + time conditions met', () => {
    const s = initialCorryVreckanState();
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }),
    );
    expect(next.phase).toBe('warning');
    expect(next.wx).toBe(800);
    expect(next.wy).toBe(300);
    expect(next.phaseStartSec).toBe(CORRYVRECKAN_TRIGGER_SEC);
  });

  it('does not retrigger if already past idle', () => {
    const warning = advanceCorryVreckan(
      initialCorryVreckanState(),
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan' }),
    );
    // Same tick — should still be warning, not a second warning spawn.
    const again = advanceCorryVreckan(
      warning,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + 1, currentBiomeId: 'corryvreckan' }),
    );
    expect(again.phase).toBe('warning');
  });

  it('stays in warning before WARN_DURATION_SEC elapses', () => {
    const warning = advanceCorryVreckan(
      initialCorryVreckanState(),
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan' }),
    );
    const next = advanceCorryVreckan(
      warning,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC - 1 }),
    );
    expect(next.phase).toBe('warning');
  });

  it('transitions warning → active after WARN_DURATION_SEC', () => {
    const warning = advanceCorryVreckan(
      initialCorryVreckanState(),
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan' }),
    );
    const next = advanceCorryVreckan(
      warning,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }),
    );
    expect(next.phase).toBe('active');
    expect(next.phaseStartSec).toBe(CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC);
  });

  it('transitions active → survived after ACTIVE_DURATION_SEC outside inner radius', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }));
    const activeStartSec = s.phaseStartSec;
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: activeStartSec + CORRYVRECKAN_ACTIVE_DURATION_SEC, playerX: 500, playerY: 500 }),
    );
    expect(next.phase).toBe('survived');
  });

  it('transitions active → failed when player enters inner radius', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }));
    // Place player at wx+20, wy — inside CORRYVRECKAN_INNER_RADIUS (55).
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: s.phaseStartSec + 5, playerX: 800 + 20, playerY: 300 }),
    );
    expect(next.phase).toBe('failed');
  });

  it('stays active when player is exactly at inner radius boundary', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }));
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: s.phaseStartSec + 5, playerX: 800 + CORRYVRECKAN_INNER_RADIUS, playerY: 300 }),
    );
    expect(next.phase).toBe('active');
  });

  it('survived is terminal — no further transition', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }));
    const activeStart = s.phaseStartSec;
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: activeStart + CORRYVRECKAN_ACTIVE_DURATION_SEC, playerX: 500 }));
    expect(s.phase).toBe('survived');
    const again = advanceCorryVreckan(s, makeInput({ gameTimeSec: activeStart + CORRYVRECKAN_ACTIVE_DURATION_SEC + 10, currentBiomeId: 'corryvreckan' }));
    expect(again).toBe(s); // same reference — no mutation
  });

  it('failed is terminal — no further transition', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC }));
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: s.phaseStartSec + 5, playerX: 820, playerY: 300 }));
    expect(s.phase).toBe('failed');
    const again = advanceCorryVreckan(s, makeInput({ gameTimeSec: s.phaseStartSec + 20, currentBiomeId: 'corryvreckan' }));
    expect(again).toBe(s);
  });

  it('does not trigger while player is dead', () => {
    const s = initialCorryVreckanState();
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: 200, currentBiomeId: 'corryvreckan', isPlayerDead: true }),
    );
    expect(next.phase).toBe('idle');
  });

  it('does not advance while victory is pending', () => {
    let s = initialCorryVreckanState();
    s = advanceCorryVreckan(s, makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC, currentBiomeId: 'corryvreckan', spawnX: 800, spawnY: 300 }));
    expect(s.phase).toBe('warning');
    const next = advanceCorryVreckan(
      s,
      makeInput({ gameTimeSec: CORRYVRECKAN_TRIGGER_SEC + CORRYVRECKAN_WARN_DURATION_SEC, isVictoryPending: true }),
    );
    // Stays in warning — victory blocks advancement.
    expect(next.phase).toBe('warning');
  });

  it('returns the same reference when no state change occurred', () => {
    const s = initialCorryVreckanState();
    const next = advanceCorryVreckan(s, makeInput({ gameTimeSec: 0, currentBiomeId: null }));
    expect(next).toBe(s);
  });
});

// ── computeWhirlpoolPull ─────────────────────────────────────────────────────

describe('computeWhirlpoolPull', () => {
  it('returns zero force outside outer radius', () => {
    const f = computeWhirlpoolPull(0, 0, 500, 0);
    // Player at (0,0), whirlpool at (500,0) → 500 px distance > 360 outer radius.
    expect(f.fx).toBe(0);
    expect(f.fy).toBe(0);
  });

  it('returns zero force exactly at outer radius', () => {
    const f = computeWhirlpoolPull(0, 0, CORRYVRECKAN_OUTER_RADIUS, 0);
    expect(f.fx).toBe(0);
    expect(f.fy).toBe(0);
  });

  it('returns zero force at the centre (dist === 0)', () => {
    const f = computeWhirlpoolPull(500, 300, 500, 300);
    expect(f.fx).toBe(0);
    expect(f.fy).toBe(0);
  });

  it('force direction has radial component toward the centre', () => {
    // Player due south of whirlpool — radial pull should be northward (negative y).
    const wx = 500, wy = 300;
    const px = 500, py = 400; // 100 px south
    const f = computeWhirlpoolPull(px, py, wx, wy);
    // Radial component pulls toward (wx, wy) → fy should be negative.
    expect(f.fy).toBeLessThan(0);
  });

  it('force magnitude scales with strengthMul', () => {
    const px = 500, py = 400;
    const wx = 500, wy = 300;
    const full = computeWhirlpoolPull(px, py, wx, wy, 1.0);
    const half = computeWhirlpoolPull(px, py, wx, wy, 0.5);
    expect(Math.abs(half.fx)).toBeCloseTo(Math.abs(full.fx) * 0.5, 5);
    expect(Math.abs(half.fy)).toBeCloseTo(Math.abs(full.fy) * 0.5, 5);
  });

  it('WARN_PULL_MUL scales warning-phase force correctly', () => {
    const px = 500, py = 400;
    const wx = 500, wy = 300;
    const warnForce = computeWhirlpoolPull(px, py, wx, wy, CORRYVRECKAN_WARN_PULL_MUL);
    const fullForce = computeWhirlpoolPull(px, py, wx, wy, 1.0);
    expect(Math.abs(warnForce.fy)).toBeCloseTo(Math.abs(fullForce.fy) * CORRYVRECKAN_WARN_PULL_MUL, 5);
  });

  it('force increases as player approaches the centre', () => {
    const wx = 500, wy = 300;
    // Near outer edge: 340 px away.
    const far = computeWhirlpoolPull(500, 640, wx, wy);
    // Closer: 180 px away.
    const near = computeWhirlpoolPull(500, 480, wx, wy);
    const farMag = Math.hypot(far.fx, far.fy);
    const nearMag = Math.hypot(near.fx, near.fy);
    expect(nearMag).toBeGreaterThan(farMag);
  });

  it('tangential component produces clockwise rotation', () => {
    // Player directly east of whirlpool. Radial pull is westward (neg fx).
    // Clockwise tangential for a player east of centre → southward (pos fy).
    const wx = 500, wy = 300;
    const px = 600, py = 300; // 100 px east
    const f = computeWhirlpoolPull(px, py, wx, wy);
    // Radial west → fx < 0; tangential south → fy > 0.
    expect(f.fx).toBeLessThan(0);
    expect(f.fy).toBeGreaterThan(0);
    // For this axis-aligned case the radial and tangential unit vectors are
    // orthogonal, so component magnitudes equal the applied weights directly.
    // Check weight ratio: tangW/radialW = TANGENTIAL_RATIO / (1 - TANGENTIAL_RATIO).
    const radialMag = Math.abs(f.fx); // purely westward radial
    const tangMag = Math.abs(f.fy);   // purely southward tangential
    const radialW = 1 - CORRYVRECKAN_TANGENTIAL_RATIO;
    expect(tangMag / radialMag).toBeCloseTo(CORRYVRECKAN_TANGENTIAL_RATIO / radialW, 4);
  });

  it('peak force at near-zero distance ≈ PULL_BASE × strengthMul', () => {
    // At 1 px from centre, t ≈ 1 → force ≈ PULL_BASE.
    const wx = 500, wy = 300;
    const f = computeWhirlpoolPull(501, 300, wx, wy);
    const mag = Math.hypot(f.fx, f.fy);
    // Peak force = PULL_BASE × hypot(radialW, tangW) — not PULL_BASE itself,
    // because the combined weighted unit vector has magnitude < 1.
    const radialW = 1 - CORRYVRECKAN_TANGENTIAL_RATIO;
    const peakMag = CORRYVRECKAN_PULL_BASE * Math.hypot(radialW, CORRYVRECKAN_TANGENTIAL_RATIO);
    expect(mag).toBeCloseTo(peakMag, 0);
  });
});
