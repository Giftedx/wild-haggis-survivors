# B5 — Five Missing Biomes + Gloaming Time-of-Day Design

**Date:** 2026-04-28
**Initiative:** B5 (new)
**Status:** Charter — design only; no implementation begun.
**Word count:** ~2,500
**Prerequisites met:**
- F1 (Haar fog filter) — shipped 2026-04-24 (`HaarFogController`, `ActIntermissionScene` integration)
- W2 Moor Road — shipped (acts 1-2 use existing biome rotation)
- Sprite-art chunk split — shipped 2026-04-28 (commit `ff777d2`); means new biome sprite drawers no longer compete with `vendor-phaser` for budget
- T1 replay determinism — shipped 2026-04-17/18; new biomes must respect seeded `runRng` only

**Prerequisite open:**
- Edinburgh cultural consultation (Phase 3 only — see Risk 3)

---

## 1. Problem Statement

`src/data/runes.ts` ships 31 rule-stack runes. Five are *ungrounded*: their predicates reference biome-key or time-of-day values that no producer in the engine ever emits, so drawn cards never fire. Per the Soul Charter Warmth Audit (`docs/DESIGN_SOUL.md`) and the kindness ingredient of the Soul Check, shipping cards that do nothing is a trust break — the player builds strategy around a rule the engine silently never honours.

The five conditions, all in `src/systems/runes/runeConditions.ts:93–139`:

| Rune | Predicate | Source |
|------|-----------|--------|
| `haar_rune` | `ctx.biomeKey === 'fog'` | line 99 |
| `gloaming_rune` | `ctx.timeOfDayKey === 'dusk'` | line 104 |
| `frost_rune` | `ctx.biomeKey === 'cold'` | line 105 |
| `seawrack_rune` | `ctx.biomeKey === 'coastal'` | line 106 |
| `edinburgh_rune` | `ctx.biomeKey === 'urban'` | line 108 |

Four reference **biomes** (`fog`, `cold`, `coastal`, `urban`) absent from `BiomeId`. One — gloaming — references a **time-of-day** field. The TOD field is fully typed (`'dawn' | 'day' | 'dusk' | 'night' | null` at `runeContextBuilder.ts:39`) and threaded through the test harness (`runeContextBuilder.test.ts:29` exercises `'dusk'`). Only the **producer** is missing — `GameScene.ts:2370` hardcodes `timeOfDayKey: null`.

Conclusion: this is **4 missing biomes + 1 missing TOD producer**, not five biomes. The TOD slice is the cheapest and unblocks one rune in days; the biomes are larger work.

This charter designs all five interventions and phases them by cost + cultural-sensitivity gating.

---

## 2. Existing Biome System (reusable infrastructure)

`src/data/biomes.ts:12` defines `BiomeId = 'bog' | 'loch' | 'pine' | 'heather'`. Each entry in the `BIOMES` record carries:

- `tint` (minimap + UI accent)
- `entryToastKey` + `toastColor` (i18n + display)
- `spawnWeightMods` (per-enemy multipliers)
- `modifier` (biome-wide effect, e.g. `bogSlow`)
- `moodTimbre` (Conductor 0..1 axis scalar)
- `ambientHaarDensity` (read by `HaarFogController` per tick — already wired)

`BiomeManager.createBiomeLayout(rng, W, H)` (`BiomeManager.ts:101–121`) seeds 5–6 Voronoi points from the run-scoped RNG. State is read on demand (`biomeAt(x, y)`); no event emitter. Consumers query directly: `HazardsSystem.pickHazardForBiome`, `FloraScatter`, `WildlifeSystem.VALID_BIOMES`, `runeContextBuilder`, `Conductor`.

**Per-biome wiring checklist** (any new biome):

1. Extend `BiomeId` union (`biomes.ts:12`)
2. Add `BiomeDef` to `BIOMES` record + append to `BIOME_IDS` array (`biomes.ts:115`)
3. Add 1:1 `HazardDef` in `hazards.ts:27–86`
4. Extend `FLORA_BY_BIOME` and `STORY_PROPS_BY_BIOME` (`FloraScatter.ts:40–113`)
5. Update `WildlifeSystem` `VALID_BIOMES` map and any creature `biomeWeights`
6. Add i18n: `biome.{key}.entryToast`, any biome-specific banter triggers, plus SCS overlays (parity fence will fail otherwise)
7. Set `ambientHaarDensity` (auto-flows through `HaarFogController`)
8. Optional: ambient weather event in `AmbientWeatherSystem.pickWeatherMode`
9. Add rune evaluator case in `runeConditions.ts:97-139` switch
10. **No save migration needed** — `BiomeId` is run-scoped, not persisted

