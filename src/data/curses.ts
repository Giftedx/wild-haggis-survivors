/**
 * Curses of the Moor — opt-in pre-run modifiers that trade difficulty for
 * gold. One curse per run (no stacking in v1 — keeps the balance surface
 * small and the choice intentional). The selection is held in module-level
 * state, set by CurseScene before scene.start('Game'), consumed once by
 * GameScene.create() and then cleared — so an abandoned flow doesn't leak
 * into the next run.
 *
 * Voice registers are Hearth (warm-ribbing) and Edge (deadpan dread) per
 * Voice Card — each curse carries the flavour appropriate to its teeth.
 */
import type { RunModifiers } from '../core/RunModifiers';

export type CurseKey =
  | 'heavy_legs'
  | 'thin_hide'
  | 'restless_spirits'
  | 'empty_larder';

export interface CurseDef {
  key: CurseKey;
  /** Display name i18n key. */
  nameKey: string;
  /** One-line description i18n key. */
  descKey: string;
  /**
   * Mutates the passed modifier bag in-place. Kept explicit-mutation for
   * future-stacking (if we ever allow two curses, applying both is just two
   * successive calls). Each curse is expected to touch ONE negative lever
   * and the shared goldMult lever — nothing else.
   */
  apply: (m: RunModifiers) => void;
  /** Pure-reporting: the gold bonus as a percentage (for UI strings). */
  goldBonusPct: number;
}

export const CURSES: readonly CurseDef[] = [
  {
    key: 'heavy_legs',
    nameKey: 'curse.heavy_legs.name',
    descKey: 'curse.heavy_legs.desc',
    goldBonusPct: 30,
    apply: (m) => {
      m.moveSpeedMult *= 0.88;
      m.goldMult *= 1.30;
    },
  },
  {
    key: 'thin_hide',
    nameKey: 'curse.thin_hide.name',
    descKey: 'curse.thin_hide.desc',
    goldBonusPct: 40,
    apply: (m) => {
      m.damageTakenMult *= 1.25;
      m.goldMult *= 1.40;
    },
  },
  {
    key: 'restless_spirits',
    nameKey: 'curse.restless_spirits.name',
    descKey: 'curse.restless_spirits.desc',
    goldBonusPct: 35,
    apply: (m) => {
      // +20% spawn rate ≈ interval × (1 / 1.20)
      m.spawnIntervalMult *= 1 / 1.20;
      m.goldMult *= 1.35;
    },
  },
  {
    key: 'empty_larder',
    nameKey: 'curse.empty_larder.name',
    descKey: 'curse.empty_larder.desc',
    goldBonusPct: 25,
    apply: (m) => {
      m.startHpRatio *= 0.80;
      m.goldMult *= 1.25;
    },
  },
];

const CURSES_BY_KEY: Map<CurseKey, CurseDef> = new Map(
  CURSES.map((c) => [c.key, c])
);

export function getCurseByKey(key: string | null | undefined): CurseDef | null {
  if (!key) return null;
  return CURSES_BY_KEY.get(key as CurseKey) ?? null;
}

/**
 * Module-level pending state. Set by CurseScene immediately before
 * scene.start('Game'); read + cleared by GameScene.create(). Using a
 * module singleton (rather than Phaser's scene-data bag) keeps the
 * integration point decoupled from scene plumbing.
 */
let pendingCurseKey: CurseKey | null = null;

export function setPendingCurse(key: CurseKey | null): void {
  pendingCurseKey = key;
}

export function consumePendingCurse(): CurseKey | null {
  const key = pendingCurseKey;
  pendingCurseKey = null;
  return key;
}

export function peekPendingCurse(): CurseKey | null {
  return pendingCurseKey;
}
