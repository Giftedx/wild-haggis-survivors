import { describe, expect, it } from 'vitest';
import { pickNearestEnemy, type FiannaTargetable } from './fiannaSpiritMath';

function enemy(x: number, y: number, opts: { active?: boolean; boss?: boolean } = {}): FiannaTargetable {
  return {
    x,
    y,
    active: opts.active ?? true,
    isBoss: () => opts.boss ?? false,
  };
}

describe('pickNearestEnemy', () => {
  it('returns null when the list is empty', () => {
    expect(pickNearestEnemy(0, 0, [])).toBeNull();
  });

  it('returns null when all enemies are inactive', () => {
    const enemies = [enemy(1, 0, { active: false }), enemy(2, 0, { active: false })];
    expect(pickNearestEnemy(0, 0, enemies)).toBeNull();
  });

  it('skips boss enemies', () => {
    const enemies = [enemy(1, 0, { boss: true }), enemy(10, 0)];
    const result = pickNearestEnemy(0, 0, enemies);
    expect(result?.x).toBe(10);
  });

  it('returns the closest active non-boss enemy', () => {
    const enemies = [enemy(10, 0), enemy(3, 0), enemy(7, 0)];
    const result = pickNearestEnemy(0, 0, enemies);
    expect(result?.x).toBe(3);
  });

  it('uses Euclidean distance, not taxi-cab', () => {
    // (4, 0) is distance 4; (3, 3) is distance √18 ≈ 4.24 — picks (4, 0)
    const enemies = [enemy(3, 3), enemy(4, 0)];
    const result = pickNearestEnemy(0, 0, enemies);
    expect(result?.x).toBe(4);
    expect(result?.y).toBe(0);
  });

  it('returns the single active enemy when only one qualifies', () => {
    const enemies = [enemy(5, 5, { boss: true }), enemy(0, 10, { active: false }), enemy(2, 2)];
    const result = pickNearestEnemy(0, 0, enemies);
    expect(result?.x).toBe(2);
    expect(result?.y).toBe(2);
  });

  it('works correctly when player position is not the origin', () => {
    const enemies = [enemy(100, 100), enemy(200, 200)];
    const result = pickNearestEnemy(90, 90, enemies);
    expect(result?.x).toBe(100);
  });
});
