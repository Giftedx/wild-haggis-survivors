/**
 * runEndShutdown — install + teardown contract for the GameScene
 * `events.once('shutdown')` listener. Pure tests; do NOT boot Phaser
 * (per CLAUDE.md "Phaser imports break in node-env vitest").
 *
 * Coverage matrix:
 *   - install registers exactly ONE `events.once('shutdown', ...)` per
 *     call (scene reuse contract — recycled scene instances install
 *     a fresh listener every `registerShutdownCleanup`).
 *   - shutdown body fires every destroy/dispose call in the original
 *     order (one-for-one parity with the pre-extraction body).
 *   - every silenced try/catch swallows its error and the rest of the
 *     shutdown sequence still runs (load-bearing partial-init safety).
 *   - reset paths fire on `nodeMapSystem`, `nodeWaveTracker`,
 *     `chestRegistry`, `floatTextPool`, `updateTickers`.
 *   - `chestRegistry.forEachSprite` walks every sprite + tween-kills it
 *     + destroys it (with each step silenced independently).
 *   - null deps (clipRecorder, biomeController, haarFog, etc.) skip
 *     their destroy without throwing — `?.` does the right thing.
 *   - reassigned refs (clipRecorder, playerEnemyCollider,
 *     eventBusDispose, debugOverlay, biomeController, haarFog, mistLayer,
 *     wildlifeSystem, floraScatter, captionOverlay, captionManager,
 *     nodeMapUI, nodePromptUI, interactivePromptIndex, pauseMenu,
 *     victoryFade, deathFade, filmGrain) are nulled after the
 *     shutdown body completes.
 *   - playerEnemyCollider null-branch skips world removal entirely.
 *   - eventBusDispose null path doesn't throw (the `?.()` short-circuit).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installRunEndShutdown, type RunEndShutdownDeps } from './runEndShutdown';

interface MockSceneEvents {
  once: ReturnType<typeof vi.fn>;
  shutdownHandlers: Array<() => void>;
  fireShutdown: () => void;
}

function makeMockSceneEvents(): MockSceneEvents {
  const handlers: Array<() => void> = [];
  const once = vi.fn((event: 'shutdown', cb: () => void) => {
    if (event === 'shutdown') handlers.push(cb);
    return null;
  });
  return {
    once,
    shutdownHandlers: handlers,
    fireShutdown: () => {
      // Mirror Phaser's `once` semantics: run once, then drop.
      const next = handlers.shift();
      if (next) next();
    },
  };
}

interface ShutdownLog {
  events: string[];
  /** Caller pushes labels in helper order so tests can assert sequence. */
  push: (label: string) => void;
}

function makeShutdownLog(): ShutdownLog {
  const events: string[] = [];
  return { events, push: (label) => events.push(label) };
}

interface NullableRefs {
  clipRecorder: unknown;
  playerEnemyCollider: unknown;
  eventBusDispose: (() => void) | null;
  debugOverlay: unknown;
  biomeController: unknown;
  haarFog: unknown;
  floraScatter: unknown;
  wildlifeSystem: unknown;
  mistLayer: unknown;
  captionOverlay: unknown;
  captionManager: unknown;
  nodeMapUI: unknown;
  nodePromptUI: unknown;
  interactivePromptIndex: number;
  pauseMenu: unknown;
  victoryFade: unknown;
  deathFade: unknown;
  filmGrain: unknown;
}

/**
 * Build a full deps object with a logging mock for every call. Tests
 * supply overrides for the specific deps they care about.
 */
