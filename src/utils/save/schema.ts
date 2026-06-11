/**
 * Save schema constants. Pure values — no logic, no IO.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.2). Bumping `SAVE_SCHEMA_VERSION` requires adding a matching
 * `migrateV{N-1}ToV{N}` step in `migrations.ts`.
 */

export const SAVE_SCHEMA_VERSION = 23;

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
 *
 * Re-exported from `BalanceConfig.ts`, where it's derived from
 * `EVOLUTION_RECIPES.length`. Adding a recipe automatically lifts the
 * threshold; the achievement copy interpolates `{count}` from this constant
 * (see `descriptionVars` on `ach_burns_beastie_unlock` and the `{count}`
 * placeholders in `i18n/achievement.ts` + `i18n.scs/achievement.ts`).
 *
 * Lives in `BalanceConfig` to avoid the circular import that would result
 * from `BalanceConfig` (achievement defs) reading a derived constant from
 * `save/schema.ts`. Re-exported here so existing call-sites keep working.
 */
export { BURNS_EVOLUTION_THRESHOLD } from '../../core/BalanceConfig';

/** Maximum number of run history entries kept (FIFO — oldest dropped on overflow). */
export const MAX_RUN_HISTORY = 20;

/** Ancestral Echoes — last-death position TTL (24h). */
export const LAST_DEATH_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum number of replay blobs retained in run history. */
export const REPLAY_HISTORY_CAP = 5;
