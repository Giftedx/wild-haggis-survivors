export const seasonalEvent = {
  burns_night: {
    name: 'Burns Night',
    description: 'Jan 18 – Feb 1 — the bard\'s week on the moor.',
    badge_suffix: 'Burns Night',
    /** E1 T9/T22 — on-screen banner at run start / Croft re-entry. */
    ceremony_banner: '🕯 Burns Night is live — the bard keeps watch.',
  },
  hogmanay: {
    name: 'Hogmanay',
    description: 'Dec 28 – Jan 3 — kirk bells crack the year open.',
    badge_suffix: 'Hogmanay',
    ceremony_banner: '🔔 Hogmanay is live — a guid new year tae ye.',
  },
  samhain: {
    name: 'Samhain',
    description: 'Oct 28 – Nov 3 — the veil is thin; mind yer manners.',
    badge_suffix: 'Samhain',
    ceremony_banner: '🕯 Samhain is live — the Cailleach is watching.',
  },
  st_andrews: {
    name: 'St Andrew\'s Day',
    description: 'Nov 27 – Dec 3 — saltire weather on the moor.',
    badge_suffix: 'St Andrew\'s Day',
    ceremony_banner: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 St Andrew\'s Day is live — haud on fer hame.',
  },
  beltane: {
    name: 'Beltane',
    description: 'Apr 28 – May 4 — twin fires on the moor; the cattle run between.',
    badge_suffix: 'Beltane',
    ceremony_banner: '🔥 Beltane is live — pass between the twin fires.',
  },
  imbolc: {
    name: 'Imbolc',
    description: 'Feb 2 – Feb 8 — Brigid stirs; the lambing-sky leans warm.',
    badge_suffix: 'Imbolc',
    ceremony_banner: '🕯 Imbolc is live — Brigid\'s mantle is on the byre.',
  },
  lammas: {
    name: 'Lùnastal / Lammas',
    description: 'Jul 29 – Aug 4 — first sheaves cut; loaf-mass at the cairn.',
    badge_suffix: 'Lùnastal',
    ceremony_banner: '🌾 Lùnastal is live — the loaf is broken on the moor.',
  },
  bracken_turn: {
    name: 'Bracken-turn',
    description: 'Nov 4 – Nov 26 — fronds bronze, frost finds the heather.',
    badge_suffix: 'Bracken-turn',
    ceremony_banner: '🍂 Bracken-turn is live — the moor wears its copper coat.',
  },
  bannockburn: {
    name: 'Bannockburn',
    description: 'Jun 22 – Jun 25 — the field where Bruce held; "Scots, wha hae".',
    badge_suffix: 'Bannockburn',
    ceremony_banner: '⚔ Bannockburn is live — every G-press echoes the anthem.',
  },
  glorious_twelfth: {
    name: 'The Glorious Twelfth',
    description: 'Aug 11 – Aug 13 — grouse season opens; the moor goes loud.',
    badge_suffix: 'The Twelfth',
    ceremony_banner: '🦆 The Glorious Twelfth is live — go to ground, walk wider.',
  },
  culloden: {
    name: 'Culloden',
    description: 'Apr 13 – Apr 18 — sixteenth April, 1746. The moor keeps its own count.',
    badge_suffix: 'Culloden',
    ceremony_banner: '🕯 Culloden is live — the field keeps its own count.',
  },
  tartan_day: {
    name: 'Tartan Day',
    description: 'Apr 4 – Apr 8 — diaspora warmth; the Declaration of Arbroath.',
    badge_suffix: 'Tartan Day',
    ceremony_banner: '🧶 Tartan Day is live — the moor reaches further.',
  },
  simmer_dim: {
    name: 'Simmer Dim',
    description: 'Jun 18 – Jun 21 — held twilight; the moor never goes fully dark.',
    badge_suffix: 'Simmer Dim',
    ceremony_banner: '🌒 Simmer Dim is live — the gloaming holds.',
  },
  up_helly_aa: {
    name: 'Up Helly Aa',
    description: 'Feb 9 – Feb 15 — Shetland torch processions; the galley burns at the harbour.',
    badge_suffix: 'Up Helly Aa',
    ceremony_banner: '🔥 Up Helly Aa is live — the guizers march, the galley burns.',
  },
  highland_games: {
    name: 'Highland Games',
    description: 'Aug 25 – Sep 7 — caber, hammer, stone put. The moor holds its games.',
    badge_suffix: 'Highland Games',
    ceremony_banner: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Highland Games live — walk stronger today.',
  },
} as const;
