import { Player } from '../entities/Player';
import { SpawnSystem } from '../systems/SpawnSystem';
import { TimeManager } from '../systems/TimeManager';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { XPSystem } from '../systems/XPSystem';
import type { TutorialSystem } from '../systems/TutorialSystem';
import type { SFXManager } from '../systems/audio/SFXManager';
import type { RunStatsTracker } from '../systems/RunStatsTracker';
import { UpdateTickers } from '../utils/UpdateTickers';

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
}

