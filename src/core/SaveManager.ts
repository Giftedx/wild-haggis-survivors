export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

import { emitSaveFailure } from '../utils/saveFailure';
import { recordFallenCairn, markWreathed, markExtinguished, type FallenCairn } from '../utils/save/fallenCairns';

export interface ISaveDataV1 {
  saveVersion: 1;
  totalKills: number;
  unlockedWeapons: string[];
}

export interface ISaveDataV2 {
  saveVersion: 2;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
}

/** Serialized weapon row for mid-run resume. */
export interface IRunWeaponSlot {
  key: string;
  level: number;
  evolved: boolean;
  evolutionKey: string;
}

/**
 * W2 Moor Road: per-run act state snapshot. Optional on pre-W2 resume
 * payloads; defaulted to fresh state when absent. `pickerHistory` is
 * the source of truth for re-applying `modifierDeltas` on resume, so
 * the runtime multipliers (`spawnIntervalMult` / `weaponCooldownMult`)
 * don't need a separate field in `IRunState`.
 */
export interface IRunActStateSnapshot {
  currentAct: 1 | 2 | 3;
  actStartTimeSec: number;
  pickerHistory: Array<{
    slot: 'A' | 'B';
    routeKey: string;
    atGameTimeSec: number;
    defaultedBySetting: boolean;
  }>;
  /**
   * Cursor into the current act's node-map. Restored so a resumed run
   * keeps Chronicle / minimap counts coherent. The freshly-rolled map's
   * `visited` array is NOT yet reconstructed from `nodeOutcomes` (run
   * RNG state is not serialised — see plan exceptions for the deferred
   * visited-state restoration item). Optional on pre-T101 payloads.
   */
  currentNodeIndex?: number;
  /**
   * Append-only log of every resolved node outcome this run (all acts).
   * Restored so Chronicle breadcrumbs / replay node-cursor stay aligned
   * with the live run.
   */
  nodeOutcomes?: Array<{
    nodeKey: string;
    chosenRewardKey?: string;
    visitedAtGameTimeSec: number;
  }>;
  /**
   * T101 — frozen snapshot of the rolled per-act node-map so resume
   * doesn't depend on `runRng` state being byte-identical (which it
   * isn't — every `next()` call between act-roll and the snapshot
   * advances the stream). Storing keys + positions + visited[] lets
   * the resume path reconstruct the exact map the player saw, including
   * which nodes they've cleared. Optional on pre-T101 payloads — absent
   * snapshots fall back to the legacy "re-roll on resume, accept slight
   * divergence" path covered in M1 F5.
   */
  nodeMap?: {
    act: 1 | 2 | 3;
    nodeKeys: string[];
    worldPositions: Array<{ x: number; y: number }>;
    visited: boolean[];
  };
}

