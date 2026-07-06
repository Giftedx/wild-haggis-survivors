import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Body {
    setCircle() {}
    setCollideWorldBounds() {}
    velocity = { x: 0, y: 0 };
  }
  class Sprite {
    scene: any;
    x = 0; y = 0;
    body = new Body();
    width = 48; height = 48;
    setCollideWorldBounds() {}
    setScale() { return this; }
    setDepth() { return this; }
    setTexture() { return this; }
    setOrigin() { return this; }
    constructor(scene: any, x: number, y: number, _tex: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
  }
  const __m = {
      Physics: { Arcade: { Sprite, Body } },
      Math: {
        Angle: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1) },
        Clamp: (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)),
      },
    };
  return { default: __m, ...__m };
});

vi.mock('../utils/input', () => ({
  InputManager: class { getDirection() { return { x: 0, y: 0 }; } destroy() {} },
}));

vi.mock('../utils/SubscriptionBag', () => ({
  SubscriptionBag: class { add() {} listen() {} dispose() {} },
}));

import { Player } from './Player';
import { createRuneEffectBag } from '../systems/runes/runeEffects';
import {
  getSettingsManager,
  resetSettingsManagerSingletonForTests,
} from '../core/SettingsManager';

function makeScene(): any {
  const spriteStub = () => ({
    setVisible: () => spriteStub(),
    setDepth: () => spriteStub(),
    setPosition: () => spriteStub(),
    setRotation: () => spriteStub(),
    setScale: () => spriteStub(),
    setTexture: () => spriteStub(),
    setAlpha: () => spriteStub(),
    setOrigin: () => spriteStub(),
    destroy: () => {},
    depth: 0,
    x: 0,
    y: 0,
  });
  return {
    add: {
      existing: vi.fn(),
      image: () => ({ setDepth: () => ({ setScale: () => ({}) }) }),
      sprite: spriteStub,
    },
    physics: {
      add: { existing: vi.fn() },
    },
    input: { on: vi.fn(), off: vi.fn() },
    scale: { width: 800, height: 600 },
  };
}

function makeTimeManager(): any {
  return {
    isGameplayPaused: () => false,
  };
}

function makePlayer(composed?: any): Player {
  return new Player(makeScene(), 100, 100, 'haggis_classic', makeTimeManager(), composed);
}

describe('Player.takeDamage', () => {
  it('reduces HP by damage amount', () => {
    const p = makePlayer({ maxHp: 100 });
    const dead = p.takeDamage(30);
    expect(dead).toBe(false);
    expect(p.getHp()).toBe(70);
  });

  it('armor reduces incoming damage (minimum 1)', () => {
    const p = makePlayer({ maxHp: 100 });
    p.addArmor(8);
    p.takeDamage(5);
    expect(p.getHp()).toBe(99); // min(1, 5-8) = 1 damage
  });

  it('returns true when HP reaches 0 (no shield)', () => {
    const p = makePlayer({ maxHp: 10 });
    const dead = p.takeDamage(15);
    expect(dead).toBe(true);
    expect(p.getHp()).toBe(0);
  });

  it('Highland Shield prevents lethal hit once', () => {
    const p = makePlayer({ maxHp: 10 });
    p.enableShield();
    const dead = p.takeDamage(50);
    expect(dead).toBe(false);
    expect(p.getHp()).toBe(1);
  });

  it('shield goes on cooldown after proc', () => {
    const p = makePlayer({ maxHp: 10 });
    p.enableShield();
    p.takeDamage(50); // triggers shield
    expect(p.hasShield()).toBe(false);
  });
});

