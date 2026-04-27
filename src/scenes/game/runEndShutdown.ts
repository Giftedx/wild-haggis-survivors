/**
 * T401 slice 6 — Run-end shutdown cleanup install for GameScene.
 *
 * Pulls the ~50-line `events.once('shutdown', () => { ... })` arrow body
 * out of `GameScene.registerShutdownCleanup` into a Phaser-import-free
 * helper module under `src/scenes/game/`. The arrow itself is a long
 * sequence of "destroy this, then null its ref" pairs spanning every
 * lifecycle-bearing scene field (audio managers, UI overlays, biome
 * ambient fx, weapon/spawn/xp systems, node-map UI, captions, debug
 * overlay, post-bell key handler, etc.).
 *
 * Why extract: scene reuse + replay determinism both depend on the
 * shutdown handler firing the destroy/null sequence in a specific order
 * once and only once per scene shutdown. Extracting clarifies the
 * teardown contract and makes it unit-testable without booting Phaser.
 *
 * Why not consolidate the silenced-catches: each `try { x?.destroy(); }
 * catch { (silenced) }` is load-bearing. A partial-init failure earlier
 * in `create()` can leave any of these refs in a half-constructed state
 * where `destroy()` throws — silencing protects the rest of the shutdown
 * sequence from being short-circuited by one bad ref. Consolidating
 * into a single try/catch around the whole block would re-introduce the
 * "one bad destroy stops all the rest" failure mode the silenced-catches
 * exist to prevent. Tests pin this with a "throwing destroy keeps the
 * sequence going" case.
 *
 * Why setter callbacks (Option B) for the reassigned refs: 11 fields
 * are nulled inline between destroys (haarFog, floraScatter, wildlife,
 * mistLayer, captionOverlay, captionManager, biomeController, debug
 * overlay, nodeMapUI, nodePromptUI, eventBusDispose, victoryFade,
 * deathFade, filmGrain, pauseMenu, playerEnemyCollider, clipRecorder,
 * interactivePromptIndex). Two cleaner alternatives were considered:
 *   - Option A — keep the nulls in `GameScene.registerShutdownCleanup`
 *     after the helper returns. Rejected because the helper registers
 *     a one-shot `events.once('shutdown', …)` listener that fires
 *     LATER (when the scene actually shuts down), not synchronously.
 *     Putting the nulls outside the listener would null the refs
 *     immediately at install time — wrong semantics. Putting them in
 *     a SECOND listener splits the destroy/null pair across two
 *     callbacks with non-determined order.
 *   - Option C — pass a mutable `refs` object the helper writes into.
 *     Rejected as overengineered for one slice; setters are simpler.
 * Option B passes the refs object plus typed setter callbacks for the
 * 11 fields that get nulled inline. The helper closes over both and
 * runs the destroy/null pair in the original order.
 *
 * No Phaser imports — vitest under node-env breaks on Phaser eval (see
 * CLAUDE.md gotchas). The helper takes a `Phaser.Scene`-shaped
 * structural type (`scene.events.once`, `scene.physics.world`,
 * `scene.tweens.killTweensOf`) so tests can drive it with a mock.
 *
 * Determinism contract (CLAUDE.md "Replay determinism"): the destroy
 * order is preserved one-for-one with the pre-extraction body. Tests
 * pin the order via a mutation log captured during a simulated
 * shutdown event.
 *
 * Scene reuse contract (CLAUDE.md "Scene reuse"): the helper installs
 * a fresh `events.once('shutdown')` listener every call. Do NOT
 * memoize or guard against double-install — every `registerShutdownCleanup`
 * call (including from a recycled scene instance) must wire its own
 * listener. Tests pin this with a "two installs → two listeners" case.
 */