function makeDeps(
  log: ShutdownLog,
  scene: MockSceneEvents,
  refs: Partial<NullableRefs> = {},
): {
  deps: RunEndShutdownDeps;
  refs: NullableRefs;
  collider: unknown;
} {
  const collider = { id: 'collider' } as unknown as NonNullable<RunEndShutdownDeps['playerEnemyCollider']>;
  const liveRefs: NullableRefs = {
    clipRecorder: { stop: vi.fn(() => log.push('clip.stop')) },
    playerEnemyCollider: collider,
    eventBusDispose: vi.fn(() => log.push('eventBusDispose')),
    debugOverlay: { destroy: vi.fn(() => log.push('debugOverlay.destroy')) },
    biomeController: { destroy: vi.fn(() => log.push('biomeController.destroy')) },
    haarFog: { dummy: true },
    floraScatter: { destroy: vi.fn(() => log.push('floraScatter.destroy')) },
    wildlifeSystem: { destroy: vi.fn(() => log.push('wildlifeSystem.destroy')) },
    mistLayer: { destroy: vi.fn(() => log.push('mistLayer.destroy')) },
    captionOverlay: { destroy: vi.fn(() => log.push('captionOverlay.destroy')) },
    captionManager: { clear: vi.fn(() => log.push('captionManager.clear')) },
    nodeMapUI: { destroy: vi.fn(() => log.push('nodeMapUI.destroy')) },
    nodePromptUI: { destroy: vi.fn(() => log.push('nodePromptUI.destroy')) },
    interactivePromptIndex: 7,
    pauseMenu: { close: vi.fn(() => log.push('pauseMenu.close')) },
    victoryFade: { destroy: vi.fn(() => log.push('victoryFade.destroy')) },
    deathFade: { destroy: vi.fn(() => log.push('deathFade.destroy')) },
    filmGrain: { destroy: vi.fn(() => log.push('filmGrain.destroy')) },
    ...refs,
  };

  const deps: RunEndShutdownDeps = {
    scene: {
      events: scene as unknown as RunEndShutdownDeps['scene']['events'] & MockSceneEvents,
      physics: {
        world: {
          removeCollider: vi.fn(() => log.push('world.removeCollider')),
        },
      },
      tweens: {
        killTweensOf: vi.fn(() => log.push('tweens.killTweensOf')),
      },
      getTimeManager: () => ({ release: vi.fn() }),
    } as unknown as RunEndShutdownDeps['scene'],
    clipRecorder: liveRefs.clipRecorder as RunEndShutdownDeps['clipRecorder'],
    setClipRecorder: vi.fn((next) => {
      liveRefs.clipRecorder = next;
      log.push(`set:clipRecorder=${next === null ? 'null' : 'value'}`);
    }),
    disposeRecordingAudioStream: vi.fn(() => log.push('disposeRecordingAudioStream')),
    uninstallAutoBattleTimeScale: vi.fn(() => log.push('uninstallAutoBattleTimeScale')),
    gameplaySessionGuard: {
      markStarted: vi.fn(),
      endIfStarted: vi.fn(() => log.push('gameplaySessionGuard.endIfStarted')),
    } as unknown as RunEndShutdownDeps['gameplaySessionGuard'],
    playerEnemyCollider: liveRefs.playerEnemyCollider as RunEndShutdownDeps['playerEnemyCollider'],
    setPlayerEnemyCollider: vi.fn((next) => {
      liveRefs.playerEnemyCollider = next;
      log.push(`set:playerEnemyCollider=${next === null ? 'null' : 'value'}`);
    }),
    clearSfx: vi.fn(() => log.push('sfxManager.clear')),
    resetAudioTransient: vi.fn(() => log.push('audio.resetTransient')),
    eventBusDispose: liveRefs.eventBusDispose,
    setEventBusDispose: vi.fn((next) => {
      liveRefs.eventBusDispose = next;
      log.push(`set:eventBusDispose=${next === null ? 'null' : 'value'}`);
    }),
    runPersistence: {
      unregisterMidRunHooks: vi.fn(() => log.push('runPersistence.unregisterMidRunHooks')),
    } as unknown as RunEndShutdownDeps['runPersistence'],
    debugTimeTravelApi: {
      uninstall: vi.fn(() => log.push('debugTimeTravelApi.uninstall')),
    } as unknown as RunEndShutdownDeps['debugTimeTravelApi'],
    subs: {
      dispose: vi.fn(() => log.push('subs.dispose')),
    } as unknown as RunEndShutdownDeps['subs'],
    debugOverlay: liveRefs.debugOverlay as RunEndShutdownDeps['debugOverlay'],
    setDebugOverlay: vi.fn((next) => {
      liveRefs.debugOverlay = next;
      log.push(`set:debugOverlay=${next === null ? 'null' : 'value'}`);
    }),
    runLifecycle: {
      uninstallPostBellKeyHandler: vi.fn(() =>
        log.push('runLifecycle.uninstallPostBellKeyHandler'),
      ),
    } as unknown as RunEndShutdownDeps['runLifecycle'],
    biomeController: liveRefs.biomeController as RunEndShutdownDeps['biomeController'],
    setBiomeController: vi.fn((next) => {
      liveRefs.biomeController = next;
      log.push(`set:biomeController=${next === null ? 'null' : 'value'}`);
    }),
    setHaarFog: vi.fn((next) => {
      liveRefs.haarFog = next;
      log.push(`set:haarFog=${next === null ? 'null' : 'value'}`);
    }),
    floraScatter: liveRefs.floraScatter as RunEndShutdownDeps['floraScatter'],
    setFloraScatter: vi.fn((next) => {
      liveRefs.floraScatter = next;
      log.push(`set:floraScatter=${next === null ? 'null' : 'value'}`);
    }),
    wildlifeSystem: liveRefs.wildlifeSystem as RunEndShutdownDeps['wildlifeSystem'],
    setWildlifeSystem: vi.fn((next) => {
      liveRefs.wildlifeSystem = next;
      log.push(`set:wildlifeSystem=${next === null ? 'null' : 'value'}`);
    }),
    mistLayer: liveRefs.mistLayer as RunEndShutdownDeps['mistLayer'],
    setMistLayer: vi.fn((next) => {
      liveRefs.mistLayer = next;
      log.push(`set:mistLayer=${next === null ? 'null' : 'value'}`);
    }),
    captionOverlay: liveRefs.captionOverlay as RunEndShutdownDeps['captionOverlay'],
    setCaptionOverlay: vi.fn((next) => {
      liveRefs.captionOverlay = next;
      log.push(`set:captionOverlay=${next === null ? 'null' : 'value'}`);
    }),
    captionManager: liveRefs.captionManager as RunEndShutdownDeps['captionManager'],
    setCaptionManager: vi.fn((next) => {
      liveRefs.captionManager = next;
      log.push(`set:captionManager=${next === null ? 'null' : 'value'}`);
    }),
    weaponSystem: {
      events: {
        removeAllListeners: vi.fn(() => log.push('weaponSystem.events.removeAllListeners')),
      },
      destroy: vi.fn(() => log.push('weaponSystem.destroy')),
    } as unknown as RunEndShutdownDeps['weaponSystem'],
    xpSystem: {
      events: {
        removeAllListeners: vi.fn(() => log.push('xpSystem.events.removeAllListeners')),
      },
      destroy: vi.fn(() => log.push('xpSystem.destroy')),
    } as unknown as RunEndShutdownDeps['xpSystem'],
    updateTickers: {
      clear: vi.fn(() => log.push('updateTickers.clear')),
    } as unknown as RunEndShutdownDeps['updateTickers'],
    timeManager: {
      destroy: vi.fn(() => log.push('timeManager.destroy')),
    } as unknown as RunEndShutdownDeps['timeManager'],
    spawnSystem: {
      destroy: vi.fn(() => log.push('spawnSystem.destroy')),
    } as unknown as RunEndShutdownDeps['spawnSystem'],
    tutorialSystem: {
      dispose: vi.fn(() => log.push('tutorialSystem.dispose')),
    } as unknown as RunEndShutdownDeps['tutorialSystem'],
    statusFxPool: {
      destroy: vi.fn(() => log.push('statusFxPool.destroy')),
    } as unknown as RunEndShutdownDeps['statusFxPool'],
    floatTextPool: {
      destroyAll: vi.fn(() => log.push('floatTextPool.destroyAll')),
    } as unknown as RunEndShutdownDeps['floatTextPool'],
    juice: {
      destroy: vi.fn(() => log.push('juice.destroy')),
    } as unknown as RunEndShutdownDeps['juice'],
    hud: {
      destroy: vi.fn(() => log.push('hud.destroy')),
    } as unknown as RunEndShutdownDeps['hud'],
    minimap: {
      destroy: vi.fn(() => log.push('minimap.destroy')),
    } as unknown as RunEndShutdownDeps['minimap'],
    nodeMapUI: liveRefs.nodeMapUI as RunEndShutdownDeps['nodeMapUI'],
    setNodeMapUI: vi.fn((next) => {
      liveRefs.nodeMapUI = next;
      log.push(`set:nodeMapUI=${next === null ? 'null' : 'value'}`);
    }),
    nodePromptUI: liveRefs.nodePromptUI as RunEndShutdownDeps['nodePromptUI'],
    setNodePromptUI: vi.fn((next) => {
      liveRefs.nodePromptUI = next;
      log.push(`set:nodePromptUI=${next === null ? 'null' : 'value'}`);
    }),
    setInteractivePromptIndex: vi.fn((next) => {
      liveRefs.interactivePromptIndex = next;
      log.push(`set:interactivePromptIndex=${next}`);
    }),
    nodeMapSystem: {
      reset: vi.fn(() => log.push('nodeMapSystem.reset')),
    } as unknown as RunEndShutdownDeps['nodeMapSystem'],
    nodeWaveTracker: {
      reset: vi.fn(() => log.push('nodeWaveTracker.reset')),
    } as unknown as RunEndShutdownDeps['nodeWaveTracker'],
    edgeIndicators: {
      destroy: vi.fn(() => log.push('edgeIndicators.destroy')),
    } as unknown as RunEndShutdownDeps['edgeIndicators'],
    upgradeUI: {
      hide: vi.fn(() => log.push('upgradeUI.hide')),
    } as unknown as RunEndShutdownDeps['upgradeUI'],
    gameTickers: {
      destroy: vi.fn(() => log.push('gameTickers.destroy')),
    } as unknown as RunEndShutdownDeps['gameTickers'],
    pauseMenu: liveRefs.pauseMenu as RunEndShutdownDeps['pauseMenu'],
    setPauseMenu: vi.fn((next) => {
      liveRefs.pauseMenu = next;
      log.push(`set:pauseMenu=${next === null ? 'null' : 'value'}`);
    }),
    chestRegistry: {
      forEachSprite: vi.fn((fn: (s: object) => void) => {
        log.push('chestRegistry.forEachSprite');
        fn({ destroy: () => log.push('chestSprite.destroy') } as unknown as object);
      }),
      reset: vi.fn(() => log.push('chestRegistry.reset')),
    } as unknown as RunEndShutdownDeps['chestRegistry'],
    victoryFade: liveRefs.victoryFade as RunEndShutdownDeps['victoryFade'],
    setVictoryFade: vi.fn((next) => {
      liveRefs.victoryFade = next;
      log.push(`set:victoryFade=${next === null ? 'null' : 'value'}`);
    }),
    deathFade: liveRefs.deathFade as RunEndShutdownDeps['deathFade'],
    setDeathFade: vi.fn((next) => {
      liveRefs.deathFade = next;
      log.push(`set:deathFade=${next === null ? 'null' : 'value'}`);
    }),
    filmGrain: liveRefs.filmGrain as RunEndShutdownDeps['filmGrain'],
    setFilmGrain: vi.fn((next) => {
      liveRefs.filmGrain = next;
      log.push(`set:filmGrain=${next === null ? 'null' : 'value'}`);
    }),
  };

  return { deps, refs: liveRefs, collider };
}

