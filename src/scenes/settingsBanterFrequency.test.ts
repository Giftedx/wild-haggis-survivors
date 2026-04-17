import { describe, it, expect } from 'vitest';
import {
  BANTER_FREQUENCY_ORDER,
  BANTER_CHIP_OFF,
  BANTER_CHIP_ON,
  banterChipStyle,
  cycleBanterFrequency,
  labelForBanterFrequency,
  type BanterFrequency,
} from './settingsBanterFrequency';

describe('BANTER_FREQUENCY_ORDER', () => {
  it('goes least-to-most chatty', () => {
    expect(BANTER_FREQUENCY_ORDER).toEqual(['off', 'sparing', 'normal', 'chatty']);
  });
});

describe('labelForBanterFrequency', () => {
  it('returns non-empty copy for every frequency', () => {
    for (const f of BANTER_FREQUENCY_ORDER) {
      const label = labelForBanterFrequency(f);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/^ui\.settings\.banter_/);
    }
  });

  it('produces distinct labels across frequencies', () => {
    const s = new Set(BANTER_FREQUENCY_ORDER.map(labelForBanterFrequency));
    expect(s.size).toBe(BANTER_FREQUENCY_ORDER.length);
  });
});

describe('cycleBanterFrequency', () => {
  it('advances one step at each position', () => {
    for (let i = 0; i < BANTER_FREQUENCY_ORDER.length; i++) {
      const expected = BANTER_FREQUENCY_ORDER[(i + 1) % BANTER_FREQUENCY_ORDER.length];
      expect(cycleBanterFrequency(BANTER_FREQUENCY_ORDER[i])).toBe(expected);
    }
  });

  it('chatty wraps back to off', () => {
    expect(cycleBanterFrequency('chatty')).toBe('off');
  });

  it('full cycle returns to start', () => {
    let cur: BanterFrequency = 'off';
    for (let i = 0; i < BANTER_FREQUENCY_ORDER.length; i++) {
      cur = cycleBanterFrequency(cur);
    }
    expect(cur).toBe('off');
  });

  it('unknown input lands on the first entry next', () => {
    expect(cycleBanterFrequency('bogus' as BanterFrequency)).toBe(BANTER_FREQUENCY_ORDER[0]);
  });
});

describe('banterChipStyle', () => {
  it('off renders in the muted grey palette', () => {
    expect(banterChipStyle('off')).toEqual(BANTER_CHIP_OFF);
  });

  it('every non-off frequency renders in the active palette', () => {
    expect(banterChipStyle('sparing')).toEqual(BANTER_CHIP_ON);
    expect(banterChipStyle('normal')).toEqual(BANTER_CHIP_ON);
    expect(banterChipStyle('chatty')).toEqual(BANTER_CHIP_ON);
  });

  it('off and on palettes are distinct (visual contrast guaranteed)', () => {
    expect(BANTER_CHIP_OFF).not.toEqual(BANTER_CHIP_ON);
  });
});