**Time-of-day producer wiring** is separate:

1. Compute `timeOfDayKey` from `runTimeMs` in `GameScene.update`
2. Pass into `buildRuneEvalContextFromScene()` (`GameScene.ts:2345`) — replace the hardcoded `null` at line 2370

---

## 3. Design Risks

### Risk 1 — Sprite atlas + bundle budget pressure
`vendor-phaser` sits at 374/390 KB gzip; only 16 KB headroom. **Mitigation:** sprite-art is now a separate Vite chunk (`ff777d2`, currently 161 KB gzip). New biome sprite drawers land there, not in `vendor-phaser`. **Charter action:** add an explicit `sprite-art` budget gate at 240 KB gzip in `scripts/check-bundle-budget.mjs` so biome additions stay disciplined.

### Risk 2 — T1 replay determinism break
ADR-0002 Phase 3 contract: every spawn position, biome assignment, and hazard placement must use seeded `runRng`, never `Math.random()` (per `feedback_test_runner_vs_tsc.md`). Existing infra already complies. **Mitigation:** every new biome's flora/wildlife/hazard producer ships with a unit test asserting determinism via paired-RNG snapshot. `replayDeterminism.test.ts` regression suite covers integration.

### Risk 3 — Edinburgh cultural sensitivity (CRITICAL)
`CULTURAL_SENSITIVITIES_RESEARCH.md §2.7` flags Cowgate poverty romanticisation as a critical risk. The Old Town's tangled closes were 18th-19th century tenement slums; "atmospheric Old Town" can read as poverty-as-set-dressing. Bodach-chimney enemies could invoke Oliver-Twist child-thief tropes. **Mitigations:**
- Edinburgh biome leans **Gothic / architectural** (castle, statues, Royal Mile stonework), not slum-social
- Hostile NPCs are ghosts/fae (Lone Piper, Bodach), never caricatured human poor
- Banter that touches class uses Burns dignity-in-hardship register (cite `VOICE_CARD.md` and `CULTURAL_SENSITIVITIES_RESEARCH.md` Part 4 Language)
- **External consultation gate before Phase 3 ship** — Edinburgh World Heritage or equivalent organisation. This blocks Phase 3 release.

### Risk 4 — Frost over-romanticising Highland Clearances
`CULTURAL_SENSITIVITIES_RESEARCH.md §2.1` mandates that ruined-croft visual decoration is treated with explicit narrative weight, not "atmospheric ruin". **Mitigation:** Frost MVP uses untouched-wilderness palette only — Bodach Glas silhouette, snow-on-ben tiles, ptarmigan, bare birch — **no ruined dwellings**. A future Frost croftland variant is OUT OF SCOPE and would ship as its own charter with Almanac historical placards.

### Risk 5 — Selkie gendered framing in Seawrack
`CULTURAL_SENSITIVITIES_RESEARCH.md` (per scout report) flags the "beautiful seal-woman temptress" trope as harmful. **Mitigation:** Selkies as seawrack hostiles are gender-neutral hostile entities sourced from *people of the seal* folklore, not the *seal-woman bride* trope.

### Risk 6 — Dead biome until rune fires
A new biome registered in `BIOMES` but never selected during Voronoi seeding leaves the rune still ungrounded. **Mitigation:** every phase ships with extension to the marathon-smoke e2e (`e2e/marathon-smoke.spec.ts`) asserting all biomes can appear over a 25-min run. Plus a unit test on `BiomeManager.createBiomeLayout` confirming all biomes are draw-eligible.

### Risk 7 — Visibility loss in Haar breaks readability
Sustained low-visibility play violates the Soul Check clarity ingredient. **Mitigation:** player breadcrumb trail visible 5s in fog (`GAME_FEEL_RESEARCH.md §2.2`); silhouette-first test passes for all entities at 300px range (`ART_STYLE_BIBLE.md:128–134`); `ambientHaarDensity` in Haar biome capped at 0.7 not 1.0; respect `motionScale` accessibility setting (existing).

### Risk 8 — Time estimates aspirational
Existing biomes were authored over years; estimating four new ones in 7-10 weeks is optimistic. **Honest band: 8-14 weeks** including balance pass + polish. Charter phasing front-loads cheap wins (Gloaming TOD = 1-2 days) so any slip lands on Edinburgh, the deferred-by-design phase.

