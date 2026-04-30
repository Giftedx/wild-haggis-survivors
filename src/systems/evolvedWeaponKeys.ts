/**
 * One-line interface so the helper stays decoupled from the full
 * `ActiveWeapon` shape — only the two fields it actually reads.
 */
export interface EvolvedKeyEntry {
  evolved: boolean;
  config: { key: string };
}

/**
 * Populate `out` with the keys of weapons whose `evolved` flag is true.
 *
 * Mutates `out` in place (caller-allocated scratch Set) — `clear()`s
 * first so a long-lived Set re-used across update ticks stays correct
 * even after evolutions land mid-run. Avoids per-frame allocation that
 * would defeat the optimisation this helper exists for.
 */
export function populateEvolvedKeys(
  weapons: readonly EvolvedKeyEntry[],
  out: Set<string>,
): void {
  out.clear();
  for (const w of weapons) {
    if (w.evolved) out.add(w.config.key);
  }
}
