import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyVariantModifiers, applyPermanentUpgrades } from './runStartModifiers';
import type { VariantDef } from '../../data/variants';

vi.mock('../../utils/save', () => ({
  loadSave: vi.fn(() => ({ upgrades: {} })),
}));

vi.mock('./passiveEffects', () => ({
  applyPassiveEffect: vi.fn(),
}));

import { loadSave } from '../../utils/save';
import { PASSIVE_KEYS } from '../../data/upgrades';

function mockPlayer(overrides: Partial<Record<string, any>> = {}) {
  return {
    getRunBaseSpeed: vi.fn(() => overrides.baseSpeed ?? 200),
    getRunBaseMaxHp: vi.fn(() => overrides.baseMaxHp ?? 100),
    getRunBasePickupRadius: vi.fn(() => overrides.basePickup ?? 50),
    addSpeed: vi.fn(),
    addMaxHp: vi.fn(),
    addArmor: vi.fn(),
    addPickupRadius: vi.fn(),
    addXpMultiplier: vi.fn(),
    addDamageMultiplier: vi.fn(),
    reduceDrift: vi.fn(),
    addCooldownReduction: vi.fn(),
    addCritChance: vi.fn(),
    addCritDamageMultiplier: vi.fn(),
    addHpRegen: vi.fn(),
    addDashCharge: vi.fn(),
  } as any;
}

function mockWeaponSystem() {
  return { levelUpWeapon: vi.fn() } as any;
}

function mockRng(val: number = 0) {
  return { pick: vi.fn((arr: string[]) => arr[Math.floor(val * arr.length)] ?? arr[0]) } as any;
}

describe('applyVariantModifiers', () => {
  it('applies speed modifier as percentage of base', () => {
    const player = mockPlayer({ baseSpeed: 200 });
    const variant = { modifiers: { moveSpeedPct: 0.15 } } as unknown as VariantDef;
    applyVariantModifiers(player, variant);
    expect(player.addSpeed).toHaveBeenCalledWith(30);
  });

  it('applies multiple modifiers', () => {
    const player = mockPlayer({ baseMaxHp: 100 });
    const variant = { modifiers: { maxHpFlat: 20, armorFlat: 3, damagePct: 0.1 } } as unknown as VariantDef;
    applyVariantModifiers(player, variant);
    expect(player.addMaxHp).toHaveBeenCalledWith(20);
    expect(player.addArmor).toHaveBeenCalledWith(3);
    expect(player.addDamageMultiplier).toHaveBeenCalledWith(0.1);
  });

  it('skips zero/undefined modifiers', () => {
    const player = mockPlayer();
    const variant = { modifiers: {} } as unknown as VariantDef;
    applyVariantModifiers(player, variant);
    expect(player.addSpeed).not.toHaveBeenCalled();
    expect(player.addMaxHp).not.toHaveBeenCalled();
  });
});

describe('applyPermanentUpgrades', () => {
  beforeEach(() => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: {} } as any);
  });

  it('returns defaults when no upgrades purchased', () => {
    const result = applyPermanentUpgrades({
      player: mockPlayer(),
      weaponSystem: mockWeaponSystem(),
      ownedPassives: [],
      runRng: mockRng(),
    });
    expect(result.revivalAvailable).toBe(false);
    expect(result.chestDurationBonusMs).toBe(0);
  });

  it('thick_hide adds 5% of base maxHp per level', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { thick_hide: 3 } } as any);
    const player = mockPlayer({ baseMaxHp: 100 });
    applyPermanentUpgrades({ player, weaponSystem: mockWeaponSystem(), ownedPassives: [], runRng: mockRng() });
    expect(player.addMaxHp).toHaveBeenCalledWith(15);
  });

  it('weapon_training levels up thistle_shot N times', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { weapon_training: 2 } } as any);
    const ws = mockWeaponSystem();
    applyPermanentUpgrades({ player: mockPlayer(), weaponSystem: ws, ownedPassives: [], runRng: mockRng() });
    expect(ws.levelUpWeapon).toHaveBeenCalledTimes(2);
    expect(ws.levelUpWeapon).toHaveBeenCalledWith('thistle_shot');
  });

  it('revival upgrade sets revivalAvailable', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { revival: 1 } } as any);
    const result = applyPermanentUpgrades({ player: mockPlayer(), weaponSystem: mockWeaponSystem(), ownedPassives: [], runRng: mockRng() });
    expect(result.revivalAvailable).toBe(true);
  });

  it('treasure_magnet sets chestDurationBonusMs', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { treasure_magnet: 2 } } as any);
    const result = applyPermanentUpgrades({ player: mockPlayer(), weaponSystem: mockWeaponSystem(), ownedPassives: [], runRng: mockRng() });
    expect(result.chestDurationBonusMs).toBe(10000);
  });

  it('lucky_start adds random passive to ownedPassives', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { lucky_start: 1 } } as any);
    const passives: string[] = [];
    applyPermanentUpgrades({ player: mockPlayer(), weaponSystem: mockWeaponSystem(), ownedPassives: passives, runRng: mockRng(0) });
    expect(passives.length).toBe(1);
  });

  it('lucky_start skips when all passives already owned', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { lucky_start: 1 } } as any);
    const passives = [...PASSIVE_KEYS];
    const origLen = passives.length;
    applyPermanentUpgrades({ player: mockPlayer(), weaponSystem: mockWeaponSystem(), ownedPassives: passives, runRng: mockRng() });
    expect(passives.length).toBe(origLen);
  });

  it('drift_control calls reduceDrift N times (0.15 each)', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { drift_control: 3 } } as any);
    const player = mockPlayer();
    applyPermanentUpgrades({ player, weaponSystem: mockWeaponSystem(), ownedPassives: [], runRng: mockRng() });
    expect(player.reduceDrift).toHaveBeenCalledTimes(3);
    expect(player.reduceDrift).toHaveBeenCalledWith(0.15);
  });

  it('double_dash calls addDashCharge', () => {
    vi.mocked(loadSave).mockReturnValue({ upgrades: { double_dash: 1 } } as any);
    const player = mockPlayer();
    applyPermanentUpgrades({ player, weaponSystem: mockWeaponSystem(), ownedPassives: [], runRng: mockRng() });
    expect(player.addDashCharge).toHaveBeenCalledOnce();
  });
});
