import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MOTION_TIMING } from '../core/motionTiming';

const notifySpy = vi.hoisted(() => vi.fn((_: number) => {}));

vi.mock('./music/ProceduralMusicEngine', () => ({
  musicEngine: { notifyGameplaySfxImpulse: (s: number) => notifySpy(s) },
}));

let mockCtx: AudioContext | null = null;
const fakeBus = { connect: vi.fn(), disconnect: vi.fn() };

vi.mock('./audioContext', () => ({
  getAudioContext: () => mockCtx,
  getOutputNode: () => fakeBus,
  /** Production queues retries until user gesture; tests with null ctx never flush. */
  runWhenAudioActivated: vi.fn(),
}));

function makeFakeAudioContext(): AudioContext {
  const gainShell = () => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  const oscShell = () => ({
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    detune: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });
  return {
    state: 'running',
    currentTime: 2,
    sampleRate: 48000,
    destination: {} as AudioDestinationNode,
    createGain: vi.fn(gainShell),
    createOscillator: vi.fn(oscShell),
    createBiquadFilter: vi.fn(() => ({
      type: 'highpass',
      frequency: { value: 5000 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  } as unknown as AudioContext;
}

import { AudioSystem } from './AudioSystem';

describe('AudioSystem music duck impulses', () => {
  beforeEach(() => {
    notifySpy.mockClear();
    fakeBus.connect.mockClear();
    mockCtx = makeFakeAudioContext();
  });

  it('forwards MOTION_TIMING strengths after WebAudio graph is ready', () => {
    const sys = new AudioSystem();
    sys.playKillImmediate();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckKill);
    sys.playPlayerHit();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckPlayerHit);
    sys.playBossWarning();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckBoss);
    sys.playDeath();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckDeath);
    sys.playLevelUp();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckLevelUp);
    sys.playAchievement();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckAchievement);
    sys.playPurchaseImmediate();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckPurchase);
    sys.playMoorMomentImmediate();
    expect(notifySpy).toHaveBeenCalledWith(MOTION_TIMING.musicDuckMoorMoment);
  });

  it('does not notify when SFX disabled', () => {
    const sys = new AudioSystem();
    sys.setEnabled(false);
    sys.playKillImmediate();
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it('does not notify when AudioContext is unavailable', () => {
    mockCtx = null;
    const sys = new AudioSystem();
    sys.playKillImmediate();
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
