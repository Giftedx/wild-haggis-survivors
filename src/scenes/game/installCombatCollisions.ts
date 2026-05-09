/**
 * Phase 5 Bucket 7 finish — combat-cascade install. Replaces the inline
 * EnemyKillHandler ctor + wireWeaponSystemListeners + wireXpSystemListeners
 * + PlayerHitResolver ctor + Phaser overlap-collider registration block
 * (~120 LOC) in `GameScene.create()` with a single helper invocation.
 *
 * The four sub-wirings are kept in a fixed order matching the live
 * pre-extraction sequence (kill handler ctor → weapon listeners → xp
 * listeners → hit resolver → overlap collider). EnemyKillHandler is
 * passed into wireWeaponSystemListeners as the cascade owner — order
 * is load-bearing.
 *
 * Lazy `() => ...` getters preserve the wire-before-construct contract:
 * `getJuice`, `getHud`, `getBanter`, `getPickupSpawner`, `getLevelUpFlow`
 * resolve at fire time rather than wire time. The pre-2026-04-29 inline
 * arrows captured `this` lexically; a value-capture refactor would have
 * bound `undefined` and thrown on the first kill / level-up. Same shape
 * as the sibling `wireWeaponSystemListeners` / `wireXpSystemListeners`
 * helpers extracted earlier in Phase 5.
 *
 * Pure orchestration — no Phaser-as-value imports, no scene-side state.
 * Each constructed object has its own dedicated test fixture
 * (`EnemyKillHandler.test.ts`, `PlayerHitResolver.test.ts`,
 * `wireWeaponSystemListeners.test.ts`, `wireXpSystemListeners.test.ts`);
 * this helper is exercised transitively through GameScene's create-path
 * E2E specs.
 */
import type Phaser from 'phaser';
import { EnemyKillHandler } from './EnemyKillHandler';
import { PlayerHitResolver } from './PlayerHitResolver';
import { wireWeaponSystemListeners } from './wireWeaponSystemListeners';
import { wireXpSystemListeners } from './wireXpSystemListeners';

import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { HUD } from '../../ui/HUD';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { RNG } from '../../utils/rng';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RunScoreState } from './RunScoreState';
import type { IFrameController } from './IFrameController';
import type { FloatTextPool } from './FloatTextPool';
import type { PickupSpawner } from './PickupSpawner';
import type { LevelUpFlow } from './LevelUpFlow';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { RuneEffectBag } from '../../systems/runes/runeEffects';
import type { Act3Stretch } from '../../data/nodeBanks';
import type { getSettingsManager as getSettingsManagerFn } from '../../core/SettingsManager';
import type { GrudgeLedgerState } from '../../entities/grudgeLedger';

export interface InstallCombatCollisionsOpts {
  // Phaser scene seam — needed for `physics.add.overlap`, camera + tweens.
  scene: Phaser.Scene & {
    physics: Phaser.Physics.Arcade.ArcadePhysics;
    cameras: Phaser.Cameras.Scene2D.CameraManager;
    tweens: Phaser.Tweens.TweenManager;
    time: { now: number };
  };

  // Eager refs — these are constructed before the install call, so
  // direct refs are safe (and cheaper than getters).
  player: Player;
  spawnSystem: SpawnSystem;
  weaponSystem: WeaponSystem;
  xpSystem: XPSystem;
  timeManager: TimeManager;
  deathCauseTracker: DeathCauseTracker;
  iFrameController: IFrameController;
  floatTextPool: FloatTextPool;
  runScore: RunScoreState;
  runRng: RNG;
  runStatsTracker: RunStatsTracker;
  runeBag: RuneEffectBag;
  updateTickers: UpdateTickers;
  /** Taxman Grudge Ledger — per-run finish buffer the weapon listener
   *  pushes into; consumed at run end by `RunLifecycle.handleVictory`. */
  grudgeLedger: GrudgeLedgerState;

  // Lazy getters — these wrap fields constructed AFTER this install
  // runs. Resolving at fire time matches the pre-extraction inline
  // arrows that read `this.X` lexically.
  getJuice: () => JuiceSystem;
  getHud: () => HUD;
  getBanter: () => BanterSystem | null;
  getPickupSpawner: () => PickupSpawner;
  getLevelUpFlow: () => LevelUpFlow;
  getRunModifiers: () => RunModifiers;
  getActiveVariantKey: () => string | undefined;
  getActiveCurseKey: () => string | null;
  getSFXManager: () => SFXManager;
  getSettingsManager: () => ReturnType<typeof getSettingsManagerFn>;

