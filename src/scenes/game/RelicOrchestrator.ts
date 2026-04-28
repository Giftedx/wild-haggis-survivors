/**
 * RelicOrchestrator — owns the Relic pickup flow, discard modal,
 * telemetry, active-relic activations, and Fianna spirit lifecycle that
 * used to live across ~250 lines of GameScene (R1 M2/M3/M4/M4.5).
 *
 * Composition (no behaviour change vs. inlined methods):
 * - `RelicSystem` (slots/state) is constructed inside this orchestrator
 *   per-run and exposed via `getSystem()` so existing call sites that
 *   read slot state (HUD widget, persistence bridge, debug API) keep
 *   their reach unchanged.
 * - `RelicEffectDriver` (effect math) is also constructed here so the
 *   slot ↔ driver pair always stays in sync. Reads via `getDriver()`.
 * - `RelicPickupSpawner` (Phaser-bound dropped pickups) is owned here
 *   and rebuilt on each `resetForNewRun()`. The orchestrator wires the
 *   `onCollect` callback so the discard-modal routing stays internal.
 *
 * Why orchestrator (not folded into RelicSystem): the existing
 * `src/systems/RelicSystem.ts` is a pure data-state class with a wide
 * unit-test surface (RelicSystem.test.ts). Folding modal/Phaser/audio
 * into it would (a) break those unit tests' "no Phaser imports" axiom,
 * (b) couple the slot model to the pickup-flow, and (c) duplicate the
 * orchestration shape that LevelUpFlow / RunLifecycle / EnemyKillHandler
 * already follow in `src/scenes/game/`.
 *
 * Hooks-pattern follows LevelUpFlow precedent: GameScene injects lazy
 * getters for `player`, `juice`, etc. Behaviour preserved verbatim from
 * the prior inlined methods.
 *
 * Determinism: rolls go through `runRng.branch` ownership inside
 * `RelicSystem.rollDrop` (unchanged). Cosmetic angles in
 * `activateFingalsHorn` use deterministic step-based fan-out (no RNG).
 */
import * as Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import type { BanterContext } from '../../data/banter';
import type { RNG } from '../../utils/rng';
import { RelicSystem } from '../../systems/RelicSystem';
import { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import {
  RelicPickupSpawner,
  type RelicPickupSource,
} from '../../entities/RelicPickup';
import { FiannaSpirit } from '../../entities/FiannaSpirit';
import { openRelicPickupPrompt } from '../../ui/RelicPickupPrompt';
import { RELICS, type RelicDef, type RelicKey } from '../../data/relics';
import { decideRelicCollect } from '../../ui/relicCollect';
import { restoreHeldRelics as restoreHeldRelicsHelper } from './SavedStateHydrator';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { audio } from '../../systems/AudioSystem';
import { globalEventBus } from '../../core/GlobalEventBus';
import { bumpFirstTimeEvent } from '../../utils/save';
import { t } from '../../core/i18n';

export interface RelicOrchestratorHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getSpawnSystem(): SpawnSystem;
  getTimeManager(): TimeManager;
  getUpdateTickers(): UpdateTickers;
  getRunRng(): RNG;
  /** Wall-clock-ish ms used for telemetry's `atGameTimeSec`. */
  getGameTimeSec(): number;
  /**
   * Mirrors `GameScene.requestBanter` — collapses the call so the first-
   * relic reserved line lands without the orchestrator importing the
   * banter system directly.
   */
  requestBanter(context: BanterContext, tag?: string): void;
}

export class RelicOrchestrator {
  private readonly scene: Phaser.Scene;
  private readonly hooks: RelicOrchestratorHooks;

  /** R1 — Relic slots + drop-roll orchestration. Fresh instance per run. */
  private system: RelicSystem;
  /** R1 — stateful effect dispatcher. Fresh instance per run. */
  private driver: RelicEffectDriver;
  /** R1 — Phaser-bound spawner for dropped Relic pickups. Null until a run starts. */
  private spawner: RelicPickupSpawner | null = null;

