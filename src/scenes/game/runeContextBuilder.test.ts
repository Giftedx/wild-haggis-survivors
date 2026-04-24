import { describe, expect, it } from 'vitest';
import { buildRuneEvalContextFromScene } from './runeContextBuilder';

describe('buildRuneEvalContextFromScene', () => {
  it('threads through every field as-is', () => {
    const ctx = buildRuneEvalContextFromScene({
      biomeKey: 'fog',
      hpFrac: 0.25,
      nearHazardWater: true,
      nearCairn: false,
      ownedRelicsCount: 3,
      ownedWeaponKeys: ['bagpipe_blast'],
      runTimeMs: 45_000,
      combo: 60,
      unopenedChestsCount: 4,
      dashMsAgo: 1500,
      evolvedWeaponsCount: 2,
      killsThisRun: 120,
      justKilled: true,
      lastKillDeltaMs: 200,
      distinctKillTypesIn5s: 4,
      critOnWeakenedThisFrame: true,
      pickupChainDurationMs: 6000,
      namedEliteKilledThisFrame: false,
      killOnThistleThisFrame: false,
      musicBassActive: true,
      nodesVisited: 3,
      postBell: true,
      timeOfDayKey: 'dusk',
    });

    expect(ctx.biomeKey).toBe('fog');
    expect(ctx.hpFrac).toBe(0.25);
    expect(ctx.nearHazardWater).toBe(true);
    expect(ctx.ownedRelicsCount).toBe(3);
    expect(ctx.ownedWeaponKeys).toEqual(['bagpipe_blast']);
    expect(ctx.runTimeMs).toBe(45_000);
    expect(ctx.combo).toBe(60);
    expect(ctx.unopenedChestsCount).toBe(4);
    expect(ctx.dashMsAgo).toBe(1500);
    expect(ctx.evolvedWeaponsCount).toBe(2);
    expect(ctx.killsThisRun).toBe(120);
    expect(ctx.justKilled).toBe(true);
    expect(ctx.lastKillDeltaMs).toBe(200);
    expect(ctx.distinctKillTypesIn5s).toBe(4);
    expect(ctx.critOnWeakenedThisFrame).toBe(true);
    expect(ctx.pickupChainDurationMs).toBe(6000);
    expect(ctx.namedEliteKilledThisFrame).toBe(false);
    expect(ctx.killOnThistleThisFrame).toBe(false);
    expect(ctx.musicBassActive).toBe(true);
    expect(ctx.nodesVisited).toBe(3);
    expect(ctx.postBell).toBe(true);
    expect(ctx.timeOfDayKey).toBe('dusk');
  });
});