/** Strict mid-run snapshot (meta save `activeRun`). */
export interface IRunState {
  gameTimeSec: number;
  playerX: number;
  playerY: number;
  playerHealth: number;
  playerMaxHp: number;
  currentXp: number;
  currentLevel: number;
  acquiredWeapons: IRunWeaponSlot[];
  selectedVariantKey: string;
  killCount: number;
  ownedPassives: string[];
  evolvedWeaponKeys: string[];
  /** Boss kills already earned in this run (for Game Over stats). */
  bossKillCount?: number;
  /** Gold earned from boss kills so far this run. */
  bossGoldEarned?: number;
  /** Gold earned from coins/chests/kill milestones so far this run. */
  coinGoldEarned?: number;
  /** Gold spent mid-run (W2 node trader purchases). */
  coinGoldSpent?: number;
  /** One-time revive remaining at snapshot time. */
  revivalAvailable?: boolean;
  /** Best combo reached before the snapshot. */
  bestCombo?: number;
  /** Current live combo chain at snapshot time. */
  comboCount?: number;
  /** Remaining lifetime on the current combo chain. */
  comboTimerMs?: number;
  /** Current dash charges remaining. */
  dashCharges?: number;
  /** Remaining cooldown on the next dash recharge. */
  dashCooldownMs?: number;
  /** Per-weapon damage totals accumulated so far this run. */
  weaponDamage?: Record<string, number>;
  /** Boss keys already spawned in this run (used to prevent duplicate intros on resume). */
  spawnedBossKeys?: string[];
  /** Highland Shield cooldown remaining in ms at snapshot time. */
  shieldCooldownMs?: number;
  /** Relic keys held in the three run slots, in slot order. */
  heldRelicKeys?: string[];
  /**
   * W2 Moor Road — act state (current act, start time, picker history).
   * Absent on pre-W2 resume payloads; the resume path treats that as a
   * fresh act-1 start. When present, `pickerHistory` drives replay of
   * the route `modifierDeltas` so post-pick multipliers are preserved.
   */
  actState?: IRunActStateSnapshot;
  /**
   * T101 follow-up — active shrine combat buffs (M1 F4) at snapshot time.
   * Each entry is `{ key, remainingMs }`; the resume path looks up the
   * matching `apply` / `revert` from the shrine-buff registry and
   * re-attaches the entry to the rebuilt `TempBuffBag`. Absent on
   * pre-T101 payloads.
   */
  tempBuffs?: Array<{ key: string; remainingMs: number }>;
  /**
   * W66 Ironmoor — true when the run was started in single-life mode.
   * Resumed runs HONOUR this field over the live `ironmoorMode` setting
   * so a mid-run toggle-off can't retroactively grant Second Wind
   * (which would break the permadeath contract). Absent on pre-W66
   * payloads; coerced to `false` in that case.
   */
  ironmoor?: boolean;
  /**
   * Cairn Stacking v2 — mid-run persistence of the partial stack counter
   * so a player who quits after two stones doesn't lose their progress.
   * All three fields are optional for backwards-compat with pre-persistence
   * saves; absent → defaults (0 stones, first-spawn cadence).
   */
  cairnStackCount?: number;
  cairnSpawnedCount?: number;
  cairnNextSpawnAtSec?: number;
}

export interface ISaveDataV3 {
  saveVersion: 3;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
}

export interface ISaveDataV4 {
  saveVersion: 4;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
}

export interface ISaveDataV5 {
  saveVersion: 5;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  /** FTUE / one-shot onboarding — persisted in meta save. */
  hasCompletedTutorial: boolean;
  /** Drift mechanic hint — shown once on first run. */
  hasSeenDriftTutorial: boolean;
}

/** Per-run snapshot stored in history. */
export interface RunHistoryEntry {
  timestamp: number;
  timeSurvivedSec: number;
  enemiesKilled: number;
  level: number;
  bossKills: number;
  goldEarned: number;
  bestCombo: number;
  variantKey: string;
  isVictory: boolean;
  weaponKeys: string[];
  /** 32-bit RNG seed this run used (V8+). Absent for legacy entries. */
  runSeed?: number;
  /** True when the run was launched from the Daily Challenge (V8+). */
  isDaily?: boolean;
  /** LG T5 — cosmetic display name for this run. */
  name?: string;
}

/**
 * Daily Challenge progress for the current calendar day. Cleared whenever
 * `dateKey` mismatches today — one completable challenge per local date.
 */
export interface DailyChallengeState {
  /** "YYYY-MM-DD" local; the date this state refers to. */
  dateKey: string;
  /** Best time survived on this daily (seconds). */
  bestTimeSec: number;
  /** Highest enemy kill count on this daily. */
  bestEnemiesKilled: number;
  /** Attempts made today; increments on every run ended during the daily. */
  attempts: number;
  /** True once the player has cleared the daily victory condition today. */
  completedVictory: boolean;
}

export interface ISaveDataV6 {
  saveVersion: 6;
  totalKills: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  runHistory: RunHistoryEntry[];
}

/**
 * V7 splits `totalKills` into two concerns:
 *  - `totalKills`: current spendable balance (MetaShop currency)
 *  - `totalKillsSpent`: monotonic lifetime total debited by MetaShop purchases
 *
 * Achievement thresholds read the SUM (`totalKills + totalKillsSpent`) so
 * players who spend heavily in the shop don't lose progress toward
 * `ach_kills_1000` / `ach_kills_5000`.
 */
export interface ISaveDataV7 {
  saveVersion: 7;
  totalKills: number;
  totalKillsSpent: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  runHistory: RunHistoryEntry[];
}

/**
 * V8 adds Daily Challenge tracking. Run history entries additionally carry
 * `runSeed` + `isDaily` fields (both optional for legacy entries); migration
 * preserves history and seeds daily state to null.
 */
