/**
 * Node banks — per-act pools of NodeDefs that NodeMapSystem rolls from.
 *
 * Each run rolls 3–5 nodes per act from the relevant bank (weighted) then
 * runs a constraint pass (≥1 encounter, ≤1 elite, bargain + rest mutex).
 * Act 3 runs three sub-stretches between Laird → Hunter-General → Taxman,
 * each with its own bank so late-run tone can differ from pre-Laird.
 *
 * Data payloads are intentionally light: M3 event files (`src/systems/
 * nodeEvents/*.ts`) read their own shape per type. Authoring rule: every
 * NodeDef.key is stable and unique across the whole game so analytics,
 * save, and replay can reference it without per-act namespacing.
 */
import type { NodeDef } from './nodeTypes';

// ============================================================================
// Act 1 bank — 0:00 → Gordon (~5:00). Tutorial-tempo, encounters dominant.
// ============================================================================

export const ACT_1_BANK: readonly NodeDef[] = [
  // Encounters (10)
  {
    key: 'a1_thistle_ambush',
    type: 'encounter',
    nameKey: 'nodes.a1.thistle_ambush.name',
    weightInBank: 10,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'tourist', count: 6 }, { key: 'midge', count: 3 }], durationMs: 75000 },
  },
  {
    key: 'a1_hare_rush',
    type: 'encounter',
    nameKey: 'nodes.a1.hare_rush.name',
    weightInBank: 10,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'sheep', count: 4 }, { key: 'tourist', count: 4 }], durationMs: 75000 },
  },
  {
    key: 'a1_midge_cloud',
    type: 'encounter',
    nameKey: 'nodes.a1.midge_cloud.name',
    weightInBank: 9,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'midge', count: 8 }, { key: 'midgie_swarm', count: 1 }], durationMs: 75000 },
  },
  {
    key: 'a1_wee_hunters',
    type: 'encounter',
    nameKey: 'nodes.a1.wee_hunters.name',
    weightInBank: 9,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'haggis_hunter', count: 3 }, { key: 'tourist', count: 2 }], durationMs: 75000 },
  },
  {
    key: 'a1_chef_parade',
    type: 'encounter',
    nameKey: 'nodes.a1.chef_parade.name',
    weightInBank: 8,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'chef', count: 4 }, { key: 'tourist', count: 3 }], durationMs: 75000 },
  },
  {
    key: 'a1_cow_crossing',
    type: 'encounter',
    nameKey: 'nodes.a1.cow_crossing.name',
    weightInBank: 8,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'highland_cow', count: 2 }, { key: 'sheep', count: 3 }], durationMs: 75000 },
  },
  {
    key: 'a1_eagle_sweep',
    type: 'encounter',
    nameKey: 'nodes.a1.eagle_sweep.name',
    weightInBank: 7,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'eagle', count: 3 }, { key: 'tourist', count: 3 }], durationMs: 75000 },
  },
  {
    key: 'a1_piper_pair',
    type: 'encounter',
    nameKey: 'nodes.a1.piper_pair.name',
    weightInBank: 7,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'piper', count: 2 }, { key: 'haggis_hunter', count: 2 }], durationMs: 75000 },
  },
  {
    key: 'a1_scotsman_rabble',
    type: 'encounter',
    nameKey: 'nodes.a1.scotsman_rabble.name',
    weightInBank: 6,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'angry_scotsman', count: 3 }], durationMs: 75000 },
  },
  {
    key: 'a1_ghostie_flit',
    type: 'encounter',
    nameKey: 'nodes.a1.ghostie_flit.name',
    weightInBank: 6,
    actAffinity: [1],
    data: { enemyMix: [{ key: 'ghost', count: 4 }], durationMs: 75000 },
  },

  // Shrines (3)
  {
    key: 'a1_shrine_standing_stone',
    type: 'shrine',
    nameKey: 'nodes.shrine.standing_stone.name',
    promptKey: 'nodes.shrine.standing_stone.prompt',
    weightInBank: 6,
    actAffinity: [1, 2, 3],
    data: { buffPool: ['buff_damage', 'buff_speed', 'buff_luck'], durationMs: 60000 },
  },
  {
    key: 'a1_shrine_cairn',
    type: 'shrine',
    nameKey: 'nodes.shrine.cairn.name',
    promptKey: 'nodes.shrine.cairn.prompt',
    weightInBank: 5,
    actAffinity: [1, 2, 3],
    data: { buffPool: ['buff_armor', 'buff_regen', 'buff_pickup'], durationMs: 60000 },
  },
  {
    key: 'a1_shrine_well',
    type: 'shrine',
    nameKey: 'nodes.shrine.well.name',
    promptKey: 'nodes.shrine.well.prompt',
    weightInBank: 4,
    actAffinity: [1, 2],
    data: { buffPool: ['buff_xp', 'buff_gold', 'buff_luck'], durationMs: 60000 },
  },

  // Wee Traders (2)
  {
    key: 'a1_trader_tinker',
    type: 'wee_trader',
    nameKey: 'nodes.trader.tinker.name',
    promptKey: 'nodes.trader.tinker.prompt',
    weightInBank: 4,
    actAffinity: [1, 2, 3],
    data: { stockRoll: 3 },
  },
  {
    key: 'a1_trader_sheepdrover',
    type: 'wee_trader',
    nameKey: 'nodes.trader.sheepdrover.name',
    promptKey: 'nodes.trader.sheepdrover.prompt',
    weightInBank: 3,
    actAffinity: [1, 2],
    data: { stockRoll: 3 },
  },

  // Rest (2)
  {
    key: 'a1_rest_bothy',
    type: 'rest',
    nameKey: 'nodes.rest.bothy.name',
    weightInBank: 5,
    actAffinity: [1, 2, 3],
    data: { healRatio: 0.3, rerollTokens: 1 },
  },
  {
    key: 'a1_rest_hearth',
    type: 'rest',
    nameKey: 'nodes.rest.hearth.name',
    weightInBank: 4,
    actAffinity: [1, 2, 3],
    data: { healRatio: 0.3, rerollTokens: 1 },
  },

  // Hidden (1)
  {
    key: 'a1_hidden_thistle_patch',
    type: 'hidden',
    nameKey: 'nodes.hidden.thistle_patch.name',
    promptKey: 'nodes.hidden.thistle_patch.prompt',
    weightInBank: 3,
    actAffinity: [1, 2, 3],
    data: { rewardPool: ['lore_fragment', 'rare_relic'], revealRadius: 200 },
  },

  // Bargain (1) — rare at Act 1
  {
    key: 'a1_bargain_wee_folk',
    type: 'bargain',
    nameKey: 'nodes.bargain.wee_folk.name',
    promptKey: 'nodes.bargain.wee_folk.prompt',
    weightInBank: 2,
    actAffinity: [1, 2, 3],
    data: { hpCostRatio: 0.1, offerPool: ['buff_damage_run', 'buff_cooldown_run', 'rare_relic'] },
  },

  // Elite (1) — rare at Act 1
  {
    key: 'a1_elite_wild_hunter',
    type: 'elite',
    nameKey: 'nodes.elite.wild_hunter.name',
    weightInBank: 2,
    actAffinity: [1, 2, 3],
    data: { enemyKey: 'haggis_hunter', eliteMul: { hp: 3, speed: 1.3, xp: 3 }, guaranteedRelic: true },
  },
] as const;