import type Phaser from 'phaser';
import type { ClipRecorder } from '../../utils/clipRecorder';
import type { TimeManager } from '../../systems/TimeManager';
import type { SubscriptionBag } from '../../utils/SubscriptionBag';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { DebugOverlay } from '../../ui/DebugOverlay';
import type { DebugTimeTravelApi } from './DebugTimeTravelApi';
import type { RunPersistenceBridge } from './RunPersistenceBridge';
import type { BiomeController } from './BiomeController';
import type { HaarFogController } from '../../systems/shaders/HaarFogController';
import type { FloraScatter } from '../../systems/FloraScatter';
import type { WildlifeSystem } from '../../systems/WildlifeSystem';
import type { MistLayer } from '../../systems/MistLayer';
import type { CaptionOverlay } from '../../systems/a11y/CaptionOverlay';
import type { CaptionManager } from '../../systems/a11y/CaptionManager';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { StatusFxPool } from '../../systems/StatusFxPool';
import type { FloatTextPool } from './FloatTextPool';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { HUD } from '../../ui/HUD';
import type { Minimap } from '../../ui/Minimap';
import type { NodeMapUI } from '../../ui/NodeMapUI';
import type { NodePromptUI } from '../../ui/NodePromptUI';
import type { EdgeIndicators } from '../../ui/EdgeIndicators';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { GameTickers } from './GameTickers';
import type { PauseMenu } from './PauseMenu';
import type { ChestSpriteRegistry } from './ChestSpriteRegistry';
import type { FilmGrainOverlay } from './FilmGrainOverlay';
import type { GameplaySessionGuard } from '../../core/GameSessionLifecycle';
import type { RunLifecycle } from './RunLifecycle';
import type { NodeMapSystem } from '../../systems/NodeMapSystem';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';

/**
 * Minimal scene surface the shutdown helper touches. Lets tests drive
 * the helper with a structural mock instead of a full Phaser.Scene.
 */
export interface RunEndShutdownScene {
  events: {
    once: (event: 'shutdown', cb: () => void) => unknown;
  };
  physics: {
    world: {
      removeCollider: (collider: Phaser.Physics.Arcade.Collider) => unknown;
    };
  };
  tweens: {
    killTweensOf: (target: object | unknown[]) => unknown;
  };
  /** Token-release adapter — only `release` is touched in shutdown.
   *  Mirrors the structural type `uninstallAutoBattleTimeScale` consumes. */
  getTimeManager: () => { release: (key: string) => void };
}

/** Function the helper calls to clear sfxManager singleton state. */
export type ClearSfxFn = () => void;

/** Function the helper calls to reset transient AudioSystem state. */
export type ResetAudioTransientFn = () => void;

/** Function the helper calls to dispose the recording-audio media stream. */
export type DisposeRecordingAudioStreamFn = () => void;

/** Function the helper calls to release the auto-battle time-scale token. */
export type UninstallAutoBattleTimeScaleFn = (
  scene: { getTimeManager: () => { release: (key: string) => void } },
) => void;

/**
 * Inputs passed to {@link installRunEndShutdown}. Every field is read
 * by name inside the registered shutdown callback. Setter callbacks
 * exist for fields that are nulled inline (Option B in the docstring
 * above); reads use plain refs for fields that only need a destroy.
 */
export interface RunEndShutdownDeps {
  /** Scene whose shutdown event the helper hooks. */
  scene: RunEndShutdownScene;

  // --- one-shot disposers ---------------------------------------------------
  /** Clip recorder; stopped + nulled on shutdown. */
  clipRecorder: ClipRecorder | null;
  /** Setter that nulls `scene.clipRecorder` after stop. */
  setClipRecorder: (next: ClipRecorder | null) => void;
  /** Disposes the recording-audio MediaStream singleton. */
  disposeRecordingAudioStream: DisposeRecordingAudioStreamFn;
  /** Releases the auto-battle time-scale token (silenced if not held). */
  uninstallAutoBattleTimeScale: UninstallAutoBattleTimeScaleFn;
  /** Gameplay-session guard whose `endIfStarted` is silenced on shutdown. */
  gameplaySessionGuard: GameplaySessionGuard;

  // --- physics collider ----------------------------------------------------
  /** Player↔enemy collider — removed from world + nulled. */
  playerEnemyCollider: Phaser.Physics.Arcade.Collider | null;
  /** Setter that nulls `scene.playerEnemyCollider` after removal. */
  setPlayerEnemyCollider: (next: Phaser.Physics.Arcade.Collider | null) => void;

