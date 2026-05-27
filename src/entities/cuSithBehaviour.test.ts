import { describe, expect, it } from 'vitest';
import {
  simulateCuSithBehaviour,
  initialCuSithState,
  CU_SITH_TRIGGER_PX,
  CU_SITH_HOOL_DURATION_MS,
  CU_SITH_CHARGE_DURATION_MS,
  CU_SITH_CHARGE_SPEED_MUL,
} from './cuSithBehaviour';

/** Helper: place enemy far from player — outside trigger radius. */
function farInput(overrides: Partial<{ tx: number; ty: number; ex: number; ey: number; deltaMs: number }> = {}) {
  return {
    tx: 0, ty: 0,
    ex: CU_SITH_TRIGGER_PX + 100, ey: 0,
    deltaMs: 16,
    ...overrides,
  };
}

/** Helper: place enemy just inside trigger radius. */
function closeInput(overrides: Partial<{ tx: number; ty: number; ex: number; ey: number; deltaMs: number }> = {}) {
  return {
    tx: 0, ty: 0,
    ex: CU_SITH_TRIGGER_PX - 1, ey: 0,
    deltaMs: 16,
    ...overrides,
  };
}

describe('initialCuSithState', () => {
  it('starts in stage 0 with zero timer and no locked target', () => {
    const state = initialCuSithState();
    expect(state.stage).toBe(0);
    expect(state.timerMs).toBe(0);
    expect(state.lockedTargetX).toBe(0);
    expect(state.lockedTargetY).toBe(0);
  });
});

describe('simulateCuSithBehaviour — stage 0 approach', () => {
  it('stays in stage 0 while outside trigger radius', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(
      initialCuSithState(), farInput(),
    );
    expect(nextState.stage).toBe(0);
    expect(velocityMode).toBe('approach');
    expect(bayFired).toBeNull();
  });

  it('transitions to stage 1 and fires bay 1 when entering trigger radius', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(
      initialCuSithState(), closeInput(),
    );
    expect(nextState.stage).toBe(1);
    expect(nextState.timerMs).toBe(CU_SITH_HOOL_DURATION_MS);
    expect(velocityMode).toBe('freeze');
    expect(bayFired).toBe(1);
  });

  it('fires bay 1 exactly on the trigger boundary (≤ not <)', () => {
    // Enemy exactly at the trigger radius — should NOT transition.
    const atEdge = simulateCuSithBehaviour(
      initialCuSithState(),
      { tx: 0, ty: 0, ex: CU_SITH_TRIGGER_PX, ey: 0, deltaMs: 16 },
    );
    // dx=250, distSq=62500 = 250^2, so 250^2 ≤ 250^2 → triggers.
    expect(atEdge.nextState.stage).toBe(1);
    expect(atEdge.bayFired).toBe(1);
  });
});

describe('simulateCuSithBehaviour — stage 1 (first hool)', () => {
  const stage1 = { stage: 1 as const, timerMs: CU_SITH_HOOL_DURATION_MS, lockedTargetX: 0, lockedTargetY: 0 };

  it('stays frozen while timer has not elapsed', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(stage1, farInput({ deltaMs: 100 }));
    expect(nextState.stage).toBe(1);
    expect(nextState.timerMs).toBeCloseTo(CU_SITH_HOOL_DURATION_MS - 100);
    expect(velocityMode).toBe('freeze');
    expect(bayFired).toBeNull();
  });

  it('transitions to stage 2 and fires bay 2 when first hool timer expires', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(
      stage1, farInput({ deltaMs: CU_SITH_HOOL_DURATION_MS }),
    );
    expect(nextState.stage).toBe(2);
    expect(nextState.timerMs).toBe(CU_SITH_HOOL_DURATION_MS);
    expect(velocityMode).toBe('freeze');
    expect(bayFired).toBe(2);
  });

  it('does not lock a target on 1→2 transition', () => {
    const { nextState } = simulateCuSithBehaviour(
      stage1, farInput({ tx: 42, ty: 99, deltaMs: CU_SITH_HOOL_DURATION_MS }),
    );
    expect(nextState.lockedTargetX).toBe(0);
    expect(nextState.lockedTargetY).toBe(0);
  });
});

describe('simulateCuSithBehaviour — stage 2 (second hool)', () => {
  const stage2 = { stage: 2 as const, timerMs: CU_SITH_HOOL_DURATION_MS, lockedTargetX: 0, lockedTargetY: 0 };

  it('stays frozen while timer has not elapsed', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(stage2, farInput({ deltaMs: 50 }));
    expect(nextState.stage).toBe(2);
    expect(velocityMode).toBe('freeze');
    expect(bayFired).toBeNull();
  });

  it('transitions to stage 3 and fires bay 3 when second hool timer expires', () => {
    const { nextState, velocityMode, bayFired } = simulateCuSithBehaviour(
      stage2, farInput({ tx: 10, ty: 20, deltaMs: CU_SITH_HOOL_DURATION_MS }),
    );
    expect(nextState.stage).toBe(3);
    expect(nextState.timerMs).toBe(CU_SITH_CHARGE_DURATION_MS);
    expect(velocityMode).toBe('freeze');
    expect(bayFired).toBe(3);
  });

  it('locks player position at 2→3 transition so charge target is fixed', () => {
    const { nextState } = simulateCuSithBehaviour(
      stage2, farInput({ tx: 777, ty: 888, deltaMs: CU_SITH_HOOL_DURATION_MS }),
    );
    expect(nextState.lockedTargetX).toBe(777);
    expect(nextState.lockedTargetY).toBe(888);
  });

  it('velocity is still freeze on the 2→3 transition tick (charge begins next tick)', () => {
    const { velocityMode } = simulateCuSithBehaviour(
      stage2, farInput({ deltaMs: CU_SITH_HOOL_DURATION_MS }),
    );
    expect(velocityMode).toBe('freeze');
  });
});

