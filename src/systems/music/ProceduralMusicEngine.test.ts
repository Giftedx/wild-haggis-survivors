import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { globalEventBus } from '../../core/GlobalEventBus';
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
    biomeTimbre: 0.5,
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
    engine.percussion = {
      stop: vi.fn(), start: vi.fn(), scheduleRhythmHit: vi.fn(), scheduleHeartbeat: vi.fn(), updatePattern: vi.fn(),
      clearPendingPhaseNudge: vi.fn(),
    };
    engine.disconnectGraph = vi.fn();
    engine.scheduler = { reset: vi.fn() };

    engine.playing = true;
    engine.conductor = {
      enterResolution: vi.fn(),
      isResolutionComplete: vi.fn(() => false),
    };

    const fadeSpy = vi.spyOn(musicEngine as any, 'fadeOut');

    engine.moorBloomAcc = 0.95;
    engine.evolutionGlowAcc = 0.9;
    engine.enragePressureAcc = 0.85;

    musicEngine.playResolution();
    expect(engine.moorBloomAcc).toBeLessThan(0.2);
    expect(engine.evolutionGlowAcc).toBeLessThan(0.2);
    expect(engine.enragePressureAcc).toBeLessThan(0.15);
    expect(engine.conductor.enterResolution).toHaveBeenCalledTimes(1);
    musicEngine.stop();

    vi.advanceTimersByTime(10_000);

    expect(fadeSpy).not.toHaveBeenCalled();
  });

  it('fadeOut squashes accents for death closure and clears deferred groove nudge', () => {
    const engine: any = musicEngine as any;
    const clearNudge = vi.fn();
    engine.percussion = { clearPendingPhaseNudge: clearNudge };
    engine.playing = true;
    engine.ctx = { currentTime: 0, state: 'running', resume: vi.fn() };
    engine.masterGain = {
      gain: {
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        value: 0.2,
        linearRampToValueAtTime: vi.fn(),
      },
    };
    engine.moorBloomAcc = 0.8;
    engine.evolutionGlowAcc = 0.7;
    engine.enragePressureAcc = 0.6;
    engine.fadingOut = false;
    vi.spyOn(musicEngine as any, 'startRafLoop').mockImplementation(() => {});

    musicEngine.fadeOut(2000);

    expect(engine.moorBloomAcc).toBeLessThan(0.06);
    expect(clearNudge).toHaveBeenCalledTimes(1);
    expect(engine.fadingOut).toBe(true);

    engine.fadingOut = false;
    engine.playing = false;
  });
});

describe('ProceduralMusicEngine moor piano flourish (bus)', () => {
  type EngineProbe = {
    piano: { playMoorFlourish: (t: number, atHome: boolean) => void };
    ctx: AudioContext | null;
    playing: boolean;
    busStarted: boolean;
    busUnsubs: Array<() => void>;
    lastMoorPianoFlourishAtMs: number;
  };

  let saved: EngineProbe;

  beforeEach(() => {
    const eng = musicEngine as unknown as EngineProbe;
    for (const u of eng.busUnsubs ?? []) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    eng.busUnsubs = [];
    eng.busStarted = false;
    saved = {
      piano: eng.piano,
      ctx: eng.ctx as AudioContext | null,
      playing: eng.playing,
      busStarted: false,
      busUnsubs: [],
      lastMoorPianoFlourishAtMs: eng.lastMoorPianoFlourishAtMs,
    };
  });

  afterEach(() => {
    const eng = musicEngine as unknown as EngineProbe;
    for (const u of eng.busUnsubs ?? []) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    eng.busUnsubs = [];
    eng.busStarted = false;
    eng.piano = saved.piano;
    eng.ctx = saved.ctx;
    eng.playing = saved.playing;
    eng.lastMoorPianoFlourishAtMs = saved.lastMoorPianoFlourishAtMs;
    vi.restoreAllMocks();
  });

  it('calls playMoorFlourish on moor moment, then respects cooldown', () => {
    const flourish = vi.fn();
    const eng = musicEngine as unknown as EngineProbe;
    eng.piano = { playMoorFlourish: flourish };
    eng.playing = true;
    eng.ctx = { currentTime: 0 } as unknown as AudioContext;
    eng.lastMoorPianoFlourishAtMs = 0;

    musicEngine.ensureBusHandlersStarted();

    let nowMs = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
    globalEventBus.emit('GLOBAL_MOOR_MOMENT', {
      momentId: 't1',
      atHomeBiome: false,
      biomeId: 'bog',
    });
    expect(flourish).toHaveBeenCalledTimes(1);

    nowMs = 3000;
    globalEventBus.emit('GLOBAL_MOOR_MOMENT', {
      momentId: 't2',
      atHomeBiome: false,
      biomeId: 'bog',
    });
    expect(flourish).toHaveBeenCalledTimes(1);

    nowMs = 10_000;
    globalEventBus.emit('GLOBAL_MOOR_MOMENT', {
      momentId: 't3',
      atHomeBiome: true,
      biomeId: 'heather',
    });
    expect(flourish).toHaveBeenCalledTimes(2);
    expect(flourish).toHaveBeenLastCalledWith(0, true);
  });
});

