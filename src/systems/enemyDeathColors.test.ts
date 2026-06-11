import { describe, it, expect } from 'vitest';
import { resolveEnemyDeathColor } from './enemyDeathColors';
import { COLORS } from '../config';

describe('resolveEnemyDeathColor', () => {
  it('returns the correct color for tourist', () => {
    expect(resolveEnemyDeathColor('tourist')).toBe(0xcc2020);
  });

  it('returns the correct color for highland_cow', () => {
    expect(resolveEnemyDeathColor('highland_cow')).toBe(0x8b6b3a);
  });

  it('returns the correct color for gale_wraith', () => {
    expect(resolveEnemyDeathColor('gale_wraith')).toBe(0x99aacc);
  });

  it('returns the correct color for taxman', () => {
    expect(resolveEnemyDeathColor('taxman')).toBe(0x222244);
  });

  it('falls back to WHISKY_GOLD for unknown enemy keys', () => {
    expect(resolveEnemyDeathColor('some_unknown_enemy')).toBe(COLORS.WHISKY_GOLD);
    expect(resolveEnemyDeathColor('')).toBe(COLORS.WHISKY_GOLD);
  });

  it('has no duplicate color values across mapped enemies', () => {
    // Build a map from color → keys to surface duplicates for easy diagnosis
    const colorToKeys: Record<number, string[]> = {};
    const enemyKeys = [
      'tourist', 'chef', 'midge', 'highland_cow', 'eagle', 'haggis_hunter',
      'angry_scotsman', 'deep_fryer', 'piper', 'berserker', 'ghost', 'nest',
      'sheep', 'kelpie', 'midgie_swarm', 'buckfast_ned', 'traffic_cone_totem',
      'edinburgh_ghost_guide', 'barghest', 'kelpie_foal', 'blue_man_of_minch',
      'haar_wraith', 'gale_wraith', 'seelie_piper', 'unseelie_fiddler', 'redcap',
      'ceilidh_caller', 'tome_wraith', 'dean_apparition', 'ledger_wraith',
      'auditor_priest', 'gordon', 'tour_bus', 'the_laird', 'hunter_general', 'taxman',
    ];
    for (const key of enemyKeys) {
      const color = resolveEnemyDeathColor(key);
      if (!colorToKeys[color]) colorToKeys[color] = [];
      colorToKeys[color].push(key);
    }
    const duplicates = Object.entries(colorToKeys)
      .filter(([, keys]) => keys.length > 1)
      .map(([color, keys]) => `0x${Number(color).toString(16).toUpperCase()}: ${keys.join(', ')}`);
    expect(duplicates).toEqual([]);
  });
});
