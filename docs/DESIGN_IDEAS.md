# Design Ideas — Creative Reference

**Not a roadmap.** Not a backlog. Not prioritised. This is a sketchpad — mechanical, character, and content ideas to draw from when a flagship (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`) has room to pull from. Each idea is one-line enough to grasp; none is funded, owned, or scoped.

**Rule for using this file:** an idea here does **not** justify spending a sprint. Pull an idea into a flagship only when the flagship's owner says it fits and the idea survives a 30-minute spike.

**Duplicates, synonyms, and doomed-on-paper ideas have been removed from the earlier drafts.** What remains is the genuinely useful creative residue.

**2026-04-23 refresh.** Five research docs now live in `docs/research/`. When an idea below is obviously grounded in one, there's a one-line citation. The research-supply expanded the sketchpad substantially — new items added to existing sections and three new sections (§12 wild-haggis-myth, §13 seasonal events, §14 Scottish-games-lineage homage) at the bottom.

---

## 1. Signature mechanics (ideas)

One-line fantasy + mechanic. Cherry-pick when a flagship calls.

- ~~**Drift Mastery**~~ — ✅ shipped 2026-04-28 (`src/entities/driftMastery.ts` + `driftMastery.test.ts`). Counter-drift input rate-gates a Grip meter (`MS_PER_PIP`); each pip caps at `MAX_PIPS`. Pressing G consumes a pip → `BURST_MS` of drift-cancel + `BURST_SPEED_MUL` move-speed boost. Pure helper — caller (`Player.update`) supplies inputs and receives a `BurstStatus` describing what the velocity-apply path should do. Replay-deterministic given identical input streams. Default keybind G (rebound from W to avoid WASD conflict per `b2f88e5`). See `CLAUDE.md` Drift Mastery entry.
- **Pibroch Crescendo** — firing within ±80 ms of a music downbeat gains a small damage bonus and a sting. Rewards rhythm. Touches `src/systems/music/Conductor.ts`.
- **Sporran Deck** — pre-run: draw 7 cards, keep 3. Curses, blessings, quirks combine into emergent runs. Touches `runStartModifiers.ts` + `curses.ts`.
- **Cairn Stacking** — rare interact points during a run; hold to place a stone; three stones = a small run-scoped boon. Non-shoot tension. Touches `PickupSpawner.ts`.
- **Whistle-Call Companions** — one familiar slot: sheepdog, stoat, eagle, kelpie-foal. Unlocked via deeds. Extra entity load — pair with a perf budget.
- **Stance Toggle (Braced / Loose / Reeling)** — cycle with Shift. Modifies drift, speed, defence. Skill layer for veterans.
- ~~**Heather Mantle**~~ — ✅ shipped via W71 Phase 2 (2026-04-23). Kill-stack grows a tiered visible mantle on the haggis rig; at max tier it pulses and staggers nearby enemies via the heather-mantle pulse hook in `runtimeTickHooks.ts`. See `CLAUDE.md` Heather Mantle reference + `project_w71_phase2_status` memory.
- ~~**Burn Leap**~~ — ✅ shipped 2026-04-18 (`src/entities/burnLeapInput.ts` + Player integration). Double-tap direction arms a 280 ms hazard-iframe window + 180 ms speed boost (1.55×); suppresses slick slow, fog pickup-halve, and lava tick damage. Enemy contact still hurts — it's routing, not combat immunity. Pure detector keeps replay determinism.
- ~~**Whisky Breath**~~ — ✅ shipped 2026-04-28 (`src/entities/whiskyBreath.ts` + `whiskyBreath.test.ts`). Each non-boss kill banks +1 stack (cap `STACKS_MAX = 12`). Pressing F when stacks ≥ `BREATH_STACKS_REQUIRED` (8) consumes the stack and fires a one-frame `burstFiredEdge: true`; caller applies the AOE in scene-space + drops a burn-puddle DoT. Pure helper, replay-deterministic. HUD bar at top-right shows stack count + ready-state pulse. See `CLAUDE.md` Whisky Breath entry.
- **Taxman Grudge Ledger** — silent tracker of how you finish elites/bosses; end-of-game dialogue shifts accordingly. Hidden state; save schema care.
- ~~**Ceilidh Chain Combo**~~ — ✅ shipped: every 8th kill in a streak pulls coins and gems in close (see `ach_ceilidh_commander`).
- ~~**Standing Stones**~~ — ✅ shipped: three-stone mid-run boon picker (see `ach_stone_circle`).
- ~~**Reliquary Pickups**~~ — ✅ shipped 2026-04-18 (`src/scenes/game/reliquary.ts`). One relic per run, spawned in a 6:00–12:00 window 400–620 px off the player, clamped to world margins. Three curios pull from existing Player APIs: `echoing_reed` (+20 px pickup radius), `flint_charm` (+7 % crit), `cairn_moss` (+0.4 HP regen). Lore page stays open for a future codex pass.
- ~~**Weather Memory Trails**~~ — ✅ shipped 2026-04-18 (`src/scenes/game/memoryTrail.ts` + HazardZones integration). While the player stands in a haar_wraith fog patch, HazardZones emits a small teal-white wisp at their feet every 130 ms; each wisp lives 2.1 s and runs `Enemy.applyFreeze(0.55, 320 ms)` on any non-hazard enemy that overlaps. Pure tick-cadence + overlap helpers keep the fifth HazardZones patch type tested without Phaser.
- **Shinty Parry** — a new weapon with a 350 ms reflect window against projectiles. High-skill defensive layer.
- **Anticlockwise Haggis** — variant where the Drift is mirrored (anticlockwise instead of clockwise). Per wild haggis lore, two subspecies of haggis exist with opposite-leg-asymmetry. Instant variant from mechanical mirror. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §11.5.*)
- **Falls-If-Turning Gag** — dash reverse direction triggers a 400 ms stumble animation; haggis falls over briefly per the myth. Pure comedy; tiny mechanical penalty (speed drop). Optional variant ability.
- **Bagpipe Lure** — when certain enemies (seelie piper, unseelie fiddler) play, the haggis is drawn toward them by a few pixels per second. Invertible: haggis can be "lured" toward bonuses. (*Ref: wild haggis myth.*)
- **Clootie Rag Wager** — walking through a Clootie Tree landmark = sacrifice max HP for a run-long buff. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §22.4.*)
- ~~**Pre-Run First-Footing**~~ — ✅ shipped (`src/systems/firstFooting.ts`). During the Hogmanay seasonal window (Dec 28 – Jan 3) every run starts with a rolled first-footing gift — one of four small visible boons (shortbread / whisky / coal / silver). Hearth-warm toast announces the visitor. Pure helpers, replay-deterministic via `runRng`. (*Ref: §13.*)
- **Three-Bay Warning** — Cu Sith enemy howls thrice; each howl buffs it; third = deadly charge unless killed. (*Ref: `SCOTTISH_RESEARCH.md` §1.2.*)
- **Race the Beithir** — on sting by a Beithir enemy, a race-timer appears; reach a healing circle before it expires or take massive damage. Diegetic hazard. (*Ref: `SCOTTISH_RESEARCH.md` §1.2.*)
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
- **Hebridean** — water-hazard immune; favours Shore biome. Gaelic banter pool; Hebridean-English voice. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §3.2 + §14.5.*)
- **Drouthy** — drunk; starts with Whisky stacks; drift doubled.
- **Cailleach** — small slow-aura near the player; winter-crone fantasy. (Already a deferred candidate in specs; noted here as active.)
- **Engineer** — drops a single cairn-turret that fires main weapon at 50%.
- **Selkie** — dual-form (seal = fast/no weapon, haggis = combat) swap on dodge cooldown. (*Ref: `SCOTTISH_RESEARCH.md` §1.1.*)
- **Tufted** — minion summoner; auto-fills familiar slot with a pup.
- **Iron Brew** — damage-taken buff stacks.
- **Pibroch** — rhythm mastery SKU; widens Pibroch beat window.
- **Tam-o'-Shanter** — prestige variant, unlocked endgame.
- **Doric Quinie** — Northeast Aberdonian variant. Fishing-village stoic voice; "fit like?" greetings; Doric banter pool. Starts with Arbroath Smokie pickup buff. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §14.4.*)
- **Peerie Shetlander** — Shetlandic-voice variant. Uses *du/dee* (singular-you), *peerie* (small), Norn-tinged banter. Specialty: resists cold/wind hazards. (*Ref: §14.7 + §3.5.*)
- **Orcadian** — *peedie* (small) variant; Norse-tinged Scots. Specialty: Neolithic-biome affinity. (*Ref: §14.6.*)
- **Morningside Haggis** — comic-posh Edinburgh variant. Affected near-RP voice; cultivated disdain; combat stats unchanged but banter wholly different. (*Ref: §14.3.*)
- **Burns's Wee Beastie** — tiny-sprite variant, huge crit. Banter pool populated from Burns quotations ("Wee, sleekit, cow'rin, tim'rous beastie", etc.). Unlock: perfect Burns Night seasonal run. (*Ref: §15.3.*)
- **Witch's Hare** — Isobel-Gowdie-themed variant. Dash = invincible hop (shape-shift-into-hare homage). Historical witch-confession flavour. (*Ref: `SCOTTISH_RESEARCH.md` §1.5 + `SCOTTISH_RESEARCH_DEEP.md` §22.9.*)
- **Gran's Best** — bonus damage when low HP; Gran's voice audible throughout the run (rare variant where the hub-NPC rides along). (*Ref: `VOICE_CARD.md` Gran section.*)
- **The Pict** — ancient-Scotland variant. No shop access — relies on loot. Covered in Pictish symbol tattoos. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.1.*)
- **The Jacobite** — Prince Charlie-themed variant. Starts with Flora MacDonald's Plaid relic (2s invincibility per minute). Tragic-romantic banter. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.9.*)

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
- **Nicnevin, Queen of the Witches** — Unseelie-court final boss. Rides a white horse; leads the Wild Hunt. Fife folklore. (*Ref: `SCOTTISH_RESEARCH.md` §1.3.*)
- **The Nuckelavee** — Orcadian horror. Skinless man-horse, breath causes droughts + plague. Weakness: fresh water (healing circles force retreat). (*Ref: `SCOTTISH_RESEARCH.md` §1.1.*)
- **Stoor Worm** — Orcadian giant sea-serpent; secret final-final-boss for a hidden route. Scale-shift mechanic — climb the worm and break weak points. (*Ref: `SCOTTISH_RESEARCH.md` §1.1.*)
- **Earl Beardie** — Glamis-card-game mini-boss. Wager an upgrade vs the devil himself. (*Ref: `SCOTTISH_RESEARCH.md` §1.4.*)
- **Black Douglas** — "Hush ye, hush ye, the Black Douglas will not get ye." Borders boss referencing English mothers' lullaby. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.3.*)
- **The Lost Ninth Legion** — wave-boss of Roman spectres emerging from ancient mist. Caledonia's mystery. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.1.*)
- **The Corryvreckan** — not a boss per se; the Cailleach's washing-pot whirlpool as a hazard-arena mini-boss encounter. (*Ref: `SCOTTISH_RESEARCH.md` §1.8.*)

Every boss ships: entry ritual (3–5 s) → three phases with distinct telegraphs → outro (2–3 s) → chronicle entry → a11y captions.

---

## 4. Biomes (ideas)

**Current:** baseline moor + biome controller scaffolding. Expanding is content work; each biome needs palette, hazard archetype, music stem set, two exclusive enemies, one ambient banter pool.

Candidates:

- **Cairngorm Plateau** — cold slate, wind-shear zones push.
- **Glen Coe** — mourning red-black; "massacre echoes" ghost waves. *(Handle respectfully per Soul Charter.)*
- **Cairngorm Woods** — dense, root-trip hazards, LOS blockers.
- **Hebridean Shore** — tide-like boundary changes (opt-in).
- **Glasgow Close** — sodium-amber urban; fluorescent flicker = vision spike.
- **Skye Fairy Pool** — buff/debuff water tiles.
- **Ben Nevis Summit** — wind push, low enemy density.
- **Edinburgh Old Town** — smoke-grey, chimney-smoke visibility debuff.
- **The Black Bog (post-bell)** — black/blood palette; ink hazards; drift doubled.
- **Iona Peaceful Isle** — reverent palette (soft gold, sea-blue); *no combat biome* — puzzle/exploration only. A rare reward route. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §3.1.*)
- **Callanish Standing Stones** — Neolithic site, twilight purple palette. Stones fire aligned beams (mechanical). The Pech (dwarves) emerge if circled. (*Ref: `SCOTTISH_RESEARCH.md` §1.8.*)
- **Orkney Neolithic** — Skara Brae / Maeshowe / Ring of Brodgar inspired. Wind-swept green, stone, ancient-cairn hazards. (*Ref: §2.7.*)
- **Clyde Shipyard** — rust-red / steel-grey industrial biome. Crane-sweep hazards, sparks, riveter enemies. Scottish industrial-heritage reclamation. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §21.1 (Clyde heritage).*)
- **St Kilda (evacuated)** — lonely-green cliff biome, seabird-cliffs of staggering scale. Cultural-ghost village (1930 evacuation). (*Handle respectfully.*) (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §2.5.*)
- **Fingal's Cave (Staffa)** — basalt hexagonal columns, sea-echo audio, acoustic-damage zones. (*Ref: §3.1.*)
- **Corryvreckan Whirlpool Coast** — sea-green foam-white; whirlpool pull-tiles; Cailleach's washing-pot. (*Ref: `SCOTTISH_RESEARCH.md` §1.8.*)
- **Jacobite Moor (Culloden)** — sombre grey-purple; musket-volley rains; Jacobite + Redcoat spectres. *(Handle respectfully.)* (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.9.*)
- **Trossachs Forest** — emerald-bluebell woodland; fog-reveal moments; Rob Roy theme. (*Ref: §3.1 + §6.10.*)
- **Beltane Fire Festival (Calton Hill)** — seasonal event biome. Vermillion, bonfire-gold, fire-pillar hazards, May Queen + Green Man. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §22.1.*)
- **Shetland Simmer Dim** — midsummer twilight biome. Perpetual dusk; Up Helly Aa hazards. (*Ref: §1.6.*)
- **Arran (Scotland in miniature)** — biome that shifts mid-run, containing all other biomes in fragments. (*Ref: §3.3.*)

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
- **Clàrsach (Celtic Harp)** — melodic projectiles fire on strum intervals; synergises with music-as-mechanic. Pre-bagpipe national instrument. Paired passive: Wire Strings. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §17.2.*)
- **Waulking Mallet** — rhythmic throw; beat-aligned hits gain bonus damage (tied to music Conductor). Paired passive: Tweed Cloth.
- **Hagstone Sling** — hurls a stone with a hole; enemies hit *through the hole* take bonus damage. Geometry-reward weapon. Paired passive: Rowan Amulet.
- **Wallace Sword** — giant two-hander; slow, devastating sweep. Paired passive: Stirling Medal. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.3.*)
- **Fingal's Horn** — summons 3 Fianna-warrior allies for 10s. Relic-tier rare. (*Ref: `SCOTTISH_RESEARCH.md` §1.6.*)
- **Steam Engine (James Watt)** — AoE pulse with chimney-smoke particles. Industrial-era flavour. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §20.2.*)
- **Cullen Skink Ladle** — sloshing AoE broth that slows enemies. Comedy-food-weapon tradition. Paired passive: Smoked Haddock.
- **Flying Porridge Pot** — thrown pot explodes into oatmeal splash. Comedy weapon.
- **Deep-Fried Mars Bar** — absurdist heavy projectile; comedy proc (rare but satisfying). (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §12.1.*)
- **Port-à-Beul (Mouth Music) Chant** — area-slow aura that follows player; synced to music system. Gaelic vocal-percussion tradition. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §17.2.*)
- **Bodhrán (Frame Drum)** — beat-based AoE pulse; syncs to combat tempo.
- **Practice Chanter** — tiny ranged sting; starter weapon for the Pibroch haggis variant.

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

## 11. Wild Haggis myth-specific content (ideas)

The game's namesake folklore — the fake cryptid that Scots invented to prank tourists — deserves its own section now the research confirms how rich it is. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §11.5.*)

Concrete content derivable from the myth:

- **Leg-asymmetry variants** — clockwise vs anticlockwise haggis (see §1 Anticlockwise variant above). Per the joke, the two subspecies cannot interbreed because they face opposite directions.
- **Falls-if-turning gag** — see §1.
- **The Haggis Wildlife Foundation** — a faux-naturalist NPC faction. Studies, counts, tags wild haggis. Issue field guides as collectible lore documents. Very-serious-delivery about a not-real animal. Comedy goldmine.
- **Haggis Hurling sport event** — real-world "sport" (1977 invention by Robin Dunseath). Seasonal/Highland Games event where players compete for distance/accuracy. World record ~66m.
- **"Banned in America" easter egg banter** — haggis meat is literally illegal in the USA (FDA rule on sheep lung). One-off banter: "They banned me in the States, ye ken." / "Nae welcome in New York." / "Aye, I'm contraband." (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §11.7.*)
- **Address-to-a-Haggis quote banter** — a run-long banter thread that slowly recites Burns's "Address to a Haggis" in fragments over the course of a 25-minute run. Culminates at the final boss with "Fair fa' your honest, sonsie face…" spoken as the boss drops.
- **Burns Night seasonal event** — see §13.
- **Haggis Hunter's field notes** — collected lore documents where the haggis hunters describe the player-haggis in absurd naturalist terms ("Note the characteristic clockwise drift — the hallmark of Haggis scoticus dextrogyrus").
- **Lured-by-bagpipes mechanic** — see §1.
- **Tourist cameras** — tourist enemy drops a Polaroid of the haggis on death; the player can "accept being photographed" for bonus.

---

## 12. Seasonal events (ideas)

Date-gated content that activates when the real-world date hits. Transforms the game into a year-long living experience. Each event is scoped small: a route option, a banter pool, a cosmetic overlay, maybe a unique enemy or pickup. Not a whole biome.

- **Hogmanay (31 Dec – 1 Jan)** — first-footer NPC brings shortbread/whisky/coal/silver. Fireballs VFX overlay. Auld Lang Syne as end-of-run stinger. Dark-haired haggis starts with bonus pickups.
- **Burns Night (25 Jan ± 7 days)** — massive season. Haggis-themed buffs all run. Piped-in ceremonial "Address to a Haggis" pre-boss. Gran recites the poem at Croft. Reserved Burns-voice banter pool. *Event Burns's Wee Beastie variant unlock opportunity.*
- **Imbolc (1–2 Feb)** — Brigid's-Day seasonal. Ewes-lactating world-tint (warmer moor palette). Earliest-spring wildflowers overlay.
- **St Andrew's Day (30 Nov)** — saltire blue-white palette tint. Unique NPC: a Saltire-clad cairn-NPC grants a flag-themed buff.
- **Up Helly Aa (last Tuesday of January)** — Shetland Viking fire festival. Longship burn event triggers. Unlocks access to a temporary Shetland biome fragment for the week.
- **Beltane (1 May ± 3 days)** — Cailleach transforms to May Queen (variant reskin if Cailleach active). Fire buffs. Edinburgh's Beltane Fire Festival overlay available.
- **Samhain / Halloween (31 Oct – 1 Nov)** — Cat Sith appears. Wild Hunt event. Veil-thinning banter. Extra ghost enemies. (*Ref: `SCOTTISH_RESEARCH.md` §1.2.*)
- **Summer Solstice / Simmer Dim (21 June)** — extended twilight palette in Shetland biome.
- **Lùnastal / Lammas (1 August)** — harvest-start season. Wheatsheaf motif. Agricultural-fantasy banter.
- **Glorious Twelfth (12 August)** — grouse-shooting season opens; tourist-hunter enemies appear more frequently. Meta: haggis hunters are *extra* active this week.
- **Bracken-turn (October–November)** — moor palette shifts to copper-bronze. XP bonus.
- **Tartan Day (6 April, North America diaspora)** — diaspora-flavoured event. Accessible tartan patterns for cosmetics.
- **Declaration of Arbroath anniversary (6 April)** — overlaps Tartan Day. Narrative-banter thread: "For as long as but a hundred of us remain alive…"
- **Bannockburn anniversary (23–24 June)** — victory-themed. Wallace/Bruce relic drop rate bumped.
- **Culloden anniversary (16 April)** — sombre, respectfully handled. Jacobite spectre enemies spawn. No festive banter. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §6.9.*)
- **Stonehaven Fireballs (31 Dec)** — Hogmanay sub-event. Fireball-swing hazard overlay.

**Scoping rule.** Each seasonal event should be 3–7 days long in real-world calendar and NEVER FOMO-lock content — unlocks available year-round, but the *celebration* is the seasonal window.

---

## 13. Scottish games-lineage homages (ideas)

Scotland is a games country — Dundee's DMA Design (now Rockstar North) created Lemmings and GTA. Abertay University pioneered games degrees. WHS can pay affectionate, well-placed homages. (*Ref: `SCOTTISH_RESEARCH_DEEP.md` §21.*)

- **Lemmings easter egg** — if the player stands idle in a cliff-edge biome for 90 seconds, a tiny line of pixel lemmings walks across the screen, falls off the edge with the iconic "OH NO!" SFX, and a toast: "The lemmings remember ye." Reserved once-per-variant trigger.
- **DMA/Dundee nod** — a hidden NPC in an urban biome (perhaps the future Clyde Shipyard or a Dundee-themed micro-biome) named "Davey Jones" or "The Founder" with indirect banter about "building something direct, like memory."
- **GTA top-down micro-section** — a secret indoor biome where the rendering briefly shifts to a GTA-1-style top-down view for a joke sequence. Very hidden, very rare.
- **Beano/Dandy references** — Dundee is home of the *Beano*; Dennis the Menace / Desperate Dan nods possible (cameo tourist enemy with characteristic silhouette). Handle IP-carefully (references only).
- **Macintosh (the computer)** — sly reference given Apple's name shares with Charles Rennie Mackintosh and "mackintosh" (rain coat, invented by Charles Macintosh). Triple-pun potential.
- **Abertay University wink** — a hidden NPC "Professor Abertay" who awards students… with a pixel-art diploma. Tiny, obscure, kind.
- **"Still Game" tribute** — if a legitimate nod can happen (fair-use-adjacent), a background NPC named "Boabby" in a pub-biome tavern banter scene.
- **Celtic pattern credit** — hidden credits page that lists the Pictish-stone + Celtic-knot + Mackintosh-rose inspirations explicitly, as a love-letter to Scottish visual tradition.

**Rule.** Homages are deep-cut and *discovered* rather than advertised. They're love letters to Scottish games history — reward for the attentive.

---

## 14. Hard-no list (ideas that do not fit)

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
