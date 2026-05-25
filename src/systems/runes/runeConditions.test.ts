import { describe, expect, it } from 'vitest';
import {
  evaluateRuneCondition,
  emptyRuneEvalContext,
  type RuneEvalContext,
} from './runeConditions';

const base: RuneEvalContext = emptyRuneEvalContext();

const ctx = (patch: Partial<RuneEvalContext>): RuneEvalContext => ({ ...base, ...patch });

describe('runeConditions — biome bucket (U1 Task 5)', () => {
  it('biome_fog true when biome is fog', () => {
    expect(evaluateRuneCondition('biome_fog', ctx({ biomeKey: 'fog' }))).toBe(true);
    expect(evaluateRuneCondition('biome_fog', ctx({ biomeKey: 'heather' }))).toBe(false);
  });

  it('biome_bog true on bog', () => {
    expect(evaluateRuneCondition('biome_bog', ctx({ biomeKey: 'bog' }))).toBe(true);
    expect(evaluateRuneCondition('biome_bog', ctx({ biomeKey: null }))).toBe(false);
  });

  it('biome_heather matches heather', () => {
    expect(evaluateRuneCondition('biome_heather', ctx({ biomeKey: 'heather' }))).toBe(true);
  });

  it('near_water_hazard reads the nearHazardWater flag', () => {
    expect(evaluateRuneCondition('near_water_hazard', ctx({ nearHazardWater: true }))).toBe(true);
    expect(evaluateRuneCondition('near_water_hazard', base)).toBe(false);
  });

  it('near_cairn reads the nearCairn flag', () => {
    expect(evaluateRuneCondition('near_cairn', ctx({ nearCairn: true }))).toBe(true);
  });

  it('biome_dusk true when timeOfDayKey is dusk', () => {
    expect(evaluateRuneCondition('biome_dusk', ctx({ timeOfDayKey: 'dusk' }))).toBe(true);
    expect(evaluateRuneCondition('biome_dusk', ctx({ timeOfDayKey: 'night' }))).toBe(false);
  });

  it('biome_cold / biome_coastal / biome_urban match their biomeKey', () => {
    expect(evaluateRuneCondition('biome_cold', ctx({ biomeKey: 'cold' }))).toBe(true);
    expect(evaluateRuneCondition('biome_coastal', ctx({ biomeKey: 'coastal' }))).toBe(true);
    expect(evaluateRuneCondition('biome_urban', ctx({ biomeKey: 'glasgow_close' }))).toBe(true);
    expect(evaluateRuneCondition('biome_urban', ctx({ biomeKey: 'urban' }))).toBe(false);
  });

  it('biome_coastal also accepts loch as the B5-Phase-1 foundation', () => {
    // Loch Edge stands in as the live coastal biome until the Seawrack +
    // Haar coastal cluster ships (B5 Phase 1). The OR-fallback in the
    // evaluator grounds seawrack_rune today; the rune drops off the
    // ungrounded filter in `runeCards.ts`.
    expect(evaluateRuneCondition('biome_coastal', ctx({ biomeKey: 'loch' }))).toBe(true);
    // Other biomes still reject — only coastal + loch qualify.
    expect(evaluateRuneCondition('biome_coastal', ctx({ biomeKey: 'bog' }))).toBe(false);
    expect(evaluateRuneCondition('biome_coastal', ctx({ biomeKey: 'pine' }))).toBe(false);
  });

  it('post_bell reads flag', () => {
    expect(evaluateRuneCondition('post_bell', ctx({ postBell: true }))).toBe(true);
    expect(evaluateRuneCondition('post_bell', base)).toBe(false);
  });
});

