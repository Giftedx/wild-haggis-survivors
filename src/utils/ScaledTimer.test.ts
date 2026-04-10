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

  it('advances by delta * timeScale', () => {
    const t = new ScaledTimer();
    t.start(1000);
    t.tick(200, 0.5);
    expect(t.getRemainingMs()).toBe(900);
    t.tick(1000, 1);
    expect(t.getRemainingMs()).toBe(0);
    expect(t.isActive()).toBe(false);
  });
});

