import { describe, it, expect, vi } from 'vitest';
import {
  TuftedFamiliarSystem,
  PUP_COOLDOWN_MS,
  PUP_DAMAGE_MUL,
  PUP_FOLLOW_DISTANCE,
  PUP_MAX_SPEED,
} from './TuftedFamiliarSystem';

function makeHooks(playerPos = { x: 0, y: 0 }) {
  let pos = { ...playerPos };
  const hooks = {
    getIsVictoryPending: vi.fn(() => false),
    getPlayerPosition: vi.fn(() => ({ ...pos })),
    firePupShot: vi.fn(),
    movePupSprite: vi.fn(),
    spawnPupSprite: vi.fn(),
    setPlayerPosition(x: number, y: number) { pos = { x, y }; },
  };
  return hooks;
}

describe('TuftedFamiliarSystem', () => {
  it('does not fire before place() is called', () => {
    const hooks = makeHooks();
    const sys = new TuftedFamiliarSystem(hooks);
    sys.tick(PUP_COOLDOWN_MS + 100);
    expect(hooks.firePupShot).not.toHaveBeenCalled();
  });

  it('place() spawns sprite and arms system', () => {
    const hooks = makeHooks();
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(100, 200);
    expect(hooks.spawnPupSprite).toHaveBeenCalledWith(100, 200);
    expect(sys.isPlaced()).toBe(true);
    expect(sys.getPupX()).toBe(100);
    expect(sys.getPupY()).toBe(200);
  });

  it('fires at PUP_COOLDOWN_MS with PUP_DAMAGE_MUL', () => {
    const hooks = makeHooks({ x: 0, y: 0 });
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(0, 0);
    sys.tick(PUP_COOLDOWN_MS);
    expect(hooks.firePupShot).toHaveBeenCalledOnce();
    expect(hooks.firePupShot).toHaveBeenCalledWith(0, 0, PUP_DAMAGE_MUL);
  });

  it('does not fire when victory pending', () => {
    const hooks = makeHooks();
    hooks.getIsVictoryPending.mockReturnValue(true);
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(0, 0);
    sys.tick(PUP_COOLDOWN_MS + 100);
    expect(hooks.firePupShot).not.toHaveBeenCalled();
  });

  it('does not move when player is within leash distance', () => {
    const hooks = makeHooks({ x: 0, y: 0 });
    const sys = new TuftedFamiliarSystem(hooks);
    // Place pup at exactly the follow-distance boundary
    sys.place(PUP_FOLLOW_DISTANCE - 1, 0);
    hooks.setPlayerPosition(0, 0);
    sys.tick(16);
    // Should not have moved
    expect(sys.getPupX()).toBeCloseTo(PUP_FOLLOW_DISTANCE - 1, 1);
  });

  it('closes the gap when player moves beyond leash distance', () => {
    const hooks = makeHooks({ x: 0, y: 0 });
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(0, 0);
    // Move player far away
    hooks.setPlayerPosition(500, 0);
    const delta = 100; // 100ms = 0.1s, max step = PUP_MAX_SPEED * 0.1
    sys.tick(delta);
    const maxStep = PUP_MAX_SPEED * (delta / 1000);
    expect(sys.getPupX()).toBeCloseTo(maxStep, 1);
  });

  it('updates pup sprite position each tick', () => {
    const hooks = makeHooks({ x: 0, y: 0 });
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(0, 0);
    sys.tick(16);
    expect(hooks.movePupSprite).toHaveBeenCalled();
  });

  it('reset() disarms the system', () => {
    const hooks = makeHooks();
    const sys = new TuftedFamiliarSystem(hooks);
    sys.place(10, 20);
    sys.reset();
    expect(sys.isPlaced()).toBe(false);
    sys.tick(PUP_COOLDOWN_MS + 100);
    expect(hooks.firePupShot).not.toHaveBeenCalled();
  });
});
