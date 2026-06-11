import type { RunModifiers } from '../../core/RunModifiers';
import { getActiveSeasonalEventKey } from '../../systems/SeasonalEventManager';
import {
  applyFirstFootingToModifiers,
  rollFirstFootingGift,
} from '../../systems/firstFooting';
import { applyBeltaneBlessing } from '../../systems/beltaneBlessing';
import { applySamhainVeil } from '../../systems/samhainVeil';
import { applyStAndrewsBlessing } from '../../systems/standrewsBlessing';
import { applyBurnsNightBlessing } from '../../systems/burnsNightBlessing';
import { applyImbolcBlessing } from '../../systems/imbolcBlessing';
import { applyLammasBlessing } from '../../systems/lammasBlessing';
import { applyBrackenTurnBlessing } from '../../systems/brackenTurnBlessing';
import { applyBannockburnBlessing } from '../../systems/bannockburnBlessing';
import { applyGloriousTwelfthBlessing } from '../../systems/gloriousTwelfthBlessing';
import { applyTartanDayBlessing } from '../../systems/tartanDayBlessing';
import { applySimmerDimBlessing } from '../../systems/simmerDimBlessing';
import { applyUpHellyAaBlessing } from '../../systems/upHellyAaBlessing';
import { applyCullodenMemorial } from '../../systems/cullodenMemorial';
import { applyHighlandGamesBlessing } from '../../systems/highlandGamesBlessing';
import type { RNG } from '../../utils/rng';

const SEASONAL_TOAST_DELAY_MS = 1500;

export interface SeasonalRunStartToast {
  readonly key: string;
  readonly color: string;
  readonly delayMs: number;
}

export interface SeasonalRunStartPlan {
  readonly seasonalEventKey: string | null;
  readonly toast: SeasonalRunStartToast | null;
  readonly extraStartingHpHeal: number;
  readonly extraXpMultiplier: number;
  readonly extraCritChance: number;
  readonly extraLifesteal: number;
  readonly extraAoeMultiplier: number;
  readonly extraPickupRadius: number;
  readonly extraCritDamageMultiplier: number;
  readonly extraDamageMultiplier: number;
  /** Additive max-HP bonus applied via Player.addMaxHp. First used by highland_games. */
  readonly extraMaxHp: number;
}

export interface SeasonalRunStartDeps {
  readonly resumeRun: boolean;
  readonly disableSeasonalEvents: boolean;
  readonly now: Date;
  readonly runRng: RNG;
  readonly runModifiers: RunModifiers;
}

export interface SeasonalRunStartPostSpawnDeps {
  readonly heal: (amount: number) => void;
  readonly addXpMultiplier: (amount: number) => void;
  readonly addCritChance: (amount: number) => void;
  readonly addLifesteal: (amount: number) => void;
  readonly addAoeMultiplier: (amount: number) => void;
  readonly addPickupRadius: (amount: number) => void;
  readonly addCritDamageMultiplier: (amount: number) => void;
  readonly addDamageMultiplier: (amount: number) => void;
  readonly addMaxHp: (amount: number) => void;
  readonly showToastAfter: (delayMs: number, key: string, color: string) => void;
}

function toast(key: string, color: string): SeasonalRunStartToast {
  return { key, color, delayMs: SEASONAL_TOAST_DELAY_MS };
}

function inertPlan(seasonalEventKey: string | null = null): SeasonalRunStartPlan {
  return {
    seasonalEventKey,
    toast: null,
    extraStartingHpHeal: 0,
    extraXpMultiplier: 0,
    extraCritChance: 0,
    extraLifesteal: 0,
    extraAoeMultiplier: 0,
    extraPickupRadius: 0,
    extraCritDamageMultiplier: 0,
    extraDamageMultiplier: 0,
    extraMaxHp: 0,
  };
}

/**
 * Builds the run-start seasonal plan and applies any run-modifier
 * deltas immediately, before systems cache the modifier bag.
 */
