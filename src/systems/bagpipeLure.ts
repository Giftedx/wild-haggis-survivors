/**
 * Bagpipe Lure — DESIGN_IDEAS §1 wild-haggis-myth tribute.
 *
 * The wild haggis is drawn to bagpipe drone. When a piper enemy
 * (piper / seelie_piper / unseelie_fiddler) is within range, the
 * haggis is pulled toward them by a few pixels per second — not
 * enough to override player input, but enough that careful play
 * notices the tug and can use it to its advantage (or fight it).
 *
 * Pure helper — no Phaser, no scene state. Caller (Player.update)
 * supplies the player position + an array of nearby lurers and
 * receives a pull vector to add into the velocity equation, beside
 * the existing soft-boundary push and external knockback.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §11.5 (wild-haggis myth, draws-to-
 * pipes lore); DESIGN_IDEAS.md §1 "Bagpipe Lure" — invertable, can
 * pull haggis toward bonuses too.
 */

/** Radius (px) within which a piper exerts pull. */
export const LURE_RADIUS_PX = 200;
/** Pull strength in px·s⁻¹. "A few pixels per second" per spec. */
export const LURE_PULL_PER_S = 8;
/** Enemy keys that lure the haggis. The Seelie + Unseelie courts +
 *  the solo piper share the property; the haggis hears the drone. */
export const LURE_ENEMY_KEYS: ReadonlySet<string> = new Set([
  'piper',
  'seelie_piper',
  'unseelie_fiddler',
]);

export interface BagpipeLureSource {
  readonly x: number;
  readonly y: number;
  /** Active flag — Phaser-arcade enemies set this false on cull / death. */
  readonly active: boolean;
  readonly enemyKey: string;
}

export interface BagpipeLureVector {
  /** Velocity contribution along x, in px·s⁻¹. */
  readonly pullX: number;
  /** Velocity contribution along y, in px·s⁻¹. */
  readonly pullY: number;
}

/**
 * Sum the per-source pull contributions for every active lurer
 * within `LURE_RADIUS_PX` of `(playerX, playerY)`. Returns
 * `{ pullX: 0, pullY: 0 }` when nothing's lurking nearby.
 *
 * Each in-range lurer contributes a unit vector toward itself scaled
 * by `LURE_PULL_PER_S`; the summed vector is NOT renormalised — two
 * lurers in roughly the same direction add up, while opposing lurers
 * partially cancel. Both behaviours read correctly in playtest:
 * stacked pipers feel insistent; a piper to your back and one to
 * your front feel like a held breath.
 */
export function computeBagpipeLureVector(
  playerX: number,
  playerY: number,
  sources: readonly BagpipeLureSource[],
  radiusPx: number = LURE_RADIUS_PX,
  pullPerS: number = LURE_PULL_PER_S,
): BagpipeLureVector {
  let pullX = 0;
  let pullY = 0;
  const radSq = radiusPx * radiusPx;
  for (const s of sources) {
    if (!s.active) continue;
    if (!LURE_ENEMY_KEYS.has(s.enemyKey)) continue;
    const dx = s.x - playerX;
    const dy = s.y - playerY;
    const distSq = dx * dx + dy * dy;
    if (distSq > radSq) continue;
    const dist = Math.sqrt(distSq);
    if (dist < 0.001) continue;
    pullX += (dx / dist) * pullPerS;
    pullY += (dy / dist) * pullPerS;
  }
  return { pullX, pullY };
}
