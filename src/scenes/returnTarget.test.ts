import { describe, expect, it } from 'vitest';
import { resolveSceneReturnTarget, returnTargetData } from './returnTarget';

describe('scene return target helpers', () => {
  it('accepts the two supported parent hubs', () => {
    expect(resolveSceneReturnTarget('MainMenu')).toBe('MainMenu');
    expect(resolveSceneReturnTarget('Croft')).toBe('Croft');
  });

  it('falls back for stale or untrusted scene data', () => {
    expect(resolveSceneReturnTarget('Settings')).toBe('MainMenu');
    expect(resolveSceneReturnTarget(undefined)).toBe('MainMenu');
    expect(resolveSceneReturnTarget('Settings', 'Croft')).toBe('Croft');
  });

  it('creates Phaser scene data for preserving the current parent hub', () => {
    expect(returnTargetData('Croft')).toEqual({ returnTo: 'Croft' });
    expect(resolveSceneReturnTarget(returnTargetData('Croft').returnTo)).toBe('Croft');
    expect(resolveSceneReturnTarget(returnTargetData('MainMenu').returnTo)).toBe('MainMenu');
  });
});
