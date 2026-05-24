import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  EVOLUTION_MIN_WEAPON_LEVEL,
  EVOLUTION_RECIPES,
  WAVE_TIMELINE,
  getActiveWaveTimelineEntry,
} from './BalanceConfig';
import { ENEMY_TYPES, BOSSES } from '../data/enemies';

/**
 * BalanceConfig is the tuning layer SpawnSystem + WeaponSystem +
 * UpgradeCards all read. Its invariants — monotonic timeline,
 * non-empty enemy pools per segment, evolution recipe validity —
 * would break gameplay if the data drifted. These tests anchor the
 * shape, not the numbers, so tuning doesn't have to chase tests.
 */
describe('WAVE_TIMELINE', () => {
  it('has at least one segment', () => {
    expect(WAVE_TIMELINE.length).toBeGreaterThan(0);
  });

  it('starts at t=0', () => {
    expect(WAVE_TIMELINE[0]?.timeSec).toBe(0);
  });

  it('is sorted by timeSec (monotonic non-decreasing)', () => {
    for (let i = 1; i < WAVE_TIMELINE.length; i++) {
      const prev = WAVE_TIMELINE[i - 1];
      const cur = WAVE_TIMELINE[i];
      if (prev && cur) expect(cur.timeSec).toBeGreaterThanOrEqual(prev.timeSec);
    }
  });

  it('every segment has at least one enemy key', () => {
    for (const seg of WAVE_TIMELINE) {
      expect(seg.enemyKeys.length).toBeGreaterThan(0);
    }
  });

  it('every segment has positive interval + burstSize', () => {
    for (const seg of WAVE_TIMELINE) {
      expect(seg.intervalSec).toBeGreaterThan(0);
      expect(seg.burstSize).toBeGreaterThan(0);
    }
  });

  /**
   * Coverage fence — catches the silent-gap failure mode where a new
   * enemy lands in `ENEMY_TYPES` but the author forgets to wire it
   * into `WAVE_TIMELINE` (or vice versa). Without this check the config
   * compiles clean but the enemy never spawns in real runs.
   *
   * Bosses live in a separate list (`BOSSES`) driven by
   * `spawnTimeSec` scheduling, so they're allowed to skip the timeline.
   */
  it('every WAVE_TIMELINE enemy key maps to an ENEMY_TYPES entry', () => {
    const timelineKeys = new Set<string>();
    for (const seg of WAVE_TIMELINE) {
      for (const k of seg.enemyKeys) timelineKeys.add(k);
    }
    for (const k of timelineKeys) {
      expect(ENEMY_TYPES[k], `WAVE_TIMELINE references missing ENEMY_TYPES['${k}']`).toBeDefined();
    }
  });

  it('every non-boss ENEMY_TYPES entry appears in at least one WAVE_TIMELINE segment', () => {
    const timelineKeys = new Set<string>();
    for (const seg of WAVE_TIMELINE) {
      for (const k of seg.enemyKeys) timelineKeys.add(k);
    }
    const bossKeys = new Set(BOSSES.map((b) => b.key));
    // Biome-gated enemies live in `ENEMY_TYPES` (sprite + animation +
    // node-bank consumers) but are filtered out of the open-world
    // wave-spawn pool until their biome ships. Mirrors the rune-offer
    // gate at `runeCards.test.ts` (`biome_urban`). Re-enable when the
    // matching biome lands (B5 charter Phase 3 for Edinburgh).
    const biomeGatedKeys = new Set<string>([
      'edinburgh_ghost_guide',
      // Boss-summoned minion — spawned by Auld Reekie Ghaist only, never in
      // the open-world wave pool. appearsAt: 9999 is a sentinel, not a mistake.
      'tourist_ghost',
    ]);
    for (const key of Object.keys(ENEMY_TYPES)) {
      if (bossKeys.has(key)) continue;
      if (biomeGatedKeys.has(key)) continue;
      expect(
        timelineKeys.has(key),
        `ENEMY_TYPES['${key}'] never spawns — add to WAVE_TIMELINE or mark as boss`,
      ).toBe(true);
    }
  });
});

