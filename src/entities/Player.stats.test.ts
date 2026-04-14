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
  return {
    default: {
      Physics: { Arcade: { Sprite, Body } },
      Math: {
        Angle: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1) },
        Clamp: (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)),
      },
    },
  };
});

vi.mock('../utils/input', () => ({
  InputManager: class { getDirection() { return { x: 0, y: 0 }; } destroy() {} },
}));

vi.mock('../utils/SubscriptionBag', () => ({
  SubscriptionBag: class { add() {} listen() {} dispose() {} },
}));

import { Player } from './Player';

function makeScene(): any {
  return {
    add: {
      existing: vi.fn(),
      image: () => ({ setDepth: () => ({ setScale: () => ({}) }) }),
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
