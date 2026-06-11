import { WEAPON_DEFS } from '../data/weapons';
import { computeLevelScaledWeaponStats } from './weaponLevelScaling';

export const DIRK_DANCE_BEAT_INTERVAL_MS = 130;
export const DIRK_DANCE_TIMING_GRACE_MS = 80;
export const DIRK_DANCE_BLEED_DURATION_MS = 1200;
export const DIRK_DANCE_BLEED_TICK_MS = 300;
export const DIRK_DANCE_BLEED_DAMAGE_FRACTION = 0.15;

export type DirkDanceStrikeLabel = 'center' | 'left' | 'right';

export interface DirkDanceBleedDescriptor {
  readonly source: 'dirk_dance_finisher';
  readonly durationMs: number;
  readonly tickMs: number;
  readonly ticks: number;
  readonly damagePerTick: number;
}

export interface DirkDanceStrike {
  readonly beatIndex: number;
  readonly label: DirkDanceStrikeLabel;
  readonly timeOffsetMs: number;
  readonly angleRad: number;
  readonly damage: number;
  readonly bleed: DirkDanceBleedDescriptor | null;
}

export interface DirkDanceComboPlan {
  readonly strikes: readonly DirkDanceStrike[];
}

export interface DirkDanceComboOptions {
  readonly facingRad: number;
  readonly level: number;
}

export interface DirkDanceComboState {
  readonly startedAtMs: number;
  readonly nextBeatIndex: number;
}

export interface DirkDanceAdvanceResult {
  readonly strike: DirkDanceStrike | null;
  readonly nextState: DirkDanceComboState;
  readonly completed: boolean;
  readonly expired: boolean;
}

const DIRK_DANCE_OFFSETS_DEG: readonly number[] = [0, -35, 35];
const DIRK_DANCE_LABELS: readonly DirkDanceStrikeLabel[] = ['center', 'left', 'right'];
const DIRK_DANCE_STRIKE_COUNT = 3;

function clampWeaponLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.floor(level));
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function buildBleedDescriptor(strikeDamage: number): DirkDanceBleedDescriptor {
  return {
    source: 'dirk_dance_finisher',
    durationMs: DIRK_DANCE_BLEED_DURATION_MS,
    tickMs: DIRK_DANCE_BLEED_TICK_MS,
    ticks: DIRK_DANCE_BLEED_DURATION_MS / DIRK_DANCE_BLEED_TICK_MS,
    damagePerTick: Math.ceil(strikeDamage * DIRK_DANCE_BLEED_DAMAGE_FRACTION),
  };
}

export function buildDirkDanceComboPlan(options: DirkDanceComboOptions): DirkDanceComboPlan {
  const level = clampWeaponLevel(options.level);
  const damage = computeLevelScaledWeaponStats(WEAPON_DEFS.dirk_dance, level).damage;

  return {
    strikes: DIRK_DANCE_LABELS.map((label, beatIndex): DirkDanceStrike => {
      const isFinisher = beatIndex === DIRK_DANCE_STRIKE_COUNT - 1;
      return {
        beatIndex,
        label,
        timeOffsetMs: beatIndex * DIRK_DANCE_BEAT_INTERVAL_MS,
        angleRad: options.facingRad + degToRad(DIRK_DANCE_OFFSETS_DEG[beatIndex]),
        damage,
        bleed: isFinisher ? buildBleedDescriptor(damage) : null,
      };
    }),
  };
}

export function startDirkDanceCombo(startedAtMs: number = 0): DirkDanceComboState {
  return { startedAtMs, nextBeatIndex: 0 };
}

export function advanceDirkDanceCombo(
  state: DirkDanceComboState,
  nowMs: number,
  options: DirkDanceComboOptions,
): DirkDanceAdvanceResult {
  if (state.nextBeatIndex >= DIRK_DANCE_STRIKE_COUNT) {
    return { strike: null, nextState: state, completed: true, expired: false };
  }

  const scheduledAtMs = state.startedAtMs + state.nextBeatIndex * DIRK_DANCE_BEAT_INTERVAL_MS;
  if (nowMs < scheduledAtMs) {
    return { strike: null, nextState: state, completed: false, expired: false };
  }

  if (nowMs > scheduledAtMs + DIRK_DANCE_TIMING_GRACE_MS) {
    return { strike: null, nextState: state, completed: false, expired: true };
  }

  const strike = buildDirkDanceComboPlan(options).strikes[state.nextBeatIndex];
  const nextBeatIndex = state.nextBeatIndex + 1;
  return {
    strike,
    nextState: { ...state, nextBeatIndex },
    completed: nextBeatIndex >= DIRK_DANCE_STRIKE_COUNT,
    expired: false,
  };
}