export function buildSeasonalRunStartPlan(deps: SeasonalRunStartDeps): SeasonalRunStartPlan {
  const seasonalEventKey = deps.resumeRun
    ? null
    : getActiveSeasonalEventKey(deps.now, deps.disableSeasonalEvents);

  if (seasonalEventKey === null) return inertPlan();

  const firstFootingGift = deps.resumeRun
    ? null
    : rollFirstFootingGift(deps.runRng, seasonalEventKey);
  const firstFootingResult = applyFirstFootingToModifiers(
    firstFootingGift,
    deps.runModifiers,
  );
  if (firstFootingResult.gift) {
    return {
      seasonalEventKey,
      toast: toast(`ui.firstFooting.toast.${firstFootingResult.gift}`, '#f0d090'),
      extraStartingHpHeal: firstFootingResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const beltaneResult = applyBeltaneBlessing(seasonalEventKey, deps.runModifiers);
  if (beltaneResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.beltane.blessing_toast', '#f0a060'),
      extraStartingHpHeal: beltaneResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const samhainResult = applySamhainVeil(seasonalEventKey, deps.runModifiers);
  if (samhainResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.samhain.blessing_toast', '#a060c0'),
      extraStartingHpHeal: samhainResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const standrewsResult = applyStAndrewsBlessing(seasonalEventKey, deps.runModifiers);
  if (standrewsResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.standrews.blessing_toast', '#5a8acc'),
      extraStartingHpHeal: standrewsResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const burnsResult = applyBurnsNightBlessing(seasonalEventKey, deps.runModifiers);
  if (burnsResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.burnsNight.blessing_toast', '#c89060'),
      extraStartingHpHeal: burnsResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const imbolcResult = applyImbolcBlessing(seasonalEventKey, deps.runModifiers);
  if (imbolcResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.imbolc.blessing_toast', '#f5e7b8'),
      extraStartingHpHeal: imbolcResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const lammasResult = applyLammasBlessing(seasonalEventKey, deps.runModifiers);
  if (lammasResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.lammas.blessing_toast', '#d4a040'),
      extraStartingHpHeal: lammasResult.extraStartingHpHeal,
      extraXpMultiplier: lammasResult.extraXpMultiplier,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const brackenResult = applyBrackenTurnBlessing(seasonalEventKey, deps.runModifiers);
  if (brackenResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.brackenTurn.blessing_toast', '#b87038'),
      extraStartingHpHeal: brackenResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: brackenResult.extraCritChance,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const bannockburnResult = applyBannockburnBlessing(seasonalEventKey, deps.runModifiers);
  if (bannockburnResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.bannockburn.blessing_toast', '#a8c0d0'),
      extraStartingHpHeal: bannockburnResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: bannockburnResult.extraLifesteal,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const gloriousTwelfthResult = applyGloriousTwelfthBlessing(seasonalEventKey, deps.runModifiers);
  if (gloriousTwelfthResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.gloriousTwelfth.blessing_toast', '#9c8838'),
      extraStartingHpHeal: gloriousTwelfthResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: gloriousTwelfthResult.extraAoeMultiplier,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const tartanDayResult = applyTartanDayBlessing(seasonalEventKey, deps.runModifiers);
  if (tartanDayResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.tartanDay.blessing_toast', '#b04050'),
      extraStartingHpHeal: tartanDayResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: tartanDayResult.extraPickupRadius,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const simmerDimResult = applySimmerDimBlessing(seasonalEventKey, deps.runModifiers);
  if (simmerDimResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.simmerDim.blessing_toast', '#9080c0'),
      extraStartingHpHeal: simmerDimResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: simmerDimResult.extraCritDamageMultiplier,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const upHellyAaResult = applyUpHellyAaBlessing(seasonalEventKey, deps.runModifiers);
  if (upHellyAaResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.upHellyAa.blessing_toast', '#e07840'),
      extraStartingHpHeal: upHellyAaResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: upHellyAaResult.extraDamageMultiplier,
      extraMaxHp: 0,
    };
  }

  const cullodenResult = applyCullodenMemorial(seasonalEventKey, deps.runModifiers);
  if (cullodenResult.applied) {
    // Slate-grey toast — grave register, no buff, no fanfare.
    return {
      seasonalEventKey,
      toast: toast('ui.culloden.memorial_toast', '#708090'),
      extraStartingHpHeal: 0,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: 0,
    };
  }

  const highlandGamesResult = applyHighlandGamesBlessing(seasonalEventKey, deps.runModifiers);
  if (highlandGamesResult.applied) {
    return {
      seasonalEventKey,
      toast: toast('ui.highlandGames.blessing_toast', '#d4a820'),
      extraStartingHpHeal: highlandGamesResult.extraStartingHpHeal,
      extraXpMultiplier: 0,
      extraCritChance: 0,
      extraLifesteal: 0,
      extraAoeMultiplier: 0,
      extraPickupRadius: 0,
      extraCritDamageMultiplier: 0,
      extraDamageMultiplier: 0,
      extraMaxHp: highlandGamesResult.extraMaxHp,
    };
  }

  return inertPlan(seasonalEventKey);
}

export function applySeasonalRunStartPostSpawn(
  plan: SeasonalRunStartPlan,
  deps: SeasonalRunStartPostSpawnDeps,
): void {
  if (plan.extraStartingHpHeal > 0) {
    deps.heal(plan.extraStartingHpHeal);
  }
  if (plan.extraXpMultiplier > 0) {
    deps.addXpMultiplier(plan.extraXpMultiplier);
  }
  if (plan.extraCritChance > 0) {
    deps.addCritChance(plan.extraCritChance);
  }
  if (plan.extraLifesteal > 0) {
    deps.addLifesteal(plan.extraLifesteal);
  }
  if (plan.extraAoeMultiplier > 0) {
    deps.addAoeMultiplier(plan.extraAoeMultiplier);
  }
  if (plan.extraPickupRadius > 0) {
    deps.addPickupRadius(plan.extraPickupRadius);
  }
  if (plan.extraCritDamageMultiplier > 0) {
    deps.addCritDamageMultiplier(plan.extraCritDamageMultiplier);
  }
  if (plan.extraDamageMultiplier > 0) {
    deps.addDamageMultiplier(plan.extraDamageMultiplier);
  }
  if (plan.extraMaxHp > 0) {
    deps.addMaxHp(plan.extraMaxHp);
  }
  if (plan.toast) {
    deps.showToastAfter(plan.toast.delayMs, plan.toast.key, plan.toast.color);
  }
}
