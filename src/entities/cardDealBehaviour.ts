/**
 * Pure state machine for Earl Beardie's `'card_deal'` behaviour.
 *
 * Earl Beardie — the 15th-century Earl of Crawford whose ghost plays
 * cards eternally in a sealed room at Glamis Castle, having wagered
 * his soul to the Devil on a Sunday. He fires fans of spectral playing
 * cards at the player every 3.5 seconds (the cadence of a slow,
 * deliberate card deal from across the table).
 *
 * Pattern matches `wailBehaviour.ts` — Enemy class composes this each
 * frame; the output `shouldDeal` flag drives `Enemy.fireCardFan()`.
 *
 * Ref: `SCOTTISH_RESEARCH.md` §1.4 (Earl Beardie / devil-as-auditor).
 */
export const CARD_DEAL_CADENCE_MS = 3500;
export const CARD_DEAL_FAN_COUNT = 3;
export const CARD_DEAL_SPREAD_RAD = 0.35; // ~20° between cards
export const CARD_DEAL_SPEED = 200;       // px/s — deliberate, not frantic
export const CARD_DEAL_DAMAGE = 22;
export const CARD_DEAL_RANGE_MS = 2000;   // auto-cleanup after 2 s if miss

export interface CardDealState {
  readonly msSinceLastDeal: number;
  readonly shouldDeal?: boolean;
}

export interface CardDealTickInput {
  readonly deltaMs: number;
}

export function initialCardDealState(): CardDealState {
  return { msSinceLastDeal: 0 };
}

export function simulateCardDealBehaviour(
  prev: CardDealState,
  input: CardDealTickInput,
): CardDealState {
  const acc = prev.msSinceLastDeal + input.deltaMs;
  const shouldDeal = acc >= CARD_DEAL_CADENCE_MS;
  return {
    msSinceLastDeal: shouldDeal ? 0 : acc,
    shouldDeal,
  };
}
