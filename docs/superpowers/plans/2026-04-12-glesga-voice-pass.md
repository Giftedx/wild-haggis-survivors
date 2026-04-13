# Glesga Voice Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and rewrite all cold/warm i18n strings to achieve consistent Glaswegian voice across the game, create a permanent voice reference card, and ship with passing tests.

**Architecture:** Single-file string rewrites in `src/core/i18n.ts` plus a new `docs/VOICE_CARD.md` reference. No key paths change, no interpolation variables change, no code logic changes. Only string values.

**Tech Stack:** TypeScript, Vitest, Vite

**Spec:** `docs/superpowers/specs/2026-04-12-glesga-voice-pass-design.md`

**Voice reference:** `C:\Users\aggis\.claude\projects\C--Users-aggis-hlooper-wild-haggis-survivors\memory\reference_glesga_comedy_vault.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/VOICE_CARD.md` | Create | Permanent half-page voice reference (two registers, vocabulary, anti-patterns) |
| `src/core/i18n.ts` | Modify (lines 40-43, 101, 199-203, 221-222, 251, 275, 279, 337, 344-346, 348, 358-359, 364, 369, 480, 516, 532-533, 535-536, 569, 572, 585-586, 590, 593, 598-599) | Rewrite ~29 cold/warm strings |

**No test file changes needed.** Existing exact-match tests in `src/core/i18n.test.ts` only check strings we are NOT modifying. Regression fence tests check key resolution (not values) — they pass automatically when values change.

---

## Temperature Audit Summary

**5 COLD strings** (full rewrite — generic English that broke character):
- `ui.menu.trend_improving`, `trend_steady`, `trend_new`
- `ui.gameOver.new_best`
- `achievement.ach_all_bosses.title`

**24 WARM strings** (targeted sharpening — close but drifting clean/literary):
- 4 boss warnings
- 2 game toasts (treasure)
- 1 tip
- 3 meta item descriptions
- 4 achievement descriptions/titles
- 1 tutorial string
- 9 upgrade card descriptions

**~170 HOT strings** — untouched. Already pure Glesga.

---

### Task 1: Create Voice Card

**Files:**
- Create: `docs/VOICE_CARD.md`

- [ ] **Step 1: Write the voice card**

```markdown
# Voice Card — Wild Haggis Survivors

Two registers, one voice. The game speaks like a Glaswegian.

## Hearth Voice (default)

Still Game pub warmth. Jack & Victor energy. Self-deprecating, affectionate, talks to the player like an old pal.

**Where:** Menus, progression, tips, run identity, shop, settings, tutorial, level-up cards, gold/XP feedback, treasure toasts.

**Sounds like:** "The glen remembers ye." / "Braw try." / "The herd believes in ye."

## Edge Voice

Limmy deadpan. Short, dry, absurdist. Trusts the player.

**Where:** Boss warnings, death titles, achievement unlocks, kill milestones, enrage lines, evolution descriptions.

**Sounds like:** "That's yir lot." / "The beast is RAGIN!" / "Every last wan o' them."

## Vocabulary

| Use | Not |
|-----|-----|
| yir | your |
| nae | no (not any) |
| dinnae | don't |
| wee | small |
| oot | out |
| tae | to (when natural) |
| culls | kills |
| curios | passives |
| the moor / the glen | the world / the map |

**Enemy insults:** roaster, weapon, rocket, bam, moon howler, walloper, tube, numpty

## Anti-Patterns

- No tourist Scots ("och aye the noo")
- No explaining the joke in-game
- No clean English that forgot where it was from
- No try-hard density — one cultural nod per string max
- No literary Highland ("dry bracken", "the land heals those who belong") — this is Glesga, not Outlander
```

- [ ] **Step 2: Commit voice card**

```bash
git add docs/VOICE_CARD.md
git commit -m "docs: add voice card — two-register Glesga voice reference for all game copy"
```

---

### Task 2: Rewrite Cold Strings

**Files:**
- Modify: `src/core/i18n.ts:40-43,101,364`

These 5 strings are generic English with zero Glaswegian character. Full rewrites.

- [ ] **Step 1: Rewrite the 5 cold strings in i18n.ts**

In `src/core/i18n.ts`, replace these string values (keys and interpolation vars unchanged):

**Line 40** — `ui.menu.trend_improving`:
```
Old: 'getting stronger'
New: 'pure flying'
```
> "Pure flying" = Glesga for doing brilliantly. Short, punchy, unmistakable.

