import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Sprite {
    scene: any;
    x = 0; y = 0;
    setPosition() { return this; }
    setTexture() { return this; }
    setActive() { return this; }
    setVisible() { return this; }
    setScale() { return this; }
    setFlipX() { return this; }
    setRotation() { return this; }
    clearTint() { return this; }
    setTint() { return this; }
    setAlpha() { return this; }
    setVelocity() {}
    body = { enable: false };
  }
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      Math: {
        Angle: { Between: () => 0 },
        Distance: { Between: () => 100 },
        Clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
      },
    },
  };
});

vi.mock('../systems/AudioSystem', () => ({ audio: { play: vi.fn() } }));
vi.mock('../core/i18n', () => ({ t: (k: string) => k }));

async function createBareEnemy() {
  const { Enemy } = await import('./Enemy');
  const e: any = Object.create(Enemy.prototype);
  // Minimal state for status/speed tests
  e.behavior = 'chase';
  e.baseSpeed = 100;
  e.speed = 100;
  e.berserkerSpeedMul = 1;
  e.freezeSpeedMul = 1;
  e.buffSpeedMul = 1;
  e.buffSpeedTimer = 0;
  e.burnDamage = 0;
  e.burnTimer = 0;
  e.burnTickAccum = 0;
  e.freezeTimer = 0;
  e.poisonDamage = 0;
  e.poisonTimer = 0;
  e.poisonTickAccum = 0;
  e.speedDirty = false;
  e.chemicalExplosionFired = false;
  e.hp = 100;
  e.maxHp = 100;
  e.xpValue = 10;
  e.damage = 5;
  e.eliteFlag = false;
  e.bossFlag = false;
  e.baseDisplayScale = 1;
  e.showHpBar = false;
  e.hpBarBg = null;
  e.hpBarFill = null;
  const mockRect = () => {
    const r: any = {};
    r.setDepth = () => r;
    r.setOrigin = () => r;
    r.setVisible = () => r;
    r.setFillStyle = () => r;
    return r;
  };
  e.scene = { add: { rectangle: mockRect } };
  return e;
}

describe('Enemy status effects', () => {
  it('applyFreeze reduces speed via freezeSpeedMul', async () => {
    const e = await createBareEnemy();
    e.applyFreeze(0.5, 1000);
    expect(e.speed).toBe(50);
    expect(e.freezeSpeedMul).toBe(0.5);
    expect(e.freezeTimer).toBe(1000);
  });

  it('applyFreeze takes strongest (lowest) multiplier', async () => {
    const e = await createBareEnemy();
    e.applyFreeze(0.7, 500);
    e.applyFreeze(0.3, 1000);
    expect(e.freezeSpeedMul).toBe(0.3);
    expect(e.speed).toBe(30);
  });

  it('applySpeedBuff increases speed via buffSpeedMul', async () => {
    const e = await createBareEnemy();
    e.applySpeedBuff(1.3, 500);
    expect(e.speed).toBe(130);
    expect(e.buffSpeedMul).toBe(1.3);
  });

  it('applySpeedBuff takes strongest (highest) multiplier', async () => {
    const e = await createBareEnemy();
    e.applySpeedBuff(1.2, 500);
    e.applySpeedBuff(1.5, 500);
    expect(e.buffSpeedMul).toBe(1.5);
    expect(e.speed).toBe(150);
  });

  it('freeze + buff compose multiplicatively', async () => {
    const e = await createBareEnemy();
    e.applyFreeze(0.5, 1000);
    e.applySpeedBuff(1.3, 500);
    // 100 * 1 * 0.5 * 1.3 = 65
    expect(e.speed).toBe(65);
  });

  it('applyBurn on hazard is no-op', async () => {
    const e = await createBareEnemy();
    e.behavior = 'hazard';
    e.applyBurn(10, 3000);
    expect(e.burnDamage).toBe(0);
    expect(e.burnTimer).toBe(0);
  });

  it('applyBurn refreshes to max damage/duration', async () => {
    const e = await createBareEnemy();
    e.applyBurn(5, 2000);
    e.applyBurn(10, 1000);
    expect(e.burnDamage).toBe(10);
    expect(e.burnTimer).toBe(2000);
  });
});

describe('Enemy markAsElite', () => {
  it('doubles HP, 1.3x speed, 3x XP', async () => {
    const e = await createBareEnemy();
    e.markAsElite();
    expect(e.maxHp).toBe(200);
    expect(e.hp).toBe(200);
    expect(e.baseSpeed).toBe(130);
    expect(e.speed).toBe(130);
    expect(e.xpValue).toBe(30);
    expect(e.eliteFlag).toBe(true);
  });

  it('markAsElite idempotent — second call no-op', async () => {
    const e = await createBareEnemy();
    e.markAsElite();
    e.markAsElite();
    expect(e.maxHp).toBe(200);
    expect(e.speed).toBe(130);
  });

  it('elite + freeze composes correctly', async () => {
    const e = await createBareEnemy();
    e.markAsElite();
    e.applyFreeze(0.5, 1000);
    // baseSpeed=130, freeze=0.5 → 65
    expect(e.speed).toBe(65);
  });
});
