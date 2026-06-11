import { describe, expect, it, vi } from 'vitest';

// If gameplay imported SaveManager directly, this import would throw.
vi.mock('./SaveManager', () => {
  throw new Error('SaveManager import blocked');
});

// WeaponSystem depends on Phaser; mock it so it can load in Node.
vi.mock('phaser', () => {
  class Sprite {}
  class DummyGroup {}
  class DummyEmitter {
    on() {}
    off() {}
    emit() {}
    removeAllListeners() {}
  }
  const __m = {
      Physics: { Arcade: { Sprite } },
      GameObjects: { Group: DummyGroup },
      Events: { EventEmitter: DummyEmitter },
      Math: {},
    };
  return { default: __m, ...__m };
});

describe('Meta progression air-gap', () => {
  // 30s under full vitest concurrency; isolated runtime ~50ms — see T420 (commit 7411a41).
  // The dynamic `await import('../systems/WeaponSystem')` re-runs esbuild transform under
  // the 432-file vitest pool and can exceed the 5s default on saturated machines.
  it('WeaponSystem loads without SaveManager dependency', { timeout: 30_000 }, async () => {
    const mod = await import('../systems/WeaponSystem');
    // Stronger than toBeTruthy: confirm the module actually exposes the
    // WeaponSystem class. A regression that returned an empty module ({}) or
    // an unexpected default-only shape would slip past toBeTruthy.
    expect(mod).toMatchObject({ WeaponSystem: expect.any(Function) });
  });
});

