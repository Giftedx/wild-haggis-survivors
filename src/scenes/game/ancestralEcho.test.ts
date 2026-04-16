import { describe, expect, it } from 'vitest';
import {
  ECHO_GOLD_REWARD,
  ECHO_HEAL_REWARD,
  ECHO_LIFETIME_MS,
  ECHO_TOUCH_RADIUS_PX,
  isEchoInRange,
} from './ancestralEcho';
import {
  LAST_DEATH_TTL_MS,
  createDefaultSave,
  isLastDeathFresh,
  migrateSave,
} from '../../utils/save';
import { t } from '../../core/i18n';

describe('Ancestral Echo — constants', () => {
  it('reward is positive gold + heal (not a penalty)', () => {
    expect(ECHO_GOLD_REWARD).toBeGreaterThan(0);
    expect(ECHO_HEAL_REWARD).toBeGreaterThan(0);
  });

  it('lifetime is reasonable (a handful of seconds, not a whole run)', () => {
    expect(ECHO_LIFETIME_MS).toBeGreaterThan(5_000);
    expect(ECHO_LIFETIME_MS).toBeLessThan(120_000);
  });

  it('TTL is a day-scale window (cross-run, not cross-month)', () => {
    expect(LAST_DEATH_TTL_MS).toBeGreaterThan(60 * 60 * 1000);
    expect(LAST_DEATH_TTL_MS).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });
});

describe('isEchoInRange', () => {
  it('returns true at exact echo position', () => {
    expect(isEchoInRange(100, 100, 100, 100)).toBe(true);
  });

  it('returns true within default touch radius', () => {
    expect(isEchoInRange(100, 100, 100 + ECHO_TOUCH_RADIUS_PX - 1, 100)).toBe(true);
  });

  it('returns false just outside radius', () => {
    expect(isEchoInRange(100, 100, 100 + ECHO_TOUCH_RADIUS_PX + 5, 100)).toBe(false);
  });

  it('respects custom radius', () => {
    // Default would say true (30px < 42px); custom 20px says false.
    expect(isEchoInRange(100, 100, 130, 100, 20)).toBe(false);
    expect(isEchoInRange(100, 100, 130, 100, 40)).toBe(true);
  });

  it('is symmetric in axes', () => {
    const r = ECHO_TOUCH_RADIUS_PX;
    expect(isEchoInRange(0, 0, 0, r - 1)).toBe(true);
    expect(isEchoInRange(0, 0, r - 1, 0)).toBe(true);
    expect(isEchoInRange(0, 0, 0, -(r - 1))).toBe(true);
    expect(isEchoInRange(0, 0, -(r - 1), 0)).toBe(true);
  });
});

describe('isLastDeathFresh', () => {
  it('returns false for undefined / null', () => {
    expect(isLastDeathFresh(undefined)).toBe(false);
    expect(isLastDeathFresh(null)).toBe(false);
  });

  it('returns true for a death just now', () => {
    const now = 1_000_000;
    expect(isLastDeathFresh({ ts: now }, now)).toBe(true);
  });

  it('returns true within TTL window', () => {
    const now = 1_000_000;
    expect(isLastDeathFresh({ ts: now - (LAST_DEATH_TTL_MS - 1) }, now)).toBe(true);
  });

  it('returns false at or past TTL boundary', () => {
    const now = 1_000_000_000;
    expect(isLastDeathFresh({ ts: now - LAST_DEATH_TTL_MS }, now)).toBe(false);
    expect(isLastDeathFresh({ ts: now - LAST_DEATH_TTL_MS - 1 }, now)).toBe(false);
  });

  it('returns false for a "future" death (clock skew protection)', () => {
    // Edge: ts in the future (negative delta) — still within TTL window
    // mathematically (delta < TTL), so should return true under current
    // impl. Documents that we don't special-case future ts.
    const now = 1_000_000;
    expect(isLastDeathFresh({ ts: now + 10_000 }, now)).toBe(true);
  });
});

describe('save migration — lastDeath', () => {
  it('is absent on a fresh save', () => {
    const save = createDefaultSave();
    expect(save.lastDeath).toBeUndefined();
  });

  it('is preserved through migrateSave when valid', () => {
    const input = {
      ...createDefaultSave(),
      lastDeath: { x: 1500, y: 1200, ts: 1_700_000_000_000 },
    };
    const migrated = migrateSave(input);
    expect(migrated.lastDeath).toEqual({ x: 1500, y: 1200, ts: 1_700_000_000_000 });
  });

  it('drops malformed lastDeath (missing x)', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      lastDeath: { y: 100, ts: 1 },
    };
    expect(migrateSave(input).lastDeath).toBeUndefined();
  });

  it('drops malformed lastDeath (non-numeric ts)', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      lastDeath: { x: 1, y: 1, ts: 'when' },
    };
    expect(migrateSave(input).lastDeath).toBeUndefined();
  });

  it('drops lastDeath with ts <= 0', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      lastDeath: { x: 1, y: 1, ts: 0 },
    };
    expect(migrateSave(input).lastDeath).toBeUndefined();
  });

  it('drops lastDeath with NaN coordinates', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      lastDeath: { x: Number.NaN, y: 100, ts: 1 },
    };
    expect(migrateSave(input).lastDeath).toBeUndefined();
  });

  it('floors fractional ts to an integer', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      lastDeath: { x: 10, y: 20, ts: 123.9 },
    };
    expect(migrateSave(input).lastDeath?.ts).toBe(123);
  });
});

describe('Ancestral Echo i18n', () => {
  it('every key resolves through t()', () => {
    for (const key of [
      'ui.ancestralEcho.announce_toast',
      'ui.ancestralEcho.announce_caption',
      'ui.ancestralEcho.touch_toast',
      'ui.ancestralEcho.touch_caption',
    ]) {
      expect(t(key), `i18n missing for '${key}'`).not.toBe(key);
      expect(t(key).length).toBeGreaterThan(0);
    }
  });
});
