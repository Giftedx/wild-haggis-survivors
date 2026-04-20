/**
 * updateMusicStateScratch — mutate the reusable GameMusicState object
 * with the current frame's values. Extracted from GameScene.update()
 * as a pure function; the scratch is mutated in place so no allocation
 * happens per frame.
 */
import type { Player } from '../../entities/Player';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { GameMusicState } from '../../systems/music/ProceduralMusicEngine';

export function updateMusicStateScratch(
  scratch: GameMusicState,
  player: Player,
  spawnSystem: SpawnSystem,
  juice: JuiceSystem,
  killCount: number,
  biomeTimbre: number,
  buildDensity: number,
): void {
  scratch.hp = player.getHp();
  scratch.maxHp = player.getMaxHp();
  scratch.gameTimeSec = spawnSystem.getGameTimeSec();
  scratch.enemyCount = spawnSystem.getActiveCount();
  scratch.comboCount = juice.getComboCount();
  scratch.killCount = killCount;
  scratch.bossActive = spawnSystem.isBossActive();
  scratch.biomeTimbre = biomeTimbre;
  scratch.buildDensity = buildDensity;
}
