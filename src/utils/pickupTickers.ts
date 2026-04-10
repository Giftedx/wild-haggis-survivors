/**
 * Ticked pickup despawn — no floating scene.time.delayedCall for lifetime.
 * When the owning scene stops calling tickPickupTickers, countdowns halt naturally.
 */
export type PickupTicker = {
  remainingMs: number;
  cancelled: boolean;
  expire: () => void;
};

export function tickPickupTickers(tickers: PickupTicker[], scaledDeltaMs: number): void {
  for (let i = tickers.length - 1; i >= 0; i--) {
    const t = tickers[i];
    if (t.cancelled) {
      tickers.splice(i, 1);
      continue;
    }
    t.remainingMs -= scaledDeltaMs;
    if (t.remainingMs <= 0) {
      t.expire();
      tickers.splice(i, 1);
    }
  }
}
