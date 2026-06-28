import { describe, expect, it, vi } from 'vitest';
import { createRuneEffectBag } from '../../systems/runes/runeEffects';
import { TempBuffBag } from '../../systems/TempBuffBag';
import { RuneConditionSystem } from '../../systems/RuneConditionSystem';
import { RUNES } from '../../data/runes';
import { RuneSystemController, type RuneSystemControllerHooks } from './runeSystemController';
import type { RNG } from '../../utils/rng';

function firstPickRng(): RNG {
  return {
    seed: 1,
    next: () => 0,
    int: (min: number) => min,
    float: (min: number) => min,
    bool: () => true,
    pick: <T,>(arr: readonly T[]) => arr[0]!,
    weighted: <T,>(items: readonly T[]) => items[0]!,
    branch: () => firstPickRng(),
  };
}

function makeHooks() {
  const runeBag = createRuneEffectBag();
  const tempBuffBag = new TempBuffBag();
  const player = {
    x: 100,
    y: 120,
    damage: 0,
    healed: 0,
    getMaxHp: () => 100,
    getMaxHpBase: () => 100,
    getHp: () => 80,
    isInSlick: () => false,
    isInFog: () => false,
    heal: vi.fn(),
    addDamageMultiplier: vi.fn(),
    addSpeed: vi.fn(),
    addArmor: vi.fn(),
    addCritChance: vi.fn(),
    addPickupRadius: vi.fn(),
  };
  player.heal.mockImplementation((amount: number) => { player.healed += amount; });
  player.addDamageMultiplier.mockImplementation((amount: number) => { player.damage += amount; });
  const runScore = {
    addCoinGold: vi.fn(),
    setGoldGainMultiplier: vi.fn(),
  };
  const juice = {
    showToast: vi.fn(),
    flashWhite: vi.fn(),
    getComboCount: vi.fn(() => 0),
  };
  const spawnSystem = {
    getEnemyGroup: () => ({ getChildren: () => [] }),
    setRuneEnemySlowMul: vi.fn(),
    getGameTimeSec: vi.fn(() => 0),
  };
  const hooks = {
    getPlayer: () => player,
    getJuice: () => juice,
    getSpawnSystem: () => spawnSystem,
    getWeaponSystem: () => ({ getWeapons: () => [] }),
    getXPSystem: () => ({ spawnGem: vi.fn() }),
    getRunScore: () => runScore,
    getRunActState: () => ({ currentAct: 1, currentNodeIndex: 0 }),
    getRuneBag: () => runeBag,
    getRuneSystem: () => ({ activeCount: () => 1, tick: vi.fn() }),
    getRunePulseRng: () => firstPickRng(),
    getTempBuffBag: () => tempBuffBag,
    currentBiomeAtPlayer: () => null,
    getRelicHeldCount: () => 0,
    getEvolvedWeaponsCount: () => 0,
    getChestRegistry: () => ({ getMarkers: () => [] }),
    getUpgradeUI: () => null,
    getBanter: () => null,
    getTimeNowMs: () => 0,
    setBurnsPlatterPickedUpAtMs: vi.fn(),
  } as unknown as RuneSystemControllerHooks;
  return { hooks, runeBag, tempBuffBag, player, runScore, juice };
}

describe('RuneSystemController', () => {
  it('routes shrine_buff_grant through a real timed shrine buff', () => {
    const { hooks, runeBag, tempBuffBag, player, runScore, juice } = makeHooks();
    runeBag.pendingShrineBuffs = 1;

    new RuneSystemController(hooks).applyPulses();

    expect(tempBuffBag.activeCount()).toBe(1);
    expect(tempBuffBag.snapshot()[0]?.key).toBe('buff_damage');
    expect(player.damage).toBeCloseTo(0.25);
    expect(player.heal).not.toHaveBeenCalled();
    expect(runScore.addCoinGold).not.toHaveBeenCalled();
    expect(juice.showToast).toHaveBeenCalledTimes(1);

    tempBuffBag.tick(60_001);
    expect(tempBuffBag.activeCount()).toBe(0);
    expect(player.damage).toBeCloseTo(0);
  });

  it('turns a named elite kill edge into a Laird Rune shrine buff', () => {
    const { hooks, runeBag, tempBuffBag } = makeHooks();
    const runeSystem = new RuneConditionSystem(runeBag);
    runeSystem.addRune(RUNES.lairds_rune);
    const controller = new RuneSystemController({
      ...hooks,
      getRuneSystem: () => runeSystem,
    });

    controller.noteNamedEliteKilled();
    controller.tick(16);

    expect(tempBuffBag.activeCount()).toBe(1);
    expect(tempBuffBag.snapshot()[0]?.key).toBe('buff_damage');
  });

  it('does not collapse consecutive Laird Rune elite-kill pulses', () => {
    const { hooks, runeBag, tempBuffBag } = makeHooks();
    const runeSystem = new RuneConditionSystem(runeBag);
    runeSystem.addRune(RUNES.lairds_rune);
    const controller = new RuneSystemController({
      ...hooks,
      getRuneSystem: () => runeSystem,
    });

    controller.noteNamedEliteKilled();
    controller.tick(16);
    controller.noteNamedEliteKilled();
    controller.tick(16);

    expect(tempBuffBag.activeCount()).toBe(2);
    expect(tempBuffBag.snapshot().map((entry) => entry.key)).toEqual(['buff_damage', 'buff_damage']);
  });
});
