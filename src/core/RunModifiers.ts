/**
 * Per-run modifier bag consumed at run start.
 *
 * Anywhere a curse (or future boon) wants to bend the rules of a run, it
 * writes a multiplier / ratio into this shape and consumers multiply their
 * own values. Defaults are all identity (1.0) so an un-cursed run is
 * behaviourally identical to having no RunModifiers plumbing at all.
 */
export interface RunModifiers {
  /** Multiplied into the player's base move speed at spawn. */
  moveSpeedMult: number;
  /** Ratio applied to starting max HP (0.8 = –20% HP pool). */
  startHpRatio: number;
  /** Multiplied into every SpawnSystem interval. <1 means faster spawns. */
  spawnIntervalMult: number;
  /** Multiplied into incoming damage before armor/iframes resolve. */
  damageTakenMult: number;
  /** Multiplied into the end-of-run gold reward. */
  goldMult: number;
}

export function defaultModifiers(): RunModifiers {
  return {
    moveSpeedMult: 1,
    startHpRatio: 1,
    spawnIntervalMult: 1,
    damageTakenMult: 1,
    goldMult: 1,
  };
}
