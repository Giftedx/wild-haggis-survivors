/**
 * Phase 5 Bucket 6 finish — extracts the four run-bookkeeping ctors
 * that GameScene.create() used to construct inline (~70 LOC of hook
 * bags with shared accessors duplicated across the four ctors):
 *
 *   - MoorMomentScheduler — shuffled moor-moment schedule + fire pipe.
 *   - RunPersistenceBridge — collect/persist/hydrate active-run state.
 *   - BossHpTracker — caches spotlight boss + pushes HP fraction to HUD.
 *   - DebugTimeTravelApi — globalThis.DEBUG + Shift+] keybind.
 *
 * The helper takes a single de-duplicated opts bag — fields like
 * `getXPSystem`, `getJuice`, `getSpawnSystem`, `getRunModifiers` that
 * multiple ctors want are written once at the call site instead of 2-3x.
 *
 * The helper calls `moorMoments.reset()` immediately after construction
 * (verbatim with the inline ordering). DebugTimeTravelApi.install() and
 * RunPersistenceBridge.applyResume() stay at the call site — they fire
 * later in create()'s lifecycle (post-relic, post-resume-decode).
 *
 * Pure helper — no Phaser imports, no scene-side state. Each class
 * already has its own dedicated test fixture; this helper is exercised
 * transitively through GameScene's create-path E2E specs.
 */
import { MoorMomentScheduler, type MoorMomentSchedulerHooks } from './MoorMomentScheduler';
import { RunPersistenceBridge, type RunPersistenceHooks } from './RunPersistenceBridge';
import { BossHpTracker, type BossHpTrackerHooks } from './BossHpTracker';
import { DebugTimeTravelApi, type DebugTimeTravelHooks } from './DebugTimeTravelApi';
import type { Player } from '../../entities/Player';
import type { XPSystem } from '../../systems/XPSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { LevelUpFlow } from './LevelUpFlow';
import type { SaveManager } from '../../core/SaveManager';
import type { VariantDef } from '../../data/variants';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RunScoreState } from './RunScoreState';
import type { RunActState } from './RunActState';
import type { BiomeId } from '../../data/biomes';
import type { RNG } from '../../utils/rng';
import type { TempBuffBag } from '../../systems/TempBuffBag';
import type { RelicDef, RelicKey } from '../../data/relics';
import type { CairnStackingScheduler } from './CairnStackingScheduler';

export interface InstallRunBookkeepingOpts {
  // Shared system accessors (used by 2+ of the four ctors).
  getRunRng(): RNG;
  getPlayer(): Player;
  getXPSystem(): XPSystem;
  getJuice(): JuiceSystem;
  getSpawnSystem(): SpawnSystem;
  getRunModifiers(): RunModifiers;
  isSceneActive(): boolean;

  // MoorMomentScheduler-only.
  getVictoryPending(): boolean;
  getCurrentBiomeId(): BiomeId | null;
  getTutorialSystem(): TutorialSystem | undefined;
  getBanter(): BanterSystem | null;
  getSFXManager(): SFXManager;
  addCoinGold(amount: number): void;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;

  // RunPersistenceBridge-only.
  getWeaponSystem(): WeaponSystem;
  getTimeManager(): TimeManager;
  getRunStatsTracker(): RunStatsTracker;
  getLevelUpFlow(): LevelUpFlow;
  getSaveManager(): SaveManager;
  getActiveVariant(): VariantDef;
  getRunScore(): RunScoreState;
  getRunActState(): RunActState;
  getActiveCurseKey(): string | null;
  isIronmoorRun(): boolean;
  getTempBuffBag(): TempBuffBag;
  getRevivalAvailable(): boolean;
  getOwnedPassives(): readonly string[];
  getEvolvedWeapons(): readonly string[];
  getHeldRelicKeysForPersistence(): readonly string[];
  getOwnedRuneIdsForPersistence(): readonly string[];
  setRevivalAvailable(v: boolean): void;
  setOwnedPassives(p: string[]): void;
  setEvolvedWeapons(e: string[]): void;
  restoreHeldRelics(keys: readonly string[]): void;
  restoreOwnedRunes(ids: readonly string[]): void;
  suppressNextNodeMapRoll(): void;

  /** Optional — when provided, collect() includes cairn stack state in the run snapshot. */
  getCairnStacking?(): CairnStackingScheduler;

  // BossHpTracker-only.
  updateBossBar(data: { name: string; hpFraction: number } | null): void;

  // DebugTimeTravelApi-only.
  spawnRelicAt(key: RelicKey, x: number, y: number): boolean;
  getHeldRelicKeysForDebug(): readonly string[];
  getRelicCatalogue(): Readonly<Record<RelicKey, RelicDef>>;
  openRelicDiscardPromptForAudit(): boolean;
}

