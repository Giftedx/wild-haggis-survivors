/**
 * Cairn Stacking v2 — boon pool for the third-stone boon picker.
 *
 * Five options presented 3-at-a-time (weighted random draw); the player
 * picks one when the third stone is placed. Effects are pure functions
 * of Player + JuiceSystem so they're wirable without scene boilerplate.
 *
 * Design: all five are strictly positive (placing the third stone has
 * already cost pilgrimage effort). Two carry over from the v1 preset
 * (full_mend, moor_sweep); three are new (stone_vigour, cairn_ward,
 * glacial_calm). Hearth-warm names; grave-warm descriptions — the cairn
 * is ceremony, not a shop.
 */
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { RNG } from '../../utils/rng';
import { t } from '../../core/i18n';

export type CairnBoonId =
  | 'full_mend'
  | 'moor_sweep'
  | 'stone_vigour'
  | 'cairn_ward'
  | 'glacial_calm';

export interface CairnBoonDef {
  readonly id: CairnBoonId;
  readonly nameKey: string;
  readonly descKey: string;
  readonly weight: number;
  /**
   * Apply the boon. `juice` is optional so unit tests can pass null
   * without stubbing the full JuiceSystem interface.
   */
  readonly effect: (player: Player, juice: JuiceSystem | null) => void;
}

/** Full heal. The stone gives back what the moor has taken. */
const FULL_MEND: CairnBoonDef = {
  id: 'full_mend',
  nameKey: 'ui.cairn.boon.full_mend.name',
  descKey: 'ui.cairn.boon.full_mend.desc',
  weight: 22,
  effect: (player) => {
    player.heal(player.getMaxHp());
  },
};

/** Expanded pickup radius for 8 s — sweep the moor clean. */
const MOOR_SWEEP: CairnBoonDef = {
  id: 'moor_sweep',
  nameKey: 'ui.cairn.boon.moor_sweep.name',
  descKey: 'ui.cairn.boon.moor_sweep.desc',
  weight: 22,
  effect: (player) => {
    player.grantMoorMomentMagnet(80, 8000);
  },
};

/** +20 permanent max HP this run. */
const STONE_VIGOUR: CairnBoonDef = {
  id: 'stone_vigour',
  nameKey: 'ui.cairn.boon.stone_vigour.name',
  descKey: 'ui.cairn.boon.stone_vigour.desc',
  weight: 20,
  effect: (player) => {
    player.addMaxHp(20);
    player.heal(20);
  },
};

/** +12% damage for the run. */
const CAIRN_WARD: CairnBoonDef = {
  id: 'cairn_ward',
  nameKey: 'ui.cairn.boon.cairn_ward.name',
  descKey: 'ui.cairn.boon.cairn_ward.desc',
  weight: 18,
  effect: (player) => {
    player.addDamageMultiplier(0.12);
  },
};

/** −15% weapon cooldown for the run. */
const GLACIAL_CALM: CairnBoonDef = {
  id: 'glacial_calm',
  nameKey: 'ui.cairn.boon.glacial_calm.name',
  descKey: 'ui.cairn.boon.glacial_calm.desc',
  weight: 18,
  effect: (player) => {
    player.addCooldownReduction(0.15);
  },
};

export const CAIRN_BOON_POOL: readonly CairnBoonDef[] = [
  FULL_MEND,
  MOOR_SWEEP,
  STONE_VIGOUR,
  CAIRN_WARD,
  GLACIAL_CALM,
];

/**
 * Draw `count` distinct boons from the pool, weighted. Falls back to the
 * full pool if `count >= pool.length`. Returns the subset in draw order.
 */
export function pickCairnBoonOptions(
  rng: RNG,
  count: number = 3,
  from: readonly CairnBoonDef[] = CAIRN_BOON_POOL,
): CairnBoonDef[] {
  if (count >= from.length) return [...from];
  const result: CairnBoonDef[] = [];
  const remaining = [...from];
  for (let i = 0; i < count; i++) {
    const def = rng.weighted(remaining, (b) => b.weight);
    result.push(def);
    remaining.splice(remaining.indexOf(def), 1);
  }
  return result;
}

/**
 * Find a boon def by ID. Throws if the ID is not in the pool —
 * unknown IDs indicate a serialisation mismatch and should not silently
 * apply nothing.
 */
export function getCairnBoonById(id: CairnBoonId): CairnBoonDef {
  const def = CAIRN_BOON_POOL.find((b) => b.id === id);
  if (!def) throw new Error(`Unknown cairn boon id: ${id}`);
  return def;
}

/** i18n key for the toast shown when a specific boon is picked. */
export function cairnBoonToastText(id: CairnBoonId): string {
  return t(`ui.cairn.boon.${id}.toast`);
}
