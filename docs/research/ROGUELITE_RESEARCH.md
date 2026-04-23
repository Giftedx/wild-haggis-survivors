# Roguelite Research — 25 Games, Distilled for Wild Haggis Survivors

> **Purpose.** A working reference for designing masterpiece-grade features, content, and mechanics for Wild Haggis Survivors. This doc is a *tool*, not a shrine. Read it cluster-by-cluster; skim the "Smart approaches" bullets when you need a spark; cite it from specs/plans in `docs/superpowers/`.
>
> **How to use this.**
> 1. When designing a new system, open the matching cluster (Survivor-likes for combat, Action Roguelites for feel, Strategy for decision architecture, Hybrids for weird magic).
> 2. Scan "Smart approaches worth stealing."
> 3. Check the **Cross-Game Pattern Library** for the generalised principle.
> 4. Check the **WHS Gap Analysis & Opportunity Map** before writing a spec — it already maps patterns to systems in our codebase.
>
> **Scope.** 25 games, weighted toward WHS's DNA (action / bullet-heaven / survivor-like) with canonical roguelites added for breadth. Each entry is a deep-dive: core loop, procgen, progression (in-run + meta), weapons/builds, synergy, art/music/feel, easter eggs, and the *smart things we should steal*.
>
> **North star.** Every lesson in here must be filtered through `docs/DESIGN_SOUL.md` — warmth, Highland fantasy, failure-as-kindness, handcrafted detail. If a pattern is cold, grindy, or player-hostile, we note it and move on.
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — foundation for forthcoming specs/plans.

---

## Table of Contents