describe('Player.takeDamage — Assist Mode invincibility', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
    getSettingsManager().reset();
  });
  afterEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('blocks all damage at the takeDamage chokepoint (so boss pulses / projectiles honour it)', () => {
    // Boss pulses and enemy projectiles call player.takeDamage() directly,
    // bypassing the PlayerHitResolver contact gate. Gating takeDamage itself
    // makes invincibility cover every enemy-damage source, not just contact.
    getSettingsManager().update((cur) => ({
      ...cur,
      assistMode: true,
      assistModeInvincibility: true,
    }));
    const p = makePlayer({ maxHp: 100 });
    const dead = p.takeDamage(40);
    expect(dead).toBe(false);
    expect(p.getHp()).toBe(100);
  });

  it('applies damage normally when the master Assist toggle is off', () => {
    getSettingsManager().update((cur) => ({
      ...cur,
      assistMode: false,
      assistModeInvincibility: true,
    }));
    const p = makePlayer({ maxHp: 100 });
    p.takeDamage(40);
    expect(p.getHp()).toBe(60);
  });
});

describe('Player.heal', () => {
  it('heals up to maxHp', () => {
    const p = makePlayer({ maxHp: 50 });
    p.takeDamage(20);
    p.heal(100);
    expect(p.getHp()).toBe(50);
  });
});

describe('Player bonus stacking', () => {
  it('addLuckDrawBonus stacks for level-up card weights', () => {
    const p = makePlayer();
    expect(p.getLuckDrawBonus()).toBe(0);
    p.addLuckDrawBonus(8);
    expect(p.getLuckDrawBonus()).toBe(8);
    p.addLuckDrawBonus(3);
    expect(p.getLuckDrawBonus()).toBe(11);
  });

  it('addDamageMultiplier stacks additively', () => {
    const p = makePlayer();
    p.addDamageMultiplier(0.2);
    p.addDamageMultiplier(0.3);
    expect(p.getDamageMultiplier()).toBeCloseTo(1.5);
  });

  it('reduceDrift stacks multiplicatively', () => {
    const p = makePlayer();
    const initial = p.getDriftDegrees();
    p.reduceDrift(0.5); // 50% reduction
    const afterFirst = p.getDriftDegrees();
    p.reduceDrift(0.5); // another 50% of remaining
    const afterSecond = p.getDriftDegrees();
    expect(afterFirst).toBeCloseTo(initial * 0.5);
    expect(afterSecond).toBeCloseTo(initial * 0.25);
  });

  it('addHpRegen caps at 5.0', () => {
    const p = makePlayer();
    p.addHpRegen(3);
    p.addHpRegen(3);
    expect(p.getHpRegen()).toBe(5.0);
  });

  it('addCooldownReduction stacks multiplicatively', () => {
    const p = makePlayer();
    p.addCooldownReduction(0.2);
    p.addCooldownReduction(0.2);
    // 1 - (1-0.2)*(1-0.2) = 1 - 0.64 = 0.36
    expect(p.getCooldownReduction()).toBeCloseTo(0.36);
  });

  it('addMaxHp increases maxHp and heals by added amount', () => {
    const p = makePlayer({ maxHp: 50 });
    p.takeDamage(10); // hp=40
    p.addMaxHp(20);
    expect(p.getMaxHp()).toBe(70);
    expect(p.getHp()).toBe(60); // 40 + 20, capped at 70
  });

  it('addMaxHp heals up to the rune-folded cap, not the raw max (no silent HP loss)', () => {
    // Under a max-HP rune (e.g. haggis_loch), getMaxHp() folds a >1 mult and
    // heal/regen clamp to that folded cap — so HP can legitimately sit above
    // the raw bar. addMaxHp must clamp to the folded cap too, or it silently
    // claws HP back down below where regen already put it.
    const p = makePlayer({ maxHp: 100 });
    const bag = createRuneEffectBag();
    bag.hpMaxMult = 1.2; // folded cap = round(100 * 1.2) = 120
    p.setRuneBagAccessor(() => bag);
    p.heal(1000);
    expect(p.getHp()).toBe(120); // heal reaches the folded cap

    p.addMaxHp(10); // raw max 100 → 110; folded cap → round(110 * 1.2) = 132
    expect(p.getMaxHp()).toBe(132);
    expect(p.getHp()).toBe(130); // 120 + 10, under the folded cap — not clamped to raw 110
  });

  it('applyClootieWagerCost clamps to the rune-folded cap, not the raw max (no silent HP loss)', () => {
    // Sibling of addMaxHp: under a max-HP rune (e.g. haggis_loch) getMaxHp()
    // folds a >1 mult, and heal/regen let HP sit above the raw bar. The clootie
    // wager must clamp current HP to that folded cap too — clamping to raw
    // this.maxHp clawed back HP far beyond the wagered amount.
    const p = makePlayer({ maxHp: 100 });
    const bag = createRuneEffectBag();
    bag.hpMaxMult = 1.5; // folded cap = round(100 * 1.5) = 150
    p.setRuneBagAccessor(() => bag);
    p.heal(1000);
    expect(p.getHp()).toBe(150); // at the folded cap

    p.applyClootieWagerCost(20); // raw max 100 → 80; folded cap → round(80 * 1.5) = 120
    expect(p.getMaxHp()).toBe(120);
    expect(p.getHp()).toBe(120); // 150 - 20 = 130, clamped to folded cap 120 — NOT raw 80
  });

  it('setResumeHealth clamps restored HP to the run-saved cap, not the raw bar', () => {
    // A run saved under a max-HP rune (e.g. haggis_loch) snapshots playerHealth
    // at the folded value (HP legitimately sits above the raw bar) and
    // playerMaxHp at the folded cap. On resume the rune condition system has
    // not ticked yet, so the live getMaxHp() reads the raw max — clamping to it
    // would claw the restored HP back down to the raw bar and lose the
    // rune-granted HP on every resume. The saved cap is authoritative.
    const p = makePlayer({ maxHp: 100 }); // raw max 100

    p.setResumeHealth(150, 150); // saved HP + saved folded cap
    expect(p.getHp()).toBe(150); // restored to the saved cap — NOT raw 100

    // Bounds an out-of-range / hand-edited payload to the saved cap + floor.
    p.setResumeHealth(9999, 150);
    expect(p.getHp()).toBe(150);
    p.setResumeHealth(-5, 150);
    expect(p.getHp()).toBe(0);
  });
});

