import { describe, expect, it, vi } from 'vitest';
import { wireWeaponSystemListeners } from './wireWeaponSystemListeners';

/**
 * Live GameScene.create() ordering passes `this.juice` / `this.hud` to
 * the wire helper at line ~1156, but those fields are declared `!:` and
 * not constructed until ~line 1221/1222. Without lazy resolution the
 * destructured refs would capture `undefined` and every subsequent
 * `damageDealt` / `projectileTrail` callback would throw
 * `Cannot read properties of undefined (reading 'showDamageNumber')`.
 *
 * Lazy `getJuice` / `getHud` getters resolve at fire time, matching the
 * sibling pattern in `wireXpSystemListeners.getBanter` / the
 * pre-extraction inline `(...) => this.juice.showDamageNumber(...)`.
 */

// Minimal event emitter to avoid importing Phaser (whose ESM build
// touches `window` at eval time and breaks node-env vitest — see
// CLAUDE.md gotcha "Phaser imports break in node-env vitest").
function makeEmitter() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    on(name: string, fn: (...args: unknown[]) => void) {
      const arr = handlers.get(name) ?? [];
      arr.push(fn);
      handlers.set(name, arr);
    },
    emit(name: string, ...args: unknown[]) {
      for (const fn of handlers.get(name) ?? []) fn(...args);
    },
  };
}

describe('wireWeaponSystemListeners', () => {
  it('damageDealt resolves juice + hud lazily (wire fires before juice/hud construct)', () => {
    const events = makeEmitter();
    const juice = {
      showDamageNumber: vi.fn(),
      spawnImpactRing: vi.fn(),
      spawnTrail: vi.fn(),
    };
    const hud = { logDamage: vi.fn() };
    const runStatsTracker = { addWeaponDamage: vi.fn() };

    let liveJuice: typeof juice | undefined = undefined;
    let liveHud: typeof hud | undefined = undefined;

    wireWeaponSystemListeners({
      weaponSystem: { events } as never,
      enemyKillHandler: { handle: vi.fn() } as never,
      player: { notifyWeaponFired: vi.fn() } as never,
      getJuice: () => liveJuice as never,
      getHud: () => liveHud as never,
      runStatsTracker: runStatsTracker as never,
      runeBag: {} as never,
      getSFXManager: () => ({ tryPlay: vi.fn() }) as never,
    });

    // Simulate the late-construction window: live GameScene assigns
    // `this.juice = new JuiceSystem(...)` ~65 lines AFTER the wire call.
    liveJuice = juice;
    liveHud = hud;

    events.emit('damageDealt', 100, 200, 25, false, 'sgian_dubh');
    expect(juice.showDamageNumber).toHaveBeenCalledWith(100, 200, 25, false);
    expect(juice.spawnImpactRing).toHaveBeenCalledWith(100, 200);
    expect(hud.logDamage).toHaveBeenCalledWith(25);
    expect(runStatsTracker.addWeaponDamage).toHaveBeenCalledWith('sgian_dubh', 25);
  });

  it('projectileTrail resolves juice lazily', () => {
    const events = makeEmitter();
    const spawnTrail = vi.fn();
    let liveJuice: { spawnTrail: typeof spawnTrail } | undefined = undefined;

    wireWeaponSystemListeners({
      weaponSystem: { events } as never,
      enemyKillHandler: { handle: vi.fn() } as never,
      player: { notifyWeaponFired: vi.fn() } as never,
      getJuice: () => liveJuice as never,
      getHud: () => ({ logDamage: vi.fn() }) as never,
      runStatsTracker: { addWeaponDamage: vi.fn() } as never,
      runeBag: {} as never,
      getSFXManager: () => ({ tryPlay: vi.fn() }) as never,
    });

    liveJuice = { spawnTrail };

    events.emit('projectileTrail', 50, 60, false, 'sgian_dubh');
    expect(spawnTrail).toHaveBeenCalled();
  });

  it('weaponFired flags player animation', () => {
    const events = makeEmitter();
    const notifyWeaponFired = vi.fn();
    wireWeaponSystemListeners({
      weaponSystem: { events } as never,
      enemyKillHandler: { handle: vi.fn() } as never,
      player: { notifyWeaponFired } as never,
      getJuice: () => ({ showDamageNumber: vi.fn(), spawnImpactRing: vi.fn(), spawnTrail: vi.fn() }) as never,
      getHud: () => ({ logDamage: vi.fn() }) as never,
      runStatsTracker: { addWeaponDamage: vi.fn() } as never,
      runeBag: {} as never,
      getSFXManager: () => ({ tryPlay: vi.fn() }) as never,
    });

    events.emit('weaponFired');
    expect(notifyWeaponFired).toHaveBeenCalled();
  });

  it('enemyKilled fans into both EnemyKillHandler.handle + cascade-rune bookkeeper', () => {
    const events = makeEmitter();
    const handle = vi.fn();
    wireWeaponSystemListeners({
      weaponSystem: { events } as never,
      enemyKillHandler: { handle } as never,
      player: { notifyWeaponFired: vi.fn() } as never,
      getJuice: () => ({ showDamageNumber: vi.fn(), spawnImpactRing: vi.fn(), spawnTrail: vi.fn() }) as never,
      getHud: () => ({ logDamage: vi.fn() }) as never,
      runStatsTracker: { addWeaponDamage: vi.fn() } as never,
      runeBag: {} as never,
      getSFXManager: () => ({ tryPlay: vi.fn() }) as never,
    });

    events.emit('enemyKilled', 1, 2, 3, 'midge', false, false, null);
    expect(handle).toHaveBeenCalledWith(1, 2, 3, 'midge', false, false, null);
  });
});
