/**
 * Cailleach Gauntlet — V2 of The Moor Remembers.
 *
 * Pure state machine. Each call advances the state by one frame given
 * the current game time, the cairn-touch set this run, the player
 * position (for candle-ring placement at the lighting moment), and
 * win/lose signals.
 *
 * Phases:
 *   idle         — < 7 touched
 *   armed        — 7 touched, game-time < 14:00 (candles scheduled)
 *   candles_lit  — 14:00 reached OR 7th touch after 14:00; candles burning
 *   engaged      — 15:00 reached; Cailleach is on field
 *   resolved     — boss-dead (win) or player-dead (lose); outcome locked
 *
 * Spec: `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 */

export const GAUNTLET_TOUCH_THRESHOLD = 7;
export const GAUNTLET_CANDLE_TIME_MS = 14 * 60 * 1000;
export const GAUNTLET_BOSS_TIME_MS = 15 * 60 * 1000;
export const GAUNTLET_CANDLE_RING_RADIUS_PX = 200;

export type GauntletPhase =
  | 'idle'
  | 'armed'
  | 'candles_lit'
  | 'engaged'
  | 'resolved';

export interface CailleachGauntletState {
  readonly phase: GauntletPhase;
  readonly touchedSavedAts: readonly number[];
  readonly armedAtMs: number | null;
  readonly candleLightAtMs: number | null;
  readonly bossSpawnAtMs: number | null;
  readonly outcome: 'win' | 'lose' | null;
  readonly candleRing: readonly { readonly x: number; readonly y: number }[];
}

export interface GauntletTickInput {
  readonly gameTimeMs: number;
  readonly touchedSavedAts: readonly number[];
  readonly playerX: number;
  readonly playerY: number;
  readonly bossDead: boolean;
  readonly playerDead: boolean;
}

export function initialGauntletState(): CailleachGauntletState {
  return {
    phase: 'idle',
    touchedSavedAts: [],
    armedAtMs: null,
    candleLightAtMs: null,
    bossSpawnAtMs: null,
    outcome: null,
    candleRing: [],
  };
}

/**
 * Compute the Callanish-style candle ring around a centre point. Seven
 * points spaced 2π/7 radians apart, first point on the +X axis.
 */
export function computeCandleRing(
  centerX: number,
  centerY: number,
): { readonly x: number; readonly y: number }[] {
  const ring: { x: number; y: number }[] = [];
  for (let i = 0; i < GAUNTLET_TOUCH_THRESHOLD; i++) {
    const angle = (2 * Math.PI * i) / GAUNTLET_TOUCH_THRESHOLD;
    ring.push({
      x: centerX + GAUNTLET_CANDLE_RING_RADIUS_PX * Math.cos(angle),
      y: centerY + GAUNTLET_CANDLE_RING_RADIUS_PX * Math.sin(angle),
    });
  }
  return ring;
}

/**
 * Single-step transition function — applies at most one phase change.
 * Used by `advanceGauntlet` which iterates this until stable so a tick
 * can cleanly cross multiple phases when its inputs warrant.
 */
function stepGauntlet(
  state: CailleachGauntletState,
  input: GauntletTickInput,
): CailleachGauntletState {
  if (state.phase === 'resolved') return state;

  const touchCount = input.touchedSavedAts.length;

  if (state.phase === 'engaged') {
    if (input.bossDead) {
      return { ...state, phase: 'resolved', outcome: 'win' };
    }
    if (input.playerDead) {
      return { ...state, phase: 'resolved', outcome: 'lose' };
    }
    return state;
  }

  if (state.phase === 'candles_lit') {
    if (input.gameTimeMs >= GAUNTLET_BOSS_TIME_MS) {
      return {
        ...state,
        phase: 'engaged',
        bossSpawnAtMs: input.gameTimeMs,
      };
    }
    return state;
  }

  if (state.phase === 'armed') {
    if (input.gameTimeMs >= GAUNTLET_CANDLE_TIME_MS) {
      return {
        ...state,
        phase: 'candles_lit',
        candleLightAtMs: input.gameTimeMs,
        candleRing: computeCandleRing(input.playerX, input.playerY),
      };
    }
    return state;
  }

  if (state.phase === 'idle') {
    if (touchCount >= GAUNTLET_TOUCH_THRESHOLD) {
      const captured = input.touchedSavedAts.slice(0, GAUNTLET_TOUCH_THRESHOLD);
      return {
        ...state,
        phase: 'armed',
        touchedSavedAts: captured,
        armedAtMs: input.gameTimeMs,
      };
    }
    return state;
  }

  return state;
}

/**
 * Drive the gauntlet state machine forward, applying any phase
 * transitions whose conditions are met given the current input. A
 * single call may cross multiple phases (e.g. idle → armed →
 * candles_lit → engaged when called for the first time after 15:00 with
 * 7 cairns touched). Stops when one step produces no change.
 */
export function advanceGauntlet(
  state: CailleachGauntletState,
  input: GauntletTickInput,
): CailleachGauntletState {
  let cur = state;
  for (let i = 0; i < 5; i++) {
    const next = stepGauntlet(cur, input);
    if (next === cur) return cur;
    cur = next;
  }
  return cur;
}
