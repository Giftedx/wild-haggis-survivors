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
- **Burn Leap** — double-tap movement = short hop with brief hazard immunity. Adds routing to peat/bog play.
- **Whisky Breath** — collect stacks; hold to breathe a short cone of fire that leaves a burn puddle.
- **Taxman Grudge Ledger** — silent tracker of how you finish elites/bosses; end-of-game dialogue shifts accordingly. Hidden state; save schema care.
- ~~**Ceilidh Chain Combo**~~ — ✅ shipped: every 8th kill in a streak pulls coins and gems in close (see `ach_ceilidh_commander`).
- ~~**Standing Stones**~~ — ✅ shipped: three-stone mid-run boon picker (see `ach_stone_circle`).
- **Reliquary Pickups** — ~1 per run, a hidden relic spawns off-path; grants a run-scoped curio + a lore page. Optional, non-blocking.
- **Weather Memory Trails** — in fog, your last few seconds of path remain; enemies crossing your trail are briefly slowed.
- **Shinty Parry** — a new weapon with a 350 ms reflect window against projectiles. High-skill defensive layer.
- ~~**Ancestral Echoes**~~ — ✅ shipped: spectral haggis on the first 30 s at the prior death spot (see `ach_echo_touched`).
- ~~**Tartan Banner** (postcard slice)~~ — ✅ shipped 2026-04-18: procedural plaid composited into the postcard footer, derived from variant + top-damage weapon + mode tags (`src/utils/tartan.ts`). **Mantle half** of the bullet is still blocked on the W71 rig layer and stays open as a future extension.

### Ideas cut (not here anymore)

- *Midge Reputation* — cross-run path bias. Anti-fair; risks punishing good play. Removed.
- *Tide & Time dynamic arena* — soft boundary shifts mid-run. Readability-hostile without a huge VFX budget. Removed.
- *The Quiet Minute* (enemies slow to 60% for 20 s mid-run) — **breaks the survivors genre**. Removed. (If a *boss intro* slow-mo beat is wanted, that's a different idea, filed under boss pipeline.)

---

## 2. Playable haggis roster (ideas)

**Current shipped variants (verified in `src/data/variants.ts`):** `classic`, `moor_runner`, `iron_belly`, `glen_forager`, `surefoot`, `pipe_breath`, `wee_ghostie`, `laird`. **Eight variants.** Honest roster ceiling ≈ 10 before the pool dilutes — two slots left before "adding a variant" starts hurting the pool more than helping it.

Candidates worth a sketch (pick 2 max for a content drop):

- **Glaswegian** — fast, crit-on-dodge, Limmy-bite banter register. Punisher.
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
| `blue_man_of_minch` | Cryptids | Throws a "kenning" — banter literal-answer grants a buff. |
| `kelpie_foal` | Cryptids | Lures with fake pickup glow. |
| `barghest` | Cryptids | Off-screen howl 2 s before dive — clean telegraph. |
| `seelie_piper` | Faerie | Aura buffs nearby mobs. Priority-target teaching. |
| `unseelie_fiddler` | Faerie | Three-note pattern on moor-moment beats. |
| `haar_wraith` | Weather | Spawns local fog on death. |
| `gale_wraith` | Weather | Displaces player on contact. |
| `buckfast_ned` | Urban | Bottle arc leaves slick ground. Glesga comedy. |
| `traffic_cone_totem` | Urban | Static; bursts into four slow cones on death. |
| `edinburgh_ghost_guide` | Academic | Narrates as a damage source. |
| `ceilidh_caller` | Academic | Forces enemies to move in sync briefly. |
| `ledger_wraith` | Taxman | Immune until Taxman takes damage. |
| `auditor_priest` | Taxman | Beam ranged, tests drift skill. |

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
- ~~Tartan patterns — algorithmic~~ — ✅ shipped 2026-04-18 (`src/utils/tartan.ts` — postcard footer slice only; mantle half still blocks on W71). Authored patterns + deed-gated unlocks still open.
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
