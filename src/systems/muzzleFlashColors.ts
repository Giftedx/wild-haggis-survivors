/**
 * Pure per-weapon-behavior muzzle flash colour table.
 *
 * Four behaviors fire a visible muzzle flash (projectile / piercing /
 * bouncing / arc_sweep) and each has a hand-tuned colour nodding at
 * the weapon's identity: thistle purple, wood-amber caber, brown
 * haggis-ball, steel-blue claymore. The remaining behaviors (aoe,
 * trail, aura) render their own FX, so they return `null`.
 *
 * Pulled out of WeaponSystem so the palette per identity lives in
 * one table rather than buried in a switch.
 */

import type { WeaponBehavior } from '../data/weapons';

/** Thistle shot — purple. */
export const MUZZLE_FLASH_THISTLE = 0xcc88ff;
/** Caber toss — wood amber. */
export const MUZZLE_FLASH_CABER = 0xddbb66;
/** Haggis ball — warm brown. */
export const MUZZLE_FLASH_HAGGIS = 0xaa7733;
/** Claymore arc sweep — steel blue. */
export const MUZZLE_FLASH_CLAYMORE = 0xccddff;

export function resolveMuzzleFlashColor(behavior: WeaponBehavior): number | null {
  switch (behavior) {
    case 'projectile': return MUZZLE_FLASH_THISTLE;
    case 'piercing': return MUZZLE_FLASH_CABER;
    case 'bouncing': return MUZZLE_FLASH_HAGGIS;
    case 'arc_sweep': return MUZZLE_FLASH_CLAYMORE;
    default: return null;
  }
}
