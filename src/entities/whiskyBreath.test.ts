import { describe, expect, it } from 'vitest';
import {
  BREATH_BASE_DAMAGE,
  BREATH_RADIUS_PX,
  BREATH_STACKS_REQUIRED,
  STACKS_MAX,
  createWhiskyBreathState,
  isBreathReady,
  tickWhiskyBreath,
} from './whiskyBreath';

const inertInput = { killsThisFrame: 0, breathPressed: false };

describe('createWhiskyBreathState', () => {
  it('starts at zero stacks, not ready to fire', () => {
    const s = createWhiskyBreathState();
    expect(s.stacks).toBe(0);
    expect(isBreathReady(s)).toBe(false);
  });
});

describe('tickWhiskyBreath — stack accrual', () => {
  it('banks one stack per non-boss kill', () => {
    let s = createWhiskyBreathState();
    for (let i = 0; i < 5; i++) {
      s = tickWhiskyBreath(s, { ...inertInput, killsThisFrame: 1 }).state;
    }
    expect(s.stacks).toBe(5);
  });

  it('handles multiple kills in one frame', () => {
    const r = tickWhiskyBreath(createWhiskyBreathState(), {
      ...inertInput,
      killsThisFrame: 3,
    });
    expect(r.state.stacks).toBe(3);
  });

  it('caps at STACKS_MAX even with sustained kills', () => {
    let s = createWhiskyBreathState();
    for (let i = 0; i < 50; i++) {
      s = tickWhiskyBreath(s, { ...inertInput, killsThisFrame: 1 }).state;
    }
    expect(s.stacks).toBe(STACKS_MAX);
  });

  it('clamps negative or fractional kill deltas to zero', () => {
    const a = tickWhiskyBreath(createWhiskyBreathState(), {
      ...inertInput,
      killsThisFrame: -3,
    });
    expect(a.state.stacks).toBe(0);
    const b = tickWhiskyBreath(createWhiskyBreathState(), {
      ...inertInput,
      killsThisFrame: 1.7,
    });
    expect(b.state.stacks).toBe(1);
  });
});

describe('tickWhiskyBreath — breath consume', () => {
  function chargeToThreshold(): ReturnType<typeof createWhiskyBreathState> {
    let s = createWhiskyBreathState();
    while (!isBreathReady(s)) {
      s = tickWhiskyBreath(s, { ...inertInput, killsThisFrame: 1 }).state;
    }
    return s;
  }

  it('does not fire below the required threshold', () => {
    const r = tickWhiskyBreath(createWhiskyBreathState(), {
      killsThisFrame: 1,
      breathPressed: true,
    });
    expect(r.burstFiredEdge).toBe(false);
    expect(r.burst).toBeNull();
    expect(r.state.stacks).toBe(1);
  });

  it('fires at threshold and zeroes the stack', () => {
    const charged = chargeToThreshold();
    expect(charged.stacks).toBe(BREATH_STACKS_REQUIRED);
    const r = tickWhiskyBreath(charged, {
      killsThisFrame: 0,
      breathPressed: true,
    });
    expect(r.burstFiredEdge).toBe(true);
    expect(r.burst).not.toBeNull();
    expect(r.burst!.stacksSpent).toBe(BREATH_STACKS_REQUIRED);
    expect(r.burst!.damage).toBe(BREATH_BASE_DAMAGE); // 18 × (8/8) = 18
    expect(r.burst!.radius).toBe(BREATH_RADIUS_PX);
    expect(r.state.stacks).toBe(0);
  });

  it('scales damage with the actual stack at fire-time (full charge = 1.5×)', () => {
    let s = createWhiskyBreathState();
    while (s.stacks < STACKS_MAX) {
      s = tickWhiskyBreath(s, { ...inertInput, killsThisFrame: 1 }).state;
    }
    const r = tickWhiskyBreath(s, { killsThisFrame: 0, breathPressed: true });
    expect(r.burst!.stacksSpent).toBe(STACKS_MAX);
    // 18 × (12 / 8) = 27
    expect(r.burst!.damage).toBe(27);
  });

  it('does not fire on a press if stacks are below threshold even by one', () => {
    let s = createWhiskyBreathState();
    while (s.stacks < BREATH_STACKS_REQUIRED - 1) {
      s = tickWhiskyBreath(s, { ...inertInput, killsThisFrame: 1 }).state;
    }
    const r = tickWhiskyBreath(s, { killsThisFrame: 0, breathPressed: true });
    expect(r.burstFiredEdge).toBe(false);
    expect(r.state.stacks).toBe(BREATH_STACKS_REQUIRED - 1);
  });

  it('press without ready-state caches no buffered intent (single-edge consume)', () => {
    const s = createWhiskyBreathState();
    // Press while empty — no fire, no state mutation beyond the kill bank.
    const r1 = tickWhiskyBreath(s, { killsThisFrame: 1, breathPressed: true });
    expect(r1.burstFiredEdge).toBe(false);
    // Now charge to threshold WITHOUT pressing — should not auto-fire.
    let s2 = r1.state;
    while (!isBreathReady(s2)) {
      s2 = tickWhiskyBreath(s2, { ...inertInput, killsThisFrame: 1 }).state;
    }
    expect(s2.stacks).toBe(BREATH_STACKS_REQUIRED);
    // Stays armed until an explicit press.
    const r2 = tickWhiskyBreath(s2, { ...inertInput });
    expect(r2.burstFiredEdge).toBe(false);
    expect(r2.state.stacks).toBe(BREATH_STACKS_REQUIRED);
  });
});

describe('tickWhiskyBreath — replay determinism', () => {
  it('produces identical state from identical input streams', () => {
    const stream = Array.from({ length: 200 }, (_, i) => ({
      killsThisFrame: (i % 7 === 0) ? 1 : 0,
      breathPressed: i === 100,
    }));
    let a = createWhiskyBreathState();
    let b = createWhiskyBreathState();
    for (const inp of stream) {
      a = tickWhiskyBreath(a, inp).state;
      b = tickWhiskyBreath(b, inp).state;
    }
    expect(a).toEqual(b);
  });
});
