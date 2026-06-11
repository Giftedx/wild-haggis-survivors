/**
 * T1 — Assist-related settings snapshot for replay honesty.
 * Recorded on every new v2+ blob; playback warns when live settings differ
 * and applies snapshots via AssistMode / a11yMotion overrides.
 */
import type { ISettingsData } from '../core/SettingsManager';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface AssistReplaySnapshot {
  assistMode: boolean;
  assistModeInvincibility: boolean;
  assistModeExtendedIFrames: boolean;
  assistModeExtendedComboWindow: boolean;
  assistModeGameSpeed: number;
}

export function captureAssistReplaySnapshot(s: ISettingsData): AssistReplaySnapshot {
  return {
    assistMode: s.assistMode,
    assistModeInvincibility: s.assistModeInvincibility,
    assistModeExtendedIFrames: s.assistModeExtendedIFrames,
    assistModeExtendedComboWindow: s.assistModeExtendedComboWindow,
    assistModeGameSpeed: s.assistModeGameSpeed,
  };
}

export function assistReplaySnapshotsEqual(a: AssistReplaySnapshot, b: AssistReplaySnapshot): boolean {
  return (
    a.assistMode === b.assistMode &&
    a.assistModeInvincibility === b.assistModeInvincibility &&
    a.assistModeExtendedIFrames === b.assistModeExtendedIFrames &&
    a.assistModeExtendedComboWindow === b.assistModeExtendedComboWindow &&
    a.assistModeGameSpeed === b.assistModeGameSpeed
  );
}

export function isAssistReplaySnapshot(v: unknown): v is AssistReplaySnapshot {
  if (!isRecord(v)) return false;
  if (typeof v.assistMode !== 'boolean') return false;
  if (typeof v.assistModeInvincibility !== 'boolean') return false;
  if (typeof v.assistModeExtendedIFrames !== 'boolean') return false;
  if (typeof v.assistModeExtendedComboWindow !== 'boolean') return false;
  if (typeof v.assistModeGameSpeed !== 'number' || !Number.isFinite(v.assistModeGameSpeed)) return false;
  return true;
}

/** Motion / photosensitivity / particle posture at record time (Juice, haar, mist). */
export interface ComfortReplaySnapshot {
  motionScale: number;
  reduceFlashing: boolean;
  reduceParticles: boolean;
}

export function captureComfortReplaySnapshot(s: ISettingsData): ComfortReplaySnapshot {
  return {
    motionScale: s.motionScale,
    reduceFlashing: s.reduceFlashing === true,
    reduceParticles: s.reduceParticles === true,
  };
}

export function comfortReplaySnapshotsEqual(a: ComfortReplaySnapshot, b: ComfortReplaySnapshot): boolean {
  return (
    a.motionScale === b.motionScale &&
    a.reduceFlashing === b.reduceFlashing &&
    a.reduceParticles === b.reduceParticles
  );
}

/**
 * Deserialize `comfortSettings` from JSON. `reduceParticles` defaults false when
 * absent so older blobs (pre-field) still load.
 */
export function coerceComfortReplaySnapshot(v: unknown): ComfortReplaySnapshot | undefined {
  if (!isRecord(v)) return undefined;
  if (typeof v.motionScale !== 'number' || !Number.isFinite(v.motionScale)) return undefined;
  if (v.motionScale < 0 || v.motionScale > 1) return undefined;
  if (typeof v.reduceFlashing !== 'boolean') return undefined;
  const reduceParticles = typeof v.reduceParticles === 'boolean' ? v.reduceParticles : false;
  return { motionScale: v.motionScale, reduceFlashing: v.reduceFlashing, reduceParticles };
}
