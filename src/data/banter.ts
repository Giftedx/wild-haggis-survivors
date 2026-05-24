/**
 * Banter pools — context-reactive Glesga commentary.
 *
 * Mirrors the Conductor pattern (music): game-state → mood → output. Here,
 * the output is a short toast line through JuiceSystem + captions.
 *
 * Voice register (locked — see memory `feedback_voice_register.md`):
 *   - Hearth / Still Game warmth → default for ambient, kill streak, idle,
 *     biome, first blood, level up.
 *   - Edge / Limmy bite → failure, low-HP, boss warnings, last-gasp moments.
 *
 * All copy lives in `src/core/i18n.ts` under `ui.banter.*`. This file holds
 * *structure* only: which contexts exist, their priority, tone tag, and the
 * i18n keys of the line pool. Adding a new line = push an i18n key; the
 * engine picks-and-rotates without code changes.
 */

export type BanterTone = 'hearth' | 'edge';

export type BanterContext =
  | 'first_blood'
  | 'kill_streak'
  | 'level_up'
  | 'low_hp'
  | 'recover'
  | 'boss_warn'
  | 'boss_down'
  | 'biome_change'
  | 'weapon_evolve'
  | 'curse_start'
  | 'moor_moment'
  | 'idle'
  // W2 Moor Road
  | 'act_intermission_enter'
  | 'act_complete'
  | 'route_picked'
  // Reliquary pickup (M15) — off-path relic claimed
  | 'reliquary_pick'
  // B1 Phase 2 — Gran-voice commentary (hearth, elder warmth *about* the run)
  | 'gran_commentary'
  // B1 Phase 2 Task 12 — cause-tagged warm lament on death screen
  | 'death_reflection'
  // B1 Phase 2 Task 10 — wee-beastie inner-monologue during quiet stretches
  | 'haggis_ambient'
  // B1 Phase 3 Task 17 — per-enemy flavour on first encounter + rare respawn
  | 'enemy_ambient'
  // B1 Phase 3 Task 18 — reserved once-per-save lines (priority 110)
  | 'first_time'
  // B1 Phase 4 Task 22 — verified Burns quotations at context-matched triggers
  | 'burns_citation'
  // B1 Phase 4 Task 21 — Cailleach voice; act intermissions, low-HP, Bargain.
  // [GAELIC-REVIEW] Some leaves carry untranslated Gaelic fragments — every
  // such line is flagged with `[GAELIC-REVIEW]` in i18n.ts and listed in
  // docs/top-10-tasks/blocked/06-blocked-on-human.md. Native review required
  // before the lines reach a public release; pool ships hidden from general
  // play until reviewed (see graduation below).
  | 'cailleach_whisper'
  // B1 Phase 5 — seasonal-event banter. Fires when a seasonal window is
  // active (see SeasonalEventManager.activeSeasonalEvents). Sub-pool tags
  // mirror event keys: burns_night | hogmanay | samhain | beltane.
  | 'seasonal_event'
  // DESIGN_IDEAS §1 Cairn Stacking — fires on stone collect (`stack`)
  // and the third-stone Cairn's Blessing (`boon`). Pilgrim-warm register.
  | 'cairn_moment'
  // DESIGN_IDEAS §1 Stance Toggle — fires on Q-cycle. Sub-pool tags
  // mirror the three stance keys: `loose`, `braced`, `reeling`.
  // Hearth-warm register; the haggis voicing its own posture shift.
  | 'stance_change'
  // DESIGN_IDEAS §1 Shinty Parry — fires on consume edge (a successful
  // E-parry of an enemy projectile). Hearth-warm pride; the parry
  // already speaks loudly via VFX/SFX so the line is a low-key murmur,
  // not a celebration. No sub-pool tags — single consume context.
  | 'shinty_parry'
  // DESIGN_IDEAS §1 Clootie Rag Wager — fires on commit edge (player
  // walked into the trunk and paid the HP cost). Sub-pool tag `bound`.
  // Hearth + grave register: ceremonial, the moment of supplication.
  | 'clootie_wager'
  // "The Moor Remembers" — fires when the player steps over a Cairn of
  // Echoes. Five sub-pool tags: `past_self_first` (first cairn this run),
  // `past_self` (subsequent touches), `grandfather_first` (first lifetime
  // grandfather whisper), `grandfather_revealed` (subsequent whispers),
  // `grandfather_complete` (after the 25th leaf is revealed). Hearth tone;
  // the moor speaks back through stones the player once placed.
  | 'cairn_walkover'
  // The Moor Remembers V2 — Cailleach Gauntlet beats. Sub-pool tags
  // `armed` / `candles_lit` / `cailleach_spawned` / `cailleach_down` /
  // `cailleach_dominant`. Priority 95 sits above beithir_sting (90)
  // and below boss_warn (100) so the gauntlet's own beats win over
  // ambient threat lines but yield to a normal route-boss warning
  // firing same-tick. Hearth tone bites toward grave on the lit/spawn
  // beats — the ring is intentionally heavy.
  | 'cailleach_gauntlet'
  // DESIGN_IDEAS §1 Taxman Grudge Ledger — fires once at run-end victory
  // (the Taxman is the final boss; only victory routes reach his
  // closing word). Sub-pool tags = grudge verdicts: coward | bruiser |
  // precise | reckless | even. Edge register — auditor's sneer; this
  // is the antagonist getting the curtain line on the run he just lost.
  | 'taxman_grudge'
  // DESIGN_IDEAS §13 Lemmings Easter Egg — fires once when the cliff-edge
  // parade triggers (90 s idle in coastal biome, once per variant
  // lifetime). Hearth tone; the toast that follows the OH NO! parade.
  // No sub-pool tags — single discrete moment, two leaves on the
  // no-repeat ring for variety across variants.
  | 'lemmings_remember'
  // DESIGN_IDEAS §1 Race the Beithir — venom-fang sting opens the 8 s
  // race window. Edge tone for `stung` + `expired`; hearth-warm relief
  // for `cured_heal` + `cured_kill`. Sub-pool tags: `cured_heal`,
  // `cured_kill`, `expired`. Top-level `keys` carries the `stung` lines
  // (the most-fired tag) and doubles as the unknown-tag fallback per
  // the pool contract — same pattern as taxman_grudge's `even` leaves.
  // Priority 90 wins over `low_hp` (80) since the race is structurally
  // a "you might die in 8 s" beat, but loses to `boss_warn` (100).
  | 'beithir_sting'
  // DESIGN_IDEAS §11 wild-haggis-myth — Haggis Wildlife Foundation
  // field-note pickup. Fires on collect of a `pickup_field_note`
  // dropped by a haggis_hunter kill (1/6 roll, mirrors polaroid).
  // Sister-context to the polaroid drop — the polaroid is the
  // *tourist's* faction (no banter pool, just the float text), the
  // field-note is the *Foundation's* faction (banter line on every
  // collect). Hearth tone — the haggis reads a fragment of the
  // absurd-serious naturalist prose from the page he just picked up
  // and reacts in his own voice. Priority 44 sits one rung below
  // reliquary_pick (45) since reliquary is rarer (once-per-run
  // landmark) and one rung above burns_citation (43) since the field
  // note is a held-in-the-paw artefact, not an ambient lyric.
  | 'field_note_pickup'
  // Wild Living World Phase 2 — Selkie form shift. Fires on the dash
  // edge that toggles the Selkie variant between `haggis` and `seal`
  // forms. Sub-pool tags: `seal` (entering seal form) and `haggis`
  // (returning to haggis form). Hearth-soft register — the seal
  // is a relief, the haggis is a homecoming; no celebration, no
  // gloating. Priority 25 is intentionally low so dash-spam can't
  // outshout boss warnings (100), boss kills (70), low-hp lament
  // (80), or first-time beats (110). The line is incidental flavour,
  // not a recurring drumbeat — the no-repeat ring keeps it quiet
  // even on Selkie's fast-toggle runs.
  | 'form_shifted';

export interface BanterPool {
  context: BanterContext;
  tone: BanterTone;
  /** Higher wins when two contexts fire in the same tick. */
  priority: number;
  /** i18n keys — picked round-robin with a no-repeat window. */
  keys: readonly string[];
  /**
   * Optional authored sub-pools keyed by caller-supplied tag (boss key,
   * variant key, biome key, etc.). When a requester passes a tag that
   * matches a sub-pool, the engine prefers those lines over the generic
   * `keys` — that's how bosses get their own character and variants get
   * their own voice tint. Missing tag or unknown tag falls back to
   * `keys` silently.
   */
  keysByTag?: Readonly<Record<string, readonly string[]>>;
  /**
   * C1 M4 Task 21 — pool-level rarity flag for the Almanac's Banter
   * book. Lines in a `rare` pool surface with a ✨ marker so the player
   * sees them as collectibles rather than everyday lines. Trigger-gated
   * or once-per-save pools (first_time, burns_citation, reliquary_pick,
   * ...) set this true; default = false.
   */
  rare?: boolean;
}

