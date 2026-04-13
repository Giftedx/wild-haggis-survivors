import { describe, expect, it } from 'vitest';
import {
  DeathCauseTracker,
  HAZARD_SOURCE_KEY,
  MAX_DAMAGE_EVENTS,
  type DamageEvent,
} from './DeathCauseTracker';

function event(overrides: Partial<DamageEvent> = {}): DamageEvent {
  return {
    gameTimeSec: 10,
    sourceKey: 'tourist',
    amount: 2,
    sourceIsBoss: false,
    sourceIsElite: false,
    sourceIsHazard: false,
    hpAfter: 80,
    maxHpAfter: 100,
    ...overrides,
  };
}

describe('DeathCauseTracker', () => {
  it('resets to empty buffer and records provided game time as healthy pointer', () => {
    const t = new DeathCauseTracker();
    t.recordDamage(event({ hpAfter: 10, maxHpAfter: 100 }));
    t.reset(42);
    const snap = t.snapshot();
    expect(snap.events).toHaveLength(0);
    expect(snap.lastHealthyAtSec).toBe(42);
  });

  it('buffer never grows beyond MAX_DAMAGE_EVENTS — FIFO drops oldest', () => {
    const t = new DeathCauseTracker();
    t.reset(0);
    // Feed MAX+5 events with distinct source keys so we can check ordering.
    for (let i = 0; i < MAX_DAMAGE_EVENTS + 5; i++) {
      t.recordDamage(event({ sourceKey: `k${i}`, gameTimeSec: i }));
    }
    const snap = t.snapshot();
    expect(snap.events).toHaveLength(MAX_DAMAGE_EVENTS);
    // Oldest 5 dropped — first remaining should be k5.
    expect(snap.events[0].sourceKey).toBe('k5');
    expect(snap.events[snap.events.length - 1].sourceKey).toBe(`k${MAX_DAMAGE_EVENTS + 4}`);
  });

  it('recordDamage advances healthy pointer when post-hit HP is >= 30%', () => {
    const t = new DeathCauseTracker();
    t.reset(0);
    t.recordDamage(event({ gameTimeSec: 5, hpAfter: 70, maxHpAfter: 100 }));
    expect(t.snapshot().lastHealthyAtSec).toBe(5);
    t.recordDamage(event({ gameTimeSec: 7, hpAfter: 30, maxHpAfter: 100 })); // exactly 30% = healthy
    expect(t.snapshot().lastHealthyAtSec).toBe(7);
  });

  it('recordDamage does NOT advance healthy pointer when HP drops below 30%', () => {
    const t = new DeathCauseTracker();
    t.reset(1);
    t.recordDamage(event({ gameTimeSec: 4, hpAfter: 20, maxHpAfter: 100 }));
    expect(t.snapshot().lastHealthyAtSec).toBe(1);
  });

  it('tickHealthyPointer updates pointer each frame while player is healthy', () => {
    const t = new DeathCauseTracker();
    t.reset(0);
    t.tickHealthyPointer(12, 80, 100);
    expect(t.snapshot().lastHealthyAtSec).toBe(12);
    // Wound the player — tick should no longer advance the pointer.
    t.tickHealthyPointer(15, 20, 100);
    expect(t.snapshot().lastHealthyAtSec).toBe(12);
    // Heal — pointer advances again.
    t.tickHealthyPointer(18, 60, 100);
    expect(t.snapshot().lastHealthyAtSec).toBe(18);
  });

  it('tickHealthyPointer is safe when maxHp is zero (defensive divide-by-zero guard)', () => {
    const t = new DeathCauseTracker();
    t.reset(0);
    t.tickHealthyPointer(5, 0, 0);
    expect(t.snapshot().lastHealthyAtSec).toBe(0);
  });

  it('hazard events are preserved verbatim in the buffer', () => {
    const t = new DeathCauseTracker();
    t.reset(0);
    t.recordDamage(event({
      sourceKey: HAZARD_SOURCE_KEY,
      sourceIsHazard: true,
      gameTimeSec: 3,
      amount: 3,
      hpAfter: 10,
      maxHpAfter: 100,
    }));
    const last = t.snapshot().events[0];
    expect(last.sourceIsHazard).toBe(true);
    expect(last.sourceKey).toBe(HAZARD_SOURCE_KEY);
  });
});
