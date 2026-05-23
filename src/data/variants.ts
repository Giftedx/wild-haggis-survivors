import { t } from '../core/i18n';
import { formatClockTime } from '../utils/formatClockTime';

export type VariantKey = 'classic' | 'moor_runner' | 'iron_belly' | 'glen_forager' | 'surefoot' | 'pipe_breath' | 'laird' | 'wee_ghostie' | 'glaswegian' | 'cailleach' | 'anticlockwise' | 'doric_quinie' | 'peerie_shetlander' | 'burns_wee_beastie' | 'witch_hare' | 'selkie' | 'morningside' | 'drouthy';

export interface VariantModifier {
  moveSpeedPct?: number;
  maxHpFlat?: number;
  armorFlat?: number;
  pickupRadiusFlat?: number;
  xpMultiplierPct?: number;
  damagePct?: number;
  driftReductionPct?: number;
  cooldownReductionPct?: number;
  /**
   * V2 — additive crit-chance bonus (e.g. 0.05 = +5 percentage points).
   * Applied at run start via `applyVariantModifiers` → `Player.addCritChance`.
   * Shared by Peerie Shetlander (+5%) and Burns's Wee Beastie (+20%).
   */
  critChancePct?: number;
  /**
   * V2 Track 3 — visual sprite scale multiplier (1.0 = unchanged).
   * Applied via `Player.setScale`. Phaser's arcade physics auto-scales
   * circular hitboxes when the sprite scales, so the hitbox tracks
   * the visual. Shadow + mantle overlays follow the Player transform.
   * Burns's Wee Beastie ships at 0.85 — "tiny, trembling, noble-hearted".
   */
  spriteScale?: number;
  /**
   * Flip the sign of the Drift for this run (clockwise → anticlockwise).
   * Per wild haggis myth (SCOTTISH_RESEARCH_DEEP §11.5): two subspecies
   * exist with opposite-leg asymmetry. This modifier mirrors the Drift
   * matrix without changing its magnitude.
   */
  driftSignFlip?: boolean;
  /**
   * Amplify the Drift magnitude by this fraction (e.g. 1.0 = doubled).
   * Applied via `Player.amplifyDrift`. Composable with `driftReductionPct`
   * — the effective drift multiplier is `(1 - bonusDriftReduction)` and
   * both modifiers fold into the same field. Used by the Drouthy variant
   * (drunk haggis — drift doubled by the drams).
   */
  driftAmplifyPct?: number;
}

export type VariantUnlockCondition =
  | { type: 'default' }
  | { type: 'best_time'; required: number }
  | { type: 'best_kills'; required: number }
  | { type: 'total_gold_earned'; required: number }
  | { type: 'victories'; required: number }
  | { type: 'cursed_victories'; required: number }
  // V2 Track 1 — Doric Quinie unlock: "survive on what you caught yesterday".
  // Counter increments on victory when the run never overlapped a healing
  // circle. Wired in `applyRunSummary` via `RunHistoryContext.enteredHealingCircle`.
  | { type: 'runs_without_healing'; required: number }
  // V2 Track 2 — Peerie Shetlander unlock: "the sea way home".
  // Counter increments on victory when biomes visited were a subset of
  // {loch, pine} (never entered bog or heather — the "moor" biomes).
  // Wired via `RunHistoryContext.biomesVisited` and BiomeController.
  | { type: 'runs_in_coastal_only'; required: number }
  // V2 Track 3 — Burns's Wee Beastie unlock: "earned when the bard is
  // honoured". Counter increments on victory when >= 7 weapons evolved
  // in the same run (all 7 evolutions fired — Burns, Ayrshire poet of
  // the haggis itself, emerges when the player has fully earned him).
  // Retained on the type for back-compat; no variant currently uses
  // this gate after the E1 tightening.
  | { type: 'runs_with_all_evolutions'; required: number }
  // E1 M2 T11 — tightened Burns's Wee Beastie gate. Victory with
  // all-7 evolutions AND run ended inside a Burns Night window
  // (device-local date). Counter is `burnsNightFullEvoRuns` on the
  // VariantProgressSnapshot; SaveData mirrors it as
  // `burnsNightFullEvoRunsCompleted`.
  | { type: 'burns_night_full_evo'; required: number };

export interface HaggisPalette {
  outline: number;
  bodyDark: number;
  bodyLight: number;
  fur: number;
  snout: number;
  accent: number;
}

