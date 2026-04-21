import type Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';

/**
 * Wires the standard pointerover / pointerout fill swap for an
 * interactive rectangle button. Most scene buttons share the same
 * "brighten on hover, restore on out" recipe, so pulling those two
 * lines out makes the call sites read in one line and stops a future
 * tweak (cursor, sound, debounce) from drifting between scenes.
 *
 * `pointerdown` is intentionally not handled — call sites usually
 * inline a multi-line click body that wants its own scope.
 *
 * Pass `withClick = true` to also fire a click sound via AudioSystem.
 */
export function attachButtonHoverFill(
  btn: Phaser.GameObjects.Rectangle,
  idle: number,
  hover: number,
  withClick?: boolean,
): void {
  btn.on('pointerover', () => btn.setFillStyle(hover));
  btn.on('pointerout', () => btn.setFillStyle(idle));
  if (withClick) {
    btn.on('pointerdown', () => audio.playClick());
  }
}
