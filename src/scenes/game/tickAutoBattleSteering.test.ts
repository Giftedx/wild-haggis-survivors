import { afterEach, describe, expect, it, vi } from 'vitest';
import { tickAutoBattleSteering } from './tickAutoBattleSteering';

/**
 * Leaf function extracted from GameScene.update(). Two branches:
 *   - AUTO_BATTLE on → player receives a computed steering vector
 *   - AUTO_BATTLE off → player steering is cleared to null
 *
 * We flip the global AUTO_BATTLE flag (the same knob the real
 * AutoBattler reads) to exercise both paths without mocking the
 * module.
 */
describe('tickAutoBattleSteering', () => {
  afterEach(() => {
    (globalThis as unknown as { AUTO_BATTLE?: boolean }).AUTO_BATTLE = false;
  });

  function stubs() {
    const setAutoBattleSteering = vi.fn();
    const player = {
      x: 100,
      y: 200,
      setAutoBattleSteering,
    };
    const xpSystem = {
      getGemPositionsForAutoBattle: () => [
        { x: 140, y: 200, active: true },
      ],
    };
    const spawnSystem = {
      getGameTimeSec: () => 30,
    };
    return { player, xpSystem, spawnSystem, setAutoBattleSteering };
  }

  it('sets null when AUTO_BATTLE is off', () => {
    const { player, xpSystem, spawnSystem, setAutoBattleSteering } = stubs();
    tickAutoBattleSteering(player as never, xpSystem as never, spawnSystem as never);
    expect(setAutoBattleSteering).toHaveBeenCalledWith(null);
  });

  it('sets a computed vector when AUTO_BATTLE is on', () => {
    (globalThis as unknown as { AUTO_BATTLE?: boolean }).AUTO_BATTLE = true;
    const { player, xpSystem, spawnSystem, setAutoBattleSteering } = stubs();
    tickAutoBattleSteering(player as never, xpSystem as never, spawnSystem as never);
    expect(setAutoBattleSteering).toHaveBeenCalledTimes(1);
    const arg = setAutoBattleSteering.mock.calls[0]?.[0];
    expect(arg).not.toBeNull();
    expect(typeof arg.x).toBe('number');
    expect(typeof arg.y).toBe('number');
    // Steering should pull right (gem is at +x from player)
    expect(arg.x).toBeGreaterThan(0);
  });

  it('is cheap to call repeatedly with AUTO_BATTLE off (no throws, no allocation concerns)', () => {
    const { player, xpSystem, spawnSystem, setAutoBattleSteering } = stubs();
    for (let i = 0; i < 10; i++) {
      tickAutoBattleSteering(player as never, xpSystem as never, spawnSystem as never);
    }
    expect(setAutoBattleSteering).toHaveBeenCalledTimes(10);
    for (const call of setAutoBattleSteering.mock.calls) {
      expect(call[0]).toBeNull();
    }
  });
});
