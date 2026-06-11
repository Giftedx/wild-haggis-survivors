import { describe, expect, it, vi } from 'vitest';
import {
  buildSettingsDomFocusActions,
  composeSettingsRowLabel,
  type SettingsDomActionInput,
} from './settingsDomFocusActions';

describe('composeSettingsRowLabel', () => {
  it('folds slider value into the label', () => {
    expect(
      composeSettingsRowLabel({
        id: 'master-volume',
        kind: 'slider',
        label: 'Master volume',
        valueText: '80%',
        onActivate: () => undefined,
      }),
    ).toBe('Master volume — 80%');
  });

  it('folds toggle state into the label', () => {
    expect(
      composeSettingsRowLabel({
        id: 'screen-shake',
        kind: 'toggle',
        label: 'Screen shake',
        valueText: 'ON',
        onActivate: () => undefined,
      }),
    ).toBe('Screen shake — ON');
  });

  it('folds cycle current value into the label', () => {
    expect(
      composeSettingsRowLabel({
        id: 'language',
        kind: 'cycle',
        label: 'Language',
        valueText: 'English (Glesga)',
        onActivate: () => undefined,
      }),
    ).toBe('Language — English (Glesga)');
  });

  it('passes launch rows through unchanged (no value to fold)', () => {
    expect(
      composeSettingsRowLabel({
        id: 'rebind',
        kind: 'launch',
        label: 'Input rebind',
        onActivate: () => undefined,
      }),
    ).toBe('Input rebind');
  });

  it('passes through unchanged when valueText is empty / missing', () => {
    expect(
      composeSettingsRowLabel({
        id: 'back',
        kind: 'launch',
        label: 'BACK',
        valueText: '',
        onActivate: () => undefined,
      }),
    ).toBe('BACK');
  });
});

describe('buildSettingsDomFocusActions', () => {
  const inputs: SettingsDomActionInput[] = [
    {
      id: 'master-volume',
      kind: 'slider',
      label: 'Master volume',
      valueText: '80%',
      onActivate: () => undefined,
    },
    {
      id: 'screen-shake',
      kind: 'toggle',
      label: 'Screen shake',
      valueText: 'ON',
      onActivate: () => undefined,
    },
    {
      id: 'language',
      kind: 'cycle',
      label: 'Language',
      valueText: 'English (Glesga)',
      onActivate: () => undefined,
    },
    {
      id: 'rebind',
      kind: 'launch',
      label: 'Input rebind',
      onActivate: () => undefined,
    },
    {
      id: 'back',
      kind: 'launch',
      label: 'BACK',
      onActivate: () => undefined,
    },
  ];

  it('emits one action per input row in canonical order', () => {
    const actions = buildSettingsDomFocusActions(inputs);
    expect(actions).toHaveLength(inputs.length);
    expect(actions.map((a) => a.id)).toEqual([
      'settings-master-volume',
      'settings-screen-shake',
      'settings-language',
      'settings-rebind',
      'settings-back',
    ]);
  });

  it('namespaces action ids with the "settings-" prefix', () => {
    const actions = buildSettingsDomFocusActions(inputs);
    for (const action of actions) {
      expect(action.id.startsWith('settings-')).toBe(true);
    }
  });

  it('folds value text into accessible labels for value-bearing rows', () => {
    const actions = buildSettingsDomFocusActions(inputs);
    expect(actions[0]?.label).toBe('Master volume — 80%');
    expect(actions[1]?.label).toBe('Screen shake — ON');
    expect(actions[2]?.label).toBe('Language — English (Glesga)');
  });

  it('keeps launch row labels untouched', () => {
    const actions = buildSettingsDomFocusActions(inputs);
    expect(actions[3]?.label).toBe('Input rebind');
    expect(actions[4]?.label).toBe('BACK');
  });

  it('routes onActivate to the matching input callback', () => {
    const sliderBump = vi.fn();
    const toggleFlip = vi.fn();
    const cycleStep = vi.fn();
    const launch = vi.fn();
    const actions = buildSettingsDomFocusActions([
      { ...inputs[0]!, onActivate: sliderBump },
      { ...inputs[1]!, onActivate: toggleFlip },
      { ...inputs[2]!, onActivate: cycleStep },
      { ...inputs[3]!, onActivate: launch },
    ]);
    actions[0]!.onActivate();
    actions[1]!.onActivate();
    actions[2]!.onActivate();
    actions[3]!.onActivate();
    expect(sliderBump).toHaveBeenCalledOnce();
    expect(toggleFlip).toHaveBeenCalledOnce();
    expect(cycleStep).toHaveBeenCalledOnce();
    expect(launch).toHaveBeenCalledOnce();
  });

  it('returns an empty array when no rows are supplied', () => {
    expect(buildSettingsDomFocusActions([])).toEqual([]);
  });
});
