/**
 * Pure-function effect implementations for common relics (R1 M1 T6-9).
 *
 * These helpers are Phaser-agnostic — callers pass numeric or state inputs
 * and receive transformed outputs. No side effects, no randomness, no
 * wall-clock reads. M3 wires them into the runtime via RelicInventory /
 * event handlers.
 *
 * Spec: docs/superpowers/specs/r1-relics.md §3 (common pool).
 */

/**
 * sporran_of_holding — +2 gold per pickup collected.
 */
export function applySporranOfHolding(goldFromPickup: number): number {
  return goldFromPickup + 2;
}

/**
 * oatcake_stash — Heal 2 HP when entering a healing circle.
 * Caller passes the base heal amount and receives the boosted value.
 */
export function applyOatcakeHealOnCircleEntry(healAmount: number): number {
  return healAmount + 2;
}

/**
 * grans_thimble — Critical hits deal +8% damage.
 * Caller passes the current crit multiplier (e.g. 2× base) and receives
 * the scaled value. Applied to the multiplier, not the raw damage, so the
 * bonus scales with other crit buffs.
 */
export function applyGransThimbleCritBonus(critMultiplier: number): number {
  return critMultiplier * 1.08;
}

/**
 * lucky_heather_sprig — +3% luck (card-draw rarity bias).
 * Additive with existing luck. Callers are responsible for any upper
 * clamp — the helper applies the delta unconditionally.
 */
export function applyLuckyHeatherSprigLuck(luck: number): number {
  return luck + 0.03;
}

/**
 * bronze_clasp — First hit each second deals +15% damage.
 *
 * State is threaded explicitly so the helper stays pure. A hit fires the
 * bonus iff at least 1000ms have passed since the previous bonus-triggering
 * hit; on a successful fire the helper returns a new state with the
 * current timestamp. Within the 1s window the input state is returned
 * unchanged (reference-equal) and base damage passes through.
 */
export interface BronzeClaspState {
  readonly lastHitTime: number; // ms; Number.NEGATIVE_INFINITY means "no hits yet".
}

export interface BronzeClaspResult {
  readonly damage: number;
  readonly state: BronzeClaspState;
}

export const initialBronzeClaspState: BronzeClaspState = Object.freeze({
  lastHitTime: Number.NEGATIVE_INFINITY,
});

export function applyBronzeClaspFirstHit(
  baseDamage: number,
  now: number,
  state: BronzeClaspState,
): BronzeClaspResult {
  const bonusActive = now - state.lastHitTime >= 1000;
  return {
    damage: bonusActive ? baseDamage * 1.15 : baseDamage,
    state: bonusActive ? { lastHitTime: now } : state,
  };
}

/**
 * ceilidh_dancers_ribbon — Pickup-chain bonus activates at 5 in a row
 * (default would otherwise be 8). Helper overrides whatever default the
 * caller supplies to the relic-dictated constant, so the call-site reads:
 *
 *   const threshold = hasRibbon
 *     ? applyCeilidhDancersRibbonThreshold(DEFAULT_CHAIN_THRESHOLD)
 *     : DEFAULT_CHAIN_THRESHOLD;
 */
export const CEILIDH_DANCERS_RIBBON_PICKUP_CHAIN_THRESHOLD = 5;

export function applyCeilidhDancersRibbonThreshold(_defaultThreshold: number): number {
  return CEILIDH_DANCERS_RIBBON_PICKUP_CHAIN_THRESHOLD;
}

/**
 * damp_tinder — Fire hazards deal 40% less damage to the haggis.
 * Multiplies incoming fire damage by 0.6.
 */
export function applyDampTinderFireReduction(fireDamage: number): number {
  return fireDamage * 0.6;
}

/**
 * whisky_dram — Once per run, regain 20% max HP instantly (activated via
 * sporran menu). State tracks whether the one-shot has been spent; a
 * second call is a no-op that returns reference-equal state.
 */
export interface WhiskyDramState {
  readonly used: boolean;
}

export interface WhiskyDramResult {
  readonly hp: number;
  readonly state: WhiskyDramState;
}

export const initialWhiskyDramState: WhiskyDramState = Object.freeze({
  used: false,
});

export function applyWhiskyDramActivation(
  currentHp: number,
  maxHp: number,
  state: WhiskyDramState,
): WhiskyDramResult {
  if (state.used) {
    return { hp: currentHp, state };
  }
  const healed = Math.min(maxHp, currentHp + maxHp * 0.2);
  return { hp: healed, state: { used: true } };
}
