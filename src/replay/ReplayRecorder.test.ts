import { describe, expect, it } from 'vitest';
import { ReplayRecorder } from './ReplayRecorder';
import { BALANCE } from '../core/BalanceConfig';
import { captureComposedStats } from './composedStatsSnapshot';
import type { ComposedPlayerStats } from '../core/StatComposer';

const META = { build: 'test', seed: 42, variantKey: 'classic' };

const sampleStats: ComposedPlayerStats = {
  ...BALANCE.player,
  speed: 200,
  maxHp: 100,
  driftDegrees: 10,
  pickupRadius: 100,
  damagePctBonus: 0,
  hpRegen: 0,
  critBonus: 0,
  cooldownReduction: 0,
  xpGainBonus: 0,
  armorBonus: 0,
  dashCooldownReduction: 0,
};

describe('ReplayRecorder v1 defaults', () => {
  it('starts with zero frames; finalize returns empty blob', () => {
    const r = new ReplayRecorder(META);
    expect(r.getFrameCount()).toBe(0);
    const blob = r.finalize();
    expect(blob.version).toBe(1);
    expect(blob.frameCount).toBe(0);
    expect(blob.frames).toEqual([]);
    expect(blob.build).toBe(META.build);
    expect(blob.seed).toBe(META.seed);
    expect(blob.variantKey).toBe(META.variantKey);
  });

  it('records 3 frames in order', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: true, menu: false });
    r.pushFrame({ dtMs: 16, dx: 0, dy: -1, dash: false, menu: true });
    expect(r.getFrameCount()).toBe(3);

    const blob = r.finalize();
    expect(blob.version).toBe(1);
    expect(blob.frameCount).toBe(3);
    expect(blob.frames[0].dx).toBe(1);
    expect(blob.frames[1].dash).toBe(true);
    expect(blob.frames[2].menu).toBe(true);
  });

  it('clamps on push (dtMs > 100, |dir| > 1)', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 400, dx: 3, dy: 4, dash: false, menu: false });
    const blob = r.finalize();
    expect(blob.frames[0].dtMs).toBe(100);
    const len = Math.hypot(blob.frames[0].dx, blob.frames[0].dy);
    expect(len).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('reset() clears frames but preserves metadata', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    r.reset();
    expect(r.getFrameCount()).toBe(0);
    const blob = r.finalize();
    expect(blob.seed).toBe(META.seed);
  });

  it('finalize() returns an independent snapshot', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 1, dy: 0, dash: false, menu: false });
    const snapshot = r.finalize();
    r.pushFrame({ dtMs: 16, dx: 0, dy: 1, dash: false, menu: false });
    expect(snapshot.frameCount).toBe(1);
    expect(snapshot.frames).toHaveLength(1);
  });
});

describe('ReplayRecorder v2 upgrade path', () => {
  it('finalize returns v1 when no curse / stats / routes present', () => {
    const r = new ReplayRecorder(META);
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false });
    const blob = r.finalize();
    expect(blob.version).toBe(1);
  });

  it('finalize returns v2 when curseKey is set at construction', () => {
    const r = new ReplayRecorder({ ...META, curseKey: 'heavy_legs' });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
    expect(
      (blob as { curseKey?: string }).curseKey,
    ).toBe('heavy_legs');
  });

  it('finalize returns v2 when composedStats snapshot is set', () => {
    const r = new ReplayRecorder({
      ...META,
      composedStats: captureComposedStats(sampleStats),
    });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
  });

  it('pushRoute captured — finalize returns v2 with route history', () => {
    const r = new ReplayRecorder(META);
    r.pushRoute({
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    });
    const blob = r.finalize();
    expect(blob.version).toBe(2);
    const v2 = blob as { routes?: Array<{ routeKey: string }> };
    expect(v2.routes?.length).toBe(1);
    expect(v2.routes?.[0].routeKey).toBe('up_the_brae');
  });

  it('pushRoute copies pick fields — later mutation of the input is ignored', () => {
    const r = new ReplayRecorder(META);
    const pick = {
      slot: 'A' as const,
      routeKey: 'up_the_brae' as const,
      atGameTimeSec: 305,
      defaultedBySetting: false,
    };
    r.pushRoute(pick);
    (pick as { atGameTimeSec: number }).atGameTimeSec = 9999;
    const blob = r.finalize();
    const v2 = blob as { routes?: Array<{ atGameTimeSec: number }> };
    expect(v2.routes?.[0].atGameTimeSec).toBe(305);
  });

  it('reset clears frames + routes; construction meta still pins v2', () => {
    const r = new ReplayRecorder({ ...META, curseKey: 'heavy_legs' });
    r.pushFrame({ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false });
    r.pushRoute({
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    });
    r.reset();
    const blob = r.finalize();
    expect(blob.version).toBe(2); // curseKey meta preserved → still v2
    expect(blob.frameCount).toBe(0);
    expect((blob as { routes?: unknown[] }).routes).toBeUndefined();
  });
});
