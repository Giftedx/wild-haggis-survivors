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
    case 'peated_oak':
      // +10% global damage — the smoke and barrel tannins sharpen every
      // edge. Pairs with Whisky Lob at lv5 for the future evolution.
      // No accessory equip — the oak cask is conceptual, not worn.
      player.addDamageMultiplier(0.10);
      break;
    case 'reeds':
      // +10% cooldown reduction — the reed settles faster, the drone
      // cycle tightens. Pairs with Bagpipe Drone at lv5 for the future
      // evolution. No accessory equip — the reed is inside the pipe.
      player.addCooldownReduction(0.10);
      break;
    case 'rowan_thread':
      // +1.5 HP regen per second — the rowan's protection heals you back
      // while the rag wounds them. Pairs with Clootie Rag at lv5 for the
      // future evolution.
      player.addHpRegen(1.5);
      break;
    case 'smoked_haddock':
      // +12 max HP — the Finnan haddie broth that keeps you alive.
      // Pairs with Cullen Skink Ladle at lv5 for the future evolution.
      player.addMaxHp(12);
      break;
    case 'copper_rivet':
      // +10% attack speed — a hand-riveted Clyde fitting; every rivet
      // tightened, every cycle runs faster. Pairs with Steam Engine at
      // lv5 for the future evolution.
      player.addAttackSpeedMultiplier(0.10);
      break;
    case 'drum_hoop':
      // +10% AoE radius — the willow hoop deepens the drum's resonance
      // and spreads the shockwave further. Pairs with Bodhrán at lv5
      // to unlock the Beltane Drum evolution (midsummer fire-drum).
      player.addAoeMultiplier(0.10);
      break;
    case 'seal_pelt':
      // +2 HP regen per second — the selkie's salt-smooth pelt wraps
      // warmth around the haggis while the song holds enemies at bay.
      // Pairs with Selkie Song at lv5 for the Selkie Chorus evolution.
      player.addHpRegen(2.0);
      break;
    case 'wire_strings':
      // +12% cooldown reduction — taut bronze wire strings tuned to
      // the open moor; tighter string = faster strum cadence. Pairs
      // with Clàrsach at lv5 for the Clàrsach Eternal evolution.
      player.addCooldownReduction(0.12);
      break;
    case 'rowan_amulet':
      // +15% projectile speed — the protective charm guides the stone
      // truer; speed reads as precision, not brute force. Pairs with
      // Hagstone Sling at lv5 for the Rowan Hail evolution.
      player.addProjectileSpeedMul(0.15);
      break;
  }
}