export const BANTER_POOLS: readonly BanterPool[] = [
  {
    context: 'boss_warn',
    tone: 'edge',
    priority: 100,
    keys: [
      'ui.banter.boss_warn.a',
      'ui.banter.boss_warn.b',
      'ui.banter.boss_warn.c',
      'ui.banter.boss_warn.d',
      'ui.banter.boss_warn.e',
      // 2026-04-29 expansion — 12 generic lines clears the no-repeat
      // window-size of 8 so back-to-back boss arrivals never recycle.
      'ui.banter.boss_warn.f',
      'ui.banter.boss_warn.g',
      'ui.banter.boss_warn.h',
      'ui.banter.boss_warn.i',
      'ui.banter.boss_warn.j',
      'ui.banter.boss_warn.k',
      'ui.banter.boss_warn.l',
    ],
    // Authored per-boss character moments. Each boss gets 3 lines so the
    // no-repeat window (size 8) can't starve a pool during back-to-back
    // runs, and the SpawnSystem never repeats the same boss mid-run.
    keysByTag: {
      gordon: [
        'ui.banter.boss_warn.gordon.a',
        'ui.banter.boss_warn.gordon.b',
        'ui.banter.boss_warn.gordon.c',
      ],
      each_uisge: [
        'ui.banter.boss_warn.each_uisge.a',
        'ui.banter.boss_warn.each_uisge.b',
        'ui.banter.boss_warn.each_uisge.c',
      ],
      tour_bus: [
        'ui.banter.boss_warn.tour_bus.a',
        'ui.banter.boss_warn.tour_bus.b',
        'ui.banter.boss_warn.tour_bus.c',
      ],
      nicnevin: [
        'ui.banter.boss_warn.nicnevin.a',
        'ui.banter.boss_warn.nicnevin.b',
        'ui.banter.boss_warn.nicnevin.c',
      ],
      the_laird: [
        'ui.banter.boss_warn.the_laird.a',
        'ui.banter.boss_warn.the_laird.b',
        'ui.banter.boss_warn.the_laird.c',
      ],
      nuckelavee: [
        'ui.banter.boss_warn.nuckelavee.a',
        'ui.banter.boss_warn.nuckelavee.b',
        'ui.banter.boss_warn.nuckelavee.c',
      ],
      hunter_general: [
        'ui.banter.boss_warn.hunter_general.a',
        'ui.banter.boss_warn.hunter_general.b',
        'ui.banter.boss_warn.hunter_general.c',
      ],
      earl_beardie: [
        'ui.banter.boss_warn.earl_beardie.a',
        'ui.banter.boss_warn.earl_beardie.b',
        'ui.banter.boss_warn.earl_beardie.c',
      ],
      black_douglas: [
        'ui.banter.boss_warn.black_douglas.a',
        'ui.banter.boss_warn.black_douglas.b',
        'ui.banter.boss_warn.black_douglas.c',
      ],
      taxman: [
        'ui.banter.boss_warn.taxman.a',
        'ui.banter.boss_warn.taxman.b',
        'ui.banter.boss_warn.taxman.c',
      ],
      cailleach_boss: [
        'ui.banter.boss_warn.cailleach_boss.a',
        'ui.banter.boss_warn.cailleach_boss.b',
        'ui.banter.boss_warn.cailleach_boss.c',
      ],
      // Post-bell Tier-3 — Storm Cailleach. Three phases, edge register.
      storm_cailleach: [
        'ui.banter.boss_warn.storm_cailleach.a',
        'ui.banter.boss_warn.storm_cailleach.b',
        'ui.banter.boss_warn.storm_cailleach.c',
      ],
      // Post-bell — Twin Stones of Callanish. Ancient, certain, unhurried.
      twin_stones: [
        'ui.banter.boss_warn.twin_stones.a',
        'ui.banter.boss_warn.twin_stones.b',
        'ui.banter.boss_warn.twin_stones.c',
      ],
    },
  },
  {
    context: 'low_hp',
    tone: 'edge',
    priority: 80,
    keys: [
      'ui.banter.low_hp.a',
      'ui.banter.low_hp.b',
      'ui.banter.low_hp.c',
      'ui.banter.low_hp.d',
      'ui.banter.low_hp.e',
      'ui.banter.low_hp.f',
      'ui.banter.low_hp.g',
      'ui.banter.low_hp.h',
      'ui.banter.low_hp.i',
      'ui.banter.low_hp.j',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.low_hp.iron_belly.a',
        'ui.banter.low_hp.iron_belly.b',
        'ui.banter.low_hp.iron_belly.c',
        'ui.banter.low_hp.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.low_hp.moor_runner.a',
        'ui.banter.low_hp.moor_runner.b',
        'ui.banter.low_hp.moor_runner.c',
        'ui.banter.low_hp.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.low_hp.glen_forager.a',
        'ui.banter.low_hp.glen_forager.b',
        'ui.banter.low_hp.glen_forager.c',
        'ui.banter.low_hp.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.low_hp.surefoot.a',
        'ui.banter.low_hp.surefoot.b',
        'ui.banter.low_hp.surefoot.c',
        'ui.banter.low_hp.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.low_hp.pipe_breath.a',
        'ui.banter.low_hp.pipe_breath.b',
        'ui.banter.low_hp.pipe_breath.c',
        'ui.banter.low_hp.pipe_breath.d',
      ],
      laird: [
        'ui.banter.low_hp.laird.a',
        'ui.banter.low_hp.laird.b',
        'ui.banter.low_hp.laird.c',
        'ui.banter.low_hp.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.low_hp.wee_ghostie.a',
        'ui.banter.low_hp.wee_ghostie.b',
        'ui.banter.low_hp.wee_ghostie.c',
        'ui.banter.low_hp.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.low_hp.glaswegian.a',
        'ui.banter.low_hp.glaswegian.b',
        'ui.banter.low_hp.glaswegian.c',
        'ui.banter.low_hp.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.low_hp.cailleach.a',
        'ui.banter.low_hp.cailleach.b',
        'ui.banter.low_hp.cailleach.c',
        'ui.banter.low_hp.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.low_hp.anticlockwise.a',
        'ui.banter.low_hp.anticlockwise.b',
        'ui.banter.low_hp.anticlockwise.c',
        'ui.banter.low_hp.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.low_hp.doric_quinie.a',
        'ui.banter.low_hp.doric_quinie.b',
        'ui.banter.low_hp.doric_quinie.c',
        'ui.banter.low_hp.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.low_hp.peerie_shetlander.a',
        'ui.banter.low_hp.peerie_shetlander.b',
        'ui.banter.low_hp.peerie_shetlander.c',
        'ui.banter.low_hp.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.low_hp.burns_wee_beastie.a',
        'ui.banter.low_hp.burns_wee_beastie.b',
        'ui.banter.low_hp.burns_wee_beastie.c',
        'ui.banter.low_hp.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.low_hp.witch_hare.a',
        'ui.banter.low_hp.witch_hare.b',
        'ui.banter.low_hp.witch_hare.c',
        'ui.banter.low_hp.witch_hare.d',
      ],
      selkie: [
        'ui.banter.low_hp.selkie.a',
        'ui.banter.low_hp.selkie.b',
        'ui.banter.low_hp.selkie.c',
        'ui.banter.low_hp.selkie.d',
      ],
      morningside: [
        'ui.banter.low_hp.morningside.a',
        'ui.banter.low_hp.morningside.b',
        'ui.banter.low_hp.morningside.c',
        'ui.banter.low_hp.morningside.d',
      ],
      drouthy: [
        'ui.banter.low_hp.drouthy.a',
        'ui.banter.low_hp.drouthy.b',
        'ui.banter.low_hp.drouthy.c',
        'ui.banter.low_hp.drouthy.d',
      ],
      pibroch: [
        'ui.banter.low_hp.pibroch.a',
        'ui.banter.low_hp.pibroch.b',
        'ui.banter.low_hp.pibroch.c',
        'ui.banter.low_hp.pibroch.d',
      ],
      orcadian: [
        'ui.banter.low_hp.orcadian.a',
        'ui.banter.low_hp.orcadian.b',
        'ui.banter.low_hp.orcadian.c',
        'ui.banter.low_hp.orcadian.d',
      ],
      hebridean: [
        'ui.banter.low_hp.hebridean.a',
        'ui.banter.low_hp.hebridean.b',
        'ui.banter.low_hp.hebridean.c',
        'ui.banter.low_hp.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.low_hp.iron_brew.a',
        'ui.banter.low_hp.iron_brew.b',
        'ui.banter.low_hp.iron_brew.c',
        'ui.banter.low_hp.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.low_hp.grans_best.a',
        'ui.banter.low_hp.grans_best.b',
        'ui.banter.low_hp.grans_best.c',
        'ui.banter.low_hp.grans_best.d',
      ],
      the_pict: [
        'ui.banter.low_hp.the_pict.a',
        'ui.banter.low_hp.the_pict.b',
        'ui.banter.low_hp.the_pict.c',
        'ui.banter.low_hp.the_pict.d',
      ],
      jacobite: [
        'ui.banter.low_hp.jacobite.a',
        'ui.banter.low_hp.jacobite.b',
        'ui.banter.low_hp.jacobite.c',
        'ui.banter.low_hp.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.low_hp.tam_o_shanter.a',
        'ui.banter.low_hp.tam_o_shanter.b',
        'ui.banter.low_hp.tam_o_shanter.c',
        'ui.banter.low_hp.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.low_hp.engineer.a',
        'ui.banter.low_hp.engineer.b',
        'ui.banter.low_hp.engineer.c',
        'ui.banter.low_hp.engineer.d',
      ],
      tufted: [
        'ui.banter.low_hp.tufted.a',
        'ui.banter.low_hp.tufted.b',
        'ui.banter.low_hp.tufted.c',
        'ui.banter.low_hp.tufted.d',
      ],
    },
  },
  {
    context: 'boss_down',
    tone: 'hearth',
    priority: 70,
    keys: [
      'ui.banter.boss_down.a',
      'ui.banter.boss_down.b',
      'ui.banter.boss_down.c',
      'ui.banter.boss_down.d',
      'ui.banter.boss_down.e',
      'ui.banter.boss_down.f',
      'ui.banter.boss_down.g',
      'ui.banter.boss_down.h',
      'ui.banter.boss_down.i',
    ],
    keysByTag: {
      gordon: [
        'ui.banter.boss_down.gordon.a',
        'ui.banter.boss_down.gordon.b',
        'ui.banter.boss_down.gordon.c',
      ],
      each_uisge: [
        'ui.banter.boss_down.each_uisge.a',
        'ui.banter.boss_down.each_uisge.b',
        'ui.banter.boss_down.each_uisge.c',
      ],
      tour_bus: [
        'ui.banter.boss_down.tour_bus.a',
        'ui.banter.boss_down.tour_bus.b',
        'ui.banter.boss_down.tour_bus.c',
      ],
      nicnevin: [
        'ui.banter.boss_down.nicnevin.a',
        'ui.banter.boss_down.nicnevin.b',
        'ui.banter.boss_down.nicnevin.c',
      ],
      the_laird: [
        'ui.banter.boss_down.the_laird.a',
        'ui.banter.boss_down.the_laird.b',
        'ui.banter.boss_down.the_laird.c',
      ],
      nuckelavee: [
        'ui.banter.boss_down.nuckelavee.a',
        'ui.banter.boss_down.nuckelavee.b',
        'ui.banter.boss_down.nuckelavee.c',
      ],
      hunter_general: [
        'ui.banter.boss_down.hunter_general.a',
        'ui.banter.boss_down.hunter_general.b',
        'ui.banter.boss_down.hunter_general.c',
      ],
      earl_beardie: [
        'ui.banter.boss_down.earl_beardie.a',
        'ui.banter.boss_down.earl_beardie.b',
        'ui.banter.boss_down.earl_beardie.c',
      ],
      black_douglas: [
        'ui.banter.boss_down.black_douglas.a',
        'ui.banter.boss_down.black_douglas.b',
        'ui.banter.boss_down.black_douglas.c',
      ],
      taxman: [
        'ui.banter.boss_down.taxman.a',
        'ui.banter.boss_down.taxman.b',
        'ui.banter.boss_down.taxman.c',
      ],
      cailleach_boss: [
        'ui.banter.boss_down.cailleach_boss.a',
        'ui.banter.boss_down.cailleach_boss.b',
        'ui.banter.boss_down.cailleach_boss.c',
      ],
      // Post-bell Tier-3 — Storm Cailleach, hearth warmth after the gale.
      storm_cailleach: [
        'ui.banter.boss_down.storm_cailleach.a',
        'ui.banter.boss_down.storm_cailleach.b',
        'ui.banter.boss_down.storm_cailleach.c',
      ],
      // Post-bell — Twin Stones of Callanish, quiet after the circle falls.
      twin_stones: [
        'ui.banter.boss_down.twin_stones.a',
        'ui.banter.boss_down.twin_stones.b',
        'ui.banter.boss_down.twin_stones.c',
      ],
    },
  },
  {
    context: 'weapon_evolve',
    tone: 'hearth',
    priority: 65,
    keys: [
      'ui.banter.weapon_evolve.a',
      'ui.banter.weapon_evolve.b',
      'ui.banter.weapon_evolve.c',
      'ui.banter.weapon_evolve.d',
      'ui.banter.weapon_evolve.e',
      'ui.banter.weapon_evolve.f',
      'ui.banter.weapon_evolve.g',
      'ui.banter.weapon_evolve.h',
      'ui.banter.weapon_evolve.i',
    ],
    keysByTag: {
      thistle_shot: [
        'ui.banter.weapon_evolve.thistle_shot.a',
        'ui.banter.weapon_evolve.thistle_shot.b',
        'ui.banter.weapon_evolve.thistle_shot.c',
        'ui.banter.weapon_evolve.thistle_shot.d',
      ],
      bagpipe_blast: [
        'ui.banter.weapon_evolve.bagpipe_blast.a',
        'ui.banter.weapon_evolve.bagpipe_blast.b',
        'ui.banter.weapon_evolve.bagpipe_blast.c',
        'ui.banter.weapon_evolve.bagpipe_blast.d',
      ],
      caber_toss: [
        'ui.banter.weapon_evolve.caber_toss.a',
        'ui.banter.weapon_evolve.caber_toss.b',
        'ui.banter.weapon_evolve.caber_toss.c',
        'ui.banter.weapon_evolve.caber_toss.d',
      ],
      scotch_mist: [
        'ui.banter.weapon_evolve.scotch_mist.a',
        'ui.banter.weapon_evolve.scotch_mist.b',
        'ui.banter.weapon_evolve.scotch_mist.c',
        'ui.banter.weapon_evolve.scotch_mist.d',
      ],
      haggis_hurler: [
        'ui.banter.weapon_evolve.haggis_hurler.a',
        'ui.banter.weapon_evolve.haggis_hurler.b',
        'ui.banter.weapon_evolve.haggis_hurler.c',
        'ui.banter.weapon_evolve.haggis_hurler.d',
      ],
      nessie_tentacle: [
        'ui.banter.weapon_evolve.nessie_tentacle.a',
        'ui.banter.weapon_evolve.nessie_tentacle.b',
        'ui.banter.weapon_evolve.nessie_tentacle.c',
        'ui.banter.weapon_evolve.nessie_tentacle.d',
      ],
      claymore: [
        'ui.banter.weapon_evolve.claymore.a',
        'ui.banter.weapon_evolve.claymore.b',
        'ui.banter.weapon_evolve.claymore.c',
        'ui.banter.weapon_evolve.claymore.d',
      ],
      shinty_stick: [
        'ui.banter.weapon_evolve.shinty_stick.a',
        'ui.banter.weapon_evolve.shinty_stick.b',
        'ui.banter.weapon_evolve.shinty_stick.c',
        'ui.banter.weapon_evolve.shinty_stick.d',
      ],
      sgian_dubh: [
        'ui.banter.weapon_evolve.sgian_dubh.a',
        'ui.banter.weapon_evolve.sgian_dubh.b',
        'ui.banter.weapon_evolve.sgian_dubh.c',
        'ui.banter.weapon_evolve.sgian_dubh.d',
      ],
      stag_antler: [
        'ui.banter.weapon_evolve.stag_antler.a',
        'ui.banter.weapon_evolve.stag_antler.b',
        'ui.banter.weapon_evolve.stag_antler.c',
        'ui.banter.weapon_evolve.stag_antler.d',
      ],
      // Wild Living World Phase 2 — Waulking Mallet + Tuning Fork →
      // Pibroch Hammer. Lines lean into the rhythm coupling: the song
      // hits, then the echo lands. Voice register matches the other
      // Hearth lines (warm wonder, not boast).
      waulking_mallet: [
        'ui.banter.weapon_evolve.waulking_mallet.a',
        'ui.banter.weapon_evolve.waulking_mallet.b',
        'ui.banter.weapon_evolve.waulking_mallet.c',
        'ui.banter.weapon_evolve.waulking_mallet.d',
      ],
      // Highland Horrors (2026-05-12) — three new evolution chains:
      // Dirk Dance + Gillie's Edge → Dirk Flurry,
      // Granny's Curse + Widow's Shawl → Banshee Wail,
      // Wallace Sword + Stirling Medal → Freedom Blade.
      dirk_dance: [
        'ui.banter.weapon_evolve.dirk_dance.a',
        'ui.banter.weapon_evolve.dirk_dance.b',
        'ui.banter.weapon_evolve.dirk_dance.c',
        'ui.banter.weapon_evolve.dirk_dance.d',
      ],
      grannies_curse: [
        'ui.banter.weapon_evolve.grannies_curse.a',
        'ui.banter.weapon_evolve.grannies_curse.b',
        'ui.banter.weapon_evolve.grannies_curse.c',
        'ui.banter.weapon_evolve.grannies_curse.d',
      ],
      wallace_sword: [
        'ui.banter.weapon_evolve.wallace_sword.a',
        'ui.banter.weapon_evolve.wallace_sword.b',
        'ui.banter.weapon_evolve.wallace_sword.c',
        'ui.banter.weapon_evolve.wallace_sword.d',
      ],
      // Bodhrán + Drum Hoop → Beltane Drum (2026-05-24).
      // Hearth register — the drum deepens, the fire rises.
      bodhran: [
        'ui.banter.weapon_evolve.bodhran.a',
        'ui.banter.weapon_evolve.bodhran.b',
        'ui.banter.weapon_evolve.bodhran.c',
        'ui.banter.weapon_evolve.bodhran.d',
      ],
      // Selkie Song + Seal Pelt → Selkie Chorus (2026-05-24).
      // Hearth register — the song carries further, the sea answers.
      selkie_song: [
        'ui.banter.weapon_evolve.selkie_song.a',
        'ui.banter.weapon_evolve.selkie_song.b',
        'ui.banter.weapon_evolve.selkie_song.c',
        'ui.banter.weapon_evolve.selkie_song.d',
      ],
      // Bagpipes is utility-only (no entry in EVOLUTION_RECIPES) — see
      // CLAUDE.md "9 of the 10 weapons have a paired passive". Banter pool
      // intentionally omits a `bagpipes` tag so the system can never queue
      // a line that promises a non-existent evolution (T212).
    },
  },
  {
    context: 'curse_start',
    tone: 'hearth',
    priority: 59,
    keys: [
      'ui.banter.curse_start.generic.a',
      'ui.banter.curse_start.generic.b',
      'ui.banter.curse_start.generic.c',
      'ui.banter.curse_start.generic.d',
      'ui.banter.curse_start.generic.e',
      'ui.banter.curse_start.generic.f',
      'ui.banter.curse_start.generic.g',
      'ui.banter.curse_start.generic.h',
      'ui.banter.curse_start.generic.i',
    ],
    keysByTag: {
      heavy_legs: [
        'ui.banter.curse_start.heavy_legs.a',
        'ui.banter.curse_start.heavy_legs.b',
        'ui.banter.curse_start.heavy_legs.c',
        'ui.banter.curse_start.heavy_legs.d',
      ],
      thin_hide: [
        'ui.banter.curse_start.thin_hide.a',
        'ui.banter.curse_start.thin_hide.b',
        'ui.banter.curse_start.thin_hide.c',
        'ui.banter.curse_start.thin_hide.d',
      ],
      restless_spirits: [
        'ui.banter.curse_start.restless_spirits.a',
        'ui.banter.curse_start.restless_spirits.b',
        'ui.banter.curse_start.restless_spirits.c',
        'ui.banter.curse_start.restless_spirits.d',
      ],
      empty_larder: [
        'ui.banter.curse_start.empty_larder.a',
        'ui.banter.curse_start.empty_larder.b',
        'ui.banter.curse_start.empty_larder.c',
        'ui.banter.curse_start.empty_larder.d',
      ],
      windless_pipes: [
        'ui.banter.curse_start.windless_pipes.a',
        'ui.banter.curse_start.windless_pipes.b',
        'ui.banter.curse_start.windless_pipes.c',
        'ui.banter.curse_start.windless_pipes.d',
      ],
    },
  },
  {
    context: 'level_up',
    tone: 'hearth',
    priority: 60,
    keys: [
      'ui.banter.level_up.a',
      'ui.banter.level_up.b',
      'ui.banter.level_up.c',
      'ui.banter.level_up.d',
      'ui.banter.level_up.e',
      'ui.banter.level_up.f',
    ],
    // Variant voice — `classic` intentionally uses the generic pool only.
    keysByTag: {
      iron_belly: [
        'ui.banter.level_up.iron_belly.a',
        'ui.banter.level_up.iron_belly.b',
        'ui.banter.level_up.iron_belly.c',
        'ui.banter.level_up.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.level_up.moor_runner.a',
        'ui.banter.level_up.moor_runner.b',
        'ui.banter.level_up.moor_runner.c',
        'ui.banter.level_up.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.level_up.glen_forager.a',
        'ui.banter.level_up.glen_forager.b',
        'ui.banter.level_up.glen_forager.c',
        'ui.banter.level_up.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.level_up.surefoot.a',
        'ui.banter.level_up.surefoot.b',
        'ui.banter.level_up.surefoot.c',
        'ui.banter.level_up.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.level_up.pipe_breath.a',
        'ui.banter.level_up.pipe_breath.b',
        'ui.banter.level_up.pipe_breath.c',
        'ui.banter.level_up.pipe_breath.d',
      ],
      laird: [
        'ui.banter.level_up.laird.a',
        'ui.banter.level_up.laird.b',
        'ui.banter.level_up.laird.c',
        'ui.banter.level_up.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.level_up.wee_ghostie.a',
        'ui.banter.level_up.wee_ghostie.b',
        'ui.banter.level_up.wee_ghostie.c',
        'ui.banter.level_up.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.level_up.glaswegian.a',
        'ui.banter.level_up.glaswegian.b',
        'ui.banter.level_up.glaswegian.c',
        'ui.banter.level_up.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.level_up.cailleach.a',
        'ui.banter.level_up.cailleach.b',
        'ui.banter.level_up.cailleach.c',
        'ui.banter.level_up.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.level_up.anticlockwise.a',
        'ui.banter.level_up.anticlockwise.b',
        'ui.banter.level_up.anticlockwise.c',
        'ui.banter.level_up.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.level_up.doric_quinie.a',
        'ui.banter.level_up.doric_quinie.b',
        'ui.banter.level_up.doric_quinie.c',
        'ui.banter.level_up.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.level_up.peerie_shetlander.a',
        'ui.banter.level_up.peerie_shetlander.b',
        'ui.banter.level_up.peerie_shetlander.c',
        'ui.banter.level_up.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.level_up.burns_wee_beastie.a',
        'ui.banter.level_up.burns_wee_beastie.b',
        'ui.banter.level_up.burns_wee_beastie.c',
        'ui.banter.level_up.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.level_up.witch_hare.a',
        'ui.banter.level_up.witch_hare.b',
        'ui.banter.level_up.witch_hare.c',
        'ui.banter.level_up.witch_hare.d',
      ],
      selkie: [
        'ui.banter.level_up.selkie.a',
        'ui.banter.level_up.selkie.b',
        'ui.banter.level_up.selkie.c',
        'ui.banter.level_up.selkie.d',
      ],
      morningside: [
        'ui.banter.level_up.morningside.a',
        'ui.banter.level_up.morningside.b',
        'ui.banter.level_up.morningside.c',
        'ui.banter.level_up.morningside.d',
      ],
      drouthy: [
        'ui.banter.level_up.drouthy.a',
        'ui.banter.level_up.drouthy.b',
        'ui.banter.level_up.drouthy.c',
        'ui.banter.level_up.drouthy.d',
      ],
      pibroch: [
        'ui.banter.level_up.pibroch.a',
        'ui.banter.level_up.pibroch.b',
        'ui.banter.level_up.pibroch.c',
        'ui.banter.level_up.pibroch.d',
      ],
      orcadian: [
        'ui.banter.level_up.orcadian.a',
        'ui.banter.level_up.orcadian.b',
        'ui.banter.level_up.orcadian.c',
        'ui.banter.level_up.orcadian.d',
      ],
      hebridean: [
        'ui.banter.level_up.hebridean.a',
        'ui.banter.level_up.hebridean.b',
        'ui.banter.level_up.hebridean.c',
        'ui.banter.level_up.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.level_up.iron_brew.a',
        'ui.banter.level_up.iron_brew.b',
        'ui.banter.level_up.iron_brew.c',
        'ui.banter.level_up.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.level_up.grans_best.a',
        'ui.banter.level_up.grans_best.b',
        'ui.banter.level_up.grans_best.c',
        'ui.banter.level_up.grans_best.d',
      ],
      the_pict: [
        'ui.banter.level_up.the_pict.a',
        'ui.banter.level_up.the_pict.b',
        'ui.banter.level_up.the_pict.c',
        'ui.banter.level_up.the_pict.d',
      ],
      jacobite: [
        'ui.banter.level_up.jacobite.a',
        'ui.banter.level_up.jacobite.b',
        'ui.banter.level_up.jacobite.c',
        'ui.banter.level_up.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.level_up.tam_o_shanter.a',
        'ui.banter.level_up.tam_o_shanter.b',
        'ui.banter.level_up.tam_o_shanter.c',
        'ui.banter.level_up.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.level_up.engineer.a',
        'ui.banter.level_up.engineer.b',
        'ui.banter.level_up.engineer.c',
        'ui.banter.level_up.engineer.d',
      ],
      tufted: [
        'ui.banter.level_up.tufted.a',
        'ui.banter.level_up.tufted.b',
        'ui.banter.level_up.tufted.c',
        'ui.banter.level_up.tufted.d',
      ],
    },
  },
  {
    context: 'first_blood',
    tone: 'hearth',
    priority: 50,
    keys: [
      'ui.banter.first_blood.a',
      'ui.banter.first_blood.b',
      'ui.banter.first_blood.c',
      'ui.banter.first_blood.d',
      'ui.banter.first_blood.e',
      'ui.banter.first_blood.f',
      'ui.banter.first_blood.g',
      'ui.banter.first_blood.h',
      'ui.banter.first_blood.i',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.first_blood.iron_belly.a',
        'ui.banter.first_blood.iron_belly.b',
        'ui.banter.first_blood.iron_belly.c',
        'ui.banter.first_blood.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.first_blood.moor_runner.a',
        'ui.banter.first_blood.moor_runner.b',
        'ui.banter.first_blood.moor_runner.c',
        'ui.banter.first_blood.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.first_blood.glen_forager.a',
        'ui.banter.first_blood.glen_forager.b',
        'ui.banter.first_blood.glen_forager.c',
        'ui.banter.first_blood.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.first_blood.surefoot.a',
        'ui.banter.first_blood.surefoot.b',
        'ui.banter.first_blood.surefoot.c',
        'ui.banter.first_blood.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.first_blood.pipe_breath.a',
        'ui.banter.first_blood.pipe_breath.b',
        'ui.banter.first_blood.pipe_breath.c',
        'ui.banter.first_blood.pipe_breath.d',
      ],
      laird: [
        'ui.banter.first_blood.laird.a',
        'ui.banter.first_blood.laird.b',
        'ui.banter.first_blood.laird.c',
        'ui.banter.first_blood.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.first_blood.wee_ghostie.a',
        'ui.banter.first_blood.wee_ghostie.b',
        'ui.banter.first_blood.wee_ghostie.c',
        'ui.banter.first_blood.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.first_blood.glaswegian.a',
        'ui.banter.first_blood.glaswegian.b',
        'ui.banter.first_blood.glaswegian.c',
        'ui.banter.first_blood.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.first_blood.cailleach.a',
        'ui.banter.first_blood.cailleach.b',
        'ui.banter.first_blood.cailleach.c',
        'ui.banter.first_blood.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.first_blood.anticlockwise.a',
        'ui.banter.first_blood.anticlockwise.b',
        'ui.banter.first_blood.anticlockwise.c',
        'ui.banter.first_blood.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.first_blood.doric_quinie.a',
        'ui.banter.first_blood.doric_quinie.b',
        'ui.banter.first_blood.doric_quinie.c',
        'ui.banter.first_blood.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.first_blood.peerie_shetlander.a',
        'ui.banter.first_blood.peerie_shetlander.b',
        'ui.banter.first_blood.peerie_shetlander.c',
        'ui.banter.first_blood.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.first_blood.burns_wee_beastie.a',
        'ui.banter.first_blood.burns_wee_beastie.b',
        'ui.banter.first_blood.burns_wee_beastie.c',
        'ui.banter.first_blood.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.first_blood.witch_hare.a',
        'ui.banter.first_blood.witch_hare.b',
        'ui.banter.first_blood.witch_hare.c',
        'ui.banter.first_blood.witch_hare.d',
      ],
      selkie: [
        'ui.banter.first_blood.selkie.a',
        'ui.banter.first_blood.selkie.b',
        'ui.banter.first_blood.selkie.c',
        'ui.banter.first_blood.selkie.d',
      ],
      morningside: [
        'ui.banter.first_blood.morningside.a',
        'ui.banter.first_blood.morningside.b',
        'ui.banter.first_blood.morningside.c',
        'ui.banter.first_blood.morningside.d',
      ],
      drouthy: [
        'ui.banter.first_blood.drouthy.a',
        'ui.banter.first_blood.drouthy.b',
        'ui.banter.first_blood.drouthy.c',
        'ui.banter.first_blood.drouthy.d',
      ],
      pibroch: [
        'ui.banter.first_blood.pibroch.a',
        'ui.banter.first_blood.pibroch.b',
        'ui.banter.first_blood.pibroch.c',
        'ui.banter.first_blood.pibroch.d',
      ],
      orcadian: [
        'ui.banter.first_blood.orcadian.a',
        'ui.banter.first_blood.orcadian.b',
        'ui.banter.first_blood.orcadian.c',
        'ui.banter.first_blood.orcadian.d',
      ],
      hebridean: [
        'ui.banter.first_blood.hebridean.a',
        'ui.banter.first_blood.hebridean.b',
        'ui.banter.first_blood.hebridean.c',
        'ui.banter.first_blood.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.first_blood.iron_brew.a',
        'ui.banter.first_blood.iron_brew.b',
        'ui.banter.first_blood.iron_brew.c',
        'ui.banter.first_blood.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.first_blood.grans_best.a',
        'ui.banter.first_blood.grans_best.b',
        'ui.banter.first_blood.grans_best.c',
        'ui.banter.first_blood.grans_best.d',
      ],
      the_pict: [
        'ui.banter.first_blood.the_pict.a',
        'ui.banter.first_blood.the_pict.b',
        'ui.banter.first_blood.the_pict.c',
        'ui.banter.first_blood.the_pict.d',
      ],
      jacobite: [
        'ui.banter.first_blood.jacobite.a',
        'ui.banter.first_blood.jacobite.b',
        'ui.banter.first_blood.jacobite.c',
        'ui.banter.first_blood.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.first_blood.tam_o_shanter.a',
        'ui.banter.first_blood.tam_o_shanter.b',
        'ui.banter.first_blood.tam_o_shanter.c',
        'ui.banter.first_blood.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.first_blood.engineer.a',
        'ui.banter.first_blood.engineer.b',
        'ui.banter.first_blood.engineer.c',
        'ui.banter.first_blood.engineer.d',
      ],
      tufted: [
        'ui.banter.first_blood.tufted.a',
        'ui.banter.first_blood.tufted.b',
        'ui.banter.first_blood.tufted.c',
        'ui.banter.first_blood.tufted.d',
      ],
    },
  },
  {
    context: 'kill_streak',
    tone: 'hearth',
    priority: 40,
    keys: [
      'ui.banter.kill_streak.a',
      'ui.banter.kill_streak.b',
      'ui.banter.kill_streak.c',
      'ui.banter.kill_streak.d',
      'ui.banter.kill_streak.e',
      'ui.banter.kill_streak.f',
      'ui.banter.kill_streak.g',
      'ui.banter.kill_streak.h',
      'ui.banter.kill_streak.i',
      'ui.banter.kill_streak.j',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.kill_streak.iron_belly.a',
        'ui.banter.kill_streak.iron_belly.b',
        'ui.banter.kill_streak.iron_belly.c',
        'ui.banter.kill_streak.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.kill_streak.moor_runner.a',
        'ui.banter.kill_streak.moor_runner.b',
        'ui.banter.kill_streak.moor_runner.c',
        'ui.banter.kill_streak.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.kill_streak.glen_forager.a',
        'ui.banter.kill_streak.glen_forager.b',
        'ui.banter.kill_streak.glen_forager.c',
        'ui.banter.kill_streak.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.kill_streak.surefoot.a',
        'ui.banter.kill_streak.surefoot.b',
        'ui.banter.kill_streak.surefoot.c',
        'ui.banter.kill_streak.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.kill_streak.pipe_breath.a',
        'ui.banter.kill_streak.pipe_breath.b',
        'ui.banter.kill_streak.pipe_breath.c',
        'ui.banter.kill_streak.pipe_breath.d',
      ],
      laird: [
        'ui.banter.kill_streak.laird.a',
        'ui.banter.kill_streak.laird.b',
        'ui.banter.kill_streak.laird.c',
        'ui.banter.kill_streak.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.kill_streak.wee_ghostie.a',
        'ui.banter.kill_streak.wee_ghostie.b',
        'ui.banter.kill_streak.wee_ghostie.c',
        'ui.banter.kill_streak.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.kill_streak.glaswegian.a',
        'ui.banter.kill_streak.glaswegian.b',
        'ui.banter.kill_streak.glaswegian.c',
        'ui.banter.kill_streak.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.kill_streak.cailleach.a',
        'ui.banter.kill_streak.cailleach.b',
        'ui.banter.kill_streak.cailleach.c',
        'ui.banter.kill_streak.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.kill_streak.anticlockwise.a',
        'ui.banter.kill_streak.anticlockwise.b',
        'ui.banter.kill_streak.anticlockwise.c',
        'ui.banter.kill_streak.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.kill_streak.doric_quinie.a',
        'ui.banter.kill_streak.doric_quinie.b',
        'ui.banter.kill_streak.doric_quinie.c',
        'ui.banter.kill_streak.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.kill_streak.peerie_shetlander.a',
        'ui.banter.kill_streak.peerie_shetlander.b',
        'ui.banter.kill_streak.peerie_shetlander.c',
        'ui.banter.kill_streak.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.kill_streak.burns_wee_beastie.a',
        'ui.banter.kill_streak.burns_wee_beastie.b',
        'ui.banter.kill_streak.burns_wee_beastie.c',
        'ui.banter.kill_streak.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.kill_streak.witch_hare.a',
        'ui.banter.kill_streak.witch_hare.b',
        'ui.banter.kill_streak.witch_hare.c',
        'ui.banter.kill_streak.witch_hare.d',
      ],
      selkie: [
        'ui.banter.kill_streak.selkie.a',
        'ui.banter.kill_streak.selkie.b',
        'ui.banter.kill_streak.selkie.c',
        'ui.banter.kill_streak.selkie.d',
      ],
      morningside: [
        'ui.banter.kill_streak.morningside.a',
        'ui.banter.kill_streak.morningside.b',
        'ui.banter.kill_streak.morningside.c',
        'ui.banter.kill_streak.morningside.d',
      ],
      drouthy: [
        'ui.banter.kill_streak.drouthy.a',
        'ui.banter.kill_streak.drouthy.b',
        'ui.banter.kill_streak.drouthy.c',
        'ui.banter.kill_streak.drouthy.d',
      ],
      pibroch: [
        'ui.banter.kill_streak.pibroch.a',
        'ui.banter.kill_streak.pibroch.b',
        'ui.banter.kill_streak.pibroch.c',
        'ui.banter.kill_streak.pibroch.d',
      ],
      orcadian: [
        'ui.banter.kill_streak.orcadian.a',
        'ui.banter.kill_streak.orcadian.b',
        'ui.banter.kill_streak.orcadian.c',
        'ui.banter.kill_streak.orcadian.d',
      ],
      hebridean: [
        'ui.banter.kill_streak.hebridean.a',
        'ui.banter.kill_streak.hebridean.b',
        'ui.banter.kill_streak.hebridean.c',
        'ui.banter.kill_streak.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.kill_streak.iron_brew.a',
        'ui.banter.kill_streak.iron_brew.b',
        'ui.banter.kill_streak.iron_brew.c',
        'ui.banter.kill_streak.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.kill_streak.grans_best.a',
        'ui.banter.kill_streak.grans_best.b',
        'ui.banter.kill_streak.grans_best.c',
        'ui.banter.kill_streak.grans_best.d',
      ],
      the_pict: [
        'ui.banter.kill_streak.the_pict.a',
        'ui.banter.kill_streak.the_pict.b',
        'ui.banter.kill_streak.the_pict.c',
        'ui.banter.kill_streak.the_pict.d',
      ],
      jacobite: [
        'ui.banter.kill_streak.jacobite.a',
        'ui.banter.kill_streak.jacobite.b',
        'ui.banter.kill_streak.jacobite.c',
        'ui.banter.kill_streak.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.kill_streak.tam_o_shanter.a',
        'ui.banter.kill_streak.tam_o_shanter.b',
        'ui.banter.kill_streak.tam_o_shanter.c',
        'ui.banter.kill_streak.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.kill_streak.engineer.a',
        'ui.banter.kill_streak.engineer.b',
        'ui.banter.kill_streak.engineer.c',
        'ui.banter.kill_streak.engineer.d',
      ],
      tufted: [
        'ui.banter.kill_streak.tufted.a',
        'ui.banter.kill_streak.tufted.b',
        'ui.banter.kill_streak.tufted.c',
        'ui.banter.kill_streak.tufted.d',
      ],
    },
  },
  {
    context: 'recover',
    tone: 'hearth',
    priority: 35,
    keys: [
      'ui.banter.recover.a',
      'ui.banter.recover.b',
      'ui.banter.recover.c',
      'ui.banter.recover.d',
      'ui.banter.recover.e',
      'ui.banter.recover.f',
      'ui.banter.recover.g',
      'ui.banter.recover.h',
      'ui.banter.recover.i',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.recover.iron_belly.a',
        'ui.banter.recover.iron_belly.b',
        'ui.banter.recover.iron_belly.c',
        'ui.banter.recover.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.recover.moor_runner.a',
        'ui.banter.recover.moor_runner.b',
        'ui.banter.recover.moor_runner.c',
        'ui.banter.recover.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.recover.glen_forager.a',
        'ui.banter.recover.glen_forager.b',
        'ui.banter.recover.glen_forager.c',
        'ui.banter.recover.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.recover.surefoot.a',
        'ui.banter.recover.surefoot.b',
        'ui.banter.recover.surefoot.c',
        'ui.banter.recover.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.recover.pipe_breath.a',
        'ui.banter.recover.pipe_breath.b',
        'ui.banter.recover.pipe_breath.c',
        'ui.banter.recover.pipe_breath.d',
      ],
      laird: [
        'ui.banter.recover.laird.a',
        'ui.banter.recover.laird.b',
        'ui.banter.recover.laird.c',
        'ui.banter.recover.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.recover.wee_ghostie.a',
        'ui.banter.recover.wee_ghostie.b',
        'ui.banter.recover.wee_ghostie.c',
        'ui.banter.recover.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.recover.glaswegian.a',
        'ui.banter.recover.glaswegian.b',
        'ui.banter.recover.glaswegian.c',
        'ui.banter.recover.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.recover.cailleach.a',
        'ui.banter.recover.cailleach.b',
        'ui.banter.recover.cailleach.c',
        'ui.banter.recover.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.recover.anticlockwise.a',
        'ui.banter.recover.anticlockwise.b',
        'ui.banter.recover.anticlockwise.c',
        'ui.banter.recover.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.recover.doric_quinie.a',
        'ui.banter.recover.doric_quinie.b',
        'ui.banter.recover.doric_quinie.c',
        'ui.banter.recover.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.recover.peerie_shetlander.a',
        'ui.banter.recover.peerie_shetlander.b',
        'ui.banter.recover.peerie_shetlander.c',
        'ui.banter.recover.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.recover.burns_wee_beastie.a',
        'ui.banter.recover.burns_wee_beastie.b',
        'ui.banter.recover.burns_wee_beastie.c',
        'ui.banter.recover.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.recover.witch_hare.a',
        'ui.banter.recover.witch_hare.b',
        'ui.banter.recover.witch_hare.c',
        'ui.banter.recover.witch_hare.d',
      ],
      selkie: [
        'ui.banter.recover.selkie.a',
        'ui.banter.recover.selkie.b',
        'ui.banter.recover.selkie.c',
        'ui.banter.recover.selkie.d',
      ],
      morningside: [
        'ui.banter.recover.morningside.a',
        'ui.banter.recover.morningside.b',
        'ui.banter.recover.morningside.c',
        'ui.banter.recover.morningside.d',
      ],
      drouthy: [
        'ui.banter.recover.drouthy.a',
        'ui.banter.recover.drouthy.b',
        'ui.banter.recover.drouthy.c',
        'ui.banter.recover.drouthy.d',
      ],
      pibroch: [
        'ui.banter.recover.pibroch.a',
        'ui.banter.recover.pibroch.b',
        'ui.banter.recover.pibroch.c',
        'ui.banter.recover.pibroch.d',
      ],
      orcadian: [
        'ui.banter.recover.orcadian.a',
        'ui.banter.recover.orcadian.b',
        'ui.banter.recover.orcadian.c',
        'ui.banter.recover.orcadian.d',
      ],
      hebridean: [
        'ui.banter.recover.hebridean.a',
        'ui.banter.recover.hebridean.b',
        'ui.banter.recover.hebridean.c',
        'ui.banter.recover.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.recover.iron_brew.a',
        'ui.banter.recover.iron_brew.b',
        'ui.banter.recover.iron_brew.c',
        'ui.banter.recover.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.recover.grans_best.a',
        'ui.banter.recover.grans_best.b',
        'ui.banter.recover.grans_best.c',
        'ui.banter.recover.grans_best.d',
      ],
      the_pict: [
        'ui.banter.recover.the_pict.a',
        'ui.banter.recover.the_pict.b',
        'ui.banter.recover.the_pict.c',
        'ui.banter.recover.the_pict.d',
      ],
      jacobite: [
        'ui.banter.recover.jacobite.a',
        'ui.banter.recover.jacobite.b',
        'ui.banter.recover.jacobite.c',
        'ui.banter.recover.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.recover.tam_o_shanter.a',
        'ui.banter.recover.tam_o_shanter.b',
        'ui.banter.recover.tam_o_shanter.c',
        'ui.banter.recover.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.recover.engineer.a',
        'ui.banter.recover.engineer.b',
        'ui.banter.recover.engineer.c',
        'ui.banter.recover.engineer.d',
      ],
      tufted: [
        'ui.banter.recover.tufted.a',
        'ui.banter.recover.tufted.b',
        'ui.banter.recover.tufted.c',
        'ui.banter.recover.tufted.d',
      ],
    },
  },
  {
    context: 'biome_change',
    tone: 'hearth',
    priority: 30,
    keys: [
      'ui.banter.biome_change.a',
      'ui.banter.biome_change.b',
      'ui.banter.biome_change.c',
      'ui.banter.biome_change.d',
      'ui.banter.biome_change.e',
      'ui.banter.biome_change.f',
      'ui.banter.biome_change.g',
      'ui.banter.biome_change.h',
      'ui.banter.biome_change.i',
    ],
    keysByTag: {
      bog: [
        'ui.banter.biome_change.bog.a',
        'ui.banter.biome_change.bog.b',
        'ui.banter.biome_change.bog.c',
        'ui.banter.biome_change.bog.d',
      ],
      loch: [
        'ui.banter.biome_change.loch.a',
        'ui.banter.biome_change.loch.b',
        'ui.banter.biome_change.loch.c',
        'ui.banter.biome_change.loch.d',
      ],
      pine: [
        'ui.banter.biome_change.pine.a',
        'ui.banter.biome_change.pine.b',
        'ui.banter.biome_change.pine.c',
        'ui.banter.biome_change.pine.d',
      ],
      heather: [
        'ui.banter.biome_change.heather.a',
        'ui.banter.biome_change.heather.b',
        'ui.banter.biome_change.heather.c',
        'ui.banter.biome_change.heather.d',
      ],
      coastal: [
        'ui.banter.biome_change.coastal.a',
        'ui.banter.biome_change.coastal.b',
        'ui.banter.biome_change.coastal.c',
        'ui.banter.biome_change.coastal.d',
      ],
      haar: [
        'ui.banter.biome_change.haar.a',
        'ui.banter.biome_change.haar.b',
        'ui.banter.biome_change.haar.c',
        'ui.banter.biome_change.haar.d',
      ],
      frost: [
        'ui.banter.biome_change.frost.a',
        'ui.banter.biome_change.frost.b',
        'ui.banter.biome_change.frost.c',
        'ui.banter.biome_change.frost.d',
      ],
      // Highland Horrors (2026-05-12) — two new biomes. Cairngorm
      // plateau leans grave (subarctic / Bodach Glas); Glen Coe leans
      // grave-respectful (massacre, weight of 1692). Voice register
      // matches the existing hearth pool (short, observational, not
      // melodramatic).
      cairngorm: [
        'ui.banter.biome_change.cairngorm.a',
        'ui.banter.biome_change.cairngorm.b',
        'ui.banter.biome_change.cairngorm.c',
        'ui.banter.biome_change.cairngorm.d',
      ],
      glen_coe: [
        'ui.banter.biome_change.glen_coe.a',
        'ui.banter.biome_change.glen_coe.b',
        'ui.banter.biome_change.glen_coe.c',
        'ui.banter.biome_change.glen_coe.d',
      ],
      // Clyde Shipyard (2026-05-24) — postindustrial Clyde dockland.
      // Hearth register: working-class pride, industrial nostalgia, practical
      // footing warnings. Short, observational, no melodrama.
      clyde_shipyard: [
        'ui.banter.biome_change.clyde_shipyard.a',
        'ui.banter.biome_change.clyde_shipyard.b',
        'ui.banter.biome_change.clyde_shipyard.c',
        'ui.banter.biome_change.clyde_shipyard.d',
      ],
      // Black Bog — ink-dark compressed peat mire, drift ×2.
      // Edge register: sparse, foreboding, tactile. No comedy.
      black_bog: [
        'ui.banter.biome_change.black_bog.a',
        'ui.banter.biome_change.black_bog.b',
        'ui.banter.biome_change.black_bog.c',
        'ui.banter.biome_change.black_bog.d',
      ],
      // Ben Nevis Summit (2026-05-24) — wind push, exposed plateau.
      // Edge register: terse, elemental. The Ben doesn't explain itself.
      ben_nevis: [
        'ui.banter.biome_change.ben_nevis.a',
        'ui.banter.biome_change.ben_nevis.b',
        'ui.banter.biome_change.ben_nevis.c',
        'ui.banter.biome_change.ben_nevis.d',
      ],
    },
  },
  {
    context: 'moor_moment',
    tone: 'hearth',
    priority: 31,
    // B1 Phase 2 Task 11 — expanded generic pool (a–z, 26 lines) and every
    // biome tag to +3; home_biome tags to +2. Totals +40 leaves over the
    // Phase 1 baseline, voice-registered against the moor-observational
    // hearth tone (short, metaphor-light, moor-tipping-its-hat energy).
    keys: [
      'ui.banter.moor_moment.a',
      'ui.banter.moor_moment.b',
      'ui.banter.moor_moment.c',
      'ui.banter.moor_moment.d',
      'ui.banter.moor_moment.e',
      'ui.banter.moor_moment.f',
      'ui.banter.moor_moment.g',
      'ui.banter.moor_moment.h',
      'ui.banter.moor_moment.i',
      'ui.banter.moor_moment.j',
      'ui.banter.moor_moment.k',
      'ui.banter.moor_moment.l',
      'ui.banter.moor_moment.m',
      'ui.banter.moor_moment.n',
      'ui.banter.moor_moment.o',
      'ui.banter.moor_moment.p',
      'ui.banter.moor_moment.q',
      'ui.banter.moor_moment.r',
      'ui.banter.moor_moment.s',
      'ui.banter.moor_moment.t',
      'ui.banter.moor_moment.u',
      'ui.banter.moor_moment.v',
      'ui.banter.moor_moment.w',
      'ui.banter.moor_moment.x',
      'ui.banter.moor_moment.y',
      'ui.banter.moor_moment.z',
    ],
    keysByTag: {
      home_bog: [
        'ui.banter.moor_moment.home_bog.a',
        'ui.banter.moor_moment.home_bog.b',
        'ui.banter.moor_moment.home_bog.c',
        'ui.banter.moor_moment.home_bog.d',
        'ui.banter.moor_moment.home_bog.e',
        'ui.banter.moor_moment.home_bog.f',
      ],
      home_loch: [
        'ui.banter.moor_moment.home_loch.a',
        'ui.banter.moor_moment.home_loch.b',
        'ui.banter.moor_moment.home_loch.c',
        'ui.banter.moor_moment.home_loch.d',
        'ui.banter.moor_moment.home_loch.e',
        'ui.banter.moor_moment.home_loch.f',
      ],
      home_pine: [
        'ui.banter.moor_moment.home_pine.a',
        'ui.banter.moor_moment.home_pine.b',
        'ui.banter.moor_moment.home_pine.c',
        'ui.banter.moor_moment.home_pine.d',
        'ui.banter.moor_moment.home_pine.e',
        'ui.banter.moor_moment.home_pine.f',
      ],
      home_heather: [
        'ui.banter.moor_moment.home_heather.a',
        'ui.banter.moor_moment.home_heather.b',
        'ui.banter.moor_moment.home_heather.c',
        'ui.banter.moor_moment.home_heather.d',
        'ui.banter.moor_moment.home_heather.e',
        'ui.banter.moor_moment.home_heather.f',
      ],
      bog: [
        'ui.banter.moor_moment.bog.a',
        'ui.banter.moor_moment.bog.b',
        'ui.banter.moor_moment.bog.c',
        'ui.banter.moor_moment.bog.d',
        'ui.banter.moor_moment.bog.e',
        'ui.banter.moor_moment.bog.f',
      ],
      loch: [
        'ui.banter.moor_moment.loch.a',
        'ui.banter.moor_moment.loch.b',
        'ui.banter.moor_moment.loch.c',
        'ui.banter.moor_moment.loch.d',
        'ui.banter.moor_moment.loch.e',
        'ui.banter.moor_moment.loch.f',
      ],
      pine: [
        'ui.banter.moor_moment.pine.a',
        'ui.banter.moor_moment.pine.b',
        'ui.banter.moor_moment.pine.c',
        'ui.banter.moor_moment.pine.d',
        'ui.banter.moor_moment.pine.e',
        'ui.banter.moor_moment.pine.f',
      ],
      heather: [
        'ui.banter.moor_moment.heather.a',
        'ui.banter.moor_moment.heather.b',
        'ui.banter.moor_moment.heather.c',
        'ui.banter.moor_moment.heather.d',
        'ui.banter.moor_moment.heather.e',
        'ui.banter.moor_moment.heather.f',
      ],
    },
  },
  {
    context: 'idle',
    tone: 'hearth',
    priority: 10,
    keys: [
      'ui.banter.idle.a',
      'ui.banter.idle.b',
      'ui.banter.idle.c',
      'ui.banter.idle.d',
      'ui.banter.idle.e',
      'ui.banter.idle.f',
      'ui.banter.idle.g',
      'ui.banter.idle.h',
      'ui.banter.idle.i',
      'ui.banter.idle.j',
      'ui.banter.idle.k',
      'ui.banter.idle.l',
      'ui.banter.idle.m',
      'ui.banter.idle.n',
      'ui.banter.idle.o',
    ],
    keysByTag: {
      iron_belly: [
        'ui.banter.idle.iron_belly.a',
        'ui.banter.idle.iron_belly.b',
        'ui.banter.idle.iron_belly.c',
        'ui.banter.idle.iron_belly.d',
      ],
      moor_runner: [
        'ui.banter.idle.moor_runner.a',
        'ui.banter.idle.moor_runner.b',
        'ui.banter.idle.moor_runner.c',
        'ui.banter.idle.moor_runner.d',
      ],
      glen_forager: [
        'ui.banter.idle.glen_forager.a',
        'ui.banter.idle.glen_forager.b',
        'ui.banter.idle.glen_forager.c',
        'ui.banter.idle.glen_forager.d',
      ],
      surefoot: [
        'ui.banter.idle.surefoot.a',
        'ui.banter.idle.surefoot.b',
        'ui.banter.idle.surefoot.c',
        'ui.banter.idle.surefoot.d',
      ],
      pipe_breath: [
        'ui.banter.idle.pipe_breath.a',
        'ui.banter.idle.pipe_breath.b',
        'ui.banter.idle.pipe_breath.c',
        'ui.banter.idle.pipe_breath.d',
      ],
      laird: [
        'ui.banter.idle.laird.a',
        'ui.banter.idle.laird.b',
        'ui.banter.idle.laird.c',
        'ui.banter.idle.laird.d',
      ],
      wee_ghostie: [
        'ui.banter.idle.wee_ghostie.a',
        'ui.banter.idle.wee_ghostie.b',
        'ui.banter.idle.wee_ghostie.c',
        'ui.banter.idle.wee_ghostie.d',
      ],
      glaswegian: [
        'ui.banter.idle.glaswegian.a',
        'ui.banter.idle.glaswegian.b',
        'ui.banter.idle.glaswegian.c',
        'ui.banter.idle.glaswegian.d',
      ],
      cailleach: [
        'ui.banter.idle.cailleach.a',
        'ui.banter.idle.cailleach.b',
        'ui.banter.idle.cailleach.c',
        'ui.banter.idle.cailleach.d',
      ],
      anticlockwise: [
        'ui.banter.idle.anticlockwise.a',
        'ui.banter.idle.anticlockwise.b',
        'ui.banter.idle.anticlockwise.c',
        'ui.banter.idle.anticlockwise.d',
      ],
      doric_quinie: [
        'ui.banter.idle.doric_quinie.a',
        'ui.banter.idle.doric_quinie.b',
        'ui.banter.idle.doric_quinie.c',
        'ui.banter.idle.doric_quinie.d',
      ],
      peerie_shetlander: [
        'ui.banter.idle.peerie_shetlander.a',
        'ui.banter.idle.peerie_shetlander.b',
        'ui.banter.idle.peerie_shetlander.c',
        'ui.banter.idle.peerie_shetlander.d',
      ],
      burns_wee_beastie: [
        'ui.banter.idle.burns_wee_beastie.a',
        'ui.banter.idle.burns_wee_beastie.b',
        'ui.banter.idle.burns_wee_beastie.c',
        'ui.banter.idle.burns_wee_beastie.d',
      ],
      witch_hare: [
        'ui.banter.idle.witch_hare.a',
        'ui.banter.idle.witch_hare.b',
        'ui.banter.idle.witch_hare.c',
        'ui.banter.idle.witch_hare.d',
      ],
      selkie: [
        'ui.banter.idle.selkie.a',
        'ui.banter.idle.selkie.b',
        'ui.banter.idle.selkie.c',
        'ui.banter.idle.selkie.d',
      ],
      morningside: [
        'ui.banter.idle.morningside.a',
        'ui.banter.idle.morningside.b',
        'ui.banter.idle.morningside.c',
        'ui.banter.idle.morningside.d',
      ],
      drouthy: [
        'ui.banter.idle.drouthy.a',
        'ui.banter.idle.drouthy.b',
        'ui.banter.idle.drouthy.c',
        'ui.banter.idle.drouthy.d',
      ],
      pibroch: [
        'ui.banter.idle.pibroch.a',
        'ui.banter.idle.pibroch.b',
        'ui.banter.idle.pibroch.c',
        'ui.banter.idle.pibroch.d',
      ],
      orcadian: [
        'ui.banter.idle.orcadian.a',
        'ui.banter.idle.orcadian.b',
        'ui.banter.idle.orcadian.c',
        'ui.banter.idle.orcadian.d',
      ],
      hebridean: [
        'ui.banter.idle.hebridean.a',
        'ui.banter.idle.hebridean.b',
        'ui.banter.idle.hebridean.c',
        'ui.banter.idle.hebridean.d',
      ],
      iron_brew: [
        'ui.banter.idle.iron_brew.a',
        'ui.banter.idle.iron_brew.b',
        'ui.banter.idle.iron_brew.c',
        'ui.banter.idle.iron_brew.d',
      ],
      grans_best: [
        'ui.banter.idle.grans_best.a',
        'ui.banter.idle.grans_best.b',
        'ui.banter.idle.grans_best.c',
        'ui.banter.idle.grans_best.d',
      ],
      the_pict: [
        'ui.banter.idle.the_pict.a',
        'ui.banter.idle.the_pict.b',
        'ui.banter.idle.the_pict.c',
        'ui.banter.idle.the_pict.d',
      ],
      jacobite: [
        'ui.banter.idle.jacobite.a',
        'ui.banter.idle.jacobite.b',
        'ui.banter.idle.jacobite.c',
        'ui.banter.idle.jacobite.d',
      ],
      tam_o_shanter: [
        'ui.banter.idle.tam_o_shanter.a',
        'ui.banter.idle.tam_o_shanter.b',
        'ui.banter.idle.tam_o_shanter.c',
        'ui.banter.idle.tam_o_shanter.d',
      ],
      engineer: [
        'ui.banter.idle.engineer.a',
        'ui.banter.idle.engineer.b',
        'ui.banter.idle.engineer.c',
        'ui.banter.idle.engineer.d',
      ],
      tufted: [
        'ui.banter.idle.tufted.a',
        'ui.banter.idle.tufted.b',
        'ui.banter.idle.tufted.c',
        'ui.banter.idle.tufted.d',
      ],
    },
  },
  // W2 Moor Road.
  {
    context: 'act_intermission_enter',
    tone: 'hearth',
    priority: 52,
    keys: [
      'ui.banter.act_intermission_enter.a',
      'ui.banter.act_intermission_enter.b',
      'ui.banter.act_intermission_enter.c',
      'ui.banter.act_intermission_enter.d',
      'ui.banter.act_intermission_enter.e',
      'ui.banter.act_intermission_enter.f',
      'ui.banter.act_intermission_enter.g',
      'ui.banter.act_intermission_enter.h',
    ],
  },
  {
    context: 'act_complete',
    tone: 'hearth',
    priority: 57,
    keys: [
      'ui.banter.act_complete.a',
      'ui.banter.act_complete.b',
      'ui.banter.act_complete.c',
      'ui.banter.act_complete.d',
      'ui.banter.act_complete.e',
      'ui.banter.act_complete.f',
      'ui.banter.act_complete.g',
    ],
    // 2026-04-29 — GameScene's `launchActIntermission` now tags the
    // request with `act_${actN}` so each gate's outro reads as the
    // specific gate just fallen, not the same two-liner each time.
    keysByTag: {
      act_1: [
        'ui.banter.act_complete.act_1.a',
        'ui.banter.act_complete.act_1.b',
        'ui.banter.act_complete.act_1.c',
        'ui.banter.act_complete.act_1.d',
      ],
      act_2: [
        'ui.banter.act_complete.act_2.a',
        'ui.banter.act_complete.act_2.b',
        'ui.banter.act_complete.act_2.c',
        'ui.banter.act_complete.act_2.d',
      ],
    },
  },
  {
    context: 'route_picked',
    tone: 'hearth',
    priority: 48,
    keys: [
      'ui.banter.route_picked.generic.a',
      'ui.banter.route_picked.generic.b',
    ],
    keysByTag: {
      up_the_brae: [
        'ui.banter.route_picked.up_the_brae.a',
        'ui.banter.route_picked.up_the_brae.b',
      ],
      round_the_loch: [
        'ui.banter.route_picked.round_the_loch.a',
        'ui.banter.route_picked.round_the_loch.b',
      ],
      through_the_kirkyard: [
        'ui.banter.route_picked.through_the_kirkyard.a',
        'ui.banter.route_picked.through_the_kirkyard.b',
      ],
      stand_yer_ground: [
        'ui.banter.route_picked.stand_yer_ground.a',
        'ui.banter.route_picked.stand_yer_ground.b',
      ],
      run_for_the_hills: [
        'ui.banter.route_picked.run_for_the_hills.a',
        'ui.banter.route_picked.run_for_the_hills.b',
      ],
      buckie_pitstop: [
        'ui.banter.route_picked.buckie_pitstop.a',
        'ui.banter.route_picked.buckie_pitstop.b',
      ],
    },
  },
  {
    // Cairn Stacking (DESIGN_IDEAS §1) — fires on stone collect (tag
    // `stack`) and on the third-stone boon (tag `boon`). Priority 32
    // beats moor_moment (31) for the rare same-tick collision; cairn
    // is rarer (3 fires/run) and collect is a player-action so the
    // tick-priority lift is justified. Hearth-pilgrim register —
    // ceremonial, no punch, the kind of small rite a Munro-walker
    // performs without a thought. Two leaves per tag = the no-repeat
    // ring still alternates within a single run.
    context: 'cairn_moment',
    tone: 'hearth',
    priority: 32,
    rare: true,
    keys: [
      'ui.banter.cairn_moment.generic.a',
      'ui.banter.cairn_moment.generic.b',
    ],
    keysByTag: {
      stack: [
        'ui.banter.cairn_moment.stack.a',
        'ui.banter.cairn_moment.stack.b',
        'ui.banter.cairn_moment.stack.c',
      ],
      boon: [
        'ui.banter.cairn_moment.boon.a',
        'ui.banter.cairn_moment.boon.b',
        'ui.banter.cairn_moment.boon.c',
      ],
      // First Cairn's Blessing ever (lifetime). Routed by the scheduler
      // when bumpCairnBlessing() returns 0. Pilgrim wonder beat — the
      // small rite paid out for the first time, not a familiar tariff.
      // Sister to clootie_wager.bound_first (v21) + beithir_sting.cured_*_first (v20).
      boon_first: [
        'ui.banter.cairn_moment.boon_first.a',
        'ui.banter.cairn_moment.boon_first.b',
        'ui.banter.cairn_moment.boon_first.c',
      ],
    },
  },
  {
    // Stance Toggle (DESIGN_IDEAS §1) — fires on Q-cycle, voiced as the
    // haggis announcing its own posture shift. Three sub-pool tags
    // mirror the cycle: loose / braced / reeling. Priority 26 sits
    // beneath Gran (28) and biome_change (30) so a stance shift on a
    // biome boundary or during a Gran beat doesn't talk over the more
    // load-bearing voice. Hearth tone — the haggis describing its own
    // stance to itself, not commentary on the world. Two leaves per
    // tag clears the no-repeat ring so back-to-back cycles alternate.
    context: 'stance_change',
    tone: 'hearth',
    priority: 26,
    keys: [
      'ui.banter.stance_change.generic.a',
      'ui.banter.stance_change.generic.b',
    ],
    keysByTag: {
      loose: [
        'ui.banter.stance_change.loose.a',
        'ui.banter.stance_change.loose.b',
      ],
      braced: [
        'ui.banter.stance_change.braced.a',
        'ui.banter.stance_change.braced.b',
      ],
      reeling: [
        'ui.banter.stance_change.reeling.a',
        'ui.banter.stance_change.reeling.b',
      ],
    },
  },
  {
    // Shinty Parry (DESIGN_IDEAS §1) — fires on consume edge (a
    // successful E-parry of an enemy projectile). Priority 27 — sits
    // *just* above stance_change (26) so a parry mid-stance-cycle
    // wins (the parry is the more meaningful event), but below Gran
    // (28) so an elder-voice beat is never overrun by a defensive
    // flick. Hearth tone — pleased, low-key. No sub-pool tags: a
    // parry is a single discrete win.
    context: 'shinty_parry',
    tone: 'hearth',
    priority: 27,
    keys: [
      'ui.banter.shinty_parry.a',
      'ui.banter.shinty_parry.b',
    ],
  },
  {
    // Clootie Rag Wager (DESIGN_IDEAS §1) — fires on commit edge (the
    // player walked into the trunk and paid the HP cost). Priority 33
    // sits *just above* cairn_moment (32): the cairn is a pilgrimage,
    // the clootie is a *trade*, and the trade reads as the heavier
    // moment (cost-bearing, irreversible). Still below the moor-event
    // band (35+) and Gran (28 — the elder voice belongs to Gran, not
    // the moor's lower folk-spirits). Hearth + grave register —
    // ceremonial gravity, the kind of small rite a Munro-walker pauses
    // to acknowledge with a head-bow. Single tag `bound` (commit edge)
    // for v1; an `offered` echo on tree-spawn could surface in v2 if
    // the announce toast feels too quiet.
    context: 'clootie_wager',
    tone: 'hearth',
    priority: 33,
    rare: true,
    keys: [
      'ui.banter.clootie_wager.generic.a',
      'ui.banter.clootie_wager.generic.b',
    ],
    keysByTag: {
      bound: [
        'ui.banter.clootie_wager.bound.a',
        'ui.banter.clootie_wager.bound.b',
        'ui.banter.clootie_wager.bound.c',
      ],
      // First wager ever (lifetime). Routed by clootieTree.commit when
      // bumpClootieWagerCommit() returns 0. Discovery beat — the haggis
      // is *learning* what the well asks, not paying a familiar tariff.
      // Sister to beithir_sting.cured_*_first (v20 precedent).
      bound_first: [
        'ui.banter.clootie_wager.bound_first.a',
        'ui.banter.clootie_wager.bound_first.b',
        'ui.banter.clootie_wager.bound_first.c',
      ],
    },
  },
  {
    // Cairn Walkover ("The Moor Remembers" feature). Fires when the player
    // steps over a Cairn of Echoes. Priority 34 sits just above clootie_wager
    // (33): the walkover is a *discovery* beat — the moor speaking back
    // through a player-placed stone — rather than a deliberate trade, so it
    // takes a half-rung of precedence in same-tick arbitration. Still well
    // below the moor-event band (35+) so environmental events continue to
    // dominate; Reliquary (45) and above remain unaffected. Five sub-pool
    // tags map to the narrative beats in the feature spec:
    //   past_self_first    — first cairn touched this run (fresh discovery)
    //   past_self          — subsequent cairn touches (familiar rite)
    //   grandfather_first  — first grandfather whisper ever heard (lifetime)
    //   grandfather_revealed — subsequent grandfather whispers
    //   grandfather_complete — fires once after the 25th grandfather leaf
    // Hearth tone throughout: the haggis is quiet, a little awed, never
    // boastful. The moor is doing the speaking — the haggis is only the ear.
    context: 'cailleach_gauntlet',
    tone: 'edge',
    priority: 95,
    rare: true,
    // Default `keys` are structural fallbacks — used only if a tag
    // isn't supplied (shouldn't happen in practice; the scheduler
    // always routes through a sub-pool). Two distinct leaves keep the
    // every-pool-≥-2-keys + globally-unique-keys fences honest.
    keys: [
      'ui.banter.cailleach_gauntlet.a',
      'ui.banter.cailleach_gauntlet.b',
    ],
    keysByTag: {
      armed: [
        'ui.banter.cailleach_gauntlet.armed.a',
        'ui.banter.cailleach_gauntlet.armed.b',
        'ui.banter.cailleach_gauntlet.armed.c',
        'ui.banter.cailleach_gauntlet.armed.d',
      ],
      candles_lit: [
        'ui.banter.cailleach_gauntlet.candles_lit.a',
        'ui.banter.cailleach_gauntlet.candles_lit.b',
        'ui.banter.cailleach_gauntlet.candles_lit.c',
        'ui.banter.cailleach_gauntlet.candles_lit.d',
      ],
      cailleach_spawned: [
        'ui.banter.cailleach_gauntlet.cailleach_spawned.a',
        'ui.banter.cailleach_gauntlet.cailleach_spawned.b',
        'ui.banter.cailleach_gauntlet.cailleach_spawned.c',
      ],
      cailleach_down: [
        'ui.banter.cailleach_gauntlet.cailleach_down.a',
        'ui.banter.cailleach_gauntlet.cailleach_down.b',
        'ui.banter.cailleach_gauntlet.cailleach_down.c',
        'ui.banter.cailleach_gauntlet.cailleach_down.d',
      ],
      cailleach_dominant: [
        'ui.banter.cailleach_gauntlet.cailleach_dominant.a',
        'ui.banter.cailleach_gauntlet.cailleach_dominant.b',
        'ui.banter.cailleach_gauntlet.cailleach_dominant.c',
      ],
    },
  },
  {
    context: 'cairn_walkover',
    tone: 'hearth',
    priority: 34,
    rare: true,
    // The default `keys` array doubles as the `past_self` fallback —
    // BanterSystem.pickKey routes an unknown tag through here, and the
    // GameScene wire passes tag `'past_self'` for subsequent walk-overs
    // (the sub-pool entry is therefore intentionally absent below so
    // it falls through to these defaults — avoids duplicating leaves
    // across `keys` and `keysByTag.past_self` per the pool-key-
    // uniqueness invariant in `BanterSystem.test.ts`).
    keys: [
      'ui.banter.cairn_walkover.past_self.a',
      'ui.banter.cairn_walkover.past_self.b',
    ],
    keysByTag: {
      past_self_first: [
        'ui.banter.cairn_walkover.past_self_first.a',
        'ui.banter.cairn_walkover.past_self_first.b',
      ],
      grandfather_first: [
        'ui.banter.cairn_walkover.grandfather_first.a',
        'ui.banter.cairn_walkover.grandfather_first.b',
      ],
      grandfather_revealed: [
        'ui.banter.cairn_walkover.grandfather_revealed.a',
        'ui.banter.cairn_walkover.grandfather_revealed.b',
      ],
      grandfather_complete: [
        'ui.banter.cairn_walkover.grandfather_complete.a',
        'ui.banter.cairn_walkover.grandfather_complete.b',
      ],
      // V2 — Cailleach Gauntlet state reactions.
      wreathed: [
        'ui.banter.cairn_walkover.wreathed.a',
        'ui.banter.cairn_walkover.wreathed.b',
      ],
      extinguished: [
        'ui.banter.cairn_walkover.extinguished.a',
        'ui.banter.cairn_walkover.extinguished.b',
      ],
    },
  },
  {
    // Lemmings Easter Egg (DESIGN_IDEAS §13). Fires on the parade-trigger
    // edge — the once-per-variant cliff-fall homage to DMA Design /
    // Dundee 1991. Priority 51 sits *above* reliquary (45) and
    // first_blood (50) because the moment is rarer (once-per-variant
    // lifetime vs once-per-run) and the player has earned it by
    // staying still 90 s — but well below curse_start (59),
    // death_reflection (75), boss_warn (100) so any gameplay-critical
    // event still wins same-tick. Hearth tone — the toast follows a
    // loud OH NO! SFX, the line is the *quiet* echo ("the wee green-
    // haired ones — they've passed"), not a fanfare. Two leaves on
    // the no-repeat ring give variety across variants for players
    // who unlock the parade more than once.
    context: 'lemmings_remember',
    tone: 'hearth',
    priority: 51,
    rare: true,
    keys: [
      'ui.banter.lemmings_remember.a',
      'ui.banter.lemmings_remember.b',
    ],
  },
  {
    // Wild Living World Phase 2 — Selkie form-shifted commentary.
    // Priority 24 sits just below haggis_ambient (25) so passive
    // inner-monologue still wins same-tick arbitration on long quiet
    // stretches, while form-shifts (a rare, deliberate input) speak
    // through the no-repeat ring at their own cadence. Spec §2 placed
    // this at 27 but `shinty_parry` already lives at 27 — uniqueness
    // is the binding invariant (B1 arbitration), so this slot drifted
    // down to the next clean integer. Sub-pool tags split commentary
    // by direction-of-shift: `seal` (entering) and `haggis`
    // (returning). The fallback `keys` carries direction-agnostic
    // lines so a future request site that doesn't pass a tag still
    // resolves a line.
    context: 'form_shifted',
    tone: 'hearth',
    priority: 24,
    keys: [
      'ui.banter.form_shifted.a',
      'ui.banter.form_shifted.b',
    ],
    keysByTag: {
      seal: [
        'ui.banter.form_shifted.seal.a',
        'ui.banter.form_shifted.seal.b',
        'ui.banter.form_shifted.seal.c',
        'ui.banter.form_shifted.seal.d',
      ],
      haggis: [
        'ui.banter.form_shifted.haggis.a',
        'ui.banter.form_shifted.haggis.b',
        'ui.banter.form_shifted.haggis.c',
        'ui.banter.form_shifted.haggis.d',
      ],
    },
  },
  {
    // B1 Phase 2 — Gran's commentary. Hearth, elder warmth *about* the run.
    // Priority 28 sits between idle (10) and biome_change (30) so scenic
    // biome shifts still win same-tick arbitration; Gran fires at run
    // boundaries and moor moments where that rarely clashes. Spec §2
    // proposed 30 but it collided with biome_change — resolved here.
    context: 'gran_commentary',
    tone: 'hearth',
    priority: 28,
    keys: [
      'ui.banter.gran_commentary.a',
      'ui.banter.gran_commentary.b',
      'ui.banter.gran_commentary.c',
      'ui.banter.gran_commentary.d',
      'ui.banter.gran_commentary.e',
      'ui.banter.gran_commentary.f',
      'ui.banter.gran_commentary.g',
      'ui.banter.gran_commentary.h',
      'ui.banter.gran_commentary.i',
      'ui.banter.gran_commentary.j',
      'ui.banter.gran_commentary.k',
      'ui.banter.gran_commentary.l',
    ],
    keysByTag: {
      run_start: [
        'ui.banter.gran_commentary.run_start.a',
        'ui.banter.gran_commentary.run_start.b',
        'ui.banter.gran_commentary.run_start.c',
        'ui.banter.gran_commentary.run_start.d',
        'ui.banter.gran_commentary.run_start.e',
        'ui.banter.gran_commentary.run_start.f',
        'ui.banter.gran_commentary.run_start.g',
        'ui.banter.gran_commentary.run_start.h',
      ],
      run_end_victory: [
        'ui.banter.gran_commentary.run_end_victory.a',
        'ui.banter.gran_commentary.run_end_victory.b',
        'ui.banter.gran_commentary.run_end_victory.c',
        'ui.banter.gran_commentary.run_end_victory.d',
        'ui.banter.gran_commentary.run_end_victory.e',
        'ui.banter.gran_commentary.run_end_victory.f',
      ],
      run_end_defeat: [
        'ui.banter.gran_commentary.run_end_defeat.a',
        'ui.banter.gran_commentary.run_end_defeat.b',
        'ui.banter.gran_commentary.run_end_defeat.c',
        'ui.banter.gran_commentary.run_end_defeat.d',
        'ui.banter.gran_commentary.run_end_defeat.e',
        'ui.banter.gran_commentary.run_end_defeat.f',
      ],
      moor_moment: [
        'ui.banter.gran_commentary.moor_moment.a',
        'ui.banter.gran_commentary.moor_moment.b',
        'ui.banter.gran_commentary.moor_moment.c',
        'ui.banter.gran_commentary.moor_moment.d',
        'ui.banter.gran_commentary.moor_moment.e',
        'ui.banter.gran_commentary.moor_moment.f',
      ],
      seasonal_event: [
        'ui.banter.gran_commentary.seasonal_event.a',
        'ui.banter.gran_commentary.seasonal_event.b',
        'ui.banter.gran_commentary.seasonal_event.c',
        'ui.banter.gran_commentary.seasonal_event.d',
        'ui.banter.gran_commentary.seasonal_event.e',
        'ui.banter.gran_commentary.seasonal_event.f',
      ],
      // B1 Phase 4 expansion — H1 Croft hub touchpoints. Wired to
      // CroftScene at first arrival, mantel glance, drove-route
      // returns, and morning-visit reset (per BANTER_GAPS §Phase 4).
      croft_arrival: [
        'ui.banter.gran_commentary.croft_arrival.a',
        'ui.banter.gran_commentary.croft_arrival.b',
        'ui.banter.gran_commentary.croft_arrival.c',
        'ui.banter.gran_commentary.croft_arrival.d',
        'ui.banter.gran_commentary.croft_arrival.e',
        'ui.banter.gran_commentary.croft_arrival.f',
        'ui.banter.gran_commentary.croft_arrival.g',
        'ui.banter.gran_commentary.croft_arrival.h',
      ],
      morning_hub: [
        'ui.banter.gran_commentary.morning_hub.a',
        'ui.banter.gran_commentary.morning_hub.b',
        'ui.banter.gran_commentary.morning_hub.c',
        'ui.banter.gran_commentary.morning_hub.d',
        'ui.banter.gran_commentary.morning_hub.e',
        'ui.banter.gran_commentary.morning_hub.f',
        'ui.banter.gran_commentary.morning_hub.g',
        'ui.banter.gran_commentary.morning_hub.h',
      ],
      drove_return: [
        'ui.banter.gran_commentary.drove_return.a',
        'ui.banter.gran_commentary.drove_return.b',
        'ui.banter.gran_commentary.drove_return.c',
        'ui.banter.gran_commentary.drove_return.d',
        'ui.banter.gran_commentary.drove_return.e',
        'ui.banter.gran_commentary.drove_return.f',
        'ui.banter.gran_commentary.drove_return.g',
        'ui.banter.gran_commentary.drove_return.h',
      ],
      mantel_glance: [
        'ui.banter.gran_commentary.mantel_glance.a',
        'ui.banter.gran_commentary.mantel_glance.b',
        'ui.banter.gran_commentary.mantel_glance.c',
        'ui.banter.gran_commentary.mantel_glance.d',
        'ui.banter.gran_commentary.mantel_glance.e',
        'ui.banter.gran_commentary.mantel_glance.f',
        'ui.banter.gran_commentary.mantel_glance.g',
        'ui.banter.gran_commentary.mantel_glance.h',
      ],
    },
  },
  {
    // B1 Phase 2 Task 12 — Death-screen reflection.
    //
    // Fires from `RunLifecycle.handleDeath` with `tag = DeathCauseTag`
    // (see `src/core/deathCauseClassifier.ts`). Priority 75 sits between
    // boss_down (70) and low_hp (80) so it wins over gran_commentary (28)
    // same-tick arbitration — death_reflection is richer (cause-aware,
    // 30 lines) and replaces the gran run_end_defeat trigger per B1
    // Phase 2 plan. The `run_end_defeat` sub-pool under gran_commentary
    // stays authored for future wiring (post-bell death, future
    // post-mortem pane, etc).
    //
    // Voice register: Hearth, warmly-framed.
    // Never shaming. Each cause-tag line gently names what happened and
    // (where natural) offers a soft takeaway without duplicating the
    // game-over screen's `formatDeathInsightLine` tip.
    context: 'death_reflection',
    tone: 'hearth',
    priority: 75,
    keys: [
      'ui.banter.death_reflection.a',
      'ui.banter.death_reflection.b',
      'ui.banter.death_reflection.c',
      'ui.banter.death_reflection.d',
      'ui.banter.death_reflection.e',
      'ui.banter.death_reflection.f',
      'ui.banter.death_reflection.g',
      'ui.banter.death_reflection.h',
      'ui.banter.death_reflection.i',
      'ui.banter.death_reflection.j',
      'ui.banter.death_reflection.k',
    ],
    // B1 Phase 4 expansion — each tag grew from 3 → 6 leaves so the
    // no-repeat ring buffer (size 8) has room across consecutive
    // same-cause deaths in playtests.
    keysByTag: {
      hazard: [
        'ui.banter.death_reflection.hazard.a',
        'ui.banter.death_reflection.hazard.b',
        'ui.banter.death_reflection.hazard.c',
        'ui.banter.death_reflection.hazard.d',
        'ui.banter.death_reflection.hazard.e',
        'ui.banter.death_reflection.hazard.f',
      ],
      boss_crushed: [
        'ui.banter.death_reflection.boss_crushed.a',
        'ui.banter.death_reflection.boss_crushed.b',
        'ui.banter.death_reflection.boss_crushed.c',
        'ui.banter.death_reflection.boss_crushed.d',
        'ui.banter.death_reflection.boss_crushed.e',
        'ui.banter.death_reflection.boss_crushed.f',
      ],
      elite_kill: [
        'ui.banter.death_reflection.elite_kill.a',
        'ui.banter.death_reflection.elite_kill.b',
        'ui.banter.death_reflection.elite_kill.c',
        'ui.banter.death_reflection.elite_kill.d',
        'ui.banter.death_reflection.elite_kill.e',
        'ui.banter.death_reflection.elite_kill.f',
      ],
      one_shot: [
        'ui.banter.death_reflection.one_shot.a',
        'ui.banter.death_reflection.one_shot.b',
        'ui.banter.death_reflection.one_shot.c',
        'ui.banter.death_reflection.one_shot.d',
        'ui.banter.death_reflection.one_shot.e',
        'ui.banter.death_reflection.one_shot.f',
      ],
      same_killer: [
        'ui.banter.death_reflection.same_killer.a',
        'ui.banter.death_reflection.same_killer.b',
        'ui.banter.death_reflection.same_killer.c',
        'ui.banter.death_reflection.same_killer.d',
        'ui.banter.death_reflection.same_killer.e',
        'ui.banter.death_reflection.same_killer.f',
      ],
      swarmed: [
        'ui.banter.death_reflection.swarmed.a',
        'ui.banter.death_reflection.swarmed.b',
        'ui.banter.death_reflection.swarmed.c',
        'ui.banter.death_reflection.swarmed.d',
        'ui.banter.death_reflection.swarmed.e',
        'ui.banter.death_reflection.swarmed.f',
      ],
      low_hp_neglect: [
        'ui.banter.death_reflection.low_hp_neglect.a',
        'ui.banter.death_reflection.low_hp_neglect.b',
        'ui.banter.death_reflection.low_hp_neglect.c',
        'ui.banter.death_reflection.low_hp_neglect.d',
        'ui.banter.death_reflection.low_hp_neglect.e',
        'ui.banter.death_reflection.low_hp_neglect.f',
      ],
      unlucky: [
        'ui.banter.death_reflection.unlucky.a',
        'ui.banter.death_reflection.unlucky.b',
        'ui.banter.death_reflection.unlucky.c',
        'ui.banter.death_reflection.unlucky.d',
        'ui.banter.death_reflection.unlucky.e',
        'ui.banter.death_reflection.unlucky.f',
      ],
    },
  },
  {
    // B1 Phase 2 Task 10 — Haggis inner monologue.
    //
    // Fires from `GameTickers.tickBanter` on a 45s ±15s wall-clock
    // interval, gated by HP > 75% AND no enemy within 200px for 10s
    // continuous (quiet-moor-stretch only). Priority 25 sits between
    // biome_change (30) and the 28 gran slot but beats idle (10) so
    // mid-lull monologue surfaces over the catch-all idle chatter.
    //
    // Voice register: Hearth, wee-beastie simple — peaceful sensory
    // notes, food daydreams, small philosophy. Short lines, child-like
    // but never infantile. Generic pool only (no variant sub-pools in
    // this slice; could extend per-variant in a later pass).
    context: 'haggis_ambient',
    tone: 'hearth',
    priority: 25,
    keys: [
      'ui.banter.haggis_ambient.a', 'ui.banter.haggis_ambient.b',
      'ui.banter.haggis_ambient.c', 'ui.banter.haggis_ambient.d',
      'ui.banter.haggis_ambient.e', 'ui.banter.haggis_ambient.f',
      'ui.banter.haggis_ambient.g', 'ui.banter.haggis_ambient.h',
      'ui.banter.haggis_ambient.i', 'ui.banter.haggis_ambient.j',
      'ui.banter.haggis_ambient.k', 'ui.banter.haggis_ambient.l',
      'ui.banter.haggis_ambient.m', 'ui.banter.haggis_ambient.n',
      'ui.banter.haggis_ambient.o', 'ui.banter.haggis_ambient.p',
      'ui.banter.haggis_ambient.q', 'ui.banter.haggis_ambient.r',
      'ui.banter.haggis_ambient.s', 'ui.banter.haggis_ambient.t',
      'ui.banter.haggis_ambient.u', 'ui.banter.haggis_ambient.v',
      'ui.banter.haggis_ambient.w', 'ui.banter.haggis_ambient.x',
      'ui.banter.haggis_ambient.y', 'ui.banter.haggis_ambient.z',
      'ui.banter.haggis_ambient.aa', 'ui.banter.haggis_ambient.ab',
      'ui.banter.haggis_ambient.ac', 'ui.banter.haggis_ambient.ad',
      'ui.banter.haggis_ambient.ae', 'ui.banter.haggis_ambient.af',
      'ui.banter.haggis_ambient.ag', 'ui.banter.haggis_ambient.ah',
      'ui.banter.haggis_ambient.ai', 'ui.banter.haggis_ambient.aj',
      'ui.banter.haggis_ambient.ak', 'ui.banter.haggis_ambient.al',
      'ui.banter.haggis_ambient.am', 'ui.banter.haggis_ambient.an',
      'ui.banter.haggis_ambient.ao', 'ui.banter.haggis_ambient.ap',
      'ui.banter.haggis_ambient.aq', 'ui.banter.haggis_ambient.ar',
      'ui.banter.haggis_ambient.as', 'ui.banter.haggis_ambient.at',
      'ui.banter.haggis_ambient.au', 'ui.banter.haggis_ambient.av',
      'ui.banter.haggis_ambient.aw', 'ui.banter.haggis_ambient.ax',
      // Wild-haggis-myth contraband tribute (8 leaves). See i18n.ts notes
      // on the FDA sheep-lung ban — the haggis is literally illegal in
      // the US, so the wee monologue gets to be smug about it.
      'ui.banter.haggis_ambient.ay', 'ui.banter.haggis_ambient.az',
      'ui.banter.haggis_ambient.ba', 'ui.banter.haggis_ambient.bb',
      'ui.banter.haggis_ambient.bc', 'ui.banter.haggis_ambient.bd',
      'ui.banter.haggis_ambient.be', 'ui.banter.haggis_ambient.bf',
    ],
  },
  {
    // B1 Phase 4 Task 22 — Burns citations. Every line is a verified
    // quotation from Robert Burns (1759-1796), referenced against the
    // Kinsley 1968 critical edition. Public domain; no attribution
    // in-line (the voice itself carries the period cadence).
    //
    // Priority 43 — spec §2 called 45, which was already reliquary_pick's
    // live slot; resolved just below reliquary so a tangible curio
    // pickup keeps its tick and Burns pours through at the slightly
    // quieter moments. Still beats enemy_ambient (41) / kill_streak
    // (40) / moor_moment (31) same-tick.
    //
    // Trigger wiring lives at each call site — eight of nine sub-pools
    // are now wired (2026-05-09). Original Phase 5 deferral removed.
    //
    // Tag register per spec §3: context-justified, never random. Tags
    // map to the trigger surface each sub-pool is authored against:
    //   haggis_moment   → ✅ runeSystemController.ts (rune-pulse burst)
    //   mouse_moment    → ✅ EnemyKillHandler.handle (sheep / midge kill)
    //   loch_moment     → ✅ MoorMomentScheduler (loch biome)
    //   highland_moment → ✅ MoorMomentScheduler (heather / pine biome)
    //   victory_open    → ✅ SpawnSystem.spawnBoss (taxman warn + 9 s)
    //   defeat_lament   → ✅ RunLifecycle.handlePlayerDeath via forcePoolLine
    //                       (+600 ms past death_reflection toast; the
    //                       arbitration-bypass primitive that closed the
    //                       address coda also closes this. Two couplets
    //                       alternated by the no-repeat ring — "Ae fond
    //                       kiss"; "wan moon setting").
    //   charge          → ✅ Player.tickDriftMastery (burst consume edge)
    //   nae_haste       → ✅ GameScene curse_start delayed echo (+9 s)
    //   lineage_moment  → ✅ moorMoments.ts (ancestral echo / variant unlock)
    //
    // Address coda: the run-long Address-to-a-Haggis thread (haggis_moment
    // a–h, fired through rune-pulse triggers across the run) closes on
    // the opener at victory ceremony in `RunLifecycle.handleVictory` —
    // "Fair fa' your honest, sonsie face..." spoken as the haggis takes
    // the chieftain's seat. Wires through `BanterSystem.forceLine` so it
    // bypasses cooldown after the gran_commentary line just spoke.
    // No new sub-pool: the coda is the existing `haggis_moment.a` line.
    context: 'burns_citation',
    tone: 'hearth',
    priority: 43,
    rare: true,
    keys: [
      'ui.banter.burns_citation.a',
      'ui.banter.burns_citation.b',
    ],
    keysByTag: {
      haggis_moment: [
        // Eight Habbie-stanza couplets from "Address to a Haggis" (1786).
        // Cycles through the whole anthem across a Burns Night run via
        // the round-robin no-repeat ring.
        'ui.banter.burns_citation.haggis_moment.a',
        'ui.banter.burns_citation.haggis_moment.b',
        'ui.banter.burns_citation.haggis_moment.c',
        'ui.banter.burns_citation.haggis_moment.d',
        'ui.banter.burns_citation.haggis_moment.e',
        'ui.banter.burns_citation.haggis_moment.f',
        'ui.banter.burns_citation.haggis_moment.g',
        'ui.banter.burns_citation.haggis_moment.h',
      ],
      mouse_moment: [
        'ui.banter.burns_citation.mouse_moment.a',
        'ui.banter.burns_citation.mouse_moment.b',
      ],
      loch_moment: [
        'ui.banter.burns_citation.loch_moment.a',
        'ui.banter.burns_citation.loch_moment.b',
      ],
      highland_moment: [
        'ui.banter.burns_citation.highland_moment.a',
        'ui.banter.burns_citation.highland_moment.b',
      ],
      victory_open: [
        'ui.banter.burns_citation.victory_open.a',
        'ui.banter.burns_citation.victory_open.b',
      ],
      defeat_lament: [
        'ui.banter.burns_citation.defeat_lament.a',
        'ui.banter.burns_citation.defeat_lament.b',
      ],
      charge: [
        'ui.banter.burns_citation.charge.a',
        'ui.banter.burns_citation.charge.b',
      ],
      nae_haste: [
        'ui.banter.burns_citation.nae_haste.a',
        'ui.banter.burns_citation.nae_haste.b',
      ],
      lineage_moment: [
        'ui.banter.burns_citation.lineage_moment.a',
        'ui.banter.burns_citation.lineage_moment.b',
      ],
    },
  },
  {
    // B1 Phase 3 Task 18 — reserved first-time lines. Priority 110 beats
    // every other pool (boss_warn at 100 included) so these fire on the
    // exact tick the milestone happens. Once fired, `SaveData.firstTime
    // EventsFired` marks the event and the tag never replays across
    // saves — that's why the pool rides at the top of the ladder.
    //
    // Authored events (15 milestones × 2 lines each = 30 EN + 30 SCS):
    //   Boss first-kills:     gordon / tour_bus / the_laird /
    //                         hunter_general / taxman
    //   Evolution first-pick: thistle_shot / bagpipe_blast / caber_toss /
    //                         scotch_mist / haggis_hurler / nessie_tentacle /
    //                         claymore / bagpipes
    //   Meta milestones:      combo_100 (first 100-hit streak) /
    //                         ironmoor_first_victory
    //
    // Wiring lives with each call site (deferred per plan Task 6 — hook
    // lands alongside content). Boss-kill hook will live in
    // `EnemyKillHandler.handleBossKill`, evolution hook in
    // `LevelUpFlow.applyEvolution`, combo_100 in whatever records combos
    // top-out, and ironmoor_first_victory in the victory path.
    //
    // Every tagged sub-pool ships with 2+ lines so the no-repeat ring
    // buffer won't starve it if (hypothetically) the save-flag guard
    // ever fails to persist. Generic pool is an untagged fallback for
    // unknown events — should never be reached in practice once wiring
    // is complete, but stays for defensive behaviour.
    context: 'first_time',
    tone: 'hearth',
    priority: 110,
    rare: true,
    keys: [
      'ui.banter.first_time.a',
      'ui.banter.first_time.b',
    ],
    keysByTag: {
      boss_gordon_kill: [
        'ui.banter.first_time.boss_gordon_kill.a',
        'ui.banter.first_time.boss_gordon_kill.b',
      ],
      // each_uisge first-kill (2026-04-29) — closes the previously-missing
      // sub-pool gap so the Fey water-horse boss gets its own first-time
      // line instead of falling back to the generic milestone.
      boss_each_uisge_kill: [
        'ui.banter.first_time.boss_each_uisge_kill.a',
        'ui.banter.first_time.boss_each_uisge_kill.b',
      ],
      boss_tour_bus_kill: [
        'ui.banter.first_time.boss_tour_bus_kill.a',
        'ui.banter.first_time.boss_tour_bus_kill.b',
      ],
      // nicnevin first-kill — Fey-Grave register; matches the spec's
      // post-kill pool tone (queen fell, court silenced).
      boss_nicnevin_kill: [
        'ui.banter.first_time.boss_nicnevin_kill.a',
        'ui.banter.first_time.boss_nicnevin_kill.b',
      ],
      boss_the_laird_kill: [
        'ui.banter.first_time.boss_the_laird_kill.a',
        'ui.banter.first_time.boss_the_laird_kill.b',
      ],
      // Nuckelavee first-kill — Grave register; the most feared creature
      // in the northern isles, just driven back to the sea. Mark the
      // weight of it without making light of the encounter.
      boss_nuckelavee_kill: [
        'ui.banter.first_time.boss_nuckelavee_kill.a',
        'ui.banter.first_time.boss_nuckelavee_kill.b',
      ],
      boss_hunter_general_kill: [
        'ui.banter.first_time.boss_hunter_general_kill.a',
        'ui.banter.first_time.boss_hunter_general_kill.b',
      ],
      // Earl Beardie first-kill — Edge-Grave register. The Devil's card
      // game was supposed to be unwinnable; mark the first upset.
      boss_earl_beardie_kill: [
        'ui.banter.first_time.boss_earl_beardie_kill.a',
        'ui.banter.first_time.boss_earl_beardie_kill.b',
      ],
      boss_black_douglas_kill: [
        'ui.banter.first_time.boss_black_douglas_kill.a',
        'ui.banter.first_time.boss_black_douglas_kill.b',
      ],
      boss_taxman_kill: [
        'ui.banter.first_time.boss_taxman_kill.a',
        'ui.banter.first_time.boss_taxman_kill.b',
      ],
      evo_thistle_shot: [
        'ui.banter.first_time.evo_thistle_shot.a',
        'ui.banter.first_time.evo_thistle_shot.b',
      ],
      evo_bagpipe_blast: [
        'ui.banter.first_time.evo_bagpipe_blast.a',
        'ui.banter.first_time.evo_bagpipe_blast.b',
      ],
      evo_caber_toss: [
        'ui.banter.first_time.evo_caber_toss.a',
        'ui.banter.first_time.evo_caber_toss.b',
      ],
      evo_scotch_mist: [
        'ui.banter.first_time.evo_scotch_mist.a',
        'ui.banter.first_time.evo_scotch_mist.b',
      ],
      evo_haggis_hurler: [
        'ui.banter.first_time.evo_haggis_hurler.a',
        'ui.banter.first_time.evo_haggis_hurler.b',
      ],
      evo_nessie_tentacle: [
        'ui.banter.first_time.evo_nessie_tentacle.a',
        'ui.banter.first_time.evo_nessie_tentacle.b',
      ],
      evo_claymore: [
        'ui.banter.first_time.evo_claymore.a',
        'ui.banter.first_time.evo_claymore.b',
      ],
      // No evo_bagpipes pool — bagpipes has no evolution per
      // EVOLUTION_RECIPES. T212 audit cleanup.
      combo_100: [
        'ui.banter.first_time.combo_100.a',
        'ui.banter.first_time.combo_100.b',
      ],
      ironmoor_first_victory: [
        'ui.banter.first_time.ironmoor_first_victory.a',
        'ui.banter.first_time.ironmoor_first_victory.b',
      ],
      // R1 M4 T26 — first Relic pickup this account. Gran voice,
      // Hearth register; fires once via `bumpFirstTimeEvent('relic_first_pickup')`.
      relic_first_pickup: [
        'ui.banter.first_time.relic_first_pickup.a',
        'ui.banter.first_time.relic_first_pickup.b',
      ],
      // U1 Task 18 — first Rune pickup this account. Gran voice,
      // Hearth register with a touch of Fey-wonder (cairn-age mystery).
      // Fires once via `bumpFirstTimeEvent('rune_first_pickup')`.
      rune_first_pickup: [
        'ui.banter.first_time.rune_first_pickup.a',
        'ui.banter.first_time.rune_first_pickup.b',
      ],
      // ── B1 Phase 4 expansion — variant unlock first-time banter
      //    (12 non-classic variants). Fires once per unlock-event via
      //    `bumpFirstTimeEvent('variant_${key}_unlocked')` on the
      //    eventual MetaProgression.unlockVariant call surface.
      //    Voice tilts variant-specific per Voice Card §Variant-scoped.
      variant_moor_runner_unlocked: [
        'ui.banter.first_time.variant_moor_runner_unlocked.a',
        'ui.banter.first_time.variant_moor_runner_unlocked.b',
      ],
      variant_iron_belly_unlocked: [
        'ui.banter.first_time.variant_iron_belly_unlocked.a',
        'ui.banter.first_time.variant_iron_belly_unlocked.b',
      ],
      variant_glen_forager_unlocked: [
        'ui.banter.first_time.variant_glen_forager_unlocked.a',
        'ui.banter.first_time.variant_glen_forager_unlocked.b',
      ],
      variant_surefoot_unlocked: [
        'ui.banter.first_time.variant_surefoot_unlocked.a',
        'ui.banter.first_time.variant_surefoot_unlocked.b',
      ],
      variant_pipe_breath_unlocked: [
        'ui.banter.first_time.variant_pipe_breath_unlocked.a',
        'ui.banter.first_time.variant_pipe_breath_unlocked.b',
      ],
      variant_wee_ghostie_unlocked: [
        'ui.banter.first_time.variant_wee_ghostie_unlocked.a',
        'ui.banter.first_time.variant_wee_ghostie_unlocked.b',
      ],
      variant_laird_unlocked: [
        'ui.banter.first_time.variant_laird_unlocked.a',
        'ui.banter.first_time.variant_laird_unlocked.b',
      ],
      variant_glaswegian_unlocked: [
        'ui.banter.first_time.variant_glaswegian_unlocked.a',
        'ui.banter.first_time.variant_glaswegian_unlocked.b',
      ],
      variant_anticlockwise_unlocked: [
        'ui.banter.first_time.variant_anticlockwise_unlocked.a',
        'ui.banter.first_time.variant_anticlockwise_unlocked.b',
      ],
      variant_cailleach_unlocked: [
        'ui.banter.first_time.variant_cailleach_unlocked.a',
        'ui.banter.first_time.variant_cailleach_unlocked.b',
      ],
      variant_doric_quinie_unlocked: [
        'ui.banter.first_time.variant_doric_quinie_unlocked.a',
        'ui.banter.first_time.variant_doric_quinie_unlocked.b',
      ],
      variant_peerie_shetlander_unlocked: [
        'ui.banter.first_time.variant_peerie_shetlander_unlocked.a',
        'ui.banter.first_time.variant_peerie_shetlander_unlocked.b',
      ],
      variant_burns_wee_beastie_unlocked: [
        'ui.banter.first_time.variant_burns_wee_beastie_unlocked.a',
        'ui.banter.first_time.variant_burns_wee_beastie_unlocked.b',
      ],
      // Witch's Hare — Isobel Gowdie 1662 confession. Cursed-victories:5
      // gate. Filed alongside the V2 cohort even though the variant
      // shipped 2026-04-28 (post-V2) — the banter pool was missed in
      // that ship and gets its couplet here as part of the first-time
      // wire-up.
      variant_witch_hare_unlocked: [
        'ui.banter.first_time.variant_witch_hare_unlocked.a',
        'ui.banter.first_time.variant_witch_hare_unlocked.b',
      ],
      variant_morningside_unlocked: [
        'ui.banter.first_time.variant_morningside_unlocked.a',
        'ui.banter.first_time.variant_morningside_unlocked.b',
      ],
      // ── Post-morningside batch — variants shipped after the V2 cohort. ──
      variant_selkie_unlocked: [
        'ui.banter.first_time.variant_selkie_unlocked.a',
        'ui.banter.first_time.variant_selkie_unlocked.b',
      ],
      variant_drouthy_unlocked: [
        'ui.banter.first_time.variant_drouthy_unlocked.a',
        'ui.banter.first_time.variant_drouthy_unlocked.b',
      ],
      variant_pibroch_unlocked: [
        'ui.banter.first_time.variant_pibroch_unlocked.a',
        'ui.banter.first_time.variant_pibroch_unlocked.b',
      ],
      variant_orcadian_unlocked: [
        'ui.banter.first_time.variant_orcadian_unlocked.a',
        'ui.banter.first_time.variant_orcadian_unlocked.b',
      ],
      variant_hebridean_unlocked: [
        'ui.banter.first_time.variant_hebridean_unlocked.a',
        'ui.banter.first_time.variant_hebridean_unlocked.b',
      ],
      variant_iron_brew_unlocked: [
        'ui.banter.first_time.variant_iron_brew_unlocked.a',
        'ui.banter.first_time.variant_iron_brew_unlocked.b',
      ],
      variant_grans_best_unlocked: [
        'ui.banter.first_time.variant_grans_best_unlocked.a',
        'ui.banter.first_time.variant_grans_best_unlocked.b',
      ],
      variant_the_pict_unlocked: [
        'ui.banter.first_time.variant_the_pict_unlocked.a',
        'ui.banter.first_time.variant_the_pict_unlocked.b',
      ],
      variant_jacobite_unlocked: [
        'ui.banter.first_time.variant_jacobite_unlocked.a',
        'ui.banter.first_time.variant_jacobite_unlocked.b',
      ],
      variant_tam_o_shanter_unlocked: [
        'ui.banter.first_time.variant_tam_o_shanter_unlocked.a',
        'ui.banter.first_time.variant_tam_o_shanter_unlocked.b',
      ],
      variant_engineer_unlocked: [
        'ui.banter.first_time.variant_engineer_unlocked.a',
        'ui.banter.first_time.variant_engineer_unlocked.b',
      ],
      variant_tufted_unlocked: [
        'ui.banter.first_time.variant_tufted_unlocked.a',
        'ui.banter.first_time.variant_tufted_unlocked.b',
      ],
      // ── B1 Phase 4 expansion — first-pick of each W2 route. Fires
      //    once per route via
      //    `bumpFirstTimeEvent('route_${routeKey}_first')` on the
      //    ActIntermissionScene resolve callback.
      route_up_the_brae_first: [
        'ui.banter.first_time.route_up_the_brae_first.a',
        'ui.banter.first_time.route_up_the_brae_first.b',
      ],
      route_round_the_loch_first: [
        'ui.banter.first_time.route_round_the_loch_first.a',
        'ui.banter.first_time.route_round_the_loch_first.b',
      ],
      route_through_the_kirkyard_first: [
        'ui.banter.first_time.route_through_the_kirkyard_first.a',
        'ui.banter.first_time.route_through_the_kirkyard_first.b',
      ],
      route_stand_yer_ground_first: [
        'ui.banter.first_time.route_stand_yer_ground_first.a',
        'ui.banter.first_time.route_stand_yer_ground_first.b',
      ],
      route_run_for_the_hills_first: [
        'ui.banter.first_time.route_run_for_the_hills_first.a',
        'ui.banter.first_time.route_run_for_the_hills_first.b',
      ],
      route_buckie_pitstop_first: [
        'ui.banter.first_time.route_buckie_pitstop_first.a',
        'ui.banter.first_time.route_buckie_pitstop_first.b',
      ],
      // ── B1 Phase 4 expansion — first daily-challenge clear. Fires
      //    once via `bumpFirstTimeEvent('daily_first_clear')` on the
      //    daily victory path in RunLifecycle.handleVictory.
      daily_first_clear: [
        'ui.banter.first_time.daily_first_clear.a',
        'ui.banter.first_time.daily_first_clear.b',
      ],
    },
  },
  {
    // B1 Phase 3 Task 17 — enemy flavour. Fires on first-encounter of an
    // enemy key (tracked in `SaveData.seenEnemies`) and on a rare 1/20
    // respawn roll thereafter. Priority 40 sits above moor_moment (31) so
    // a new foe's reveal out-talks scenic chatter, but below boss_down
    // (70) / boss_warn (100) so boss moments own their tick cleanly.
    //
    // Wiring: SpawnSystem calls `resolveEnemyAmbientTrigger` (pure) and
    // routes the decision through `scene.requestBanter('enemy_ambient',
    // enemyKey)`. BanterSystem's no-repeat window + per-context cooldown
    // prevent the line from firing twice for the same enemy in the same
    // burst. `keysByTag` gets populated family-by-family across the
    // remaining Task 17 commits; generic pool is the untagged fallback.
    //
    // Priority 41 — spec §2 called 40 but that's the live `kill_streak`
    // slot; same resolution pattern as `gran_commentary` (28 ≠ spec 30).
    // 41 sits just above kill_streak so a first-encounter reveal wins
    // a same-tick arbitration against a streak line, and below
    // reliquary_pick (45) so curio claims keep their moment.
    context: 'enemy_ambient',
    tone: 'hearth',
    priority: 41,
    keys: [
      'ui.banter.enemy_ambient.a',
      'ui.banter.enemy_ambient.b',
      'ui.banter.enemy_ambient.c',
    ],
    keysByTag: {
      // ── Cryptids family (Task 17). Uncanny-warm moor voice naming the
      //    wildwood half-legend: barghest (Yorkshire/Scots black-dog
      //    omen), kelpie foal (water-horse lure), blue man of the Minch
      //    (riddle-speaking sea spirit). Tone: curious, wary, not
      //    terrified — the moor's seen stranger.
      barghest: [
        'ui.banter.enemy_ambient.barghest.a',
        'ui.banter.enemy_ambient.barghest.b',
        'ui.banter.enemy_ambient.barghest.c',
      ],
      // Cu Sith — Highland fairy hound, sister-companion family to
      // barghest in the Cryptids cluster. Tone: warm-wary, "listen
      // for the bays" — the three-hool warning is the fiction's
      // identifying feature. Refs SCOTTISH_RESEARCH §1.2.
      cu_sith: [
        'ui.banter.enemy_ambient.cu_sith.a',
        'ui.banter.enemy_ambient.cu_sith.b',
        'ui.banter.enemy_ambient.cu_sith.c',
      ],
      kelpie_foal: [
        'ui.banter.enemy_ambient.kelpie_foal.a',
        'ui.banter.enemy_ambient.kelpie_foal.b',
        'ui.banter.enemy_ambient.kelpie_foal.c',
      ],
      blue_man_of_minch: [
        'ui.banter.enemy_ambient.blue_man_of_minch.a',
        'ui.banter.enemy_ambient.blue_man_of_minch.b',
        'ui.banter.enemy_ambient.blue_man_of_minch.c',
      ],
      // ── Faerie Courts family (Task 17). Fae warm-tricksy — respect the
      //    manners, never strike a bargain. Redcap is the thug of the
      //    trio: no courtier energy, pure teeth.
      seelie_piper: [
        'ui.banter.enemy_ambient.seelie_piper.a',
        'ui.banter.enemy_ambient.seelie_piper.b',
        'ui.banter.enemy_ambient.seelie_piper.c',
      ],
      unseelie_fiddler: [
        'ui.banter.enemy_ambient.unseelie_fiddler.a',
        'ui.banter.enemy_ambient.unseelie_fiddler.b',
        'ui.banter.enemy_ambient.unseelie_fiddler.c',
      ],
      redcap: [
        'ui.banter.enemy_ambient.redcap.a',
        'ui.banter.enemy_ambient.redcap.b',
        'ui.banter.enemy_ambient.redcap.c',
      ],
      // ── Weather family (Task 17). Elemental-thin — treat the wraith as
      //    weather given a face. Short, wispy, no metaphors piled on.
      haar_wraith: [
        'ui.banter.enemy_ambient.haar_wraith.a',
        'ui.banter.enemy_ambient.haar_wraith.b',
        'ui.banter.enemy_ambient.haar_wraith.c',
      ],
      gale_wraith: [
        'ui.banter.enemy_ambient.gale_wraith.a',
        'ui.banter.enemy_ambient.gale_wraith.b',
        'ui.banter.enemy_ambient.gale_wraith.c',
      ],
      // ── Urban Ghaists family (Task 17). Sharp-comic Glesga patter —
      //    the moor's voice gets a city edge when the streets bleed
      //    through. Edge-adjacent but kept hearth-toned overall.
      buckfast_ned: [
        'ui.banter.enemy_ambient.buckfast_ned.a',
        'ui.banter.enemy_ambient.buckfast_ned.b',
        'ui.banter.enemy_ambient.buckfast_ned.c',
      ],
      traffic_cone_totem: [
        'ui.banter.enemy_ambient.traffic_cone_totem.a',
        'ui.banter.enemy_ambient.traffic_cone_totem.b',
        'ui.banter.enemy_ambient.traffic_cone_totem.c',
      ],
      edinburgh_ghost_guide: [
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.a',
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.b',
        'ui.banter.enemy_ambient.edinburgh_ghost_guide.c',
      ],
      // ── Academic Apparitions family (Task 17). Stern-scholarly with a
      //    wee comic undercut — the moor's voice is warm but wryly aware
      //    the dead scholars are bossy. Auld-university patter (St
      //    Andrews / Edinburgh / Glasgow).
      ceilidh_caller: [
        'ui.banter.enemy_ambient.ceilidh_caller.a',
        'ui.banter.enemy_ambient.ceilidh_caller.b',
        'ui.banter.enemy_ambient.ceilidh_caller.c',
      ],
      tome_wraith: [
        'ui.banter.enemy_ambient.tome_wraith.a',
        'ui.banter.enemy_ambient.tome_wraith.b',
        'ui.banter.enemy_ambient.tome_wraith.c',
      ],
      dean_apparition: [
        'ui.banter.enemy_ambient.dean_apparition.a',
        'ui.banter.enemy_ambient.dean_apparition.b',
        'ui.banter.enemy_ambient.dean_apparition.c',
      ],
      // ── Taxman's Retinue family (Task 17). Bureaucratic-dread —
      //    council-tax-reminder register, dry fear. Every line telegraphs
      //    the approaching boss without begging the tension.
      ledger_wraith: [
        'ui.banter.enemy_ambient.ledger_wraith.a',
        'ui.banter.enemy_ambient.ledger_wraith.b',
        'ui.banter.enemy_ambient.ledger_wraith.c',
      ],
      auditor_priest: [
        'ui.banter.enemy_ambient.auditor_priest.a',
        'ui.banter.enemy_ambient.auditor_priest.b',
        'ui.banter.enemy_ambient.auditor_priest.c',
      ],
      // ── Moor-Classic (Task 17). Original enemies without a Phase-2
      //    family tag — each gets 2 lines anchored to its silhouette
      //    (tourist, chef, midge, highland_cow, eagle, haggis_hunter,
      //    angry_scotsman, deep_fryer, piper, berserker, ghost, nest,
      //    sheep, kelpie, midgie_swarm). Generic moor-voice hearth.
      tourist: [
        'ui.banter.enemy_ambient.tourist.a',
        'ui.banter.enemy_ambient.tourist.b',
      ],
      chef: [
        'ui.banter.enemy_ambient.chef.a',
        'ui.banter.enemy_ambient.chef.b',
      ],
      midge: [
        'ui.banter.enemy_ambient.midge.a',
        'ui.banter.enemy_ambient.midge.b',
      ],
      highland_cow: [
        'ui.banter.enemy_ambient.highland_cow.a',
        'ui.banter.enemy_ambient.highland_cow.b',
      ],
      eagle: [
        'ui.banter.enemy_ambient.eagle.a',
        'ui.banter.enemy_ambient.eagle.b',
      ],
      haggis_hunter: [
        'ui.banter.enemy_ambient.haggis_hunter.a',
        'ui.banter.enemy_ambient.haggis_hunter.b',
      ],
      angry_scotsman: [
        'ui.banter.enemy_ambient.angry_scotsman.a',
        'ui.banter.enemy_ambient.angry_scotsman.b',
      ],
      deep_fryer: [
        'ui.banter.enemy_ambient.deep_fryer.a',
        'ui.banter.enemy_ambient.deep_fryer.b',
      ],
      piper: [
        'ui.banter.enemy_ambient.piper.a',
        'ui.banter.enemy_ambient.piper.b',
      ],
      berserker: [
        'ui.banter.enemy_ambient.berserker.a',
        'ui.banter.enemy_ambient.berserker.b',
      ],
      ghost: [
        'ui.banter.enemy_ambient.ghost.a',
        'ui.banter.enemy_ambient.ghost.b',
      ],
      nest: [
        'ui.banter.enemy_ambient.nest.a',
        'ui.banter.enemy_ambient.nest.b',
      ],
      sheep: [
        'ui.banter.enemy_ambient.sheep.a',
        'ui.banter.enemy_ambient.sheep.b',
      ],
      kelpie: [
        'ui.banter.enemy_ambient.kelpie.a',
        'ui.banter.enemy_ambient.kelpie.b',
      ],
      midgie_swarm: [
        'ui.banter.enemy_ambient.midgie_swarm.a',
        'ui.banter.enemy_ambient.midgie_swarm.b',
      ],
    },
  },
  {
    // Reliquary pickup (M15). Small hearth beat — the moor just handed
    // you a curio, acknowledging the off-path detour. Generic-only pool;
    // per-curio voice tint stays open for a future banter pass.
    context: 'reliquary_pick',
    tone: 'hearth',
    priority: 45,
    rare: true,
    keys: [
      'ui.banter.reliquary_pick.a',
      'ui.banter.reliquary_pick.b',
      'ui.banter.reliquary_pick.c',
      'ui.banter.reliquary_pick.d',
    ],
    keysByTag: {
      // First Reliquary curio ever pulled (lifetime, pre-bump TOTAL = 0
      // across all curios). Routed by moorMoments.spawnReliquary.onPick
      // when bumpReliquaryCurioPick returns 0. Pilgrim wonder beat —
      // the moor's first off-path gift, before the haggis knows what
      // a curio is. Sister to cairn boon_first / clootie bound_first /
      // beithir cured_*_first (v20-v22 cohort).
      first_curio: [
        'ui.banter.reliquary_pick.first_curio.a',
        'ui.banter.reliquary_pick.first_curio.b',
        'ui.banter.reliquary_pick.first_curio.c',
      ],
    },
  },
  {
    // Haggis Wildlife Foundation field-note pickup (DESIGN_IDEAS §11
    // wild-haggis-myth). Fires on collect of a `pickup_field_note`
    // dropped by a haggis_hunter kill — the cataloguer dropped a
    // notebook page on death and the haggis lifts it on the moor.
    // Hearth tone: the *page* speaks in absurd-naturalist Foundation
    // prose (Latin binomials, footnotes, terrain notes), but the
    // *line* is the haggis reading a fragment and reacting in his
    // own voice. Six leaves on the no-repeat ring give variety
    // across a long run where multiple hunters fall.
    //
    // Priority 44 sits between burns_citation (43) and reliquary_pick
    // (45). Below reliquary because reliquary is once-per-run; above
    // burns_citation because the field note is a held-in-the-paw
    // artefact rather than an ambient lyric — the player just walked
    // over to it and lifted it, the moment deserves a beat.
    //
    // `rare: true` — the drop itself is gated 1/6 on a sometimes-
    // spawning enemy, so the Almanac surfaces these lines as
    // collectibles alongside reliquary_pick / burns_citation /
    // first_time / cailleach_whisper.
    context: 'field_note_pickup',
    tone: 'hearth',
    priority: 44,
    rare: true,
    keys: [
      'ui.banter.field_note_pickup.a',
      'ui.banter.field_note_pickup.b',
      'ui.banter.field_note_pickup.c',
      'ui.banter.field_note_pickup.d',
      'ui.banter.field_note_pickup.e',
      'ui.banter.field_note_pickup.f',
    ],
  },
  // ── B1 Phase 4 Task 21 — Cailleach whispers.
  //
  // Voice register: EDGE / GRAVE per Voice Card §Cailleach. Cailleach
  // Bheur — the Winter Queen, elder hag, shaper of mountains and keeper
  // of wild beasts. Stern, motherly, Gaelic-inflected. *Not* villainous;
  // an elder who expects better. Sparing words; every one carries weight.
  //
  // Priority 55 — sits below act_intermission_enter (52) (so the route-
  // pick beats it on the very-tick of the intermission opening) but above
  // first_blood (50). Wires planned: act intermissions (post-pick tick),
  // low-HP follow-on, Bargain events. Wiring lands in a follow-up commit
  // alongside content per "hook with content" pattern.
  //
  // [GAELIC-REVIEW] Some leaves carry untranslated Gaelic fragments
  // (a chiall / mo nighean / is fada an oidhche / tog ort / cha mhór /
  // a ghaoil / gabh air do shocair / sgrìobhte sa chloich). Every such
  // line is flagged inline in i18n.ts and listed in
  // docs/top-10-tasks/blocked/06-blocked-on-human.md. The pool is gated
  // by `rare: true` so the lines surface as collectible / accent
  // moments rather than ambient chatter — consistent with first_time,
  // burns_citation, and reliquary_pick precedent.
  {
    context: 'cailleach_whisper',
    tone: 'edge',
    priority: 55,
    rare: true,
    keys: [
      'ui.banter.cailleach_whisper.a',
      'ui.banter.cailleach_whisper.b',
      'ui.banter.cailleach_whisper.c',
      'ui.banter.cailleach_whisper.d',
      'ui.banter.cailleach_whisper.e',
      'ui.banter.cailleach_whisper.f',
      'ui.banter.cailleach_whisper.g',
      'ui.banter.cailleach_whisper.h',
      'ui.banter.cailleach_whisper.i',
      'ui.banter.cailleach_whisper.j',
      'ui.banter.cailleach_whisper.k',
      'ui.banter.cailleach_whisper.l',
      'ui.banter.cailleach_whisper.m',
      'ui.banter.cailleach_whisper.n',
      'ui.banter.cailleach_whisper.o',
      'ui.banter.cailleach_whisper.p',
      'ui.banter.cailleach_whisper.q',
      'ui.banter.cailleach_whisper.r',
      'ui.banter.cailleach_whisper.s',
      'ui.banter.cailleach_whisper.t',
    ],
  },
  // ── B1 Phase 5 — Seasonal event banter (standalone graduation).
  //
  // Voice register: HEARTH (warm seasonal moments) per Voice Card; the
  // Samhain sub-pool tilts Cailleach-edged. Tags align with
  // `getActiveSeasonalEventKey` returns. Each tag gets ≥ 12 lines so the
  // window's typical 7–14-day window can land lines without stutter.
  //
  // Priority 65 per spec §2 / PENDING_POOL_METADATA. Sits between
  // boss_down (70) and weapon_evolve (no, weapon_evolve is also 65 in
  // BANTER_POOLS — RECONCILIATION: spec §2 placed seasonal_event at 65,
  // but `weapon_evolve` already lives at 65. Resolved here at 64 so the
  // ladder stays unique and seasonal sits just below weapon evolution
  // (a pickup tick should still own its moment). Pattern matches
  // gran_commentary 30→28, enemy_ambient 40→41, burns_citation 45→43.
  {
    context: 'seasonal_event',
    tone: 'hearth',
    priority: 64,
    rare: true,
    keys: [
      'ui.banter.seasonal_event.a',
      'ui.banter.seasonal_event.b',
    ],
    keysByTag: {
      // Tag aligns with `getActiveSeasonalEventKey('burns_night')`. 20
      // lines — Burns canon citations + supper-ritual atmosphere. Public
      // domain Burns quotations cite Kinsley 1968 inline in i18n.ts.
      burns_night: [
        'ui.banter.seasonal_event.burns_night.a',
        'ui.banter.seasonal_event.burns_night.b',
        'ui.banter.seasonal_event.burns_night.c',
        'ui.banter.seasonal_event.burns_night.d',
        'ui.banter.seasonal_event.burns_night.e',
        'ui.banter.seasonal_event.burns_night.f',
        'ui.banter.seasonal_event.burns_night.g',
        'ui.banter.seasonal_event.burns_night.h',
        'ui.banter.seasonal_event.burns_night.i',
        'ui.banter.seasonal_event.burns_night.j',
        'ui.banter.seasonal_event.burns_night.k',
        'ui.banter.seasonal_event.burns_night.l',
        'ui.banter.seasonal_event.burns_night.m',
        'ui.banter.seasonal_event.burns_night.n',
        'ui.banter.seasonal_event.burns_night.o',
        'ui.banter.seasonal_event.burns_night.p',
        'ui.banter.seasonal_event.burns_night.q',
        'ui.banter.seasonal_event.burns_night.r',
        'ui.banter.seasonal_event.burns_night.s',
        'ui.banter.seasonal_event.burns_night.t',
      ],
      hogmanay: [
        'ui.banter.seasonal_event.hogmanay.a',
        'ui.banter.seasonal_event.hogmanay.b',
        'ui.banter.seasonal_event.hogmanay.c',
        'ui.banter.seasonal_event.hogmanay.d',
        'ui.banter.seasonal_event.hogmanay.e',
        'ui.banter.seasonal_event.hogmanay.f',
        'ui.banter.seasonal_event.hogmanay.g',
        'ui.banter.seasonal_event.hogmanay.h',
        'ui.banter.seasonal_event.hogmanay.i',
        'ui.banter.seasonal_event.hogmanay.j',
        'ui.banter.seasonal_event.hogmanay.k',
        'ui.banter.seasonal_event.hogmanay.l',
        'ui.banter.seasonal_event.hogmanay.m',
        'ui.banter.seasonal_event.hogmanay.n',
        'ui.banter.seasonal_event.hogmanay.o',
        'ui.banter.seasonal_event.hogmanay.p',
      ],
      samhain: [
        'ui.banter.seasonal_event.samhain.a',
        'ui.banter.seasonal_event.samhain.b',
        'ui.banter.seasonal_event.samhain.c',
        'ui.banter.seasonal_event.samhain.d',
        'ui.banter.seasonal_event.samhain.e',
        'ui.banter.seasonal_event.samhain.f',
        'ui.banter.seasonal_event.samhain.g',
        'ui.banter.seasonal_event.samhain.h',
        'ui.banter.seasonal_event.samhain.i',
        'ui.banter.seasonal_event.samhain.j',
        'ui.banter.seasonal_event.samhain.k',
        'ui.banter.seasonal_event.samhain.l',
      ],
      beltane: [
        'ui.banter.seasonal_event.beltane.a',
        'ui.banter.seasonal_event.beltane.b',
        'ui.banter.seasonal_event.beltane.c',
        'ui.banter.seasonal_event.beltane.d',
        'ui.banter.seasonal_event.beltane.e',
        'ui.banter.seasonal_event.beltane.f',
        'ui.banter.seasonal_event.beltane.g',
        'ui.banter.seasonal_event.beltane.h',
        'ui.banter.seasonal_event.beltane.i',
        'ui.banter.seasonal_event.beltane.j',
        'ui.banter.seasonal_event.beltane.k',
        'ui.banter.seasonal_event.beltane.l',
      ],
      // 2026-04-29 — three remaining seasonal cohort entries get their
      // dedicated banter sub-pools. 12 leaves each, bilingual, voice-
      // matched: St Andrew's Day = saltire / national-day; Imbolc =
      // Brìde / first stir of spring; Lammas = Lùnastal / harvest +
      // loaf-mass + Lugh's funeral games for Tailtiu.
      st_andrews: [
        'ui.banter.seasonal_event.st_andrews.a',
        'ui.banter.seasonal_event.st_andrews.b',
        'ui.banter.seasonal_event.st_andrews.c',
        'ui.banter.seasonal_event.st_andrews.d',
        'ui.banter.seasonal_event.st_andrews.e',
        'ui.banter.seasonal_event.st_andrews.f',
        'ui.banter.seasonal_event.st_andrews.g',
        'ui.banter.seasonal_event.st_andrews.h',
        'ui.banter.seasonal_event.st_andrews.i',
        'ui.banter.seasonal_event.st_andrews.j',
        'ui.banter.seasonal_event.st_andrews.k',
        'ui.banter.seasonal_event.st_andrews.l',
      ],
      imbolc: [
        'ui.banter.seasonal_event.imbolc.a',
        'ui.banter.seasonal_event.imbolc.b',
        'ui.banter.seasonal_event.imbolc.c',
        'ui.banter.seasonal_event.imbolc.d',
        'ui.banter.seasonal_event.imbolc.e',
        'ui.banter.seasonal_event.imbolc.f',
        'ui.banter.seasonal_event.imbolc.g',
        'ui.banter.seasonal_event.imbolc.h',
        'ui.banter.seasonal_event.imbolc.i',
        'ui.banter.seasonal_event.imbolc.j',
        'ui.banter.seasonal_event.imbolc.k',
        'ui.banter.seasonal_event.imbolc.l',
      ],
      lammas: [
        'ui.banter.seasonal_event.lammas.a',
        'ui.banter.seasonal_event.lammas.b',
        'ui.banter.seasonal_event.lammas.c',
        'ui.banter.seasonal_event.lammas.d',
        'ui.banter.seasonal_event.lammas.e',
        'ui.banter.seasonal_event.lammas.f',
        'ui.banter.seasonal_event.lammas.g',
        'ui.banter.seasonal_event.lammas.h',
        'ui.banter.seasonal_event.lammas.i',
        'ui.banter.seasonal_event.lammas.j',
        'ui.banter.seasonal_event.lammas.k',
        'ui.banter.seasonal_event.lammas.l',
      ],
      // 2026-04-29 — Bracken-turn closes the cohort banter coverage to
      // 8/8. 12 leaves voice the autumn-cusp moor: copper fronds, first
      // frost, rooks gathering, fires lit early at the steading.
      bracken_turn: [
        'ui.banter.seasonal_event.bracken_turn.a',
        'ui.banter.seasonal_event.bracken_turn.b',
        'ui.banter.seasonal_event.bracken_turn.c',
        'ui.banter.seasonal_event.bracken_turn.d',
        'ui.banter.seasonal_event.bracken_turn.e',
        'ui.banter.seasonal_event.bracken_turn.f',
        'ui.banter.seasonal_event.bracken_turn.g',
        'ui.banter.seasonal_event.bracken_turn.h',
        'ui.banter.seasonal_event.bracken_turn.i',
        'ui.banter.seasonal_event.bracken_turn.j',
        'ui.banter.seasonal_event.bracken_turn.k',
        'ui.banter.seasonal_event.bracken_turn.l',
      ],
      // 2026-05-09 — Bannockburn anniversary lifts the cohort to 9/9.
      // 12 leaves voice Bruce's stand: pike-wall, the field, Burns's
      // anthem, the freshly-wired charge sub-pool. Cultural framing
      // celebrates Scottish resilience without contemporary politics.
      bannockburn: [
        'ui.banter.seasonal_event.bannockburn.a',
        'ui.banter.seasonal_event.bannockburn.b',
        'ui.banter.seasonal_event.bannockburn.c',
        'ui.banter.seasonal_event.bannockburn.d',
        'ui.banter.seasonal_event.bannockburn.e',
        'ui.banter.seasonal_event.bannockburn.f',
        'ui.banter.seasonal_event.bannockburn.g',
        'ui.banter.seasonal_event.bannockburn.h',
        'ui.banter.seasonal_event.bannockburn.i',
        'ui.banter.seasonal_event.bannockburn.j',
        'ui.banter.seasonal_event.bannockburn.k',
        'ui.banter.seasonal_event.bannockburn.l',
      ],
      // 2026-05-09 — Glorious Twelfth (Aug 11-13) closes the cohort
      // banter coverage to 10/10. 12 leaves voice the noisy moor:
      // tweed-clad hunters, dogs in the heather, shotguns up the
      // brae, the haggis going to ground + widening its arc. Voice
      // is warm-wry — the haggis isn't fighting hunters, it's
      // outwaiting them. No anti-hunter venom; the comic register
      // is the existing tourist + haggis_hunter vein.
      glorious_twelfth: [
        'ui.banter.seasonal_event.glorious_twelfth.a',
        'ui.banter.seasonal_event.glorious_twelfth.b',
        'ui.banter.seasonal_event.glorious_twelfth.c',
        'ui.banter.seasonal_event.glorious_twelfth.d',
        'ui.banter.seasonal_event.glorious_twelfth.e',
        'ui.banter.seasonal_event.glorious_twelfth.f',
        'ui.banter.seasonal_event.glorious_twelfth.g',
        'ui.banter.seasonal_event.glorious_twelfth.h',
        'ui.banter.seasonal_event.glorious_twelfth.i',
        'ui.banter.seasonal_event.glorious_twelfth.j',
        'ui.banter.seasonal_event.glorious_twelfth.k',
        'ui.banter.seasonal_event.glorious_twelfth.l',
      ],
      // 2026-05-09 — Tartan Day (Apr 4-8) lifts the cohort banter
      // coverage to 11/11. Diaspora's national-Scottish day, anchored
      // on Apr 6 — the date of the Declaration of Arbroath signing in
      // 1320. Banter rides the cloth, the cousins, and "for freedom
      // alone, which no honest man gives up but with life itself".
      // Hearth tone with two grave-edge moments (c, i) for the
      // Declaration's gravity. No anti-English content. SCOTTISH_
      // RESEARCH_DEEP §6.7 (Declaration of Arbroath) + §14.5 (diaspora).
      tartan_day: [
        'ui.banter.seasonal_event.tartan_day.a',
        'ui.banter.seasonal_event.tartan_day.b',
        'ui.banter.seasonal_event.tartan_day.c',
        'ui.banter.seasonal_event.tartan_day.d',
        'ui.banter.seasonal_event.tartan_day.e',
        'ui.banter.seasonal_event.tartan_day.f',
        'ui.banter.seasonal_event.tartan_day.g',
        'ui.banter.seasonal_event.tartan_day.h',
        'ui.banter.seasonal_event.tartan_day.i',
        'ui.banter.seasonal_event.tartan_day.j',
        'ui.banter.seasonal_event.tartan_day.k',
        'ui.banter.seasonal_event.tartan_day.l',
      ],
      // 2026-05-09 — Simmer Dim (Jun 18-21) lifts the cohort banter
      // coverage to 12/12. Shetlandic / Orcadian phrase for the
      // perpetual twilight of Scottish midsummer at high latitudes;
      // peaks at the solstice (Jun 21). Cultural framing: hush, not
      // festival. Banter rides the held-light, the solstice quiet,
      // and the fey-ring caution that midsummer carries across
      // Scottish folklore. Hearth tone with one fey-edge bite (d).
      // SCOTTISH_RESEARCH_DEEP §22.6.
      simmer_dim: [
        'ui.banter.seasonal_event.simmer_dim.a',
        'ui.banter.seasonal_event.simmer_dim.b',
        'ui.banter.seasonal_event.simmer_dim.c',
        'ui.banter.seasonal_event.simmer_dim.d',
        'ui.banter.seasonal_event.simmer_dim.e',
        'ui.banter.seasonal_event.simmer_dim.f',
        'ui.banter.seasonal_event.simmer_dim.g',
        'ui.banter.seasonal_event.simmer_dim.h',
        'ui.banter.seasonal_event.simmer_dim.i',
        'ui.banter.seasonal_event.simmer_dim.j',
        'ui.banter.seasonal_event.simmer_dim.k',
        'ui.banter.seasonal_event.simmer_dim.l',
      ],
      // 2026-05-09 — Up Helly Aa (Feb 9-15) lifts the cohort banter
      // coverage to 13/13. Shetland fire-festival cycle. Marquee
      // Lerwick procession is end-of-Jan but sits under Burns Night;
      // window honours the broader Shetland season (Cunningsburgh,
      // Cullivoe, Norwick, Bressay, Nesting, Uyeasound — eleven
      // outlying community fire festivals). Banter rides torch-
      // procession, guizer brotherhood, the galley burning at the
      // harbour, Norn echoes. Hearth tone with one grave-edge bite
      // (h) for the longship's commitment-to-flame. SCOTTISH_RESEARCH_
      // DEEP §22.7.
      up_helly_aa: [
        'ui.banter.seasonal_event.up_helly_aa.a',
        'ui.banter.seasonal_event.up_helly_aa.b',
        'ui.banter.seasonal_event.up_helly_aa.c',
        'ui.banter.seasonal_event.up_helly_aa.d',
        'ui.banter.seasonal_event.up_helly_aa.e',
        'ui.banter.seasonal_event.up_helly_aa.f',
        'ui.banter.seasonal_event.up_helly_aa.g',
        'ui.banter.seasonal_event.up_helly_aa.h',
        'ui.banter.seasonal_event.up_helly_aa.i',
        'ui.banter.seasonal_event.up_helly_aa.j',
        'ui.banter.seasonal_event.up_helly_aa.k',
        'ui.banter.seasonal_event.up_helly_aa.l',
      ],
      culloden: [
        'ui.banter.seasonal_event.culloden.a',
        'ui.banter.seasonal_event.culloden.b',
        'ui.banter.seasonal_event.culloden.c',
        'ui.banter.seasonal_event.culloden.d',
        'ui.banter.seasonal_event.culloden.e',
        'ui.banter.seasonal_event.culloden.f',
        'ui.banter.seasonal_event.culloden.g',
        'ui.banter.seasonal_event.culloden.h',
        'ui.banter.seasonal_event.culloden.i',
        'ui.banter.seasonal_event.culloden.j',
        'ui.banter.seasonal_event.culloden.k',
        'ui.banter.seasonal_event.culloden.l',
      ],
    },
  },
  // Taxman Grudge Ledger (DESIGN_IDEAS §1) — verdict-keyed closing
  // line at run-end victory. Priority 85 sits between death_reflection
  // (75) and boss_warn (100): wins same-tick over gran_commentary (28)
  // so the Taxman gets his ledger word on a victory tick, but the
  // ironmoor first-time line (110) and any active boss-warn still
  // outrank if they happen to fire same-tick. Edge tone — this is the
  // antagonist's voice, the auditor's sneer. Four sub-pools cover the
  // *opinionated* verdicts (coward / bruiser / precise / reckless);
  // the `even` verdict — "no clear pattern, forgettable" — falls
  // through to the pool's `keys` fallback by passing tag 'even' which
  // misses keysByTag and lands on the unconditional pair. This keeps
  // every authored leaf reachable through exactly one path so the
  // global-uniqueness pool-key test (BanterSystem.test) stays green.
  {
    context: 'taxman_grudge',
    tone: 'edge',
    priority: 85,
    keys: [
      'ui.banter.taxman_grudge.even.a',
      'ui.banter.taxman_grudge.even.b',
    ],
    keysByTag: {
      coward: [
        'ui.banter.taxman_grudge.coward.a',
        'ui.banter.taxman_grudge.coward.b',
      ],
      bruiser: [
        'ui.banter.taxman_grudge.bruiser.a',
        'ui.banter.taxman_grudge.bruiser.b',
      ],
      precise: [
        'ui.banter.taxman_grudge.precise.a',
        'ui.banter.taxman_grudge.precise.b',
      ],
      reckless: [
        'ui.banter.taxman_grudge.reckless.a',
        'ui.banter.taxman_grudge.reckless.b',
      ],
    },
  },
  // DESIGN_IDEAS §1 Race the Beithir. Venom-fang sting opens the 8 s
  // race window. Top-level `keys` are the `stung` onset lines, also
  // serving as the unknown-tag fallback per pool contract (mirror of
  // taxman_grudge's `even` fallback). Three cure/expire sub-pools each
  // hold two authored leaves — clears the no-repeat ring on the rare
  // same-run double-sting. Priority 90 sits above low_hp (80) so a
  // sting-during-low-HP moment delivers the urgency line; below boss_
  // warn (100) so a boss arriving still owns the channel.
  {
    context: 'beithir_sting',
    tone: 'edge',
    priority: 90,
    keys: [
      'ui.banter.beithir_sting.a',
      'ui.banter.beithir_sting.b',
    ],
    keysByTag: {
      cured_heal: [
        'ui.banter.beithir_sting.cured_heal.a',
        'ui.banter.beithir_sting.cured_heal.b',
      ],
      // First heal-cure ever (lifetime counter pre-bump 0). Wonder /
      // discovery beat — auld stories paid out. Player.cureBeithirSting
      // FromHeal routes here when bumpBeithirCured() returns 0.
      cured_heal_first: [
        'ui.banter.beithir_sting.cured_heal_first.a',
        'ui.banter.beithir_sting.cured_heal_first.b',
        'ui.banter.beithir_sting.cured_heal_first.c',
      ],
      cured_kill: [
        'ui.banter.beithir_sting.cured_kill.a',
        'ui.banter.beithir_sting.cured_kill.b',
      ],
      // First kill-cure ever (lifetime counter pre-bump 0). Wonder /
      // revenge-discovery beat. Cures share the counter so a prior
      // heal-cure suppresses this beat (the wonder is "the cure works
      // at all", not "this specific path"). Three leaves give the
      // BanterSystem no-repeat ring some room.
      cured_kill_first: [
        'ui.banter.beithir_sting.cured_kill_first.a',
        'ui.banter.beithir_sting.cured_kill_first.b',
        'ui.banter.beithir_sting.cured_kill_first.c',
      ],
      expired: [
        'ui.banter.beithir_sting.expired.a',
        'ui.banter.beithir_sting.expired.b',
      ],
    },
  },
];

