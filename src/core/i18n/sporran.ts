/**
 * Sporran Deck — pre-run draft scene + card copy.
 *
 * Voice: Hearth-warm with a folkloric undercurrent. The deck is the
 * haggis's pocket; the player is committing to a posture, not buying
 * gear. Curse cards reuse the EXISTING curse copy (`curse.*.name` /
 * `desc`) — Sporran's curse tiles delegate to the same name/desc keys
 * via the SporranCard's `nameKey`/`descKey` fields. Boons + quirks
 * land here.
 */

export const sporran = {
  /** Scene header. Hearth, kept short. */
  title: 'THE SPORRAN',
  /** Subtitle — sets the tone: this is a draft, not a shop. */
  subtitle: 'Seven charms in the pocket. Keep three for the moor.',
  /** Back button — returns to the Curse picker. */
  back: 'BACK',
  /** Tile-label CTA when a card has not yet been picked. */
  pick_label: 'KEEP',
  /** Tile-label CTA shown on a card the player has already picked. */
  unpick_label: 'DROP',
  /** Counter strip — shows how many of the 3 slots are filled. */
  picked_counter: 'KEPT {count}/{max}',
  /** Confirm button when the player has all 3 picks ready. Hearth-warm. */
  confirm: 'FILL THE POCKET',
  /** Confirm button label while the player still needs to pick more. */
  confirm_disabled: 'PICK {remaining} MORE',
  /** Link / tile shown on CurseScene that routes here. */
  draw_link: 'DRAW THE SPORRAN',
  /** Sub-line under the link on CurseScene — explains what the player is opting into. */
  draw_link_desc: 'Pre-run draft — keep three charms o\' yir choosing.',
  /** Run-start toast announcing the picks landed. */
  toast: {
    confirmed: 'Pocket filled — three charms for the moor.',
  },
  /** Kind chip on each card tile. */
  kind: {
    curse: 'CURSE',
    boon: 'BOON',
    quirk: 'QUIRK',
  },
  /** Boon card copy — small, warm, everyday luck. */
  boon: {
    shortbread: {
      name: 'Shortbread Crumbs',
      desc: 'A wee pocket o\' crumbs. Starts ye fed — +20 HP afore the bell.',
    },
    whisky: {
      name: 'Hip-Flask Whisky',
      desc: 'A nip for the road. The moor\'s drinkin too — spawns ease a touch.',
    },
    coal: {
      name: 'Lump o\' Coal',
      desc: 'Warmth in the pouch. The first hits land a shade softer.',
    },
    silver: {
      name: 'Silver Sixpence',
      desc: 'A coin tae promise the year. +10% gold this run.',
    },
  },
  /** Quirk card copy — bidirectional, Wild-Comedy register. */
  quirk: {
    light_step: {
      name: 'Light Step',
      desc: 'Light on yir hooves — quicker, but a wee bit easier tae rattle.',
    },
    hardy_breath: {
      name: 'Hardy Breath',
      desc: 'Lungs full o\' moor wind. Bigger heart — slower stride.',
    },
    haggis_blooded: {
      name: 'Haggis-Blooded',
      desc: 'Runs hot. Bigger bite — but the moor reads ye hot back.',
    },
  },
  /** Hearth-register cards — kitchen-table warmth with small trade-offs. */
  hearth: {
    kettle_on: {
      name: 'Kettle\'s On',
      desc: 'A cup by the fire afore the bell. Starts ye steadier — +18 HP.',
    },
    grans_shawl: {
      name: 'Gran\'s Shawl',
      desc: 'Cooried in wool. Hits land softer, but yir hooves take a minute tae wake.',
    },
    banked_ember: {
      name: 'Banked Ember',
      desc: 'A coal kept glowing. Weapons fire quicker; ye start with a smaller heart.',
    },
  },
  /**
   * Phase 3 — deed-gated rares. Edge register: scars from past runs,
   * not first-footer warmth. Only drawable when the lifetime stat
   * threshold is met.
   */
  rare: {
    taxman_grudge: {
      name: 'Carried Grudge',
      desc: 'Brought home from a Taxman fall. +20% gold; the moor remembers — start with less heart.',
    },
    witchs_thread: {
      name: 'Witch\'s Thread',
      desc: 'Spool unwound from a coat ye should not have touched. +14% damage, +14% damage taken.',
    },
  },
  /**
   * Phase 3 — seasonal-date-gated. Only drawable while the matching
   * SeasonalEvent window is open. Hearth register, season-flavoured.
   */
  seasonal: {
    burns_dram: {
      name: 'Burns\' Dram',
      desc: 'A wee dram poured for the Bard. +20 HP, +5% damage. Burns Night only.',
    },
    samhain_lantern: {
      name: 'Tumshie Lantern',
      desc: 'Carved face keeps three folk away. +15 HP, spawns ease 5%. Samhain only.',
    },
    hogmanay_coal: {
      name: 'The Dark Man\'s Coal',
      desc: 'Coal from the first-footer. Keeps the fingers nimble — fire quicker, but the gloaming bites back. Hogmanay only.',
    },
    beltane_spark: {
      name: 'Beltane Spark',
      desc: 'The fire leaps in ye. +12% damage; the crossing asks less heart. Beltane only.',
    },
    st_andrews_saltire: {
      name: 'Saltire Ribbon',
      desc: 'A blue-white favour from the winter market. Quicker hooves, softer scrapes. St Andrew\'s only.',
    },
  },
  /**
   * Phase 3 — variant-keyed. Only drawable when the matching variant
   * is selected. Tone matches the variant's voice register.
   */
  variant: {
    cailleach_frost: {
      name: 'Hag\'s Breath',
      desc: 'Frost rims the spear. +8% damage, slower stride. Cailleach only.',
    },
    glaswegian_buckie: {
      name: 'Buckie Under Yer Arm',
      desc: 'Ready fer onybody. +6% damage, +6% damage taken. Glaswegian only.',
    },
    witch_hare_familiar: {
      name: 'Isobel\'s Familiar',
      desc: 'Rides the pocket. +10% damage; the binding asks its tithe — less heart to start. Witch\'s Hare only.',
    },
    selkie_sealskin: {
      name: 'Sealskin Memory',
      desc: 'The seal moves without thinking of walls. +9% speed; the tide takes its own time — weapon slows 6%. Selkie only.',
    },
  },
} as const;
