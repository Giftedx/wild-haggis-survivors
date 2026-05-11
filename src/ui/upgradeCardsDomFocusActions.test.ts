import { describe, expect, it, vi } from 'vitest';
import { buildUpgradeCardsDomFocusActions } from './upgradeCardsDomFocusActions';
import type { UpgradeCard } from '../data/upgrades';

const sampleCard = (id: string): UpgradeCard => ({
  id,
  name: 'upgradeCard.add_bagpipes.name',
  description: 'upgradeCard.add_bagpipes.description',
  rarity: 'uncommon',
  icon: 'wicon_bagpipes',
  effect: { type: 'add_weapon', weaponKey: 'bagpipes' },
});

describe('buildUpgradeCardsDomFocusActions', () => {
  it('emits one action per card in order', () => {
    const cards = [sampleCard('a'), sampleCard('b')];
    const actions = buildUpgradeCardsDomFocusActions({
      cards,
      rerollVisible: false,
      rerollLabel: '',
      onPickIndex: () => undefined,
      onReroll: null,
    });
    expect(actions).toHaveLength(2);
    expect(actions[0]?.id).toBe('levelup-card-0');
    expect(actions[1]?.id).toBe('levelup-card-1');
  });

  it('appends reroll when visible with callback', () => {
    const onReroll = vi.fn();
    const actions = buildUpgradeCardsDomFocusActions({
      cards: [sampleCard('x')],
      rerollVisible: true,
      rerollLabel: 'Reroll once',
      onPickIndex: () => undefined,
      onReroll,
    });
    expect(actions[actions.length - 1]?.id).toBe('levelup-reroll');
    actions[actions.length - 1]?.onActivate();
    expect(onReroll).toHaveBeenCalledOnce();
  });

  it('omits reroll when not visible', () => {
    const actions = buildUpgradeCardsDomFocusActions({
      cards: [sampleCard('x')],
      rerollVisible: false,
      rerollLabel: 'ignored',
      onPickIndex: () => undefined,
      onReroll: vi.fn(),
    });
    expect(actions.find((a) => a.id === 'levelup-reroll')).toBeUndefined();
  });

  it('routes onPickIndex', () => {
    const onPickIndex = vi.fn();
    const actions = buildUpgradeCardsDomFocusActions({
      cards: [sampleCard('a'), sampleCard('b')],
      rerollVisible: false,
      rerollLabel: '',
      onPickIndex,
      onReroll: null,
    });
    actions[1]?.onActivate();
    expect(onPickIndex).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('labels resolve without raw upgradeCard. / ui. key leaks', () => {
    const actions = buildUpgradeCardsDomFocusActions({
      cards: [sampleCard('z')],
      rerollVisible: true,
      rerollLabel: 'Reroll',
      onPickIndex: () => undefined,
      onReroll: () => undefined,
    });
    for (const a of actions) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.label.startsWith('upgradeCard.')).toBe(false);
      expect(a.label.startsWith('ui.common.rarity.')).toBe(false);
    }
  });
});
