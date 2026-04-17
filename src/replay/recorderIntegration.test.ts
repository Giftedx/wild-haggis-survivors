import { beforeEach, describe, expect, it } from 'vitest';
import { applyRunSummary, createDefaultSave, migrateSave } from '../utils/save';
import { ReplayRecorder } from './ReplayRecorder';
import { deserializeReplay, serializeReplay } from './replayBlob';

/**
 * Integration: record a synthetic run's worth of input frames via
 * ReplayRecorder, flush through the save v5 pipeline, and confirm the
 * blob round-trips end-to-end. Exercises the record side of T1 without
 * booting Phaser (vitest-node env).
 */
describe('replay recorder ↔ save v5 integration', () => {
  const META = { build: 'integration', seed: 0xC0FFEE, variantKey: 'classic' };
  let recorder: ReplayRecorder;

  beforeEach(() => {
    recorder = new ReplayRecorder(META);
  });

  it('60 recorded frames survive save serialization + migration', () => {
    // Simulate a second of 60fps play: alternating direction + one dash.
    for (let i = 0; i < 60; i++) {
      recorder.pushFrame({
        dtMs: 16.67,
        dx: (i % 2) === 0 ? 1 : -1,
        dy: 0,
        dash: i === 30,
        menu: false,
      });
    }
    const blob = recorder.finalize();
    expect(blob.frames).toHaveLength(60);
    expect(blob.frames[30].dash).toBe(true);

    // Attach via applyRunSummary (the shape GameScene → RunLifecycle uses).
    const save = createDefaultSave();
    const result = applyRunSummary(
      save,
      { timeSurvivedSec: 1, enemiesKilled: 0, bossGold: 0, victory: false },
      {
        level: 1,
        bossKills: 0,
        variantKey: META.variantKey,
        weaponKeys: [],
        runSeed: META.seed,
        replay: blob,
      },
    );
    const entry = result.save.runHistory[0];
    expect(entry.replay?.frameCount).toBe(60);

    // Migrate (simulates localStorage round-trip: JSON stringify → load).
    const json = JSON.stringify(result.save);
    const reloaded = migrateSave(JSON.parse(json));
    const reloadedEntry = reloaded.runHistory[0];
    expect(reloadedEntry.replay).toBeDefined();
    expect(reloadedEntry.replay?.frameCount).toBe(60);
    expect(reloadedEntry.replay?.frames[30].dash).toBe(true);
    expect(reloadedEntry.replay?.seed).toBe(META.seed);
    expect(reloadedEntry.replay?.variantKey).toBe(META.variantKey);
  });

  it('empty-frames recording serializes cleanly (edge case: run aborted at t=0)', () => {
    const blob = recorder.finalize();
    expect(blob.frameCount).toBe(0);

    const json = serializeReplay(blob);
    const parsed = deserializeReplay(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.frames).toEqual([]);
    expect(parsed!.seed).toBe(META.seed);
  });

  it('finalize is idempotent — calling twice produces equivalent blobs', () => {
    for (let i = 0; i < 5; i++) {
      recorder.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false });
    }
    const a = recorder.finalize();
    const b = recorder.finalize();
    expect(b).toEqual(a);
    // Independent copies — mutating one doesn't affect the other.
    b.frames.push({ dtMs: 99, dx: 0, dy: 0, dash: false, menu: false });
    expect(a.frames).toHaveLength(5);
  });

  it('recorder.reset() clears frames but keeps blob shape valid for finalize', () => {
    for (let i = 0; i < 3; i++) {
      recorder.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    }
    recorder.reset();
    const blob = recorder.finalize();
    expect(blob.frames).toEqual([]);
    expect(blob.frameCount).toBe(0);
    expect(blob.seed).toBe(META.seed);
  });
});
