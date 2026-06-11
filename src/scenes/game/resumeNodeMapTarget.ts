import type { Act3Stretch } from '../../data/nodeBanks';

export interface ResumeNodeMapTarget {
  readonly act: 1 | 2 | 3;
  readonly stretch: Act3Stretch;
}

export function resolveResumeNodeMapTarget(
  currentAct: 1 | 2 | 3,
  spawnedBossKeys: readonly string[],
): ResumeNodeMapTarget {
  if (currentAct !== 3) return { act: currentAct, stretch: 1 };
  const spawned = new Set(spawnedBossKeys);
  if (spawned.has('hunter_general')) return { act: 3, stretch: 3 };
  if (spawned.has('the_laird')) return { act: 3, stretch: 2 };
  return { act: 3, stretch: 1 };
}
