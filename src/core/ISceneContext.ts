import { Player } from '../entities/Player';
import { SpawnSystem } from '../systems/SpawnSystem';
import { TimeManager } from '../systems/TimeManager';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { XPSystem } from '../systems/XPSystem';
import type { TutorialSystem } from '../systems/TutorialSystem';
import type { SFXManager } from '../systems/audio/SFXManager';
import type { RunStatsTracker } from '../systems/RunStatsTracker';
import type { StatusFxPool } from '../systems/StatusFxPool';
import { UpdateTickers } from '../utils/UpdateTickers';
import type { RNG } from '../utils/rng';
import type { BanterContext } from '../data/banter';
import type { BiomeId } from '../data/biomes';
import type { GrudgeLedgerState } from '../entities/grudgeLedger';

/**
 * ISceneContext — typed service locator owned by the composing Scene.
 * Entities/systems may depend on this interface (not on `any` scene reach-through).
 */
export interface ISceneContext {
  getPlayer(): Player;
  getTimeManager(): TimeManager;
  getUpdateTickers(): UpdateTickers;
  getSpawnSystem(): SpawnSystem;
  getWeaponSystem(): WeaponSystem;
  getXPSystem(): XPSystem;
  getSFXManager(): SFXManager;
  getRunStatsTracker(): RunStatsTracker;
  getTutorialSystem(): TutorialSystem;
  getStatusFxPool(): StatusFxPool;
  /**
   * Deterministic run-scoped RNG. Use for gameplay decisions (card draws,
   * elite rolls, loot tables, crit, weighted spawns). Cosmetic RNG (particle
   * jitter, audio detune, ambient VFX) stays on `Math.random()` — seeding
   * visual nuance would bloat this API without gameplay benefit.
   */
  getRunRng(): RNG;
  /**
   * Narrative + biome surfaces. Required as of 2026-04-30 — every production
   * scene that hosts SpawnSystem / JuiceSystem implements all four, and a
   * codebase sweep showed zero test files construct a partial mock, so the
   * old `?.()` defensive coding was hiding rename / signature drift without
   * actually serving any caller. `getCurrentBiomeId` stays optional because
   * lightweight scenes (Croft, MetaShop) genuinely don't expose a biome.
   */
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
  requestBanter(context: BanterContext, tag?: string): void;
  getCurrentBiomeId?(): BiomeId | null;
  getSecondsPastBell(): number;
  /**
   * At max player level, XP that would otherwise be lost is converted to
   * run gold (coin pickup meta). Optional so lightweight test scenes omit it.
   */
  grantXpOverflowGold?(amount: number): void;
  /**
   * R1 M3 T20e — effective ceilidh-chain pulse period. Default 8; the
   * Ceilidh Dancer's Ribbon relic lowers it to 5. Kept as a scene-side
   * lookup so JuiceSystem doesn't import RelicSystem directly.
   */
  getCeilidhChainPeriod(): number;

  /**
   * Per-run Taxman Grudge Ledger — read by Enemy.behaviorTaxmanGrudge at
   * the 50% HP threshold to resolve the GrudgeVerdict for Phase 2.
   */
  getGrudgeLedger(): GrudgeLedgerState;

  /**
   * R1 M4 — boss HP multiplier. Default 1; stone_of_destiny_shard
   * relic raises it to 1.15. Applied on top of the existing time-
   * scale ramp in SpawnSystem.spawnBoss.
   */
  getBossHpMultiplier?(): number;

  /**
   * R1 M4 — elite spawn chance multiplier. Default 1; highland_torque
   * relic raises it to 1.2 (clamped to 1.0 after mult).
   */
  getEliteSpawnMultiplier?(): number;

  /**
   * Whisky Breath puddle drop hook (DESIGN_IDEAS §1, slice 2). Called
   * by Player on each successful breath burst with the burst origin
   * + a stack-scaled DoT-per-tick override. GameScene routes this to
   * `HazardZones.spawnWhiskyPuddle`. Optional so unit-test scenes
   * that don't wire HazardZones can skip the puddle effect — the
   * burst still applies its instant AOE damage either way.
   */
  spawnWhiskyPuddle?(x: number, y: number, dmgPerTick: number): void;
}

