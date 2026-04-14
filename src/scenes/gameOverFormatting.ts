export function formatClockTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface GoldBreakdownInput {
  timeSurvivedSec: number;
  enemiesKilled: number;
  bossGold: number;
  coinGold: number;
  /** Matches `RunSummary.goldMult` / `computeGoldReward` — breakdown lines sum to earned gold. */
  goldMult?: number;
}

/**
 * Integer breakdown lines that sum to the same total as `computeGoldReward` in `utils/save.ts`
 * (single floor on the full base × multiplier — not independent floors per line).
 */
export function computeGoldBreakdown(input: GoldBreakdownInput): {
  timeGold: number;
  killGold: number;
  bossGold: number;
  coinGold: number;
  total: number;
} {
  const mult =
    input.goldMult != null && Number.isFinite(input.goldMult) && input.goldMult > 0
      ? input.goldMult
      : 1;
  // Align with `normalizeRunSummary` in `utils/save.ts` (rounded seconds, integer kills/gold).
  const tSec = Math.max(0, Math.round(input.timeSurvivedSec));
  const kCulls = Math.max(0, Math.floor(input.enemiesKilled));
  const rawTime = tSec * 0.4;
  const rawKill = kCulls * 0.4;
  const rawBoss = Math.max(0, Math.floor(input.bossGold));
  const rawCoin = Math.max(0, Math.floor(input.coinGold));
  const base = rawTime + rawKill + rawBoss + rawCoin;
  const total = Math.floor(base * mult);
  if (total <= 0) {
    return { timeGold: 0, killGold: 0, bossGold: 0, coinGold: 0, total: 0 };
  }
  if (base <= 0) {
    return { timeGold: 0, killGold: 0, bossGold: 0, coinGold: 0, total };
  }
  const raw = [rawTime, rawKill, rawBoss, rawCoin];
  const targets = raw.map((r) => (r / base) * total);
  const floors = targets.map((t) => Math.floor(t));
  const rem = total - (floors[0] + floors[1] + floors[2] + floors[3]);
  const order = [0, 1, 2, 3].sort((i, j) => {
    const fi = targets[i] - floors[i];
    const fj = targets[j] - floors[j];
    return fj - fi;
  });
  const out = [...floors];
  for (let k = 0; k < rem; k++) {
    out[order[k]]++;
  }
  return {
    timeGold: out[0],
    killGold: out[1],
    bossGold: out[2],
    coinGold: out[3],
    total,
  };
}
