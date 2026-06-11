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
  activateFingalsHorn,
  applyBodhranSkinBeatDamage,
  applyBronzeClaspFirstHit,
  applyCeilidhDancersRibbonThreshold,
  applyClootieRagLifesteal,
  applyDampTinderFireReduction,
  applyFishermensNetDamage,
  applyGransThimbleCritBonus,
  applyHighlandTorqueEliteDamage,
  applyHighlandTorqueEliteSpawnRate,
  applyLuckyHeatherSprigLuck,
  applyOatcakeHealOnCircleEntry,
  applySporranOfHolding,
  applyStoneOfDestinyBossHp,
  applyStoneOfDestinyXp,
  applyStormcrownDamage,
  applyWhiskyDramActivation,
  initialBronzeClaspState,
  initialCairnStoneState,
  initialClootieRagState,
  initialFingalsHornState,
  initialGransTeapotState,
  initialWhiskyDramState,
  isMidgieRepellentImmune,
  noteClootieRagDamageTaken,
  noteGransTeapotDamageTaken,
  resolveCairnStoneOnHeatherKill,
  rollStormcrownFreeze,
  tickGransTeapot,
  FINGALS_HORN_SUMMON_COUNT,
  FINGALS_HORN_SUMMON_DURATION_MS,
  STORMCROWN_FREEZE_DURATION_MS,
  type BronzeClaspState,
  type CairnStoneState,
  type ClootieRagState,
  type FingalsHornState,
  type GransTeapotState,
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

export interface FingalsHornActivationResult {
  readonly fired: boolean;
  readonly summonCount: number;
  readonly durationMs: number;
}

export class RelicEffectDriver {
  private bronzeClaspState: BronzeClaspState = initialBronzeClaspState;
  private whiskyDramState: WhiskyDramState = initialWhiskyDramState;
  private cairnStoneState: CairnStoneState = initialCairnStoneState;
  private clootieRagState: ClootieRagState = initialClootieRagState;
  private fingalsHornState: FingalsHornState = initialFingalsHornState;
  private gransTeapotState: GransTeapotState = initialGransTeapotState;

  constructor(private readonly relicSystem: RelicSystem) {}

  /** Pass-through convenience; call sites avoid importing RelicSystem. */
  isHolding(key: RelicKey): boolean {
    return this.relicSystem.isHolding(key);
  }

  /**
   * Per-frame tick. Gran's Teapot timer advances here so the
   * 5s-damage-free trigger + 5%-max-HP-per-second heal ride the same
   * scaled-delta clock as the rest of the game (pause + slow-mo
   * behave correctly).
   *
   * Returns the integer HP to heal this frame (0 when not eligible or
   * carrying fractional progress). Caller applies `player.heal()`.
   */
  updatePerFrame(_deltaMs: number): number {
    if (!this.isHolding('grans_teapot')) {
      // Keep the state fresh so a mid-run discard+re-acquire doesn't
      // inherit a stale damage-free clock.
      this.gransTeapotState = initialGransTeapotState;
      return 0;
    }
    // maxHp is supplied externally — driver stays Player-free. Wire
    // passes the caller's maxHp via `tickGransTeapotFrame`.
    return 0;
  }

  /**
   * grans_teapot per-frame heal — scene passes `maxHp` because the
   * driver doesn't own Player. Returns integer HP to heal; carry
   * persists in state for fractional ticks.
   */
  tickGransTeapotFrame(deltaMs: number, maxHp: number): number {
    if (!this.isHolding('grans_teapot')) return 0;
    const result = tickGransTeapot(deltaMs, maxHp, this.gransTeapotState);
    this.gransTeapotState = result.state;
    return result.healHp;
  }

