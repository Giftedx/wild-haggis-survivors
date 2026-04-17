import { describe, expect, it, vi } from 'vitest';
import { IFrameController } from './IFrameController';
import type { Player } from '../../entities/Player';

function makePlayer(overrides: Partial<Player> = {}) {
  return {
    active: true,
    clearTint: vi.fn(),
    setAlpha: vi.fn(),
    ...overrides,
  } as unknown as Player;
}

describe('IFrameController', () => {
  it('starts inactive', () => {
    const c = new IFrameController(() => undefined);
    expect(c.isActive()).toBe(false);
  });

  it('arm() makes the window active', () => {
    const c = new IFrameController(() => makePlayer());
    c.arm(500);
    expect(c.isActive()).toBe(true);
  });

  it('tick deactivates after remainingMs elapses', () => {
    const player = makePlayer();
    const c = new IFrameController(() => player);
    c.arm(500);
    c.tick(499);
    expect(c.isActive()).toBe(true);
    c.tick(1);
    expect(c.isActive()).toBe(false);
    expect(player.setAlpha).toHaveBeenCalledWith(1);
  });

  it('tick respects scaledDelta — pause-frozen ticks (delta 0) keep window open', () => {
    const c = new IFrameController(() => makePlayer());
    c.arm(200);
    for (let i = 0; i < 100; i++) c.tick(0);
    expect(c.isActive()).toBe(true);
  });

  it('arm() while active extends with new duration (refreshes generation)', () => {
    const c = new IFrameController(() => makePlayer());
    c.arm(100);
    c.tick(80);
    c.arm(200); // re-arm — the old 20ms remainder is overwritten
    c.tick(199);
    expect(c.isActive()).toBe(true);
    c.tick(1);
    expect(c.isActive()).toBe(false);
  });

  it('does not call setAlpha if player is null at expiry', () => {
    let player: Player | undefined = makePlayer();
    const c = new IFrameController(() => player);
    c.arm(100);
    player = undefined;
    expect(() => c.tick(101)).not.toThrow();
  });

  it('does not call setAlpha if player is inactive at expiry', () => {
    const player = makePlayer({ active: false } as unknown as Partial<Player>);
    const c = new IFrameController(() => player);
    c.arm(100);
    c.tick(101);
    expect(player.setAlpha).not.toHaveBeenCalled();
  });

  it('hit tint clear: armHitTint + tick clears tint at expiry', () => {
    const player = makePlayer();
    const c = new IFrameController(() => player);
    c.armHitTint(80);
    c.tick(40);
    expect(player.clearTint).not.toHaveBeenCalled();
    c.tick(50);
    expect(player.clearTint).toHaveBeenCalledOnce();
  });

  it('hit tint clear is independent from i-frame window', () => {
    const player = makePlayer();
    const c = new IFrameController(() => player);
    c.armHitTint(80);
    c.tick(100);
    expect(c.isActive()).toBe(false);
    expect(player.clearTint).toHaveBeenCalledOnce();
    expect(player.setAlpha).not.toHaveBeenCalled();
  });

  it('hit tint clear: re-arm resets the timer', () => {
    const player = makePlayer();
    const c = new IFrameController(() => player);
    c.armHitTint(80);
    c.tick(70);
    c.armHitTint(80);
    c.tick(70);
    expect(player.clearTint).not.toHaveBeenCalled();
    c.tick(20);
    expect(player.clearTint).toHaveBeenCalledOnce();
  });

  it('reset() clears all state', () => {
    const c = new IFrameController(() => makePlayer());
    c.arm(500);
    c.armHitTint(200);
    c.reset();
    expect(c.isActive()).toBe(false);
    c.tick(1000); // no-op — neither timer should fire
  });

  it('reset() does not call player APIs', () => {
    const player = makePlayer();
    const c = new IFrameController(() => player);
    c.arm(500);
    c.armHitTint(200);
    c.reset();
    expect(player.setAlpha).not.toHaveBeenCalled();
    expect(player.clearTint).not.toHaveBeenCalled();
  });
});
