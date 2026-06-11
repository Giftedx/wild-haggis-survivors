/**
 * tickAutoBattleSteering — dev auto-battler steering update. When the
 * auto-battler is enabled, compute a steering vector from the player's
 * position, gem positions, world bounds, and game time; when disabled,
 * clear the steering (so the player returns to manual control on the
 * same frame).
 *
 * Extracted from GameScene.update() as a pure, leaf function.
 */
import type { Player } from '../../entities/Player';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { XPSystem } from '../../systems/XPSystem';
import { GAME } from '../../config';
import { computeAutoBattleSteering, isAutoBattleEnabled } from '../../dev/AutoBattler';

export function tickAutoBattleSteering(
  player: Player,
  xpSystem: XPSystem,
  spawnSystem: SpawnSystem,
): void {
  if (isAutoBattleEnabled()) {
    player.setAutoBattleSteering(
      computeAutoBattleSteering({
        playerX: player.x,
        playerY: player.y,
        gems: xpSystem.getGemPositionsForAutoBattle(),
        worldWidth: GAME.WORLD_WIDTH,
        worldHeight: GAME.WORLD_HEIGHT,
        timeSec: spawnSystem.getGameTimeSec(),
      }),
    );
  } else {
    player.setAutoBattleSteering(null);
  }
}
