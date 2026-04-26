import { describe, expect, it } from 'vitest';
import {
  isFirstRunCroftVisit,
  startRunTargetForCroft,
  visibleCroftActions,
} from './croftProgressiveDisclosure';

describe('croftProgressiveDisclosure', () => {
  it('treats a zero-run save as a first-run Croft visit', () => {
    expect(isFirstRunCroftVisit({ totalRuns: 0 })).toBe(true);
  });

  it('hides satellite hubs on first-run Croft visits', () => {
    expect(visibleCroftActions({ totalRuns: 0 })).toEqual(['start_run', 'settings']);
  });

  it('starts a clean run directly on first-run Croft visits', () => {
    expect(startRunTargetForCroft({ totalRuns: 0 })).toBe('Game');
  });

  it('restores the full Croft action column after a run exists', () => {
    expect(visibleCroftActions({ totalRuns: 1 })).toEqual([
      'start_run',
      'shop',
      'chronicle',
      'settings',
    ]);
  });

  it('routes returning players through the curse picker', () => {
    expect(startRunTargetForCroft({ totalRuns: 1 })).toBe('Curse');
  });
});
