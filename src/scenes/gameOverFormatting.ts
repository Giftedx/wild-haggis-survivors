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
}

export function computeGoldBreakdown(input: GoldBreakdownInput): {
  timeGold: number;
  killGold: number;
  bossGold: number;
  coinGold: number;
  total: number;
} {
  const timeGold = Math.floor(input.timeSurvivedSec * 0.4);
  const killGold = Math.floor(input.enemiesKilled * 0.4);
  const { bossGold, coinGold } = input;
  return {
    timeGold,
    killGold,
    bossGold,
    coinGold,
    total: timeGold + killGold + bossGold + coinGold,
  };
}