export interface ISaveDataV8 {
  saveVersion: 8;
  totalKills: number;
  totalKillsSpent: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  /** One-shot: first time an affixed gold elite appears — tutorial banner. */
  hasSeenEliteAffixTip: boolean;
  /** One-shot: first moor moment in a run explains the hearth beat. */
  hasSeenMoorMomentTip: boolean;
  /** Lifetime moor moment gifts received (achievement + flavour). */
  moorMomentsLifetime: number;
  runHistory: RunHistoryEntry[];
  /** null when the player has never attempted a daily, or when state is for a past date (will reset). */
  dailyChallenge: DailyChallengeState | null;
}

/**
 * V9 — lifetime enemy codex: sorted unique enemy keys the player has culled at least once.
 * Used for first-cull discovery toast + future UI; no gameplay gates.
 */
export interface ISaveDataV9 {
  saveVersion: 9;
  totalKills: number;
  totalKillsSpent: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  hasSeenEliteAffixTip: boolean;
  hasSeenMoorMomentTip: boolean;
  /** One-shot: first time Ceilidh Chain (every-8th-kill magnet pulse) fires. */
  hasSeenCeilidhChainTip: boolean;
  /** One-shot: first run the 5:00 standing-stones trinity spawns. */
  hasSeenStandingStonesTip: boolean;
  /** One-shot: first run a spectral Ancestral Echo appears at last-death spot. */
  hasSeenAncestralEchoTip: boolean;
  moorMomentsLifetime: number;
  runHistory: RunHistoryEntry[];
  dailyChallenge: DailyChallengeState | null;
  codexCulledKeys: string[];
}

/**
 * V10 — The Moor Remembers (`docs/superpowers/specs/2026-05-22-the-moor-remembers-design.md`).
 * Adds `fallenCairns` (cap 50, FIFO) — persistent cross-run death markers
 * that materialise as Cairns-of-Echoes on future runs. Adds
 * `oldDroverRevealedCount` — count of grandfather hints revealed (0..25),
 * separate from the cairn array because it advances independently of
 * cairn lifetime.
 */
export interface ISaveDataV10 {
  saveVersion: 10;
  totalKills: number;
  totalKillsSpent: number;
  unlockedWeapons: string[];
  unlockedUpgrades: string[];
  activeRun: IRunState | null;
  unlockedAchievements: string[];
  hasCompletedTutorial: boolean;
  hasSeenDriftTutorial: boolean;
  hasSeenEliteAffixTip: boolean;
  hasSeenMoorMomentTip: boolean;
  hasSeenCeilidhChainTip: boolean;
  hasSeenStandingStonesTip: boolean;
  hasSeenAncestralEchoTip: boolean;
  moorMomentsLifetime: number;
  runHistory: RunHistoryEntry[];
  dailyChallenge: DailyChallengeState | null;
  codexCulledKeys: string[];
  fallenCairns: FallenCairn[];
  /** 0..25 — count of grandfather hints revealed across all runs. */
  oldDroverRevealedCount: number;
}

/**
 * V11 — Moor Remembers V2 (`docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`).
 * Per-cairn state via the optional `wreathedAt` / `extinguishedAt` fields
 * on `FallenCairn`. No top-level fields added; the data delta lives in
 * the cairn records themselves.
 */
export interface ISaveDataV11 extends Omit<ISaveDataV10, 'saveVersion'> {
  saveVersion: 11;
}

export type ISaveData = ISaveDataV11;

export const CURRENT_SAVE_VERSION = 11 as const;

export const MAX_RUN_HISTORY = 20;

const DEFAULT_SAVE: ISaveData = {
  saveVersion: CURRENT_SAVE_VERSION,
  totalKills: 0,
  totalKillsSpent: 0,
  unlockedWeapons: [],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: false,
  hasSeenDriftTutorial: false,
  hasSeenEliteAffixTip: false,
  hasSeenMoorMomentTip: false,
  hasSeenCeilidhChainTip: false,
  hasSeenStandingStonesTip: false,
  hasSeenAncestralEchoTip: false,
  moorMomentsLifetime: 0,
  runHistory: [],
  dailyChallenge: null,
  codexCulledKeys: [],
  fallenCairns: [],
  oldDroverRevealedCount: 0,
};

