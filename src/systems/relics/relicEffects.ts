/**
 * Pure-function effect implementations for common relics (R1 M1 T6-9).
 *
 * These helpers are Phaser-agnostic — callers pass numeric or state inputs
 * and receive transformed outputs. No side effects, no randomness, no
 * wall-clock reads. M3 wires them into the runtime via RelicInventory /
 * event handlers.
 *
 * Spec: docs/superpowers/specs/r1-relics.md §3 (common pool).
 */

/**
 * sporran_of_holding — +2 gold per pickup collected.
 */
export function applySporranOfHolding(goldFromPickup: number): number {
  return goldFromPickup + 2;
}

/**
 * oatcake_stash — Heal 2 HP when entering a healing circle.
 * Caller passes the base heal amount and receives the boosted value.
 */
export function applyOatcakeHealOnCircleEntry(healAmount: number): number {
  return healAmount + 2;
}

/**
 * grans_thimble — Critical hits deal +8% damage.
 * Caller passes the current crit multiplier (e.g. 2× base) and receives
 * the scaled value. Applied to the multiplier, not the raw damage, so the
 * bonus scales with other crit buffs.
 */
export function applyGransThimbleCritBonus(critMultiplier: number): number {
  return critMultiplier * 1.08;
}

/**
 * lucky_heather_sprig — +3% luck (card-draw rarity bias).
 * Additive with existing luck. Callers are responsible for any upper
 * clamp — the helper applies the delta unconditionally.
 */
export function applyLuckyHeatherSprigLuck(luck: number): number {
  return luck + 0.03;
}

/**
 * bronze_clasp — First hit each second deals +15% damage.
 *
 * State is threaded explicitly so the helper stays pure. A hit fires the
 * bonus iff at least 1000ms have passed since the previous bonus-triggering
 * hit; on a successful fire the helper returns a new state with the
 * current timestamp. Within the 1s window the input state is returned
 * unchanged (reference-equal) and base damage passes through.
 */
export interface BronzeClaspState {
  readonly lastHitTime: number; // ms; Number.NEGATIVE_INFINITY means "no hits yet".
}

export interface BronzeClaspResult {
  readonly damage: number;
  readonly state: BronzeClaspState;
}

export const initialBronzeClaspState: BronzeClaspState = Object.freeze({
  lastHitTime: Number.NEGATIVE_INFINITY,
});

export function applyBronzeClaspFirstHit(
  baseDamage: number,
  now: number,
  state: BronzeClaspState,
): BronzeClaspResult {
  const bonusActive = now - state.lastHitTime >= 1000;
  return {
    damage: bonusActive ? baseDamage * 1.15 : baseDamage,
    state: bonusActive ? { lastHitTime: now } : state,
  };
}

/**
 * ceilidh_dancers_ribbon — Pickup-chain bonus activates at 5 in a row
 * (default would otherwise be 8). Helper overrides whatever default the
 * caller supplies to the relic-dictated constant, so the call-site reads:
 *
 *   const threshold = hasRibbon
 *     ? applyCeilidhDancersRibbonThreshold(DEFAULT_CHAIN_THRESHOLD)
 *     : DEFAULT_CHAIN_THRESHOLD;
 */
export const CEILIDH_DANCERS_RIBBON_PICKUP_CHAIN_THRESHOLD = 5;

export function applyCeilidhDancersRibbonThreshold(_defaultThreshold: number): number {
  return CEILIDH_DANCERS_RIBBON_PICKUP_CHAIN_THRESHOLD;
}

/**
 * damp_tinder — Fire hazards deal 40% less damage to the haggis.
 * Multiplies incoming fire damage by 0.6.
 */
export function applyDampTinderFireReduction(fireDamage: number): number {
  return fireDamage * 0.6;
}

/**
 * whisky_dram — Once per run, regain 20% max HP instantly (activated via
 * sporran menu). State tracks whether the one-shot has been spent; a
 * second call is a no-op that returns reference-equal state.
 */
export interface WhiskyDramState {
  readonly used: boolean;
}

export interface WhiskyDramResult {
  readonly hp: number;
  readonly state: WhiskyDramState;
}

export const initialWhiskyDramState: WhiskyDramState = Object.freeze({
  used: false,
});

export function applyWhiskyDramActivation(
  currentHp: number,
  maxHp: number,
  state: WhiskyDramState,
): WhiskyDramResult {
  if (state.used) {
    return { hp: currentHp, state };
  }
  const healed = Math.min(maxHp, currentHp + maxHp * 0.2);
  return { hp: healed, state: { used: true } };
}

// ─────────────────────────────────────────────────────────────────
// Uncommon + Rare pure effects (R1 M4).
//
// Authored together so the pure-fn library is complete at M4 ship.
// Wire-site plumbing for each lives in GameScene / driver / hook;
// complex ones (cairn_stone heather detection, bodhran_skin beat
// alignment, fingals_horn spawn) stay behind their wire sites so
// the pure layer tests without Phaser.
// ─────────────────────────────────────────────────────────────────

