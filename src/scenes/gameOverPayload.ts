import type { RunResult, RunSummary } from '../utils/save';

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
}
