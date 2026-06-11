import { describe, it, expect } from 'vitest';
import { canOpenPauseMenu, PAUSE_BLOCKING_TOKENS } from './pauseGate';

/** Build a `has(token)` predicate from a set of currently-held tokens. */
function heldTokens(...tokens: string[]): (t: string) => boolean {
  const set = new Set(tokens);
  return (t) => set.has(t);
}

describe('canOpenPauseMenu', () => {
  it('returns true when no blocking tokens are held', () => {
    expect(canOpenPauseMenu(heldTokens())).toBe(true);
  });

  it('returns true when only UI_PAUSE is held (pause menu itself)', () => {
    // UI_PAUSE is NOT in the block list — it's the thing being toggled.
    expect(canOpenPauseMenu(heldTokens('UI_PAUSE'))).toBe(true);
  });

  it('returns false while the level-up modal owns time', () => {
    expect(canOpenPauseMenu(heldTokens('LEVEL_UP'))).toBe(false);
  });

  it('returns false while the countdown is running', () => {
    expect(canOpenPauseMenu(heldTokens('COUNTDOWN'))).toBe(false);
  });

  it('returns false during the run-end ceremony', () => {
    expect(canOpenPauseMenu(heldTokens('RUN_END'))).toBe(false);
  });

  it('returns false while an FTUE tutorial overlay holds time', () => {
    expect(canOpenPauseMenu(heldTokens('TUTORIAL_MOVE'))).toBe(false);
    expect(canOpenPauseMenu(heldTokens('TUTORIAL_GEM'))).toBe(false);
  });

  it('returns false for every token in the blocking set (explicit sweep)', () => {
    for (const token of PAUSE_BLOCKING_TOKENS) {
      expect(canOpenPauseMenu(heldTokens(token))).toBe(false);
    }
  });

  it('multiple blocking tokens still block', () => {
    expect(canOpenPauseMenu(heldTokens('LEVEL_UP', 'RUN_END'))).toBe(false);
  });

  it('unrelated tokens do not affect the gate', () => {
    expect(canOpenPauseMenu(heldTokens('ACT_INTERMISSION', 'SCENE_FADE'))).toBe(true);
  });
});

describe('PAUSE_BLOCKING_TOKENS', () => {
  it('includes the four level-ceremony tokens plus two tutorial tokens', () => {
    expect(new Set(PAUSE_BLOCKING_TOKENS)).toEqual(
      new Set(['LEVEL_UP', 'COUNTDOWN', 'RUN_END', 'TUTORIAL_MOVE', 'TUTORIAL_GEM']),
    );
  });

  it('does NOT include UI_PAUSE (would create deadlock — can\'t toggle off)', () => {
    expect(PAUSE_BLOCKING_TOKENS).not.toContain('UI_PAUSE');
  });
});
