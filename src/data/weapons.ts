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
  | 'aura_pulse'
  | 'lob_puddle';

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
  | 'stag_antler'
  | 'waulking_mallet'
  | 'pibroch_hammer'
  | 'dirk_dance'
  | 'grannies_curse'
  | 'wallace_sword'
  | 'practice_chanter'
  | 'whisky_lob'
  | 'bagpipe_drone'
  | 'coastal_storm';

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

  // DESIGN_IDEAS §5 — Bagpipe Drone. The low sustained drone pipes
  // (bass + baritone chanters) beneath the melody — not the piob mòr
  // but the constant harmonic foundation that slows the air around it.
  // Mechanically: a continuous slow-aura with a short tick cooldown
  // (500ms) and minimal damage. Enemies in range are always slightly
  // slowed (30%) as long as the haggis fires on schedule. A crowd-
  // control utility pick that pairs with Reeds for the evolution slot.
  // No evolution in v1 — the "tuned" form is reserved for later.
  bagpipe_drone: {
    key: 'bagpipe_drone',
    nameKey: 'weapon.bagpipe_drone.name',
    descriptionKey: 'weapon.bagpipe_drone.description',
    behavior: 'aura_pulse',
    cooldownMs: 500,
    damage: 2,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 80,
    arcDegrees: 360,
    knockback: 0,
    levelScaling: {
      damage: 1.18,
      cooldown: 0.92,
      countAt: [],
      pierce: 0,
      radius: 1.10,
    },
  },

  // DESIGN_IDEAS §5 — Coastal Storm. The west coast doesn't warn you —
  // the haar lifts, the sky turns pewter, and then the whole horizon
  // cracks. A screen-clearing AoE ult: long cooldown (22 s), very wide
  // radius (680 px ≈ full screen), punishing knockback. Pure force — no
  // freeze, no puddle, just the storm sweeping the moor clean.
  // Standalone weapon (no evolution, no paired passive) like bagpipes.
  coastal_storm: {
    key: 'coastal_storm',
    nameKey: 'weapon.coastal_storm.name',
    descriptionKey: 'weapon.coastal_storm.description',
    behavior: 'aoe_pulse',
    cooldownMs: 22000,
    damage: 42,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 680,
    arcDegrees: 360,
    knockback: 220,
    levelScaling: {
      damage: 1.30,
      cooldown: 0.90,
      countAt: [],
      pierce: 0,
      radius: 1.06,
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

  // Wild Living World Initiative — Waulking Mallet. Soft rhythm
  // weapon. Aura-pulse beat that matches the procedural music
  // engine's quarter-note clock: on-beat hits land at +30%; off-beat
  // hits still output baseline damage so muted/blocked audio never
  // creates zero DPS (see `waulkingRhythm.ts` for the math). The
  // weapon's identity is "the song hits with you"; ceiling stays
  // below "rhythm dominates the run" to keep it inclusive.
  waulking_mallet: {
    key: 'waulking_mallet',
    nameKey: 'weapon.waulking_mallet.name',
    descriptionKey: 'weapon.waulking_mallet.description',
    behavior: 'aura_pulse',
    cooldownMs: 2000,
    damage: 9,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 96,
    arcDegrees: 360,
    knockback: 30,
    levelScaling: {
      damage: 1.20,
      cooldown: 0.90,
      countAt: [],
      pierce: 0,
      radius: 1.10,
    },
  },
  // DESIGN_IDEAS §5 — Practice Chanter. The starter weapon for the
  // Pibroch Haggis variant. A chanter is the melody pipe of the
  // bagpipe — novices practice on it alone before the bag is added.
  // Mechanically: a fast, weak projectile weapon with short range
  // (the chanter's breath doesn't carry far), but its tight cooldown
  // fires reliably and it levels into a fuller tone at high level.
  // The fantasy is "learning the scale before the lament" — weaker
  // than Thistle Shot early but grows with the player, with count
  // scaling at lv3/5 (the three chanter holes opening up).
  // No evolution (the pibroch's upgrade path is the Waulking Mallet
  // line, not the chanter); it's a thematic starter, not a build axis.
  practice_chanter: {
    key: 'practice_chanter',
    nameKey: 'weapon.practice_chanter.name',
    descriptionKey: 'weapon.practice_chanter.description',
    behavior: 'projectile',
    cooldownMs: 900,
    damage: 4,
    projectileSpeed: 280,
    projectileCount: 1,
    pierce: 0,
    range: 320,
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.22,
      cooldown: 0.88,
      countAt: [3, 5],
      pierce: 0,
      radius: 1,
    },
  },

  // Whisky Lob — throw a hip flask that shatters on impact, leaving
  // a burning puddle of aged spirit on the ground. Slow cooldown but
  // the burn zone lingers, punishing enemies that clump or chase.
  // Zone-denial in the survivors style: plant a puddle, kite through
  // it. Peated Oak paired passive rounds the damage edges (+10% dmg);
  // the evolution line is reserved for a future "aged malt" form.
  whisky_lob: {
    key: 'whisky_lob',
    nameKey: 'weapon.whisky_lob.name',
    descriptionKey: 'weapon.whisky_lob.description',
    behavior: 'lob_puddle',
    cooldownMs: 4000,
    damage: 4,
    projectileSpeed: 220,
    projectileCount: 1,
    pierce: 0,
    range: 260,
    aoeRadius: 58,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.28,
      cooldown: 0.90,
      countAt: [5],
      pierce: 0,
      radius: 1.12,
    },
  },

  // Highland Horrors — Dirk Dance. The Highland dirk: longer than
  // a sgian dubh, shorter than a claymore. A rapid three-beat combo
  // of slashes — center, left, right — fired at 130ms intervals to
  // give a true parry-and-riposte feel. Arc is tight and fast, living
  // on volume rather than weight. Pairs with Gillie's Edge at lv5 →
  // Dirk Flurry: all three arcs fire simultaneously, rotating through
  // ±35°, becoming a spinning wall of blade.
  dirk_dance: {
    key: 'dirk_dance',
    nameKey: 'weapon.dirk_dance.name',
    descriptionKey: 'weapon.dirk_dance.description',
    behavior: 'arc_sweep',
    cooldownMs: 950,
    damage: 9,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 85,
    arcDegrees: 70,
    knockback: 28,
    levelScaling: {
      damage: 1.22,
      cooldown: 0.87,
      countAt: [],
      pierce: 0,
      radius: 1.10,
    },
  },

  // Highland Horrors — Granny's Curse. The formidable Highland
  // grandmother lobbing slow, wide-scattering hex bolts across the
  // moor in all directions. Low damage each, but each pierces and
  // the spread covers surprising ground. The Widow's Shawl at lv5
  // weaves the curse into the Banshee Wail: five homing hex-screams
  // that seek the furthest enemies on the field.
  grannies_curse: {
    key: 'grannies_curse',
    nameKey: 'weapon.grannies_curse.name',
    descriptionKey: 'weapon.grannies_curse.description',
    behavior: 'projectile',
    cooldownMs: 1600,
    damage: 7,
    projectileSpeed: 160,
    projectileCount: 3,
    pierce: 2,
    range: 380,
    aoeRadius: 0,
    arcDegrees: 0,
    knockback: 12,
    levelScaling: {
      damage: 1.20,
      cooldown: 0.88,
      countAt: [4],
      pierce: 1,
      radius: 1,
    },
  },

  // Highland Horrors — Wallace Sword. William Wallace's great sword
  // — wider arc than the claymore, heavier damage, but devastatingly
  // slow. The weapon of a man who moved mountains with a blade. The
  // Stirling Medal at lv5 unlocks Freedom Blade: the full 360° sweep
  // that carries across the moor like the battle-cry at Stirling Bridge.
  wallace_sword: {
    key: 'wallace_sword',
    nameKey: 'weapon.wallace_sword.name',
    descriptionKey: 'weapon.wallace_sword.description',
    behavior: 'arc_sweep',
    cooldownMs: 3400,
    damage: 50,
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 180,
    arcDegrees: 220,
    knockback: 140,
    levelScaling: {
      damage: 1.30,
      cooldown: 0.88,
      countAt: [],
      pierce: 0,
      radius: 1.12,
    },
  },

  // Wild Living World Phase 2 — Pibroch Hammer (Waulking Mallet
  // evolution). The waulking song is a *call*; the pibroch (piob
  // mhor) is the *answer* — a great-pipe lament rolling out across
  // the moor. Mechanically the evolved form trades the Waulking
  // Mallet's per-beat sting for a wider, heavier pulse that lands
  // a full crescendo on every fourth beat. Identity: "the song
  // already hit; the pibroch is the echo coming back". Behaviour
  // stays `aura_pulse` so it doesn't need a new branch in WeaponSystem;
  // the extra crescendo damage rides through `applyPibrochHammerRhythm`
  // in `src/systems/music/waulkingRhythm.ts`.
  pibroch_hammer: {
    key: 'pibroch_hammer',
    nameKey: 'weapon.pibroch_hammer.name',
    descriptionKey: 'weapon.pibroch_hammer.description',
    behavior: 'aura_pulse',
    cooldownMs: 1700, // ↓ from 2000 — faster downbeats.
    damage: 14,       // ↑ from 9 — heavier sting per pulse.
    projectileSpeed: 0,
    projectileCount: 0,
    pierce: 0,
    range: 0,
    aoeRadius: 144,   // ↑ from 96 — pibroch carries further.
    arcDegrees: 360,
    knockback: 42,    // ↑ from 30 — every pulse a kick of air.
    levelScaling: {
      damage: 1.22,
      cooldown: 0.92,
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
