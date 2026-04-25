/**
 * Shrine buff registry — fixed `apply` / `revert` pair per shrine boon
 * key, with deltas defined as constants so the bag never has to capture
 * a closure. T101 follow-up: enables `TempBuffBag` snapshots to store
 * just `{ key, remainingMs }` and reconstruct the live buff state on
 * resume by re-running the registry's `apply` against the freshly-built
 * Player.
 *
 * Only the five M1 F4 timed combat buffs route through here. The
 * immediate-effect shrine outcomes (`buff_gold`, `buff_xp`, `buff_luck`)
 * stay in `GameScene.applyShrineBoon` because they have no revert path
 * — they fire once and are done.
 */
import type { Player } from '../entities/Player';
import { PLAYER } from '../config';
import type { TempBuffBag } from './TempBuffBag';

/** Mutable context the registry runs against. Pass the live Player ref. */
export interface ShrineBuffContext {
  readonly player: Player;
}

/**
 * One buff's applicator + reverter. Both are pure-effect on the
 * provided context — `apply` mutates a stat by a fixed delta, `revert`
 * subtracts the same delta. No closures, no captured state.
 */
export interface ShrineBuffEffect {
  apply(ctx: ShrineBuffContext): void;
  revert(ctx: ShrineBuffContext): void;
}

/** Keys that have a registered effect. Other shrine keys (gold/xp/luck) are immediate-only. */
export const SHRINE_BUFF_KEYS = [
  'buff_damage',
  'buff_speed',
  'buff_armor',
  'buff_crit',
  'buff_pickup',
] as const;
export type ShrineBuffKey = (typeof SHRINE_BUFF_KEYS)[number];

const DAMAGE_DELTA = 0.25;
const SPEED_DELTA = PLAYER.SPEED * 0.20;
const ARMOR_DELTA = 3;
const CRIT_DELTA = 0.15;
const PICKUP_DELTA = PLAYER.PICKUP_RADIUS * 0.40;

export const SHRINE_BUFF_REGISTRY: Readonly<Record<ShrineBuffKey, ShrineBuffEffect>> = {
  buff_damage: {
    apply: ({ player }) => player.addDamageMultiplier(DAMAGE_DELTA),
    revert: ({ player }) => player.addDamageMultiplier(-DAMAGE_DELTA),
  },
  buff_speed: {
    apply: ({ player }) => player.addSpeed(SPEED_DELTA),
    revert: ({ player }) => player.addSpeed(-SPEED_DELTA),
  },
  buff_armor: {
    apply: ({ player }) => player.addArmor(ARMOR_DELTA),
    revert: ({ player }) => player.addArmor(-ARMOR_DELTA),
  },
  buff_crit: {
    apply: ({ player }) => player.addCritChance(CRIT_DELTA),
    revert: ({ player }) => player.addCritChance(-CRIT_DELTA),
  },
  buff_pickup: {
    apply: ({ player }) => player.addPickupRadius(PICKUP_DELTA),
    revert: ({ player }) => player.addPickupRadius(-PICKUP_DELTA),
  },
};

export function isRegisteredShrineBuffKey(key: string): key is ShrineBuffKey {
  return key in SHRINE_BUFF_REGISTRY;
}

export function getShrineBuffEffect(key: string): ShrineBuffEffect | undefined {
  return isRegisteredShrineBuffKey(key) ? SHRINE_BUFF_REGISTRY[key] : undefined;
}

/**
 * Add a registered shrine buff to the bag. Returns `true` when the
 * registry recognised the key and the buff was queued — `false` when
 * the key is not registered (caller falls back to its own pre-F4
 * stand-in path). The bag is responsible for ticking + reverting via
 * the same registry on expiry.
 */
export function applyShrineBuff(
  bag: TempBuffBag,
  key: string,
  durationMs: number,
  ctx: ShrineBuffContext,
): boolean {
  const effect = getShrineBuffEffect(key);
  if (!effect) return false;
  bag.add(key, durationMs, () => {
    effect.apply(ctx);
    return () => effect.revert(ctx);
  });
  return true;
}

/**
 * Re-attach a saved set of buff entries (key + remainingMs) to a fresh
 * bag after a run resume. Each entry walks through `applyShrineBuff`
 * with the snapshot's `remainingMs` so the buff keeps its surviving
 * window of stat boost; entries with unknown keys are skipped (forward-
 * compat with renamed keys). Returns the count of entries restored.
 */
export function restoreShrineBuffs(
  bag: TempBuffBag,
  entries: ReadonlyArray<{ readonly key: string; readonly remainingMs: number }>,
  ctx: ShrineBuffContext,
): number {
  let restored = 0;
  for (const entry of entries) {
    if (!Number.isFinite(entry.remainingMs) || entry.remainingMs <= 0) continue;
    if (applyShrineBuff(bag, entry.key, entry.remainingMs, ctx)) restored++;
  }
  return restored;
}
