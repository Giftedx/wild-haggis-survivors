# Glesga Voice Pass — Design Spec

**Date:** 2026-04-12
**Scope:** Audit, deepen, and unify the Glaswegian voice across all ~200 player-facing strings in `src/core/i18n.ts`, including new branch content.

---

## Voice Registers

Two registers, one voice. The game speaks like a Glaswegian — warm by default, sharp when it counts.

### Hearth Voice (default)
Still Game pub warmth. Jack & Victor in the Clansman. Self-deprecating, affectionate, talks to the player like an old pal.

**Used for:** Menus, progression, tips, run identity, shop copy, settings, tutorial, level-up cards, gold/XP feedback, treasure toasts.

**Examples of the tone:** "The glen remembers ye." / "Drift, scrape through, bank gold, come back bolder." / "The herd believes in ye."

### Edge Voice
Limmy deadpan. Short, dry, absurdist. Trusts the player to get it. Never explains the joke.

**Used for:** Boss warnings, death titles, achievement unlocks, kill milestones, enrage lines, evolution descriptions.

**Examples of the tone:** "That's yir lot." / "The beast is RAGIN!" / "The Taxman cometh."

---

## Vocabulary Rules

### Always use
- "yir" not "your"
- "nae" not "no" (when meaning "not any")
- "dinnae" not "don't"
- "wee" not "small/little"
- "oot" not "out"
- "tae" not "to" (when natural, not forced into every instance)
- "culls" for kills (established game term)
- "curios" for passives (established game term)
- "the moor" / "the glen" as living characters

### Insult taxonomy (for enemies, bosses, failure flavor)
roaster, weapon, rocket, bam, moon howler, walloper, tube, bawbag, numpty

### Anti-patterns
- No "ye olde" tourist Scots ("och aye the noo" is banned)
- No explaining the joke — if it needs a footnote, wrong joke for that spot
- No clean English that forgot where it was from
- No try-hard density — one cultural nod per string maximum
- No literary Highland narrator ("dry bracken", "the land heals those who belong") — this is Glesga, not Outlander

---

## Workstream 1: Temperature Audit

Grade every string in `EN_STRINGS` on a three-point scale:

| Grade | Meaning | Action |
|-------|---------|--------|
| **Hot** | Pure Glesga, don't touch | None |
| **Warm** | Close but could be sharper, or missing a nod | Targeted sharpening — swap a phrase, add a nod, tighten voice |
| **Cold** | Generic English that broke character | Full rewrite |

### Audit order (by player exposure)

1. Menu & run start (~15 strings)
2. Game-over & death (~20 strings)
3. Level-up cards: weapons, passives, stats (~45 strings)
4. HUD & combat feedback (~15 strings)
5. Achievements (~9 strings)
6. Boss warnings (~5 strings)
7. Meta shop & permanent upgrades (~30 strings)
8. Evolutions (~7 strings)
9. Settings & tutorial (~10 strings)
10. New branch content — trends & NEW BEST (~5 strings)

### Known cold strings (from initial exploration)
- `trend_improving`: "getting stronger" — flat English
- `trend_steady`: "holding steady" — flat English
- `trend_new`: "the journey begins" — could be any game
- `new_best`: "NEW BEST!" — generic
- Several stat boost card descriptions drift literary/clean

---

## Workstream 2: Deepening Cultural Nods

Nods are woven into rewrites of warm/cold strings. They are not a separate pass bolted on top.

### Where nods land naturally

**Boss warnings (Edge voice):**
- Tour Bus → Yoker bus mystique, Limmy energy
- Gordon → chippy culture, pizza crunch, deep-fat theology
- Taxman → sharper Glesga dismissal energy
- The Laird / Hunter General → review for sharpening opportunities

**Achievement descriptions (Edge voice):**
- Space for bawhair measurements, "yer da" energy, "that's plenty" beats
- Titles are mostly good — descriptions are the target

**Death/failure copy (Edge voice):**
- Sub-lines can carry sharper cultural companion beats
- Tips at death: natural slot for cultural nods (Clockwork Orange subway for drift tip, etc.)

**Upgrade card descriptions (Hearth voice):**
- Stat boosts: square sausage, Tennent's, Scottish mammy logic, Greggs
- Passive cards: lean harder into the real objects (sporran, flask, tam)
- Weapon cards: mostly strong already

**Kill milestones & toasts:**
- Big-number milestones can carry a punchline

### Where nods DON'T go
- HUD labels (readability first)
- Settings descriptions (clarity first)
- Interpolation templates / mechanical stat summaries
- Weapon level-up templates (mechanical, fine as-is)

### Nod density rule
One cultural reference per string maximum. Irn-Bru OR Buckfast, never both in the same line.

---

## Workstream 3: New Branch Content

Five new strings from the run history feature, rewritten as part of the audit:

| Key | Current | Grade |
|-----|---------|-------|
| `ui.menu.trend_improving` | "getting stronger" | Cold |
| `ui.menu.trend_steady` | "holding steady" | Cold |
| `ui.menu.trend_declining` | "the moor tests ye" | Warm |
| `ui.menu.trend_new` | "the journey begins" | Cold |
| `ui.gameOver.new_best` | "NEW BEST!" | Cold |

These are graded and rewritten in the same pass as everything else — no separate workstream.

---

## Workstream 4: Consistency Pass

Final read-through after all rewrites are applied:

1. **Register check** — hearth strings don't have edge bite, edge strings don't go soft
2. **Vocabulary check** — no "your" among "yir", no "don't" among "dinnae"
3. **Nod density check** — no area overloaded, no area barren
4. **Outsider test** — every string makes sense to someone who's never crossed the Clyde
5. **Build check** — `npm test` and `npm run build` pass clean

No new strings invented during this pass. Checking only.

---

## Deliverables

1. `docs/VOICE_CARD.md` — Half-page voice reference (two registers, vocabulary, anti-patterns, examples). Permanent reference for all future copy.
2. Temperature audit table (in working notes, not shipped) — every string graded hot/warm/cold
3. Updated `src/core/i18n.ts` — all warm/cold strings rewritten per voice card
4. Clean test suite and build

---

## Cultural Reference Sources

The full vault of Glaswegian/Scottish comedy references is documented in the project memory system. Key sources:
- **Limmy's Show** (25 deep-cuts catalogued) — Edge voice fuel
- **Still Game** — Hearth voice fuel (Jack & Victor, Boabby, Navid, Winston, Isa)
- **Burnistoun** — "ELEVEN!", everyday absurdity
- **Chewin' the Fat** — "Gonnae no dae that"
- **Trainspotting** — Renton energy for the sharpest edges
- **Groundskeeper Willie** — "Willie hears ya, Willie don't care" chaos energy
- Glasgow cultural icons: Duke of Wellington cone, Clockwork Orange subway, Barras market, Tennent's, Buckfast theology, Greggs seagull warfare, taps aff meteorology

---

## Constraints

- All strings must route through `t()` — no hardcoded copy in scenes (already true)
- Rewrites must not change interpolation variables (`{count}`, `{gold}`, etc.)
- Rewrites must not change i18n key paths — only string values
- HUD strings must remain scannable at a glance
- The game must still be enjoyable for someone with zero Scottish cultural knowledge
