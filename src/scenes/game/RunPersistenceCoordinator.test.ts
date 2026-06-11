import { describe, expect, it, vi } from 'vitest';
import { RunPersistenceCoordinator } from './RunPersistenceCoordinator';
import type {
  RunHistoryContext,
  RunResult,
  RunSummary,
  SaveData,
} from '../../utils/save';

/**
 * RunPersistenceCoordinator owns the replay-gated wrappers around the
 * run-end persistence pair. These tests pin the contract so a future
 * playback path can't quietly start writing duplicate Chronicle rows.
 */
describe('RunPersistenceCoordinator', () => {
  const stubSave = {} as SaveData;
  const stubSummary = {} as RunSummary;
  const stubContext = {} as RunHistoryContext;

  function makeHooks(opts: { replay: boolean; runResult?: RunResult }) {
    const record = vi.fn<(s: RunSummary, r: RunResult) => void>();
    const defaultRunResult: RunResult = {
      save: stubSave,
      goldEarned: 99,
      newlyUnlockedVariants: [],
    };
    const recordRun = vi.fn<(s: RunSummary, ctx?: RunHistoryContext) => RunResult>(
      () => opts.runResult ?? defaultRunResult,
    );
    const loadSave = vi.fn(() => stubSave);
    const recorder = { record };
    return {
      record,
      recordRun,
      loadSave,
      hooks: {
        isReplayPlayback: () => opts.replay,
        getHistoryRecorder: () => recorder,
        recordRun,
        loadSave,
      },
    };
  }

  describe('recordToHistory (T307)', () => {
    it('writes to history on a normal (non-replay) run', () => {
      const { record, hooks } = makeHooks({ replay: false });
      const coord = new RunPersistenceCoordinator(hooks);
      const result: RunResult = {
        save: stubSave,
        goldEarned: 5,
        newlyUnlockedVariants: [],
      };
      coord.recordToHistory(stubSummary, result);
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith(stubSummary, result);
    });

    it('no-ops during replay playback', () => {
      const { record, hooks } = makeHooks({ replay: true });
      const coord = new RunPersistenceCoordinator(hooks);
      coord.recordToHistory(stubSummary, {
        save: stubSave,
        goldEarned: 5,
        newlyUnlockedVariants: [],
      });
      expect(record).not.toHaveBeenCalled();
    });

    it('reads playback state at call time, not at construction', () => {
      let isReplay = false;
      const record = vi.fn<(s: RunSummary, r: RunResult) => void>();
      const coord = new RunPersistenceCoordinator({
        isReplayPlayback: () => isReplay,
        getHistoryRecorder: () => ({ record }),
        recordRun: vi.fn(),
        loadSave: vi.fn(() => stubSave),
      });
      coord.recordToHistory(stubSummary, {
        save: stubSave,
        goldEarned: 0,
        newlyUnlockedVariants: [],
      });
      expect(record).toHaveBeenCalledTimes(1);
      isReplay = true;
      coord.recordToHistory(stubSummary, {
        save: stubSave,
        goldEarned: 0,
        newlyUnlockedVariants: [],
      });
      expect(record).toHaveBeenCalledTimes(1); // no new call after flip
    });
  });

  describe('recordRun (T1 replay)', () => {
    it('delegates to underlying recordRun on a normal run', () => {
      const { recordRun, hooks } = makeHooks({ replay: false });
      const coord = new RunPersistenceCoordinator(hooks);
      const out = coord.recordRun(stubSummary, stubContext);
      expect(recordRun).toHaveBeenCalledTimes(1);
      expect(out.goldEarned).toBe(99);
    });

    it('returns a no-pollution RunResult during playback', () => {
      const { recordRun, loadSave, hooks } = makeHooks({ replay: true });
      const coord = new RunPersistenceCoordinator(hooks);
      const out = coord.recordRun(stubSummary, stubContext);
      expect(recordRun).not.toHaveBeenCalled();
      expect(loadSave).toHaveBeenCalledTimes(1);
      expect(out.save).toBe(stubSave);
      expect(out.goldEarned).toBe(0);
      expect(out.newlyUnlockedVariants).toEqual([]);
    });
  });
});
