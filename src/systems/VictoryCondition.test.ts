import { describe, expect, it, vi } from 'vitest';

vi.mock('./AudioSystem', () => ({
  audio: { playBossWarning: vi.fn() },
}));

vi.mock('phaser', () => {
  class EE {
    removeAllListeners() {}
  }
  class Group {}
  return {
    default: {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    },
  };
});

vi.mock('../entities/Enemy', () => {
  class Enemy {}
  return { Enemy };
});

import { BALANCE } from '../core/BalanceConfig';
import { BOSSES } from '../data/enemies';
import { SpawnSystem } from './SpawnSystem';

type ProtoFinale = { beginRunWinFinale: (px: number, py: number) => void };

describe('Phase 38 — run win finale / victory path', () => {
  it('RUN_WIN_TIME_SEC and FINAL_BOSS_KEY match boss data', () => {
    expect(BALANCE.run.RUN_WIN_TIME_SEC).toBeGreaterThan(0);
    const boss = BOSSES.find(b => b.key === BALANCE.run.FINAL_BOSS_KEY);
    expect(boss).toBeDefined();
    expect(boss!.key).toBe('taxman');
  });

  it('beginRunWinFinale clears non-boss enemies and schedules the final boss', () => {
    const forceKill = vi.fn();
    const mob = { active: true, isBoss: () => false, forceKill };
    const bossMob = { active: true, isBoss: () => true, forceKill: vi.fn() };
    const spawnBoss = vi.fn();

    const ss: any = Object.create(SpawnSystem.prototype);

    ss.scene = { getTimeManager: () => ({ isGameplayPaused: () => false }) };
    const poolChildren = [mob, bossMob];
    ss.pool = { getChildren: () => poolChildren, children: { entries: poolChildren } };
    ss.runWinFinaleStarted = false;
    ss.regularSpawnsDisabled = false;
    ss.spawnedBossKeys = new Set();
    ss.bossSpawnScheduled = new Set();
    ss.spawnBoss = spawnBoss;

    (SpawnSystem.prototype as unknown as ProtoFinale).beginRunWinFinale.call(ss, 10, 20);

    expect(forceKill).toHaveBeenCalledTimes(1);
    expect(bossMob.forceKill).not.toHaveBeenCalled();
    expect(ss.regularSpawnsDisabled).toBe(true);
    expect(ss.runWinFinaleStarted).toBe(true);
    expect(spawnBoss).toHaveBeenCalledTimes(1);
    const spawned = spawnBoss.mock.calls[0][0] as { key: string };
    expect(spawned.key).toBe(BALANCE.run.FINAL_BOSS_KEY);
    for (const b of BOSSES) {
      if (b.key !== BALANCE.run.FINAL_BOSS_KEY) {
        expect(ss.spawnedBossKeys.has(b.key)).toBe(true);
      }
    }
  });
});
