/**
 * Pure atlas-key map. The texture-swap architecture pre-bakes one
 * texture per (subject × variant × state × frame) at boot; runtime
 * looks up by key. This module owns the key format — nothing else
 * builds these strings by hand.
 *
 * Subjects: 'haggis' for the player body, or an accessory id
 *   (e.g. 'tam_o_shanter') for accessory layers.
 * Variant: non-null for 'haggis' (one of the 9 variants);
 *   null for accessories (accessories are variant-agnostic in MVP).
 */

import { getFrameCountForState } from './frameClock';
import type { AnimationState } from './animationStates';

export type AtlasSubject = 'haggis' | string; // accessory ids are free strings
export type AtlasVariant = string | null;

export const ALL_ANIMATION_STATES: readonly AnimationState[] = [
  'idle',
  'walking',
  'attacking',
  'hurt',
  'celebrating',
  'dying',
];

export function atlasKey(
  subject: AtlasSubject,
  variant: AtlasVariant,
  state: AnimationState,
  frame: number,
): string {
  if (!Number.isInteger(frame) || frame < 0) {
    throw new Error(`atlasKey: frame must be non-negative integer, got ${frame}`);
  }
  return variant === null
    ? `${subject}_${state}_${frame}`
    : `${subject}_${variant}_${state}_${frame}`;
}

/**
 * Enumerate every atlas key for a (subject, variant) pair across every
 * state × authored frame. Used by BootScene to drive the pre-bake loop
 * and by AnimationController for warm-cache assertions in dev.
 */
export function allAtlasKeysForVariant(
  subject: AtlasSubject,
  variant: AtlasVariant,
): string[] {
  const out: string[] = [];
  for (const state of ALL_ANIMATION_STATES) {
    const count = getFrameCountForState(state);
    for (let f = 0; f < count; f++) {
      out.push(atlasKey(subject, variant, state, f));
    }
  }
  return out;
}
