/**
 * Save/load system using localStorage. Public surface — barrel that
 * re-exports every save-related symbol from `src/utils/save/`. Direct
 * importers see no change after the 2026-04-30 restructure (39 callsites
 * use `from '../utils/save'` / `'./save'` / etc).
 *
 * Internal layout:
 *   - `save/types.ts`       — Schema interfaces (SaveData, RunHistoryEntry, …).
 *   - `save/schema.ts`      — Constants (SAVE_SCHEMA_VERSION, MAX_RUN_HISTORY, …).
 *   - `save/io.ts`          — `loadSave` / `writeSave` / `createDefaultSave` + DEFAULT_*.
 *   - `save/migrations.ts`  — `migrateSave` switch + finalize + every coerce/seed helper.
 *   - `save/bumpers.ts`     — Lifetime + DiscoveryLog bumps (load→mutate→write).
 *   - `save/history.ts`     — `recordRun` / `applyRunSummary` / append + record*.
 *   - `save/queries.ts`     — Pure derivations (gold reward, win rate, trend, …).
 *   - `save/variants.ts`    — Variant unlock evaluator + progress snapshot.
 *
 * See `docs/superpowers/plans/2026-04-30-codebase-restructure.md` for
 * the per-phase ship history.
 */

export type {
  PersonalBests,
  RunHistoryContext,
  RunHistoryEntry,
  RunResult,
  RunSummary,
  SaveData,
  SaveSettings,
} from './save/types';

export {
  BURNS_EVOLUTION_THRESHOLD,
  COASTAL_BIOMES,
  LAST_DEATH_TTL_MS,
  MAX_RUN_HISTORY,
  REPLAY_HISTORY_CAP,
  SAVE_SCHEMA_VERSION,
} from './save/schema';

export { createDefaultSave, loadSave, writeSave } from './save/io';

export { migrateSave } from './save/migrations';

export {
  addFirstRouteVisit,
  bumpAncestralEchoesTouched,
  bumpBanterHeard,
  bumpBeastieKilled,
  bumpBeastieSeen,
  bumpBossKillCount,
  bumpCeilidhPulsesLifetime,
  bumpCursedVictoryByBoss,
  bumpFirstTimeEvent,
  bumpItemAcquired,
  bumpReliquaryCurioPick,
  bumpRoutePicked,
  bumpSeenEnemy,
  bumpSeenRune,
  bumpLemmingsSeenForVariant,
  bumpStandingStonePick,
  flushBeastieKills,
} from './save/bumpers';

export {
  appendRunHistory,
  applyRunSummary,
  consumeLastDeath,
  recordIronmoorBest,
  recordLastDeath,
  recordPostBellBest,
  recordRun,
  wipeIronmoorHistory,
  wipeIronmoorHistoryInPlace,
} from './save/history';

export {
  computeGoldReward,
  getAverageSurvivalTime,
  getPersonalBests,
  getTrend,
  getWinRate,
  isCoastalOnlyRun,
  isLastDeathFresh,
} from './save/queries';

export {
  coerceSelectedVariant,
  evaluateVariantUnlocks,
  progressSnapshotFromSave,
} from './save/variants';
