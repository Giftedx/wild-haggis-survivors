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
  if (plan.toast) {
    deps.showToastAfter(plan.toast.delayMs, plan.toast.key, plan.toast.color);
  }
}