**Line 41** — `ui.menu.trend_steady`:
```
Old: 'holding steady'
New: 'haudin yir ain'
```
> "Haudin yir ain" = holding your own. Proper Scots, warm.

**Line 42** — `ui.menu.trend_declining`:
```
Old: 'the moor tests ye'
New: 'the moor\'s no\' impressed'
```
> Drier, more Limmy energy. The moor as disappointed parent.

**Line 43** — `ui.menu.trend_new`:
```
Old: 'the journey begins'
New: 'first hoofprints on the moor'
```
> Specific to the game world. Not generic quest language.

**Line 101** — `ui.gameOver.new_best`:
```
Old: 'NEW BEST!'
New: 'YA DANCER!'
```
> "Ya dancer!" is THE Glasgow celebration phrase. Every punter knows it. Universal joy.

**Line 364** — `achievement.ach_all_bosses.title`:
```
Old: 'Boss Rush'
New: 'Cleaned Hoose'
```
> "Cleaned hoose" = cleared the lot. Glesga idiom replacing a generic gaming term.

- [ ] **Step 2: Run tests to verify nothing breaks**

Run: `npm test -- --run`
Expected: 284 tests pass. No exact-match tests reference these strings.

- [ ] **Step 3: Commit cold string rewrites**

```bash
git add src/core/i18n.ts
git commit -m "copy: rewrite 5 cold strings — pure Glesga replacements for generic English"
```

---

### Task 3: Rewrite Warm Strings — Boss Warnings & Combat

**Files:**
- Modify: `src/core/i18n.ts:199-203,221-222,242`

Boss warnings use **edge voice** (Limmy bite). Combat toasts and tips use **hearth voice** with a sharper edge.

- [ ] **Step 1: Rewrite boss warnings (4 strings)**

**Line 199** — `ui.bossWarning.gordon`:
```
Old: "The kitchen's marching — Gordon approaches!"
New: "The kitchen's marching — Gordon's comin' and he's RAGIN!"
```
> "Approaches" is formal English. "Comin' and he's RAGIN" is Glesga. Matches existing `boss_enraged` energy.

**Line 200** — `ui.bossWarning.tour_bus`:
```
Old: 'Tour bus on the road — dinnae let it park on yir toes!'
New: 'Tour bus on the horizon — it\'s no\' stoppin\' at Yoker this time.'
```
> Yoker nod — Limmy deep-cut. Non-fans still get "it's heading straight for you."

**Line 202** — `ui.bossWarning.hunter_general`:
```
Old: 'The Hunter-General — reinforcements at their back.'
New: 'The Hunter-General — and they\'ve brought pals.'
```
> "Brought pals" is how a Glaswegian describes someone showing up with backup. "Reinforcements at their back" is military briefing English.

**Line 203** — `ui.bossWarning.taxman`:
```
Old: 'The Taxman cometh — settle yir accounts or run.'
New: 'The Taxman\'s here — and he\'s no\' takin\' a cheque.'
```
> "Cometh" is biblical English, not Glesga. "No' takin' a cheque" is dry, specific, funny.

- [ ] **Step 2: Rewrite combat toasts and tips (3 strings)**

**Line 221** — `ui.game.treasure_nearby`:
```
Old: 'Something shiny on the wind…'
New: 'Somethin\' glintin\' oot there…'
```
> "Glintin'" is Scots for glinting. "Oot there" keeps it grounded in the voice.

**Line 222** — `ui.game.treasure_collected`:
```
Old: 'Chest cracked — hearty heal (+25% HP)'
New: 'Chest cracked — that\'s a feed and a half (+25% HP)'
```
> "A feed and a half" = a big meal, Glesga idiom. "Hearty heal" is generic RPG.

**Line 242** — `ui.tips.combo`:
```
Old: 'Keep the streak alive — combos sweeten every hit.'
New: 'Keep the streak alive — combos put the boot in harder.'
```
> "Put the boot in" = Glesga for laying into someone. "Sweeten" is soft.

- [ ] **Step 3: Run tests**

Run: `npm test -- --run`
Expected: 284 pass. The boss warning test (`toContain('Taxman')`) still passes — "Taxman" is in the new string.

- [ ] **Step 4: Commit**

```bash
git add src/core/i18n.ts
git commit -m "copy: sharpen boss warnings (Limmy edge) and combat toasts (Glesga idiom)"
```

---

### Task 4: Rewrite Warm Strings — Upgrade Cards

**Files:**
- Modify: `src/core/i18n.ts:480,516,532-536,569,572,585-586,590,593,598-599`

Upgrade cards use **hearth voice** — warm, characterful, one cultural nod max per description.

