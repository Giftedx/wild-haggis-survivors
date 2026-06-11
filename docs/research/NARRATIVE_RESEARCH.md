# Narrative Design for Roguelites — Research & WHS Application

> *"I figured out what kind of character would remember every death — a character who's immortal. Because you don't really die for real in roguelike games."*
> — Greg Kasavin, creative director of *Hades*, explaining the game's narrative premise

> **Purpose.** A focused deep-dive on how roguelites — games that structurally *repeat* — tell meaningful stories. Most storytelling traditions (novels, films, linear games) assume progression and singularity; roguelites assume loops. This doc explores what works, drawing on Hades, Hollow Knight, Dark Souls, Inscryption, Isaac, Spelunky, and others — then maps the lessons to WHS specifically.
>
> **How it relates to other docs.**
> - `ROGUELITE_RESEARCH.md` — structural patterns in roguelites.
> - `GAME_FEEL_RESEARCH.md` — moment-level craft.
> - `VOICE_CARD.md` — voice that carries the narrative.
> - **This doc** — *narrative architecture*: how to tell story across repetition, through environment, through items, through death.
>
> **How to use.** When designing any new narrative element — banter, NPC, Almanac entry, item description, boss encounter, seasonal event, or "true ending" — consult the relevant pattern. Part 8 maps each to WHS opportunities.
>
> **Scope.** 8 parts. ~11,000 words. Seven case studies with practical extraction. Scottish narrative traditions as the thematic engine. WHS-specific application map.
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — seventh doc in the WHS research series.

---

## Table of Contents