export interface InstallRunBookkeepingResult {
  moorMoments: MoorMomentScheduler;
  runPersistence: RunPersistenceBridge;
  bossHpTracker: BossHpTracker;
  debugTimeTravelApi: DebugTimeTravelApi;
}

export function installRunBookkeeping(
  opts: InstallRunBookkeepingOpts,
): InstallRunBookkeepingResult {
  // Moor-moment scheduler must exist before applyResumeHydration — hydration
  // calls pushAfterResume on it. Lazy getters cover player/juice/xp etc.
  // still under construction at call time.
  const moorMomentsHooks: MoorMomentSchedulerHooks = {
    getRunRng: opts.getRunRng,
    getPlayer: opts.getPlayer,
    getVictoryPending: opts.getVictoryPending,
    getCurrentBiomeId: opts.getCurrentBiomeId,
    getTutorialSystem: opts.getTutorialSystem,
    getRunModifiers: opts.getRunModifiers,
    getXPSystem: opts.getXPSystem,
    getJuice: opts.getJuice,
    getBanter: opts.getBanter,
    getSFXManager: opts.getSFXManager,
    addCoinGold: opts.addCoinGold,
    caption: opts.caption,
  };
  const moorMoments = new MoorMomentScheduler(moorMomentsHooks);
  moorMoments.reset();

  // Run persistence bridge — snapshot / save / hydrate / pagehide hooks.
  // Constructed before resume hydration; lazy getters let it reach
  // levelUpFlow (built later in create()) at hydrate time.
  const runPersistenceHooks: RunPersistenceHooks = {
    getPlayer: opts.getPlayer,
    getXPSystem: opts.getXPSystem,
    getWeaponSystem: opts.getWeaponSystem,
    getSpawnSystem: opts.getSpawnSystem,
    getJuice: opts.getJuice,
    getTimeManager: opts.getTimeManager,
    getRunStatsTracker: opts.getRunStatsTracker,
    getMoorMoments: () => moorMoments,
    getLevelUpFlow: opts.getLevelUpFlow,
    getSaveManager: opts.getSaveManager,
    getActiveVariant: opts.getActiveVariant,
    getRunScore: opts.getRunScore,
    getRunActState: opts.getRunActState,
    getRunModifiers: opts.getRunModifiers,
    getActiveCurseKey: opts.getActiveCurseKey,
    isIronmoorRun: opts.isIronmoorRun,
    getTempBuffBag: opts.getTempBuffBag,
    getRevivalAvailable: opts.getRevivalAvailable,
    getOwnedPassives: opts.getOwnedPassives,
    getEvolvedWeapons: opts.getEvolvedWeapons,
    getHeldRelicKeys: opts.getHeldRelicKeysForPersistence,
    getOwnedRuneIds: opts.getOwnedRuneIdsForPersistence,
    setRevivalAvailable: opts.setRevivalAvailable,
    setOwnedPassives: opts.setOwnedPassives,
    setEvolvedWeapons: opts.setEvolvedWeapons,
    restoreHeldRelics: opts.restoreHeldRelics,
    restoreOwnedRunes: opts.restoreOwnedRunes,
    isSceneActive: opts.isSceneActive,
    suppressNextNodeMapRoll: opts.suppressNextNodeMapRoll,
    getCairnStacking: opts.getCairnStacking,
  };
  const runPersistence = new RunPersistenceBridge(runPersistenceHooks);

  // Boss HP bar tracker — caches current spotlight boss and pushes
  // fraction to HUD each frame. Lazy getters so HUD (built later in
  // create()) resolves at tick time.
  const bossHooks: BossHpTrackerHooks = {
    getSpawnSystem: opts.getSpawnSystem,
    updateBossBar: opts.updateBossBar,
  };
  const bossHpTracker = new BossHpTracker(bossHooks);

  // Dev time-travel controls — globalThis.DEBUG + Shift+] keybind.
  // Caller still triggers .install() once `relicSystem` exists (the
  // catalogue + spawn seam need that).
  const debugHooks: DebugTimeTravelHooks = {
    getSpawnSystem: opts.getSpawnSystem,
    isSceneActive: opts.isSceneActive,
    spawnRelicAt: opts.spawnRelicAt,
    getHeldRelicKeys: opts.getHeldRelicKeysForDebug,
    getRelicCatalogue: opts.getRelicCatalogue,
    openRelicDiscardPromptForAudit: opts.openRelicDiscardPromptForAudit,
  };
  const debugTimeTravelApi = new DebugTimeTravelApi(debugHooks);

  return { moorMoments, runPersistence, bossHpTracker, debugTimeTravelApi };
}