- [ ] **Step 1: Rewrite 9 upgrade card descriptions**

**Line 480** — `upgradeCard.add_bagpipe_blast.description`:
```
Old: 'A ring of rude sound. Foes blow back like dry bracken.'
New: 'A ring of rude sound. Foes scatter like pigeons on Buchanan Street.'
```
> Buchanan Street is Glasgow's main pedestrian shopping street. Pigeons there are legendary. "Dry bracken" is Highland narrator.

**Line 516** — `upgradeCard.add_kilt.description`:
```
Old: 'Room for one more mistake (+15% max HP). Evolves Caber Toss.'
New: 'It\'s breezy but it works — room for one more daft mistake (+15% max HP). Evolves Caber Toss.'
```
> Kilt = breezy. "Daft" adds Scots flavor.

**Line 532-533** — `upgradeCard.add_thistle_crown.description`:
```
Old: 'Sharper glances, sharper thorns. +5% crit; attackers take 3 damage on contact.'
New: 'Prickly as a Glesga bus queue. +5% crit; attackers take 3 damage on contact.'
```
> Glasgow bus queue energy — don't mess with the crowd. Sharp cultural nod.

**Line 535-536** — `upgradeCard.add_highland_shield.description`:
```
Old: 'A blessing for the worst of nights. Every 20s, shrug off a lethal hit.'
New: 'For when it aw goes sideways. Every 20s, shrug off a lethal hit.'
```
> "When it aw goes sideways" is how a Glaswegian describes disaster. "A blessing for the worst of nights" is literary/religious.

**Line 569** — `upgradeCard.boost_crit.description`:
```
Old: 'Ye see the weak points a shade better (+5% crit chance).'
New: 'Ye ken where it hurts (+5% crit chance).'
```
> "Ken" = know in Scots. Shorter, sharper, more natural.

**Line 572** — `upgradeCard.boost_regen.description`:
```
Old: 'A cold clear stream in yir chest (+0.5 HP/sec, slow and steady).'
New: 'Like a sip o\' Irn-Bru for the soul (+0.5 HP/sec, slow and steady).'
```
> Irn-Bru as the national healing drink. Perfect cultural nod for a regen card.

**Line 585-586** — `upgradeCard.banish.description`:
```
Old: 'Wipe the 5 weakest nearby off the moor. Breathing room now, earned later.'
New: 'Wipe the 5 weakest nearby off the moor. That\'s plenty — gie yerself some space.'
```
> "That's plenty" is a Still Game nod. "Gie yerself" = give yourself, Scots.

**Line 590** — `upgradeCard.boost_lifesteal.description`:
```
Old: 'A sip o\' vitality from every kill (+1 HP each).'
New: 'A wee nip o\' life from every cull (+1 HP each).'
```
> "Nip" = small drink, Scots. "Cull" matches game vocabulary. "Vitality" is RPG-speak.

**Line 593** — `upgradeCard.boost_projectile_speed.description`:
```
Old: 'Projectiles arrive faster and stick sooner (+15% projectile speed).'
New: 'Thistles wi\' a bit more zip — they arrive before the scream (+15% projectile speed).'
```
> Adds character and humor to a purely mechanical description.

**Line 598-599** — `upgradeCard.boost_boss_heal.description`:
```
Old: 'When a boss folds, heal 20% max HP. A reward for the big fight.'
New: 'When a boss folds, heal 20% max HP. Ye earned that, big yin.'
```
> "Big yin" = big one, very Glesga. Billy Connolly is "The Big Yin." "A reward for the big fight" is generic.

- [ ] **Step 2: Run tests**

Run: `npm test -- --run`
Expected: 284 pass. Upgrade card tests only check key resolution, not values.

- [ ] **Step 3: Commit**

```bash
git add src/core/i18n.ts
git commit -m "copy: sharpen 9 upgrade card descriptions — Glesga nods replace generic English"
```

---

### Task 5: Rewrite Warm Strings — Achievements, Meta Items & Tutorial

**Files:**
- Modify: `src/core/i18n.ts:251,275,279,337,344-346,348,358-359,364,369`

Mix of **hearth voice** (meta items, tutorial) and **edge voice** (achievements).

- [ ] **Step 1: Rewrite 3 meta item descriptions**

**Line 259** — `metaItem.health_tier_2.description`:
```
Old: 'Tough as old leather (+15% base max HP).'
New: 'Built like a Maryhill tenement (+15% base max HP).'
```
> Maryhill is a proper Glasgow area. Tenements there are indestructible. "Old leather" is generic.

