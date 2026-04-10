import { Player } from '../entities/Player';
import { SpawnSystem } from '../systems/SpawnSystem';
import { TimeManager } from '../systems/TimeManager';
import { WeaponSystem } from '../systems/WeaponSystem';

/**
 * ISceneContext — typed service locator owned by the composing Scene.
 * Entities/systems may depend on this interface (not on `any` scene reach-through).
 */
export interface ISceneContext {
  getPlayer(): Player;
  getTimeManager(): TimeManager;
  getSpawnSystem(): SpawnSystem;
  getWeaponSystem(): WeaponSystem;
}