  /**
   * R1 M4.5 P5 — live Fianna summon entities (fingals_horn). Empty
   * until the horn is sounded; cleared on scene restart.
   */
  private activeFiannaSpirits: FiannaSpirit[] = [];

  /** Modal-open guard (R1 M2 T16 4th-relic discard flow). */
  private discardModalOpen = false;

  constructor(scene: Phaser.Scene, hooks: RelicOrchestratorHooks) {
    this.scene = scene;
    this.hooks = hooks;
    // Construct fresh state on instantiate; resetForNewRun() rebuilds.
    this.system = new RelicSystem();
    this.driver = new RelicEffectDriver(this.system);
  }

  /** Held-slot data system. Used by HUD widget + persistence bridge. */
  getSystem(): RelicSystem {
    return this.system;
  }

  /** Effect dispatcher. Used by stat composers + per-frame ticks. */
  getDriver(): RelicEffectDriver {
    return this.driver;
  }

  /** Live pickup spawner (null before first run). */
  getSpawner(): RelicPickupSpawner | null {
    return this.spawner;
  }

  /**
   * Resets all Relic-owned state for a fresh run. Mirrors the prior
   * `GameScene.resetTransientRunState` block: destroys lingering pickups
   * + spirits, then rebuilds `system` + `driver`. Spawner is left null;
   * `attachSpawner` lands the new instance once the player exists.
   */
  resetForNewRun(): void {
    this.spawner?.destroyAll();
    this.spawner = null;
    for (const spirit of this.activeFiannaSpirits) {
      try { spirit.destroy(); } catch { /* ignore */ }
    }
    this.activeFiannaSpirits = [];
    this.system = new RelicSystem();
    this.driver = new RelicEffectDriver(this.system);
    this.discardModalOpen = false;
  }

  /**
   * Construct the run's `RelicPickupSpawner`. Must be called after
   * `resetForNewRun()` and after the player exists. Wires `onCollect`
   * to the orchestrator's slot-routing flow.
   */
  attachSpawner(): void {
    this.spawner = new RelicPickupSpawner({
      scene: this.scene,
      player: this.hooks.getPlayer(),
      tickers: this.hooks.getUpdateTickers(),
      onCollect: (relic, x, y, source) => this.handleRelicCollect(relic, x, y, source),
    });
  }

  /**
   * R1 — roll a Relic drop for the given source and spawn the pickup
   * at (x, y) if the roll fires. Wired from EnemyKillHandler's
   * onEliteKilled / onBossKilled hooks. Routes through RelicSystem so
   * held-key exclusion + rarity weighting share one pure path.
   */
  rollAndSpawn(
    source: 'elite' | 'boss',
    x: number,
    y: number,
    bossKey?: string,
  ): void {
    if (!this.spawner) return;
    const relic = this.system.rollDrop(source, this.hooks.getRunRng(), {
      bossKey,
      // Luck hookup lands with the lucky_heather_sprig effect wiring
      // in M3. For M2 the base 15% elite rate + guaranteed boss drop
      // is the shippable behaviour.
      luckMultiplier: 1,
    });
    if (!relic) return;
    this.spawner.spawn(relic, x, y, source);
  }

  /**
   * R1 — 25% chance the legendary chest evolution roll overrides to a
   * Relic drop. Called by LevelUpFlow.offerChestEvolution before the
   * evolution card UI is shown. Returning true suppresses the card.
   */
  tryChestOverride(): boolean {
    if (!this.spawner) return false;
    const relic = this.system.rollDrop('chest', this.hooks.getRunRng(), {});
    if (!relic) return false;
    const player = this.hooks.getPlayer();
    this.spawner.spawn(relic, player.x, player.y, 'chest');
    this.hooks.getJuice().showToast(t('ui.game.relic_drop_near'), TOAST_COLORS.reward);
    return true;
  }

