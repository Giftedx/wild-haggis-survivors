import type { RunResult, RunSummary } from '../utils/save';

/** Serializable run result passed from GameScene → GameOverScene (scene.start payload). */
export interface GameOverPayload {
  mode: 'victory' | 'death';
  summary: RunSummary;
  runResult: RunResult;
  xpLevel: number;
  bossKillCount: number;
  ownedPassiveCount: number;
  weaponCount: number;
  evolvedCount: number;
  buildSummary: string;
  variantLabel: string;
}
