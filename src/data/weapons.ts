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
  | 'bagpipes'
  | 'shinty_stick'
  | 'sgian_dubh'
  | 'stag_antler';

export interface WeaponDef {
  key: WeaponKey;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(descriptionKey)` at render time. */
  descriptionKey: string;
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

  // DESIGN_IDEAS §1 + §5 — Shinty Stick. Sister weapon to the
  // already-shipped Shinty Parry mechanic (camanachd fantasy: defensive
  // flick + offensive flick, one fantasy across two systems). Bouncing
  // behaviour for the small wood ball — snappier than Jobby Hurler and
  // a lighter hit, but zippier projectile + tighter range so it reads
  // as a quick wrist-snap rather than the haggis-lump heave.
  shinty_stick: {
    key: 'shinty_stick',
    nameKey: 'weapon.shinty_stick.name',
    descriptionKey: 'weapon.shinty_stick.description',
    behavior: 'bouncing',
    cooldownMs: 1700,
    damage: 8,
    projectileSpeed: 380,
    projectileCount: 1,
    pierce: 0,
    range: 1200,
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 30,
    levelScaling: {
      damage: 1.22,
      cooldown: 0.88,
      countAt: [3, 5],
      pierce: 0,
      radius: 1,
    },
  },

  // DESIGN_IDEAS §5 — Sgian Dubh ("black knife"). Traditional Highland
  // dress dagger, kept tucked in the stocking. Tightest, fastest,
  // narrowest arc-sweep weapon in the catalogue: a wrist-flick blade
  // that lives on volume + crit, not weight. Pairs with the Whetstone
  // passive (+10% crit) at lv5 to evolve into Sgian Geal — the white
  // knife, the ceremonial twin, every hit a guaranteed crit.
  sgian_dubh: {
    key: 'sgian_dubh',
    nameKey: 'weapon.sgian_dubh.name',
    descriptionKey: 'weapon.sgian_dubh.description',
    behavior: 'arc_sweep',
    cooldownMs: 700,
    damage: 4,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 70,
    arcDegrees: 60,
    knockback: 15,
    levelScaling: {
      damage: 1.20,
      cooldown: 0.88,
      countAt: [],
      pierce: 0,
      radius: 1.08,
    },
  },

  // DESIGN_IDEAS §5 — Stag Antler. The monarch-of-the-glen lowers
  // his head and gores. Auto-fires a frontal arc on cooldown like a
  // standard arc_sweep weapon (so it does steady work even when the
  // player isn't dashing), but the killer trick lives in the
  // dash-strike fork in `WeaponSystem.update`: every player dash
  // (gated by a 1.5 s per-weapon cooldown) fires a juicier bonus
  // arc in the dash direction at 2.5× damage. Sister-fantasy to the
  // Drift Mastery / Whisky Breath / Stance / Shinty Parry skill
  // expression layers — the dash IS the weapon's signature beat.
  // Pairs with Velvet Antler at lv5 for the legendary Monarch's
  // Charge: same baseline arc but the dash-strike becomes a 360°
  // antler-sweep at 3.5× damage that briefly stuns hits.
  stag_antler: {
    key: 'stag_antler',
    nameKey: 'weapon.stag_antler.name',
    descriptionKey: 'weapon.stag_antler.description',
    behavior: 'arc_sweep',
    cooldownMs: 1100,
    damage: 7,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 90,
    arcDegrees: 80,
    knockback: 35,
    levelScaling: {
      damage: 1.22,
      cooldown: 0.88,
      countAt: [],
      pierce: 0,
      radius: 1.10,
    },
  },
};

/**
 * DESIGN_IDEAS §5 — bonus dash-strike cooldown per stag-family weapon.
 * Stag Antler ships at 1500 ms; the evolved Monarch's Charge is
 * marginally snappier (1300 ms) to reward the king-stag fantasy.
 * Lives outside `WeaponDef` because no other weapon needs this knob;
 * adding a `dashStrikeCooldownMs` field to `WeaponDef` would force
 * every weapon entry to think about a mechanic only one weapon uses.
 */
export const STAG_ANTLER_DASH_STRIKE_COOLDOWN_MS = 1500;
export const MONARCH_CHARGE_DASH_STRIKE_COOLDOWN_MS = 1300;
/** Damage multiplier the dash-strike applies on top of the weapon's
 *  rolled effective-damage. Base form gores; the evolution charges. */
export const STAG_ANTLER_DASH_STRIKE_DAMAGE_MUL = 2.5;
export const MONARCH_CHARGE_DASH_STRIKE_DAMAGE_MUL = 3.5;
/** Monarch's Charge stuns the hits with a brief freeze — the king-
 *  stag's antler sweep is heavy enough to staggered the wounded. */
export const MONARCH_CHARGE_DASH_STRIKE_FREEZE_MS = 600;
export const MONARCH_CHARGE_DASH_STRIKE_FREEZE_FRACTION = 0.4;
