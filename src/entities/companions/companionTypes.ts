/**
 * Companion types — first slice of the Whistle-Call Companions track
 * (`docs/superpowers/plans/wild_living_world_*`).
 *
 * The companion stack is intentionally narrow on its first ship:
 *   - one companion key (`sheepdog`)
 *   - no enemy damage, no pickup utility
 *   - deterministic follow behaviour, capped count (1)
 *
 * That keeps the determinism + balance surface neutral while the
 * lifecycle plumbing (HUD chip, LivingWorld moment fanout, reset
 * safety, ambient SFX) gets exercised. Stoat scout / eagle marker /
 * kelpie-foal hazard hint are explicitly deferred per plan.
 */

/** Closed union — widen here when a new companion ships. */
export type CompanionKey = 'sheepdog' | 'stoat_scout' | 'eagle';

/**
 * Wild Living World Phase 2 — list of every shippable companion key in
 * stable display order. Used by save-coerce (allowlist) and Croft UI
 * (panel order). NOT generated from `COMPANION_DEFS` keys because
 * `Object.keys` iteration order isn't a documented contract in older
 * JS engines and tests want a stable comparison.
 */
export const COMPANION_KEYS_IN_ORDER: readonly CompanionKey[] = ['sheepdog', 'stoat_scout', 'eagle'];

export interface CompanionDef {
  readonly key: CompanionKey;
  /** i18n dot-path for the HUD chip label (`ui.hud.companion.<key>`). */
  readonly nameKey: string;
  /** Static texture key — frames baked at boot under `bakeCroftVisitors`. */
  readonly textureKeys: readonly [string, string];
  /** Pixels — desired idle follow distance behind the player. */
  readonly followDistance: number;
  /** Pixels — distance at which the companion teleports back to the player's tail. */
  readonly tetherDistance: number;
  /** Pixels/second — base trot speed used by the follow integrator. */
  readonly maxSpeed: number;
  /** Seconds — frame swap interval for the two-frame idle animation. */
  readonly idleFrameSec: number;
}

export const COMPANION_DEFS: Readonly<Record<CompanionKey, CompanionDef>> = {
  sheepdog: {
    key: 'sheepdog',
    nameKey: 'ui.hud.companion.sheepdog',
    textureKeys: ['croft_sheepdog_stand_f0', 'croft_sheepdog_stand_f1'],
    followDistance: 38,
    tetherDistance: 220,
    maxSpeed: 220,
    idleFrameSec: 0.45,
  },
  // Wild Living World Phase 2 — Stoat Scout. The stoat is faster + lighter
  // than the sheepdog, hugs closer (24px instead of 38), trots quicker,
  // and re-snaps from further away (a stoat will dart further before
  // realising it's lost the haggis). Same cosmetic-only contract — no
  // DPS, no pickup utility, no gameplay surface.
  //
  // Reference: SCOTTISH_RESEARCH §1.7 (stoats wear ermine winter coats
  // in the highlands — handy reading for the texture bake's pale belly).
  stoat_scout: {
    key: 'stoat_scout',
    nameKey: 'ui.hud.companion.stoat_scout',
    textureKeys: ['croft_stoat_stand_f0', 'croft_stoat_stand_f1'],
    followDistance: 24,
    tetherDistance: 260,
    maxSpeed: 260,
    idleFrameSec: 0.32,
  },
  // Wild Living World Phase 3 — Golden Eagle. Unlocked by winning the
  // Cailleach Gauntlet (defeating the storm goddess). The eagle is the
  // apex of the highland sky; it earns a wider personal-space bubble and
  // a longer tether than either smaller companion — it ranges, circles
  // at distance, then returns. Perched two-frame sprite (head-turn) to
  // keep it recognisable at game scale. Dignified slow hop: 160 px/s.
  // Refs: SCOTTISH_RESEARCH_DEEP §3.2 (Cairngorm raptors).
  eagle: {
    key: 'eagle',
    nameKey: 'ui.hud.companion.eagle',
    textureKeys: ['croft_eagle_perch_f0', 'croft_eagle_perch_f1'],
    followDistance: 52,
    tetherDistance: 320,
    maxSpeed: 160,
    idleFrameSec: 0.8,
  },
};

/**
 * Maximum simultaneously-active companions. The plan's first ship is
 * "one sheepdog follower" — the cap exists so the cosmetic-only
 * promise stays honest: no swarm follower that turns into a hidden DPS
 * or pickup-magnet system without a code change.
 */
export const MAX_COMPANIONS_PER_RUN = 1;
