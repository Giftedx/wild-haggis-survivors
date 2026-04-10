import { describe, expect, it, vi } from 'vitest';
import { tickPickupTickers, type PickupTicker } from './pickupTickers';

describe('tickPickupTickers', () => {
  it('does not run expire when ticker was cancelled (simulates collect/destroy)', () => {
    const expire = vi.fn();
    const tickers: PickupTicker[] = [
      { remainingMs: 50, cancelled: true, expire },
    ];
    tickPickupTickers(tickers, 100);
    expect(expire).not.toHaveBeenCalled();
    expect(tickers.length).toBe(0);
  });

  it('fires expire exactly once then removes the ticker', () => {
    const expire = vi.fn();
    const tickers: PickupTicker[] = [
      { remainingMs: 100, cancelled: false, expire },
    ];
    tickPickupTickers(tickers, 40);
    expect(expire).not.toHaveBeenCalled();
    expect(tickers.length).toBe(1);
    tickPickupTickers(tickers, 70);
    expect(expire).toHaveBeenCalledTimes(1);
    expect(tickers.length).toBe(0);
  });

  it('never calls expire if the ticker is never advanced (no orphaned timer)', () => {
    const expire = vi.fn();
    const tickers: PickupTicker[] = [
      { remainingMs: 5000, cancelled: false, expire },
    ];
    expect(expire).not.toHaveBeenCalled();
    expect(tickers.length).toBe(1);
  });

  it('supports multiple distinct pickups independently', () => {
    const a = vi.fn();
    const b = vi.fn();
    const tickers: PickupTicker[] = [
      { remainingMs: 10, cancelled: false, expire: a },
      { remainingMs: 100, cancelled: false, expire: b },
    ];
    tickPickupTickers(tickers, 20);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    expect(tickers.length).toBe(1);
    tickPickupTickers(tickers, 200);
    expect(b).toHaveBeenCalledTimes(1);
    expect(tickers.length).toBe(0);
  });
});
