import type { ISaveData } from '../core/SaveManager';

export const DRIFT_PRACTICE_DURATION_MS = 12_000;
export const DRIFT_PRACTICE_POLL_MS = 100;
export const DRIFT_PRACTICE_RADIUS_PX = 36;
export const DRIFT_PRACTICE_MARKER_DISTANCE_PX = 96;

export type DriftPracticeOutcome = 'continue' | 'complete' | 'skip' | 'timeout';

export interface DriftPracticeGateInput {
  resumeRun?: boolean;
  replayPlayback?: boolean;
  hasSeenDriftTutorial: ISaveData['hasSeenDriftTutorial'];
}

/**
 * Gate the drift micro-practice. The practice fires AFTER the FTUE
 * completes (or on a returning player's first run with FTUE already
 * done) — `hasCompletedTutorial` is therefore guaranteed true at the
 * integration site (`TutorialSystem.scheduleDriftHintIfNeeded`) and
 * not a relevant gate. Resume + replay paths skip; once-seen sticks.
 */
export function shouldStartDriftPractice(input: DriftPracticeGateInput): boolean {
  return input.resumeRun !== true
    && input.replayPlayback !== true
    && input.hasSeenDriftTutorial !== true;
}

export function resolveDriftPracticeStep(input: {
  elapsedMs: number;
  distanceToMarkerPx: number;
  skipRequested?: boolean;
}): DriftPracticeOutcome {
  if (input.skipRequested === true) return 'skip';
  if (input.distanceToMarkerPx <= DRIFT_PRACTICE_RADIUS_PX) return 'complete';
  if (input.elapsedMs >= DRIFT_PRACTICE_DURATION_MS) return 'timeout';
  return 'continue';
}

export function driftPracticeMarkerFor(
  playerX: number,
  playerY: number,
  driftSign: 1 | -1 = 1,
): { x: number; y: number } {
  const side = driftSign === -1 ? -1 : 1;
  return {
    x: playerX + DRIFT_PRACTICE_MARKER_DISTANCE_PX * side,
    y: playerY - DRIFT_PRACTICE_MARKER_DISTANCE_PX * 0.7,
  };
}
