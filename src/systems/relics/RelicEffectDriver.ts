/**
 * RelicEffectDriver — central dispatcher for held-Relic effect application
 * (R1 M3 T19 + T20).
 *
 * Every effect wire routes through this class so adding relic N+1 is one
 * method/case, not a grep-and-edit of every call site. The driver owns
 * the per-relic scratch state (bronze_clasp last-hit-time, whisky_dram
 * one-shot flag) so state lives in one resettable place — critical for
 * scene-restart and replay byte-determinism.
 *
 * Architecture:
 * - Pure helpers in `relicEffects.ts` own the math (baseline +% formulas).
 * - This driver queries `RelicSystem.isHolding(key)` and composes the
 *   pure helper with its own scratch state.
 * - Call sites invoke `driver.modifyX(base, ...)` / `driver.onEvent(...)`
 *   rather than reading the slot array themselves.
 *
 * Phaser-agnostic; exposes no game objects. Tests in-node via a stub
 * RelicSystem.
 *
 * Per-frame hook (`updatePerFrame(deltaMs)`) iterates slots for stateful
 * decay effects. M3 common effects are all event-driven, so the loop is
 * a no-op today; the scaffold lands now because Gran's Teapot (rare)
 * + any future timer-based effect need the seam.
 */
import type { RelicKey } from '../../data/relics';
import type { RelicSystem } from '../RelicSystem';
import {
  applyBronzeClaspFirstHit,
  applyCeilidhDancersRibbonThreshold,
  applyDampTinderFireReduction,
  applyGransThimbleCritBonus,
  applyLuckyHeatherSprigLuck,
  applyOatcakeHealOnCircleEntry,
  applySporranOfHolding,
  applyWhiskyDramActivation,
  initialBronzeClaspState,
  initialWhiskyDramState,
  type BronzeClaspState,
  type WhiskyDramState,
} from './relicEffects';

export interface WhiskyDramActivationResult {
  /** The resulting HP (possibly unchanged if the one-shot was already spent). */
  readonly hp: number;
  /** True iff this call fired the one-shot (used for toast + SFX). */
  readonly fired: boolean;
  /** True iff the relic is held AND unused (button should remain enabled). */
  readonly available: boolean;
}

export class RelicEffectDriver {
  private bronzeClaspState: BronzeClaspState = initialBronzeClaspState;
  private whiskyDramState: WhiskyDramState = initialWhiskyDramState;

  constructor(private readonly relicSystem: RelicSystem) {}

  /** Pass-through convenience; call sites avoid importing RelicSystem. */
  isHolding(key: RelicKey): boolean {
    return this.relicSystem.isHolding(key);
  }

  /**
   * Per-frame tick. Called once per game-frame from the scene's update
   * loop. No-op for the 8 M3 common effects (all event-driven); rare
   * effects with damage-free timers will add cases here.
   */
  updatePerFrame(_deltaMs: number): void {
    // Placeholder — iteration kept so the happy path still runs.
    for (const _slot of this.relicSystem.getSlots()) {
      if (_slot.def === null) continue;
      // Per-frame dispatch lands with rare-tier effects.
    }
  }

  // ── Stat / drop modifiers ────────────────────────────────────

  /** grans_thimble — +8% crit multiplier when held. */
  modifyCritMultiplier(baseMultiplier: number): number {
    return this.isHolding('grans_thimble')
      ? applyGransThimbleCritBonus(baseMultiplier)
      : baseMultiplier;
  }

  /** sporran_of_holding — +2 gold per coin pickup. */
  modifyGoldPickup(baseGold: number): number {
    return this.isHolding('sporran_of_holding')
      ? applySporranOfHolding(baseGold)
      : baseGold;
  }

  /** damp_tinder — fire hazards deal 40% less to the haggis. */
  modifyFireDamageTaken(baseFireDamage: number): number {
    return this.isHolding('damp_tinder')
      ? applyDampTinderFireReduction(baseFireDamage)
      : baseFireDamage;
  }

  /** oatcake_stash — +2 HP on healing-orb pickup. */
  modifyHealOnOrb(baseHeal: number): number {
    return this.isHolding('oatcake_stash')
      ? applyOatcakeHealOnCircleEntry(baseHeal)
      : baseHeal;
  }

  /** lucky_heather_sprig — +0.03 luck in 0-to-1 units. Used where luck is a fraction. */
  modifyLuckDraw(baseLuck: number): number {
    return this.isHolding('lucky_heather_sprig')
      ? applyLuckyHeatherSprigLuck(baseLuck)
      : baseLuck;
  }

  /**
   * lucky_heather_sprig — +3 card-draw luck *points* (same scale as
   * `sporran` passive's +15 and each `lucky_heather` permanent level's
   * +10). LevelUpFlow.apply adds this on top of resolveLuckBonus() so
   * the in-run relic composes with the meta-progression ladder.
   */
  luckDrawPoints(): number {
    return this.isHolding('lucky_heather_sprig') ? 3 : 0;
  }

  /** ceilidh_dancers_ribbon — lowers the pickup-chain threshold from 8 → 5. */
  ceilidhChainThreshold(defaultThreshold: number): number {
    return this.isHolding('ceilidh_dancers_ribbon')
      ? applyCeilidhDancersRibbonThreshold(defaultThreshold)
      : defaultThreshold;
  }

  // ── Stateful: bronze_clasp (time-gated) ─────────────────────

  /**
   * bronze_clasp — first hit each second deals +15%. Threads internal
   * last-hit timestamp through so the 1s window is per-run, not per-hit.
   * Returns the (possibly-boosted) damage amount. When the relic is not
   * held, the helper is bypassed entirely (no state advance).
   */
  modifyWeaponDamage(baseDamage: number, nowMs: number): number {
    if (!this.isHolding('bronze_clasp')) return baseDamage;
    const result = applyBronzeClaspFirstHit(
      baseDamage,
      nowMs,
      this.bronzeClaspState,
    );
    this.bronzeClaspState = result.state;
    return result.damage;
  }

  // ── Active: whisky_dram (one-shot) ──────────────────────────

  /**
   * Returns whether the Whisky Dram active is usable right now — i.e.
   * the relic is held and the one-shot hasn't fired yet. Used by the
   * pause menu to grey-out the button after use.
   */
  isWhiskyDramAvailable(): boolean {
    return this.isHolding('whisky_dram') && !this.whiskyDramState.used;
  }

  /**
   * Trigger Whisky Dram. Heals +20% max HP on first call; subsequent
   * calls no-op. `fired` signals the caller to play the toast/SFX.
   */
  activateWhiskyDram(currentHp: number, maxHp: number): WhiskyDramActivationResult {
    if (!this.isHolding('whisky_dram')) {
      return { hp: currentHp, fired: false, available: false };
    }
    const prevUsed = this.whiskyDramState.used;
    const result = applyWhiskyDramActivation(currentHp, maxHp, this.whiskyDramState);
    this.whiskyDramState = result.state;
    const fired = !prevUsed && result.state.used;
    return { hp: result.hp, fired, available: !result.state.used };
  }

  /** Reset every per-run scratch state — called on scene restart. */
  reset(): void {
    this.bronzeClaspState = initialBronzeClaspState;
    this.whiskyDramState = initialWhiskyDramState;
  }
}