---

## 4. Per-Biome Designs

### 4.1 Gloaming — Phase 0 (TOD producer, 1-2 days)

**Cultural anchor:** simmer dim, Shetland midsummer twilight (`SCOTTISH_RESEARCH.md §2.9:464`; `SCOTTISH_RESEARCH_DEEP.md §1.6:170`).

**Tonal palette:** Hearth (long-shadow warmth, golden-hour). `ART_STYLE_BIBLE.md §Hearth:41-49`.

**Voice register:** Hearth — soft, introspective. Combat banter pauses; Gran whisper variants welcome (existing variant infra at `i18n.ts:1121-1126`).

**Mechanism:** compute `timeOfDayKey` from `runTimeMs` in `GameScene`:

| Run time | TOD key |
|----------|---------|
| `< 5min` | `'dawn'` |
| `5–15min` | `'day'` |
| `15–22min` | `'dusk'` (gloaming window) |
| `>22min` | `'night'` |

**Visual layer:** ambient warm-orange tint overlay during dusk; reduce saturation 10%, lift warm channel 15%. Existing Phaser 4 filter render-node infra (post `F1`) handles the overlay cheaply.

**No hazard.** Gloaming is pacing relief, not threat — closes the Soul Charter "rest moment" axis.

**Acceptance:** unit test on `computeTimeOfDayKey(runTimeMs)`; e2e assert `timeOfDayKey === 'dusk'` at 18-min run mark (extend `marathon-smoke`); `gloaming_rune` fires under engineered conditions (extend `runeConsumerIntegration.test.ts`).

**Closes:** 1 of 5 ungrounded runes.

### 4.2 Seawrack — Phase 1a (~1.5 weeks)

**Cultural anchor:** Corryvreckan whirlpool ("Cailleach's washing pot"), kelp/wrack abundant coasts (`SCOTTISH_RESEARCH.md §1.8:190`; `SCOTTISH_RESEARCH_DEEP.md §5.4:697`).

**Palette:** Wild — windswept, lonely. `ART_STYLE_BIBLE.md §Wild:50-65`.

**Voice:** Hearth wistful default; Edge spike near Selkie/Nuckelavee encounters.

**Hazard:** tidal wrack — slow tile (-25% movement) + minor tick damage if stationary >2s. Mirrors `bogSlow` modifier pattern.

**Visual motifs:** kelp fronds (2-frame swaying), barnacle-encrusted rocks, foam edge line, whelk shell scatter, optional seal silhouette wildlife (existing or new — defer to balance pass).

**Spawn weights:** lean coastal — Selkies (new), Buzzard (existing) up-weighted, Deer (existing) down-weighted to 0.

**Closes:** 1 rune.

### 4.3 Haar — Phase 1b (~1.5 weeks)

**Cultural anchor:** east-coast cold sea-fog, Edinburgh and Aberdeen signature weather (`SCOTTISH_RESEARCH.md §2.9:462`).

**Palette:** Fey — otherworldly, shifting visibility. `ART_STYLE_BIBLE.md §Fey:66-79`.

**Voice:** Edge clipped warnings during fog; Hearth as fog lifts.

**Hazard:** visibility reduction via `ambientHaarDensity = 0.7`. Silhouette-only enemy reads at >300px range.

**Reuses:** `HaarFogController` already shipped (F1) — no new shader work, only a high `ambientHaarDensity` setting in the BiomeDef.

**Visual motifs:** drifting white/grey fog (existing shader), enemy silhouettes, partially-obscured pier/lighthouse, dripping water on heather.

**Critical clarity gates** (per Risk 7): 5s breadcrumb trail; silhouette-first test; `motionScale` accessibility honoured.

**Bundles with Seawrack** because narratively coherent (the haar rolls in off the sea) and visual-asset adjacent (coastal lighting + fog overlay).

**Closes:** 1 rune.

### 4.4 Frost — Phase 2 (~2 weeks)

**Cultural anchor:** Cairngorms winter, snow-on-ben late patches (`SCOTTISH_RESEARCH.md §2.9:465`); Bodach Glas silhouette stalking climbers on Ben Macdui (`§1.2:104`).

**Palette:** Grave — desaturated greys, ashen heather, low warm long shadows. `ART_STYLE_BIBLE.md §Grave:80-95`.

