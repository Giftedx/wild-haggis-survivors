# Voice Card — Wild Haggis Survivors

Two registers, one voice. The game's default mouth is **Glaswegian**, but Scotland is a chorus — some variants, bosses, and NPCs speak in registers *around* Glasgow. Always warm. Always Scottish. Always handcrafted.

---

## Hearth Voice (default)

Still Game pub warmth. Jack & Victor energy. Self-deprecating, affectionate, talks to the player like an old pal.

**Where:** Menus, progression, tips, run identity, shop, settings, tutorial, level-up cards, gold/XP feedback, treasure toasts.

**Sounds like:** "The glen remembers ye." / "Braw try." / "The herd believes in ye." / "Cuppa's on."

## Edge Voice

Limmy deadpan. Short, dry, absurdist. Trusts the player.

**Where:** Boss warnings, death titles, achievement unlocks, kill milestones, enrage lines, evolution descriptions.

**Sounds like:** "That's yir lot." / "The beast is RAGIN!" / "Every last wan o' them." / "Did ye… no' see the lava there?"

---

## Variant-scoped voices

Default haggis speaks Hearth + Edge (Glaswegian). **Variant haggis** may have their own sub-voice. Each variant banter pool is scoped; line-switching by locale-resolver keys (`ui.banter.variant.{variantKey}.*`).

### Cailleach (shipped)

Winter crone. Stern, motherly, Gaelic-inflected. *Not* villainous — an elder who expects better of you. Sparing with words; every one carries weight.

**Vocabulary:** stern rebukes ("awa' wi' ye"), dark humour about death/weather/long view. Occasional untranslated Gaelic fragment (*"dè do bheachd?"* — *what do you think?*; *"cò às a tha thu?"* — *where are you from?*). Never fully untranslated — context or subtitle carries meaning.

**Sounds like:** "Ye mind yer feet, wee one." / "Winter's patient. Ye won't be." / "The mountain was here before ye, and after."

### Glaswegian (shipped)

Urban-aggressive, Limmy-bite. Even the Hearth lines have an edge. Think of a Glasgow barmaid who's seen too much.

**Sounds like:** "Gie's peace." / "Two pints, prick!" / "Square go, then."

### Hebridean (candidate)

Gaelic-rock warmth. Lyrical, slower rhythm, Hebridean-English with Gaelic phrases. Karen Matheson / Runrig energy.

**Sounds like:** "Slàinte, mo caraid." (health, my friend) / "The sea mind me of who I am." / "Òran na Mara" (song of the sea) as title card.

### Doric / Aberdonian (candidate)

Fishing-village stoic; Northeast Scotland. Distinctive vocabulary — *quine*, *loon*, *fit like?*.

**Sounds like:** "Fit like?" (how are you?) / "The quinie's got legs, eh?" / "Aye aye, min." / "Foos yer doos?" (literally: how are your pigeons? — meaning: how are you?)

### Witch's Hare (shipped)

Gowdie confession-Scots. Named for Margaret Gowdie — shape-shifter; runs the moor in hare form. Terse, slightly breathless. Older Scots grammar (*afore*, *awa*, *ken*). No modern flourish — this is seventeenth-century edge register.

**Sounds like:** "Awa in the hare's shape." / "The form undid afore the yard was gained." / "Ay quhill I com hom againe."

### Anticlockwise (shipped)

Wry, self-aware. A mirror-variant with one defining trait: everything goes the other way. Dry wit, never precious, acknowledges its own absurdity without winking too hard.

**Sounds like:** "The brae went clockwise; I gaed the ither wey." / "Wrang-leg, wrang hill, right idea." / "Took him frae ahint."

### Wee Ghostie (shipped)

Spectral gentleness. Light touch — flickering present, easily dispersed. No darkness, no dread. The ghost is small and a little surprised to still be here. Hearth register with a spectral thinness.

**Sounds like:** "Flickered and was gone." / "Even a wee ghostie has a final fade." / "Walked through every wa' that tried to stop it."

### Laird (shipped)

Estate-Scots formality. Landed gentry cadence — unhurried, property-aware, mildly imperious. Uses *naturally* as filler. Dry understatement. The Laird does not panic; the Laird notes.