// ============================================================================
// Act 2 bank — Gordon → Tour Bus (~10:00). More variety, bargain/elite common.
// ============================================================================

export const ACT_2_BANK: readonly NodeDef[] = [
  // Encounters (8 — fewer than Act 1, electives take slots)
  {
    key: 'a2_buckie_brawl',
    type: 'encounter',
    nameKey: 'nodes.a2.buckie_brawl.name',
    weightInBank: 9,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'buckfast_ned', count: 4 }], durationMs: 90000 },
  },
  {
    key: 'a2_barghest_patrol',
    type: 'encounter',
    nameKey: 'nodes.a2.barghest_patrol.name',
    weightInBank: 8,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'barghest', count: 3 }], durationMs: 90000 },
  },
  {
    key: 'a2_kelpie_shoals',
    type: 'encounter',
    nameKey: 'nodes.a2.kelpie_shoals.name',
    weightInBank: 7,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'kelpie', count: 2 }, { key: 'kelpie_foal', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a2_fae_courtiers',
    type: 'encounter',
    nameKey: 'nodes.a2.fae_courtiers.name',
    weightInBank: 7,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'seelie_piper', count: 2 }, { key: 'unseelie_fiddler', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a2_blue_men',
    type: 'encounter',
    nameKey: 'nodes.a2.blue_men.name',
    weightInBank: 7,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'blue_man_of_minch', count: 3 }], durationMs: 90000 },
  },
  {
    key: 'a2_haar_roll',
    type: 'encounter',
    nameKey: 'nodes.a2.haar_roll.name',
    weightInBank: 6,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'haar_wraith', count: 3 }, { key: 'gale_wraith', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a2_redcap_raiders',
    type: 'encounter',
    nameKey: 'nodes.a2.redcap_raiders.name',
    weightInBank: 6,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'redcap', count: 3 }, { key: 'barghest', count: 1 }], durationMs: 90000 },
  },
  {
    key: 'a2_deep_fryers',
    type: 'encounter',
    nameKey: 'nodes.a2.deep_fryers.name',
    weightInBank: 5,
    actAffinity: [2],
    data: { enemyMix: [{ key: 'deep_fryer', count: 2 }, { key: 'chef', count: 3 }], durationMs: 90000 },
  },

  // Shrines (3)
  {
    key: 'a2_shrine_fairy_ring',
    type: 'shrine',
    nameKey: 'nodes.shrine.fairy_ring.name',
    promptKey: 'nodes.shrine.fairy_ring.prompt',
    weightInBank: 5,
    actAffinity: [2, 3],
    data: { buffPool: ['buff_crit', 'buff_luck', 'buff_damage'], durationMs: 60000 },
  },
  {
    key: 'a2_shrine_rowan',
    type: 'shrine',
    nameKey: 'nodes.shrine.rowan.name',
    promptKey: 'nodes.shrine.rowan.prompt',
    weightInBank: 4,
    actAffinity: [2, 3],
    data: { buffPool: ['buff_armor', 'buff_reflect', 'buff_regen'], durationMs: 60000 },
  },
  {
    key: 'a2_shrine_loch_votive',
    type: 'shrine',
    nameKey: 'nodes.shrine.loch_votive.name',
    promptKey: 'nodes.shrine.loch_votive.prompt',
    weightInBank: 4,
    actAffinity: [2, 3],
    data: { buffPool: ['buff_speed', 'buff_pickup', 'buff_dodge'], durationMs: 60000 },
  },

  // Traders (2)
  {
    key: 'a2_trader_packman',
    type: 'wee_trader',
    nameKey: 'nodes.trader.packman.name',
    promptKey: 'nodes.trader.packman.prompt',
    weightInBank: 4,
    actAffinity: [2, 3],
    data: { stockRoll: 4 },
  },
  {
    key: 'a2_trader_smith',
    type: 'wee_trader',
    nameKey: 'nodes.trader.smith.name',
    promptKey: 'nodes.trader.smith.prompt',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { stockRoll: 4 },
  },

  // Hidden (2)
  {
    key: 'a2_hidden_pictish_stone',
    type: 'hidden',
    nameKey: 'nodes.hidden.pictish_stone.name',
    promptKey: 'nodes.hidden.pictish_stone.prompt',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { rewardPool: ['lore_fragment', 'rare_relic'], revealRadius: 200 },
  },
  {
    key: 'a2_hidden_clootie_tree',
    type: 'hidden',
    nameKey: 'nodes.hidden.clootie_tree.name',
    promptKey: 'nodes.hidden.clootie_tree.prompt',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { rewardPool: ['lore_fragment', 'rare_relic'], revealRadius: 200 },
  },

  // Bargain (2)
  {
    key: 'a2_bargain_cailleach_shadow',
    type: 'bargain',
    nameKey: 'nodes.bargain.cailleach_shadow.name',
    promptKey: 'nodes.bargain.cailleach_shadow.prompt',
    weightInBank: 4,
    actAffinity: [2, 3],
    data: { hpCostRatio: 0.15, offerPool: ['buff_damage_run', 'buff_cooldown_run', 'rare_relic'] },
  },
  {
    key: 'a2_bargain_unseelie_pact',
    type: 'bargain',
    nameKey: 'nodes.bargain.unseelie_pact.name',
    promptKey: 'nodes.bargain.unseelie_pact.prompt',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { hpCostRatio: 0.2, offerPool: ['buff_speed_run', 'rare_relic', 'weapon_upgrade_token'] },
  },

  // Rest (2) — still mutex with bargain per run
  {
    key: 'a2_rest_crofters_hearth',
    type: 'rest',
    nameKey: 'nodes.rest.crofters_hearth.name',
    weightInBank: 4,
    actAffinity: [2, 3],
    data: { healRatio: 0.35, rerollTokens: 1 },
  },
  {
    key: 'a2_rest_shielling',
    type: 'rest',
    nameKey: 'nodes.rest.shielling.name',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { healRatio: 0.35, rerollTokens: 1 },
  },

  // Elites (2)
  {
    key: 'a2_elite_angry_chef',
    type: 'elite',
    nameKey: 'nodes.elite.angry_chef.name',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { enemyKey: 'chef', eliteMul: { hp: 4, speed: 1.3, xp: 3 }, guaranteedRelic: true },
  },
  {
    key: 'a2_elite_kelpie_prince',
    type: 'elite',
    nameKey: 'nodes.elite.kelpie_prince.name',
    weightInBank: 3,
    actAffinity: [2, 3],
    data: { enemyKey: 'kelpie', eliteMul: { hp: 4, speed: 1.2, xp: 3 }, guaranteedRelic: true },
  },
] as const;

