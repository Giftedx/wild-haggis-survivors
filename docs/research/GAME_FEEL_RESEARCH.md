# The Craft of Masterpiece Game Feel

> *"Fill your game with love and tiny details."*
> — Jan Willem Nijman, **The Art of Screenshake**

> *"Stop for big moments."*
> — Masahiro Sakurai, lesson one

> **Purpose.** Research into the *craft layer* that separates a well-designed game from a masterpiece. Juice, polish, audio-visual fusion, emotional architecture. The dimension the Soul Charter demands loudest — "art/music bliss", "handcrafted with care" — and the one no existing WHS doc currently codifies.
>
> **How this doc relates to the others.**
> - `ROGUELITE_RESEARCH.md` covered **what to build** (structural and mechanical canon).
> - `SCOTTISH_RESEARCH.md` covered **what to fill it with** (cultural and thematic material).
> - **This doc covers *how* to make every moment sing.** It is the tuning layer on top of both.
>
> **How to use this.**
> 1. For any new feature spec, *end* the spec with a "Feel Pass" section that draws from Part 3 (Technical Toolkit) and Part 4 (Audio as Feel).
> 2. Before shipping any build, audit against the Part 8 (WHS Application Map) — it's a concrete polish checklist.
> 3. When a moment in the game feels *flat*, diagnose using the Part 2 moment-anatomy framework.
>
> **North star.** Every technique in here is weighed against `docs/DESIGN_SOUL.md`. We are not pursuing visceral AAA-spectacle feel. We are pursuing *warm, handcrafted, Highland-tinted, emotionally honest* feel. Hades and HoloCure are our spiritual kin, not Doom Eternal or Returnal.
>
> **Scope.** 8 parts, ~18k words. First half is canon and technique. Second half applies it to Scottish theme and then to WHS's specific codebase.
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — foundation for a feel-pass spec and a polish-pass plan.

---

## Table of Contents

