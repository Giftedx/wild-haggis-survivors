import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  AUTO_BATTLE_TIME_TOKEN,
  computeAutoBattleSteering,
  installAutoBattleTimeScale,
  isAutoBattleEnabled,
  reportAutoBattleRunEnd,
  uninstallAutoBattleTimeScale,
} from './AutoBattler';

describe('AutoBattler steering', () => {
  it('points toward the closest active gem', () => {
    const v = computeAutoBattleSteering({
      playerX: 0,
      playerY: 0,
      gems: [
        { x: 100, y: 0, active: true },
        { x: 0, y: 80, active: true },
      ],
      worldWidth: 2000,
      worldHeight: 2000,
      timeSec: 0,
    });
    // (0,80) is closer than (100,0) from origin → steer +Y
    expect(v.y).toBeGreaterThan(0.95);
    expect(Math.abs(v.x)).toBeLessThan(0.2);
  });

  it('ignores inactive gems and falls back to orbit target', () => {
    const v = computeAutoBattleSteering({
      playerX: 500,
      playerY: 500,
      gems: [{ x: 10, y: 10, active: false }],
      worldWidth: 2000,
      worldHeight: 2000,
      timeSec: 0,
    });
    const len = Math.hypot(v.x, v.y);
    expect(len).toBeGreaterThan(0.85);
    expect(len).toBeLessThan(1.15);
  });
});

describe('AutoBattler time scale + telemetry', () => {
  afterEach(() => {
    delete (globalThis as unknown as { AUTO_BATTLE?: boolean }).AUTO_BATTLE;
  });

  it('installAutoBattleTimeScale requests a 10× token', () => {
    const request = vi.fn();
    const release = vi.fn();
    installAutoBattleTimeScale({
      getTimeManager: () => ({ request, release }),
    });
    expect(request).toHaveBeenCalledWith(AUTO_BATTLE_TIME_TOKEN, { timeScale: 10 });
  });

  it('uninstallAutoBattleTimeScale releases the token', () => {
    const release = vi.fn();
    uninstallAutoBattleTimeScale({ getTimeManager: () => ({ request: vi.fn(), release }) });
    expect(release).toHaveBeenCalledWith(AUTO_BATTLE_TIME_TOKEN);
  });

  it('reportAutoBattleRunEnd logs tables only when AUTO_BATTLE is on', () => {
    const table = vi.spyOn(console, 'table').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    reportAutoBattleRunEnd({
      outcome: 'death',
      gameTimeSec: 42,
      weaponDamage: { thistle_shot: 100 },
    });
    expect(table).not.toHaveBeenCalled();

    (globalThis as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
    expect(isAutoBattleEnabled()).toBe(true);

    reportAutoBattleRunEnd({
      outcome: 'death',
      gameTimeSec: 99,
      weaponDamage: { claymore: 50 },
    });
    expect(table).toHaveBeenCalled();

    table.mockRestore();
    info.mockRestore();
  });
});