// ============================================================================
// Act 3 — three stretches between Laird → Hunter-General → Taxman.
// Late-game: electives peak, encounters crank harder.
// ============================================================================

export const ACT_3_STRETCH_1_BANK: readonly NodeDef[] = [
  // Pre-Laird: urban/mixed
  {
    key: 'a3s1_ghost_tour_ambush',
    type: 'encounter',
    nameKey: 'nodes.a3s1.ghost_tour.name',
    weightInBank: 8,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'edinburgh_ghost_guide', count: 3 }, { key: 'ghost', count: 3 }], durationMs: 90000 },
  },
  {
    key: 'a3s1_close_closure',
    type: 'encounter',
    nameKey: 'nodes.a3s1.close_closure.name',
    weightInBank: 8,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'buckfast_ned', count: 4 }, { key: 'traffic_cone_totem', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a3s1_ceilidh_riot',
    type: 'encounter',
    nameKey: 'nodes.a3s1.ceilidh_riot.name',
    weightInBank: 7,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'ceilidh_caller', count: 2 }, { key: 'piper', count: 3 }], durationMs: 90000 },
  },
  {
    key: 'a3s1_dean_procession',
    type: 'encounter',
    nameKey: 'nodes.a3s1.dean_procession.name',
    weightInBank: 6,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'dean_apparition', count: 2 }, { key: 'tome_wraith', count: 3 }], durationMs: 90000 },
  },
  {
    key: 'a3s1_shrine_old_town',
    type: 'shrine',
    nameKey: 'nodes.shrine.old_town.name',
    promptKey: 'nodes.shrine.old_town.prompt',
    weightInBank: 5,
    actAffinity: [3],
    data: { buffPool: ['buff_damage', 'buff_crit', 'buff_speed'], durationMs: 60000 },
  },
  {
    key: 'a3s1_trader_close_hawker',
    type: 'wee_trader',
    nameKey: 'nodes.trader.close_hawker.name',
    promptKey: 'nodes.trader.close_hawker.prompt',
    weightInBank: 4,
    actAffinity: [3],
    data: { stockRoll: 4 },
  },
  {
    key: 'a3s1_hidden_vennel',
    type: 'hidden',
    nameKey: 'nodes.hidden.vennel.name',
    promptKey: 'nodes.hidden.vennel.prompt',
    weightInBank: 3,
    actAffinity: [3],
    data: { rewardPool: ['rare_relic', 'lore_fragment'], revealRadius: 180 },
  },
  {
    key: 'a3s1_bargain_old_gentleman',
    type: 'bargain',
    nameKey: 'nodes.bargain.old_gentleman.name',
    promptKey: 'nodes.bargain.old_gentleman.prompt',
    weightInBank: 4,
    actAffinity: [3],
    data: { hpCostRatio: 0.2, offerPool: ['weapon_upgrade_token', 'rare_relic', 'buff_damage_run'] },
  },
  {
    key: 'a3s1_rest_close_hearth',
    type: 'rest',
    nameKey: 'nodes.rest.close_hearth.name',
    weightInBank: 3,
    actAffinity: [3],
    data: { healRatio: 0.4, rerollTokens: 1 },
  },
  {
    key: 'a3s1_elite_neds_boss',
    type: 'elite',
    nameKey: 'nodes.elite.neds_boss.name',
    weightInBank: 3,
    actAffinity: [3],
    data: { enemyKey: 'buckfast_ned', eliteMul: { hp: 5, speed: 1.4, xp: 4 }, guaranteedRelic: true },
  },
] as const;

