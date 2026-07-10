/**
 * Phase 5 Bucket 10 partial — runtime ambient + pickup install.
 *
 * Bundles four small inline ctor blocks that GameScene.create() used
 * to keep adjacent: AmbientWeatherSystem, HazardsSystem, GameTickers,
 * and PickupSpawner. Each is 4-19 LOC, individually trivial; collapsed
 * here so create() reads as a single `installRuntimeAmbient(...)` call
 * instead of four separate construction blocks.
 *
 * Shutdown: AmbientWeather + HazardsSystem each register a one-shot
 * `scene.events.once('shutdown', ...)` listener that stops the system
 * and clears the caller's ref. Behaviour preserved verbatim — the
 * helper only moves the wiring; the listeners themselves live on the
 * Phaser scene as before.
 *
 * Order is load-bearing: `relicOrchestrator.attachSpawner()` MUST run
 * before `new PickupSpawner` so the orchestrator's spawner ref is set
 * when the spawner's `onCollect` routing fires. Helper preserves that
 * order verbatim.
 */
import type Phaser from 'phaser';
import { AmbientWeatherSystem } from '../../systems/AmbientWeatherSystem';
import { HazardsSystem } from '../../systems/HazardsSystem';
import { GameTickers } from './GameTickers';
import { PickupSpawner } from './PickupSpawner';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { BiomeId } from '../../data/biomes';
import type { RNG } from '../../utils/rng';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { UpdateTickers, TickerHandle } from '../../utils/UpdateTickers';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { ChestSpriteRegistry } from './ChestSpriteRegistry';
import type { FloatTextPool } from './FloatTextPool';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import type { LevelUpFlow } from './LevelUpFlow';
import type { RuneSystemController } from './runeSystemController';
import type { RunScoreState } from './RunScoreState';
import { bumpFieldNotesLifetime } from '../../utils/save/bumpers';
import { pickFieldNoteCollectTag } from './fieldNoteCollectTag';

export interface InstallRuntimeAmbientOpts {
  scene: Phaser.Scene;
  // Shared accessors.
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getCurrentBiomeId(): BiomeId | null;
  getRunRng(): RNG;
  isIFramesActive(): boolean;
  // GameTickers-specific.
  getUiViewport(): { x: number; y: number; width: number; height: number };
  getBanter(): BanterSystem | null;
  getActiveVariantKey(): string;
  hasEnemyNearby(radiusPx: number): boolean;
  caption(id: string, msg: string, tint: string, dur: number): void;
  // PickupSpawner-specific.
  getXPSystem(): XPSystem;
  getUpdateTickers(): UpdateTickers;
  getSFXManager(): SFXManager;
  getChestDurationBonusMs(): number;
  getChestRegistry(): ChestSpriteRegistry;
  getFloatTextPool(): FloatTextPool;
  getRelicEffectDriver(): RelicEffectDriver;
  getLevelUpFlow(): LevelUpFlow;
  getRuneSystemController(): RuneSystemController;
  getRunScore(): RunScoreState;
  pushPickupDespawnHandle(h: TickerHandle): void;
  attachRelicSpawner(): void;
  /** Called from the shutdown listener so `this.weather` is null-clear
   *  after teardown (matches pre-extraction behaviour). The scene's
   *  per-frame `update` reads `this.weather?.update(delta)`; a stale
   *  ref into a stopped system would tick a destroyed object. */
  onWeatherShutdown(): void;
  /** Same contract as `onWeatherShutdown`, for the hazards system. */
  onHazardsShutdown(): void;
}

export interface InstallRuntimeAmbientResult {
  weather: AmbientWeatherSystem;
  hazards: HazardsSystem;
  gameTickers: GameTickers;
  pickupSpawner: PickupSpawner;
}

export function installRuntimeAmbient(
  opts: InstallRuntimeAmbientOpts,
): InstallRuntimeAmbientResult {
  const { scene } = opts;

  // Ambient weather — purely cosmetic seasonal overlay. Idle when no
  // event is active or `disableSeasonalEvents` / `reduceParticles` is on.
  const weather = new AmbientWeatherSystem(scene);
  weather.start();
  scene.events.once('shutdown', () => { weather.stop(); opts.onWeatherShutdown(); });

  // Environmental hazards — biome-conditioned, damages player on overlap.
  // Honours `disableHazards` setting (defaults enabled when absent).
  const hazards = new HazardsSystem(
    scene,
    () => opts.getPlayer() ?? null,
    () => opts.getCurrentBiomeId(),
    () => opts.getRunRng(),
    () => opts.isIFramesActive(),
  );
  hazards.start();
  scene.events.once('shutdown', () => { hazards.stop(); opts.onHazardsShutdown(); });

  const gameTickers = new GameTickers({
    getPlayer: opts.getPlayer,
    getScene: () => scene,
    getUiViewport: opts.getUiViewport,
    getBanter: opts.getBanter,
    getCurrentBiomeId: opts.getCurrentBiomeId,
    getActiveVariantKey: opts.getActiveVariantKey,
    hasEnemyNearby: opts.hasEnemyNearby,
    caption: opts.caption,
  });

  // R1 — Phaser-bound Relic pickup spawner. Constructed fresh each
  // run because the spawner holds a live reference set that must not
  // survive a scene restart (stale sprites would leak). Order matters:
  // `attachSpawner()` MUST run BEFORE `new PickupSpawner` so the
  // orchestrator's spawner ref is set when onCollect routing fires.
  opts.attachRelicSpawner();
  const pickupSpawner = new PickupSpawner(scene, {
    getPlayer: opts.getPlayer,
    getJuice: opts.getJuice,
    getXPSystem: opts.getXPSystem,
    getUpdateTickers: opts.getUpdateTickers,
    getSFXManager: opts.getSFXManager,
    getRunRng: opts.getRunRng,
    getChestDurationBonusMs: opts.getChestDurationBonusMs,
    onCoinCollected: (amount) => {
      // R1 M3 T20b — sporran_of_holding grants +2 per gold pickup.
      opts.getRunScore().addCoinGold(opts.getRelicEffectDriver().modifyGoldPickup(amount));
    },
    trackChest: (s, g) => opts.getChestRegistry().track(s, g),
    untrackChest: (s) => opts.getChestRegistry().untrack(s),
    pushDespawnHandle: (h) => opts.pushPickupDespawnHandle(h),
    offerTreasureEvolutionIfEligible: () => opts.getLevelUpFlow().offerChestEvolution(),
    acquireFloatText: (x, y, str, color, fs, d) =>
      opts.getFloatTextPool().acquire(x, y, str, color, fs, d),
    modifyHealOrbAmount: (a) => opts.getRelicEffectDriver().modifyHealOnOrb(a),
    onBurnsPlatterCollect: () => opts.getRuneSystemController().onBurnsPlatterCollect(),
    onFieldNoteCollect: () => {
      // Pre-bump count routes the banter: 0 → `first` (the Foundation
      // keeps a book on me?), threshold-cross → `page` (a fresh field-
      // guide page just unlocked on Gran's shelf), else flat pool.
      const tag = pickFieldNoteCollectTag(bumpFieldNotesLifetime());
      opts.getBanter()?.request('field_note_pickup', tag ? { tag } : undefined);
    },
  });

  return { weather, hazards, gameTickers, pickupSpawner };
}
