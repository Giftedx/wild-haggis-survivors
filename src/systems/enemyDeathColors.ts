import { COLORS } from '../config';

const ENEMY_DEATH_COLORS: Record<string, number> = {
  // Core wave enemies
  tourist:              0xcc2020,
  chef:                 0xffffff,
  midge:                0x555555,
  highland_cow:         0x8b6b3a,
  eagle:                0x886633,
  haggis_hunter:        0x556633,
  angry_scotsman:       0xcc4444,
  deep_fryer:           0xcc6622,
  piper:                0x44aa44,
  berserker:            0xdd3333,
  ghost:                0xaabbcc,
  nest:                 0x776655,
  sheep:                0xdddddd,
  kelpie:               0x3388cc,
  midgie_swarm:         0x444444,

  // Urban Ghaists
  buckfast_ned:         0x886622,
  traffic_cone_totem:   0xff6600,
  edinburgh_ghost_guide:0x8899aa,

  // Cryptids
  barghest:             0x442233,
  kelpie_foal:          0x55aadd,
  blue_man_of_minch:    0x3355bb,

  // Weather
  haar_wraith:          0x99aabb,
  gale_wraith:          0x99aacc,

  // Faerie courts
  seelie_piper:         0xffdd88,
  unseelie_fiddler:     0x553377,
  redcap:               0xbb2222,

  // Academic Apparitions
  ceilidh_caller:       0xbb5555,
  tome_wraith:          0x8877aa,
  dean_apparition:      0x334455,

  // Taxman's Retinue
  ledger_wraith:        0x888877,
  auditor_priest:       0x333355,

  // Bosses (showKillBurst is called for bosses too via wasBoss path)
  gordon:               0xff8800,
  tour_bus:             0xeecc44,
  the_laird:            0x556688,
  hunter_general:       0x775533,
  taxman:               0x222244,
};

export function resolveEnemyDeathColor(enemyKey: string): number {
  return ENEMY_DEATH_COLORS[enemyKey] ?? COLORS.WHISKY_GOLD;
}
