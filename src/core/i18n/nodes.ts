export const nodes = {
  ui: {
    progress: 'Act {act} · {current}/{total}',
    shrine_title: 'An old shrine stirs.',
    shrine_body: 'Offer a thought — claim a wee boon.',
    trader_title: 'The wee trader spreads a blanket.',
    trader_body: 'Pick one from the pack. (Sporran: {gold}g)',
    bargain_title: 'A cold voice on the wind.',
    bargain_body: '"Pay {hp} HP, take {offer}."',
    leave: 'Leave',
    accept: 'Accept',
    accept_cost: '(-{hp} HP)',
    /** Affordable price subLabel — worn on the option when balance covers it. */
    trader_price: '({price}g)',
    /** Unaffordable price subLabel — same text, disabled option handles the grey. */
    trader_price_short: '({price}g — short)',
    trader_item: {
      relic: 'Rare curio',
      passive: 'Passive charm',
      reroll: 'Reroll token',
    },
    toast: {
      rest: 'Hearth warmth — rested.',
      hidden_empty: 'A forgotten cairn — empty but for the wind.',
      bargain_refused: 'Refused the bargain.',
      bargain_relic: 'The bargain delivers a relic.',
      bargain_gold: 'The bargain: +10% gold for the rest of the run.',
      bargain_cooldown: 'The bargain: weapons cool 10% faster.',
      bargain_armor: 'The bargain: take 10% less damage.',
      bargain_token: 'The bargain: a token and a few coins.',
      trader_relic: 'A curio joins the sporran.',
      trader_empty_pack: 'The pack is empty — +40g on the house.',
      trader_no_passives: 'No passives in stock — kept your coin (+40g).',
      /** M1 F8 — trader passive pick that successfully delivered. */
      trader_passive_granted: '{name} tucked into the sporran.',
      trader_reroll: 'Reroll token pocketed.',
      shrine_boon: 'Shrine boon: {label}',
      /** M1 F4 — timed shrine buff toast. `{seconds}` is the duration tag. */
      shrine_buff_timed: 'Shrine boon: {label} — {seconds}s',
      shrine_gold: 'Shrine boon: +50 gold',
      shrine_xp: 'Shrine boon: +25 XP',
      shrine_luck_relic: 'Shrine boon: a relic glints in the cairn',
      shrine_luck_gold: 'Shrine boon: +30 gold (shelves bare)',
    },
  },
  boon: {
    buff_damage: { label: 'Sharpen your teeth' },
    buff_speed: { label: 'Quicken your trot' },
    buff_luck: { label: 'A turn of fortune' },
    buff_armor: { label: 'Harden your hide' },
    buff_regen: { label: 'Slow mending' },
    buff_pickup: { label: 'Wider gather' },
    buff_crit: { label: 'A lucky tusk' },
    buff_reflect: { label: 'The moor bites back' },
    buff_dodge: { label: 'A side-step ready' },
    buff_xp: { label: 'Quick wisdom' },
    buff_gold: { label: 'A handful of coin' },
  },
  offer: {
    rare_relic: 'a rare relic',
    buff_damage_run: 'less damage taken',
    buff_cooldown_run: 'faster weapons',
    buff_speed_run: 'a swifter foot',
    weapon_upgrade_token: 'a token of sharpening',
  },
  // --- Encounter names (act-scoped) ---
  a1: {
    thistle_ambush: { name: 'Thistle ambush' },
    hare_rush: { name: 'Hare rush' },
    midge_cloud: { name: 'Midge cloud' },
    wee_hunters: { name: 'Wee hunters' },
    chef_parade: { name: 'Chef parade' },
    cow_crossing: { name: 'Cow crossing' },
    eagle_sweep: { name: 'Eagle sweep' },
    piper_pair: { name: 'Piper pair' },
    scotsman_rabble: { name: 'Scotsman rabble' },
    ghostie_flit: { name: 'Ghostie flit' },
  },
  a2: {
    buckie_brawl: { name: 'Buckie brawl' },
    barghest_patrol: { name: 'Barghest patrol' },
    kelpie_shoals: { name: 'Kelpie shoals' },
    fae_courtiers: { name: 'Fae courtiers' },
    blue_men: { name: 'Blue men of the Minch' },
    haar_roll: { name: 'Haar roll' },
    redcap_raiders: { name: 'Redcap raiders' },
    deep_fryers: { name: 'Deep-fryer line' },
  },
  a3s1: {
    ghost_tour: { name: 'Ghost-tour ambush' },
    close_closure: { name: 'Close closure' },
    ceilidh_riot: { name: 'Ceilidh riot' },
    dean_procession: { name: 'Dean procession' },
  },
  a3s2: {
    wild_hunt: { name: 'Wild Hunt' },
    nest_sprawl: { name: 'Nest sprawl' },
    fae_war: { name: 'Fae war' },
    barghest_pack: { name: 'Barghest pack' },
  },
  a3s3: {
    ledger_column: { name: 'Ledger column' },
    audit_office: { name: 'Audit office' },
    ghost_assembly: { name: 'Ghost assembly' },
    fryers_riot: { name: 'Fryers\' riot' },
  },
  // --- Shared-category names + prompts (shrine / trader / rest / hidden / bargain / elite) ---
  shrine: {
    standing_stone: {
      name: 'Standing stone',
      prompt: 'Touch the stone. Choose a gift.',
    },
    cairn: {
      name: 'Wayside cairn',
      prompt: 'Add a stone. Take a boon.',
    },
    well: {
      name: 'Wishing well',
      prompt: 'Drop a thought. Pick a blessing.',
    },
    fairy_ring: {
      name: 'Fairy ring',
      prompt: 'Step lightly. Take the offering.',
    },
    rowan: {
      name: 'Rowan shrine',
      prompt: 'The red berries listen. Choose.',
    },
    loch_votive: {
      name: 'Loch-side votive',
      prompt: 'The water remembers. Accept its gift.',
    },
    old_town: {
      name: 'Close-wall shrine',
      prompt: 'Old stone holds old luck. Take one.',
    },
    wallace: {
      name: 'Wallace-mark shrine',
      prompt: 'Stand tall. Claim the boon.',
    },
    taxmans_eye: {
      name: 'Taxman\'s eye',
      prompt: 'The ledger watches. Pick quickly.',
    },
  },
  trader: {
    tinker: {
      name: 'Wandering tinker',
      prompt: 'Goods fer the brave, a reroll fer the wise.',
    },
    sheepdrover: {
      name: 'Sheep drover',
      prompt: 'Between herds, a wee swap?',
    },
    packman: {
      name: 'Packman',
      prompt: 'Roads are lonely. Fancy a trade?',
    },
    smith: {
      name: 'Roadside smith',
      prompt: 'Iron and sparks and a reroll token.',
    },
    close_hawker: {
      name: 'Close hawker',
      prompt: '"Git yer curios, git yer charms."',
    },
    traveller: {
      name: 'Highland traveller',
      prompt: 'Pipes on my back, goods in my bag.',
    },
    ferryman: {
      name: 'Taxman\'s ferryman',
      prompt: 'Crossing costs — but ye pick the cargo.',
    },
  },
  rest: {
    bothy: { name: 'Bothy hearth' },
    hearth: { name: 'Hearth fire' },
    crofters_hearth: { name: 'Crofter\'s hearth' },
    shielling: { name: 'Shielling hut' },
    close_hearth: { name: 'Close-corner hearth' },
    highland_pasture: { name: 'Highland pasture' },
    last_bothy: { name: 'Last bothy' },
  },
  hidden: {
    thistle_patch: {
      name: 'Thistle patch',
      prompt: 'Something glints among the thorns.',
    },
    pictish_stone: {
      name: 'Pictish stone',
      prompt: 'A carved stone — touch it?',
    },
    clootie_tree: {
      name: 'Clootie tree',
      prompt: 'Rags tied with wishes. Take one?',
    },
    vennel: {
      name: 'Forgotten vennel',
      prompt: 'A dead-end lane — worth a look?',
    },
    stone_circle: {
      name: 'Stone circle remnant',
      prompt: 'Old stones, older silence. Step in?',
    },
    sealed_archive: {
      name: 'Sealed archive',
      prompt: 'The seal is cracked. Read on?',
    },
  },
  bargain: {
    wee_folk: {
      name: 'Wee-folk bargain',
      prompt: 'The folk ask a little. Offer a little.',
    },
    cailleach_shadow: {
      name: 'Cailleach\'s shadow',
      prompt: 'The winter-crone counts yer breaths.',
    },
    unseelie_pact: {
      name: 'Unseelie pact',
      prompt: 'Sign in sweat, ask for favour.',
    },
    old_gentleman: {
      name: 'The Old Gentleman',
      prompt: 'A smile too sharp. A deal too clean.',
    },
    faerie_queen: {
      name: 'Faerie queen\'s terms',
      prompt: 'Her price is never gentle.',
    },
    taxmans_clerk: {
      name: 'Taxman\'s clerk',
      prompt: 'Figures in triplicate. Cost in blood.',
    },
  },
  elite: {
    wild_hunter: { name: 'Wild hunter' },
    angry_chef: { name: 'Angry head chef' },
    kelpie_prince: { name: 'Kelpie prince' },
    neds_boss: { name: 'The neds\' boss' },
    hunter_captain: { name: 'Hunter captain' },
    chief_auditor: { name: 'Chief auditor' },
  },
} as const;
