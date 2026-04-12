/**
 * All weapon definitions for Wild Haggis Survivors.
 *
 * Behavior types:
 *  - 'projectile': Fires at nearest enemy (Thistle Shot)
 *  - 'piercing':   Fires through multiple enemies (Caber Toss)
 *  - 'bouncing':   Bounces off world edges (Jobby Hurler)
 *  - 'aoe_pulse':  Damages all enemies in radius around player (Bagpipe Blast)
 *  - 'trail':      Drops damage zones behind the player (Scotch Mist)
 *  - 'arc_sweep':  Damages enemies in a frontal arc (Nessie's Tentacle)
 *  - 'aura_pulse': Persistent radial pulses (damage + slow) around the player
 */

export type WeaponBehavior =
  | 'projectile'
  | 'piercing'
  | 'bouncing'
  | 'aoe_pulse'
  | 'trail'
  | 'arc_sweep'
  | 'aura_pulse';

/** All valid weapon keys — single source of truth. */
export type WeaponKey =
  | 'thistle_shot'
  | 'bagpipe_blast'
  | 'caber_toss'
  | 'scotch_mist'
  | 'haggis_hurler'
  | 'nessie_tentacle'
  | 'claymore'
  | 'bagpipes';

export interface WeaponDef {
  key: WeaponKey;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(descriptionKey)` at render time. */
  descriptionKey: string;
  /**
   * @deprecated Use t(nameKey) for player-facing text. Kept during the
   * migration window so auto-battler debug logs still work.
   */
  name: string;
  /**
   * @deprecated Use t(descriptionKey) for player-facing text.
   */
  description: string;
  behavior: WeaponBehavior;
  cooldownMs: number;
  damage: number;
  /** Projectile-based weapons only */
  projectileSpeed: number;
  projectileCount: number;
  pierce: number;
  range: number;
  /** AoE weapons: radius of effect */
  aoeRadius: number;
  /** Arc sweep: degrees of arc (centered on facing direction) */
  arcDegrees: number;
  /** Knockback force (pixels) applied to hit enemies */
  knockback: number;
  /** Scaling per level (applied multiplicatively) */
  levelScaling: {
    damage: number;       // multiplier per level
    cooldown: number;     // multiplier per level (< 1 = faster)
    countAt: number[];    // levels at which projectileCount increases
    pierce: number;       // added per level (piercing only)
    radius: number;       // multiplier per level (AoE only)
  };
}

export const WEAPON_DEFS: Record<WeaponKey, WeaponDef> = {
  thistle_shot: {
    key: 'thistle_shot',
    nameKey: 'weapon.thistle_shot.name',
    descriptionKey: 'weapon.thistle_shot.description',
    name: 'Thistle Shot',
    description: 'Fires sharp thistles at the nearest enemy.',
    behavior: 'projectile',
    cooldownMs: 1200,
    damage: 5,
    projectileSpeed: 350,
    projectileCount: 1,
    pierce: 0,
    range: 500,
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.25,
      cooldown: 0.88,
      countAt: [3, 5],
      pierce: 0,
      radius: 1,
    },
  },

  bagpipe_blast: {
    key: 'bagpipe_blast',
    nameKey: 'weapon.bagpipe_blast.name',
    descriptionKey: 'weapon.bagpipe_blast.description',
    name: 'Bagpipe Blast',
    description: 'Periodic shockwave pushes enemies back.',
    behavior: 'aoe_pulse',
    // Rebalanced: was cooldown 3000 / damage 8 — too weak early because the
    // 3s gap left gaps in dense swarms. Now fires 20% faster with +25% base damage.
    cooldownMs: 2400,
    damage: 10,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 120,
    arcDegrees: 360,
    knockback: 150,
    levelScaling: {
      damage: 1.3,
      cooldown: 0.85,
      countAt: [],
      pierce: 0,
      radius: 1.15,
    },
  },

  caber_toss: {
    key: 'caber_toss',
    nameKey: 'weapon.caber_toss.name',
    descriptionKey: 'weapon.caber_toss.description',
    name: 'Caber Toss',
    description: 'Heavy caber pierces through enemies.',
    behavior: 'piercing',
    cooldownMs: 2500,
    damage: 15,
    projectileSpeed: 250,
    projectileCount: 1,
    pierce: 2,
    range: 600,
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.3,
      cooldown: 0.9,
      countAt: [4],
      pierce: 1,
      radius: 1,
    },
  },

  scotch_mist: {
    key: 'scotch_mist',
    nameKey: 'weapon.scotch_mist.name',
    descriptionKey: 'weapon.scotch_mist.description',
    name: 'Scotch Mist',
    description: 'Leave a damaging fog trail behind you.',
    behavior: 'trail',
    // Rebalanced: was damage 3 / cooldown 800 / radius scaling 1.2. Trail DPS
    // was ~2.5× peer weapons at L5 because zones overlap at high fire rates.
    // Damage + cooldown + radius scaling all dialed back.
    cooldownMs: 1000,
    damage: 2,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 40,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.2,
      cooldown: 0.9,
      countAt: [],
      pierce: 0,
      radius: 1.12,
    },
  },

  haggis_hurler: {
    key: 'haggis_hurler',
    nameKey: 'weapon.haggis_hurler.name',
    descriptionKey: 'weapon.haggis_hurler.description',
    name: 'Jobby Hurler',
    description: 'Wee jobby balls ricochet off the edges.',
    behavior: 'bouncing',
    cooldownMs: 2000,
    damage: 10,
    projectileSpeed: 300,
    projectileCount: 1,
    pierce: 0,
    range: 1500,   // Long range — bounces keep it alive
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.2,
      cooldown: 0.88,
      countAt: [3, 5],
      pierce: 0,
      radius: 1,
    },
  },

  nessie_tentacle: {
    key: 'nessie_tentacle',
    nameKey: 'weapon.nessie_tentacle.name',
    descriptionKey: 'weapon.nessie_tentacle.description',
    name: "Nessie's Tentacle",
    description: 'Sweeping tentacle in a frontal arc.',
    behavior: 'arc_sweep',
    cooldownMs: 2200,
    damage: 12,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 100,
    arcDegrees: 90,
    knockback: 50,
    levelScaling: {
      damage: 1.25,
      cooldown: 0.85,
      countAt: [],
      pierce: 0,
      radius: 1.15,
    },
  },

  claymore: {
    key: 'claymore',
    nameKey: 'weapon.claymore.name',
    descriptionKey: 'weapon.claymore.description',
    name: 'Highland Claymore',
    description: 'Brutal wide melee cleave — slow, heavy hits.',
    behavior: 'arc_sweep',
    // Rebalanced: was cooldown 3400 / damage 28 — effective DPS ~8.2 made it
    // uncompetitive vs bagpipe blast (~50 eDPS). Now fires 24% faster with
    // +21% base damage, bringing eDPS to ~13.1 baseline. Still the slowest
    // weapon, but the hits justify the wait.
    cooldownMs: 2600,
    damage: 34,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 145,
    arcDegrees: 168,
    knockback: 95,
    levelScaling: {
      damage: 1.32,
      cooldown: 0.86,
      countAt: [],
      pierce: 0,
      radius: 1.15,
    },
  },

  bagpipes: {
    key: 'bagpipes',
    nameKey: 'weapon.bagpipes.name',
    descriptionKey: 'weapon.bagpipes.description',
    name: 'Ceòl Mòr Bagpipes',
    description: 'Standing drone — pulsing ring harms and slows nearby foes.',
    behavior: 'aura_pulse',
    cooldownMs: 1900,
    damage: 7,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 108,
    arcDegrees: 360,
    knockback: 0,
    levelScaling: {
      damage: 1.22,
      cooldown: 0.86,
      countAt: [],
      pierce: 0,
      radius: 1.14,
    },
  },
};
