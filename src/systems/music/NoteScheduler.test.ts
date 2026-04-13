import { describe, it, expect, vi } from 'vitest';
import { NoteScheduler } from './NoteScheduler';

type SchedulerCb = (time: number) => number;

function callTimes(mock: ReturnType<typeof vi.fn>): number[] {
  return mock.mock.calls.map((c: unknown[]) => c[0] as number);
}

describe('NoteScheduler', () => {
  describe('start', () => {
    it('sets melody time with 0.3s delay, rhythm/heartbeat at now', () => {
      const s = new NoteScheduler();
      const melody = vi.fn<SchedulerCb>().mockReturnValue(1);
      const rhythm = vi.fn<SchedulerCb>().mockReturnValue(1);
      const heartbeat = vi.fn<SchedulerCb>().mockReturnValue(1);
      s.setMelodyCallback(melody);
      s.setRhythmCallback(rhythm);
      s.setHeartbeatCallback(heartbeat);
      s.start(10);

      s.tick(10);
      expect(melody).not.toHaveBeenCalled();
      expect(rhythm).toHaveBeenCalledOnce();
      expect(heartbeat).toHaveBeenCalledOnce();
    });

    it('fires melody after 0.3s delay', () => {
      const s = new NoteScheduler();
      const melody = vi.fn<SchedulerCb>().mockReturnValue(2);
      s.setMelodyCallback(melody);
      s.start(10);

      s.tick(10.15);
      expect(melody).not.toHaveBeenCalled();

      s.tick(10.25);
      expect(melody).toHaveBeenCalledOnce();
      expect(melody).toHaveBeenCalledWith(expect.closeTo(10.3, 5));
    });
  });

  describe('tick scheduling', () => {
    it('schedules multiple notes within lookahead window', () => {
      const s = new NoteScheduler();
      const rhythm = vi.fn<SchedulerCb>().mockReturnValue(0.03);
      s.setRhythmCallback(rhythm);
      s.start(0);
      s.tick(0);

      const times = callTimes(rhythm);
      expect(times).toHaveLength(2);
      expect(times[0]).toBeCloseTo(0, 5);
      expect(times[1]).toBeCloseTo(0.05, 5);
    });

    it('does nothing without callbacks set', () => {
      const s = new NoteScheduler();
      s.start(0);
      expect(() => s.tick(0)).not.toThrow();
    });
  });

  describe('min interval floors', () => {
    it('melody floor = 0.1s even if callback returns 0', () => {
      const s = new NoteScheduler();
      const melody = vi.fn<SchedulerCb>().mockReturnValue(0);
      s.setMelodyCallback(melody);
      s.start(0);
      s.tick(0.35);

      const times = callTimes(melody);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]! - times[i - 1]!).toBeCloseTo(0.1, 5);
      }
    });

    it('rhythm floor = 0.05s even if callback returns 0', () => {
      const s = new NoteScheduler();
      const rhythm = vi.fn<SchedulerCb>().mockReturnValue(0);
      s.setRhythmCallback(rhythm);
      s.start(0);
      s.tick(0);

      const times = callTimes(rhythm);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]! - times[i - 1]!).toBeCloseTo(0.05, 5);
      }
    });

    it('heartbeat floor = 0.1s even if callback returns 0', () => {
      const s = new NoteScheduler();
      const hb = vi.fn<SchedulerCb>().mockReturnValue(0);
      s.setHeartbeatCallback(hb);
      s.start(0);
      s.tick(0);

      const times = callTimes(hb);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]! - times[i - 1]!).toBeCloseTo(0.1, 5);
      }
    });
  });

  describe('tab-recovery clamping', () => {
    it('skips missed notes after long gap instead of scheduling into past', () => {
      const s = new NoteScheduler();
      const rhythm = vi.fn<SchedulerCb>().mockReturnValue(0.5);
      s.setRhythmCallback(rhythm);
      s.start(0);

      s.tick(0);
      expect(rhythm).toHaveBeenCalledOnce();
      rhythm.mockClear();

      s.tick(100);
      expect(rhythm).toHaveBeenCalledOnce();
      expect(callTimes(rhythm)[0]).toBeGreaterThanOrEqual(100);
    });
  });

  describe('reset', () => {
    it('resets all next times to 0', () => {
      const s = new NoteScheduler();
      const melody = vi.fn<SchedulerCb>().mockReturnValue(1);
      s.setMelodyCallback(melody);
      s.start(50);
      s.tick(50.25);
      expect(melody).toHaveBeenCalledOnce();
      melody.mockClear();

      s.reset();
      s.start(0);
      s.tick(0.25);
      expect(melody).toHaveBeenCalledOnce();
      expect(callTimes(melody)[0]).toBeCloseTo(0.3, 5);
    });
  });
});
