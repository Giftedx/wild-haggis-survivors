import type { CroftActionKey, SceneKey } from './croft/CroftInteractionRouter';

export interface CroftProgressSnapshot {
  totalRuns: number;
}

export function isFirstRunCroftVisit(progress: CroftProgressSnapshot): boolean {
  return progress.totalRuns <= 0;
}

export function visibleCroftActions(progress: CroftProgressSnapshot): readonly CroftActionKey[] {
  if (isFirstRunCroftVisit(progress)) {
    return ['start_run', 'settings'];
  }
  return ['start_run', 'shop', 'chronicle', 'settings'];
}

export function startRunTargetForCroft(progress: CroftProgressSnapshot): SceneKey {
  return isFirstRunCroftVisit(progress) ? 'Game' : 'Curse';
}
