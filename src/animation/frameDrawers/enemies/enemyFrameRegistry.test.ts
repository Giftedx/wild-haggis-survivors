import { describe, it, expect } from 'vitest';
import {
  registerEnemyFrameDrawer,
  getEnemyFrameDrawer,
  isEnemyAnimated,
  getAllAnimatedEnemyKeys,
} from './enemyFrameRegistry';
import type { EnemyFrameDrawer } from './enemyFrameTypes';

const MOCK_DRAWER: EnemyFrameDrawer = {
  enemyKey: 'test_enemy',
  canvasSize: 48,
  authoredStates: new Set(['idle', 'walking', 'hurt', 'dying']),
  getFrame: () => ({}),
  draw: () => {},
};

describe('enemyFrameRegistry', () => {
  it('returns null for unregistered keys', () => {
    expect(getEnemyFrameDrawer('nonexistent')).toBeNull();
    expect(isEnemyAnimated('nonexistent')).toBe(false);
  });

  it('registers and retrieves a drawer', () => {
    registerEnemyFrameDrawer(MOCK_DRAWER);
    expect(isEnemyAnimated('test_enemy')).toBe(true);
    expect(getEnemyFrameDrawer('test_enemy')).toBe(MOCK_DRAWER);
    expect(getAllAnimatedEnemyKeys()).toContain('test_enemy');
  });
});