1. [Methodology & Soul Charter Alignment](#methodology--soul-charter-alignment)
2. [Part 1 — The Feel-First Tradition](#part-1--the-feel-first-tradition)
3. [Part 2 — Anatomy of Great Moments](#part-2--anatomy-of-great-moments)
4. [Part 3 — The Technical Toolkit](#part-3--the-technical-toolkit)
5. [Part 4 — Audio as Feel](#part-4--audio-as-feel)
6. [Part 5 — Visual Language](#part-5--visual-language)
7. [Part 6 — Emotional Architecture](#part-6--emotional-architecture)
8. [Part 7 — Scottish-Specific Feel](#part-7--scottish-specific-feel)
9. [Part 8 — WHS Application Map](#part-8--whs-application-map)
10. [Sources & Further Reading](#sources--further-reading)
11. [Changelog](#changelog)

---

## Methodology & Soul Charter Alignment

**Game feel** — sometimes called *juice*, *polish*, or *player response* — is the subjective, embodied sense that a game's inputs produce *satisfying* outputs. It isn't one thing. It's the summed effect of:

- How inputs translate to actions (responsiveness, input buffering, forgiveness)
- How actions are confirmed (animation, VFX, SFX, camera, haptics)
- How the world responds to the player (enemy reactions, environmental deformation)
- How music and ambience shift with state
- How UI feedback lands (numbers, bars, icons, toasts)
- How rest and rhythm shape the experience over seconds, minutes, and hours

Great feel is *invisible* — players don't say "the screen shake at 0.4s with 3-pixel amplitude and 18hz frequency was satisfying." They say "*it feels good*." The craft is in designing every invisible choice to compound into that gut-level "good."

This doc is structured into **canon + technique + application**. Parts 1–2 build vocabulary. Parts 3–5 catalogue the toolkit. Parts 6–7 fuse craft with emotional and cultural specificity. Part 8 is the operational checklist for WHS.

**Soul Charter filter.** Every technique in this doc is categorised in Part 8 against four lenses:
- **WARMTH** — does this make the player feel held, safe, loved?
- **CLARITY** — does this improve what the player can perceive and understand?
- **KINETICS** — does this make action feel kinetic and alive?
- **EMOTION** — does this amplify a specific emotional note the Soul Charter wants?

If a technique fails all four lenses for WHS, it's noted as *not a fit*. Masterpiece polish is *selective*, not maximal.

---

## Part 1 — The Feel-First Tradition

### 1.1 Before "Game Feel" Was a Word

Until about 2008, game feel was folk wisdom. Designers knew it mattered — Mario's coin-chime, Street Fighter's hit-stop, Zelda's heart-sound — but the discipline lacked shared vocabulary. Developers used words like "tight," "responsive," "meaty," "crunchy" — all metaphorical, none measurable.

The shift from intuition to discipline happened through four key interventions:

1. **Steve Swink — *Game Feel* (2008, book).** The academic codification. Defined game feel as "real-time control of virtual objects in a simulated space, with interactions emphasised by polish." Introduced formal frameworks for measuring feedback latency, input precision, and perceived control. Required reading, though dense.

2. **Jan Willem Nijman / Vlambeer — *The Art of Screenshake* (2013, talk).** The *practitioner's* canon. Nijman, co-founder of the studio behind *Luftrausers* and *Nuclear Throne*, demonstrated how ~12 concrete techniques could be incrementally added to transform a game. Screen shake, random firing angles, permanence, impact frames, sleep-on-hit. The talk ends with a plea: *"Fill your game with love and tiny details."* Foundational because it made the discipline *teachable*.

3. **Martin Jonasson & Petri Purho — *Juice It or Lose It* (2012, talk).** Shorter, more demo-focused. Took a boring brick-breaker prototype and iteratively layered juice (trail, tween curves, screen shake, particles, audio, hit-stop, background animation) until the game felt alive. The before/after reel is still one of the most persuasive teaching tools in game design.

4. **Masahiro Sakurai — *Masahiro Sakurai on Creating Games* (2022–2024, 250+ videos).** Super Smash Bros. and Kirby creator Sakurai spent his fortune on a YouTube channel explaining his design instincts to the next generation. Lesson one was titled *Stop for Big Moments* — a 5-minute explanation of hit-stop using Smash footage. Over 250 more videos followed. Sakurai's throughline is *shokunin* craftsmanship — the obsessive, invisible polish of a master craftsman.

### 1.2 Celeste & the Forgiveness Doctrine

Celeste (2018, Maddy Thorson / EXOK) is the modern masterpiece-of-feel reference for indie devs. In a single Twitter thread, Thorson listed the game-feel tricks built into Madeline's movement — each a small input-forgiveness that, compounded, made a brutally-difficult game *feel kind*:

- **Coyote time** — you can still jump for ~6 frames after leaving a ledge.
- **Jump buffering** — if you press jump 5 frames before landing, the game remembers and jumps on landing.
- **Jump corner correction** — if your jump clips a corner by 1–2 pixels, the game slides you around it.
- **Variable jump height** — how long you hold the button affects the jump arc.
- **Lift momentum storage** — jumping off fast-moving platforms transfers their momentum.
- **Dash ledge-snap** — if your dash *just* misses a ledge, the game pops you up.

Thorson's stated philosophy: *"all design choices are centered around widening timing/positioning windows, so that everything is fudged a tiny bit in the player's favor. It's a big reason why Celeste can feel kind even though it's very difficult — it wants you to succeed."*

This is the *invisible warmth* Soul Charter principle in mechanical form. The player can't articulate why Madeline "feels" better than another jump — but the game is *secretly on their side*. That principle is universally applicable.

### 1.3 Hades & Supergiant's Audio-First Philosophy

Hades (2020) didn't invent feel, but it *unified* every prior technique with unprecedented audio integration. Darren Korb, Supergiant's audio director, designed Hades's music as a **three-layer adaptive system**:

- **Layer 1: Mellow synth pad with modular percussion** — the default exploration state.
- **Layer 2: Acoustic/Mediterranean remix** — crossfades in during intense combat, at the next beat marker.
- **Layer 3: Hard rock with electric guitar and aggressive drums** — triggered when a mini-boss or boss appears.

The system uses horizontal re-sequencing (switching cues) for major events, and vertical layering (adding/removing tracks) for minor tension shifts. Only ~2.5 hours of music were composed, yet Hades stays tolerable across hundreds of hours because the *variation* of which layer is active makes 2.5 hours feel like far more.

Couple this with **voice-line density** (21,020 recorded lines across 305,433 words — Korb himself voicing Zagreus after his placeholder recordings beat the audition tapes) and Hades becomes a masterclass in *audio-as-identity*. The game is as much its *sound* as its art.

### 1.4 The Sakurai Throughline

Across his 250+ videos, Sakurai's recurring themes:

- **Stop for big moments.** Hit-stop on critical attacks. Pause to emphasise weight.
- **Sound is content.** The click of a UI element, the whoosh of a menu, the land-sound on a fall — these are *content*, not afterthought.
- **Clarity beats fidelity.** A reads-instantly sprite beats a beautifully-rendered unclear one.
- **Player psychology.** Why do players return? What is the *reward loop*? What makes a *power-up* feel like a gift?
- **Constraints breed creativity.** Limits on frame count, palette, screen size force innovation.
- **Frame data matters.** In combat, invincibility frames and startup frames *are* the design.

Sakurai's throughline is that every detail is *decided*, not accidental. A placeholder sound is a betrayal of craft. The character animation when you select a menu option matters.

### 1.5 Why This Matters for Roguelites Specifically

Roguelites have a special feel-challenge: *players will repeat the same moment hundreds of times.* If a weapon's firing animation is 2% too long, that annoyance compounds over 300 runs. If a pickup sound is subtly wrong, it becomes grating. If a death screen lingers 400ms too long, the cumulative delay is measured in *hours*.

**Implication:** feel-polish in a roguelite is *more* important than in a linear game, because the feedback volume is 10–100× higher. Every small improvement compounds across every run.

Conversely: every small delight compounds too. Hades's contextual voice lines for *first-time* events hit *harder* because they're surrounded by repetition.

### 1.6 Key Canon References for WHS

Prioritised reading/viewing for the team:

1. **Nijman, *The Art of Screenshake***. Watch annually. 33 minutes. Exhaustive technique demo.
2. **Jonasson & Purho, *Juice It or Lose It***. 15 minutes. The before/after reel alone sells the discipline.
3. **Sakurai on Creating Games**, *Stop for Big Moments* video. 5 minutes. Foundational.
4. **Thorson's Celeste thread** on forgiveness mechanics. 3-minute read. Directly applicable.
5. **Mark Brown (GMTK), *Secrets of Game Feel and Juice***. 10 minutes. Good synthesis.
6. **Mark Brown, *Why Does Celeste Feel So Good to Play?***. 8 minutes.
7. **Mark Brown, *The Genius of Hades' Aggro System***. 10 minutes.
8. **Supergiant's Darren Korb interviews** (Sound Architect podcast, Journal of Sound and Music in Games). Music-as-identity philosophy.

---

## Part 2 — Anatomy of Great Moments

Deconstructing specific great moments reveals the stack. Each moment below is broken into the layers that compose it: *input → animation → VFX → SFX → music → camera → narrative framing → pacing*. Copy the *structure*, not the content.

### 2.1 Hades — First Successful Escape

**What happens.** After ~20–30 failed runs, Zagreus finally kills Hades (his father) and steps through the door to the surface. Sunlight. A meadow. For five seconds the player believes they've beaten the game. Then Zagreus dies, dissolves into red mist, and respawns at the pool of blood in the House. His father, bitter, comments. Zagreus resolves: *again*.

**The stack:**
- **Combat climax:** multi-phase boss fight with unique arenas. Final phase stops the player's AOE builds by restricting space.
- **Victory animation:** Zagreus visibly bloodied. Hades kneels. Slow-zoom camera.
- **Music transition:** combat music fades; a solo acoustic guitar line emerges — *In the Blood (Instrumental)*. Emotional vocabulary shifts from driving-rock to tender.
- **Environmental shift:** door opens. Snow. Sunlight. Colour palette shifts from oranges/reds (Tartarus) to soft blues/greens (Greece). *This reversal of colour IS the reward.*
- **Audio silence:** step forward — silence but for Zagreus's breath and footfalls. The game holds its breath.
- **First-time voice lines:** Zagreus murmurs wonder at Persephone's cottage. Every line is a first-time trigger with extended delivery. Korb's voice is deliberately *unsure*, tender.
- **Tragic reveal:** the "you cannot survive here" mechanic. Damage-over-time. Zagreus falls.
- **Narrative reframe:** this wasn't the ending — it was *act one*. Skelly (guardian of the courtyard) now has new lines. The entire cast updates. The Fated List adds new objectives.

**Why it lands.** The game trained the player to expect *defeat as content*. By inverting — giving a victory that *becomes* defeat, reframed as the story's real beginning — it delivers a double-emotional beat (joy + bittersweet melancholy) in 90 seconds. The audio was engineered for this moment *specifically* (the *In the Blood* track is reserved for it).

**Transfer to WHS.** The equivalent moment is beating the Taxman for the first time. We should ask: *does killing the Taxman trigger a tonal inversion?* Right now, unlikely. A "victory-that-becomes-more" structure requires *preparation* before we can pull it off. A reserved-music-cue, a reserved-banter pool, a reserved-colour-palette, a reserved-environmental-shift — all for that one moment.

### 2.2 Celeste — Chapter 7 Summit

**What happens.** After 7 chapters of failure, climbing, forgiveness, and self-confrontation, Madeline reaches the top of Celeste Mountain. She sits in the snow. Birds pass. The music — *Reach for the Summit* — layers one final time with an orchestral swell. Credits.

**The stack:**
- **Mechanical zenith:** chapter 7 is the hardest platforming in the game, requiring every movement technique mastered in chapters 1–6. The *gameplay* earns the emotional payoff.
- **Music as narrative:** *Reach for the Summit* is a ~7-minute composition that cycles through motifs from every previous chapter, re-harmonised in major key. Each motif reappears *on cue* — you are hearing your entire journey summarised.
- **Visual restraint:** no camera shake, no VFX explosion. A sprite. A snowy vista. A bird. The restraint is the reward.
- **Dialogue restraint:** Madeline doesn't speak. She *is*.
- **Layered music entry:** the summit track builds in real-time with Madeline's climbing. You are *participating* in the climax.

**Why it lands.** The emotional beat is entirely unearned by a new player watching a video. It is *entirely* earned by a player who struggled through 6 chapters. The game's feel-design taught the player that difficulty could coexist with kindness; the finale *honours* both.

**Transfer to WHS.** "Rest moments" after major victories. Instead of an immediate rerun screen, offer a 15-second breath — the haggis stands at the peak of a moor, wind in its fur, heather rustling, Gran's voice murmuring approval. *Then* the run summary. The Soul Charter wins on pacing.

### 2.3 Hollow Knight — The Mantis Lords First Encounter

**What happens.** The Knight enters a pristine columnar arena. Three mantis lords bow in unison. One steps forward. *Fight begins.* The mantis dodges with impossible grace. The Knight — who till now has fought lumbering crawlers — is suddenly pushed to the limit. After winning, the two remaining mantises step down, bow respectfully, and open the door to their kingdom.

**The stack:**
- **Arena entrance:** a long silent walk reveals the trio on their thrones. Player's pulse rises purely from *layout*.
- **Opening bow:** animation frames of respect establish the mantises as *honourable*, not monstrous.
- **Music:** the combat track *Mantis Lords* kicks in on first-hit — driving taiko drums, shamisen. A distinct motif from any other area.
- **Attack animation:** mantis strikes are *long-telegraphed* but *fast-executing*. Player learns a rhythm.
- **Hit feedback:** each hit on the mantis is a sharp *tick-thunk* and a wing-flutter. Satisfying.
- **Victory:** kneeling animation + respectful dialogue + door unlock. The enemies become allies by gesture alone.

**Why it lands.** The fight introduces a *new combat paradigm* (fast telegraphs, precise spacing). It's placed exactly at the player's skill ceiling. And the *tone* — mutual respect — frames victory as *honourable* rather than *dominating*. The musical motif becomes forever associated with "the moment I first felt like a skilled player."

**Transfer to WHS.** Boss fights should each have a **unique music motif** and a **distinct tonal beat before and after**. Gordon (boss #1) is currently just an angry chef. Could he have a *brief bow* animation before combat (chef's respect for a worthy opponent) and a *silent nod* if defeated cleanly? Small gestural touches build character.

### 2.4 Dead Cells — Perfect Parry

**What happens.** An elite enemy telegraphs a huge swing. You raise your shield at the *precise* frame of impact. Time slows. The enemy's arm bounces back. You execute a counter-slash that one-shots the elite. Screen flash. Coins explode. Music sting.

**The stack:**
- **Telegraph:** elite's swing is animated with a clear wind-up (~400ms). Red glow.
- **Parry window:** narrow (~150ms). Successful = executed, failed = damage.
- **Success frame:** time dilation (game speed → ~20%) for ~300ms. Screen flash. Electric blue particle burst.
- **Audio stack:**
  - Low-frequency "clash" thump (bass).
  - High-frequency metallic ring (treble).
  - Vocal grunt from the Beheaded (the player character).
- **Enemy stagger:** enemy pushed backward 2 tiles. Wing-animation flail.
- **Counter-attack window:** enemy is *frozen* for 800ms, inviting a finishing blow.
- **Reward:** one-hit kill + 3× coin drop + confetti-shimmer on XP gain.

**Why it lands.** Every feedback channel fires simultaneously. The moment feels like *destiny* because it rewards a skill-gate with disproportionate spectacle. Dead Cells never lets a good parry be quiet.

**Transfer to WHS.** WHS doesn't have parry (auto-combat). But **combo milestones** are our equivalent — the moment of "50 kills in a row" should fire *every* feedback channel (music stinger, VFX burst, banter line, hit-stop, screen-flash, camera-kick). Current combo milestones fire modestly; they could fire *harder*.

### 2.5 HoloCure — First Collab Weapon Formed

**What happens.** Your weapon reaches Level 7 (max). A specific passive item is already in your inventory. You open a chest. A *Collab* weapon appears in the drop — a brand-new weapon with a unique name and VFX that *didn't exist* five seconds ago. The game briefly pauses. A bright stinger plays. The new weapon appears in your hotbar with a glowing border.

**The stack:**
- **Pre-condition reveal:** the level-up card system hints at the collab via tooltip (*"evolving with [passive]"*). Anticipation builds.
- **Trigger:** chest opened (not level-up) — adds discovery surprise.
- **Transformation animation:** weapon + passive icons zoom together, merge with a flash.
- **New name reveal:** large text across screen with the collab name.
- **VFX change:** the old weapon's particle trail is replaced with something *distinctive*. Players see the change instantly.
- **SFX:** a unique sound stinger reserved for collabs.
- **Permanence:** the collab is permanent for the rest of the run. Huge power spike visible on next few waves.

**Why it lands.** The *rarity* of the event + the *spectacle* of transformation + the *anticipation* earned by level-7 grind + the *immediate power visible* in the next 10 seconds = unforgettable. Collabs are HoloCure's *most cinematic* moment.

**Transfer to WHS.** Our evolutions are this moment. Currently they trigger through chests but the on-screen ceremony is modest. Each evolution should:
1. Pause combat for 400–800ms.
2. Show the new weapon name in large text with Scottish-ornamented border.
3. Play a *unique stinger* — different for each evolution (reel for Caber's evolution, pibroch swell for Bagpipes, etc.).
4. Replace the old weapon's VFX with a visibly-distinct one.
5. Fire a banter line ("*Noo we're cookin' wi' gas*").

### 2.6 Binding of Isaac — First Devil Deal

**What happens.** You beat a floor's boss without taking damage. A trapdoor opens to reveal a dark, unsettling room. Red aura. A pentagram on the floor. An item pedestal offering a powerful item in exchange for heart containers. The music shifts to something ominous. The choice is yours.

**The stack:**
- **Pre-condition:** no-damage clear (rare). Rewards *skill*, not time.
- **Reveal:** portal animation + ominous SFX. Red-tinted lighting. Environmental shift.
- **Temptation:** the items offered in devil rooms are *visibly more powerful* than shop items at that floor.
- **Cost made concrete:** heart containers literally *disappear* when you pick up a devil item — visual cost confirmation.
- **Music:** devil music is distinct, synth-heavy, unsettling.
- **Moral texture:** some players never take devil deals on principle. The game *lets* them, without mechanical penalty.

**Why it lands.** The trade is legible (X hearts for Y item). The visual language tells the player *this is dark*. The music agrees. The reward is *visible*. Agency is total.

**Transfer to WHS.** The Cailleach's Bargain (see both prior docs) is our equivalent. When it exists, it should share these properties:
1. Earned by a specific skill or play (e.g., killing the act boss with >80% HP).
2. Revealed by a *clear environmental shift* (a stone cairn opens; mist thickens; Cailleach appears).
3. Cost and reward both visible before the trade.
4. Distinct music cue.
5. Never penalised for skipping.

### 2.7 Sekiro — Mikiri Counter

**What happens.** An enemy performs a *thrust* attack (red kanji appears above their head). You press B (jump) at the right moment. Your character *stomps* on their spear, breaking it, staggering them. An execution window opens.

**The stack:**
- **Telegraph:** red kanji warning. Clear, consistent, language-agnostic.
- **Audio cue:** sharp whistle sound on kanji-appear.
- **Input window:** narrow but fair.
- **Success frame:** character stomps with animation weight. Spear snaps audibly. Time doesn't slow — the *sound* carries the impact.
- **Punish window:** clear 1000ms of enemy stagger. Invitation to finish.
- **Reward:** massive posture damage (Sekiro's stagger system). Often a kill.

**Why it lands.** The trick is *consistency*. Every thrust, every enemy, every situation — the red kanji means one thing. The *learning* is permanent. Once you've Mikiri'd once, you can do it against *every thrust in the game*.

**Transfer to WHS.** *Consistent enemy telegraphs.* Currently our elites/bosses have varied warnings; they should be systematized into a *visual language* players can learn once. E.g.: *golden aura = AoE incoming; red ring = dash coming; blue glow = projectile volley*. Once learned, always readable.

### 2.8 Vampire Survivors — The "Am I A God" Moment

**What happens.** Minute 15. Your build has clicked. Bibles, garlic, holy water, lightning ring, laurel. Every screen-pixel is a kill. You're not playing — you're *watching your own army work*. You absent-mindedly hold the movement stick and sip coffee.

**The stack:**
- **Build legibility:** the player *knows* the build came together at a specific moment.
- **Visible density:** dozens of damage numbers per second.
- **Audio saturation:** continuous stinger loops.
- **Music escalation:** some runs add a layer at high combo counts.
- **Zero-input engagement:** the game rewards *watching* as much as *doing*. Zen.

**Why it lands.** The *power curve*. The player earned this. Every pickup, every card, every evolution *mattered*, and now they're reaping. The game doesn't tell you to stop — you eventually die to the Reaper, and you *shrug*. You won.

**Transfer to WHS.** Our *endgame build* should achieve this feeling by the 22–25 minute mark. Currently, WHS's build variety is narrower, and the "I am a god" moment is less consistent. Widening the late-game synergy explosion (see roguelite doc's Rule-Stack pattern) enables this.

### 2.9 Composite Lessons From the Moment Anatomies

Across these eight moments, consistent stack ingredients:

1. **A pre-condition** that earns the moment (skill, time, patience, rarity).
2. **A visible anticipation beat** (animation wind-up, environmental shift, music shift).
3. **A short peak** (typically 200–800ms of time-dilation or focused attention).
4. **Simultaneous multi-channel feedback** (audio + visual + input + music + camera *all* firing).
5. **A narrative reframe** — the moment means *something* in the game's context, not just mechanics.
6. **A rest beat after** — even 500ms of silence lets the moment land.
7. **Optional: a first-time bonus** — reserved banter/music/VFX that *only* plays on the first occurrence.

This composite list is the **Great Moment Recipe**. Part 8 applies it to specific WHS moments.

---

## Part 3 — The Technical Toolkit

Catalogue of concrete techniques. Each entry includes *what it is*, *how it's tuned*, *when to use*, and *fit for WHS*.

### 3.1 Hit-Stop / Hit-Freeze

**What it is.** A momentary pause (or near-pause) of game time when a significant hit lands. Everything freezes — enemy, player, projectiles — for 20–100 milliseconds.

**How it's tuned.**
- **Length:** 20–40ms for normal hits; 60–120ms for critical/boss hits; up to 300ms for finishing blows.
- **Scope:** global (all objects pause) vs. local (only hit participants pause). Smash Bros. uses local; Sakurai's canonical explanation shows removing it makes hits feel *weightless*.
- **Timing:** triggered on the *frame of impact*, not slightly before or after.

**When to use.** Any hit that deserves attention — crit, boss hit, kill confirm, evolution trigger, boss phase transition.

**WHS fit.** **SHIPPED — deepen.** `JuiceSystem.hitFreeze()` exists with a 20ms default. Opportunity: *graduated hit-stop* based on significance. Crit = 40ms, boss hit = 80ms, boss kill = 300ms, act complete = 500ms. Current implementation flat-applies 20ms regardless.

### 3.2 Screen Shake

**What it is.** Camera offset in random directions for a short duration after impactful events. *Not* camera rotation (nauseating) — translation only.

**How it's tuned.**
- **Amplitude:** 1–3 pixels for small hits, 4–8 for medium, 10–20 for boss kills, 20+ only for act-complete spectacle.
- **Duration:** 50–150ms for standard hits, up to 600ms for boss moments.
- **Frequency:** 15–30 Hz. Higher = more agitated; lower = weightier.
- **Decay curve:** *ease-out* (sharp then diminishing), not linear. This makes the shake feel like *aftershock*, not a constant jitter.
- **Accumulation rule:** cap total shake even with many simultaneous hits. Otherwise high-volume combat becomes unreadable.

**When to use.** Impacts, explosions, big-number pickups, boss-fight beats.

**WHS fit.** **SHIPPED — audit tuning.** `JuiceSystem` uses resolve-parameter amplitudes. Worth a calibration pass: is 4px really the right amount for a kelpie kill vs. a 12px shake for a Gordon boss kill? Probably yes. But aggregation under heavy combat (hundreds of kills per second with AoE weapons) needs a ceiling — let the music carry late-game chaos, not the camera.

### 3.3 Camera Kicks (Directional Push)

**What it is.** Distinct from shake — a single quick camera shove in a specific direction, mimicking a physical reaction. The camera moves 3–8 pixels in one direction and returns.

**How it's tuned.**
- Direction vector usually matches hit source (enemy attacked you from the left → camera kicks left).
- Duration: 80–200ms ease-out return.
- *Subtle* is the rule. Overuse causes motion-sickness; players rarely notice the effect consciously.

**When to use.** Player damage events (camera kicks *away* from damage source). Boss attacks landing. Weapon fires with strong recoil.

**WHS fit.** **NOT YET — consider for damage-taken events.** Current damage visuals are vignette + flash. A 4-pixel camera kick on damage would add visceral weight without nausea risk.

### 3.4 Sub-Pixel Rendering & Smooth Motion

**What it is.** In pixel games, you can render positions to sub-pixel precision and interpolate for smoother motion. Alternatively, snap-to-pixel for crisp retro look.

**WHS fit.** Currently `pixelArt: true, roundPixels: true` (per CLAUDE.md). This is the *snap-to-pixel* style — correct for WHS's aesthetic. But consider allowing sub-pixel motion for *camera* (smooth follow) while keeping sprites snapped. Hades does this.

### 3.5 Squash & Stretch

**What it is.** Classic Disney animation principle. Objects deform during motion — compress on impact, stretch during travel. In pixel art, even 1-pixel deformations register.

**How it's tuned.**
- Anticipation squash: 1–3 frames of compression before a jump/attack.
- Impact squash: 1–2 frames of compression on landing/hit.
- Travel stretch: 1 frame of horizontal/vertical stretch during peak motion.

**When to use.** Player movement (especially jumps/dashes), projectile launch, enemy death, pickup collection.

**WHS fit.** **UNDERUSED.** Haggis is a sprite that could benefit from small squash-and-stretch on:
- Dash start (anticipation squash).
- Dash end (impact squash on landing).
- Level-up (stretch + squash for "growing" gag).
- Hit react (quick horizontal squash away from damage source).
- Pickup (tiny vertical stretch on gem pickup, a "puff-up" reaction).

### 3.6 Smear Frames

**What it is.** For fast motion, a single intermediate frame shows the object as a blur or stretched smear. Bridges the motion between two static poses without needing many in-between frames.

**When to use.** Dashes, fast attacks, bouncing projectiles.

**WHS fit.** **NEW.** A single smear frame on the haggis during dash would *massively* improve kinetic feel. Currently dash is snap-to-new-position.

### 3.7 Tween Curves (The Unsung Hero)

**What it is.** The curve of motion over time. Linear, ease-in, ease-out, ease-in-out, back-ease, bounce, elastic. *Different curves convey different character.*

**How it's tuned.**
- **Ease-out:** natural deceleration. Standard for most UI.
- **Back-ease (overshoot + return):** playful. Good for toasts, pickups.
- **Elastic:** bouncy. Use sparingly, for cartoony moments.
- **Linear:** mechanical. Only use when you *mean* mechanical.

**When to use.** Every motion that isn't instant. Menus, text pop-ins, icon transitions, sprite attacks, weapon fire.

**WHS fit.** **AUDIT OPPORTUNITY.** Likely we have a mix of tween curves; a pass to verify intentionality per UI element could elevate the full experience. Toast notifications should *back-ease* in (playful), not *linear* in (cold).

### 3.8 Impact Frames

**What it is.** A 1–3 frame burst of contrasting visuals at the moment of impact. In classic anime, these are white-out panels. In pixel art, it's a bright flash or shape-abstraction frame.

**How it's tuned.**
- Duration: 1–3 frames (17–50ms at 60fps).
- Visual: white flash, sprite silhouette flash (invert), outline thickening, or abstract impact-shape.

**When to use.** Kills, crits, boss-hit confirms, evolution triggers.

**WHS fit.** **SHIPPED PARTIALLY.** Sprite white-flash on damage exists; could extend to *enemy* hit-flash on *weapon* impact. Currently enemy hit-react is a tint; an explicit 1-frame impact flash would add punchiness.

### 3.9 Particle Layering & Variety

**What it is.** Visual effects composed of *multiple* simultaneous particle systems, not one monolithic emitter.

**The three-layer model:**
1. **Core** — the central visual (flash, ring, sprite burst). High contrast.
2. **Mid** — supporting spray (sparks, dots, chevrons). Medium density.
3. **Tail** — lingering residue (smoke, mist, embers). Low opacity, long life.

**How it's tuned.**
- Each layer on a separate pool to avoid mono-sized allocations.
- Stagger layer lifetimes (core: 100ms, mid: 200ms, tail: 500ms).
- Particles should decay via *opacity + scale + velocity*, not just disappear.

**WHS fit.** **SHIPPED — diversify.** JuiceSystem has pools (damage text, impact rings, trail dots, burst effects, boss particles). Opportunity: *themed particle packs per weapon and per enemy type*:
- Caber hit → wood chips (brown, splinter-shaped).
- Scotch Mist → droplets (translucent blue).
- Thistle Shot → tiny thistle-tufts (green-purple).
- Bagpipes → musical-note silhouettes.
- Haggis (player) death → oat-grain scatter.
- Kelpie death → water splashes.
- Boss death → unique per-boss particle set.

### 3.10 Input Buffering

**What it is.** The game remembers a player's input for N frames so it fires on the next valid frame even if pressed early.

**When to use.** Dashes, jumps, attacks, menu confirms. Anywhere a player might mash.

**WHS fit.** **LIKELY UNAUDITED.** Dash input probably doesn't buffer. If the haggis is in a hit-freeze and the player presses dash, the input might be dropped. Adding 100ms buffer prevents this "did my input register?" frustration.

### 3.11 Coyote Time (Input Forgiveness at Boundaries)

**What it is.** Celeste's canonical forgiveness — after leaving a ledge, you can still jump for ~6 frames.

**WHS analog.** The haggis doesn't jump, but analogous forgiveness could apply to:
- **Pickup grace:** if you pass *near* an XP gem but not *on* it, the gem still pulls toward you for 100ms after you're out of range.
- **Hazard exit grace:** 50ms after leaving a lava tile, you still show the "on lava" vignette (fades smoothly rather than snapping off).
- **Dash edge-snap:** if your dash ends 2 pixels from a healing circle edge, the haggis is nudged onto it.

### 3.12 Damage Number Variety

**What it is.** Floating text that appears on hit. Variety distinguishes damage types.

**How it's tuned.**
- **Size:** scale with damage amount (log-scaled).
- **Colour:** by damage type (white normal, yellow crit, red fire, blue ice, green poison).
- **Animation:** random initial jitter, ease-out upward drift, fade out.
- **Aggregation:** at high DPS, *group* numbers rather than spam (e.g., "87 x3" instead of three "29" numbers).
- **Crit distinction:** bigger, brighter, possibly with an exclamation.

**WHS fit.** **SHIPPED — diversify.** Current damage numbers are pooled. Opportunity: *crit variant with thistle-shape trail*, *burn variant in orange*, *bonus-damage variant with sparkle border*. Also: aggregation ceiling for AoE weapons.

### 3.13 Combo Milestones & Tier Jumps

**What it is.** Combos reward escalating feedback at breakpoints (10, 25, 50, 100, 250, 500, 1000).

**How it's tuned.**
- Milestone breakpoints have *named* tiers ("Good!", "Great!", "Perfect!", "Godlike!").
- Each tier has a *distinct stinger*, VFX burst, and possibly banter.
- Reset sound/animation on combo break should *not* be punishing — brief, neutral.

**WHS fit.** **SHIPPED — escalate.** Combo system exists with VFX milestones at 5/10/25. Push further: 50 = named tier, 100 = Gran voice line, 250 = music layer adds, 500 = screen effect overlay, 1000 = *legendary*, with reserved banter/music/VFX for the first-ever 1000 combo per variant.

### 3.14 Anticipation & Follow-Through

**What it is.** Animation principle — *every* significant motion has (1) anticipation beforehand, (2) the action, (3) follow-through afterward. Pixel art micro-versions of these are 1 frame each.

**Example: haggis dash.**
- Anticipation: 1-frame squash + tiny backward lean (2 frames, 33ms).
- Dash: the actual movement (6–10 frames).
- Follow-through: 1-frame overshoot + settle (2 frames).

**WHS fit.** **AUDIT OPPORTUNITY.** Current haggis dash is instant. Adding 2 frames of anticipation and 2 of follow-through *doubles* the felt weight without affecting competitive responsiveness (the dash *ability* fires instantly on input; the *visual* ramps).

### 3.15 Permanence (The Vlambeer Principle)

**What it is.** Evidence of past events remains in the world. Enemy corpses, bullet holes, scorch marks, footprints. *Nothing disappears cleanly.*

**How it's tuned.** Fade-out should be *slow* (3–10 seconds) or *stacked* (oldest marks fade first when a cap is hit).

**When to use.** Kill marks, hazard scars, pickup trails, player path.

**WHS fit.** **PARTIALLY SHIPPED.** Kill bursts exist but fade fast. Expanding *kill permanence* (small fading wisp at every kill site for 2–4 seconds) amplifies the "I am destroying armies" feel without much cost. Also consider *player-path* trails in fog biomes (breadcrumb visible for 5 seconds behind you).

### 3.16 Micro-interactions in UI

**What it is.** Every UI element does *something* when hovered, clicked, state-changed. Tiny, but compound.

**Examples.**
- Button: hover = scale 1.05 + colour brighten; click = scale 0.95 + snap back; disabled = greyed.
- Toast: back-ease in from top, linger, fade out.
- HP bar: damage = flash red, then slow-drain animation (not snap).
- XP bar: fill = smooth interpolation with a pulse at level-up threshold.

**WHS fit.** **MASSIVE POLISH TERRITORY.** A UI audit against the *every element does something* principle would elevate menu navigation. HP bar drain animation is visible in many survivor-likes; if WHS HP bar snap-updates on damage, switching to a 200ms drain animation makes damage feel *felt*.

### 3.17 Pickup Magnetism & Gather Physics

**What it is.** Pickups aren't just "within radius = collected." They *orbit*, *zoom*, *bounce*, *chain*.

**How it's tuned.**
- Initial pickup tug: ease-in-out acceleration toward player.
- Multi-pickup chain: slight delay between each gem collect creates *rhythm* (Mario's coin-sequence effect).
- Magnet on level-up: all pickups on screen rush to player with staggered timing (100ms between waves).

**WHS fit.** **SHIPPED — elevate.** Pickup radius exists. Opportunity: *rhythmic chaining* — instead of 30 gems collecting simultaneously (silent-but-fast), stagger collection by 20ms intervals so the audio creates a rising *pling-pling-pling* that rewards the player-ear. Small change, huge feel improvement.

### 3.18 Death & Respawn Handling

**What it is.** The framing of failure.

**How it's tuned.**
- Death pause: 800ms–2s of scene-holding. Time to register.
- Cause-of-death label: clear, blame-free language ("Gordon's ladle — a fair hit" rather than "You died").
- Respawn menu: 2-button max (Rerun / Return to Menu). Not 12.
- Visual: gentle fade, not violent.
- Audio: sombre but not punitive.

**WHS fit.** **SHIPPED — lean further into warmth.** Death-cause tracker exists. Soul Charter alignment: every death screen should feel like *a hug*. Current implementation is good; Part 6 (Emotional Architecture) deepens this.

---

## Part 4 — Audio as Feel

Rami Ismail said it best: *sound is half your game*. Players remember games first by how they *sounded*. The SNES menu click. The Zelda chest-open. The Hades voice. The Isaac pickup. The Celeste strawberry. Audio is identity, feedback, atmosphere, and pacing simultaneously.

### 4.1 The Three-Layer SFX Composition

Every impactful sound effect should have three layers:

1. **The Body** — the fundamental frequency content. The *thunk* of a sword hit. The *whoosh* of a projectile. Carries the identity of the sound.
2. **The Accent** — a high-frequency attention-grabber. The *clink* riding on top of the thunk. The *spark* of the whoosh.
3. **The Tail** — the decay and reverb. The *hum* after the clink. The *swish* trailing the whoosh.

**Why all three.** Body alone is flat. Accent alone is thin. Tail alone is mushy. Together they create *presence* — the sound feels like it's happening in a real space.

**Practical.** Even if you have single-file stock sounds, layer 2–3 of them with small offsets (5–20ms) and volume balancing. Hades does this across *every* combat hit.

**WHS fit.** **AUDIT OPPORTUNITY.** A sampling of current combat SFX probably uses single-sample-per-hit (standard procedural-SFX approach). A pass to re-record key impacts as 3-layer composites would measurably elevate weapon feel. Priority order:
1. Boss hits (high-salience moments).
2. Crit hits (signature moments).
3. Evolution pickup.
4. Level-up.
5. Gem pickup (volume up — it's a *constant* sound).

### 4.2 Variance — The Anti-Fatigue Principle

The single biggest SFX mistake: the *same* sound firing *identically* 200 times per minute. The human ear grates on repetition.

**Techniques to add variance:**
- **Pitch randomisation:** ±3–5 semitones per play.
- **Volume randomisation:** ±10–20% per play.
- **Sample pool:** 3–5 variants of the same sound, randomly chosen.
- **Filter sweep:** slight EQ randomisation on each play.
- **Delay stagger:** tiny ms-level delay randomisation when multiple sounds play simultaneously.

**Hierarchy:** frequent sounds (gem pickup, weapon fire, kill confirm) need *aggressive* variance. Rare sounds (boss defeat, evolution) need *consistent* signature sound.

**WHS fit.** **AUDIT OPPORTUNITY.** `AudioSystem` throttles via `AudioContext.currentTime`. Whether pitch variance is applied is unclear; probably not. Adding ±3 semitones to gem pickup and weapon fire would transform the ear's fatigue curve.

### 4.3 Mixing & Ducking

**What it is.** When important sounds play, unimportant sounds duck (quieten temporarily). This preserves clarity under high load.

**Examples.**
- Boss voice line plays → music ducks 30%.
- Critical hit lands → ambient enemies sound ducks briefly.
- Level-up stinger → everything else ducks.
- Low HP alert → music ducks and a low-drone underscore enters.

**WHS fit.** **SHIPPED (music/SFX ducking per the inventory).** Deepen with per-event ducking profiles — a boss warning should *aggressively* duck combat sounds so the warning *lands*.

### 4.4 Adaptive Music: Vertical Layering

**What it is.** Multiple musical layers play simultaneously; layers *add and remove* based on game state, maintaining the same beat/harmony.

**Example from Hades II conductor research:**
- Exploration baseline: pad + light percussion.
- First enemy contact: add bass layer.
- Crowd of enemies: add melody layer.
- Boss: add lead electric guitar.

Crossfades happen on beat boundaries (not mid-phrase) to avoid musical awkwardness.

**WHS fit.** **SHIPPED — expand layer vocabulary.** The procedural music engine already has 4 layers (pad, drone, percussion, piano). Expanding to ~6–8 layers, each tied to distinct game-state axes, would create finer-grained music responsiveness. Suggested additions:
- **Bodhrán heartbeat layer** (low-HP pressure).
- **Fiddle lead layer** (combo > 50, slides atop the mix).
- **Pibroch swell layer** (boss approaching, 10s lead-in).
- **Waulking rhythm layer** (biome transition — adds during Hebridean biome).

### 4.5 Adaptive Music: Horizontal Re-sequencing

**What it is.** Instead of layers fading, the music *switches* from one cue to another at a beat boundary. Used for bigger state changes (entering a boss arena, starting a new biome).

**How it's tuned.**
- Crossfades occur on musical beat boundaries (e.g., every 4 beats) to preserve musicality.
- Cues are composed to be *cross-compatible* in key and tempo so transitions don't jar.
- Stingers (short 2–4 second hits) can bridge cues.

**WHS fit.** **OPPORTUNITY.** Current engine is procedural (not pre-composed cues). But *horizontal* techniques can still apply by changing *conductor parameters* at act transitions — rewrite the generation recipe mid-run. Currently transitions are linear fades; beat-aligned recipe-swaps would feel more musical.

### 4.6 Stinger Systems

**What it is.** Short (0.5–4 second) musical hits played over the main music at key moments.

**Examples.**
- Level-up stinger: brief chord pluck.
- Boss-kill stinger: triumphant 2-second flourish.
- Evolution pickup: ascending arpeggio.
- Low-HP warning: descending minor chord.

**Design rules.**
- Stingers must *match the current musical key* or feel jarring.
- Stingers should *not duck everything* — they ride on top of existing music.
- Stingers have *reserved* semantic meanings (hearing a boss-kill stinger should always mean one thing).

**WHS fit.** **CRITICAL OPPORTUNITY.** Stingers are the cheapest audio feature with the highest feel-payoff. Adding ~15 named stingers:
- Level-up
- Weapon level-up
- Evolution pickup
- First kill of enemy type
- Combo milestone (per tier)
- Boss warning (10s pre-boss)
- Boss kill
- Act complete
- Route chosen
- Chest opened
- Low HP warning
- Near-death recovery
- Healing circle entered
- Hazard entered
- Victory screen
- Death screen

### 4.7 Silence as Tool

**What it is.** The absence of sound is a sound. Strategic silence creates *tension* or *reverence*.

**Use cases.**
- Pre-boss hush (music quiets to near-silence, then boss music hits hard).
- Post-boss silence (3 seconds of only ambient before rerun invitation).
- Critical-moment hold (combo milestone at 100 — 500ms silence, then stinger + crowd-roar).
- Ending silence (Celeste's summit — silence with only wind).

**Rule.** Silence requires sound *before* it to have meaning. Never start a section in silence.

**WHS fit.** **OPPORTUNITY.** Particularly for boss transitions. Right now, music continues through boss warnings. A 500ms music-duck before the boss-warning line lands would add gravity.

### 4.8 Voice & Banter Audio Considerations

Even if banter is text-only (WHS current plan), audio principles apply:

- **Timing:** banter lines fire with a slight delay after trigger (200–400ms) to avoid feeling automatic.
- **Throttling:** max one banter line per N seconds to avoid noise.
- **Priority stacking:** high-priority lines interrupt low-priority lines.
- **Variance:** pool of 3–5 lines per trigger; rotate.
- **Reserved lines:** first-time lines never repeat; labelled in the pool.

**WHS fit.** **SHIPPED — structure is in place.** Per inventory, banter is priority-tagged. Once content is written (Tier S5 of roguelite doc), the audio-timing layer (text fade-in, text hold-duration, text fade-out) becomes a polish target.

### 4.9 Music-as-Mechanic (Advanced)

**What it is.** Games where music isn't just atmosphere — it's *gameplay*. Crypt of the NecroDancer, Metal Hellsinger, Patapon, Rhythm Doctor.

**Even non-rhythm games can gesture at this:**
- Enemies attack on beat in a boss fight.
- Combat is easier when player moves on beat.
- Weapon cooldowns synchronise to tempo.
- Critical hits align with musical accents.

**WHS fit.** **SPECULATIVE / DEFERRED.** Pibroch Haggis variant (noted in codebase) is a rhythm-mastery experiment. Keep this as a *variant-scoped* feature, not core — doesn't fit the auto-combat identity. But: *soft* beat-alignment for evolutions (trigger on next musical beat, not instantly) would add musical grace to the moment of transformation.

### 4.10 Ambience & Environmental Audio

**What it is.** Non-music, non-SFX sound bed — wind, water, bird calls, distant thunder. Establishes atmosphere without demanding attention.

**How it's tuned.**
- Looping but varied (10–30 second loops with subtle timestretch per loop).
- Per-biome pallette (moor = wind + heather rustle + distant sheep; loch = lapping water + reeds + loon calls).
- Volume: low (-18 to -12 dB relative to music).
- Random ambient events (distant pipe trill every 2-4 minutes; owl hoot on pine biome at night).

**WHS fit.** **LIKELY UNDERUSED.** Per-biome ambience would massively deepen atmosphere. Specifically:
- **Moor:** wind + heather + distant crow.
- **Bog:** water-gurgle + frog + reed-whisper.
- **Loch:** lap + loon + gull.
- **Pine/Forest:** branch creak + owl + leaf rustle.
- **Edinburgh Old Town** (future): distant church bell + horse clip-clop + indistinct crowd.
- **Glasgow Close** (future): bin-lorry + pigeon + distant Irn-Bru ad.
- **Cairngorm Plateau** (future): *only* wind, thin and high.

### 4.11 The Audio Budget

Audio performance concerns:

- **Voices concurrent cap:** 16–32 voice channels typical. Set priority system (kill SFX queue aggregation if > 16).
- **Sample memory:** large samples stream; small ones preload. Each SFX 5–50ms long.
- **Reverb tails** multiply CPU cost — reserve for important sounds.

**WHS fit.** Monitor via profiling. Likely fine given Phaser's audio infrastructure.

### 4.12 The Audio Identity Test

A WHS-specific test: if you play a 10-second clip of WHS audio without visuals, can someone identify:
1. That it's Scottish-themed?
2. That it's a survivor-like (density / variety)?
3. That it's *our* game (not generic)?

Reaching 3-of-3 is the masterpiece bar. Hades is 3-of-3. HoloCure is 3-of-3.

**WHS current state.** Probably 1-of-3 (Scottish-leaning pads + bagpipes sting identifies theme but might pass as any folk game). Investment needed to pass test 3 — a *signature* identifiable layer. Candidates:
- A specific *Gran humming* motif in calm moments.
- A specific *haggis vocalisation* on level-up (a contented grunt).
- A specific *pibroch drone chord* reserved for biome-transition moments.

---

## Part 5 — Visual Language

Visual feel is *perception management*. The player must instantly parse what's happening, where the threats are, what's actionable, and what's safe. Decorative polish atop muddled information is a net loss.

### 5.1 Silhouette-First Design

The single most important principle in pixel/sprite games. If the sprite's silhouette (filled solid black) isn't instantly recognisable, colour won't save it.

**Test.** Fill every sprite with #000 on a #FFF background. Can you still tell:
- What creature it is?
- Which way it's facing?
- What state it's in (attacking, hurt, dying)?

**Techniques for strong silhouettes:**
- Distinctive profile shapes — don't use identical body shapes for different enemy types.
- Exaggerated appendages (long weapons, large hats, spiky hair).
- Asymmetric features — one shoulder higher, a tilted head, a dragging leg — all more readable than perfect symmetry.
- Negative space *inside* the silhouette (holes, gaps) can aid recognition.

**WHS fit.** **LIKELY SOLID — AUDIT OPPORTUNITY.** The haggis itself is silhouette-strong (distinctive lumpy shape). Enemies with shared body types (multiple wraiths, multiple urban ghaists) may share silhouettes; disambiguation via head-shape, held-item, or scale could improve readability.

### 5.2 Palette Discipline

**The principle.** Fewer colours, smaller palettes, stronger impact. 4–8 colours force shape-based storytelling; infinite colours enable fidelity but muddy the read.

**Palette strategies:**
- **Master palette:** the whole game uses ~32–64 colours total.
- **Per-biome palette:** each biome has a 6–12 colour palette that *dominates* but doesn't exclusively restrict.
- **Signature colours:** reserved colours for specific semantics (see §5.3).
- **Palette hierarchy:** figure colours > environment colours > UI colours. Figures pop; environment recedes; UI sits atop.

**WHS fit.** **SHIPPED — per-biome palettes exist (moor = peat browns/heather purples; loch = blues; bog = dark greens).** Opportunity: *document* the master palette formally as a shipped asset (a `PALETTE.md` or inline color constants with semantic names). This scales with art-team growth and prevents palette drift.

### 5.3 Semantic Colour Coding

**The principle.** Colour has instant emotional vocabulary. Use it consistently.

| Colour | Semantic in WHS context |
|---|---|
| **Red** | Damage to player, threat, enemy, danger zone |
| **Gold** | Treasure, elite enemy, special reward |
| **Green** | Healing, safe zone, nature buff |
| **Blue** | Water, cold, mana/energy (if added), XP |
| **Purple** | Faerie, magic, heather, moor-spirit |
| **White** | Impact flash, pure/holy, clear safe |
| **Black/Dark** | Void, curse, Unseelie, forbidden |
| **Yellow** | Crit, attention, caution |
| **Orange** | Fire, burn, lava hazard |

**Rule.** *Never* swap these meanings. If green = heal in your biome A, green still = heal in biome B. Cognitive consistency across a 30-minute run is priceless.

**WHS fit.** **LIKELY CONSISTENT — verify and document.** A colour-semantics audit across all VFX, UI, and enemy types would surface any drift.

### 5.4 Contrast — Figure vs Ground

**The principle.** The player character, enemies, and pickups are *figures*. Backgrounds, decorations, and environmental details are *ground*. Figures must *always* win the contrast battle.

**Techniques.**
- Outline figures (1–2 pixel outline in a contrasting shade).
- Desaturate ground (background slightly muted, figures vibrant).
- Size distinction (figures are larger or more detailed in their class).
- Movement distinction (figures animate; ground is still, or moves at different rhythm).

**WHS fit.** **AUDIT OPPORTUNITY.** At high enemy-density, figure-vs-ground can break. A *hit-density stress test* (100+ enemies on screen) should verify the haggis remains instantly locatable.

### 5.5 Motion Legibility & Telegraphs

**The principle.** Enemy attacks must be *telegraphed* with enough lead time for the player to react.

**Telegraph ingredients:**
- **Anticipation animation:** 200–500ms of clear wind-up.
- **Colour change:** enemy flashes attack-type colour.
- **Ground-marker:** a telegraphed AOE shows its footprint on the floor.
- **Audio stinger:** "whoosh" or "ready" sound before impact.
- **Particles:** charge-up particles gathering on the attacking part.

**Telegraph consistency (per Sekiro's Mikiri lesson):**
- Same attack type = same telegraph across all enemies. Players learn once.
- Standardised visual language — red glow = charge attack across all enemies; blue ring = AoE across all enemies.

**WHS fit.** **PARTIAL — systematise.** Bosses and elites have various telegraphs. A *Telegraph Taxonomy* pass — one table defining how each attack-class is signalled — would improve readability and training.

### 5.6 Information Hierarchy

**The principle.** At any given frame, some information is *critical* (player health low), some is *important* (boss timer, combo), some is *nice-to-know* (biome name, kill count). Information compete for eye real estate.

**Rules.**
- **Critical info:** center screen OR edges, large, animated (if fresh).
- **Important info:** top or bottom of screen, medium size, static.
- **Nice-to-know:** corners, small, static.
- **Transient:** animate in, hold, animate out.

**WHS fit.** **AUDIT OPPORTUNITY.** HUD elements include weapons, HP bar, combo, timer, XP bar, minimap. Verify hierarchy:
- HP (critical) — is it big enough, red enough, flashy when low?
- Boss HP (when present) — does it clearly take priority over weapon rows?
- Combo — only conspicuous during streaks?
- Timer — present but not dominant?

### 5.7 UI Animation Integration

**The principle.** UI elements should *live* — they breathe when idle, react to events, and fade contextually.

**Examples.**
- HP bar has a subtle pulse at low HP.
- Weapon icons faintly glow at evolution-ready threshold.
- XP bar has a shimmer as it fills.
- Menu buttons have idle hover effects.
- Combo counter grows 1px with each hit.

**WHS fit.** **OPPORTUNITY.** Static UI elements vs. living UI elements is a significant feel difference. A UI polish pass against this rule would deepen perceived care.

### 5.8 Weight & Visual Impact of Feedback

**The principle.** Feedback visuals should have *weight* commensurate with their importance.

**Examples.**
- Small hit → 1-frame flash, tiny VFX.
- Big hit → 3-frame flash, bigger VFX, camera kick, HP bar notable drop.
- Crit → white-out flash, larger damage number, particle burst.
- Kill → 5-frame kill-burst VFX + stinger + combo tick.
- Elite kill → 8-frame kill-burst + gold particles + stinger + banter chance.
- Boss kill → 1-second scene-holding VFX + music stinger + banter + camera zoom.

**WHS fit.** **MOSTLY SHIPPED.** Worth verifying the *proportionality* — is the spectacle of a boss kill ~10× a normal kill? If so, we're good. If boss kills feel like "just a big kill," escalate.

### 5.9 Procedural Visual Content (Tartan, Mist, etc.)

**The principle.** Procedural visual systems — tartan patterns, fog rendering, fire, water — should look *handmade* even when generated. The trick is *variation within a style*.

**Examples.**
- Tartan patterns: handcraft 5–10 "master" setts, then vary the 10-color palettes across clan-specific versions. Looks infinitely varied but stays authentic.
- Fog/mist: base layer of noise + hand-tuned particle accents + randomly-placed "thicker" clumps for visual interest.
- Water ripples: simulation is noisy but the *perceived* water looks intentional because surface sparkles are placed rhythmically, not randomly.

**WHS fit.** **PARTIALLY SHIPPED — tartan is procedural per inventory.** The procedural tartan system is already a hidden craft-flex; consider exposing its variation (unlockable clan patterns per boss defeated, visible in Gran's Croft wardrobe).

### 5.10 The "Breathing Environment" Principle

**The principle.** Environments that *never* animate feel dead. Small, background animations — swaying grass, drifting clouds, rippling water, rustling heather — make the world feel alive.

**Budget-conscious ways.**
- 2-frame animation on decorative elements (grass sways between 2 positions).
- Parallax: slow-moving cloud layer atop the sky.
- Occasional ambient events: a crow flies across screen; a sheep bleats in the distance.

**WHS fit.** **OPPORTUNITY.** Current biome visuals likely have some decoration; heightening the *living* quality (animated heather, drifting clouds, ripple on lochs) elevates the whole experience.

### 5.11 The Reveal / Hidden Layer Strategy

**The principle.** Not everything needs to be visible at all times. *Reveals* — moments where hidden details emerge — carry weight.

**Examples.**
- Fog lifts as player enters a new area.
- Hidden cairn becomes visible after standing near it.
- Secret doors outline only after a specific interaction.
- Ancient tree silhouettes deeper as player approaches.

**WHS fit.** **SPECULATIVE OPPORTUNITY.** Particularly for hidden routes / Easter eggs (per roguelite doc Tier B3). The *moment of reveal* is a visual event worth crafting explicitly.

---

## Part 6 — Emotional Architecture

Mechanics and polish can make a game *functional and satisfying*. Emotional architecture is what makes a game *mean something*. The Soul Charter demands the warmth; this part is the craft of delivering it.

### 6.1 Peaks and Valleys — The Tension Curve

**The principle.** A run should *breathe*. Constant intensity is fatiguing; constant calm is boring. Alternation of high-tension peaks and low-tension valleys creates rhythm.

**Traditional model:** saw-tooth or stair-step curve, with overall rising tension punctuated by valleys.

**A 25-minute WHS run, ideal curve:**
- 0:00–1:30 — *low* (intro, mild enemies, establishing).
- 1:30–4:30 — *rising* (first wave waves, first real build emerging).
- 4:30–5:30 — *peak* (Gordon boss).
- 5:30–6:30 — *valley* (act intermission, moor moment, calm music layer, route pick).
- 6:30–9:30 — *rising* (elites, new enemy types).
- 9:30–10:30 — *peak* (Tour Bus boss).
- 10:30–11:30 — *valley* (act 2 intermission).
- 11:30–15:00 — *sustained high* (escalation toward Laird).
- 15:00 — *peak* (Laird boss).
- 15:00–20:00 — *escalating high* (endgame buildup).
- 20:00 — *peak* (Haggis Hunter General).
- 20:00–25:00 — *climb to final peak* (final wave density).
- 25:00 — *FINAL peak* (Taxman).
- Post-kill — *deep valley, reward, reflection*.

**WHS fit.** **LARGELY SHIPPED — lean into valleys.** Current game has boss peaks well-paced. Strengthen the *valleys* — the act intermissions should be *noticeably calmer*, with distinct music, distinct visual tone, distinct banter. This enhances *both* the preceding peak (contrast) and the following build-up (anticipation).

### 6.2 Rest As Structural Element

**The principle.** Rest moments are *not wasted* — they're where emotional meaning consolidates.

**Types of rest moments:**
1. **Mechanical rest** — no enemies, no input demands (Slay the Spire rest-nodes, Dead Cells safe rooms).
2. **Visual rest** — environmental shift, quieter palette (Hades after boss fights — chamber before the next).
3. **Audio rest** — music quieter or paused (Celeste's summit).
4. **Narrative rest** — a line of dialogue, a moment to process (Hollow Knight's bench benches).

**WHS fit.** **OPPORTUNITY.** Moor moments (peat glint, heather rest) exist in banter. Formalise them: specific *narrative rest beats* with distinct music cue, distinct visual cue, banter line, XP pause. Each act intermission is a candidate. The post-boss-kill 2-second breath is another.

### 6.3 Warmth Transfer — The Soul Charter's Core

**The principle.** The game should *like* the player. Every system should be tuned to express affection.

**Concrete warmth techniques:**
- **Forgiveness mechanics** (coyote time, buffer frames, edge-snap) — the game is on your side.
- **Progress-visible rewards** — gold accumulates visibly in a jar on Gran's shelf.
- **First-name address** — Gran calls you "wee yin" or by variant-specific name.
- **Contextual care** — Gran notices if you've died a lot ("come awa', hen, ye need a cuppa").
- **No blame-framing** — cause-of-death phrased as observation, not accusation ("the kelpie caught ye" not "you died to a kelpie").
- **Celebration of small moments** — first-ever kill of an enemy type, first-ever evolution, first-time route picks all get *unique* acknowledgment.
- **Protection from self-sabotage** — warnings before destructive choices, ability to change mind.

**WHS fit.** **ALREADY THE NORTH STAR.** Soul Charter document establishes this. Part 8 catalogues specific opportunities.

### 6.4 The Surprise-Delight Principle

**The principle.** The game has *reserves* of content that deploy only when specific conditions are met, creating unexpected joy.

**Types of surprise-delight:**
- **Hidden NPCs** found only by specific actions.
- **First-time voice lines** reserved forever.
- **Easter egg interactions** that never appear in tutorials.
- **Rare visual flourishes** (a shooting star across the moor once in 30 runs).
- **Contextual jokes** triggered only by specific circumstance (dying to a sheep three times in a row).
- **Seasonal appearances** (a snowflake falling on Hogmanay; heather blooming purple only in late summer).

**Rule.** Surprise-delight is *discovered*, not advertised. If it's in a tooltip, it's no longer surprising.

**WHS fit.** **MAJOR OPPORTUNITY.** A "Reserves" document (internal) listing every hidden trigger with a description and activation rule. Ships with *at least* 30 hidden surprises by 1.0.

### 6.5 Meta-Progression as Narrative

**The principle.** Meta-progression (what persists across runs) is *story told through numbers*. The jar of coins filling, the trophy shelf populating, the Almanac entries accumulating — these *are* the narrative.

**Craft choices:**
- *Every* meta-progression beat should correspond to a visible change in the world.
- Unlocked characters appear in the hub (Gran's Croft populates).
- Discovered routes appear on a map in Gran's living room.
- Completed Almanac entries fill a book page-by-page.
- Variant-unlock sequences trigger short scripted scenes.

**WHS fit.** **DEFERRED / OPPORTUNITY.** Gran's Croft is a planned hub. Making it a *literal trophy case* of meta-progression (see roguelite doc Tier S2) embeds narrative in progression.

### 6.6 Loss Framing — "Failure is a Hug"

**The principle.** Failure in a roguelite is the *default* state. A player fails 95% of their runs. The game must make that 95% feel *okay*.

**Techniques.**
- **Always earned something** — gold banked, achievements made, Almanac entries added.
- **Warm framing in death screen** — "Ye gave it laldy" rather than "YOU DIED".
- **Gran's reassurance** — her commentary is kind.
- **Visual gentleness** — fade, not smash. Warm reds, not violent.
- **Forward motion** — "rerun" is the default button, "quit" requires clicking.
- **Lineage framing** — the haggis's legacy is continuous, not discrete defeats.

**WHS fit.** **STRONG FOUNDATION — deepen.** Death screen exists with cause-tracker. The warmth-framing work is writing (banter) + visual polish (fade curves, palette choice).

### 6.7 Anticipation Design

**The principle.** Anticipation is *half* the pleasure. The game should seed *foreknowledge* that builds excitement before a reward.

**Techniques.**
- **Visible evolution-readiness** (a weapon glows at L4 if its paired passive is equipped).
- **Boss-incoming audio cue** (10 seconds of music shift before boss spawns).
- **Route preview** (route picker shows symbols hinting at each route's flavour).
- **Relic drop silhouettes** (a mystery relic shows a silhouette in the drop UI before pickup).
- **Hidden-route hints** (faint audio cue when near a hidden trigger).

**WHS fit.** **OPPORTUNITY.** Evolution-ready glow not confirmed. Boss-warning exists. Route preview is strong per inventory. Each of these could be sharpened further.

### 6.8 Catharsis Design

**The principle.** Catharsis is the *release* after tension. The kill after the chase. The heal after the scare. The victory after the sustained build.

**Techniques.**
- **Explicit release beats** — after sustained tension, a guaranteed heal, guaranteed kill, or guaranteed reward.
- **Music reinforces release** — key changes from minor to major.
- **Visual openness** — tight spaces open into wide ones.
- **Volume dynamics** — loud tension → silent release → triumphant cue.

**WHS fit.** **IMPROVE WITH CARE.** Every boss kill should be a cathartic release, not just a stat advance. Add:
- A 1-second time-dilation after boss final blow.
- Music key-change + swell.
- Visual palette wash (the moor briefly brightens).
- Gran banter line.
- Trophy add (to Gran's Croft).
- Heal for 20% max HP automatically.

### 6.9 The Rhythm of Delight

**Reward should be rhythmic, not constant.**

**A sample minute-by-minute reward rhythm:**
- Every 2–3 seconds: a kill reward (small).
- Every 10–15 seconds: a gem pickup cluster (medium).
- Every 30 seconds: a level-up card (big).
- Every 1–2 minutes: a chest (bigger).
- Every 5 minutes: a boss (biggest).
- Every 15 minutes: an evolution (rare peak).
- Per run: a lineage/legacy moment (reserved peak).

The player's dopamine system learns this rhythm and *anticipates* each tier. Breaking rhythm (a long dry spell, a surprise reward) creates specific emotional beats.

**WHS fit.** **MOSTLY TUNED — verify tight rhythms feel right.** Playtest with rhythm-measurement tools if possible.

### 6.10 The Ending Problem

**The principle.** Most games have bad endings. Because endings are *hard*. Roguelites particularly struggle — how do you end a game designed to be re-played?

**Solutions from great roguelites:**
- **Hades:** first "ending" isn't real; multiple escapes → narrative unfolds → *true* ending after dozens of completions + credits roll.
- **Slay the Spire:** credits on Act 3 clear; *post-credits* Act 4 (Heart) for deeper endings.
- **Returnal:** structural answer to loop narrative.
- **Vampire Survivors:** no "ending" — time-based runs and meta-progression forever.

**Ending design checklist.**
- Earn-able only by skill, not time.
- Different from *winning a boss* (narrative beat > mechanical beat).
- Reserved music, reserved visuals, reserved banter.
- Provide *closure* (some variable resolves permanently).
- Also provide *continuation* (more to find, more to play).

**WHS fit.** **DEFERRED — speculative area.** Per roguelite doc Tier C7, a true-ending narrative arc is post-1.0 territory. When it arrives, this framework applies. For now, Taxman kill = credits moment; a richer "true ending" earns its own spec.

### 6.11 Callbacks & Recurrence

**The principle.** A game's emotional depth compounds when later moments *call back* to earlier ones.

**Examples.**
- A boss mentioning the player's *previous* deaths.
- A route whose name changes after you've picked it 10 times.
- Gran referencing a specific past run ("mind the time ye nearly got the Taxman first try?").
- A weapon that *remembers* how many kills it's accumulated across all runs.

**WHS fit.** **DEFERRED BUT POWERFUL.** Lineage (noted in superpowers specs) gestures at this. Callbacks should be a *layer* of the banter system — some lines condition on stats in save data, not just run state.

### 6.12 The "Warmth Audit"

A question for every system: *does this make the player feel warm, or cold?*

Cold systems:
- Punitive mechanics without kindness.
- Information hidden to create difficulty.
- Unsaid "you failed because you're bad."
- UI that fights the player.
- Features that grind for their own sake.

Warm systems:
- Forgiveness and cushion.
- Transparent mechanics explained in-context.
- Every failure has a reframe ("ye learned summit, eh?").
- UI that anticipates the player.
- Every investment of time has a visible return.

**WHS fit.** **ALREADY PRIORITISED.** A regular warmth-audit (every few months, or every new system) keeps the Soul Charter central.

---

## Part 7 — Scottish-Specific Feel

This section fuses everything in Parts 1–6 with WHS's Scottish cultural identity. These are feel techniques that *only* make sense for a Scottish-themed game — the intersection where craft and theme become inseparable.

### 7.1 The Scottish Tonal Spectrum

Scottish atmosphere ranges across a specific emotional spectrum:

- **Hearth** — warm, welcoming, humorous. Gran's voice. Still Game. Pub fires. The *bonnie* pole.
- **Wild** — windswept, lonely, vast. Empty moors. Callanish stones at dawn. Ben Macdui silence.
- **Fey** — otherworldly, tricksy, magical. Faerie pools. Seelie procession. Caithness at twilight.
- **Grave** — heavy, historical, sombre. Culloden moor. Glencoe. Jacobite memory.
- **Wild Comedy** — absurdist, cheeky, sharp. Limmy. Buckfast. Deep-fried Mars bars.

A masterpiece WHS moves *fluidly* across this spectrum. Different biomes, different bosses, different moments favour different tones. The *music*, *visuals*, *banter*, and *pacing* should all shift as the tone shifts.

**Practical craft.** Define a *tone value* for every major scene/event and design its feel-stack for that tone:
- Moor Road act intermissions → Hearth (warm music, Gran's voice, golden light).
- Cailleach encounters → Fey (icy palette, crystalline audio, ancient-feeling music).
- Culloden memorial biome → Grave (muted palette, silence or low drone, respectful banter).
- Glasgow Close biome → Wild Comedy (sodium-amber, sharp audio, Limmy-esque banter).
- Boss finales → Wild (sweeping, anthemic, high-stakes orchestration).

### 7.2 Pibroch Swells as Danger Build-Up

**The principle.** Pibroch (ceòl mòr, *great music*) is Scottish classical-bagpipe form. Slow, stately, elaborate. It *builds* — themes appear, variations layer, tension rises.

**Application.** For incoming boss encounters:
- 10 seconds before boss spawn, a pibroch *urlar* (ground theme) begins at low volume.
- As the boss approaches, pibroch *variations* layer atop.
- Boss enters = full pibroch-informed combat music (not classical pibroch, but pibroch-flavoured).
- Boss phase transitions = pibroch *crunluath* (ornate final variation) flourish.

This is *culturally authentic* music-feel, not generic orchestral stinger.

**WHS fit.** **SPEC-WORTHY EXPANSION of music engine.** The current engine has a conductor reading game state. Adding a "pibroch mode" — a pre-built set of Scottish-folk-informed generation recipes — is a natural extension.

### 7.3 Ceilidh Rhythm in Combat Flow

**The principle.** Ceilidh dance rhythms — reels (4/4 fast), jigs (6/8 fast), strathspeys (4/4 with snap rhythm) — are the folk-pulse of Scottish communal music. They're *danceable*, which means they synchronise well with movement.

**Application.** Not literally dance-rhythm gameplay, but:
- Combat music transitions use ceilidh-rhythm frames — when combat intensifies, the underlying pulse shifts from slow to a reel-tempo (~120 bpm).
- Combo milestones can land on beat — the 10-kill chime lands on beat 1 of the next measure, not arbitrary.
- Attack-SFX fires can be *lightly* quantized to beat for rhythmic satisfaction when combat is intense.

**WHS fit.** **SUBTLE CRAFT OPPORTUNITY.** Soft quantization of SFX to the music beat is a feel-layer almost no survivor-like does. Would be distinctive.

### 7.4 Bagpipe Drone as Boss-Fight Bed

**The principle.** The great Highland bagpipe drone — the continuous low B-flat that sits beneath every tune — is an *emotional constant*. A drone beneath combat music creates *gravity* without competing for attention.

**Application.** Every boss fight has a *drone layer* running continuously throughout, with combat music on top. The drone *is* the boss's presence. Boss fades → drone fades.

Even better: specific drones per boss:
- Gordon: a low cooking-bell drone.
- Tour Bus: a diesel-engine drone.
- Laird: a dignified horn drone.
- Haggis Hunter General: a hunt-horn.
- Taxman: a typewriter-tick drone (comedy-gravitas).

**WHS fit.** **NEW OPPORTUNITY.** A distinct audio-identity for each boss. Low cost, huge character.

### 7.5 Haar Roll-Ins as Biome Transitions

**The principle.** *Haar* — the sea-fog that rolls inland on Scotland's east coast — is a *slow, inevitable, beautiful* visual phenomenon. It is itself a transition.

**Application.** Biome transitions in WHS can *use haar as the transition*:
- Leaving moor for loch → a haar wave sweeps across screen, obscures, lifts to reveal new biome.
- Act intermissions → haar rolls in, pauses combat, Moor Road UI surfaces.
- Post-boss cleanup → haar-wash before the route picker.

**WHS fit.** **VISUAL OPPORTUNITY.** Custom-crafted haar-transition shader (even simple) would create a signature visual moment every player associates with WHS.

### 7.6 Heather Wind as Ambient Texture

**The principle.** Heather is Scotland's iconic ground cover. In wind, it *ripples* — a specific slow-wave motion distinct from grass.

**Application.** The main moor should have heather that ripples in the wind *always*. Wind direction can shift with conditions (boss incoming → wind picks up; calm → wind dies). Visual alone, but *evokes Scotland* immediately.

**WHS fit.** **UNDERUSED.** Ambient environmental motion is probably limited; adding systematic heather-wind would be a signature.

### 7.7 Hearth vs Edge Voice in Banter

**Already shipped in VOICE_CARD.md.** The Still-Game-hearth vs Limmy-edge registers exist in banter guidelines.

**Feel-pass refinement.**
- **Hearth** moments should have *warmer* audio delivery (lower-pitched synth voice, slower rhythm, lower volume).
- **Edge** moments should have *crisper* delivery (higher-pitched or clearer, faster rhythm, sharper onset).
- Even without voice acting, *text-display timing* can encode this — hearth banter holds on screen 30% longer than edge banter. The slower hold makes it feel more *pondered*, which reads as warmth.

### 7.8 Scottish Pacing — Long Brooding, Then Explosion

**The principle.** Scottish traditional storytelling has a distinctive pacing — patient setup, building, building, then *violent* or *triumphant* release. Traditional Celtic songs, pibroch form, even Burns's poetic structure follow this.

**Application.**
- Per-run pacing: patient first 5 minutes, building 5–15, escalating 15–25, explosive 25-end. Matches §6.1 but with *Scottish specific* emotional cadence.
- Per-boss pacing: patient build-up before fight, explosive combat, sustained aftermath.
- Per-evolution: *wait* the player through L1-L4 patiently; *explode* the evolution peak.

**WHS fit.** **ALREADY MOSTLY ALIGNED — codify.** A spec note formalising "Scottish pacing" as a design principle helps keep future systems aligned.

### 7.9 Warm Colour for Hearth, Cold for Cailleach

**Palette feel-correspondence.**
- **Moor (default) + Gran's Croft:** warm browns, heather purples, golden accents. Hearth palette.
- **Loch / Coastal:** cool blues, greys, white-spray highlights. Wild palette.
- **Cailleach / Winter / Fey:** icy blues, pale silvers, starlight white. Fey palette.
- **Urban Glesga:** sodium amber, pavement grey, neon accents. Wild-comedy palette.
- **Culloden / Glencoe:** desaturated greys, bracken red, deep shadow. Grave palette.
- **Boss arenas:** palette shifts toward each boss's thematic colour (Gordon = red-hot kitchen; Tour Bus = chrome/tartan mix; Laird = heraldic colours; Taxman = sepia-ink).

**WHS fit.** **MOSTLY SHIPPED — formalise.** Existing biome palettes align; extending rigour across future biomes prevents drift.

### 7.10 Thistle as Visual-Audio Callsign

**The principle.** A national emblem shows up as a *recurring visual motif* everywhere — pickup sparkles, crown shapes, transition VFX, UI accents. Over 30 hours of play, the thistle becomes inseparable from the game's identity.

**Application.**
- Crit damage number → thistle-tuft particle trail.
- Evolution pickup → thistle-burst VFX.
- Level-up card → thistle-ornamented border.
- Gran's Croft → thistles in the window box.
- Moor moment text → thistle-shaped bullet points.
- Loading spinner → rotating thistle silhouette.

**WHS fit.** **OPPORTUNITY.** Thistle-motif consistency audit across all VFX + UI would deepen visual identity.

### 7.11 Gaelic and Scots Language Audio Texture

Even in a text-only banter system, *how* lines are displayed carries audio-adjacent meaning.

**Scots text:** displayed in slightly condensed font, closer letter spacing. Warmth-adjacent.
**Gaelic text** (Cailleach, Hebrides): displayed in slightly larger font, more serif detail, with italics for untranslated phrases. Fey-adjacent.
**English:** standard. Neutral.

Optional: a text-to-speech pass for accessibility could provide actual voiced Scots and Gaelic lines. Higher production but *massive* emotional increase.

**WHS fit.** **REFINEMENT — low effort / high impact.** Font-based tonal coding is cheap and legible.

### 7.12 Scottish Moments We Should Have

A reserved list of distinctive Scottish-specific feel moments the game *must* deliver:

1. **The first kilt.** Unlocking the Kilt passive for the first time shows the haggis donning a kilt with specific animation.
2. **The first dram.** Whisky Flask pickup plays a little *cheers* SFX.
3. **The first thistle in bloom.** A thistle patch blossoms on-screen during a run when the player picks up a rare stat.
4. **The first ceilidh.** A ceilidh event triggers once per variant; brief rhythm mini-moment.
5. **The first haar.** Haar-wave visual explicitly narrated in banter ("the haar's comin' in").
6. **The first pibroch swell.** Pre-boss pibroch crescendo called out ("hear that? it's the pipes").
7. **The first Hogmanay.** Seasonal event introduces itself warmly.
8. **The first Gaelic line.** Cailleach (or another variant) speaks Gaelic; banter translates softly.
9. **The first tartan pattern unlock.** Visible in Gran's wardrobe.
10. **The first sheep spared.** If the player doesn't kill any sheep in a run, Gran acknowledges.

---

## Part 8 — WHS Application Map

The operational catalogue. Each opportunity below is grounded in the preceding parts, mapped to a specific WHS system, tagged by Soul Charter lens (WARMTH / CLARITY / KINETICS / EMOTION), and sized by effort vs. impact.

Legend:

- **Effort:** ● (hour), ●● (day), ●●● (week), ●●●● (month), ●●●●● (multi-month)
- **Impact:** ★ (minor), ★★ (noticeable), ★★★ (significant), ★★★★ (transformative)
- **Lenses:** WARMTH (W), CLARITY (C), KINETICS (K), EMOTION (E)

---

### 8.1 Audio Polish Pass

| # | Opportunity | Ref | Effort | Impact | Lenses |
|---|---|---|---|---|---|
| A1 | **Graduated hit-stop** — crit = 40ms, boss hit = 80ms, boss kill = 300ms, act complete = 500ms | §3.1 | ● | ★★★ | K |
| A2 | **Pitch variance on frequent SFX** — ±3 semitones on gem pickup, weapon fire, kill confirm | §4.2 | ●● | ★★★ | C |
| A3 | **Three-layer recording of key SFX** — boss hits, crits, evolution, level-up, pickup | §4.1 | ●●●● | ★★★★ | K/E |
| A4 | **15 named stingers** — level-up, evolution, boss-warn, boss-kill, combo milestones, act-complete, chest-open, etc. | §4.6 | ●●●● | ★★★★ | K/E |
| A5 | **Per-biome ambience beds** — wind+heather for moor, lap+reeds+loon for loch, etc. | §4.10 | ●●● | ★★★ | E |
| A6 | **Per-boss drone layer** — cooking bell for Gordon, diesel for Tour Bus, horn for Laird, typewriter for Taxman | §7.4 | ●●● | ★★★★ | E |
| A7 | **Ducking profile audit** — boss warnings should aggressively duck ambient combat | §4.3 | ● | ★★ | C |
| A8 | **Beat-aligned evolution triggers** — evolution fires on next musical beat, not instantly | §4.9 | ●● | ★★★ | E/K |
| A9 | **Silence-before-boss** — 500ms music duck before boss warning lands | §4.7 | ● | ★★ | E |
| A10 | **Signature audio motif** — a Gran hum, a haggis contented-grunt, a moor wind — always present | §4.12 | ●●● | ★★★★ | E |
| A11 | **Staggered gem-pickup rhythm** — collect chain creates rising pling-pling | §3.16 | ● | ★★★ | K |
| A12 | **Scottish text font tonality** — Scots condensed, Gaelic serif-italic, English standard | §7.11 | ● | ★ | E |

### 8.2 Visual Polish Pass

| # | Opportunity | Ref | Effort | Impact | Lenses |
|---|---|---|---|---|---|
| V1 | **Themed particle packs per weapon** — wood chips for Caber, droplets for Scotch Mist, thistle-tufts for Thistle Shot, musical notes for Bagpipes, water for Nessie | §3.9 | ●●● | ★★★ | K |
| V2 | **Themed particle packs per enemy** — oat scatter for haggis, water splash for kelpie, mist swirl for wraith | §3.9 | ●●● | ★★★ | K |
| V3 | **Smear-frame on haggis dash** — single intermediate stretched frame | §3.6 | ● | ★★ | K |
| V4 | **Squash-and-stretch on haggis** — dash start, dash end, level-up, pickup, hit react | §3.5 | ●● | ★★ | K |
| V5 | **Haar-wave biome transition** — haar rolls in/out on biome/act changes | §7.5 | ●●● | ★★★ | E |
| V6 | **Heather wind ripple** — default ambient motion on the moor | §7.6 | ●● | ★★★ | E |
| V7 | **Enemy impact-flash frame** — 1-frame tint inversion on hit | §3.8 | ● | ★★ | K |
| V8 | **Camera kick on damage-taken** — 4px directional kick | §3.3 | ● | ★★ | K |
| V9 | **Thistle motif audit** — unify crit trails, evolution bursts, UI borders, Gran's Croft | §7.10 | ●● | ★★ | E |
| V10 | **Damage number variants** — crit = bigger/goldier, burn = orange with trail, bonus = sparkle | §3.12 | ●● | ★★ | C |
| V11 | **AoE damage number aggregation** — "87 ×3" when multiple hits on frame | §3.12 | ●● | ★★★ | C |
| V12 | **UI micro-interactions** — button hover-scale, HP-bar drain animation, XP shimmer | §3.15 | ●●● | ★★★ | W |
| V13 | **HP bar drain animation** — damage = flash-red then slow-drain, not snap | §3.15, §5.7 | ●● | ★★★ | C/E |
| V14 | **Evolution-ready glow** — weapon icon glows when L4 + matching passive owned | §6.7 | ●● | ★★★ | C/E |
| V15 | **Silhouette audit** — confirm each enemy is distinct as pure-silhouette | §5.1 | ●● | ★★ | C |
| V16 | **Telegraph taxonomy** — systematise attack-warnings across all enemies (consistent colour-coding) | §5.5 | ●●● | ★★★★ | C |
| V17 | **Living UI** — HP pulse at low HP, XP shimmer during fill, combo-counter growth | §5.7 | ●● | ★★ | W |
| V18 | **Permanence / kill scars** — small fading wisp at kill site for 2–4s | §3.14 | ● | ★★ | K |
| V19 | **Procedural tartan unlock reveal** — when a clan pattern unlocks, show the reveal as a moment | §5.9 | ●● | ★★★ | E |
| V20 | **Boss arena palette shift** — boss spawn = brief palette wash toward boss's theme | §5.8, §7.9 | ●●● | ★★★ | E/K |

### 8.3 Moments Requiring a Full-Stack Polish Treatment

Per §2.9's "Great Moment Recipe," these existing/planned moments deserve the full treatment — pre-condition earning, anticipation, peak, multi-channel feedback, narrative frame, rest beat:

| # | Moment | Current state | Full-stack treatment | Ref |
|---|---|---|---|---|
| M1 | **First evolution pickup** | Modest VFX, card pickup | Pause combat 600ms, full-screen name reveal, stinger, reserved banter, permanent VFX change visible | §2.5 |
| M2 | **Any boss kill** | Existing spectacle pass is decent | Add: 1s time-dilation, music key-change swell, palette wash, auto-heal 20%, Gran banter, trophy to Croft | §6.8 |
| M3 | **Taxman kill (first ever)** | Victory screen | Full catharsis: reserved music, reserved banter, reserved visuals, permanent meta-progression unlock, scripted post-run moment | §6.10 |
| M4 | **Combo milestone 100** | Existing VFX | Add reserved Gran banter, bodhrán layer enters, special VFX signature | §3.12 |
| M5 | **First time encountering a new enemy** | No special handling | Brief first-encounter banter pool; Almanac entry ping | §6.4 |
| M6 | **Level-up card pickup at evolution-ready state** | Normal card pickup | Fanfare stinger; "Your [weapon] is ready to evolve!" banter | §6.7 |
| M7 | **Moor Road intermission** | UI widget, route pick | Act as a *valley* — music shifts to hearth-warm, palette shifts, Gran hums, breath before pick | §6.2 |
| M8 | **Cailleach's Bargain (when built)** | Not built yet | Devil-deal-style moment: environmental shift, reserved music, visible trade, no-penalty skip | §2.6 |
| M9 | **Variant unlock** | Save flag | Cutscene moment: Gran's Croft drove grows by one; scripted introductory banter from new variant | §6.5 |
| M10 | **Daily challenge completion** | Score log | Reserved victory moment distinct from normal run victory | §6.4 |

### 8.4 Forgiveness Mechanics (The Celeste Doctrine)

| # | Opportunity | Ref | Effort | Impact | Lenses |
|---|---|---|---|---|---|
| F1 | **Dash input buffer** — remember dash press for 100ms across hit-freeze | §3.10 | ● | ★★★ | K |
| F2 | **Pickup grace** — gems pull toward player for 100ms after leaving range | §3.11 | ● | ★★ | W |
| F3 | **Hazard exit fade** — on-lava vignette eases out over 300ms instead of snap | §3.11 | ● | ★ | W |
| F4 | **Dash edge-snap** — dash ending within 2px of healing circle nudges onto it | §3.11 | ●● | ★★ | W |
| F5 | **Damage mercy window** — first 200ms after spawn/respawn is invulnerable | §3.10 | ● | ★★ | W |
| F6 | **Near-miss feedback** — projectiles that narrowly miss the haggis produce a brief air-whoosh | §3.9 | ●● | ★★ | K/C |
| F7 | **Post-death button forgiveness** — "rerun" button only selectable after 800ms (prevents accidental click) | §6.6 | ● | ★ | W |

### 8.5 Narrative Moments & Emotional Beats

| # | Opportunity | Ref | Effort | Impact | Lenses |
|---|---|---|---|---|---|
| N1 | **Gran's Croft as trophy case** | §6.5 | ●●●● | ★★★★ | W/E |
| N2 | **Almanac with first-time triggers** — every enemy/route/item/banter line logs on first encounter | §6.4 | ●●● | ★★★ | E |
| N3 | **Death-cause banter variants** — 30 warm death reflections, one per cause | §6.6 | ●● | ★★★ | W/E |
| N4 | **Lineage callbacks** — Gran's banter references past runs (requires save-stat reads) | §6.11 | ●●● | ★★★ | E |
| N5 | **30+ hidden surprise-delight triggers** | §6.4 | ●●●● | ★★★ | E |
| N6 | **Seasonal events with unique banter** (Hogmanay, Burns, Beltane, etc.) | Scottish doc §4.5 | ●●●● | ★★★★ | E |
| N7 | **"Moor moment" formalisation** — narrative rest beat with distinct music/visual cue | §6.2 | ●● | ★★★ | W |
| N8 | **Gran's internal commentary during run** (deprioritised from chat) — occasional whispers of encouragement | §4.8 | ●● | ★★ | W |
| N9 | **Run-end reflection banter** — Gran comments on how the run went | §6.6 | ●● | ★★ | W/E |
| N10 | **First-ever unique lines** — reserved content for ever-first trigger of specific events | §6.4 | ●●● | ★★ | E |

### 8.6 Per-Weapon Feel Refinement

Current weapons are functional. A feel-pass per weapon would elevate each to signature-level. Template below applies to each:

**Template per weapon:**
- **Fire anticipation** (1–2 frames).
- **Fire SFX** (3-layer: body, accent, tail).
- **Projectile motion curve** (not linear — eased).
- **Impact VFX** (themed per weapon).
- **Impact SFX** (unique thunk/splash/ping).
- **Critical hit overlay** (weapon-specific flourish).
- **Evolution transformation cinematic** (one-time per run).
- **Evolved weapon wholly-distinct feel** (not just stronger — *different* in sound and motion).

| Weapon | Unique Feel Target |
|---|---|
| Thistle Shot | Sharp *ping* + thistle-tuft trail; evolution adds storm-rumble bed |
| Bagpipe Blast | Whoosh + drone hum; evolution becomes sustained musical pulse |
| Caber Toss | Wooden *thoomp* + whistle-on-flight; evolution gives repeated wood-clap rhythm |
| Scotch Mist | Wet *swoosh* + faint *scrapyard pat*; evolution adds swirl-whistle |
| Haggis Hurler | Comic bounce-chime + oat-scatter; evolution adds cannon boom |
| Nessie Tentacle | Splash + deep gurgle; evolution adds creature-roar |
| Claymore | Metal-ring + flesh-thud; evolution becomes longer-ringing steel |
| Bagpipes (aura) | Continuous low drone; evolution adds fiddle layer in aura |

Effort per weapon: ●●. Full set: ●●●. Impact across all: ★★★★.

### 8.7 Per-Boss Feel Refinement

| Boss | Signature Feel Target |
|---|---|
| Gordon | Kitchen chaos — clattering pans, sizzling audio, steamy VFX, red/orange palette wash. Gran banter intro: "Yer going tae cook him, hen" |
| Tour Bus | Diesel-chug drone, chrome-glint VFX, horn-blast warning stinger. Tour-bus-passenger banter shouts. |
| The Laird | Dignified horn drone, tweed-and-tartan VFX, stag-head silhouette animations. Laird banter has upper-class Edinburgh accent. |
| Haggis Hunter General | Hunt-horn drone, rifle-report SFX per shot, pith-helmet glint. Colonial-imperial disquiet in banter. |
| Taxman | Typewriter-tick drone, ledger-paper VFX, red-ink bleed when struck. Bureaucratic-menace in banter. |

Plus for each: unique boss-arena palette wash, unique pre-fight silence, unique post-kill cinematic beat.

### 8.8 Priority Tiers

Summarising the opportunities into phases:

**Phase 1 — Foundation Polish (1 sprint):**
- A1, A2, A7, A9, A11 (audio basics)
- V7, V8, V10, V13 (visual basics)
- F1, F2, F3, F5 (forgiveness basics)
- M7 (Moor Road intermission as valley)

**Phase 2 — Signature Moments (2 sprints):**
- A3, A4, A6 (three-layer SFX, stingers, boss drones)
- V1, V2, V14, V20 (weapon/enemy particles, evolution-ready glow, boss palette wash)
- M1, M2, M4 (evolution, boss kill, combo 100)
- N3, N7 (death-cause banter, moor moments)

**Phase 3 — Deepening (3 sprints):**
- A5, A8, A10 (biome ambience, beat-aligned, signature motif)
- V3–V6, V9, V11, V12, V15–V17, V19 (visual deep dive)
- M3, M5, M6, M8–M10 (deeper moments)
- N1, N2, N4, N5, N6 (narrative layer)
- Per-weapon + per-boss feel passes (8.6, 8.7)

**Phase 4 — Masterpiece Layer (post-1.0):**
- Scottish-specific bespoke work (§7.2 pibroch engine, §7.5 haar transitions, §7.10 thistle motif)
- Long-tail callback systems (§6.11)
- Hidden surprise-delight reserves (§6.4)

### 8.9 Measurement

How to tell if polish is working:

1. **Playtest the "no sound" test** — play with audio muted. Is the game still readable, still kinetic? If yes, visual feedback is solid.
2. **Playtest the "no visuals" test** — audio only. Is combat still parsable? If yes, audio feedback is solid.
3. **Playtest the "screenshot without HUD" test** — does the screenshot communicate mood? If yes, biome feel is solid.
4. **The 5-second test** — show a new player 5 seconds of gameplay. Can they describe the game's mood?
5. **The replay test** — play a recorded run. Do moments of joy/tension still register on replay (when you know the outcome)?
6. **The new-player test** — first-time players should feel competence within 30 seconds, delight within 2 minutes.

---

## Sources & Further Reading

**Game feel canon (watch / read):**

- [Juice It or Lose It — Martin Jonasson & Petri Purho (talk)](https://www.youtube.com/watch?v=Fy0aCDmgnxg)
- [The Art of Screenshake — Jan Willem Nijman (Vlambeer)](https://www.gamedesign.gg/knowledge-base/game-design/game-feel-feedback/the-art-of-screenshake-jan-willem-nijman-vlambeer/)
- [Masahiro Sakurai on Creating Games — YouTube channel](https://www.youtube.com/@sora_sakurai_en)
- [Masahiro Sakurai on Creating Games overview — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/WebVideo/MasahiroSakuraiOnCreatingGames)
- [Secrets of Game Feel and Juice — Game Maker's Toolkit](https://www.youtube.com/watch?v=216_5nu4aVQ)
- [Why Does Celeste Feel So Good to Play? — Game Maker's Toolkit](https://archive.org/details/youtube-yorTG9at90g)
- [Maddy Thorson's game-feel thread on Celeste](https://x.com/maddythorson/status/1238338574220546049)
- [Celeste & Forgiveness — Maddy Thorson](https://maddythorson.medium.com/celeste-forgiveness-31e4a40399f1)
- [Celeste devs on making the game feel good — GameSpot](https://www.gamespot.com/articles/celeste-dev-explains-how-they-made-their-game-feel/1100-6474775/)

**Audio design:**

- [The Sound of Hades — Gameplay interview with Darren Korb](https://gameplay.co/hades-game-music-sound-design-darren-korb-supergiant-games/)
- [Interview with Darren Korb — Journal of Sound and Music in Games](https://online.ucpress.edu/jsmg/article/6/1/8/205397/Interview-with-Darren-Korb)
- [A Conversation with Hades composer Darren Korb — Echoes and Dust](https://echoesanddust.com/2021/02/a-conversation-with-hades-composer-and-audio-director-darren-korb/)
- [Darren Korb — Wikipedia](https://en.wikipedia.org/wiki/Darren_Korb)
- [Making Your Game's Music More Dynamic: Vertical Layering vs. Horizontal Resequencing](https://www.thegameaudioco.com/making-your-game-s-music-more-dynamic-vertical-layering-vs-horizontal-resequencing)
- [Adaptive music — Wikipedia](https://en.wikipedia.org/wiki/Adaptive_music)
- [Adaptive Music Techniques in Video Games](https://ollybradbury.wordpress.com/2021/10/19/adaptive-music-techniques-in-video-game-music/)
- [5 Legendary Adaptive Music Games](https://mojokid.com/adaptive_game_music/)

**Visual / pixel art:**

- [Pixel Art Design for Game Development — Alain Galvan](https://alain.xyz/blog/pixel-art-design-for-game-dev)
- [Pixel Art for Games — Ziva](https://ziva.sh/blogs/pixel-art-tutorial)
- [2D pixel art style guide for games — Sprite-AI](https://www.sprite-ai.art/blog/2d-pixel-art-style-guide)
- [Lospec Palette List](https://lospec.com/palette-list)
- [Pixel Logic — A Guide to Pixel Art](https://anyflip.com/kdjou/llhc/basic/101-150)

**Books and deeper references:**

- Steve Swink, *Game Feel: A Game Designer's Guide to Virtual Sensation* (2008) — the academic founding text.
- Jesse Schell, *The Art of Game Design: A Book of Lenses* — the 100+ lenses cover feel/emotion deeply.
- Celia Hodent, *The Gamer's Brain* — cognitive psychology for designers.
- Ernest Adams, *Fundamentals of Game Design* — feel chapters particularly useful.

**Talks worth an afternoon:**

- Rami Ismail on game feel (multiple GDC appearances).
- Derek Yu on Spelunky's simulation emergence.
- Jonathan Blow on design-through-prototyping.
- Edmund McMillen on Isaac's "broken by design" philosophy.

**WHS-internal cross-references:**

- `docs/DESIGN_SOUL.md` — the north star for every lens decision.
- `docs/VOICE_CARD.md` — Scottish voice identity underpinning banter feel.
- `docs/ART_STYLE_BIBLE.md` — visual direction foundations.
- `docs/research/ROGUELITE_RESEARCH.md` — structural patterns (complementary layer).
- `docs/research/SCOTTISH_RESEARCH.md` — thematic material (complementary layer).

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). 8 parts, ~18k words. Introduces game-feel canon, 8 moment anatomies, 17-entry technical toolkit, 12-entry audio catalogue, 11-entry visual language guide, 12-entry emotional architecture, 12-entry Scottish-specific feel, and 80+ tagged WHS opportunities in Part 8 (audio, visual, moments, forgiveness, narrative, per-weapon, per-boss) with effort/impact/lens tagging and 4-phase priority tiers. Third research doc in the sequence (roguelite structure → Scottish content → craft of feel).