**Voice:** Edge bare ("Winter doesnae forgive"); Gran whispers on croft return moments (existing variant).

**Hazard:** snow-drift slow tiles (-25% movement, mirrors `bogSlow`); cold tick damage if HP < 30% (frostbite proximity). Composable with existing damage pipeline.

**Visual motifs:** snow-patch tiles, rime on bracken, bare birch trunks (white silhouettes), Bodach Glas as mid-screen silhouette enemy (NEW), ptarmigan wildlife (NEW — white-on-white field-mark).

**No ruined-croft variants in MVP** (per Risk 4).

**Closes:** 1 rune.

### 4.5 Edinburgh — Phase 3 (4-5 weeks + consultation)

**Cultural anchor:** Lone Piper of Castle tunnel (`SCOTTISH_RESEARCH.md §1.4:134`), Bodach chimney-spirit (`§1.2:102`), Royal Mile Old Town stonework (`§2.5:328`).

**Palette:** Wild Comedy — sodium amber streetlights, wet pavement grey, neon accents, tartan-outlined. `ART_STYLE_BIBLE.md §Wild Comedy:96-110`.

**Voice:** Wild Comedy default; Edge spike on Bodach encounters; Lone Piper UI tone is faint distant pibroch (Hearth-in-nostalgia).

**Hazard:** falling debris from chimneys — texture variant of `falling_slate` from `pine`, with sodium-tinted impact.

**Visual motifs:** cobblestones with sodium reflection, close/wynd shadow planes, Royal Mile statue silhouettes, chimney stack vertical hazard blocks. NO tenement interiors, NO caricatured human residents.

**Cultural consultation gate** (mandatory): nominee TBD — Edinburgh World Heritage or Royal Society of Edinburgh or equivalent. Charter cannot ship Phase 3 until consultation completes.

**Gating:** Edinburgh appears in W3+ acts only (post Moor Road W2). Visually distinct from rural biomes — high-contrast greyscale + sodium accents — so the act-shift reads as journey, not visual mismatch.

**Closes:** 1 rune (final ungrounded).

---

## 5. Phasing & Schedule

| Phase | Scope | Duration | Cumulative runes closed |
|-------|-------|----------|------------------------|
| 0 | Gloaming TOD producer | 1-2 days | 1/5 |
| 1 | Seawrack + Haar (coastal cluster) | 3 weeks | 3/5 |
| 2 | Frost | 2 weeks | 4/5 |
| 3 | Edinburgh (consultation-gated) | 4-5 weeks | 5/5 |

**Total:** 7-10 weeks across 4 phases (honest band 8-14 weeks if balance + polish slips).

**Recommended split if Edinburgh consultation deadlocks:** ship Phase 0–2 only (4 of 5 runes, 5-7 weeks); treat Edinburgh as a separate W3-tier charter once consultation aligns.

---

## 6. Acceptance Criteria (per phase)

- All ungrounded runes in scope now fire under engineered conditions (extend `runeConsumerIntegration.test.ts`)
- Voronoi seeding includes new biomes deterministically (snapshot test in `BiomeManager.test`)
- Marathon-smoke e2e asserts new biomes appear during a 25-min run
- New `sprite-art` chunk size remains under the 240 KB gzip gate (added in Phase 0)
- Soul Check pass: voice + palette + moment alignment per CLAUDE.md "Soul checks & Feel Pass"
- T1 replay determinism: paired-seed test on each new biome's spawn/scatter/hazard path
- Cultural sensitivity sign-off — Edinburgh: external consultation; others: in-team checklist citing CULTURAL_SENSITIVITIES_RESEARCH.md
- i18n parity: every new biome key has EN + SCS overlay (parity fence enforced)

---

## 7. Open Questions

1. **Edinburgh consultation contact** — Edinburgh World Heritage? Royal Society of Edinburgh? OnFife? Need user/team to nominate before Phase 3 starts.
2. **Frost croftland variant** — out of scope here. Confirm with team it stays out of scope or commission a separate Almanac-grounded charter.
3. **Gloaming visual overlay** — engine-level filter (existing post-F1 infra, unified) or per-tile palette swap (cheaper, less unified)? Recommend filter for consistency.
4. **Interim mitigation for ungrounded runes today** — should `RuneOfferSystem` filter the 5 unfired runes from the offer pool until each phase ships, or trust the charter to ship phases fast enough? Recommend Phase 0 ships first (1-2 days, drops unfired count to 4) then proceed; no filter needed.
5. **Memory drift reconciliation** — scout found 31 total runes; prior memory said 30 with 25 grounded. Either way the charter closes the 5 named ungrounded ones; reconcile memory file separately.

