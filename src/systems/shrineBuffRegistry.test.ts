import { describe, it, expect, vi } from 'vitest';
import { TempBuffBag } from './TempBuffBag';
import {
  SHRINE_BUFF_KEYS,
  applyShrineBuff,
  isRegisteredShrineBuffKey,
  restoreShrineBuffs,
} from './shrineBuffRegistry';

interface FakePlayer {
  damage: number;
  speed: number;
  armor: number;
  crit: number;
  pickup: number;
  addDamageMultiplier(d: number): void;
  addSpeed(d: number): void;
  addArmor(d: number): void;
  addCritChance(d: number): void;
  addPickupRadius(d: number): void;
}

function makePlayer(): FakePlayer {
  const p = {
    damage: 0,
    speed: 0,
    armor: 0,
    crit: 0,
    pickup: 0,
    addDamageMultiplier: vi.fn(function (this: FakePlayer, d: number) { this.damage += d; }),
    addSpeed: vi.fn(function (this: FakePlayer, d: number) { this.speed += d; }),
    addArmor: vi.fn(function (this: FakePlayer, d: number) { this.armor += d; }),
    addCritChance: vi.fn(function (this: FakePlayer, d: number) { this.crit += d; }),
    addPickupRadius: vi.fn(function (this: FakePlayer, d: number) { this.pickup += d; }),
  } as FakePlayer;
  // Bind methods to the object so `this` resolves inside the registry's
  // arrow-function `apply`/`revert`.
  p.addDamageMultiplier = p.addDamageMultiplier.bind(p);
  p.addSpeed = p.addSpeed.bind(p);
  p.addArmor = p.addArmor.bind(p);
  p.addCritChance = p.addCritChance.bind(p);
  p.addPickupRadius = p.addPickupRadius.bind(p);
  return p;
}

describe('shrineBuffRegistry', () => {
  it('lists exactly the five revertible shrine combat buffs', () => {
    expect(SHRINE_BUFF_KEYS).toEqual([
      'buff_damage',
      'buff_speed',
      'buff_armor',
      'buff_crit',
      'buff_pickup',
    ]);
  });

  it('isRegisteredShrineBuffKey gates immediate-effect keys out', () => {
    expect(isRegisteredShrineBuffKey('buff_damage')).toBe(true);
    expect(isRegisteredShrineBuffKey('buff_gold')).toBe(false);
    expect(isRegisteredShrineBuffKey('not_a_key')).toBe(false);
  });

  it('applyShrineBuff applies the delta on add and reverts on tick expiry', () => {
    const bag = new TempBuffBag();
    const player = makePlayer();
    const ok = applyShrineBuff(bag, 'buff_damage', 500, { player } as never);
    expect(ok).toBe(true);
    expect(player.damage).toBeCloseTo(0.25);
    expect(bag.activeCount()).toBe(1);
    bag.tick(600); // expire
    expect(player.damage).toBeCloseTo(0);
    expect(bag.activeCount()).toBe(0);
  });

  it('applyShrineBuff returns false for unknown keys without queuing', () => {
    const bag = new TempBuffBag();
    const player = makePlayer();
    const ok = applyShrineBuff(bag, 'buff_unknown', 500, { player } as never);
    expect(ok).toBe(false);
    expect(bag.activeCount()).toBe(0);
    expect(player.damage).toBe(0);
  });

  it('every registered key applies and reverts cleanly', () => {
    for (const key of SHRINE_BUFF_KEYS) {
      const bag = new TempBuffBag();
      const player = makePlayer();
      applyShrineBuff(bag, key, 500, { player } as never);
      expect(bag.activeCount(), `${key} queued`).toBe(1);
      bag.tick(600);
      expect(bag.activeCount(), `${key} expired`).toBe(0);
      // Each revert pairs exactly with the apply: every stat lever the
      // registry mutates returns to baseline (0).
      expect(player.damage, `${key} damage`).toBeCloseTo(0);
      expect(player.speed, `${key} speed`).toBeCloseTo(0);
      expect(player.armor, `${key} armor`).toBeCloseTo(0);
      expect(player.crit, `${key} crit`).toBeCloseTo(0);
      expect(player.pickup, `${key} pickup`).toBeCloseTo(0);
    }
  });

  it('restoreShrineBuffs re-applies each saved entry with its remaining ms', () => {
    const bag = new TempBuffBag();
    const player = makePlayer();
    const restored = restoreShrineBuffs(
      bag,
      [
        { key: 'buff_damage', remainingMs: 800 },
        { key: 'buff_armor', remainingMs: 1200 },
      ],
      { player } as never,
    );
    expect(restored).toBe(2);
    expect(bag.activeCount()).toBe(2);
    expect(player.damage).toBeCloseTo(0.25);
    expect(player.armor).toBeCloseTo(3);

    // Tick less than the smaller remainingMs → both still alive.
    bag.tick(500);
    expect(bag.activeCount()).toBe(2);
    // Tick past buff_damage's remaining (300 left) → only armor survives.
    bag.tick(400);
    expect(bag.activeCount()).toBe(1);
    expect(player.damage).toBeCloseTo(0);
    expect(player.armor).toBeCloseTo(3);
    // Tick past armor too.
    bag.tick(400);
    expect(bag.activeCount()).toBe(0);
    expect(player.armor).toBeCloseTo(0);
  });

  it('restoreShrineBuffs skips entries with non-positive / non-finite remainingMs', () => {
    const bag = new TempBuffBag();
    const player = makePlayer();
    const restored = restoreShrineBuffs(
      bag,
      [
        { key: 'buff_damage', remainingMs: 0 },
        { key: 'buff_speed', remainingMs: -10 },
        { key: 'buff_armor', remainingMs: NaN },
      ],
      { player } as never,
    );
    expect(restored).toBe(0);
    expect(bag.activeCount()).toBe(0);
    expect(player.damage).toBe(0);
    expect(player.speed).toBe(0);
    expect(player.armor).toBe(0);
  });

  it('restoreShrineBuffs silently drops unknown keys (forward-compat)', () => {
    const bag = new TempBuffBag();
    const player = makePlayer();
    const restored = restoreShrineBuffs(
      bag,
      [
        { key: 'buff_renamed', remainingMs: 500 },
        { key: 'buff_crit', remainingMs: 700 },
      ],
      { player } as never,
    );
    expect(restored).toBe(1);
    expect(bag.activeCount()).toBe(1);
    expect(player.crit).toBeCloseTo(0.15);
  });
});