**Sounds like:** "The estate closes at dusk." / "The deer, naturally, scattered." / "The Laird goes where the Laird goes."

### Selkie (shipped)

Tidal and lyrical. Between-worlds register — neither fully land nor sea. Soft repetition, paired opposites (*water and moor*, *tide-line and heather*). Never resolves cleanly; the selkie holds both.

**Sounds like:** "The tide makes its ain decision." / "The skin was left at the wrang stone." / "Came hame — which form, the moor disnae say."

### Gran's voice (Hearth's soul)

Gran is the emotional heart — an elder voice *about* the player's run, not *of* the run. Warmer than Hearth. Gentler. Occasional lament, never nagging.

**Sounds like:** "Aye, yon haggis is faring braw." / "Come awa' in, hen, kettle's on." / "Yer grandpa would've been fair chuffed." / "Mind yersel' out there."

**Placement:** death screens; post-run croft moments; Moor Road intermissions; very rare mid-run whispers.

### Burns's voice (citational)

Robert Burns's own lines, quoted or paraphrased, used *sparingly* for lineage-moments, poetic resets, and Burns Night seasonal content. Burns is not a character — he's a *voice echoing through the moor*.

**Sounds like (quotation):** "Wee, sleekit, cow'rin, tim'rous beastie" / "The best-laid schemes o' mice an' men gang aft a-gley" / "Fair fa' your honest, sonsie face."

**Rule:** any Burns quotation must be contextually justified (a mouse scurries by → "wee, sleekit, cow'rin, tim'rous beastie…"). Never random.

---

## Vocabulary

### Universal Scots (use freely)

| Use | Not |
|-----|-----|
| yir | your |
| nae | no (not any) |
| dinnae | don't |
| cannae | can't |
| wee | small |
| oot | out |
| tae | to (when natural) |
| ken | know |
| aye | yes |
| culls | kills |
| curios | passives |
| the moor / the glen | the world / the map |
| bairn / wean | child (Edinburgh / Glasgow) |
| bonnie | pretty / good-looking |
| braw | fine / excellent |
| dreich | dreary, wet, grey (weather) |
| coorie | nestle into warmth |

### Regional flavour (variant-scoped)

| Word | Region | Meaning |
|------|--------|---------|
| *fit like?* | Doric / Aberdeenshire | how are you? |
| *quine / quinie* | Doric | girl / young woman |
| *loon* | Doric | young man / boy |
| *peerie* | Shetlandic | small, wee |
| *peedie* | Orcadian | small |
| *du, dee* | Shetlandic | you (sing.) |
| *scunner / scunnered* | Universal Scots | disgust / fed up |
| *bampot* | Urban Glasgow | crazy person |
| *numpty* | Universal | mild idiot |
| *radge* | Urban (esp. Edinburgh/Leith) | wild, mad |
| *gie it laldy* | Universal | give it your all |
| *haud yer wheesht* | Universal | be quiet |
| *taps aff* | Universal | shirts off (hot weather) |
| *blootered / steamin' / stoatin'* | Universal | drunk (escalating) |

### Enemy insults (pick by tone)

**Cheeky-warm (Hearth-leaning):** bam, numpty, eejit, roaster, radge, tube, walloper.

**Sharp (Edge-leaning):** bawbag, moon howler, rocket, weapon, bampot.

**Dramatic (boss-ready):** scourge, wretch, chancer, villain (when the voice needs to climb).

---

## Do / Don't — Example Rewrites

| Flat / wrong | Warm, on-voice |
|--------------|----------------|
| "You died." | "That's yir lot." / "The kelpie caught ye." |
| "Level up!" | "Level up, hen." / "Yer stockier now." |
| "New weapon unlocked." | "Caber's yours. Try not tae drop it." |
| "Kill 100 enemies." | "Send a hundred tae the grave." |
| "Victory!" | "Ye did it, ye mad yin." |
| "Loading..." | "Puttin' the kettle on…" |
| "An error occurred." | "Summit's gone squint. Try again?" |
| "Are you sure you want to quit?" | "Away for a cuppa? Aye or naw." |
| "Your progress has been saved." | "Stashed in the sporran." |
| "Ironmoor unlocked!" | "The Ironmoor opens. Go cannie." |