**Line 275** — `metaItem.regen_tier_1.description`:
```
Old: 'The land heals those who belong to it (+0.2 HP/sec).'
New: 'The moor patches its ain — slow but sure (+0.2 HP/sec).'
```
> "Its ain" = its own, Scots. "The land heals those who belong" is Outlander narration.

**Line 279** — `metaItem.crit_tier_1.description`:
```
Old: 'Spot the weak points, strike them true (+3% crit chance).'
New: 'A keen eye for the soft bits (+3% crit chance).'
```
> Natural Scots phrasing. "Strike them true" is generic fantasy.

- [ ] **Step 2: Rewrite 5 achievement strings**

**Line 337** — `achievement.ach_survive_10m.description`:
```
Old: 'Ten stubborn minutes in one run.'
New: 'Ten minutes and still standin\'. No\' bad, pal.'
```
> Still Game dry approval energy. "No' bad, pal" is the highest compliment in Glesga.

**Line 344** — `achievement.ach_full_run.title`:
```
Old: 'Endurance of Stone'
New: 'Still Here, Pal'
```
> Pure Still Game. "Endurance of Stone" is Dark Souls. This is Glasgow.

**Line 345-346** — `achievement.ach_full_run.description`:
```
Old: 'Fifteen minutes. The full moor cycle, endured.'
New: 'Fifteen minutes. The full cycle. That\'s plenty.'
```
> "That's plenty" = Still Game nod. "Endured" is passive literary voice.

**Line 358-359** — `achievement.ach_first_evolution.description`:
```
Old: 'Evolved a weapon. The old ways awaken.'
New: 'Evolved a weapon. Somethin\' ancient stirred — and it\'s got teeth.'
```
> Sharper, more edge-voice. "The old ways awaken" is Outlander again.

**Line 364** — `achievement.ach_all_bosses.description`:
```
Old: 'Every boss felled in a single run.'
New: 'Every last wan o\' them, floored in a single run.'
```
> "Wan" = one, "floored" = Glesga for knocked down. The title was already rewritten in Task 2 to "Cleaned Hoose."

- [ ] **Step 3: Rewrite tutorial drift string**

**Line 369** — `tutorial.drift`:
```
Old: 'Your wee haggis drifts clockwise — crooked legs! Lean into it.'
New: 'Yir wee haggis drifts clockwise — crooked legs! Lean into it.'
```
> Simple vocabulary fix: "Your" → "Yir". The one vocab rule violation in the tutorial.

- [ ] **Step 4: Run tests**

Run: `npm test -- --run`
Expected: 284 pass.

- [ ] **Step 5: Commit**

```bash
git add src/core/i18n.ts
git commit -m "copy: sharpen achievements (Limmy edge), meta items, and tutorial — Glesga voice"
```

---

### Task 6: Rewrite Remaining Warm Strings — Shop & Loadout

**Files:**
- Modify: `src/core/i18n.ts:57,68`

Two small warm strings in shop/loadout areas.

- [ ] **Step 1: Rewrite 2 remaining warm strings**

**Line 57** — `ui.loadout.status_switch`:
```
Old: 'Switch before the next outing'
New: 'Switch before ye head oot'
```
> "Outing" is polite English. "Head oot" is natural Scots.

**Line 68** — `ui.shop.gold_bank_fresh`:
```
Old: 'An empty wallet, for now — the moor pays those who return.'
New: 'Skint, for now — the moor pays those who come back.'
```
> "Skint" = broke, proper Glesga. "Empty wallet" is generic.

- [ ] **Step 2: Run tests**

Run: `npm test -- --run`
Expected: 284 pass.

- [ ] **Step 3: Commit**

```bash
git add src/core/i18n.ts
git commit -m "copy: Glesga-ify shop and loadout — skint wallets, headin' oot"
```

---

### Task 7: Consistency Pass & Final Verification

**Files:**
- Read: `src/core/i18n.ts` (full file, read-through)

No edits expected — this is a verification-only task.

- [ ] **Step 1: Full read-through of i18n.ts**

Read the entire `EN_STRINGS` object top to bottom. Check:

1. **Register consistency** — hearth strings don't have edge bite, edge strings don't go soft
2. **Vocabulary consistency** — search for "your " (should be "yir"), "don't" (should be "dinnae"), "out " vs "oot"
3. **Nod density** — no area overloaded with cultural refs, no area barren
4. **Outsider test** — every rewritten string still makes sense to someone who's never been to Glasgow
5. **Interpolation integrity** — all `{variable}` placeholders are preserved exactly