describe('ProceduralMusicEngine.getSchedulerHorizonsMs', () => {
  type HorizonProbe = {
    playing: boolean;
    ctx: { currentTime: number } | null;
    scheduler: { getHorizons: (now: number) => { melody: number; rhythm: number; heartbeat: number } };
  };

  let saved: { playing: boolean; ctx: unknown; scheduler: unknown };

  beforeEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    saved = { playing: eng.playing as boolean, ctx: eng.ctx, scheduler: eng.scheduler };
  });

  afterEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    eng.playing = saved.playing;
    eng.ctx = saved.ctx;
    eng.scheduler = saved.scheduler;
  });

  it('returns null when not playing', () => {
    const probe = musicEngine as unknown as HorizonProbe;
    probe.playing = false;
    probe.ctx = { currentTime: 1 };
    expect(musicEngine.getSchedulerHorizonsMs()).toBeNull();
  });

  it('returns null when ctx is missing', () => {
    const probe = musicEngine as unknown as HorizonProbe;
    probe.playing = true;
    probe.ctx = null;
    expect(musicEngine.getSchedulerHorizonsMs()).toBeNull();
  });

  it('converts scheduler horizons from seconds to ms when playing', () => {
    const probe = musicEngine as unknown as HorizonProbe;
    probe.playing = true;
    probe.ctx = { currentTime: 0 };
    probe.scheduler = {
      getHorizons: () => ({ melody: 0.3, rhythm: 0.05, heartbeat: 0.2 }),
    };
    expect(musicEngine.getSchedulerHorizonsMs()).toEqual({
      melody: 300,
      rhythm: 50,
      heartbeat: 200,
    });
  });
});

describe('ProceduralMusicEngine beat-phase getters (R1 M4.5 P4)', () => {
  type BeatProbe = {
    playing: boolean;
    ctx: { currentTime: number } | null;
    rhythmBPM: number;
  };

  let saved: { playing: boolean; ctx: unknown; bpm: number };

  beforeEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    saved = {
      playing: eng.playing as boolean,
      ctx: eng.ctx,
      bpm: eng.rhythmBPM as number,
    };
  });

  afterEach(() => {
    const eng = musicEngine as unknown as Record<string, unknown>;
    eng.playing = saved.playing;
    eng.ctx = saved.ctx;
    eng.rhythmBPM = saved.bpm;
  });

  it('returns 0 period + 0 msSinceLastBeat when not playing', () => {
    const probe = musicEngine as unknown as BeatProbe;
    probe.playing = false;
    probe.ctx = { currentTime: 1 };
    probe.rhythmBPM = 120;
    expect(musicEngine.getQuarterNotePeriodMs()).toBe(0);
    expect(musicEngine.getMsSinceLastQuarterNote()).toBe(0);
  });

  it('derives quarter period from rhythmBPM when playing', () => {
    const probe = musicEngine as unknown as BeatProbe;
    probe.playing = true;
    probe.ctx = { currentTime: 0 };
    probe.rhythmBPM = 120; // 500ms/quarter
    expect(musicEngine.getQuarterNotePeriodMs()).toBeCloseTo(500);
  });

  it('wraps msSinceLastBeat into [0, period) using audio-ctx clock', () => {
    const probe = musicEngine as unknown as BeatProbe;
    probe.playing = true;
    probe.rhythmBPM = 120; // 500ms/quarter
    probe.ctx = { currentTime: 1.75 }; // 1750ms → mod 500 = 250
    expect(musicEngine.getMsSinceLastQuarterNote()).toBeCloseTo(250);
  });

  it('clamps BPM floor at 30 (2000ms/quarter) when rhythmBPM is very low', () => {
    const probe = musicEngine as unknown as BeatProbe;
    probe.playing = true;
    probe.ctx = { currentTime: 0 };
    probe.rhythmBPM = 10; // below 30 floor
    expect(musicEngine.getQuarterNotePeriodMs()).toBeCloseTo(2000);
  });
});

