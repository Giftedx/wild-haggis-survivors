/**
 * SavedStateHydrator — pure helpers that restore per-run state from a
 * saved snapshot. Extracted from GameScene as part of the T401 P3
 * residual decomposition (see docs/archive/superpowers/specs/2026-04-13-
 * gamescene-demonolith-design.md "Out of scope (follow-ups)" — saved-
 * state hydrator module).
 *
 * Why pure: matches the established pattern in this package
 * (actIntermissionResolve, dispatchActComplete, runStartModifiers).
 * No Phaser imports; tests can drive the helpers in node-env vitest
 * without bootstrapping a scene.
 *
 * Today the module owns just `restoreHeldRelics`. Future hydrate-
 * specific paths (relic pickups, mid-run buff bag, etc.) can land
 * here without re-spreading the surface back across GameScene.
 */
import { RELICS, type RelicDef } from '../../data/relics';

/**
 * Narrow slice of `RelicSystem` the hydrator needs. Avoids reaching
 * for the full class so tests can pass a mock with just three methods.
 */
export interface RelicSystemForHydrate {
  reset(): void;
  add(def: RelicDef): boolean;
}

/**
 * Narrow slice of `RelicEffectDriver` the hydrator needs. Optional
 * because the GameScene field can be absent during very early failure
 * paths (a relic snapshot loaded before the driver constructed would
 * be a logic bug elsewhere — defensive optionality keeps the helper
 * tolerant rather than throwing).
 */
export interface RelicEffectDriverForHydrate {
  reset(): void;
}

/**
 * Repopulate `relicSystem` from a list of relic keys captured in a
 * saved-state snapshot. Resets the system + (when present) the effect
 * driver first, then re-adds each unique known key in slot order.
 *
 * Behaviour preserved verbatim from the prior `GameScene.restoreHeld
 * Relics` private method: skips duplicates, skips unknown keys
 * silently, no-op when the relic system is absent (resume on a build
 * that hasn't constructed it yet).
 */
export function restoreHeldRelics(
  relicSystem: RelicSystemForHydrate | null | undefined,
  relicEffectDriver: RelicEffectDriverForHydrate | null | undefined,
  keys: readonly string[],
): void {
  if (!relicSystem) return;
  relicSystem.reset();
  relicEffectDriver?.reset();
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    const relic = (RELICS as Readonly<Record<string, RelicDef | undefined>>)[key];
    if (!relic) continue;
    if (relicSystem.add(relic)) seen.add(key);
  }
}