export const ACT_3_STRETCH_2_BANK: readonly NodeDef[] = [
  // Post-Laird → Hunter-General: wild hunt, escalation
  {
    key: 'a3s2_wild_hunt',
    type: 'encounter',
    nameKey: 'nodes.a3s2.wild_hunt.name',
    weightInBank: 8,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'haggis_hunter', count: 4 }, { key: 'berserker', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a3s2_nest_sprawl',
    type: 'encounter',
    nameKey: 'nodes.a3s2.nest_sprawl.name',
    weightInBank: 7,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'nest', count: 3 }, { key: 'midgie_swarm', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a3s2_fae_war',
    type: 'encounter',
    nameKey: 'nodes.a3s2.fae_war.name',
    weightInBank: 7,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'seelie_piper', count: 2 }, { key: 'unseelie_fiddler', count: 2 }, { key: 'redcap', count: 2 }], durationMs: 90000 },
  },
  {
    key: 'a3s2_barghest_pack',
    type: 'encounter',
    nameKey: 'nodes.a3s2.barghest_pack.name',
    weightInBank: 6,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'barghest', count: 4 }], durationMs: 90000 },
  },
  {
    key: 'a3s2_shrine_wallace',
    type: 'shrine',
    nameKey: 'nodes.shrine.wallace.name',
    promptKey: 'nodes.shrine.wallace.prompt',
    weightInBank: 5,
    actAffinity: [3],
    data: { buffPool: ['buff_damage', 'buff_armor', 'buff_reflect'], durationMs: 60000 },
  },
  {
    key: 'a3s2_trader_traveller',
    type: 'wee_trader',
    nameKey: 'nodes.trader.traveller.name',
    promptKey: 'nodes.trader.traveller.prompt',
    weightInBank: 4,
    actAffinity: [3],
    data: { stockRoll: 5 },
  },
  {
    key: 'a3s2_hidden_stone_circle',
    type: 'hidden',
    nameKey: 'nodes.hidden.stone_circle.name',
    promptKey: 'nodes.hidden.stone_circle.prompt',
    weightInBank: 4,
    actAffinity: [3],
    data: { rewardPool: ['rare_relic'], revealRadius: 220 },
  },
  {
    key: 'a3s2_bargain_faerie_queen',
    type: 'bargain',
    nameKey: 'nodes.bargain.faerie_queen.name',
    promptKey: 'nodes.bargain.faerie_queen.prompt',
    weightInBank: 5,
    actAffinity: [3],
    data: { hpCostRatio: 0.25, offerPool: ['weapon_upgrade_token', 'rare_relic', 'buff_cooldown_run'] },
  },
  {
    key: 'a3s2_rest_highland_pasture',
    type: 'rest',
    nameKey: 'nodes.rest.highland_pasture.name',
    weightInBank: 3,
    actAffinity: [3],
    data: { healRatio: 0.4, rerollTokens: 1 },
  },
  {
    key: 'a3s2_elite_hunter_captain',
    type: 'elite',
    nameKey: 'nodes.elite.hunter_captain.name',
    weightInBank: 4,
    actAffinity: [3],
    data: { enemyKey: 'haggis_hunter', eliteMul: { hp: 6, speed: 1.45, xp: 4 }, guaranteedRelic: true },
  },
] as const;