/**
 * cairn_stone — enemies killed on heather spawn a pickup-magnet gem,
 * once per 5s. Stateful (threads last-spawn timestamp). Returns
 * `{ spawn: boolean, state }` — caller uses `spawn` to decide whether
 * to fire the side effect.
 */
export interface CairnStoneState {
  readonly lastSpawnMs: number;
}

export const initialCairnStoneState: CairnStoneState = Object.freeze({
  lastSpawnMs: Number.NEGATIVE_INFINITY,
});

export interface CairnStoneResult {
  readonly spawn: boolean;
  readonly state: CairnStoneState;
}

export const CAIRN_STONE_COOLDOWN_MS = 5000;

export function resolveCairnStoneOnHeatherKill(
  now: number,
  state: CairnStoneState,
): CairnStoneResult {
  const ready = now - state.lastSpawnMs >= CAIRN_STONE_COOLDOWN_MS;
  return {
    spawn: ready,
    state: ready ? { lastSpawnMs: now } : state,
  };
}

/**
 * highland_torque — +100% damage to elites; elite spawn rate +20%.
 * Two pure helpers; each call-site composes with its existing
 * multiplier stack.
 */
export const HIGHLAND_TORQUE_ELITE_DAMAGE_MULT = 2.0;
export const HIGHLAND_TORQUE_ELITE_SPAWN_MULT = 1.2;

export function applyHighlandTorqueEliteDamage(baseDamage: number): number {
  return baseDamage * HIGHLAND_TORQUE_ELITE_DAMAGE_MULT;
}

export function applyHighlandTorqueEliteSpawnRate(baseChance: number): number {
  return Math.min(1, baseChance * HIGHLAND_TORQUE_ELITE_SPAWN_MULT);
}

/**
 * bodhran_skin — +20% damage on hits landed within ±80ms of a
 * quarter-note beat. Beat phase comes from the music engine;
 * distance is the minimum of |elapsed| and |period - elapsed|.
 */
export const BODHRAN_SKIN_ON_BEAT_WINDOW_MS = 80;
export const BODHRAN_SKIN_ON_BEAT_DAMAGE_BONUS = 0.2;

export function applyBodhranSkinBeatDamage(
  baseDamage: number,
  msSinceLastBeat: number,
  beatPeriodMs: number,
): number {
  if (!Number.isFinite(msSinceLastBeat) || !Number.isFinite(beatPeriodMs) || beatPeriodMs <= 0) {
    return baseDamage;
  }
  const wrapped = ((msSinceLastBeat % beatPeriodMs) + beatPeriodMs) % beatPeriodMs;
  const distance = Math.min(wrapped, beatPeriodMs - wrapped);
  if (distance <= BODHRAN_SKIN_ON_BEAT_WINDOW_MS) {
    return baseDamage * (1 + BODHRAN_SKIN_ON_BEAT_DAMAGE_BONUS);
  }
  return baseDamage;
}

/**
 * clootie_rag — lifesteal doubled for 5s after the haggis takes
 * damage. State threads the last-hurt timestamp; caller consults
 * `isDoubleLifestealActive(now, state)` each heal.
 */
export interface ClootieRagState {
  readonly lastDamagedMs: number;
}

export const initialClootieRagState: ClootieRagState = Object.freeze({
  lastDamagedMs: Number.NEGATIVE_INFINITY,
});

export const CLOOTIE_RAG_WINDOW_MS = 5000;

export function noteClootieRagDamageTaken(
  now: number,
  _state: ClootieRagState,
): ClootieRagState {
  return { lastDamagedMs: now };
}

export function isClootieRagDoubleActive(now: number, state: ClootieRagState): boolean {
  return now - state.lastDamagedMs <= CLOOTIE_RAG_WINDOW_MS;
}

export function applyClootieRagLifesteal(
  baseLifesteal: number,
  now: number,
  state: ClootieRagState,
): number {
  return isClootieRagDoubleActive(now, state) ? baseLifesteal * 2 : baseLifesteal;
}

/**
 * fishermens_net — enemies moving *away* from the player take +30%
 * damage. Input is the dot product of (enemy velocity) · (playerPos
 * − enemyPos). Dot > 0 means the enemy is moving toward the player;
 * < 0 means away. Zero-velocity enemies are "neither" — baseline.
 */
export const FISHERMENS_NET_AWAY_BONUS = 0.3;

export function applyFishermensNetDamage(baseDamage: number, velocityDotTowardPlayer: number): number {
  return velocityDotTowardPlayer < 0
    ? baseDamage * (1 + FISHERMENS_NET_AWAY_BONUS)
    : baseDamage;
}

