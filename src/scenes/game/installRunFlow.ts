/**
 * Phase 5 Bucket 6 partial — extracts the LevelUpFlow + RunLifecycle
 * ctors that GameScene.create() used to construct inline (~78 LOC of
 * hook bags with overlapping accessors duplicated across the two
 * ctors).
 *
 * The helper takes a single de-duplicated opts bag — fields like
 * `getPlayer`, `getXPSystem`, `getSpawnSystem`, `getJuice`,
 * `getTimeManager`, `getUiViewport`, `armIFrames`, `caption` are
 * shared between LevelUpFlow and RunLifecycle. Caller writes them
 * once.
 *
 * Caller still owns the field assignments that follow construction
 * (the `juice.setResumeBestCombo`, run-identity-toast, run-intro-toast
 * sequence) — those are not hook-bag work, just adjacency.
 *
 * Pure helper — no scene-side state. Both classes already have
 * dedicated test fixtures; this helper is exercised transitively
 * through the create-path E2E specs (level-up + run-end flows).
 */
import * as Phaser from 'phaser';
import { LevelUpFlow, type LevelUpFlowHooks } from './LevelUpFlow';
import { RunLifecycle, type RunLifecycleHooks } from './RunLifecycle';
import type { Player } from '../../entities/Player';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { StatusFxPool } from '../../systems/StatusFxPool';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { RNG } from '../../utils/rng';
import type { SaveManager } from '../../core/SaveManager';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { GrudgeLedgerState } from '../../entities/grudgeLedger';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { RunResult, RunSummary, RunHistoryContext } from '../../utils/save';
import type { GameOverPayload } from '../gameOverPayload';
import type { BanterContext } from '../../data/banter';
import type { classifyDeath } from '../../core/deathCauseClassifier';

export interface InstallRunFlowOpts {
  scene: Phaser.Scene;

  // Shared accessors (used by both LevelUpFlow and RunLifecycle).
  getPlayer(): Player;
  getXPSystem(): XPSystem;
  getSpawnSystem(): SpawnSystem;
  getJuice(): JuiceSystem;
  getTimeManager(): TimeManager;
  getUiViewport(): { x: number; y: number; width: number; height: number };
  armIFrames(durationMs: number): void;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;

  // LevelUpFlow-only.
  getWeaponSystem(): WeaponSystem;
  getStatusFxPool(): StatusFxPool;
  getTutorialSystem(): TutorialSystem;
  getUpgradeUI(): UpgradeCardsUI;
  getRunRng(): RNG;
  getOwnedPassives(): string[];
  pushOwnedPassive(key: string): void;
  getEvolvedWeapons(): string[];
  pushEvolvedWeapon(key: string): void;
  getAnnouncedEvolutionReady(): Set<string>;
  addKill(n?: number): void;
  drainPendingChests(): void;
  requestBanter(context: BanterContext, tag?: string): void;
  getDiscoveryRunId(): string;
  tryChestLegendaryRelicOverride(): boolean;
  getRelicLuckPoints(): number;
  isBossKilledThisRun(): boolean;
  getOwnedRuneIds(): readonly string[];
  grantRune(runeId: string): void;
  isPostBell(): boolean;
  getOverchargedWeaponKeys(): readonly string[];

  // RunLifecycle-only.
  getSaveManager(): SaveManager;
  getDeathCauseTracker(): DeathCauseTracker;
  getBanter(): BanterSystem | null;
  getGrudgeLedger(): GrudgeLedgerState;
  getSettingsManager(): ReturnType<typeof import('../../core/SettingsManager').getSettingsManager>;
  getCamera(): Phaser.Cameras.Scene2D.Camera;
  getVictoryPending(): boolean;
  setVictoryPending(v: boolean): void;
  invalidatePendingVictoryTicker(): void;
  getRevivalAvailable(): boolean;
  setRevivalAvailable(v: boolean): void;
  getVictoryFade(): Phaser.GameObjects.Rectangle | null;
  setVictoryFade(r: Phaser.GameObjects.Rectangle | null): void;
  getDeathFade(): Phaser.GameObjects.Rectangle | null;
  setDeathFade(r: Phaser.GameObjects.Rectangle | null): void;
  setVictoryResultTicker(ms: number | null, cb: (() => void) | null): void;
  setDeathResultTicker(ms: number | null, cb: (() => void) | null): void;
  setVictoryDeferMs(ms: number): void;
  buildRunSummary(victory: boolean): RunSummary;
  buildRunHistoryContext(): RunHistoryContext;
  buildGameOverPayload(
    mode: 'victory' | 'death',
    summary: RunSummary,
    runResult: RunResult,
    previousBests: ReturnType<SaveManager['getPersonalBests']>,
    deathCause?: ReturnType<typeof classifyDeath>,
  ): GameOverPayload;
  recordToHistory(summary: RunSummary, runResult: RunResult): void;
  recordRun(summary: RunSummary, context: RunHistoryContext): RunResult;
  transitionToGameOver(payload: GameOverPayload): void;
  onActComplete(actN: 1 | 2): void;
  isIronmoorRun(): boolean;
  isDailyRun(): boolean;
  /**
   * The Moor Remembers (spec 2026-05-22) — variant the haggis was
   * running, recorded on the FallenCairn so future runs can route to
   * a variant-specific past-self whisper line.
   */
  getActiveVariantKey(): string;
  /**
   * The Moor Remembers — pick the stat the past-self was strongest in.
   * Drives the +1 % inherited buff on future walk-overs. v1 returns a
   * safe default; v2 can read upgrade history without rewiring this seam.
   */
  pickInheritedStat(): import('../../utils/save/fallenCairns').InheritedStatKey;
}