export const ACT_3_STRETCH_3_BANK: readonly NodeDef[] = [
  // Post-Hunter-General → Taxman: audit-themed climax
  {
    key: 'a3s3_ledger_column',
    type: 'encounter',
    nameKey: 'nodes.a3s3.ledger_column.name',
    weightInBank: 9,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'ledger_wraith', count: 3 }, { key: 'auditor_priest', count: 2 }], durationMs: 95000 },
  },
  {
    key: 'a3s3_audit_office',
    type: 'encounter',
    nameKey: 'nodes.a3s3.audit_office.name',
    weightInBank: 8,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'auditor_priest', count: 3 }, { key: 'tome_wraith', count: 2 }], durationMs: 95000 },
  },
  {
    key: 'a3s3_ghost_assembly',
    type: 'encounter',
    nameKey: 'nodes.a3s3.ghost_assembly.name',
    weightInBank: 7,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'ghost', count: 5 }, { key: 'edinburgh_ghost_guide', count: 2 }], durationMs: 95000 },
  },
  {
    key: 'a3s3_fryers_riot',
    type: 'encounter',
    nameKey: 'nodes.a3s3.fryers_riot.name',
    weightInBank: 6,
    actAffinity: [3],
    data: { enemyMix: [{ key: 'deep_fryer', count: 3 }, { key: 'chef', count: 4 }], durationMs: 95000 },
  },
  {
    key: 'a3s3_shrine_taxmans_eye',
    type: 'shrine',
    nameKey: 'nodes.shrine.taxmans_eye.name',
    promptKey: 'nodes.shrine.taxmans_eye.prompt',
    weightInBank: 5,
    actAffinity: [3],
    data: { buffPool: ['buff_damage', 'buff_crit', 'buff_armor'], durationMs: 60000 },
  },
  {
    key: 'a3s3_trader_ferryman',
    type: 'wee_trader',
    nameKey: 'nodes.trader.ferryman.name',
    promptKey: 'nodes.trader.ferryman.prompt',
    weightInBank: 3,
    actAffinity: [3],
    data: { stockRoll: 5 },
  },
  {
    key: 'a3s3_hidden_sealed_archive',
    type: 'hidden',
    nameKey: 'nodes.hidden.sealed_archive.name',
    promptKey: 'nodes.hidden.sealed_archive.prompt',
    weightInBank: 4,
    actAffinity: [3],
    data: { rewardPool: ['rare_relic'], revealRadius: 200 },
  },
  {
    key: 'a3s3_bargain_taxmans_clerk',
    type: 'bargain',
    nameKey: 'nodes.bargain.taxmans_clerk.name',
    promptKey: 'nodes.bargain.taxmans_clerk.prompt',
    weightInBank: 5,
    actAffinity: [3],
    data: { hpCostRatio: 0.3, offerPool: ['rare_relic', 'weapon_upgrade_token', 'buff_damage_run'] },
  },
  {
    key: 'a3s3_rest_last_bothy',
    type: 'rest',
    nameKey: 'nodes.rest.last_bothy.name',
    weightInBank: 3,
    actAffinity: [3],
    data: { healRatio: 0.5, rerollTokens: 1 },
  },
  {
    key: 'a3s3_elite_chief_auditor',
    type: 'elite',
    nameKey: 'nodes.elite.chief_auditor.name',
    weightInBank: 4,
    actAffinity: [3],
    data: { enemyKey: 'auditor_priest', eliteMul: { hp: 7, speed: 1.3, xp: 5 }, guaranteedRelic: true },
  },
] as const;

