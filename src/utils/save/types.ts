/**
 * Save schema type definitions. Pure types — no runtime imports.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.1). Consumers continue importing from `'./save'` via the
 * barrel re-export; this file is the single source of truth for shape.
 */

import type { RoutePick } from '../../data/routes';
import type { NodeOutcome } from '../../data/nodeTypes';
import type { RelicKey } from '../../data/relics';
import type { ReplayBlobAny } from '../../replay/replayBlob';
import type { VariantKey } from '../../data/variants';
import type { DiscoveryLog } from '../../systems/DiscoveryLog';

/**
 * @deprecated Legacy audio on/off booleans — real audio state lives in
 * `SettingsManager` (`sfxVolume` / `musicVolume`). These fields are kept
 * in the schema so existing save files still load, but nothing reads them
 * at runtime anymore. Do not add new consumers. New audio preferences go
 * through SettingsManager; add them to that module, not here.
 */
export interface SaveSettings {
  /** @deprecated read `SettingsManager.load().sfxVolume > 0` instead */
  soundOn: boolean;
  /** @deprecated read `SettingsManager.load().musicVolume > 0` instead */
  musicOn: boolean;
}

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
  /** Curse key if the player took one for this run — powers the Chronicle badge. */
  curseKey?: string;
  /** W2 Moor Road picker history. Absent on pre-v4 entries; default []. */
  routes?: RoutePick[];
  /**
   * R1 Relics — which relics the player held when the run ended. Pre-v9
   * entries have it absent; migration/coercion defaults to [] for
   * back-compat. Coercion also drops stale keys that no longer exist in
   * `RELIC_KEYS` so a renamed or removed relic in a future release
   * doesn't corrupt the Chronicle.
   */
  relics?: RelicKey[];
  /** 32-bit RNG seed for this run — enables Chronicle "rerun this seed". */
  runSeed?: number;
  /** W66 Ironmoor — true when the run was taken with ironmoorMode on. */
  ironmoor?: boolean;
  /**
   * T1 deterministic replay — per-frame input + delta capture attached
   * to the run when record mode was active at start. Absent on runs
   * recorded before replay v1 shipped, and on runs where replay mode
   * was off. Schema v5 added this field; v6 widened to `ReplayBlobAny`
   * so Phase 3 recordings (v2 blobs with curse / routes / composedStats)
   * persist alongside v1 blobs from older saves.
   */
  replay?: ReplayBlobAny;
  /** LG T3 — display name for this run, stable-hashed from seed on first load. */
  name?: string;
  /**
   * E1 M1 — seasonal event key active when this run was recorded
   * (e.g. 'burns_night'). Absent on runs played outside any event
   * window and on pre-v13 entries. Chronicle displays the event
   * badge alongside the run; coercion drops unknown keys so a
   * future renamed event doesn't corrupt old entries.
   */
  seasonalEvent?: string;
  /**
   * M1 Moor Road multi-node — ordered log of every node visited during
   * the run (across all acts). Absent on pre-v16 entries; coercion
   * defaults to [] for back-compat. Used by Chronicle to display path
   * breadcrumbs and by ReplayInput (v3 blob) to reconstruct events
   * without rerolling RNG.
   */
  nodeOutcomes?: NodeOutcome[];
}

export interface SaveData {
  schemaVersion: number;

  /** Golden Haggis — permanent currency */
  gold: number;

  /** Permanent upgrade levels (keyed by upgrade ID) */
  upgrades: Record<string, number>;

  /** Unlocked haggis variant keys */
  unlockedVariants: VariantKey[];

  /** Active haggis variant for the next run */
  selectedVariant: VariantKey;

  /** Total runs played */
  totalRuns: number;

  /** Best survival time in seconds */
  bestTime: number;

  /** Best kills in a single run */
  bestKills: number;

  /** Total kills across all runs */
  totalKills: number;

  /** Total gold earned across all runs */
  totalGoldEarned: number;

  /** Best combo in a single run */
  bestCombo: number;

  /** Total completed victories */
  victories: number;

  /**
   * Longest Post-Bell survival time in seconds (measured from the Taxman
   * kill onward, so it's always additive on top of the normal 20-minute
   * run). Optional + defaulted for back-compat; no schema bump needed.
   */
  bestEndlessSeconds?: number;

  /**
   * W66 Ironmoor: fastest Ironmoor-mode victory time in seconds, or 0 if
   * no Ironmoor victory yet. Separate leaderboard — does not mix with
   * `bestTime` (regular runs). Optional + defaulted for back-compat; no
   * schema bump needed.
   */
  bestIronmoorSeconds?: number;

  /**
   * Ancestral Echoes — last-death position persisted across runs so the
   * next run can spawn a spectral haggis at the spot. `ts` is a unix
   * milliseconds stamp used to expire stale echoes (24h TTL). Absent on
   * fresh saves and when the last run ended in victory.
   */
  lastDeath?: { x: number; y: number; ts: number };

  /**
   * Lifetime count of Standing Stones picked, keyed by boon id
   * ('mending' / 'fire' / 'haste'). Chronicle aggregates surface which
   * boon the player favours. Optional + defaulted; back-compat with
   * pre-stones saves.
   */
  standingStonesPicked?: Record<string, number>;

