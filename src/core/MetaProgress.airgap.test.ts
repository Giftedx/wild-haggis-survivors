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
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      GameObjects: { Group: DummyGroup },
      Events: { EventEmitter: DummyEmitter },
      Math: {},
    },
  };
});

describe('Meta progression air-gap', () => {
  it('WeaponSystem loads without SaveManager dependency', async () => {
    await expect(import('../systems/WeaponSystem')).resolves.toBeTruthy();
  });
});

