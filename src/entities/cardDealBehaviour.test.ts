import { describe, expect, it } from 'vitest';
import {
  simulateCardDealBehaviour,
  initialCardDealState,
  CARD_DEAL_CADENCE_MS,
  CARD_DEAL_FAN_COUNT,
  CARD_DEAL_SPREAD_RAD,
  CARD_DEAL_DAMAGE,
} from './cardDealBehaviour';

describe('simulateCardDealBehaviour', () => {
  it('does not deal before cadence elapses', () => {
    let state = initialCardDealState();
    state = simulateCardDealBehaviour(state, { deltaMs: 100 });
    expect(state.shouldDeal).toBeFalsy();
  });

  it('deals when cadence elapses', () => {
    let state = initialCardDealState();
    state = simulateCardDealBehaviour(state, { deltaMs: CARD_DEAL_CADENCE_MS });
    expect(state.shouldDeal).toBe(true);
  });

  it('resets accumulator after deal so next deal needs full cadence', () => {
    let state = initialCardDealState();
    state = simulateCardDealBehaviour(state, { deltaMs: CARD_DEAL_CADENCE_MS });
    expect(state.shouldDeal).toBe(true);
    state = simulateCardDealBehaviour(state, { deltaMs: 100 });
    expect(state.shouldDeal).toBeFalsy();
    expect(state.msSinceLastDeal).toBe(100);
  });

  it('accumulates partial ticks toward next deal', () => {
    let state = initialCardDealState();
    state = simulateCardDealBehaviour(state, { deltaMs: CARD_DEAL_CADENCE_MS / 2 });
    expect(state.shouldDeal).toBeFalsy();
    state = simulateCardDealBehaviour(state, { deltaMs: CARD_DEAL_CADENCE_MS / 2 });
    expect(state.shouldDeal).toBe(true);
  });

  it('constants are sensible', () => {
    expect(CARD_DEAL_CADENCE_MS).toBe(3500);
    expect(CARD_DEAL_FAN_COUNT).toBe(3);
    expect(CARD_DEAL_SPREAD_RAD).toBeCloseTo(0.35, 2);
    expect(CARD_DEAL_DAMAGE).toBe(22);
  });
});