- [ ] **Step 2: Run full test suite**

Run: `npm test -- --run`
Expected: 284 pass, 0 fail.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Clean build, no type errors.

- [ ] **Step 4: Final commit (if any consistency fixes needed)**

Only if the read-through found issues:

```bash
git add src/core/i18n.ts
git commit -m "copy: consistency pass — vocabulary and register fixes"
```

If no issues found, skip this step.

---

## Rewrite Summary Table

| Key | Old | New | Grade | Cultural Nod |
|-----|-----|-----|-------|-------------|
| `trend_improving` | getting stronger | pure flying | Cold | Glesga idiom |
| `trend_steady` | holding steady | haudin yir ain | Cold | Scots phrase |
| `trend_declining` | the moor tests ye | the moor's no' impressed | Warm | Limmy deadpan |
| `trend_new` | the journey begins | first hoofprints on the moor | Cold | Game-specific |
| `new_best` | NEW BEST! | YA DANCER! | Cold | Glasgow celebration |
| `ach_all_bosses` title | Boss Rush | Cleaned Hoose | Cold | Glesga idiom |
| `bossWarning.gordon` | ...Gordon approaches! | ...Gordon's comin' and he's RAGIN! | Warm | Edge voice |
| `bossWarning.tour_bus` | ...dinnae let it park on yir toes! | ...it's no' stoppin' at Yoker this time | Warm | Limmy/Yoker |
| `bossWarning.hunter_general` | ...reinforcements at their back | ...and they've brought pals | Warm | Glesga phrasing |
| `bossWarning.taxman` | ...settle yir accounts or run | ...and he's no' takin' a cheque | Warm | Glesga humor |
| `treasure_nearby` | Something shiny on the wind… | Somethin' glintin' oot there… | Warm | Scots vocab |
| `treasure_collected` | ...hearty heal | ...that's a feed and a half | Warm | Glesga idiom |
| `tips.combo` | ...combos sweeten every hit | ...combos put the boot in harder | Warm | Glesga phrasing |
| `health_tier_2` | Tough as old leather | Built like a Maryhill tenement | Warm | Glasgow area |
| `regen_tier_1` | The land heals those who belong | The moor patches its ain | Warm | Scots vocab |
| `crit_tier_1` | Spot the weak points, strike them true | A keen eye for the soft bits | Warm | Natural Scots |
| `ach_survive_10m` desc | Ten stubborn minutes in one run | Ten minutes and still standin'. No' bad, pal | Warm | Still Game |
| `ach_full_run` title | Endurance of Stone | Still Here, Pal | Warm | Still Game |
| `ach_full_run` desc | ...The full moor cycle, endured | ...The full cycle. That's plenty | Warm | Still Game nod |
| `ach_first_evolution` desc | ...The old ways awaken | ...Somethin' ancient stirred — and it's got teeth | Warm | Edge voice |
| `ach_all_bosses` desc | Every boss felled in a single run | Every last wan o' them, floored in a single run | Warm | Glesga vocab |
| `tutorial.drift` | Your wee haggis | Yir wee haggis | Warm | Vocab fix |
| `add_bagpipe_blast` | ...like dry bracken | ...like pigeons on Buchanan Street | Warm | Glasgow landmark |
| `add_kilt` | Room for one more mistake | It's breezy but it works — room for one more daft mistake | Warm | Kilt humor |
| `add_thistle_crown` | Sharper glances, sharper thorns | Prickly as a Glesga bus queue | Warm | Glasgow life |
| `add_highland_shield` | A blessing for the worst of nights | For when it aw goes sideways | Warm | Glesga phrasing |
| `boost_crit` | Ye see the weak points a shade better | Ye ken where it hurts | Warm | Scots vocab |
| `boost_regen` | A cold clear stream in yir chest | Like a sip o' Irn-Bru for the soul | Warm | National drink |
| `banish` | ...Breathing room now, earned later | ...That's plenty — gie yerself some space | Warm | Still Game nod |
| `boost_lifesteal` | A sip o' vitality from every kill | A wee nip o' life from every cull | Warm | Scots/game vocab |
| `boost_projectile_speed` | Projectiles arrive faster and stick sooner | Thistles wi' a bit more zip — they arrive before the scream | Warm | Character |
| `boost_boss_heal` | ...A reward for the big fight | ...Ye earned that, big yin | Warm | Billy Connolly ref |
| `status_switch` | Switch before the next outing | Switch before ye head oot | Warm | Scots vocab |
| `gold_bank_fresh` | An empty wallet, for now | Skint, for now | Warm | Glesga slang |