  // --- audio singletons -----------------------------------------------------
  /** Clears sfxManager singleton state (`sfxManager.clear()`). */
  clearSfx: ClearSfxFn;
  /** Resets transient AudioSystem state (`audio.resetTransient()`). */
  resetAudioTransient: ResetAudioTransientFn;

  // --- bus / persistence / debug -------------------------------------------
  /** Event bus dispose function — called + nulled. */
  eventBusDispose: (() => void) | null;
  /** Setter that nulls `scene.eventBusDispose` after invocation. */
  setEventBusDispose: (next: (() => void) | null) => void;
  /** RunPersistenceBridge whose `unregisterMidRunHooks` is called. */
  runPersistence: RunPersistenceBridge | null | undefined;
  /** Debug time-travel API uninstaller. */
  debugTimeTravelApi: DebugTimeTravelApi | null | undefined;
  /** SubscriptionBag whose `dispose()` is silenced on shutdown. */
  subs: SubscriptionBag;
  /** Debug overlay — destroyed + nulled. */
  debugOverlay: DebugOverlay | null;
  /** Setter that nulls `scene.debugOverlay` after destroy. */
  setDebugOverlay: (next: DebugOverlay | null) => void;

  // --- run lifecycle / biome ambient fx ------------------------------------
  /** Run lifecycle — `uninstallPostBellKeyHandler` is invoked (no destroy). */
  runLifecycle: RunLifecycle | null | undefined;
  /** BiomeController — destroyed + nulled. */
  biomeController: BiomeController | null;
  /** Setter that nulls `scene.biomeController` after destroy. */
  setBiomeController: (next: BiomeController | null) => void;
  /** HaarFogController — only nulled (camera filter list is torn down
   *  with the scene; controller has no destroy). */
  setHaarFog: (next: HaarFogController | null) => void;
  /** FloraScatter — destroyed + nulled. */
  floraScatter: FloraScatter | null;
  /** Setter that nulls `scene.floraScatter` after destroy. */
  setFloraScatter: (next: FloraScatter | null) => void;
  /** WildlifeSystem — destroyed + nulled. */
  wildlifeSystem: WildlifeSystem | null;
  /** Setter that nulls `scene.wildlifeSystem` after destroy. */
  setWildlifeSystem: (next: WildlifeSystem | null) => void;
  /** MistLayer — destroyed + nulled. */
  mistLayer: MistLayer | null;
  /** Setter that nulls `scene.mistLayer` after destroy. */
  setMistLayer: (next: MistLayer | null) => void;

  // --- captions -------------------------------------------------------------
  /** Caption overlay — destroyed + nulled. */
  captionOverlay: CaptionOverlay | null;
  /** Setter that nulls `scene.captionOverlay` after destroy. */
  setCaptionOverlay: (next: CaptionOverlay | null) => void;
  /** Caption manager — cleared + nulled (no destroy on this type). */
  captionManager: CaptionManager | null;
  /** Setter that nulls `scene.captionManager` after clear. */
  setCaptionManager: (next: CaptionManager | null) => void;

  // --- core run systems -----------------------------------------------------
  /** WeaponSystem — `events.removeAllListeners()` then `destroy()`. */
  weaponSystem: WeaponSystem | null | undefined;
  /** XPSystem — `events.removeAllListeners()` then `destroy()`. */
  xpSystem: XPSystem | null | undefined;
  /** UpdateTickers (run-scoped tickers) — `clear()` is silenced. */
  updateTickers: UpdateTickers;
  /** TimeManager — `destroy()` is silenced. */
  timeManager: TimeManager | null | undefined;
  /** SpawnSystem — `destroy()` is silenced. */
  spawnSystem: SpawnSystem | null | undefined;
  /** TutorialSystem — `dispose()` is silenced. */
  tutorialSystem: TutorialSystem | null | undefined;
  /** StatusFxPool — `destroy()` is silenced. */
  statusFxPool: StatusFxPool | null | undefined;
  /** FloatTextPool — `destroyAll()` (NOT silenced — pool guards itself). */
  floatTextPool: FloatTextPool;

