/**
 * replayBridgeInstall — install/teardown contract for the T1 replay
 * bridge inside GameScene. Pure tests; do NOT boot Phaser (per CLAUDE.md
 * "Phaser imports break in node-env vitest").
 *
 * Coverage matrix:
 *   - mode resolution: playback vs record vs off (mutual exclusion)
 *   - playback driver constructed only when blob present
 *   - v1 blob present → playbackV2 is null (curse + composedStats fall
 *     back to live derivation in the caller)
 *   - v2 or v3 blob present → playbackV2 surfaces curse, routes, composedStats
 *   - recorder construction gated on `mode === 'record'`
 *   - recorder meta carries the live curse + composed stats snapshot
 *   - pendingReplayRoutes seeded from v2 or v3 routes (copy, not the same ref)
 *   - reset disposes the prior input and returns a fresh empty queue
 *
 * The recorded-frame pump (`pushFrame` per tick) and the playback
 * cursor advance (`advanceFrame` per tick) live in the scene's
 * `update()` and are NOT in scope for this slice — they're covered by
 * `recorderIntegration.test.ts` and `replayDeterminism.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import {
  installReplayPlayback,
  installReplayRecording,
  resetReplayBridge,
  recordReplayFrame,
  tickReplayPlayback,
} from './replayBridgeInstall';
import { ReplayInput } from '../../replay/ReplayInput';
import { ReplayRecorder } from '../../replay/ReplayRecorder';
import {
  createEmptyReplayBlobV2,
  type ReplayBlobV2,
} from '../../replay/replayBlobV2';
import { createEmptyReplayBlobV3 } from '../../replay/replayBlobV3';
import {
  createEmptyReplayBlob,
  type ReplayBlob,
} from '../../replay/replayBlob';
import type { ComposedPlayerStats } from '../../core/StatComposer';
import { BALANCE } from '../../core/BalanceConfig';

const sampleStats: ComposedPlayerStats = {
  ...BALANCE.player,
  speed: 220,
  maxHp: 110,
  driftDegrees: 8,
  pickupRadius: 90,
  damagePctBonus: 0.05,
  hpRegen: 0.1,
  critBonus: 0.02,
  cooldownReduction: 0.04,
  xpGainBonus: 0.06,
  armorBonus: 1,
  dashCooldownReduction: 0.03,
};

function makeV2Blob(opts: Partial<ReplayBlobV2> = {}): ReplayBlobV2 {
  return {
    ...createEmptyReplayBlobV2({
      build: 'whs-test',
      seed: 99999,
      variantKey: 'classic',
      ...opts,
    }),
    ...opts,
  };
}

function makeV1Blob(): ReplayBlob {
  return createEmptyReplayBlob({
    build: 'whs-test',
    seed: 12345,
    variantKey: 'classic',
  });
}

describe('installReplayPlayback', () => {
  it('returns mode=off, no driver, no blob when nothing is pending and resolver says off', () => {
    const out = installReplayPlayback({ pendingReplay: null, resolvedMode: 'off' });
    expect(out.replayMode).toBe('off');
    expect(out.replayInput).toBeNull();
    expect(out.playbackBlob).toBeNull();
    expect(out.playbackV2).toBeNull();
    expect(out.consumePending).toBe(false);
  });

  it('returns mode=record, no driver when resolver says record and no playback blob', () => {
    const out = installReplayPlayback({ pendingReplay: null, resolvedMode: 'record' });
    expect(out.replayMode).toBe('record');
    expect(out.replayInput).toBeNull();
    expect(out.playbackBlob).toBeNull();
    expect(out.playbackV2).toBeNull();
    expect(out.consumePending).toBe(false);
  });

  it('returns mode=playback and builds a driver when a v1 blob is pending (playbackV2 null)', () => {
    const blob = makeV1Blob();
    const out = installReplayPlayback({ pendingReplay: blob, resolvedMode: 'off' });
    expect(out.replayMode).toBe('playback');
    expect(out.replayInput).toBeInstanceOf(ReplayInput);
    expect(out.playbackBlob).toBe(blob);
    expect(out.playbackV2).toBeNull();
    expect(out.consumePending).toBe(true);
  });

  it('returns mode=playback and surfaces playbackV2 when a v2 blob is pending', () => {
    const blob = makeV2Blob({
      curseKey: 'cailleach_winter',
      composedStats: sampleStats,
    });
    const out = installReplayPlayback({ pendingReplay: blob, resolvedMode: 'off' });
    expect(out.replayMode).toBe('playback');
    expect(out.replayInput).toBeInstanceOf(ReplayInput);
    expect(out.playbackBlob).toBe(blob);
    expect(out.playbackV2).toBe(blob);
    expect(out.consumePending).toBe(true);
  });

  it('surfaces v2 metadata and seeds routes when a v3 blob is pending', () => {
    const routes = [
      {
        slot: 'A' as const,
        routeKey: 'up_the_brae' as const,
        atGameTimeSec: 60,
        defaultedBySetting: false,
      },
    ];
    const blob = createEmptyReplayBlobV3({
      build: 'whs-test',
      seed: 99999,
      variantKey: 'classic',
      curseKey: 'cailleach_winter',
      routes,
      composedStats: sampleStats,
    });

    const playback = installReplayPlayback({ pendingReplay: blob, resolvedMode: 'off' });
    expect(playback.playbackV2).toBe(blob);

    const recording = installReplayRecording({
      replayMode: playback.replayMode,
      playbackV2: playback.playbackV2,
      seed: blob.seed,
      variantKey: blob.variantKey,
      build: blob.build,
      curseKey: blob.curseKey ?? null,
      composedStats: sampleStats,
    });
    expect(recording.pendingReplayRoutes).toEqual(routes);
    expect(recording.pendingReplayRoutes).not.toBe(routes);
  });

  it('playback wins over record when both signals are set (mutual exclusion)', () => {
    const blob = makeV2Blob();
    const out = installReplayPlayback({ pendingReplay: blob, resolvedMode: 'record' });
    expect(out.replayMode).toBe('playback');
    expect(out.replayInput).toBeInstanceOf(ReplayInput);
    expect(out.consumePending).toBe(true);
  });
});

describe('installReplayRecording', () => {
  it('returns null recorder and empty routes when mode is off', () => {
    const out = installReplayRecording({
      replayMode: 'off',
      playbackV2: null,
      seed: 1,
      variantKey: 'classic',
      build: 'whs-test',
      curseKey: null,
      composedStats: sampleStats,
    });
    expect(out.replayRecorder).toBeNull();
    expect(out.pendingReplayRoutes).toEqual([]);
  });

  it('returns null recorder and empty routes during playback', () => {
    const out = installReplayRecording({
      replayMode: 'playback',
      playbackV2: null,
      seed: 1,
      variantKey: 'classic',
      build: 'whs-test',
      curseKey: null,
      composedStats: sampleStats,
    });
    expect(out.replayRecorder).toBeNull();
    expect(out.pendingReplayRoutes).toEqual([]);
  });

  it('builds a recorder with no curse meta when curseKey is null and mode is record', () => {
    const out = installReplayRecording({
      replayMode: 'record',
      playbackV2: null,
      seed: 42,
      variantKey: 'wild',
      build: 'whs-prod',
      curseKey: null,
      composedStats: sampleStats,
    });
    expect(out.replayRecorder).toBeInstanceOf(ReplayRecorder);
    const blob = out.replayRecorder!.finalize();
    expect(blob.seed).toBe(42);
    expect(blob.variantKey).toBe('wild');
    expect(blob.build).toBe('whs-prod');
    // V2-shape fields present because composedStats is always captured
    // (recorder always emits v2 once any v2 field is set).
    expect(blob.version).toBe(2);
    if (blob.version === 2) {
      expect(blob.curseKey).toBeUndefined();
      expect(blob.composedStats?.speed).toBe(sampleStats.speed);
      expect(blob.composedStats?.maxHp).toBe(sampleStats.maxHp);
    }
  });

  it('S1 Phase 2 — folds sporranPicks into the recorder meta when present', () => {
    const out = installReplayRecording({
      replayMode: 'record',
      playbackV2: null,
      seed: 11,
      variantKey: 'classic',
      build: 'whs-dev',
      curseKey: null,
      composedStats: sampleStats,
      sporranPicks: ['boon_silver', 'curse_heavy_legs', 'quirk_haggis_blooded'],
    });
    const blob = out.replayRecorder!.finalize() as { version: number; sporranPicks?: string[] };
    expect(blob.version).toBe(3);
    expect(blob.sporranPicks).toEqual([
      'boon_silver',
      'curse_heavy_legs',
      'quirk_haggis_blooded',
    ]);
  });

  it('S1 Phase 2 — empty sporranPicks does not bump v2 → v3', () => {
    const out = installReplayRecording({
      replayMode: 'record',
      playbackV2: null,
      seed: 12,
      variantKey: 'classic',
      build: 'whs-dev',
      curseKey: null,
      composedStats: sampleStats,
      sporranPicks: [],
    });
    const blob = out.replayRecorder!.finalize();
    // composedStats already triggers v2; empty sporranPicks must not push to v3.
    expect(blob.version).toBe(2);
  });

  it('folds the active curse key into the recorder meta when present', () => {
    const out = installReplayRecording({
      replayMode: 'record',
      playbackV2: null,
      seed: 7,
      variantKey: 'classic',
      build: 'whs-dev',
      curseKey: 'cailleach_winter',
      composedStats: sampleStats,
    });
    const blob = out.replayRecorder!.finalize();
    expect(blob.version).toBe(2);
    if (blob.version === 2) {
      expect(blob.curseKey).toBe('cailleach_winter');
    }
  });

  it('seeds pendingReplayRoutes from playbackV2.routes (slice copy, not same ref)', () => {
    const blob = makeV2Blob();
    blob.routes = [
      {
        slot: 'A',
        routeKey: 'up_the_brae',
        atGameTimeSec: 60,
        defaultedBySetting: false,
      },
      {
        slot: 'B',
        routeKey: 'through_the_kirkyard',
        atGameTimeSec: 180,
        defaultedBySetting: false,
      },
    ];
    const out = installReplayRecording({
      replayMode: 'playback',
      playbackV2: blob,
      seed: 1,
      variantKey: 'classic',
      build: 'whs-test',
      curseKey: null,
      composedStats: sampleStats,
    });
    expect(out.pendingReplayRoutes).toHaveLength(2);
    expect(out.pendingReplayRoutes).not.toBe(blob.routes);
    expect(out.pendingReplayRoutes[0]!.routeKey).toBe('up_the_brae');
  });

  it('returns empty pendingReplayRoutes when playbackV2.routes is undefined', () => {
    const blob = makeV2Blob();
    expect(blob.routes).toBeUndefined();
    const out = installReplayRecording({
      replayMode: 'playback',
      playbackV2: blob,
      seed: 1,
      variantKey: 'classic',
      build: 'whs-test',
      curseKey: null,
      composedStats: sampleStats,
    });
    expect(out.pendingReplayRoutes).toEqual([]);
  });
});

describe('recordReplayFrame', () => {
  it('no-ops when recorder is null', () => {
    expect(() =>
      recordReplayFrame({
        recorder: null,
        snapshot: { dx: 1, dy: 0, dash: false, menu: false },
        dtMs: 16.67,
      }),
    ).not.toThrow();
  });

  it('no-ops when snapshot is null (Player not yet constructed)', () => {
    const blob = makeV2Blob();
    const recorder = new ReplayRecorder({
      build: 'whs-test',
      seed: 1,
      variantKey: 'classic',
    });
    recordReplayFrame({ recorder, snapshot: null, dtMs: 16.67 });
    expect(recorder.finalize().frames).toHaveLength(0);
    // Use blob to keep the import alive across both branches.
    expect(blob.frames).toEqual([]);
  });

  it('pushes a clamped frame copy to the recorder', () => {
    const recorder = new ReplayRecorder({
      build: 'whs-test',
      seed: 1,
      variantKey: 'classic',
    });
    recordReplayFrame({
      recorder,
      snapshot: { dx: 0.5, dy: -0.5, dash: true, menu: false },
      dtMs: 16.67,
    });
    const blob = recorder.finalize();
    expect(blob.frames).toHaveLength(1);
    expect(blob.frames[0]).toMatchObject({
      dx: 0.5,
      dy: -0.5,
      dash: true,
      menu: false,
    });
  });

  it('records every call (recorder owns the cap, helper does not throttle)', () => {
    const recorder = new ReplayRecorder({
      build: 'whs-test',
      seed: 1,
      variantKey: 'classic',
    });
    for (let i = 0; i < 5; i++) {
      recordReplayFrame({
        recorder,
        snapshot: { dx: 0, dy: 0, dash: i === 2, menu: i === 4 },
        dtMs: 16.67,
      });
    }
    const blob = recorder.finalize();
    expect(blob.frames).toHaveLength(5);
    expect(blob.frames[2]!.dash).toBe(true);
    expect(blob.frames[4]!.menu).toBe(true);
  });
});

describe('tickReplayPlayback', () => {
  it('returns exhausted=false when not in playback (driver is null)', () => {
    const out = tickReplayPlayback({ replayInput: null });
    expect(out.exhausted).toBe(false);
  });

  it('advances the cursor and returns exhausted=false while frames remain', () => {
    const blob = makeV2Blob();
    blob.frames.push(
      { dtMs: 16.67, dx: 1, dy: 0, dash: false, menu: false },
      { dtMs: 16.67, dx: 0, dy: 1, dash: false, menu: false },
    );
    blob.frameCount = blob.frames.length;
    const driver = new ReplayInput(blob);
    expect(tickReplayPlayback({ replayInput: driver }).exhausted).toBe(false);
    expect(tickReplayPlayback({ replayInput: driver }).exhausted).toBe(false);
    // Third tick is past the final frame.
    expect(tickReplayPlayback({ replayInput: driver }).exhausted).toBe(true);
  });

  it('returns exhausted=true on the first tick when the blob is empty', () => {
    const blob = makeV2Blob();
    expect(blob.frames).toHaveLength(0);
    const driver = new ReplayInput(blob);
    expect(tickReplayPlayback({ replayInput: driver }).exhausted).toBe(true);
  });
});

describe('resetReplayBridge', () => {
  it('returns null replayInput and empty pendingReplayRoutes when no prior input exists', () => {
    const out = resetReplayBridge({ replayInput: null });
    expect(out.replayInput).toBeNull();
    expect(out.pendingReplayRoutes).toEqual([]);
  });

  it('disposes the prior replay input and returns null', () => {
    const blob = makeV2Blob();
    const driver = new ReplayInput(blob);
    const before = driver.getFrameCount();
    expect(typeof before).toBe('number');
    const out = resetReplayBridge({ replayInput: driver });
    expect(out.replayInput).toBeNull();
    // The v1 driver's destroy is a no-op (no listeners) — we just
    // confirm it doesn't throw and the helper returns the cleared
    // state. Calling again on the now-null ref must also be safe.
    expect(() => resetReplayBridge({ replayInput: null })).not.toThrow();
  });

  it('returns a fresh array per call (no shared reference between resets)', () => {
    const a = resetReplayBridge({ replayInput: null });
    const b = resetReplayBridge({ replayInput: null });
    expect(a.pendingReplayRoutes).not.toBe(b.pendingReplayRoutes);
  });
});