function clampInt(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function clampNumber(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return n;
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function toOptionalStringArray(v: unknown): string[] | undefined {
  return Array.isArray(v) ? toStringArray(v) : undefined;
}

/** Sorted unique strings — stable JSON for codex keys. */
function coerceCodexCulledKeys(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const raw = v.filter((x): x is string => typeof x === 'string' && x.length > 0);
  return [...new Set(raw)].sort();
}

function coerceFallenCairns(v: unknown): FallenCairn[] {
  if (!Array.isArray(v)) return [];
  const out: FallenCairn[] = [];
  const ALLOWED_STATS: FallenCairn['inheritedStat'][] = [
    'damage', 'speed', 'pickupRadius', 'critChance', 'cooldown', 'driftResist',
  ];
  for (const raw of v) {
    if (typeof raw !== 'object' || raw === null) continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.x !== 'number' || !Number.isFinite(o.x)) continue;
    if (typeof o.y !== 'number' || !Number.isFinite(o.y)) continue;
    const cause = typeof o.cause === 'string' ? o.cause : 'unknown';
    const variantKey = typeof o.variantKey === 'string' && o.variantKey ? o.variantKey : 'classic';
    const timeSurvivedMs = clampInt(o.timeSurvivedMs, 0);
    const inheritedStatRaw = typeof o.inheritedStat === 'string' ? o.inheritedStat : 'damage';
    const inheritedStat = ALLOWED_STATS.includes(inheritedStatRaw as FallenCairn['inheritedStat'])
      ? (inheritedStatRaw as FallenCairn['inheritedStat'])
      : 'damage';
    const savedAt = clampInt(o.savedAt, 0);
    const cairn: FallenCairn = { x: o.x, y: o.y, cause, variantKey, timeSurvivedMs, inheritedStat, savedAt };
    // V11 — optional per-cairn state. Absent on v10 records (load as undefined).
    const wreathedAt = typeof o.wreathedAt === 'number' && Number.isFinite(o.wreathedAt)
      ? clampInt(o.wreathedAt, 0)
      : undefined;
    const extinguishedAt = typeof o.extinguishedAt === 'number' && Number.isFinite(o.extinguishedAt)
      ? clampInt(o.extinguishedAt, 0)
      : undefined;
    if (wreathedAt !== undefined && wreathedAt > 0) {
      out.push({ ...cairn, wreathedAt });
    } else if (extinguishedAt !== undefined && extinguishedAt > 0) {
      out.push({ ...cairn, extinguishedAt });
    } else {
      out.push(cairn);
    }
  }
  return out;
}

function coerceOldDroverRevealedCount(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  return Math.min(25, Math.max(0, Math.floor(v)));
}

function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

function toOptionalBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function toOptionalNonNegativeInt(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  if (v < 0) return undefined;
  return Math.floor(v);
}

function toPositiveNumberRecord(v: unknown): Record<string, number> | undefined {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(v)) {
    if (typeof key !== 'string' || !key) continue;
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue;
    out[key] = Math.floor(raw);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceWeaponSlot(raw: unknown): IRunWeaponSlot | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const key = typeof o.key === 'string' ? o.key : '';
  if (!key) return null;
  const level = Math.max(1, clampInt(o.level, 1));
  const evolved = Boolean(o.evolved);
  const evolutionKey = typeof o.evolutionKey === 'string' ? o.evolutionKey : '';
  return { key, level, evolved, evolutionKey };
}

function coerceIRunState(raw: unknown): IRunState | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const wraw = o.acquiredWeapons;
  const weapons: IRunWeaponSlot[] = [];
  if (Array.isArray(wraw)) {
    for (const x of wraw) {
      const s = coerceWeaponSlot(x);
      if (s) weapons.push(s);
    }
  }
  const variant = typeof o.selectedVariantKey === 'string' ? o.selectedVariantKey : '';
  if (!variant || weapons.length === 0) return null;

  return {
    gameTimeSec: Math.max(0, clampNumber(o.gameTimeSec, 0)),
    playerX: clampNumber(o.playerX, 0),
    playerY: clampNumber(o.playerY, 0),
    playerHealth: Math.max(0, clampNumber(o.playerHealth, 1)),
    playerMaxHp: Math.max(1, clampNumber(o.playerMaxHp, 1)),
    currentXp: Math.max(0, clampInt(o.currentXp, 0)),
    currentLevel: Math.max(1, clampInt(o.currentLevel, 1)),
    acquiredWeapons: weapons,
    selectedVariantKey: variant,
    killCount: Math.max(0, clampInt(o.killCount, 0)),
    ownedPassives: toStringArray(o.ownedPassives),
    evolvedWeaponKeys: toStringArray(o.evolvedWeaponKeys),
    bossKillCount: toOptionalNonNegativeInt(o.bossKillCount),
    bossGoldEarned: toOptionalNonNegativeInt(o.bossGoldEarned),
    coinGoldEarned: toOptionalNonNegativeInt(o.coinGoldEarned),
    coinGoldSpent: toOptionalNonNegativeInt(o.coinGoldSpent),
    revivalAvailable: toOptionalBool(o.revivalAvailable),
    bestCombo: toOptionalNonNegativeInt(o.bestCombo),
    comboCount: toOptionalNonNegativeInt(o.comboCount),
    comboTimerMs: toOptionalNonNegativeInt(o.comboTimerMs),
    dashCharges: toOptionalNonNegativeInt(o.dashCharges),
    dashCooldownMs: toOptionalNonNegativeInt(o.dashCooldownMs),
    weaponDamage: toPositiveNumberRecord(o.weaponDamage),
    spawnedBossKeys: Array.isArray(o.spawnedBossKeys)
      ? toStringArray(o.spawnedBossKeys)
      : undefined,
    shieldCooldownMs: toOptionalNonNegativeInt(o.shieldCooldownMs),
    heldRelicKeys: toOptionalStringArray(o.heldRelicKeys),
    actState: coerceRunActStateSnapshot(o.actState),
    ironmoor: toOptionalBool(o.ironmoor),
    tempBuffs: coerceTempBuffSnapshot(o.tempBuffs),
  };
}