  /** Called when the haggis takes damage — resets Gran's Teapot timer. */
  noteDamageTaken(nowMs: number): void {
    if (this.isHolding('grans_teapot')) {
      this.gransTeapotState = noteGransTeapotDamageTaken(this.gransTeapotState);
    }
    if (this.isHolding('clootie_rag')) {
      this.clootieRagState = noteClootieRagDamageTaken(nowMs, this.clootieRagState);
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

  // ── Uncommon + rare effect wires (R1 M4) ────────────────────

  /**
   * highland_torque — +100% damage to elites, +20% elite spawn rate.
   * Callers thread the "is elite" flag so the damage wire doesn't
   * need to read enemy metadata itself.
   */
  modifyEliteDamage(baseDamage: number, isElite: boolean): number {
    if (!isElite || !this.isHolding('highland_torque')) return baseDamage;
    return applyHighlandTorqueEliteDamage(baseDamage);
  }

  modifyEliteSpawnChance(baseChance: number): number {
    return this.isHolding('highland_torque')
      ? applyHighlandTorqueEliteSpawnRate(baseChance)
      : baseChance;
  }

  /** stone_of_destiny_shard — +50% XP from all sources. */
  modifyXpGain(baseXp: number): number {
    return this.isHolding('stone_of_destiny_shard')
      ? applyStoneOfDestinyXp(baseXp)
      : baseXp;
  }

  /** stone_of_destiny_shard — boss HP +15%. */
  modifyBossMaxHp(baseHp: number): number {
    return this.isHolding('stone_of_destiny_shard')
      ? applyStoneOfDestinyBossHp(baseHp)
      : baseHp;
  }

  /** clootie_rag — lifesteal doubled for 5s after taking damage. */
  modifyLifesteal(baseLifesteal: number, nowMs: number): number {
    if (!this.isHolding('clootie_rag')) return baseLifesteal;
    return applyClootieRagLifesteal(baseLifesteal, nowMs, this.clootieRagState);
  }

  /** fishermens_net — enemies moving away from the player take +30%. */
  modifyFishermensNetDamage(baseDamage: number, velocityDotTowardPlayer: number): number {
    if (!this.isHolding('fishermens_net')) return baseDamage;
    return applyFishermensNetDamage(baseDamage, velocityDotTowardPlayer);
  }

  /** bodhran_skin — +20% on-beat damage. `msSinceLastBeat` is scene-owned. */
  modifyBodhranBeatDamage(
    baseDamage: number,
    msSinceLastBeat: number,
    beatPeriodMs: number,
  ): number {
    if (!this.isHolding('bodhran_skin')) return baseDamage;
    return applyBodhranSkinBeatDamage(baseDamage, msSinceLastBeat, beatPeriodMs);
  }

  /** midgie_repellent — immune to midge-swarm stacking damage. */
  isMidgieSwarmImmune(): boolean {
    return isMidgieRepellentImmune(this.isHolding('midgie_repellent'));
  }

  /**
   * cairn_stone — heather kill spawns a pickup-magnet gem once per 5s.
   * Returns true iff the caller should fire the side effect now.
   */
  tryCairnStoneHeatherKill(nowMs: number): boolean {
    if (!this.isHolding('cairn_stone')) return false;
    const r = resolveCairnStoneOnHeatherKill(nowMs, this.cairnStoneState);
    this.cairnStoneState = r.state;
    return r.spawn;
  }

  /** fingals_horn — one-shot summon; available iff held + unused. */
  isFingalsHornAvailable(): boolean {
    return this.isHolding('fingals_horn') && !this.fingalsHornState.used;
  }

  activateFingalsHorn(): FingalsHornActivationResult {
    if (!this.isHolding('fingals_horn')) {
      return { fired: false, summonCount: 0, durationMs: 0 };
    }
    const result = activateFingalsHorn(this.fingalsHornState);
    this.fingalsHornState = result.state;
    return {
      fired: result.fired,
      summonCount: FINGALS_HORN_SUMMON_COUNT,
      durationMs: FINGALS_HORN_SUMMON_DURATION_MS,
    };
  }

  // ── Stormcrown (V2 Cailleach Gauntlet) ──────────────────────────

  /** V2 — Stormcrown +18 % weapon damage. */
  modifyStormcrownDamage(baseDamage: number): number {
    return this.isHolding('stormcrown')
      ? applyStormcrownDamage(baseDamage)
      : baseDamage;
  }

  /**
   * V2 — Stormcrown 6 % on-crit freeze proc. Returns true iff freeze
   * should fire. Caller threads the run RNG so the proc is replay-
   * deterministic.
   */
  tryStormcrownFreeze(
    rng: { bool(p: number): boolean },
    isCrit: boolean,
  ): boolean {
    if (!this.isHolding('stormcrown')) return false;
    return rollStormcrownFreeze(rng, isCrit);
  }

  /** Stormcrown freeze duration (read from the effect helpers). */
  readonly stormcrownFreezeDurationMs = STORMCROWN_FREEZE_DURATION_MS;

  /** Reset every per-run scratch state — called on scene restart. */
  reset(): void {
    this.bronzeClaspState = initialBronzeClaspState;
    this.whiskyDramState = initialWhiskyDramState;
    this.cairnStoneState = initialCairnStoneState;
    this.clootieRagState = initialClootieRagState;
    this.fingalsHornState = initialFingalsHornState;
    this.gransTeapotState = initialGransTeapotState;
  }
}
