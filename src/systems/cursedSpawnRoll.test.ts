import { describe, it, expect } from 'vitest';
import { shouldMarkCursed } from './cursedSpawnRoll';

describe('shouldMarkCursed', () => {
  const baseCtx = {
    cursedChance: 0.2,
    isElite: false,
    behavior: 'chase' as const,
    packSize: 1,
    rng01: 0.1,
  };

  it('never curses when chance is 0', () => {
    expect(shouldMarkCursed({ ...baseCtx, cursedChance: 0, rng01: 0 })).toBe(false);
    expect(shouldMarkCursed({ ...baseCtx, cursedChance: 0, rng01: 0.99 })).toBe(false);
  });

  it('curses when rng falls inside the chance band', () => {
    expect(shouldMarkCursed({ ...baseCtx, cursedChance: 0.4, rng01: 0.39 })).toBe(true);
  });

  it('does not curse when rng falls outside the chance band', () => {
    expect(shouldMarkCursed({ ...baseCtx, cursedChance: 0.4, rng01: 0.41 })).toBe(false);
    expect(shouldMarkCursed({ ...baseCtx, cursedChance: 0.4, rng01: 0.40 })).toBe(false);
  });

  it('skips elites — never stacks cursed on top of elite', () => {
    expect(shouldMarkCursed({ ...baseCtx, isElite: true, rng01: 0 })).toBe(false);
  });

  it('skips hazards', () => {
    expect(shouldMarkCursed({ ...baseCtx, behavior: 'hazard', rng01: 0 })).toBe(false);
  });

  it('skips pack members', () => {
    expect(shouldMarkCursed({ ...baseCtx, packSize: 5, rng01: 0 })).toBe(false);
  });
});
