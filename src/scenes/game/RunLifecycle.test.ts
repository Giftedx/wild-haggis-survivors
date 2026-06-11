import { describe, expect, it, vi } from 'vitest';
import type { RunLifecycleHooks } from './RunLifecycle';
import { RunScoreState } from './RunScoreState';

describe('RunLifecycleHooks contract', () => {
  it('includes onActComplete receiving 1 or 2', () => {
    const onActComplete = vi.fn<(act: 1 | 2) => void>();
    const partial: Pick<RunLifecycleHooks, 'onActComplete'> = { onActComplete };
    partial.onActComplete(1);
    partial.onActComplete(2);
    expect(onActComplete).toHaveBeenCalledTimes(2);
    expect(onActComplete).toHaveBeenNthCalledWith(1, 1);
    expect(onActComplete).toHaveBeenNthCalledWith(2, 2);
  });
});

describe('T201 — RunScoreState victory delay gen guard', () => {
  /**
   * The boss-kill branch in EnemyKillHandler captures the gen at schedule
   * time and the victory ticker compares against the current gen. If
   * `RunLifecycle.handleDeath` bumps the gen via
   * `invalidatePendingVictoryTicker` before the ticker fires, the
   * captured gen mismatches and the victory call no-ops — exactly the
   * race-prevention contract this hook exists for.
   */
  it('captured gen invalidates after a subsequent bump', () => {
    const score = new RunScoreState();
    const capturedGen = score.nextVictoryDelayGen();
    expect(capturedGen).toBe(score.victoryDelayGen);

    // Simulate handleDeath bumping the gen — the captured value should now
    // be stale and the ticker callback would early-return on the mismatch.
    score.nextVictoryDelayGen();
    expect(capturedGen).not.toBe(score.victoryDelayGen);
  });

  it('reset() rolls victoryDelayGen back to 0 (scene reuse safety)', () => {
    const score = new RunScoreState();
    score.nextVictoryDelayGen();
    score.nextVictoryDelayGen();
    score.nextVictoryDelayGen();
    expect(score.victoryDelayGen).toBe(3);
    score.reset();
    expect(score.victoryDelayGen).toBe(0);
  });
});
