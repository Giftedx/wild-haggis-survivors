/**
 * Zero-padded local `YYYY-MM-DD` formatter — used by the postcard filename
 * stamp and the daily-challenge date key. Shared so midnight rollover and
 * filename dates never drift apart if one gains a timezone wrinkle.
 */
export function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
