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
      player.equipAccessory('kilt');
      break;
    case 'loch_water':
      player.addPickupRadius(PLAYER.PICKUP_RADIUS * 0.40);
      player.addSpeed(PLAYER.SPEED * 0.05);
      player.equipAccessory('loch_water');
      break;
    case 'sporran':
      player.addXpMultiplier(0.10);
      player.equipAccessory('sporran');
      break;
    case 'whisky_flask':
      player.addAoeMultiplier(0.20);
      player.equipAccessory('whisky_flask');
      break;
    case 'irn_bru':
      player.addAttackSpeedMultiplier(0.15);
      player.equipAccessory('irn_bru');
      break;
    case 'thistle_crown':
      player.addCritChance(0.05);
      player.setThorns(3);
      player.equipAccessory('thistle_crown');
      break;
    case 'highland_shield':
      player.enableShield();
      player.equipAccessory('highland_shield');
      break;
    case 'tartan_sash':
      player.addDamageMultiplier(0.08);
      player.equipAccessory('tartan_sash');
      break;
    case 'shinty_ball':
      // +15% projectile speed — the cork-leather ball wants to fly
      // truer (matches the upgradeCard description for shinty_ball).
      // Pairs with the Shinty Stick weapon for the Caman Storm
      // legendary evolution. No accessory equip — the ball is
      // weapon-side, not on the haggis silhouette (the caman in the
      // weapon icon already carries the visible tell).
      player.addProjectileSpeedMul(0.15);
      break;
    case 'whetstone':
      // +10% crit chance — sharpens every blade the haggis carries,
      // not just the Sgian Dubh. Pairs with Sgian Dubh at lv5 to
      // unlock the Sgian Geal legendary evolution (every hit a crit).
      // No accessory equip — a whetstone lives in the pocket, not
      // on the silhouette; the sharper sgian-dubh blade already
      // carries the visible tell.
      player.addCritChance(0.10);
      break;
    case 'velvet_antler':
      // +1 max dash charge — stags grow their antlers IN VELVET
      // through summer (the soft skin sheaths storing the season's
      // energy); shedding the velvet for the autumn rut releases
      // that stored power. Mechanically: an extra dash banked. Pairs
      // with Stag Antler at lv5 to unlock Monarch's Charge — every
      // dash now opens a 360° antler-sweep beat. No accessory equip:
      // the antlers live on the weapon icon, not on the haggis
      // silhouette (the haggis isn't a stag — he carries one).
      player.addDashCharge();
      break;
    case 'gillies_edge':
      // +8% move speed — the gamekeeper's light foot. Pairs with
      // Dirk Dance at lv5 for the Dirk Flurry evolution (three
      // simultaneous arcs). No accessory equip — gillie's edge is
      // about footwork, not silhouette.
      player.addSpeed(PLAYER.SPEED * 0.08);
      break;
    case 'widows_shawl':
      // +12 max HP — warm wool against the Highland cold. The widow's
      // shawl is grief made wearable; the bulk that keeps you alive.
      // Pairs with Granny's Curse at lv5 for the Banshee Wail
      // evolution (five homing hex-screams).
      player.addMaxHp(12);
      break;
    case 'stirling_medal':
      // +10% crit chance — valour at Stirling Bridge, 1297. Pairs
      // with Wallace Sword at lv5 for the Freedom Blade evolution
      // (360° sweep + two shockwaves).
      player.addCritChance(0.10);
      break;
  }
}
