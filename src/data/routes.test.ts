import { describe, expect, it, vi } from 'vitest';
import { ROUTES, ROUTES_BY_SLOT, getRoute, type RouteKey, type RouteResumeContext } from './routes';
import { defaultModifiers } from '../core/RunModifiers';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';

describe('ROUTES table', () => {
  it('contains exactly 6 routes', () => {
    expect(ROUTES).toHaveLength(6);
  });

  it('exposes 3 routes per picker slot', () => {
    expect(ROUTES_BY_SLOT.A).toHaveLength(3);
    expect(ROUTES_BY_SLOT.B).toHaveLength(3);
  });

  it('all route keys are unique', () => {
    const keys = new Set(ROUTES.map((r) => r.key));
    expect(keys.size).toBe(ROUTES.length);
  });

  it('picker A contains up_the_brae / round_the_loch / through_the_kirkyard', () => {
    const keys = ROUTES_BY_SLOT.A.map((r) => r.key).sort();
    expect(keys).toEqual(['round_the_loch', 'through_the_kirkyard', 'up_the_brae']);
  });

  it('picker B contains buckie_pitstop / run_for_the_hills / stand_yer_ground', () => {
    const keys = ROUTES_BY_SLOT.B.map((r) => r.key).sort();
    expect(keys).toEqual(['buckie_pitstop', 'run_for_the_hills', 'stand_yer_ground']);
  });

  it('every route has non-empty labelKey and descKey', () => {
    for (const r of ROUTES) {
      expect(r.labelKey).toMatch(/^routes\.[a-z_]+\.label$/);
      expect(r.descKey).toMatch(/^routes\.[a-z_]+\.desc$/);
    }
  });

  /**
   * Catches the typo-id bug class — a misspelled key would silently
   * surface the literal string in the ActIntermission picker tile.
   * Every i18n path on a route def must exist in EN.
   */
  it('every route labelKey + descKey resolves in EN', () => {
    setLocale(DEFAULT_LOCALE);
    try {
      for (const r of ROUTES) {
        expect(t(r.labelKey), `labelKey for ${r.key}`).not.toBe(r.labelKey);
        expect(t(r.descKey), `descKey for ${r.key}`).not.toBe(r.descKey);
      }
    } finally {
      setLocale(DEFAULT_LOCALE);
    }
  });

  it('getRoute looks up by key', () => {
    const k: RouteKey = 'up_the_brae';
    expect(getRoute(k).slot).toBe('A');
  });

  it('getRoute throws on unknown key', () => {
    expect(() => getRoute('not_a_route' as RouteKey)).toThrow(/unknown route key/);
  });
});

function makeCtx(overrides: Partial<RouteResumeContext> = {}): RouteResumeContext {
  const modifiers = defaultModifiers();
  return {
    player: {
      heal: vi.fn(),
      getMaxHp: vi.fn(() => 100),
      refreshDashCharges: vi.fn(),
    } as unknown as RouteResumeContext['player'],
    hazardZones: {
      spawnHealingCircle: vi.fn(),
    } as unknown as RouteResumeContext['hazardZones'],
    pickupSpawner: {
      spawnGoldenChest: vi.fn(),
    } as unknown as RouteResumeContext['pickupSpawner'],
    spawnSystem: {
      setEliteWeightMultiplier: vi.fn(),
      forceSpawn: vi.fn(),
      pauseSpawnsFor: vi.fn(),
      setEnemyHpMultiplier: vi.fn(),
    } as unknown as RouteResumeContext['spawnSystem'],
    timeManager: {
      scheduleRealTime: vi.fn((_ms: number, cb: () => void) => cb()),
    } as unknown as RouteResumeContext['timeManager'],
    xpSystem: {
      setDropValueMultiplier: vi.fn(),
    } as unknown as RouteResumeContext['xpSystem'],
    runRng: {
      float: vi.fn(() => 0.5),
      int: vi.fn((min: number) => min),
    } as unknown as RouteResumeContext['runRng'],
    modifiers,
    grantReroll: vi.fn(),
    ...overrides,
  };
}

describe('routes.onResume — picker A', () => {
  it('up_the_brae: sets elite weight ×1.5 + forces one golden chest', () => {
    const ctx = makeCtx();
    getRoute('up_the_brae').onResume!(ctx);
    expect(ctx.spawnSystem.setEliteWeightMultiplier).toHaveBeenCalledWith(1.5);
    expect(ctx.pickupSpawner.spawnGoldenChest).toHaveBeenCalledOnce();
  });

  it('round_the_loch: heals 25% of max HP + spawns 2 extra healing circles', () => {
    const ctx = makeCtx();
    getRoute('round_the_loch').onResume!(ctx);
    expect(ctx.player.heal).toHaveBeenCalledExactlyOnceWith(25); // ceil(100 * 0.25)
    expect(ctx.hazardZones.spawnHealingCircle).toHaveBeenCalledTimes(2);
  });

  it('through_the_kirkyard: force-spawns elite haggis_hunter + schedules 90s release of spawnIntervalMult', () => {
    const ctx = makeCtx();
    // Simulate the picker resolver applying the modifierDelta prior to onResume.
    ctx.modifiers.spawnIntervalMult = 0.7;
    getRoute('through_the_kirkyard').onResume!(ctx);
    expect(ctx.spawnSystem.forceSpawn).toHaveBeenCalledWith('haggis_hunter', { elite: true });
    expect(ctx.timeManager.scheduleRealTime).toHaveBeenCalledWith(
      90_000,
      expect.any(Function),
    );
    // makeCtx's scheduleRealTime fires immediately — so modifier should be reset to 1.
    expect(ctx.modifiers.spawnIntervalMult).toBe(1);
  });
});

describe('routes.onResume — picker B', () => {
  it('stand_yer_ground: doubles XP gem drops for 30s then restores', () => {
    const ctx = makeCtx();
    getRoute('stand_yer_ground').onResume!(ctx);
    // Scheduled callback fires immediately in the test → final state is 1.
    expect(ctx.xpSystem.setDropValueMultiplier).toHaveBeenNthCalledWith(1, 2);
    expect(ctx.xpSystem.setDropValueMultiplier).toHaveBeenNthCalledWith(2, 1);
    expect(ctx.timeManager.scheduleRealTime).toHaveBeenCalledWith(
      30_000,
      expect.any(Function),
    );
  });

  it('run_for_the_hills: heals 50% + refreshes dash; spawnIntervalMult declared on delta', () => {
    const ctx = makeCtx();
    getRoute('run_for_the_hills').onResume!(ctx);
    expect(ctx.player.heal).toHaveBeenCalledExactlyOnceWith(50); // ceil(100 * 0.5)
    expect(ctx.player.refreshDashCharges).toHaveBeenCalledOnce();
    expect(getRoute('run_for_the_hills').modifierDeltas.spawnIntervalMult).toBe(0.75);
  });

  it('buckie_pitstop: pauses spawns 15s, grants reroll, sets enemy HP +10%', () => {
    const ctx = makeCtx();
    getRoute('buckie_pitstop').onResume!(ctx);
    expect(ctx.spawnSystem.pauseSpawnsFor).toHaveBeenCalledExactlyOnceWith(15_000);
    expect(ctx.grantReroll).toHaveBeenCalledOnce();
    expect(ctx.spawnSystem.setEnemyHpMultiplier).toHaveBeenCalledExactlyOnceWith(1.10);
  });
});