  /**
   * Lifetime count of Reliquary curios picked, keyed by curio id
   * ('echoing_reed' / 'flint_charm' / 'cairn_moss'). Powers the
   * `ach_relic_seeker` deed and lets future chronicle surfaces
   * show which curio the player favours. Optional + defaulted —
   * pre-reliquary saves read as undefined and coerce to `{}`.
   */
  reliquaryCuriosPicked?: Record<string, number>;

  /**
   * Lifetime count of Ancestral Echoes the player has touched. Surfaced
   * on the Chronicle once non-zero. Optional + defaulted.
   */
  ancestralEchoesTouched?: number;

  /**
   * Lifetime count of Ceilidh Chain pulses fired (every-8th-kill magnet
   * flare). Powers the "Ceilidh Commander" deed once the lifetime count
   * crosses its threshold. Optional + defaulted.
   */
  ceilidhPulsesLifetime?: number;

  /**
   * Total cursed-run victories across all time. Unlocks the Cailleach
   * variant at count=3. Retroactively seeded from runHistory on first
   * load for existing players who already have past cursed victories.
   */
  cursedVictoriesCompleted: number;

  /**
   * V2 Track 1 — total victorious runs completed without ever standing
   * in a healing circle. Unlocks the Doric Quinie variant at count=1.
   * No retroactive seed possible (pre-v10 runs didn't track per-run
   * healing-circle overlap); fresh counter starts at 0 for all players.
   */
  runsWithoutHealingCircleCompleted: number;

  /**
   * V2 Track 2 — total victorious runs where biomes visited were a
   * subset of {loch, pine} — the "coastal" biomes, never bog or
   * heather (the "moor" biomes). Unlocks the Peerie Shetlander at 1.
   * No retroactive seed possible (pre-v11 runs didn't persist per-run
   * biomes-visited set). Fresh counter starts at 0 for all players.
   */
  runsInCoastalOnlyCompleted: number;

  /**
   * V2 Track 3 — total victorious runs where the player reached the
   * `BURNS_EVOLUTION_THRESHOLD` (7) — i.e. all seven evolvable weapons
   * reached evolved form in the same run. No retroactive seed possible
   * (pre-v12 runs didn't persist per-run evolution count). Fresh
   * counter starts at 0 for all. (Kept for internal stat tracking;
   * Burns's Wee Beastie unlock now gates on the tightened v15
   * `burnsNightFullEvoRunsCompleted` counter instead.)
   */
  runsWithAllEvolutionsCompleted: number;

  /**
   * E1 M2 T11 — total victorious runs that (a) met the full-evo
   * threshold AND (b) landed inside a real-world Burns Night window.
   * This is the unlock gate for Burns's Wee Beastie in v15+ — ties
   * the variant to the bard's actual week on the calendar. No
   * retroactive seed possible; the seasonal event stamp was only
   * introduced in v13 and we never recorded evolvedWeaponCount on
   * history entries. Fresh counter starts at 0 for all. v15 addition.
   */
  burnsNightFullEvoRunsCompleted: number;

  /**
   * H1 Gran's Croft — per-boss kill tally powering mantelpiece trophy
   * tiers (see `src/scenes/croft/CroftTrophies.ts`). Keys are boss IDs
   * from `BOSSES` (gordon / tour_bus / laird / hunter_general / taxman);
   * values are lifetime kill counts.
   *
   * Retroactive seed (v13→v14): existing players get three boss counts
   * reconstructed from `runHistory` using W2 act gates — picked
   * act 1 routes imply gordon kills, picked act 2 routes imply
   * tour_bus kills, victorious runs imply taxman kills. Mid-act bosses
   * (laird, hunter_general) are not gate-bound so their retroactive
   * counts start at 0 and fill in from T15's live kill hook. v14 addition.
   */
  bossKillCounts: Record<string, number>;

  /**
   * H1 Gran's Croft — set of Moor Road route keys ever picked (dedupe-
   * unioned across all runs). Powers the photo wall polaroids:
   * sepia-to-colour fade on first pick, colour print thereafter.
   * Retroactively seeded from `runHistory[].routes[].routeKey` at
   * migration. v14 addition.
   */
  firstRouteVisits: string[];

  /**
   * H1 Gran's Croft — per-boss cursed-victory tally. Promotes the
   * mantelpiece trophy to its "cursed" tier (singed apron, cracked
   * windshield, red-ink bleed — see spec §3). Retroactive seed bumps
   * `taxman` only (we know cursed + victory = taxman kill); other
   * bosses' cursed-kill counts start at 0. v14 addition.
   */
  cursedVictoriesByBoss: Record<string, number>;

  /** Per-run history (capped at MAX_RUN_HISTORY, newest last). */
  runHistory: RunHistoryEntry[];

  /**
   * B1 banter density push — enemy types the player has ever seen spawn.
   * Used by `enemy_ambient` banter pool to distinguish first-encounter
   * (high-priority flavour line) from routine respawn (rare 1/20 tick).
   * Deduped + string-coerced at load. v7 addition.
   */
  seenEnemies: string[];

