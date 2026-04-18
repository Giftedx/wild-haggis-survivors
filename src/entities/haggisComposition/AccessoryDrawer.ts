/**
 * Contract every accessory implementation satisfies. Pure draw function
 * over a pre-baked Graphics + DrawCtx — no Phaser scene coupling at
 * draw time. BootScene calls the drawer once per (state × frame) to
 * generate the atlas; runtime swaps texture keys.
 */

import type { AnimationState } from '../../animation/animationStates';
import type { VariantPalette } from '../../art/palettes';
import type { HaggisLayerSlot } from './HaggisContainer';

export interface AccessoryDrawCtx {
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
}

export interface AccessoryDrawer {
  readonly id: string;
  readonly layer: HaggisLayerSlot;
  /**
   * Authored state × frame pairs. Only states in this list get atlases;
   * others fall back to idle frame 0 (the accessory doesn't animate
   * for that state in Phase 0).
   */
  readonly authoredStates: ReadonlyArray<AnimationState>;
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void;
}
