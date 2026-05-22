/**
 * RelicSystem — owns the player's 3 Relic slots for a run (R1 M2 T11).
 *
 * Slot state lives here (not on Player) so the drop-roll + pickup flow
 * touches one place. Scene-agnostic: no Phaser imports. Drop rolling +
 * elite/boss/chest hooks land in later M2 tasks; this file ships only
 * the slot model so the pickup UI + per-frame effect application have
 * a stable surface to build against.
 *
 * Invariants:
 * - Exactly 3 slots. Hard cap per spec §2.
 * - No duplicates: `add()` refuses a second copy of the same RelicKey.
 * - Slots are sparse: `discardAt(i)` clears slot `i` without shuffling
 *   the others, so a held-slot index stays stable across a discard
 *   (important for the HUD widget and the pickup prompt).
 *
 * See docs/superpowers/specs/2026-04-23-relics-third-tier-design.md §6
 * for the full data shape. `activationUses` + `internalState` live here
 * so M3 effect wiring (Whisky Dram one-shot, Gran's Teapot timer) can
 * store per-slot state without re-introducing parallel arrays.
 */
import type { RelicDef, RelicDropSource, RelicKey } from '../data/relics';
import type { RNG } from '../utils/rng';
import {
  bossGrantsRelic,
  pickRelicFromPool,
  pickRestrictedRelicForBoss,
  rollChestOverrideOccurs,
  rollEliteDropOccurs,
} from '../data/relicDrops';

export interface RelicSlot {
  def: RelicDef | null;
  /** Uses remaining for activatable Relics (e.g. Whisky Dram starts at 1). */
  activationUses?: number;
  /** Per-slot scratch state for stateful effects (Gran's Teapot timer, etc.). */
  internalState?: Record<string, unknown>;
}

export const RELIC_SLOT_COUNT = 3;

function makeEmptySlot(): RelicSlot {
  return { def: null };
}

export class RelicSystem {
  private readonly slots: RelicSlot[] = [
    makeEmptySlot(),
    makeEmptySlot(),
    makeEmptySlot(),
  ];

  /** Read-only view of the current slot array. Index matches HUD slot. */
  getSlots(): readonly RelicSlot[] {
    return this.slots;
  }

  heldCount(): number {
    let n = 0;
    for (const s of this.slots) if (s.def !== null) n++;
    return n;
  }

  /** Compact list of held RelicKeys, in slot order, empties skipped. */
  heldKeys(): RelicKey[] {
    const out: RelicKey[] = [];
    for (const s of this.slots) if (s.def !== null) out.push(s.def.key);
    return out;
  }

  isHolding(key: RelicKey): boolean {
    for (const s of this.slots) if (s.def?.key === key) return true;
    return false;
  }

  canAdd(def: RelicDef): boolean {
    if (this.isHolding(def.key)) return false;
    return this.heldCount() < RELIC_SLOT_COUNT;
  }

  /**
   * Fill the next empty slot with `def`. Returns true on success; false
   * if all slots are full or the relic is already held. The 4th-offered
   * flow is routed through `replaceAt()` from the discard UI.
   */
  add(def: RelicDef): boolean {
    if (!this.canAdd(def)) return false;
    for (const s of this.slots) {
      if (s.def === null) {
        s.def = def;
        return true;
      }
    }
    return false;
  }

  /**
   * Swap in `def` at a specific slot. Called by the discard UI when the
   * player picks which held slot to evict for a 4th Relic. No-op if the
   * incoming relic is already held at a different slot — caller should
   * block this at the UI layer.
   */
  replaceAt(index: number, def: RelicDef): void {
    if (index < 0 || index >= RELIC_SLOT_COUNT) return;
    if (this.isHolding(def.key) && this.slots[index].def?.key !== def.key) return;
    this.slots[index] = { def };
  }

  discardAt(index: number): void {
    if (index < 0 || index >= RELIC_SLOT_COUNT) return;
    this.slots[index] = makeEmptySlot();
  }

  reset(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i] = makeEmptySlot();
    }
  }

  /**
   * Roll a drop for the given source. Returns the selected RelicDef or
   * null when no drop fires. Delegates occurrence + pool-selection to
   * the pure helpers in `data/relicDrops.ts`.
   *
   * - `elite`: 15% base, scaled by `luckMultiplier` (default 1).
   * - `chest`: 25% override on a legendary chest roll; caller decides
   *   whether the host chest roll was legendary in the first place.
   * - `boss`: guaranteed iff `bossKey` is on the Tier-2+ whitelist.
   * - `hidden_node` / `bargain`: always occur (caller-gated event);
   *   this method just picks the relic.
   *
   * Always excludes relics the player already holds.
   */
  rollDrop(
    source: RelicDropSource,
    rng: RNG,
    opts: { luckMultiplier?: number; bossKey?: string } = {},
  ): RelicDef | null {
    const occurs = this.dropOccurs(source, rng, opts);
    if (!occurs) return null;
    // V2 — boss-key may match a `restrictedToBossKey` relic in the
    // catalogue (Cailleach Gauntlet → Stormcrown). Short-circuit the
    // open pool when so, never returning the restricted relic via the
    // normal weighted path.
    if (opts.bossKey) {
      const restricted = pickRestrictedRelicForBoss(opts.bossKey);
      if (restricted && !this.heldKeys().includes(restricted.key)) {
        return restricted;
      }
    }
    return pickRelicFromPool(source, rng, this.heldKeys());
  }

  private dropOccurs(
    source: RelicDropSource,
    rng: RNG,
    opts: { luckMultiplier?: number; bossKey?: string },
  ): boolean {
    switch (source) {
      case 'elite':
        return rollEliteDropOccurs(rng, opts.luckMultiplier ?? 1);
      case 'chest':
        return rollChestOverrideOccurs(rng);
      case 'boss':
        return opts.bossKey ? bossGrantsRelic(opts.bossKey) : false;
      case 'hidden_node':
      case 'bargain':
        return true;
    }
  }
}
