import { expect } from 'vitest';
import type { EnemyBodyFrame } from './enemyFrameTypes';

const ENEMY_FRAME_KEYS = new Set<keyof EnemyBodyFrame>([
  'breathY',
  'bodyX',
  'leftLegY',
  'rightLegY',
]);

export function expectValidEnemyBodyFrame(frame: EnemyBodyFrame, context: string): void {
  expect(typeof frame, `${context} should return a frame object`).toBe('object');
  expect(frame, `${context} should not return null`).not.toBeNull();
  expect(Array.isArray(frame), `${context} should not return an array`).toBe(false);

  if (typeof frame !== 'object' || frame === null || Array.isArray(frame)) return;

  for (const [key, value] of Object.entries(frame)) {
    expect(
      ENEMY_FRAME_KEYS.has(key as keyof EnemyBodyFrame),
      `${context} has unexpected frame key ${key}`,
    ).toBe(true);
    expect(typeof value, `${context}.${key} should be numeric`).toBe('number');
    expect(Number.isFinite(value), `${context}.${key} should be finite`).toBe(true);
  }
}