export type HaggisAccentStyle =
  | 'none'
  | 'racing_band'
  | 'iron_belly'
  | 'forager'
  | 'surefoot'
  | 'pipe_breath'
  | 'laird'
  | 'wee_ghostie'
  | 'cailleach'
  | 'glaswegian'
  | 'doric_quinie'
  | 'peerie_shetlander'
  | 'morningside'
  | 'drouthy';

export interface VariantAppearance {
  palette: HaggisPalette;
  accentStyle: HaggisAccentStyle;
}

export interface VariantDef {
  key: VariantKey;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(flavorKey)` at render time. */
  flavorKey: string;
  textureKey: string;
  modifiers: VariantModifier;
  unlock: VariantUnlockCondition;
  appearance: VariantAppearance;
  /**
   * V2 followup — signature passive item(s) the player starts the run
   * already owning. Each key is applied once via `applyPassiveEffect`
   * and pushed into `ownedPassives` so the item card pool / evolution
   * pairing / Chronicle summary all treat it as a real pickup.
   *
   * Shape mirrors spec §2's "starter passive equivalents"; left
   * unused on classic variants so existing balance is untouched.
   * Future V2 cohort audits assign keys per variant.
   */
  startWithPassives?: string[];
  /**
   * Number of Whisky Breath stacks the player starts the run with.
   * Applied via `Player.setWhiskyBreathStacks` after variant modifiers.
   * Used by the Drouthy variant — the drunk haggis has a flask already
   * half-drained, so the first burst is available from the opening bell.
   */
  startWhiskyStacks?: number;
}

export interface VariantProgressSnapshot {
  bestTime: number;
  bestKills: number;
  totalGoldEarned: number;
  victories: number;
  cursedVictories?: number;
  /**
   * V2 Track 1 — lifetime count of victories completed without ever
   * overlapping a healing circle. Unlocks the Doric Quinie at 1.
   */
  runsWithoutHealing?: number;
  /**
   * V2 Track 2 — lifetime count of victorious runs whose visited-biome
   * set was a subset of {loch, pine} (the "coastal" biomes — no bog, no
   * heather). Unlocks the Peerie Shetlander at 1.
   */
  runsInCoastalOnly?: number;
  /**
   * V2 Track 3 — lifetime count of victorious runs where all seven
   * evolvable weapons reached their evolved form in the same run.
   * Kept for stats; no longer gates a variant unlock after the E1
   * tightening.
   */
  runsWithAllEvolutions?: number;
  /**
   * E1 M2 T11 — lifetime count of victorious runs that (a) reached
   * the evolution threshold AND (b) landed inside a Burns Night
   * window. Tight gate replaces the V2 placeholder for Burns's
   * Wee Beastie — unlock at 1.
   */
  burnsNightFullEvoRuns?: number;
  unlockedVariants?: readonly VariantKey[];
}

export interface VariantUnlockProgress {
  label: string;
  current: number;
  required: number;
  currentText: string;
  requiredText: string;
  ratio: number;
}

export const DEFAULT_VARIANT_KEY: VariantKey = 'classic';

export const VARIANTS: VariantDef[] = [
  {
    key: 'classic',
    nameKey: 'variant.classic.name',
    flavorKey: 'variant.classic.flavor',
    textureKey: 'haggis_classic',
    modifiers: {},
    unlock: { type: 'default' },
    appearance: {
      accentStyle: 'none',
      palette: {
        outline: 0x3a2808,
        bodyDark: 0x6b4e0a,
        bodyLight: 0x8b6914,
        fur: 0xa07818,
        snout: 0xd4956b,
        accent: 0xd4a017,
      },
    },
  },
  {
    key: 'moor_runner',
    nameKey: 'variant.moor_runner.name',
    flavorKey: 'variant.moor_runner.flavor',
    textureKey: 'haggis_moor_runner',
    modifiers: { moveSpeedPct: 0.12, maxHpFlat: -10 },
    unlock: { type: 'best_time', required: 600 },
    appearance: {
      accentStyle: 'racing_band',
      palette: {
        outline: 0x203010,
        bodyDark: 0x365321,
        bodyLight: 0x4e7430,
        fur: 0x6f9a48,
        snout: 0xc79b6d,
        accent: 0x6fb3ff,
      },
    },
  },
  {
    key: 'iron_belly',
    nameKey: 'variant.iron_belly.name',
    flavorKey: 'variant.iron_belly.flavor',
    textureKey: 'haggis_iron_belly',
    modifiers: { maxHpFlat: 15, armorFlat: 1, moveSpeedPct: -0.08 },
    unlock: { type: 'best_kills', required: 750 },
    appearance: {
      accentStyle: 'iron_belly',
      palette: {
        outline: 0x2f2f34,
        bodyDark: 0x575d66,
        bodyLight: 0x7d8694,
        fur: 0xaab4c1,
        snout: 0xc6a17c,
        accent: 0xd4a017,
      },
    },
  },
  {
    key: 'glen_forager',
    nameKey: 'variant.glen_forager.name',
    flavorKey: 'variant.glen_forager.flavor',
    textureKey: 'haggis_glen_forager',
    modifiers: { pickupRadiusFlat: 20, xpMultiplierPct: 0.1, damagePct: -0.1 },
    unlock: { type: 'total_gold_earned', required: 1500 },
    appearance: {
      accentStyle: 'forager',
      palette: {
        outline: 0x1f2d14,
        bodyDark: 0x455f22,
        bodyLight: 0x6e8a39,
        fur: 0x99b94d,
        snout: 0xc7a26e,
        accent: 0x7dd66e,
      },
    },
  },
  {
    key: 'surefoot',
    nameKey: 'variant.surefoot.name',
    flavorKey: 'variant.surefoot.flavor',
    textureKey: 'haggis_surefoot',
    modifiers: { driftReductionPct: 0.25, cooldownReductionPct: 0.05, maxHpFlat: -10 },
    unlock: { type: 'victories', required: 1 },
    appearance: {
      accentStyle: 'surefoot',
      palette: {
        outline: 0x341919,
        bodyDark: 0x6a2c2c,
        bodyLight: 0x973f3f,
        fur: 0xc56a52,
        snout: 0xd9a17a,
        accent: 0x66d0ff,
      },
    },
  },
  {
    key: 'pipe_breath',
    nameKey: 'variant.pipe_breath.name',
    flavorKey: 'variant.pipe_breath.flavor',
    textureKey: 'haggis_pipe_breath',
    modifiers: { cooldownReductionPct: 0.08, moveSpeedPct: 0.05, maxHpFlat: -15 },
    unlock: { type: 'victories', required: 3 },
    appearance: {
      accentStyle: 'pipe_breath',
      palette: {
        outline: 0x1a1040,
        bodyDark: 0x362870,
        bodyLight: 0x5040a0,
        fur: 0x7060c0,
        snout: 0xc0907a,
        accent: 0xaa88ff,
      },
    },
  },
  {
    key: 'wee_ghostie',
    nameKey: 'variant.wee_ghostie.name',
    flavorKey: 'variant.wee_ghostie.flavor',
    textureKey: 'haggis_wee_ghostie',
    modifiers: { damagePct: 0.18, moveSpeedPct: 0.08, maxHpFlat: -25 },
    unlock: { type: 'best_kills', required: 1500 },
    appearance: {
      accentStyle: 'wee_ghostie',
      palette: {
        outline: 0x2a2840,
        bodyDark: 0x5060a0,
        bodyLight: 0x8094c4,
        fur: 0xc4c8e0,
        snout: 0xe0b0c0,
        accent: 0x80e0ff,
      },
    },
  },
  {
    key: 'laird',
    nameKey: 'variant.laird.name',
    flavorKey: 'variant.laird.flavor',
    textureKey: 'haggis_laird',
    modifiers: { maxHpFlat: 30, moveSpeedPct: -0.12, damagePct: 0.10 },
    unlock: { type: 'total_gold_earned', required: 2500 },
    appearance: {
      accentStyle: 'laird',
      palette: {
        outline: 0x1a140a,
        bodyDark: 0x5a1a1a,
        bodyLight: 0x8a2a2a,
        fur: 0xa07060,
        snout: 0xd8b088,
        accent: 0x3a8830,
      },
    },
  },
  {
    // Glaswegian — DESIGN_IDEAS section 2 "fast, crit-on-dodge,
    // Limmy-bite banter register. Punisher." For the first cut the
    // identity is stats-shaped (glass cannon: big damage, fragile,
    // lean silhouette); Limmy-bite voice coverage ships in a later
    // banter pass to keep the EN↔SCS parity fence honest.
    key: 'glaswegian',
    nameKey: 'variant.glaswegian.name',
    flavorKey: 'variant.glaswegian.flavor',
    textureKey: 'haggis_glaswegian',
    modifiers: { damagePct: 0.18, moveSpeedPct: 0.05, maxHpFlat: -20 },
    unlock: { type: 'best_kills', required: 2000 },
    appearance: {
      accentStyle: 'glaswegian',
      palette: {
        outline: 0x0a0c12,
        bodyDark: 0x2a3540,
        bodyLight: 0x455868,
        fur: 0x6a7b88,
        snout: 0xc8a090,
        accent: 0xff5a00, // Glasgow tram orange — signature
      },
    },
  },
  {
    // Anticlockwise Haggis — wild haggis myth's second subspecies.
    // Per SCOTTISH_RESEARCH_DEEP §11.5, two subspecies of haggis are said
    // to exist with opposite-leg asymmetry; one circles hills clockwise,
    // the other anticlockwise. This variant mirrors the Drift sign with
    // no other stat changes: the bias pulls *left* instead of *right*.
    // Silhouette and combat profile are identical to classic; the twist
    // is pure muscle memory. Mountain-hare palette signals the subspecies
    // tell (silver coat vs. the classic gold).
    key: 'anticlockwise',
    nameKey: 'variant.anticlockwise.name',
    flavorKey: 'variant.anticlockwise.flavor',
    textureKey: 'haggis_anticlockwise',
    modifiers: { driftSignFlip: true },
    unlock: { type: 'victories', required: 5 },
    appearance: {
      accentStyle: 'none',
      palette: {
        outline: 0x2a2420,
        bodyDark: 0x5a4e44,
        bodyLight: 0x7d6f62,
        fur: 0x9f8e7e,
        snout: 0xbfa890,
        accent: 0xc0d4d8,
      },
    },
  },
  {
    // Cailleach — mythic elder. Slow, tanky, massive pickup radius,
    // strikes true (+8% crit — V2 added the field; the mythic-elder
    // fantasy is "every blow weighs", not "many blows").
    key: 'cailleach',
    nameKey: 'variant.cailleach.name',
    flavorKey: 'variant.cailleach.flavor',
    textureKey: 'haggis_cailleach',
    modifiers: {
      moveSpeedPct: -15,
      maxHpFlat: 10,
      pickupRadiusFlat: 35,
      critChancePct: 0.08,
    },
    unlock: { type: 'cursed_victories', required: 3 },
    appearance: {
      accentStyle: 'cailleach',
      palette: {
        outline: 0x0f1a12,
        bodyDark: 0x2a3d2e,
        bodyLight: 0x3a4f3a,
        fur: 0x4a5f4a,
        snout: 0x2a3d2e,
        accent: 0xd4d0c0,
      },
    },
  },
  {
    // V2 Track 1 — Doric Quinie. Aberdeenshire fisher-family stoic.
    // Stats per spec §2 with `startWithPassives` absorbed into
    // xpMultiplierPct (Arbroath Smokie starter flavour: +5% XP from
    // pickups). pickupRadiusFlat = +10 approximates spec's "+15%".
    // Accent art: a fisherman's bonnet tuft with a silver-blue
    // band — Aberdonian quine on the harbour wall. Mirrors the
    // tier-2 mantle's barley-ear sprig at body scale. Unlock:
    // first run completed without ever overlapping a healing circle
    // ("survive on what you caught yesterday").
    key: 'doric_quinie',
    nameKey: 'variant.doric_quinie.name',
    flavorKey: 'variant.doric_quinie.flavor',
    textureKey: 'haggis_doric_quinie',
    modifiers: {
      moveSpeedPct: -0.05,
      maxHpFlat: 8,
      pickupRadiusFlat: 10,
      damagePct: 0.05,
      xpMultiplierPct: 0.05,
    },
    unlock: { type: 'runs_without_healing', required: 1 },
    appearance: {
      accentStyle: 'doric_quinie',
      palette: {
        outline: 0x2a2418,
        bodyDark: 0x4a4030,
        bodyLight: 0x6a5a3a,
        fur: 0x8a7850,
        snout: 0xc8a580,
        accent: 0xd0d4e0,
      },
    },
  },
  {
    // V2 Track 2 — Peerie Shetlander. Norn-tinged Shetland dialect.
    // Stats per spec §2: +5% speed, -10 HP, +5% crit, -10% drift.
    // Cold-hazard resist is FLAVOUR-ONLY this ship — no cold-damage
    // concept exists in-codebase yet (see followups plan: reserved
    // for a future winter-biome initiative). Up Helly Aa passive is
    // similarly descoped to pure voice colour. Unlock: first run
    // where visited biomes ⊆ {loch, pine} ("the sea way home" — no
    // moor, no bog). Accent art: kelp wisps trailing from the
    // collar, a Norn-shore cue at body scale. Mirrors the tier-2
    // mantle's wave-glints.
    key: 'peerie_shetlander',
    nameKey: 'variant.peerie_shetlander.name',
    flavorKey: 'variant.peerie_shetlander.flavor',
    textureKey: 'haggis_peerie_shetlander',
    modifiers: {
      moveSpeedPct: 0.05,
      maxHpFlat: -10,
      critChancePct: 0.05,
      driftReductionPct: 0.10,
    },
    unlock: { type: 'runs_in_coastal_only', required: 1 },
    appearance: {
      accentStyle: 'peerie_shetlander',
      palette: {
        outline: 0x121e26,
        bodyDark: 0x1e3545,
        bodyLight: 0x2a4a5a,
        fur: 0x3e6275,
        snout: 0xa8b6c4,
        accent: 0xe0d8c8,
      },
    },
  },
  {
    // V2 Track 3 — Burns's Wee Beastie. Ayrshire. Stepped out of the
    // bard's "To a Mouse". Tiny, trembling, noble-hearted.
    // Stats per spec §2: -15 HP, +20% crit, +10% speed, +15% XP,
    // sprite scale 0.85×. Starter passive "A Red, Red Rose"
    // (thistle-bloom heal on crit) is descoped to pure voice flavour
    // this ship — no startWithPassives infra exists (see followups).
    // Unlock tightened via E1 M2 T11 (2026-04-24) — now gated on a
    // full-evo victory inside a Burns Night window (Jan 18–Feb 1).
    // Honours the bard in the calendar sense, not just the gameplay
    // sense. The `disableSeasonalEvents` opt-out collapses the gate
    // to "impossible" by design — players who silence the season
    // trade this unlock for calmer runs.
    key: 'burns_wee_beastie',
    nameKey: 'variant.burns_wee_beastie.name',
    flavorKey: 'variant.burns_wee_beastie.flavor',
    textureKey: 'haggis_burns_wee_beastie',
    modifiers: {
      moveSpeedPct: 0.10,
      maxHpFlat: -15,
      critChancePct: 0.20,
      xpMultiplierPct: 0.15,
      spriteScale: 0.85,
    },
    unlock: { type: 'burns_night_full_evo', required: 1 },
    appearance: {
      accentStyle: 'none',
      palette: {
        outline: 0x3a2418,
        bodyDark: 0x6a4e38,
        bodyLight: 0xa08060,
        fur: 0xb89a78,
        snout: 0xd4c0a0,
        accent: 0xf0e4c8,
      },
    },
  },
  {
    // Witch's Hare — Isobel Gowdie's confession (Auldearn, 1662). She
    // testified that she would shape-shift into a hare reciting "I sall
    // gae intill ane haire / With sorrow and sych and meikle care, /
    // And I sall gae in the Devillis nam, / Ay quhill I com hom againe."
    // Refs: SCOTTISH_RESEARCH.md §1.5 + SCOTTISH_RESEARCH_DEEP.md §22.9.
    //
    // Stats — small, fast, witch-eyed: hare-quick speed, reduced drift
    // (hare bodies bank tight), modest crit (the witch's eye sees true),
    // tiny sprite scale (sma' siller). The "invincible hop" dash from
    // DESIGN_IDEAS §1 is descoped to pure speed flavour for the first
    // ship; a dash-extension hook remains a future feature.
    //
    // Unlock — 5 cursed_victories. Cailleach owns the same gate at 3;
    // witch_hare sits at 5 ("five trials survived earns the hare-form
    // for keeps"). Same condition, harder threshold — variant ladder
    // tightens past the elder hag rather than minting a new gate type.
    key: 'witch_hare',
    nameKey: 'variant.witch_hare.name',
    flavorKey: 'variant.witch_hare.flavor',
    textureKey: 'haggis_witch_hare',
    modifiers: {
      moveSpeedPct: 0.10,
      maxHpFlat: -12,
      driftReductionPct: 0.15,
      critChancePct: 0.08,
      spriteScale: 0.92,
    },
    unlock: { type: 'cursed_victories', required: 5 },
    appearance: {
      accentStyle: 'none',
      palette: {
        // Mountain-hare silver with russet undertones — Auldearn winter
        // pelt. Heather-green accent for the witch-eye gleam.
        outline: 0x1a1812,
        bodyDark: 0x4a443a,
        bodyLight: 0x6e6657,
        fur: 0x9a8e7e,
        snout: 0xc8b4a0,
        accent: 0x6a8848,
      },
    },
  },
  {
    // Wild Living World Initiative (2026-05-11) — Selkie. Hebridean
    // shape-shifter who slips between haggis and seal forms on every
    // dash edge. The mechanic is run-shaping rather than damage-shaping:
    // form modifiers are small per-axis nudges (see
    // `getSelkieFormModifiers`) so the run can be played from either
    // form. Voice register: Hebridean-tinged. Unlock keeps the base-
    // line "first run completed in coastal biomes" gate the Peerie
    // Shetlander already uses, but at higher threshold so the
    // variant ladder stays meaningfully stepped.
    key: 'selkie',
    nameKey: 'variant.selkie.name',
    flavorKey: 'variant.selkie.flavor',
    textureKey: 'haggis_selkie',
    modifiers: {
      // The stat profile is intentionally close to classic — the
      // dual-form is where the mechanic lives, not the variant card.
      // A small drift reduction signals "Hebridean composure" without
      // skewing the baseline.
      driftReductionPct: 0.08,
      pickupRadiusFlat: 8,
    },
    unlock: { type: 'runs_in_coastal_only', required: 2 },
    appearance: {
      accentStyle: 'none',
      palette: {
        // Wet-stone grey with a kelp-green accent — silkie-coat read.
        outline: 0x10171a,
        bodyDark: 0x2a3540,
        bodyLight: 0x44525e,
        fur: 0x6d7d8a,
        snout: 0xb8a890,
        accent: 0x4a8a7c,
      },
    },
  },
  {
    // Morningside Haggis — comic-posh Edinburgh variant.
    // Affected near-RP voice; cultivated disdain for the rough
    // business of survival. Stats unchanged from classic: the
    // character is entirely banter. Refs: SCOTTISH_RESEARCH_DEEP
    // §14.3 (Edinburgh vernacular + Morningside social register).
    // Palette: warm Edinburgh New Town stone (ashlar grey with
    // cream), sage-green accent for the pearl brooch detail.
    // Unlock: survive 15 minutes in a single run — Morningside
    // propriety demands composure, not speed.
    key: 'morningside',
    nameKey: 'variant.morningside.name',
    flavorKey: 'variant.morningside.flavor',
    textureKey: 'haggis_morningside',
    modifiers: {},
    unlock: { type: 'best_time', required: 900 },
    appearance: {
      accentStyle: 'morningside',
      palette: {
        outline: 0x1a1814,
        bodyDark: 0x6a6058,
        bodyLight: 0x948a80,
        fur: 0xc0b8ac,
        snout: 0xd4a88a,
        accent: 0xb8c8a8, // muted sage for the pearl-brooch accent
      },
    },
  },
  {
    // Drouthy Haggis — drunk on the moor, drift doubled by the drams.
    // Starts the run with a full Whisky Breath charge already banked
    // (flask half-drunk before the first bell). The drift amplification
    // means the moor is already spinning; every kill banks more whisky
    // momentum on top. Refs: SCOTTISH_RESEARCH_DEEP §13.6 (whisky as
    // cultural libation + "drouthy" Scots — thirsty).
    // Palette: whisky-amber — dark-amber body, golden fur, bright hip-
    // flask accent. Kilt: deep red + amber gold (traditional Highland).
    // Unlock: 1 200 lifetime gold — spent most of it at the pub.
    key: 'drouthy',
    nameKey: 'variant.drouthy.name',
    flavorKey: 'variant.drouthy.flavor',
    textureKey: 'haggis_drouthy',
    modifiers: { driftAmplifyPct: 1.0 },
    startWhiskyStacks: 8,
    unlock: { type: 'total_gold_earned', required: 1200 },
    appearance: {
      accentStyle: 'drouthy',
      palette: {
        outline: 0x3a2810,
        bodyDark: 0x7a4018,
        bodyLight: 0xc87820,
        fur: 0xd4a060,
        snout: 0xe8b070,
        accent: 0xf0c828, // bright whisky-gold hip flask
      },
    },
  },
];

export const VARIANT_KEYS = VARIANTS.map((variant) => variant.key) as VariantKey[];

const VARIANT_BY_KEY: Record<VariantKey, VariantDef> = VARIANTS.reduce((acc, variant) => {
  acc[variant.key] = variant;
  return acc;
}, {} as Record<VariantKey, VariantDef>);

export function isVariantKey(value: unknown): value is VariantKey {
  return typeof value === 'string' && value in VARIANT_BY_KEY;
}

export function coerceVariantKeys(values: unknown): VariantKey[] {
  if (!Array.isArray(values)) return [];

  const coerced = new Set<VariantKey>();
  for (const value of values) {
    if (isVariantKey(value)) coerced.add(value);
  }
  return VARIANT_KEYS.filter((key) => coerced.has(key));
}

export function getVariantByKey(key: VariantKey | string | null | undefined): VariantDef {
  if (!key || !isVariantKey(key)) return VARIANT_BY_KEY[DEFAULT_VARIANT_KEY];
  return VARIANT_BY_KEY[key];
}

export function meetsVariantUnlockCondition(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): boolean {
  switch (variant.unlock.type) {
    case 'default':
      return true;
    case 'best_time':
      return progress.bestTime >= variant.unlock.required;
    case 'best_kills':
      return progress.bestKills >= variant.unlock.required;
    case 'total_gold_earned':
      return progress.totalGoldEarned >= variant.unlock.required;
    case 'victories':
      return progress.victories >= variant.unlock.required;
    case 'cursed_victories':
      return (progress.cursedVictories ?? 0) >= variant.unlock.required;
    case 'runs_without_healing':
      return (progress.runsWithoutHealing ?? 0) >= variant.unlock.required;
    case 'runs_in_coastal_only':
      return (progress.runsInCoastalOnly ?? 0) >= variant.unlock.required;
    case 'runs_with_all_evolutions':
      return (progress.runsWithAllEvolutions ?? 0) >= variant.unlock.required;
    case 'burns_night_full_evo':
      return (progress.burnsNightFullEvoRuns ?? 0) >= variant.unlock.required;
  }
}

export function isVariantUnlocked(variant: VariantDef, progress: VariantProgressSnapshot): boolean {
  if (progress.unlockedVariants?.includes(variant.key)) return true;
  return meetsVariantUnlockCondition(variant, progress);
}

export function getVariantUnlockProgress(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): VariantUnlockProgress | null {
  switch (variant.unlock.type) {
    case 'default':
      return null;
    case 'best_time':
      return createUnlockProgress(
        t('variant.unlock.survive'),
        progress.bestTime,
        variant.unlock.required,
        formatClockTime(progress.bestTime),
        formatClockTime(variant.unlock.required)
      );
    case 'best_kills':
      return createUnlockProgress(
        t('variant.unlock.best_kills'),
        progress.bestKills,
        variant.unlock.required,
        `${progress.bestKills}`,
        `${variant.unlock.required}`
      );
    case 'total_gold_earned':
      return createUnlockProgress(
        t('variant.unlock.total_gold'),
        progress.totalGoldEarned,
        variant.unlock.required,
        `${progress.totalGoldEarned}`,
        `${variant.unlock.required}`
      );
    case 'victories':
      return createUnlockProgress(
        t('variant.unlock.victories'),
        progress.victories,
        variant.unlock.required,
        `${progress.victories}`,
        `${variant.unlock.required}`
      );
    case 'cursed_victories': {
      const cv = progress.cursedVictories ?? 0;
      return createUnlockProgress(
        t('variant.unlock.cursed_victories'),
        cv,
        variant.unlock.required,
        `${cv}`,
        `${variant.unlock.required}`
      );
    }
    case 'runs_without_healing': {
      const rh = progress.runsWithoutHealing ?? 0;
      return createUnlockProgress(
        t('variant.unlock.runs_without_healing'),
        rh,
        variant.unlock.required,
        `${rh}`,
        `${variant.unlock.required}`
      );
    }
    case 'runs_in_coastal_only': {
      const rc = progress.runsInCoastalOnly ?? 0;
      return createUnlockProgress(
        t('variant.unlock.runs_in_coastal_only'),
        rc,
        variant.unlock.required,
        `${rc}`,
        `${variant.unlock.required}`
      );
    }
    case 'runs_with_all_evolutions': {
      const re = progress.runsWithAllEvolutions ?? 0;
      return createUnlockProgress(
        t('variant.unlock.runs_with_all_evolutions'),
        re,
        variant.unlock.required,
        `${re}`,
        `${variant.unlock.required}`
      );
    }
    case 'burns_night_full_evo': {
      const bn = progress.burnsNightFullEvoRuns ?? 0;
      return createUnlockProgress(
        t('variant.unlock.burns_night_full_evo'),
        bn,
        variant.unlock.required,
        `${bn}`,
        `${variant.unlock.required}`
      );
    }
  }
}

export function formatVariantModifierSummary(variant: VariantDef): string {
  const parts: string[] = [];
  const { modifiers } = variant;
  const pctInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    pct: Math.round(value * 100),
  });
  const flatInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    val: value,
  });

  if (modifiers.moveSpeedPct) parts.push(t('variant.summary.speed', pctInterp(modifiers.moveSpeedPct)));
  if (modifiers.maxHpFlat) parts.push(t('variant.summary.hp', flatInterp(modifiers.maxHpFlat)));
  if (modifiers.armorFlat) parts.push(t('variant.summary.armor', flatInterp(modifiers.armorFlat)));
  if (modifiers.pickupRadiusFlat) parts.push(t('variant.summary.pickup', flatInterp(modifiers.pickupRadiusFlat)));
  if (modifiers.xpMultiplierPct) parts.push(t('variant.summary.xp', pctInterp(modifiers.xpMultiplierPct)));
  if (modifiers.damagePct) parts.push(t('variant.summary.dmg', pctInterp(modifiers.damagePct)));
  if (modifiers.driftReductionPct) parts.push(t('variant.summary.drift', pctInterp(modifiers.driftReductionPct)));
  if (modifiers.cooldownReductionPct) parts.push(t('variant.summary.cdr', pctInterp(modifiers.cooldownReductionPct)));
  if (modifiers.critChancePct) parts.push(t('variant.summary.crit', pctInterp(modifiers.critChancePct)));
  if (modifiers.spriteScale && modifiers.spriteScale !== 1) {
    // Shown as an integer percentage off baseline: 0.85 → -15%, 1.15 → +15%.
    const delta = modifiers.spriteScale - 1;
    parts.push(t('variant.summary.size', pctInterp(delta)));
  }
  if (modifiers.driftSignFlip) parts.push(t('variant.summary.drift_flip'));
  if (modifiers.driftAmplifyPct) parts.push(t('variant.summary.drift_amplify', { pct: Math.round(modifiers.driftAmplifyPct * 100) }));

  return parts.length > 0 ? parts.join('  |  ') : t('variant.summary.baseline');
}

export function formatVariantUnlockText(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): string {
  if (isVariantUnlocked(variant, progress)) return t('variant.unlock.ready');

  const unlockProgress = getVariantUnlockProgress(variant, progress);
  if (!unlockProgress) return t('variant.unlock.ready');

  return `${unlockProgress.label}: ${unlockProgress.currentText} / ${unlockProgress.requiredText}`;
}

export function formatRunVariantLabel(variant: VariantDef): string {
  // Check if the variant has ANY modifiers before calling the summary helper.
  // Comparing against a literal string would break the moment summary copy
  // changes or a locale translates "Baseline stats" to something else.
  const { modifiers } = variant;
  const hasModifiers =
    !!modifiers.moveSpeedPct
    || !!modifiers.maxHpFlat
    || !!modifiers.armorFlat
    || !!modifiers.pickupRadiusFlat
    || !!modifiers.xpMultiplierPct
    || !!modifiers.damagePct
    || !!modifiers.driftReductionPct
    || !!modifiers.cooldownReductionPct
    || !!modifiers.critChancePct
    // spriteScale defaults to 1; anything ≠ 1 counts as a real mod so
    // the variant panel shows the modifier summary line instead of
    // "Baseline stats" for a variant that only differs visually.
    || (!!modifiers.spriteScale && modifiers.spriteScale !== 1)
    || !!modifiers.driftSignFlip
    || !!modifiers.driftAmplifyPct;
  const name = t(variant.nameKey);
  if (!hasModifiers) return name;
  return `${name}  |  ${formatVariantModifierSummary(variant)}`;
}

function createUnlockProgress(
  label: string,
  currentValue: number,
  requiredValue: number,
  currentText: string,
  requiredText: string
): VariantUnlockProgress {
  const current = Math.min(Math.max(0, currentValue), requiredValue);
  const required = Math.max(1, requiredValue);

  return {
    label,
    current,
    required,
    currentText,
    requiredText,
    ratio: Math.min(1, current / required),
  };
}