---

## Delivery notes

- **Text hold-time.** Hearth banter holds on screen ~30% longer than Edge banter. The lingering *is* the warmth.
- **ALL CAPS.** Reserved for Edge-voice climax lines. Boss enrage, combo-1000, Reaper timer. Sparingly.
- **Punctuation.** Hearth: warm punctuation (commas, soft periods). Edge: clipped (em-dashes, ellipses, hard full stops).
- **Font tonality.** In English: neutral weight. In Scots: slightly condensed weight. In Gaelic phrases: italicised or serif-accented.
- **Exclamation marks.** Use *one*, never two. "Braw!" not "Braw!!".
- **Length.** Hearth lines can breathe (8–14 words common). Edge lines should be short (3–7 words).

---

## When voices switch (triggers)

| Trigger | Voice |
|---------|-------|
| Menu idle / loading / settings | Hearth |
| Run start / first spawn | Hearth (warm, invitational) |
| Combat ambient | Hearth with Edge spikes |
| Level-up card flip | Hearth |
| Boss warning (10s before) | **Edge** |
| Boss fight (during) | Edge + music carries |
| Boss kill confirm | **Hearth** (celebration — warmth reasserts) |
| Low HP (<30%) | Edge (clipped, urgent) |
| Player dash / burn-leap | no voice — SFX only |
| Combo milestone (×50, ×100, ×250, ×500) | Edge (staccato) |
| Combo milestone ×1000 | Edge ALL CAPS (reserved) |
| Death screen | **Gran's voice** (Hearth's warmest register) |
| Evolution pickup | Edge (announcement) + Hearth follow-up |
| Chest open | Hearth |
| Moor Road intermission | **Hearth** (calm, reflective) |
| Act complete | Hearth → brief Edge triumph |
| Variant-unique event | Variant voice |
| Seasonal event (Burns Night, etc.) | Context-appropriate (Burns for Burns Night, Cailleach for Beltane/Samhain, Gran for Hogmanay) |

---

## Anti-Patterns

Writing traps to avoid:

- **No tourist Scots** ("och aye the noo", "bonnie wee thing I say you"). Real Scots don't say this; only adverts do.
- **No explaining the joke in-game.** If a line needs a footnote, cut it.
- **No clean English that forgot where it was from.** "You died" in a Scottish game is a missed chance.
- **No try-hard density.** One cultural nod per string, maximum. "Och aye, wee braw bairn!" is three too many.
- **No literary Highland.** "Dry bracken", "the land heals those who belong", "by the ancient stones I remember" — this is Outlander prose, not Glasgow. Stay kitchen-table, not fantasy-romance.
- **No clichés.** Avoid "aye, laddie" (unless a character literally would say it). Avoid "och" anywhere except maybe once per run at most.
- **No sectarian jokes.** Rangers/Celtic tensions are live; we don't use them.
- **No mocking of living communities.** Buckfast humour is about the wine, not about the people who drink it.
- **No Gaelic as decoration alone.** If Gaelic appears, it has translation or context. Never as "spooky foreign words."
- **No excessive apostrophes.** "sel'" is fine; "fer'blau'er'rin'" is unreadable.

---

## Authoring reference

Cultural voice anchors (from research):

- **Still Game** — Hearth voice archetype. Jack & Victor, Boabby, Isa, Navid, Winston.
- **Limmy's Show** — Edge voice archetype. Deadpan-surrealist.
- **Chewin' the Fat** — "Gonnae no dae that" refusal comedy.
- **Burnistoun** — "ELEVEN!" everyday-absurd.
- **Trainspotting** — Leith gritty edge (reserved for the grittiest moments).
- **Rab C. Nesbitt** — Govan warmth-under-chaos.
- **Robert Burns** — citational source for poetic moments.
- **The cast of Still Game** — the gold standard for Hearth.
- **Groundskeeper Willie** — cautionary tale (a *diaspora parody* of Scottish voice, not a model).

**Deep reference:** `docs/research/SCOTTISH_RESEARCH_DEEP.md` Parts 13 & 14 (Languages + Accents & Dialects) for the full regional vocabulary ladder; Part 11 (Haggis) for wild haggis myth banter material; Part 15 (Literature) for the Burns canon.
