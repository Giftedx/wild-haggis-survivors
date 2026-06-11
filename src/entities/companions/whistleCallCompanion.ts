import type { CompanionKey } from './companionTypes';

export const DEFAULT_WHISTLE_CALL_COOLDOWN_MS = 12_000;
export const DEFAULT_WHISTLE_CALL_DURATION_MS = 8_000;

export type WhistleCallRejectReason = 'slot_occupied' | 'cooldown';

export interface ActiveWhistleCallCompanion {
  readonly key: CompanionKey;
  readonly summonedAtMs: number;
  readonly despawnAtMs: number;
}

export interface WhistleCallSlotState {
  readonly active: ActiveWhistleCallCompanion | null;
  readonly nextReadyAtMs: number;
}

export interface WhistleCallOptions {
  readonly key: CompanionKey;
  readonly nowMs: number;
  readonly durationMs?: number;
  readonly cooldownMs?: number;
}

export interface WhistleCallResult {
  readonly accepted: boolean;
  readonly reason: WhistleCallRejectReason | null;
  readonly slot: WhistleCallSlotState;
}

export interface WhistleCallTargetCandidate {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly alive: boolean;
  /** Higher values are preferred before distance; default is 0. */
  readonly priority?: number;
}

export interface WhistleCallTargetOptions {
  readonly maxRange: number;
}

export function createEmptyWhistleCallSlot(): WhistleCallSlotState {
  return { active: null, nextReadyAtMs: 0 };
}

export function isWhistleCallReady(slot: WhistleCallSlotState, nowMs: number): boolean {
  return slot.active === null && nowMs >= slot.nextReadyAtMs;
}

export function tickWhistleCallSlot(
  slot: WhistleCallSlotState,
  nowMs: number,
): WhistleCallSlotState {
  if (slot.active === null || nowMs < slot.active.despawnAtMs) {
    return slot;
  }
  return { active: null, nextReadyAtMs: slot.nextReadyAtMs };
}

export function tryWhistleCall(
  slot: WhistleCallSlotState,
  options: WhistleCallOptions,
): WhistleCallResult {
  if (slot.active !== null) {
    return { accepted: false, reason: 'slot_occupied', slot };
  }
  if (options.nowMs < slot.nextReadyAtMs) {
    return { accepted: false, reason: 'cooldown', slot };
  }

  const durationMs = options.durationMs ?? DEFAULT_WHISTLE_CALL_DURATION_MS;
  const cooldownMs = options.cooldownMs ?? DEFAULT_WHISTLE_CALL_COOLDOWN_MS;
  return {
    accepted: true,
    reason: null,
    slot: {
      active: {
        key: options.key,
        summonedAtMs: options.nowMs,
        despawnAtMs: options.nowMs + durationMs,
      },
      nextReadyAtMs: options.nowMs + cooldownMs,
    },
  };
}

export function chooseWhistleCallTarget(
  origin: { readonly x: number; readonly y: number },
  candidates: readonly WhistleCallTargetCandidate[],
  options: WhistleCallTargetOptions,
): WhistleCallTargetCandidate | null {
  const maxRangeSq = options.maxRange * options.maxRange;
  let chosen: WhistleCallTargetCandidate | null = null;
  let chosenPriority = Number.NEGATIVE_INFINITY;
  let chosenDistSq = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (!candidate.alive) continue;
    const dx = candidate.x - origin.x;
    const dy = candidate.y - origin.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > maxRangeSq) continue;

    const priority = candidate.priority ?? 0;
    if (priority > chosenPriority || (priority === chosenPriority && distSq < chosenDistSq)) {
      chosen = candidate;
      chosenPriority = priority;
      chosenDistSq = distSq;
    }
  }

  return chosen;
}
