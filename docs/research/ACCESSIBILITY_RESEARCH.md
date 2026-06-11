# Accessibility Research — Wild Haggis Survivors

> *"If a technique fails all four lenses for WHS, it's noted as not a fit. Masterpiece polish is selective, not maximal."*
> — from `DESIGN_SOUL.md`, the Soul Charter
>
> Accessibility passes the lens on all four: **warmth** (the game on your side), **clarity** (everyone can parse it), **kinetics** (no one locked out of feel), **emotion** (no one locked out of stories). It's not a layer on top of the Soul Charter; it *is* the Soul Charter in implementation form.

> **Purpose.** A practical, WHS-calibrated reference for accessibility — the craft of making a game playable, understandable, and enjoyable by everyone, regardless of physical, sensory, or cognitive ability. Scotland's national motto is *Nemo me impune lacessit* ("No one provokes me with impunity"). A Scottish game should also live by: *No-one locked oot without good reason.*
>
> **How this relates to other docs.**
> - `DESIGN_SOUL.md` — the Comfort matrix is already strong on *what ships*. This doc covers the *principles and best-practices underneath*.
> - `ART_STYLE_BIBLE.md` — palette decisions need colorblind audit (see Part 3).
> - `GAME_FEEL_RESEARCH.md` — particle density, screen shake, hit-freeze — all have accessibility implications.
> - **This doc** — the accessibility engineering playbook and the ethical framework.
>
> **How to use.**
> 1. When designing a new visual-heavy feature (particles, shader effects, fast cuts) — **check Part 2 (photosensitivity) first**. This is non-negotiable.
> 2. When designing a new palette or colour-coded system — check Part 3 (visual, colorblind).
> 3. When designing a new input / timing mechanic — check Part 5 (motor).
> 4. Before any public release — run through Part 8 (WHS audit) and Part 9 (testing).
>
> **Scope.** 10 parts, ~13,000 words. Foundational principles, photosensitivity (critical), visual/audio/motor/cognitive accessibility, platform requirements, WHS-specific audit against the current Comfort matrix, testing methodology, Soul Charter alignment with prioritised opportunities.
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — eighth doc in the WHS research series. Foundational for all player-facing specs.

---

## Table of Contents

