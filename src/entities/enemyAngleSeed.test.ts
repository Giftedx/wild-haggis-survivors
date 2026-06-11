/**
 * Pure-helper guards for the two gameplay-state random angles in Enemy.ts:
 *   - orbit-behaviour initial angle (Enemy.spawn → behaviorOrbit position)
 *   - spawner-behaviour minion spawn angle (Enemy.behaviorSpawner → midge x/y)
 *
 * Both feed setVelocity / collision and so are part of the T1 replay
 * determinism contract — must be drawn from the seeded run RNG, never
 * Math.random(). Pure helpers so they unit-test in node-env vitest
 * without booting Phaser (CLAUDE.md scene-import gotcha).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRNG } from '../utils/rng';
import { pickInitialOrbitAngle, pickSpawnerMinionAngle } from './enemyAngleSeed';

describe('enemy angle seed helpers', () => {
  it('pickInitialOrbitAngle is deterministic under shared seed', () => {
    const a = createRNG(12345);
    const b = createRNG(12345);
    for (let i = 0; i < 50; i++) {
      expect(pickInitialOrbitAngle(a)).toBeCloseTo(pickInitialOrbitAngle(b), 12);
    }
  });

  it('pickInitialOrbitAngle stays in [0, 2π)', () => {
    const rng = createRNG(99);
    for (let i = 0; i < 500; i++) {
      const a = pickInitialOrbitAngle(rng);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(Math.PI * 2);
    }
  });

  it('pickInitialOrbitAngle varies across draws and seeds', () => {
    const rng = createRNG(12345);
    const samples = new Set<number>();
    for (let i = 0; i < 50; i++) samples.add(pickInitialOrbitAngle(rng));
    expect(samples.size).toBeGreaterThan(40);
    expect(pickInitialOrbitAngle(createRNG(1))).not.toBeCloseTo(
      pickInitialOrbitAngle(createRNG(2)),
      4,
    );
  });

  it('pickSpawnerMinionAngle is deterministic under shared seed', () => {
    const a = createRNG(7);
    const b = createRNG(7);
    for (let i = 0; i < 50; i++) {
      expect(pickSpawnerMinionAngle(a)).toBeCloseTo(pickSpawnerMinionAngle(b), 12);
    }
  });

  it('pickSpawnerMinionAngle stays in [0, 2π)', () => {
    const rng = createRNG(31);
    for (let i = 0; i < 500; i++) {
      const a = pickSpawnerMinionAngle(rng);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(Math.PI * 2);
    }
  });

  it('pickSpawnerMinionAngle varies across draws and seeds', () => {
    const rng = createRNG(31);
    const samples = new Set<number>();
    for (let i = 0; i < 50; i++) samples.add(pickSpawnerMinionAngle(rng));
    expect(samples.size).toBeGreaterThan(40);
    expect(pickSpawnerMinionAngle(createRNG(11))).not.toBeCloseTo(
      pickSpawnerMinionAngle(createRNG(22)),
      4,
    );
  });
});

describe('Enemy.ts source guard — no Math.random in gameplay-state paths', () => {
  // Static guard against regressions: if a future edit reintroduces
  // Math.random() into orbit init or behaviorSpawner, the run-RNG
  // contract is silently broken and recorded replays desync. A
  // grep-style assertion catches it without spinning a Phaser scene.
  const enemySrc = readFileSync(resolve(__dirname, 'Enemy.ts'), 'utf8');

  it('orbit angle initialiser does not call Math.random', () => {
    expect(enemySrc).not.toMatch(/this\.orbitAngle\s*=\s*Math\.random/);
  });

  it('behaviorSpawner method body does not call Math.random', () => {
    const match = enemySrc.match(/private behaviorSpawner[\s\S]*?\n\s\s\}/);
    expect(match).not.toBeNull();
    expect(match![0]).not.toMatch(/Math\.random/);
  });
});
