import { describe, it, expect } from 'vitest';
import { buildPauseStatsLines, type PauseStatsInput } from './pauseStats';

function base(overrides: Partial<PauseStatsInput> = {}): PauseStatsInput {
  return {
    timeSec: 0,
    killCount: 0,
    level: 1,
    weaponCount: 1,
    passiveCount: 0,
    ...overrides,
  };
}

describe('buildPauseStatsLines — required lines', () => {
  it('always emits the first 3 lines (time, kills+level, loadout)', () => {
    const lines = buildPauseStatsLines(base());
    expect(lines).toHaveLength(3);
  });

  it('formats time as M:SS (zero-padded seconds)', () => {
    expect(buildPauseStatsLines(base({ timeSec: 65 }))[0]).toContain('1:05');
    expect(buildPauseStatsLines(base({ timeSec: 9 }))[0]).toContain('0:09');
  });

  it('clamps negative timeSec to 0', () => {
    expect(buildPauseStatsLines(base({ timeSec: -10 }))[0]).toContain('0:00');
  });

  it('floors fractional timeSec', () => {
    expect(buildPauseStatsLines(base({ timeSec: 59.9 }))[0]).toContain('0:59');
  });
});

describe('buildPauseStatsLines — optional lines', () => {
  it('includes the gold line only when runGold > 0', () => {
    expect(buildPauseStatsLines(base()).length).toBe(3);
    expect(buildPauseStatsLines(base({ runGold: 0 })).length).toBe(3);
    expect(buildPauseStatsLines(base({ runGold: 10 })).length).toBe(4);
  });

  it('includes the dps line only when dps > 0', () => {
    expect(buildPauseStatsLines(base({ dps: 0 })).length).toBe(3);
    expect(buildPauseStatsLines(base({ dps: 25 })).length).toBe(4);
  });

  it('includes the damage line only when dmgDealt > 0', () => {
    expect(buildPauseStatsLines(base({ dmgDealt: 0 })).length).toBe(3);
    expect(buildPauseStatsLines(base({ dmgDealt: 500 })).length).toBe(4);
  });

  it('includes the streak line when best >= 2 OR current >= 2', () => {
    // Below threshold — no streak line.
    expect(buildPauseStatsLines(base({ streak: { current: 1, best: 1 } })).length).toBe(3);
    // Best at threshold — show.
    expect(buildPauseStatsLines(base({ streak: { current: 1, best: 2 } })).length).toBe(4);
    // Current at threshold — show.
    expect(buildPauseStatsLines(base({ streak: { current: 2, best: 1 } })).length).toBe(4);
  });

  it('omits streak when undefined', () => {
    expect(buildPauseStatsLines(base()).length).toBe(3);
  });

  it('emits all four optional lines when every threshold is met', () => {
    const lines = buildPauseStatsLines(base({
      runGold: 100,
      dps: 42,
      dmgDealt: 5_000,
      streak: { current: 5, best: 10 },
    }));
    // 3 required + 4 optional = 7
    expect(lines).toHaveLength(7);
  });

  it('omits the act line for act 1 (default state)', () => {
    expect(buildPauseStatsLines(base({ currentAct: 1 })).length).toBe(3);
  });

  it('includes the act line for act 2 and 3', () => {
    const a2 = buildPauseStatsLines(base({ currentAct: 2 }));
    expect(a2.length).toBe(4);
    expect(a2[3]).toContain('2');
    const a3 = buildPauseStatsLines(base({ currentAct: 3 }));
    expect(a3.length).toBe(4);
    expect(a3[3]).toContain('3');
  });

  it('omits routes line when no picks resolved', () => {
    expect(buildPauseStatsLines(base({ routeLabels: [] })).length).toBe(3);
  });

  it('joins resolved route labels with commas', () => {
    const lines = buildPauseStatsLines(base({
      routeLabels: ['Up the Brae', 'Through the Kirkyard'],
    }));
    expect(lines.length).toBe(4);
    expect(lines[3]).toContain('Up the Brae');
    expect(lines[3]).toContain('Through the Kirkyard');
  });

  it('omits relics line when sporran empty', () => {
    expect(buildPauseStatsLines(base({ relicLabels: [] })).length).toBe(3);
  });

  it('joins held relic labels with commas', () => {
    const lines = buildPauseStatsLines(base({
      relicLabels: ['Sporran o\' Holding', 'Bronze Clasp'],
    }));
    expect(lines.length).toBe(4);
    expect(lines[3]).toContain('Sporran o\' Holding');
    expect(lines[3]).toContain('Bronze Clasp');
  });

  it('produces lines in a stable order (time, mid, loadout, gold, dps, dmg, streak)', () => {
    const lines = buildPauseStatsLines(base({
      timeSec: 120,
      killCount: 50,
      level: 3,
      weaponCount: 2,
      passiveCount: 1,
      runGold: 42,
      dps: 30,
      dmgDealt: 1000,
      streak: { current: 5, best: 8 },
    }));
    // Rough order check via numeric needles.
    expect(lines[0]).toContain('2:00');  // time
    expect(lines[1]).toContain('50');    // kills
    expect(lines[1]).toContain('3');     // level
    expect(lines[2]).toContain('2');     // weapons
    expect(lines[3]).toContain('42');    // gold
    expect(lines[4]).toContain('30');    // dps
    expect(lines[5]).toContain('1000');  // dmg
    expect(lines[6]).toContain('5');     // streak current
  });
});

describe('buildPauseStatsLines — variant + runes radiator (T402 follow-up)', () => {
  it('emits a variant line when a variant label is supplied', () => {
    const lines = buildPauseStatsLines(base({ variantLabel: 'Cailleach' }));
    expect(lines.length).toBe(4);
    const variantLine = lines.find((l) => l.includes('Cailleach'));
    expect(variantLine).toBeDefined();
  });

  it('omits the variant line when the label is undefined or empty', () => {
    expect(buildPauseStatsLines(base()).length).toBe(3);
    expect(buildPauseStatsLines(base({ variantLabel: '' })).length).toBe(3);
  });

  it('emits a runes line when at least one rune is owned', () => {
    const lines = buildPauseStatsLines(base({
      runeLabels: ['Stormcrow', 'Brackenheart'],
    }));
    expect(lines.length).toBe(4);
    const runesLine = lines.find((l) => l.includes('Stormcrow') && l.includes('Brackenheart'));
    expect(runesLine).toBeDefined();
    expect(runesLine).toContain(',');
  });

  it('omits the runes line when no runes are owned', () => {
    expect(buildPauseStatsLines(base({ runeLabels: [] })).length).toBe(3);
  });

  it('orders the radiator as variant → act → routes → relics → runes', () => {
    const lines = buildPauseStatsLines(base({
      variantLabel: 'Cailleach',
      currentAct: 3,
      routeLabels: ['Up the Brae'],
      relicLabels: ['Whisky Dram'],
      runeLabels: ['Stormcrow'],
    }));
    // 3 base lines + 5 radiator lines = 8 total
    expect(lines.length).toBe(8);
    expect(lines[3]).toContain('Cailleach');
    expect(lines[4]).toContain('3');
    expect(lines[5]).toContain('Up the Brae');
    expect(lines[6]).toContain('Whisky Dram');
    expect(lines[7]).toContain('Stormcrow');
  });
});
