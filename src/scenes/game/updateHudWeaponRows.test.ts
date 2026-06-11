import { describe, expect, it } from 'vitest';
import { updateHudWeaponRows, type HudWeaponRow } from './updateHudWeaponRows';

function makeRows(n: number): HudWeaponRow[] {
  return Array.from({ length: n }, () => ({
    key: '',
    level: 0,
    evolved: false,
    evolutionKey: '',
    cooldownFrac: 0,
  }));
}

function weapon(
  key: string,
  level: number,
  cooldownMs: number,
  cooldownRemaining: number,
  evolved = false,
  evolutionKey = '',
) {
  return {
    config: { key },
    level,
    evolved,
    evolutionKey,
    cooldownMs,
    cooldownRemaining,
  } as never;
}

describe('updateHudWeaponRows', () => {
  it('copies weapon fields into the scratch rows and returns count written', () => {
    const rows = makeRows(4);
    const n = updateHudWeaponRows(rows, [
      weapon('thistle_shot', 3, 1000, 250),
      weapon('claymore', 5, 2000, 0, true, 'legendary_claymore'),
    ]);
    expect(n).toBe(2);
    expect(rows[0]).toEqual({
      key: 'thistle_shot',
      level: 3,
      evolved: false,
      evolutionKey: '',
      cooldownFrac: 0.75, // 1 - 250/1000
    });
    expect(rows[1]).toEqual({
      key: 'claymore',
      level: 5,
      evolved: true,
      evolutionKey: 'legendary_claymore',
      cooldownFrac: 1, // just off cooldown
    });
  });

  it('caps output at rows.length when there are more weapons', () => {
    const rows = makeRows(2);
    const n = updateHudWeaponRows(rows, [
      weapon('a', 1, 100, 0),
      weapon('b', 1, 100, 0),
      weapon('c', 1, 100, 0),
    ]);
    expect(n).toBe(2); // third weapon silently dropped
  });

  it('returns 0 when there are no weapons', () => {
    const rows = makeRows(4);
    const n = updateHudWeaponRows(rows, []);
    expect(n).toBe(0);
  });

  it('guards against zero cooldown (division-by-zero) via max(cd, 1)', () => {
    const rows = makeRows(1);
    updateHudWeaponRows(rows, [weapon('x', 1, 0, 0)]);
    expect(rows[0].cooldownFrac).toBe(1); // 1 - 0/1 clamped to [0,1]
  });

  it('clamps cooldownFrac to [0, 1] even with malformed remaining', () => {
    const rows = makeRows(2);
    updateHudWeaponRows(rows, [
      weapon('a', 1, 1000, -500), // should clamp to 1
      weapon('b', 1, 1000, 2000), // should clamp to 0
    ]);
    expect(rows[0].cooldownFrac).toBe(1);
    expect(rows[1].cooldownFrac).toBe(0);
  });
});
