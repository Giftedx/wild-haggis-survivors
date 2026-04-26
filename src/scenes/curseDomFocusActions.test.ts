import { describe, expect, it, vi } from 'vitest';
import { buildCurseDomFocusActions } from './curseDomFocusActions';
import { CURSES } from '../data/curses';

describe('buildCurseDomFocusActions', () => {
  it('emits one action per curse plus a clean-run action plus a back action', () => {
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean: () => undefined,
      onBack: () => undefined,
    });
    expect(actions).toHaveLength(CURSES.length + 2);
  });

  it('orders curse actions before clean-run, and back action last', () => {
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean: () => undefined,
      onBack: () => undefined,
    });
    for (let i = 0; i < CURSES.length; i++) {
      expect(actions[i]?.id).toBe(`curse-${CURSES[i]!.key}`);
    }
    expect(actions[CURSES.length]?.id).toBe('curse-clean-run');
    expect(actions[CURSES.length + 1]?.id).toBe('curse-back');
  });

  it('routes onActivate to onPickCurse with the matching key', () => {
    const onPickCurse = vi.fn();
    const actions = buildCurseDomFocusActions({
      onPickCurse,
      onPickClean: () => undefined,
      onBack: () => undefined,
    });
    actions[0]!.onActivate();
    expect(onPickCurse).toHaveBeenCalledExactlyOnceWith(CURSES[0]!.key);
    actions[CURSES.length - 1]!.onActivate();
    expect(onPickCurse).toHaveBeenLastCalledWith(CURSES[CURSES.length - 1]!.key);
  });

  it('routes the clean-run action to onPickClean', () => {
    const onPickClean = vi.fn();
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean,
      onBack: () => undefined,
    });
    actions[CURSES.length]!.onActivate();
    expect(onPickClean).toHaveBeenCalledOnce();
  });

  it('routes the back action to onBack', () => {
    const onBack = vi.fn();
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean: () => undefined,
      onBack,
    });
    actions[CURSES.length + 1]!.onActivate();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('emits non-empty resolved labels — keys must not leak through to assistive tech', () => {
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean: () => undefined,
      onBack: () => undefined,
    });
    for (const action of actions) {
      expect(action.label.length).toBeGreaterThan(0);
      // Curse copy resolved through `t()` should not still contain the
      // dot-path separator that would mark an unresolved key.
      expect(action.label.startsWith('ui.curseScene')).toBe(false);
      expect(action.label.startsWith('curse.')).toBe(false);
    }
  });

  it('curse labels include the gold-bonus chip text so screen-reader users hear the trade-off', () => {
    const actions = buildCurseDomFocusActions({
      onPickCurse: () => undefined,
      onPickClean: () => undefined,
      onBack: () => undefined,
    });
    for (let i = 0; i < CURSES.length; i++) {
      const label = actions[i]!.label;
      expect(label).toContain(`${CURSES[i]!.goldBonusPct}`);
    }
  });
});