function coerceTempBuffSnapshot(
  raw: unknown,
): NonNullable<IRunState['tempBuffs']> | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<IRunState['tempBuffs']> = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.key !== 'string' || o.key.length === 0) continue;
    const remainingMs = typeof o.remainingMs === 'number' ? o.remainingMs : 0;
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) continue;
    out.push({ key: o.key, remainingMs });
  }
  return out.length > 0 ? out : undefined;
}

function coerceRunActStateSnapshot(raw: unknown): IRunActStateSnapshot | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const currentAct = o.currentAct;
  if (currentAct !== 1 && currentAct !== 2 && currentAct !== 3) return undefined;
  const actStartTimeSec = Math.max(0, clampNumber(o.actStartTimeSec, 0));
  const rawHistory = o.pickerHistory;
  const pickerHistory: IRunActStateSnapshot['pickerHistory'] = [];
  if (Array.isArray(rawHistory)) {
    for (const p of rawHistory) {
      if (p === null || typeof p !== 'object') continue;
      const pp = p as Record<string, unknown>;
      if (pp.slot !== 'A' && pp.slot !== 'B') continue;
      if (typeof pp.routeKey !== 'string' || pp.routeKey.length === 0) continue;
      pickerHistory.push({
        slot: pp.slot,
        routeKey: pp.routeKey,
        atGameTimeSec: Math.max(0, clampNumber(pp.atGameTimeSec, 0)),
        defaultedBySetting: toOptionalBool(pp.defaultedBySetting) === true,
      });
    }
  }
  const currentNodeIndex = toOptionalNonNegativeInt(o.currentNodeIndex);
  const nodeOutcomes = coerceNodeOutcomes(o.nodeOutcomes);
  const nodeMap = coerceNodeMapSnapshot(o.nodeMap);
  const out: IRunActStateSnapshot = { currentAct, actStartTimeSec, pickerHistory };
  if (currentNodeIndex !== undefined) out.currentNodeIndex = currentNodeIndex;
  if (nodeOutcomes !== undefined) out.nodeOutcomes = nodeOutcomes;
  if (nodeMap !== undefined) out.nodeMap = nodeMap;
  return out;
}

