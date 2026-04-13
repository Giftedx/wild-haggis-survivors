import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { musicEngine } from './ProceduralMusicEngine';

describe('ProceduralMusicEngine lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears pending resolution polling timers on stop()', () => {
    const engine: any = musicEngine as any;

    // Stub out heavy dependencies so stop() is safe in unit tests.
    engine.drone = { stop: vi.fn(), start: vi.fn(), applyMood: vi.fn() };
    engine.piano = { stop: vi.fn(), start: vi.fn(), playNote: vi.fn() };
    engine.percussion = { stop: vi.fn(), start: vi.fn(), scheduleRhythmHit: vi.fn(), scheduleHeartbeat: vi.fn(), updatePattern: vi.fn() };
    engine.disconnectGraph = vi.fn();
    engine.scheduler = { reset: vi.fn() };

    engine.playing = true;
    engine.conductor = {
      enterResolution: vi.fn(),
      isResolutionComplete: vi.fn(() => false),
    };

    const fadeSpy = vi.spyOn(musicEngine as any, 'fadeOut');

    musicEngine.playResolution();
    musicEngine.stop();

    vi.advanceTimersByTime(10_000);

    expect(fadeSpy).not.toHaveBeenCalled();
  });
});