  /**
   * R1 — route a walked-over Relic pickup: add to an empty slot, open
   * the 4th-relic discard modal, or silently skip a duplicate. Called
   * by the `RelicPickupSpawner.onCollect` callback.
   */
  private handleRelicCollect(
    relic: RelicDef,
    _x: number,
    _y: number,
    source: RelicPickupSource,
  ): void {
    const isDuplicate = this.system.isHolding(relic.key);
    const action = decideRelicCollect({
      heldCount: this.system.heldCount(),
      isDuplicate,
      slotCap: 3,
    });
    switch (action) {
      case 'skip_duplicate':
        return;
      case 'add':
        this.system.add(relic);
        this.onRelicAdded();
        this.emitRelicPickedTelemetry(relic, source, null);
        this.hooks.getJuice().showToast(t('ui.game.relic_collected'), TOAST_COLORS.reward);
        this.hooks.getJuice().flashWhite(80);
        audio.playLevelUp();
        return;
      case 'discard_ui':
        this.openDiscardModal(relic, source);
        return;
    }
  }

  /**
   * R1 M4 T28 — fire-and-forget Relic-pickup telemetry. Global event
   * bus bridge; AnalyticsManager gates on the `telemetryOptIn` user
   * setting (matches the route_picked / weapon_evolved precedent).
   */
  private emitRelicPickedTelemetry(
    relic: RelicDef,
    source: RelicPickupSource,
    replacedKey: RelicKey | null,
  ): void {
    globalEventBus.emit('GLOBAL_RELIC_PICKED', {
      relicKey: relic.key,
      rarity: relic.rarity,
      source,
      replacedKey: replacedKey ?? null,
      atGameTimeSec: this.hooks.getGameTimeSec(),
    });
  }

  /**
   * R1 M4 T26 — first-Relic reserved banter. Priority 110 (first_time
   * pool) beats the standard relic_pickup tier so Gran's reserved line
   * fires once per save regardless of which relic dropped first.
   */
  private onRelicAdded(): void {
    if (bumpFirstTimeEvent('relic_first_pickup')) {
      this.hooks.requestBanter('first_time', 'relic_first_pickup');
    }
  }

  /**
   * 4th-relic discard modal. Pauses physics + timeScale via TimeManager
   * (same TOKEN as the prior inlined version) so a second pickup mid-
   * modal can't double-fire. `openRelicPickupPrompt` returns once the
   * player picks/rejects; the close path releases the token.
   */
  openDiscardModal(incoming: RelicDef, source: RelicPickupSource): void {
    if (this.discardModalOpen) return;
    this.discardModalOpen = true;
    this.hooks.getTimeManager().request('RELIC_DISCARD', { pausePhysics: true, timeScale: 0 });
    const held = this.system.getSlots().map((s) => s.def);
    openRelicPickupPrompt({
      scene: this.scene,
      held,
      incoming,
      uiScale: 1,
      onReplaceHeld: (slotIndex) => {
        const replaced = this.system.getSlots()[slotIndex].def?.key ?? null;
        this.system.replaceAt(slotIndex, incoming);
        // Replacing at full sporran still counts as the first acquired
        // relic (if it is) — fire the reserved line.
        this.onRelicAdded();
        this.emitRelicPickedTelemetry(incoming, source, replaced);
        this.hooks.getJuice().showToast(t('ui.game.relic_collected'), TOAST_COLORS.reward);
        this.hooks.getJuice().flashWhite(80);
        audio.playLevelUp();
        this.closeDiscardModal();
      },
      onReject: () => {
        this.closeDiscardModal();
      },
    });
  }

  private closeDiscardModal(): void {
    if (!this.discardModalOpen) return;
    this.discardModalOpen = false;
    this.hooks.getTimeManager().release('RELIC_DISCARD');
  }

  isDiscardModalOpen(): boolean {
    return this.discardModalOpen;
  }

