# Design Ideas — Creative Reference

**Not a roadmap.** Not a backlog. Not prioritised. This is a sketchpad — mechanical, character, and content ideas to draw from when a flagship (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`) has room to pull from. Each idea is one-line enough to grasp; none is funded, owned, or scoped.

**Rule for using this file:** an idea here does **not** justify spending a sprint. Pull an idea into a flagship only when the flagship's owner says it fits and the idea survives a 30-minute spike.

**Duplicates, synonyms, and doomed-on-paper ideas have been removed from the earlier drafts.** What remains is the genuinely useful creative residue.

---

## 1. Signature mechanics (ideas)

One-line fantasy + mechanic. Cherry-pick when a flagship calls.

- **Drift Mastery** — tap perpendicular to drift to bank a "Grip" meter; spend for a tight burst-turn. The drift becomes a dance, not a bug. Touches `Player.ts`.
- **Pibroch Crescendo** — firing within ±80 ms of a music downbeat gains a small damage bonus and a sting. Rewards rhythm. Touches `src/systems/music/Conductor.ts`.
- **Sporran Deck** — pre-run: draw 7 cards, keep 3. Curses, blessings, quirks combine into emergent runs. Touches `runStartModifiers.ts` + `curses.ts`.
- **Cairn Stacking** — rare interact points during a run; hold to place a stone; three stones = a small run-scoped boon. Non-shoot tension. Touches `PickupSpawner.ts`.
- **Whistle-Call Companions** — one familiar slot: sheepdog, stoat, eagle, kelpie-foal. Unlocked via deeds. Extra entity load — pair with a perf budget.
- **Stance Toggle (Braced / Loose / Reeling)** — cycle with Shift. Modifies drift, speed, defence. Skill layer for veterans.
- **Heather Mantle** — kills grow a visible mantle; at max kill-threshold the mantle pulses and staggers nearby enemies. Needs a rig layer (see **W71** in master plan).
- ~~**Burn Leap**~~ — ✅ shipped 2026-04-18 (`src/entities/burnLeapInput.ts` + Player integration). Double-tap direction arms a 280 ms hazard-iframe window + 180 ms speed boost (1.55×); suppresses slick slow, fog pickup-halve, and lava tick damage. Enemy contact still hurts — it's routing, not combat immunity. Pure detector keeps replay determinism.
- **Whisky Breath** — collect stacks; hold to breathe a short cone of fire that leaves a burn puddle.
- **Taxman Grudge Ledger** — silent tracker of how you finish elites/bosses; end-of-game dialogue shifts accordingly. Hidden state; save schema care.
- ~~**Ceilidh Chain Combo**~~ — ✅ shipped: every 8th kill in a streak pulls coins and gems in close (see `ach_ceilidh_commander`).
- ~~**Standing Stones**~~ — ✅ shipped: three-stone mid-run boon picker (see `ach_stone_circle`).
- ~~**Reliquary Pickups**~~ — ✅ shipped 2026-04-18 (`src/scenes/game/reliquary.ts`). One relic per run, spawned in a 6:00–12:00 window 400–620 px off the player, clamped to world margins. Three curios pull from existing Player APIs: `echoing_reed` (+20 px pickup radius), `flint_charm` (+7 % crit), `cairn_moss` (+0.4 HP regen). Lore page stays open for a future codex pass.
- ~~**Weather Memory Trails**~~ — ✅ shipped 2026-04-18 (`src/scenes/game/memoryTrail.ts` + HazardZones integration). While the player stands in a haar_wraith fog patch, HazardZones emits a small teal-white wisp at their feet every 130 ms; each wisp lives 2.1 s and runs `Enemy.applyFreeze(0.55, 320 ms)` on any non-hazard enemy that overlaps. Pure tick-cadence + overlap helpers keep the fifth HazardZones patch type tested without Phaser.
- **Shinty Parry** — a new weapon with a 350 ms reflect window against projectiles. High-skill defensive layer.
- ~~**Ancestral Echoes**~~ — ✅ shipped: spectral haggis on the first 30 s at the prior death spot (see `ach_echo_touched`).
- ~~**Tartan Banner** (postcard slice)~~ — ✅ shipped 2026-04-18: procedural plaid composited into the postcard footer, derived from variant + top-damage weapon + mode tags (`src/utils/tartan.ts`). **Mantle half** of the bullet is still blocked on the W71 rig layer and stays open as a future extension.

### Ideas cut (not here anymore)

- *Midge Reputation* — cross-run path bias. Anti-fair; risks punishing good play. Removed.
- *Tide & Time dynamic arena* — soft boundary shifts mid-run. Readability-hostile without a huge VFX budget. Removed.
- *The Quiet Minute* (enemies slow to 60% for 20 s mid-run) — **breaks the survivors genre**. Removed. (If a *boss intro* slow-mo beat is wanted, that's a different idea, filed under boss pipeline.)

---

## 2. Playable haggis roster (ideas)

**Current shipped variants (verified in `src/data/variants.ts`):** `classic`, `moor_runner`, `iron_belly`, `glen_forager`, `surefoot`, `pipe_breath`, `wee_ghostie`, `laird`, `glaswegian`. **Nine variants.** Honest roster ceiling ≈ 10 before the pool dilutes — one slot left before "adding a variant" starts hurting the pool more than helping it.

Candidates worth a sketch (pick 1 max for a content drop):

- ~~**Glaswegian**~~ — ✅ shipped 2026-04-18. Punisher glass cannon (+18% dmg, +5% speed, -20 HP). Urban slate + tram-orange palette. Unlock: 2 000 lifetime kills. Limmy-bite banter across the six variant-scoped pools (EN + SCS).
- **Hebridean** — water-hazard immune; favours Shore biome.
- **Drouthy** — drunk; starts with Whisky stacks; drift doubled.
- **Cailleach** — small slow-aura near the player; winter-crone fantasy.
- **Engineer** — drops a single cairn-turret that fires main weapon at 50%.
- **Selkie** — dual-form (seal = fast/no weapon, haggis = combat) swap on dodge cooldown.
- **Tufted** — minion summoner; auto-fills familiar slot with a pup.
- **Iron Brew** — damage-taken buff stacks.
- **Pibroch** — rhythm mastery SKU; widens Pibroch beat window.
- **Tam-o'-Shanter** — prestige variant, unlocked endgame.

### Roster ideas cut

- *Munro* duplicates `surefoot` / `moor_runner` in effect.
- "14 variants" framing is wishful — capacity is ~10 total.

---

## 3. Enemy bestiary (ideas)

**Current shipped enemies (`src/data/enemies.ts`):** ~22 including bosses. Adding new enemies is bounded content work; the question is *which families to lean into*, not *how many*.

Families worth sketching (pick one per content drop):

- **Cryptids of the Loch** — water-born, slow, ripple-then-surface telegraph. Hebridean + burn biomes.
- **Faerie Courts (Seelie / Unseelie)** — tricksy, rhythmic, sparkle-then-commit telegraph. Fairy Pool + Cairngorm Woods biomes.
- **Urban Ghaists** — Glasgow/Edinburgh undead, uncanny, fluorescent-flicker telegraph. Glasgow Close biome.
- **Weather Spirits** — haar, gale, hail; half-hazard, half-enemy. Tied to weather director.
- **Academic Apparitions** — ghostly scholars, scroll-unfurl telegraph. Chamber-strings music.
- **Taxman's Retinue (post-bell)** — ledger demons, auditors, ink-stamp telegraph. Extends `PostBellEscalation.ts`.

### New enemy sketches (not a commitment)

| Key | Family | Hook |
|-----|--------|------|
| ~~`blue_man_of_minch`~~ | Cryptids | ✅ shipped 2026-04-18. Ranged ocean spirit at 10:30 (themed `ranged` alt; kenning-reward mechanic deferred). |
| ~~`kelpie_foal`~~ | Cryptids | ✅ shipped 2026-04-18. Flee-behaviour water foal at 6:30 (fake-pickup lure deferred; visual carries the flavour). |
| ~~`barghest`~~ | Cryptids | ✅ shipped 2026-04-18. Dive enemy at 9:30 (clean-telegraph howl deferred to banter/SFX layer). |
| ~~`seelie_piper`~~ | Faerie | ✅ shipped 2026-04-18. Fair-court orbit enemy at 8:20 (pale-gold palette, sparkle trail); aura-buff mechanic deferred to future drop. |
| ~~`unseelie_fiddler`~~ | Faerie | ✅ shipped 2026-04-18. Dark-court orbit pair-mate at 8:40 (violet-black palette, fiddle instead of pipes); three-note-pattern beat-sync mechanic deferred. |
| ~~`redcap`~~ | Faerie | ✅ shipped 2026-04-18. Dive goblin at 8:50 — stocky silhouette + iron pike + blood-dipped cap. Dive behaviour contrasts cleanly with the Seelie / Unseelie orbit pair so the trio reads as "two courtiers + the enforcer". |
| ~~`haar_wraith`~~ | Weather | ✅ shipped 2026-04-18. Chase enemy at 12:30; drops a fog patch on death that halves pickup radius (`HazardZones.spawnHaarFog` + `Player.inFog`). |
| ~~`gale_wraith`~~ | Weather | ✅ shipped 2026-04-18. Chase enemy at 13:45; mass-15 override shoves the player on contact through Phaser's arcade resolver (no custom knockback code). |
| ~~`buckfast_ned`~~ | Urban | ✅ shipped 2026-04-18. Body enemy at 12:00; drops a slick patch on death (`HazardZones.spawnBottleSlick`) that slows the player 45 % for 5 s. |
| ~~`traffic_cone_totem`~~ | Urban | ✅ shipped 2026-04-18. Static at 14:30; collapses into four slick patches at the cardinals on death (reuses the ned slick via `onTotemFall`). |
| ~~`edinburgh_ghost_guide`~~ | Urban | ✅ shipped 2026-04-18. Ranged Victorian-spectre tour guide at 13:30; lobs projectiles at distance (reuses the `ranged` behavior). |
| ~~`edinburgh_ghost_guide`~~ | Academic | ✅ shipped 2026-04-18. Ranged Victorian-spectre tour guide at 13:30; "narrates as a damage source" deferred pending a caption-linked damage system. |
| ~~`ceilidh_caller`~~ | Academic | ✅ shipped 2026-04-18. Orbit dance-master at 10:45; "forces enemies to move in sync" deferred pending a group-AI pass. |
| ~~`tome_wraith`~~ | Academic | ✅ shipped 2026-04-18. Ranged floating tome at 11:30; torn pages + ghostly face between the leaves. Scroll-unfurl telegraph rides the sprite; existing `ranged` AI handles the projectile cadence. |
| ~~`dean_apparition`~~ | Academic | ✅ shipped 2026-04-18. Chase at 12:45 with mass override 5 — formal dean in mortarboard + gown, contact-shoves the player as "the academy does not wait". |
| ~~`ledger_wraith`~~ | Taxman | ✅ shipped 2026-04-18. Chase enemy at 15:30; ghostly auditor with floating ledger + red-ink drips. "Immune until Taxman takes damage" deferred pending an event-bus gate. |
| ~~`auditor_priest`~~ | Taxman | ✅ shipped 2026-04-18. Ranged cleric at 17:30 with a censer-tipped staff (glowing amber telegraph). "Beam ranged, tests drift skill" deferred pending a beam-weapon class. |

**Honest cap:** 4–6 new enemies per release. Retire weak ones.

### Boss sketches (pick 1–2 per arc)

- **Cailleach of the Storm** — haar + ice + hail phases; pairs with winter liturgy.
- **Twin Stones of Callanish** — two bosses, one HP bar; swap and re-unite phases.
- **The Wicker Haggis** — fire boss; phase 2 scatters animated torches; phase 3 is a fire-worm.
- **The Auld Reekie Ghaist** — Edinburgh gas-lamp boss; LOS pillars; ghost-tour-crowd shields.
- **Nessie, Reconsidered** — full boss form of the existing `nessie_tentacle` weapon flavour.
- **Father Taxman** — current Taxman expanded with a Grudge-Ledger phase (see mechanics).

Every boss ships: entry ritual (3–5 s) → three phases with distinct telegraphs → outro (2–3 s) → chronicle entry → a11y captions.

---

## 4. Biomes (ideas)

**Current:** baseline moor + biome controller scaffolding. Expanding is content work; each biome needs palette, hazard archetype, music stem set, two exclusive enemies, one ambient banter pool.

Candidates:

- **Cairngorm Plateau** — cold slate, wind-shear zones push.
- **Glen Coe** — mourning red-black; "massacre echoes" ghost waves.
- **Cairngorm Woods** — dense, root-trip hazards, LOS blockers.
- **Hebridean Shore** — tide-like boundary changes (opt-in).
- **Glasgow Close** — sodium-amber urban; fluorescent flicker = vision spike.
- **Skye Fairy Pool** — buff/debuff water tiles.
- **Ben Nevis Summit** — wind push, low enemy density.
- **Edinburgh Old Town** — smoke-grey, chimney-smoke visibility debuff.
- **The Black Bog (post-bell)** — black/blood palette; ink hazards; drift doubled.

---

## 5. Weapons (ideas)

**Current shipped (`src/data/weapons.ts`):** 9 weapons. **C4 already warned about synergy explosion** — shipping 10 more at once would break builds. Cap at **+4 new per content drop**, evolve from there.

Candidate weapons (pick 4 for a content drop):

- **Sgian Dubh** — short-range dagger, high crit. Paired passive: Whetstone.
- **Shinty Stick** — reflect weapon, pairs with Shinty Parry mechanic. Paired passive: Shinty Ball.
- **Dirk Dance** — 3-hit combo, last hit bleeds. Paired passive: Gillie's Edge.
- **Whisky Flask** — lob + burn puddle. Paired passive: Peated Oak.
- **Bagpipe Drone** — passive aura slow. Paired passive: Reeds.
- **Selkie Song** — charm enemy briefly. Paired passive: Seal Pelt.
- **Grannie's Curse** — homing hex, multiplies on kill. Paired passive: Widow's Shawl.
- **Clootie Rag** — bleed DoT aura. Paired passive: Rowan Thread.
- **Stag Antler** — short dash-attack weapon.
- **Coastal Storm** — long-CD screen AoE ult.

### Synergy families (for balance sanity)

- **Bleed:** `clootie_rag`, `dirk_dance`, `sgian_dubh`. Diminishing stack rule.
- **Aura:** `bagpipes`, `bagpipe_drone`, `scotch_mist`, `whisky_flask`.
- **Reflect:** `shinty_stick`, evolved `thistle_shot`, `coastal_storm` arcs.
- **Summon:** `selkie_song`, Engineer turret, nest-counter familiars.

**Rule to enforce in `BalanceConfig.evolution.test.ts`:** a single run should never stack more than two families at evolution tier.

---

## 6. Cosmetic & identity (ideas)

- Name your haggis (proc-gen names + custom, profanity-filtered).
- ~~Tartan patterns — algorithmic~~ — ✅ shipped 2026-04-18 (`src/utils/tartan.ts` — postcard footer slice only; mantle half still blocks on W71). ~~Authored patterns + deed-gated unlocks~~ ✅ also shipped 2026-04-18 (`src/utils/tartanAuthored.ts` — three curated presets gated on rare victory conditions: Ironmoor Crown, Cursed Triumph, Taxman's Reckoning). Gallery UI + per-preset i18n labels stay open until a surface needs them.
- Mantle patterns unlocked by kill/biome/deed thresholds (blocks on W71 rig).
- Hat/bonnet slot.
- Cairn decoration set.
- Chronicle postcard frames.

All unlocks through deeds / chronicle milestones / seasonal events. **No monetisation.**

---

## 7. Ambient / atmospheric (ideas)

- Non-combat wildlife — red deer, hares, buzzards, otters, red squirrels, eagles, sheep, rooks. Flee combat; gather at burns. Cheap soul if scoped tight.
- Environmental storytelling — carved Pictish stones, ruined crofts, trail waymarkers. Touch to read. Pair with a writer.
- Diegetic glossary — hover any Scots/Gaelic word → small card with meaning, pronunciation, cultural note.
- Live mood portrait — HUD-corner haggis face that reads HP, stance, weather, recent damage. Distinct from rig work but layered on it.

---

## 8. Share / capture (collapsed into one program)

Earlier drafts split this into W20 postcards / W27 highlights / W50 photo / W79 film. **One pipeline, one owner** — see **W27** in the master plan.

Outputs the pipeline should produce:

- ~~Still postcard (PNG) with run facts + tartan frame~~ — ✅ shipped (`src/utils/postcard.ts`, 2026-04-17; tartan added 2026-04-18).
- Short clip (WebM/GIF, 6–15 s), deterministic camera path.
- Full screenshot at any pause.

**Not in v1:** public CDN, in-browser video editor, network upload.

---

## 9. Meta / identity (ideas)

- **Haggis lineage** — fallen haggis become named ancestors in a tree; a trait passes forward.
- **Scars & tattoos** — run-local scars, lifetime tattoos. Needs rig.
- **Dream runs** — rare surreal variant triggered by moon + specific curses + anniversary counts. Cosmetic-only rewards.
- **Story-lite mode** — shorter, lower difficulty, more banter, for players here for the moor not the fight.

---

## 10. Hub (one village, not five features)

Earlier drafts split this into W11 Bothy, W84 Village, W85 Contracts, W86 Smith, W89 Folk Games. **One "village" idea** — not a flagship yet. If elevated, elevate the whole thing with one owner and honest scope:

- A Bothy hall (exists).
- A handful of named NPCs (shepherd, bard, smith, midwife, post-carrier).
- A small contract board (errands, not mutators).
- A smith's anvil (combine curios).
- A storytelling corner (codex read-aloud).
- Small folk-game mini-layer (shinty, caber, ceilidh dance).

Each item is tiny. The village is *not* tiny. Scope it honestly or leave here.

---

## 11. Hard-no list (ideas that do not fit)

For clarity and memory across future brainstorms, these do not fit this game:

- **PvP** — different game.
- **Full 3D or alt camera** — different game.
- **LLM-driven narrative in-run** — safety + performance + brand risk.
- **Loot boxes or FOMO timers** — violates soul charter.
- **NFT / crypto provenance** — violates soul charter.
- **Mass multiplayer** — scope explosion beyond this team.
- **Companion mobile app as a separate product** — different product, different team.
- **"Moor Library" PDF export of licensed music/VO** — legal non-starter.
- **Diegetic patch notes replacing real changelogs** — ceremony over clarity.

---

*Live sketchpad. Update freely. Ideas that land become flagships in the master plan with owners, non-goals, and kill criteria. Ideas that don't survive a 30-minute spike stay here. Ideas that prove hostile to the game get moved to the hard-no list.*