describe('runeConditions — state bucket (U1 Task 6)', () => {
  it('hp_low true when hpFrac < 0.3', () => {
    expect(evaluateRuneCondition('hp_low', ctx({ hpFrac: 0.29 }))).toBe(true);
    expect(evaluateRuneCondition('hp_low', ctx({ hpFrac: 0.3 }))).toBe(false);
  });

  it('hp_high true when hpFrac > 0.9', () => {
    expect(evaluateRuneCondition('hp_high', ctx({ hpFrac: 0.91 }))).toBe(true);
    expect(evaluateRuneCondition('hp_high', ctx({ hpFrac: 0.9 }))).toBe(false);
  });

  it('relics_full true at 3 relics', () => {
    expect(evaluateRuneCondition('relics_full', ctx({ ownedRelicsCount: 3 }))).toBe(true);
    expect(evaluateRuneCondition('relics_full', ctx({ ownedRelicsCount: 2 }))).toBe(false);
  });

  it('weapon_bagpipes true only when bagpipes owned', () => {
    expect(evaluateRuneCondition('weapon_bagpipes', ctx({ ownedWeaponKeys: ['bagpipes'] }))).toBe(true);
    expect(evaluateRuneCondition('weapon_bagpipes', ctx({ ownedWeaponKeys: ['bagpipe_blast'] }))).toBe(false);
    expect(evaluateRuneCondition('weapon_bagpipes', ctx({ ownedWeaponKeys: ['caber_toss'] }))).toBe(false);
  });

  it('run_early true under 60s, run_late true past 20min', () => {
    expect(evaluateRuneCondition('run_early', ctx({ runTimeMs: 30_000 }))).toBe(true);
    expect(evaluateRuneCondition('run_early', ctx({ runTimeMs: 60_000 }))).toBe(false);
    expect(evaluateRuneCondition('run_late', ctx({ runTimeMs: 20 * 60_000 + 1 }))).toBe(true);
    expect(evaluateRuneCondition('run_late', ctx({ runTimeMs: 20 * 60_000 }))).toBe(false);
  });

  it('combo_high true at combo>=50', () => {
    expect(evaluateRuneCondition('combo_high', ctx({ combo: 50 }))).toBe(true);
    expect(evaluateRuneCondition('combo_high', ctx({ combo: 49 }))).toBe(false);
  });

  it('chests_many true at 3+ unopened chests', () => {
    expect(evaluateRuneCondition('chests_many', ctx({ unopenedChestsCount: 3 }))).toBe(true);
    expect(evaluateRuneCondition('chests_many', ctx({ unopenedChestsCount: 2 }))).toBe(false);
  });

  it('dash_recent_2s true when dashMsAgo<=2000', () => {
    expect(evaluateRuneCondition('dash_recent_2s', ctx({ dashMsAgo: 0 }))).toBe(true);
    expect(evaluateRuneCondition('dash_recent_2s', ctx({ dashMsAgo: 2000 }))).toBe(true);
    expect(evaluateRuneCondition('dash_recent_2s', ctx({ dashMsAgo: 2001 }))).toBe(false);
    expect(evaluateRuneCondition('dash_recent_2s', ctx({ dashMsAgo: null }))).toBe(false);
  });

  it('evolved_multi true at 2+ evolved weapons', () => {
    expect(evaluateRuneCondition('evolved_multi', ctx({ evolvedWeaponsCount: 2 }))).toBe(true);
    expect(evaluateRuneCondition('evolved_multi', ctx({ evolvedWeaponsCount: 1 }))).toBe(false);
  });
});