describe('installRunEndShutdown', () => {
  let log: ShutdownLog;
  let scene: MockSceneEvents;

  beforeEach(() => {
    log = makeShutdownLog();
    scene = makeMockSceneEvents();
  });

  it('registers exactly one shutdown listener per call', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    expect(scene.once).toHaveBeenCalledTimes(1);
    expect(scene.once).toHaveBeenCalledWith('shutdown', expect.any(Function));
  });

  it('two installs register two listeners (scene reuse contract)', () => {
    // Recycled scene instances must wire a fresh listener every
    // `registerShutdownCleanup` — no memoization or double-install guard.
    const a = makeDeps(log, scene);
    const b = makeDeps(log, scene);
    installRunEndShutdown(a.deps);
    installRunEndShutdown(b.deps);
    expect(scene.once).toHaveBeenCalledTimes(2);
    expect(scene.shutdownHandlers).toHaveLength(2);
  });

  it('does not invoke any teardown call before the shutdown event fires', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    // Helper installs a one-shot listener; the body sits dormant until
    // the scene actually shuts down.
    expect(log.events).toEqual([]);
  });

  it('runs every destroy/dispose call when shutdown fires', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    // Spot-check: each major lifecycle disposer was called at least once.
    expect(log.events).toContain('clip.stop');
    expect(log.events).toContain('disposeRecordingAudioStream');
    expect(log.events).toContain('uninstallAutoBattleTimeScale');
    expect(log.events).toContain('gameplaySessionGuard.endIfStarted');
    expect(log.events).toContain('world.removeCollider');
    expect(log.events).toContain('sfxManager.clear');
    expect(log.events).toContain('audio.resetTransient');
    expect(log.events).toContain('eventBusDispose');
    expect(log.events).toContain('runPersistence.unregisterMidRunHooks');
    expect(log.events).toContain('debugTimeTravelApi.uninstall');
    expect(log.events).toContain('subs.dispose');
    expect(log.events).toContain('debugOverlay.destroy');
    expect(log.events).toContain('runLifecycle.uninstallPostBellKeyHandler');
    expect(log.events).toContain('biomeController.destroy');
    expect(log.events).toContain('floraScatter.destroy');
    expect(log.events).toContain('wildlifeSystem.destroy');
    expect(log.events).toContain('mistLayer.destroy');
    expect(log.events).toContain('captionOverlay.destroy');
    expect(log.events).toContain('captionManager.clear');
    expect(log.events).toContain('weaponSystem.events.removeAllListeners');
    expect(log.events).toContain('xpSystem.events.removeAllListeners');
    expect(log.events).toContain('updateTickers.clear');
    expect(log.events).toContain('timeManager.destroy');
    expect(log.events).toContain('weaponSystem.destroy');
    expect(log.events).toContain('spawnSystem.destroy');
    expect(log.events).toContain('tutorialSystem.dispose');
    expect(log.events).toContain('xpSystem.destroy');
    expect(log.events).toContain('statusFxPool.destroy');
    expect(log.events).toContain('floatTextPool.destroyAll');
    expect(log.events).toContain('juice.destroy');
    expect(log.events).toContain('hud.destroy');
    expect(log.events).toContain('minimap.destroy');
    expect(log.events).toContain('nodeMapUI.destroy');
    expect(log.events).toContain('nodePromptUI.destroy');
    expect(log.events).toContain('nodeMapSystem.reset');
    expect(log.events).toContain('nodeWaveTracker.reset');
    expect(log.events).toContain('edgeIndicators.destroy');
    expect(log.events).toContain('upgradeUI.hide');
    expect(log.events).toContain('gameTickers.destroy');
    expect(log.events).toContain('pauseMenu.close');
    expect(log.events).toContain('chestRegistry.forEachSprite');
    expect(log.events).toContain('chestSprite.destroy');
    expect(log.events).toContain('chestRegistry.reset');
    expect(log.events).toContain('victoryFade.destroy');
    expect(log.events).toContain('deathFade.destroy');
    expect(log.events).toContain('filmGrain.destroy');
  });

  it('preserves the destroy/null pair order: weaponSystem listener removal BEFORE destroy', () => {
    // Pre-extraction comment: "Remove event listeners before destroying
    // systems to prevent stacking on restart."
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    const removeIdx = log.events.indexOf('weaponSystem.events.removeAllListeners');
    const destroyIdx = log.events.indexOf('weaponSystem.destroy');
    expect(removeIdx).toBeGreaterThan(-1);
    expect(destroyIdx).toBeGreaterThan(-1);
    expect(removeIdx).toBeLessThan(destroyIdx);
  });

  it('preserves the destroy/null pair order: xpSystem listener removal BEFORE destroy', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    const removeIdx = log.events.indexOf('xpSystem.events.removeAllListeners');
    const destroyIdx = log.events.indexOf('xpSystem.destroy');
    expect(removeIdx).toBeGreaterThan(-1);
    expect(destroyIdx).toBeGreaterThan(-1);
    expect(removeIdx).toBeLessThan(destroyIdx);
  });

  it('resets nodeMapSystem and nodeWaveTracker (run-state flush)', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    expect(deps.nodeMapSystem.reset).toHaveBeenCalledTimes(1);
    expect(deps.nodeWaveTracker.reset).toHaveBeenCalledTimes(1);
  });

  it('chestRegistry walks each sprite, tween-kills it, then destroys it, then resets the registry', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();

    expect(deps.chestRegistry.forEachSprite).toHaveBeenCalledTimes(1);
    expect(deps.chestRegistry.reset).toHaveBeenCalledTimes(1);

    const forIdx = log.events.indexOf('chestRegistry.forEachSprite');
    const tweenIdx = log.events.indexOf('tweens.killTweensOf');
    const destroyIdx = log.events.indexOf('chestSprite.destroy');
    const resetIdx = log.events.indexOf('chestRegistry.reset');

    expect(forIdx).toBeGreaterThan(-1);
    expect(tweenIdx).toBeGreaterThan(forIdx);
    expect(destroyIdx).toBeGreaterThan(tweenIdx);
    expect(resetIdx).toBeGreaterThan(destroyIdx);
  });

  it('skips world.removeCollider when playerEnemyCollider is null', () => {
    const { deps } = makeDeps(log, scene, { playerEnemyCollider: null });
    deps.playerEnemyCollider = null;
    installRunEndShutdown(deps);
    scene.fireShutdown();
    expect(log.events).not.toContain('world.removeCollider');
    expect(deps.setPlayerEnemyCollider).not.toHaveBeenCalled();
  });

  it('null deps short-circuit through optional chaining without throwing', () => {
    const { deps } = makeDeps(log, scene);
    deps.clipRecorder = null;
    deps.eventBusDispose = null;
    deps.runPersistence = null;
    deps.debugTimeTravelApi = null;
    deps.debugOverlay = null;
    deps.runLifecycle = null;
    deps.biomeController = null;
    deps.floraScatter = null;
    deps.wildlifeSystem = null;
    deps.mistLayer = null;
    deps.captionOverlay = null;
    deps.captionManager = null;
    deps.weaponSystem = null;
    deps.xpSystem = null;
    deps.timeManager = null;
    deps.spawnSystem = null;
    deps.tutorialSystem = null;
    deps.statusFxPool = null;
    deps.juice = null;
    deps.hud = null;
    deps.minimap = null;
    deps.nodeMapUI = null;
    deps.nodePromptUI = null;
    deps.edgeIndicators = null;
    deps.upgradeUI = null;
    deps.gameTickers = null;
    deps.pauseMenu = null;
    deps.victoryFade = null;
    deps.deathFade = null;
    deps.filmGrain = null;
    installRunEndShutdown(deps);

    expect(() => scene.fireShutdown()).not.toThrow();
    // Essential singletons still fire even when refs are null.
    expect(log.events).toContain('disposeRecordingAudioStream');
    expect(log.events).toContain('sfxManager.clear');
    expect(log.events).toContain('audio.resetTransient');
    expect(log.events).toContain('floatTextPool.destroyAll');
    expect(log.events).toContain('nodeMapSystem.reset');
    expect(log.events).toContain('nodeWaveTracker.reset');
    expect(log.events).toContain('chestRegistry.forEachSprite');
    expect(log.events).toContain('chestRegistry.reset');
  });

  it('throwing destroy is silenced and the shutdown sequence continues', () => {
    // Pick a destroy mid-sequence: floraScatter.destroy throws. Every
    // later call must still fire — partial-init safety contract.
    const { deps } = makeDeps(log, scene);
    deps.floraScatter = {
      destroy: vi.fn(() => {
        throw new Error('boom: partial-init floraScatter');
      }),
    } as unknown as RunEndShutdownDeps['floraScatter'];
    installRunEndShutdown(deps);

    expect(() => scene.fireShutdown()).not.toThrow();
    // Calls AFTER floraScatter.destroy must still have fired.
    expect(log.events).toContain('wildlifeSystem.destroy');
    expect(log.events).toContain('mistLayer.destroy');
    expect(log.events).toContain('weaponSystem.destroy');
    expect(log.events).toContain('chestRegistry.reset');
    expect(log.events).toContain('filmGrain.destroy');
    // The setter for the throwing field still ran — we need the null-out
    // even when destroy threw.
    expect(deps.setFloraScatter).toHaveBeenCalledWith(null);
  });

  it('throwing subs.dispose is silenced and shutdown continues', () => {
    // SubscriptionBag.dispose can throw if a downstream listener
    // disposes itself oddly; CLAUDE.md says silenced-catches are
    // load-bearing for partial-init failures.
    const { deps } = makeDeps(log, scene);
    deps.subs = {
      dispose: vi.fn(() => {
        throw new Error('boom: subs');
      }),
    } as unknown as RunEndShutdownDeps['subs'];
    installRunEndShutdown(deps);
    expect(() => scene.fireShutdown()).not.toThrow();
    expect(log.events).toContain('biomeController.destroy');
    expect(log.events).toContain('weaponSystem.destroy');
  });

  it('throwing chestSprite.destroy is silenced (per-sprite catch)', () => {
    // chestRegistry.forEachSprite calls fn(sprite); fn does
    // `try { tweens.killTweensOf } catch` then `try { sprite.destroy }
    // catch`. A throwing destroy on one sprite must not stop the
    // registry's overall reset.
    const log2 = makeShutdownLog();
    const { deps } = makeDeps(log2, scene);
    deps.chestRegistry = {
      forEachSprite: vi.fn((fn: (s: object) => void) => {
        log2.push('chestRegistry.forEachSprite');
        fn({
          destroy: () => {
            throw new Error('boom: sprite');
          },
        } as unknown as object);
      }),
      reset: vi.fn(() => log2.push('chestRegistry.reset')),
    } as unknown as RunEndShutdownDeps['chestRegistry'];
    installRunEndShutdown(deps);
    expect(() => scene.fireShutdown()).not.toThrow();
    expect(log2.events).toContain('chestRegistry.reset');
  });

  it('reassigned refs are nulled via setters after shutdown fires', () => {
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    // Every setter was invoked at least once, with `null` (or -1 for
    // the index field).
    expect(deps.setClipRecorder).toHaveBeenCalledWith(null);
    expect(deps.setPlayerEnemyCollider).toHaveBeenCalledWith(null);
    expect(deps.setEventBusDispose).toHaveBeenCalledWith(null);
    expect(deps.setDebugOverlay).toHaveBeenCalledWith(null);
    expect(deps.setBiomeController).toHaveBeenCalledWith(null);
    expect(deps.setHaarFog).toHaveBeenCalledWith(null);
    expect(deps.setFloraScatter).toHaveBeenCalledWith(null);
    expect(deps.setWildlifeSystem).toHaveBeenCalledWith(null);
    expect(deps.setMistLayer).toHaveBeenCalledWith(null);
    expect(deps.setCaptionOverlay).toHaveBeenCalledWith(null);
    expect(deps.setCaptionManager).toHaveBeenCalledWith(null);
    expect(deps.setNodeMapUI).toHaveBeenCalledWith(null);
    expect(deps.setNodePromptUI).toHaveBeenCalledWith(null);
    expect(deps.setInteractivePromptIndex).toHaveBeenCalledWith(-1);
    expect(deps.setPauseMenu).toHaveBeenCalledWith(null);
    expect(deps.setVictoryFade).toHaveBeenCalledWith(null);
    expect(deps.setDeathFade).toHaveBeenCalledWith(null);
    expect(deps.setFilmGrain).toHaveBeenCalledWith(null);
  });

  it('haarFog setter fires even though haarFog has no destroy method', () => {
    // F1 M5 — drop the haar reference; the camera's filter list is torn
    // down with the scene. Helper only nulls; no destroy call.
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    expect(deps.setHaarFog).toHaveBeenCalledTimes(1);
    expect(deps.setHaarFog).toHaveBeenCalledWith(null);
  });

  it('eventBusDispose null path skips invocation but setter still nulls', () => {
    const { deps } = makeDeps(log, scene);
    deps.eventBusDispose = null;
    installRunEndShutdown(deps);
    scene.fireShutdown();
    expect(log.events).not.toContain('eventBusDispose');
    expect(deps.setEventBusDispose).toHaveBeenCalledWith(null);
  });

  it('two installs both fire their handlers when each shutdown event arrives', () => {
    const a = makeDeps(log, scene);
    const b = makeDeps(log, scene);
    installRunEndShutdown(a.deps);
    installRunEndShutdown(b.deps);
    scene.fireShutdown();
    scene.fireShutdown();
    // Both setters fired (one per install — scene-reuse symmetry).
    expect(a.deps.setClipRecorder).toHaveBeenCalledTimes(1);
    expect(b.deps.setClipRecorder).toHaveBeenCalledTimes(1);
  });

  it('uninstallAutoBattleTimeScale is silenced when it throws', () => {
    // No auto-battle session active → release of unheld token can
    // throw on some adapter implementations.
    const { deps } = makeDeps(log, scene);
    deps.uninstallAutoBattleTimeScale = vi.fn(() => {
      throw new Error('boom: no token held');
    });
    installRunEndShutdown(deps);
    expect(() => scene.fireShutdown()).not.toThrow();
    expect(log.events).toContain('sfxManager.clear');
  });

  it('gameplaySessionGuard.endIfStarted is silenced when it throws', () => {
    const { deps } = makeDeps(log, scene);
    deps.gameplaySessionGuard = {
      markStarted: vi.fn(),
      endIfStarted: vi.fn(() => {
        throw new Error('boom: guard');
      }),
    } as unknown as RunEndShutdownDeps['gameplaySessionGuard'];
    installRunEndShutdown(deps);
    expect(() => scene.fireShutdown()).not.toThrow();
    expect(log.events).toContain('sfxManager.clear');
  });

  it('world.removeCollider catch swallows error (collider already removed)', () => {
    const { deps } = makeDeps(log, scene);
    (deps.scene.physics.world.removeCollider as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error('boom: collider already removed');
      },
    );
    installRunEndShutdown(deps);
    expect(() => scene.fireShutdown()).not.toThrow();
    // The setter still fires after the silenced throw — the field
    // must be nulled so a recycled scene re-enters with a clean slate.
    expect(deps.setPlayerEnemyCollider).toHaveBeenCalledWith(null);
  });

  it('full call-order parity: prefix matches the pre-extraction sequence', () => {
    // Pin the FIRST FEW (well-defined) calls to lock the order. The
    // pre-extraction body is line-by-line: clip.stop → setClipRecorder
    // null → disposeRecordingAudioStream → uninstallAutoBattleTimeScale
    // → gameplaySessionGuard.endIfStarted → world.removeCollider →
    // setPlayerEnemyCollider null → sfxManager.clear → audio.resetTransient.
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    const events = log.events;
    expect(events[0]).toBe('clip.stop');
    expect(events[1]).toBe('set:clipRecorder=null');
    expect(events[2]).toBe('disposeRecordingAudioStream');
    expect(events[3]).toBe('uninstallAutoBattleTimeScale');
    expect(events[4]).toBe('gameplaySessionGuard.endIfStarted');
    expect(events[5]).toBe('world.removeCollider');
    expect(events[6]).toBe('set:playerEnemyCollider=null');
    expect(events[7]).toBe('sfxManager.clear');
    expect(events[8]).toBe('audio.resetTransient');
  });

  it('full call-order parity: tail matches the pre-extraction sequence', () => {
    // Last few calls in the pre-extraction body: chestRegistry.reset →
    // victoryFade.destroy → setVictoryFade null → deathFade.destroy →
    // setDeathFade null → filmGrain.destroy → setFilmGrain null.
    const { deps } = makeDeps(log, scene);
    installRunEndShutdown(deps);
    scene.fireShutdown();
    const events = log.events;
    const len = events.length;
    expect(events[len - 1]).toBe('set:filmGrain=null');
    expect(events[len - 2]).toBe('filmGrain.destroy');
    expect(events[len - 3]).toBe('set:deathFade=null');
    expect(events[len - 4]).toBe('deathFade.destroy');
    expect(events[len - 5]).toBe('set:victoryFade=null');
    expect(events[len - 6]).toBe('victoryFade.destroy');
    expect(events[len - 7]).toBe('chestRegistry.reset');
  });
});
