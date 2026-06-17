/**
 * Pure-helper guard for the gameplay-state random angle in WeaponSystem's
 * bouncing-projectile path (`fireBouncing` → Jobby Hurler + Shinty Stick).
 *
 * The launch angle decides which enemies a 5s-TTL bouncing projectile
 * strikes over its lifetime — and therefore which die, what XP/gold
 * drops, and which kill events fire. That is gameplay state bound by the
 * T1 replay determinism contract (ADR-0002 Phase 3), so it must be drawn
 * from the seeded run RNG, never Math.random / Phaser.Math.FloatBetween.
 * Pure helper so it unit-tests in node-env vitest without booting Phaser
 * (CLAUDE.md scene-import gotcha), exactly like `enemyAngleSeed.ts`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRNG } from '../utils/rng';
import { pickBouncingLaunchAngle } from './weaponAngleSeed';

describe('weapon angle seed helper', () => {
  it('pickBouncingLaunchAngle is deterministic under shared seed', () => {
    const a = createRNG(12345);
    const b = createRNG(12345);
    for (let i = 0; i < 50; i++) {
      expect(pickBouncingLaunchAngle(a)).toBeCloseTo(pickBouncingLaunchAngle(b), 12);
    }
  });

  it('pickBouncingLaunchAngle stays in [0, 2π)', () => {
    const rng = createRNG(99);
    for (let i = 0; i < 500; i++) {
      const a = pickBouncingLaunchAngle(rng);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(Math.PI * 2);
    }
  });

  it('pickBouncingLaunchAngle varies across draws and seeds', () => {
    const rng = createRNG(12345);
    const samples = new Set<number>();
    for (let i = 0; i < 50; i++) samples.add(pickBouncingLaunchAngle(rng));
    expect(samples.size).toBeGreaterThan(40);
    expect(pickBouncingLaunchAngle(createRNG(1))).not.toBeCloseTo(
      pickBouncingLaunchAngle(createRNG(2)),
      4,
    );
  });
});

describe('WeaponSystem.ts source guard — fireBouncing uses seeded RNG, not Math.random', () => {
  // Static guard against regressions: if a future edit reintroduces
  // Math.random() or Phaser.Math.FloatBetween() (which is Math.random-backed)
  // into the bouncing launch angle, the run-RNG contract is silently broken
  // and recorded replays desync. A grep-style assertion catches it without
  // spinning a Phaser scene — mirrors the Enemy.ts source guard in
  // enemyAngleSeed.test.ts.
  const weaponSrc = readFileSync(resolve(__dirname, 'WeaponSystem.ts'), 'utf8');
  const fireBouncing = weaponSrc.match(/private fireBouncing[\s\S]*?\n {2}\}/);

  it('fireBouncing method body is found', () => {
    expect(fireBouncing).not.toBeNull();
  });

  it('fireBouncing does not draw its launch angle from Phaser.Math.FloatBetween', () => {
    expect(fireBouncing![0]).not.toMatch(/Phaser\.Math\.FloatBetween/);
  });

  it('fireBouncing does not call Math.random', () => {
    expect(fireBouncing![0]).not.toMatch(/Math\.random/);
  });
});
