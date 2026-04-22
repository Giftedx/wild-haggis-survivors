export const FIRST_NAMES: readonly string[] = [
  'Moira', 'Dughall', 'Eilidh', 'Hamish', 'Iona',
  'Seumas', 'Mairi', 'Lachlan', 'Isla', 'Fergus',
  'Bonnie', 'Angus', 'Catriona', 'Tavish', 'Morag',
  'Duncan', 'Senga', 'Murdo', 'Elspeth', 'Donnan',
  'Rhona', 'Coinneach', 'Aileen', 'Ewan', 'Freya',
  'Kenzie', 'Mhairi', 'Torquil', 'Una', 'Finlay',
] as const;

export const EPITHETS: readonly string[] = [
  'of the Moor',
  'Peat-heart',
  'the Red-Handed',
  'Storm-walked',
  'Heather-born',
  'of the Long Night',
  'Selkie-kin',
  'the Unquiet',
  'Thistle-kenned',
  'Midge-scarred',
  'of the Cold Hearth',
  'Saltwater-eyed',
] as const;

export const KIN_TERMS: readonly string[] = [
  'Great-great-gran',
  'Great-gran',
  'Gran',
  'Auntie',
  'Uncle',
  'Cousin',
  'Elder',
  'Forebear',
] as const;

const EPITHET_CHANCE = 0.4;

export function generateHaggisName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  if (rng() < EPITHET_CHANCE) {
    const epithet = EPITHETS[Math.floor(rng() * EPITHETS.length)];
    return `${first} ${epithet}`;
  }
  return first!;
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function generateHaggisNameFromHash(seed: string): string {
  let a = hashString(seed);
  const rng = (): number => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return generateHaggisName(rng);
}

export function pickKinTerm(rng: () => number): string {
  return KIN_TERMS[Math.floor(rng() * KIN_TERMS.length)]!;
}