function coerceNodeMapSnapshot(
  raw: unknown,
): NonNullable<IRunActStateSnapshot['nodeMap']> | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if (o.act !== 1 && o.act !== 2 && o.act !== 3) return undefined;
  const nodeKeys = toStringArray(o.nodeKeys);
  if (nodeKeys.length === 0) return undefined;
  const positionsRaw = o.worldPositions;
  if (!Array.isArray(positionsRaw)) return undefined;
  const worldPositions: Array<{ x: number; y: number }> = [];
  for (const item of positionsRaw) {
    if (item === null || typeof item !== 'object') continue;
    const pp = item as Record<string, unknown>;
    if (typeof pp.x !== 'number' || typeof pp.y !== 'number') continue;
    if (!Number.isFinite(pp.x) || !Number.isFinite(pp.y)) continue;
    worldPositions.push({ x: pp.x, y: pp.y });
  }
  // Length parity: nodes vs positions must agree, otherwise the snapshot
  // is unusable (buildNodeMapState throws). Drop rather than partially
  // restore — the legacy re-roll fallback gives a coherent fresh map.
  if (worldPositions.length !== nodeKeys.length) return undefined;
  const visitedRaw = o.visited;
  const visited: boolean[] = [];
  if (Array.isArray(visitedRaw)) {
    for (let i = 0; i < nodeKeys.length; i++) {
      visited.push(visitedRaw[i] === true);
    }
  } else {
    for (let i = 0; i < nodeKeys.length; i++) visited.push(false);
  }
  return { act: o.act, nodeKeys, worldPositions, visited };
}

function coerceNodeOutcomes(raw: unknown): NonNullable<IRunActStateSnapshot['nodeOutcomes']> | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<IRunActStateSnapshot['nodeOutcomes']> = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.nodeKey !== 'string' || o.nodeKey.length === 0) continue;
    const visitedAtGameTimeSec = Math.max(0, clampNumber(o.visitedAtGameTimeSec, 0));
    const entry: NonNullable<IRunActStateSnapshot['nodeOutcomes']>[number] = {
      nodeKey: o.nodeKey,
      visitedAtGameTimeSec,
    };
    if (typeof o.chosenRewardKey === 'string' && o.chosenRewardKey.length > 0) {
      entry.chosenRewardKey = o.chosenRewardKey;
    }
    out.push(entry);
  }
  return out.length > 0 ? out : undefined;
}

function coerceRunHistoryEntry(raw: unknown): RunHistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const variantKey = typeof o.variantKey === 'string' ? o.variantKey : '';
  if (!variantKey) return null;
  const entry: RunHistoryEntry = {
    timestamp: clampInt(o.timestamp, 0),
    timeSurvivedSec: Math.max(0, clampNumber(o.timeSurvivedSec, 0)),
    enemiesKilled: clampInt(o.enemiesKilled, 0),
    level: Math.max(1, clampInt(o.level, 1)),
    bossKills: clampInt(o.bossKills, 0),
    goldEarned: clampInt(o.goldEarned, 0),
    bestCombo: clampInt(o.bestCombo, 0),
    variantKey,
    isVictory: toBool(o.isVictory, false),
    weaponKeys: toStringArray(o.weaponKeys),
  };
  // Optional V8+ fields — absent from legacy entries; we don't fabricate values
  // for them since UI distinguishes "no seed recorded" from "seed 0".
  if (typeof o.runSeed === 'number' && Number.isFinite(o.runSeed)) {
    entry.runSeed = Math.floor(Math.abs(o.runSeed));
  }
  if (typeof o.isDaily === 'boolean') {
    entry.isDaily = o.isDaily;
  }
  if (typeof o.name === 'string' && o.name.length > 0) {
    entry.name = o.name;
  }
  return entry;
}

function coerceDailyChallenge(raw: unknown): DailyChallengeState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const dateKey = typeof o.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.dateKey)
    ? o.dateKey
    : '';
  if (!dateKey) return null;
  return {
    dateKey,
    bestTimeSec: Math.max(0, clampNumber(o.bestTimeSec, 0)),
    bestEnemiesKilled: clampInt(o.bestEnemiesKilled, 0),
    attempts: clampInt(o.attempts, 0),
    completedVictory: toBool(o.completedVictory, false),
  };
}

