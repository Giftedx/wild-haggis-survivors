import { describe, expect, it, vi } from 'vitest';

// Phaser expects a browser environment (window). For this DI test we only need
// the module to load far enough to evaluate the Player class, and the
// constructor should throw before touching any Phaser internals.
vi.mock('phaser', () => {
  class Sprite {}
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      Math: {},
      Utils: { Array: {} },
    },
  };
});

describe('Player strict dependency injection', () => {
  it('throws immediately if TimeManager is not provided', async () => {
    const { Player } = await import('./Player');
    expect(() => {
      // Force an invalid call-site to simulate a developer mistake.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (Player as any)({} as any, 0, 0, 'haggis_classic', undefined);
    }).toThrow(/TimeManager/i);
  });
});

