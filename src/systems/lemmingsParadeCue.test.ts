import { describe, expect, it } from 'vitest';
import {
  LEMMINGS_PARADE_BANTER_CONTEXT,
  LEMMINGS_PARADE_CAPTION_ID,
  LEMMINGS_PARADE_CAPTION_TINT,
  buildLemmingsParadeCue,
} from './lemmingsParadeCue';

describe('buildLemmingsParadeCue', () => {
  it('builds an accessible caption and banter cue for the rare parade moment', () => {
    const cue = buildLemmingsParadeCue();

    expect(cue.captionId).toBe(LEMMINGS_PARADE_CAPTION_ID);
    expect(cue.caption).not.toBe('captions.lemmings_parade');
    expect(cue.caption).toContain('lemmings');
    expect(cue.caption).toContain('Oh no');
    expect(cue.captionTint).toBe(LEMMINGS_PARADE_CAPTION_TINT);
    expect(cue.banterContext).toBe(LEMMINGS_PARADE_BANTER_CONTEXT);
  });
});
