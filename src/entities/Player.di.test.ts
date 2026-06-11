import { describe, expect, it, vi } from 'vitest';

// Phaser expects a browser environment (window). For this DI test we only need
// the module to load far enough to evaluate the Player class, and the
// constructor should throw before touching any Phaser internals.
vi.mock('phaser', () => {
  class Sprite {}
  const __m = {
      Physics: { Arcade: { Sprite } },
      Math: {},
      Utils: { Array: {} },
    };
  return { default: __m, ...__m };
});

describe('Player strict dependency injection', () => {
  // 30s under full vitest concurrency; isolated runtime ~700ms — see T420 in dispatch ledger.
  it('throws immediately if TimeManager is not provided', { timeout: 30_000 }, async () => {
    const { Player } = await import('./Player');
    expect(() => {
      // Force an invalid call-site to simulate a developer mistake.
      new (Player as any)({} as any, 0, 0, 'haggis_classic', undefined);
    }).toThrow(/TimeManager/i);
  });
});