  /**
   * R1 e2e test seam — force a Relic pickup at a world position without
   * routing through the probabilistic drop roll. Used by
   * `e2e/relic-pickup.spec.ts`. Returns true on success, false if the
   * key doesn't exist or the spawner isn't ready.
   */
  debugSpawnAt(key: string, x: number, y: number): boolean {
    if (!this.spawner) return false;
    // Stale-callback guard — e2e tests can race scene shutdown; without
    // this the spawner's physics body construction throws on a torn-down
    // world. Ported from the pre-extraction GameScene.debugSpawnRelicAt.
    if (!this.scene.scene.isActive() || !this.scene.physics?.world) return false;
    const def = (RELICS as Record<string, RelicDef>)[key];
    if (!def) return false;
    this.spawner.spawn(def, x, y);
    return true;
  }

  /** R1 — e2e accessor; also used by the HUD slot widget in M3. */
  getHeldKeys(): readonly RelicKey[] {
    return this.system?.heldKeys() ?? [];
  }

  /**
   * Repopulate slot state from a saved-snapshot list. Delegates to the
   * pure helper in `SavedStateHydrator.ts`.
   */
  restoreHeld(keys: readonly string[]): void {
    restoreHeldRelicsHelper(this.system, this.driver, keys);
  }

  /**
   * R1 M3 T21 — trigger the Whisky Dram active relic. Routes the
   * pause-menu button through the driver's one-shot; toast + SFX fire
   * on the first successful activation only.
   */
  activateWhiskyDram(): void {
    if (!this.driver) return;
    const player = this.hooks.getPlayer();
    const currentHp = player.getHp();
    const maxHp = player.getMaxHp();
    const result = this.driver.activateWhiskyDram(currentHp, maxHp);
    if (!result.fired) return;
    const healed = Math.max(0, Math.ceil(result.hp - currentHp));
    if (healed > 0) player.heal(healed);
    this.hooks.getJuice().showToast(t('ui.pause.whisky_dram_drunk'), TOAST_COLORS.reward);
    this.hooks.getJuice().flashWhite(120);
    audio.playLevelUp();
  }

  /**
   * R1 M4.5 P5 — blow Fingal's Horn. One-shot active relic: summons
   * `result.summonCount` Fianna at the haggis's position; each lives
   * `result.durationMs` ms and hunts nearest non-boss enemies. Driver
   * gates re-use so the button disappears after firing.
   */
  activateFingalsHorn(): void {
    if (!this.driver) return;
    const result = this.driver.activateFingalsHorn();
    if (!result.fired) return;
    const player = this.hooks.getPlayer();
    const px = player.x;
    const py = player.y;
    // Fan out the spawn ring so the three spirits don't stack into
    // one visible glyph at t=0.
    for (let i = 0; i < result.summonCount; i++) {
      const angle = (i / result.summonCount) * Math.PI * 2;
      const sx = px + Math.cos(angle) * 18;
      const sy = py + Math.sin(angle) * 18;
      const spirit = new FiannaSpirit(this.scene, sx, sy, result.durationMs);
      this.activeFiannaSpirits.push(spirit);
    }
    this.hooks.getJuice().showToast(t('ui.pause.fingals_horn_sounded'), TOAST_COLORS.reward);
    this.hooks.getJuice().flashWhite(140);
    audio.playLevelUp();
  }

  /**
   * R1 M4.5 P5 — per-frame Fianna spirit tick. Ticks each live spirit,
   * drops expired ones. Caller (GameScene.update) is responsible for
   * pausing this — sits AFTER `isGameplayPaused()` in the gameplay path.
   * Uses scaledDelta so slow-mo shortens the spirits' effective lifetime
   * in lockstep with every other timed effect.
   */
  tickFiannaSpirits(scaledDelta: number): void {
    if (this.activeFiannaSpirits.length === 0) return;
    const enemies = this.hooks.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
    const kept: FiannaSpirit[] = [];
    for (const spirit of this.activeFiannaSpirits) {
      spirit.tick(scaledDelta, enemies);
      if (spirit.active && !spirit.isExpired()) kept.push(spirit);
    }
    this.activeFiannaSpirits = kept;
  }

  /** Test/diagnostic accessor. */
  getActiveFiannaSpiritCount(): number {
    return this.activeFiannaSpirits.length;
  }
}