describe("Player Gran's Best low-HP bonus", () => {
  it('tracks the rune-folded cap, not the raw bar (no max-HP rune: identical)', () => {
    // Without a max-HP rune, getMaxHp() === raw maxHp, so the 40% threshold
    // sits at 40 HP exactly. This pins the common-case behaviour as a no-op
    // guard against the rune-folded fix below.
    const p = makePlayer({ maxHp: 100 });
    p.setGranBestEnabled(true);

    p.takeDamage(60); // hp 40 → 40/100 = 40% ≤ 40%: bonus ON
    expect(p.getHp()).toBe(40);
    expect(p.isGranBestActive()).toBe(true);

    p.heal(5); // hp 45 → 45% > 40%: bonus OFF
    expect(p.getHp()).toBe(45);
    expect(p.isGranBestActive()).toBe(false);
  });

  it('measures the threshold against the rune-folded getMaxHp(), not raw maxHp', () => {
    // Gran's Best grants +30% damage at ≤40% HP. "40% HP" is 40% of the
    // player-visible bar, and the HUD bar + low-HP caption both fill against
    // the rune-folded getMaxHp() (HazardZones/heal/regen clamp to it too).
    // Measuring against the raw maxHp makes a max-HP rune push the threshold
    // lower in absolute HP than the bar shows, so the comeback bonus fires
    // later than designed. Sibling of the addMaxHp / clootie / resume fixes.
    const p = makePlayer({ maxHp: 100 });
    p.setGranBestEnabled(true);
    const bag = createRuneEffectBag();
    bag.hpMaxMult = 1.5; // folded cap = round(100 * 1.5) = 150; 40% = 60 HP
    p.setRuneBagAccessor(() => bag);
    p.heal(1000); // hp = 150 (the folded cap)
    expect(p.getMaxHp()).toBe(150);

    // hp 55 → 55/150 = 36.7% of the bar (≤40%): bonus ON.
    // Raw-bar logic would read 55/100 = 55% (>40%) and wrongly miss it.
    p.takeDamage(95);
    expect(p.getHp()).toBe(55);
    expect(p.isGranBestActive()).toBe(true);
    const activeMul = p.getDamageMultiplier();

    // hp 65 → 65/150 = 43.3% of the bar (>40%): bonus OFF.
    p.heal(10);
    expect(p.getHp()).toBe(65);
    expect(p.isGranBestActive()).toBe(false);
    const inactiveMul = p.getDamageMultiplier();

    // The only difference between the two states is the +30% Gran's Best fold.
    expect(activeMul).toBeCloseTo(inactiveMul * 1.3);
  });
});