describe('simulateCuSithBehaviour — stage 3 (charge)', () => {
  const stage3 = {
    stage: 3 as const,
    timerMs: CU_SITH_CHARGE_DURATION_MS,
    lockedTargetX: 500,
    lockedTargetY: 300,
  };

  it('charges at 3× speed while timer is active', () => {
    const { nextState, velocityMode, speedMul, bayFired } = simulateCuSithBehaviour(
      stage3, farInput({ deltaMs: 100 }),
    );
    expect(nextState.stage).toBe(3);
    expect(velocityMode).toBe('charge');
    expect(speedMul).toBe(CU_SITH_CHARGE_SPEED_MUL);
    expect(bayFired).toBeNull();
  });

  it('preserves locked target during charge', () => {
    const { nextState } = simulateCuSithBehaviour(
      stage3, farInput({ tx: 0, ty: 0, deltaMs: 100 }),
    );
    expect(nextState.lockedTargetX).toBe(500);
    expect(nextState.lockedTargetY).toBe(300);
  });

  it('transitions to stage 4 (chase fallback) when charge timer expires', () => {
    const { nextState, velocityMode, speedMul, bayFired } = simulateCuSithBehaviour(
      stage3, farInput({ deltaMs: CU_SITH_CHARGE_DURATION_MS }),
    );
    expect(nextState.stage).toBe(4);
    expect(velocityMode).toBe('chase');
    expect(speedMul).toBe(1);
    expect(bayFired).toBeNull();
  });

  it('fires no further bays after the third bay', () => {
    // Exhaust stage 3 and confirm stage 4 never emits.
    const endCharge = simulateCuSithBehaviour(stage3, farInput({ deltaMs: CU_SITH_CHARGE_DURATION_MS }));
    expect(endCharge.bayFired).toBeNull();
    const inStage4 = simulateCuSithBehaviour(endCharge.nextState, farInput({ deltaMs: 1000 }));
    expect(inStage4.bayFired).toBeNull();
  });
});

describe('simulateCuSithBehaviour — stage 4 (post-charge chase)', () => {
  const stage4 = { stage: 4 as const, timerMs: 0, lockedTargetX: 0, lockedTargetY: 0 };

  it('chases at normal speed indefinitely', () => {
    const { nextState, velocityMode, speedMul, bayFired } = simulateCuSithBehaviour(
      stage4, farInput({ deltaMs: 5000 }),
    );
    expect(nextState.stage).toBe(4);
    expect(velocityMode).toBe('chase');
    expect(speedMul).toBe(1);
    expect(bayFired).toBeNull();
  });
});

describe('simulateCuSithBehaviour — full 3-bay sequence', () => {
  it('walks through all four stage transitions emitting bays 1, 2, 3 in order', () => {
    const bays: (1 | 2 | 3)[] = [];

    // Stage 0 → 1 (approach then trigger)
    let state = initialCuSithState();
    let result = simulateCuSithBehaviour(state, closeInput());
    if (result.bayFired) bays.push(result.bayFired);
    state = result.nextState;
    expect(state.stage).toBe(1);

    // Stage 1 → 2 (first hool expires)
    result = simulateCuSithBehaviour(state, farInput({ deltaMs: CU_SITH_HOOL_DURATION_MS }));
    if (result.bayFired) bays.push(result.bayFired);
    state = result.nextState;
    expect(state.stage).toBe(2);

    // Stage 2 → 3 (second hool expires, lock target)
    result = simulateCuSithBehaviour(state, farInput({ tx: 42, ty: 7, deltaMs: CU_SITH_HOOL_DURATION_MS }));
    if (result.bayFired) bays.push(result.bayFired);
    state = result.nextState;
    expect(state.stage).toBe(3);
    expect(state.lockedTargetX).toBe(42);
    expect(state.lockedTargetY).toBe(7);

    // Stage 3 → 4 (charge complete)
    result = simulateCuSithBehaviour(state, farInput({ deltaMs: CU_SITH_CHARGE_DURATION_MS }));
    state = result.nextState;
    expect(state.stage).toBe(4);

    // Three bays fired in order.
    expect(bays).toEqual([1, 2, 3]);
  });

  it('approaching tick does not fire bays', () => {
    const result = simulateCuSithBehaviour(initialCuSithState(), farInput({ deltaMs: 16 }));
    expect(result.bayFired).toBeNull();
    expect(result.velocityMode).toBe('approach');
  });
});