// ============================================================================
// Lookup helpers
// ============================================================================

export type Act = 1 | 2 | 3;
export type Act3Stretch = 1 | 2 | 3;

/** Per-act primary bank (Act 3 picks stretch 1 by default; use getAct3Bank for specific stretch). */
export function getActBank(act: Act): readonly NodeDef[] {
  switch (act) {
    case 1:
      return ACT_1_BANK;
    case 2:
      return ACT_2_BANK;
    case 3:
      return ACT_3_STRETCH_1_BANK;
  }
}

export function getAct3Bank(stretch: Act3Stretch): readonly NodeDef[] {
  switch (stretch) {
    case 1:
      return ACT_3_STRETCH_1_BANK;
    case 2:
      return ACT_3_STRETCH_2_BANK;
    case 3:
      return ACT_3_STRETCH_3_BANK;
  }
}

/** Every NodeDef in the game, flat. Useful for uniqueness / lookup tests. */
export const ALL_NODE_DEFS: readonly NodeDef[] = [
  ...ACT_1_BANK,
  ...ACT_2_BANK,
  ...ACT_3_STRETCH_1_BANK,
  ...ACT_3_STRETCH_2_BANK,
  ...ACT_3_STRETCH_3_BANK,
];

export function getNodeDef(key: string): NodeDef | undefined {
  return ALL_NODE_DEFS.find((n) => n.key === key);
}