describe('Player.tickRegen', () => {
  it('heals 1 HP after accumulating 1.0 from regen rate', () => {
    const p = makePlayer({ maxHp: 100 });
    p.takeDamage(10);
    p.addHpRegen(2.0); // 2 HP/sec
    p.tickRegen(500); // 0.5s → +1.0 accumulated → heals 1
    expect(p.getHp()).toBe(91);
  });

  it('does not overheal past maxHp', () => {
    const p = makePlayer({ maxHp: 50 });
    p.addHpRegen(5.0);
    p.tickRegen(1000);
    expect(p.getHp()).toBe(50);
  });
});

describe('Player.onLevelUp stat recalc', () => {
  it('speed decreases with level but never below 70% of base', () => {
    const p = makePlayer({ speed: 200 });
    p.onLevelUp(10);
    const speed = p.getMoveSpeed();
    const minSpeed = 200 * 0.7;
    expect(speed).toBeGreaterThanOrEqual(minSpeed);
  });

  it('drift decreases with level but never below 30% of base', () => {
    const p = makePlayer({ driftDegrees: 30 });
    p.onLevelUp(20);
    const drift = p.getDriftDegrees();
    expect(drift).toBeGreaterThanOrEqual(30 * 0.3);
  });

  it('pickup radius grows 3% per level', () => {
    const p = makePlayer({ pickupRadius: 100 });
    p.onLevelUp(11); // 10 levels above 1 → 30% growth
    const radius = p.getPickupRadius();
    expect(radius).toBeCloseTo(100 * (1 + 0.03 * 10));
  });
});

describe('Player Ceilidh Chain magnet', () => {
  it('grantCeilidhChainMagnet bumps pickup radius by flatPx', () => {
    const p = makePlayer({ pickupRadius: 100 });
    const before = p.getPickupRadius();
    p.grantCeilidhChainMagnet(40, 2000);
    expect(p.getPickupRadius()).toBeCloseTo(before + 40);
  });

  it('stacks additively with moor-moment magnet (both grants contribute)', () => {
    const p = makePlayer({ pickupRadius: 100 });
    p.grantMoorMomentMagnet(55, 8000);
    p.grantCeilidhChainMagnet(40, 2000);
    // Base 100 + moor 55 + ceilidh 40 = 195
    expect(p.getPickupRadius()).toBeCloseTo(195);
  });

  it('refreshes (not duplicates) when called again with same value', () => {
    const p = makePlayer({ pickupRadius: 100 });
    p.grantCeilidhChainMagnet(40, 2000);
    p.grantCeilidhChainMagnet(40, 2000);
    // Not 100 + 40 + 40; just 100 + 40
    expect(p.getPickupRadius()).toBeCloseTo(140);
  });

  it('upgrades to larger flat when a bigger grant lands first', () => {
    const p = makePlayer({ pickupRadius: 100 });
    p.grantCeilidhChainMagnet(40, 2000);
    p.grantCeilidhChainMagnet(60, 1000);
    // Math.max(40, 60) = 60
    expect(p.getPickupRadius()).toBeCloseTo(160);
  });

  it('keeps prior larger grant when a smaller grant follows', () => {
    const p = makePlayer({ pickupRadius: 100 });
    p.grantCeilidhChainMagnet(60, 2000);
    p.grantCeilidhChainMagnet(40, 1000);
    // Math.max(60, 40) = 60
    expect(p.getPickupRadius()).toBeCloseTo(160);
  });
});

