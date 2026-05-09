/**
 * Save schema constants. Pure values — no logic, no IO.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.2). Bumping `SAVE_SCHEMA_VERSION` requires adding a matching
 * `migrateV{N-1}ToV{N}` step in `migrations.ts`.
 */

export const SAVE_SCHEMA_VERSION = 18;

/**
 * V2 Track 2 — the "coastal" biome set for the Peerie Shetlander
 * unlock. Subset of the four live biomes (see `src/data/biomes.ts`).
 * `loch` = water; `pine` = forested island landscape (Scottish isles
 * carry Scots pine where heather wouldn't thrive). Bog + heather are
 * "moor" biomes and disqualify the run.
 */
export const COASTAL_BIOMES: ReadonlySet<string> = new Set(['loch', 'pine']);

/**
 * V2 Track 3 — evolutions-threshold for the Burns's Wee Beastie unlock.
 * Seven of the eight weapons have an evolved form (bagpipes is
 * utility-only per CLAUDE.md); seven = the max achievable in one run.
 */
export const BURNS_EVOLUTION_THRESHOLD = 7;

/** Maximum number of run history entries kept (FIFO — oldest dropped on overflow). */
export const MAX_RUN_HISTORY = 20;

/** Ancestral Echoes — last-death position TTL (24h). */
export const LAST_DEATH_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum number of replay blobs retained in run history. */
export const REPLAY_HISTORY_CAP = 5;