/**
 * midgie_repellent — immune to midge-swarm stacking damage. Immunity
 * is a pure boolean; the consumer gates its stacking damage path.
 * Kept as a helper so the "held → immune" check travels with the
 * rest of the pure layer.
 */
export function isMidgieRepellentImmune(held: boolean): boolean {
  return held === true;
}

/**
 * grans_teapot — after 5s without taking damage, heal 5% max HP per
 * second. Stateful: threads (time since last damage) + (fractional HP
 * accumulator for sub-1-HP ticks). Returns integer HP to add this
 * frame (0 if not yet eligible, or fractional carry).
 */
export interface GransTeapotState {
  readonly msSinceDamage: number;
  readonly healCarry: number;
}

export const initialGransTeapotState: GransTeapotState = Object.freeze({
  msSinceDamage: 0,
  healCarry: 0,
});

export const GRANS_TEAPOT_DAMAGE_FREE_MS = 5000;
export const GRANS_TEAPOT_HEAL_FRAC_PER_SEC = 0.05;

export interface GransTeapotTickResult {
  readonly healHp: number;
  readonly state: GransTeapotState;
}

export function tickGransTeapot(
  deltaMs: number,
  maxHp: number,
  state: GransTeapotState,
): GransTeapotTickResult {
  const safeDelta = Math.max(0, deltaMs);
  const nextMs = state.msSinceDamage + safeDelta;
  if (nextMs < GRANS_TEAPOT_DAMAGE_FREE_MS) {
    return { healHp: 0, state: { msSinceDamage: nextMs, healCarry: state.healCarry } };
  }
  // Only the ms past the 5s threshold count toward the heal tick; a
  // transition frame that partially crosses heals for the post-window
  // slice only, not the full delta.
  const eligibleMs = Math.min(safeDelta, nextMs - GRANS_TEAPOT_DAMAGE_FREE_MS);
  const healPerMs = (maxHp * GRANS_TEAPOT_HEAL_FRAC_PER_SEC) / 1000;
  const heal = state.healCarry + healPerMs * eligibleMs;
  const whole = Math.floor(heal);
  return {
    healHp: whole,
    state: { msSinceDamage: nextMs, healCarry: heal - whole },
  };
}

export function noteGransTeapotDamageTaken(_state: GransTeapotState): GransTeapotState {
  return { msSinceDamage: 0, healCarry: 0 };
}

/**
 * stone_of_destiny_shard — +50% XP from all sources; boss HP +15%.
 * Two pure helpers; each call-site composes with its existing stack.
 */
export const STONE_OF_DESTINY_XP_MULT = 1.5;
export const STONE_OF_DESTINY_BOSS_HP_MULT = 1.15;

export function applyStoneOfDestinyXp(baseXp: number): number {
  return baseXp * STONE_OF_DESTINY_XP_MULT;
}

export function applyStoneOfDestinyBossHp(baseHp: number): number {
  return baseHp * STONE_OF_DESTINY_BOSS_HP_MULT;
}

/**
 * fingals_horn — once per run, summon 3 Fianna warriors for 10s.
 * Pure layer owns the one-shot flag; summoning side effect lives in
 * the wire. Same shape as whisky_dram.
 */
export interface FingalsHornState {
  readonly used: boolean;
}

export const initialFingalsHornState: FingalsHornState = Object.freeze({
  used: false,
});

export const FINGALS_HORN_SUMMON_DURATION_MS = 10_000;
export const FINGALS_HORN_SUMMON_COUNT = 3;

export interface FingalsHornResult {
  readonly fired: boolean;
  readonly state: FingalsHornState;
}

export function activateFingalsHorn(state: FingalsHornState): FingalsHornResult {
  if (state.used) return { fired: false, state };
  return { fired: true, state: { used: true } };
}

// ── stormcrown ─────────────────────────────────────────────────────
// V2 (Cailleach Gauntlet) — drops only from cailleach_boss kill.
// +18 % weapon damage + 6 % chance on crit to freeze for 0.5 s.
// Spec: docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md.

export const STORMCROWN_DAMAGE_MULT = 1.18;
export const STORMCROWN_FREEZE_CHANCE = 0.06;
export const STORMCROWN_FREEZE_DURATION_MS = 500;

export function applyStormcrownDamage(baseDamage: number): number {
  return baseDamage * STORMCROWN_DAMAGE_MULT;
}

/**
 * V2 — Stormcrown's on-crit freeze proc. 6 % chance per crit; 500 ms
 * freeze. Caller threads the crit flag and the run RNG so the proc is
 * replay-deterministic (no wall-clock / unseeded randomness).
 */
export function rollStormcrownFreeze(
  rng: { bool(p: number): boolean },
  isCrit: boolean,
): boolean {
  if (!isCrit) return false;
  return rng.bool(STORMCROWN_FREEZE_CHANCE);
}