---

## 8. Out of Scope

- Endless mode biome integration (separate charter)
- Frost croftland variant (sensitivity-deferred — see Risk 4)
- Glasgow / Ayrshire / Aberdeen urban biomes (Edinburgh is the pilot; future urban work depends on its outcome and consultation precedent)
- Time-of-day combat or spawn modifiers (this charter only enables the rune predicate; gameplay TOD effects = separate charter)
- New rune authoring beyond the 5 ungrounded ones (separate)
- Boss tier-2 mythos pairings with new biomes (cross-referenced in N1 spec but tracked separately)

---

## 9. Implementation Map (file-level)

For Phase 0:
- `src/scenes/GameScene.ts:2370` — replace `timeOfDayKey: null` with computed value
- `src/scenes/game/computeTimeOfDayKey.ts` (NEW) — pure function `computeTimeOfDayKey(runTimeMs): TimeOfDayKey`
- `src/scenes/game/computeTimeOfDayKey.test.ts` (NEW) — boundary table tests
- `e2e/marathon-smoke.spec.ts` — add assertion at 18-min mark

For Phases 1-3 (per biome):
- `src/data/biomes.ts:12,115` — extend BiomeId + BIOME_IDS
- `src/data/biomes.ts:46-113` — add BiomeDef entry
- `src/data/hazards.ts:27-86` — add HazardDef
- `src/systems/FloraScatter.ts:40-113` — add palette
- `src/systems/WildlifeSystem.ts:42-61` — extend VALID_BIOMES
- `src/systems/runes/runeConditions.ts:97-139` — already has cases for all 5; verify no edits needed once biomeKey strings flow through
- `src/scenes/game/runeContextBuilder.ts` — populate `biomeKey` for new biomes (already wired through `biomeController.currentBiomeAt(p.x, p.y)`; new BiomeId values flow automatically)
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — biome name + entryToast + per-biome banter trigger keys
- `src/art/sprites/biomes/{biomeKey}/*.ts` (NEW per biome) — flora drawers, hazard drawers, optional creature drawers
- `scripts/check-bundle-budget.mjs` — add `sprite-art` budget assertion (Phase 0)
- `e2e/marathon-smoke.spec.ts` — extend assertion that each new biome appears

---

## 10. Charter Sign-off Checklist

Before any phase starts:
- [ ] User reviews this charter and accepts phasing
- [ ] User nominates Edinburgh consultation contact (Phase 3 prerequisite — can defer)
- [ ] Add `sprite-art` bundle budget gate (240 KB gzip)
- [ ] Memory file reconciled on rune count truth (31 vs 30, 20 vs 25 grounded)

After each phase ships:
- [ ] Acceptance criteria all green
- [ ] Soul Check passes (warmth, clarity, tone, voice, moment, kindness)
- [ ] CULTURAL_SENSITIVITIES_RESEARCH.md checklist confirmed in PR description
- [ ] Memory file updated with phase ship date + commit SHA

---

**References:**
- `docs/DESIGN_SOUL.md` — Soul charter, Weave Matrix, Soul Check
- `docs/PRD.md` — top-line product requirements
- `docs/VOICE_CARD.md` — Hearth/Edge registers, variant voices
- `docs/ART_STYLE_BIBLE.md` — 5 tonal palettes (lines 41–110), signature motifs (146–183), silhouette-first test (128–134)
- `docs/research/SCOTTISH_RESEARCH.md` — §1.2, §1.4, §1.8, §2.5, §2.9
- `docs/research/SCOTTISH_RESEARCH_DEEP.md` — §1.6, §5.4
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — §2.1, §2.7, Part 4 Language
- `docs/research/GAME_FEEL_RESEARCH.md` — §2.2 visibility breadcrumbs, §7.5 biome pacing
- `docs/research/MUSIC_ART_TECH_RESEARCH.md` — atmospheric filter techniques
- `src/data/biomes.ts`, `src/data/runes.ts`, `src/systems/runes/runeConditions.ts`, `src/scenes/game/runeContextBuilder.ts`, `src/scenes/GameScene.ts:2345-2371`, `src/systems/BiomeManager.ts`, `src/systems/FloraScatter.ts`, `src/systems/WildlifeSystem.ts`, `src/systems/HaarFogController.ts`
