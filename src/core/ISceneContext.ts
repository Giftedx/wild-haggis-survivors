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
}