1. [Part 1 — Foundational Principles](#part-1--foundational-principles)
2. [Part 2 — Photosensitivity & Seizure Safety (Critical)](#part-2--photosensitivity--seizure-safety-critical)
3. [Part 3 — Visual Accessibility](#part-3--visual-accessibility)
4. [Part 4 — Audio Accessibility](#part-4--audio-accessibility)
5. [Part 5 — Motor Accessibility](#part-5--motor-accessibility)
6. [Part 6 — Cognitive Accessibility](#part-6--cognitive-accessibility)
7. [Part 7 — Platform Requirements & Certification](#part-7--platform-requirements--certification)
8. [Part 8 — The WHS Accessibility Audit](#part-8--the-whs-accessibility-audit)
9. [Part 9 — Testing Accessibility](#part-9--testing-accessibility)
10. [Part 10 — Soul Charter Alignment + WHS Opportunities](#part-10--soul-charter-alignment--whs-opportunities)
11. [Sources & Further Reading](#sources--further-reading)
12. [Changelog](#changelog)

---

## Part 1 — Foundational Principles

### 1.1 Accessibility as kindness

The Soul Charter promises "the game is on the player's side" — forgiveness mechanics, kind failure framing, celebratory progression. **Accessibility is this promise extended to every possible player.** Not a technical afterthought. Not a compliance exercise. A direct expression of warmth.

Players with disabilities represent approximately **20% of the population**. That's not "a few edge cases." That's one in five.

### 1.2 The curb-cut effect

Accessibility features designed for *specific* users benefit *everyone*:

- **Subtitles:** designed for deaf/HoH players. Used by ~80% of UK viewers (Ofcom 2021) — players in shared apartments, non-native speakers, people processing dense dialogue.
- **Larger text:** designed for low-vision players. Used by everyone playing on a TV across a room.
- **Remappable controls:** designed for motor-impaired players. Used by left-handed players, players with different-sized hands, platform-switchers.
- **Motion reduction:** designed for vestibular-sensitive players. Used by tired players at 2 AM.
- **Colorblind modes:** designed for 1-in-12 male / 1-in-200 female players. Used by anyone viewing on a dim screen, anyone who struggles with game's default palette.
- **Pause-anytime:** designed for players managing symptoms or interrupts. Used by everyone who needs a bathroom break.

**Implication.** Accessibility work is not cost; it's investment in *overall player experience*. The game becomes more playable *for everyone* as it becomes playable *for disabled players*.

### 1.3 The standards landscape

Four reference frameworks drive modern game accessibility:

**1. Game Accessibility Guidelines (GAG)** — [gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/). Founded 2012 by Ian Hamilton and collaborators. *The* industry reference. Free, regularly updated, organised by impairment type (motor, cognitive, vision, hearing, speech) and by difficulty level (Basic / Intermediate / Advanced). This is the living canonical checklist.

**2. Xbox Accessibility Guidelines (XAGs)** — [Microsoft Learn](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines). Developed by Microsoft with input from gaming-disability community. 123+ guidelines across multiple categories. Xbox explicitly states these are *not* certification requirements but are best-practice guardrails. Used internally by Microsoft and published free for any developer.

**3. WCAG 2.2 (Web Content Accessibility Guidelines)** — [W3C](https://www.w3.org/WAI/WCAG22/). Primarily for web content but increasingly applied to games (especially browser-based games — like WHS). Levels A / AA / AAA of conformance. Contains the **flash threshold success criterion (2.3.1)** that's legally binding in many jurisdictions for web content.

**4. CVAA (21st Century Communications and Video Accessibility Act, US 2010)** — legally mandates accessibility in certain communications features in games sold in the US (chat, menus). Games released after 2017 in the US must generally comply. Enforced by the FCC.

**Secondary frameworks:**
- **APX (Accessible Player Experiences)** — framework from the AbleGamers Charity. More about process than specific requirements.
- **PlayStation Accessibility Framework** — Sony's internal guidelines.
- **Steam Accessibility Tags** (launched 2025) — 16 features across Gameplay, Visual, Audio, Input categories. Voluntary but recommended.
- **European Accessibility Act (EAA)** — effective June 2025 in EU; affects certain digital products. Games mostly outside direct scope but adjacent.

### 1.4 The categories of accessibility

Typical organisation (used throughout this doc):

- **Visual** — for blind, low-vision, colorblind players.
- **Auditory** — for deaf, hard-of-hearing players, and any player in quiet environments.
- **Motor** — for players with limited mobility, hand tremor, one-handed, prosthetics, adaptive controllers.
- **Cognitive** — for players with learning differences, ADHD, autism, memory-affecting conditions, young players, non-native language speakers.
- **Vestibular** — for players sensitive to motion.
- **Photosensitive** — for players with photosensitive epilepsy or migraine triggers.
- **Speech** — for games requiring voice input (not WHS-relevant currently).

### 1.5 The ethical commitment

**WHS commits to:**
1. **Never ship content that can cause seizures.** Test with PEAT, every build.
2. **Never lock content behind inaccessibility.** If a player can't see it, hear it, reach the input, or understand it — there should be an alternative path, or we've failed.
3. **Never frame accessibility as "easy mode."** Language matters. See Celeste's renaming "Cheat Mode" → "Assist Mode".
4. **Consult the community.** Before shipping major accessibility features, seek feedback from disabled players.
5. **Credit consultants.** Always in credits. Often paid.

### 1.6 Accessibility is never "done"

This isn't a checklist to complete. It's an ongoing commitment. New platforms, new impairments, new technologies. The Game Accessibility Guidelines update regularly. So should our practice.

---

## Part 2 — Photosensitivity & Seizure Safety (Critical)

**This part is non-optional.** WHS is a particle-dense survivor-like. It *will* have visual patterns capable of triggering seizures unless designed to avoid them. The responsibility is on us, as developers.

### 2.1 The risk, the prevalence, the stakes

**Photosensitive epilepsy** affects approximately **1 in 4,000 people** (0.025%). Sounds small. But:
- Many people don't know they have it until a seizure.
- Migraine sufferers (far more common — ~12% of population) can be triggered by similar visual patterns.
- A single flashing-light sequence can cause permanent harm to a player who didn't know they were at risk.
- The precedent is real: *Pokémon's* 1997 "Porygon" episode hospitalised ~700 Japanese children after a red/blue strobe effect.
- Nintendo's 1990s disclaimer ("Do not play while tired") was insufficient. Modern practice is *prevention-first, disclaimers-as-backup*.

**The stakes.** A WHS player having a seizure triggered by the game is a deep, human, avoidable harm. This is non-negotiable.

### 2.2 The thresholds (quantified)

Per WCAG 2.2 Success Criterion 2.3.1 and the International Guidelines for Photosensitive Epilepsy:

**Safe content:**
- ≤ 3 flashes per second (general flashes and red flashes both).
- Flash area ≤ 25% of screen (at standard viewing distance).
- No sustained flashing for > 5 seconds in a single sequence.
- If all three conditions are met, content is "safe enough" by international standard.

**Especially dangerous:**
- **Red flashes.** Saturated red is significantly more likely to trigger seizures than other colours. A special test applies.
- **Frequencies 5–30 Hz.** Peak seizure-triggering range. WHS at 60 fps with VFX firing every frame can easily land here.
- **High contrast changes.** Dark-to-bright transitions (white on black) are riskier than gentle colour shifts.
- **Uniform repeating patterns.** Striped patterns, especially black-and-white or red-and-white, can trigger even if not flashing.

### 2.3 Testing tools

**PEAT (Photosensitive Epilepsy Analysis Tool)** — [Trace Center, University of Maryland](https://trace.umd.edu/peat/). Free, downloadable. Captures a recording of content and evaluates for seizure risk per WCAG 2.0.

⚠️ **Critical note:** PEAT's licence **prohibits commercial game use** — it's for web/software only. For commercial game release, **Harding FPA software** (Cambridge Research Systems) is the licensed equivalent. **WHS as a browser-delivered game is a grey area** — PEAT is intended for web content, which fits WHS's delivery mode, but if we commercialise the game on Steam/console, Harding FPA is the legally correct tool. Worth consulting legal before launch.

**Harding FPA** — industry standard for TV and film; expensive. Used by major publishers pre-release.

**Manual observation** — no substitute for designer judgment + direct testing on players.

### 2.4 Design-first prevention (preferred over warnings)

Per the Game Accessibility Guidelines and IGPE research: *"Eliminating game content that can potentially cause photosensitive seizures is preferred over splash-screen warnings. Warnings do not work well because they are often missed, especially by children who may not be able to read them."*

**Prevention techniques:**

1. **Desaturate red.** If a red flash is required (e.g., damage indicator), use a *less saturated* red — closer to muted maroon than pure fire-engine red.

2. **Limit flash frequency.** Combo tier milestones, crit confirms, evolution pickups — any VFX that flashes must fire at < 3 Hz, or persist for < 5 seconds, or cover < 25% of screen.

3. **Soft transitions over hard cuts.** Cross-fade hits instead of hard flash-then-black.

4. **Opacity over brightness.** When "flashing" an element, fade its alpha rather than toggling its visibility — gives a softer visual event with lower seizure risk.

5. **Small flash area.** Impact flashes confined to a sprite rather than screen-wide.

6. **No strobing.** Never chain multiple flashes in under a second covering large areas.

7. **Avoid regular high-contrast patterns.** Stripes (black-white, red-white) should not cover large areas.

### 2.5 The WHS-specific risk audit

Every particle system and VFX in WHS should be checked. The highest-risk zones:

| System | Specific risk | Mitigation |
|---|---|---|
| Kill bursts (all weapons) | Many simultaneous bright flashes per frame at high kill density | Cap simultaneous flashes; aggregate at threshold |
| Crit indicators | Bright flash + colour flash per crit | Desaturate red; reduce flash alpha; throttle rate |
| Evolution pickup | Large-screen celebratory burst | Keep under 5 seconds; soft transitions; < 25% area |
| Boss death spectacle | 30 particles + 2 rings + 1 delayed ring | Audit frequency; ensure under threshold |
| Damage numbers | Many simultaneous bright texts | Already aggregated per feel-research recommendation |
| Hit freeze / time-dilation | Rapid brightness changes at 0→100 timescale | Cap transition rate |
| Combo 1000 (reserved) | Hypothetical mega-celebration | **Design explicitly** under threshold from day one |
| Chromatic aberration shader | RGB shift = rapid colour flash | Use only on single-frame moments |
| Haar shader transitions | Fast brightness change | Ramp over 300ms+ |
| Screen shake | Not photosensitivity but vestibular — already togglable | Keep toggle |
| Background palette shifts | Biome change, Beltane fire overlay | Ramp over 1s+ |

### 2.6 Configurable accessibility options for photosensitivity

Even with design-first prevention, provide player choice:

- **Reduce flashing** toggle (WCAG-recommended, Xbox XAG-recommended): when on, flash events are softened or replaced with non-flashing alternatives.
- **Reduce particles** (already shipped per DESIGN_SOUL Comfort matrix — keep): reduces *particle density* not just aesthetics.
- **Damage number toggle** (already shipped): removes potential-flashing text events.
- **Screen shake toggle** (already shipped): not photosensitivity but related.
- **Photosensitive Mode preset**: single toggle that enables all the above at once (convenience for first-time players).

### 2.7 The warning disclaimer

Even with prevention, a splash-screen warning is still standard industry practice. **Recommended wording:**

> *"Warning: a small percentage of players may experience seizures when exposed to flashing lights or patterns. If you or anyone in your family has an epileptic condition or has experienced seizures of any kind, consult a doctor before playing."*

Include at first-ever launch. Dismissable once seen. **Do not rely on this alone.** It's a backup, not a substitute.

### 2.8 Photosensitivity-safe milestone celebrations

Feel-research doc (§3.13) and roguelite doc (§2) both propose ecstatic visual celebrations for combo milestones, boss kills, evolutions. These *must* be designed safe:

- **Sustained glow** beats *strobing*.
- **Particle density ramping up slowly** beats *burst-then-dim*.
- **Musical stingers carry** the celebration — visuals can be quieter.
- **Time dilation** to 40–60% (not 0%) creates celebration without seizure-adjacent brightness flash.

### 2.9 Commitment

WHS's photosensitivity commitment is:

1. **PEAT-tested before every major release.**
2. **Design-first prevention baked in from Phase 1.**
3. **Player-configurable reduction options.**
4. **Splash-screen warning.**
5. **Consult community** — AbleGamers, SpecialEffect have photosensitivity consultants.
6. **If in doubt, soften.** When a VFX could flash, err on the side of fade.

---

## Part 3 — Visual Accessibility

### 3.1 The categories of visual disability

- **Totally blind** — ~0.3% of population. Relies on audio, haptics, controller feedback. Most demanding accessibility target.
- **Low vision** — ~3% of population. Retained some vision; benefits from high contrast, large text, magnification, simplified UI.
- **Colorblind** — ~8% of men, 0.5% of women. Protanopia (red-weak), deuteranopia (green-weak), tritanopia (blue-weak), achromatopsia (total, rare).
- **Photosensitive / migraine-sensitive** — see Part 2.
- **Photophobic** — light sensitivity. Dark modes, reduced brightness.

### 3.2 Colorblind design

The single most important *routine* visual-accessibility task.

**Types and their effects:**

- **Deuteranopia / deuteranomaly** (most common, ~6% of men): red and green shift toward brown/tan. Purples look blue. Reds look darker/muddy.
- **Protanopia / protanomaly** (~1% of men): reds appear dark/muddy, greens look washed out, yellows look faded.
- **Tritanopia** (rare, ~0.01%): blues and yellows shift; blue-green and yellow-red distinctions weaken.
- **Achromatopsia** (very rare): no colour perception at all — grayscale only.

**Design rule: never rely on colour alone.** Every colour-coded piece of information must also carry:
- **Shape / icon** (heart for HP, star for XP, spiral for pickup).
- **Text label** (when feasible).
- **Position** (pickups always drift toward player; hazards always stay in place).
- **Pattern / texture** (cross-hatching for "locked", dots for "enabled").
- **Motion** (hazards pulse; pickups shimmer; enemies move; background still).

**Luminance matters more than hue.** Two colours of similar luminance look identical to most colorblind players even if hue is different. Use strong luminance differences between meaningful elements.

**Recommended palette combinations:**
- **Blue and orange** — one of the most accessible combinations across all colorblind types. High contrast, strong luminance differential.
- **Purple and yellow** — another high-contrast classic.
- **Black/white/grey with single accent** — grayscale works for all colorblind types; use a single strong accent colour for priority information.

**Avoid:**
- Red/green as "bad/good" without secondary cues (most common mistake).
- Similar-luminance colour pairs (mid-green / mid-red; pastel yellow / pastel green).
- "Rainbow" palettes (assumes players distinguish all colours).

**Tools:**
- **[Coblis (Color Blindness Simulator)](https://www.color-blindness.com/coblis-color-blindness-simulator/)** — free browser tool. Upload a screenshot; see it through each colorblind type.
- **[Color Oracle](https://colororacle.org/)** — free system-wide simulator. Run it over your dev environment.
- **[colorblind-check](https://jakubnowosad.com/colorblindcheck/)** — palette analysis.
- **Browser DevTools** — Chrome and Edge have built-in colorblind simulators.

### 3.3 WHS's colorblind audit — opportunity area

WHS has the 5 tonal palettes from ART_STYLE_BIBLE.md (Hearth, Wild, Fey, Grave, Wild Comedy). **None of these has been colorblind-audited** per current documentation.

**Audit checklist:**
- [ ] Run each biome's palette through Coblis simulators for all 4 colorblind types.
- [ ] Check semantic colours (red = damage, green = heal, gold = treasure) remain distinguishable.
- [ ] Check enemy type encoding — can a deuteranope distinguish an elite (gold glow) from a normal enemy (no glow) if both are simultaneously on screen?
- [ ] Check hazard tiles — is slick (teal-blue) distinguishable from healing circle (green)?
- [ ] Check Thistle (purple-tufted particle) remains distinct from the background heather (purple-toned).

**Mitigations where colour overlaps:**
- Add icons/shapes to elite marker (gold + star).
- Add pulse-motion to hazards not present on safe tiles.
- Add outline shader (per ART_STYLE_BIBLE §3.X) in accessibility-friendly colour.

### 3.4 Text accessibility

**WCAG 2.2 contrast ratios:**
- **Normal text (under 24pt):** 4.5:1 ratio between text and background.
- **Large text (24pt+ or 19pt bold):** 3:1 ratio.
- **UI elements (buttons, borders, icons):** 3:1 against adjacent colours.

**Text size:**
- **Minimum 18pt** at native resolution for body text.
- **Scalable** — WHS already has `uiScale` (0.8–1.4 × ratio, per DESIGN_SOUL). **Excellent.**
- Consider: UI scale should go higher than 1.4× for significantly-vision-impaired players. Extend range to 2×?

**Font choice:**
- **Sans-serif preferred** for body text (clearer at small sizes).
- **Dyslexia-friendly fonts** (OpenDyslexic, Lexie Readable, Dyslexie) available as opt-in. Not default — some non-dyslexic players find them harder to read.
- **High contrast** between character colour and background.
- **Avoid italic** at small sizes.

**Text against busy backgrounds:**
- Dark stroke / outline on text.
- Translucent background box (WCAG AA compliant for contrast).
- Avoid text overlaid on combat particles without a box.

### 3.5 Motion / vestibular sensitivity

WHS already has `motionScale` (0–1 slider, affects tween amplitude) and screen-shake toggle. **Both excellent.** Extend consideration to:

- **Parallax layers** — reduce parallax amplitude when motionScale = 0.
- **Camera follow** — jitter-free at all times; never bob or sway (some games do this for immersion; don't).
- **Haar/fog animation speed** — option to reduce.
- **Biome palette shifts** — ramp slowly (per Part 2.5, also helps vestibular).
- **Menu transitions** — fade over slide, for motion-sensitive users.

### 3.6 Blind / total-vision-loss support

The ambitious frontier. Reference: *The Last of Us Part II* (2020) first AAA title to promise 100% accessibility to blind players, including platinum trophy without sighted assistance.

**WHS realistically cannot match AAA blind-accessibility budget**, but can:

- **Rich audio design** (per MUSIC_ART_TECH_RESEARCH) that communicates game state without visuals.
- **Screen-reader friendly menus** — all menu text via `t()` calls means localised *and* screen-reader-parseable.
- **Directional audio cues** (per feel research §4.8) — enemy spatial panning gives blind players positioning.
- **Audio captions visible to developer testing** — test screen-reader flow in menu.
- **Consider** a future "Audio-Only Mode" as a long-term stretch. Likely post-1.0.

### 3.7 High contrast mode

Already shipped via DESIGN_SOUL Comfort matrix (`highContrastUi`). **Deepen:**

- High contrast mode should push *well* past normal palette — black/white/saturated-accent.
- Consider adding: **"High Contrast Gameplay"** mode (not just UI) that simplifies biome palettes to maximise figure-ground separation.

### 3.8 Zoom / magnification

Not currently supported in WHS; most games don't need it (screen is rendered at resolution). If we ever add a zoom/magnifier tool, implement via camera zoom with UI scale compensation.

---

## Part 4 — Audio Accessibility

### 4.1 Captions

**Essential for:**
- Deaf / hard-of-hearing players.
- Players in shared environments who can't play with sound.
- Non-native language speakers processing speech.
- Late-night players keeping it quiet.
- Players processing dialogue-heavy moments.

**What to caption:**
1. **Spoken dialogue** (banter, story text).
2. **Significant SFX** ([audio] tags) — "*haggis squeaks with alarm*", "*boss roars*".
3. **Music cues** — "*[ominous pibroch swell]*", "*[cheerful reel speeds up]*".
4. **Environmental audio** — "*wind in the heather*", "*distant sheep*".
5. **UI SFX** — not always needed; if UI SFX is gameplay-informational, caption it.

**Caption customisation (WCAG/XAG best practice):**
- **Size** — multiple presets.
- **Colour** — contrast with gameplay.
- **Background** — translucent dark box option (improves readability).
- **Speaker name** — toggleable ("Gran:", "Cailleach:").
- **Directional indicator** — arrows showing off-screen speakers (Last of Us Part II pioneered this).
- **Size persistence** — remember setting across runs.

**WHS current state.** Captions toggleable in DESIGN_SOUL Comfort matrix. **Expand:** confirm captions include UI SFX descriptions, music cues, and environmental audio — not just banter text. Audit needed.

### 4.2 Visual cues for audio events

Every audio event that carries *gameplay information* should have a visual counterpart:

| Audio event | Visual equivalent |
|---|---|
| Enemy behind player | Arrow indicator or minimap pulse |
| Boss approaching (pibroch swell) | Screen-edge glow pulsing |
| Low HP warning (heartbeat) | HP bar red pulse |
| Combo milestone chime | Existing VFX + text toast |
| Chest spawn nearby | Minimap icon + subtle shimmer |
| Hazard approaching (slick thrown) | Floor-indicator telegraph |
| Evolution pickup offered | Particle glow + tooltip text |
| Seasonal event active | Persistent banner/icon on HUD |

### 4.3 Mono / stereo options

Some players with unilateral hearing loss or cochlear implants need mono output — otherwise, one channel carries information they can't hear. Standard accessibility feature:

- **Mono audio toggle** — sums L+R to both channels.
- **Mono should be explicit setting** — not assumed.

### 4.4 Volume separation

WHS has master / SFX / music sliders per DESIGN_SOUL Comfort matrix. **Excellent.** Consider adding:

- **Banter / voice slider** (when / if voice acting ships).
- **Ambient-audio slider** (separate from music — so players can quiet wind without killing music).

### 4.5 Subtitles vs captions

**Subtitles = dialogue only.** Original purpose: translation of spoken dialogue for non-native speakers.

**Captions = everything non-dialogue too.** Designed for deaf/HoH players. SFX, music cues, environmental audio captioned.

**Steam tag distinction exists.** WHS should declare "Captions" (the more complete option), not just "Subtitles".

### 4.6 Audio description

More ambitious: narration of visual events for blind players. Typically pre-recorded or synthesised, describing action in real time.

**WHS consideration:** stretch goal. Would require:
- Descriptive audio track for major events.
- Timed delivery per scene.
- Narration voice matching the Hearth register.

Defer as Phase 3+. Culturally rich in Scots-voiced narration, but significant scope.

### 4.7 Transcripts

For games with significant story: offer transcripts of dialogue, banter pools, codex entries. WHS's Almanac would satisfy this for most narrative content.

---

## Part 5 — Motor Accessibility

### 5.1 Motor disability spectrum

Ranges from:
- **Mild hand tremor** (affects precision).
- **Limited range of motion** (can't reach all buttons).
- **One-hand play** (various causes).
- **Fatigue-affecting conditions** (energy limits play length).
- **Adaptive-controller users** (Xbox Adaptive Controller, PlayStation Access Controller, Logitech Adaptive Gaming Kit).
- **Mouth/foot/breath input users** (very niche but real).

### 5.2 Full key remapping

**Non-negotiable feature.** Every action must be remappable. WHS needs:

- **Keyboard remap** — every keyboard shortcut editable.
- **Gamepad remap** — every button editable.
- **Mouse remap** — if mouse is used.
- **Remap persistence** — saved with user profile.
- **Reset-to-defaults** option.
- **Profile multiplicity** — saved loadouts for different sessions.
- **Conflict warning** — if two actions map to same key, highlight.

**WHS current state.** Unknown — audit needed. If not already implemented, this is a Priority-1 accessibility gap.

### 5.3 Hold vs toggle

Many actions default to "hold": hold shift to sprint, hold RMB to aim, hold button to charge. These are accessibility barriers for tremor/fatigue players.

**Pattern:** Provide **toggle** alternatives.

- **Hold shift → sprint:** toggle version stays on until released.
- **Hold to charge:** toggle auto-fires when released.
- **Hold for menu:** toggle taps to open/close.

WHS auto-fires combat (no "hold to shoot"). Good. But check:
- **Dash** — currently double-tap. Offer single-button-toggle alternative.
- **Burn Leap** — double-tap direction. Offer single button bound to a specific direction.
- **Virtual joystick on mobile** — sustained touch to move. Good, but ensure toggle-run exists.

### 5.4 Timing windows

Survivor-like combat is generally forgiving (auto-aim, auto-fire). WHS has these key timing windows:

- **Dash i-frames** (300ms).
- **Burn Leap hazard-bypass window** (280ms).
- **Combo break window** (1500ms).
- **Card pick time** (unlimited, good).
- **Route pick time** (unlimited, good).

**Accessibility addition:** an optional mode that *extends* these windows. Celeste's Assist Mode is the model:

> "I allow players to alter game speed, remove stamina to let Madeline cling to walls longer, add extra dashes, and turn on invincibility."

**WHS Assist Mode (proposed):**
- **Game speed** slider (0.5× – 1.0× – 1.5× slower/normal/faster).
- **Extended i-frames** (300ms → 600ms) on dash.
- **Extended combo window** (1500ms → 3000ms).
- **Invincibility toggle** — full-on, for players who want to experience story without combat difficulty.

**Critical:** Naming matters. Celeste's rename from "Cheat Mode" to "Assist Mode" was deliberate. Avoid language that frames accessibility as "easy" — *"Assist"*, *"Help"*, *"Accessibility"* are neutral. *"Cheat"*, *"Easy"*, *"Wuss Mode"* are othering.

### 5.5 Auto-aim (WHS's secret weapon)

WHS *already auto-fires all weapons*. This is a **massive accessibility win** — the game plays itself in combat. Motor-impaired players can focus on movement only. Marketing should make this explicit.

Consider: allow manual-aim for players who want it, and auto-aim as default. Most survivor-likes are auto-fire only.

### 5.6 Controller support breadth

**Standard controllers:**
- Xbox controllers (native).
- PlayStation DualSense / DualShock.
- Switch Pro Controller.
- Generic USB controllers.

**Adaptive controllers:**
- **Xbox Adaptive Controller** — flat-pad, works with external switches, buttons, joysticks via 3.5mm jacks.
- **PlayStation Access Controller** (2023) — similar for PS5.
- **Logitech Adaptive Gaming Kit.**
- **QuadStick** (mouth-operated).

**Supporting these:** if WHS supports standard-controller remapping AND accepts input from any connected device, adaptive controllers work. Don't hardcode button assumptions.

### 5.7 One-handed play

**Design check:**
- All actions reachable with one hand.
- Alternative to multi-button combos.
- Mouse+keyboard one-handed (gamepad on left hand with mouse on right, or vice versa).
- Gamepad one-handed: not all games support, but possible with remap.

**Reference:** Halfcoordinated (Clint Lexa), one-handed speedrunner who successfully completes Celeste on Assist Mode. His input on "don't frame it as 'intended' vs 'assisted'" is canonical.

### 5.8 Mobile input considerations

WHS is browser-first. Mobile touch is significant:

- **Virtual joystick** — already implemented. Check size scaling (large-fingered users, tremor).
- **Button size** — follow Apple HIG / Android guidelines (~44pt minimum for tap targets).
- **Multi-touch layouts** — offer left-hand or right-hand options for dominant.
- **Gesture alternatives** — if gesture is used for anything (swipe to reroll?), provide button equivalent.

### 5.9 Rapid-tapping requirements

**Rule:** nothing in WHS should require rapid button-mashing for an able-bodied player to succeed. Any rapid-tap mechanic has an alternative (e.g., hold-for-auto-tap).

**Currently:** Combat auto-fires. ✓. Dash is double-tap — offer single-button alternative.

### 5.10 Pause anywhere

WHS already has pause. **Verify:**
- Pause works at all times (including during boss fights, level-ups, transitions).
- Pause doesn't trigger enemy actions in real-time.
- Pause menu itself is fully accessible (screen-reader-friendly, high-contrast-compatible).

---

## Part 6 — Cognitive Accessibility

### 6.1 The cognitive spectrum

- **Neurodivergent players** (ADHD, autism, dyslexia) — ~10%+ of population.
- **Learning disabilities** — various.
- **Memory impairments** (dementia, traumatic brain injury).
- **Concentration limitations** (chronic fatigue, stress).
- **Young players.**
- **Non-native English speakers** (relevant given bilingual EN/SCS already).

### 6.2 Information density

**Rule.** A player should be able to parse *essential* information at a glance.

**HUD audit:**
- HP — always visible, large, colour-coded.
- XP — always visible.
- Combo — visible during streak, fades otherwise (good).
- Weapon cooldowns — rowed icons with fill indicators.
- Minimap — concise, legible.
- Timer — small but present.

**Risk areas:**
- **Level-up card pickup moments** — busy screen with 3+ cards, stats, synergies. *Audit:* can this be parsed in 3 seconds?
- **Combo/kill text spam** — can overwhelm. Aggregation (per feel research) helps.
- **Boss arena** — enemies + projectiles + environment. High density.

### 6.3 Reading level

**Plain language** wins.

- **Short sentences.**
- **Common words over technical.**
- **Clear subject-verb-object.**
- **Active voice.**

WHS's voice (Hearth + Edge) is already informal and accessible. Good.

**For children / dyslexic / non-native players:** offer a **"Simplified" text mode** — removes Scots vernacular and uses standard English. Loses flavour but gains comprehension.

### 6.4 Tutorial pacing

**Roguelite advantage:** run-based structure means tutorials are short (one run is a tutorial). Don't over-tutorialise.

**Cognitive-accessible patterns:**
- **Contextual hints** — the first time the player encounters a mechanic, a gentle tip.
- **Always-available help** — pause menu has mechanic reference.
- **Skip tutorial** option for experienced players.
- **Visual icons with text labels** — not text alone, not icons alone.

### 6.5 Consistent UI

Consistency reduces cognitive load. WHS patterns:

- **Card pickup layout** — always 3 cards, always same position, always same buttons.
- **Route picker** — always 3 routes, always same position.
- **Pause menu** — consistent between scenes.
- **Sprint feedback** — same VFX every time.

**Risk:** new features introducing new UI patterns. Mitigate: document a UI pattern library.

### 6.6 Reversibility & undo

- **Level-up card pickups** — irreversible (by design). Warn on high-stakes picks? Probably not — players adjust.
- **Moor Road route picks** — irreversible per run.
- **Weapon evolutions** — irreversible.
- **Shop purchases** — gold spent. Usually refundable-adjacent (just re-earn).

Complete reversibility is a gameplay design question; accessibility-friendly UX at least surfaces *"this is irreversible"* for impactful choices.

### 6.7 Goal clarity

**Players always know:**
- What they're doing right now.
- What the run's objective is (survive 25 minutes).
- What happens when they die.
- How progress persists.

WHS is strong here. Survivor-like goals are *visible* (timer, kills, distance).

### 6.8 Memory load reduction

Don't rely on player memory:
- **Passive items gained** — always visible in HUD (weapon rows).
- **Stats** — viewable in pause menu.
- **Route picks** — visible in Chronicle.
- **Banter heard** — stored in Almanac (per narrative research).

### 6.9 Breaks and fatigue

Survivor-likes are ~25 min runs. That's a good "chunked" experience. But:

- **Pause any time** (already exists).
- **Save-and-quit mid-run** — currently supported?
- **Short-session mode** — not a priority, but: "quick 10-minute run" could be a variant.

### 6.10 Trigger warnings

Some WHS content has potentially upsetting themes:

- **Glencoe biome** (if shipped) — historical massacre.
- **Highland Clearances** (if referenced) — displacement, loss.
- **Taxman boss** — pressure, authority.
- **Witch's Hare variant** — historical witch-trial theme.

**Practice:** if seasonal/historical content touches trauma, offer a **Content Warnings** setting that:
- Lists themes present in different biomes.
- Allows opt-out of specific seasonal events.
- Provides player control over exposure.

---

## Part 7 — Platform Requirements & Certification

### 7.1 Steam accessibility tags (launched 2025)

Valve's accessibility tag system went live in 2025. **Currently 16 features across 4 categories.** Developers fill out the **Accessibility Feature Wizard** under store-page basic info. 22,000+ games have completed the questionnaire as of early 2026.

**Categories:**
- **Gameplay:** playable at your own pace, customizable difficulty, save anywhere, etc.
- **Visual:** colorblind mode, text resize, high contrast, etc.
- **Audio:** captions for dialogue, captions for SFX, mono audio, adjustable audio, etc.
- **Input:** full remapping, gamepad remapping, one-handed play, etc.

**Notable tags relevant to WHS:**
- "Playable at Your Own Pace" (new tag 2026) — WHS's auto-fire qualifies.
- "Playable without Quick Time Events" (renamed from "Timed Input") — WHS has none; qualifies.
- "Full Controller Support" — required if claimed.

**Strategy for WHS:** complete the wizard before launch. Be honest about support. Each tag is a discoverability channel.

### 7.2 Xbox Accessibility Guidelines (XAGs)

[Full list at Microsoft Learn](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines). 123 numbered guidelines as of 2026. Not required for certification but strongly recommended for Xbox platform release.

**Key guidelines (selected):**
- **XAG 101** — Text size / legibility.
- **XAG 103** — Contrast.
- **XAG 113** — Remappable controls.
- **XAG 118** — Photosensitivity / flashing lights.
- **XAG 120** — Subtitle/caption support.
- **XAG 121** — Audio-visual synchronisation.
- **XAG 122** — Colorblind-safe design.
- **XAG 123** — Mental health considerations.

**For WHS:** even as a browser game, aligning to XAGs is good practice. If we ever port to Xbox, readiness is already baked in.

### 7.3 Game Accessibility Guidelines (GAG)

[gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/) — **the industry's reference checklist.** Organised by:

- **Impairment type** (motor, cognitive, vision, hearing, speech).
- **Difficulty level** (Basic, Intermediate, Advanced).

**Basic level** is typically what indie games should target as minimum. **Intermediate** is the masterpiece bar.

### 7.4 WCAG 2.2 for web-delivered games

WHS is a browser game. WCAG technically applies. Key Success Criteria for WHS:

- **1.4.3 Contrast (Minimum)** — AA level. 4.5:1 for normal text, 3:1 for large.
- **1.4.11 Non-text Contrast** — 3:1 for UI elements.
- **2.1.1 Keyboard** — all functionality from keyboard (a challenge for pointing-based games; desktop WHS likely compliant).
- **2.2.1 Timing Adjustable** — WHS's 25-minute runs should be pausable; they are.
- **2.3.1 Three Flashes or Below Threshold** — **non-optional**. See Part 2.
- **2.4.7 Focus Visible** — keyboard focus indicator. Menu navigation requires this.
- **3.1.2 Language of Parts** — bilingual EN/SCS support implements this.

### 7.5 CVAA (United States)

**21st Century Communications and Video Accessibility Act** (2010). Games sold in US after Oct 2017 must make *communication features* accessible. Affects chat systems and voice chat, not game-mechanic-accessibility directly. WHS has neither so compliance is automatic.

### 7.6 European Accessibility Act (2025)

EAA entered force June 2025 in EU member states. Affects "e-services" broadly. Games are *generally* not in direct scope but have been discussed. Monitor for clarification.

### 7.7 PlayStation Accessibility Framework

Sony's internal framework (less public than Xbox's). Key features Sony expects:
- Remappable controls.
- Subtitle customisation.
- Colorblind modes.
- Screen reader support on PS5.

### 7.8 Nintendo Switch standards

Nintendo has less public accessibility guidelines than Microsoft/Sony. Steam compatibility generally forecasts Switch-acceptable.

### 7.9 Age rating considerations

PEGI, ESRB, USK ratings factor in:
- Cartoon violence (mild — low rating).
- Horror elements (Nuckelavee, Grave tonal content — adds rating weight).
- Alcohol references (Buckfast, whisky — adds rating weight).
- Gambling elements (Earl Beardie's wagers — caution; loot-box-adjacent mechanics are restricted).

**WHS likely PEGI 7 / ESRB E10+** based on current content. Horror/alcohol references could push to PEGI 12 / ESRB T. Plan accordingly.

### 7.10 Accessibility-as-marketing

Steam accessibility tags are *discoverability*. "Playable without Quick Time Events", "Colorblind Modes", "Captions for SFX" are tags players filter for. Each tag = marketing channel.

Also: accessibility-focused press outlets (Can I Play That?, AbleGamers, Access-Ability, DAGERSystem) cover indie games that invest in accessibility. Free promotion potential.

---

## Part 8 — The WHS Accessibility Audit

Current state (per DESIGN_SOUL.md Comfort matrix) vs. where we need to go.

### 8.1 Currently strong

From DESIGN_SOUL.md Comfort matrix:

| Feature | State | Assessment |
|---|---|---|
| `masterVolume`, `sfxVolume`, `musicVolume` | ✓ shipped | Excellent separation |
| `uiScale` (0.8–1.4×) | ✓ shipped | Good; consider extending to 2× |
| `motionScale` (0–1) | ✓ shipped | Gold-standard for vestibular safety |
| `screenShake` toggle | ✓ shipped | Essential |
| `damageNumbers` toggle | ✓ shipped | Good for photosensitivity + information load |
| `reduceParticles` toggle | ✓ shipped | Good for photosensitivity + perf |
| `highContrastUi` toggle | ✓ shipped | Good; consider gameplay-wide HC mode |
| `captionsEnabled` toggle | ✓ shipped | Needs content audit (SFX/music captions?) |
| Skip act intermissions | ✓ shipped | Cognitive/time-accessibility win |
| Banter frequency (wheesht → gabby) | ✓ shipped | Cognitive-accessibility win (info density control) |
| Locale (EN/SCS) | ✓ shipped | Cognitive + cultural accessibility |

### 8.2 Thin or gap areas

| Area | Current | Gap |
|---|---|---|
| **Photosensitivity** | Reduce particles exists | No PEAT audit documented; no "Reduce flashing" dedicated toggle; no preset profile |
| **Colorblind modes** | None | No simulator audit; no palette swap for CVD; critical gap |
| **Text size** | `uiScale` covers partly | Dedicated text-size slider could go further |
| **Font options** | Default only | No dyslexia-friendly font option |
| **Key remapping** | Unknown — audit | Full audit needed; not documented in Comfort matrix |
| **Controller remap** | Unknown — audit | Same |
| **Assist Mode** | None | No game-speed slider; no extended timing windows; no invincibility |
| **Captions scope** | Text captions exist | Audit: do captions cover SFX, music cues, environmental audio? |
| **Visual cues for audio** | Partial (HUD elements) | Systematic audit needed |
| **Screen reader support** | Unknown | Menu testing needed |
| **Audio description** | None | Stretch goal |
| **Content warnings** | None | For historical/trauma content |
| **Photosensitivity warning splash** | Unknown | Standard industry practice; verify |
| **Steam tags** | N/A (not on Steam yet) | Plan for launch |
| **Trigger warnings for trauma content** | None | As sensitive biomes ship |

### 8.3 Priority gap matrix

**Tier 1 — Do before any major content release:**

1. **PEAT audit of entire game** — ensure no seizure-triggering content.
2. **Colorblind audit of tonal palettes** — Coblis/Color Oracle on each biome.
3. **Key remapping implementation** — full keyboard + gamepad.
4. **Captions scope verification** — SFX, music cues, ambient — all captioned.
5. **Photosensitivity warning splash** — first-launch screen.
6. **Non-colour-alone audit** — every colour-coded element has secondary cue.

**Tier 2 — Plan for mid-development:**

7. **Assist Mode** (game speed, extended timing, invincibility) — Celeste-style.
8. **Dedicated "Reduce Flashing" toggle** — separate from reduce particles.
9. **High Contrast Gameplay mode** — beyond just UI.
10. **Text size slider** — separate from uiScale, wider range.
11. **Dyslexia-friendly font option.**
12. **Content warnings** for historical/trauma biomes.

**Tier 3 — Stretch / post-launch:**

13. **Screen reader full support.**
14. **Audio description track.**
15. **Blind-accessibility mode** (Last-of-Us-Part-II-lite).
16. **Extended a11y consulting** with AbleGamers/SpecialEffect.

### 8.4 Cross-reference table: DESIGN_SOUL Comfort matrix extensions

Suggested additions to the Comfort matrix (`src/core/SaveManager.ts` + `SettingsScene`):

| New setting | Type | Default | Purpose |
|---|---|---|---|
| `reduceFlashing` | toggle | off | Specific photosensitivity mode (stronger than reduceParticles) |
| `colorblindMode` | cycle | none → protanopia → deuteranopia → tritanopia → monochrome | Palette-swap shader preset |
| `textSize` | cycle | normal → large → huge | Dedicated text scaling |
| `dyslexiaFont` | toggle | off | Loads OpenDyslexic or similar |
| `assistMode` | toggle | off | Gateway to assist sub-options |
| `gameSpeed` | slider 0.5–1.5× | 1.0 | Celeste-style speed modifier (gated by assistMode) |
| `invincibility` | toggle | off | Gated by assistMode |
| `contentWarnings` | toggle | on | Show trigger warnings before sensitive biomes |
| `monoAudio` | toggle | off | Sums L+R to both channels |
| `captionSfx` | toggle | on | SFX captions (subcheck under captionsEnabled) |
| `captionMusic` | toggle | on | Music-cue captions |
| `audioDescription` | toggle | off | If audio description track ships |

---

## Part 9 — Testing Accessibility

### 9.1 Self-test tools

**For photosensitivity:**
- **PEAT** (non-commercial): capture WHS session → analyse. Free.
- **Harding FPA** (commercial): same but licensed for game release.

**For colorblind:**
- **Coblis** (browser-based): upload screenshot → see through each colorblind type.
- **Color Oracle** (desktop app): live filter over your development environment. Gold.
- **Chrome DevTools** → Rendering → Emulate Vision Deficiencies.

**For contrast:**
- **WebAIM Contrast Checker** — WCAG 2.2 compliance calculator.
- **Stark plugin** for Figma / Sketch / browsers.

**For screen reader compatibility (menu only):**
- **NVDA** (Windows, free) — most-used screen reader.
- **JAWS** (Windows, commercial).
- **VoiceOver** (macOS/iOS, built-in).
- **TalkBack** (Android, built-in).

**For motor simulation:**
- **One-handed playtest** — literally try to play one-handed. Identify pain points.
- **Tremor simulation** — shake the mouse deliberately during pointer-based UI.

### 9.2 Community consultants

**AbleGamers Charity** (US) — offers consulting services. Paid; substantial. Deep expertise. Recommended for pre-release audit.

**SpecialEffect** (UK) — charity focused on accessible gaming. UK-based, aligned with WHS's Scottish identity. Community outreach.

**Can I Play That?** — accessibility-focused games press. Contact for pre-release review.

**Game Accessibility Nexus, Access-Ability, DAGERSystem** — smaller review sites.

**Xbox Accessibility consulting** — Microsoft offers consultation to developers; free or low-cost.

### 9.3 Playtesting with disabled players

Nothing substitutes for actual disabled playtesters. Even 3–5 sessions with disabled players surfaces issues no tool finds.

**Logistics:**
- **Recruit via:** AbleGamers forums, SpecialEffect network, Reddit r/DisabledGamers, Scottish disability charities.
- **Pay fairly.** Playtesting is work.
- **Accommodate.** Session format, break schedule, communication style — match the player.
- **Document.** Notes, recordings (with consent), action items.
- **Follow up.** Credit playtesters. Send free copies. Demonstrate changes made from feedback.

### 9.4 Ongoing testing cadence

- **Every major build:** PEAT audit, contrast audit, colorblind simulator spot-check.
- **Every release:** full accessibility smoke test.
- **Every quarter:** engage community for feedback on perceived gaps.
- **Every year:** external accessibility consulting review.

### 9.5 The accessibility changelog

Maintain a public `ACCESSIBILITY.md` at project root:
- What accessibility features exist.
- What's planned.
- How to report issues.
- Credits for community consultants.

Transparency builds trust.

### 9.6 Testing specific WHS risk areas

**The `e2e/comfort-smoke.spec.ts` test is gold.** It runs a full boss encounter with the strictest Comfort settings combo (motionScale 0 + highContrastUi + captions + reduceParticles + banter off). **Extend it:**

- [ ] Add: `reduceFlashing on` when the feature exists.
- [ ] Add: `colorblindMode` set to each option.
- [ ] Add: keyboard-only navigation through menus.
- [ ] Add: screen-reader announcement verification on menu pages.

---

## Part 10 — Soul Charter Alignment + WHS Opportunities

### 10.1 Accessibility IS the Soul Charter

Every Soul-Charter principle maps to an accessibility principle:

| Soul Charter | Accessibility translation |
|---|---|
| Warmth — game on player's side | Forgiveness mechanics + Assist Mode + kindness in language |
| Kindness in friction | Clear UI + captions + pause-anywhere |
| Joy in motion | Auto-aim + combat accessibility + celebratory milestone VFX |
| Pride in mastery | Skill progression doesn't assume same baseline — everyone can reach it |
| Cozy between storms | Rest moments + slow pacing options + quiet menus |
| Craft coherence | Accessibility features as *part of* the craft, not bolted on |
| Failure is compassionate | Pause + quit anytime + Assist Mode + "try again" framing |
| Masterpiece bar | Accessibility is part of masterpiece, not optional |

### 10.2 WHS accessibility manifesto (proposed)

A short public-facing statement:

> *Wild Haggis Survivors is on your side. The haggis doesn't care what body you've got, what eyes you've got, what ears you've got, what hands you've got. We don't either. The moor welcomes you.*
>
> *Our accessibility commitments:*
> *- We test for seizure-triggering content. We don't ship what we can't make safe.*
> *- We offer colourblind modes, text-size options, high-contrast gameplay, captions for every audible cue.*
> *- We remap every input.*
> *- We don't require quick reflexes to enjoy the story.*
> *- Our Assist Mode isn't "easy mode" — it's help, available without judgment.*
> *- We credit and pay the disabled players and consultants who've made this game better.*
>
> *If we've missed something, tell us. The moor remembers.*

Consider putting this on the Steam store page, itch.io page, or the game's website. The commitment itself is marketing.

### 10.3 Prioritised opportunity map

Aligned to the DESIGN_SOUL Soul Check priorities (warmth / clarity / kinetics / emotion):

**Tier S — Cannot-ship-without:**
1. **PEAT-audit entire game before launch.** *(Warmth, Clarity.)*
2. **Colorblind audit of all palettes + colorblind modes.** *(Clarity.)*
3. **Key + gamepad remapping.** *(Kinetics.)*
4. **Captions scope expansion** — SFX, music cues, ambient all captioned. *(Warmth, Emotion.)*
5. **Photosensitivity warning splash + design-first prevention.** *(Warmth.)*

**Tier A — Masterpiece-bar:**
6. **Assist Mode** — game speed, extended windows, invincibility. Celeste-style naming. *(Warmth.)*
7. **Dyslexia-friendly font option.** *(Clarity.)*
8. **High Contrast Gameplay mode** (not just UI). *(Clarity.)*
9. **Content warnings** for historical/trauma biomes. *(Warmth, Emotion.)*
10. **Systematic visual-cues-for-audio audit.** *(Clarity.)*

**Tier B — Polish:**
11. **Extended uiScale range (up to 2×).** *(Clarity.)*
12. **Mono audio toggle.** *(Clarity.)*
13. **Text size dedicated slider.** *(Clarity.)*
14. **Non-text contrast audit** (UI elements).
15. **Keyboard focus indicators** verified throughout.

**Tier C — Stretch:**
16. **Screen reader full support.**
17. **Audio description track.**
18. **Blind-accessibility mode.**
19. **AbleGamers/SpecialEffect external review.**
20. **Published ACCESSIBILITY.md changelog.**

### 10.4 Integration with existing dev practices

**Updates to existing files** (beyond this research doc):

- **`DESIGN_SOUL.md`** — the Comfort matrix should extend with the proposed new settings (§8.4 of this doc). When designing features, consult this doc's Part 8 audit.
- **`CLAUDE.md` / `AGENTS.md`** — add "PEAT audit" and "Colorblind simulator check" to pre-release checklists.
- **`ART_STYLE_BIBLE.md`** — palette anchors should explicitly tag colorblind-audited status. Add colorblind-check column.
- **`e2e/comfort-smoke.spec.ts`** — extend to cover new accessibility settings as they ship.

### 10.5 The long-term commitment

Accessibility work is ongoing. The GAG updates; new platforms add requirements; community expectations evolve. Commit to:

- **Regular accessibility review** (quarterly).
- **Post-launch responsiveness** to accessibility feedback.
- **Keeping this doc current** as standards evolve.
- **Being proud of the work** — accessibility is craft.

### 10.6 The Soul Charter doubles down

If WHS is truly masterpiece-aspiring, accessibility can't be Phase 7. It has to be Phase 1 through Phase N.

The haggis is *a wee beastie*. It fights because it's stubborn. It survives because it's loved. The game surrounds the haggis with warmth. Accessibility is the extension of that warmth to every player who might ever pick up a controller.

*The moor remembers everyone.*

---

## Sources & Further Reading

**Guideline sources:**
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) — Ian Hamilton et al., since 2012.
- [Xbox Accessibility Guidelines (XAGs)](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines) — Microsoft, 123+ numbered guidelines.
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/) — W3C accessibility standard.
- [Steam Accessibility Features](https://partner.steamgames.com/doc/accessibility_features) — Valve's developer documentation.
- [IGDA Game Accessibility SIG](https://igda-gasig.org/) — industry-wide discussion.

**Photosensitivity:**
- [PEAT — Trace Center](https://trace.umd.edu/peat/) — free tool, non-commercial licence.
- [Harding FPA](https://www.hardingtest.com/) — commercial licensed version.
- [International Guidelines for Photosensitive Epilepsy](https://pmc.ncbi.nlm.nih.gov/articles/PMC11872230/) — academic review of standards.
- [MDN: Web accessibility for seizures and physical reactions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Seizure_disorders).
- [Avoid flickering images — GAG](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/).
- [Epilepsy Foundation — Photosensitivity](https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity).

**Colorblind design:**
- [Coblis — Colorblindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/).
- [Color Oracle](https://colororacle.org/).
- [David Nichols — Coloring for Colorblindness](https://davidmathlogic.com/colorblind/).
- [Martin Krzywinski — Designing for Color Blindness](https://mk.bcgsc.ca/colorblind/palettes.mhtml).
- [colorblindcheck](https://jakubnowosad.com/colorblindcheck/).

**Celeste case study:**
- [Celeste Assist Mode — Vice](https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility/).
- [Accessibility means more than easy mode — PC Gamer](https://www.pcgamer.com/accessibility-means-more-than-just-an-easy-mode/).
- [Maddy Thorson on Sekiro easy mode — PCGamesN](https://www.pcgamesn.com/sekiro-shadows-die-twice/sekiro-easy-mode).
- Maddy Thorson's thread on Celeste forgiveness mechanics (X/Twitter).

**Last of Us Part II case study:**
- [PlayStation.Blog: Last of Us Part II Accessibility Features](https://blog.playstation.com/2020/06/09/the-last-of-us-part-ii-accessibility-features-detailed/).
- [Naughty Dog: Accessibility Features](https://www.naughtydog.com/blog/the_last_of_us_part_ii_accessibility_features_detailed).
- [Blind accessibility review — Can I Play That?](https://caniplaythat.com/2020/06/18/the-last-of-us-2-review-blind-accessibility/).

**Community consultants / organisations:**
- [AbleGamers](https://ablegamers.org/) — US charity, consulting services.
- [SpecialEffect](https://www.specialeffect.org.uk/) — UK charity, gaming-focused.
- [Can I Play That?](https://caniplaythat.com/) — games accessibility press.
- [Access-Ability](https://access-ability.uk/) — accessibility review site.
- [DAGERSystem](https://www.dagersystem.com/) — accessibility analysis.
- [Game Accessibility Nexus](https://www.gameaccessibilitynexus.com/).

**Steam accessibility rollout coverage:**
- [Valve announces accessibility tags — Can I Play That?](https://caniplaythat.com/2025/04/23/valve-announces-accessibility-tags-for-steam/)
- [Steam updates accessibility tags (2026) — Can I Play That?](https://caniplaythat.com/2026/01/26/steam-updates-accessibility-tags/)
- [Steam Accessibility Features — Steamworks](https://partner.steamgames.com/doc/accessibility_features)

**Books and broader reference:**
- Ian Hamilton & Thomas Westin, *Game Accessibility* (contribution to the *Creating Inclusive Learning Opportunities in Higher Education* volume).
- Game Accessibility Expert Group resources (varied).

**WHS-internal cross-references:**
- `docs/DESIGN_SOUL.md` — Comfort matrix.
- `docs/ART_STYLE_BIBLE.md` — palette audit needed.
- `docs/research/GAME_FEEL_RESEARCH.md` — feel decisions have accessibility implications.
- `docs/research/MUSIC_ART_TECH_RESEARCH.md` — technical implementation of colorblind modes, audio options.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — content warnings for sensitive historical topics.

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). 10 parts, ~13,000 words. Foundational principles (accessibility as kindness, curb-cut effect, standards landscape); photosensitivity & seizure safety (critical — thresholds, PEAT, Harding FPA, design-first prevention, WHS-specific audit); visual accessibility (colorblind design with type-by-type breakdown, text accessibility, motion/vestibular, high contrast, blind support); audio accessibility (captions, visual cues, mono, volume); motor accessibility (remapping, Assist Mode, Celeste lessons, controllers, one-handed); cognitive accessibility (reading level, tutorial pacing, reversibility, trigger warnings); platform requirements (Steam tags, XAGs, WCAG, CVAA); WHS accessibility audit against current Comfort matrix with Tier 1/2/3 gap analysis; testing methodology (tools, consultants, playtesters); Soul-Charter alignment with proposed accessibility manifesto. Eighth doc in the WHS research series — the foundational accessibility playbook.