export function getBanterPool(context: BanterContext): BanterPool | undefined {
  return BANTER_POOLS.find((p) => p.context === context);
}

/**
 * B1 Phase 1 — pools scheduled for authoring in later phases.
 *
 * These IDs are *not* members of `BanterContext` yet: each pool graduates
 * into `BanterContext` + `BANTER_POOLS` only when its lines are authored
 * (Phase 2 onward). Keeping them here preserves two existing invariants
 * from `banter.test.ts`:
 *   - every pool in `BANTER_POOLS` has ≥ 2 keys
 *   - no two pools in `BANTER_POOLS` share a priority
 *
 * Tests read `POOL_PRIORITIES` (derived below) to verify the priority
 * ladder called for in `docs/superpowers/specs/2026-04-23-banter-density-push-design.md §2`.
 */
// B1 Phase 4 + 5 graduation (2026-04-26): both `cailleach_whisper` and
// `seasonal_event` graduated into BANTER_POOLS. The PendingBanterContext
// union is now empty; preserved as `never` so the type infrastructure
// stays in place for any future deferred pool (the design pattern was
// the most useful invariant — let it persist with zero pending pools
// rather than ripping it out and rebuilding next time we defer one).
export type PendingBanterContext = never;

export interface PendingPoolMetadata {
  tone: BanterTone;
  priority: number;
}

