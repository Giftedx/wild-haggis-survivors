import type { BiomeId } from './biomes';

export type WildlifeKey =
  | 'hare'
  | 'red_deer'
  | 'buzzard'
  | 'red_squirrel'
  | 'pine_marten'
  | 'capercaillie'
  | 'otter'
  | 'puffin'
  | 'golden_eagle'
  | 'scottish_wildcat';

export interface WildlifeDef {
  key: WildlifeKey;
  spriteKeyIdle: string;
  spriteKeyMove: string;
  scale: number;
  baseSpeed: number;
  fleeSpeed: number;
  fleeRadius: number;
  enemyFleeRadius: number;
  biomeWeights: Record<BiomeId, number>;
  aerial: boolean;
}

export const WILDLIFE_KEYS: readonly WildlifeKey[] = [
  'hare',
  'red_deer',
  'buzzard',
  'red_squirrel',
  'pine_marten',
  'capercaillie',
  'otter',
  'puffin',
  'golden_eagle',
  'scottish_wildcat',
];

export const WILDLIFE_DEFS: Record<WildlifeKey, WildlifeDef> = {
  hare: {
    key: 'hare',
    spriteKeyIdle: 'wildlife_hare_idle',
    spriteKeyMove: 'wildlife_hare_move',
    scale: 0.65,
    baseSpeed: 45,
    fleeSpeed: 140,
    fleeRadius: 220,
    enemyFleeRadius: 180,
    biomeWeights: {
      bog: 0.3,
      loch: 0.2,
      pine: 0.5,
      heather: 1.0,
    },
    aerial: false,
  },
  red_deer: {
    key: 'red_deer',
    spriteKeyIdle: 'wildlife_red_deer_idle',
    spriteKeyMove: 'wildlife_red_deer_move',
    scale: 0.9,
    baseSpeed: 30,
    fleeSpeed: 90,
    fleeRadius: 260,
    enemyFleeRadius: 200,
    biomeWeights: {
      bog: 0.2,
      loch: 0.3,
      pine: 1.0,
      heather: 0.7,
    },
    aerial: false,
  },
  buzzard: {
    key: 'buzzard',
    spriteKeyIdle: 'wildlife_buzzard_idle',
    spriteKeyMove: 'wildlife_buzzard_move',
    scale: 0.55,
    baseSpeed: 60,
    fleeSpeed: 60,
    fleeRadius: 0,
    enemyFleeRadius: 0,
    biomeWeights: {
      bog: 0.8,
      loch: 0.6,
      pine: 0.8,
      heather: 1.0,
    },
    aerial: true,
  },
  red_squirrel: {
    key: 'red_squirrel',
    spriteKeyIdle: 'wildlife_red_squirrel_idle',
    spriteKeyMove: 'wildlife_red_squirrel_move',
    scale: 0.62,
    baseSpeed: 55,
    fleeSpeed: 165,
    fleeRadius: 210,
    enemyFleeRadius: 170,
    biomeWeights: {
      bog: 0.1,
      loch: 0.25,
      pine: 1.0,
      heather: 0.35,
    },
    aerial: false,
  },
  pine_marten: {
    key: 'pine_marten',
    spriteKeyIdle: 'wildlife_pine_marten_idle',
    spriteKeyMove: 'wildlife_pine_marten_move',
    scale: 0.7,
    baseSpeed: 50,
    fleeSpeed: 150,
    fleeRadius: 240,
    enemyFleeRadius: 190,
    biomeWeights: {
      bog: 0.15,
      loch: 0.25,
      pine: 1.0,
      heather: 0.45,
    },
    aerial: false,
  },
  capercaillie: {
    key: 'capercaillie',
    spriteKeyIdle: 'wildlife_capercaillie_idle',
    spriteKeyMove: 'wildlife_capercaillie_move',
    scale: 0.75,
    baseSpeed: 32,
    fleeSpeed: 100,
    fleeRadius: 230,
    enemyFleeRadius: 180,
    biomeWeights: {
      bog: 0.15,
      loch: 0.1,
      pine: 1.0,
      heather: 0.3,
    },
    aerial: false,
  },
  otter: {
    key: 'otter',
    spriteKeyIdle: 'wildlife_otter_idle',
    spriteKeyMove: 'wildlife_otter_move',
    scale: 0.72,
    baseSpeed: 42,
    fleeSpeed: 130,
    fleeRadius: 220,
    enemyFleeRadius: 180,
    biomeWeights: {
      bog: 0.7,
      loch: 1.0,
      pine: 0.25,
      heather: 0.2,
    },
    aerial: false,
  },
  puffin: {
    key: 'puffin',
    spriteKeyIdle: 'wildlife_puffin_idle',
    spriteKeyMove: 'wildlife_puffin_move',
    scale: 0.62,
    baseSpeed: 50,
    fleeSpeed: 50,
    fleeRadius: 0,
    enemyFleeRadius: 0,
    biomeWeights: {
      bog: 0.2,
      loch: 1.0,
      pine: 0.05,
      heather: 0.35,
    },
    aerial: true,
  },
  golden_eagle: {
    key: 'golden_eagle',
    spriteKeyIdle: 'wildlife_golden_eagle_idle',
    spriteKeyMove: 'wildlife_golden_eagle_move',
    scale: 0.68,
    baseSpeed: 75,
    fleeSpeed: 75,
    fleeRadius: 0,
    enemyFleeRadius: 0,
    biomeWeights: {
      bog: 0.7,
      loch: 0.5,
      pine: 0.6,
      heather: 1.0,
    },
    aerial: true,
  },
  scottish_wildcat: {
    key: 'scottish_wildcat',
    spriteKeyIdle: 'wildlife_scottish_wildcat_idle',
    spriteKeyMove: 'wildlife_scottish_wildcat_move',
    scale: 0.68,
    baseSpeed: 48,
    fleeSpeed: 150,
    fleeRadius: 230,
    enemyFleeRadius: 190,
    biomeWeights: {
      bog: 0.2,
      loch: 0.25,
      pine: 0.9,
      heather: 1.0,
    },
    aerial: false,
  },
};
