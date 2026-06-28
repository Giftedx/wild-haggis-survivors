/**
 * RuneConditionSystem — tick-driven orchestrator.
 *
 * Owns a list of active runes plus per-rune "was true last tick" flags.
 * On every tick it evaluates each rune's condition against the incoming
 * context; transitions fire `applyRuneEffect` / `removeRuneEffect` on a
 * shared `RuneEffectBag`. Sustained truth does NOT re-apply — exactly
 * one apply per false→true edge, one remove per true→false edge.
 *
 * Design notes
 * - The bag is injected, not owned — a GameScene or Player holds the
 *   single authoritative bag and passes it in.
 * - `addRune` inserts with `lastActive: false` so a rune whose condition
 *   is already true at the time of addition still applies cleanly on the
 *   next tick (false→true transition).
 * - `removeRune(id)` reverts the effect if it was active, then drops the
 *   slot. `clear()` does the same for all slots.
 * - Pure behavior, no Phaser dependency — drivable from vitest.
 */

import type { RuneDef } from '../data/runes';
import {
  applyRuneEffect,
  removeRuneEffect,
  type RuneEffectBag,
} from './runes/runeEffects';
import {
  evaluateRuneCondition,
  isOneShotRuneCondition,
  type RuneEvalContext,
} from './runes/runeConditions';

interface Slot {
  readonly def: RuneDef;
  active: boolean;
}

export interface RuneSnapshot {
  readonly id: string;
  readonly active: boolean;
}

export class RuneConditionSystem {
  private slots: Slot[] = [];

  constructor(private readonly bag: RuneEffectBag) {}

  /** Register a rune. A duplicate id is ignored (first-wins). */
  addRune(def: RuneDef): void {
    if (this.slots.some((s) => s.def.id === def.id)) return;
    this.slots.push({ def, active: false });
  }

  /**
   * Drop a rune. If its effects are currently applied, revert first.
   * Returns true when a slot was removed.
   */
  removeRune(id: string): boolean {
    const idx = this.slots.findIndex((s) => s.def.id === id);
    if (idx === -1) return false;
    const slot = this.slots[idx]!;
    if (slot.active) {
      for (const eff of slot.def.effects) removeRuneEffect(this.bag, eff);
    }
    this.slots.splice(idx, 1);
    return true;
  }

  /**
   * Evaluate every rune against `ctx` and drive transitions.
   *
   * Apply / remove are invoked in list order. The caller is responsible
   * for setting `bag.nowMs` before tick if any latched timed effect
   * depends on current-time (dmg_mult_timed, dash_first_shot_dmg).
   */
  tick(ctx: RuneEvalContext): void {
    for (const slot of this.slots) {
      const nowTrue = evaluateRuneCondition(slot.def.conditionKey, ctx);
      if (isOneShotRuneCondition(slot.def.conditionKey)) {
        if (nowTrue) {
          for (const eff of slot.def.effects) applyRuneEffect(this.bag, eff);
        }
        slot.active = false;
        continue;
      }
      if (nowTrue && !slot.active) {
        for (const eff of slot.def.effects) applyRuneEffect(this.bag, eff);
        slot.active = true;
      } else if (!nowTrue && slot.active) {
        for (const eff of slot.def.effects) removeRuneEffect(this.bag, eff);
        slot.active = false;
      }
    }
  }

  /** Revert every active rune and drop all slots. */
  clear(): void {
    for (const slot of this.slots) {
      if (slot.active) {
        for (const eff of slot.def.effects) removeRuneEffect(this.bag, eff);
      }
    }
    this.slots.length = 0;
  }

  activeCount(): number {
    return this.slots.length;
  }

  /** Shallow snapshot — caller cannot mutate internal state. */
  snapshot(): readonly RuneSnapshot[] {
    return this.slots.map((s) => ({ id: s.def.id, active: s.active }));
  }
}