function coerceRunHistory(raw: unknown): RunHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RunHistoryEntry[] = [];
  for (const item of raw) {
    const entry = coerceRunHistoryEntry(item);
    if (entry) out.push(entry);
  }
  return out.slice(-MAX_RUN_HISTORY);
}

export interface PersonalBests {
  bestTime: number;
  bestKills: number;
  bestCombo: number;
  bestLevel: number;
  bestGold: number;
}

export class SaveManager {
  private key: string;
  private storage: StorageLike;

  constructor(opts?: { key?: string; storage?: StorageLike }) {
    this.key = opts?.key ?? 'whs_meta_save';
    this.storage = opts?.storage ?? defaultStorage();
  }

  load(): ISaveData {
    const raw = this.storage.getItem(this.key);
    if (!raw) return { ...DEFAULT_SAVE };

    try {
      const parsed: unknown = JSON.parse(raw);
      return this.migrateAndCoerce(parsed);
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: ISaveData): void {
    const coerced = this.migrateAndCoerce(data);
    try {
      this.storage.setItem(this.key, JSON.stringify(coerced));
    } catch (err) {
      // Storage can throw in private mode, quota exhaustion, or blocked contexts.
      // T131 — surface the failure so a UI listener can toast the player
      // instead of the previous silent swallow.
      emitSaveFailure('meta', err);
    }
  }

  reset(): void {
    this.storage.removeItem(this.key);
  }

  update(fn: (current: ISaveData) => ISaveData): ISaveData {
    const next = fn(this.load());
    this.save(next);
    return next;
  }

  /** Persist in-progress run (tab close / background). */
  saveActiveRun(run: IRunState): void {
    const coercedRun = coerceIRunState(run);
    if (!coercedRun) return;
    this.update((cur) => ({ ...cur, activeRun: coercedRun }));
  }

  clearActiveRun(): void {
    this.update((cur) => ({ ...cur, activeRun: null }));
  }

  recordRunToHistory(entry: RunHistoryEntry): void {
    const coerced = coerceRunHistoryEntry(entry);
    if (!coerced) return;
    this.update((cur) => {
      const history = [...cur.runHistory, coerced];
      if (history.length > MAX_RUN_HISTORY) history.splice(0, history.length - MAX_RUN_HISTORY);
      return { ...cur, runHistory: history };
    });
  }

  getRunHistory(): RunHistoryEntry[] {
    return this.load().runHistory;
  }

  getPersonalBests(): PersonalBests {
    const history = this.load().runHistory;
    const bests: PersonalBests = { bestTime: 0, bestKills: 0, bestCombo: 0, bestLevel: 0, bestGold: 0 };
    for (const entry of history) {
      if (entry.timeSurvivedSec > bests.bestTime) bests.bestTime = entry.timeSurvivedSec;
      if (entry.enemiesKilled > bests.bestKills) bests.bestKills = entry.enemiesKilled;
      if (entry.bestCombo > bests.bestCombo) bests.bestCombo = entry.bestCombo;
      if (entry.level > bests.bestLevel) bests.bestLevel = entry.level;
      if (entry.goldEarned > bests.bestGold) bests.bestGold = entry.goldEarned;
    }
    return bests;
  }

  private migrateAndCoerce(input: unknown): ISaveData {
    const obj = (typeof input === 'object' && input !== null) ? (input as Record<string, unknown>) : {};

    // A missing or non-numeric saveVersion means corrupt data (truncated
    // write, hand-edited, etc.). Prior to this guard, a blob like
    // {"totalKills": 2500} would be silently loaded as the current version
    // with all other fields defaulted — losing achievements, run history,
    // and tutorial flags without warning. Start fresh instead.
    if (typeof obj.saveVersion !== 'number' || !Number.isFinite(obj.saveVersion) || obj.saveVersion <= 0) {
      return { ...DEFAULT_SAVE };
    }
    const v = Math.max(1, Math.floor(obj.saveVersion));

    const totalKills = clampInt(obj.totalKills, 0);
    const totalKillsSpent = clampInt(obj.totalKillsSpent, 0);
    const unlockedWeapons = toStringArray(obj.unlockedWeapons);
    const unlockedUpgrades = toStringArray(obj.unlockedUpgrades);
    const activeRun = coerceIRunState(obj.activeRun);
    const unlockedAchievements = toStringArray(obj.unlockedAchievements);
    const hasCompletedTutorial = toBool(obj.hasCompletedTutorial, false);
    const hasSeenDriftTutorial = toBool(obj.hasSeenDriftTutorial, false);
    const hasSeenEliteAffixTip = toBool(obj.hasSeenEliteAffixTip, false);
    const hasSeenMoorMomentTip = toBool(obj.hasSeenMoorMomentTip, false);
    const hasSeenCeilidhChainTip = toBool(obj.hasSeenCeilidhChainTip, false);
    const hasSeenStandingStonesTip = toBool(obj.hasSeenStandingStonesTip, false);
    const hasSeenAncestralEchoTip = toBool(obj.hasSeenAncestralEchoTip, false);
    const moorMomentsLifetime = clampInt(obj.moorMomentsLifetime, 0);
    const codexCulledKeys = coerceCodexCulledKeys(obj.codexCulledKeys);
    const fallenCairns = coerceFallenCairns(obj.fallenCairns);
    const oldDroverRevealedCount = coerceOldDroverRevealedCount(obj.oldDroverRevealedCount);

    const runHistory = coerceRunHistory(obj.runHistory);

    if (v === 1) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 2) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 3) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 4) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial: false,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 5) {
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 6) {
      // V6 didn't know about totalKillsSpent — existing lifetime kills were
      // conflated into totalKills with no spend tracking. Seed spent to 0;
      // achievement checks now read (totalKills + totalKillsSpent).
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent: 0,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory,
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    if (v === 7) {
      // V7 didn't know about daily challenge — start with no daily state;
      // it will populate on the next daily attempt.
      return {
        saveVersion: CURRENT_SAVE_VERSION,
        totalKills,
        totalKillsSpent,
        unlockedWeapons,
        unlockedUpgrades,
        activeRun,
        unlockedAchievements,
        hasCompletedTutorial,
        hasSeenDriftTutorial,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory,
        dailyChallenge: null,
        codexCulledKeys: [],
        fallenCairns: [],
        oldDroverRevealedCount: 0,
      };
    }

    return {
      saveVersion: CURRENT_SAVE_VERSION,
      totalKills,
      totalKillsSpent,
      unlockedWeapons,
      unlockedUpgrades,
      activeRun,
      unlockedAchievements,
      hasCompletedTutorial,
      hasSeenDriftTutorial,
      hasSeenEliteAffixTip,
      hasSeenMoorMomentTip,
      hasSeenCeilidhChainTip,
      hasSeenStandingStonesTip,
      hasSeenAncestralEchoTip,
      moorMomentsLifetime,
      runHistory,
      dailyChallenge: coerceDailyChallenge(obj.dailyChallenge),
      codexCulledKeys,
      fallenCairns,
      oldDroverRevealedCount,
    };
  }

  getFallenCairns(): FallenCairn[] {
    return this.load().fallenCairns;
  }

  recordFallenCairn(cairn: FallenCairn): void {
    this.update((cur) => ({
      ...cur,
      fallenCairns: recordFallenCairn(cur.fallenCairns, cairn),
    }));
  }

  getOldDroverRevealedCount(): number {
    return this.load().oldDroverRevealedCount;
  }

  incrementOldDroverRevealed(): number {
    let next = 0;
    this.update((cur) => {
      next = Math.min(25, cur.oldDroverRevealedCount + 1);
      return { ...cur, oldDroverRevealedCount: next };
    });
    return next;
  }

  /** V2 — mark the named cairns as wreathed (successful Cailleach Gauntlet). */
  markCairnsWreathed(savedAts: readonly number[], now: number = Date.now()): void {
    this.update((cur) => ({
      ...cur,
      fallenCairns: markWreathed(cur.fallenCairns, savedAts, now),
    }));
  }

  /** V2 — mark the named cairns as extinguished (failed Cailleach Gauntlet). */
  markCairnsExtinguished(savedAts: readonly number[], now: number = Date.now()): void {
    this.update((cur) => ({
      ...cur,
      fallenCairns: markExtinguished(cur.fallenCairns, savedAts, now),
    }));
  }
}

function defaultStorage(): StorageLike {
  const ls = (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
  if (ls) return ls;
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => { mem.set(k, v); },
    removeItem: (k) => { mem.delete(k); },
  };
}