export interface InstallRunFlowResult {
  levelUpFlow: LevelUpFlow;
  runLifecycle: RunLifecycle;
}

export function installRunFlow(opts: InstallRunFlowOpts): InstallRunFlowResult {
  const levelUpHooks: LevelUpFlowHooks = {
    getPlayer: opts.getPlayer,
    getWeaponSystem: opts.getWeaponSystem,
    getXPSystem: opts.getXPSystem,
    getSpawnSystem: opts.getSpawnSystem,
    getJuice: opts.getJuice,
    getStatusFxPool: opts.getStatusFxPool,
    getTutorialSystem: opts.getTutorialSystem,
    getTimeManager: opts.getTimeManager,
    getUpgradeUI: opts.getUpgradeUI,
    getRunRng: opts.getRunRng,
    getOwnedPassives: opts.getOwnedPassives,
    pushOwnedPassive: opts.pushOwnedPassive,
    getEvolvedWeapons: opts.getEvolvedWeapons,
    pushEvolvedWeapon: opts.pushEvolvedWeapon,
    getAnnouncedEvolutionReady: opts.getAnnouncedEvolutionReady,
    addKill: opts.addKill,
    getUiViewport: opts.getUiViewport,
    armIFrames: opts.armIFrames,
    drainPendingChests: opts.drainPendingChests,
    caption: opts.caption,
    requestBanter: opts.requestBanter,
    getDiscoveryRunId: opts.getDiscoveryRunId,
    tryChestLegendaryRelicOverride: opts.tryChestLegendaryRelicOverride,
    getRelicLuckPoints: opts.getRelicLuckPoints,
    isBossKilledThisRun: opts.isBossKilledThisRun,
    getOwnedRuneIds: opts.getOwnedRuneIds,
    grantRune: opts.grantRune,
    isPostBell: opts.isPostBell,
    getOverchargedWeaponKeys: opts.getOverchargedWeaponKeys,
  };
  const levelUpFlow = new LevelUpFlow(opts.scene, levelUpHooks);

  const runLifecycleHooks: RunLifecycleHooks = {
    getPlayer: opts.getPlayer,
    getSpawnSystem: opts.getSpawnSystem,
    getXPSystem: opts.getXPSystem,
    getJuice: opts.getJuice,
    getTimeManager: opts.getTimeManager,
    getSaveManager: opts.getSaveManager,
    getDeathCauseTracker: opts.getDeathCauseTracker,
    getBanter: opts.getBanter,
    getGrudgeLedger: opts.getGrudgeLedger,
    getSettingsManager: opts.getSettingsManager,
    getCamera: opts.getCamera,
    getUiViewport: opts.getUiViewport,
    getVictoryPending: opts.getVictoryPending,
    setVictoryPending: opts.setVictoryPending,
    invalidatePendingVictoryTicker: opts.invalidatePendingVictoryTicker,
    getRevivalAvailable: opts.getRevivalAvailable,
    setRevivalAvailable: opts.setRevivalAvailable,
    getVictoryFade: opts.getVictoryFade,
    setVictoryFade: opts.setVictoryFade,
    getDeathFade: opts.getDeathFade,
    setDeathFade: opts.setDeathFade,
    setVictoryResultTicker: opts.setVictoryResultTicker,
    setDeathResultTicker: opts.setDeathResultTicker,
    setVictoryDeferMs: opts.setVictoryDeferMs,
    armIFrames: opts.armIFrames,
    caption: opts.caption,
    buildRunSummary: opts.buildRunSummary,
    buildRunHistoryContext: opts.buildRunHistoryContext,
    buildGameOverPayload: opts.buildGameOverPayload,
    recordToHistory: opts.recordToHistory,
    recordRun: opts.recordRun,
    transitionToGameOver: opts.transitionToGameOver,
    onActComplete: opts.onActComplete,
    isIronmoorRun: opts.isIronmoorRun,
    isDailyRun: opts.isDailyRun,
    getActiveVariantKey: opts.getActiveVariantKey,
    pickInheritedStat: opts.pickInheritedStat,
  };
  const runLifecycle = new RunLifecycle(opts.scene, runLifecycleHooks);

  return { levelUpFlow, runLifecycle };
}
