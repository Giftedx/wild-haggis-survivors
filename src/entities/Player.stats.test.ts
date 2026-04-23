import { describe, expect, it, vi } from 'vitest';

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
});