  // Cascade callbacks the EnemyKillHandler / PlayerHitResolver reach
  // back into GameScene for. All wrapped in arrow form so the live
  // `this` is captured.
  triggerVictory: () => void;
  onActComplete: (actN: 1 | 2) => void;
  onStretchComplete: (stretch: Act3Stretch) => void;
  onBottleBreak: (x: number, y: number) => void;
  onTotemFall: (x: number, y: number) => void;
  onHaarDispel: (x: number, y: number) => void;
  onTouristPhotographed: (x: number, y: number) => void;
  onEliteKilled: (x: number, y: number) => void;
  onBossKilled: (bossKey: string, x: number, y: number) => void;
  bumpBossKillCount: (bossKey: string) => void;
  bumpCursedVictoryByBoss: (bossKey: string) => void;
  modifyLifesteal: (base: number, nowMs: number) => number;
  modifyXpGain: (base: number) => number;
  tryCairnStoneMagnet: (x: number, y: number) => void;

  caption: (id: string, msg: string, tint: string, dur: number) => void;
  onAfterNonFatalHit: (hpBefore: number) => void;
  armIFrames: (durationMs: number) => void;
  onPlayerKilled: () => void;
  modifyEnemyContactDamage: (baseDamage: number, enemyKey: string) => number;
}

export interface InstallCombatCollisionsResult {
  enemyKillHandler: EnemyKillHandler;
  playerHitResolver: PlayerHitResolver;
  playerEnemyCollider: Phaser.Physics.Arcade.Collider;
}

export function installCombatCollisions(
  opts: InstallCombatCollisionsOpts,
): InstallCombatCollisionsResult {
  const enemyKillHandler = new EnemyKillHandler({
    getPlayer: () => opts.player,
    getJuice: opts.getJuice,
    getXPSystem: () => opts.xpSystem,
    getSpawnSystem: () => opts.spawnSystem,
    getBanter: opts.getBanter,
    getPickupSpawner: opts.getPickupSpawner,
    getUpdateTickers: () => opts.updateTickers,
    getSFXManager: opts.getSFXManager,
    getRunRng: () => opts.runRng,
    getActiveVariantKey: opts.getActiveVariantKey,
    getRunScore: () => opts.runScore,
    triggerVictory: opts.triggerVictory,
    onActComplete: opts.onActComplete,
    onStretchComplete: opts.onStretchComplete,
    onBottleBreak: opts.onBottleBreak,
    onTotemFall: opts.onTotemFall,
    onHaarDispel: opts.onHaarDispel,
    onTouristPhotographed: opts.onTouristPhotographed,
    onEliteKilled: opts.onEliteKilled,
    onBossKilled: (bossKey, x, y) => {
      opts.bumpBossKillCount(bossKey);
      if (opts.getActiveCurseKey()) opts.bumpCursedVictoryByBoss(bossKey);
      opts.onBossKilled(bossKey, x, y);
    },
    modifyLifesteal: (base) => opts.modifyLifesteal(base, opts.scene.time.now),
    modifyXpGain: opts.modifyXpGain,
    tryCairnStoneMagnet: opts.tryCairnStoneMagnet,
  });

  wireWeaponSystemListeners({
    weaponSystem: opts.weaponSystem,
    enemyKillHandler,
    player: opts.player,
    getJuice: opts.getJuice,
    getHud: opts.getHud,
    runStatsTracker: opts.runStatsTracker,
    runeBag: opts.runeBag,
    getSFXManager: opts.getSFXManager,
    grudgeLedger: opts.grudgeLedger,
  });

  wireXpSystemListeners({
    xpSystem: opts.xpSystem,
    getLevelUpFlow: opts.getLevelUpFlow,
    player: opts.player,
    getBanter: opts.getBanter,
    getActiveVariantKey: opts.getActiveVariantKey,
    caption: opts.caption,
  });

  const playerHitResolver = new PlayerHitResolver({
    getPlayer: () => opts.player,
    getJuice: opts.getJuice,
    getSpawnSystem: () => opts.spawnSystem,
    getTimeManager: () => opts.timeManager,
    getDeathCauseTracker: () => opts.deathCauseTracker,
    getIFrameController: () => opts.iFrameController,
    getFloatTextPool: () => opts.floatTextPool,
    getRunModifiers: opts.getRunModifiers,
    getCamera: () => opts.scene.cameras.main,
    getTweens: () => opts.scene.tweens,
    getSettingsManager: opts.getSettingsManager,
    isVictoryPending: () => opts.runScore.victoryPending,
    onAfterNonFatalHit: opts.onAfterNonFatalHit,
    armIFrames: opts.armIFrames,
    onPlayerKilled: opts.onPlayerKilled,
    modifyEnemyContactDamage: opts.modifyEnemyContactDamage,
  });

  const playerEnemyCollider = opts.scene.physics.add.overlap(
    opts.player,
    opts.spawnSystem.getEnemyGroup(),
    (_playerObj, enemyObj) => playerHitResolver.handle(
      enemyObj as Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    ),
    undefined,
    opts.scene,
  );

  return { enemyKillHandler, playerHitResolver, playerEnemyCollider };
}
