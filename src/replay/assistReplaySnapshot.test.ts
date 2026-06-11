import { describe, expect, it } from 'vitest';
import {
  captureAssistReplaySnapshot,
  assistReplaySnapshotsEqual,
  isAssistReplaySnapshot,
  captureComfortReplaySnapshot,
  comfortReplaySnapshotsEqual,
  coerceComfortReplaySnapshot,
  type AssistReplaySnapshot,
  type ComfortReplaySnapshot,
} from './assistReplaySnapshot';
import type { ISettingsData } from '../core/SettingsManager';

function settings(overrides: Partial<ISettingsData> = {}): ISettingsData {
  return {
    assistMode: false,
    assistModeInvincibility: false,
    assistModeExtendedIFrames: false,
    assistModeExtendedComboWindow: false,
    assistModeGameSpeed: 1,
    motionScale: 1,
    reduceFlashing: false,
    reduceParticles: false,
    sfxVolume: 1,
    musicVolume: 1,
    ...overrides,
  } as ISettingsData;
}

function snap(overrides: Partial<AssistReplaySnapshot> = {}): AssistReplaySnapshot {
  return {
    assistMode: false,
    assistModeInvincibility: false,
    assistModeExtendedIFrames: false,
    assistModeExtendedComboWindow: false,
    assistModeGameSpeed: 1,
    ...overrides,
  };
}

function comfort(overrides: Partial<ComfortReplaySnapshot> = {}): ComfortReplaySnapshot {
  return { motionScale: 1, reduceFlashing: false, reduceParticles: false, ...overrides };
}

// ---------------------------------------------------------------------------
// captureAssistReplaySnapshot
// ---------------------------------------------------------------------------

describe('captureAssistReplaySnapshot', () => {
  it('captures all assist fields from settings', () => {
    const s = settings({ assistMode: true, assistModeInvincibility: true, assistModeGameSpeed: 0.5 });
    const result = captureAssistReplaySnapshot(s);
    expect(result.assistMode).toBe(true);
    expect(result.assistModeInvincibility).toBe(true);
    expect(result.assistModeGameSpeed).toBe(0.5);
  });

  it('returns false for all flags when assist is off', () => {
    const result = captureAssistReplaySnapshot(settings());
    expect(result.assistMode).toBe(false);
    expect(result.assistModeInvincibility).toBe(false);
    expect(result.assistModeExtendedIFrames).toBe(false);
    expect(result.assistModeExtendedComboWindow).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assistReplaySnapshotsEqual
// ---------------------------------------------------------------------------

describe('assistReplaySnapshotsEqual', () => {
  it('returns true for identical snapshots', () => {
    expect(assistReplaySnapshotsEqual(snap(), snap())).toBe(true);
  });

  it('returns false when assistMode differs', () => {
    expect(assistReplaySnapshotsEqual(snap({ assistMode: true }), snap())).toBe(false);
  });

  it('returns false when gameSpeed differs', () => {
    expect(assistReplaySnapshotsEqual(snap({ assistModeGameSpeed: 0.5 }), snap({ assistModeGameSpeed: 1 }))).toBe(false);
  });

  it('returns false when invincibility differs', () => {
    expect(assistReplaySnapshotsEqual(snap({ assistModeInvincibility: true }), snap())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAssistReplaySnapshot
// ---------------------------------------------------------------------------

describe('isAssistReplaySnapshot', () => {
  it('returns true for a well-formed snapshot', () => {
    expect(isAssistReplaySnapshot(snap())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isAssistReplaySnapshot(null)).toBe(false);
  });

  it('returns false when assistMode is not a boolean', () => {
    expect(isAssistReplaySnapshot({ ...snap(), assistMode: 1 })).toBe(false);
  });

  it('returns false when assistModeGameSpeed is not finite', () => {
    expect(isAssistReplaySnapshot({ ...snap(), assistModeGameSpeed: NaN })).toBe(false);
    expect(isAssistReplaySnapshot({ ...snap(), assistModeGameSpeed: Infinity })).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isAssistReplaySnapshot(42)).toBe(false);
    expect(isAssistReplaySnapshot('string')).toBe(false);
    expect(isAssistReplaySnapshot([])).toBe(false);
  });

  it('returns false when a required boolean field is missing', () => {
    const { assistModeExtendedIFrames: _, ...partial } = snap();
    expect(isAssistReplaySnapshot(partial)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// captureComfortReplaySnapshot
// ---------------------------------------------------------------------------

describe('captureComfortReplaySnapshot', () => {
  it('captures motionScale, reduceFlashing, reduceParticles', () => {
    const s = settings({ motionScale: 0.5, reduceFlashing: true, reduceParticles: true });
    const result = captureComfortReplaySnapshot(s);
    expect(result.motionScale).toBe(0.5);
    expect(result.reduceFlashing).toBe(true);
    expect(result.reduceParticles).toBe(true);
  });

  it('coerces undefined reduceFlashing/reduceParticles to false', () => {
    const s = settings({ reduceFlashing: undefined as never, reduceParticles: undefined as never });
    const result = captureComfortReplaySnapshot(s);
    expect(result.reduceFlashing).toBe(false);
    expect(result.reduceParticles).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// comfortReplaySnapshotsEqual
// ---------------------------------------------------------------------------

describe('comfortReplaySnapshotsEqual', () => {
  it('returns true for identical comfort snapshots', () => {
    expect(comfortReplaySnapshotsEqual(comfort(), comfort())).toBe(true);
  });

  it('returns false when motionScale differs', () => {
    expect(comfortReplaySnapshotsEqual(comfort({ motionScale: 0.5 }), comfort())).toBe(false);
  });

  it('returns false when reduceFlashing differs', () => {
    expect(comfortReplaySnapshotsEqual(comfort({ reduceFlashing: true }), comfort())).toBe(false);
  });

  it('returns false when reduceParticles differs', () => {
    expect(comfortReplaySnapshotsEqual(comfort({ reduceParticles: true }), comfort())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// coerceComfortReplaySnapshot
// ---------------------------------------------------------------------------

describe('coerceComfortReplaySnapshot', () => {
  it('returns undefined for null', () => {
    expect(coerceComfortReplaySnapshot(null)).toBeUndefined();
  });

  it('returns undefined for non-object', () => {
    expect(coerceComfortReplaySnapshot(42)).toBeUndefined();
    expect(coerceComfortReplaySnapshot('oops')).toBeUndefined();
  });

  it('returns undefined when motionScale is missing', () => {
    expect(coerceComfortReplaySnapshot({ reduceFlashing: false })).toBeUndefined();
  });

  it('returns undefined when motionScale is out of range', () => {
    expect(coerceComfortReplaySnapshot({ motionScale: -0.1, reduceFlashing: false })).toBeUndefined();
    expect(coerceComfortReplaySnapshot({ motionScale: 1.1, reduceFlashing: false })).toBeUndefined();
  });

  it('returns undefined when reduceFlashing is not boolean', () => {
    expect(coerceComfortReplaySnapshot({ motionScale: 0.5, reduceFlashing: 'yes' })).toBeUndefined();
  });

  it('parses a valid comfort snapshot', () => {
    const result = coerceComfortReplaySnapshot({ motionScale: 0.75, reduceFlashing: true, reduceParticles: true });
    expect(result).toEqual({ motionScale: 0.75, reduceFlashing: true, reduceParticles: true });
  });

  it('defaults reduceParticles to false when absent', () => {
    const result = coerceComfortReplaySnapshot({ motionScale: 1, reduceFlashing: false });
    expect(result?.reduceParticles).toBe(false);
  });
});
