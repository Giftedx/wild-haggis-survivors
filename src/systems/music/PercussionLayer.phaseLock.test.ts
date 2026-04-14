import { describe, expect, it } from 'vitest';
import { PercussionLayer } from './PercussionLayer';

describe('PercussionLayer requestPhaseLockedNudge', () => {
  it('applies deferred nudge when pattern index wraps to 0', () => {
    const AC =
      typeof globalThis.AudioContext !== 'undefined'
        ? globalThis.AudioContext
        : (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    const p = new PercussionLayer();
    p.start(ctx, ctx.destination);

    const layer = p as unknown as {
      pendingEnrageSteps: number | null;
      patternIdx: number;
    };

    p.requestPhaseLockedNudge(3);
    expect(layer.pendingEnrageSteps).toBe(3);

    for (let i = 0; i < 7; i++) {
      p.scheduleRhythmHit(ctx.currentTime, 0.5, 0);
      expect(layer.pendingEnrageSteps).not.toBeNull();
    }
    p.scheduleRhythmHit(ctx.currentTime, 0.5, 0);
    expect(layer.pendingEnrageSteps).toBeNull();

    p.stop();
    void ctx.close();
  });
});
