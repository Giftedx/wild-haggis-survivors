import { describe, expect, it } from 'vitest';
import { ScaledTimer } from './ScaledTimer';

describe('ScaledTimer', () => {
  it('does not advance when timeScale is 0', () => {
    const t = new ScaledTimer();
    t.start(1000);
    t.tick(500, 0);
    expect(t.getRemainingMs()).toBe(1000);
    expect(t.isActive()).toBe(true);
  });

  it('does not advance when timeScale is negative', () => {
    const t = new ScaledTimer();
    t.start(1000);
    t.tick(500, -0.5);
    expect(t.getRemainingMs()).toBe(1000);
  });

  it('tick is a no-op when timer is inactive', () => {
    const t = new ScaledTimer();
    t.tick(10_000, 1);
    expect(t.getRemainingMs()).toBe(0);
    expect(t.isActive()).toBe(false);
  });

  it('advances by delta * timeScale', () => {
    const t = new ScaledTimer();
    t.start(1000);
    t.tick(200, 0.5);
    expect(t.getRemainingMs()).toBe(900);
    t.tick(1000, 1);
    expect(t.getRemainingMs()).toBe(0);
    expect(t.isActive()).toBe(false);
  });

  it('ignores negative or non-finite deltas', () => {
    // A corrupted frame must never make a countdown tick backward into
    // an arbitrarily-large future — that would strand the player in a
    // state that never expires (e.g. permanent slow motion).
    const t = new ScaledTimer();
    t.start(1000);
    t.tick(-100, 1);
    expect(t.getRemainingMs()).toBe(1000);
    t.tick(NaN, 1);
    expect(t.getRemainingMs()).toBe(1000);
    t.tick(Infinity, 1);
    expect(t.getRemainingMs()).toBe(1000);
    t.tick(0, 1);
    expect(t.getRemainingMs()).toBe(1000);
  });

  it('stop() clears an active countdown', () => {
    const t = new ScaledTimer();
    t.start(800);
    t.stop();
    expect(t.isActive()).toBe(false);
    expect(t.getRemainingMs()).toBe(0);
  });

  it('start clamps non-positive duration to inactive', () => {
    const t = new ScaledTimer();
    t.start(0);
    expect(t.isActive()).toBe(false);
    t.start(-50);
    expect(t.isActive()).toBe(false);
  });
});

