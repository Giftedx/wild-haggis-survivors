import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { musicEngine } from './ProceduralMusicEngine';

/** Narrow probe for SFX-duck state (private fields — keep in test file only). */
type DuckProbe = {
  musicSfxDuck: number;
  playing: boolean;
  fadingOut: boolean;
  notifyGameplaySfxImpulse: (strength: number) => void;
};

function duckProbe(): DuckProbe {
  return musicEngine as unknown as DuckProbe;
}

describe('ProceduralMusicEngine SFX duck', () => {
  afterEach(() => {
    const e = duckProbe();
    e.musicSfxDuck = 0;
    e.playing = false;
    e.fadingOut = false;
  });

  it('stacks impulses and clamps musicSfxDuck to 1', () => {
    const e = duckProbe();
    e.playing = true;
    e.fadingOut = false;
    e.musicSfxDuck = 0;
    e.notifyGameplaySfxImpulse(0.5);
    e.notifyGameplaySfxImpulse(0.6);
    expect(e.musicSfxDuck).toBe(1);
  });

  it('ignores impulse when not playing', () => {
    const e = duckProbe();
    e.playing = false;
    e.musicSfxDuck = 0.2;
    e.notifyGameplaySfxImpulse(0.9);
    expect(e.musicSfxDuck).toBe(0.2);
  });

  it('ignores impulse while fadingOut', () => {
    const e = duckProbe();
    e.playing = true;
    e.fadingOut = true;
    e.musicSfxDuck = 0;
    e.notifyGameplaySfxImpulse(0.5);
    expect(e.musicSfxDuck).toBe(0);
  });

  it('clamps per-impulse strength to 0..1', () => {
    const e = duckProbe();
    e.playing = true;
    e.fadingOut = false;
    e.musicSfxDuck = 0;
    e.notifyGameplaySfxImpulse(2);
    expect(e.musicSfxDuck).toBe(1);
    e.musicSfxDuck = 0.5;
    e.notifyGameplaySfxImpulse(-1);
    expect(e.musicSfxDuck).toBe(0.5);
  });
});

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