  /**
   * B1 banter density push — stable IDs of first-time banter reservations
   * that have already fired (e.g. `first_boss_gordon`, `first_evo_thistle`).
   * `first_time` pool priority 110 reads this set to gate emission.
   * Deduped + string-coerced at load. v7 addition.
   */
  firstTimeEventsFired: string[];

  /**
   * C1 Highland Almanac — discovery-log tracking for the four-book meta.
   * Pure data; all increments live in `src/systems/DiscoveryLog.ts`.
   * Pre-v8 saves get a retroactive seed from `runHistory` on first load
   * (routes + weapons reconstructible; beasties + banter start empty).
   * v8 addition.
   */
  discoveryLog: DiscoveryLog;

  /**
   * U1 Rune-tier meta-unlock. Each rune id written once the first time
   * it appears in a card-draw offer (NOT once picked — seeing it counts).
   * Deduped + string-coerced at load. Pre-v17 saves default to `[]`
   * so returning players start the collection from zero without losing
   * any other data. v17 addition.
   */
  seenRunes: string[];

  /** Settings */
  settings: SaveSettings;
}

export interface RunSummary {
  timeSurvivedSec: number;
  enemiesKilled: number;
  bossGold: number;
  coinGold?: number;
  /**
   * Gold spent mid-run (W2 node trader). `computeGoldReward` subtracts
   * this so a mid-run spend reduces the post-run Golden Haggis mint —
   * preventing a double-dip where the player buys a relic AND banks
   * the earned gold at full value.
   */
  coinGoldSpent?: number;
  bestCombo?: number;
  victory?: boolean;
  /**
   * Optional end-of-run gold multiplier, applied inside `computeGoldReward`.
   * Used by curse-of-the-moor picks. Defaults to 1.0 (no change).
   */
  goldMult?: number;
}

/** Extra context for run history recording (not needed for gold/unlock calculation). */
export interface RunHistoryContext {
  level: number;
  bossKills: number;
  variantKey: string;
  weaponKeys: string[];
  /** Curse key active for this run (if any). Passed through to history. */
  curseKey?: string;
  /** Between-act picker resolutions (W2). Passed through to history. */
  routes?: RoutePick[];
  /** R1 Relics held at run-end. Passed through to history for Chronicle / Almanac display. */
  relics?: RelicKey[];
  /**
   * V2 Track 1 — true if the player ever overlapped a healing circle
   * during this run. A `false`-on-victory bumps
   * `runsWithoutHealingCircleCompleted` and unlocks the Doric Quinie
   * variant. Not persisted per-run — only influences lifetime counter.
   */
  enteredHealingCircle?: boolean;
  /**
   * V2 Track 2 — the set of biome IDs the player entered during this
   * run (non-empty on completed runs). When the run is victorious AND
   * the set is a non-empty subset of `COASTAL_BIOMES` (loch + pine),
   * `runsInCoastalOnlyCompleted` increments and the Peerie Shetlander
   * unlocks. Not persisted per history entry.
   */
  biomesVisited?: readonly string[];
  /**
   * V2 Track 3 — number of weapons that reached evolved form this run.
   * Compared against `BURNS_EVOLUTION_THRESHOLD` (7); a victory at
   * threshold bumps `runsWithAllEvolutionsCompleted` and unlocks the
   * Burns's Wee Beastie. Not persisted per history entry.
   */
  evolvedWeaponCount?: number;
  /** 32-bit RNG seed for this run — enables Chronicle "rerun this seed". */
  runSeed?: number;
  /** W66 Ironmoor flag passed through to RunHistoryEntry. */
  ironmoor?: boolean;
  /** T1 replay blob (optional) attached to this run's history entry. */
  replay?: ReplayBlobAny;
  /**
   * M1 Moor Road multi-node — resolved node outcomes from `RunActState`
   * (all acts concatenated in visit order). Passed through to
   * `RunHistoryEntry.nodeOutcomes` so Chronicle can render the walked
   * path and ReplayInput (v3) can reconstruct events without re-rolling.
   */
  nodeOutcomes?: readonly NodeOutcome[];
  /**
   * LG T3 — cosmetic run name generated at run start (Math.random-based,
   * kept outside runRng per determinism policy). Passing it through here
   * means the persisted entry matches the name the player saw on the
   * pause screen and the run-end framing — otherwise the Chronicle would
   * show a different backfilled hash-name on load.
   */
  name?: string;
  /**
   * E1 M2 T11 — active seasonal event key at run-end (resolved at
   * `buildContext()` time with the opt-out setting respected). When
   * set to `'burns_night'` on a full-evo victory, `applyRunSummary`
   * increments `burnsNightFullEvoRunsCompleted` and unlocks Burns's
   * Wee Beastie. Absent when no event was live or the player opted
   * out — the downstream check short-circuits without special-casing.
   */
  seasonalEventKey?: string;
}

export interface RunResult {
  save: SaveData;
  goldEarned: number;
  newlyUnlockedVariants: VariantKey[];
}

export interface PersonalBests {
  bestTime: number;
  bestKills: number;
  bestCombo: number;
}
