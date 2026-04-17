import { describe, expect, it, vi } from 'vitest';
import { RunEndTickers } from './RunEndTickers';

describe('RunEndTickers — victory defer', () => {
  it('does not fire before duration elapses', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryDefer(500, cb);
    t.tick(499);
    expect(cb).not.toHaveBeenCalled();
  });

  it('fires once at exact expiry', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryDefer(500, cb);
    t.tick(500);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('fires when delta overshoots (no skip)', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryDefer(100, cb);
    t.tick(1000); // huge frame
    expect(cb).toHaveBeenCalledOnce();
  });

  it('clears callback after fire — does not re-fire on subsequent ticks', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryDefer(100, cb);
    t.tick(200);
    t.tick(200);
    t.tick(200);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('re-arming overwrites the previous callback', () => {
    const t = new RunEndTickers();
    const first = vi.fn();
    const second = vi.fn();
    t.armVictoryDefer(500, first);
    t.tick(100);
    t.armVictoryDefer(200, second);
    t.tick(200);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});

describe('RunEndTickers — death result overlay', () => {
  it('does nothing when not armed', () => {
    const t = new RunEndTickers();
    expect(() => t.tick(1000)).not.toThrow();
  });

  it('fires after duration elapses', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armDeathResultOverlay(300, cb);
    t.tick(150);
    expect(cb).not.toHaveBeenCalled();
    t.tick(150);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('arming with null callback does nothing on tick', () => {
    const t = new RunEndTickers();
    t.armDeathResultOverlay(100, null);
    expect(() => t.tick(200)).not.toThrow();
  });

  it('arming with null duration cancels a previously armed timer', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armDeathResultOverlay(300, cb);
    t.armDeathResultOverlay(null, null);
    t.tick(500);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not re-fire after firing once', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armDeathResultOverlay(100, cb);
    t.tick(200);
    t.tick(200);
    expect(cb).toHaveBeenCalledOnce();
  });
});

describe('RunEndTickers — victory result overlay', () => {
  it('fires after duration elapses', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryResultOverlay(400, cb);
    t.tick(399);
    expect(cb).not.toHaveBeenCalled();
    t.tick(1);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('cancels via null', () => {
    const t = new RunEndTickers();
    const cb = vi.fn();
    t.armVictoryResultOverlay(400, cb);
    t.armVictoryResultOverlay(null, null);
    t.tick(500);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('RunEndTickers — reset', () => {
  it('clears all three armed timers', () => {
    const t = new RunEndTickers();
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    t.armVictoryDefer(100, a);
    t.armDeathResultOverlay(100, b);
    t.armVictoryResultOverlay(100, c);
    t.reset();
    t.tick(1000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
    expect(c).not.toHaveBeenCalled();
  });
});

describe('RunEndTickers — mutual independence', () => {
  it('victory and death timers fire on separate schedules', () => {
    const t = new RunEndTickers();
    const death = vi.fn();
    const victory = vi.fn();
    t.armDeathResultOverlay(100, death);
    t.armVictoryResultOverlay(300, victory);
    t.tick(150);
    expect(death).toHaveBeenCalledOnce();
    expect(victory).not.toHaveBeenCalled();
    t.tick(200);
    expect(victory).toHaveBeenCalledOnce();
  });
});
