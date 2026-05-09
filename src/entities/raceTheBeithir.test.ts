import { describe, expect, it } from 'vitest';
import {
  RACE_DURATION_MS,
  RACE_EXPIRE_DAMAGE_FRACTION,
  RACE_EXPIRE_DAMAGE_MIN,
  applyBeithirSting,
  computeStingExpireDamage,
  cureBeithirSting,
  initialBeithirState,
  isStung,
  stingRemainingFraction,
  tickBeithir,
} from './raceTheBeithir';

describe('raceTheBeithir — pure helper', () => {
  describe('initial state', () => {
    it('starts idle', () => {
      const s = initialBeithirState();
      expect(s.kind).toBe('idle');
      expect(isStung(s)).toBe(false);
      expect(stingRemainingFraction(s)).toBe(0);
    });
  });

  describe('applyBeithirSting', () => {
    it('moves idle → stung with full timer and edge=true', () => {
      const r = applyBeithirSting(initialBeithirState());
      expect(r.appliedEdge).toBe(true);
      expect(r.state.kind).toBe('stung');
      if (r.state.kind === 'stung') {
        expect(r.state.remainingMs).toBe(RACE_DURATION_MS);
      }
      expect(isStung(r.state)).toBe(true);
      expect(stingRemainingFraction(r.state)).toBe(1);
    });

    it('refresh on stung → stung resets timer but reports edge=false', () => {
      // Sting, drain 3 s, sting again — timer should be back to full,
      // but the edge flag is false so the caller skips the onset SFX/banter.
      let s = applyBeithirSting(initialBeithirState()).state;
      s = tickBeithir(s, 3000).state;
      if (s.kind === 'stung') expect(s.remainingMs).toBe(RACE_DURATION_MS - 3000);

      const r = applyBeithirSting(s);
      expect(r.appliedEdge).toBe(false);
      expect(r.state.kind).toBe('stung');
      if (r.state.kind === 'stung') {
        expect(r.state.remainingMs).toBe(RACE_DURATION_MS);
      }
    });
  });

  describe('tickBeithir', () => {
    it('idle ticks are no-ops', () => {
      const s = initialBeithirState();
      const r = tickBeithir(s, 1000);
      expect(r.state.kind).toBe('idle');
      expect(r.expiredEdge).toBe(false);
    });

    it('drains the remaining timer by deltaMs', () => {
      const s = applyBeithirSting(initialBeithirState()).state;
      const r = tickBeithir(s, 1500);
      expect(r.expiredEdge).toBe(false);
      if (r.state.kind === 'stung') {
        expect(r.state.remainingMs).toBe(RACE_DURATION_MS - 1500);
      } else {
        expect.fail('expected stung state, got idle');
      }
    });

    it('fires expiredEdge once at zero and returns idle', () => {
      let s = applyBeithirSting(initialBeithirState()).state;
      s = tickBeithir(s, RACE_DURATION_MS - 1).state; // drain to 1ms remaining
      const r = tickBeithir(s, 2); // cross zero
      expect(r.expiredEdge).toBe(true);
      expect(r.state.kind).toBe('idle');
    });

    it('does not double-fire expiredEdge — second tick after expire is idle no-op', () => {
      const s = applyBeithirSting(initialBeithirState()).state;
      const first = tickBeithir(s, RACE_DURATION_MS + 100);
      expect(first.expiredEdge).toBe(true);
      const second = tickBeithir(first.state, 100);
      expect(second.expiredEdge).toBe(false);
      expect(second.state.kind).toBe('idle');
    });

    it('exact-zero-remaining counts as expired (boundary)', () => {
      const stung = applyBeithirSting(initialBeithirState()).state;
      const r = tickBeithir(stung, RACE_DURATION_MS);
      expect(r.expiredEdge).toBe(true);
      expect(r.state.kind).toBe('idle');
    });
  });

  describe('cureBeithirSting', () => {
    it('cures an active sting → idle with curedEdge=true', () => {
      const s = applyBeithirSting(initialBeithirState()).state;
      const r = cureBeithirSting(s);
      expect(r.curedEdge).toBe(true);
      expect(r.state.kind).toBe('idle');
    });

    it('no-op on idle → curedEdge=false', () => {
      const r = cureBeithirSting(initialBeithirState());
      expect(r.curedEdge).toBe(false);
      expect(r.state.kind).toBe('idle');
    });

    it('cure mid-race stops the timer cleanly (no leak)', () => {
      let s = applyBeithirSting(initialBeithirState()).state;
      s = tickBeithir(s, 4000).state;
      const r = cureBeithirSting(s);
      expect(r.state.kind).toBe('idle');
      // Subsequent ticks stay idle
      const tail = tickBeithir(r.state, 10000);
      expect(tail.state.kind).toBe('idle');
      expect(tail.expiredEdge).toBe(false);
    });
  });

  describe('stingRemainingFraction', () => {
    it('reads 1.0 right after sting', () => {
      const s = applyBeithirSting(initialBeithirState()).state;
      expect(stingRemainingFraction(s)).toBe(1);
    });

    it('reads ~0.5 at half-drain', () => {
      let s = applyBeithirSting(initialBeithirState()).state;
      s = tickBeithir(s, RACE_DURATION_MS / 2).state;
      const f = stingRemainingFraction(s);
      expect(f).toBeGreaterThan(0.49);
      expect(f).toBeLessThan(0.51);
    });

    it('reads 0 when idle', () => {
      expect(stingRemainingFraction(initialBeithirState())).toBe(0);
    });
  });

  describe('computeStingExpireDamage', () => {
    it('glaswegian @ 80 HP eats the floor (25), not 24 (sub-feel-threshold)', () => {
      // floor(80 * 0.30) = 24, max(25, 24) = 25 → floor wins.
      expect(computeStingExpireDamage(80)).toBe(25);
    });

    it('laird @ 130 HP eats floor(130 × 0.30) = 39 (clears the floor)', () => {
      expect(computeStingExpireDamage(130)).toBe(39);
    });

    it('classic @ 100 HP eats max(25, 30) = 30', () => {
      expect(computeStingExpireDamage(100)).toBe(30);
    });

    it('wee_ghostie @ 75 HP hits the floor (Beithir does not scale venom down)', () => {
      // floor(75 * 0.30) = 22, max(25, 22) = 25.
      expect(computeStingExpireDamage(75)).toBe(RACE_EXPIRE_DAMAGE_MIN);
    });

    it('zero or negative HP returns the floor', () => {
      expect(computeStingExpireDamage(0)).toBe(RACE_EXPIRE_DAMAGE_MIN);
      expect(computeStingExpireDamage(-5)).toBe(RACE_EXPIRE_DAMAGE_MIN);
    });

    it('matches the documented fraction constant', () => {
      // Defensive: catch a future edit that changes the fraction
      // without updating the helper's internal math.
      const big = 1000;
      expect(computeStingExpireDamage(big)).toBe(Math.floor(big * RACE_EXPIRE_DAMAGE_FRACTION));
    });
  });

  describe('replay determinism — identical input streams produce identical state streams', () => {
    // Mirror the Shinty Parry parity test: drive the helper through the
    // same script twice and confirm every transition matches. T1
    // contract guard.
    const script = (initial = initialBeithirState()) => {
      const events: string[] = [];
      let s = initial;

      const sting1 = applyBeithirSting(s);
      events.push(`sting1 edge=${sting1.appliedEdge} kind=${sting1.state.kind}`);
      s = sting1.state;

      const t1 = tickBeithir(s, 1000);
      events.push(`tick1 expired=${t1.expiredEdge} kind=${t1.state.kind}`);
      s = t1.state;

      const sting2 = applyBeithirSting(s); // refresh
      events.push(`sting2 edge=${sting2.appliedEdge} kind=${sting2.state.kind}`);
      s = sting2.state;

      const t2 = tickBeithir(s, 5000);
      events.push(`tick2 expired=${t2.expiredEdge} kind=${t2.state.kind}`);
      s = t2.state;

      const cure = cureBeithirSting(s);
      events.push(`cure edge=${cure.curedEdge} kind=${cure.state.kind}`);
      s = cure.state;

      const t3 = tickBeithir(s, 1000);
      events.push(`tick3 expired=${t3.expiredEdge} kind=${t3.state.kind}`);

      return events;
    };

    it('two runs of the same script produce identical traces', () => {
      const a = script();
      const b = script();
      expect(a).toEqual(b);
    });
  });
});
