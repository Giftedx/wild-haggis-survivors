/**
 * Nuckelavee fresh-water retreat — the Nuckelavee's one weakness.
 *
 * Orcadian myth records that the Nuckelavee cannot cross running water
 * or tolerate fresh water at all. In-game, healing circles represent
 * the clean burns the haggis has found. When the boss moves within
 * the trigger radius of one, this function overrides its velocity to
 * push it away — the enemy's own chase behavior has already set the
 * velocity this frame; we write over it so physics integration uses
 * our direction instead.
 *
 * Called from `tickFrameWorld` each frame AFTER `spawnSystem.update`
 * (which runs enemy behaviors) so the override lands after the chase
 * direction is set but before physics integrates position.
 *
 * Ref: `SCOTTISH_RESEARCH.md §1.1`, `SCOTTISH_RESEARCH_DEEP.md` Part 4.
 */
import * as Phaser from 'phaser';
import type { Enemy } from '../../entities/Enemy';

/** Distance from a heal-patch centre at which the retreat triggers (px). */
export const NUCKELAVEE_RETREAT_TRIGGER_PX = 160;

/** Speed the boss retreats at (px/s) — faster than its base chase
 *  speed (95) so it can escape a cornered situation and not just
 *  slow-roll through the circle. */
export const NUCKELAVEE_RETREAT_SPEED = 240;

export function tickNuckelaveeRetreat(
  boss: Enemy,
  healPatches: ReadonlyArray<{ x: number; y: number; r: number }>,
): void {
  const body = boss.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  let nearestDist = Infinity;
  let retreatDx = 0;
  let retreatDy = 0;

  for (const patch of healPatches) {
    const dx = boss.x - patch.x;
    const dy = boss.y - patch.y;
    const dist = Math.hypot(dx, dy);
    if (dist < NUCKELAVEE_RETREAT_TRIGGER_PX && dist < nearestDist && dist > 0) {
      nearestDist = dist;
      retreatDx = dx / dist;
      retreatDy = dy / dist;
    }
  }

  if (nearestDist < NUCKELAVEE_RETREAT_TRIGGER_PX) {
    body.velocity.x = retreatDx * NUCKELAVEE_RETREAT_SPEED;
    body.velocity.y = retreatDy * NUCKELAVEE_RETREAT_SPEED;
  }
}
