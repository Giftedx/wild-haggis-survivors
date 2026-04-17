/**
 * High-precision clock formatter for speedrunners. Companion to
 * `formatClockTime` (canonical "M:SS" for HUD / chronicle / result
 * screens) — this one adds centisecond resolution: "M:SS.cc".
 *
 * Opt-in via `speedrunTimerVisible` in `SettingsManager`; off by
 * default so the HUD stays calm for non-timer-driven players. When
 * on, the HUD timer renders `formatSpeedrunTime(gameTimeSec)` each
 * frame instead of the second-precision `formatClockTime(...)`.
 *
 * - Non-negative input (seconds below zero clamp to 0).
 * - Centiseconds are floored (1.999 → "0:01.99", 2.0 → "0:02.00").
 * - Minutes not padded to match the rest of the UI (`1:05.42`).
 */
export function formatSpeedrunTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const totalCentis = Math.floor(safe * 100);
  const mins = Math.floor(totalCentis / 6000);
  const secs = Math.floor((totalCentis % 6000) / 100);
  const centis = totalCentis % 100;
  return `${mins}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}