/**
 * Tone + priority per spec §2 / §3. Priority ladder (high → low) after
 * B1 Phase 4 + 5 graduation:
 *   first_time (110) > boss_warn (100) > low_hp (80) > death_reflection (75) >
 *   boss_down (70) > weapon_evolve (65) > seasonal_event (64) >
 *   level_up (60) > curse_start (59) > act_complete (57) >
 *   cailleach_whisper (55) > act_intermission_enter (52) >
 *   first_blood (50) > route_picked (48) > reliquary_pick (45) >
 *   burns_citation (43) > enemy_ambient (41) > kill_streak (40) >
 *   recover (35) > moor_moment (31) > biome_change (30) >
 *   gran_commentary (28) > shinty_parry (27) > stance_change (26) >
 *   haggis_ambient (25) > form_shifted (24) > idle (10)
 *
 * Reconciliation history (graduating pools shift down 1–2 slots when
 * the spec §2 number collided with a live pool — uniqueness is the
 * binding invariant):
 *   - `gran_commentary` shipped at 28 (spec 30 collided with biome_change).
 *   - `enemy_ambient` shipped at 41 (spec 40 collided with kill_streak).
 *   - `burns_citation` shipped at 43 (spec 45 collided with reliquary_pick).
 *   - `seasonal_event` shipped at 64 (spec 65 collided with weapon_evolve).
 *   - `cailleach_whisper` shipped at 55 (spec 55 — clean).
 *
 * PendingBanterContext is now `never`. Any future deferred pool registers
 * here with its tone + priority; on graduation it moves into
 * `BANTER_POOLS` and out of `PENDING_POOL_METADATA`.
 */
