import { describe, it, expect } from 'vitest';
import {
  buildLivingWorldTracks,
  deriveLivingWorldTrackContextFromSave,
  LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC,
  livingWorldTracksSummary,
  type LivingWorldTrackKey,
} from './livingWorldTracks';
import type { RunHistoryEntry, SaveData } from '../../utils/save/types';

function minimalHistory(partial: Partial<RunHistoryEntry>): RunHistoryEntry {
  return {
    timestamp: 1,
    timeSurvivedSec: partial.timeSurvivedSec ?? 0,
    enemiesKilled: partial.enemiesKilled ?? 0,
    level: partial.level ?? 1,
    bossKills: partial.bossKills ?? 0,
    goldEarned: partial.goldEarned ?? 0,
    bestCombo: partial.bestCombo ?? 0,
    variantKey: partial.variantKey ?? 'classic',
    isVictory: partial.isVictory ?? false,
    weaponKeys: partial.weaponKeys ?? [],
    ...partial,
  };
}

describe('livingWorldTracks (Croft Living-Moor panel view-model)', () => {
  it('emits an ordered, stable list with one entry per track', () => {
    const list = buildLivingWorldTracks();
    const keys = list.map((e) => e.key);
    const expected: LivingWorldTrackKey[] = [
      'companions',
      'selkie_forms',
      'rhythm',
      'atmosphere',
      'music_bridge',
      'croft_home',
    ];
    expect(keys).toEqual(expected);
  });

  it('with empty context only croft_home is shipped (hub row)', () => {
    const list = buildLivingWorldTracks({});
    const byKey = Object.fromEntries(list.map((e) => [e.key, e.status]));
    expect(byKey.croft_home).toBe('shipped');
    expect(byKey.companions).toBe('introduced');
    expect(byKey.selkie_forms).toBe('introduced');
    expect(byKey.rhythm).toBe('introduced');
    expect(byKey.atmosphere).toBe('introduced');
    expect(byKey.music_bridge).toBe('introduced');
  });

  it('marks every track shipped when save-derived context is fully earned', () => {
    const ctx = deriveLivingWorldTrackContextFromSave({
      totalRuns: 1,
      runHistory: [
        minimalHistory({
          variantKey: 'selkie',
          weaponKeys: ['waulking_mallet'],
          seasonalEvent: 'up_helly_aa',
          timeSurvivedSec: LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC,
        }),
      ],
    });
    const list = buildLivingWorldTracks(ctx);
    expect(list.every((e) => e.status === 'shipped')).toBe(true);
  });

  it('deriveLivingWorldTrackContextFromSave: companions need any finished run', () => {
    expect(
      deriveLivingWorldTrackContextFromSave({ totalRuns: 0, runHistory: [] }).hasFinishedCompanionRun,
    ).toBe(false);
    expect(
      deriveLivingWorldTrackContextFromSave({
        totalRuns: 1,
        runHistory: [],
      }).hasFinishedCompanionRun,
    ).toBe(true);
    expect(
      deriveLivingWorldTrackContextFromSave({
        totalRuns: 0,
        runHistory: [minimalHistory({})],
      }).hasFinishedCompanionRun,
    ).toBe(true);
  });

  it('deriveLivingWorldTrackContextFromSave: rhythm accepts pibroch_hammer', () => {
    const ctx = deriveLivingWorldTrackContextFromSave({
      totalRuns: 1,
      runHistory: [minimalHistory({ weaponKeys: ['pibroch_hammer'] })],
    });
    expect(ctx.hasFiredWaulkingMallet).toBe(true);
    expect(buildLivingWorldTracks(ctx).find((e) => e.key === 'rhythm')?.status).toBe('shipped');
  });

  it('deriveLivingWorldTrackContextFromSave: music bridge uses survival threshold', () => {
    const below = deriveLivingWorldTrackContextFromSave({
      totalRuns: 1,
      runHistory: [
        minimalHistory({ timeSurvivedSec: LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC - 1 }),
      ],
    });
    expect(below.hasHeardReactiveMusicBridge).toBe(false);

    const at = deriveLivingWorldTrackContextFromSave({
      totalRuns: 1,
      runHistory: [
        minimalHistory({ timeSurvivedSec: LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC }),
      ],
    });
    expect(at.hasHeardReactiveMusicBridge).toBe(true);
  });

  it('marks the croft surface as shipped even on a fresh save', () => {
    const list = buildLivingWorldTracks({});
    const croft = list.find((e) => e.key === 'croft_home');
    expect(croft).toBeDefined();
    expect(croft?.status).toBe('shipped');
  });

  it('order is monotonically increasing', () => {
    const list = buildLivingWorldTracks();
    for (let i = 1; i < list.length; i++) {
      expect(list[i].order).toBeGreaterThan(list[i - 1].order);
    }
  });

  it('does not crash when called with an empty context', () => {
    expect(() => buildLivingWorldTracks({})).not.toThrow();
    expect(() => buildLivingWorldTracks(undefined)).not.toThrow();
  });

  it('summary tallies shipped/introduced/planned correctly', () => {
    const empty = livingWorldTracksSummary(buildLivingWorldTracks({}));
    expect(empty.total).toBe(6);
    expect(empty.shipped + empty.introduced + empty.planned).toBe(empty.total);
    expect(empty.shipped).toBe(1);
    expect(empty.introduced).toBe(5);
    expect(empty.planned).toBe(0);

    const full = livingWorldTracksSummary(
      buildLivingWorldTracks(
        deriveLivingWorldTrackContextFromSave({
          totalRuns: 1,
          runHistory: [
            minimalHistory({
              variantKey: 'selkie',
              weaponKeys: ['waulking_mallet'],
              seasonalEvent: 'up_helly_aa',
              timeSurvivedSec: LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC,
            }),
          ],
        }),
      ),
    );
    expect(full.shipped).toBe(6);
    expect(full.introduced).toBe(0);
  });

  it('every entry references a non-empty i18n key (no orphan placeholder)', () => {
    const list = buildLivingWorldTracks();
    for (const e of list) {
      expect(e.displayNameKey).toMatch(/^ui\.croft\.livingWorld\./);
      expect(e.descriptionKey).toMatch(/^ui\.croft\.livingWorld\./);
    }
  });

  it('atmosphere only ships for up_helly_aa seasonalEvent, not other events', () => {
    const burns = deriveLivingWorldTrackContextFromSave({
      totalRuns: 1,
      runHistory: [minimalHistory({ seasonalEvent: 'burns_night' })],
    });
    expect(burns.hasSeenUpHellyAaMotif).toBe(false);
    expect(buildLivingWorldTracks(burns).find((e) => e.key === 'atmosphere')?.status).toBe(
      'introduced',
    );
  });

  it('type-check: derives from real SaveData pick shape', () => {
    const slice: Pick<SaveData, 'totalRuns' | 'runHistory'> = {
      totalRuns: 0,
      runHistory: [],
    };
    expect(deriveLivingWorldTrackContextFromSave(slice).hasFinishedCompanionRun).toBe(false);
  });
});
