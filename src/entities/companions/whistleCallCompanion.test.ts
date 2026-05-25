import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WHISTLE_CALL_COOLDOWN_MS,
  DEFAULT_WHISTLE_CALL_DURATION_MS,
  chooseWhistleCallTarget,
  createEmptyWhistleCallSlot,
  isWhistleCallReady,
  tickWhistleCallSlot,
  tryWhistleCall,
  type WhistleCallTargetCandidate,
} from './whistleCallCompanion';

const candidates: readonly WhistleCallTargetCandidate[] = [
  { id: 'far', x: 80, y: 0, alive: true, priority: 1 },
  { id: 'near', x: 20, y: 0, alive: true, priority: 1 },
  { id: 'urgent', x: 70, y: 0, alive: true, priority: 3 },
  { id: 'fallen', x: 5, y: 0, alive: false, priority: 99 },
];

describe('tryWhistleCall', () => {
  it('summons one companion into an empty slot and records cooldown/despawn times', () => {
    const result = tryWhistleCall(createEmptyWhistleCallSlot(), {
      key: 'sheepdog',
      nowMs: 1000,
    });

    expect(result.accepted).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.slot.active).toEqual({
      key: 'sheepdog',
      summonedAtMs: 1000,
      despawnAtMs: 1000 + DEFAULT_WHISTLE_CALL_DURATION_MS,
    });
    expect(result.slot.nextReadyAtMs).toBe(1000 + DEFAULT_WHISTLE_CALL_COOLDOWN_MS);
  });

  it('rejects calls while the one-companion slot is occupied', () => {
    const first = tryWhistleCall(createEmptyWhistleCallSlot(), { key: 'sheepdog', nowMs: 1000 });
    const second = tryWhistleCall(first.slot, { key: 'stoat_scout', nowMs: 2000 });

    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('slot_occupied');
    expect(second.slot).toEqual(first.slot);
  });

  it('rejects calls before cooldown is ready even after the familiar despawns', () => {
    const first = tryWhistleCall(createEmptyWhistleCallSlot(), {
      key: 'sheepdog',
      nowMs: 0,
      durationMs: 1000,
      cooldownMs: 5000,
    });
    const afterDespawn = tickWhistleCallSlot(first.slot, 1000);

    expect(afterDespawn.active).toBeNull();
    expect(isWhistleCallReady(afterDespawn, 4999)).toBe(false);

    const early = tryWhistleCall(afterDespawn, {
      key: 'stoat_scout',
      nowMs: 4999,
      durationMs: 1000,
      cooldownMs: 5000,
    });
    expect(early.accepted).toBe(false);
    expect(early.reason).toBe('cooldown');
    expect(early.slot).toEqual(afterDespawn);
  });
});

describe('tickWhistleCallSlot', () => {
  it('keeps the active familiar until despawn time then clears only the active slot', () => {
    const result = tryWhistleCall(createEmptyWhistleCallSlot(), {
      key: 'eagle',
      nowMs: 100,
      durationMs: 900,
    });

    expect(tickWhistleCallSlot(result.slot, 999).active?.key).toBe('eagle');
    expect(tickWhistleCallSlot(result.slot, 1000)).toEqual({
      active: null,
      nextReadyAtMs: result.slot.nextReadyAtMs,
    });
  });
});

describe('chooseWhistleCallTarget', () => {
  it('prefers higher-priority eligible targets before nearest distance', () => {
    const chosen = chooseWhistleCallTarget({ x: 0, y: 0 }, candidates, { maxRange: 100 });

    expect(chosen?.id).toBe('urgent');
  });

  it('falls back to nearest eligible target for equal priority and ignores dead/out-of-range targets', () => {
    const chosen = chooseWhistleCallTarget({ x: 0, y: 0 }, candidates, { maxRange: 50 });

    expect(chosen?.id).toBe('near');
  });

  it('uses stable input order as the deterministic tie-breaker', () => {
    const tied: readonly WhistleCallTargetCandidate[] = [
      { id: 'first', x: 10, y: 0, alive: true, priority: 2 },
      { id: 'second', x: -10, y: 0, alive: true, priority: 2 },
    ];

    expect(chooseWhistleCallTarget({ x: 0, y: 0 }, tied, { maxRange: 30 })?.id).toBe('first');
  });

  it('returns null when no target is eligible', () => {
    expect(chooseWhistleCallTarget({ x: 0, y: 0 }, candidates, { maxRange: 4 })).toBeNull();
  });
});
