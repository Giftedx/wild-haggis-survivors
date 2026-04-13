import type { RunResult, RunSummary } from '../utils/save';
import type { PersonalBests } from '../core/SaveManager';

/** Serializable run result passed from GameScene → GameOverScene (scene.start payload). */
export interface GameOverPayload {
  mode: 'victory' | 'death';
  /** Mirrors `mode === 'victory'` for consumers that prefer a boolean flag. */
  isVictory: boolean;
  summary: RunSummary;
  runResult: RunResult;
  xpLevel: number;
  bossKillCount: number;
  ownedPassiveCount: number;
  weaponCount: number;
  evolvedCount: number;
  buildSummary: string;
  variantLabel: string;
  /** Variant key for sprite/flavor lookup on the result screen. */
  variantKey?: string;
  /** Total damage dealt per weapon id (`WeaponDef.key`), from RunStatsTracker. */
  weaponDamage: Record<string, number>;
  /** Historical bests captured BEFORE this run was recorded — used for "NEW BEST!" comparison. */
  previousBests?: PersonalBests;
  /** User-facing share code for this run's RNG seed — shown on the result screen. */
  seedCode?: string;
  /** True when this run was a Daily Challenge attempt. */
  isDaily?: boolean;
}
