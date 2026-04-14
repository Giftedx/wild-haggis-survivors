import { describe, expect, it, vi } from 'vitest';
import { UpgradeCardsUI } from './UpgradeCards';
import type { UpgradeCard } from '../data/upgrades';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Between: (min: number, _max: number) => min,
    },
  },
}));

vi.mock('../core/SettingsManager', () => ({
  getSettingsManager: () => ({
    load: () => ({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
    }),
  }),
}));

class MockDisplayObject {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public text = '';
  public texture = { key: 'mock' };
  public scaleX = 1;
  public scaleY = 1;

  constructor(x: number, y: number, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setScrollFactor() { return this; }
  setDepth() { return this; }
  setInteractive() { return this; }
  setOrigin() { return this; }
  setStrokeStyle() { return this; }
  setFillStyle() { return this; }
  setScale(x: number, y?: number) {
    this.scaleX = x;
    this.scaleY = y ?? x;
    return this;
  }
  setAlpha() { return this; }
  setColor() { return this; }
  setText(text: string) {
    this.text = text;
    return this;
  }
  setTexture(key: string) {
    this.texture.key = key;
    return this;
  }
  on() { return this; }
  destroy() {}
}

describe('UpgradeCardsUI layout', () => {
  it('centers overlay and cards within the UI viewport', () => {
    const rectangles: MockDisplayObject[] = [];
    const texts: MockDisplayObject[] = [];
    const sprites: MockDisplayObject[] = [];
    const scene: any = {
      scale: { width: 1040, height: 780 },
      cameras: { main: { zoom: 1.3 } },
      textures: {
        exists: (key: string) => key === 'wicon_thistle_shot',
      },
      add: {
        rectangle: (x: number, y: number, width: number, height: number) => {
          const rect = new MockDisplayObject(x, y, width, height);
          rectangles.push(rect);
          return rect;
        },
        text: (x: number, y: number, text: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.text = text;
          texts.push(obj);
          return obj;
        },
        sprite: (x: number, y: number, key: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.texture.key = key;
          sprites.push(obj);
          return obj;
        },
        circle: (x: number, y: number, radius: number) => new MockDisplayObject(x, y, radius * 2, radius * 2),
      },
      tweens: { add: vi.fn(), killTweensOf: vi.fn() },
    };
    const tickers = {
      addOnce: (_kind: string, _delay: number, cb: () => void) => {
        cb();
        return { cancel: vi.fn() };
      },
    };
    const card: UpgradeCard = {
      id: 'damage_up',
      // Per the upgraded contract, both fields are i18n keys. These keys
      // don't exist in the dictionary, so t() returns them unchanged —
      // which still exercises the same resolution path the UI uses.
      name: 'upgradeCard.test_damage_up.name',
      description: 'upgradeCard.test_damage_up.description',
      rarity: 'common',
      icon: 'wicon_thistle_shot',
      effect: { type: 'stat_boost', stat: 'damagePct', amount: 0.1 },
    };

    const ui = new UpgradeCardsUI(scene, vi.fn(), tickers as never);
    ui.show([card], 3);

    expect(rectangles[0]).toMatchObject({ x: 520, y: 390, width: 800, height: 600 });
    expect(texts[0]).toMatchObject({ x: 520, y: 145, text: 'Level 3 — pick yir poison' });
    expect(rectangles[1]).toMatchObject({ x: 520, y: 410 });
    expect(sprites[0]).toMatchObject({ x: 520, y: 338 });
  });

  it('falls back to scale viewport when display size is unavailable', () => {
    const rectangles: MockDisplayObject[] = [];
    const scene: any = {
      scale: { width: 800, height: 600 },
      cameras: { main: { zoom: 1.3, width: 620, height: 465 } },
      add: {
        rectangle: (x: number, y: number, width: number, height: number) => {
          const rect = new MockDisplayObject(x, y, width, height);
          rectangles.push(rect);
          return rect;
        },
        text: (x: number, y: number, text: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.text = text;
          return obj;
        },
        sprite: (x: number, y: number, key: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.texture.key = key;
          return obj;
        },
        circle: (x: number, y: number, radius: number) => new MockDisplayObject(x, y, radius * 2, radius * 2),
      },
      tweens: { add: vi.fn(), killTweensOf: vi.fn() },
    };
    const tickers = {
      addOnce: (_kind: string, _delay: number, cb: () => void) => {
        cb();
        return { cancel: vi.fn() };
      },
    };
    const card: UpgradeCard = {
      id: 'damage_up',
      // Per the upgraded contract, both fields are i18n keys. These keys
      // don't exist in the dictionary, so t() returns them unchanged —
      // which still exercises the same resolution path the UI uses.
      name: 'upgradeCard.test_damage_up.name',
      description: 'upgradeCard.test_damage_up.description',
      rarity: 'common',
      icon: 'wicon_thistle_shot',
      effect: { type: 'stat_boost', stat: 'damagePct', amount: 0.1 },
    };

    const ui = new UpgradeCardsUI(scene, vi.fn(), tickers as never);
    ui.show([card, card, card], 3);

    // Overlay should include zoom-corrected size plus zoom-origin offset.
    expect(rectangles[0]).toMatchObject({
      x: 310,
      y: 232.5,
      width: 620 / 1.3,
      height: 465 / 1.3,
    });
  });

  it('keeps all level-up cards inside the visible viewport', () => {
    const rectangles: MockDisplayObject[] = [];
    const scene: any = {
      scale: { width: 620, height: 465 },
      cameras: { main: { zoom: 1 } },
      add: {
        rectangle: (x: number, y: number, width: number, height: number) => {
          const rect = new MockDisplayObject(x, y, width, height);
          rectangles.push(rect);
          return rect;
        },
        text: (x: number, y: number, text: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.text = text;
          return obj;
        },
        sprite: (x: number, y: number, key: string) => {
          const obj = new MockDisplayObject(x, y);
          obj.texture.key = key;
          return obj;
        },
        circle: (x: number, y: number, radius: number) => new MockDisplayObject(x, y, radius * 2, radius * 2),
      },
      tweens: { add: vi.fn(), killTweensOf: vi.fn() },
    };
    const tickers = {
      addOnce: (_kind: string, _delay: number, cb: () => void) => {
        cb();
        return { cancel: vi.fn() };
      },
    };
    const card: UpgradeCard = {
      id: 'damage_up',
      // Per the upgraded contract, both fields are i18n keys. These keys
      // don't exist in the dictionary, so t() returns them unchanged —
      // which still exercises the same resolution path the UI uses.
      name: 'upgradeCard.test_damage_up.name',
      description: 'upgradeCard.test_damage_up.description',
      rarity: 'common',
      icon: 'wicon_thistle_shot',
      effect: { type: 'stat_boost', stat: 'damagePct', amount: 0.1 },
    };

    const ui = new UpgradeCardsUI(scene, vi.fn(), tickers as never);
    ui.show([card, card, card], 3);

    const overlay = rectangles[0];
    const cards = rectangles.slice(1, 4);
    for (const c of cards) {
      expect(c.x - c.width / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width / 2).toBeLessThanOrEqual(overlay.width);
    }
  });
});