1. [Part 1 — The Storytelling Paradox in Roguelites](#part-1--the-storytelling-paradox-in-roguelites)
2. [Part 2 — The Narrative Vocabulary](#part-2--the-narrative-vocabulary)
3. [Part 3 — Case Studies](#part-3--case-studies)
4. [Part 4 — Scottish Narrative Traditions](#part-4--scottish-narrative-traditions)
5. [Part 5 — How WHS Tells Its Story](#part-5--how-whs-tells-its-story)
6. [Part 6 — Narrative Building Blocks](#part-6--narrative-building-blocks)
7. [Part 7 — The Ending Problem Revisited](#part-7--the-ending-problem-revisited)
8. [Part 8 — WHS Narrative Application Map](#part-8--whs-narrative-application-map)
9. [Sources & Further Reading](#sources--further-reading)
10. [Changelog](#changelog)

---

## Part 1 — The Storytelling Paradox in Roguelites

### 1.1 The core problem

Traditional storytelling structures assume progression: cause-effect over time, character growth, irreversible change. The hero's journey, the three-act structure, the climactic revelation — all built on the assumption that *events happen once*.

Roguelites invert this. The player dies hundreds of times. Each run starts the character at the beginning. Information accumulates *in the player's head* but *not in the world's state* — usually.

This creates a paradox: **how do you tell a meaningful story when the world keeps resetting?**

Greg Kasavin (Hades) put it directly: "The story is blended in the game and you can never really split story progression from the actual gameplay, as the plot IS the game."

### 1.2 The four solutions

Games have evolved four broad approaches:

**1. Ignore it.** Make gameplay king; story is decoration (Vampire Survivors, most survivor-likes). The run *is* the story.

**2. Reframe death as narrative.** Make the character *an immortal who dies and comes back* — the framing of Hades (Zagreus can't really die; he's the Prince of the Underworld) and many others. Repetition becomes *diegetic*.

**3. Layer stories outside runs.** Run = gameplay; between runs = story (Isaac's unlock narratives, Slay the Spire's class lore, Inscryption's meta-layers). Progress is measured in *what the player knows*, not *what the character knows*.

**4. Embed story in environment and items.** Let the world carry lore that the player encounters regardless of death (Hollow Knight's ruins, Dark Souls's item descriptions). Each run is a new reading of the same text.

Great roguelites usually combine multiple approaches. Hades does all four.

### 1.3 The gift of the loop

The loop structure is often treated as a *constraint*, but it's also a *gift*:

- **Re-reading.** A player who's seen a dialogue once reads it differently the second, tenth, hundredth time. Subtext accumulates.
- **Emotional compound interest.** A warm banter line heard once is a line. Heard 100 times across many runs becomes *a friend's voice*.
- **Story-as-ritual.** Religious liturgy, folk tales, bardic traditions — all these oral-storytelling traditions *are* repeated storytelling. Roguelites connect to something ancient.
- **Accumulation of knowledge.** Players become scholars of the game's lore. Forum theorising, wiki-building, community mythmaking — all thrive because repetition invites interpretation.

WHS's own narrative thinking should embrace the gift: *the Moor remembers every run*.

---

## Part 2 — The Narrative Vocabulary

The tools available to roguelite storytellers. Each has characteristic strengths.

### 2.1 Cutscenes

**Strength.** Total directorial control. Voice, music, pacing, camera — all scripted.

**Weakness.** Expensive. Breaks gameplay. Doesn't repeat well — players skip after seeing once.

**Roguelite usage.** Sparingly. Hades uses only a handful (opening, endings). Isaac has brief ones. Most cutscenes in roguelites are *reserved* for first-time major story beats.

**WHS fit.** Not a core tool. Reserve for rare milestones (first-ever Taxman kill, variant-unlock reveal).

### 2.2 Environmental storytelling

**Strength.** Always-on. Players learn while they play. No pace interruption.

**Weakness.** Ambiguous — players may miss the story entirely. Requires detail-rich art.

**Roguelite usage.** Huge in Hollow Knight (ruins-as-text). Dark Souls (architecture carries lore). Moderate in Hades (House of Hades changes state).

**Specific techniques:**
- **Architectural decay** — ruins tell of lost civilisations.
- **Graffiti / inscriptions** — hints at past events.
- **Staged scenes** — corpses posed to tell a story.
- **Seasonal change** — world reflects time passing.
- **Broken objects** — imply violence, loss.
- **Gathering places** (empty cups, half-eaten food) — imply lost life.

**WHS fit.** Medium potential. The moor could carry environmental storytelling: ruined crofts, cairn markers, old fence posts, abandoned campfires, peat-preserved tools, scattered tartan fragments.

### 2.3 Item flavour text

**Strength.** Extremely dense. Each item carries a micro-story. Players *always* read inventory.

**Weakness.** Requires *a lot* of writing. Each item needs a line that feels crafted.

**Roguelite usage.** Dark Souls is the gold standard — every item has 2-5 sentences of lore that build the world. Hades uses this moderately (boons, keepsakes). Isaac uses it for flavour, not deep lore.

**Miyazaki's (Dark Souls director) technique.** "Most players naturally check item descriptions as part of normal gameplay flow, encountering snippets of lore which they can choose to retain or ignore." The descriptions are *voluntary narrative* — present for those who want it.

**The writing technique:**
- **Ambiguity is a feature.** "Said to have belonged to a long-dead king." Who? When? Why dead? Players wonder.
- **Compound fragments.** Item descriptions *reference* each other. The sword that "killed a dragon" plus the dragon-scale passive = implied story.
- **Never over-explain.** Leave 30% unsaid.
- **Consistent voice.** All item descriptions in one writer's hand.

**WHS fit.** **High potential.** WHS weapons, passives, relics, evolutions all need flavour text. A Dark-Souls-level investment in item lore could be a signature.

### 2.4 Dialogue and banter

**Strength.** Personal. Character-building. Reactive to player state.

**Weakness.** Requires pool management to avoid repetition fatigue. Heavy writing load.

**Roguelite usage.** Hades is the peak — 21,000 voice lines, contextual to game state. HoloCure via character-specific lines. Isaac via room-tips.

**Contextual banter best practice** (from Hades):
- Lines fire based on *specific state* (killed this enemy, low HP, seen this boss N times, picked up this item).
- First-time lines are *reserved* and unique.
- Frequently-heard lines get *multiple variants* to prevent fatigue.
- Silence is deliberate — not every event needs a line.

**WHS fit.** **Core to the game.** Existing banter framework + planned 300–500 line target (per roguelite doc Tier S5). This is WHS's main narrative tool.

### 2.5 Diegetic UI

**Strength.** Story *in* the interface. No separation between game and story.

**Weakness.** Harder to design clearly. Can hurt readability.

**Roguelite usage.** Inscryption is the master (the UI *is* the story — menus, save files, file types all carry narrative). Hades's Fated List. Dead Cells's Collector.

**WHS fit.** Low-to-medium. The Chronicle could lean more narrative-diegetic. The save file could have personality.

### 2.6 Atmosphere & mood

**Strength.** Cumulative. Can tell stories *music* and *colour* alone could not.

**Weakness.** Subjective; hard to measure.

**Roguelite usage.** Hollow Knight uses this most heavily (atmospheric music, colour palette, ambient sound all combine into narrative tone). Hades through music-and-palette transitions.

**WHS fit.** **Already strong.** Per-biome palettes, procedural music layers, Soul Charter's tonal spectrum — all tools for atmospheric narrative.

### 2.7 Meta-narrative

**Strength.** Powerful. Creates "this is not just a game" moments.

**Weakness.** Easily gimmicky. Must be earned.

**Roguelite usage.** Inscryption (fourth-wall breaks, files in the game directory). Doki Doki Literature Club (meta-narrative as horror). Hades's Fated List feels almost meta (the player is checking off achievements *diegetically*).

**WHS fit.** Possible for a late-game / true-ending moment. One meta-narrative beat well-deployed can be iconic.

### 2.8 Emergent storytelling

**Strength.** Feels personal — the player *lived* it.

**Weakness.** Cannot be designed directly; only enabled.

**Roguelite usage.** Spelunky is peak — emergent deaths become stories ("I killed a shopkeeper, and then the Shopkeeper Bosses hunted me"). Isaac moderately. Noita intensely.

**Technique:** design systems that *interact*, creating novel outcomes. Physics, hazards, enemies, items all compose to make stories the designers didn't author.

**WHS fit.** Medium. Hazards interacting (slick + fire, fog + enemies, etc.) enable small emergent stories. Not a primary channel.

---

## Part 3 — Case Studies

Seven games examined for narrative technique. Each distilled into principles WHS can borrow.

### 3.1 Hades — Contextual Voice Mastery

Supergiant's 2020 game took the roguelite narrative mountain and won it.

**Core innovation.** *Narrative integrated into the loop itself*. Zagreus is Prince of the Underworld; he *literally cannot die* for real. Each run ends with his return to the House, where every NPC has fresh contextual lines about the run that just happened. Story progresses through *accumulated conversations* across many runs.

**Numbers.** 21,020 voice lines, 305,433 words. More words than the Iliad + Odyssey combined.

**Techniques extracted:**

1. **Every major event has reserved first-time dialogue.** First time killing Meg. First time reaching Asphodel. First time beating Hades. Unique lines only fire once.
2. **Secondary tier of variants for repeated events.** After the first-time line, 3–8 variants rotate so the tenth kill of Meg still feels fresh.
3. **Cross-referential NPCs.** Hypnos comments on the *specific way* Zagreus died. Nyx hints at family secrets. Achilles encourages. Each NPC is *aware of* what's happening in other NPCs' lines.
4. **Voice actor as auteur.** Darren Korb wrote the music, directed audio, and voiced Zagreus himself — a radical single-auteur approach.
5. **Story as gameplay reward.** Better play = more conversations unlock. The story *is* the post-run experience.
6. **Relationship-building mechanics.** Nectar/Ambrosia gifts to NPCs advance personal stories. Keepsakes (relationship-gated items) bring stories into runs.
7. **The Fated List.** A diegetic achievements system — "Zagreus's prophecies" are things the player has to accomplish. Each is narrative-flavoured (not mechanic-flavoured).

**WHS application:**
- Gran's voice should work like the House of Hades — fresh context lines after each run.
- Banter pool should prioritise first-time-events being *reserved* and unique.
- A Fated List equivalent — "The Haggis's Tally" — surfaces narrative objectives.
- Cross-referential NPCs: Gran knows what happened with the Cailleach, Cailleach knows Gran, etc.

### 3.2 Hollow Knight — Environmental Storytelling Mastery

Team Cherry's 2017 metroidvania (not strictly a roguelite, but heavily studied in the space).

**Core innovation.** A fallen kingdom told almost entirely through environment. The player pieces together the story by exploring ruins, fighting bosses, reading NPCs' fragmented speeches.

**Techniques extracted:**

1. **Minimal exposition.** NPCs speak briefly and cryptically. No tutorial-style lore dumps.
2. **Architecture as storytelling.** Beautiful, decayed cities tell of the past civilisation.
3. **Ambient sound.** Shifting music per area conveys emotional weight.
4. **NPCs as fragments.** Each character has a tiny, tragic arc. Most die.
5. **Bosses as elegies.** Each boss has implied backstory; fighting them is mournful as much as combative.
6. **Lore-hunter rewards.** Obsessive players find hidden texts; casual players get atmospheric feeling.
7. **The fallen kingdom conceit.** Hallownest feels *old* — ruins of a once-great place. The player is a *witness* more than a hero.

**WHS application:**
- The Moor could feel *old* — implied history in ruins, cairns, stones. The haggis is one small creature on a landscape with deep memory.
- Biome transitions should carry atmospheric weight, not just mechanical change.
- NPCs encountered can be fragments — a lost shepherd, a widow at a Clootie Tree, a retired piper — each with a small story.
- Easter eggs (hidden cairns, rare event wildlife) reward lore-hunters without excluding casual players.

### 3.3 Dark Souls — Item-Description Lore

FromSoftware's 2011 game (non-roguelite but hugely influential).

**Core innovation.** Most story exists in item descriptions. Players absorb lore *while managing inventory*.

**Techniques extracted:**

1. **Compressed prose.** Every item has 1-4 sentences. Dense.
2. **Ambiguity. Names without context. Events implied but not stated.**
3. **Mutual reference.** Items reference other items. A sword's description mentions its wielder, whose helmet description mentions the king, whose crown description mentions the conspiracy, etc.
4. **No lore pages.** No codex, no optional text. Everything is *in* the gear.
5. **Ambient reading.** Players read descriptions *because they're checking equipment*, not because "story time."
6. **Miyazaki-isms.** Director's writing voice is distinct — formal, mythic, sad.

**WHS application.** This is the highest-leverage narrative move. Every weapon, passive, relic, evolution gets a 1-3 sentence description that:
- Names a character, place, or event (even if fictional).
- Implies a history.
- References at least one other item (cross-linking the lore).
- Carries voice (Scottish-inflected, mythic, warm, specific).

**Example (speculative):**

Current (implied) description of Thistle Shot: *"A piercing thistle-dart."*

Dark-Souls-ified: *"First invented by a crofter's bairn who'd watched a Viking bare his sole upon a thistle. 'If it kept a kingdom,' she reasoned, 'it might keep me.' Passed from hand to haggis ever since."*

Current Claymore: *"A heavy Scottish broadsword."*

Dark-Souls-ified: *"Too heavy for any creature save a legend. William Wallace is said to have wielded one, though a haggis wouldn't know the difference. The blade remembers Falkirk. It does not forgive it."*

These descriptions *are* the game's history book, hidden in inventory.

### 3.4 Binding of Isaac — Metaphor and Hidden Story

Edmund McMillen's brutal 2011/2014 roguelite.

**Core innovation.** Story through *visual metaphor* more than text. Isaac is a child fleeing his mother; every item, enemy, and room visually expresses this.

**Techniques extracted:**

1. **Visual horror as narrative.** Items are disturbing objects — teeth, bones, fetuses — that imply without stating.
2. **Unlock narrative.** Beating bosses unlocks endings that gradually clarify Isaac's backstory. 20+ endings accumulate.
3. **Religious imagery as coded narrative.** Isaac's mother quotes scripture; the game's subtext is religious trauma.
4. **Hidden-meaning community.** Dedicated players piece together the true story. Wikis.
5. **Variant framing.** Different playable characters tell different perspectives on the same core events.

**WHS application:**
- Variant haggis should each have a *perspective* — Burns's Wee Beastie sees the moor through Burns's poetic eye; Witch's Hare sees it through Isobel Gowdie's gleeful confession. Same moor, different narrator.
- Visual details can imply backstory without text.

### 3.5 Spelunky — Emergent Storytelling

Derek Yu's 2008/2012 platformer roguelite.

**Core innovation.** Systems that interact to create stories the designers didn't write.

**Techniques extracted:**

1. **Every object is a physics object.** Bombs, rocks, enemies, player all interact.
2. **Shopkeepers remember.** Rob one shopkeeper; all shopkeepers on future levels come after you with shotguns. *This* is storytelling — a player's *action* created a *narrative thread* that persists.
3. **Journal (Codex) as collector.** Every creature encountered is logged. Flavourful captions. Rewards exploration.
4. **Rare events as personal moments.** Finding the Tide Pool route for the first time. Accessing the Hell temple. These are *your* stories.

**WHS application:**
- Small persistent consequences. Kill a specific enemy type 100 times → banter line acknowledges it.
- Almanac / Codex per Spelunky's Journal (already proposed in roguelite doc).
- "Rare first events" — shooting star, wildcat sighting, ghillie dhu encounter — become personal player stories.

### 3.6 Inscryption — Meta-narrative Mastery

Daniel Mullins's 2021 game.

**Core innovation.** The game itself changes mid-playthrough. Act 1 is one kind of game; Act 2 is another; Act 3 another again. Files on your computer become part of the story. The player feels *watched* through the screen.

**Techniques extracted:**

1. **Genre-swapping.** Roguelite to Pokémon-clone to ARG.
2. **Fourth-wall acknowledgment.** Characters know they're in a game.
3. **Escalating stakes.** Each act reveals the previous was "not the real game."
4. **Meta-puzzle.** Solving the game requires solving puzzles *outside* the game (floppy disk, file systems, streams).
5. **Community-necessary.** The ARG elements required community to decode.

**WHS application:**
- **Use sparingly.** Inscryption's magic is hard to reproduce. Attempt once, not as structural mode.
- **Possible moment:** a single hidden easter egg that breaks frame — perhaps Gran speaking directly to the player for a moment, acknowledging the runs. Reserved for end-of-a-long-journey.

### 3.7 Outer Wilds — Structural Storytelling

Mobius Digital's 2019 game (not roguelite-loop but time-loop). Very relevant.

**Core innovation.** The player is the *only* thing that persists across loops. Everything else resets. The "progression" is *the player's knowledge*. The game world doesn't change; *understanding* does.

**Techniques extracted:**

1. **Knowledge as inventory.** The player's understanding is the progress bar.
2. **No skills, no levels.** Only answers.
3. **The "Ship's Log"** records what the player has learned. It's *the* progression system.
4. **Every question's answer opens a deeper question.**
5. **Emotional crescendo through knowledge.** The ending lands because it's the culmination of *your* investigation.

**WHS application:**
- Almanac as knowledge-tracker, not checklist.
- Certain events only makes sense *after* the player has read specific Almanac entries.
- Some hidden content gated not by skill but by observation.

---

## Part 4 — Scottish Narrative Traditions

Before WHS's own narrative architecture, consider *which* narrative traditions Scotland brings.

### 4.1 The ballad

Scotland's dominant narrative-poetic form. Collected in Child's *English and Scottish Popular Ballads* (1882–98). Characteristics:

- **Narrative compression.** A murder ballad tells a life, a crime, a punishment in 80 lines.
- **Ambiguity.** Who killed whom, and why, often unclear. The listener fills gaps.
- **Oral repetition.** Same ballad sung many times by different singers with variants. The tradition *is* repetition with variation.
- **Supernatural matter-of-fact.** Selkies, ghosts, fairies appear as *events*, not marvels.
- **Moral weight without preaching.** Tragedy happens; the ballad records; the listener judges.

**Examples:** *Sir Patrick Spens, Tam Lin, Thomas the Rhymer, The Twa Corbies, Mary Hamilton, Barbara Allen*.

**Roguelite lesson.** Ballad form *is* repetition-with-variation. The WHS loop *is* a ballad structure. Banter pool variants *are* singer variants of the same ballad.

### 4.2 Folktale / seanchaidh tradition

Highland oral storytelling. A *seanchaidh* (storyteller) was a village figure. Stories: hero tales (Fionn / Fingal), wisdom tales (*Whuppity Stoorie*), place-explaining stories (*why the Corryvreckan whirls*), cautionary tales (kelpies).

Characteristics:
- **Place-anchored.** Every story is *of* a place.
- **Open frame.** A story told is a story *retold* with additions. The tradition shifts.
- **Teacher and entertainer.** Stories teach via pleasure.
- **Known-to-community.** Everyone listening already knows the story.

**Roguelite lesson.** When you hear a story told well for the 100th time, the skill is the *telling*. WHS's banter need not be novel every time — it needs to be *well-told* every time.

### 4.3 Burns's voice

Robert Burns as narrative voice:
- **Egalitarian.** "A man's a man for a' that."
- **Tender.** "To a Mouse." Empathy for the small and unheroic.
- **Political.** "Scots wha hae." Patriotism that's also radicalism.
- **Comic.** "Tam o'Shanter." Drunkenness and witches.
- **Romantic.** "A Red, Red Rose." Love of simple, direct kind.
- **Self-mocking.** Many Burns poems laugh at Burns.

**Roguelite lesson.** WHS's voice can carry all these modes. A single banter line can be tender. Another comic. Another political. The haggis's run contains Burns's whole register.

### 4.4 The bothy ballad

Northeast Scotland farm-work songs. Doric dialect. Characteristic tone: earthy, comic, sometimes bawdy, always rooted in labour.

**Roguelite lesson.** Work-songs as banter pool. Repetitive labour (survivor-like combat) as bothy-ballad-structure. WHS could write bothy-style banter for its rhythm.

### 4.5 The lament

Scotland is fluent in lament — *Flowers of the Forest*, *The Skye Boat Song*, pibroch ceòl mòr forms. Grief is normal.

**Roguelite lesson.** Scotland gives WHS permission to be *sad* in places most games avoid. The Grave tonal register is *not* off-brand for Scottish content.

### 4.6 The Gran-voice (hearth-voice)

Scottish elder-women telling stories to children. A specific mode:
- Warm but firm.
- Moral without preachy.
- Embarrassing-funny about the teller.
- Quick to comfort.
- Always has a cuppa ready.

**This is *the* Hearth-voice WHS has already established** — Gran's voice. Doubling down on this voice is doubling down on Scottish narrative tradition.

---

## Part 5 — How WHS Tells Its Story

Building on the vocabulary and tradition, here's how WHS can construct its own narrative.

### 5.1 The cast of voices

WHS has (or could have) a small cast of narrative voices:

1. **Gran** — the hearth voice. Elder; loves the haggis; knits in her croft; narrates death screens and moor moments. *Most important voice.* Patron figure.
2. **The haggis** — inner monologue. Simple, wee, determined. Occasional self-aware moments.
3. **The Moor** — implied voice. The land itself "remembers." Not spoken aloud but *felt* in ambient text.
4. **The Cailleach** — ancient voice. Gaelic fragments. Winter-wise. Appears sparingly.
5. **Burns** — citational voice. Quoted, paraphrased, echoed on seasonal events.
6. **The haggis hunter** — antagonist voice. Absurd-naturalist Haggis Wildlife Foundation register.
7. **Variant-specific voices** — each variant has a thread (Cailleach, Glaswegian, Doric, Hebridean, Witch's Hare, etc.)
8. **Wee beasties** — enemy chatter. Sheep bleats, midge chirps, ghillie-dhu whispers.

The *arrangement* of these voices is the game's narrative. Gran is the anchor; the Moor is the stage; the haggis is the hero; the Cailleach is the elder-adjacent authority; Burns is the poetry.

### 5.2 The narrative arc

WHS is a survivor-like. A single run is 25 minutes. The narrative arc per-run is:

- **Opening (0–2 min)** — Gran sees the haggis off. Warm, invitational.
- **Early moor (2–5 min)** — haggis finds its feet. Moor is quiet, expectant.
- **First boss (Gordon, ~5 min)** — absurd-comedy register. The haggis has made it this far.
- **Moor Road intermission** — calm, reflective. Gran's voice. Route pick.
- **Mid-run (5–15 min)** — build-up. Fae encounters, weather wraiths, urban ghaists arrive.
- **Mid bosses (Tour Bus ~10, Laird ~15, Hunter General ~20)** — escalating encounters.
- **Taxman approach (20–25 min)** — pibroch swell. Tension builds.
- **Taxman (25 min)** — climax. Wild or Grave register.
- **Outcome:**
  - **Victory** — huge Hearth moment with Gran; reserved music; trophy added to croft.
  - **Death** — Gran's warmth. Cause-of-death banter. Invitation to rerun.

Each run is a *ballad*.

### 5.3 The meta-arc (across many runs)

Across hundreds of runs, the player progressively:

- Unlocks new variants (each carries a new voice).
- Fills in the Almanac (each entry a small story).
- Earns trophies for Gran's croft (persistent narrative accumulation).
- Beats bosses for the first time (reserved dialogue).
- Discovers hidden routes and easter eggs (personal stories).
- Eventually earns a **true ending** (narrative completion).

The meta-arc should feel like *a friendship growing* with Gran and the moor. Like visiting an elder's croft year after year and hearing her stories expand.

### 5.4 The narrative thread: Lineage

One narrative thread that ties the loops together: **lineage**. Haggis are small and short-lived. Each haggis the player plays is a descendant of the one before. Over many runs:

- Deaths become *family losses* (acknowledged in Gran's banter).
- The croft fills with portraits of past haggises (meta-progression visual).
- Names are generated / chosen by the player.
- The Taxman's eventual defeat is *the family's* victory.

Lineage makes the loop *meaningful* — each death advances *a family's* story, not just this individual's.

*(Lineage is already noted in the superpowers specs as an in-flight direction.)*

### 5.5 The narrative register

WHS is a Scottish game. Its narrative register is:
- **Warm, not solemn.** Even sad moments have Gran's arm around your shoulder.
- **Specific, not generic.** A Burns quotation, not a generic-Celtic motif.
- **Comic-serious.** The haggis is absurd; its journey is real.
- **Modest.** No "chosen one" framing. The haggis is a wee beastie. Its courage matters *because* it's small.
- **Hopeful.** Failure framed as learning; death framed as passing-on.

---

## Part 6 — Narrative Building Blocks

Concrete narrative content WHS can ship.

### 6.1 Banter pools

Already the main vehicle. Roguelite research doc proposes 300–500 lines. Suggested breakdown:

- **Gran (croft)** — 40+ lines across: run start, run end (victory + defeat), first-time-events, seasonal.
- **Haggis inner monologue** — 50+ lines, ambient during quiet moor moments.
- **Enemy flavour** — 100+ lines (2–5 per enemy type).
- **Cailleach whispers** — 20+ lines, rare encounters.
- **Burns citational** — 20–30 poetic inflection lines (Burns Night event + lineage).
- **Moor moments** — 40+ lines, one-line gifts on rare events.
- **Death reflections** — 30+ lines per cause-of-death category.
- **Variant-specific pools** — 20+ lines per variant (already established).
- **Seasonal banter** — 10–20 lines per seasonal event.
- **First-time-event reserved lines** — 30+ lines (evolution pickup, first boss kill, first combo 100, etc.).

### 6.2 Item descriptions (Dark Souls-style)

Every weapon, passive, relic, evolution — 1-3 sentences of flavour with implied history. Target 80–120 item-descriptions total (existing items + planned new ones + evolutions).

### 6.3 Ambient text

Plaques, inscriptions, cairn-markers, ruin-signs. 20–40 such items scattered across biomes, each a micro-story. Player encounters them by walking near; reads if curious.

Examples:
- *A weathered cairn inscribed "Flora's Flight. 1746."*
- *A crofter's gate-post: "Here lived the MacNair, cleared 1818."*
- *A carved thistle on a standing stone: "Nemo me impune lacessit."*
- *A bothy wall: "Dougie was here — the winter of '52. Coldest on record. Still drinking."*

### 6.4 Almanac / Codex

Per Spelunky's Journal / Outer Wilds' Ship's Log. Tracks what the player has seen:
- **Beasties** — enemies encountered, flavour entry per creature.
- **Kenning** — "known things" — items, hazards, weather.
- **Ways** — routes walked, counts per route.
- **Banter** — lines heard, counts, rare lines teased.
- **Lineage** — past haggis (if lineage ships).

### 6.5 NPC encounters

One-off or rare NPCs who appear in specific conditions, carrying a story:
- **Bean-Nighe at the ford** — omen NPC.
- **Ghillie Dhu in the birches** — friendly forest fae.
- **A Wee Trader** — mid-run merchant.
- **The Broonie** — house-spirit (Gran's croft).
- **A Lost Tourist** — comic-relief.
- **The Brahan Seer** — prophecy-giver.
- **Earl Beardie** — card-wager devil.

Each NPC has a small banter pool (5–15 lines) and maybe a mini-quest.

### 6.6 Seasonal events as narrative beats

Per the existing seasonal-events section in DESIGN_IDEAS. Each seasonal event is a *narrative episode*:
- Burns Night — the haggis takes the cultural spotlight for a week.
- Hogmanay — first-footing, new-year-warmth.
- Beltane — fire-festival, seasonal shift.
- Samhain — ghosts and veils.
- Up Helly Aa — Viking fires.
- Culloden anniversary — sombre, respectful.

Seasonal events give the game *calendar-time*, which is a narrative form all its own.

### 6.7 Variant haggis as narrative lens

Each variant re-tells the moor through a different perspective:
- Glasgow Haggis: urban Limmy-edge.
- Cailleach: ancient, Gaelic-tinged.
- Burns's Wee Beastie: poetic, citational.
- Witch's Hare: gleeful, dark-witchcraft.
- Hebridean: lyrical, Gaelic-warm.
- Doric Quinie: Northeast-stoic.

Ten variants × 25 minutes each = ten different short stories. The *roster* is the narrative anthology.

### 6.8 Moor Road as arc structure

Moor Road acts as the narrative backbone per run. Each act intermission is a breath — a story beat.

Deeper: *which routes you've picked in past runs* could be Gran-commented. "Aye, ye took the loch path again? Well, that's you." Shapes your haggis's *identity* through choices.

---

## Part 7 — The Ending Problem Revisited

Per roguelite doc §6.10. Roguelites struggle with endings because they're built to loop. But great ones solve it:

**Hades.** First "ending" (escaping) is a narrative beginning. True ending comes after dozens more runs. Players keep playing *because the story keeps going*.

**Slay the Spire.** Act 3 is the "ending." Act 4 (the Heart) is a second "true ending" gated behind effort.

**Vampire Survivors.** No explicit narrative ending. Time-based runs + meta forever.

### 7.1 WHS's ending architecture (proposed)

**First ending (Taxman defeated).** A Hearth-voice victory. Gran's speech. Credits for the run. Trophy added to croft. Player can stop here and feel complete.

**True ending.** Gated on:
- All variants unlocked.
- All routes picked.
- All bosses defeated.
- All seasonal events experienced (across calendar year).
- Cailleach's Bargain taken at least once.
- Burns Night completed.

**Reward:** a quiet, reserved scene. Maybe Gran, Cailleach, and the haggis in conversation at Beltane. A single ballad fragment. A thistle blooming on a standing stone. The moor *remembering* the haggis forever.

This ending is *never forced*. It's *discovered*. It's a love-letter to players who've journeyed the full year.

### 7.2 Post-ending play

After the true ending, the game keeps playing. The Moor keeps existing. Gran keeps commenting. The haggis keeps running. Nothing is locked.

This matters. Closure + continuation is Scottish — endings that aren't endings.

---

## Part 8 — WHS Narrative Application Map

Opportunities grouped by narrative channel.

### 8.1 Banter deepening

| Opportunity | Ref | Priority |
|---|---|---|
| Gran voice pool — 40+ lines | §6.1 | ★★★★ |
| Haggis inner monologue — 50+ lines | §6.1 | ★★★ |
| Enemy flavour — 100+ lines | §6.1 | ★★★ |
| Cailleach whispers — 20+ lines | §6.1 | ★★ |
| Burns citational — 20–30 lines | §6.1 | ★★★ |
| First-time reserved lines — 30+ | §6.1 | ★★★★ |
| Seasonal banter per event | §6.6 | ★★★ |
| Variant-specific pools | §6.7 | ★★★ (per variant) |

### 8.2 Item-description Dark-Souls-ification

| Item type | Estimated count | Target |
|---|---|---|
| Weapons (base) | 8 | 3-sentence lore each |
| Weapon evolutions | 7 | Reserved lore (darker, mythic) |
| Weapon unions (new) | 5 | Legendary tone |
| Passives | 9 | 1-2 sentences |
| Relics (new) | 15–20 | 2-3 sentences (deepest lore) |

### 8.3 Ambient text / environmental storytelling

- 20–40 cairn / plaque / ruin-sign inscriptions.
- Placed in biomes; player discovers via proximity.
- One writer's voice (consistent).

### 8.4 Almanac / Codex

- Beasties book (all enemies).
- Ways book (route log).
- Finds book (items collected).
- Banter book (lines heard; rare teased).
- Lineage book (if lineage ships — family tree).

### 8.5 NPC encounters

- 7–10 non-combat NPCs per §6.5.
- Each with 5–15 line pool.
- Each with one unique mechanic (the Ghillie Dhu's boon, the Broonie's cream, etc.)

### 8.6 Seasonal event narrative

- Each event a mini-episode.
- Reserved banter per event.
- Reserved visual overlay.
- Reserved unlockable (variant, tartan, relic).

### 8.7 Ending architecture

- First ending: Taxman kill → Hearth celebration.
- True ending: full-year journey → reserved moment with Gran, Cailleach, moor.
- Post-ending: continued play with "completion" status.

### 8.8 Cross-cut: The Gran-voice priority

Gran is the narrative anchor. If we prioritise any single thing: **Gran's voice pool**. She carries:
- Run-start warmth.
- Run-end comfort (both victory and death).
- Moor moment commentary.
- First-time event acknowledgment.
- Seasonal event narration.
- Lineage consolation.
- True-ending speech.

Gran could easily absorb 80–100 lines of banter alone and each would earn its place.

### 8.9 Writing process recommendations

- **One writer's voice.** Whoever writes Gran's pool should write all of it (maintaining voice).
- **Scottish writer consulted.** Per CULTURAL_SENSITIVITIES doc.
- **Collaborate with Scots-speaking reviewer.**
- **First-time lines tagged clearly** in banter system.
- **Versioned pools.** As new lines are added, pools version (allows analytics to track what lines are rarest).

---

## Sources & Further Reading

**Narrative-design case studies:**
- [Hades: a case study in storytelling for roguelike games — Davide Aversa](https://www.davideaversa.it/blog/hades-case-study-storytelling-roguelike-games/)
- [Roguelikes and narrative design with Greg Kasavin — Game Developer](https://www.gamedeveloper.com/design/roguelikes-and-narrative-design-with-i-hades-i-creative-director-greg-kasavin)
- [How Hades Redefines Roguelike Storytelling — ScreenRant](https://screenrant.com/hades-roguelike-supergiant-storytelling-accessible/)
- [Meta is Etymologically Greek, Right? Meta-Progression in Hades — DMS 462](https://dms462fall2020.wordpress.com/2020/12/06/meta-is-etymologically-greek-right-meta-progression-in-hades/)
- [Hollow Knight & Environmental Storytelling — LIBR251 blog](http://libr251storytellingandgaming.blogspot.com/2018/04/hollow-knight-environmental-storytelling.html)
- [Hollow Knight, Memory, and Minimalist Storytelling — Long River Review](https://longriverreview.com/blog/2024/hollow-knight-memory-and-minimalist-storytelling/)
- [The Subtle Storytelling Genius of Hollow Knight and Silksong — Flagship Eclipse](https://www.theflagshipeclipse.com/2025/09/16/the-subtle-storytelling-genius-of-hollow-knight-and-silksong/)
- [The Art of Flavour Text — PC Gamer](https://www.pcgamer.com/the-art-of-flavour-text/)
- [Narrative Design in Dark Souls — Game Developer](https://www.gamedeveloper.com/design/narrative-design-in-dark-souls)
- [How Dark Souls Mastered A New Type Of Storytelling — GameRant](https://gamerant.com/dark-souls-storytelling-new-unique-good/)
- [Improve Your Storytelling with Dark Souls — Nerdolopedia](https://www.nerdolopedia.com/articles/2018/3/29/improve-your-storytelling-by-learning-from-dark-souls)
- [Supergiant's Hades Contains More Words Than The Iliad and Odyssey Combined — Cultured Vultures](https://culturedvultures.com/supergiant-hades-word-count-dialogue/)
- [Breathing Life into Greek Myth: The Dialogue of 'Hades' — GDC Vault](https://www.gdcvault.com/play/1026975/Breathing-Life-into-Greek-Myth)

**Scottish narrative traditions:**
- Francis James Child, *English and Scottish Popular Ballads* (1882–98) — foundational.
- Hamish Henderson field recordings — School of Scottish Studies archive.
- The Bothy Ballad tradition — Aberdeenshire vernacular.
- Pibroch form — `SCOTTISH_RESEARCH_DEEP.md` §17.2.
- Scottish Traveller storytelling — Belle Stewart, Jeannie Robertson, Sheila Stewart.

**Books on narrative design:**
- Greg Costikyan, *Uncertainty in Games*.
- Chris Bateman, *Game Writing: Narrative Skills for Videogames*.
- Rhianna Pratchett & friends, *Game Writing Practice* (industry).
- Lee Sheldon, *Character Development and Storytelling for Games*.
- Aaron A. Reed, *50 Years of Text Games* (2022) — foundational survey of interactive narrative.
- Hal Barwood, *From Puppet Master to Dungeon Master* — old but insightful.

**GDC talks (find via YouTube):**
- Greg Kasavin, "Writing for *Hades*" (GDC 2021).
- Jennifer Hepler, various narrative-design talks.
- Kate Compton, various procedural narrative talks.

**WHS-internal cross-references:**
- `docs/DESIGN_SOUL.md` — north star.
- `docs/VOICE_CARD.md` — voice registers and anti-patterns.
- `docs/research/ROGUELITE_RESEARCH.md` — structural canon (narrative patterns).
- `docs/research/GAME_FEEL_RESEARCH.md` — moment-level craft (narrative moments).
- `docs/research/SCOTTISH_RESEARCH.md` + `SCOTTISH_RESEARCH_DEEP.md` — content sources.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — ethical filter for narrative content.

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). 8 parts, ~11,000 words. Covers storytelling paradox in roguelites; narrative vocabulary (cutscenes, environmental storytelling, item-flavour, dialogue, diegetic UI, atmosphere, meta-narrative, emergent); seven case studies (Hades, Hollow Knight, Dark Souls, Isaac, Spelunky, Inscryption, Outer Wilds); Scottish narrative traditions (ballad, seanchaidh, Burns, bothy ballad, lament, Gran-voice); WHS cast of voices + narrative arc + meta-arc + lineage thread; narrative building blocks (banter pools, item descriptions, ambient text, Almanac, NPCs, seasonal events, variant perspectives); ending architecture (first + true + post); WHS application map with 8 opportunity groups. Seventh doc in the WHS research series.
