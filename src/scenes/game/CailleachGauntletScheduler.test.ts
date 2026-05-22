import { describe, expect, it, vi } from 'vitest';
import {
  CailleachGauntletScheduler,
  type CailleachGauntletSchedulerHooks,
} from './CailleachGauntletScheduler';
import {
  GAUNTLET_CANDLE_TIME_MS,
  GAUNTLET_BOSS_TIME_MS,
} from './cailleachGauntlet';
import type { FallenCairn } from '../../utils/save/fallenCairns';

function makeCairn(savedAt: number): FallenCairn {
  return {
    x: 0, y: 0, cause: 'enemy_contact', variantKey: 'classic',
    timeSurvivedMs: 1, inheritedStat: 'damage', savedAt,
  };
}

function buildHooks(
  overrides: Partial<CailleachGauntletSchedulerHooks> = {},
): CailleachGauntletSchedulerHooks {
  return {
    getTouchedThisRun: () => [],
    getGameTimeMs: () => 0,
    getPlayerPosition: () => ({ x: 0, y: 0 }),
    isBossDead: () => false,
    isPlayerDead: () => false,
    onArmed: vi.fn(),
    onCandlesLit: vi.fn(),
    onCailleachSpawned: vi.fn(),
    onWin: vi.fn(),
    onLose: vi.fn(),
    ...overrides,
  };
}

describe('CailleachGauntletScheduler', () => {
  it('fires onArmed when 7 cairns touched pre-14:00', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    const onArmed = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({ getTouchedThisRun: () => touched, getGameTimeMs: () => 5 * 60_000, onArmed }),
    );
    scheduler.tick();
    expect(onArmed).toHaveBeenCalledTimes(1);
    expect(onArmed).toHaveBeenCalledWith(expect.objectContaining({ touchedSavedAts: [1, 2, 3, 4, 5, 6, 7] }));
  });

  it('fires onCandlesLit when time crosses 14:00 after arm', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    let gameTimeMs = 5 * 60_000;
    const onCandlesLit = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({
        getTouchedThisRun: () => touched,
        getGameTimeMs: () => gameTimeMs,
        getPlayerPosition: () => ({ x: 100, y: 200 }),
        onCandlesLit,
      }),
    );
    scheduler.tick(); // arms
    gameTimeMs = GAUNTLET_CANDLE_TIME_MS;
    scheduler.tick();
    expect(onCandlesLit).toHaveBeenCalledTimes(1);
    const payload = onCandlesLit.mock.calls[0][0];
    expect(payload.candleRing).toHaveLength(7);
  });

  it('fires onCailleachSpawned when time crosses 15:00 after candles', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    let gameTimeMs = GAUNTLET_CANDLE_TIME_MS;
    const onCailleachSpawned = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({
        getTouchedThisRun: () => touched,
        getGameTimeMs: () => gameTimeMs,
        onCailleachSpawned,
      }),
    );
    scheduler.tick(); // arms + lights candles (multi-step idle → candles_lit)
    gameTimeMs = GAUNTLET_BOSS_TIME_MS;
    scheduler.tick();
    expect(onCailleachSpawned).toHaveBeenCalledTimes(1);
  });

  it('fires onWin when boss-dead in engaged phase', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    let gameTimeMs = GAUNTLET_BOSS_TIME_MS;
    let bossDead = false;
    const onWin = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({
        getTouchedThisRun: () => touched,
        getGameTimeMs: () => gameTimeMs,
        isBossDead: () => bossDead,
        onWin,
      }),
    );
    scheduler.tick(); // arms + lights + engages
    bossDead = true;
    gameTimeMs += 5_000;
    scheduler.tick();
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onWin).toHaveBeenCalledWith(expect.objectContaining({ wreathedSavedAts: [1, 2, 3, 4, 5, 6, 7] }));
  });

  it('fires onLose when player-dead in engaged phase', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    const gameTimeMs = GAUNTLET_BOSS_TIME_MS;
    let playerDead = false;
    const onLose = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({
        getTouchedThisRun: () => touched,
        getGameTimeMs: () => gameTimeMs,
        isPlayerDead: () => playerDead,
        onLose,
      }),
    );
    scheduler.tick(); // arms + lights + engages
    playerDead = true;
    scheduler.tick();
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(onLose).toHaveBeenCalledWith(expect.objectContaining({ extinguishedSavedAts: [1, 2, 3, 4, 5, 6, 7] }));
  });

  it('reset returns to idle and allows a fresh gauntlet next run', () => {
    const touched = Array.from({ length: 7 }, (_, i) => makeCairn(i + 1));
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({ getTouchedThisRun: () => touched, getGameTimeMs: () => 5 * 60_000 }),
    );
    scheduler.tick();
    scheduler.reset();
    expect(scheduler.getState().phase).toBe('idle');
  });

  it('does nothing while under threshold', () => {
    const touched = Array.from({ length: 6 }, (_, i) => makeCairn(i + 1));
    const onArmed = vi.fn();
    const scheduler = new CailleachGauntletScheduler(
      buildHooks({ getTouchedThisRun: () => touched, getGameTimeMs: () => 5 * 60_000, onArmed }),
    );
    scheduler.tick();
    expect(onArmed).not.toHaveBeenCalled();
    expect(scheduler.getState().phase).toBe('idle');
  });
});
