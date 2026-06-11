import type { IRunState } from './SaveManager';

/**
 * Read the pending run snapshot without mutating storage.
 * The caller decides when startup is "committed".
 */
export function readPendingResumeRun(activeRun: IRunState | null): IRunState | null {
  return activeRun ?? null;
}

/**
 * On successful startup, persist a fresh snapshot to atomically replace
 * the previously suspended snapshot.
 */
export function finalizeResumeStartup(
  resumeRun: IRunState | null,
  persistActiveRun: () => void
): void {
  if (!resumeRun) return;
  persistActiveRun();
}

export interface GameplaySessionGuard {
  markStarted: () => void;
  endIfStarted: () => void;
  hasStarted: () => boolean;
}

export function createGameplaySessionGuard(endSession: () => void): GameplaySessionGuard {
  let started = false;
  return {
    markStarted: () => {
      started = true;
    },
    endIfStarted: () => {
      if (!started) return;
      started = false;
      endSession();
    },
    hasStarted: () => started,
  };
}
