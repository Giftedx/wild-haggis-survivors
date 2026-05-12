import { describe, expect, it, vi } from 'vitest';
import { buildAlmanacDomFocusActions } from './almanacDomFocusActions';
import type { AlmanacTabKey } from './almanac/tabNavigation';

describe('buildAlmanacDomFocusActions', () => {
  it('orders tabs then book panel then back', () => {
    const onSelectTab = vi.fn();
    const onBookPanel = vi.fn();
    const onBack = vi.fn();
    const tabs: { key: AlmanacTabKey; label: string }[] = [
      { key: 'beasties', label: 'Beasties' },
      { key: 'weys', label: 'Weys' },
      { key: 'finds', label: 'Finds' },
      { key: 'banter', label: 'Banter' },
    ];
    const actions = buildAlmanacDomFocusActions({
      tabs,
      bookPanelLabel: 'Browse the codex',
      onSelectTab,
      onBookPanel,
      onBack,
    });
    expect(actions.length).toBe(6);
    expect(actions[0]?.id).toBe('almanac-tab-beasties');
    expect(actions[1]?.id).toBe('almanac-tab-weys');
    expect(actions[2]?.id).toBe('almanac-tab-finds');
    expect(actions[3]?.id).toBe('almanac-tab-banter');
    expect(actions[4]?.id).toBe('almanac-book-panel');
    expect(actions[5]?.id).toBe('almanac-back');
    actions[2]?.onActivate();
    expect(onSelectTab).toHaveBeenCalledExactlyOnceWith('finds');
    actions[4]?.onActivate();
    expect(onBookPanel).toHaveBeenCalledOnce();
    actions[5]?.onActivate();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('emits non-empty labels without raw ui. key leaks on tab labels', () => {
    const actions = buildAlmanacDomFocusActions({
      tabs: [{ key: 'beasties', label: 'Cull Codex' }],
      bookPanelLabel: 'Panel',
      onSelectTab: () => undefined,
      onBookPanel: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.label.startsWith('ui.almanac.tab_')).toBe(false);
    }
  });
});
