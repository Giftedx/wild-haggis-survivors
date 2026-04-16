import { describe, expect, it, vi } from 'vitest';
import { RunExitComposer, type RunExitHooks } from './RunExitComposer';

/**
 * Hooks mock surface is wide but shallow — composer is mostly pure
 * aggregation plus three scene callbacks. Focus tests on: summary
 * shape, payload shape, multi-line build summary formatting, and the
 * transition orchestration (stop → start + side effects).
 */

function buildMocks(
  overrides: {
    weapons?: Array<{ key: string; level: number; evolved: boolean }>;
    kills?: number;
    bossKills?: number;
    coinGold?: number;
    bossGold?: number;
    bestCombo?: number;
    goldMult?: number;
    isDaily?: boolean;
    curseKey?: string | null;
    variantKey?: string;
    runSeed?: number;
    saveThrows?: boolean;
  } = {},
) {
  const saveManager = {
    clearActiveRun: vi.fn(() => {
      if (overrides.saveThrows) throw new Error('quota');
    }),
  };
  const stopGameScene = vi.fn();
  const startGameOverScene = vi.fn();
  const startMainMenuScene = vi.fn();

  const hooks: RunExitHooks = {
    getWeaponSystem: () =>
      ({
        getWeapons: () =>
          (overrides.weapons ?? [{ key: 'thistle_shot', level: 3, evolved: false }]).map((w) => ({
            config: { key: w.key, nameKey: `weapon.${w.key}.name` },
            level: w.level,
            evolved: w.evolved,
          })),
      }) as never,
    getSpawnSystem: () => ({ getGameTimeSec: () => 540 }) as never,
    getJuice: () => ({ getBestCombo: () => overrides.bestCombo ?? 42 }) as never,
    getXPSystem: () => ({ getLevel: () => 12 }) as never,
    getRunStatsTracker: () => ({ snapshot: () => ({ thistle_shot: 8000 }) }) as never,
    getSaveManager: () => saveManager as never,
    getActiveVariant: () =>
      ({
        key: overrides.variantKey ?? 'classic',
        name: 'Wee Haggis',
        nameKey: 'variant.classic.name',
        flavorText: 'scrappy little beastie',
        modifiers: {},
      }) as never,
    getActiveCurseKey: () => (overrides.curseKey ?? null) as never,
    getRunRng: () => ({ seed: overrides.runSeed ?? 12345 }) as never,
    getRunModifiers: () => ({ goldMult: overrides.goldMult ?? 1 }) as never,
    isDailyRun: () => overrides.isDaily ?? false,
    getKillCount: () => overrides.kills ?? 250,
    getBossKillCount: () => overrides.bossKills ?? 2,
    getBossGoldEarned: () => overrides.bossGold ?? 400,
    getCoinGoldEarned: () => overrides.coinGold ?? 125,
    getOwnedPassivesLength: () => 3,
    getEvolvedWeaponsLength: () => 1,
    stopGameScene,
    startGameOverScene,
    startMainMenuScene,
  };
  return { hooks, saveManager, stopGameScene, startGameOverScene, startMainMenuScene };
}

