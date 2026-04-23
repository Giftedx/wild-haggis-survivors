import { describe, expect, it } from 'vitest';
import {
  ENEMY_AMBIENT_RESPAWN_CHANCE,
  resolveEnemyAmbientTrigger,
} from './enemyAmbientTrigger';

describe('resolveEnemyAmbientTrigger', () => {
  it('returns "first" when the enemy key is unseen', () => {
    const seen = new Set<string>();
    expect(resolveEnemyAmbientTrigger('kelpie', seen, () => false)).toBe('first');
    expect(resolveEnemyAmbientTrigger('barghest', seen, () => true)).toBe('first');
  });

  it('returns "respawn" when seen and rng trips the 1/20 roll', () => {
    const seen = new Set(['kelpie']);
    const rngBool = (p: number) => p === ENEMY_AMBIENT_RESPAWN_CHANCE;
    expect(resolveEnemyAmbientTrigger('kelpie', seen, rngBool)).toBe('respawn');
  });

  it('returns null when seen and rng does not trip', () => {
    const seen = new Set(['kelpie']);
    expect(resolveEnemyAmbientTrigger('kelpie', seen, () => false)).toBe(null);
  });

  it('returns null for empty keys (defensive)', () => {
    expect(resolveEnemyAmbientTrigger('', new Set(), () => true)).toBe(null);
  });

  it('respawn chance is 5% — occasional, not chatty', () => {
    expect(ENEMY_AMBIENT_RESPAWN_CHANCE).toBe(0.05);
  });
});