describe('Player.setBiomeModifier', () => {
  it('bogSlow knocks the speed multiplier down to 0.85 and leaves XP/knockback neutral', () => {
    const p = makePlayer({ speed: 200 });
    const baseSpeed = p.getMoveSpeed();
    p.setBiomeModifier('bogSlow');
    // Speed isn't recomputed by setBiomeModifier directly — the biome mul is
    // applied where movement reads it. The flag still cleanly switches state,
    // so we assert the dependent getters that DO surface the bias.
    expect(p.getBiomeXpMultiplier()).toBe(1);
    expect(p.getBiomeKnockbackBonus()).toBe(1);
    // Sanity: the move-speed getter still returns base since recalcStats hasn't
    // been invoked — the biome speed mul lives on a separate field.
    expect(p.getMoveSpeed()).toBe(baseSpeed);
  });

  it('lochKnockback bumps knockback bonus to 1.5 and leaves the rest neutral', () => {
    const p = makePlayer();
    p.setBiomeModifier('lochKnockback');
    expect(p.getBiomeKnockbackBonus()).toBeCloseTo(1.5);
    expect(p.getBiomeXpMultiplier()).toBe(1);
  });

  it('heatherBloom raises the XP gem multiplier to 1.10', () => {
    const p = makePlayer();
    p.setBiomeModifier('heatherBloom');
    expect(p.getBiomeXpMultiplier()).toBeCloseTo(1.10);
    expect(p.getBiomeKnockbackBonus()).toBe(1);
  });

  it('pineConcealment leaves player-side state neutral (concealment is enemy-AI side)', () => {
    const p = makePlayer();
    p.setBiomeModifier('pineConcealment');
    expect(p.getBiomeXpMultiplier()).toBe(1);
    expect(p.getBiomeKnockbackBonus()).toBe(1);
  });

  it('switching biomes resets prior modifiers — never leaks across regions', () => {
    const p = makePlayer();
    p.setBiomeModifier('lochKnockback');
    expect(p.getBiomeKnockbackBonus()).toBeCloseTo(1.5);
    // Stepping into heather should drop knockback back to neutral and raise XP.
    p.setBiomeModifier('heatherBloom');
    expect(p.getBiomeKnockbackBonus()).toBe(1);
    expect(p.getBiomeXpMultiplier()).toBeCloseTo(1.10);
    // Stepping back into a fresh biome (bog) clears XP again.
    p.setBiomeModifier('bogSlow');
    expect(p.getBiomeXpMultiplier()).toBe(1);
  });

  it('blackBogInk sets speed mul to 0.85 and leaves XP/knockback neutral', () => {
    const p = makePlayer();
    p.setBiomeModifier('blackBogInk');
    expect(p.getBiomeXpMultiplier()).toBe(1);
    expect(p.getBiomeKnockbackBonus()).toBe(1);
  });

  it('blackBogInk doubles drift — driftDegrees larger than base after setBiomeModifier', () => {
    const p = makePlayer();
    const baseDrift = p.getDriftDegrees();
    p.setBiomeModifier('blackBogInk');
    expect(p.getDriftDegrees()).toBeCloseTo(baseDrift * 2, 1);
  });

  it('leaving blackBogInk resets drift back to base', () => {
    const p = makePlayer();
    const baseDrift = p.getDriftDegrees();
    p.setBiomeModifier('blackBogInk');
    p.setBiomeModifier('bogSlow');
    expect(p.getDriftDegrees()).toBeCloseTo(baseDrift, 1);
  });

  it('benNevisWind sets wind to (50, 25) and speed mul to 0.92', () => {
    const p = makePlayer();
    p.setBiomeModifier('benNevisWind');
    expect(p.getBiomeWindX()).toBe(50);
    expect(p.getBiomeWindY()).toBe(25);
    expect(p.getBiomeSpeedMul()).toBeCloseTo(0.92);
  });

  it('leaving benNevisWind resets wind to (0, 0)', () => {
    const p = makePlayer();
    p.setBiomeModifier('benNevisWind');
    p.setBiomeModifier('bogSlow');
    expect(p.getBiomeWindX()).toBe(0);
    expect(p.getBiomeWindY()).toBe(0);
  });
});
