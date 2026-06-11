import { PLAYER } from '../config';

/**
 * Pure formula for the player's visual growth scale at a given
 * level. Starts at 1.0 on level 1 and grows by PLAYER.GROWTH_PER_LEVEL
 * per level, capped at PLAYER.MAX_SCALE so the haggis never exceeds
 * ~2x its starting size (the world would start feeling cramped
 * otherwise). Used by both Player.update() (combined with a wobble)
 * and onLevelUp() (applied flat, also resizing the hitbox).
 *
 * Extracted so the two call sites can't drift apart — the wobble
 * and hitbox paths must always share the same base scale.
 */
export function playerGrowthScale(level: number): number {
  return Math.min(
    1 + PLAYER.GROWTH_PER_LEVEL * (level - 1),
    PLAYER.MAX_SCALE,
  );
}