export const PENDING_POOL_METADATA: Readonly<Record<PendingBanterContext, PendingPoolMetadata>> = {
};

/**
 * Flat priority lookup spanning live (`BANTER_POOLS`) + pending
 * (`PENDING_POOL_METADATA`) pools. Single source of truth for the
 * ladder documented in B1 spec §2. Read-only at runtime; tests assert
 * spec numbers against this map so the ladder can't drift silently.
 */
export const POOL_PRIORITIES: Readonly<Record<string, number>> = (() => {
  const out: Record<string, number> = {};
  for (const p of BANTER_POOLS) out[p.context] = p.priority;
  // After B1 Phase 4+5 graduation `PENDING_POOL_METADATA` is empty
  // (`Record<never, …>`) — the loop is a no-op today but kept for
  // forward-compat when a future deferred pool re-registers. Cast
  // through unknown so the empty-record pattern doesn't widen `meta`
  // to TS's anomalous `unknown` for `Object.entries(Record<never, X>)`.
  const pending = PENDING_POOL_METADATA as Readonly<Record<string, PendingPoolMetadata>>;
  for (const [id, meta] of Object.entries(pending)) out[id] = meta.priority;
  return out;
})();

/** All i18n keys, flat — generic + every tagged sub-pool. Tests lean on
 *  this to prove every declared key resolves to a real i18n string. */
export const BANTER_KEYS: readonly string[] = BANTER_POOLS.flatMap((p) => {
  const tagged = p.keysByTag ? Object.values(p.keysByTag).flat() : [];
  return [...p.keys, ...tagged];
});
