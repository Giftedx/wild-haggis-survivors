/**
 * applyPassiveEffect — pure mapping from a passive item key to player-stat
 * mutations. Lives outside LevelUpFlow so runStartModifiers (which fires
 * during GameScene construction, before LevelUpFlow exists) can also reach
 * for it without an init-order dependency.
 */
import type { Player } from '../../entities/Player';
import { PLAYER } from '../../config';

export function applyPassiveEffect(player: Player, key: string): void {
  switch (key) {
    case 'tam_o_shanter':
      player.addSpeed(PLAYER.SPEED * 0.10);
      // Visible wear-build: tam appears on the haggis's head for the rest
      // of the run. Binding-of-Isaac-style — every picked item shows up.
      player.equipAccessory('tam_o_shanter');
      break;
    case 'kilt':
      player.addMaxHp(Math.ceil(PLAYER.MAX_HP * 0.15));
      break;
    case 'loch_water':
      player.addPickupRadius(PLAYER.PICKUP_RADIUS * 0.40);
      player.addSpeed(PLAYER.SPEED * 0.05);
      break;
    case 'sporran':
      player.addXpMultiplier(0.10);
      break;
    case 'whisky_flask':
      player.addAoeMultiplier(0.20);
      break;
    case 'irn_bru':
      player.addAttackSpeedMultiplier(0.15);
      break;
    case 'thistle_crown':
      player.addCritChance(0.05);
      player.setThorns(3);
      break;
    case 'highland_shield':
      player.enableShield();
      break;
    case 'tartan_sash':
      player.addDamageMultiplier(0.08);
      break;
  }
}