  // --- visual systems / HUD -------------------------------------------------
  /** JuiceSystem — `destroy()` is silenced. */
  juice: JuiceSystem | null | undefined;
  /** HUD — `destroy()` is silenced. */
  hud: HUD | null | undefined;
  /** Minimap — `destroy()` is silenced. */
  minimap: Minimap | null | undefined;
  /** NodeMapUI — destroyed + nulled. */
  nodeMapUI: NodeMapUI | null;
  /** Setter that nulls `scene.nodeMapUI` after destroy. */
  setNodeMapUI: (next: NodeMapUI | null) => void;
  /** NodePromptUI — destroyed + nulled. */
  nodePromptUI: NodePromptUI | null;
  /** Setter that nulls `scene.nodePromptUI` after destroy. */
  setNodePromptUI: (next: NodePromptUI | null) => void;
  /** Setter that resets `scene.interactivePromptIndex` to -1. */
  setInteractivePromptIndex: (next: number) => void;

  // --- node map state -------------------------------------------------------
  /** NodeMapSystem — `reset()` (no destroy). */
  nodeMapSystem: NodeMapSystem;
  /** NodeWaveTracker — `reset()` (no destroy). */
  nodeWaveTracker: NodeWaveTracker;

  // --- residual UI / overlays ----------------------------------------------
  /** EdgeIndicators — `destroy()` is silenced. */
  edgeIndicators: EdgeIndicators | null | undefined;
  /** UpgradeCardsUI — `hide()` is silenced (NOT destroy; UI persists across runs). */
  upgradeUI: UpgradeCardsUI | null | undefined;
  /** GameTickers — `destroy()` is silenced. */
  gameTickers: GameTickers | null | undefined;
  /** PauseMenu — `close()` then nulled. */
  pauseMenu: PauseMenu | null;
  /** Setter that nulls `scene.pauseMenu` after close. */
  setPauseMenu: (next: PauseMenu | null) => void;

  // --- chest cleanup --------------------------------------------------------
  /** ChestSpriteRegistry — sprites tween-killed + destroyed, then registry reset. */
  chestRegistry: ChestSpriteRegistry;

  // --- victory / death / film-grain overlays --------------------------------
  /** Victory fade rect — destroyed + nulled. */
  victoryFade: Phaser.GameObjects.Rectangle | null;
  /** Setter that nulls `scene.victoryFade` after destroy. */
  setVictoryFade: (next: Phaser.GameObjects.Rectangle | null) => void;
  /** Death fade rect — destroyed + nulled. */
  deathFade: Phaser.GameObjects.Rectangle | null;
  /** Setter that nulls `scene.deathFade` after destroy. */
  setDeathFade: (next: Phaser.GameObjects.Rectangle | null) => void;
  /** Film-grain overlay — destroyed + nulled. */
  filmGrain: FilmGrainOverlay | null;
  /** Setter that nulls `scene.filmGrain` after destroy. */
  setFilmGrain: (next: FilmGrainOverlay | null) => void;
}

/**
 * Register the run-end shutdown listener on the scene. Each call wires
 * a fresh `events.once('shutdown')` so scene reuse semantics are
 * preserved (recycled scene instances install a new listener every
 * `create()`).
 *
 * The listener body mirrors the pre-extraction shutdown arrow in
 * `GameScene.registerShutdownCleanup` line-for-line — every silenced
 * catch is preserved one-for-one. Reassignments are routed through
 * the setter callbacks supplied in {@link RunEndShutdownDeps}.
 */
