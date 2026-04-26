import { describe, expect, it, vi } from 'vitest';
import { buildNodePromptDomFocusActions } from './nodePromptDomFocus';
import type { NodePromptOption } from './NodePromptUI';

describe('buildNodePromptDomFocusActions', () => {
  const opts: NodePromptOption[] = [
    { key: 'accept', label: 'Accept', subLabel: '(-5 HP)' },
    { key: 'relic', label: 'Rare curio', subLabel: '(40g)', disabled: true },
    { key: 'reroll', label: 'Reroll token' },
  ];

  it('emits one action per option, plus a Leave action when allowSkip is true', () => {
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions).toHaveLength(opts.length + 1);
    expect(actions[actions.length - 1]?.id).toBe('node-prompt-leave');
  });

  it('omits the Leave action when allowSkip is false', () => {
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: false,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions).toHaveLength(opts.length);
    expect(actions.every((a) => a.id !== 'node-prompt-leave')).toBe(true);
  });

  it('preserves the input option order (Phaser button order = DOM tab order)', () => {
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions[0]?.id).toBe('node-prompt-accept');
    expect(actions[1]?.id).toBe('node-prompt-relic');
    expect(actions[2]?.id).toBe('node-prompt-reroll');
  });

  it('folds subLabel into the accessible label so screen readers hear the trade-off', () => {
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions[0]?.label).toBe('Accept — (-5 HP)');
    expect(actions[1]?.label).toBe('Rare curio — (40g)');
    // No subLabel — the label passes through unchanged.
    expect(actions[2]?.label).toBe('Reroll token');
  });

  it('mirrors the option.disabled flag so the layer can skip locked actions in tab order', () => {
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions[0]?.disabled).toBe(false);
    expect(actions[1]?.disabled).toBe(true);
    expect(actions[2]?.disabled).toBe(false);
  });

  it('routes onActivate to onActivateOption with the matching index', () => {
    const onActivateOption = vi.fn();
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption,
      onActivateLeave: () => undefined,
    });
    actions[0]!.onActivate();
    expect(onActivateOption).toHaveBeenCalledExactlyOnceWith(0);
    actions[2]!.onActivate();
    expect(onActivateOption).toHaveBeenLastCalledWith(2);
  });

  it('routes the Leave action to onActivateLeave', () => {
    const onActivateLeave = vi.fn();
    const actions = buildNodePromptDomFocusActions({
      options: opts,
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave,
    });
    actions[actions.length - 1]!.onActivate();
    expect(onActivateLeave).toHaveBeenCalledOnce();
  });

  it('Leave label resolves through i18n (no leaked keys)', () => {
    const actions = buildNodePromptDomFocusActions({
      options: [],
      allowSkip: true,
      onActivateOption: () => undefined,
      onActivateLeave: () => undefined,
    });
    expect(actions).toHaveLength(1);
    const leave = actions[0]!;
    expect(leave.label.length).toBeGreaterThan(0);
    expect(leave.label.startsWith('nodes.ui')).toBe(false);
  });
});
