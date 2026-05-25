import { describe, expect, it } from 'vitest';
import {
  DIRK_DANCE_BEAT_INTERVAL_MS,
  DIRK_DANCE_BLEED_DAMAGE_FRACTION,
  DIRK_DANCE_BLEED_DURATION_MS,
  DIRK_DANCE_BLEED_TICK_MS,
  DIRK_DANCE_TIMING_GRACE_MS,
  advanceDirkDanceCombo,
  buildDirkDanceComboPlan,
  startDirkDanceCombo,
} from './dirkDanceCombo';

const deg = (rad: number): number => Math.round((rad * 180) / Math.PI);

describe('buildDirkDanceComboPlan', () => {
  it('plans the three Dirk Dance cuts as center, left, right on fixed 130ms beats', () => {
    const plan = buildDirkDanceComboPlan({ facingRad: 0, level: 1 });

    expect(plan.strikes).toHaveLength(3);
    expect(plan.strikes.map((s) => s.beatIndex)).toEqual([0, 1, 2]);
    expect(plan.strikes.map((s) => s.label)).toEqual(['center', 'left', 'right']);
    expect(plan.strikes.map((s) => s.timeOffsetMs)).toEqual([
      0,
      DIRK_DANCE_BEAT_INTERVAL_MS,
      DIRK_DANCE_BEAT_INTERVAL_MS * 2,
    ]);
    expect(plan.strikes.map((s) => deg(s.angleRad))).toEqual([0, -35, 35]);
  });

  it('puts the bleed descriptor only on the final cut', () => {
    const plan = buildDirkDanceComboPlan({ facingRad: 0, level: 1 });

    expect(plan.strikes[0].bleed).toBeNull();
    expect(plan.strikes[1].bleed).toBeNull();
    expect(plan.strikes[2].bleed).toEqual({
      source: 'dirk_dance_finisher',
      durationMs: DIRK_DANCE_BLEED_DURATION_MS,
      tickMs: DIRK_DANCE_BLEED_TICK_MS,
      ticks: 4,
      damagePerTick: Math.ceil(plan.strikes[2].damage * DIRK_DANCE_BLEED_DAMAGE_FRACTION),
    });
  });

  it('scales strike and bleed damage by Dirk Dance weapon level without RNG', () => {
    const levelOne = buildDirkDanceComboPlan({ facingRad: 0, level: 1 });
    const levelThreeA = buildDirkDanceComboPlan({ facingRad: 0, level: 3 });
    const levelThreeB = buildDirkDanceComboPlan({ facingRad: 0, level: 3 });

    expect(levelOne.strikes[0].damage).toBe(9);
    expect(levelThreeA.strikes[0].damage).toBe(14);
    expect(levelThreeA.strikes[2].bleed?.damagePerTick).toBe(3);
    expect(levelThreeA).toEqual(levelThreeB);
  });

  it('clamps invalid levels to the level-one shape', () => {
    expect(buildDirkDanceComboPlan({ facingRad: 0, level: 0 }))
      .toEqual(buildDirkDanceComboPlan({ facingRad: 0, level: 1 }));
    expect(buildDirkDanceComboPlan({ facingRad: 0, level: Number.NaN }))
      .toEqual(buildDirkDanceComboPlan({ facingRad: 0, level: 1 }));
  });
});

describe('advanceDirkDanceCombo', () => {
  it('tracks the three combo beats and completes after the finisher', () => {
    const initial = startDirkDanceCombo(1000);

    const first = advanceDirkDanceCombo(initial, 1000, { facingRad: 0, level: 1 });
    expect(first.strike?.label).toBe('center');
    expect(first.completed).toBe(false);
    expect(first.expired).toBe(false);

    const early = advanceDirkDanceCombo(first.nextState, 1129, { facingRad: 0, level: 1 });
    expect(early.strike).toBeNull();
    expect(early.nextState.nextBeatIndex).toBe(1);

    const second = advanceDirkDanceCombo(early.nextState, 1130, { facingRad: 0, level: 1 });
    expect(second.strike?.label).toBe('left');

    const third = advanceDirkDanceCombo(second.nextState, 1260, { facingRad: 0, level: 1 });
    expect(third.strike?.label).toBe('right');
    expect(third.completed).toBe(true);
    expect(third.nextState.nextBeatIndex).toBe(3);
  });

  it('expires a stale combo step instead of emitting a late beat', () => {
    const initial = startDirkDanceCombo(0);
    const first = advanceDirkDanceCombo(initial, 0, { facingRad: 0, level: 1 });
    const tooLateForSecondBeat = DIRK_DANCE_BEAT_INTERVAL_MS + DIRK_DANCE_TIMING_GRACE_MS + 1;

    const stale = advanceDirkDanceCombo(first.nextState, tooLateForSecondBeat, { facingRad: 0, level: 1 });

    expect(stale.strike).toBeNull();
    expect(stale.expired).toBe(true);
    expect(stale.completed).toBe(false);
  });
});
