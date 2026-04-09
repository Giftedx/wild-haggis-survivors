/**
 * All weapon definitions for Wild Haggis Survivors.
 *
 * Behavior types:
 *  - 'projectile': Fires at nearest enemy (Thistle Shot)
 *  - 'piercing':   Fires through multiple enemies (Caber Toss)
 *  - 'bouncing':   Bounces off world edges (Haggis Hurler)
 *  - 'aoe_pulse':  Damages all enemies in radius around player (Bagpipe Blast)
 *  - 'trail':      Drops damage zones behind the player (Scotch Mist)
 *  - 'arc_sweep':  Damages enemies in a frontal arc (Nessie's Tentacle)
 */

export type WeaponBehavior =
  | 'projectile'
  | 'piercing'
  | 'bouncing'
  | 'aoe_pulse'
  | 'trail'
  | 'arc_sweep';

export interface WeaponDef {
  key: string;
  name: string;
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

export const WEAPON_DEFS: Record<string, WeaponDef> = {
  thistle_shot: {
    key: 'thistle_shot',
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
    name: 'Bagpipe Blast',
    description: 'Periodic shockwave pushes enemies back.',
    behavior: 'aoe_pulse',
    cooldownMs: 3000,
    damage: 8,
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
    name: 'Scotch Mist',
    description: 'Leave a damaging fog trail behind you.',
    behavior: 'trail',
    cooldownMs: 800,
    damage: 3,
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
      radius: 1.2,
    },
  },

  haggis_hurler: {
    key: 'haggis_hurler',
    name: 'Haggis Hurler',
    description: 'Bouncing haggis balls ricochet off edges.',
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
};
