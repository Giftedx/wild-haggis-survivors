/**
 * Cù Sìth — three-bay charge behaviour (pure state machine).
 *
 * The fairy hound of Scottish folklore: a giant green dog of the
 * Sithean (fairy mounds) whose baying comes exactly three times —
 * on the third bay, he charges. Women hearing the third bay would
 * faint; sailors called it the mark of the sea-god's hunt.
 *
 * Behaviour sequence:
 *   Stage 0  Approach at base speed. When the haggis enters the 250 px
 *            trigger ring the first hool fires and the Cu Sith freezes.
 *   Stage 1  First bay — frozen 1.5 s telegraph window.
 *   Stage 2  Second bay — frozen 1.5 s telegraph window.
 *   Stage 3  Third bay + charge — sprints at 3× speed toward the
 *            player position locked at transition time (sidesteppable
 *            with good read), 1.5 s duration.
 *   Stage 4  Post-charge fallback — ordinary chase. No further bays.
 *
 * Refs: SCOTTISH_RESEARCH.md §1.2 (Cù Sìth, fairy hound, death omen).
 */

export const CU_SITH_TRIGGER_PX = 250;
export const CU_SITH_HOOL_DURATION_MS = 1500;
export const CU_SITH_CHARGE_DURATION_MS = 1500;
export const CU_SITH_CHARGE_SPEED_MUL = 3;

export interface CuSithState {
  readonly stage: 0 | 1 | 2 | 3 | 4;
  readonly timerMs: number;
  /** Player position locked at stage 2→3 transition — charge target. */
  readonly lockedTargetX: number;
  readonly lockedTargetY: number;
}

export function initialCuSithState(): CuSithState {
  return { stage: 0, timerMs: 0, lockedTargetX: 0, lockedTargetY: 0 };
}

export interface CuSithTickInput {
  readonly tx: number;     // current player x
  readonly ty: number;     // current player y
  readonly ex: number;     // enemy x
  readonly ey: number;     // enemy y
  readonly deltaMs: number;
}

export type CuSithVelocityMode = 'approach' | 'freeze' | 'charge' | 'chase';

export interface CuSithTickResult {
  readonly nextState: CuSithState;
  /** Which velocity the caller should apply this tick. */
  readonly velocityMode: CuSithVelocityMode;
  /**
   * Speed multiplier to apply when velocityMode is 'charge'.
   * Always 1 for other modes.
   */
  readonly speedMul: number;
  /** Bay number fired this tick (1, 2, or 3), or null. Caller emits CU_SITH_BAY. */
  readonly bayFired: 1 | 2 | 3 | null;
}

export function simulateCuSithBehaviour(
  state: CuSithState,
  input: CuSithTickInput,
): CuSithTickResult {
  const { tx, ty, ex, ey, deltaMs } = input;

  // Stage 0 — approach until trigger radius.
  if (state.stage === 0) {
    const dx = tx - ex;
    const dy = ty - ey;
    if (dx * dx + dy * dy <= CU_SITH_TRIGGER_PX * CU_SITH_TRIGGER_PX) {
      return {
        nextState: { stage: 1, timerMs: CU_SITH_HOOL_DURATION_MS, lockedTargetX: 0, lockedTargetY: 0 },
        velocityMode: 'freeze',
        speedMul: 1,
        bayFired: 1,
      };
    }
    return {
      nextState: state,
      velocityMode: 'approach',
      speedMul: 1,
      bayFired: null,
    };
  }

  // Stages 1 and 2 — frozen bays.
  if (state.stage === 1 || state.stage === 2) {
    const newTimer = state.timerMs - deltaMs;
    if (newTimer <= 0) {
      const nextStage = (state.stage + 1) as 2 | 3;
      const nextTimerMs = nextStage === 3 ? CU_SITH_CHARGE_DURATION_MS : CU_SITH_HOOL_DURATION_MS;
      const lockedTargetX = nextStage === 3 ? tx : state.lockedTargetX;
      const lockedTargetY = nextStage === 3 ? ty : state.lockedTargetY;
      // Velocity this tick is still freeze — charge begins next tick.
      return {
        nextState: { stage: nextStage, timerMs: nextTimerMs, lockedTargetX, lockedTargetY },
        velocityMode: 'freeze',
        speedMul: 1,
        bayFired: nextStage as 2 | 3,
      };
    }
    return {
      nextState: { ...state, timerMs: newTimer },
      velocityMode: 'freeze',
      speedMul: 1,
      bayFired: null,
    };
  }

  // Stage 3 — charge toward locked target.
  if (state.stage === 3) {
    const newTimer = state.timerMs - deltaMs;
    if (newTimer <= 0) {
      return {
        nextState: { stage: 4, timerMs: 0, lockedTargetX: state.lockedTargetX, lockedTargetY: state.lockedTargetY },
        velocityMode: 'chase',
        speedMul: 1,
        bayFired: null,
      };
    }
    return {
      nextState: { ...state, timerMs: newTimer },
      velocityMode: 'charge',
      speedMul: CU_SITH_CHARGE_SPEED_MUL,
      bayFired: null,
    };
  }

  // Stage 4 — post-charge chase; no further bays.
  return {
    nextState: state,
    velocityMode: 'chase',
    speedMul: 1,
    bayFired: null,
  };
}
