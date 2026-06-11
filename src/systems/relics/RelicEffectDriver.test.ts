import { describe, expect, it } from 'vitest';
import { RELICS } from '../../data/relics';
import { RelicSystem } from '../RelicSystem';
import { RelicEffectDriver } from './RelicEffectDriver';

function driverWith(...keys: (keyof typeof RELICS)[]): { driver: RelicEffectDriver; sys: RelicSystem } {
  const sys = new RelicSystem();
  for (const k of keys) sys.add(RELICS[k]);
  return { driver: new RelicEffectDriver(sys), sys };
}

describe('RelicEffectDriver — pass-through modifiers', () => {
  it('grans_thimble scales crit multiplier when held, else no-op', () => {
    const { driver } = driverWith('grans_thimble');
    expect(driver.modifyCritMultiplier(2)).toBeCloseTo(2.16);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyCritMultiplier(2)).toBe(2);
  });

  it('sporran_of_holding adds +2 gold when held', () => {
    const { driver } = driverWith('sporran_of_holding');
    expect(driver.modifyGoldPickup(5)).toBe(7);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyGoldPickup(5)).toBe(5);
  });

  it('damp_tinder reduces fire damage 40% when held', () => {
    const { driver } = driverWith('damp_tinder');
    expect(driver.modifyFireDamageTaken(10)).toBeCloseTo(6);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyFireDamageTaken(10)).toBe(10);
  });

  it('oatcake_stash +2 heal on healing orb when held', () => {
    const { driver } = driverWith('oatcake_stash');
    expect(driver.modifyHealOnOrb(5)).toBe(7);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyHealOnOrb(5)).toBe(5);
  });

  it('lucky_heather_sprig +0.03 luck when held', () => {
    const { driver } = driverWith('lucky_heather_sprig');
    expect(driver.modifyLuckDraw(0.1)).toBeCloseTo(0.13);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyLuckDraw(0.1)).toBeCloseTo(0.1);
  });

  it('ceilidh_dancers_ribbon overrides chain threshold to 5 when held', () => {
    const { driver } = driverWith('ceilidh_dancers_ribbon');
    expect(driver.ceilidhChainThreshold(8)).toBe(5);
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.ceilidhChainThreshold(8)).toBe(8);
  });
});

describe('RelicEffectDriver — bronze_clasp stateful', () => {
  it('first hit gets +15%, second hit within 1s baseline', () => {
    const { driver } = driverWith('bronze_clasp');
    expect(driver.modifyWeaponDamage(10, 0)).toBeCloseTo(11.5);
    expect(driver.modifyWeaponDamage(10, 500)).toBe(10);
  });

  it('hit after 1s gap fires the bonus again', () => {
    const { driver } = driverWith('bronze_clasp');
    expect(driver.modifyWeaponDamage(10, 0)).toBeCloseTo(11.5);
    expect(driver.modifyWeaponDamage(10, 1001)).toBeCloseTo(11.5);
    expect(driver.modifyWeaponDamage(10, 1100)).toBe(10);
  });

  it('no-op (and no state advance) when relic not held', () => {
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(bare.modifyWeaponDamage(10, 0)).toBe(10);
    expect(bare.modifyWeaponDamage(10, 10)).toBe(10);
  });

  it('reset() clears the bronze_clasp window', () => {
    const { driver } = driverWith('bronze_clasp');
    driver.modifyWeaponDamage(10, 0); // burns the bonus
    expect(driver.modifyWeaponDamage(10, 100)).toBe(10); // still in cooldown
    driver.reset();
    expect(driver.modifyWeaponDamage(10, 100)).toBeCloseTo(11.5); // window refreshed
  });
});

describe('RelicEffectDriver — whisky_dram active', () => {
  it('isWhiskyDramAvailable tracks held + unused', () => {
    const { driver } = driverWith('whisky_dram');
    expect(driver.isWhiskyDramAvailable()).toBe(true);
    driver.activateWhiskyDram(50, 100);
    expect(driver.isWhiskyDramAvailable()).toBe(false);
  });

  it('activation heals 20% max HP on first call; second call no-ops', () => {
    const { driver } = driverWith('whisky_dram');
    const first = driver.activateWhiskyDram(50, 100);
    expect(first.hp).toBeCloseTo(70);
    expect(first.fired).toBe(true);
    expect(first.available).toBe(false);

    const second = driver.activateWhiskyDram(70, 100);
    expect(second.hp).toBe(70);
    expect(second.fired).toBe(false);
    expect(second.available).toBe(false);
  });

  it('activation when not held returns unchanged, fired=false', () => {
    const bare = new RelicEffectDriver(new RelicSystem());
    const result = bare.activateWhiskyDram(50, 100);
    expect(result.hp).toBe(50);
    expect(result.fired).toBe(false);
    expect(result.available).toBe(false);
  });

  it('reset() restores the one-shot for a fresh run', () => {
    const { driver } = driverWith('whisky_dram');
    driver.activateWhiskyDram(50, 100);
    driver.reset();
    expect(driver.isWhiskyDramAvailable()).toBe(true);
    const result = driver.activateWhiskyDram(50, 100);
    expect(result.fired).toBe(true);
  });
});

describe('RelicEffectDriver — per-frame hook scaffold', () => {
  it('updatePerFrame does not throw with empty slots', () => {
    const bare = new RelicEffectDriver(new RelicSystem());
    expect(() => bare.updatePerFrame(16)).not.toThrow();
  });

  it('updatePerFrame iterates held slots without error', () => {
    const { driver } = driverWith('sporran_of_holding', 'grans_thimble');
    expect(() => driver.updatePerFrame(16)).not.toThrow();
  });
});
