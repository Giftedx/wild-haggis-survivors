import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ActiveWeapon } from '../../systems/WeaponSystem';
import { updateRunHudFrame, type RunHudSink } from './updateRunHudFrame';
import type { HudWeaponRow } from './updateHudWeaponRows';

function makeRows(n: number): HudWeaponRow[] {
  return Array.from({ length: n }, () => ({
    key: '',
    level: 0,
    evolved: false,
    evolutionKey: '',
    cooldownFrac: 0,
  }));
}

function weapon(
  key: string,
  level: number,
  cooldownMs: number,
  cooldownRemaining: number,
  evolved = false,
  evolutionKey = '',
): ActiveWeapon {
  return {
    config: { key },
    level,
    cooldownMs,
    cooldownRemaining,
    evolved,
    evolutionKey,
  } as ActiveWeapon;
}

function makeHudRecorder() {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const hud: RunHudSink = {
    updateDPS(delta) {
      calls.push({ name: 'updateDPS', args: [delta] });
    },
    updateShield(hasShield) {
      calls.push({ name: 'updateShield', args: [hasShield] });
    },
    setAct(currentAct) {
      calls.push({ name: 'setAct', args: [currentAct] });
    },
    setIronmoor(active) {
      calls.push({ name: 'setIronmoor', args: [active] });
    },
    setDaily(active, seedCode) {
      calls.push({ name: 'setDaily', args: [active, seedCode] });
    },
    setGold(balance) {
      calls.push({ name: 'setGold', args: [balance] });
    },
    update(...args) {
      calls.push({ name: 'update', args });
    },
  };
  return { hud, calls };
}

describe('updateRunHudFrame', () => {
  it('pushes run state into the HUD in the same order GameScene used inline', () => {
    const { hud, calls } = makeHudRecorder();
    const rows = makeRows(4);
    const passives = ['oatcake_stash'];

    const weaponSlotCount = updateRunHudFrame({
      delta: 16.7,
      hud,
      player: {
        getHp: () => 42,
        getMaxHp: () => 55,
        hasShield: () => true,
        getDashCharges: () => 1,
        getMaxDashCharges: () => 3,
        getDashCooldownFraction: () => 0.25,
      },
      xpSystem: {
        getLevel: () => 7,
        getXPFraction: () => 0.4,
      },
      spawnSystem: {
        getGameTimeSec: () => 123.45,
        getActiveCount: () => 19,
      },
      weaponRows: rows,
      weapons: [
        weapon('thistle_shot', 3, 1000, 500),
        weapon('claymore', 5, 2000, 0, true, 'legendary_claymore'),
      ],
      ownedPassives: passives,
      killCount: 88,
      currentAct: 2,
      ironmoor: true,
      daily: true,
      seedCode: 'HAG-123',
      goldBalance: 17,
      activeCurseKey: 'thin_hide',
      beforeUpdate: () => calls.push({ name: 'beforeUpdate', args: [] }),
    });

    expect(weaponSlotCount).toBe(2);
    expect(calls.map((c) => c.name)).toEqual([
      'updateDPS',
      'updateShield',
      'setAct',
      'setIronmoor',
      'setDaily',
      'setGold',
      'beforeUpdate',
      'update',
    ]);
    expect(calls[0].args).toEqual([16.7]);
    expect(calls[1].args).toEqual([true]);
    expect(calls[2].args).toEqual([2]);
    expect(calls[3].args).toEqual([true]);
    expect(calls[4].args).toEqual([true, 'HAG-123']);
    expect(calls[5].args).toEqual([17]);
    expect(rows[0]).toEqual({
      key: 'thistle_shot',
      level: 3,
      evolved: false,
      evolutionKey: '',
      cooldownFrac: 0.5,
    });
    expect(rows[1]).toEqual({
      key: 'claymore',
      level: 5,
      evolved: true,
      evolutionKey: 'legendary_claymore',
      cooldownFrac: 1,
    });
    expect(calls[6].args).toEqual([]);
    expect(calls[7].args).toEqual([
      42,
      55,
      7,
      0.4,
      123.45,
      88,
      19,
      1,
      3,
      0.25,
      rows,
      passives,
      2,
      'thin_hide',
    ]);
  });

  it('passes zero weapon slots when the run has no active weapons', () => {
    const { hud, calls } = makeHudRecorder();
    const rows = makeRows(2);

    const weaponSlotCount = updateRunHudFrame({
      delta: 33,
      hud,
      player: {
        getHp: () => 10,
        getMaxHp: () => 20,
        hasShield: () => false,
        getDashCharges: () => 0,
        getMaxDashCharges: () => 2,
        getDashCooldownFraction: () => 0.75,
      },
      xpSystem: {
        getLevel: () => 1,
        getXPFraction: () => 0,
      },
      spawnSystem: {
        getGameTimeSec: () => 0,
        getActiveCount: () => 0,
      },
      weaponRows: rows,
      weapons: [],
      ownedPassives: [],
      killCount: 0,
      currentAct: 1,
      ironmoor: false,
      daily: false,
      goldBalance: 0,
      activeCurseKey: null,
    });

    expect(weaponSlotCount).toBe(0);
    expect(calls[calls.length - 1].args.slice(10)).toEqual([
      rows,
      [],
      0,
      null,
    ]);
  });
});

describe('GameScene HUD integration guard', () => {
  it('routes the per-frame HUD update through updateRunHudFrame', () => {
    // The call site moved out of GameScene into the runFrameTick
    // helper as part of the updateInner consolidation. The guard now
    // tracks the helper that owns the HUD pump.
    const src = readFileSync(resolve(__dirname, 'runFrameTick.ts'), 'utf8');

    expect(src).toContain("import { updateRunHudFrame } from './updateRunHudFrame';");
    expect(src).toContain('updateRunHudFrame({');
  });
});
