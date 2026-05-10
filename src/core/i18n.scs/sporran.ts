/**
 * Sporran Deck — Scots overlay (W18 Phase B parity).
 *
 * Curse cards delegate to existing `curse.*.{name,desc}` keys so the
 * Scots curse-copy already authored covers them. Boon + quirk leaves
 * are localised here. Voice register matches the Scots overlay
 * elsewhere (`tae` / `wi` / `o` / `oot` / `quait`).
 */

export const sporran = {
  title: 'THA SPORRAN',
  subtitle: 'Seven chairms in tha pooch. Keep three for tha moor.',
  back: 'BACK',
  pick_label: 'KEEP',
  unpick_label: 'DRAP',
  picked_counter: 'KEPT {count}/{max}',
  confirm: 'FILL THA POOCH',
  confirm_disabled: 'PICK {remaining} MAIR',
  draw_link: 'DRAW THA SPORRAN',
  draw_link_desc: 'Pre-run draft — keep three chairms o\' yer choosin.',
  toast: {
    confirmed: 'Pooch filled — three chairms for tha moor.',
  },
  kind: {
    curse: 'CURSE',
    boon: 'BOON',
    quirk: 'QUIRK',
  },
  boon: {
    shortbread: {
      name: 'Shortbreid Crumbs',
      desc: 'A wee pooch o\' crumbs. Stairts ye fed — +20 HP afore tha bell.',
    },
    whisky: {
      name: 'Hip-Flask Whisky',
      desc: 'A nip for tha road. Tha moor\'s drinkin tae — spawns ease a touch.',
    },
    coal: {
      name: 'Lump o\' Coal',
      desc: 'Wairmth in tha pooch. Tha first hits land a shade safter.',
    },
    silver: {
      name: 'Siller Sixpence',
      desc: 'A coin tae promise tha year. +10% gowd this run.',
    },
  },
  quirk: {
    light_step: {
      name: 'Licht Step',
      desc: 'Licht on yer hooves — quicker, but a wee bit easier tae rattle.',
    },
    hardy_breath: {
      name: 'Hardy Breath',
      desc: 'Lungs fou o\' moor wind. Bigger heirt — slower stride.',
    },
    haggis_blooded: {
      name: 'Haggis-Bluidit',
      desc: 'Rins hot. Bigger bite — but tha moor reads ye hot back.',
    },
  },
  rare: {
    taxman_grudge: {
      name: 'Cairried Grudge',
      desc: 'Brocht hame frae a Taxman faw. +20% gowd; tha moor minds — stairt wi less heirt.',
    },
    witchs_thread: {
      name: 'Witch\'s Threid',
      desc: 'Spool unrowed frae a coat ye sudnae hae touched. +14% skaith, +14% skaith taen.',
    },
  },
  seasonal: {
    burns_dram: {
      name: 'Burns\' Dram',
      desc: 'A wee dram poured for tha Bard. +20 HP, +5% skaith. Burns Nicht anely.',
    },
    samhain_lantern: {
      name: 'Tumshie Lantern',
      desc: 'Carved face keeps three folk awa. +15 HP, spawns ease 5%. Samhain anely.',
    },
  },
  variant: {
    cailleach_frost: {
      name: 'Hag\'s Braith',
      desc: 'Frost rims tha spear. +8% skaith, slower stride. Cailleach anely.',
    },
    glaswegian_buckie: {
      name: 'Buckie Unner Yer Airm',
      desc: 'Ready fur onybody. +6% skaith, +6% skaith taen. Glaswegian anely.',
    },
  },
} as const;
