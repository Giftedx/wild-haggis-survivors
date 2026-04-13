import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MOTION_TIMING } from '../../core/motionTiming';
import type { GameMusicState } from './Conductor';
import { expApproach } from './musicMath';
import { musicEngine } from './ProceduralMusicEngine';

function baseGameState(): GameMusicState {
  return {
    hp: 100,
    maxHp: 100,
    gameTimeSec: 0,
    enemyCount: 0,
    comboCount: 0,
    killCount: 0,
    bossActive: false,
  };
}

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

describe('ProceduralMusicEngine.update SFX duck decay', () => {
  type EngineSnapshot = {
    drone: unknown;
    percussion: unknown;
    scheduler: unknown;
    masterFilter: unknown;
    masterGain: unknown;
    ctx: unknown;
  };

  let saved: EngineSnapshot;

  beforeEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    saved = {
      drone: eng.drone,
      percussion: eng.percussion,
      scheduler: eng.scheduler,
      masterFilter: eng.masterFilter,
      masterGain: eng.masterGain,
      ctx: eng.ctx,
    };
  });

  afterEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    eng.drone = saved.drone;
    eng.percussion = saved.percussion;
    eng.scheduler = saved.scheduler;
    eng.masterFilter = saved.masterFilter;
    eng.masterGain = saved.masterGain;
    eng.ctx = saved.ctx;
    const probe = duckProbe();
    probe.musicSfxDuck = 0;
    probe.playing = false;
    probe.fadingOut = false;
  });

  it('decays musicSfxDuck with the same expApproach step as musicMath', () => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    eng.drone = { applyMood: vi.fn() };
    eng.percussion = { updatePattern: vi.fn() };
    eng.scheduler = { tick: vi.fn() };
    eng.masterFilter = {
      frequency: { linearRampToValueAtTime: vi.fn() },
    };
    eng.masterGain = {
      gain: {
        value: 0.25,
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
      },
    };
    eng.ctx = {
      state: 'running',
      currentTime: 0,
      resume: vi.fn(),
    };
    eng.playing = true;
    eng.fadingOut = false;
    eng.enabled = true;
    eng.userMusicVolume = 1;
    eng.musicSfxDuck = 0.75;

    const deltaMs = 16.67;
    const expected = expApproach(0.75, 0, deltaMs, MOTION_TIMING.musicSfxDuckRecoverMs);

    musicEngine.update(deltaMs, baseGameState());

    expect(duckProbe().musicSfxDuck).toBeCloseTo(expected, 12);
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

