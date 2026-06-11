import { describe, it, expect } from 'vitest';
import { resolveDailyStateDisplay } from './dailyMenuState';
import type { DailyChallengeState } from '../core/SaveManager';

function record(overrides: Partial<DailyChallengeState> = {}): DailyChallengeState {
  return {
    dateKey: '2026-04-17',
    bestTimeSec: 0,
    bestEnemiesKilled: 0,
    attempts: 0,
    completedVictory: false,
    ...overrides,
  };
}

describe('resolveDailyStateDisplay', () => {
  it('emits "fresh" when there is no recorded state at all', () => {
    const result = resolveDailyStateDisplay({
      todayKey: '2026-04-17',
      seed: 12345,
      seedCode: 'ABC-123',
      recorded: null,
    });
    expect(result.seed).toBe(12345);
    expect(result.completed).toBe(false);
    // Subtitle should reference the code; the exact wording is an i18n string.
    expect(result.subtitle).toContain('ABC-123');
  });

  it('emits "fresh" when the recorded state is from a prior day', () => {
    const result = resolveDailyStateDisplay({
      todayKey: '2026-04-17',
      seed: 7,
      seedCode: 'XYZ-777',
      recorded: record({ dateKey: '2026-04-16', completedVictory: true, attempts: 3 }),
    });
    // Stale record is ignored — today is a fresh attempt.
    expect(result.completed).toBe(false);
    expect(result.subtitle).toContain('XYZ-777');
  });

  it('emits "cleared" when today\'s record shows a completed victory', () => {
    const result = resolveDailyStateDisplay({
      todayKey: '2026-04-17',
      seed: 42,
      seedCode: 'CLR-042',
      recorded: record({ dateKey: '2026-04-17', completedVictory: true, attempts: 2 }),
    });
    expect(result.completed).toBe(true);
    expect(result.subtitle).toContain('CLR-042');
  });

  it('emits "attempts" when today\'s record is incomplete', () => {
    const result = resolveDailyStateDisplay({
      todayKey: '2026-04-17',
      seed: 99,
      seedCode: 'TRY-099',
      recorded: record({ dateKey: '2026-04-17', completedVictory: false, attempts: 4 }),
    });
    expect(result.completed).toBe(false);
    expect(result.subtitle).toContain('TRY-099');
    // Attempts count should surface in the subtitle.
    expect(result.subtitle).toContain('4');
  });

  it('always echoes the input seed unchanged', () => {
    const cases = [
      { recorded: null },
      { recorded: record({ dateKey: '2026-04-17', completedVictory: true }) },
      { recorded: record({ dateKey: '2026-04-17', attempts: 1 }) },
      { recorded: record({ dateKey: '2020-01-01' }) }, // stale
    ];
    for (const { recorded } of cases) {
      const result = resolveDailyStateDisplay({
        todayKey: '2026-04-17',
        seed: 100,
        seedCode: 'SEED',
        recorded,
      });
      expect(result.seed).toBe(100);
    }
  });

  it('completed=true happens only on today+victory, never on stale-victory', () => {
    const stale = resolveDailyStateDisplay({
      todayKey: '2026-04-17',
      seed: 1,
      seedCode: 'S',
      recorded: record({ dateKey: '2026-04-15', completedVictory: true }),
    });
    expect(stale.completed).toBe(false);
  });
});

describe('resolveDailySubtitleColor', () => {
  it('completed returns the mint green', async () => {
    const {
      resolveDailySubtitleColor,
      DAILY_SUBTITLE_COLOR_COMPLETED,
    } = await import('./dailyMenuState');
    expect(resolveDailySubtitleColor(true)).toBe(DAILY_SUBTITLE_COLOR_COMPLETED);
    expect(DAILY_SUBTITLE_COLOR_COMPLETED).toBe('#9de6a8');
  });

  it('pending returns the warm gold', async () => {
    const {
      resolveDailySubtitleColor,
      DAILY_SUBTITLE_COLOR_PENDING,
    } = await import('./dailyMenuState');
    expect(resolveDailySubtitleColor(false)).toBe(DAILY_SUBTITLE_COLOR_PENDING);
    expect(DAILY_SUBTITLE_COLOR_PENDING).toBe('#e2c97a');
  });

  it('completed and pending colours differ (reads the outcome)', async () => {
    const {
      DAILY_SUBTITLE_COLOR_COMPLETED,
      DAILY_SUBTITLE_COLOR_PENDING,
    } = await import('./dailyMenuState');
    expect(DAILY_SUBTITLE_COLOR_COMPLETED).not.toBe(DAILY_SUBTITLE_COLOR_PENDING);
  });
});
