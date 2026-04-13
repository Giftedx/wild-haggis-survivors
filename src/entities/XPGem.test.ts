import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Body {
    enable = false;
    velocity = { x: 0, y: 0 };
  }
  class Sprite {
    active = false;
    visible = false;
    x = 0;
    y = 0;
    scaleX = 1;
    scaleY = 1;
    body = new Body();
    scene: any;
    constructor(scene: any) { this.scene = scene; }
    setActive(v: boolean) { this.active = v; return this; }
    setVisible(v: boolean) { this.visible = v; return this; }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setVelocity(vx: number, vy: number) { this.body.velocity.x = vx; this.body.velocity.y = vy; return this; }
    setScale(s: number) { this.scaleX = s; this.scaleY = s; return this; }
    setAlpha() { return this; }
    setRotation() { return this; }
    setTint() { return this; }
    clearTint() { return this; }
    setDepth() { return this; }
    setOrigin() { return this; }
    destroy() {}
  }
  return {
    default: {
      Physics: { Arcade: { Sprite, Body } },
      Math: {
        FloatBetween: () => 0,
      },
    },
  };
});

vi.mock('../core/SettingsManager', () => ({
  getSettingsManager: () => ({ load: () => ({ uiScale: 1 }) }),
}));

import { XPGem } from './XPGem';

function makeScene(): any {
  return {
    add: {
      existing: vi.fn(),
      text: () => ({
        setDepth: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        visible: false,
        destroy: vi.fn(),
      }),
      circle: () => ({
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setActive: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setRadius: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        visible: false,
        destroy: vi.fn(),
      }),
    },
    physics: { add: { existing: vi.fn() } },
    tweens: {
      killTweensOf: vi.fn(),
      add: vi.fn(),
    },
  };
}

function makeGem(): XPGem {
  return new XPGem(makeScene());
}

describe('XPGem.drop', () => {
  it('activates gem and sets xp value', () => {
    const gem = makeGem();
    gem.drop(100, 200, 3);
    expect(gem.active).toBe(true);
    expect(gem.visible).toBe(true);
    expect(gem.getXpValue()).toBe(3);
    expect(gem.x).toBe(100);
    expect(gem.y).toBe(200);
  });

  it('scales gem by value (min 0.8, max 2.0)', () => {
    const gem = makeGem();
    gem.drop(0, 0, 1);
    expect(gem.scaleX).toBeCloseTo(0.95);

    gem.drop(0, 0, 10);
    expect(gem.scaleX).toBe(2);
  });
});

describe('XPGem.collect', () => {
  it('returns xp value and deactivates', () => {
    const gem = makeGem();
    gem.drop(0, 0, 5);
    const value = gem.collect();
    expect(value).toBe(5);
    expect(gem.active).toBe(false);
    expect(gem.visible).toBe(false);
  });
});

describe('XPGem.updateMagnet', () => {
  it('magnetizes when player within pickup radius', () => {
    const gem = makeGem();
    gem.drop(100, 100, 1);

    gem.updateMagnet(110, 100, 50);
    expect(gem.body!.velocity.x).toBeGreaterThan(0);
  });

  it('does not magnetize when player outside pickup radius', () => {
    const gem = makeGem();
    gem.drop(100, 100, 1);
    gem.setVelocity(0, 0);

    gem.updateMagnet(300, 300, 50);
    expect(gem.body!.velocity.x).toBe(0);
    expect(gem.body!.velocity.y).toBe(0);
  });

  it('skips inactive gems', () => {
    const gem = makeGem();
    gem.drop(100, 100, 1);
    gem.collect();

    gem.updateMagnet(100, 100, 999);
    expect(gem.body!.velocity.x).toBe(0);
  });
});

describe('XPGem.forceCollect', () => {
  it('forces magnetization regardless of distance', () => {
    const gem = makeGem();
    gem.drop(100, 100, 1);
    gem.setVelocity(0, 0);

    gem.forceCollect();
    gem.updateMagnet(500, 500, 10);
    expect(gem.body!.velocity.x).not.toBe(0);
  });
});

describe('XPGem.destroy', () => {
  it('cleans up valueLabel and aura without throwing', () => {
    const gem = makeGem();
    gem.drop(0, 0, 5);
    expect(() => gem.destroy()).not.toThrow();
  });
});
