/**
 * Cailleach Gauntlet scene wire (V2 of The Moor Remembers, 2026-05-22).
 *
 * Extracted from GameScene.create() so the scene file stays under the
 * 2200-LOC hard ceiling. Owns the scheduler instantiation + candle
 * sprite spawn/snuff/destroy. The scene only holds a ref to the
 * scheduler + an opaque cleanup function for end-of-run.
 *
 * Pattern matches the V1 cairnOfEchoesSceneWire — keep Phaser glue out
 * of the scene's hot path. Sister-call site sits next to the cairn
 * scheduler instantiation in `resetTransientRunState`.
 *
 * Spec: `docs/archive/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 */
import * as Phaser from 'phaser';
import {
  CailleachGauntletScheduler,
  type CailleachGauntletSchedulerHooks,
} from './CailleachGauntletScheduler';
import type { Player } from '../../entities/Player';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { SaveManager } from '../../core/SaveManager';
import type { CairnOfEchoesScheduler } from './CairnOfEchoesScheduler';
import { globalEventBus, type GlobalEnemyKilledPayload } from '../../core/GlobalEventBus';
import { unlockCompanion } from '../../utils/save';
import { t } from '../../core/i18n';

export interface CailleachGauntletInstallDeps {
  readonly scene: Phaser.Scene;
  readonly getPlayer: () => Player | null;
  readonly getSpawnSystem: () => SpawnSystem;
  readonly getBanter: () => BanterSystem | null;
  readonly getCairnScheduler: () => CairnOfEchoesScheduler;
  readonly metaSaveManager: SaveManager;
  readonly caption: (id: string, message: string, color?: string, durationMs?: number) => void;
  readonly showToast: (message: string, color?: string) => void;
}

export interface CailleachGauntletInstallResult {
  readonly scheduler: CailleachGauntletScheduler;
  /** Cleanup — destroy candle sprites + unsub event listeners. */
  readonly teardown: () => void;
}

/**
 * Install the gauntlet on a fresh run. Caller stores `scheduler` for
 * the per-frame tick and calls `teardown()` on scene reset.
 */
export function installCailleachGauntlet(
  deps: CailleachGauntletInstallDeps,
): CailleachGauntletInstallResult {
  let candles: Phaser.GameObjects.Image[] = [];
  let cailleachBossKilled = false;

  const onEnemyKilled = (payload: GlobalEnemyKilledPayload): void => {
    if (payload.enemyKey === 'cailleach_boss') cailleachBossKilled = true;
  };
  const unsubEnemyKilled = globalEventBus.on('GLOBAL_ENEMY_KILLED', onEnemyKilled);

  const spawnGauntletCandles = (
    ring: readonly { readonly x: number; readonly y: number }[],
  ): void => {
    const scene = deps.scene;
    if (!scene.textures.exists('fx_cailleach_candle_lit')) return;
    for (const p of ring) {
      const candle = scene.add.image(p.x, p.y, 'fx_cailleach_candle_lit');
      candle.setDepth(5);
      candle.setScale(2);
      candles.push(candle);
    }
  };

  const snuffGauntletCandles = (outcome: 'wreathed' | 'extinguished'): void => {
    const tex = outcome === 'wreathed'
      ? 'fx_cailleach_candle_wreathed'
      : 'fx_cailleach_candle_extinguished';
    if (!deps.scene.textures.exists(tex)) return;
    for (const candle of candles) {
      candle.setTexture(tex);
    }
  };

  const destroyCandles = (): void => {
    for (const candle of candles) {
      try { candle.destroy(); } catch { /* scene may have restarted */ }
    }
    candles = [];
  };

  const hooks: CailleachGauntletSchedulerHooks = {
    getTouchedThisRun: () => deps.getCairnScheduler().getTouchedThisRun(),
    getGameTimeMs: () => Math.floor(deps.getSpawnSystem().getGameTimeSec() * 1000),
    getPlayerPosition: () => {
      const p = deps.getPlayer();
      return { x: p?.x ?? 0, y: p?.y ?? 0 };
    },
    // Event-driven: GLOBAL_ENEMY_KILLED fires synchronously inside
    // Enemy.emitKillEvents() before any pool recycling can occur, so
    // this flag is reliable regardless of pool churn at 15+ minutes.
    isBossDead: () => cailleachBossKilled,
    isPlayerDead: () => (deps.getPlayer()?.getHp() ?? 1) <= 0,
    onArmed: () => {
      deps.getBanter()?.request('cailleach_gauntlet', { tag: 'armed' });
    },
    onCandlesLit: ({ candleRing }) => {
      spawnGauntletCandles(candleRing);
      deps.getBanter()?.request('cailleach_gauntlet', { tag: 'candles_lit' });
      deps.caption('cailleach_gauntlet_candles', 'Seven candles lit.', '#b9d6f0', 4000);
    },
    onCailleachSpawned: ({ centerX, centerY }) => {
      // SpawnSystem.spawnBossManually exists (V2 contract).
      (deps.getSpawnSystem() as unknown as { spawnBossManually: (k: string, x: number, y: number) => void })
        .spawnBossManually('cailleach_boss', centerX, centerY);
      deps.getBanter()?.request('cailleach_gauntlet', { tag: 'cailleach_spawned' });
    },
    onWin: ({ wreathedSavedAts }) => {
      deps.metaSaveManager.markCairnsWreathed(wreathedSavedAts);
      // Stormcrown drop is handled by the existing boss-kill path:
      // RelicSystem.rollDrop short-circuits to the restricted relic
      // when bossKey === 'cailleach_boss'. EnemyKillHandler fires
      // rollAndSpawn on the boss death event before the gauntlet's
      // bossDead flag flips, so the relic is already in flight.
      // Achievement unlock routes through AchievementManager via
      // GlobalEventBus listener.
      globalEventBus.emit('GLOBAL_CAILLEACH_GAUNTLET_WON', { wreathedSavedAts });
      snuffGauntletCandles('wreathed');
      deps.getBanter()?.request('cailleach_gauntlet', { tag: 'cailleach_down' });
      // First Cailleach Gauntlet win unlocks the Golden Eagle companion.
      const eagleUnlocked = unlockCompanion('eagle');
      if (eagleUnlocked) {
        deps.showToast(t('ui.cairn.eagle_unlock_toast'), '#e8c840');
        deps.caption(
          'eagle_companion_unlock',
          t('ui.cairn.eagle_unlock_caption'),
          '#e8c840',
          4000,
        );
      }
    },
    onLose: ({ extinguishedSavedAts }) => {
      deps.metaSaveManager.markCairnsExtinguished(extinguishedSavedAts);
      snuffGauntletCandles('extinguished');
      deps.getBanter()?.request('cailleach_gauntlet', { tag: 'cailleach_dominant' });
    },
  };

  const scheduler = new CailleachGauntletScheduler(hooks);
  scheduler.reset();

  return {
    scheduler,
    teardown: () => {
      destroyCandles();
      unsubEnemyKilled();
      cailleachBossKilled = false;
    },
  };
}
