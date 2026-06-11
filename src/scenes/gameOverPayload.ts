import type { RunResult, RunSummary } from '../utils/save';
import type { PersonalBests } from '../core/SaveManager';
import type { DeathCause } from '../core/deathCauseClassifier';

/** Serializable run result passed from GameScene → GameOverScene (scene.start payload). */
export interface GameOverPayload {
  mode: 'victory' | 'death';
  /** Mirrors `mode === 'victory'` for consumers that prefer a boolean flag. */
  isVictory: boolean;
  summary: RunSummary;
  runResult: RunResult;
  xpLevel: number;
  bossKillCount: number;
  ownedPassiveCount: number;
  weaponCount: number;
  evolvedCount: number;
  buildSummary: string;
  variantLabel: string;
  /** Variant key for sprite/flavor lookup on the result screen. */
  variantKey?: string;
  /** Total damage dealt per weapon id (`WeaponDef.key`), from RunStatsTracker. */
  weaponDamage: Record<string, number>;
  /** Historical bests captured BEFORE this run was recorded — used for "NEW BEST!" comparison. */
  previousBests?: PersonalBests;
  /** User-facing share code for this run's RNG seed — shown on the result screen. */
  seedCode?: string;
  /** Raw numeric seed — enables the "↻ Same Seed" rerun on GameOverScene. */
  runSeed?: number;
  /** W66 Ironmoor — true when the run was taken with single-life mode on. */
  ironmoor?: boolean;
  /** Seconds the player survived past the Bell. Drives the postcard
   *  "🔔 +M:SS past the bell" tag. Absent (or 0) for normal runs. */
  postBellSec?: number;
  /** True when this run was a Daily Challenge attempt. */
  isDaily?: boolean;
  /** Classified reason for death — only set when `mode === 'death'`. */
  deathCause?: DeathCause;
  /** Curse key active for the run — drives the Game Over curse chip. */
  curseKey?: string;
  /**
   * The Pict variant — blocks the Gold Shop button on the result screen.
   * The Pict relies on in-run loot; they deal in deeds, not golden haggis.
   */
  noShopAccess?: boolean;
  /** Display name generated for this run — shown as epigraph on the result screen. */
  name?: string;
  /**
   * T402 (Game Over parity with Pause radiator) — Moor-Road act reached
   * (1-3). Omitted when undefined or 1 (act-1 default would clutter
   * post-run polishing); shown as "Act N / 3" once the player crossed
   * a picker. Mirrors `PauseStatsInput.currentAct`.
   */
  currentAct?: 1 | 2 | 3;
  /**
   * T402 — picker history this run, in pick order. Each entry is the
   * already-i18n-resolved route display label (so the helper stays
   * pure-string). Omitted when empty (pre-picker runs).
   */
  routeLabels?: readonly string[];
  /**
   * T402 — relic labels (already-i18n-resolved) held in the sporran at
   * run-end, in slot order. Omitted when empty.
   */
  relicLabels?: readonly string[];
  /**
   * T402 follow-up — owned rune labels (already-i18n-resolved) at
   * run-end, in acquisition order. Omitted when empty so the default
   * (no-runes) summary stays clean. Variant label already lives in
   * `variantLabel` above; this radiator does not duplicate it.
   */
  runeLabels?: readonly string[];
  /**
   * Wee Tales (2026-05-11) — boss enemy keys killed this run, in
   * kill order. Drives the wee-tale picker's `any_boss` umbrella
   * tag plus per-boss tags (gordon / tour_bus / taxman / …) so a
   * "three boss-skulls in the heather" line can match a real
   * triple-kill victory. Omitted when no boss was killed; defaults
   * to empty array on the consumer side.
   */
  bossKilledKeys?: readonly string[];
  /**
   * Wee Tales — biome IDs the player walked across this run. Drives
   * the optional `biome_*` tag clauses on the wee-tale picker so a
   * "felled at the heather edge" line can match the actual biome
   * spread. Omitted when empty.
   */
  biomesVisited?: readonly string[];
}
