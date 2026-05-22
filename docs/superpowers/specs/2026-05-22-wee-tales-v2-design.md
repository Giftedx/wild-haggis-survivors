# Wee Tales v2 — variant-voiced lines + `{name}` slot

**Date:** 2026-05-22
**Initiative:** Open candidate from `HUGE_INITIATIVES_MASTER_PLAN.md` "Wee Tales" follow-up — variant-voiced lines (Cailleach / Glaswegian / Doric / Burns) and `{name}` slot substitution against the existing run-name epigraph.
**Status:** Draft — implementation immediately after.
**Word count:** ~2,100
**Prerequisite:** Wee Tales v1 shipped 2026-05-11 in master (catalogue + seed-deterministic picker + EN+SCS parity fence + e2e in `e2e/wee-tale.spec.ts`).

---

## 1. Problem statement

Wee Tales v1 closes every run with a single italic prose epitaph picked from a 17-template catalogue tagged by `mode × time-bucket × boss × ironmoor × cursed × post_bell × biome × variant`. The `WeeTaleTag` union already enumerates every `VariantKey`; `computeWeeTaleTags` already adds the run's variant key as a tag. The infrastructure is complete — what's missing is content authoring that uses it.

Today, the catalogue contains zero templates that `requires: ['cailleach']` (or any other variant). Every run renders one of the generic fallbacks plus, at most, a boss / time-bucket / ironmoor / cursed flavour leaf. The 15 variants in `src/data/variants.ts` are visually distinct and unlock-gated — but the wee tale that closes their run is voice-neutral.

Two consequences:

1. **The run-name epigraph and the wee tale don't speak to each other.** The epigraph above the wee tale already addresses the haggis by name ("Here lies {name}." / "{name} walked home."). The wee tale sits one panel below it but never names the haggis — so the most personal moment in the run (closing line) doesn't echo the personal cue (the run name) that was just shown.
2. **Variant identity stops at the gameplay stat sheet.** A Cailleach run feels different *in play* (slow, tanky, big pickup radius). It does not feel different *in closing prose*. The 30+ second run-end screen — the moment the player carries from the run to the next — is the same hearth-grave prose every haggis gets.

### Player outcome