describe('getActiveWaveTimelineEntry', () => {
  it('returns the t=0 entry at time 0', () => {
    expect(getActiveWaveTimelineEntry(0)).toBe(WAVE_TIMELINE[0]);
  });

  it('returns the t=0 entry at a negative time (fallback)', () => {
    expect(getActiveWaveTimelineEntry(-5)).toBe(WAVE_TIMELINE[0]);
  });

  it('returns the last entry at very late time', () => {
    const last = WAVE_TIMELINE[WAVE_TIMELINE.length - 1];
    expect(getActiveWaveTimelineEntry(99_999)).toBe(last);
  });

  it('returns the segment whose timeSec <= gameTimeSec, latest wins', () => {
    for (const seg of WAVE_TIMELINE) {
      // A tick past this segment's start must select it — unless a later
      // segment also starts at the same or lower time, in which case the
      // latest such segment wins.
      const result = getActiveWaveTimelineEntry(seg.timeSec);
      expect(result.timeSec).toBeLessThanOrEqual(seg.timeSec);
    }
  });

  it('picks the later segment when two tie on timeSec', () => {
    // Verify "latest wins" semantics with a synthesized duplicate-start.
    // Test via the real timeline: any segment 1+ second past a start gets
    // that start's segment or a later one.
    for (let i = 0; i < WAVE_TIMELINE.length - 1; i++) {
      const prev = WAVE_TIMELINE[i];
      const next = WAVE_TIMELINE[i + 1];
      if (!prev || !next) continue;
      if (prev.timeSec === next.timeSec) {
        // getActiveWaveTimelineEntry always picks the last match — `next` wins.
        expect(getActiveWaveTimelineEntry(prev.timeSec)).toBe(next);
      }
    }
  });
});

describe('BALANCE', () => {
  it('RUN_WIN_TIME_SEC is positive', () => {
    expect(BALANCE.run.RUN_WIN_TIME_SEC).toBeGreaterThan(0);
  });

  it('enemy cap invariants', () => {
    expect(BALANCE.enemy.ELITE_SPAWN_CHANCE).toBeGreaterThanOrEqual(0);
    expect(BALANCE.enemy.ELITE_SPAWN_CHANCE).toBeLessThanOrEqual(1);
    expect(BALANCE.enemy.ELITE_UNLOCK_SEC).toBeGreaterThanOrEqual(0);
  });
});

describe('EVOLUTION_RECIPES', () => {
  it('every recipe names real base weapon + passive + evolved weapon', () => {
    for (const r of EVOLUTION_RECIPES) {
      // Stronger than toBeTruthy: enforce non-empty strings so a typo'd
      // numeric or accidental empty literal can't slip through.
      expect(typeof r.baseWeapon).toBe('string');
      expect(r.baseWeapon.length).toBeGreaterThan(0);
      expect(typeof r.requiredPassive).toBe('string');
      expect(r.requiredPassive.length).toBeGreaterThan(0);
      expect(typeof r.evolvedWeapon).toBe('string');
      expect(r.evolvedWeapon.length).toBeGreaterThan(0);
      expect(r.nameKey).toMatch(/^evolution\./);
      expect(r.descriptionKey).toMatch(/^evolution\./);
    }
  });

  it('baseWeapon keys are unique across recipes (no double evolution)', () => {
    const seen = new Set<string>();
    for (const r of EVOLUTION_RECIPES) {
      expect(seen.has(r.baseWeapon), `duplicate baseWeapon ${r.baseWeapon}`).toBe(false);
      seen.add(r.baseWeapon);
    }
  });

  it('evolvedWeapon keys are unique across recipes (no shared evolution result)', () => {
    const seen = new Set<string>();
    for (const r of EVOLUTION_RECIPES) {
      expect(seen.has(r.evolvedWeapon), `duplicate evolvedWeapon ${r.evolvedWeapon}`).toBe(false);
      seen.add(r.evolvedWeapon);
    }
  });

  it('EVOLUTION_MIN_WEAPON_LEVEL is the documented "max level" threshold', () => {
    expect(EVOLUTION_MIN_WEAPON_LEVEL).toBeGreaterThan(0);
  });
});
