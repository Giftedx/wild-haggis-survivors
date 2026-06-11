import { describe, expect, it } from 'vitest';
import {
  applyAssistModePreset,
  cycleAssistModePreset,
  labelForAssistModePreset,
  resolveAssistModePreset,
} from './settingsAssistMode';

const base = {
  assistMode: false,
  assistModeGameSpeed: 0.5,
  assistModeExtendedIFrames: true,
  assistModeExtendedComboWindow: true,
  assistModeInvincibility: true,
};

describe('settings Assist Mode preset row', () => {
  it('treats master-off settings as off even when hidden sub-fields are true', () => {
    expect(resolveAssistModePreset(base)).toBe('off');
  });

  it('cycles only through wired presets and resets hidden game speed to neutral', () => {
    const timing = cycleAssistModePreset(base);
    expect(resolveAssistModePreset(timing)).toBe('timing');
    expect(timing.assistMode).toBe(true);
    expect(timing.assistModeGameSpeed).toBe(1);
    expect(timing.assistModeExtendedIFrames).toBe(true);
    expect(timing.assistModeExtendedComboWindow).toBe(true);
    expect(timing.assistModeInvincibility).toBe(false);

    const invincible = cycleAssistModePreset(timing);
    expect(resolveAssistModePreset(invincible)).toBe('invincible');
    expect(invincible.assistModeGameSpeed).toBe(1);
    expect(invincible.assistModeExtendedIFrames).toBe(false);
    expect(invincible.assistModeExtendedComboWindow).toBe(false);
    expect(invincible.assistModeInvincibility).toBe(true);

    const off = cycleAssistModePreset(invincible);
    expect(resolveAssistModePreset(off)).toBe('off');
    expect(off.assistMode).toBe(false);
    expect(off.assistModeGameSpeed).toBe(1);
    expect(off.assistModeExtendedIFrames).toBe(false);
    expect(off.assistModeExtendedComboWindow).toBe(false);
    expect(off.assistModeInvincibility).toBe(false);
  });

  it('labels every visible preset', () => {
    for (const preset of ['off', 'timing', 'invincible'] as const) {
      expect(labelForAssistModePreset(preset)).not.toContain('ui.settings');
      expect(labelForAssistModePreset(preset).length).toBeGreaterThan(0);
    }
  });

  it('applies a requested preset directly', () => {
    expect(resolveAssistModePreset(applyAssistModePreset(base, 'invincible'))).toBe('invincible');
  });
});