export function installRunEndShutdown(deps: RunEndShutdownDeps): void {
  deps.scene.events.once('shutdown', () => {
    deps.clipRecorder?.stop();
    deps.setClipRecorder(null);
    deps.disposeRecordingAudioStream();
    try {
      deps.uninstallAutoBattleTimeScale(deps.scene);
    } catch {
      /* ignore */
    }
    try {
      deps.gameplaySessionGuard.endIfStarted();
    } catch {
      /* ignore */
    }
    if (deps.playerEnemyCollider) {
      try {
        deps.scene.physics.world.removeCollider(deps.playerEnemyCollider);
      } catch {
        /* ignore */
      }
      deps.setPlayerEnemyCollider(null);
    }
    deps.clearSfx();
    deps.resetAudioTransient();
    deps.eventBusDispose?.();
    deps.setEventBusDispose(null);
    deps.runPersistence?.unregisterMidRunHooks();
    deps.debugTimeTravelApi?.uninstall();
    try {
      deps.subs.dispose();
    } catch {
      /* ignore */
    }
    try {
      deps.debugOverlay?.destroy();
    } catch {
      /* ignore */
    }
    deps.setDebugOverlay(null);
    // Post-bell listener — outlives the scene if we don't remove it.
    deps.runLifecycle?.uninstallPostBellKeyHandler();
    try {
      deps.biomeController?.destroy();
    } catch {
      /* ignore */
    }
    deps.setBiomeController(null);
    // F1 M5 — drop the haar reference; the camera's filter list is torn
    // down with the scene, so the controller object is released with it.
    deps.setHaarFog(null);
    try {
      deps.floraScatter?.destroy();
    } catch {
      /* ignore */
    }
    deps.setFloraScatter(null);
    try {
      deps.wildlifeSystem?.destroy();
    } catch {
      /* ignore */
    }
    deps.setWildlifeSystem(null);
    try {
      deps.mistLayer?.destroy();
    } catch {
      /* ignore */
    }
    deps.setMistLayer(null);
    try {
      deps.captionOverlay?.destroy();
    } catch {
      /* ignore */
    }
    deps.setCaptionOverlay(null);
    deps.captionManager?.clear();
    deps.setCaptionManager(null);
    // Remove event listeners before destroying systems to prevent stacking on restart
    try {
      deps.weaponSystem?.events?.removeAllListeners();
    } catch {
      /* ignore */
    }
    try {
      deps.xpSystem?.events?.removeAllListeners();
    } catch {
      /* ignore */
    }
    // Flush run-scoped state on teardown to prevent "second run" bleed
    try {
      deps.updateTickers.clear();
    } catch {
      /* ignore */
    }
    try {
      deps.timeManager?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.weaponSystem?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.spawnSystem?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.tutorialSystem?.dispose();
    } catch {
      /* ignore */
    }
    try {
      deps.xpSystem?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.statusFxPool?.destroy();
    } catch {
      /* ignore */
    }
    deps.floatTextPool.destroyAll();
    // Close lifecycle gaps — these systems were silently orphaned before
    try {
      deps.juice?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.hud?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.minimap?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.nodeMapUI?.destroy();
    } catch {
      /* ignore */
    }
    deps.setNodeMapUI(null);
    try {
      deps.nodePromptUI?.destroy();
    } catch {
      /* ignore */
    }
    deps.setNodePromptUI(null);
    deps.setInteractivePromptIndex(-1);
    deps.nodeMapSystem.reset();
    deps.nodeWaveTracker.reset();
    try {
      deps.edgeIndicators?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.upgradeUI?.hide?.();
    } catch {
      /* ignore */
    }
    try {
      deps.gameTickers?.destroy();
    } catch {
      /* ignore */
    }
    try {
      deps.pauseMenu?.close();
    } catch {
      /* ignore */
    }
    deps.setPauseMenu(null);
    deps.chestRegistry.forEachSprite((sprite) => {
      try {
        deps.scene.tweens.killTweensOf(sprite);
      } catch {
        /* ignore */
      }
      try {
        sprite.destroy();
      } catch {
        /* ignore */
      }
    });
    deps.chestRegistry.reset();
    try {
      deps.victoryFade?.destroy();
    } catch {
      /* ignore */
    }
    deps.setVictoryFade(null);
    try {
      deps.deathFade?.destroy();
    } catch {
      /* ignore */
    }
    deps.setDeathFade(null);
    try {
      deps.filmGrain?.destroy();
    } catch {
      /* ignore */
    }
    deps.setFilmGrain(null);
  });
}
