import { describe, it, expect } from 'vitest';
import { resolveKiltPalette } from './kiltPalette';

describe('resolveKiltPalette', () => {
  it('classic variant produces warm rust field', () => {
    const p = resolveKiltPalette('classic');
    expect(p.field).toBe(0xa84828);
  });

  it('laird variant produces blue field', () => {
    const p = resolveKiltPalette('laird');
    expect(p.field).toBe(0x2e6aa8);
  });

  it('glaswegian variant produces orange field', () => {
    const p = resolveKiltPalette('glaswegian');
    expect(p.field).toBe(0xff5a00);
  });

  it('all variants produce 4 distinct colors', () => {
    const variants = [
      'classic', 'iron_belly', 'moor_runner', 'glen_forager',
      'surefoot', 'pipe_breath', 'laird', 'wee_ghostie', 'glaswegian',
    ] as const;
    for (const v of variants) {
      const p = resolveKiltPalette(v);
      const colors = [p.field, p.fieldDark, p.stripe, p.accent];
      for (const c of colors) expect(c).toBeGreaterThan(0);
      expect(p.field).not.toBe(p.fieldDark);
    }
  });

  it('unknown variant falls back to classic', () => {
    const p = resolveKiltPalette('unknown_key' as any);
    const classic = resolveKiltPalette('classic');
    expect(p.field).toBe(classic.field);
  });
});