1. [Methodology & How Entries Are Structured](#methodology--how-entries-are-structured)
2. [The 25](#the-25)
3. [Cluster A — Survivor-Likes & Bullet-Heavens (9 games)](#cluster-a--survivor-likes--bullet-heavens-9-games)
4. [Cluster B — Action Roguelites (8 games)](#cluster-b--action-roguelites-8-games)
5. [Cluster C — Strategy & Deck-Builders (5 games)](#cluster-c--strategy--deck-builders-5-games)
6. [Cluster D — Hybrids & Unconventionals (3 games)](#cluster-d--hybrids--unconventionals-3-games)
7. [Cross-Game Pattern Library](#cross-game-pattern-library)
8. [WHS Gap Analysis & Opportunity Map](#whs-gap-analysis--opportunity-map)
9. [Appendix — Further Reading & Related Genres](#appendix--further-reading--related-genres)

---

## Methodology & How Entries Are Structured

Every entry follows the same template so you can compare across games quickly.

- **One-line pitch.** What the game *is*, in the voice you'd use to sell it to a friend.
- **Why it matters.** The historical / design significance — why this game made the list.
- **Core loop.** The 30-second description of what players actually *do*.
- **Procedural generation.** What's procgen'd, what's authored, and the seam between them.
- **In-run progression.** How builds develop during a single run (cards, drops, upgrades).
- **Meta-progression.** What persists across runs, and how it's curved.
- **Weapons / builds / combinations.** Combat system, build diversity, synergy expression.
- **Art / music / feel.** Aesthetic direction and juice choices.
- **Easter eggs & secrets.** Hidden content, community discoveries, lore breadcrumbs.
- **Smart approaches worth stealing.** Bullet list of transferable design ideas.
- **Traps to avoid.** (When relevant) — what NOT to copy.

A heads-up on genre lines: "roguelite" in this doc means *structured runs with meta-progression and heavy procedural/random elements* (Hades, Vampire Survivors, Slay the Spire all qualify). Pure roguelikes (NetHack) are out of scope.

---

## The 25

**Cluster A — Survivor-likes & Bullet-heavens** (WHS's home genre)
1. Vampire Survivors
2. Brotato
3. Halls of Torment
4. HoloCure
5. 20 Minutes Till Dawn
6. Soulstone Survivors
7. Deep Rock Galactic: Survivor
8. Death Must Die
9. Yet Another Zombie Survivors

**Cluster B — Action Roguelites**
10. Hades (and Hades II)
11. The Binding of Isaac: Rebirth
12. Dead Cells
13. Risk of Rain 2
14. Enter the Gungeon
15. Spelunky 2
16. Rogue Legacy 2
17. Returnal

**Cluster C — Strategy & Deck-builders**
18. Slay the Spire
19. Balatro
20. Monster Train
21. Inscryption
22. FTL: Faster Than Light

**Cluster D — Hybrids & Unconventionals**
23. Noita
24. Loop Hero
25. Cult of the Lamb

The cluster ordering prioritises relevance to WHS first. All 25 earn their spot through either (a) direct mechanical lineage with bullet-heavens or (b) a design innovation too transferable to ignore.

---

## Cluster A — Survivor-likes & Bullet-heavens (9 games)

This cluster *is* WHS. Every game here answers the same question — "how do you make survival against a rising tide of enemies feel joyful, buildcraft-y, and endlessly replayable?" — and each answers it differently. Read this cluster end-to-end. It is the highest-density lesson pool in the doc.

---

### 1. Vampire Survivors

- **One-line pitch.** Gothic auto-attacking bullet hell where a single stickman becomes a planetarium of death over 30 minutes.
- **Why it matters.** Defined the modern survivor-like genre single-handedly. Its mechanical vocabulary — picking weapons/passives, max-level evolutions, relic unlocks, 30-minute round, The Reaper timer — is the dialect every survivor-like speaks in. WHS speaks it too.

**Core loop.** Walk. Enemies chase. Weapons auto-fire. Gems drop. Level-ups present three cards. Chests drop from minibosses with 1–5 random weapon levels. At 30:00, the Reaper spawns and ends the run. Gold banks toward meta upgrades. Repeat.

**Procedural generation.** Almost zero procedural *layout* — maps are handcrafted (the Library, Gallo Tower, Capella Magna). The procgen is in *card draws*, *enemy spawn curves*, and *chest contents*. Smart choice: because levels aren't procedural, every playthrough is mechanically identical but *strategically* different based on card RNG. It lowers the "procgen surprise tax" and puts pressure on build variety.

**In-run progression.** Six weapon slots + six passive slots. Each weapon tops out at Level 8. Evolutions require Level 8 weapon + corresponding max-level passive + any chest drop. The level-up card pool is weighted (common/uncommon/rare), with banish and skip buttons purchasable via Arcanas. The progression is a *collection* metaphor — you're filling a loadout grid.

**Meta-progression.** (a) **Power Ups** — global stat boosts bought with gold (+max HP, +area, +duration, etc.); (b) **Character unlocks** — via lore-driven "find X on map Y" puzzles; (c) **Arcana cards** — pickable each run, trigger unique build-enabling effects; (d) **Secret characters** (Inverse mode, Eggs) that completely rewrite the experience.

**Weapons / builds / combinations.** ~50+ base weapons, ~25+ evolutions, ~10+ "unions" (two evolutions fused into a super-form like *Bloody Tear → Yellow Sign*, *Vicious Hunger* etc.). Weapons have distinct *behaviors* — orbiting (Garlic), projectile (Magic Wand), area (Axe), trail (Cross), persistent (King Bible), sacrificial (Santa Water). Builds emerge from matching weapon types to passives that amp their *vector* (Empty Tome for cooldown, Tiragisù for revives, Duplicator for +1 projectile).

**Art / music / feel.** Pixel art, deliberately cheap-feeling early on — the joke *is* that the game looks primitive and sounds like MIDI, but the screen fills with breathtaking spectacle by minute 20. Audio is simple stingers. The *real* feel win: no screen shake, no hit freeze, but the density of enemy-popping numbers creates perceived chaos. Music is looping, mood-setting, not reactive.

**Easter eggs & secrets.** Legendary. Items hidden in map corners (Milky Way Map), secret characters unlocked by obscure rituals (burn the Inlaid Library, Stone Mask + specific weapon = Exdash). Red Death, the over-leveled reaper. Inverse Mode (mirrored difficulty). The Bone Zone. The very existence of *more* content than players discovered for *years* is part of the game's identity.

**Smart approaches worth stealing.**
- **Evolutions gated on chest drops** (not just level) — extends the "moment of ascension" beyond a single level-up card.
- **Arcanas as run modifiers** — a second, persistent progression layer orthogonal to weapons/passives.
- **Banish + skip cards** as paid utility — gives players agency over RNG without removing it.
- **Stage-as-puzzle** — each map hides a character unlock, turning exploration into meta-progression.
- **"Bad guys get kicked out of the map"** — border-push mechanics (Laurel, Mirage Robe) let players sculpt the battlefield.
- **Coffin pickups** — unlock character previews that double as lore beats.
- **Reaper timer** as a death-is-the-end-anyway release valve — removes "optimal exit" decision paralysis.

**Traps to avoid.** Vampire Survivors' art and UX feel intentional-cheap; WHS has chosen handcrafted warmth, so *do not copy the sparse UI or MIDI audio direction*. The juice-by-density trick (screen full of numbers) also doesn't fit our Soul charter — we want punchy feedback, not overwhelming spew.

---

### 2. Brotato

- **One-line pitch.** Stationary (per wave) survivor-like where a potato with dozens of character variants shops between waves for weapons and items.
- **Why it matters.** Proved the wave-based / shop-between structure as a serious alternative to the continuous-timer model. Brotato's "characters as constraint puzzles" is one of the best content-multiplication designs in the genre.

**Core loop.** 20 waves, ~20–40s each. Between waves, a shop rolls 4 items/weapons; you buy, reroll (for +1 cost each reroll), lock. Gold is earned by damage + pickups + wave completion. At wave 20 a boss spawns; wave 21+ is endless with cascading danger.

**Procedural generation.** Shop contents (weighted by tier). Wave composition (enemy mix scales). Elite modifiers. No map procgen — arena is fixed.

**In-run progression.** Six weapon slots, item slots grow. Weapons come in four tiers (Tier I–IV). Higher-tier weapons cost exponentially more. Items grant flat stats, triggered effects, or combos (e.g., "heals on crit"). Numbers are huge and satisfying — +100 HP, +50% damage, +2 harvest, etc.

**Meta-progression.** **Characters** are Brotato's meta. 40+ characters, each with a rule change — *Speedy* (+50% speed, −50% HP), *Crazy* (can't stop moving, chained weapons), *One-Armed* (1 weapon slot, massive stats), *Engineer* (turrets replace weapons), *Glutton* (food consumption as mechanic). Each character is a *different game*. Dangers (0–5) scale difficulty. Unlocking proceeds via "win with X character" style challenges.

**Weapons / builds / combinations.** ~60+ weapons grouped by *element* (ranged, melee, tool, support) and *scaling* (damage, attack speed, crit, etc.). Weapon *sets* of 6 identical give huge bonuses — encourages hoarding one kind. Items explicitly list what they *synergise with*. Build diversity is enormous — shotgun-only, laser-only, engineer-only, summoning-only.

**Art / music / feel.** Clean, chunky, readable pixel art with high-contrast outlines. Music is upbeat, drum-heavy, loops per-arena. Feel wins: weapon impact sounds are crunchy; harvest pickup is melodic; wave-end "DING" is dopamine. Cartoon vegetables as characters keep the tone light despite the power fantasy.

**Easter eggs & secrets.** Hidden characters (Jack, Curious, Apprentice), some unlocked by completing in particular ways (win Wave 20 with 0 HP, etc.). A quietly hilarious Potato Cosmology in the character descriptions.

**Smart approaches worth stealing.**
- **Wave-based structure with between-wave shop** — gives players reflection space, surfaces difficulty anticipation, teaches mechanics incrementally.
- **Reroll cost escalation** — every reroll +1 gold cost *within* a shop turn; resets per wave. Elegant economy tuning.
- **Characters as design constraints** — each character is a distinct build-target and a content multiplier. 40 characters × 20 waves = 800 "different" runs.
- **Weapon tier as shop pricing** — keeps early weapons cheap and late-game builds committed.
- **Item tooltips explicitly listing synergies** — reduces wiki dependence, rewards reading.
- **Dangers 0–5 as self-selected difficulty** — Ironmoor exists in WHS; Brotato shows how granular difficulty scaling can be.
- **"Hoard 6 of the same weapon" set bonus** — simple, legible, high-skill-ceiling.

**Traps to avoid.** Brotato's stationary-between-waves feel might clash with WHS's continuous movement identity. The between-wave shop is *great*, but we'd want it at Moor Road intermissions, not every 30s.

---

### 3. Halls of Torment

- **One-line pitch.** Diablo-inspired survivor-like where every build culminates in a *legendary* class-defining item.
- **Why it matters.** Shows how to marry classic ARPG aesthetic (isometric perspective, loot rarity colours, class fantasy) with the survivor-like loop. Also the strongest example of "dungeon-themed" rather than "arena-themed" survivor-like.

**Core loop.** Pick a class (Warlock, Archer, Sorceress, Cleric…). Enter a dungeon-themed arena. Kill for XP + gold + loot drops. Fight a named boss at ~15 mins. Complete if survived, or die at any point. Loot persists (slotted on character); character levels persist.

**Procedural generation.** Minimal for arena layout — stages are bespoke (Haunted Crypts, Forgotten Viaduct, Ember Grounds). Procgen is in loot drops, enemy waves, and chest contents.

**In-run progression.** Attacks (primary + secondary) level up into stronger versions. Traits grant passive stat buffs. Achievements complete mid-run (e.g., "kill 100 boss enemies" → unlocks new item for future runs). Loot drops have rarity and *stats*.

**Meta-progression.** **Loot as meta-currency.** Kill bosses → drop class-specific gear. Gear slots into your character permanently. Next run, that gear comes with you. **Achievements** unlock new items, characters, and difficulty tiers. The progression curve feels ARPG-slow — you'll farm a specific boss for a rare drop.

**Weapons / builds / combinations.** Each class has a distinct primary attack (Warlock's flames, Archer's arrows, Cleric's holy aura). Secondary attacks add variety. *Legendary items* are the climax — unlocked via specific achievements, they fundamentally change a class (e.g., arrows that explode in chains). Build paths form around primary attack → supporting traits → legendary item.

**Art / music / feel.** Isometric pixel art that reads as Diablo II crossed with Hades. Palette is dungeon-dark with readable enemy silhouettes. Audio is atmospheric chants, crisp impact sounds, satisfying loot-drop jingles. Juice: floor ripples on big hits; enemy death animations; loot glows by rarity.

**Easter eggs & secrets.** Hidden bosses triggered by specific actions. Shrines with cryptic inscriptions that unlock traits. Ambient storytelling through environmental details (skeletons posed in specific tableaux).

**Smart approaches worth stealing.**
- **Legendary items as build-enabling capstones** — far more impactful than "+5% damage" upgrades.
- **Achievements as unlock vectors** — turns play into discovery. "Kill 100 bosses" gives a clear mountain to climb, with legendary-item reward at the top.
- **Persistent equipment between runs** — blurs the line between roguelite and ARPG. Risky for pacing, but wonderful for investment.
- **Class fantasy as build-narrative** — every class *feels* like its archetype. WHS characters (beyond the base haggis) could lean on this hard.
- **Loot rarity colours as a universal grammar** — common → uncommon → rare → epic → legendary, instantly parseable.
- **Named bosses with backstory** — names are memorable hooks. Each WHS boss should feel like an antagonist, not a stat block.

**Traps to avoid.** Loot grind can erode run individuality — every run becomes "farm this item". WHS's chest system is already less grindy; keep it that way.

---

### 4. HoloCure

- **One-line pitch.** Free, Hololive-VTuber fan-game that's also *the* master-class in survivor-like character variety and loveable detail.
- **Why it matters.** HoloCure quietly became one of the deepest survivor-likes on the market. Its character-specific mechanics, "Super" finishers, and collab (weapon fusion) system push the genre forward mechanically, not just aesthetically.

**Core loop.** Pick a VTuber. Fight 20 mins in a themed stage. Kill collects *coins*, *food* (heal), *anvils* (upgrade weapon), *super-chats* (temporary buff). Level up → pick from cards. At 20 min a *super boss* spawns; defeat = win, survive = endless.

**Procedural generation.** Minimal layout procgen; it's in card pools, item drops, anvil-upgrade RNG, and event spawns (meteor showers, Holozon delivery trucks).

**In-run progression.** Weapons cap at Level 7, then can be *upgraded* via Anvil (random tier roll: Basic → Epic → Super → Special) with stat variance per upgrade. Collabs fuse two specific weapons into a third, unique weapon. Stat items provide flat boosts + passive effects. Holozon shop (in-run) sells items mid-run.

**Meta-progression.** (a) **Character unlocks** — in-run shop spends coins to permanently unlock Hololive characters. (b) **Upgrades shop** — global stat buffs. (c) **Stage clears** — new stages, new difficulty tiers. (d) **Achievements** galore.

**Weapons / builds / combinations.** Each character has a *unique starting weapon* thematic to their VTuber persona (Ina's tentacles, Kronii's time, Fauna's rose). *Collabs* fuse weapons — e.g., *Elite Lava Bucket = Lava Bucket + Elite Cooking*. These aren't just upgrades; they change the weapon's character. Collabs are WHS's *weapon evolutions* done at scale and with signature flair.

**Art / music / feel.** Handdrawn anime pixel art, *every* character has custom animations. Music is custom per-stage. Voice clips from real VTubers — pickups say "Thank you!", level-ups cheer, bosses taunt. The *soul* of HoloCure is its fan-made love — it feels like every pixel was placed with affection. **This is the closest aesthetic kin to WHS's north star.**

**Easter eggs & secrets.** References to VTuber in-jokes that only fans catch; hidden stages; special "Super" finishers that activate mid-run and freeze the screen into cinematic one-shots. A stage boss is a collab member.

**Smart approaches worth stealing.**
- **Collab system (weapon fusion)** — extends WHS's evolutions from paired-passive to *paired-weapon*. Two Level-5 weapons fuse into a third. Imagine *Claymore + Caber = Highland Charge*.
- **"Super" abilities** — character-unique ultimate that activates once per run, screen-stopping cinematic. A haggis "Super" could be the defining kinetic moment of a run.
- **Voice lines tied to moments** — pickups, level-ups, bosses. WHS's banter framework is perfectly positioned for this.
- **Anvil upgrade RNG** — post-max-level weapons get a *second* progression axis. Upgrades are rolls, not choices, creating a "slot machine" rhythm when you reach endgame.
- **In-run shop (Holozon)** — a mid-run spend gate distinct from level-up cards. Brotato has it between waves; HoloCure has it during.
- **Character-specific starting weapons** — every WHS character (if we add more) should have a *signature* weapon, not a shared pool.
- **Stage-clear unlocks** — beating a stage unlocks the next; gives players a horizon.

**Traps to avoid.** HoloCure leans on licensed fan-love. WHS must forge its own version of that — Scottish character-driven warmth — from scratch. Also: HoloCure's UI is busy; ours needs to stay clean.

---

### 5. 20 Minutes Till Dawn

- **One-line pitch.** Twin-stick survivor-like where you *aim manually* — the only one in the cluster to make aiming a skill expression.
- **Why it matters.** Proves that removing auto-aim from the survivor-like formula creates a completely different feel. Also has the tightest *build synergy* card system in the genre — cards read like Slay-the-Spire relics.

**Core loop.** 20 minutes. Manual WASD-move + mouse-aim shooting. Reload mechanic (hold R). Level up → pick a card. Die or survive 20 minutes. Characters unlock new starting rules.

**Procedural generation.** Fixed map; procgen in card draws, enemy spawns, gem drops, event timing.

**In-run progression.** Every level-up offers 3 cards from a pool of ~100+. Cards combine *aggressively*: *Chain Lightning* (bullets chain) + *Fire Bullets* (bullets ignite) + *Piercing* (bullets pierce) stacks into apocalyptic combos. Some cards have *gates* ("unlocks if you have Fire Bullets").

**Meta-progression.** **Rune system** — runes earned across runs unlock new characters, new cards, new weapons. Runes are earned by achievements like "kill 1000 enemies with fire damage." The unlock list is long and visible, creating a persistent "almost there" loop.

**Weapons / builds / combinations.** ~20 weapons (pistol, shotgun, sniper, SMG, minigun…). Each has distinct ballistics. Cards define the build — *Homing Bullets*, *Ricochet*, *Chain*, *Explosive*, *Fire*, *Ice*, *Poison*, *Lifesteal*, *Crit*. **Card combos are the game.** A shotgun + *chain* + *pierce* + *ricochet* + *explosive* becomes a room-clearing miracle. Characters force archetypes — *Shana* gets bonuses to fire damage, making pyro-builds her signature.

**Art / music / feel.** Dark, silhouette-first pixel art, single-bit lighting via lantern around the player (FOV limit). Minimalist palette. Gunfire lights up enemies as they emerge from dark. **Atmosphere is a mechanic** — you can't see far, so sound and movement matter more. Audio is punchy, minimalist stingers. Reload click is iconic.

**Easter eggs & secrets.** Hidden characters, secret card interactions discovered by community. Rare seeds that spawn oddly-shaped maps.

**Smart approaches worth stealing.**
- **Gated cards** (conditional on previous picks) — turns the level-up pool into a decision tree with branches.
- **Character archetype → card affinity** — makes character choice meaningful for the entire card pool's interpretation.
- **Reload as skill gate** — a single "wait to reload" moment forces decision-making under pressure. WHS doesn't have reload, but the principle (small skill-gate moments inside auto-combat) is valuable.
- **FOV darkness as atmospheric mechanic** — WHS has fog patches already; pushing this to a *lantern* visual could elevate dusk/night biomes.
- **Big runes for big achievements** — meta-progression where every milestone has a specific unlock. More satisfying than linear gold-shop.
- **Combo discovery joy** — Chain + Pierce + Explosive needs to be discovered *by the player*, not recommended by the tooltip. Some card synergies in WHS should be emergent, not advertised.

**Traps to avoid.** Manual aiming doesn't fit WHS's auto-fire identity. The *lesson*, not the mechanic, transfers.

---

### 6. Soulstone Survivors

- **One-line pitch.** Arena-brawler survivor-like with ARPG depth, skill trees, and co-op.
- **Why it matters.** Introduces "enemy modifiers" (monsters can have affixes, like Diablo elites) into the survivor-like lexicon. Also the cluster's strongest example of *skill tree* as meta-progression.

**Core loop.** Pick character. Enter themed arena. Slay waves. Pick upgrade cards at level-ups. Defeat the boss. Progress unlocks new arenas, character skill trees, and gear.

**Procedural generation.** Procgen is in enemy modifiers (elites can be *frozen*, *burning*, *reflective*, *vampiric*…), card pools, and gear drops. Arenas are fixed.

**In-run progression.** Standard survivor-like cards + gear slots. Skill points allocated into character skill trees *mid-run* based on level.

**Meta-progression.** **Skill tree per character** — traditional ARPG-style branching with passives, actives, and capstones. Unlocks fed by *Soulstones* (drop from elite kills). Also has gear crafting / enchanting between runs.

**Weapons / builds / combinations.** Primary weapon + skill slots. Enemies' *modifiers* force adaptation (if elites are "thorns", kiting builds suffer). Weapon types: melee, ranged, magic, summon. Skill tree structure makes each character feel like a deliberate mini-RPG class.

**Art / music / feel.** 3D-ish top-down with flashy spell VFX. Music is metal-tinged orchestral. Feel: heavy. Every skill ability lands with screen-wide impact.

**Easter eggs & secrets.** Hidden rooms in arenas, cursed items with drawback-bonus tradeoffs, lore unlocks tied to specific elite kills.

**Smart approaches worth stealing.**
- **Enemy modifiers** (affixes on elites) — a modest content multiplier. A *frozen gordon* behaves differently from a normal one. WHS has an elite system; affixes are the next step.
- **Skill tree per character** — branching meta-progression instead of linear shop. Takes more design work but creates strong character identity.
- **Cursed items with active drawbacks** — "take +50% damage to deal +100% damage." Players love trading.
- **Soulstones as elite-only currency** — rare drops create a separate progression stream tied to risk.

**Traps to avoid.** Skill trees can paralyze. Keep them short and punchy, not MMO-deep.

---

### 7. Deep Rock Galactic: Survivor

- **One-line pitch.** DRG-universe survivor-like where you mine as you kill, with a vertical biome structure.
- **Why it matters.** Introduces *resource gathering* and *verticality* to the genre. Every kill drops minerals that serve as an XP/currency hybrid. Also the most *cooperative-feel* single-player survivor-like — the voice lines and world fit sell a fantasy of teamwork even when solo.

**Core loop.** Drop into biome. Mine minerals (Morkite, Gold, Nitra) while surviving waves. Ascend through layers (each biome deeper = harder). Reach extraction. Between biomes, spend currency on upgrades.

**Procedural generation.** Biome selection + modifier combinations (hazard level, anomalies). Mineral distribution. Enemy mix.

**In-run progression.** Weapons (paired with class — Scout/Gunner/Driller/Engineer). Upgrades chosen at level-ups. Overclocks are powerful late-run picks that transform weapons.

**Meta-progression.** (a) Class XP → unlock new upgrades per class. (b) Mineral currencies banked → buy crafted items. (c) Season pass-style unlocks.

**Weapons / builds / combinations.** Each class is fundamentally different (Scout's grappling + directed fire, Driller's AoE digging, Engineer's turrets/platforms). Overclocks fundamentally reshape a weapon — "this minigun now fires grenades" style.

**Art / music / feel.** Stylised low-poly 3D, faithful to DRG's aesthetic. Music is dwarf-chant-metal. Feel: rumble, dust, voice-line banter ("Rock and stone!"). The dwarfen voice acting is the juice.

**Easter eggs & secrets.** Hidden anomalies in biomes. Rare enemy variants. Secret bosses triggered by specific biome clear streaks.

**Smart approaches worth stealing.**
- **Vertical biome progression within a single run** — descend through biomes, each harder than the last. WHS's Moor Road acts gesture at this; DRG:S shows the structure at full expression.
- **Resource gathering as secondary loop** — minerals create *two* rewards per enemy kill (XP + resource). Doubles dopamine density.
- **Overclocks as rare, transformative weapon mods** — beyond upgrades, beyond evolutions — these *rewrite* a weapon.
- **Voice-line banter that's purely flavour** — "For Karl!" hits every 60s. Zero mechanical impact, huge emotional impact.
- **Class identity so strong the class *is* the playstyle** — Gunner is hose-DPS, Driller is carve-terrain, Engineer is turret-walls. Characters should *feel* different, not just stat-different.

**Traps to avoid.** Verticality requires real biome art budget. WHS could simulate it via sequential acts rather than layered maps.

---

### 8. Death Must Die

- **One-line pitch.** Diablo-style survivor-like where gods grant you powers mid-run.
- **Why it matters.** Features a *god-pact* system where level-ups let you choose boons from different gods (Hades-ish), but it's a survivor-like. Also has some of the best *visual juice* in the cluster.

**Core loop.** Pick character (Asa, Avoc, Kront...). Enter a zone. Fight waves. Level-up = choose a blessing. Bosses drop gear and currency. Die or complete stages.

**Procedural generation.** God pool that appears in a run is random (you'll see 3–5 of a larger roster). Blessing draws are from *those gods*. Mini-procgen narrative — "who blessed you" becomes the run's identity.

**In-run progression.** Gods each have ~10 blessings. Gods have tiers — low-tier god = common blessings, high-tier god = rare, build-defining ones. Jewels (gear) drop from bosses.

**Meta-progression.** **Jewels** — equippable gear banked between runs. **Character unlocks**. **Gods unlocked for the pool** as you progress.

**Weapons / builds / combinations.** Characters have distinct weapons; blessings modify them. E.g., Frost god's blessings add freeze; Fire god adds burn. Stacking multiple gods creates hybrid builds; committing to one god's capstone blessing creates *focused* builds.

**Art / music / feel.** Semi-3D with strong particle work. Blessings *glow* with god-colour. Boss fights are cinematic. Music is orchestral with god-themed motifs. Particles are where this game *wins* — every blessing feels like an anime spell.

**Easter eggs & secrets.** Hidden characters. Rare god encounters (some gods don't appear often). Lore fragments in gear descriptions.

**Smart approaches worth stealing.**
- **Gods as meta-groups that gate blessings** — a themed "supplier" of upgrades. For WHS, imagine *spirits of the Highlands* (Cailleach, Nuckelavee, Each-uisge) each offering thematic blessings.
- **God pool randomised per run** — the *blessings available* change every run, creating strategic identity early.
- **Tiered gods** — low-tier gods always in pool, high-tier rare. Rewards runs where a legendary god shows up.
- **Blessing colour-coding by god** — instant visual language for build identity.
- **Jewels as modest persistent progression** — not as heavy as Halls of Torment, not as flat as shop upgrades.

**Traps to avoid.** God pantheons can feel derivative of Hades. Make Highland spirits *ours*, not borrowed Greek.

---

### 9. Yet Another Zombie Survivors

- **One-line pitch.** Squad-based survivor-like — you control a *team* of three, each with their own weapon.
- **Why it matters.** The only survivor-like where you control multiple characters at once. Forces distinct build thinking and creates emergent positioning puzzles.

**Core loop.** Pick 3 characters from unlocked roster. Squad auto-fires. Level up = pick upgrade for any squad member. Bosses drop elite weapons.

**Procedural generation.** Wave composition, card draws.

**In-run progression.** Each squad member has their own weapon + passives. Level-ups can boost any of them. Unique *team-wide* passives exist (e.g., "all members gain +X").

**Meta-progression.** Character unlocks via challenges. Each character has unique stats and starting weapon.

**Weapons / builds / combinations.** Core mechanic: which 3 do you bring? Synergies emerge (sniper + tank + medic, or triple-minigun). Level-ups must be spread — starving one character creates a weak-link.

**Art / music / feel.** Comic-ish pixel art. Upbeat action music. Feel: power-through-numbers. Zombies burst into voxels.

**Easter eggs & secrets.** Hidden characters unlockable via creative play.

**Smart approaches worth stealing.**
- **Squad selection as build foundation** — the *pre-run* decision carries more weight than a single-character game. A WHS "second character" (if added) could shift this way — pick two haggis variants.
- **Shared level-up economy across members** — creates trade-off: boost the weak link or snowball the carry?
- **Team-wide passives** — a card that buffs all squad members, scarce but powerful.

**Traps to avoid.** Squad control complicates UI and AI. Don't do this unless the "team" fantasy is core to a future WHS feature.

---

## Cluster B — Action Roguelites (8 games)

The action-roguelite cluster is where the genre learned to feel *good*. Hades wrote the modern bible on roguelite *storytelling*. Dead Cells wrote the one on *kinetics*. Isaac on *emergence*. Every game here solves one of the problems WHS will eventually need to solve.

---

### 10. Hades (and Hades II)

- **One-line pitch.** A god escapes Hell, over and over, while a dysfunctional divine family watches and comments.
- **Why it matters.** Hades is the single most influential roguelite of the last decade for *narrative integration*. It proved that a roguelite can have a main story, fully voice-acted NPCs, and an ending — without compromising run-based structure. Hades II extends every system. **Every one of WHS's banter, lineage, soul-charter decisions has a Hades reference point.**

**Core loop.** Escape the Underworld → 4 chambers → Zagreus's house → voiced conversations with everyone → try again with mirror upgrades + new boons + new weapon aspect. Death *is* the story.

**Procedural generation.** Rooms are chunks assembled from a bank. Each room telegraphs rewards via a door icon (boon, currency, gem, darkness, nectar, keepsake). Procgen serves *pacing* — you know what rooms lie ahead, not just what's inside.

**In-run progression.** **Boons** from 10+ Olympians — each Olympian has ~30 boons, covering attack/special/cast/dash/call + support boons. Boons stack in *duos* (Artemis + Ares = *Hunter's Flare*), creating emergent synergies. Hammers modify the core weapon. Poms of Power upgrade boon levels. Fountain rooms heal. Wells sell items.

**Meta-progression.** **Mirror of Night** — persistent perk tree, bought with Darkness. Two choices per row (e.g., "Death Defiance" vs "Stubborn Defiance"). Fully swappable mid-run. **Weapon Aspects** — unlocked via blood. Aspects are build-defining rewrites (Aspect of Arthur makes Stygian Blade a slow greatsword). **Keepsakes** — accessories granting a boon on first-room pickups, rewarded via gifting nectar to NPCs. **Heat** — self-chosen difficulty modifiers post-credits (adds enemy HP, fewer cures, timed rooms).

**Weapons / builds / combinations.** Six weapons, each with 4 Aspects = 24 distinct playstyles. Builds form around a *core boon chain* — a single god's attack + special + cast synergises into a legendary Duo. Boons have *rarity* (common → epic → heroic → legendary) and tier scaling. Build thinking = "did I see the right pre-requisites yet?"

**Art / music / feel.** Handpainted 2D art, hand-animated characters. Music is Darren Korb — rock/orchestral/Greek folk fusion. Feel: every ability is *crunchy*, every enemy death has a *pop*, voice lines fire at contextual moments (Zagreus greets bosses by name; Cerberus reacts to first-time escapes). **The art-music-voice trio is unmatched.**

**Easter eggs & secrets.** Night's gifts. Fated List quests. Rare NPC encounters (Hypnos commentary varies by death type). Post-ending "surprise me" mode. Hidden weapon aspects unlocked by story beats. Every prophecy has a reward.

**Smart approaches worth stealing.**
- **Story told through failure** — every death advances narrative. WHS's death screens could surface a paragraph of in-world reflection from the haggis, Gran, or the Cailleach.
- **Boons with duo synergies** — two-deity combos trigger rare blessed effects. WHS evolutions could stack into *union* evolutions for rarer pay-offs.
- **Keepsakes as pre-run commitment** — a choice you make *before* starting shapes the run. WHS could introduce a "Wee Charm" slot (one per run).
- **Heat / Pact of Punishment as layered difficulty** — self-chosen modifiers that stack for personal mastery. Ironmoor exists; a heat-style system could live on top of it.
- **Hammers as one-per-run mega-choices** — a pickup that fundamentally mods your weapon. WHS could introduce *Moor Hammers* as rare drops that rewrite a weapon's behaviour.
- **Voice lines everywhere** — Hades has ~21,000 lines. WHS doesn't need voice acting, but banter density (per event, per enemy, per biome) can approach Hades levels.
- **Mirror as dual-choice perks** — swappable mid-run, both flavours available. Elegant meta upgrade design.
- **Fated List** — a post-unlock checklist of discoveries with rewards. Surfaces "what's left to find" without spoiling.
- **House as persistent hub** — a space that changes as progression deepens. WHS could have a persistent *croft* or *Gran's cottage* that fills up over time.

**Traps to avoid.** Hades's budget is legendary. WHS must lean on our own flavours (Scottish warmth) rather than trying to out-polish a AAA-sized roguelite. Voice acting is out of scope; written banter is the transfer mechanism.

---

### 11. The Binding of Isaac: Rebirth

- **One-line pitch.** A child flees his murderous mother through a nightmare-themed dungeon; the game has approximately infinite items.
- **Why it matters.** Isaac is the genre's emergence champion. 700+ items with *stacking, multiplicative, item-interaction* behaviour. Nothing else in the roguelite canon has this much combinatorial wildness. Every run is uniquely broken.

**Core loop.** Clear room → pick item if offered → descend → beat boss → descend again → final boss → endings. Runs are short (20–40 min).

**Procedural generation.** Level layouts procedurally assembled from room banks. Item pool drawn per-run. Enemy composition varies.

**In-run progression.** Every item picked up stays. Stats stack (tears per second, damage, range, speed). Item *interactions* can create ridiculous compound effects (polyphemus + tammy's head = screen-filling ordnance).

**Meta-progression.** **Unlocks** — every new item, character, transformation, ending is gated behind specific achievements ("reach Mom's Heart with character X", "donate 999 coins", etc.). Achievements tree is *enormous* — the game has no currency, no shop, just pure unlock accomplishment.

**Weapons / builds / combinations.** Isaac's "weapon" is his tears. Items modify tears in every imaginable way — homing, piercing, explosive, fire, ice, double-shot, charged, laser-beam, orbital, familiar-attached. *Transformations* — collect 3 of a themed item set (bob's brain, spider familiars, clothing) → visual transformation + passive effect. Build paths emerge by accident, not intent.

**Art / music / feel.** Hand-drawn grotesque cartoon aesthetic. Music by Ridiculon — melancholic, lo-fi, religious motifs. Feel is twitchy, high-lethality. Rooms-as-puzzle.

**Easter eggs & secrets.** The entire game is easter eggs. Secret rooms (always in the middle of 3+ adjacent rooms). Super-secret rooms. Beggars that take your items for others. Moving-the-clone items. The Tainted character variants. Achievements hidden *from the achievement list itself*. Cursed rooms.

**Smart approaches worth stealing.**
- **Items stacking combinatorially** — the *emergence* is the game. Every WHS upgrade should consider "what happens if this stacks with everything else?"
- **Transformations as hidden progression** — collect 3 of a themed set → free power + visual flair. WHS could have transformations (Tartan Wraith if you collect 3 tartan items; Blood Haggis if 3 lifesteal items).
- **Item pools segregated** (boss-item pool, shop pool, treasure pool) — ensures rare items don't appear in wrong context. Elegant rarity discipline.
- **Unlock-only meta** — no shop, just achievement unlocks. Some players find this cleaner than currency grinds.
- **Room types by door icon** — treasure, shop, boss, secret, challenge, sacrifice, devil-deal, arcade. Structured variety without map complexity.
- **Devil deals** — trade HP for powerful items. Risk/reward made concrete. WHS could offer *Cailleach's Bargain* rooms.
- **Curse of the Blind** (curses as run modifiers) — occasional run-wide debuffs that make the run *weirder*, not just harder.

**Traps to avoid.** Isaac's content depth took 10 years. WHS shouldn't chase 700 items. But the *principle* — items stack combinatorially, discover-by-play — is stealable at any scale.

---

### 12. Dead Cells

- **One-line pitch.** Action-platformer roguelite where the beheaded protagonist cleaves through an ever-mutating castle.
- **Why it matters.** The kinetics gold standard. Movement and combat are *fluid* in a way almost no roguelite achieves. Also the strongest example of *Metroidvania unlock structure* in a roguelite — runes permanently unlock map traversal, expanding the world over time.

**Core loop.** Pick starter weapons. Run through biomes. Kill → gold + cells. Choose biome at each fork. Bosses gate progression. Die → return to prison. Spend cells at the forge for new blueprints.

**Procedural generation.** Biomes are procedurally-stitched layouts from a bank of room chunks. Secrets, chests, and enemy positioning randomised.

**In-run progression.** Three skill slots: primary + secondary + two skills (grenades/turrets/traps). Scroll pickups grant +1 to a stat colour (Brutality red, Tactics purple, Survival green) + small HP. Affixes on weapons are rolled (*bleed enemies on hit*, *+50% damage on stunned*). Malaise mechanic for Boss Stem Cell runs.

**Meta-progression.** **Blueprints** — weapon/skill drops. Forge the blueprint once, weapon enters the loot pool. **Cells** invested at the Collector → unlock permanent options (healing flask charges, mutation slots). **Runes** from elite-adjacent pocket biomes → permanent traversal unlocks (vine rune, ram rune, teleport rune) that gate new biomes forever.

**Weapons / builds / combinations.** 100+ weapons, each with unique feel. Weapons scale with one of three stat colours. *Combo mechanics* — certain weapons bleed (damage-over-time), freeze (enemies vulnerable), stun (interrupt and enable execute). Synergies emerge between, e.g., *Ice Grenade + Ice-Kill Bonus Weapon*.

**Art / music / feel.** Sprite animation that's secretly 2D-baked-from-3D — every frame handcrafted. Combat is tight, parry-crit-execute-loop. Rolling has i-frames. Movement is *fast*. Music is electronic/orchestral blend per biome.

**Easter eggs & secrets.** Hidden rooms, challenge rooms (timed, rewarded), lore rooms with written inscriptions, the Concierge and other named bosses, the "malaise" endgame difficulty that's secretly a story beat.

**Smart approaches worth stealing.**
- **Blueprint → Forge → Loot Pool** — a persistent "drop once, permanently in your pool" mechanic. WHS could scale the weapon pool via blueprints the player has to discover.
- **Stat colours** — weapons and items scale with one of three stat colours; leaning into one creates focused builds. An accessible way to turn "pick the card" into "commit to a colour".
- **Runes as map-unlock meta** — permanent traversal unlocks that open new biomes. WHS could use this for Moor Road — unlock a *Cave Pass* rune via boss kill; now Cave biome appears in route picker.
- **Weapon *affixes*** — the same sword with different rolled modifiers. Adds replayability without more content.
- **Elite-adjacent pocket biomes** — tiny side-areas with specific rewards. WHS could offer optional "cairn" micro-biomes spawning on the edges of the map.
- **Healing flask with charges + upgradeable capacity** — persistent between rooms, charges refill on biome transition. Elegant "one more swing" heal mechanic.

**Traps to avoid.** Dead Cells's combat is about reflexes. Don't try to make WHS's auto-combat feel "tight" in the same way — auto-battler kinetics are different.

---

### 13. Risk of Rain 2

- **One-line pitch.** Third-person co-op roguelite where items *stack infinitely* and runs become mathematical carnage.
- **Why it matters.** RoR2 proved that unbounded item stacking is a design choice, not a bug. Every item can be picked up infinitely; the build is how many of *what* you've found. Also one of the best "time = difficulty" scaling systems in the genre.

**Core loop.** Drop into a stage. Kill monsters for gold + XP. Open chests (gold). Find the Teleporter, activate, survive a boss event, next stage. Repeat until death or cycle.

**Procedural generation.** Stage layout selection per-stage (3 candidates per tier). Chest placement. Monster spawns.

**In-run progression.** Items grouped by rarity: white (common stacking stats), green (stronger stacking effects), red (rare build-altering), yellow (boss drops, huge effects), cyan (equipment, active-use slot), lunar (drawback-bonus). Pick up = keep forever, stacks infinitely. **Time = monster level = difficulty.** The longer you take, the harder enemies get.

**Meta-progression.** Log unlocks (complete challenge → new survivor, new item, new skill). Artifacts (global run modifiers unlocked via environmental puzzles). New loadouts per character.

**Weapons / builds / combinations.** Each character has 4 skills; alternate skills unlocked via challenges. Items *stack* into hilarious compound effects — 10 Soldier's Syringes = +70% attack speed, 10 Tri-tip Daggers = 100% bleed chance. A handful of reds + synergistic items creates god-builds.

**Art / music / feel.** Low-poly 3D with strong silhouettes. Chris Christodoulou's soundtrack is a *character* — builds tension with layered synthesizer tracks that shift with pacing. Feel: overwhelming in a good way, by design.

**Easter eggs & secrets.** Obscure artifact unlocks (stand in a specific location, enter a specific sequence). Hidden realms. Newt Altars. Lunar Coins + Bazaar Between Time. The *Obliterate* ending.

**Smart approaches worth stealing.**
- **Unbounded item stacking** — every item pickup is meaningful even in late game because stacks compound. WHS currently caps passives at 6; consider a "stack more instances" route for post-cap play.
- **Time = difficulty** — enemy level scales with run time. Punishes turtling, rewards speed. Our WHS timer is narrative (30-min Reaper); could we bake *time pressure* into scaling?
- **Chest economy + gold scarcity** — every chest is a decision to open or skip. Creates natural risk-reward.
- **Artifacts as global modifiers** — run-wide rulesets (e.g., "no shrines", "command artifact lets you pick items"). WHS variants (like Ironmoor) could expand into an artifact-style menu.
- **Lunar items with drawbacks** — cursed items that give up something for power. Devil-deal adjacent.
- **Challenge-based unlocks** — "kill the boss without taking damage" → unlock new survivor skill. Progressive mastery rewards.

**Traps to avoid.** RoR2 scaling *can* reach absurdity — late-game runs become explosion-screens. That's their charm; ours should be *climactic* without overwhelming the Soul charter's warmth.

---

### 14. Enter the Gungeon

- **One-line pitch.** Bullet-hell dungeon crawler where the guns are the story.
- **Why it matters.** Peak gun variety in roguelites. 350+ guns, each with personality. The *gun* is the protagonist.

**Core loop.** Descend floors. Clear rooms of bullet-hell enemies. Open chests (random guns/items). Beat the floor boss. Descend. Final floor → the Gun that Can Kill the Past.

**Procedural generation.** Floor layouts procedurally assembled from rooms. Chest quality random (brown/blue/green/red/black/rainbow). Secret rooms require *shooting specific walls* (diegetic discovery!).

**In-run progression.** Active items (press button), passives (wear them). Guns pair with items. Keys used to open chests. Blanks wipe bullets from screen.

**Meta-progression.** Hegemony credits → spend at The Breach → unlock new guns/items into the global pool. **Shortcut progression** — beat bosses without taking damage → unlock elevator shortcuts to later floors (but with weaker starting equipment).

**Weapons / builds / combinations.** Every gun is a character — from *Bullet That Can Kill The Past* (a bullet shaped like a bullet) to *Cold 45* (pistol made of ice) to *Makarov* (Soviet pistol with Russian flag for reload). Item interactions (*Riddler's Gun* morphs your active gun). Synergies — specific gun + specific item = unique combo effect (e.g., Makeshift Cannon + Laser Sight = "Cannonball").

**Art / music / feel.** Pixel art, bullet-hell readability, reload animations are *stories* per gun. Music: electronic-orchestral. Feel: tight dodge rolls, deliberate positioning, satisfying boss telegraphs.

**Easter eggs & secrets.** Shoot walls to find secret rooms. NPCs with hidden quests. The Cult of the Gundead lore. Past runs hinted in boss dialogue. The "rainbow chest" chance. Floor 6 secret.

**Smart approaches worth stealing.**
- **Secret rooms via diegetic discovery** — shoot cracked walls, not UI buttons. WHS could have "shoot the thistle-clump" hidden routes.
- **Shortcut progression** — beat X → new starting option. WHS could let players start from Act 2 after a "perfect" Act 1 clear.
- **Weapon *personality*** — every gun has flavour text, unique animations, a name. Even if we only have 15 weapons, each should feel like it has a *story*.
- **Active items** (press-to-fire) as distinct from passives. WHS has passives only; adding an *active ability* slot (drink a dram, blow the pipes) could unlock new design space.
- **Chest rarity tiers with visible locks** — players know what they're opening. Anticipation is generated by the *lock*, not the contents.
- **Blanks** — screen-wipe panic button with limited charges. Gives players a safety valve in extreme moments.

**Traps to avoid.** 350 guns is a crushing content requirement. Depth-over-breadth.

---

### 15. Spelunky 2

- **One-line pitch.** Platformer roguelite where every tile is a weapon and every enemy a trap.
- **Why it matters.** Spelunky 2 is the genre's emergent-systems champion. Few items, few enemies, but the way they *interact* creates stories. The "every object is a physics object" design creates endless accidental drama.

**Core loop.** Descend a cave. Collect gold. Manage bombs, ropes, HP. Every level has secrets. Final boss unlocks through specific routes. Permadeath punishing.

**Procedural generation.** Level layouts procedurally generated from tile-chunks with consistency checks (paths must exist). Bosses spawn at specific floors.

**In-run progression.** Bombs/ropes/gold. Shops sell items (cape, jetpack, shotgun, crysknife). Ankh → revival. Udjat Eye → reveals hidden gold. Specific item combinations unlock routes (Ankh + shortcut = ascension).

**Meta-progression.** Character unlocks. A hub area fills with rescued characters. Journal entries unlocked per discovered thing.

**Weapons / builds / combinations.** Sparse. A whip, a gun, a shotgun, a bomb. But their *interaction* with the environment — bombs on rocks, shotgun point-blank, whip-riding a mount — creates enormous depth.

**Art / music / feel.** Detailed pixel art, each enemy has distinct silhouette. Music is folk-ish, calming. Feel: deliberate, every mistake earned.

**Easter eggs & secrets.** Obscene depth of hidden content. The Cosmic Ocean. The Moon Challenge. The Sun Challenge. Hundun. The Tide Pool. The Volcana route. NPCs with backstory you might never find.

**Smart approaches worth stealing.**
- **Environmental physics as combat tool** — enemies push each other, fire spreads, rocks fall. WHS's hazard/slick/fog system hints at this; we could push it further (enemies slip on slicks too).
- **Journal as discovery-log meta-progression** — everything you encounter logs into a journal with lore. Creates a collection objective that's pure flavour.
- **Specific item combos unlock routes** — "carry X to Y unlocks Z". WHS could have hidden route unlocks gated by in-run item carries.
- **Shopkeepers you can rob (at peril)** — a risk/reward that's diegetic, not menu-driven.
- **Rescued NPCs as hub-world inhabitants** — the home-base evolves. WHS could populate a croft with characters you save mid-run.

**Traps to avoid.** Spelunky's permadeath intensity isn't our vibe. The *emergence* is what transfers.

---

### 16. Rogue Legacy 2

- **One-line pitch.** Castlevania-platformer roguelite where every death passes the castle to your weird child.
- **Why it matters.** Invented "generational" meta-progression. Also the clearest example of *trait-based* character differentiation — your protagonist might have dyslexia (text reversed), colour-blindness, gigantism, or be a ghost.

**Core loop.** Each run = pick from 3 heirs, each with a class + traits. Explore castle. Earn gold. Die, return to lineage manor, spend gold. Heir's children are next generation.

**Procedural generation.** Castle layouts procedurally assembled. Heir traits random. Class availability per-run rolls.

**In-run progression.** Find gold, runes, heirlooms, scars (challenge rooms). Classes have unique spells + passives.

**Meta-progression.** **Manor** — spend gold on house upgrades, each adding stats. **Classes** unlock via gold + specific condition. **Heirlooms** — permanent Metroidvania unlocks (double-jump, dash, wall-cling). **Scars** — defeat specific challenges with specific classes for massive buffs.

**Weapons / builds / combinations.** Each class has a distinct weapon (barbarian axe, knight sword, gunslinger revolver, chef's pans, boxer's fists). Traits mod *how the run feels* more than how it plays.

**Art / music / feel.** Handdrawn cartoon-gothic. Music: chiptune-orchestral. Feel: wall-jump tight, heir-specific humour.

**Easter eggs & secrets.** Trait writing is where the love lives. Every trait has flavour dialogue. Hidden castle rooms. A "True Ending" gated behind New Game+.

**Smart approaches worth stealing.**
- **Generational trait system** — every run, your character has a weird quirk (dyslexia, pacifism, IBS). These are *flavour-first*, *mechanical-second*. WHS could do this with haggis variants — each run, your haggis is "Granda's favourite", "A bit too brave", "Mildly colourblind", etc.
- **Manor upgrade sink** — a tangible hub that grows as you spend. Progress made *visible*.
- **Metroidvania unlocks via heirlooms** — permanent traversal unlocks gate biomes. WHS's Moor Road could gate future routes via found heirlooms (a Highland Torque, a Pictish Compass).
- **Three heirs to pick from** — choice of protagonist every run, not just character menu. Adds pre-run decision-making.

**Traps to avoid.** Generational framing needs a narrative excuse. Works for RL2 (literal lineage). WHS could use *haggis lineage* or *Gran's many grandkids* as framing.

---

### 17. Returnal

- **One-line pitch.** Third-person shooter roguelite with AAA production values, where an astronaut is stuck in a time loop on an alien planet.
- **Why it matters.** AAA budget applied to roguelite structure. Shows what the genre can be *visually* and *atmospherically*. Also invented the "suit stats + parasites + malignant items" tradeoff vocabulary.

**Core loop.** Crash on Atropos. Explore biome. Kill → get weapon proficiency. Collect items → integrity (HP) + suit mods. Boss at biome end. Die → return to ship, loop resets (but some items persist via Reconstructor).

**Procedural generation.** Biome layouts procedurally assembled from chunks. Enemy spawns. Weapon drops (weapon type + trait roll).

**In-run progression.** Weapon proficiency levels up per-use (permanent across the run). Parasites — drawback/bonus symbionts attached to suit. Malignant items — powerful, but 1-in-X chance of triggering a malfunction (stat debuff until fixed). Astronaut Figurine — one-use revival.

**Meta-progression.** Permanent keys/tools unlocked via boss kills and story items. Story advances slowly through audio logs and scene-house sequences.

**Weapons / builds / combinations.** ~10 weapons, each with distinct feel. Weapons have *traits* (rolled per pickup) — e.g., pistol with *high-velocity rounds*. Trait unlocks permanent (once you see it, it can appear again). Alt-fires (Overload) create offensive rhythm.

**Art / music / feel.** AAA 3D, DualSense haptics integrated into gameplay. Audio is environmental and *unsettling*. Feel: heavy, deliberate, tense.

**Easter eggs & secrets.** Story breadcrumbs. Hidden house sequences. Cipher-unlocks.

**Smart approaches worth stealing.**
- **Weapon proficiency in-run** — using a weapon levels it up *within the run*, creating investment. WHS's weapon levels are card-driven; proficiency-by-use could be an alternate path (passive growth as you fire).
- **Parasites with paired drawback+bonus** — every pickup is a trade.
- **Malignant items with risk** — "powerful but X% chance of malfunction". Concretises risk.
- **Weapon traits rolling per-pickup** — even same-weapon feels different run to run.
- **Story told through environmental fragments** — *audio logs in pickups*. WHS could tell Highland folklore in tiny gem-descriptions.

**Traps to avoid.** Returnal is AAA cinematic. Our warmth-first direction is different.

---

## Cluster C — Strategy & Deck-builders (5 games)

A different flavour of roguelite: discrete, turn-based, decision-dense. These games teach us *how to structure a choice*. The survivor-like level-up card is a direct descendant of deck-builder draft moments — the lineage is visible in every "pick 1 of 3" screen.

---

### 18. Slay the Spire

- **One-line pitch.** Climb a spire, deck-build as you go, fight escalating bosses, die, start over with new unlocks.
- **Why it matters.** The modern deck-builder roguelite template. *Every* game in this cluster cites Slay the Spire. Its node-map, card rarities, relic system, and "ascension" difficulty scaling are foundational.

**Core loop.** Pick class. See map (forking paths of nodes). Choose path — combat, elite, event, shop, rest, treasure. Fight → pick card reward. Relic rewards from elites/bosses. Boss at end of each of three floors. Final floor → victory or restart.

**Procedural generation.** Map layout per-run (with rules — every path passes at least one rest before boss). Card rewards drawn from class pool. Events drawn from pool. Shop contents.

**In-run progression.** Deck grows each combat (pick 1 of 3 cards or skip). Relics modify rules — some passive (+1 damage), some situational ("start each combat with 2 block"), some build-enabling ("exhaust a card when you draw it"). Potions hoarded for emergencies.

**Meta-progression.** **Ascension** — self-selected difficulty tiers (1–20). Each ascension adds a modifier (more elites, stronger bosses, etc.). **Card unlocks** — beat bosses → unlock new cards for the pool. **Character unlocks** — win with Ironclad → unlock Silent → unlock Defect → unlock Watcher.

**Weapons / builds / combinations.** Four classes, each ~75 cards. Builds emerge from card *archetypes* (Ironclad: Strength, Exhaust, Barricade; Silent: Poison, Shivs, Discard; Defect: Orbs, Focus; Watcher: Stances, Mantras). A *good* run is one where early picks align toward an archetype and relics support.

**Art / music / feel.** Stylised painted UI. Music: ambient, mood-setting per floor. Feel: deliberate, turn-based, chess-like.

**Easter eggs & secrets.** The Heart (true final boss) accessed via specific path. Hidden events. Mystery-box relics. The neow-bonus shrine system.

**Smart approaches worth stealing.**
- **Node-map with forking paths** — the *map itself* is a decision. WHS's Moor Road is this; we could deepen it (more node types, more forks per act).
- **Ascension difficulty** — granular self-scaling (1–20) with each tier a specific modifier. Ironmoor could layer into this pattern.
- **Card draft ("pick 1 of 3 or skip")** — skip option matters. WHS level-up forces a pick; *allow skip* might be an elegant addition.
- **Relics as run-defining rules** — persistent modifiers that shape strategy. WHS has passives; *relics* could be a distinct tier (rarer, larger effect, tied to specific runs).
- **Elite-rewards disproportionate** — elites drop relics, making them essential targets. WHS elites drop 3× XP; a rare-relic-only drop could make them must-kills.
- **Archetypes, not builds** — players are thinking "am I going Poison?", not "do I have max crit?". Direction matters more than optimisation.
- **Heart / Act 4** — the secret ascended ending gate. WHS could have a true ending post-taxman, gated on specific route choices.

**Traps to avoid.** Turn-based deck discipline isn't our vibe. The *patterns* (relics, draft, node-map) transfer.

---

### 19. Balatro

- **One-line pitch.** Poker-themed deck-builder where every hand is a physics experiment in card synergy.
- **Why it matters.** 2024's indie-of-the-year. Balatro proved that *simple rules + deep combinatorics* beats complicated rules. Its **Joker system** — persistent per-hand modifier cards — is the cleanest synergy-stacking design in gaming right now.

**Core loop.** Play poker hands against escalating blinds. Each hand plays 5 cards from your deck. Jokers modify scoring. Beat the big blind → advance. Between rounds, shop for jokers, packs, vouchers.

**Procedural generation.** Shop contents per-round. Deck modifications. Boss blind effects ("no diamond cards play", "flipped cards", etc.).

**In-run progression.** Deck grows (buy more cards), Jokers accumulate (up to 5 slots), Tarot cards modify existing cards (add suits, add multipliers), Planet cards upgrade specific poker hand types.

**Meta-progression.** **Stakes** — difficulty tiers. **Decks** — starting deck variants (Red = standard, Blue = extra hand, Yellow = extra gold, etc.). Each deck is a rule-change. Unlocks via wins.

**Weapons / builds / combinations.** Jokers are the weapons. ~150 jokers, each with a rule — "+4 Mult per King scored", "x3 Mult if hand is a Flush", "sells for 2x cost". The *combinatorial synergy* is breathtaking — 5 jokers can multiply into millions of points per hand.

**Art / music / feel.** Lo-fi VHS-retro aesthetic. Music: lounge jazz loop. Feel: *dopamine delivery mechanism*. Number goes up. Chips and Mult multiply visibly. Endless "ONE MORE HAND" loop.

**Easter eggs & secrets.** Hidden Jokers unlocked via specific feats. Stickers (gold, red) on Jokers with escalating challenges. The Orbital (obscure meta tier). Showdown blinds.

**Smart approaches worth stealing.**
- **Joker stacking as synergy puzzle** — each Joker is a *rule*, and rules combine. WHS passives do this loosely; Balatro's *explicit* rule-stacking is the aspirational version.
- **"Chips × Mult" as legible scoring** — two-number scoring is instantly parseable. Every build has a Chips strategy or Mult strategy. WHS damage formulas could surface this way ("base × multiplier" shown visibly).
- **Tarot cards as mid-run deck modifiers** — one-use cards that *change the deck*. WHS could have one-use "Rune stones" that permanently buff an active weapon.
- **Starting decks as run-variants** — each deck is a rule change (Yellow Deck starts with extra gold, Plasma Deck adds Chips + Mult together). Extremely content-efficient.
- **Sell value on Jokers** — buy, hold, sell. Creates tempo decisions. WHS could have a *dismiss-passive-for-gold* button.
- **Boss blinds with unique rules** — every boss round has a specific *rule-break* (one suit can't score, cards flip every hand). Moor Road bosses could each have a twist.
- **Negative Joker tag** — a reward that *adds a Joker slot*. WHS could offer rare "+1 passive slot" events.

**Traps to avoid.** Balatro is pure math-joy; WHS is emotional-warmth-first. Copy the *architecture* (stacking rules, legible scoring), not the arithmetic obsession.

---

### 20. Monster Train

- **One-line pitch.** Three-layer deck-builder where you defend a literal train carrying Hell's last spark upward through the afterlife.
- **Why it matters.** Invented the *dual-clan* system — every run, pick two from a pool of five factions, then mix their cards. Creates huge build variety from a small deck pool.

**Core loop.** Pick two clans (primary + secondary). Fight train-ascension battles — enemies crawl up three floors, you place monsters/play spells per floor. Beat The Pyre battle to survive.

**Procedural generation.** Battle layouts (enemy mix per floor). Shop contents. Event branches.

**In-run progression.** Card rewards each battle. Upgrades via Trials and shops. Artifacts (relics) from hard battles.

**Meta-progression.** Clan unlocks. Unit covenant levels (clan-specific meta). Challenge modes. Achievement tree.

**Weapons / builds / combinations.** Five clans, each with ~30 cards + unique mechanics. **Clan-mixing is the spice** — *Hellhorned + Awoken* plays differently from *Hellhorned + Umbra*. Creates 5×4 = 20 combinations with pairwise-unique flavour.

**Art / music / feel.** Stylised dark fantasy. Music: theatrical. Feel: tactical, replay-friendly.

**Easter eggs & secrets.** Hidden challenges. Covenant prestige system.

**Smart approaches worth stealing.**
- **Dual-class system** — WHS could introduce *dual-clan passives* — two themed collections that modify each other. The Cailleach-line + The Selkie-line = unique synergies.
- **Per-clan flavour** — each clan has a strong thematic identity that permeates its cards. Our passive families (sporran, flask, kilt) could deepen into clans.
- **Covenant levels per clan** — meta-progression tracked *per character/class*. Completionists have a ladder per faction.
- **Three-lane tactical defense** — literal vertical positioning changes strategy. Not directly applicable to WHS, but *positioning as mechanic* is worth noting.

**Traps to avoid.** Clan-mixing requires careful balancing. Start small (2 clans) if ever applied.

---

### 21. Inscryption

- **One-line pitch.** Deck-builder horror that breaks the fourth wall, the meta-layer, and your sense of reality.
- **Why it matters.** Inscryption is the genre's narrative ambush. It *pretends* to be one kind of roguelite, then transforms. It proves that a roguelite can *change its own rules* mid-game as a storytelling move.

**Core loop.** (Act 1) Card-battle against Leshy, the cabin's cryptic warden. Sacrifice animals to summon stronger ones. Carry your deck through map forks. Collect teeth currency. (Acts 2–3 reshape everything.)

**Procedural generation.** Map forks per Act 1. Boss encounters bespoke.

**In-run progression.** Deck-building via sigils (card abilities stacked onto creatures). Lost-in-the-woods events. Rarified deck surgery.

**Meta-progression.** Cross-act narrative progression — each Act shifts the game's *entire loop*. The meta is *the story of the meta*.

**Weapons / builds / combinations.** Creature cards + sigils. Sigil-stacking on a single creature creates broken combos. The "tooth for a tooth" sacrifice mechanic defines playstyle.

**Art / music / feel.** VHS distortion, low-fi grotesque, candlelight. Music: unsettling, ambient. Feel: *paranoid*. Every new card feels like a discovery *and* a threat.

**Easter eggs & secrets.** The entire game is one long easter-egg. The Kaycee's Mod update adds ascension layers. The *Luaggia* lore. The floppy disc hidden in the game files. The Reality-TV subversion.

**Smart approaches worth stealing.**
- **Self-aware structure** — a roguelite that knows it's a roguelite and occasionally *winks*. WHS banter could occasionally break the fourth wall (Gran noticing you've died a lot).
- **Fourth-wall breaks as unlock mechanism** — finding things "outside" the game (puzzle codes on a floppy). A deep-cut hidden route in WHS could involve something *un-game-like*.
- **Sigils stacked on cards** — modifier stacking on a single object. WHS weapons could accumulate sigils (from chests?) that change behaviour.
- **Escalating tonal shifts** — Act 1 vs Act 2 feel like different games. WHS's biome shifts could lean harder into tonal variation.

**Traps to avoid.** Inscryption's narrative magic doesn't replicate — it's genre-bending writing that took years. Steal the *principle* (surprise the player mid-game), not the specific trick.

---

### 22. FTL: Faster Than Light

- **One-line pitch.** Manage a spaceship crew through a roguelite-gauntlet of hostile sectors to save the Federation.
- **Why it matters.** FTL is one of the founding pillars of modern roguelites. Its *event-text decisions*, *resource-scarcity combat*, and *branching sector map* templated the genre's early years.

**Core loop.** Fly from system to system across 8 sectors. Each jump = event (combat, choice-event, market, distress beacon). Assemble crew, weapons, shields. Final showdown with rebel flagship.

**Procedural generation.** Sector maps. Event triggers. Enemy ship composition. Weapon drops.

**In-run progression.** Scrap currency → buy weapons, crew, drones, augments, reactor upgrades. No power means no weapons. *Every system is limited by power allocation.*

**Meta-progression.** Ship unlocks (and their layouts) via specific in-run achievements. No gold, no linear shop — just ship-layout unlocks.

**Weapons / builds / combinations.** Weapons (missile, laser, beam, ion) interact with shields and doors. Crew specialise in systems (engine, shields, pilot). Builds form around weapon type + crew placement + augmentation.

**Art / music / feel.** Clean 2D pixel ship cross-sections. Music: ambient sci-fi. Feel: tense, calm, *every decision matters*. Pause-and-plan combat.

**Easter eggs & secrets.** Hidden ship unlocks. Specific events that branch based on crew composition. Zoltan Peace Treaty.

**Smart approaches worth stealing.**
- **Event-text decisions with outcomes** — "A distress beacon pings. Investigate?" → dice-rolled outcome based on stats. WHS could add route-event variants (random *wee encounters* between acts).
- **Resource scarcity as design constraint** — scrap is precious, every choice is a trade. Less relevant to our flow, but conceptually worth noting.
- **Ship unlocks via specific achievements** — no currency, just accomplishment. Pure discovery progression.
- **Sector variety** — each sector has flavour (Rebel, Civilian, Pirate, Zoltan, Slug). WHS's biomes could each have a *vibe* similar to this.

**Traps to avoid.** FTL's pace is deliberate/slow. Our auto-shooter flow is opposite. The *decision architecture* transfers, not the tempo.

---

## Cluster D — Hybrids & Unconventionals (3 games)

Three games that don't sit cleanly in any category — and each of them invents a new one. These are mined for *inspiration*, not direct mimicry. But the weirdness here is where the most distinctive WHS ideas will come from.

---

### 23. Noita

- **One-line pitch.** Every pixel is simulated. Every spell is scriptable. Every run is a tragedy waiting to happen.
- **Why it matters.** Noita is the genre's *systemic depth* champion. Its pixel simulation (water, lava, oil, sand, blood all interact in physics) creates emergent combat you can't design directly — only enable. Also its wand editor is an essay-level piece of interactive design.

**Core loop.** Descend through biomes. Pick up wands (programmable weapons). Fight. Die from something hilarious. Repeat.

**Procedural generation.** Every biome procedurally generated with multiple layout algorithms (mines = branching tunnels, coal pits = caves, fungal caves = rooms). Wand stats randomised. Spell drops randomised.

**In-run progression.** Wands have stats (mana, recharge, spells-per-cast, spread). Spells are *cards* you slot into wands. Perks chosen at Holy Mountain checkpoints. Gold spent at shops.

**Meta-progression.** Unlocks via reaching new biomes. Orb collection unlocks endings. Lore shrines map a cryptic story.

**Weapons / builds / combinations.** **You *program* your wand.** Spells chain into other spells. Modifier spells mutate following spells (make explosive, make multicast, homing, fire trail). A well-programmed wand can one-shot bosses; a poorly-programmed wand explodes *you*. This is the deepest weapon customisation in gaming.

**Art / music / feel.** Pixel-sim art with particle fidelity unmatched in indie games. Music: ambient dark-fantasy. Feel: *simulation chaos*. Lightning spreads through water; fire sets oil alight; toxic gas explodes on ignition.

**Easter eggs & secrets.** Obscene depth. The Parallel Worlds. The Sampo. Orbs. The Gods. Hidden temple routes. Unlocking the true ending took the community *years*.

**Smart approaches worth stealing.**
- **Systemic interactions as emergent combat** — the simulation creates combat the designers didn't write. WHS's slick/fog/hazards could deepen: slick + spark = fire trail; fog + lightning = chain lightning. Every hazard interacts with every other.
- **Wand editing as end-game mastery** — a *depth of customisation* most players never touch, but the option's existence is the draw. A late-game WHS menu for wiring passive-chain priority could serve this.
- **Perks as run-defining choices** — Holy Mountain forces a perk-pick that shapes the run. Our Moor Road routes gesture at this.
- **Orbs and Sampo** — multi-run objectives that take *multiple full games* to complete. A true-end scavenger hunt.

**Traps to avoid.** Noita's lethality is a deliberate tonal choice. Our warmth charter precludes "dead in 10 seconds from something hilarious." The *systemic* lessons transfer; the *punitive* ones don't.

---

### 24. Loop Hero

- **One-line pitch.** Auto-battler roguelite where you draw the map with tiles while your hero runs laps.
- **Why it matters.** Loop Hero inverts the roguelite: you aren't *exploring* a dungeon, you're *building* one around a character who fights automatically. Relevant to WHS because *you don't control the attacks* either.

**Core loop.** Hero auto-runs a procedurally-generated loop. You place tiles (mountains, villages, cemeteries) that spawn enemies, heals, or synergies. Beat boss → return to camp → build infrastructure → next loop.

**Procedural generation.** Loop shape per-run. Enemy drops. Tile-card draws.

**In-run progression.** Tiles placed on path trigger effects — mountains heal, villages spawn traders, cemeteries raise skeletons. Resources banked toward camp-building.

**Meta-progression.** **Camp infrastructure** — a growing persistent village you build between loops. Every camp building unlocks new classes, new tiles, new mechanics.

**Weapons / builds / combinations.** Hero auto-attacks. Gear (rolled stats) equipped. Build = which tiles you place where.

**Art / music / feel.** Stark pixel art, *monochrome* early, colour expanding later. Music: Game Boy-ish chiptune. Feel: planner, not reacter.

**Easter eggs & secrets.** Hidden tiles, tile synergies (3 mountains = peak = extra stats), hidden classes.

**Smart approaches worth stealing.**
- **Player controls the environment, not the character** — builds *the fight*, not executes it. WHS's Moor Road already gives us environmental agency; we could push it (choose where healing circles spawn, place hazards for enemies).
- **Tile synergies** (3 same = bonus) — compact synergy language. Every WHS passive family could have a 3-set bonus.
- **Camp as persistent hub that gates unlocks** — every building unlocks something game-changing. Gran's Croft could evolve this way.
- **Monochrome-to-colour progression** — visual meta-progression. The world literally opens up. Biomes could grow more vibrant as you unlock them.

**Traps to avoid.** Loop Hero's pace is meditative. Our kinetic pace is opposite. The *building* metaphor transfers; the tempo doesn't.

---

### 25. Cult of the Lamb

- **One-line pitch.** Roguelite dungeon-crawler meets cult-management simulator.
- **Why it matters.** Two games bolted into one. Runs feed into the base-building loop; base-building feeds into runs. Proves that *two genres, braided tightly* can create a third.

**Core loop.** Go on a crusade (roguelite dungeon run). Return to your cult (base-building sim). Manage followers, preach sermons, cook, clean, resurrect the dead. Crusade again.

**Procedural generation.** Dungeon runs procedurally assembled from rooms, with random encounters and random tarot-card-like pick-ups.

**In-run progression.** Weapons (random on run start). Curses (unique spells). Tarot cards granted between rooms. Fleeces (meta-cosmetic run-modifier unlocks).

**Meta-progression.** **Cult management** — followers have loyalty, faith, hunger, needs. Doctrines unlock (canabalism, commandments, rituals). Cult grows visually as you invest.

**Weapons / builds / combinations.** Four weapon types (sword, axe, dagger, hammer), each with a feel. Curses are AoE spells. Tarot cards (random blessings per dungeon) stack into builds.

**Art / music / feel.** Adorable-grimdark handrawn art. Music: cute-creepy orchestral. Feel: *contrast*. Dungeons are kinetic; base is calm. One regenerates energy for the other.

**Easter eggs & secrets.** Hidden follower recruitment. Unique boss behaviours. Cross-game references (Don't Starve, Binding of Isaac).

**Smart approaches worth stealing.**
- **Two braided loops feeding each other** — runs generate resources for the hub; the hub makes runs easier. WHS could braid Gran's Croft (a cosy hub loop) into the Moor Road combat loop more tightly.
- **Follower / NPC ecosystem** — each cult member is named, has needs, dies eventually. WHS could have a *haggis drove* back at home — each haggis a named character with needs and personality — adding emotional investment to meta-progression.
- **Tarot cards from altars** — drawing a random blessing mid-run. Smaller, stickier than full upgrade cards.
- **Tonal whiplash as strength** — cute-creepy contrast is memorable. Our warmth-with-Highland-grimness is in the same design space.
- **Crusades as themed biomes with bosses** — each crusade is a distinct zone with a named antagonist. Moor Road acts.

**Traps to avoid.** Cult management's content depth is significant. We don't need a full sim; we need the *spirit* — a hub that evolves and feels alive.

---

## Cross-Game Pattern Library

After 25 deep-dives, the design patterns cluster into ten families. These are the *meta-lessons* — the principles behind the mechanics. When designing a new WHS feature, start here.

### 1. Pattern: Layered Progression Axes

The best roguelites stack **at least three** progression layers so no single run feels wasted:

| Layer | Timescale | Examples |
|---|---|---|
| **In-run build** | seconds → 20 min | Cards, drops, synergies |
| **Character/loadout meta** | runs → weeks | Mirror, manor, shop, skill tree |
| **Discovery / unlock meta** | weeks → months | Achievements, hidden rooms, secret characters |
| **Lore / narrative meta** | months → lifetime | Fated lists, endings, true-end chains |

**Stealable principle.** WHS currently has layers 1 + 2 (cards + meta shop) and the start of layer 3 (Ironmoor challenge, daily). Missing: a proper **discovery log / achievement ladder** and a **lore-driven "true ending" goal**. Hades, Isaac, and Spelunky 2 all demonstrate that lore-progression gives long-tail players something bigger than numbers.

### 2. Pattern: The Rule-Stack

Balatro, Isaac, Slay the Spire, Noita — all four make synergy *explicit* by having each item be a *rule* that stacks with other rules.

**Examples:**
- Balatro: "+4 Mult per King scored" + "Double Mult if any Face card" + "x3 Mult on Flush" = millions of points.
- Isaac: Polyphemus + Tammy's Head + Brimstone = screen-clearing laser stacks.
- Noita: Spark Bolt + Trigger + Black Hole = remote-detonated black holes.

**Stealable principle.** Most WHS upgrades currently say "+10% damage". That's a *stat*, not a *rule*. Consider upgrades that are *conditional rules*: "+50% damage to enemies in fog"; "every 10th kill spawns a healing thistle"; "Bagpipe hits grant +1 pickup range for 3s". Rules *combine* in ways stats can't.

### 3. Pattern: Legendary Capstones

Vampire Survivors evolutions. Halls of Torment legendaries. Hades duo boons. HoloCure collabs. All of them reward *commitment* with a *transformative* mid-run item.

**Properties:**
- **Requires commitment** (max weapon + max passive, or all of one god, etc.).
- **Distinct from ordinary upgrades** — new name, new icon, new behaviour.
- **Celebrates on-screen** — cinematic pickup, VFX, music sting.
- **Often single-use per run** (one evolution per weapon, not stacked).

**Stealable principle.** WHS has evolutions (7 of 8 weapons). The next tier up: **Unions** (two evolutions fused into one super-form), matching Vampire Survivors' latest content pattern. Design space for ~5 union-level climactic items.

### 4. Pattern: Node-Map Decision Architecture

Slay the Spire, Hades, FTL, Monster Train all present **forking paths** between encounters. The map *itself* is a decision. Each node tells you its reward type so anticipation is generated before you arrive.

**Properties:**
- Each node has a **visible icon** signalling its type.
- Paths **converge at bosses** but diverge between.
- Paths usually **force a rest node** before a boss (pacing).
- **Skip-able rewards** (shops, events) are visible so players can optimize.

**Stealable principle.** WHS's Moor Road is an implicit node-map (boss → 3-route picker). The full pattern is **multi-node paths *between* bosses** with pre-visible reward icons. Next spec opportunity: expand Moor Road to have 2–3 node choices *inside* each act, not just between.

### 5. Pattern: Risk-Reward Trade Vocabulary

Hades Heat, Isaac devil deals, RoR2 lunars, Brotato Dangers, Returnal malignants, Slay the Spire curses. Every premium roguelite has a vocabulary of **"pay something to get something"**.

**Forms:**
- **Self-curse upgrades** (trade HP, trade healing, trade max HP for power).
- **Devil deals** (room-type that trades stats for powerful items).
- **Heat modifiers** (self-selected run-wide curses for mastery rewards).
- **Lunar items** (bonus + drawback).
- **Malignant items** (good now, may malfunction later).

**Stealable principle.** WHS has *Ironmoor* (one run-wide hardness mode) and nothing more granular. Adding individual *cursed upgrade cards* (appear rarely, offer massive buff + meaningful cost) creates per-run risk decisions. Moor Road could include a rare **Cailleach's Bargain** route that trades HP for a run-changing boon.

### 6. Pattern: Character-as-Constraint

Brotato and Isaac both prove that **characters with different rules** are the highest-leverage content multiplier. 40 Brotato characters × 20 waves = 800 distinct experiences. Same combat, radically different rules.

**Character-constraint types:**
- **Stat-distorted** (*Speedy* doubles speed, halves HP).
- **Mechanic-replaced** (*Engineer* can't use weapons, only turrets).
- **Inventory-limited** (*One-Armed* one weapon slot, 5× stats).
- **Behaviour-forced** (*Crazy* can't stop moving).
- **Flavour-forced** (*Chef* cooks food instead of eating).

**Stealable principle.** WHS has one haggis. A roster of *haggis variants* (Highland Haggis, Wee Haggis, Burnt Haggis, Tartan Haggis…) each with a rule-change opens vast design space. One new character = ~5 new ways to play.

### 7. Pattern: Voice as Persistent Companion

Hades voice lines, DRG's dwarf banter, HoloCure's VTuber lines, Cult of the Lamb's follower interactions. Games that *talk to you* become *people* to you.

**Voice line types:**
- **Contextual reactions** (first-time boss kills, death by specific enemy).
- **Idle / ambient** (spoken between bosses to fill space).
- **Milestone markers** (you hit 100 kill streak — someone cheers).
- **Narrative beats** (story advances through dialogue, not cutscenes).

**Stealable principle.** WHS's banter system is scaffolded but largely empty. This is one of the highest-impact content investments we can make — every banter line is a tiny soul transfer. Gran, the haggis itself, the Cailleach, the occasional Midge — each could have a personality voice. Target: ~300–500 banter lines across all triggers to reach Hades-adjacent density per-event.

### 8. Pattern: Diegetic Discovery

Spelunky 2's secret routes, Isaac's secret rooms, Noita's orbs, Enter the Gungeon's cracked walls. The best easter eggs require players to *interact* with the world in unusual ways — not menu-click, but *diegetic action*.

**Forms:**
- **Shoot this specific wall → secret room.**
- **Carry this item to this place → hidden route.**
- **Stand in this place at this time → encounter.**
- **Don't damage this enemy → they say something.**
- **Clear this floor without X → unlocks Y.**

**Stealable principle.** WHS's chests are the obvious "hidden thing" — but easter eggs should be things players *do*, not things that appear. A hidden thistle-patch that reveals a wee faerie if you don't trample it for 30 seconds. A stone cairn that whistles if you circle it 3 times. These *cannot* be found in UI; they must be *noticed*.

### 9. Pattern: Juice Priorities — Readability First, Then Ecstasy

Every game in this doc makes the same feel-ladder decision:

1. **Readability** — can the player see what's happening? (silhouettes, contrast, enemy telegraphs)
2. **Feedback** — does every action land with confirmation? (hit flash, damage numbers, sound)
3. **Weight** — do important events feel heavier? (screen shake on big hits, hit-freeze on kills)
4. **Ecstasy** — do milestone moments feel transcendent? (boss death cinematic, evolution pickup, critical streak)

**Stealable principle.** WHS has strong layers 1–3. Layer 4 (ecstasy) is the next push. Moments like *first evolution*, *boss kill*, *act clear*, *Gran's first visit*, *lineage moment* should be *stopping moments* — the camera, music, and motion all conspire to say "savour this."

### 10. Pattern: Make The Hub The Trophy Case

Rogue Legacy's manor, Cult of the Lamb's cult, Spelunky's rescued NPCs, Hades's House, Loop Hero's camp, DRG's ship. All of them show that **the space you return to between runs should visibly accumulate your achievements**.

**Forms:**
- **New NPCs appearing** (rescued, recruited, revived).
- **Buildings unlocking** (shops, altars, workshops).
- **Decorative progression** (room fills with trophies, fresh plants, fixed walls).
- **Scripted scenes** (new conversations as meta-progression advances).

**Stealable principle.** Gran's Croft exists as a concept. It should *grow* — every boss kill adds a trophy on the mantel, every route unlock adds a photo, every variant beaten adds a haggis to the drove. The hub should feel *loved* by the player's past runs, not reset every visit.

### 11. Pattern: Time as Difficulty

Risk of Rain 2 and Vampire Survivors (and HoloCure) all scale enemies with run time. The longer you take, the harder it gets. Punishes turtling, rewards momentum.

**Properties:**
- Enemy HP/damage rises with wall-clock time.
- Enemy types introduced on a timeline, not a random pool.
- Encourages *kinetic play* — standing still = enemies overtake you.

**Stealable principle.** WHS already uses a wave timeline + boss HP time-scaling. Pushing this harder (e.g., *enemy damage* scales mid-run, not just count) amplifies tension without new content.

### 12. Pattern: Discovery-Log / Journal Meta

Spelunky's journal, Isaac's secrets list, Hades's fated list, Cult of the Lamb's codex. A *searchable, in-game record* of everything players have seen, plus hints for what they haven't.

**Stealable principle.** WHS has a chronicle (past runs log). We should build a *Highland Almanac* — every enemy encountered, every route picked, every item found, every banter line triggered. Seeing "??? banter line, heard 0 times" creates persistent curiosity.

### 13. Pattern: Reroll Economies

HoloCure's reroll costs, Slay the Spire's skip-options, Brotato's +1 reroll escalation. The right to *say no* to the draw is as important as the draw itself.

**Stealable principle.** WHS grants 1 reroll per level-up. Going further: a *banish* button (remove a card from future runs), a *re-draw* purchasable at cost, a *lock* per-round that preserves one card across level-ups. Micro-agency.

### 14. Pattern: Build Permission Signals

Slay the Spire classes, Death Must Die gods, Brotato weapon sets. The game should *tell* the player early "your build is X" so they can commit.

**Stealable principle.** WHS should display an emergent **"Run Identity" badge** after 2–3 level-ups — "Caber Storm Build", "Mist Drifter", "Cailleach's Chosen" — surfacing what archetype is forming. This is a legibility help more than a mechanic.

---

## WHS Gap Analysis & Opportunity Map

This section maps the pattern library onto Wild Haggis Survivors' current codebase. It is an opinionated *menu of opportunities*, not a roadmap — which ones we pursue depends on Michael's strategic direction. Every opportunity below cites the specific games it descends from, so we know where to re-read when designing.

Every opportunity is filtered through the **Soul Charter**: warmth, Highland fantasy, failure-kindness, handcrafted care. Mechanics that would cool the game's warmth are marked **(Soul-risky)** and come with notes on how to soften them.

Opportunities are sorted into four tiers:

- **Tier S — Big Bets.** Large-scale features that would substantially expand the game's ceiling. Expensive but transformative.
- **Tier A — High-Impact Adds.** Focused features that punch above their weight. The best ROI bets.
- **Tier B — Polish & Juice.** Smaller additions that compound the existing experience.
- **Tier C — Deferred / Speculative.** Good ideas worth writing down, but not immediate priorities.

---

### Tier S — Big Bets

#### S1. Haggis Variants (Characters-as-Constraints)

- **Current state.** One playable haggis. Stat composition exists; variant hooks already present in code.
- **The gap.** Compared to Brotato (40 characters), Isaac (~30 characters), HoloCure (~50 VTubers), WHS has exactly one protagonist.
- **The opportunity.** Introduce **6–8 handcrafted haggis variants**, each a full character-as-constraint rewrite. Examples:
  - **Wee Haggis.** Tiny sprite, −40% max HP, +80% speed, +50% pickup radius. Fragile speedster.
  - **Burnt Haggis.** Starts with fire-themed passive, leaves a mild burn trail, cannot pick up healing circles but regens on kills.
  - **Tartan Haggis.** +1 passive slot, −1 weapon slot. Build-forward, combat-thin.
  - **Highland Cow-Haggis.** 3× max HP, ½ speed. Tank fantasy.
  - **Laird's Haggis.** Starts with gold pouch, 2× shop costs, +100% luck. Treasure-hunter.
  - **Selkie-Haggis.** Starts in Loch biome. Speeds up in healing circles.
  - **Kelpie-Haggis.** Cannot take damage while dashing (doubled dash duration), but dash cooldown +100%.
  - **Granda's Haggis.** Level-ups offer +1 extra card, starts with Scotch Mist. Slow and thoughtful.
- **Why it works for WHS.** Characters multiply content *across* all existing systems. Moor Road routes feel different per character. Upgrades feel different per character. Enemy waves feel different per character. This is the single best investment in replayability.
- **Cost.** Large — art for each variant, stat-balancing, unique opening weapon choices, banter lines per variant. Mitigated by the Soul Charter demanding handcraft anyway.
- **References.** Brotato (§2), Isaac (§11), HoloCure (§4), Rogue Legacy 2 (§16, traits on top of classes).

#### S2. Gran's Croft — The Hub That Grows

- **Current state.** No persistent hub scene. Meta shop exists but is transactional.
- **The gap.** Hades's House, Cult of the Lamb's cult, Spelunky's rescued NPCs, Loop Hero's camp, Rogue Legacy's manor — all premium roguelites have a **visually evolving hub**.
- **The opportunity.** Build **Gran's Croft** — a scene players return to between runs that *accumulates trophies*:
  - A **mantelpiece** that gains a keepsake per boss killed (Gordon's tie, Tour Bus wheel, Laird's pipes…).
  - A **photo wall** that posts a frame per route first-picked.
  - A **drove** — a visible group of haggises corresponding to the variants unlocked.
  - A **book** on a table containing the Highland Almanac (see Tier A).
  - A **wireless** (radio) that plays procedural music samples from runs.
  - **Gran** herself, present, knitting, commenting on how you've been doing. Banter density 40–80 lines.
- **Why it works for WHS.** The Soul Charter is warmth. Nothing expresses warmth like a home that remembers you.
- **Cost.** Medium-high — a scene, art budget, Gran's banter, trophy art per boss/route. Well aligned with existing art direction.
- **References.** Hades House (§10), Cult of the Lamb (§25), Spelunky 2 (§15), Loop Hero (§24), DRG:S ship (§7).

#### S3. Deepen Moor Road — Multi-Node Paths Within Acts

- **Current state.** Two acts, each with a 3-choice route picker. Routes are modifier tweaks.
- **The gap.** Slay the Spire's map has 14+ nodes per act with forking paths and visible reward icons. WHS has 1 picker per act.
- **The opportunity.** Expand each act into a **3–5 node micro-map**:
  - Between the start and the boss, 3–5 nodes rendered as a small map widget.
  - Node types: **Encounter** (wave mix), **Shrine** (stat buff or curse), **Wee Trader** (spend gold mid-run), **Hidden Route** (diegetic discovery unlock), **Bargain** (Cailleach's trade), **Rest** (partial heal + reroll), **Elite** (guaranteed elite spawn, guaranteed legendary chest).
  - Players *see* the path before they walk it, anticipating rewards.
- **Why it works for WHS.** Adds the **decision architecture** survivor-likes usually skip (they just have time). WHS's Moor Road foundation supports this cleanly.
- **Cost.** Medium — new UI widget, node-type mechanics, integration with existing route system. Data-driven, aligns with `routes.ts` schema philosophy.
- **References.** Slay the Spire (§18), FTL (§22), Monster Train (§20), Hades (§10, chambers).

#### S4. The Rule-Stack Upgrade System

- **Current state.** Upgrades are mostly flat stats (+10% damage). 17 stat cards, rare synergy surfacing.
- **The gap.** Balatro, Isaac, Hades — all stack *conditional rules* rather than flat numbers. Rule-stacking is the engine of build-joy.
- **The opportunity.** Introduce a **Rune** upgrade tier (rarer than current uncommon/rare):
  - **Conditional runes:** "Bagpipe Blast deals +100% damage to enemies in fog." "Every 10th kill spawns a healing thistle." "Critical hits below 30% HP chain to a second target."
  - **Threshold runes:** "At 5+ passives, gain +20% damage." "When all 6 weapons reach L5, pickup radius doubles."
  - **Chain runes:** "Thistle Shot → Scotch Mist → Caber Toss kills grant +1 temporary max HP for 60s." (Kills must happen in order.)
  - Runes appear at lower rate than current upgrades but are *visibly distinct* (glowing card, stone-carved aesthetic).
- **Why it works for WHS.** Turns the level-up moment into a puzzle. Runes combine into emergent strategies. Legibility: each rune is a *sentence*, not a number.
- **Cost.** Medium — card-pool refactor, conditional evaluation hooks in combat systems, art for rune cards. Fits existing card pool architecture.
- **References.** Balatro (§19), Isaac (§11), Slay the Spire (§18), Hades duo boons (§10).

#### S5. Banter Density Push — 300+ lines

- **Current state.** Banter framework scaffolded, ~0 lines shipped, content deferred per `BANTER_GAPS.md`.
- **The gap.** Hades has ~21,000 voiced lines. WHS will never approach that, but *text* banter at ~300–500 lines is achievable and transformative.
- **The opportunity.** Write **a dense banter script** across trigger categories:
  - **Gran commentary** (30+) — appears at run start, first-time boss kills, Moor Road route picks, death screens.
  - **Haggis internal monologue** (50+) — during calm moments, on hazards ("this slick is worse than a ceilidh floor"), at milestones.
  - **Enemy flavour** (100+, 2–5 per enemy type) — midges swarming, bosses telegraphing, elites crowing.
  - **Cailleach whispers** (20+) — appear at act intermissions, low-HP moments, devil-deal-style offers.
  - **Moor Moments** (40+) — unique one-liners for rare events (first evolution, combo 100, ironmoor completion).
  - **Death reflections** (30+) — per cause-of-death category, with variants.
  - **Tourist tiers** (30+) — tour-bus riders speaking as they pass.
- **Why it works for WHS.** This *is* the Soul Charter in practice. Every line is a tiny transfer of warmth.
- **Cost.** Writing-heavy, code-light. The hardest part is *voice consistency* — the `VOICE_CARD.md` already establishes tone. Bilingual doubles scope; prioritise English first, Scots as reach.
- **References.** Hades (§10), DRG:S (§7), HoloCure (§4), Cult of the Lamb (§25).

---

### Tier A — High-Impact Adds

#### A1. Highland Almanac (Discovery-Log Meta)

- **Current state.** Chronicle (run history) exists but is runs-only.
- **The gap.** Spelunky's journal, Isaac's secrets, Hades's fated list — every *thing* encountered should enter a log.
- **The opportunity.** A separately-accessible **Almanac** with four books:
  - **Beasties** (all enemies encountered, lore entry per enemy).
  - **Weys** (routes taken, counts per route, rarely-picked routes highlighted).
  - **Finds** (items collected, evolutions made, chests opened).
  - **Banter** (lines triggered, counts, rare/unseen lines teased as "???").
- **Why it works for WHS.** Creates long-tail curiosity — players see what they've missed. The Almanac *is* discovery progression.
- **Cost.** Medium — save-schema extension, UI scene, lore writing per entry (feeds into Tier S5).
- **References.** Spelunky 2 (§15), Isaac (§11), Hades fated list (§10), Cult of the Lamb codex (§25).

#### A2. Active Ability Slot (Dram / Pipes / Charm)

- **Current state.** All upgrades are passive. Dash exists but is mobility, not combat.
- **The gap.** Every action roguelite has an active button — Hades cast, Isaac active item, Dead Cells skill, Gungeon active, RoR2 equipment.
- **The opportunity.** Introduce a single **active slot**. Examples:
  - **Dram of Whisky.** Press to heal 20% HP + 3s invincibility. 45s cooldown.
  - **Pipes of War.** Press to stun all enemies for 1s + grant 5s damage aura. 60s cooldown.
  - **Gran's Charm.** Press to reveal all chests and force next card-draw to be rare+. 90s cooldown.
  - **Thistle Bomb.** Press to AoE pulse dealing 300% max HP damage. 30s cooldown, 3 charges max.
  - **Saltwire Hex** *(Soul-risky: curse flavour).* Press to curse 20 enemies to explode on death. 60s cooldown.
- **Why it works for WHS.** Adds a skill-moment to the auto-combat flow. Players have an *emergency button* they can mis-time.
- **Cost.** Medium — new slot UI, cooldown indicator, data-driven active definitions (mirrors weapon system).
- **References.** Hades cast (§10), RoR2 equipment (§13), Isaac active items (§11), 20 Minutes Till Dawn (§5, reload as skill gate).

#### A3. Weapon Unions (Evolution² / Collabs)

- **Current state.** 7 evolutions. Bagpipes (utility) has no evolution.
- **The gap.** Vampire Survivors added "unions" (two evolutions fused). HoloCure's collab is two-weapon fusion. WHS stops at single-weapon evolutions.
- **The opportunity.** **5 handcrafted Union weapons** that require *two* max-evolved weapons and transform into a new named weapon:
  - **Highland Charge** = Claymore evolution + Caber evolution. A whirling spectre of steel and timber.
  - **The Storm of the Hebrides** = Thistle Storm + The Haar. Piercing fog-bolts.
  - **Gran's Fury** = Highland Fling + Nessie Unleashed. Sweeping tentacle-pulses.
  - **Cannonade** = Haggis Cannon + Highland Games. Exploding cabers.
  - **Bagpipe Inheritance** = Bagpipes + 3 passive items of Gran's line. Gives Bagpipes an evolution finally.
- **Why it works for WHS.** Gives late-game runs a new ceiling. Creates "the run where I got a Union" moments.
- **Cost.** Medium-high — 5 new weapon behaviours, balance, art, naming. Huge payoff for endgame.
- **References.** Vampire Survivors unions (§1), HoloCure collabs (§4).

#### A4. Moor Road Events & Wee Traders

- **Current state.** Moor Road is pure route-picker, no encounters.
- **The gap.** FTL text events, Hades chambers with variety, Spelunky shops. WHS has 2 decision points per run.
- **The opportunity.** Between routes, insert **wee events** — 30-second detours with choice-based outcomes:
  - **A Wee Trader** — spend gold on a random passive, random evolution preview, or reroll token.
  - **Cailleach's Bargain** — trade 20% max HP for 2 rare card draws (Soul-softened: she's motherly not malicious).
  - **A Midge Swarm** — skip the event for safety, or fight the swarm for 3× XP.
  - **A Wee Choir of Haggis** — if you wait 10s they sing a buff onto you.
  - **A Lost Traveller** — gives you a clue toward a hidden route (Almanac entry).
- **Why it works for WHS.** Adds variety and *decision density* to the run flow. Fits narrative (Scotland is full of strange encounters).
- **Cost.** Medium — event framework, ~8–12 event types, UI, writing.
- **References.** FTL (§22), Isaac events, Hades chambers (§10), Monster Train events (§20).

#### A5. Relics — A Third Progression Tier

- **Current state.** Weapons + passives, nothing else.
- **The gap.** Slay the Spire relics, Isaac items, Hades keepsakes — the third tier above passives.
- **The opportunity.** Introduce **Relics** (rare) — items dropped only from elites and bosses, limited to 3 slots per run, giving *run-altering* rules. Examples:
  - **Cairn Stone** — enemies killed spawn pickup-rushing gems.
  - **Sporran of Holding** — double all pickup drops, but pickup radius halved.
  - **The Laird's Signet** — every 30s, gain a random temporary stat buff.
  - **Gran's Teapot** — after combat lull (no damage for 5s), heal 5%/s.
  - **Pictish Compass** — reveals chest locations on the minimap. Soft-gate to W3 biome?
  - **Highland Torque** — +100% damage to elites, but elites spawn at 15% rate instead of 10%.
- **Why it works for WHS.** Elevates elite/boss kills from "+3× XP" to "run-changing event." Creates real anticipation around elites.
- **Cost.** Medium-high — new item tier, drop logic, UI slot, ~15–20 handcrafted relics.
- **References.** Slay the Spire (§18), Isaac (§11), Hades keepsakes (§10), Returnal parasites (§17).

#### A6. Enemy Modifiers / Affixes

- **Current state.** Elite system is +HP / +speed / +XP. Universal.
- **The gap.** Soulstone Survivors and Halls of Torment use **Diablo-style affixes** on elites — frozen, burning, reflective, haste, vampiric.
- **The opportunity.** Add ~8 elite affixes, rolled per elite spawn:
  - **Frosty** — leaves ice trails that slow player.
  - **Burning** — emits a fire aura.
  - **Shocking** — periodic lightning cone attack.
  - **Vampiric** — heals from damage dealt.
  - **Thorns** — reflects 10% damage taken.
  - **Bog-Cloaked** — partially invisible; reveals only when attacked.
  - **Midge Swarm Host** — spawns 3 midges every 5s.
  - **Cailleach-Touched** *(legendary)* — all previous affixes stacked at half strength.
- **Why it works for WHS.** Cheap content multiplier. 32 enemies × 8 affixes = huge combinatorial variety. Forces adaptive play.
- **Cost.** Low-medium — affix data, visual effects per affix, integration with elite spawn. Scales elegantly.
- **References.** Soulstone Survivors (§6), Halls of Torment (§3), Diablo lineage.

---

### Tier B — Polish & Juice

#### B1. Run Identity Badge

- **The opportunity.** After 3 level-ups, show a small "**Your Run:** Caber Storm / Mist Drifter / Cailleach's Chosen / Midgie Wrangler" badge in the HUD. Purely informational, no mechanical impact. Emergent — computed from current passive/weapon composition.
- **References.** Slay the Spire archetypes (§18), Death Must Die god identities (§8).

#### B2. Combo Milestone Celebrations (Ecstasy Layer)

- **Current state.** Combo counter with VFX at 5/10/25.
- **The opportunity.** At *major* milestones (100, 250, 500, 1000), trigger a **stopping moment** — brief slow-mo, screen-wide VFX, a Gran or haggis voice line. Plus a permanent "you got combo 500" entry in the Almanac.
- **References.** Hades contextual voice (§10), HoloCure's Super moments (§4).

#### B3. Diegetic Easter Eggs in the Moor

- **The opportunity.** Hidden interactions that are *noticeable but not advertised*:
  - Circle a standing stone 3 times → it hums and grants pickup radius +25% for 60s.
  - Don't damage a stray sheep for 90s → it follows you and drops gold on kills it witnesses.
  - A lone thistle at map edge, if not trampled → blooms at 10:00 and grants a free card draw.
  - A rare *wee glow-bug* that flits across screen → catch it by walking into it → Almanac entry.
- **References.** Spelunky 2 (§15), Noita shrines (§23), Enter the Gungeon wall-shoots (§14).

#### B4. Chest Variety

- **Current state.** Chests give weapon upgrade, evolution, passive, gold.
- **The opportunity.** Add chest *types* with distinct aesthetics and contents:
  - **Stone Cairn Chest** (common) — current roll.
  - **Brass Chest** (uncommon) — guaranteed passive.
  - **Pewter Chest** (rare) — evolution or rune (if runes added).
  - **Faerie Chest** (legendary, rare drop) — guaranteed union/relic.
  - **Cailleach's Chest** *(devil-deal variant)* — huge reward, costs 30% max HP to open.
- **References.** Isaac chest types (§11), Enter the Gungeon chest tiers (§14).

#### B5. Procedural Music Deepening

- **Current state.** 4-layer conductor, Euclidean rhythm, FM piano, pad drone, heartbeat.
- **The opportunity.**
  - Add **chord progression** to the pad (not just drone) — more emotionally responsive.
  - Add a **bodhrán layer** (Scottish frame drum) that enters during boss fights.
  - Add a **fiddle lead** that emerges on milestone moments (combo 100, evolution, act complete).
  - Dynamic **transition stings** (not linear fades) for biome changes.
- **References.** Hades music (§10), DRG:S voice-over soundtrack (§7), HoloCure stage themes (§4).

#### B6. Tooltips & Build Readability

- **The opportunity.** When hovering a card in level-up UI, surface:
  - Why this card was drawn (rarity, luck applied, synergy bump).
  - Interaction preview ("This will stack with your 3 existing projectile-speed cards").
  - Evolution tease if L4 weapon + matching passive detected.
- **References.** Brotato tooltips (§2), Slay the Spire card hover info (§18), Balatro Joker text (§19).

#### B7. Death-Screen Lore Reflections

- **Current state.** Death screen shows cause of death, stats, rerun.
- **The opportunity.** Add a **reflective banter line** per death cause. "The tourist had you. Gran shakes her head." "Lava. Always the lava. One day, maybe not." Hades does this famously — every death has something said about it.
- **References.** Hades Hypnos (§10), Cult of the Lamb lamb-death scenes (§25).

#### B8. Dashing & Movement Depth

- **Current state.** Dash + Burn Leap. Solid.
- **The opportunity.**
  - **Charged dash** — hold dash for 1s for a longer invulnerable lunge.
  - **Dash-kill bonus** — kills made mid-dash grant reduced cooldown.
  - **Burn-Leap synergies** — cards that buff post-Burn-Leap actions (first shot after = crit).
- **References.** Hades dash modifiers (§10), Dead Cells rolls (§12).

---

### Tier C — Deferred / Speculative

#### C1. Co-op (2-player)

Local or online 2-player. Yet Another Zombie Survivors, Risk of Rain 2, Cult of the Lamb all do this. Multiplies appeal but *significantly* complicates determinism (replay), music reactivity, UI. Defer until Phase post-1.0.

#### C2. Lineage / Generational Progression

A haggis's death passes a small trait to the next run's haggis (matching Rogue Legacy 2's traits). Soul-aligned (Scottish family ties), mechanically deep. Worth a dedicated spec. The existing `lineage-phase0` superpowers spec suggests this is already in-flight.

#### C3. Wand-Editor-Adjacent Power-User Mode

Noita's wand editor is 99% of players' ceiling — but the *1%* makes YouTube compilations. A late-game menu allowing players to set priorities within weapon-fire order, or to chain evolved weapons into compound attacks. **Dangerous — easy to over-complicate.** Only if a clear design spec emerges.

#### C4. Seasonal / Daily Challenges with Leaderboards

Daily challenges exist. Expanding into *seasonal* (monthly) with public leaderboards would deepen the community hook. Requires server-side component — significant infrastructure. Deferred.

#### C5. Endless Mode: True Endless + Apocalypse

Post-Reaper / post-Taxman: an endless mode where enemies scale exponentially and the Cailleach rises. Balatro's Endless, RoR2 cycles. Most survivor-likes have this; WHS could add a framed "Cailleach's Night" mode. Medium cost.

#### C6. Cosmetics / Visual Unlocks

Haggis hats, tartans, bows. Pure cosmetic rewards for milestones. Unlocks via Almanac completion. Lives in Gran's Croft wardrobe.

#### C7. Narrative Arc / True Ending

A multi-run-spanning narrative culminating in a **true ending** — beat the Taxman with a specific variant + all routes visited + Cailleach appeased. Dark Souls-style. Huge scope, but every great roguelite has one.

---

### Cross-Cut: Soul Charter Compliance Notes

Several patterns in the doc could harm WHS's warmth if naively imported. Notes on softening:

- **Curses / Devil Deals.** Frame as *bargains with friendly forces* (Cailleach as motherly trickster, not demon). Avoid "curse" language; use "wager" or "dare."
- **Punishing difficulty.** Ironmoor is our "hard mode" — don't bleed its harshness into default difficulty. Heat-style modifiers are *opt-in*.
- **Fourth-wall breaks.** Only from Gran. She earns it; others don't.
- **Grinding loops.** Never lock *content* (a whole biome, a whole weapon family) behind currency farming. Lock polish/cosmetics there. Content gates are for *discoveries*, not time investments.
- **Fail states amplified.** Death screens should *always* feel like a hug. Never let failure feel like a stat sheet.

---

### Recommended First Three Specs

If I had to pick three opportunities to translate into specs next, in order:

1. **Tier S5 — Banter Density Push.** Highest ROI, highest Soul-Charter alignment, code-light. Unblocks the warmth fantasy.
2. **Tier A5 — Relics (third progression tier).** Elevates existing elites/bosses from modest rewards to run-defining moments. Fits cleanly into existing data-driven architecture.
3. **Tier S1 — Haggis Variants (first 3 of 8).** Ships as a "characters" content pack. Amplifies replayability of *every* other system in the game. Start with 3 contrasting archetypes — Wee Haggis (fragile speed), Highland Cow-Haggis (tank), Granda's Haggis (build-heavy).

Beyond those three: Gran's Croft (S2), Moor Road node-maps (S3), and Rule-Stack upgrades (S4) are the next wave.

---

## Appendix — Further Reading & Related Genres

Games not in the top 25 but worth pocket-notes on for specific reference:

- **Peglin** — pachinko-roguelite. Relevance: *card-relic composability in a physics sandbox*.
- **Backpack Hero** — inventory-Tetris roguelite. Relevance: *positioning items as a build mechanic*.
- **Slice & Dice** — dice-builder roguelite. Relevance: *luck-as-mechanic*.
- **Shogun Showdown** — tactical roguelite with combo-chaining. Relevance: *pre-telegraphed enemy movement creates chess-like tension*.
- **Wildfrost** — deckbuilder with placement. Relevance: *aesthetic warmth + harsh mechanics contrast*.
- **Dicey Dungeons** — dice-roll builder. Relevance: *distinct character rules per class*.
- **One Step from Eden** — battle-royale deckbuilder action hybrid. Relevance: *realtime + deckbuilding fusion*.
- **Into the Breach** — perfect-info tactics roguelite. Relevance: *information design in a roguelite — no hidden rules*.
- **Scourgebringer** — platformer bullet-hell roguelite. Relevance: *momentum as core mechanic*.
- **Curse of the Dead Gods** — action roguelite with corruption mechanic. Relevance: *escalating persistent debuff as difficulty modifier*.
- **Streets of Rogue** — immersive-sim roguelite. Relevance: *emergent solutions from overlapping systems*.

### Genre Lineage to Study for WHS-Specific Inspiration

Beyond roguelites, consider:

- **Traditional Scottish / Celtic games and folklore** for thematic authenticity. Hamish Henderson's folklore collections, John Matthews's *The Sidhe*, Neil Gunn's fiction. Research should deepen WHS's *soul* as a Scottish game — not just aesthetics, but structure.
- **Auto-battler / TFT** for party-composition insights.
- **Immersive sim** (Dishonored, Prey) for how systemic interactions create emergent gameplay — relevant if we push hazards/slicks/fog into interacting pairs.
- **Indie music-games** (Rhythm Doctor, Crypt of the NecroDancer) for music-gameplay fusion — if procedural music deepens to respond to player *actions*, not just state.

### Post-Research Reading List

- Jonas Tyroller's "How Roguelites Work" breakdown (YouTube).
- Masahiro Sakurai on shokunin craftsmanship (YouTube channel on game design).
- Mark Brown's Game Maker's Toolkit series on roguelite progression.
- Extra Credits on Slay the Spire ("anatomy of a deckbuilder").
- `docs/DESIGN_SOUL.md` (WHS-internal) — always the tiebreaker for any feature debate.

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). 25 games, 4 clusters, 14 cross-game patterns, 5 Tier-S opportunities, 6 Tier-A adds, 8 Tier-B polish items, 7 Tier-C deferred.
