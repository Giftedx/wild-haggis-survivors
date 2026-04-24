# V2 — variants pack followups

> **STATUS:** Partial. Updated 2026-04-24 after shipping all three tracks.
>
> - Track 1 Doric Quinie: `b49fd40` + `487221b`
> - Track 2 Peerie Shetlander: `f9f3b0c` + `24f4044`
> - Track 3 Burns's Wee Beastie: `314d7de` + `bf83f5e`
>
> Code is live. Remaining items are **review blockers** (dialect + Burns-edition authenticity), **deferred polish** (accent art, field-name snapshot adapter), and **placeholder-unlock tightening** (Burns, once E1 ships).

Spec: `docs/superpowers/specs/2026-04-23-haggis-variants-pack-design.md`. Plan: `docs/superpowers/plans/2026-04-23-haggis-variants-pack.md`.

---

## Review blockers (must close before final cohort sign-off)

### Doric Quinie native-speaker review

- 24 EN + 24 SCS lines + name + flavor + deed copy shipped as draft.
- Per `CULTURAL_SENSITIVITIES_RESEARCH.md §4.3`: Northeast Scotland (Aberdeenshire / Moray / Angus) native reviewer required.
- If review clean: close. If drift flagged: patch lines in place; parity + wireup tests auto-fence.

### Peerie Shetlander Shetlandic review

- 24 EN + 24 SCS lines in Shetlandic (du / dee / peerie / voe / skerry / mirry) shipped as draft.
- Shetland ForWirds is the named reviewer body (Shetlandic now has its own ISO 639-3 code `scz` — treat with care).
- If review confirms: close. If authenticity drift: patch in place.

### Burns's Wee Beastie Burns-edition audit

- 24 EN + 24 SCS lines drafted from well-known Burns poems (To a Mouse, A Man's a Man for A' That, Scots Wha Hae, Auld Lang Syne, A Red Red Rose, Tam o' Shanter, Address to a Haggis).
- Spec §5 requires every direct quotation to be verified against *The Canongate Burns*. No paraphrase attributed directly to Burns if not his wording.
- **Audit checklist** — confirm exact wording + spelling + line-break for each direct quote. Modernised paraphrases OK if clearly flagged (italics reserved for direct Burns wording in future UI work).

---

## Deferred polish (non-blocking)

### Accent art for all three variants

- All shipped with `accentStyle: 'none'`. Kilt + body palette carry visual identity. Not a blocker.
- Spec proposed:
  - Doric Quinie: "longer fisherman's bonnet tuft; upright posture."
  - Peerie Shetlander: "wisps of kelp at the collar; slight lean into wind."
  - Burns's Wee Beastie: already ships at `spriteScale: 0.85` (distinct silhouette); no additional accent cue.
- Implementation when picked up: new `HaggisAccentStyle` enum entries + BootScene render blocks.

### MenuScene `VariantProgressSnapshot` field-name adapter

- MenuScene passes `this.saveData` (SaveData type) directly as the snapshot. SaveData uses long field names (`runsWithoutHealingCircleCompleted`, `runsInCoastalOnlyCompleted`, `runsWithAllEvolutionsCompleted`, `cursedVictoriesCompleted`) but VariantProgressSnapshot uses short names (`runsWithoutHealing`, `runsInCoastalOnly`, `runsWithAllEvolutions`, `cursedVictories`). Structural read returns undefined → locked-progress strip shows "0/1" regardless of real count.
- All current unlock thresholds are 1, so the strip flips to "earned" on first triggering run — effectively invisible. But future unlocks at higher thresholds will show stale progress.
- Fix: build a proper snapshot in `MenuScene.renderVariantPanel` the same way `applyRunSummary` does (post-cohort commit `24f4044` established the pattern via `runEndSnapshot`).

### Starter passives (Arbroath Smokie, Up Helly Aa, A Red Red Rose)

- Spec §2 described starter passive equivalents for all three variants. V2 ships them as **flavour-only** — their stat intent is absorbed into existing `VariantModifier` scalars (Arbroath → xpMultiplierPct +5%; Up Helly Aa → no mechanic, pure voice; A Red Red Rose → no mechanic, pure voice).
- Full implementation requires a new `VariantDef.startWithPassives?: string[]` field + runStartModifiers branch calling `applyPassiveEffect` the same way `lucky_start` already does. Clean extension; not V2 scope.

---

## Placeholder-unlock tightening

### Burns's Wee Beastie → Burns Night (E1 dep)

- V2 ships Burns with `runs_with_all_evolutions` (victory + all 7 evolvable weapons evolved in a single run). Threshold is exported as `BURNS_EVOLUTION_THRESHOLD` in `src/utils/save.ts`.
- Spec §2 called for "Complete Burns Night event (E1 flagship) with 100% weapon-evolution completion."
- When E1 Seasonal Events (`docs/superpowers/plans/2026-04-23-seasonal-events-burns-night.md`) ships: add a check against the in-progress Burns-Night window alongside the existing evo-count check. Either requirement extends the `VariantUnlockCondition` union (e.g. `runs_with_all_evolutions_in_burns_night`) or the existing counter gains a secondary boolean gate on the date.
- Telemetry proxy for tightening: `gameplay.runsWithAllEvolutionsCompleted` shows how often this threshold is actually hit once E1 lands — if it's already rare, additional Burns-Night gating may over-constrain and should be relaxed to a flat full-evo or Burns-Night-alone.

### Cold-hazard resist for Peerie Shetlander (currently flavour-only)

- Shipped as pure voice colour — no cold-damage concept exists in-codebase.
- Real implementation options (in increasing scope):
  1. Tag bog's implied chill + pine's ghost-wraith hits as "cold"; reduce those for Peerie. Low-lift mechanical bite.
  2. Introduce cold frost-zone hazards (parallel to lava). Winter-biome DLC scope.
- Not required to sign off V2 cohort. Revisit when a cold mechanic lands.

---

## Close criteria

V2 is **final** (not just "code shipped") when:

- [x] Three variants live in the picker with correct stats, palette, banter, and unlock telemetry.
- [x] Three deeds fire at the right thresholds and persist across saves.
- [ ] Doric native-speaker review complete.
- [ ] Shetlandic native-speaker review complete.
- [ ] Burns-edition audit complete.
- [ ] Telemetry (at least one month of save data) shows each variant's pick rate ≥ 3% (spec §7 kill-criterion).
