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
} as const;
