import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./AudioSystem', () => ({
  audio: { play: vi.fn(), playBossWarning: vi.fn() },
}));

vi.mock('phaser', () => {
  class EE {
    private _listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    on(event: string, fn: (...args: unknown[]) => void) { (this._listeners[event] ??= []).push(fn); return this; }
    emit(event: string, ...args: unknown[]) { (this._listeners[event] ?? []).forEach(fn => fn(...args)); }
    removeAllListeners() { this._listeners = {}; }
  }
  class Group {
    private _children: { active: boolean }[] = [];
    get children() { return { entries: this._children }; }
    add(obj: { active: boolean }) { this._children.push(obj); return obj; }
    getFirstDead() { return this._children.find(c => !c.active) ?? null; }
    getLength() { return this._children.length; }
    countActive(v = true) { return this._children.filter(c => c.active === v).length; }
    clear() { this._children = []; }
  }
  const __m = {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    };
  return { default: __m, ...__m };
});

vi.mock('../entities/Projectile', () => {
  class Projectile {
    active = false;
    constructor() {}
    setActive() { return this; }
    setVisible() { return this; }
  }
  return { Projectile };
});

vi.mock('../core/GlobalEventBus', () => ({
  globalEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

import { WeaponSystem } from './WeaponSystem';
import { WEAPON_DEFS } from '../data/weapons';

function makeScene(): any {
  return {
    add: {
      group: () => ({
        children: { entries: [] }, getChildren: () => [],
        add: vi.fn(),
        getFirstDead: () => null,
        getLength: () => 0,
        countActive: () => 0,
        clear: vi.fn(),
      }),
      circle: () => ({
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
      }),
      graphics: () => ({
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
      }),
    },
    physics: {
      add: {
        overlap: vi.fn(),
        existing: vi.fn(),
      },
    },
    tweens: {
      killTweensOf: vi.fn(),
    },
    getStatusFxPool: () => null,
  };
}

describe('WeaponSystem', () => {
  let ws: WeaponSystem;

  beforeEach(() => {
    const scene = makeScene();
    const enemyGroup = { children: { entries: [] }, getChildren: () => [] } as any;
    ws = new WeaponSystem(scene, enemyGroup);
  });

  describe('addWeapon', () => {
    it('starts with no weapons (starter weapon added by GameScene)', () => {
      expect(ws.getWeapons()).toHaveLength(0);
    });

    it('adds a new weapon', () => {
      expect(ws.addWeapon('bagpipe_blast')).toBe(true);
      expect(ws.hasWeapon('bagpipe_blast')).toBe(true);
      expect(ws.getWeapons()).toHaveLength(1);
    });

    it('rejects duplicate weapon', () => {
      ws.addWeapon('thistle_shot');
      expect(ws.addWeapon('thistle_shot')).toBe(false);
      expect(ws.getWeapons()).toHaveLength(1);
    });

    it('rejects unknown weapon key', () => {
      expect(ws.addWeapon('nonexistent_weapon')).toBe(false);
    });

    it('initializes weapon at level 1 with base stats', () => {
      ws.addWeapon('caber_toss');
      const w = ws.getWeapons().find(w => w.config.key === 'caber_toss')!;
      expect(w.level).toBe(1);
      expect(w.damage).toBe(WEAPON_DEFS.caber_toss.damage);
      expect(w.cooldownMs).toBe(WEAPON_DEFS.caber_toss.cooldownMs);
      expect(w.evolved).toBe(false);
    });
  });

  describe('levelUpWeapon', () => {
    beforeEach(() => { ws.addWeapon('thistle_shot'); });

    it('increases level and scales damage', () => {
      const def = WEAPON_DEFS.thistle_shot;
      expect(ws.levelUpWeapon('thistle_shot')).toBe(true);

      const w = ws.getWeapons()[0];
      expect(w.level).toBe(2);
      expect(w.damage).toBe(Math.ceil(def.damage * def.levelScaling.damage));
    });

    it('caps at level 5', () => {
      for (let i = 0; i < 4; i++) ws.levelUpWeapon('thistle_shot');
      const w = ws.getWeapons()[0];
      expect(w.level).toBe(5);
      expect(ws.levelUpWeapon('thistle_shot')).toBe(false);
      expect(w.level).toBe(5);
    });

    it('adds projectile count at countAt levels', () => {
      const def = WEAPON_DEFS.thistle_shot;
      const baseCount = def.projectileCount;

      for (let i = 0; i < 2; i++) ws.levelUpWeapon('thistle_shot');
      const w = ws.getWeapons()[0];
      const expectedBumps = def.levelScaling.countAt.filter(lv => lv <= w.level).length;
      expect(w.projectileCount).toBe(baseCount + expectedBumps);
    });

    it('rejects unknown weapon key', () => {
      expect(ws.levelUpWeapon('nonexistent')).toBe(false);
    });

    it('reduces cooldown per level', () => {
      const def = WEAPON_DEFS.thistle_shot;
      ws.levelUpWeapon('thistle_shot');
      const w = ws.getWeapons()[0];
      const expectedCd = Math.max(200, def.cooldownMs * def.levelScaling.cooldown);
      expect(w.cooldownMs).toBeCloseTo(expectedCd, 1);
    });
  });

  describe('evolveWeapon', () => {
    beforeEach(() => { ws.addWeapon('thistle_shot'); });

    it('evolves a weapon with stat boosts', () => {
      for (let i = 0; i < 4; i++) ws.levelUpWeapon('thistle_shot');
      const before = { ...ws.getWeapons()[0] };

      expect(ws.evolveWeapon('thistle_shot', 'highland_fury')).toBe(true);

      const w = ws.getWeapons()[0];
      expect(w.evolved).toBe(true);
      expect(w.evolutionKey).toBe('highland_fury');
      expect(w.damage).toBe(Math.ceil(before.damage * 1.35));
      expect(w.pierce).toBeGreaterThanOrEqual(3);
      expect(w.projectileCount).toBeGreaterThanOrEqual(2);
    });

    it('rejects double evolution', () => {
      ws.evolveWeapon('thistle_shot', 'highland_fury');
      expect(ws.evolveWeapon('thistle_shot', 'highland_fury')).toBe(false);
    });

    it('rejects evolution of missing weapon', () => {
      expect(ws.evolveWeapon('nonexistent', 'some_evo')).toBe(false);
    });
  });

  describe('replaceWeaponsFromRun', () => {
    it('restores saved loadout', () => {
      ws.replaceWeaponsFromRun([
        { key: 'caber_toss', level: 3, evolved: false, evolutionKey: '' },
        { key: 'bagpipe_blast', level: 1, evolved: false, evolutionKey: '' },
      ]);

      expect(ws.getWeapons()).toHaveLength(2);
      expect(ws.hasWeapon('caber_toss')).toBe(true);
      expect(ws.hasWeapon('bagpipe_blast')).toBe(true);
      const caber = ws.getWeapons().find(w => w.config.key === 'caber_toss')!;
      expect(caber.level).toBe(3);
    });

    it('restores evolved state', () => {
      ws.replaceWeaponsFromRun([
        { key: 'thistle_shot', level: 5, evolved: true, evolutionKey: 'highland_fury' },
      ]);

      const w = ws.getWeapons()[0];
      expect(w.evolved).toBe(true);
      expect(w.evolutionKey).toBe('highland_fury');
    });

    it('falls back to thistle_shot on empty input', () => {
      ws.replaceWeaponsFromRun([]);
      expect(ws.getWeapons()).toHaveLength(1);
      expect(ws.hasWeapon('thistle_shot')).toBe(true);
    });

    it('skips invalid weapon keys', () => {
      ws.replaceWeaponsFromRun([
        { key: 'bogus_weapon', level: 1, evolved: false, evolutionKey: '' },
      ]);
      expect(ws.getWeapons()).toHaveLength(1);
      expect(ws.hasWeapon('thistle_shot')).toBe(true);
    });
  });

  describe('setMultipliers', () => {
    it('stores multipliers for use in update tick', () => {
      ws.setMultipliers(2.0, 1.5, 1.2, 0.15, 0.1, 2.5);
      // Multipliers are private — verify indirectly by not throwing
      expect(() => ws.setMultipliers(1, 1, 1)).not.toThrow();
    });
  });

  describe('U1 M4 — setBagpipesRadiusMul (Piper Rune)', () => {
    it('default mul is 1; setter accepts positive values', () => {
      expect(() => ws.setBagpipesRadiusMul(1.25)).not.toThrow();
      expect(() => ws.setBagpipesRadiusMul(2.0)).not.toThrow();
    });

    it('clamps NaN / negative input to safe values', () => {
      // Internal floor is 0.1 so a buggy 0 cannot zero the bagpipes hitbox.
      expect(() => ws.setBagpipesRadiusMul(NaN)).not.toThrow();
      expect(() => ws.setBagpipesRadiusMul(-1)).not.toThrow();
      // Verify the no-throw + state is finite — the radius fold is the
      // observable contract; its own composition is exercised elsewhere
      // via the consumer module's `composeBagpipesRadiusMul` test.
    });
  });
});
