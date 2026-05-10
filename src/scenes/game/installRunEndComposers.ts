/**
 * Phase 5 Bucket 6 partial — extracts three run-end orchestrators that
 * GameScene.create() used to construct inline (~80 LOC of hook bags
 * with ~9 fields duplicated across the three composers):
 *
 *   - RunExitComposer       — builds RunSummary / GameOverPayload and
 *                             drives the Game→GameOver transition.
 *   - RunHistoryRecorder    — writes per-run history to the meta save
 *                             on victory / death.
 *   - RunPersistenceCoordinator — replay-aware wrapper for the
 *                                 history-recorder + global recordRun
 *                                 pair so playback runs don't pollute
 *                                 the meta-save / Chronicle counters.
 *
 * The helper takes a single de-duplicated opts bag — fields like
 * `getXPSystem`, `getRunRng`, `isDailyRun`, `getRunName` that all
 * three composers want are written once on the call site instead of
 * 2-3x. Internally, the helper builds each composer's specific hook
 * shape from those shared accessors.
 *
 * Pure helper — no Phaser imports, no scene-side state. Composers
 * themselves do the orchestration; this file only assembles them.
 *
 * Tests: each composer already has its own dedicated test fixture
 * (`RunExitComposer.test.ts`, `RunHistoryRecorder.test.ts`,
 * `RunPersistenceCoordinator.test.ts`); this helper is exercised
 * transitively through GameScene's create-path E2E specs.
 */
import { RunExitComposer, type RunExitHooks } from './RunExitComposer';
import { RunHistoryRecorder, type RunHistoryHooks } from './RunHistoryRecorder';
import {
  RunPersistenceCoordinator,
  type RunPersistenceCoordinatorHooks,
} from './RunPersistenceCoordinator';
import type { GameOverPayload } from '../gameOverPayload';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { SaveManager } from '../../core/SaveManager';
import type { VariantDef } from '../../data/variants';
import type { CurseKey } from '../../data/curses';
import type { RNG } from '../../utils/rng';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RunScoreState } from './RunScoreState';
import type { RoutePick } from '../../data/routes';
import type { RelicKey } from '../../data/relics';
import type { ReplayBlobAny } from '../../replay/replayBlob';

export interface InstallRunEndComposersOpts {
  // Shared system accessors (used by 2-3 of the composers).
  getWeaponSystem(): WeaponSystem;
  getSpawnSystem(): SpawnSystem;
  getJuice(): JuiceSystem;
  getXPSystem(): XPSystem;
  getRunStatsTracker(): RunStatsTracker;
  getSaveManager(): SaveManager;
  getActiveVariant(): VariantDef;
  getActiveCurseKey(): CurseKey | null;
  getRunRng(): RNG;
  getRunModifiers(): RunModifiers;
  getRunScore(): RunScoreState;
  getRunName(): string;
  isDailyRun(): boolean;
  isIronmoorRun(): boolean;

  // RunExitComposer-only.
  getSecondsPastBell(): number;
  getOwnedPassivesLength(): number;
  getEvolvedWeaponsLength(): number;
  stopGameScene(): void;
  startGameOverScene(payload: GameOverPayload): void;
  startMainMenuScene(): void;
  unregisterRunAutoSave(): void;
  getCurrentAct(): 1 | 2 | 3;
  getRouteLabels(): readonly string[];
  getRelicLabels(): readonly string[];
  getRuneLabels(): readonly string[];

  // RunHistoryRecorder-only.
  getBossKillCount(): number;
  getRoutePicks(): readonly RoutePick[];
  getHeldRelicKeys(): readonly RelicKey[];
  getReplayBlob(): ReplayBlobAny | null;
  getEnteredHealingCircle(): boolean;
  getBiomesVisited(): readonly string[];
  getEvolvedWeaponCount(): number;
  areSeasonalEventsDisabled(): boolean;
  /**
   * S1 Phase 2 — snapshot of Sporran Deck picks committed at run start
   * (filtered to known card IDs). Threaded into RunHistoryRecorder for
   * chronicle persistence + Phase 2 replay-side pick replay.
   */
  getSporranPicks(): readonly string[];

  // RunPersistenceCoordinator-only.
  isReplayPlayback(): boolean;
  recordRun: RunPersistenceCoordinatorHooks['recordRun'];
  loadSave: RunPersistenceCoordinatorHooks['loadSave'];
}

export interface InstallRunEndComposersResult {
  runExit: RunExitComposer;
  runHistoryRecorder: RunHistoryRecorder;
  runPersistenceCoordinator: RunPersistenceCoordinator;
}

export function installRunEndComposers(
  opts: InstallRunEndComposersOpts,
): InstallRunEndComposersResult {
  const runExitHooks: RunExitHooks = {
    getWeaponSystem: opts.getWeaponSystem,
    getSpawnSystem: opts.getSpawnSystem,
    getJuice: opts.getJuice,
    getXPSystem: opts.getXPSystem,
    getRunStatsTracker: opts.getRunStatsTracker,
    getSaveManager: opts.getSaveManager,
    getActiveVariant: opts.getActiveVariant,
    getActiveCurseKey: opts.getActiveCurseKey,
    getRunRng: opts.getRunRng,
    getRunModifiers: opts.getRunModifiers,
    isDailyRun: opts.isDailyRun,
    isIronmoorRun: opts.isIronmoorRun,
    getSecondsPastBell: opts.getSecondsPastBell,
    getRunName: opts.getRunName,
    getRunScore: opts.getRunScore,
    getOwnedPassivesLength: opts.getOwnedPassivesLength,
    getEvolvedWeaponsLength: opts.getEvolvedWeaponsLength,
    stopGameScene: opts.stopGameScene,
    startGameOverScene: opts.startGameOverScene,
    startMainMenuScene: opts.startMainMenuScene,
    unregisterRunAutoSave: opts.unregisterRunAutoSave,
    getCurrentAct: opts.getCurrentAct,
    getRouteLabels: opts.getRouteLabels,
    getRelicLabels: opts.getRelicLabels,
    getRuneLabels: opts.getRuneLabels,
  };
  const runExit = new RunExitComposer(runExitHooks);

  const runHistoryHooks: RunHistoryHooks = {
    getSaveManager: opts.getSaveManager,
    getXPSystem: opts.getXPSystem,
    getWeaponSystem: opts.getWeaponSystem,
    getActiveVariant: opts.getActiveVariant,
    getActiveCurseKey: opts.getActiveCurseKey,
    getBossKillCount: opts.getBossKillCount,
    getRunRng: opts.getRunRng,
    isDailyRun: opts.isDailyRun,
    getRoutePicks: opts.getRoutePicks,
    isIronmoor: opts.isIronmoorRun,
    getRunName: opts.getRunName,
    getHeldRelicKeys: opts.getHeldRelicKeys,
    getReplayBlob: opts.getReplayBlob,
    getEnteredHealingCircle: opts.getEnteredHealingCircle,
    getBiomesVisited: opts.getBiomesVisited,
    getEvolvedWeaponCount: opts.getEvolvedWeaponCount,
    areSeasonalEventsDisabled: opts.areSeasonalEventsDisabled,
    getSporranPicks: opts.getSporranPicks,
  };
  const runHistoryRecorder = new RunHistoryRecorder(runHistoryHooks);

  const runPersistenceCoordinator = new RunPersistenceCoordinator({
    isReplayPlayback: opts.isReplayPlayback,
    getHistoryRecorder: () => runHistoryRecorder,
    recordRun: opts.recordRun,
    loadSave: opts.loadSave,
  });

  return { runExit, runHistoryRecorder, runPersistenceCoordinator };
}