describe('runeConditions — action-chain bucket (U1 Task 7)', () => {
  it('every_nth_kill:10 pulses true at killsThisRun ∈ {10,20,30,...} when justKilled', () => {
    expect(evaluateRuneCondition('every_nth_kill:10', ctx({ killsThisRun: 10, justKilled: true }))).toBe(true);
    expect(evaluateRuneCondition('every_nth_kill:10', ctx({ killsThisRun: 20, justKilled: true }))).toBe(true);
    expect(evaluateRuneCondition('every_nth_kill:10', ctx({ killsThisRun: 10, justKilled: false }))).toBe(false);
    expect(evaluateRuneCondition('every_nth_kill:10', ctx({ killsThisRun: 11, justKilled: true }))).toBe(false);
    expect(evaluateRuneCondition('every_nth_kill:10', ctx({ killsThisRun: 0, justKilled: true }))).toBe(false);
  });

  it('kill_cascade true when lastKillDeltaMs<=500', () => {
    expect(evaluateRuneCondition('kill_cascade', ctx({ lastKillDeltaMs: 500 }))).toBe(true);
    expect(evaluateRuneCondition('kill_cascade', ctx({ lastKillDeltaMs: 501 }))).toBe(false);
    expect(evaluateRuneCondition('kill_cascade', base)).toBe(false);
  });

  it('three_types_in_5s true at distinctKillTypesIn5s>=3', () => {
    expect(evaluateRuneCondition('three_types_in_5s', ctx({ distinctKillTypesIn5s: 3 }))).toBe(true);
    expect(evaluateRuneCondition('three_types_in_5s', ctx({ distinctKillTypesIn5s: 2 }))).toBe(false);
  });

  it('crit_on_weakened reads the pulse flag', () => {
    expect(evaluateRuneCondition('crit_on_weakened', ctx({ critOnWeakenedThisFrame: true }))).toBe(true);
  });

  it('pickup_chain_5s true at pickupChainDurationMs>=5000', () => {
    expect(evaluateRuneCondition('pickup_chain_5s', ctx({ pickupChainDurationMs: 5000 }))).toBe(true);
    expect(evaluateRuneCondition('pickup_chain_5s', ctx({ pickupChainDurationMs: 4999 }))).toBe(false);
  });

  it('dashed_5s_ago true in a 500ms window around 5s post-dash', () => {
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: 5000 }))).toBe(true);
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: 4800 }))).toBe(true);
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: 5300 }))).toBe(true);
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: 4500 }))).toBe(false);
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: 5500 }))).toBe(false);
    expect(evaluateRuneCondition('dashed_5s_ago', ctx({ dashMsAgo: null }))).toBe(false);
  });

  it('kill_named_elite / kill_on_thistle / music_bass_active read their pulse/state flags', () => {
    expect(evaluateRuneCondition('kill_named_elite', ctx({ namedEliteKilledThisFrame: true }))).toBe(true);
    expect(evaluateRuneCondition('kill_on_thistle', ctx({ killOnThistleThisFrame: true }))).toBe(true);
    expect(evaluateRuneCondition('music_bass_active', ctx({ musicBassActive: true }))).toBe(true);
  });

  it('visited_3_nodes true at nodesVisited>=3', () => {
    expect(evaluateRuneCondition('visited_3_nodes', ctx({ nodesVisited: 3 }))).toBe(true);
    expect(evaluateRuneCondition('visited_3_nodes', ctx({ nodesVisited: 2 }))).toBe(false);
  });
});

describe('runeConditions — defaults', () => {
  it('empty context resolves every condition to false', () => {
    const keys = [
      'biome_fog', 'biome_bog', 'biome_heather', 'near_water_hazard', 'near_cairn',
      'biome_dusk', 'biome_cold', 'biome_coastal', 'post_bell', 'biome_urban',
      'hp_low', 'hp_high', 'relics_full', 'weapon_bagpipes', 'run_early',
      'run_late', 'combo_high', 'chests_many', 'dash_recent_2s', 'evolved_multi',
      'every_nth_kill:10', 'kill_cascade', 'three_types_in_5s', 'crit_on_weakened',
      'pickup_chain_5s', 'dashed_5s_ago', 'kill_named_elite', 'kill_on_thistle',
      'music_bass_active', 'visited_3_nodes',
    ] as const;
    for (const k of keys) {
      expect(evaluateRuneCondition(k, base), `condition ${k} leaks true from empty ctx`).toBe(false);
    }
  });
});
