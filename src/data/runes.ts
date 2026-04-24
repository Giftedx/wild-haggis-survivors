/**
 * U1 Rune catalogue — third-tier rule-stack cards.
 *
 * A Rune is a *conditional rule*: when its condition is true, apply its
 * effect(s). Unlike stat cards (bigger number) or weapon cards (new tool),
 * Runes compose via overlapping truth — a fog-bog-cairn build is a different
 * run from a thirst-dash-combo build without any hardcoded pair-synergy.
 *
 * This module is PURE data. Condition evaluation lives in
 * `src/systems/runes/runeConditions.ts`; effect apply/remove in
 * `src/systems/runes/runeEffects.ts`; tick orchestration in
 * `src/systems/RuneConditionSystem.ts`.
 *
 * Spec: docs/superpowers/specs/2026-04-23-rune-upgrades-design.md
 * Plan: docs/superpowers/plans/2026-04-23-rune-upgrades.md
 */

export const RUNE_RARITY = 'rune' as const;
export type RuneRarity = typeof RUNE_RARITY;

/** Condition keys. Some embed a param literal (e.g. `every_nth_kill:10`)
 *  so the catalogue row itself is self-describing; evaluators split on `:`. */
export type RuneConditionKey =
  // biome-conditional (10)
  | 'biome_fog'
  | 'biome_bog'
  | 'biome_heather'
  | 'near_water_hazard'
  | 'near_cairn'
  | 'biome_dusk'
  | 'biome_cold'
  | 'biome_coastal'
  | 'post_bell'
  | 'biome_urban'
  // state-conditional (10)
  | 'hp_low'
  | 'hp_high'
  | 'relics_full'
  | 'weapon_bagpipes'
  | 'run_early'
  | 'run_late'
  | 'combo_high'
  | 'chests_many'
  | 'dash_recent_2s'
  | 'evolved_multi'
  // action-chain (10)
  | 'every_nth_kill:10'
  | 'kill_cascade'
  | 'three_types_in_5s'
  | 'crit_on_weakened'
  | 'pickup_chain_5s'
  | 'dashed_5s_ago'
  | 'kill_named_elite'
  | 'kill_on_thistle'
  | 'music_bass_active'
  | 'visited_3_nodes';

/** Effect keys. A rune may carry multiple effects (Peat Rune: dmg up + speed down). */
export type RuneEffectKey =
  | 'dmg_mult'
  | 'speed_mult'
  | 'gem_spawn'
  | 'hp_max_mult'
  | 'luck_flat'
  | 'crit_flat'
  | 'slow_enemies'
  | 'pickup_timer_mult'
  | 'execute_threshold'
  | 'gold_mult'
  | 'all_stats_mult'
  | 'bagpipes_radius_mult'
  | 'pickup_per_kill'
  | 'next_chest_drop'
  | 'dmg_mult_timed'
  | 'evo_cooldown_mul'
  | 'healing_thistle_spawn'
  | 'dmg_stack'
  | 'reroll_grant'
  | 'lightning_chain'
  | 'hp_max_mult_persistent'
  | 'dash_first_shot_dmg'
  | 'shrine_buff_grant'
  | 'thistle_bomb'
  | 'bass_attack_speed'
  | 'xp_mult_run';

export interface RuneEffect {
  readonly key: RuneEffectKey;
  readonly params: Readonly<Record<string, number>>;
}

export interface RuneDef {
  readonly id: string;
  readonly nameKey: string;      // i18n key (EN + SCS resolve)
  readonly conditionKey: RuneConditionKey;
  readonly effects: readonly RuneEffect[];
  readonly flavourKey: string;   // i18n key
  readonly glyph: string;        // BootScene texture key (rune_*)
}

/** Factory: build a frozen RuneDef with frozen effect list. */
function rune(
  id: string,
  conditionKey: RuneConditionKey,
  effects: readonly RuneEffect[],
): RuneDef {
  return Object.freeze({
    id,
    nameKey: `runes.${id}.name`,
    conditionKey,
    effects: Object.freeze(effects.map((e) => Object.freeze({ ...e, params: Object.freeze({ ...e.params }) }))),
    flavourKey: `runes.${id}.flavour`,
    glyph: `rune_${id.replace(/_rune$/, '')}`,
  });
}

// ── 10 biome-conditional runes ──

const BIOME_RUNES: readonly RuneDef[] = [
  rune('haar_rune', 'biome_fog', [{ key: 'dmg_mult', params: { mult: 2.0 } }]),
  rune('peat_rune', 'biome_bog', [
    { key: 'dmg_mult', params: { mult: 1.4 } },
    { key: 'speed_mult', params: { mult: 0.8 } },
  ]),
  rune('heather_rune', 'biome_heather', [{ key: 'gem_spawn', params: { extra: 1 } }]),
  rune('loch_rune', 'near_water_hazard', [{ key: 'hp_max_mult', params: { mult: 1.1 } }]),
  rune('cairn_rune', 'near_cairn', [{ key: 'luck_flat', params: { flat: 15 } }]),
  rune('gloaming_rune', 'biome_dusk', [{ key: 'crit_flat', params: { flat: 0.08 } }]),
  rune('frost_rune', 'biome_cold', [{ key: 'slow_enemies', params: { mult: 0.85 } }]),
  rune('seawrack_rune', 'biome_coastal', [{ key: 'pickup_timer_mult', params: { mult: 2.0 } }]),
  rune('kirkyard_rune', 'post_bell', [{ key: 'execute_threshold', params: { hpFrac: 0.2 } }]),
  rune('edinburgh_rune', 'biome_urban', [{ key: 'gold_mult', params: { mult: 1.25 } }]),
];

/** All runes keyed by id. Frozen. */
export const RUNES: Readonly<Record<string, RuneDef>> = Object.freeze(
  Object.fromEntries(BIOME_RUNES.map((r) => [r.id, r])),
);
