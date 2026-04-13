/**
 * Accumulates per-weapon damage for the end-of-run breakdown (GameOverScene).
 */
export class RunStatsTracker {
  private readonly weaponDamage = new Map<string, number>();

  addWeaponDamage(weaponKey: string, amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const k = weaponKey || 'unknown';
    this.weaponDamage.set(k, (this.weaponDamage.get(k) ?? 0) + Math.floor(amount));
  }

  /** Plain object for GameOver payload / save. */
  snapshot(): Record<string, number> {
    return Object.fromEntries(this.weaponDamage);
  }

  restore(snapshot: Record<string, number> | undefined): void {
    this.weaponDamage.clear();
    if (!snapshot) return;
    for (const [key, raw] of Object.entries(snapshot)) {
      if (typeof key !== 'string' || !key) continue;
      if (!Number.isFinite(raw) || raw <= 0) continue;
      this.weaponDamage.set(key, Math.floor(raw));
    }
  }

  reset(): void {
    this.weaponDamage.clear();
  }
}

/** Non-zero entries sorted by damage descending (stable for UI/tests). */
export function sortedWeaponDamageEntries(weaponDamage: Record<string, number>): { key: string; damage: number }[] {
  return Object.entries(weaponDamage)
    .filter(([, v]) => v > 0)
    .map(([key, damage]) => ({ key, damage }))
    .sort((a, b) => b.damage - a.damage);
}
