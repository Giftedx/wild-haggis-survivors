export const nodes = {
  ui: {
    progress: 'Act {act} · {current}/{total}',
    shrine_title: 'An auld shrine stirs.',
    shrine_body: 'Offer a thocht — claim a wee boon.',
    trader_title: 'The wee trader spreids a blanket.',
    trader_body: 'Pick ane fae tha pack. (Sporran: {gold}g)',
    bargain_title: 'A cauld voice on tha wind.',
    bargain_body: '"Pey {hp} HP, tak {offer}."',
    leave: 'Awa wi ye',
    accept: 'Accept',
    accept_cost: '(-{hp} HP)',
    trader_price: '({price}g)',
    trader_price_short: '({price}g — short)',
    trader_item: {
      relic: 'Rare curio',
      passive: 'Passive cherm',
      reroll: 'Reroll token',
    },
    toast: {
      rest: 'Hearth warmth — restit.',
      hidden_empty: 'A forgotten cairn — empty but fer tha wind.',
      bargain_refused: 'Refused tha bargain.',
      bargain_relic: 'Tha bargain delivers a relic.',
      bargain_gold: 'Tha bargain: +10% gowd fer tha rest o tha run.',
      bargain_cooldown: 'Tha bargain: weapons cool 10% faster.',
      bargain_armor: 'Tha bargain: tak 10% less damage.',
      bargain_token: 'Tha bargain: a token an a few coins.',
      trader_relic: 'A curio joins tha sporran.',
      trader_empty_pack: 'Tha pack is tuim — +40g on tha hoose.',
      trader_no_passives: 'Nae passives in stock — kept yer coin (+40g).',
      trader_passive_granted: '{name} tucked intae the sporran.',
      trader_reroll: 'Reroll token pooched.',
      shrine_boon: 'Shrine boon: {label}',
      shrine_buff_timed: 'Shrine boon: {label} — {seconds}s',
      shrine_gold: 'Shrine boon: +50 gowd',
      shrine_xp: 'Shrine boon: +25 XP',
      shrine_luck_relic: 'Shrine boon: a relic gleams in tha cairn',
      shrine_luck_gold: 'Shrine boon: +30 gowd (shelves bare)',
    },
  },
  boon: {
    buff_damage: { label: 'Shairpen yer teeth' },
    buff_speed: { label: 'Quicken yer trot' },
    buff_luck: { label: 'A turn o fortune' },
    buff_armor: { label: 'Hairden yer hide' },
    buff_regen: { label: 'Sloow mendin' },
    buff_pickup: { label: 'Wider gaither' },
    buff_crit: { label: 'A lucky tusk' },
    buff_reflect: { label: 'Tha muir bites back' },
    buff_dodge: { label: 'A side-step ready' },
    buff_xp: { label: 'Quick wit' },
    buff_gold: { label: 'A haundfu o coin' },
  },
  offer: {
    rare_relic: 'a rare relic',
    buff_damage_run: 'less damage taken',
    buff_cooldown_run: 'faster weapons',
    buff_speed_run: 'a swifter fit',
    weapon_upgrade_token: 'a token o shairpenin',
  },
  // --- Encounter names (act-scoped) — F7 pass ---
  a1: {
    thistle_ambush: { name: 'Thistle jump' },
    hare_rush: { name: 'Hare belter' },
    midge_cloud: { name: 'Midgie cloud' },
    wee_hunters: { name: 'Wee hunters' },
    chef_parade: { name: 'Chef parade' },
    cow_crossing: { name: 'Coo crossin' },
    eagle_sweep: { name: 'Erne sweep' },
    piper_pair: { name: 'Piper pair' },
    scotsman_rabble: { name: 'Scotsman rabble' },
    ghostie_flit: { name: 'Bogle flit' },
  },
  a2: {
    buckie_brawl: { name: 'Buckie stramash' },
    barghest_patrol: { name: 'Barghest patrol' },
    kelpie_shoals: { name: 'Kelpie shoals' },
    fae_courtiers: { name: 'Fae courtiers' },
    blue_men: { name: 'Blue men o tha Minch' },
    haar_roll: { name: 'Haar rollin in' },
    redcap_raiders: { name: 'Redcap reivers' },
    deep_fryers: { name: 'Deep-fryer line' },
  },
  a3s1: {
    ghost_tour: { name: 'Bogle-tour jump' },
    close_closure: { name: 'Close closure' },
    ceilidh_riot: { name: 'Ceilidh stramash' },
    dean_procession: { name: 'Dean procession' },
  },
  a3s2: {
    wild_hunt: { name: 'Tha Wild Hunt' },
    nest_sprawl: { name: 'Nest sprawl' },
    fae_war: { name: 'Fae war' },
    barghest_pack: { name: 'Barghest pack' },
  },
  a3s3: {
    ledger_column: { name: 'Ledger column' },
    audit_office: { name: 'Audit office' },
    ghost_assembly: { name: 'Bogle assembly' },
    fryers_riot: { name: 'Fryers\' stramash' },
  },
  // --- Shared-category names + prompts (shrine / trader / rest / hidden / bargain / elite) ---
  shrine: {
    standing_stone: {
      name: 'Staundin stane',
      prompt: 'Touch tha stane. Choose yer gift.',
    },
    cairn: {
      name: 'Waeside cairn',
      prompt: 'Add a stane. Tak a boon.',
    },
    well: {
      name: 'Wishin wall',
      prompt: 'Drap a thocht. Pick a blessin.',
    },
    fairy_ring: {
      name: 'Fairy rink',
      prompt: 'Step licht. Tak tha offer.',
    },
    rowan: {
      name: 'Rowan shrine',
      prompt: 'Tha reid berries listen. Choose.',
    },
    loch_votive: {
      name: 'Lochside votive',
      prompt: 'Tha watter minds. Accept its gift.',
    },
    old_town: {
      name: 'Close-wa shrine',
      prompt: 'Auld stane hauds auld luck. Tak ane.',
    },
    wallace: {
      name: 'Wallace-mark shrine',
      prompt: 'Staund tall. Claim tha boon.',
    },
    taxmans_eye: {
      name: 'Taxman\'s ee',
      prompt: 'Tha ledger\'s watchin. Pick quick.',
    },
  },
  trader: {
    tinker: {
      name: 'Wanderin tinker',
      prompt: 'Guids fer tha brave, a reroll fer tha wise.',
    },
    sheepdrover: {
      name: 'Sheep drover',
      prompt: 'Atween herds, a wee swap?',
    },
    packman: {
      name: 'Packman',
      prompt: 'Roads are lonely. Fancy a trade?',
    },
    smith: {
      name: 'Roadside smith',
      prompt: 'Iron an sparks an a reroll token.',
    },
    close_hawker: {
      name: 'Close hawker',
      prompt: '"Git yer curios, git yer cherms."',
    },
    traveller: {
      name: 'Hielan traiveller',
      prompt: 'Pipes on ma back, guids in ma bag.',
    },
    ferryman: {
      name: 'Taxman\'s ferryman',
      prompt: 'Crossin costs — but ye pick tha cargo.',
    },
  },
  rest: {
    bothy: { name: 'Bothy hearth' },
    hearth: { name: 'Hearth fire' },
    crofters_hearth: { name: 'Crofter\'s hearth' },
    shielling: { name: 'Shielin hut' },
    close_hearth: { name: 'Close-corner hearth' },
    highland_pasture: { name: 'Hielan pasture' },
    last_bothy: { name: 'Last bothy' },
  },
  hidden: {
    thistle_patch: {
      name: 'Thistle patch',
      prompt: 'Somethin glimmers amang tha thorns.',
    },
    pictish_stone: {
      name: 'Pictish stane',
      prompt: 'A carvit stane — touch it?',
    },
    clootie_tree: {
      name: 'Clootie tree',
      prompt: 'Rags tied wi wishes. Tak ane?',
    },
    vennel: {
      name: 'Forgotten vennel',
      prompt: 'A deid-end lane — worth a look?',
    },
    stone_circle: {
      name: 'Stane circle remains',
      prompt: 'Auld stanes, aulder silence. Step in?',
    },
    sealed_archive: {
      name: 'Sealed archive',
      prompt: 'Tha seal is crackit. Read on?',
    },
  },
  bargain: {
    wee_folk: {
      name: 'Wee-folk bargain',
      prompt: 'Tha folk ask a wee, offer a wee.',
    },
    cailleach_shadow: {
      name: 'Cailleach\'s shadow',
      prompt: 'Tha winter-crone counts yer braiths.',
    },
    unseelie_pact: {
      name: 'Unseelie pact',
      prompt: 'Sign in sweat, ask fer favour.',
    },
    old_gentleman: {
      name: 'Tha Auld Gentleman',
      prompt: 'A smile ower shairp. A deal ower clean.',
    },
    faerie_queen: {
      name: 'Faerie queen\'s terms',
      prompt: 'Her price is ne\'er saft.',
    },
    taxmans_clerk: {
      name: 'Taxman\'s clerk',
      prompt: 'Figures in triplicate. Cost in bluid.',
    },
  },
  elite: {
    wild_hunter: { name: 'Wild hunter' },
    angry_chef: { name: 'Angry heid chef' },
    kelpie_prince: { name: 'Kelpie prince' },
    neds_boss: { name: 'Tha neds\' boss' },
    hunter_captain: { name: 'Hunter captain' },
    chief_auditor: { name: 'Chief auditor' },
  },
} as const;