After Wee Tales v2 ships:
- Picking the Cailleach / Glaswegian / Doric Quinie / Burns's Wee Beastie variant means the closing line lands in that voice register. The mountain crone speaks like an elder; the Glaswegian gets a Limmy-bite send-off; the Doric Quinie hears the harbour wall; the Burns's Wee Beastie closes with a contextually justified Burns citation.
- The closing prose addresses the haggis by their run-name on the lines that benefit from it. The epigraph and the tale form a small two-beat couplet ("Here lies Lachlan Beag." → "*Lachlan laid doon by the heather. The moor remembers.*") instead of two unconnected lines.
- Other variants (classic, Wild Haggis, Anticlockwise, Witch's Hare, Peerie Shetlander, Selkie, etc.) continue to land on the generic Hearth fallbacks — no regression. The variant-voiced lines are additive, not replacements.

---

## 2. Design risks

**Risk 1 — Unfilled `{name}` slot rendering as literal `{name}` text.**
The picker's `buildTemplateParams` doesn't currently populate a `name` slot. Adding `{name}` to templates without ensuring the slot is always filled would render literal "{name}" in production. The `i18n.locale.test.ts` placeholder-parity fence may catch some cases but it tests EN↔SCS shape, not slot-fill at runtime.
**Mitigation:** introduce a synthetic `has_name` tag in `computeWeeTaleTags` that's set when `ctx.runName.length > 0`. Every template that uses `{name}` adds `has_name` to its `requires` list. `buildTemplateParams` populates `name` unconditionally from `ctx.runName`. Templates without `has_name` never see `{name}` and never reference it. The picker's existing tag-filter is the gate.

**Risk 2 — Variant-voiced lines fall through to generic fallbacks because tier-3 specificity weighting routes elsewhere.**
A Cailleach run that kills the Taxman has both `[victory, cailleach]` (variant-voiced tier-2) and `[victory, taxman]` (generic taxman-kill tier-2) in its pool. The picker weights by 4^specificity, so both compete at equal weight. The Cailleach-Taxman tier-3 `[victory, cailleach, taxman]` line resolves the conflict — but only if it's authored.
**Mitigation:** every variant gets at least one tier-3 template (variant + mode + boss-tag-or-post-bell), so memorable variant runs land on a memorable variant-voiced line. The catalogue laid out below covers the four most-likely memorable contexts: epic, post-bell, taxman-kill, short-death.

**Risk 3 — EN→SCS parity fence requires SCS author for Doric + Burns; cultural review is open (Q5).**
The EN→SCS parity fence at `src/core/i18n.locale.test.ts` scoped to `ui.weeTale.*` (per CLAUDE.md i18n parity entry) will fail CI if a new EN leaf lacks a Scots translation. Doric + Burns voice content needs SCS overlay authored by the same hand that wrote the EN.
**Mitigation:** the SCS overlay for Doric/Burns lines uses the *same-text* fallback the existing wee-tale catalogue uses for content that's already-Scots-flavoured (verified — search `i18n.scs/ui.ts` for the existing wee-tale entries; many are EN-text-passed-through because the prose is already vernacular). For lines that ARE distinct register (Cailleach Gaelic-inflected, Glaswegian Limmy-bite), author the SCS leaf to match the register's Scots phrasing where one exists, else mirror EN. Cultural review (Q5) remains open — the live-build splash + README disclosure cover the unaudited posture per the 2026-05-10 resolution.

**Risk 4 — Burns citational rule creates legal/reputational surface.**
`VOICE_CARD.md` §"Burns's voice (citational)" rule: "any Burns quotation must be contextually justified (a mouse scurries by → 'wee, sleekit, cow'rin, tim'rous beastie…'). Never random." A wee tale that fires for any `burns_wee_beastie` death without context justifies the citation by the variant choice itself — the player ELECTED Burns's Wee Beastie. The Burns quotation is justified by the variant being the bard's own beastie.
**Mitigation:** every Burns citation in the catalogue is either verbatim or near-verbatim from a published Burns line (Kinsley reference where ambiguous). The citation is wrapped in `*italics*` in the i18n string to signal "this is a quotation" — readers see it as citational, not as the haggis's voice. `docs/C2_BURNS_PROVENANCE.md` already tracks Burns sourcing; entries from this spec append to that file at ship time.

**Risk 5 — Specificity tier-3 weighting accidentally starves generic fallbacks.**
Adding 18 new templates concentrated at tier-2 and tier-3 could mean every non-variant run still lands on generic fallbacks, but every variant run *always* lands on a variant line — even short swarm-death runs that would feel kinder with a soft generic line. The `4^specificity` curve is steep; tier-2 (~16) decisively beats tier-1 (~4).
**Mitigation:** every variant gets ONE tier-2 fallback (`[variant, death]` or `[variant, victory]`, plain) so even a short swarm-death by Cailleach lands on a kindly Cailleach baseline rather than a tier-3 sharp-edged line that's mistuned for the moment. The catalogue lays this out explicitly below.

**Risk 6 — Witch's Hare + Selkie + Peerie Shetlander run-end UX feels neglected.**
The four spec'd variants don't cover the full 15-strong roster. Players running Witch's Hare ship without a variant-voiced send-off. The contract has to be intelligible: variant voice is reserved for the four voice registers documented in `VOICE_CARD.md` (Cailleach + Glaswegian shipped; Doric + Burns candidate/citational). The other 11 variants are stat-shaped, not voice-shaped.
**Mitigation:** ship-time entry in CLAUDE.md mechanic table notes that wee-tale voice coverage is one-to-one with VOICE_CARD voice registers. Future voice registers (Hebridean for Selkie, etc.) land alongside their VOICE_CARD entries, not by stand-alone wee-tale authoring.

---

## 3. Implementation map

### Files (all changes additive — no rewrites)

#### Pure helper

**`src/utils/weeTale.ts`** — three additive changes:

1. Extend `WeeTaleContext` with `readonly runName?: string`.
2. Extend `WeeTaleTag` union with the literal `'has_name'`.
3. Extend `computeWeeTaleTags`:
   ```ts
   if (typeof ctx.runName === 'string' && ctx.runName.length > 0) {
     tags.add('has_name');
   }
   ```
4. Extend `buildTemplateParams` to populate `name` from `ctx.runName` unconditionally (the `has_name` tag gates which templates see the slot; the param itself is safe to always include).
5. Append 18 new templates to `WEE_TALE_TEMPLATES` (full text below in §4).

No rewrites: the existing 17 templates stay verbatim; the tagger and picker are unchanged except for the additions above; the `buildTemplateParams` change is one new field.

#### Scene wire

**`src/scenes/game-over/renderGameOverWeeTale.ts`** — one-line addition to `buildWeeTaleContextFromPayload`:
```ts
runName: payload.name ?? undefined,
```

`resolveDisplayNames` is unchanged. The new `{name}` slot is a plain string and doesn't need display-name lookup (unlike `boss` / `source` / `variant`).

#### Unit tests

**`src/utils/weeTale.test.ts`** — append a new describe block:
- `it('tags has_name when runName is non-empty')` — `ctx({ runName: 'Lachlan' })` produces tags containing `has_name`.
- `it('omits has_name when runName is empty or absent')` — `ctx({ runName: '' })` and `ctx({})` both omit `has_name`.
- `it('routes Cailleach victory runs to a Cailleach-voiced template')` — `ctx({ mode: 'victory', variantKey: 'cailleach', runName: 'Lachlan' })` + `pickWeeTale(ctx, 0.5)` returns a key starting with `ui.weeTale.variant.cailleach.`.
- `it('routes Cailleach + Taxman victory to the tier-3 Cailleach-Taxman line')` — same as above plus `bossesKilled: ['taxman']`, picker returns `ui.weeTale.variant.cailleach.victory_taxman`.
- Sister it() for Glaswegian, Doric Quinie, Burns's Wee Beastie.
- `it('populates {name} in pick.params when runName is set')` — picker output's `params.name` equals the input `runName`.
- `it('Burns citation lines fire only on burns_wee_beastie variant')` — `ctx({ variantKey: 'classic' })` never matches a Burns-citation template even with matching mode/boss tags.

#### i18n EN

**`src/core/i18n/ui.ts`** — append 20 new leaves under `weeTale.variant.*` + 2 under `weeTale.death.with_name` / `weeTale.victory.with_name`. Full strings in §4.

#### i18n SCS

**`src/core/i18n.scs/ui.ts`** — same 22 leaves with SCS overlays. The EN→SCS parity fence at `src/core/i18n.locale.test.ts` scoped to `ui.weeTale.*` will surface any missing leaf as a CI failure. SCS rules:
- Cailleach lines: leave Gaelic phrases as-is in both EN+SCS; render the framing Scots-flavoured.
- Glaswegian lines: same vernacular both locales; SCS may tighten contractions ("ye" / "didnae" / "aboot").
- Doric Quinie lines: Doric is its own register *within* Scots; EN renders Doric vocabulary, SCS keeps Doric vocabulary (overlay is identity-or-near-identity by design).
- Burns lines: the citation is verbatim Burns (Scots already); the framing in both locales matches that register.

#### E2E smoke

**`e2e/wee-tale.spec.ts`** — append a third test:

```ts
test('renders a Cailleach-voiced victory line for a Cailleach run', async ({ page }) => {
  // … addInitScript, navigate, click into game …
  // Launch GameOverScene with payload tagged for Cailleach + victory:
  //   variantKey: 'cailleach',
  //   bossKilledKeys: ['gordon', 'tour_bus', 'taxman'],
  //   name: 'Cailleach Bheag',
  //   timeSurvivedSec: 1500,
  //   runSeed: 0xCA111,
  // The picker's seeded sub-RNG + Cailleach-tier-3 specificity routes
  // to a `ui.weeTale.variant.cailleach.victory_taxman`-class template.
  // Assert taleKey starts with `ui.weeTale.variant.cailleach.` AND
  // the rendered text includes the run-name 'Cailleach Bheag'.
});
```

Existing two tests (`classic` variant) unchanged.

#### Documentation

- **`CLAUDE.md`** — `### Key Mechanics` table row for Wee Tales (currently in the "shipped" entries under the open candidates list) gets a one-liner truth-up: phase v2 shipped, variant voice coverage = VOICE_CARD register coverage.
- **`docs/HUGE_INITIATIVES_MASTER_PLAN.md`** — open-candidates row for Wee Tales updated: v2 shipped 2026-05-22 with variant voice + `{name}` slot.
- **`docs/C2_BURNS_PROVENANCE.md`** — append the 4 Burns citations used in this spec with Kinsley reference.

---

## 4. Catalogue additions

### Universal `{name}` lines (tier-2; routes any name-bearing run that doesn't have a variant-voiced match)

| Key | Requires | EN |
|---|---|---|
| `ui.weeTale.death.with_name_a` | death, has_name | *{name} laid doon by the heather. The moor remembers what it can.* |
| `ui.weeTale.victory.with_name_a` | victory, has_name | *{name} walked back oot. The moor lets some go.* |

### Cailleach (variant: cailleach) — Gaelic-inflected stern-motherly

| Key | Requires | EN |
|---|---|---|
| `ui.weeTale.variant.cailleach.death_baseline` | death, cailleach, has_name | *Winter is patient, {name}. Ye werena.* |
| `ui.weeTale.variant.cailleach.death_short` | death, cailleach, has_name, short | *The mountain was here before {name}. And after.* |
| `ui.weeTale.variant.cailleach.victory_baseline` | victory, cailleach, has_name | *Ye did well, {name}. Winter expects more next time.* |
| `ui.weeTale.variant.cailleach.victory_taxman` | victory, cailleach, has_name, taxman | *The taxman bowed to {name} at last. Even the mountain blinked.* |

### Glaswegian (variant: glaswegian) — urban-aggressive, Limmy-bite

| Key | Requires | EN |
|---|---|---|
| `ui.weeTale.variant.glaswegian.death_baseline` | death, glaswegian, has_name | *Aye, {name} swung hard. Swung harder than the moor would let.* |
| `ui.weeTale.variant.glaswegian.death_short` | death, glaswegian, has_name, short | *{name} didnae make it past the kerb. Get up. Try again.* |
| `ui.weeTale.variant.glaswegian.victory_baseline` | victory, glaswegian, has_name | *Right then. {name} walked it. Dinnae get a heid aboot it.* |
| `ui.weeTale.variant.glaswegian.victory_taxman` | victory, glaswegian, has_name, taxman | *{name} bested the taxman. Even Glasgow keeps a wee receipt.* |

### Doric Quinie (variant: doric_quinie) — Aberdeenshire fishing-village stoic

| Key | Requires | EN |
|---|---|---|
| `ui.weeTale.variant.doric_quinie.death_baseline` | death, doric_quinie, has_name | *Fit like, {name}? Awa hame nou. The sea minds its ain.* |
| `ui.weeTale.variant.doric_quinie.death_long` | death, doric_quinie, has_name, long | *{name} hauded weel. The quinie's bonnet bides on the harbour wa'.* |
| `ui.weeTale.variant.doric_quinie.victory_baseline` | victory, doric_quinie, has_name | *Aye, {name}. The loons doun the pier will hear o' this ane.* |
| `ui.weeTale.variant.doric_quinie.victory_epic` | victory, doric_quinie, has_name, epic | *{time} on the moor, {name}. The smokie's still warm at the kitchie.* |

### Burns's Wee Beastie (variant: burns_wee_beastie) — citational

| Key | Requires | EN |
|---|---|---|
| `ui.weeTale.variant.burns_wee_beastie.death_baseline` | death, burns_wee_beastie, has_name | *"Wee, sleekit, cow'rin, tim'rous beastie" — and yet {name} ran. Aft the heather, oot the door.* |
| `ui.weeTale.variant.burns_wee_beastie.death_short` | death, burns_wee_beastie, has_name, short | *"The best-laid schemes o' mice an' men gang aft a-gley." {name} kent it before the end.* |
| `ui.weeTale.variant.burns_wee_beastie.victory_baseline` | victory, burns_wee_beastie, has_name | *"Fair fa' your honest, sonsie face," {name}. The bard would tip his bonnet.* |
| `ui.weeTale.variant.burns_wee_beastie.victory_epic` | victory, burns_wee_beastie, has_name, epic | *{name} held the moor for {time}. Burns himself wrote shorter lines.* |

**Total: 18 new templates** (2 universal + 4 × 4 variant = 18).

Burns provenance (each citation is verbatim from Robert Burns):
- *"Wee, sleekit, cow'rin, tim'rous beastie"* — opening line of **To a Mouse** (1785).
- *"The best-laid schemes o' mice an' men gang aft a-gley"* — penultimate stanza of **To a Mouse**.
- *"Fair fa' your honest, sonsie face"* — opening line of **Address to a Haggis** (1786).
- *"Burns himself wrote shorter lines"* — framing prose, not a citation.

---

## 5. Test coverage map

| Gate | Test |
|---|---|
| Tag derivation (`has_name`) | `weeTale.test.ts` — present when runName set, absent when empty/missing |
| Variant routing | `weeTale.test.ts` — Cailleach / Glaswegian / Doric / Burns runs route to their variant-flavoured templates |
| Specificity tier-3 routing | `weeTale.test.ts` — Cailleach+Taxman victory picks the tier-3 line over the tier-2 baseline |
| Burns citation gate | `weeTale.test.ts` — non-Burns variant never matches a Burns citation template |
| `{name}` slot interpolation | `weeTale.test.ts` — `pickWeeTale` populates `params.name` correctly |
| Universal `{name}` lines | `weeTale.test.ts` — name-bearing classic run picks `death.with_name_a` / `victory.with_name_a` over the no-name fallbacks |
| EN→SCS parity | `i18n.locale.test.ts` (existing fence) — every new EN leaf has an SCS overlay |
| E2E render | `e2e/wee-tale.spec.ts` (new test) — Cailleach victory run renders Cailleach-flavoured line with `{name}` interpolated |
| Replay determinism | `replayDeterminism.test.ts` (existing) — wee-tale RNG branch is read-only of `runSeed`, unchanged shape, no regression |

Estimated +14 unit assertions + 1 e2e test. Bundle delta < 2 KB gzip (templates are strings; i18n leaves are strings; one new tag literal).

---

## 6. Pre-ship 5-question gate (per CONTRIBUTING.md)

1. **Filters cleared?** Stand-the-test (mirrors v1 catalogue shape exactly; one new tag literal added to a closed union) ✓ ; ultra-efficient (picker complexity unchanged; tag-set grows by one literal) ✓ ; secure (no new code paths handling user input; templates are static) ✓ ; technically impressive (composes with existing tag-driven filter + 4^specificity weighting + i18n parity fence + seed-determined sub-RNG; all four layers carry the new content without modification) ✓ ; minimal slop (no premature feature flag, no over-eager "future-proofing", no unused tags) ✓.
2. **Chains walked?** New mechanic chain (additive content authoring slice): pure helper change + helper tests ✓ ; scene wire (one-line context extension) ✓ ; i18n parity (EN+SCS leaves in same commit) ✓ ; e2e smoke (new Cailleach test case) ✓ ; documentation truth-up (CLAUDE.md + master plan + Burns provenance) ✓. No save chain (no schema change). No replay chain (wee-tale RNG branch unchanged shape).
3. **Invariants surfaced?** No save schema bump. No replay blob bump. `WeeTaleTag` union grows by one literal (closed union still — adding `has_name` without a tagger clause would be a compile-error gap; tagger handles it).
4. **Verification proof?** TBD at ship — quote `npm run ci` output + e2e log.
5. **Soul Check passed?** Per `docs/DESIGN_SOUL.md` six questions — warmth (every Cailleach/Glaswegian/Doric/Burns line is hearth-warm; no maudlin, no shame) ✓ ; clarity (the `{name}` slot is the closing personal echo of the epigraph; no clutter) ✓ ; tone (each variant lands in its documented VOICE_CARD register, not pastiche) ✓ ; voice (Doric vocabulary verbatim from VOICE_CARD §"Variants for vocabulary"; Burns citations verbatim from primary source) ✓ ; moment-stack (the closing couplet of epigraph + wee tale becomes the run's signature) ✓ ; kindness (every variant's baseline tier-2 is generous; even short-death Glaswegian "Get up. Try again." is encouragement, not shame) ✓.

---

## 7. Phase boundaries

### Ships in this spec

- 18 new templates (2 universal + 4 × 4 variant-voiced) in `WEE_TALE_TEMPLATES`.
- `WeeTaleTag` union grows by `'has_name'`.
- `WeeTaleContext.runName` optional field; `computeWeeTaleTags` populates `has_name` tag.
- `buildTemplateParams` always populates `name` from `ctx.runName`.
- Scene `buildWeeTaleContextFromPayload` threads `payload.name` through.
- 18 EN leaves + 18 SCS leaves under `ui.weeTale.*`.
- 6-8 new unit assertions + 1 new e2e test case.
- CLAUDE.md + master plan + Burns provenance truth-up.

### Deferred

- **Voice registers for the other 11 variants** (Wild Haggis classic, Moor Runner, Iron Belly, Glen Forager, Surefoot, Pipe Breath, Laird, Wee Ghostie, Anticlockwise, Peerie Shetlander, Witch's Hare, Selkie). Each needs a VOICE_CARD register entry first; wee-tale lines land alongside that authoring, not standalone.
- **Hebridean voice for Selkie.** Spec line in `Selkie` variant docstring mentions "Hebridean-tinged" voice register but no VOICE_CARD entry exists. Wait for that authoring.
- **Witch's Hare witch-confession register.** Isobel Gowdie's Auldearn confession primary source (`SCOTTISH_RESEARCH_DEEP.md §22.9`) could anchor a register; needs VOICE_CARD entry first.
- **Seasonal-event wee-tale overrides.** A Burns Night run could close with an extra-Burns-flavoured line; a Samhain run could lean Cailleach. The tagger doesn't currently include seasonal event tags. Adding them is a separate phase; for now seasonal events shape gameplay and music, not closing prose.
- **Per-variant `{stat}` slot substitutions.** A Glaswegian victory line could interpolate `{enemiesKilled}` for swagger; deferred until any single template makes the case.
- **A11y review for italic-Scots-vernacular prose at small font.** Existing wee-tale render is 15px italic; new lines (longer, denser Scots vocabulary) may want a 16px tier. Out of scope; tracked as a separate readability pass if a player surfaces it.

---

## 8. Dispatch brief

This spec doubles as a dispatch brief. A subagent should walk §3 → §4 → §5 in order and ship without escalation. Every file path is canonical; every catalogue addition is a literal string. The "additive only, no rewrites" constraint keeps blast radius bounded.

Estimated session size: 1.5–2 hours including verification + memory truth-up.

---

*Spec lock. Implementation immediately.*
