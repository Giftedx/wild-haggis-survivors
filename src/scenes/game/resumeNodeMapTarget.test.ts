import { describe, expect, it } from 'vitest';
import { resolveResumeNodeMapTarget } from './resumeNodeMapTarget';

describe('resolveResumeNodeMapTarget', () => {
  it('uses stretch 1 for Act 1 and Act 2 maps', () => {
    expect(resolveResumeNodeMapTarget(1, ['gordon'])).toEqual({ act: 1, stretch: 1 });
    expect(resolveResumeNodeMapTarget(2, ['gordon'])).toEqual({ act: 2, stretch: 1 });
  });

  it('restores the correct Act 3 stretch from spawned boss keys', () => {
    expect(resolveResumeNodeMapTarget(3, [])).toEqual({ act: 3, stretch: 1 });
    expect(resolveResumeNodeMapTarget(3, ['the_laird'])).toEqual({ act: 3, stretch: 2 });
    expect(resolveResumeNodeMapTarget(3, ['the_laird', 'hunter_general'])).toEqual({
      act: 3,
      stretch: 3,
    });
  });
});
