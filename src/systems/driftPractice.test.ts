import { describe, expect, it } from 'vitest';
import {
  DRIFT_PRACTICE_DURATION_MS,
  DRIFT_PRACTICE_RADIUS_PX,
  driftPracticeMarkerFor,
  resolveDriftPracticeStep,
  shouldStartDriftPractice,
} from './driftPractice';

describe('driftPractice', () => {
  it('starts only for non-resume, non-replay runs that have not seen the drift practice', () => {
    // Happy path — fresh run, never seen drift, not resumed, not replay.
    expect(shouldStartDriftPractice({
      hasSeenDriftTutorial: false,
    })).toBe(true);

    expect(shouldStartDriftPractice({
      resumeRun: true,
      hasSeenDriftTutorial: false,
    })).toBe(false);

    expect(shouldStartDriftPractice({
      replayPlayback: true,
      hasSeenDriftTutorial: false,
    })).toBe(false);

    // Once seen, never again — sticks across runs.
    expect(shouldStartDriftPractice({
      hasSeenDriftTutorial: true,
    })).toBe(false);
  });

  it('completes on marker reach, skip, or the 12s cap', () => {
    expect(resolveDriftPracticeStep({
      elapsedMs: 500,
      distanceToMarkerPx: DRIFT_PRACTICE_RADIUS_PX - 1,
    })).toBe('complete');

    expect(resolveDriftPracticeStep({
      elapsedMs: 500,
      distanceToMarkerPx: 999,
      skipRequested: true,
    })).toBe('skip');

    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS,
      distanceToMarkerPx: 999,
    })).toBe('timeout');

    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS - 100,
      distanceToMarkerPx: DRIFT_PRACTICE_RADIUS_PX + 1,
    })).toBe('continue');
  });

  it('mirrors the marker for anticlockwise drift variants', () => {
    const clockwise = driftPracticeMarkerFor(100, 100, 1);
    const anticlockwise = driftPracticeMarkerFor(100, 100, -1);

    expect(clockwise.x).toBeGreaterThan(100);
    expect(anticlockwise.x).toBeLessThan(100);
    expect(clockwise.y).toBe(anticlockwise.y);
  });

  it('treats the duration cap as inclusive — ticking exactly at the cap times out', () => {
    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS,
      distanceToMarkerPx: 999,
    })).toBe('timeout');
    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS + 1,
      distanceToMarkerPx: 999,
    })).toBe('timeout');
  });

  it('treats the marker radius as inclusive — landing exactly on the radius completes', () => {
    expect(resolveDriftPracticeStep({
      elapsedMs: 500,
      distanceToMarkerPx: DRIFT_PRACTICE_RADIUS_PX,
    })).toBe('complete');
    expect(resolveDriftPracticeStep({
      elapsedMs: 500,
      distanceToMarkerPx: 0,
    })).toBe('complete');
  });

  it('prioritises skip over the marker hit so a quick tap dismisses even when in range', () => {
    expect(resolveDriftPracticeStep({
      elapsedMs: 500,
      distanceToMarkerPx: DRIFT_PRACTICE_RADIUS_PX - 1,
      skipRequested: true,
    })).toBe('skip');
  });

  it('prioritises skip over the timeout cap', () => {
    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS + 100,
      distanceToMarkerPx: 999,
      skipRequested: true,
    })).toBe('skip');
  });

  it('rolls forward the full poll cadence — every 100ms the outcome is stable until a transition', () => {
    // Walk the full 12s window in 100ms ticks; outcome is `continue` until the cap, then `timeout`.
    const distances = [200, 180, 150, 100, 80, 60, 50, 50, 50, 50];
    for (let elapsed = 0; elapsed < DRIFT_PRACTICE_DURATION_MS; elapsed += 100) {
      const distance = distances[Math.min(distances.length - 1, Math.floor(elapsed / 1000))];
      const outcome = resolveDriftPracticeStep({ elapsedMs: elapsed, distanceToMarkerPx: distance });
      // none of the simulated distances are within radius, so we never complete
      expect(outcome).toBe('continue');
    }
    expect(resolveDriftPracticeStep({
      elapsedMs: DRIFT_PRACTICE_DURATION_MS,
      distanceToMarkerPx: 50,
    })).toBe('timeout');
  });

  it('completes mid-window when the player walks into the marker', () => {
    // First half the player is far; halfway through they walk into range.
    let lastOutcome = resolveDriftPracticeStep({ elapsedMs: 500, distanceToMarkerPx: 200 });
    expect(lastOutcome).toBe('continue');
    lastOutcome = resolveDriftPracticeStep({ elapsedMs: 6_000, distanceToMarkerPx: 100 });
    expect(lastOutcome).toBe('continue');
    lastOutcome = resolveDriftPracticeStep({ elapsedMs: 6_500, distanceToMarkerPx: DRIFT_PRACTICE_RADIUS_PX - 5 });
    expect(lastOutcome).toBe('complete');
  });

  it('treats explicit false on optional flags identically to omission', () => {
    // Only `=== true` blocks the start; `false`/`undefined` are equivalent.
    expect(shouldStartDriftPractice({
      hasSeenDriftTutorial: false,
      resumeRun: false,
      replayPlayback: false,
    })).toBe(true);
    expect(shouldStartDriftPractice({
      hasSeenDriftTutorial: false,
    })).toBe(true);
  });

  it('does not gate on hasCompletedTutorial — drift practice fires post-FTUE so completed=true is the normal state', () => {
    // The integration site (TutorialSystem.scheduleDriftHintIfNeeded) is
    // called either right after FTUE completes or at run-start when FTUE
    // was already completed; the practice is unrelated to the FTUE flag.
    expect(shouldStartDriftPractice({
      hasSeenDriftTutorial: false,
    })).toBe(true);
  });
});