describe('RunExitComposer', () => {
  describe('buildSummary', () => {
    it('captures time + kills + gold totals + combo + victory flag', () => {
      const { hooks } = buildMocks({ kills: 300, coinGold: 120, bossGold: 500 });
      const summary = new RunExitComposer(hooks).buildSummary(true);
      expect(summary).toEqual({
        timeSurvivedSec: 540,
        enemiesKilled: 300,
        bossGold: 500,
        coinGold: 120,
        bestCombo: 42,
        victory: true,
        goldMult: 1,
      });
    });

    it('propagates goldMult from runModifiers', () => {
      const { hooks } = buildMocks({ goldMult: 1.5 });
      expect(new RunExitComposer(hooks).buildSummary(false).goldMult).toBe(1.5);
    });

    it('sets victory=false for death path', () => {
      const { hooks } = buildMocks();
      expect(new RunExitComposer(hooks).buildSummary(false).victory).toBe(false);
    });
  });

  describe('buildBuildSummary', () => {
    it('formats weapons as "name lv" with star for evolved', () => {
      const { hooks } = buildMocks({
        weapons: [
          { key: 'claymore', level: 5, evolved: true },
          { key: 'thistle_shot', level: 3, evolved: false },
        ],
      });
      const out = new RunExitComposer(hooks).buildBuildSummary();
      // t() returns the key when locale key is missing — assert structure.
      expect(out).toContain('★'); // evolved marker present
      expect(out.split('  |  ')).toHaveLength(2);
    });

    it('groups 3 weapons per line', () => {
      const six = Array.from({ length: 6 }, (_, i) => ({
        key: `w${i}`,
        level: 1,
        evolved: false,
      }));
      const { hooks } = buildMocks({ weapons: six });
      const out = new RunExitComposer(hooks).buildBuildSummary();
      expect(out.split('\n')).toHaveLength(2);
    });

    it('returns empty string for zero weapons', () => {
      const { hooks } = buildMocks({ weapons: [] });
      expect(new RunExitComposer(hooks).buildBuildSummary()).toBe('');
    });
  });

  describe('buildGameOverPayload', () => {
    it('assembles payload with scene state + summary + seed code', () => {
      const { hooks } = buildMocks({ variantKey: 'moor_runner', runSeed: 42, isDaily: true });
      const summary = { timeSurvivedSec: 300, enemiesKilled: 100, victory: false } as never;
      const runResult = { goldEarned: 200 } as never;
      const payload = new RunExitComposer(hooks).buildGameOverPayload(
        'death',
        summary,
        runResult,
        undefined,
        { primary: 'contact', enemyKey: 'taxman' } as never,
      );
      expect(payload.mode).toBe('death');
      expect(payload.isVictory).toBe(false);
      expect(payload.summary).toBe(summary);
      expect(payload.runResult).toBe(runResult);
      expect(payload.variantKey).toBe('moor_runner');
      expect(payload.bossKillCount).toBe(2);
      expect(payload.xpLevel).toBe(12);
      expect(payload.isDaily).toBe(true);
      expect(payload.seedCode).toMatch(/\w+/); // encodeSeed always returns non-empty
      expect(payload.weaponDamage).toEqual({ thistle_shot: 8000 });
      expect(payload.deathCause).toEqual({ primary: 'contact', enemyKey: 'taxman' });
    });

    it('isVictory true when mode=victory', () => {
      const { hooks } = buildMocks();
      const p = new RunExitComposer(hooks).buildGameOverPayload(
        'victory',
        { timeSurvivedSec: 900, enemiesKilled: 500, victory: true } as never,
        { goldEarned: 1000 } as never,
      );
      expect(p.isVictory).toBe(true);
    });

    it('curseKey is undefined when no curse was active', () => {
      const { hooks } = buildMocks({ curseKey: null });
      const p = new RunExitComposer(hooks).buildGameOverPayload(
        'death',
        { timeSurvivedSec: 0, enemiesKilled: 0, victory: false } as never,
        { goldEarned: 0 } as never,
      );
      expect(p.curseKey).toBeUndefined();
    });

    it('curseKey propagates when set', () => {
      const { hooks } = buildMocks({ curseKey: 'thin_hide' });
      const p = new RunExitComposer(hooks).buildGameOverPayload(
        'death',
        { timeSurvivedSec: 0, enemiesKilled: 0, victory: false } as never,
        { goldEarned: 0 } as never,
      );
      expect(p.curseKey).toBe('thin_hide');
    });
  });

  describe('transitionToGameOver', () => {
    const samplePayload = () =>
      ({
        mode: 'victory' as const,
        summary: { timeSurvivedSec: 900, enemiesKilled: 300 },
        weaponDamage: { claymore: 10_000 },
      }) as never;

    it('calls stopGameScene then startGameOverScene in order', () => {
      const { hooks, stopGameScene, startGameOverScene } = buildMocks();
      new RunExitComposer(hooks).transitionToGameOver(samplePayload());
      expect(stopGameScene).toHaveBeenCalledBefore(startGameOverScene);
    });

    it('clears the active run before transitioning', () => {
      const { hooks, saveManager } = buildMocks();
      new RunExitComposer(hooks).transitionToGameOver(samplePayload());
      expect(saveManager.clearActiveRun).toHaveBeenCalledOnce();
    });

    it('still transitions when clearActiveRun throws', () => {
      const { hooks, saveManager, startGameOverScene } = buildMocks({ saveThrows: true });
      expect(() => new RunExitComposer(hooks).transitionToGameOver(samplePayload())).not.toThrow();
      expect(saveManager.clearActiveRun).toHaveBeenCalled();
      expect(startGameOverScene).toHaveBeenCalledOnce();
    });
  });

  describe('abandonToMainMenu', () => {
    it('clears active run + starts MainMenu scene', () => {
      const { hooks, saveManager, startMainMenuScene } = buildMocks();
      new RunExitComposer(hooks).abandonToMainMenu();
      expect(saveManager.clearActiveRun).toHaveBeenCalledOnce();
      expect(startMainMenuScene).toHaveBeenCalledOnce();
    });

    it('still starts MainMenu when clearActiveRun throws', () => {
      const { hooks, startMainMenuScene } = buildMocks({ saveThrows: true });
      expect(() => new RunExitComposer(hooks).abandonToMainMenu()).not.toThrow();
      expect(startMainMenuScene).toHaveBeenCalledOnce();
    });
  });
});
