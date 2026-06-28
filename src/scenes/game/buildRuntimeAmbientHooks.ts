/**
 * buildRuntimeAmbientHooks — assembles the opts bag passed to
 * {@link installRuntimeAmbient} (weather + hazards + game tickers +
 * pickup spawner) from `GameScene.create()`.
 *
 * Why extract: ~26 LOC of getter wiring. Pulling it into a sibling
 * builder shrinks the scene class without changing behaviour.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads/writes scene fields (weather, relicEffectDriver,
 * runeSystemController, pickupDespawnHandles, relicOrchestrator) outside
 * any sub-system's public surface. A type-only `import type { GameScene }`
 * keeps the wiring honest without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { InstallRuntimeAmbientOpts } from './installRuntimeAmbient';

/**
 * Build the {@link InstallRuntimeAmbientOpts} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installRuntimeAmbient(...)` call.
 */
export function buildRuntimeAmbientHooks(scene: GameScene): InstallRuntimeAmbientOpts {
  return {
    scene,
    getPlayer: () => scene.player,
    getJuice: () => scene.juice,
    getCurrentBiomeId: () => scene.getCurrentBiomeId(),
    getRunRng: () => scene.runRng,
    isIFramesActive: () => scene.iFrameController.isActive(),
    getUiViewport: () => scene.getUiViewport(),
    getBanter: () => scene.banter,
    getActiveVariantKey: () => scene.activeVariant.key,
    hasEnemyNearby: (r) => scene.spawnSystem.hasEnemyNear(scene.player?.x ?? 0, scene.player?.y ?? 0, r),
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
    getXPSystem: () => scene.xpSystem,
    getUpdateTickers: () => scene.updateTickers,
    getSFXManager: () => scene.getSFXManager(),
    getChestDurationBonusMs: () => scene.chestDurationBonusMs,
    getChestRegistry: () => scene.chestRegistry,
    getFloatTextPool: () => scene.floatTextPool,
    getRelicEffectDriver: () => scene.relicEffectDriver,
    getLevelUpFlow: () => scene.levelUpFlow,
    getRuneSystemController: () => scene.runeSystemController,
    getRunScore: () => scene.runScore,
    pushPickupDespawnHandle: (h) => { scene.pickupDespawnHandles.push(h); },
    attachRelicSpawner: () => scene.relicOrchestrator.attachSpawner(),
    onWeatherShutdown: () => { scene.weather = null; },
    onHazardsShutdown: () => { scene.hazards = null; },
  };
}
