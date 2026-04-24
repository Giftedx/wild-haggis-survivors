import { describe, it, expect, beforeEach } from 'vitest';
import {
  isAssistModeEnabled,
  getAssistModeGameSpeed,
  isExtendedIFramesEnabled,
  isExtendedComboWindowEnabled,
  isInvincibilityEnabled,
} from './AssistMode';
import {
  getSettingsManager,
  resetSettingsManagerSingletonForTests,
} from '../../core/SettingsManager';

describe('AssistMode readers', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
    getSettingsManager().reset();
  });

  describe('with Assist Mode master OFF (default)', () => {
    it('isAssistModeEnabled returns false', () => {
      expect(isAssistModeEnabled()).toBe(false);
    });

    it('getAssistModeGameSpeed returns 1 even if sub-setting is persisted', () => {
      getSettingsManager().update((cur) => ({ ...cur, assistModeGameSpeed: 0.6 }));
      expect(getAssistModeGameSpeed()).toBe(1);
    });

    it('sub-effect readers return false when master is off, even if each flag persists true', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        assistModeExtendedIFrames: true,
        assistModeExtendedComboWindow: true,
        assistModeInvincibility: true,
      }));
      expect(isExtendedIFramesEnabled()).toBe(false);
      expect(isExtendedComboWindowEnabled()).toBe(false);
      expect(isInvincibilityEnabled()).toBe(false);
    });
  });

  describe('with Assist Mode master ON', () => {
    beforeEach(() => {
      getSettingsManager().update((cur) => ({ ...cur, assistMode: true }));
    });

    it('isAssistModeEnabled returns true', () => {
      expect(isAssistModeEnabled()).toBe(true);
    });

    it('getAssistModeGameSpeed returns the persisted value', () => {
      getSettingsManager().update((cur) => ({ ...cur, assistModeGameSpeed: 0.75 }));
      expect(getAssistModeGameSpeed()).toBe(0.75);
    });

    it('sub-effect readers reflect their individual flags', () => {
      getSettingsManager().update((cur) => ({
        ...cur,
        assistModeExtendedIFrames: true,
        assistModeExtendedComboWindow: false,
        assistModeInvincibility: true,
      }));
      expect(isExtendedIFramesEnabled()).toBe(true);
      expect(isExtendedComboWindowEnabled()).toBe(false);
      expect(isInvincibilityEnabled()).toBe(true);
    });
  });
});
