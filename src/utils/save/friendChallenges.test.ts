import { describe, expect, it } from 'vitest';
import {
  makeChallengeId,
  isChallengeBeaten,
  addChallenge,
  appendAttempt,
  coerceFriendChallenges,
  type FriendChallengeRecord,
  type FriendChallengeAttempt,
} from './friendChallenges';

function makeRecord(overrides: Partial<FriendChallengeRecord> = {}): FriendChallengeRecord {
  return {
    id: 'abc123-classic-clean-300',
    seed: 0xabc123,
    variantKey: 'classic',
    curseKey: null,
    targetTimeSec: 300,
    targetOutcome: 'victory',
    receivedAt: 1700000000,
    attempts: [],
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<FriendChallengeAttempt> = {}): FriendChallengeAttempt {
  return { timeSurvivedSec: 180, outcome: 'death', ts: 1700001000, ...overrides };
}

describe('makeChallengeId', () => {
  it('encodes seed as hex and joins fields with dashes', () => {
    expect(makeChallengeId(0xabc123, 'classic', null, 300)).toBe('abc123-classic-clean-300');
  });

  it('replaces null curseKey with "clean"', () => {
    expect(makeChallengeId(1, 'cailleach', null, 600)).toBe('1-cailleach-clean-600');
  });

  it('includes curseKey when present', () => {
    expect(makeChallengeId(1, 'classic', 'heavy_legs', 120)).toBe('1-classic-heavy_legs-120');
  });
});

describe('isChallengeBeaten', () => {
  it('returns false when there are no attempts', () => {
    expect(isChallengeBeaten(makeRecord({ attempts: [] }))).toBe(false);
  });

  it('returns false when best attempt time is less than target', () => {
    const record = makeRecord({
      targetTimeSec: 300,
      attempts: [makeAttempt({ timeSurvivedSec: 280 }), makeAttempt({ timeSurvivedSec: 299 })],
    });
    expect(isChallengeBeaten(record)).toBe(false);
  });

  it('returns true when an attempt exactly equals the target time', () => {
    const record = makeRecord({
      targetTimeSec: 300,
      attempts: [makeAttempt({ timeSurvivedSec: 300 })],
    });
    expect(isChallengeBeaten(record)).toBe(true);
  });

  it('returns true when an attempt exceeds the target time', () => {
    const record = makeRecord({
      targetTimeSec: 300,
      attempts: [makeAttempt({ timeSurvivedSec: 450 })],
    });
    expect(isChallengeBeaten(record)).toBe(true);
  });

  it('returns true when any attempt in a mixed set clears the target', () => {
    const record = makeRecord({
      targetTimeSec: 300,
      attempts: [
        makeAttempt({ timeSurvivedSec: 200 }),
        makeAttempt({ timeSurvivedSec: 301 }),
        makeAttempt({ timeSurvivedSec: 150 }),
      ],
    });
    expect(isChallengeBeaten(record)).toBe(true);
  });
});

describe('addChallenge', () => {
  it('appends a new record when the list is empty', () => {
    const result = addChallenge([], makeRecord());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc123-classic-clean-300');
  });

  it('deduplicates by ID — same ID is not added twice', () => {
    const existing = [makeRecord()];
    const result = addChallenge(existing, makeRecord());
    expect(result).toHaveLength(1);
  });

  it('allows records with different IDs', () => {
    const existing = [makeRecord({ id: 'aaa' })];
    const result = addChallenge(existing, makeRecord({ id: 'bbb' }));
    expect(result).toHaveLength(2);
  });

  it('caps the list at 20 entries (MAX_CHALLENGES), dropping oldest', () => {
    const existing: FriendChallengeRecord[] = Array.from({ length: 20 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = addChallenge(existing, makeRecord({ id: 'new' }));
    expect(result).toHaveLength(20);
    expect(result[result.length - 1].id).toBe('new');
    expect(result.some((r) => r.id === 'rec-0')).toBe(false);
  });
});

describe('appendAttempt', () => {
  it('appends an attempt to the matching record', () => {
    const challenges = [makeRecord({ id: 'target', attempts: [] })];
    const result = appendAttempt(challenges, 'target', makeAttempt({ timeSurvivedSec: 250 }));
    expect(result[0].attempts).toHaveLength(1);
    expect(result[0].attempts[0].timeSurvivedSec).toBe(250);
  });

  it('does not modify non-matching records', () => {
    const challenges = [makeRecord({ id: 'other', attempts: [] }), makeRecord({ id: 'target', attempts: [] })];
    const result = appendAttempt(challenges, 'target', makeAttempt());
    expect(result[0].attempts).toHaveLength(0);
    expect(result[1].attempts).toHaveLength(1);
  });

  it('caps attempts at 10 per record (MAX_ATTEMPTS_PER_CHALLENGE), dropping oldest', () => {
    const attempts: FriendChallengeAttempt[] = Array.from({ length: 10 }, (_, i) =>
      makeAttempt({ timeSurvivedSec: i * 10, ts: 1700000000 + i }),
    );
    const challenges = [makeRecord({ id: 'target', attempts })];
    const result = appendAttempt(challenges, 'target', makeAttempt({ timeSurvivedSec: 999 }));
    expect(result[0].attempts).toHaveLength(10);
    expect(result[0].attempts[result[0].attempts.length - 1].timeSurvivedSec).toBe(999);
    expect(result[0].attempts[0].timeSurvivedSec).toBe(10);
  });
});

describe('coerceFriendChallenges', () => {
  it('returns empty array when input is not an array', () => {
    expect(coerceFriendChallenges(null)).toEqual([]);
    expect(coerceFriendChallenges(42)).toEqual([]);
    expect(coerceFriendChallenges('string')).toEqual([]);
    expect(coerceFriendChallenges({})).toEqual([]);
  });

  it('parses a well-formed record', () => {
    const raw = [
      {
        id: 'abc-classic-clean-300',
        seed: 700579,
        variantKey: 'classic',
        curseKey: null,
        targetTimeSec: 300,
        targetOutcome: 'victory',
        receivedAt: 1700000000,
        attempts: [],
      },
    ];
    const result = coerceFriendChallenges(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc-classic-clean-300');
    expect(result[0].curseKey).toBeNull();
  });

  it('drops records missing required fields', () => {
    const raw = [
      { seed: 1, variantKey: 'classic' },
      { id: 'ok', seed: 2, variantKey: 'classic', curseKey: null, targetTimeSec: 100, targetOutcome: 'death', receivedAt: 1 },
    ];
    const result = coerceFriendChallenges(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ok');
  });

  it('floors floating-point seed and targetTimeSec', () => {
    const raw = [{
      id: 'x', seed: 1.9, variantKey: 'classic', curseKey: null,
      targetTimeSec: 300.7, targetOutcome: 'victory', receivedAt: 1,
    }];
    const result = coerceFriendChallenges(raw);
    expect(result[0].seed).toBe(1);
    expect(result[0].targetTimeSec).toBe(300);
  });

  it('drops invalid attempt entries within a valid record', () => {
    const raw = [{
      id: 'x', seed: 1, variantKey: 'classic', curseKey: null,
      targetTimeSec: 300, targetOutcome: 'victory', receivedAt: 1,
      attempts: [
        { timeSurvivedSec: 200, outcome: 'death', ts: 1700000001 },
        { timeSurvivedSec: -5, outcome: 'death', ts: 1700000002 },
        { outcome: 'victory', ts: 1700000003 },
      ],
    }];
    const result = coerceFriendChallenges(raw);
    expect(result[0].attempts).toHaveLength(1);
    expect(result[0].attempts[0].timeSurvivedSec).toBe(200);
  });

  it('preserves null curseKey and rejects empty-string curseKey as null', () => {
    const withNull = [{ id: 'a', seed: 1, variantKey: 'classic', curseKey: null, targetTimeSec: 60, targetOutcome: 'death', receivedAt: 1 }];
    expect(coerceFriendChallenges(withNull)[0].curseKey).toBeNull();

    const withCurse = [{ id: 'b', seed: 2, variantKey: 'classic', curseKey: 'heavy_legs', targetTimeSec: 60, targetOutcome: 'death', receivedAt: 1 }];
    expect(coerceFriendChallenges(withCurse)[0].curseKey).toBe('heavy_legs');
  });
});
