/**
 * Pure per-state frame clock. Advances a frame index based on a
 * time accumulator + scaledDelta. Loops or one-shots per state's
 * authored tempo. No wall-clock reads; replay-deterministic.
 *
 * Tempos chosen per the animation charter in
 * `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md` §2.
 */

import type { AnimationState } from './animationStates';
export type { AnimationState } from './animationStates';

interface StateDef {
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
}

const STATE_DEFS: Record<AnimationState, StateDef> = {
  idle: { frames: 2, fps: 2, loop: true },
  walking: { frames: 4, fps: 24, loop: true },
  attacking: { frames: 4, fps: 24, loop: false },
  hurt: { frames: 2, fps: 30, loop: false },
  celebrating: { frames: 4, fps: 12, loop: true },
  dying: { frames: 3, fps: 12, loop: false },
};

export function getFrameCountForState(state: AnimationState): number {
  return STATE_DEFS[state].frames;
}

export function getTempoForState(state: AnimationState): number {
  return STATE_DEFS[state].fps;
}

export interface FrameClockTickInput {
  readonly accMs: number;
  readonly frameIndex: number;
  readonly state: AnimationState;
  readonly scaledDelta: number;
}

export interface FrameClockTickResult {
  readonly accMs: number;
  readonly frameIndex: number;
}

export function advanceFrameClock(input: FrameClockTickInput): FrameClockTickResult {
  if (input.scaledDelta <= 0) {
    return { accMs: input.accMs, frameIndex: input.frameIndex };
  }
  const def = STATE_DEFS[input.state];
  const msPerFrame = 1000 / def.fps;
  const acc = input.accMs + input.scaledDelta;
  const frameAdvance = Math.floor(acc / msPerFrame);
  const remainder = acc - frameAdvance * msPerFrame;
  const rawIndex = input.frameIndex + frameAdvance;
  const nextIndex = def.loop
    ? rawIndex % def.frames
    : Math.min(rawIndex, def.frames - 1);
  return { accMs: remainder, frameIndex: nextIndex };
}
