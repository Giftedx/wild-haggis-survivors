import { describe, expect, it } from 'vitest';
import { pickNearestEnemy, type FiannaTargetable } from './fiannaSpiritMath';

function stubEnemy(x: number, y: number, opts: { active?: boolean; boss?: boolean } = {}): FiannaTargetable {
  return {
    x,
    y,
    active: opts.active ?? true,
    isBoss: () => opts.boss ?? false,
  };
}

describe('pickNearestEnemy (R1 M4.5 P5)', () => {
  it('returns null when group is empty', () => {
    expect(pickNearestEnemy(0, 0, [])).toBeNull();
  });

  it('returns null when every enemy is inactive', () => {
    const enemies = [stubEnemy(10, 0, { active: false }), stubEnemy(20, 0, { active: false })];
    expect(pickNearestEnemy(0, 0, enemies)).toBeNull();
  });

  it('skips bosses so summons do not tank boss fights solo', () => {
    const boss = stubEnemy(5, 0, { boss: true });
    const regular = stubEnemy(50, 0);
    const result = pickNearestEnemy(0, 0, [boss, regular]);
    expect(result).toBe(regular);
  });

  it('returns the closest non-boss active enemy', () => {
    const far = stubEnemy(100, 0);
    const near = stubEnemy(15, 0);
    const mid = stubEnemy(50, 0);
    const result = pickNearestEnemy(0, 0, [far, near, mid]);
    expect(result).toBe(near);
  });

  it('handles distance in 2D (Euclidean)', () => {
    const horizontal = stubEnemy(10, 0); // d=10
    const diagonal = stubEnemy(5, 5); // d≈7.07
    const result = pickNearestEnemy(0, 0, [horizontal, diagonal]);
    expect(result).toBe(diagonal);
  });
});
