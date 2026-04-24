# V2 — variants pack followups

> **STATUS:** Open. Created 2026-04-24 after shipping V2 Track 1 (Doric Quinie) in commits `b49fd40` + `487221b`.
>
> Tracks 2 (Peerie Shetlander) and 3 (Burns's Wee Beastie) pause pending the resolutions below. Spec: `docs/superpowers/specs/2026-04-23-haggis-variants-pack-design.md`. Plan: `docs/superpowers/plans/2026-04-23-haggis-variants-pack.md`.

---

## Open on all future tracks

### Native-speaker banter review for Doric Quinie

- Track 1 banter shipped as *draft*. 24 EN + 24 SCS lines for `doric_quinie` across six variant-scoped pools (low_hp, level_up, first_blood, kill_streak, recover, idle), plus name + flavor + deed copy.
- Merge-blocker per `CULTURAL_SENSITIVITIES_RESEARCH.md §4.3` — Northeast Scotland (Aberdeenshire / Moray / Angus) native reviewer required before V2 is considered "shipped" as a cohort.
- If review comes back clean: close this followup.
- If review flags authenticity drift: patch lines in place; tests auto-fence.

### Accent art for Doric Quinie

- V2 T1 shipped with `accentStyle: 'none'`. BootScene adds the accent cue per variant; Doric has none.
- Spec §2 called for "slightly longer 'fisherman's bonnet' tuft; upright posture." Implement as a new `HaggisAccentStyle: 'doric_quinie'` + BootScene render block.
- Not blocking V2 cohort ship — kilt + body palette already read distinct from other variants. Cosmetic depth.

### MenuScene snapshot lacks `runsWithoutHealing`

- `MenuScene.renderVariantPanel` passes `this.saveData` directly as `VariantProgressSnapshot`. `SaveData.runsWithoutHealingCircleCompleted` doesn't match the snapshot field name `runsWithoutHealing`, so the locked-progress strip reads "0/1" regardless of true count.
- Doric's threshold is 1, so the strip flips to "earned" on first no-heal win — effectively invisible. But Peerie/Burns (if they also have longer thresholds) would show stale "0/N".
- Fix before Track 2 lands if any condition type uses a required >1: either map fields through an adapter in `MenuScene`, or align snapshot field names to SaveData long-form.
- Same latent issue pre-existed for `cursedVictoriesCompleted` → `cursedVictories` (see variants.ts:342 snapshot field naming). Fixing should standardise.

---

## Track 2 — Peerie Shetlander (blocked)

### Prerequisite: define "cold source" for cold-hazard resist

- Spec §2: "Cold-hazard resist 50% — northern constitution."
- Current codebase has **no cold-damage concept**. Damage sources are lava (hot), slick (slow, not damage), fog (pickup-radius debuff), enemies (neutral), bosses (neutral). No hazard carries a `"cold"` tag.
- Three options, in order of ship effort:
  1. **Flavour-only** (cheapest): ship `coldHazardResistPct` as a declared `VariantModifier` field with no runtime consumer. Note in variant flavor. Reserved for future winter biome.
  2. **Tag-the-bogs** (low-lift mechanical): classify bog's implied chill + pine's spectral-ghost hits as "cold", reduce their damage 50% for Peerie. Requires a `coldDamageMult` read in `hazardDamage.ts` + per-enemy tagging. Spec-adjacent but ships a real mechanic.
  3. **Full cold hazard system** (large scope): introduce a cold-biome frost zone type paralleling lava. Winter-map DLC scope. Out of V2.
- **Recommendation:** option 1 for V2 ship, note as technical debt for future winter-biome initiative.

### Prerequisite: biome-visited tracking for "coastal-exclusive" unlock

- Spec unlock: "Complete a run in the coastal/loch biome cluster exclusively (never enter moor)."
- "Coastal" isn't a shipped biome. Shipped biomes: `bog`, `loch`, `pine`, `heather`. "Moor" isn't one either — it's the ambient terrain between biomes (see `BiomeManager`).
- Two questions:
  1. Which biomes count as "coastal"? Propose: `loch` + `pine` (pine grows on Scottish islands; loch is water). Reject `bog` + `heather` as moor-adjacent.
  2. New per-run telemetry: `biomesVisited: BiomeId[]`. Set added on `onBiomeEntered`, read at run-end. Persist as field on `RunHistoryEntry` (not lifetime save) for replay-exact reconstruction; lifetime counter `runsInCoastalOnlyCompleted` increments when `biomesVisited ⊆ {loch, pine}`.
- Save schema bump v10 → v11 for the new field + per-entry field. Migration pure bump; retroactive seed impossible (no pre-v11 biome telemetry).
- Decision required before coding: which biomes map to "coastal"?

### Peerie stats TODO

- Propose using existing `VariantModifier` fields where possible:
  - `+5% speed` → `moveSpeedPct: 0.05`
  - `-10 HP` → `maxHpFlat: -10`
  - `+5% crit` → **no existing field**. Either add `critChancePct` modifier (requires Player.critChance read site) or defer to flavor-only via passive-equivalent (similar approach to Doric's xpMultiplierPct for Arbroath Smokie).
  - `-10% drift` → `driftReductionPct: 0.10`
  - Cold resist → see above.

### Peerie banter

- 24 EN + 24 SCS in Shetlandic. Spec flags: "du / dee" (thou/thee), "peerie" (small), "voe" (inlet), "mirry" (happy), "skerry" (rocky outcrop). Shetlandic has its own ISO 639-3 code (`scz`) — treat respectfully.
- Shetlandic native speaker consultation is a merge-blocker (spec §5). Shetland ForWirds is the named reviewer body.

---

## Track 3 — Burns's Wee Beastie (blocked on Track 2 + E1)

### Prerequisite: `VariantModifier.spriteScale` + Player hitbox regression

- Spec §2: "Sprite scale 0.85× — literally wee."
- Requires extending `VariantModifier` with `spriteScale?: number` (default 1.0), reading it in `Player.onLevelUp` (where circle-body sizing already handles scale via `setCircle` unscaled-radius pattern per CLAUDE.md Phaser gotcha).
- Regression test: verify at 0.85× scale, all weapons, hazards, and enemies still hit correctly. `Player.test.ts` covers hitbox math already — extend to parameterise by spriteScale.

### Prerequisite: `+20% crit` stat

- Same as Peerie — needs new `critChancePct` VariantModifier field + Player read site. Both tracks share this; resolve once, both benefit.

### Prerequisite: E1 Seasonal Events + Burns Night

- Spec unlock: "Complete Burns Night event (E1 flagship) with 100% weapon-evolution completion."
- E1 (`docs/superpowers/plans/2026-04-23-seasonal-events-burns-night.md`) is a draft, not shipped.
- Option A: ship Burns with a **placeholder unlock** — e.g. "Complete a run with every weapon evolved" alone (no Burns-Night gating). Deed flavor still references Burns.
- Option B: hold Track 3 until E1 lands. Follows spec literally.
- **Recommendation:** option A with a note to tighten the unlock when E1 ships. Keeps Track 3 shippable as part of V2 cohort.

### Burns quotation audit

- Every direct quote verified against *The Canongate Burns* before merge. Merge-blocker per spec §5.
- Modernised paraphrase labelled as such (italics reserved for direct Burns wording).

---

## Next step

When the above decisions land (cold-resist semantics, coastal biome set, crit field, Burns unlock strategy), unblock the Track 2 + 3 plan tasks and proceed. Ideal order: **resolve crit field once → Track 2 (Peerie) → Track 3 (Burns)** so the shared crit-field work ships once.
