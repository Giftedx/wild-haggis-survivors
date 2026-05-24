/**
 * U1 M4 — SpawnSystem.setRuneEnemySlowMul integration test.
 *
 * Asserts that toggling the rune-driven enemy slow scalar applies a
 * one-shot freeze pulse to every active enemy in the pool. Pure
 * structure test — Phaser is stubbed so we drive the method directly.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Sprite {}
  class DummyGroup {}
  class DummyEmitter {}
  const __m = {
    Physics: { Arcade: { Sprite } },
    GameObjects: { Group: DummyGroup },
    Events: { EventEmitter: DummyEmitter },
    Math: {
      Clamp: (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi),
    },
  };
  return { default: __m, ...__m };
});

describe('SpawnSystem.setRuneEnemySlowMul', () => {
  it('default is identity (1)', { timeout: 15_000 }, async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const ss: any = Object.create(SpawnSystem.prototype);
    ss.runeEnemySlowMul = 1;
    ss.pool = { getChildren: () => [] };
    expect(ss.getRuneEnemySlowMul()).toBe(1);
  });

  it('clamps NaN / negative input to 0.1 floor', { timeout: 15_000 }, async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const ss: any = Object.create(SpawnSystem.prototype);
    ss.runeEnemySlowMul = 1;
    ss.pool = { getChildren: () => [] };
    ss.setRuneEnemySlowMul(NaN);
    expect(ss.getRuneEnemySlowMul()).toBe(1); // NaN→1 via Number.isFinite guard
    ss.setRuneEnemySlowMul(-5);
    expect(ss.getRuneEnemySlowMul()).toBe(0.1);
  });

  it('applies a freeze pulse to every active enemy when mul drops below 1', { timeout: 15_000 }, async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const freezeSpy1 = vi.fn();
    const freezeSpy2 = vi.fn();
    const inactiveFreezeSpy = vi.fn();
    const ss: any = Object.create(SpawnSystem.prototype);
    ss.runeEnemySlowMul = 1;
    ss.pool = {
      getChildren: () => [
        { active: true, applyFreeze: freezeSpy1 },
        { active: true, applyFreeze: freezeSpy2 },
        { active: false, applyFreeze: inactiveFreezeSpy },
      ],
    };
    ss.setRuneEnemySlowMul(0.85);
    expect(freezeSpy1).toHaveBeenCalledWith(0.85, 30_000);
    expect(freezeSpy2).toHaveBeenCalledWith(0.85, 30_000);
    expect(inactiveFreezeSpy).not.toHaveBeenCalled();
  });

  it('does NOT apply a pulse when mul resets to identity (avoids spam)', { timeout: 15_000 }, async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const freezeSpy = vi.fn();
    const ss: any = Object.create(SpawnSystem.prototype);
    ss.runeEnemySlowMul = 0.85;
    ss.pool = {
      getChildren: () => [{ active: true, applyFreeze: freezeSpy }],
    };
    ss.setRuneEnemySlowMul(1);
    // Identity mul: stored but no freeze pulse.
    expect(ss.getRuneEnemySlowMul()).toBe(1);
    expect(freezeSpy).not.toHaveBeenCalled();
  });

  it('idempotent — same mul value does not re-pulse enemies', { timeout: 15_000 }, async () => {
    const { SpawnSystem } = await import('./SpawnSystem');
    const freezeSpy = vi.fn();
    const ss: any = Object.create(SpawnSystem.prototype);
    ss.runeEnemySlowMul = 0.85;
    ss.pool = {
      getChildren: () => [{ active: true, applyFreeze: freezeSpy }],
    };
    ss.setRuneEnemySlowMul(0.85);
    expect(freezeSpy).not.toHaveBeenCalled();
  });
});
