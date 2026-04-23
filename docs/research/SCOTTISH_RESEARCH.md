# Scottish Research — Folklore, Land, History, Culture

> **Purpose.** A handcrafted gazetteer of Scottish material — real and mythic — for mining into Wild Haggis Survivors content. This doc is the *raw seam* the game's Soul charter will draw from. Read it cover-to-cover once for atmosphere; return to individual entries when designing enemies, bosses, biomes, weapons, passives, relics, banter threads, or variants.
>
> **How to use this.**
> 1. Each entry includes a short description, a flavour/atmosphere note, and where useful a **WHS note** — either "already in use, deepen this way" or "net-new content idea".
> 2. The final section (*Part 5 — WHS Content Mining*) crosses every finding into concrete content opportunities grouped by system.
> 3. Cite this doc from future specs/plans in `docs/superpowers/`.
>
> **Scope.** Four parts (folklore, geography, history, culture) as a gazetteer, then a consolidated content-mining map. Emphasis on *famous or well-known* material per Michael's direction — no obscure for its own sake, but lesser-known items appear where they have strong narrative hooks or distinctive feel.
>
> **Calibration against WHS's current content.** The codebase leans *Highlands + urban Glesga + water cryptids + faerie courts*. It is thin on *Burns / literature, Jacobite history, Lowlands/Borders, Celtic Christianity, Clyde industrial heritage, festivals, Gaelic depth*. Those gaps get deeper sections here because they're the richest seam for future content.
>
> **Tone & care.** Scotland is a real living culture, not costume fodder. This research is written with affection and accuracy; when we mine it, we do so with the same handcrafted care the Soul charter demands. Mocking or reducing living communities is out of bounds (Buckfast wine jokes and urban ghaists are already in-tone because they're *from the inside* — Scottish self-humour is sharp but loving; we stay on that side of the line).
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — foundation for forthcoming content design.

---

## Table of Contents

1. [Methodology & WHS Status Tags](#methodology--whs-status-tags)
2. [Part 1 — Folklore & Mythology](#part-1--folklore--mythology)
3. [Part 2 — Geography & Places](#part-2--geography--places)
4. [Part 3 — History & Famous Figures](#part-3--history--famous-figures)
5. [Part 4 — Culture, Food, Music, Language](#part-4--culture-food-music-language)
6. [Part 5 — WHS Content Mining](#part-5--whs-content-mining)
7. [Sources & Further Reading](#sources--further-reading)

---

## Methodology & WHS Status Tags

Entries carry one of four tags where applicable:

- **[WHS: SHIPPED]** — already in the game. The note suggests how to deepen the existing implementation.
- **[WHS: DEFERRED]** — present in design docs but not yet built. The note suggests direction when activating.
- **[WHS: NEW]** — net-new material, not present in code or docs.
- **[WHS: —]** — background material for flavour/atmosphere, not directly mineable.

Where an entry has no WHS note, assume it's background atmosphere that could inform tone, art direction, music, or banter without a concrete feature.

---

## Part 1 — Folklore & Mythology

Scottish folklore is one of the richest in Europe, stitched together from Gaelic, Pictish, Norse, Lowland, and Christian strands. The supernatural in Scotland is *local* — every loch, stone, and glen has a story — and it is *ambivalent*: rarely pure-evil, rarely pure-good, usually dangerous to the careless. This tone is WHS's native register.

### 1.1 Water Spirits & Sea Beasties

Water is where Scottish folklore lives. Every loch, river, and coastal shore has its resident.

- **Kelpie** — The famous water-horse of lochs and rivers. Appears as a beautiful black horse that entices riders; anyone who mounts it is carried into the water and drowned. Some versions: hooves point backwards; hide is sticky once touched. **[WHS: SHIPPED]** as a skirmisher-flank enemy. *Deepen:* the sticky-hide myth could justify a "cannot dash off a kelpie" tether mechanic; a full kelpie boss could ride with a Headless Rider passenger (see below).

- **Each-uisge** (pron. *ech-ooshkeh*) — The kelpie's sea-loch cousin, considered far more dangerous. Can shapeshift between horse, pony, and handsome man. Lures victims who touch it into deep water and devours them, leaving only the liver. **[WHS: DEFERRED]** (named in codebase). *Direction:* an Each-uisge "boss phase" where the beast shapeshifts mid-fight could be a Loch-biome finale.

- **Nuckelavee** — Orcadian horror. A skinless man-horse hybrid with black blood visible through muscle, a giant mouth, and one central eye. Breath causes droughts, plagues, and crop-blight. Cannot cross fresh water (hence only a coastal/sea threat). Feared above all other Orcadian beasties. **[WHS: DEFERRED]**. *Direction:* a W3/W4 boss with *the breath* as a biome-wide debuff aura. Fresh-water aversion is a perfect "exploit the weakness" mechanic — step into a healing circle, he retreats.

- **Blue Men of the Minch** — Storm-raising sea-spirits said to inhabit the strait between the Isle of Lewis and mainland Scotland. They hail passing ships and test the captain's wit by speaking two lines of verse; the captain must answer with two lines of his own to pass safely. **[WHS: SHIPPED]** as a ranged enemy. *Deepen:* the *verse-trade* myth is a golden banter hook — the Blue Man could call out a Scots couplet when spawning and the haggis could "answer" with a line of its own if the player has high luck. A kenning-reward mechanic was noted as deferred in the design docs.

- **Selkie** — Seal-folk who shed their skins to become beautiful humans on shore. If a mortal steals and hides a selkie's skin, the selkie is compelled to stay as their spouse until the skin is found. Tragic — the selkie always returns to the sea. **[WHS: DEFERRED]** (variant candidate noted). *Direction:* a selkie **enemy** that drops a *sealskin pickup* — carry it to a healing circle to "return it" for bonus; drop it in combat and a *Selkie Bride Returns* vengeance wave spawns.

- **Ceasg** — The maighdean-mhara (sea-maiden) of Highland folklore. Upper body of a beautiful woman, lower body of a salmon. Grants three wishes to anyone who captures her, but only reluctantly. **[WHS: NEW]**. *Direction:* a rare "wishing ceasg" chest-spawner; carries a mini-event where three run-altering wishes appear.

- **Shellycoat** — A river-imp covered in rattling shells from its underwater lair. Mostly a trickster: misdirects travellers, laughs when they fall in. Thought to be benign but irritating. **[WHS: NEW]**. *Direction:* a *harassment* enemy that doesn't attack directly but *steals XP gems* and drops them further from the player. A different kind of pressure.

- **Marool** — Shetland sea-creature like a phosphorescent anglerfish with eyes all over its head and a flame-crest. Glows in mareel (sea foam). **[WHS: NEW]**. *Direction:* a luminous night-biome hazard or mini-boss; its *eyes* could project sight cones that reveal player position across the biome.

- **Cirein-cròin** — A sea-serpent so immense it could swallow seven whales at once. Mentioned in Gaelic folklore as the largest creature. **[WHS: NEW]**. *Direction:* a scale-shift boss that the haggis fights *on* (think Shadow of the Colossus) — climb the serpent, break weak points.

- **Stoor Worm** — Orcadian dragon-equivalent. A giant sea-serpent whose death (per legend) formed the Faroe Islands, Iceland, and other landmasses. Killed by the hero Assipattle. **[WHS: NEW]**. *Direction:* a secret final-final-boss for a hidden route.

- **Loch Ness Monster (Nessie)** — The modern-era cryptid, famous worldwide, first notable "sighting" in 565 AD by St Columba, revived in 1933. **[WHS: SHIPPED]** as *Nessie Tentacle* weapon and *Nessie Unleashed* evolution. *Deepen:* a full Nessie boss (distinct from the tentacle) could appear in an optional Loch biome extension — a kaiju-scale silhouette looming on the horizon.

- **Frittening / The Boneless** — Shetland sea-horror. A pale shapeless blob that throws itself against windows at night, steals children, and drives observers mad. **[WHS: NEW]**. *Direction:* a terrifying *silhouette* hazard — an enemy that can't be killed, only escaped; forces the haggis to flee a corner of the map while it's present.

- **Merfolk (Maighdean-mhara & Dine na Mara)** — Scottish merpeople. Less Disney, more dangerous — often drown sailors or grant wishes with fatal strings. **[WHS: NEW]**.

- **Fuath** — A collective term for Highland water-spirits (plural); includes kelpies, each-uisge, shellycoats, and various nameless dark waters. A good umbrella tag for a *family* of enemies. **[WHS: NEW — useful taxonomy].**

### 1.2 Fae, Land Spirits, & Hill Folk

- **The Sidhe (pron. *shee*)** — The fae in general, often split into two courts.

- **Seelie Court** — The "blessed" faeries, typically benevolent-but-temperamental. Will reward kindness, punish rudeness. Trooping fae, ride in processions. **[WHS: SHIPPED]** as *seelie_piper*. *Deepen:* a full Seelie Court **procession** event — a mid-run parade that buffs the player if left alone, punishes interference.

- **Unseelie Court** — The "unblessed" fae, actively malevolent. Redcaps, baobhan-sith, bodachs. Prey on travellers, kidnap, torture. **[WHS: SHIPPED]** as *unseelie_fiddler*, *redcap*. *Deepen:* a full Unseelie Court **hunt** — analogous to the Wild Hunt — as a late-game event.

- **Redcap** — A short, evil goblin said to haunt the ruined castles of the Anglo-Scottish border. Its cap is dyed red with the blood of its victims; if the blood dries, the redcap dies, so it must kill frequently. **[WHS: SHIPPED]** as dive enemy. *Deepen:* *dripping-cap* visual degradation — the longer the redcap has been on the map without a kill, the paler its cap becomes, and at a threshold it frenzies or dissolves.

- **Ghillie Dhu** — A solitary, gentle forest fae clad in moss and leaves, guardian of birch trees, particularly associated with Gairloch. Kind to lost children, protective of trees. **[WHS: NEW]**. *Direction:* a **friendly** encounter — if the haggis stands still in a patch of birches for 30 seconds, the Ghillie Dhu appears and grants a forest boon. First genuinely-friendly NPC in the moor.

- **Bean-Nighe (pron. *ben-nee-yeh*)** — "The Washer at the Ford." A ghostly woman washing bloodied clothes at a river ford. Her presence portends death — the clothes she washes belong to someone about to die. **[WHS: NEW]**. *Direction:* an **omen** NPC — she appears at a ford in the loch biome, washing a haggis-sized plaid. Her presence *warns* the player a tougher wave is coming.

- **Baobhan Sith (pron. *baav-an shee*)** — A vampiric woman-fae who seduces male travellers, dances with them until they collapse, then drinks their blood. Often described in green dresses, unable to cross iron. **[WHS: NEW]**. *Direction:* a *dancer* elite that forces the haggis to orbit with her (inverts normal movement) for a few seconds before striking.

- **Brownie (Brùnaidh)** — A small, hairy, helpful house-spirit who cleans and maintains a home overnight in exchange for a bowl of cream. *Never* offer one clothes — they take offence and leave forever. **[WHS: NEW]**. *Direction:* a **hub-companion NPC** for Gran's Croft. Increases meta-currency gain passively; gets offended and abandons you if you "waste" gold on specific purchases (a comedy note).

- **Bauchan** — A type of hobgoblin-brownie. Mischievous but often helpful. **[WHS: NEW]**.

- **Bodach** — A Highland sprite-bogeyman used to frighten children. Comes down chimneys to take naughty kids. The *Bodach Glas* (Grey Man) is a specific death omen for one clan. **[WHS: NEW]**. *Direction:* a climbing / chimney-drop enemy for an Edinburgh Old Town biome.

- **Bodach Glas (The Grey Man of Ben Macdui)** — A giant silhouetted figure said to stalk climbers on Ben Macdui in the Cairngorms. Multiple credible mountaineer sightings of a huge, grey, crunching presence. **[WHS: NEW]**. *Direction:* a **silhouette-only** presence enemy in a Cairngorm Plateau biome — he's never visible clearly, only as a giant far-silhouette, and his presence slows the player. A rare boss variant could finally reveal him at the summit.

- **The Pech (Pechts)** — Gnome-like dwarf-folk said to have built Scotland's megaliths and stone circles. Brewed a secret heather ale. Short, immensely strong, shy of daylight. **[WHS: NEW]**. *Direction:* tie them to **Standing Stone** mechanics — circle a stone, encounter a Pech with a Heather Ale offer.

- **Fachan (Direach)** — A horrifying one-of-everything creature: one eye, one arm coming from its chest, one leg, one ear, etc. Violent, territorial. **[WHS: NEW]**. *Direction:* an *exotic* elite with forced-asymmetry movement patterns (always rotates clockwise, always strikes from one side).

- **Cu Sith** — A massive fairy hound the size of a young bull, shaggy dark-green fur. Roams moors and hills. Its bay is a death omen; hearing three bays means doom. **[WHS: NEW]**. *Direction:* a **triple-bay** warning enemy — each howl permanently buffs it until third howl triggers a deadly charge. Players are pressured to kill it *fast*.

- **Cat Sith** — A large fairy cat, black with a white spot on its chest. Said to be a transformed witch. On Samhain (Halloween), households leave a saucer of milk outside to avoid its curse. **[WHS: NEW]**. *Direction:* a seasonal/Samhain mini-event enemy; if the player leaves a healing circle untouched, the Cat Sith drinks and grants luck.

- **Beithir (pron. *bay-her*)** — A venomous dragon-serpent without wings or fire-breath but with a fatal sting. If stung, you must race the Beithir to the nearest body of water to be cured; if you lose the race, you die. **[WHS: NEW]**. *Direction:* a brutal mechanic — on sting, a *race timer* appears; reach a healing circle before it expires or take massive damage.

- **Boobrie** — A gigantic water-bird that raids lochs for livestock. Capable of transforming into a horse. **[WHS: NEW]**. *Direction:* a flying Loch-biome harasser.

### 1.3 The Cailleach & Hags

- **The Cailleach (pron. *kal-yach* or *kyle-yach*)** — "The Hag" / "The Veiled One". Ancient divine crone-figure of pre-Celtic Scotland. Shaper of mountains (she strides and stones fall from her apron forming peaks), mother of winter, keeper of wild beasts, guardian of cattle and wolves. Some versions: she transforms into a young beautiful woman at Beltane (May 1) and reverts at Samhain (Oct 31) — the literal personification of Scotland's seasonal cycle. Often specifically named *Cailleach Bheur* (the Winter Queen) or *Beira*. Her washing pot is the Corryvreckan whirlpool. **[WHS: SHIPPED]** as a playable variant + referenced in design specs + named in enemies. *Deepen:* her seasonal-aspect (young-old transformation) could be the key to an entire "seasonal content" system — the game's *current weather* / *time of year* affecting biomes, music, and banter.

- **The Glaistig** — A female spirit, half-woman half-goat. Some versions guardian of cattle (helpful); others a malevolent seducer of men who drains their blood. Wears a long green dress that hides her goat legs. **[WHS: NEW]**. *Direction:* a *cattle-keeper* friendly NPC variant OR a blood-seducer elite.

- **Black Annis / Gentle Annie** — A regional hag figure (mostly English, but Scottish Borders have versions). Blue-skinned, iron claws, lives in a cave, eats children. **[WHS: —]** (tonally dark; use sparingly).

- **Nicnevin / Gyre-Carling** — Queen of the Scottish witches, associated with the Unseelie court and the Wild Hunt of Scottish lore. Rides a white horse, leads unquiet spirits. Appears particularly in Fife folklore. **[WHS: NEW]**. *Direction:* Unseelie Court final-boss candidate.

### 1.4 Ghosts, Wraiths, & Omens

- **The Green Lady** — A generic ghost-type haunting multiple Scottish castles (Stirling, Fyvie, Crathes). Usually a tragic figure — wronged wife, jilted bride, servant-heroine. **[WHS: NEW]**. *Direction:* a *crying ghost* mini-boss at ruined-castle points in a biome.

- **Headless Horseman of Dunblane** — Local Scottish version of the headless-rider motif. **[WHS: NEW]**.

- **The Lone Piper** — A boy-piper sent into a secret tunnel under Edinburgh Castle to sound his pipes so the tunnel could be tracked. He entered, played, and the music stopped halfway through — he was never found. Locals claim to hear the muffled pipes still. **[WHS: NEW]**. *Direction:* an ambient audio easter egg in an Edinburgh biome — faint bagpipe music playing from seemingly underground; following it to a specific spot triggers a hidden chest or shrine.

- **Earl Beardie** — A 15th-century Earl of Crawford who, per Glamis Castle legend, played cards with the Devil on a Sunday and lost his soul. His ghost plays cards eternally in a sealed room. **[WHS: NEW]**. *Direction:* a card-game-themed event — the devil offers a "wager" (random card to replace a current upgrade); lose and your upgrade is replaced by something *worse*; win and it upgrades.

- **Monster of Glamis** — A deformed family secret at Glamis Castle said to have been locked in a hidden room for life. Its existence is a family-only secret. **[WHS: —]** (too dark, tonal mismatch).

- **Fetch / Doppelganger** — A ghostly double of a living person seen just before their death. **[WHS: NEW]**. *Direction:* a rare mirror-haggis enemy — it has your current weapons and stats.

- **Wraith** — General Scottish term for a premonitory ghost. **[WHS: SHIPPED]** as wraith-type enemies already populate late-game (tome_wraith, haar_wraith, ledger_wraith, gale_wraith).

- **The Wild Hunt** — A procession of undead riders that sweeps through the moors on winter nights. Crossing its path means being carried off. **[WHS: NEW]**. *Direction:* a **screen-crossing event** — for 10 seconds, a ghostly procession crosses; contact is instant-damage but ignoring it grants huge XP.

- **Spunkies / Will-o'-the-Wisp** — Ghostly lights (feu follet) that lead travellers astray in bogs. **[WHS: NEW]**. *Direction:* decoy floating lights in the bog biome; some are XP gems (real), others are lures that lead to ambushes.

### 1.5 Witches & Dark Magic

- **North Berwick Witch Trials (1590)** — Real historical witch-hunt. King James VI personally interrogated "witches" accused of attempting to sink his ship with a storm. ~100 executed. Culminated in King James writing *Daemonologie*, later influencing Shakespeare's Macbeth. **[WHS: NEW]**.

- **Isobel Gowdie (1662)** — A young Auldearn woman who spontaneously confessed to an astonishingly vivid and specific witch-covenant, including flying on beanstalks, shape-shifting into hares, and attending a Black Mass. Her confession was *not* tortured out of her — she seemed delighted to tell it. A folkloric goldmine. **[WHS: NEW]**. *Direction:* a witch-variant haggis whose abilities include shape-shifting into a hare (dash-doubled invincibility) and flying (brief aerial traversal).

- **Major Weir** — Edinburgh city saint turned self-confessed warlock in 1670. His magic staff was said to carry on moving after he died. **[WHS: NEW]**.

- **Witch's Stane & Forfar Witch Pool** — Real geographic locations where witches were executed. **[WHS: —]** (context background).

### 1.6 Heroes, Giants, & Legendary Figures

- **Fingal / Fionn mac Cumhaill** — Legendary Gaelic hero (shared with Irish folklore). Fingal's Cave on Staffa, Fingal's Giant's Causeway. A giant and wise hero who commands the Fianna warrior band. **[WHS: NEW]**. *Direction:* a legendary *relic* — *Fingal's Horn*, summons temporary Fianna allies.

- **Ossian** — Fingal's son, legendary bard. The "Ossianic poems" were a 1760s literary forgery by James Macpherson but they cemented a Romantic-era image of the Highlands. **[WHS: —]** (background for Romantic tone).

- **Deirdre of the Sorrows** — Tragic Gaelic heroine, linked to Glen Etive. A doomed beauty who flees her king with her lover, then dies of grief. **[WHS: NEW]**. *Direction:* Glen Etive biome has a Deirdre-themed ghost.

- **Thomas the Rhymer (Thomas of Erceldoune, 13th c.)** — Borders figure kidnapped by the Queen of Elfland for seven years, returned with prophetic powers and the inability to lie. **[WHS: NEW]**. *Direction:* a borderlands NPC who appears at a hidden route, predicts (truthfully) the next biome's boss, giving prep time.

- **Tam Lin** — Ballad-hero stolen by the faeries. His lover Janet rescues him on Halloween by holding tight through his shape-shifting transformations. **[WHS: NEW]**. *Direction:* a *holding* mechanic — to rescue a captured ally (and gain a buff), the haggis must remain in a specific circle while waves of enemies assail.

- **Whuppity Stoorie** — A Rumpelstiltskin-style Scottish folktale; a woman guesses a faerie's name ("Whuppity Stoorie!") to break a curse. **[WHS: NEW]**. *Direction:* a *name-the-faerie* puzzle mechanic — a faerie steals a passive from you; to recover it, you must survive a timed wave while clues to its name appear in banter.

- **Mother Meldrum / Black Agnes** — A variety of strong-women characters. Black Agnes of Dunbar famously mocked an English siege from her walls. **[WHS: —]**.

- **The Brahan Seer (Coinneach Odhar)** — 17th-century Highland seer known for specific and eerie prophecies, many of which have been claimed to come true. Executed by being rolled in a tar-barrel. **[WHS: NEW]**. *Direction:* a **prophecy mechanic** — a seer-NPC offers "I foresee you will X" quests for a run; completing them grants large rewards.

### 1.7 Symbolic Creatures

- **The Unicorn** — Scotland's national animal. Medieval heraldry: the unicorn represents purity, power, and untamed spirit; a wild beast chained by a golden chain signifies kingly dominion. Appears on the Royal coat of arms. **[WHS: NEW]**. *Direction:* a rare *white* elite (pure, beautiful) as a challenge — killing it grants a huge but one-use buff; sparing it grants a permanent lore unlock.

- **The Lion Rampant** — Royal Banner of Scotland. A red lion on a gold field. Symbol of Scottish monarchy. **[WHS: —]** (symbolic background).

- **The Thistle** — National flower. Legend: a Viking raider stepped barefoot on a thistle while sneaking into a Scottish camp, his cry of pain woke the defenders, saving the Scots. Hence "Nemo me impune lacessit" (No one provokes me with impunity) — Scotland's motto. **[WHS: SHIPPED]** as *Thistle Shot* weapon. *Deepen:* the "Viking-foot" origin story could be a banter thread, or an event where a Viking enemy is killed by thistle patches.

- **Heather** — Not symbolic in heraldry but culturally iconic. White heather is lucky; purple is ubiquitous. **[WHS: SHIPPED]** as *Lucky Heather* passive.

- **The Saltire (St Andrew's Cross)** — The Scottish flag. Legend: at the Battle of Athelstaneford (9th century), a cross of clouds appeared in the sky, inspiring a victorious charge against the Angles. **[WHS: —]**.

### 1.8 Myth-Sites

- **The Corryvreckan Whirlpool** — A real whirlpool off Jura, one of the world's largest. Folklore: the Cailleach's washing pot — she washes her great plaid here and it emerges pure white (becomes winter snow). Third-largest whirlpool in the world. **[WHS: NEW]**. *Direction:* a hazard zone in a coastal biome — a spinning ring that pulls the haggis if too close.

- **The Old Man of Storr** (Isle of Skye) — A 160-ft pinnacle of rock. Folklore: the petrified thumb of a giant. **[WHS: —]** (landmark background).

- **The Fairy Pools (Skye)** — Crystal-clear pools and waterfalls in Glen Brittle. Said to be frequented by faeries. **[WHS: DEFERRED]** (biome candidate noted). *Direction:* aquamarine biome with buff-granting and debuff-granting pools.

- **The Clava Cairns (Inverness-shire)** — Bronze Age burial cairns aligned with the winter solstice. Made famous again by *Outlander* as the "stones". **[WHS: NEW]**.

- **Callanish Standing Stones (Lewis)** — A cruciform arrangement of Neolithic stones, older than Stonehenge. Legend: giants who refused to convert to Christianity, turned to stone. **[WHS: DEFERRED]** (Twin Stones of Callanish referenced). *Direction:* a standing-stone circle event — circling it invokes a buff, but also wakes the sleeping giant.

- **Arthur's Seat (Edinburgh)** — Extinct volcano in central Edinburgh. Legends linking it to King Arthur (unclear historical basis). **[WHS: —]**.

- **The Eildon Hills (Borders)** — Three peaks. Associated with Thomas the Rhymer and King Arthur's sleeping knights.

---

## Part 2 — Geography & Places

Scotland's geography is the game's texture. Every loch has a different character, every glen a different sky. This section is a gazetteer of famous places — the ones that carry enough recognisability to become biome names, route names, and hazard inspirations.

### 2.1 Lochs (Freshwater Lakes)

Scotland has over 30,000 lochs. The famous ones are distinctive.

- **Loch Ness** — 23 miles long, very deep (>700 ft), peat-dark water. Home of Nessie. Flanked by Urquhart Castle. The peat makes it extraordinarily dark — visibility underwater is very low. **[WHS: SHIPPED]** (loch biome, Nessie). *Deepen:* the peat-darkness as a visibility debuff in a Loch Ness biome variant.

- **Loch Lomond** — Largest surface area; on the Highland Boundary Fault so its character shifts from lowland to highland along its length. "The Bonnie Banks." **[WHS: NEW]**.

- **Loch Katrine** — Source of Glasgow's water supply. Heart of the Trossachs. Sir Walter Scott's *Lady of the Lake* is set here. **[WHS: NEW]**.

- **Loch Awe** — Long sinuous loch in Argyll. Has Kilchurn Castle ruin. Folklore: a monster called *Beathach Mòr Loch Odha* lives in the depths. **[WHS: NEW]**.

- **Loch Shiel** — A glacial finger-lake. Features in *Harry Potter* as "the Black Lake." **[WHS: NEW]**.

- **Loch Morar** — Deepest loch in Britain (over 1,000 ft). Has its own monster-legend (Morag). **[WHS: NEW]**.

- **Loch Linnhe** — A sea-loch running past Fort William. **[WHS: NEW]**.

- **Loch Tay** — Crannogs (ancient lake-dwellings) reconstructed here. **[WHS: NEW]**.

- **Loch Etive** — Connects to the sea; associated with Deirdre of the Sorrows. **[WHS: NEW]**.

- **Loch Assynt** — Rugged, with Ardvreck Castle ruin. **[WHS: NEW]**.

- **Loch Coruisk (Skye)** — Remote, dramatic, inside the Cuillin mountains. **[WHS: NEW]**.

**Collective atmosphere notes:** lochs are *still*, often *peat-dark*, frequently *mirror-flat*, with occasional *loch-mist* hovering over the surface at dawn. Reeds, heron, otter, fish-rise ripples. The *silence* is the biome's signature.

### 2.2 Mountains, Plateaus & Glens

- **Ben Nevis** (1,345m) — Highest mountain in the British Isles. Permanent snow-patches, sudden weather changes, a cliff face (The Ben's north face) that's a world-class climb. **[WHS: DEFERRED]** (biome candidate). *Direction:* summit-biome with wind-push hazards and snow-patch slow-tiles.

- **The Cairngorms** (plateau) — Arctic-climate high plateau. Vast, barren, bleak. Ptarmigan and snow hare live here. The Bodach Glas (see §1.2) haunts Ben Macdui. **[WHS: DEFERRED]** (biome candidate). *Direction:* plateau biome with whiteout visibility, silhouette-only Bodach.

- **Ben Macdui** — Second-highest, infamous for the Grey Man legend.

- **Schiehallion** — "The Fairy Hill of the Caledonians" — conical, named as a fairy place. Used by Charles Mason (of Mason-Dixon fame) and Nevil Maskelyne in the 1774 experiment to calculate Earth's mass. **[WHS: NEW]**. *Direction:* a biome that folds real science with faerie lore.

- **An Teallach** — "The Forge," a jagged ridge. Among Scotland's most dramatic mountains.

- **Liathach** — A stacked-sandstone massif in Torridon. Older than the Himalayas.

- **Arthur's Seat** (Edinburgh) — 251m urban peak, extinct volcano. **[WHS: NEW]**.

- **The Old Man of Storr** (Skye) — Pinnacle. Iconic silhouette.

- **The Cuillin** (Skye) — Britain's most demanding ridge. Black Cuillin and Red Cuillin.

- **Ben Arthur / The Cobbler** (near Loch Lomond) — Distinctive three-peaked mountain with a "threading the needle" rock climb.

- **Glen Coe** — Deep glaciated valley. Site of the 1692 Massacre (see §3.5). Weather extremes; sombre atmosphere; *Skyfall*'s Scottish scenes filmed here. **[WHS: DEFERRED]** (biome candidate). *Direction:* ghost-wave event honouring (respectfully) the massacre — undead MacDonalds rise from the snow at a specific time.

- **Glen Shiel** — Jacobite battle site (1719). Dramatic.

- **Glen Affric** — Often called Scotland's most beautiful glen. Ancient Caledonian pine forest. **[WHS: NEW]**.

- **Glen Etive** — Deirdre's glen. Featured in Skyfall. Remote, wild.

- **Glen Roy** — "Parallel Roads" — raised ancient shorelines, terraces along the hillside.

- **Glen Moriston** — Scenic Highland glen; Jacobite shelter area.

- **Strathspey** — "The Strath of the Spey" — river valley. Also a dance rhythm named for it.

### 2.3 Islands

Scotland has over 900 islands. The recognisable ones:

- **Isle of Skye** — Most famous, most visited. The Cuillin, Fairy Pools, Old Man of Storr, Quiraing, Dunvegan Castle. Gaelic: *An t-Eilean Sgitheanach* ("the winged isle"). **[WHS: DEFERRED]** (Fairy Pools biome). *Direction:* a Skye-themed biome emphasising *blue, mist, pinnacles*.

- **Isle of Mull** — Second-largest Hebridean isle. Tobermory (colourful harbour). **[WHS: NEW]**.

- **Iona** — Tiny holy isle off Mull. Saint Columba's 6th-century monastery; spiritual birthplace of Scottish Christianity; buried burial place of ancient Scottish, Irish, and Norse kings. **[WHS: NEW]**. *Direction:* a *peaceful / contemplative* biome alternative; an Iona route option that grants calm/regen instead of combat buffs.

- **Staffa** — Uninhabited, famous for Fingal's Cave (hexagonal basalt columns like Giant's Causeway in Ireland). Mendelssohn wrote the *Hebrides Overture* after visiting. **[WHS: NEW]**.

- **Lewis & Harris** — Largest Hebridean island (really one island, two names). Callanish Stones, Harris Tweed, vast machair (coastal grassland). **[WHS: NEW]**.

- **Orkney** — Archipelago off the north coast. Neolithic treasures (Skara Brae, Maeshowe, Ring of Brodgar). Distinctly Norse-influenced culture. **[WHS: NEW]**. *Direction:* a Neolithic-themed biome with standing-stone hazards.

- **Shetland** — Even further north. Up Helly Aa festival. Viking heritage. Home of Nuckelavee and Marool lore. **[WHS: NEW]**.

- **St Kilda** — Remote archipelago, evacuated 1930. Cultural ghost-place. Bird-cliffs of staggering scale. **[WHS: NEW]**.

- **Islay** — Whisky island (9 operating distilleries including Laphroaig, Lagavulin, Ardbeg — the peaty Islays). **[WHS: NEW]**. *Direction:* a whisky-distillery themed biome with peat-smoke hazards.

- **Jura** — Paps of Jura (three conical peaks). Corryvreckan whirlpool offshore. George Orwell wrote *1984* here. **[WHS: NEW]**.

- **Rum** — Rough, remote, wildlife-rich.

- **Eigg** — Community-owned, tiny, stunning.

- **Arran** — "Scotland in miniature" (Highland Boundary Fault runs through it).

- **Bute** — Closer to Glasgow; holiday-tradition island ("Doon the Watter").

### 2.4 Rivers & Waterways

- **Clyde** — Glasgow's river. Once the world's shipbuilding heart ("Clyde-built"). **[WHS: NEW]**. *Direction:* a Glasgow urban-industrial biome with shipbuilding motifs.

- **Tay** — Longest river. Salmon-famous.

- **Tweed** — Borders river; lends its name to the cloth.

- **Spey** — Speyside whisky region's backbone.

- **Dee** — Royal Deeside — Balmoral Castle sits here.

- **Forth** — Fife and Lothian's river; Firth of Forth bridges famous.

- **The Minch** — The channel between mainland Scotland and the Outer Hebrides. Home of the Blue Men. **[WHS: SHIPPED]** (named).

- **Pentland Firth** — Strait between mainland Scotland and Orkney. One of the world's strongest tidal flows.

- **Sound of Jura / Gulf of Corryvreckan** — Home of the Cailleach's whirlpool.

### 2.5 Cities, Towns & Regions

- **Edinburgh** — Capital. Two-city structure — the medieval Old Town (tangled closes, haunted, Royal Mile, castle) and Georgian New Town (elegant grid). World Heritage Site. **[WHS: SHIPPED]** (Edinburgh Ghost Guide enemy, Edinburgh Old Town biome deferred). *Deepen:* the Close-and-wynd warren could be a dedicated biome — narrow, haunted, vertical.

- **Glasgow** — Largest city. Victorian industrial grand architecture. Humour, music, warmth, grit. Modern Glasgow is the cultural engine of Scotland. **[WHS: SHIPPED]** (Glesga voice, Glaswegian variant, urban ghaists). *Deepen:* a whole Glasgow Close biome already noted as deferred.

- **Aberdeen** — "The Granite City." Silver-grey buildings. North Sea oil, fishing heritage. Doric dialect (distinctively different from Glesga). **[WHS: NEW]**.

- **Dundee** — "City of Discovery." Jute, jam, journalism historically. Home of the *Beano* and *Dandy* (comics heritage). Modern V&A Dundee. **[WHS: NEW]**.

- **Inverness** — "Capital of the Highlands." Gateway to Loch Ness.

- **Stirling** — Historically pivotal; castle, Wallace Monument, the old capital. "Brooch of Scotland" (he who holds Stirling holds Scotland).

- **Perth** — "Fair City." Royal coronation site of Scottish kings (Scone Palace nearby, Stone of Destiny).

- **St Andrews** — Ancient university town; home of golf; ruined cathedral.

- **Oban** — "Gateway to the Isles." Ferry hub. McCaig's Tower folly.

- **Fort William** — "Outdoor Capital of the UK." Ben Nevis base.

- **Melrose & Jedburgh (Borders)** — Abbey towns. Rugby heritage.

**Regional identities:**
- **The Highlands** — The romantic mountain heartland. Sparsely populated. Gaelic-speaking traditionally.
- **The Lowlands** — Central belt. Edinburgh/Glasgow/industry. Scots-speaking.
- **The Borders** — Southern uplands, rolling hills, rugby country, Burns territory.
- **The Hebrides** — Inner and Outer island chains. Gaelic stronghold.
- **The Northern Isles** — Orkney and Shetland. Norse heritage.
- **The Northeast (Buchan / Doric)** — Aberdeenshire and Banffshire. Distinct dialect ("Fit like?" for "how are you?").
- **Fife** — Peninsula. "The Kingdom of Fife." St Andrews, fishing villages.

### 2.6 Castles (The Dense List)

Scotland has over 3,000 castles. The famous ones carry ghost-stories and history:

- **Edinburgh Castle** — On Castle Rock. Crown Jewels of Scotland, Stone of Destiny, Mons Meg cannon. Famously haunted (Headless Drummer, Lone Piper). **[WHS: NEW]**.

- **Stirling Castle** — Strategic heart of Scotland. Renaissance palace, Great Hall. Green Lady ghost. **[WHS: NEW]**.

- **Eilean Donan** — Island-castle on Loch Duich. Most-photographed castle in Scotland. Rebuilt in the early 20th century. **[WHS: NEW]**.

- **Urquhart Castle** — Ruin on Loch Ness. Thousand-year history; repeatedly besieged. **[WHS: NEW]**.

- **Dunnottar Castle** — Clifftop ruin near Stonehaven. Hid the Scottish Crown Jewels from Cromwell. **[WHS: NEW]**.

- **Balmoral Castle** — Royal residence. Built by Prince Albert.

- **Glamis Castle** — Home of the Queen Mother. Multiple ghosts (Earl Beardie, Grey Lady, Monster of Glamis). Setting for Shakespeare's Macbeth.

- **Fyvie Castle** — Famously haunted (Green Lady Lilias Drummond). Legend of a hidden room no one has entered.

- **Crathes Castle** — Tower house with the Green Lady ghost and painted ceilings.

- **Cawdor Castle** — Linked (loosely) to Macbeth.

- **Culzean Castle** — Ayrshire coast clifftop castle, Robert Adam design.

- **Tantallon Castle** — Ruin on cliffs overlooking the North Sea.

- **Ackergill Tower** — Ghost of Helen Gunn (Beauty of Braemore).

- **Kilchurn Castle** — Ruin on Loch Awe. Iconic photograph subject.

- **Doune Castle** — Used as filming location for *Monty Python and the Holy Grail*, *Game of Thrones* (Winterfell), and *Outlander*.

- **Dunstaffnage** — Traditional site of Stone of Destiny's first resting place.

**Castle as WHS fodder:** a *ruin-wave* event — a specific number of enemies spawn from a named castle silhouette on the horizon, each themed to the castle's ghosts. Modular content.

### 2.7 Battlefields & Historic Sites

- **Bannockburn** (1314) — Robert the Bruce's decisive defeat of the English. Scotland's Zama. **[WHS: NEW]**.

- **Stirling Bridge** (1297) — Wallace's tactical masterstroke. **[WHS: NEW]**.

- **Culloden Moor** (1746) — The Jacobite final stand. Bleak, sombre. Often called the last pitched battle on British soil. **[WHS: NEW]**. *Direction:* a haunting Moor biome variant with Jacobite spectre waves.

- **Falkirk** (1298) — Wallace's defeat; also 1746 battle.

- **Flodden Field** (1513) — Scotland's catastrophic defeat against England. Killed King James IV and most of Scottish nobility. **[WHS: NEW]**.

- **Killiecrankie** (1689) — Jacobite victory followed by the leader's death.

- **Prestonpans** (1745) — Bonnie Prince Charlie's first victory.

- **Glencoe** (1692) — The massacre, not a battle (see §3.5).

- **Harlaw** (1411) — Major clan battle.

- **Skara Brae** (Orkney) — Neolithic village older than Stonehenge. Preserved under sand-dune. **[WHS: NEW]**. *Direction:* Neolithic biome reference point.

- **Maeshowe** (Orkney) — Neolithic chambered cairn. Viking graffiti inside. **[WHS: NEW]**.

- **Ring of Brodgar & Stones of Stenness** — Neolithic ceremonial complex, Orkney.

- **Callanish Stones** (Lewis) — see §1.8.

- **Kilmartin Glen** — Argyll. Huge density of prehistoric monuments.

- **The Cairnpapple** — West Lothian burial monument.

- **Rosslyn Chapel** — 15th-century chapel of the Knights Templar (allegedly). Famous in Dan Brown lore.

### 2.8 Coastal & Seascape Geography

- **The North Sea** — East coast. Gray, stormy, oil-rig industry.

- **The Atlantic Coast** — West and North West. Jagged, sea-lochs, white sand beaches (Harris, Vatersay).

- **The Firth of Forth** — Edinburgh's estuary. Three iconic bridges.

- **The Firth of Clyde** — Glasgow's estuary. Sailing tradition.

- **Pentland Firth** — Between Scotland and Orkney. Strong tides.

- **Moray Firth** — Dolphin-watching spot.

- **Solway Firth** — Scotland/England border on the west.

- **The Ardnamurchan Peninsula** — Most westerly point of mainland Britain.

- **Sandwood Bay** — Remote northern beach with a haunted shipwreck.

- **Luskentyre Beach** (Harris) — Tropical-looking white sand on a Hebridean island.

- **The Bullers of Buchan** — Collapsed sea-cave; seabird colony.

- **Duncansby Stacks** — Jagged sea-stacks at Scotland's north-east corner.

### 2.9 Characteristic Atmosphere Notes

For art-direction / music reference:

- **Dreich weather** — grey, wet, low-cloud. Not just rain; *sustained* miserable damp. Iconic Scots word. **[WHS: referenced]**.
- **Haar** — cold sea-fog that rolls inland from the east coast, especially around Edinburgh and Aberdeen. **[WHS: SHIPPED]** as weather-wraith.
- **Taps aff weather** — the (rare) hot day when men remove their tops. Cultural marker of heatwaves.
- **The gloaming** — twilight. Distinctive Scottish summer long-twilight ("simmer dim").
- **Snow-on-ben** — late-snow patches on high peaks even in summer.
- **Peat-smoke scent** — smoky, earthy. Whisky-linked.
- **Wild garlic in spring** — pungent, ubiquitous.
- **Bracken-turning copper** (autumn) — hillsides shift from green to red-brown.
- **Heather in bloom** (August) — hills turn purple.
- **Midges** (summer) — biting insects in the west and north. A genuine cultural menace. **[WHS: SHIPPED]** (midge swarm enemy).

---

## Part 3 — History & Famous Figures

Scottish history is unusually dense with drama for a country of its size. This section moves chronologically through the eras that carry the strongest popular recognition, then covers the non-chronological famous figures (writers, scientists, modern cultural icons).

### 3.1 Ancient & Early Medieval (pre-1000 AD)

- **The Picts** — "The Painted People." Pre-Christian Celtic inhabitants of northern and eastern Scotland. Left *Pictish stones* — carved symbol-stones with mysterious iconography (crescents, double-discs, "Pictish Beast"). Never fully conquered by the Romans. Eventually absorbed into the Kingdom of Alba. **[WHS: NEW]**. *Direction:* Pictish-stone relics; a *Pictish Beast* enemy (they carved a specific mystery creature repeatedly — nobody's sure what it was).

- **The Scoti** — Gaelic-speakers from Ireland who settled Dál Riata (the western coast) around 500 AD. The name "Scotland" comes from them.

- **The Romans** — Reached as far as the Antonine Wall (Falkirk to Glasgow). Hadrian's Wall farther south. The *Ninth Legion* famously "vanished" in Caledonia. **[WHS: NEW]**. *Direction:* spectral Roman legionary enemy hinting at the lost Ninth.

- **Kingdom of Alba** — Unified Scotland, c. 900 AD. First king often cited as Kenneth MacAlpin (Cináed mac Ailpín) who merged Picts and Scoti around 843.

- **St Columba** (c. 521–597) — Irish monk who founded Iona monastery in 563. Converted much of Scotland to Christianity. Credited with the *first written Nessie sighting* — supposedly turning back a river-monster with a blessing. **[WHS: NEW]**. *Direction:* St Columba as a *bless-and-banish* mini-NPC; his staff as a relic.

- **St Ninian, St Mungo (Kentigern), St Margaret** — Other key saints. Mungo patronises Glasgow.

- **Viking raids & Norse settlement** — Orkney, Shetland, and Caithness were Norse for centuries. Parts of the Hebrides too. **[WHS: NEW]**. *Direction:* Viking-themed enemies for Northern/Coastal biomes; Thor-hammer relic.

- **Macbeth (real, r. 1040–1057)** — The historical Macbeth was a stable, even-handed Scottish king, *nothing like* Shakespeare's version. Killed in battle by Malcolm Canmore. **[WHS: NEW]**. *Direction:* a Macbeth-themed event that plays with the Shakespeare/reality contrast.

### 3.2 High Medieval & Wars of Independence (1100–1400)

This is Scotland's founding-myth era in popular memory. Braveheart. Robert the Bruce. Scotland's independent identity forged in blood.

- **William Wallace** (c. 1270–1305) — Scottish knight who led the early rebellion against Edward I of England. Won Stirling Bridge (1297). Lost Falkirk (1298). Captured and executed at Smithfield — hanged, drawn, and quartered — 1305. A national martyr; the Wallace Monument near Stirling honours him. **[WHS: NEW]**. *Direction:* a *Wallace Sword* relic (giant two-hander, slow, devastating); a Wallace Monument cairn landmark.

- **Robert the Bruce** (1274–1329) — King of Scots. After a shaky start, won the decisive Battle of Bannockburn (1314) against Edward II, securing Scottish independence. Died of leprosy (probably). Heart carried to the Holy Land per his dying wish. *The spider legend* — while hiding in a cave, watched a spider try, fail, and eventually succeed at spinning its web, inspiring him to try again. **[WHS: NEW]**. *Direction:* a *Bruce's Cave* hidden route — enter the cave, watch a spider try repeatedly, and gain a "try again" revival token.

- **The Declaration of Arbroath** (1320) — Scottish nobles' letter to the Pope declaring national sovereignty. Contains the famous lines "For as long as but a hundred of us remain alive, never will we on any conditions be brought under English rule."

- **Edward I of England "Hammer of the Scots"** — Scottish villain archetype. Stole the Stone of Destiny (returned 1996).

- **The Stone of Destiny (Lia Fail)** — Coronation stone of Scottish kings. Moved between various resting places; stolen by Edward I; kept in Westminster Abbey 1296–1996; now in Perth (Scone) with a ceremonial loan to Westminster for UK coronations. **[WHS: NEW]**.

- **Battle of Bannockburn** (24 June 1314) — Mass-audience Scottish victory. Bruce's smaller army defeats Edward II on boggy ground near Stirling.

- **The Black Douglas (Sir James Douglas)** — Bruce's most feared lieutenant. Known by English mothers: "hush ye, hush ye, the Black Douglas will not get ye."

### 3.3 Stewart Dynasty (1371–1714)

- **The Stewart/Stuart kings** — Dynasty starting with Robert II (1371) and running through the Jacobite era. Mixed record.

- **James I of Scotland** — Imprisoned in England for 18 years; released, rose-bush assassinated at Perth.

- **James IV** (1488–1513) — Renaissance king. Spoke many languages. Died at Flodden (1513) with most of Scotland's nobility.

- **James V** — "King of the Commons" — legend says he walked disguised as a commoner to hear grievances. Father of Mary Queen of Scots.

- **Mary Queen of Scots** (1542–1587) — Dramatic life: crowned Queen at 6 days old, raised in France, widowed (Francis II of France), returned to Scotland, married Darnley (murdered), married Bothwell (suspected of Darnley's murder), abdicated, fled to England, imprisoned by Elizabeth I for 19 years, executed 1587. Her son James VI of Scotland became James I of England. **[WHS: NEW]**. *Direction:* a Mary-themed ghost-encounter; a hidden "Queen's Jewel" chest.

- **James VI of Scotland / I of England** (1566–1625) — Unified crowns 1603. Presided over North Berwick Witch Trials; wrote *Daemonologie*. Inspired Shakespeare's Macbeth. **[WHS: NEW]**.

- **The Covenanters** (mid-1600s) — Scottish Presbyterians resisting imposed Anglican reforms. Persecuted during the "Killing Times" under Charles II. Moors remember dead Covenanters. **[WHS: NEW]**. *Direction:* moor-ghost Covenanter enemies; a Killing Times route.

- **John Graham of Claverhouse (Bonnie Dundee / Bloody Clavers)** — Covenanter-persecutor for the Crown; later a Jacobite hero who died at Killiecrankie. **[WHS: NEW]**.

### 3.4 Jacobite Era (1688–1746)

The Jacobites were supporters of the exiled Stewart claim to the throne after 1688. Scottish romantic nationalism was forged here. Five risings: 1689, 1708, 1715, 1719, 1745.

- **"Bonnie Prince Charlie" (Charles Edward Stuart)** — The Young Pretender. Landed in Scotland in 1745 with a handful of followers, raised the Highlands, marched south to Derby, retreated, was crushed at Culloden (16 April 1746). Escaped in disguise back to France. Died in exile an alcoholic. **[WHS: NEW]**. *Direction:* a *Prince Charlie's Tartan* relic; a Jacobite ghost-army biome event.

- **Flora MacDonald** — Rowed Charlie "over the sea to Skye" disguised as her maid Betty Burke. Skye Boat Song memorialises her. **[WHS: NEW]**. *Direction:* a Flora-themed *escape* route (speed burst + invincibility).

- **The '45 / Culloden (1746)** — Final Jacobite defeat. Moor at Drumossie, near Inverness. Government troops under the Duke of Cumberland ("The Butcher") followed the battle with indiscriminate slaughter of highlanders. **[WHS: NEW]**.

- **The Highland Clearances** (late 1700s – mid 1800s) — Post-Culloden, landlords *cleared* Highland communities from their ancestral lands, replacing them with sheep. Forced emigration to America, Canada, Australia. A national trauma. **[WHS: NEW]** — *handle with care; Soul-risky*. *Direction:* a sombre landscape-ghost biome; not mined for humor.

- **Dress Act** (1746–1782) — Banned the wearing of tartan and Highland dress. Only repealed via the Romantic revival, largely thanks to Walter Scott. **[WHS: NEW]**.

- **Rob Roy MacGregor** (1671–1734) — Outlaw cattle-drover turned folk hero of the western Highlands. Subject of Scott's novel. **[WHS: NEW]**. *Direction:* a Rob Roy-themed *stealth/heist* route — steal cattle (XP gems) from a guarded compound.

### 3.5 Clans & Clan Feuds

The clan system is Scotland's social framework in the Highlands pre-Clearances. Simplified: extended kin-groups led by a chief, using common tartans as identity.

- **Clan MacDonald (Domhnall)** — Once most powerful clan. Lords of the Isles. Rivalry with Campbells defines centuries of strife. **[WHS: NEW]**.

- **Clan Campbell** — Royalist, Presbyterian, sided with government in Jacobite risings. *Responsible for the Massacre of Glencoe (1692)* — slaughtered 38 MacDonalds who had given them bread-and-salt hospitality for 12 days. The word "treachery" in Gaelic (*mì-rùn mòr nan Gall* — "great ill-will of the Lowlander") encompasses this. Campbells are the archetypal "traitor clan" in folk memory, though the reality is more complex. **[WHS: NEW]**.

- **Clan MacGregor** — Outlawed by royal decree (1603) after the Battle of Glen Fruin. The name itself was forbidden. Rob Roy's clan. **[WHS: NEW]**.

- **Clan Stewart** — Royal clan, many branches.

- **Clan Fraser** — Eastern Highlands. Popularised by *Outlander* series.

- **Clan Gordon** — Aberdeenshire powerbrokers. **[WHS: SHIPPED]** (Gordon as a boss — though currently more Ramsay-flavoured).

- **Clan Sinclair** — Caithness / Orkney. Templar legends.

- **Clan Cameron** — "Mountain Clan." Lochiel. Jacobite stalwarts.

- **Clan Mackenzie** — Northwest Highlands.

- **Clan Ross, Munro, Sutherland, Mackay, Mackintosh, Chattan, MacLean, MacLeod, MacNab, MacBean** — etc. Each with distinct tartans, crests, histories, rivalries.

- **Massacre of Glencoe (13 February 1692)** — Campbells, acting as government troops, slaughtered the MacDonalds of Glencoe who had hosted them for nearly two weeks. The MacDonalds' chief had been late in swearing the oath to William III. 38 killed outright, more froze in the winter mountains. A moral scandal that outlived the politics. **[WHS: DEFERRED]** (Glen Coe biome candidate with "massacre echoes"). *Handle respectfully.*

- **Battle of the Clans (North Inch, Perth, 1396)** — 30 warriors from two clans fought to the death before Scottish royalty to settle a feud. One survived.

- **Tartan & Clan Colours** — Technically a post-1822 Romantic creation (Walter Scott and King George IV's visit to Edinburgh) rather than medieval tradition, but the cultural weight is real now.

### 3.6 Enlightenment & Industrial Revolution (1700s–1900s)

Scotland punched vastly above its weight in the 18th–19th centuries.

- **The Scottish Enlightenment** — Centred in Edinburgh and Glasgow. Produced world-changing thinkers:
  - **Adam Smith** (1723–1790) — *The Wealth of Nations* (1776). Founder of modern economics. **[WHS: NEW]**.
  - **David Hume** (1711–1776) — Philosopher of empiricism and scepticism. *A Treatise of Human Nature*. **[WHS: NEW]**.
  - **Francis Hutcheson** — "Father" of the Scottish Enlightenment.
  - **Adam Ferguson** — Early sociologist.
  - **Thomas Reid** — "Common Sense" philosophy.
  - **Dugald Stewart** — Popularised Enlightenment ideas.
  - **James Hutton** — Founder of modern geology ("deep time").
  - **Joseph Black** — Chemist (latent heat, CO₂).
  - **William Cullen** — Physician, chemist.

- **James Watt** (1736–1819) — Improved the steam engine (separate condenser). Industrial Revolution catalyst. Unit of power named for him. **[WHS: NEW]**. *Direction:* a *Steam Engine* weapon — AoE pulse with chimney-smoke particles.

- **Alexander Graham Bell** (1847–1922) — Invented the telephone (in America, but Edinburgh-born).

- **John Logie Baird** (1888–1946) — Invented television.

- **Alexander Fleming** (1881–1955) — Discovered penicillin.

- **Lord Kelvin (William Thomson)** — Physicist; thermodynamics; Kelvin temperature scale.

- **James Clerk Maxwell** (1831–1879) — Electromagnetism, kinetic theory. Einstein placed his portrait alongside Newton's.

- **John Muir** (1838–1914) — Father of national parks (Yosemite, Sequoia). Dunbar-born.

- **Clyde Shipbuilding** — Glasgow's Clyde built 20% of the world's ships in 1900. Queen Mary, Queen Elizabeth, QE2. **[WHS: NEW]**. *Direction:* a shipyard biome with riveter-enemies and crane-hazards.

- **Andrew Carnegie** — Steel magnate, philanthropist. Dunfermline-born.

### 3.7 Literature & Arts

- **Robert Burns (1759–1796)** — *The* National Bard. Scotland's beloved poet. Born poor, farmed, drank, wrote with astonishing warmth and political fire. Poems in Scots and English. "To a Mouse," "Tam o' Shanter," "A Red, Red Rose," "Auld Lang Syne," "Address to a Haggis." Died at 37. **Burns Night** (25 January) honours him with haggis, neeps, tatties, whisky, and recitations. **[WHS: NEW — MAJOR GAP]**. *Direction:* Burns is an **essential** WHS deepening target:
  - Tam o'Shanter's ride past the witches at Kirk Alloway is a perfect banter hook.
  - "Address to a Haggis" is *literally about the haggis* — quote-banter gold.
  - Burns Night as a *seasonal event* with haggis-themed buffs.
  - Lines from Burns as *banter fragments* on the haggis: "wee, sleekit, cow'rin, tim'rous beastie" (To a Mouse).

- **Sir Walter Scott** (1771–1832) — Novelist who invented the historical novel form. *Waverley*, *Rob Roy*, *Ivanhoe*, *The Lady of the Lake*. Almost single-handedly re-invented Scottish Romantic identity (and the tartan craze) for the modern era. Edinburgh's Waverley Station and Scott Monument honour him. **[WHS: NEW]**.

- **Robert Louis Stevenson** (1850–1894) — *Treasure Island*, *Kidnapped*, *The Strange Case of Dr Jekyll and Mr Hyde*. Edinburgh-born; travelled; died in Samoa. **[WHS: NEW]**. *Direction:* a Jekyll/Hyde variant haggis — split-personality build, two stat sets that swap on trigger.

- **Arthur Conan Doyle** (1859–1930) — Edinburgh-born. Sherlock Holmes. Modelled Holmes on his Edinburgh medical lecturer Joseph Bell. **[WHS: NEW]**.

- **J M Barrie** (1860–1937) — Kirriemuir-born. *Peter Pan*. **[WHS: NEW]**.

- **Hugh MacDiarmid** (1892–1978) — Modernist poet writing in synthetic Scots. Led the 20th-century Scottish Renaissance. *A Drunk Man Looks at the Thistle*. **[WHS: NEW]**.

- **Lewis Grassic Gibbon** (1901–1935) — *A Scots Quair* trilogy. Beautifully-written rural-Scottish modernism.

- **Muriel Spark** (1918–2006) — *The Prime of Miss Jean Brodie*.

- **Iain Banks / Iain M Banks** (1954–2013) — Fiction *and* science fiction. *The Wasp Factory*, *The Crow Road*, *Culture* novels.

- **Irvine Welsh** — *Trainspotting*. Edinburgh gritty modern dialect. Cultural phenomenon.

- **Alasdair Gray** (1934–2019) — *Lanark*. Glasgow magical realism.

- **George MacDonald** (1824–1905) — Christian fantasy; C.S. Lewis & Tolkien's precursor.

### 3.8 Modern Cultural Figures

- **Billy Connolly** — Comedian, national treasure. "The Big Yin." **[WHS: —]** (voice-character reference).

- **Limmy (Brian Limond)** — Comedian (*Limmy's Show*). WHS's "Edge voice" anchor. **[WHS: SHIPPED as voice reference]**.

- **The cast of Still Game** (Ford Kiernan, Greg Hemphill) — Jack & Victor. WHS's "Hearth voice" anchor. **[WHS: SHIPPED as voice reference]**.

- **Sean Connery** (1930–2020) — James Bond. Edinburgh-born.

- **Ewan McGregor** — Trainspotting, Star Wars, Obi-Wan. Perthshire-born.

- **David Tennant** — Actor (Doctor Who, Broadchurch).

- **Tilda Swinton** — Born London, raised Scots. Distinctive.

- **Ewan Bremner** — Trainspotting's Spud. Edinburgh.

- **J K Rowling** — Not Scottish by birth but wrote much of Harry Potter in Edinburgh cafés; set parts of the wizarding world in Scotland.

- **Andy Murray** — Tennis. Dunblane-born.

- **Lulu** — Pop singer.

- **The Proclaimers** — "I'm Gonna Be (500 Miles)."

- **Runrig** — Gaelic-rock band. Formative.

- **Annie Lennox** — Eurythmics.

- **Paolo Nutini** — Modern soul-pop.

- **Gerry Cinnamon** — Glasgow busker turned stadium headliner.

- **Lewis Capaldi** — Viral-era pop.

- **Belle and Sebastian, Mogwai, Primal Scream, Franz Ferdinand, Idlewild** — Indie-rock scene.

- **Irn-Bru's ad campaigns** — Iconic ads featuring distinctively Scottish humour (*"Phenomenal"*; the 2006 ad with Santa; the 2017 snowman; the snowman 2023 — "It's a ride"). **[WHS: SHIPPED as Irn-Bru passive]**.

### 3.9 Key Dates (Quick-Reference)

- **843** — Kenneth MacAlpin unifies Picts and Scoti.
- **1040–1057** — Reign of historical Macbeth.
- **1286** — Alexander III dies; succession crisis.
- **1297** — Stirling Bridge (Wallace).
- **1314** — Bannockburn (Bruce).
- **1320** — Declaration of Arbroath.
- **1371** — Stewart dynasty begins.
- **1492** — Discovery of whisky, effectively (earliest written mention 1494).
- **1513** — Flodden Field.
- **1542** — Mary Queen of Scots born.
- **1560** — Scottish Reformation; Presbyterian kirk established.
- **1590** — North Berwick Witch Trials.
- **1603** — Union of Crowns (James VI becomes James I of England).
- **1689** — Killiecrankie.
- **1692** — Massacre of Glencoe.
- **1707** — Act of Union (political).
- **1745–1746** — Jacobite rising; Culloden.
- **1759** — Robert Burns born.
- **1760s–1820s** — Scottish Enlightenment peaks; Industrial Revolution; Clearances.
- **1822** — King George IV's Edinburgh visit; tartan revival.
- **1933** — Loch Ness Monster's "modern" sighting revival.
- **1979** — First devolution referendum (failed).
- **1997** — Devolution referendum (passed); Scottish Parliament re-established 1999.
- **2014** — Independence referendum (failed 55–45).
- **2016** — Brexit (Scotland voted remain).

---

## Part 4 — Culture, Food, Music, Language

The daily texture of Scotland. This is where WHS lives — the haggis is food, the bagpipes are weapons, the tartan is clothing, the language is voice.

### 4.1 Food

The classic canon plus regional specialties:

- **Haggis** — Sheep's stomach stuffed with heart, liver, lungs, oatmeal, onions, suet, spices. The national dish. Traditional cry of affection, not disgust. Traditionally served with *neeps* (mashed turnip/swede) and *tatties* (potatoes). **[WHS: SHIPPED]** as protagonist + boss-adjacent. *Deepen:* regional haggis variants (venison haggis in the Highlands; vegetarian haggis for modern tables).

- **Neeps & Tatties** — The traditional haggis accompaniment. Mashed swede and potato. **[WHS: NEW]**. *Direction:* a *Neeps & Tatties* passive — flat HP + speed bundle; Burns Night seasonal buff.

- **Cullen Skink** — Smoked haddock, cream, potato, onion soup. Named after the fishing village of Cullen in Moray. **[WHS: NEW]**. *Direction:* *Cullen Skink* relic — warming AoE that grants regen.

- **Cranachan** — Dessert of toasted oats, whisky, honey, cream, raspberries. Often called "the uncooked national dessert." **[WHS: NEW]**. *Direction:* layered buff — each "layer" = a mini-buff stack.

- **Scotch Broth** — Lamb or beef broth with barley and root vegetables.

- **Cock-a-Leekie** — Chicken and leek soup. Sometimes with prunes.

- **Scotch Pie** — Hot water crust pastry filled with minced mutton. Eaten at football matches. **[WHS: NEW]**. *Direction:* *Scotch Pie* pickup — instant small heal, greasy.

- **Bridie** (Forfar Bridie) — Pastry filled with minced steak and onion.

- **Arbroath Smokie** — Smoked haddock from Arbroath on the east coast. Actual protected-origin designation. **[WHS: NEW]**.

- **Lorne Sausage (Square Sausage)** — Beef/pork minced mixture formed as a square slice; classic on a roll for breakfast. **[WHS: NEW]**.

- **Tattie Scone** — Soft flatbread of mashed potato, flour, butter. Part of a Full Scottish Breakfast.

- **Full Scottish Breakfast** — Sausage, bacon, egg, baked beans, haggis slice, tattie scone, Lorne sausage, black pudding, fried tomato, fried mushroom, toast. Culinary juggernaut. **[WHS: NEW]**.

- **Black Pudding** (Stornoway Black Pudding is protected-origin) — Blood pudding.

- **White Pudding (Mealie Pudding)** — Oatmeal-based pudding.

- **Porridge** — Oats and water (traditionally; modern versions add milk). National breakfast.

- **Oatcakes** — Unleavened oat biscuits. Cheese accompaniment standard.

- **Aberdeen Angus Beef** — Cattle breed; protected brand.

- **Salmon** — Scottish salmon is globally famous. Wild and farmed.

- **Langoustine** — Norway lobsters. Scottish shellfish.

- **Shortbread** — Buttery biscuit. *Walker's Shortbread* is the iconic brand. **[WHS: NEW]**. *Direction:* a Shortbread passive — pickup gem.

- **Tablet** — Grainy, crumbly, sweeter-than-fudge sugar candy. Distinctively Scottish. **[WHS: NEW]**. *Direction:* *Tablet* pickup — sugar-rush speed burst.

- **Tunnock's Caramel Wafer / Tea Cake / Snowball** — Iconic Scottish sweet brand (red-foil wafers). **[WHS: NEW]**. *Direction:* a Tunnock's-wrapped pickup.

- **Crowdie** — Scottish soft cheese.

- **Macaroni Pie** — Exactly what it sounds like. Glaswegian specialty.

- **Stovies** — Potato-and-leftover-meat stew.

- **Deep-fried Mars Bar** — Modern (1995, Carron Fish Bar, Stonehaven) Scottish joke-icon turned real. **[WHS: NEW]**. *Direction:* an *absurdist* pickup/event.

- **Empire Biscuit** — Two shortbread rounds with jam between, iced with a cherry on top.

- **Clootie Dumpling** — Spiced pudding wrapped in a cloth (*clootie*) and boiled. Christmas/birthday.

- **Iron Bru-battered Mars Bar** — *(meta-joke)*.

### 4.2 Drink

- **Whisky (uisge beatha, "water of life")** — Scotland's gift to the world. Five recognised regions:
  - **Islay** — Peaty, smoky, medicinal (Laphroaig, Lagavulin, Ardbeg, Bowmore, Bunnahabhain, Caol Ila, Kilchoman, Bruichladdich).
  - **Speyside** — Fruity, floral, most distilleries concentrated here (Macallan, Glenfiddich, Glenlivet, Aberlour, Balvenie).
  - **Highland** — Varied; everything that's not Speyside within the Highland line (Dalmore, Glenmorangie, Oban, Dalwhinnie).
  - **Lowland** — Lighter, grass (Auchentoshan, Glenkinchie).
  - **Islands** (often grouped with Highland) — Smoky, salted (Talisker, Highland Park, Jura).
  - **Campbeltown** — Small region with distinct character (Springbank, Glen Scotia).
- **[WHS: SHIPPED]** as Whisky Flask passive. *Deepen:* regional whiskies as distinct passive variants — Islay Flask (burn damage), Speyside Flask (regen), Highland Flask (balanced), etc.

- **Irn-Bru** — Orange, secret-recipe carbonated soft drink. "Scotland's other national drink." Outselling Coca-Cola in Scotland for decades. Made in Cumbernauld. "Made in Scotland from girders." Famous for absurdist advertising. **[WHS: SHIPPED]** as Irn-Bru passive. *Deepen:* an Irn-Bru variant-haggis with soda-can-shell armour; themed combat sound effects.

- **Buckfast Tonic Wine ("Buckie")** — Fortified wine with 37mg caffeine per 100ml. Made by monks in Devon, England, but *beloved in Scotland* as a cheap energetic drink; associated with west-coast youth culture, minor mayhem. Legal controversy around caffeine content. **[WHS: SHIPPED]** as Buckfast Ned enemy + Buckie Pitstop route. *Deepen:* Buckie-themed stat buff in Buckie Pitstop route could be "caffeine rush" — speed + attack speed temporary.

- **Tennent's Lager** — Glasgow-brewed lager. Red T logo ubiquitous.

- **Heather Ale (Leann Fraoich)** — Ancient Scottish beer made from heather flowers. The Pech (see §1.2) were said to brew it and took the secret to their graves. Modern breweries (Williams Bros) revived it. **[WHS: NEW]**.

- **Drambuie** — Whisky liqueur, honey and herbs. Legendarily Bonnie Prince Charlie's personal recipe.

- **Crabbie's Ginger Wine** — Hot toddy mix.

- **Gin** — Scottish gin has boomed in the last decade. Hendrick's (Ayrshire) put Scotland back on the map; now 70+ craft distilleries.

- **Iron Bru (in the West of Scotland) — pronounced "I-Ron Broo"** or more casually "eye-run broo." Orange fizzy drink. Generally *the* hangover cure.

### 4.3 Music

Scotland has an exceptional music tradition.

- **The Great Highland Bagpipes** — Drone + chanter. Loud. Iconic. Symbol. The instrument most commonly associated with Scotland abroad. **[WHS: SHIPPED]** as Bagpipe Blast + Bagpipes weapons. *Deepen:* distinct musical styles below.

- **Pibroch (Piobaireachd / Ceòl Mòr, "great music")** — The classical *art music* of the bagpipes. Slow, meditative, elaborate thematic variations on a ground melody (*urlar*). Traditional, serious, performed solo. **[WHS: DEFERRED]** (Pibroch haggis variant candidate). *Direction:* Pibroch variant is all about *rhythm mastery* — her bagpipes play a continuous theme that cycles; hitting beats grants temporary buffs.

- **Ceòl Beag ("little music")** — Popular bagpipe music — marches, reels, jigs, strathspeys. Danced to.

- **Strathspey** — Distinctive Scottish dance rhythm; named for the Strath of the Spey. Unique "snap" rhythm.

- **Reel** — Fast 4/4 dance tune.

- **Jig** — Fast 6/8 dance tune.

- **Slow Air** — Lyrical, melancholic melody.

- **The Clàrsach (Celtic Harp)** — Traditional wire-strung harp. Was *the* national instrument before bagpipes superseded it in the 15th century. Revived in the 20th century. **[WHS: NEW]**. *Direction:* a *Clàrsach* weapon — a harp that fires melodic projectiles on strum intervals.

- **The Fiddle** — Central to Shetland music particularly. Aly Bain is a major figure. **[WHS: SHIPPED]** as unseelie_fiddler enemy. *Deepen:* expand fiddle music into a distinct auditory identity for Shetland/Northeast biomes.

- **Accordion** — Used in ceilidh bands; Jimmy Shand legendary.

- **The Tin Whistle / Penny Whistle** — Folk instrument.

- **The Bodhrán** — Irish frame drum, used in Celtic traditional music.

- **The Practice Chanter** — The small fipple-like flute that bagpipers learn on. **[WHS: referenced in banter]** ("practice chanter's warblin'").

- **Waulking Songs (Òrain-luaidh)** — Women's work-songs sung while hand-waulking (fulling) wet woollen tweed. Rhythmic, communal, Gaelic. Dominant in the Hebrides. **[WHS: NEW]**. *Direction:* a *waulking* rhythm event — players tap to a Gaelic rhythm for buffs. Atmospheric hook for Hebridean biome.

- **Port-à-beul (Mouth Music)** — Wordless/nonsense-syllable singing that substitutes for instruments. Rhythmic, for dancing. Gaelic vocal art. **[WHS: NEW]**. *Direction:* atmospheric music-bed for ceilidh-themed encounters.

- **Gaelic Psalm Singing (Precenting)** — Call-and-response psalm singing in Gaelic; lining out the psalm. Distinctive ornamental style of Free Presbyterian Hebrides. Sounds almost otherworldly.

- **Ceilidh (pron. *kay-lee*)** — Traditional Scottish social gathering with music and dance. Dances include *Dashing White Sergeant*, *Gay Gordons*, *Strip the Willow*, *Canadian Barn Dance*, *Virginia Reel*. **[WHS: SHIPPED]** as ceilidh_caller enemy. *Deepen:* a full ceilidh *event* — enemies force-align into dance formations; the haggis must stay out of the *figure* pattern.

- **Scottish Folk / Contemporary** — The Corries, The Proclaimers, Runrig (Gaelic-rock), Capercaillie, Julie Fowlis, Karine Polwart, King Creosote, Talisk, Peatbog Faeries, Shooglenifty, Wolfstone, Breabach.

- **Bothy Ballads** — Northeast Scotland farmhand-work songs. Doric dialect. Often earthy, comic.

- **Mod (An Comunn Gàidhealach)** — Annual Gaelic music-and-culture festival (since 1891).

### 4.4 Dance & Games

- **Highland Dancing** — Solo virtuoso tradition — *Sword Dance*, *Highland Fling*, *Sailor's Hornpipe*, *Seann Triubhas*. Competitive, precise. **[WHS: SHIPPED]** (Highland Fling as Bagpipe Blast evolution).

- **Country Dancing (Ceilidh Dancing)** — Partner/set dances (see §4.3). Social.

- **Highland Games** — Summer festivals across Scotland:
  - **Caber Toss** — A tapered log (caber), roughly 16–22 ft long, 80–180 lbs, tossed end-over-end for *form* (does it land straight?) not distance. **[WHS: SHIPPED]** as Caber Toss weapon.
  - **Tossing the Sheaf** — A sheaf of hay tossed with a pitchfork over a high bar.
  - **Hammer Throw** — Heavy metal ball on wooden handle, thrown for distance.
  - **Stone Put (Braemar Stone, Open Stone)** — Like shot put but with irregular stone.
  - **Weight-for-Distance / Weight-for-Height** — Throwing a weight (28, 42, or 56 lbs) with one hand.
  - **Tug o' War** — Team rope-pull.
  - **Hill Race** — Uphill foot race.
  - **Solo Piping competitions**.
  - **Highland Dance competitions**.
  - **Historic games**: Braemar Gathering (attended by royals), Cowal Highland Gathering (Dunoon, largest).
- **[WHS: SHIPPED]** partially (Caber). *Direction:* a Highland Games event biome — series of mini-challenges, each buffing the run.

- **Shinty (Camanachd)** — Gaelic stick-and-ball field sport, ancestral to hurling and hockey. Played mostly in the Highlands. Ball can be played in the air, unlike hockey. **[WHS: DEFERRED]** (*Shinty Stick* weapon candidate). *Direction:* reflective melee weapon — deflects enemy projectiles.

- **Curling** — "Scotland's stone game." Slippy-iced stones. Winter Olympics sport. Invented in Scotland. Stones made from granite quarried at Ailsa Craig.

- **Golf** — Invented in Scotland (St Andrews). Royal and Ancient Golf Club.

- **Football (Soccer)** — Rangers/Celtic "Old Firm" rivalry (Glasgow). Scottish Premier League.

- **Rugby** — Borders heartland. Scotland national team at Murrayfield; Calcutta Cup vs England.

- **Munro Bagging** — Climbing all 282 Scottish mountains over 3,000 ft (a *Munro*). Obsessive completionist hobby. **[WHS: NEW]**. *Direction:* a "Munro Bag" meta-achievement system where each biome clear = a Munro.

### 4.5 Festivals & Calendar

- **Hogmanay (31 December)** — Scottish New Year's Eve. Bigger than Christmas traditionally. Traditions: *first-footing* (first visitor after midnight brings coal, shortbread, whisky, silver for luck — ideally a dark-haired man), *Auld Lang Syne* singing at midnight, torch parades. Edinburgh Hogmanay is world-famous; other celebrations include the Stonehaven Fireballs (fire-swinging procession) and the Comrie Flambeaux. **[WHS: NEW]**. *Direction:* a Hogmanay seasonal event — runs during real-world Hogmanay week have a special "first-footer" NPC.

- **Burns Night (25 January)** — Celebrated in honour of Robert Burns. Burns Supper: haggis (piped in), neeps, tatties, whisky, the "Address to a Haggis" (poem) recited, then the haggis ceremonially sliced. Toasts: "The Lassies," "The Laddies," "The Immortal Memory." **[WHS: NEW — MAJOR OPPORTUNITY]**. *Direction:* Burns Night is the most on-theme seasonal event WHS could possibly do. Piped-in haggis as buff; Address to a Haggis as a mid-run quote banter thread.

- **St Andrew's Day (30 November)** — Scotland's patron saint day. Official bank holiday since 2006.

- **Up Helly Aa (last Tuesday of January, Lerwick, Shetland)** — Viking fire festival. Dressed as Vikings, parade through Lerwick, burn a 30-ft Viking longship. **[WHS: NEW]**. *Direction:* a Shetland-biome Viking-fire event.

- **Beltane (1 May / 30 April Evening)** — Ancient Celtic May Day festival. Edinburgh's Beltane Fire Festival revived 1988 on Calton Hill — painted fire-dancers, the May Queen, the Green Man. Cailleach transforms into the May Queen on this day. **[WHS: NEW]**. *Direction:* seasonal Beltane event — Cailleach variant gets young-aspect transformation; fire-hazards are pacified.

- **Samhain (1 November / 31 October Evening)** — Celtic/Gaelic origin of Halloween. Traditionally a time when the veil between worlds thins. Cailleach reverts to her winter aspect. **[WHS: NEW]**.

- **Edinburgh Festival Fringe** (August) — Largest arts festival in the world. Month-long explosion of theatre, comedy, music.

- **Edinburgh Military Tattoo** (August) — Parade of military bands on Edinburgh Castle esplanade. Pipers and drummers from around the world.

- **Imbolc (1–2 February)** — Celtic start of spring. Saint Brigid's Day. **[WHS: NEW]**.

- **Lammas / Lùnastal (1 August)** — Harvest start.

### 4.6 Dress, Symbols & Material Culture

- **Kilt** — Knee-length garment (originally the *great kilt*, an 18-foot length of tartan belted at the waist and thrown over the shoulder; the modern *small kilt* is the lower half only). **[WHS: SHIPPED]** as Kilt passive.

- **Tartan** — Woven-pattern cloth with crossing bands of colour. Clan-specific designs codified from 1822 onward (pre-Romantic revival, tartans were regional and individual weaver-specific). Sett (pattern). Notable: Royal Stewart (Royal tartan), Black Watch (military), Hunting Stewart. **[WHS: SHIPPED]** as Tartan Sash passive + procedural tartan rendering.

- **Sporran** — Pouch worn at the front of the kilt (because the kilt has no pockets). Often decorated with fur and metalwork. **[WHS: SHIPPED]** as Sporran passive.

- **Sgian Dubh (pron. *ski-an doo*, "black knife")** — Small single-edged knife worn in the stocking-top. Ceremonial now; was once everyday. **[WHS: DEFERRED]** (weapon candidate noted).

- **Dirk** — Longer fighting knife. **[WHS: DEFERRED]** (weapon candidate — *Dirk Dance*).

- **Claymore (Claidheamh-Mòr, "great sword")** — Two-handed sword of the Scottish Highlanders. Iconic medieval weapon. Also a later basket-hilted broadsword. **[WHS: SHIPPED]** as Claymore weapon.

- **Ghillies** (dance shoes) — Soft leather shoes with criss-cross laces.

- **Tam o' Shanter** — Flat bonnet with a red *toorie* (bobble) on top. Named after Burns's character. **[WHS: SHIPPED]** as Tam o'Shanter passive.

- **Glengarry** — Narrow boat-shaped military cap. Often with a pair of ribbons trailing behind.

- **Balmoral** — Flat round bonnet without a bobble.

- **Hose (stockings)** — Long knee-socks worn with kilt.

- **Flashes** — Tartan ribbons holding up the hose.

- **The Sporran Chains** — Silver chain on a dress sporran.

- **Hagstones** — Stones with naturally-occurring holes; seen as magical. Hung in doorways for protection. **[WHS: NEW]**.

- **Clootie Tree** — A tree at a holy well (typically) on which rags (*cloots*) are tied as prayers; common at pre-Christian healing wells. **[WHS: NEW]** *Direction:* a *Clootie Tree* landmark — tie a "rag" (lose a max-HP point) to gain a run-long buff.

- **The Saltire (St Andrew's Cross)** — White diagonal X on blue. National flag.

- **The Lion Rampant** — Red lion on gold, Royal Banner of Scotland.

### 4.7 Language — Scots and Gaelic

Scotland has three indigenous languages: **English** (majority), **Scots** (Lowland Germanic, sister of English), and **Scottish Gaelic (Gàidhlig)** (Celtic, related to Irish and Manx).

#### Scots — A Curated Glossary (gazetteer)

**Greetings / state of being:**
- **Aye** — Yes.
- **Naw** — No.
- **Ken** — Know. ("Ah ken," "ye ken.")
- **Dinnae** — Don't.
- **Cannae** — Can't.
- **Willnae** — Won't.
- **Mair** — More.
- **Wee** — Small, little. (Universal.)
- **Muckle** — Big, large.
- **Braw** — Fine, handsome, good.
- **Bonnie** — Pretty, beautiful.

**Weather / atmosphere:**
- **Dreich** — Dreary, dull, damp, grey. *The* Scottish word for weather.
- **Taps aff** — Shirts off (hot weather).
- **Coorie** — To nestle in for warmth.
- **Scunner** — A feeling of disgust or tedium; a nuisance.
- **Smirr** — Fine drizzle.
- **Haar** — Cold sea-fog (East coast).

**People / emotions:**
- **Bairn / Wean** — Child. (Bairn: Edinburgh/East. Wean: Glasgow/West.)
- **Loon / Quine** — Young man / young woman (Aberdeenshire Doric).
- **Eejit** — Idiot. Affectionate.
- **Numpty** — Mild-to-medium idiot.
- **Bawbag** — Strong insult or sometimes affectionate abuse.
- **Bampot** — Crazy person.
- **Boggin' / Bogging** — Disgusting.
- **Minging / Mingin'** — Disgusting, ugly.
- **Tube** — Idiot.
- **Roaster** — Fool.
- **Rocket** — Fool.
- **Radge** — Wild, angry, mad.
- **Bawbag / Walloper / Bam** — Insults (escalating).
- **Glaikit** — Stupid, dim-witted.
- **Dobber** — Idiot.

**Home / community:**
- **Hame** — Home.
- **Wee yin** — Small one / young child.
- **Cuddies** — Horses.
- **Doon** — Down. "Doon the Watter" — a trip to the Clyde coast.
- **Oot** — Out.
- **Roon** — Round.
- **Tae** — To.
- **Fae** — From.

**Food / drink / life:**
- **Breeks** — Trousers.
- **Jammies** — Pyjamas.
- **Scran** — Food.
- **Pieces** — Sandwiches.
- **A wee nip** — A small drink (whisky).
- **Stoatin'** — Drunk.
- **Steamin'** — Very drunk.
- **Blootered / Pished / Bladdered** — Drunk (more strong).
- **Fankle** — Tangle.
- **Shoogly** — Wobbly, shaky. (A *shoogly peg* = on thin ice.)

**Landscape:**
- **Brae** — Hillside. **[WHS: SHIPPED]** in route name.
- **Glen** — Valley.
- **Strath** — Broad river valley.
- **Kyle** — Strait of water.
- **Ben** — Mountain.
- **Loch** — Lake or sea-inlet.
- **Mull** — Promontory.
- **Wynd / Close** — Narrow Edinburgh alley.
- **Burn** — Small stream.
- **Firth** — Estuary.
- **Carse** — Flat river-valley land.
- **Moor** — Open upland. **[WHS: SHIPPED]**.
- **Heath / Heather-moor** — Heather-covered open ground.
- **Machair** — Gaelic word for coastal grassland (Hebrides).

**Misc indispensable:**
- **Gie it laldy** — Give it your all.
- **Awa' an bile yer heid** — Away and boil your head (dismissal, comic).
- **Haud yer wheesht** — Hold your quiet / shush.
- **Mind how ye go** — Take care.
- **Gonnae no dae that** — Could you not do that? (Limmy/Chewin' the Fat).
- **Ya beauty!** — Expression of success.
- **Awright!** — Hello (aggressive).
- **How's it gaun?** — How are you?
- **Cheerio!** — Goodbye.
- **Slàinte mhath** (pron. *slan-juh va*) — "Good health" (Gaelic toast).

#### Scottish Gaelic (Gàidhlig) — Key Words

- **Ceud mìle fàilte** (pron. *kayd mee-leh fal-cheh*) — "A hundred thousand welcomes."
- **Alba** — Scotland.
- **Gàidhlig** — Gaelic.
- **Uisge** — Water. (Hence *uisge beatha* — water of life — whisky.)
- **Beatha** — Life.
- **Loch** — Lake.
- **Ben (Beinn)** — Mountain.
- **Glen (Gleann)** — Valley.
- **Eilean** — Island.
- **Bràthair** — Brother.
- **Piuthar** — Sister.
- **Athair** — Father.
- **Màthair** — Mother.
- **Seann** — Old.
- **Òg** — Young.
- **Dubh** — Black.
- **Geal** — White.
- **Dearg** — Red.
- **Gorm** — Blue.
- **Buidhe** — Yellow.
- **Madadh-allaidh** — Wolf.
- **Cù** — Dog.
- **Cat** — Cat.
- **Each** — Horse.
- **Bàta** — Boat.
- **Là math dhut** — "Good day to you."
- **Oidhche mhath** — "Good night."

*(Notes: Gaelic place names give the Highlands their poetry. "Inver-" = river-mouth (Inverness, Inveraray). "Dun-" = fort (Dunbar, Dundee). "Bal-" = farm (Ballater). "Kil-" = church (Kilmarnock). "Kin-" = head of (Kinloch).)*

### 4.8 Characteristic Sayings & Scottish Wit

- "Nemo me impune lacessit" — "No-one provokes me with impunity." Scotland's motto (in Latin on coins).
- "Lang may yer lum reek" — "Long may your chimney smoke" — a blessing wishing prosperity.
- "Yer tea's oot" — "Your dinner's ready" (spoken sharply by mothers).
- "Yer arse is hingin' oot the windae" — "Your situation is dire."
- "Awa' an dinnae mak' a fuss" — "Go away and don't make a fuss."
- "Mony a mickle maks a muckle" — "Many small things make a big thing" (financial wisdom).
- "We're a' Jock Tamson's bairns" — "We're all children of the same father" (egalitarian sentiment).
- "If it's nae Scottish, it's crap" — *Saturday Night Live* sketch that (unbelievably) landed as beloved in Scotland.
- "Haud me back" — "Hold me back" (comic mock-aggression).
- "It's a sair fecht" — "It's a hard struggle."

### 4.9 Archetypes & Stock Characters

Scottish popular culture relies on recognisable archetypes — useful for enemy/NPC design:

- **The Wee Wifey** — Small, sharp-tongued elder woman. Harmless-looking, utterly formidable. **[WHS: SHIPPED in Gran direction]**.
- **The Auld Yin** — Old man at the pub, wisdom-dispenser.
- **The Hard Man** — Glasgow tough; all posture, often honourable underneath. **[WHS: SHIPPED]** (angry_scotsman, glaswegian).
- **The Laird** — Landed gentry. Posh accent, tweed. **[WHS: SHIPPED]** as Laird boss + variant.
- **The Ghillie** — Landowner's gamekeeper/guide. Taciturn, outdoorsy.
- **The Crofter** — Small farm-holder. Proud, self-sufficient.
- **The Ned** — Glasgow hooligan. **[WHS: SHIPPED]** (buckfast_ned).
- **The Weegie** (Glaswegian) / **The Edinburger** — Mutual city rivalry.
- **The Teuchter** — Sometimes-affectionate, sometimes-dismissive term for a Highlander (from urban Lowland perspective).
- **The Sassenach** — "Saxon" / outsider / English person.

---

## Part 5 — WHS Content Mining

This is where the research pays off. Below, every significant entry from Parts 1–4 is cross-referenced into concrete content opportunities, grouped by WHS system. Think of this as a *menu of pitches* — specs and plans will cherry-pick, deepen, and discard as needed.

### 5.1 New Enemy Candidates

Grouped by thematic family. All entries are **[WHS: NEW]** unless noted.

**Water-spirit family** (expand the Loch biome):
| Name | Behaviour | Unique Mechanic | Source |
|---|---|---|---|
| Each-uisge | Shapeshift-chase | Transforms horse↔man mid-run; man form is faster but dies in one hit | §1.1 |
| Shellycoat | Harass | Doesn't damage directly — steals XP gems and relocates them | §1.1 |
| Ceasg | Boon | Non-hostile; offers 3 wishes if caught without violence | §1.1 |
| Marool | Night-hazard | Glowing anglerfish; projects sight-cones revealing player position to other enemies | §1.1 |
| Boobrie | Flying harasser | Cattle-thief; steals gold, flies off — kill or lose pickups | §1.1 |
| Fuath-swarm | Swarm | Amorphous dark-water blob; slow-melt melee; spawn in bog | §1.1 (taxonomy) |

**Land-spirit & fae family**:
| Name | Behaviour | Unique Mechanic | Source |
|---|---|---|---|
| Ghillie Dhu | Friendly encounter | Appears if player doesn't move for 30s in birch-patch; grants forest boon | §1.2 |
| Bean-Nighe | Omen NPC | Washing ghost-woman at a ford; her presence warns of incoming hard wave | §1.2 |
| Baobhan Sith | Seducer-vampire | Forces player to orbit her for 5s before striking | §1.2 |
| Bodach Glas (Grey Man) | Silhouette-only | Only ever appears as a huge far-silhouette; proximity slows player | §1.2 |
| Cu Sith | Triple-bay | 3 howls cumulatively buff it; the third triggers deadly charge | §1.2 |
| Cat Sith | Samhain-seasonal | Drinks from healing circles if left untouched; grants luck if it does | §1.2 |
| Beithir | Race-timer serpent | Stings player; race to a healing circle before timer expires | §1.2 |
| Fachan | Asymmetric elite | Always rotates clockwise, always strikes from one side | §1.2 |
| The Pech | Stone-guardian | Spawns from circled standing stones; brews heather ale (buff pickup) | §1.2 |

**Ghost & omen family**:
| Name | Behaviour | Unique Mechanic | Source |
|---|---|---|---|
| The Green Lady | Mini-boss | Cries periodically — each cry heals enemies and spawns adds | §1.4 |
| Headless Horseman | Dive-charge | Fast-moving rider; drops a headless-rider pickup (+1 revive) | §1.4 |
| The Lone Piper (ambient) | Easter egg | Ghostly pipes heard faintly underground; following sound reveals chest | §1.4 |
| Earl Beardie (card-wager) | Event NPC | Plays cards for upgrade-swap wager | §1.4 |
| Wild Hunt (event) | Screen-crossing wave | 10s ghost-procession; contact = instant hit; ignoring = big XP | §1.4 |
| Spunkies (will-o'-wisps) | Bog decoy | Floating lights; some real (XP), some lures (ambush) | §1.4 |
| Fetch (Doppelganger) | Rare mirror | Rare enemy with your current build; drops huge reward on kill | §1.4 |

**Clan-era & historical family** (fill the Jacobite/Culloden/Glen Coe gap):
| Name | Behaviour | Notes | Source |
|---|---|---|---|
| Covenanter ghost | Chase | "Killing Times" moor-ghost; wears Presbyterian black | §3.3 |
| Jacobite spectre | Wave-enemy | Rises at Culloden-themed biome | §3.4 |
| Redcoat wraith | Ranged | Musket-volley enemy at Jacobite biomes | §3.4 |
| MacDonald revenant | Glencoe event | Rises at massacre-echo event (handle respectfully) | §3.5 |
| Campbell betrayer | Shadow-ally | Appears friendly, betrays at low HP | §3.5 |
| Black Douglas | Namegiver boss | "Hush ye, the Black Douglas will not get ye" | §3.2 |

**Industrial-Clyde family** (fill the shipbuilding gap):
| Name | Behaviour | Notes | Source |
|---|---|---|---|
| Riveter | Melee | Shipyard worker wielding a riveting hammer | §3.6 |
| Crane-shadow | Hazard | Moving crane-silhouette sweep; must dodge | §3.6 |
| Steam spectre | Fog-cloud melee | Steam leaking from industrial pipes | §3.6 |
| Furnace-glow | AoE pulse | Glasgow blast-furnace flare | §3.6 |

**Modern-Scotland family** (expand urban Glesga):
| Name | Behaviour | Notes | Source |
|---|---|---|---|
| Chippy Seagull | Flying swoop | Swoops to steal Scotch Pie pickups | §4.1, §3.6 anecdote |
| Taxi Black Hack | Chase-charge | Glasgow black-cab spectre | *modern* |
| Tram-ghost (Edinburgh) | Rail-bound | Follows fixed path; hit-or-miss | *modern* |
| Festival Performer | Ranged | Flyer-chucking Fringe comedian | §4.5 |
| Munro-Bagger Tourist | Elite | Obsessive climber; drops a map-relic | §4.4 |

**Neolithic/ancient family** (fill the pre-Celtic gap):
| Name | Behaviour | Notes | Source |
|---|---|---|---|
| Pictish Beast | Cryptid | The carved unidentified-creature from Pictish stones | §3.1 |
| Standing-Stone Giant | Rare elite | A stone giant who walks when approached | §1.8 Callanish |
| Neolithic Hunter ghost | Skulk | Silent stalker, spear-throw | §2.7 Skara Brae |
| Viking raider | Coastal wave | Horned-helm shadow-axe rushers | §3.1 |

### 5.2 New Boss Candidates

| Boss | Concept | Where | Source |
|---|---|---|---|
| **The Cailleach of the Storm** | Winter-crone weather-boss | Cairngorm Plateau biome | §1.3 — noted deferred |
| **Nuckelavee** | Skinless man-horse with breath-aura debuff | Shetland / North Coast | §1.1 |
| **Nicnevin, Queen of Witches** | Unseelie-court final boss | Fae Court biome | §1.3 |
| **Stoor Worm** | Giant sea-serpent climbable | Secret final-final | §1.1 |
| **Cirein-cròin** | Scale-shift beast | Secret deep-loch | §1.1 |
| **The Ninth Legion** | Lost Roman legionaries | Borders biome | §3.1 |
| **The Monster of Glamis** *(Soul-risky)* | Sealed-family-secret grotesque | Glamis-themed ruin | §1.4 — soften or skip |
| **Macbeth** *(historical)* | Shakespeare-inversion boss who defends his kingship | Castle biome | §3.1 |
| **The Duke of Cumberland ("The Butcher")** *(historical, Soul-risky)* | Jacobite-crushing English general | Culloden biome | §3.4 |
| **The Campbell** *(archetype, Soul-risky)* | Clan-feud boss representing Glen Coe betrayal | Glen Coe biome | §3.5 |
| **The Wicker Haggis** | Living-wicker effigy | Bog | Noted deferred |
| **The Auld Reekie Ghaist** | Edinburgh smog-spirit | Old Town | Noted deferred |
| **Earl Beardie / The Devil's Cards** | Card-wager mini-boss | Glamis-themed | §1.4 |
| **Father Taxman** | Already-deferred; Covenanter-bureaucrat fusion | Endgame | Noted deferred |
| **The Brahan Seer** *(friendly final?)* | Prophesies the ending | Secret route | §1.6 |

### 5.3 New Weapon Candidates

Grouped by archetype.

**Bladed/Melee:**
| Name | Mechanic | Evolution Paired With | Source |
|---|---|---|---|
| Sgian Dubh | Fast crit-dagger, close-range | Tartan Sash | §4.6 — noted deferred |
| Dirk Dance | 3-hit combo, bleed | Whisky Flask | Noted deferred |
| Lochaber Axe | Heavy sweep + pull | Highland Shield | §4.6 |
| Basket-Hilt Claymore (dress) | Alt Claymore style | *evolves into* Royal Stewart Charge | §4.6 |
| Shinty Stick | Reflect-melee, deflects projectiles | Thistle Crown | §4.4 — noted deferred |
| Stag Antler | Dash-attack weapon | Loch Water | Noted deferred |

**Ranged / projectile:**
| Name | Mechanic | Source |
|---|---|---|
| Whisky Flask (throw) | Lobbed molotov + burn puddle | §4.2 — noted deferred |
| Heather Ale Keg | Throws, bursts into drunk-cloud | §1.2, §4.2 |
| Long-Bow of Yew | Pierce projectile with charge-up | Archer archetype |
| Waulking Mallet | Rhythmic throw, gains bonus on beat | §4.3 |

**Music-powered:**
| Name | Mechanic | Source |
|---|---|---|
| Bagpipe Drone | Aura slow | Noted deferred |
| Pibroch Chanter | Slow-building theme: reaches climax for devastating AoE | §4.3 |
| Clàrsach (Celtic Harp) | Melodic projectiles on strum intervals | §4.3 |
| Fiddle of the Unseelie | Enemies forced to orbit when played | §4.3 |
| Practice Chanter | Tiny ranged sting; starter weapon for Pibroch variant | §4.3 |
| Port-à-Beul Chant | Pure vocal — area slow that follows player | §4.3 |
| Bodhrán Drum | Beat-based AoE pulse | §4.3 |

**Faerie-themed:**
| Name | Mechanic | Source |
|---|---|---|
| Selkie Song | Charm enemy temporarily (fights for you) | §1.1, noted deferred |
| Grannie's Curse (Witch Hex) | Homing hex-projectile | Noted deferred |
| Clootie Rag | Bleed DoT aura | §4.6, noted deferred |
| Hagstone Sling | Hurls a hagstone; enemies through the hole take bonus damage | §4.6 |
| Fingal's Horn | Summons 3 Fianna-warrior allies for 10s | §1.6 |
| Wallace Sword | Giant two-hander; slow, devastating sweep | §3.2 |

**Elemental/weather:**
| Name | Mechanic | Source |
|---|---|---|
| Coastal Storm | Screen-wide AoE ult | Noted deferred |
| Haar's Gift (Fog) | Fog trail that blinds enemies | §2.9 |
| Smirr of Thistles | Drizzle of thistle-bolts overhead | §4.9 / §2.9 |
| Lightning Cairn | Thor-esque charged melee | §3.1 |

**Industrial / Clyde:**
| Name | Mechanic | Source |
|---|---|---|
| Steam Engine (Watt) | AoE pulse with chimney-smoke | §3.6 |
| Riveter's Hammer | Armour-piercing melee | §3.6 |
| Shipwright's Saw | Rotating AoE | §3.6 |

**Food weapons** (comic tradition in survivor-likes):
| Name | Mechanic | Source |
|---|---|---|
| Cullen Skink Ladle | Sloshing AoE broth that slows enemies | §4.1 |
| Flying Porridge | Thrown porridge-pot explodes into oatmeal | §4.1 |
| Deep-Fried Mars Bar | Absurdist heavy projectile; comedy proc | §4.1 |
| Cranachan Splash | Raspberry-whisky projectile with lifesteal | §4.1 |

### 5.4 New Passives & Relics

**Passives (Curios) — new additions beyond the existing 9:**

| Name | Effect | Source |
|---|---|---|
| Hagstone Pendant | Enemies hit while "aligned" (through centre) take +40% damage | §4.6 |
| Clootie Rag (worn) | Lifesteal doubled for 5s after taking damage | §4.6 |
| Heather Crown | +lucky heather synergy / lucky pickups | §1.7 / §2.9 |
| Broonie's Cream (carried) | +gold pickup radius; the brownie must be "fed" between routes | §1.2 |
| Gran's Shawl | Self-revive with 50% HP, once per run | §3.8 (hearth-voice icon) |
| Drambuie (carried) | Scales with Whisky Flask — bonus burn damage | §4.2 |
| Flora MacDonald's Plaid | Grants a 2s invincibility window once per minute | §3.4 |
| Pictish Stone (carried) | Mysterious carved stone; +crit + +mystery (random small buff on kill) | §3.1 |
| Saltire Pin | +damage to English/Hanoverian enemies (if added) | §1.7 |
| Tartan of [Clan] | Clan-specific buff bundle — Stewart (HP), Campbell (attack speed, but Glencoe-adjacent debuff), Fraser (crit), Cameron (damage), MacGregor (outlaw's +luck) | §3.5 |
| Heather Ale Skin | Drunk-buff: damage +, accuracy - (comic trade) | §1.2, §4.2 |
| Oatcake | Cheap pickup — small heal | §4.1 |
| Shortbread | Medium pickup — medium heal | §4.1 |
| Tunnock's Wafer | Iconic pickup — medium heal with tactile "crunch" SFX | §4.1 |

**Relics (new tier — see roguelite research doc):**

| Name | Effect | Source |
|---|---|---|
| Stone of Destiny | Massive HP boost; sit on it in Gran's Croft between runs | §3.2 |
| Wallace's Sword (relic form) | +damage to elites; slower movement | §3.2 |
| Mons Meg (medieval cannon) | Rare super-heavy artillery ability | §2.6 — Edinburgh Castle |
| Fingal's Horn | Summons allies (see weapon list) — could be relic variant | §1.6 |
| The Brahan Seer's Crystal | Reveals next wave/boss | §1.6 |
| Bruce's Cave (relic) | Revive token once per run | §3.2 |
| Columba's Staff | Bless attack — turns next boss briefly peaceful | §3.1 |
| Prince Charlie's Pocket Mirror | Random effect per pickup | §3.4 |
| Deirdre's Tear | Converts excess max HP into damage | §1.6 |
| Thomas the Rhymer's Harp | Allows one banter choice to alter outcome | §1.6 |
| Crowning Circlet (Scone) | +all stats on final boss fight | §3.2 |
| Highland Clearance Flag *(Soul-risky)* | Massive buff, tragic banter; use once per variant | §3.4 |
| Stone of the Seer (Bell) | Reveals chest + relic positions | §1.8 |
| Sampo *(Noita reference, already-coded roguelite)* | See roguelite doc |

### 5.5 New Biome Candidates

Consolidated from geography research:

| Biome | Palette | Signature Hazard | Signature Enemy | Source |
|---|---|---|---|---|
| **Cairngorm Plateau** | White/grey, cloud-grey | Whiteout visibility, wind-push | Bodach Glas, Ptarmigan elite | §1.2, §2.2 |
| **Glen Coe** | Dark slate, snow patches | Avalanche drop-zone | MacDonald revenants (respectfully) | §2.2, §3.5 |
| **Ben Nevis Summit** | Granite grey, thin-air blue | Cliff-edge instant-death borders | Cloud spirits | §2.2 |
| **The Cuillin (Skye)** | Black + red alternating | Scree-slide slow-tiles | Cuillin goblins | §2.2 |
| **Skye Fairy Pools** | Aquamarine, white rock | Buff/debuff pool-tiles | Ghillie Dhu (friendly) | §2.2 (deferred) |
| **Loch Ness (deep water)** | Peat-brown dark | Low visibility, Nessie fin-silhouette | Nessie, Blue Men | §2.1 |
| **Callanish Stones (Lewis)** | Twilight purple | Stones that fire laser-beams | Pech guardians | §1.8 |
| **Orkney Neolithic** | Wind-swept green, stone | Stone-circle trap-zones | Pictish Beast | §2.7 |
| **Edinburgh Old Town** | Soot-grey, amber lamps | Narrow-close kill-corridors | Close-dwellers, tourist throng | §2.5, noted deferred |
| **Glasgow Close** | Sodium-amber flicker | Flicker visibility, bin-lorry hazards | Urban ghaists | Noted deferred |
| **Clyde Shipyard** | Rust-red, steel-grey | Crane-sweep, sparks | Riveters, Steam spectres | §3.6 |
| **Hebridean Machair** | White sand, wildflower | Rolling tide boundary | Selkie, Shellycoat | §2.3 |
| **Iona Peaceful Isle** | Soft gold, sea-blue | No combat — puzzle biome | St Columba-blessed fauna | §2.3 |
| **Jacobite Moor (Culloden)** | Sombre grey-purple | Rain of musket-volleys | Jacobite + Redcoat spectres | §3.4 |
| **Trossachs Forest** | Emerald, bluebell | Fog-cover reveal moments | Rob Roy + forest outlaws | §2.1, §3.4 |
| **Buchan/Doric North-East** | Grain-gold, sea-grey | Granite-cliff fall hazard | Bothy-ballad ghosts | §2.5 |
| **Arran (Scotland in miniature)** | All palettes mixed | Biome-shift mid-run | All of above in miniature | §2.3 |
| **St Kilda (evacuated)** | Lonely green, bird-cliffs | Seabird-swarm waves | Cultural-ghost villagers | §2.3 (handle respectfully) |
| **Fingal's Cave (Staffa)** | Basalt hexagons, sea-echo | Acoustic damage zones | Giants' remnants | §2.3 |
| **The Moor (existing) at Gloaming** | Twilight-purple | Extended visibility reversal | Seelie Court procession | §2.9 |
| **Beltane Fire Festival (Calton Hill)** | Vermillion, bonfire-gold | Fire-pillar hazards | May Queen + Green Man | §4.5 |
| **The Corryvreckan** | Sea-green + foam-white | Whirlpool pull-tile | Cailleach's washing-aspect | §1.8 |

### 5.6 New Hazards & Environmental Elements

| Hazard | Behaviour | Biome | Source |
|---|---|---|---|
| **Peat-bog sinkhole** | Slow-pull circle | Bog | §2.9 |
| **Haar roll-in** (existing deepened) | Fog-sheet sweeps biome edge-to-edge | Coastal | §2.9 |
| **Heather patch** (burn-accelerant) | Non-damaging; carries fire | Moor | §2.9 |
| **Standing-stone beam** | Callanish stones fire aligned beams | Neolithic | §1.8 |
| **Corryvreckan whirlpool** | Pulls player/enemies | Coastal | §1.8 |
| **Midge-cloud** (existing — expand) | Visibility-reducing swarm-cloud | West Highlands | §2.9 |
| **Bracken copper-turn** (visual event) | Landscape colour-shift during run | Autumn moor | §2.9 |
| **Smirr** (fine drizzle) | Visibility down; increases pickup radius | All biomes | §2.9 |
| **Simmer Dim** (midnight-sun twilight) | Summer-solstice biome effect | Shetland | §2.9 |
| **Clootie Tree** | Landmark; sacrifice max HP for buff | Moor crossroads | §4.6 |
| **Crannog** (lake-dwelling remains) | Small-island pickup concentrator | Loch Tay biome | §2.1 |
| **Crofter's Croft Ruin** | Walls granting cover but burning | Clearances biome | §3.4 |
| **Tumbling Sea-Stack** | Vertical obstacle with timed collapse | Duncansby biome | §2.8 |
| **Pictish Stone Shrine** | Circle 3 times for buff | Across biomes | §3.1 |
| **Holy Well** | Drink once for max-HP boost | Celtic Christian biome | §3.1 |
| **Viking Longship (burning)** | Up Helly Aa event hazard | Shetland | §4.5 |
| **Beltane Bonfire** | Buff-grant fire; damage-grant fire based on pass-through speed | Beltane event | §4.5 |
| **Hogmanay Bell Tower** | Countdown sequence for midnight-event buffs | Hogmanay event | §4.5 |
| **Tartan Bolts of Cloth** | Walking into one wraps haggis temporarily in clan-buff | Weaver's Mill | §3.5, §4.6 |

### 5.7 New Routes, Events, & Moor Road Nodes

**New route candidates (each a modifier-delta + onResume side effect):**

| Route | Picker | Effect | Source |
|---|---|---|---|
| **To the Laird's Manor** | A | +elite spawns, guaranteed boss-chest | §3.8 |
| **Up the Ben** | A | Slower XP, gradually-rising damage | §2.2 |
| **Across the Firth** | A | Short swim sequence — must outrun a rising tide | §2.1, §2.4 |
| **Down the Wynd (Edinburgh)** | B | Dense urban waves; close quarters | §2.5 |
| **The Old Kirkyard** | B (already shipped — deepen) | — | §2.9, §3.3 |
| **Burns Night Supper** | Seasonal | Haggis-themed buffs all run | §4.5 |
| **Beltane Revel** | Seasonal | Fire-buff | §4.5 |
| **Hogmanay First-Footing** | Seasonal | Dark-haired haggis starts with extra shortbread + whisky + coal | §4.5 |
| **The Massacre Echo (Glen Coe)** | Hidden | Sombre; high XP; banter hollow | §3.5 (respectfully) |
| **Tam o' Shanter's Ride** | Burns-themed | Fleeing the witches; speed-buff + chase wave | §3.7 |
| **Cruising to Skye** | Seasonal | Gentler run; biome visuals | §3.4 Flora |
| **Robert the Bruce's Cave** | Hidden | Spider-try-again revival mechanic | §3.2 |

**Wee events (between-route encounters):**

| Event | Effect | Source |
|---|---|---|
| **A Bean-Nighe at the Ford** | Her presence warns of incoming hard wave; choose to consult (tell future) or pass | §1.2 |
| **A Wee Trader** | Spend gold on random passive | §2 (general) |
| **The Ghillie Dhu's Clearing** | Stand still 30s for boon | §1.2 |
| **Clootie Tree** | Sacrifice max-HP for run-long buff | §4.6 |
| **The Brahan Seer's Prophecy** | Accept quest; complete for reward | §1.6 |
| **Earl Beardie's Card Game** | Wager an upgrade for better or worse | §1.4 |
| **Whuppity Stoorie's Riddle** | Guess faerie's name from banter clues | §1.6 |
| **Broonie's Bowl of Cream** | Leave offering for permanent-run gold-trickle | §1.2 |
| **The Corryvreckan's Edge** | Survive a pull-toward-whirlpool challenge | §1.8 |
| **Columba's Blessing** | Next boss is briefly pacified | §3.1 |
| **A Clan Gathering** | Meet an NPC clan-chief; get clan-tartan passive | §3.5 |
| **A Crofter's Blessing** | Small HP refill + emotional banter | §3.4 |

### 5.8 New Haggis Variants

From the research, with stronger Scottish-cultural grounding than the current roster:

| Variant | Concept / Constraint | Source |
|---|---|---|
| **The Hebridean Haggis** | Starts in Hebridean Machair biome; speaks Gaelic banter; waulking-song buffs | §2.3, §4.7 |
| **The Pibroch Haggis** | Rhythm-master; bagpipe beats grant buffs on-beat | §4.3 — noted deferred |
| **Burns's Wee Beastie** | "Wee, sleekit, cow'rin, tim'rous beastie" — small sprite, huge crit; Burns-quote banter | §3.7 |
| **The Witch's Hare** | Isobel-Gowdie-inspired; shapeshifts into a hare (dash = invincible hop) | §1.5 |
| **The Pict** | Tattooed haggis from pre-Gaelic Scotland; no shop — relies on loot | §3.1 |
| **The Jacobite** | Starts with Flora MacDonald's plaid; Bonnie-Prince-styled haggis | §3.4 |
| **The Covenanter** | Black-cloaked; resists hex/curse; presses back the Killing Times | §3.3 |
| **Gran's Best** | Bonus damage when low HP; Gran's voice audible throughout | §3.8 |
| **The Clan Chief** | Leads a wee pack of 2-3 clan-haggis minions | §3.5 |
| **The Sassenach** *(self-mocking)* | Starts with zero Scottish items; must collect culture to buff | §4.9 |
| **The Brownie** | Non-violent variant; steals from enemies instead of killing | §1.2 |
| **The Shinty Striker** | Melee-focused; shinty stick starting weapon | §4.4 |
| **The Enlightenment Philosopher** | Adam Smith sash; gold-currency boosts all stats | §3.6 |

### 5.9 Banter Threads

Scottish material rich enough for ~50 banter threads. Highlights:

**Burns quotations** (literal or paraphrased; gold for haggis-themed banter):
- "Wee, sleekit, cow'rin, tim'rous beastie" (To a Mouse) — variant banter for Burns's Wee Beastie.
- "O my luve's like a red, red rose" (A Red, Red Rose) — love-themed pickup banter.
- "The best-laid schemes o' mice an' men gang aft a-gley" — on death.
- "Auld Lang Syne" — Hogmanay event banter.
- "Fair fa' your honest, sonsie face, great chieftain o' the puddin'-race!" (Address to a Haggis) — protagonist self-addressed banter at level-up.
- "A man's a man for a' that" — class-transcending moment banter.

**Folklore-referencing banter**:
- "Dinnae trust a horse by a loch" (kelpie avoidance).
- "Leave the cream out, mind, else the brownie leaves" (Broonie event).
- "Hear the washer at the ford? Run." (Bean-Nighe encounter).
- "The wee folk dinnae like iron — keep yer sgian dubh handy" (fae-combat tip).
- "Three bays o' the Cu Sith, and you're deid" (Cu Sith warning).

**Gran commentary**:
- "Aye well, at least ye made it past Gordon this time. Cuppa?" (post-run).
- "Dinnae dae that, ye great numpty" (on bad play).
- "Mind ye, yer grandpa wis jus' like ye" (narrative lineage).
- "See when I wis yer age, we had tae walk tae the moor, both ways, uphill" (comic).
- "Put on yer kilt. It's taps aff weather out there, mind" (seasonal).

**Limmy-edge style**:
- "Yir dashin aboot like a wee radge" (mockery).
- "Ye died. Again." (deadpan).
- "Did ye… no' see the lava there?" (flat stare).

**Still-Game hearth style**:
- "Aye, yon haggis is faring braw, eh Victor?" (proud).
- "It's a sair fecht, but ye've got pluck" (encouragement).
- "Come oan noo, ye can dae better than yon" (gentle push).

**Seasonal banter**:
- Burns Night: "Address yer haggis, laddie."
- Hogmanay: "Lang may yer lum reek."
- Beltane: "Gie it laldy at the fire."
- Up Helly Aa: "The Vikings are back in toon."
- Samhain: "Watch fer the Cat Sith."

### 5.10 Seasonal Events

A full seasonal content rotation from the festivals:

| Event | Date-window | Mechanical Twist | Source |
|---|---|---|---|
| **Hogmanay (New Year)** | Last week of December | First-footer NPC; bonus shortbread/whisky/coal; fireworks VFX | §4.5 |
| **Burns Night** | 25 Jan ± 7 days | Haggis-themed buffs all run; Address-to-a-Haggis banter | §4.5 |
| **Up Helly Aa (Shetland Viking)** | Last Tue Jan | Viking-themed biome unlock; longship burn event | §4.5 |
| **Beltane** | 1 May ± 3 days | Cailleach transforms to May Queen; fire buffs | §4.5 |
| **Samhain (Halloween)** | 31 Oct – 1 Nov | Cat Sith appears; Wild Hunt event; veil-thinning banter | §4.5 |
| **Summer Solstice (Simmer Dim)** | 21 Jun | Endless-twilight Shetland biome | §2.9 |
| **Highland Games Season** | Summer (flex) | Mini-game event with caber/hammer/stone | §4.4 |
| **Bracken-Turn Autumn** | Oct-Nov | Moor palette shifts; XP bonus | §2.9 |

### 5.11 Music Cues & Audio Texture

Procedural music deepening via Scottish forms:

| Cue / Layer | When | Source |
|---|---|---|
| **Pibroch ground-theme** | Calm start of run; slow and stately | §4.3 |
| **Strathspey variations** | Mid-combat flow | §4.3 |
| **Reel climax** | Combo milestone | §4.3 |
| **Clàrsach harp line** | Fae encounters (Seelie) | §4.3 |
| **Fiddle Unseelie twist** | Fae encounters (Unseelie) | §4.3 |
| **Waulking rhythm (Gaelic call-response)** | Hebridean biome | §4.3 |
| **Port-à-beul (nonsense-syllable)** | Comedic events | §4.3 |
| **Psalm-precented harmonies** | Iona/Covenanter biomes | §4.3 |
| **Bodhrán heartbeat** | Low-HP danger | §4.3 |
| **Bagpipe drone (low-drone harmonic foundation)** | Boss fights | §4.3 |
| **Corryvreckan roar** | Whirlpool hazard zone | §1.8 |
| **Gaelic wordless singing** | Moor moments / calm | §4.3 |

### 5.12 Food & Drink as In-Run Items

| Item | Mechanical Role | Source |
|---|---|---|
| **Haggis-pie pickup** | Medium heal | §4.1 |
| **Neeps & Tatties** | Combined HP + speed mini-buff | §4.1 |
| **Cullen Skink** | Warming regen | §4.1 |
| **Scotch Pie** | Small heal (fast) | §4.1 |
| **Bridie** | Medium heal + minor pickup radius | §4.1 |
| **Lorne Sausage** | Small damage buff | §4.1 |
| **Tattie Scone** | Small HP + comedy SFX | §4.1 |
| **Oatcake** | Tiny heal (always safe drop) | §4.1 |
| **Shortbread** | Medium heal; pickup fast | §4.1 |
| **Tablet** | Sugar-rush speed burst | §4.1 |
| **Cranachan** | Multi-layer buff (stacking) | §4.1 |
| **Tunnock's Wafer** | Distinctive heal, satisfying SFX | §4.1 |
| **Deep-Fried Mars Bar** | Absurdist rare heal | §4.1 |
| **Drambuie** | Damage buff + regen hybrid | §4.2 |
| **Irn-Bru (canned)** | Attack-speed buff | §4.2 — already exists; add variant |
| **Tennent's Lager** | Mild drunk-debuff with damage buff | §4.2 |
| **Heather Ale (Pech-brew)** | Rare buff from Pech encounter | §1.2, §4.2 |
| **Hot Toddy (Crabbie's)** | Warming regen | §4.2 |

### 5.13 Summary Opportunity Map

The three richest seams the research opens — where the highest-density new WHS content waits:

1. **Seasonal Event System** — Hogmanay, Burns Night, Beltane, Samhain, Up Helly Aa. Each can be implemented as a date-gated route picker and biome theme, with dedicated banter and item pool. Huge content multiplier per calendar; pairs with existing daily-challenge infrastructure. Burns Night in particular is *tailor-made* for a haggis game.
2. **Regional Biome Expansion** — from research, 18+ biome candidates (Cairngorm Plateau, Glen Coe, Skye Fairy Pools, Callanish, Edinburgh Old Town, Glasgow Close, Clyde Shipyard, Hebridean Machair, Iona, Culloden, Trossachs, etc.). Each is a distinctive atmosphere, palette, enemy mix, and hazard profile. Fills the current "Scotland = Highlands" flatness.
3. **Historical Depth Layer** — Wallace, Bruce, Mary Queen of Scots, Bonnie Prince Charlie, Flora MacDonald, Rob Roy, the Covenanters, the Enlightenment. Each offers relics, NPCs, events, and banter. Grounds the game in *real* Scotland alongside the mythic.

The three *immediate* on-ramps (lowest-cost, highest-flavour):

- **Food pickup expansion** (§5.12) — a dozen new pickup types with distinct VFX/SFX. Cheap content, big warmth payoff.
- **Burns-quotation banter thread** (§5.9) — ~20 lines mined directly from Burns. Zero design overhead.
- **Standing Stones / Pictish Shrine landmarks** (§5.6) — a single new hazard-type tile unlocks multiple biome flavours.

---

## Sources & Further Reading

This doc combined Claude's existing knowledge with targeted web verification. For deeper dives:

**Folklore**
- [Creatures of Scottish Folklore — Timberbush Tours](https://www.timberbush-tours.co.uk/news-offers/the-creatures-of-scottish-folklore)
- [Scottish Mythical Beasts & Monsters in Gaelic folklore — LiveBreatheScotland](https://www.livebreathescotland.com/scottish-mythical-beasts-monsters/)
- [55 Legendary Scottish Mythical Creatures — Aaron Mullins](https://aaronmullins.com/2022/02/12/list-of-scottish-mythical-creatures-55-legendary-monsters-and-folklore-tales/)
- [Scottish Folklore Creatures — Mythfolks](https://www.mythfolks.com/scottish-folklore)
- [Scottish ghost stories (Parts 1 & 2) — National Trust for Scotland](https://www.nts.org.uk/stories/scottish-ghost-stories-witches-murder-and-folklore)
- [Fearsome Foes from Scottish Folklore — British Fantasy Society](https://britishfantasysociety.org/10-fearsome-foes-from-scottish-folklore/)
- [Category:Scottish legendary creatures — Wikipedia](https://en.wikipedia.org/wiki/Category:Scottish_legendary_creatures)

**Castles & Haunted Places**
- [10 Most Haunted Castles in Scotland — VisitScotland](https://www.visitscotland.com/things-to-do/attractions/castles/haunted)
- [15 Haunted Castles in Scotland — VisitScotland](https://www.visitscotland.com/blog/attractions/15-haunted-castles-in-scotland/)
- [Reportedly haunted locations in Scotland — Wikipedia](https://en.wikipedia.org/wiki/Reportedly_haunted_locations_in_Scotland)
- [A Guide to Scotland's Most Haunted Castles — Braw Scottish Tours](https://brawscottishtours.com/blog/a-guide-to-scotlands-most-haunted-castles)

**History & Clans**
- [Massacre of Glencoe — Wikipedia](https://en.wikipedia.org/wiki/Massacre_of_Glencoe)
- [The Glencoe Massacre — National Trust for Scotland](https://www.nts.org.uk/visit/places/glencoe/the-glencoe-massacre)
- [Scottish Enlightenment — Wikipedia](https://en.wikipedia.org/wiki/Scottish_Enlightenment)
- [Scottish Enlightenment — Britannica](https://www.britannica.com/event/Scottish-Enlightenment)
- [Are you descended from Scotland's most powerful clans? — Countryfile](https://www.countryfile.com/people/historical-figures/scotlands-most-powerful-clans)
- [Clan Campbell feuds — Clan Campbell Society of North America](https://www.ccsna.org/the-campbells-and-macdonalds)
- [List of Scottish scientists — Wikipedia](https://en.wikipedia.org/wiki/List_of_Scottish_scientists)

**Food & Drink**
- [Traditional Scottish Food Dishes — VisitScotland](https://www.visitscotland.com/things-to-do/food-drink/must-try-food)
- [Scottish cuisine — Wikipedia](https://en.wikipedia.org/wiki/Scottish_cuisine)
- [Scotland Food Guide — CIE Tours](https://www.cietours.com/blog/10-traditional-scottish-foods-try)
- [Scottish Food and Drink — Scotland.org](https://www.scotland.org/about-scotland/food-and-drink)

**Music**
- [Pibroch — Wikipedia](https://en.wikipedia.org/wiki/Pibroch)
- [Music of Scotland — Wikipedia](https://en.wikipedia.org/wiki/Music_of_Scotland)
- [Gaelic music — Wikipedia](https://en.wikipedia.org/wiki/Gaelic_music)
- [Gaelic in modern Scotland: Gaelic music and song — Open University](https://www.open.edu/openlearn/languages/gaelic-modern-scotland/content-section-6.2)
- [Songs — Ceòl nan Gàidheal — National Library of Scotland](https://digital.nls.uk/learning/ceol-nan-gaidheal/english/songs/)

**Language**
- [Glossary of Scottish slang and jargon — Wiktionary](https://en.wiktionary.org/wiki/Appendix:Glossary_of_Scottish_slang_and_jargon)
- [18 Braw Scottish Words and Phrases — VisitScotland](https://www.visitscotland.com/things-to-do/attractions/arts-culture/scottish-languages/scots-words-meanings)
- [Essential Scottish Vocabulary Phrasebook — Wilderness Scotland](https://www.wildernessscotland.com/blog/scottish-words/)

**Festivals**
- [9 Iconic Events & Their History — VisitScotland](https://www.visitscotland.com/things-to-do/events/iconic-events-history)
- [Hogmanay — Wikipedia](https://en.wikipedia.org/wiki/Hogmanay)
- [Beltane — Wikipedia](https://en.wikipedia.org/wiki/Beltane)

**Literature**
- *Robert Burns — Selected Poems* — Canonical Burns edition.
- *Sir Walter Scott — Waverley* — foundational historical novel.
- Hamish Henderson's folklore collections (School of Scottish Studies, Edinburgh) — peerless primary-source folk archive.
- Neil Gunn — *Highland River*, *The Silver Darlings*. Mid-20th century Highland fiction.
- John Matthews — *The Sidhe: Wisdom from the Celtic Otherworld*. Popular fae reference.
- Ronald Black (ed.) — *The Gaelic Otherworld* (J.G. Campbell reissue). Major folklore compilation.
- *An Carn* / *West Highland Tales* (J.F. Campbell, 19th-c. collection). Out of copyright, available free.

**Bookmarks for Music/Voice**
- BBC Alba (Gaelic-language broadcaster) — for language atmosphere.
- Runrig discography — Gaelic-rock fusion.
- Julie Fowlis — Hebridean Gaelic vocal.
- Capercaillie — Gaelic folk-fusion.
- Aly Bain — Shetland fiddle.
- Still Game (comedy) + Limmy's Show + Burnistoun + Chewin' the Fat — voice references (already cited in VOICE_CARD).

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). Four parts (folklore & mythology, geography & places, history & figures, culture/food/music/language) plus a 13-subsection WHS Content Mining map. ~40+ WHS-NEW enemy candidates, 15+ new boss ideas, 40+ weapon candidates, 30+ passive/relic ideas, 18+ biome concepts, 20+ hazards, 10+ new routes and events, 12+ haggis variant concepts, 5 banter threads, 8 seasonal events, 12 music cues, 18 food/drink items. Grounded in Scottish research with sources cited.
