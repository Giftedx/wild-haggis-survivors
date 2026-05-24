import { describe, it, expect, vi } from 'vitest';
import {
  EngineerTurretSystem,
  TURRET_COOLDOWN_MS,
  TURRET_DAMAGE_MUL,
} from './EngineerTurretSystem';

function makeHooks(overrides: Partial<Parameters<typeof EngineerTurretSystem.prototype['constructor']>[0]> = {}) {
  const hooks = {
    getIsVictoryPending: vi.fn(() => false),
    fireTurretShot: vi.fn(),
    spawnTurretSprite: vi.fn(),
    ...overrides,
  };
  return hooks;
}

describe('EngineerTurretSystem', () => {
  it('does not fire before place() is called', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.tick(TURRET_COOLDOWN_MS + 100);
    expect(hooks.fireTurretShot).not.toHaveBeenCalled();
  });

  it('place() spawns the sprite and arms the system', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.place(100, 200);
    expect(hooks.spawnTurretSprite).toHaveBeenCalledWith(100, 200);
    expect(sys.isPlaced()).toBe(true);
    expect(sys.getTurretX()).toBe(100);
    expect(sys.getTurretY()).toBe(200);
  });

  it('fires at TURRET_COOLDOWN_MS with TURRET_DAMAGE_MUL', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.place(50, 60);
    sys.tick(TURRET_COOLDOWN_MS);
    expect(hooks.fireTurretShot).toHaveBeenCalledOnce();
    expect(hooks.fireTurretShot).toHaveBeenCalledWith(50, 60, TURRET_DAMAGE_MUL);
  });

  it('does not fire before cooldown expires', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.place(0, 0);
    sys.tick(TURRET_COOLDOWN_MS - 1);
    expect(hooks.fireTurretShot).not.toHaveBeenCalled();
  });

  it('does not fire when victory is pending', () => {
    const hooks = makeHooks({ getIsVictoryPending: vi.fn(() => true) });
    const sys = new EngineerTurretSystem(hooks);
    sys.place(0, 0);
    sys.tick(TURRET_COOLDOWN_MS + 100);
    expect(hooks.fireTurretShot).not.toHaveBeenCalled();
  });

  it('carries over overshoot on cooldown reset', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.place(0, 0);
    // Tick with overshoot — next cooldown should be shorter by the overshoot
    sys.tick(TURRET_COOLDOWN_MS + 50);
    expect(hooks.fireTurretShot).toHaveBeenCalledOnce();
    // Remaining should be less than full cooldown due to carry-over
    expect(sys.getCooldownRemaining()).toBeLessThan(TURRET_COOLDOWN_MS);
    expect(sys.getCooldownRemaining()).toBeGreaterThanOrEqual(-TURRET_COOLDOWN_MS);
  });

  it('reset() disarms the system', () => {
    const hooks = makeHooks();
    const sys = new EngineerTurretSystem(hooks);
    sys.place(10, 20);
    sys.reset();
    expect(sys.isPlaced()).toBe(false);
    sys.tick(TURRET_COOLDOWN_MS + 100);
    expect(hooks.fireTurretShot).not.toHaveBeenCalled();
  });
});
