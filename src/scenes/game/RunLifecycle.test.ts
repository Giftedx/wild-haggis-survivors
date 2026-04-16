import { describe, expect, it, vi } from 'vitest';
import type { RunLifecycleHooks } from './RunLifecycle';

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
