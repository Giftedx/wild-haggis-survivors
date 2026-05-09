import { describe, expect, it, vi } from 'vitest';
import { buildSporranDomFocusActions } from './sporranDomFocusActions';
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import { SPORRAN_PICK_COUNT } from '../systems/sporranDeck';

const HAND = ALL_SPORRAN_CARDS.slice(0, 7);

describe('buildSporranDomFocusActions', () => {
  it('emits one action per drawn card plus confirm and back', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions).toHaveLength(HAND.length + 2);
  });

  it('orders card actions before confirm and back last', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    for (let i = 0; i < HAND.length; i++) {
      expect(actions[i]?.id).toBe(`sporran-card-${i}`);
    }
    expect(actions[HAND.length]?.id).toBe('sporran-confirm');
    expect(actions[HAND.length + 1]?.id).toBe('sporran-back');
  });

  it('routes card onActivate to onTogglePick with the matching card index', () => {
    const onTogglePick = vi.fn();
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    actions[0]!.onActivate();
    expect(onTogglePick).toHaveBeenCalledExactlyOnceWith(0);
    actions[3]!.onActivate();
    expect(onTogglePick).toHaveBeenLastCalledWith(3);
  });

  it('routes confirm onActivate to onConfirm', () => {
    const onConfirm = vi.fn();
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([0, 1, 2]),
      onTogglePick: () => undefined,
      onConfirm,
      onBack: () => undefined,
    });
    actions[HAND.length]!.onActivate();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('routes back onActivate to onBack', () => {
    const onBack = vi.fn();
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack,
    });
    actions[HAND.length + 1]!.onActivate();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('unpicked card label opens with the KEEP verb', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[0]!.label.startsWith('KEEP')).toBe(true);
  });

  it('picked card label flips the verb to DROP', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([2]),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[2]!.label.startsWith('DROP')).toBe(true);
    expect(actions[0]!.label.startsWith('KEEP')).toBe(true);
  });

  it('disables unpicked card actions when the player has hit the pick cap', () => {
    const full = new Set([0, 1, 2]);
    expect(full.size).toBe(SPORRAN_PICK_COUNT);
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: full,
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[0]!.disabled).toBeFalsy();
    expect(actions[1]!.disabled).toBeFalsy();
    expect(actions[2]!.disabled).toBeFalsy();
    expect(actions[3]!.disabled).toBe(true);
    expect(actions[6]!.disabled).toBe(true);
  });

  it('confirm action is disabled while picks are incomplete', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([0]),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[HAND.length]!.disabled).toBe(true);
  });

  it('confirm action is enabled once picks are complete', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([0, 1, 2]),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[HAND.length]!.disabled).toBeFalsy();
  });

  it('confirm label reflects remaining picks while disabled', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([0]),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    expect(actions[HAND.length]!.label).toContain('2');
  });

  it('emits non-empty resolved labels — i18n keys must not leak through', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set([0]),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('sporran.')).toBe(false);
      expect(action.label.startsWith('curse.')).toBe(false);
    }
  });

  it('card label includes the kind so assistive tech hears curse vs boon vs quirk', () => {
    const actions = buildSporranDomFocusActions({
      drawnHand: HAND,
      pickedIndices: new Set(),
      onTogglePick: () => undefined,
      onConfirm: () => undefined,
      onBack: () => undefined,
    });
    for (let i = 0; i < HAND.length; i++) {
      const card = HAND[i]!;
      const expectedKind = card.kind === 'curse' ? 'CURSE' : card.kind === 'boon' ? 'BOON' : 'QUIRK';
      expect(actions[i]!.label).toContain(expectedKind);
    }
  });
});
