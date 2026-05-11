export const upgradeCard = {
  // Weapon cards
  add_bagpipe_blast: {
    name: 'Bagpipe Blast',
    description: 'A ring of rude sound. Foes scatter like pigeons on Buchanan Street.',
  },
  add_caber_toss: {
    name: 'Caber Toss',
    description: 'Hurl a caber through a line of them — Highland Games in combat form.',
  },
  add_scotch_mist: {
    name: 'Scotch Mist',
    description: 'Trail a choking fog. Anything that lingers in it learns.',
  },
  add_haggis_hurler: {
    name: 'Jobby Hurler',
    description: 'Wee jobbies that ricochet off the arena edges till something soft stops them.',
  },
  add_nessie_tentacle: {
    name: "Nessie's Tentacle",
    description: 'A sweeping arm from the loch — wide reach, meatier knockback.',
  },
  add_claymore: {
    name: 'Highland Claymore',
    description: 'A slow, enormous cleave. Pair with the Tartan Sash to forge a legend.',
  },
  add_bagpipes: {
    name: 'Ceòl Mòr Bagpipes',
    description: 'A great drone that presses on the crowd till it folds.',
  },
  add_shinty_stick: {
    name: 'Shinty Stick',
    description: 'A curved ash caman cracks a wee ball oot — bouncin till it sticks. Pair wi the Shinty Ball for legendary form.',
  },
  add_sgian_dubh: {
    name: 'Sgian Dubh',
    description: 'The hidden stocking-knife. Fast wee arcs that lean on crit. Pair wi the Whetstone for legendary form.',
  },
  add_stag_antler: {
    name: 'Stag Antler',
    description: 'A red-deer tine bound to the brow. Steady arc on cooldown — every dash gores a meaty bonus sweep. Pair wi Velvet Antler for legendary form.',
  },
  add_waulking_mallet: {
    name: 'Waulking Mallet',
    description: 'A weighted oak beater. Hits on the beat land harder; off-beat hits still hit.',
  },
  // Passive cards
  add_sporran: {
    name: 'Sporran',
    description: 'A wee leather pouch. Somehow rarer cards turn up more often (+15% Luck). Evolves Thistle Shot.',
  },
  add_whisky_flask: {
    name: 'Whisky Flask',
    description: 'A nip before the fight — every AoE blooms 20% wider. Evolves Bagpipe Blast.',
  },
  add_kilt: {
    name: 'Kilt',
    description: 'It\'s breezy but it works — room for one more daft mistake (+15% max HP). Evolves Caber Toss.',
  },
  add_tam_o_shanter: {
    name: "Tam o' Shanter",
    description: 'A jaunty blue bonnet. The drift respects it, a little (+10% speed). Evolves Scotch Mist.',
  },
  add_irn_bru: {
    name: 'Irn Bru',
    description: "Scotland's other national drink — weapons fizz 20% faster. Evolves Jobby Hurler.",
  },
  add_loch_water: {
    name: 'Loch Water',
    description: 'Drawn from the depths. Gems hear it and come running (+25% pickup radius). Evolves Nessie\'s Tentacle.',
  },
  add_thistle_crown: {
    name: 'Thistle Crown',
    description: 'Prickly as a Glesga bus queue. +5% crit; attackers take 3 damage on contact.',
  },
  add_highland_shield: {
    name: 'Highland Shield',
    description: 'For when it aw goes sideways. Every 20s, shrug off a lethal hit.',
  },
  add_tartan_sash: {
    name: 'Tartan Sash',
    description: 'Pattern o\' clan and courage. +8% damage on everything. Evolves Highland Claymore.',
  },
  add_shinty_ball: {
    name: 'Shinty Ball',
    description: 'Cork core, leather skin. The wee ball wants tae fly truer (+15% projectile speed). Evolves Shinty Stick.',
  },
  add_whetstone: {
    name: 'Whetstone',
    description: 'A grit slab fae Gran. Every blade ye carry feels it (+10% crit chance). Evolves Sgian Dubh.',
  },
  add_velvet_antler: {
    name: 'Velvet Antler',
    description: 'Summer-skin on the rack, full o stored sun. +1 max dash charge. Evolves Stag Antler.',
  },
  add_tuning_fork: {
    name: 'Tuning Fork',
    description: 'Tap it once, the moor tunes to the bar. Aligned-beat pulses ring louder. Evolves Waulking Mallet.',
  },
  // Stat boost cards
  boost_hp: {
    name: 'Thick Hide',
    description: 'Room for a wee bit more punishment (+10 max HP). Stack as many as ye like.',
  },
  boost_speed: {
    name: 'Quick Feet',
    description: 'Fresher legs, faster steps (+8% move speed). The drift still whispers, mind.',
  },
  boost_pickup: {
    name: 'Keen Nose',
    description: 'Gems on the wind — ye smell them sooner (+15 pickup radius).',
  },
  boost_damage: {
    name: 'Sharpened Thistles',
    description: 'Every thistle given a shade more edge (+10% damage, everything).',
  },
  boost_drift: {
    name: 'Balanced Legs',
    description: 'The drift eases a little (-15%). Inputs land closer to where ye aim.',
  },
  heal: {
    name: 'Haggis Supper',
    description: 'A full plate before the fight. Instantly heal 25% of yir max HP.',
  },
  boost_crit: {
    name: 'Eagle Eye',
    description: 'Ye ken where it hurts (+5% crit chance).',
  },
  boost_regen: {
    name: 'Highland Spring',
    description: 'Like a sip o\' Irn-Bru for the soul (+0.5 HP/sec, slow and steady).',
  },
  boost_armor: {
    name: 'Iron Hide',
    description: 'Harder skin, flatter damage (+3 armor on every hit).',
  },
  boost_cooldown: {
    name: 'Battle Frenzy',
    description: 'The blood kens the beat (-10% weapon cooldowns).',
  },
  banish: {
    name: 'Highland Purge',
    description: 'Wipe the 5 weakest nearby off the moor. That\'s plenty — gie yerself some space.',
  },
  boost_lifesteal: {
    name: 'Vampiric Touch',
    description: 'A wee nip o\' life from every cull (+1 HP each).',
  },
  boost_projectile_speed: {
    name: 'Swift Thistles',
    description: 'Thistles wi\' a bit more zip — they arrive before the scream (+15% projectile speed).',
  },
  boost_boss_heal: {
    name: 'Trophy Hunter',
    description: 'When a boss folds, heal 20% max HP. Ye earned that, big yin.',
  },
  boost_knockback: {
    name: 'Highland Force',
    description: 'Every hit lands with a proper shove (+25% knockback).',
  },
  boost_xp: {
    name: 'Wisdom of the Highlands',
    description: 'The moor teaches, if ye\'ll listen (+15% XP from enemies).',
  },
  boost_luck: {
    name: 'Heather Fortune',
    description: 'The glen rolls a shade kinder — +8 luck on level-up draws (rarer picks, stacks wi\' curios).',
  },
  // ── Post-cap echo cards ──
  // Small stat-boost whispers drawn after MAX_LEVEL. Voice register:
  // warmer Still-Game note than the combat cards — these are the
  // moor's memory, not a new weapon. Each copy leads with the echo /
  // whisper / glen / land metaphor so the set reads as one family.
  echo_damage: {
    name: 'Sharper Echo',
    description: 'A thistle-sharp whisper from the moor (+4% damage).',
  },
  echo_crit: {
    name: 'Sharp Eyes',
    description: 'The glen shows where it gives (+2% crit chance).',
  },
  echo_speed: {
    name: 'Quick Whisper',
    description: 'Light in the step, barely there (+3% move speed).',
  },
  echo_hp: {
    name: 'Bone Deep',
    description: 'The land lays iron in yir ribs (+5 max HP).',
  },
  echo_pickup: {
    name: 'Pull of the Glen',
    description: 'Gems lean in when called (+6 pickup radius).',
  },
  echo_armor: {
    name: 'Stone Skin',
    description: 'A fine layer o\' moor-grit on yir hide (+1 armor).',
  },
  echo_cooldown: {
    name: 'Quick Hands',
    description: 'Weapons snap back a shade sooner (-3% cooldowns).',
  },
  echo_lifesteal: {
    name: 'Hungry Thistle',
    description: 'Every cut feeds ye a wee bit back (+0.3 HP per kill).',
  },
  // Templates used by buildCardPool for level-up cards.
  // Space between "Lv" and the number to match ui.hud.level_fmt for visual
  // consistency across HUD + card + game-over weapon summaries.
  levelup: {
    name: '{weapon} Lv {level}',
    description: 'Hone {weapon} up tae level {level}. Every notch counts.',
  },
  evolution_hint: ' At Lv 5, crack a chest while carrying {passive} — somethin\' legendary stirs.',
  /**
   * T215 — appended to a passive card's description when picking it
   * would complete an evolution recipe (matching weapon already at
   * Lv 5, not yet evolved). Tells the player the next chest will
   * offer the named legendary form. Hearth-warm voice; no shouty caps.
   */
  evolution_ready_hint: ' ★ Evolves into {evolved} at the next chest.',
  /**
   * Phase B Endless — Overcharge mythic-tier card. Post-bell only,
   * once per evolved weapon per run. Voice: Edge register — the
   * weapon "remembers what it was; remember what it was for". Damage
   * + area scaled, but the line trades on the moment, not the math.
   */
  overcharge: {
    name: 'Overcharge {weapon}',
    description: '{weapon} burns hotter — +25% damage, +20% area. Once only.',
  },
} as const;
