import type { BiomeId } from './biomes';

export type WildlifeKey = 'hare' | 'red_deer' | 'buzzard';

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

export const WILDLIFE_KEYS: readonly WildlifeKey[] = ['hare', 'red_deer', 'buzzard'];

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
};
