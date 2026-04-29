import { describe, expect, it } from 'vitest';
import {
  BURST_MS,
  BURST_SPEED_MUL,
  MAX_PIPS,
  createDriftMasteryState,
  isBurstActive,
  tickDriftMastery,
} from './driftMastery';

const inertInput = {
  inputX: 0,
  inputY: 0,
  driftSign: 1 as const,
  dtMs: 16,
  consumePressed: false,
};

describe('createDriftMasteryState', () => {
  it('starts at zero pips, zero charge, no burst', () => {
    const s = createDriftMasteryState();
    expect(s.pips).toBe(0);
    expect(s.chargeMs).toBe(0);
    expect(s.burstRemainingMs).toBe(0);
  });
});

describe('tickDriftMastery — charge accrual', () => {
  it('does not charge while input is below dead-zone', () => {
    const r = tickDriftMastery(createDriftMasteryState(), {
      ...inertInput,
      dtMs: 100,
    });
    expect(r.state.chargeMs).toBe(0);
    expect(r.state.pips).toBe(0);
  });

  it('charges while moving with full-magnitude input', () => {
    let s = createDriftMasteryState();
    for (let i = 0; i < 30; i++) {
      const r = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      });
      s = r.state;
    }
    // 30 ticks × 16 ms × ~1.0 score × 1.2/ms = 576 ms charge
    expect(s.chargeMs).toBeCloseTo(30 * 16 * 1.2, 0);
    expect(s.pips).toBe(0);
  });

  it('mints first pip after roughly MS_PER_PIP / CHARGE_GAIN_PER_MS of motion', () => {
    // Charge gain rate is 1.2 ms/ms; first pip needs 1000 ms of charge.
    // ⇒ ~833 ms of real time at full magnitude.
    let s = createDriftMasteryState();
    let totalDt = 0;
    while (s.pips === 0 && totalDt < 5000) {
      const r = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      });
      s = r.state;
      totalDt += 16;
    }
    expect(s.pips).toBe(1);
    expect(totalDt).toBeGreaterThan(800);
    expect(totalDt).toBeLessThan(900);
  });

  it('caps pips at MAX_PIPS even with sustained motion', () => {
    let s = createDriftMasteryState();
    // Run far longer than 3 pips' worth of charge.
    for (let i = 0; i < 1000; i++) {
      const r = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      });
      s = r.state;
    }
    expect(s.pips).toBe(MAX_PIPS);
  });

  it('decays charge while standing still', () => {
    // Pre-load some charge.
    let s = createDriftMasteryState();
    for (let i = 0; i < 10; i++) {
      s = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      }).state;
    }
    const charged = s.chargeMs;
    expect(charged).toBeGreaterThan(0);
    // Now stand still for a long stretch — charge decays.
    s = tickDriftMastery(s, { ...inertInput, dtMs: 2000 }).state;
    expect(s.chargeMs).toBeLessThan(charged);
  });
});

describe('tickDriftMastery — burst consume', () => {
  function chargeToOnePip(): ReturnType<typeof createDriftMasteryState> {
    let s = createDriftMasteryState();
    while (s.pips === 0) {
      s = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      }).state;
    }
    return s;
  }

  it('consumes a pip and starts a burst on the press edge', () => {
    const s = chargeToOnePip();
    const r = tickDriftMastery(s, {
      inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: true,
    });
    expect(r.state.pips).toBe(0);
    expect(r.state.burstRemainingMs).toBeCloseTo(BURST_MS, 0);
    expect(r.burstFiredEdge).toBe(true);
    expect(r.driftCancelLerp).toBe(0);
    expect(r.speedMul).toBe(BURST_SPEED_MUL);
  });

  it('does nothing on consume edge when no pips banked', () => {
    const s = createDriftMasteryState();
    const r = tickDriftMastery(s, {
      inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: true,
    });
    expect(r.state.pips).toBe(0);
    expect(r.state.burstRemainingMs).toBe(0);
    expect(r.burstFiredEdge).toBe(false);
    expect(r.driftCancelLerp).toBe(1);
    expect(r.speedMul).toBe(1);
  });

  it('does not double-fire while a burst is already active', () => {
    let s = chargeToOnePip();
    // Bank a second pip so we have ammo for an attempted re-fire.
    while (s.pips < 2) {
      s = tickDriftMastery(s, {
        inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: false,
      }).state;
    }
    // First consume.
    s = tickDriftMastery(s, {
      inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: true,
    }).state;
    expect(s.pips).toBe(1);
    // Mid-burst second press — should be ignored.
    const r = tickDriftMastery(s, {
      inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: true,
    });
    expect(r.state.pips).toBe(1);
    expect(r.burstFiredEdge).toBe(false);
  });

  it('burst expires after BURST_MS and the cancel lerp returns to 1', () => {
    let s = chargeToOnePip();
    s = tickDriftMastery(s, {
      inputX: 1, inputY: 0, driftSign: 1, dtMs: 16, consumePressed: true,
    }).state;
    expect(isBurstActive(s)).toBe(true);
    // Advance well past burst duration.
    const r = tickDriftMastery(s, { ...inertInput, dtMs: BURST_MS + 100 });
    expect(isBurstActive(r.state)).toBe(false);
    expect(r.driftCancelLerp).toBe(1);
    expect(r.speedMul).toBe(1);
  });
});

describe('tickDriftMastery — replay determinism', () => {
  it('produces identical state from identical input streams', () => {
    const stream = Array.from({ length: 200 }, (_, i) => ({
      inputX: Math.cos(i * 0.07),
      inputY: Math.sin(i * 0.07),
      driftSign: 1 as const,
      dtMs: 16,
      consumePressed: i === 100,
    }));
    let a = createDriftMasteryState();
    let b = createDriftMasteryState();
    for (const inp of stream) {
      a = tickDriftMastery(a, inp).state;
      b = tickDriftMastery(b, inp).state;
    }
    expect(a).toEqual(b);
  });
});
