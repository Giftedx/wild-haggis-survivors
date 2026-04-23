# Cutting-Edge Music & Art Technical Research

> *"The Web Audio API is powerful, but it's a toolkit, not a solution."*
> — Chris Wilson, *A Tale of Two Clocks* (the canonical Web Audio scheduling article)

> **Purpose.** Deep technical research on the *cutting edge* of music and art technology for games, specifically calibrated to WHS's stack (**Phaser 3 + TypeScript + Vite + Web Audio API + Tone-style synthesis**) and runtime (**browser, 60 fps fixed-step, pixel-art aesthetic**).
>
> **How this doc relates to the others.**
> - `ROGUELITE_RESEARCH.md` — *what* to build (structural canon).
> - `SCOTTISH_RESEARCH.md` — *what to fill it with* (thematic content).
> - `GAME_FEEL_RESEARCH.md` — *how* to make it sing at the design level (feel canon).
> - **This doc — *how* to make it sing at the engineering level**. Shaders, scheduler patterns, synthesis architectures, procedural content generation, the 2024–2026 state of the art in web-capable audio/visual tech.
>
> **How to use this.**
> 1. When designing a new *technical* system — a music layer, a visual FX, a shader, a procedural generator — check the relevant Part for current best practice.
> 2. Cite the relevant Part from technical specs.
> 3. Use Part 11 (WHS Technical Opportunities) as a menu of prioritised engineering upgrades.
>
> **North star.** Technology serves the Soul Charter, not the other way around. Every "cutting edge" option here is filtered by: *does this increase warmth / clarity / kinetics / emotion?* A clever technique that doesn't land for the player is dead weight.
>
> **Scope.** 11 parts. First seven are discipline-deep catalogues (music architecture, procedural music, adaptive patterns, synthesis, pixel art, shaders, procgen, lighting). Parts 8-10 are perf, web-specific concerns, and the 2024-2026 AI-era tooling landscape. Part 11 is the WHS application map.
>
> **Depth bias.** Where a choice is between "encyclopaedic coverage" and "actionable depth," this doc chooses actionable. Links in the Sources section go deeper where needed.
>
> **Author.** Claude, April 2026, at Michael's direction.
> **Status.** Research reference — fourth in the WHS research series.

---

## Table of Contents

1. [Methodology](#methodology)
2. [Part 1 — Modern Game Music Architecture](#part-1--modern-game-music-architecture)
3. [Part 2 — Procedural & Generative Music](#part-2--procedural--generative-music)
4. [Part 3 — Adaptive Music Patterns (Deep)](#part-3--adaptive-music-patterns-deep)
5. [Part 4 — Synthesis & Sound Design](#part-4--synthesis--sound-design)
6. [Part 5 — Modern Pixel Art & 2D Animation Pipelines](#part-5--modern-pixel-art--2d-animation-pipelines)
7. [Part 6 — Shader Art for 2D Games](#part-6--shader-art-for-2d-games)
8. [Part 7 — Procedural Visual Content](#part-7--procedural-visual-content)
9. [Part 8 — 2D Lighting, Atmosphere & Weather](#part-8--2d-lighting-atmosphere--weather)
10. [Part 9 — Performance & Web-Specific Considerations](#part-9--performance--web-specific-considerations)
11. [Part 10 — The AI-Era Tooling Landscape (2024-2026)](#part-10--the-ai-era-tooling-landscape-20242026)
12. [Part 11 — WHS Technical Opportunities](#part-11--whs-technical-opportunities)
13. [Sources & Further Reading](#sources--further-reading)
14. [Changelog](#changelog)

---

## Methodology

This doc is organised by *engineering discipline*, not by game system. Each Part covers:

- **State of the art** — what best practice looks like today (April 2026).
- **Key techniques** — the named patterns, algorithms, or architectures.
- **Implementation notes** — web-specific gotchas, Phaser-specific considerations, pixel-art specific constraints.
- **Trade-offs** — cost vs benefit, perf vs fidelity, ambition vs risk.
- **WHS fit** — *shipped / underused / opportunity / speculative.*

Every technique is filtered by three practical questions:
1. **Is it web-viable?** (runs in a browser at 60 fps with acceptable memory/battery).
2. **Is it Phaser 3-compatible?** (current renderer pipeline, or requires migration).
3. **Does it serve the Soul Charter?** (warmth, kindness, handcraft).

A "Yes" on all three = actionable now. Two yeses = worth keeping on the list. One or zero = future research.

---

## Part 1 — Modern Game Music Architecture

### 1.1 The Stack — Engines, Middleware, and Web-Native

The modern landscape of interactive music systems breaks into three tiers:

**Tier 1 — Commercial middleware** (for AAA and most big-studio indie):
- **FMOD Studio** — dominant audio middleware; strong event-based system; C/C++/C# integrations; free for indies under a revenue threshold. Major games: Celeste, Hollow Knight, Cuphead, Slay the Spire, Dead Cells.
- **Wwise (by Audiokinetic)** — peer of FMOD, slightly more enterprise-oriented; rich RTPC (Real-Time Parameter Control) system. Used in: many AAA titles, some indies like Inscryption.
- **Elias (ELIAS Studio)** — smaller, niche, but *specialises in adaptive music*. Less common.
- **Resonai**, **Fabric**, **CRIWARE (ADX2)** — region-specific or specialised middleware.
- **Both FMOD and Wwise are cross-platform**, but neither ships a supported web/JavaScript runtime natively. A WebAssembly port exists for FMOD (since 2020) but integration into browser games is non-trivial.

**Tier 2 — Game engine audio systems** (built-in):
- **Unity Audio** (AudioSource, AudioMixer). Serviceable; newer *Audio Random Container* (2023+) offers better variance.
- **Unreal MetaSounds** (UE5) — procedural synthesis graph built into Unreal. State-of-the-art for in-engine synthesis. Not web-available.
- **Godot AudioStream + AudioEffect** — lightweight, scripted, fine for indies.
- **Phaser 3 Sound Manager** — thin wrapper over Web Audio. Uses `WebAudioSound` via `HTMLMediaElement` (HTML5) fallbacks. Limited adaptive capabilities.

**Tier 3 — Web-native audio stacks** (WHS's tier):
- **Web Audio API** (W3C standard, 1.1 in 2025). The foundational layer. Graph of `AudioNode`s, an `AudioContext` with a sample-accurate clock.
- **Tone.js** — A Web-Audio-native library with DAW-like abstractions (Transport, Time, Event, Pattern, synths). De facto standard for serious Web Audio work.
- **Howler.js** — simpler SFX-focused Web Audio library. Popular but limited for interactive music.
- **Elementary Audio** — JavaScript DSP framework with a React-like declarative API. Very new, promising.
- **Tonal.js** — music theory toolkit (scales, chords, intervals, transpositions). Used *alongside* synthesis libraries to write music-correct generative code.
- **Bespoke systems** — raw Web Audio with a hand-written scheduler. WHS is here.

**WHS's architecture (per codebase inventory):** bespoke Web Audio engine (`ProceduralMusicEngine`), 4 synthesis layers, a `Conductor` reading game state, a lookahead-based `NoteScheduler`, shared `AudioContext` with `AudioSystem` (SFX), output `DynamicsCompressorNode` for limiting. This is a serious implementation.

### 1.2 The Web Audio Clock Story (Chris Wilson's "Tale of Two Clocks")

The single most important article about Web Audio is Chris Wilson's 2013 [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling). The key insight, still relevant:

- `AudioContext.currentTime` is a high-precision monotonic clock in *seconds*, updated by the audio thread (not JS).
- `setTimeout` / `setInterval` / `requestAnimationFrame` are **terrible** for musical timing — their granularity is 4–16ms and they're affected by main-thread jank.
- **The solution**: a *lookahead scheduler*. The JS loop runs at modest rate (every 25ms or so), looks forward into Web Audio time (e.g., 100ms ahead), and schedules all notes in that window on the audio thread with sample-accurate start times.

**Canonical parameters (MDN, 2025):**
- `lookahead` = 25ms (how often the scheduler callback runs).
- `scheduleAheadTime` = 100ms (how far ahead to schedule).
- **Rule:** `lookahead < scheduleAheadTime` with comfortable margin.

**WHS fit.** The codebase already uses a lookahead scheduler (`NoteScheduler`). This is correct practice. Audit opportunity: confirm parameters match these canonical values.

### 1.3 AudioContext Lifecycle

Browsers block audio autoplay — `AudioContext` starts in `suspended` state. Must be resumed on a user gesture (click, key press).

**Best-practice lifecycle:**
1. Create **one** AudioContext per app (never create a second; never close and recreate).
2. Resume on first user interaction (menu click).
3. Never `suspend()` mid-session unless pausing the whole app.
4. Handle `statechange` events for robustness.

**Shared context principle** (per WHS CLAUDE.md): `AudioSystem` (SFX) and `ProceduralMusicEngine` share one context via `audioContext.ts`. This is the correct pattern — two contexts means two hardware output streams, glitching, and battery drain.

### 1.4 Audio Graph Design Patterns

A well-architected Web Audio graph has distinct *sub-graphs* for separable concerns, each with its own bus:

```
Sources (synths, samples)
  ↓
Voice buses (per-instrument processing)
  ↓
Group buses (music bus / SFX bus / voice bus / ambience bus)
  ↓
Master bus (EQ, compression, limiting)
  ↓
Destination (speakers)
```

Each group bus has:
- **Volume control** (GainNode, user-facing).
- **EQ** (BiquadFilterNode) for tone shaping.
- **Send effects** (reverb via ConvolverNode, delay via DelayNode).
- **Mute/duck capability** (GainNode with automation).

**Inter-bus communication patterns:**
- **Sidechain ducking** — SFX bus's level reduces music bus volume briefly via automation.
- **Send-return** — parallel processing rather than insert.

**WHS fit.** Music/SFX ducking exists. Per-instrument voice buses are likely implicit in the synthesis layers; making them *explicit* with named GainNodes allows finer-grain mixing.

### 1.5 AudioWorklet — The Modern Processor

Before AudioWorklet (introduced 2018), custom DSP ran via `ScriptProcessorNode` on the main thread. Deprecated — causes glitches under CPU load.

**AudioWorklet runs on a separate audio thread.** It's the modern way to build:
- Custom synths and samplers.
- Realtime DSP (compressors, EQs, distortion).
- Spectral analysis for visualisation.
- Audio-reactive game logic (sound-triggered events).

**Practical usage:**
```javascript
// On the main thread
await audioContext.audioWorklet.addModule('my-worklet.js');
const node = new AudioWorkletNode(audioContext, 'my-processor');

// In the worklet file
class MyProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (const channel of output) {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = /* your DSP */;
      }
    }
    return true;
  }
}
registerProcessor('my-processor', MyProcessor);
```

**Trade-offs.** AudioWorklet is powerful but has a learning curve. It's a separate JavaScript context — no direct access to main-thread variables; communication via ports.

**WHS fit.** Current synthesis probably uses standard `OscillatorNode` + `GainNode` chains (which run on audio thread natively — no worklet needed). Worklet becomes useful if we want custom synthesis models (physical-model bagpipe drone, granular reverb, wavetable). Mark as *speculative but powerful*.

### 1.6 Beat Clock & Transport

A beat-aligned system needs a *musical clock* separate from `currentTime`:

```javascript
class BeatClock {
  constructor(audioContext, bpm = 120) {
    this.ctx = audioContext;
    this.bpm = bpm;
    this.startTime = 0;
    this.secondsPerBeat = 60 / bpm;
  }
  
  beatToTime(beat) {
    return this.startTime + beat * this.secondsPerBeat;
  }
  
  timeToBeat(time) {
    return (time - this.startTime) / this.secondsPerBeat;
  }
  
  currentBeat() {
    return this.timeToBeat(this.ctx.currentTime);
  }
}
```

**Tempo changes:** when BPM changes, snapshot the current beat position, change BPM, recalculate start-time so the beat position holds.

**Subdivisions:** expose beat + subdivision (quarter, eighth, sixteenth, triplet) for event scheduling. Tone.js's `Tone.Time` does this well.

**WHS fit.** The music engine presumably has a beat clock internally. Opportunity: expose it to game logic. Evolutions could trigger *on next beat*, boss music could sync to *the downbeat after boss-spawn*, screen shake could pulse *with the bass*.

### 1.7 Buffer Management & Sample Loading

For sample-based sounds (SFX primarily, but also melodic samples like a recorded bagpipe drone):

1. **Decode early.** `audioContext.decodeAudioData(arrayBuffer)` is async and slow; do all decoding at boot.
2. **Pool AudioBuffers.** Each sound file → one AudioBuffer, shared across many AudioBufferSourceNodes.
3. **Use AudioBufferSourceNode** (plays a buffer) — cheap to create, *one-shot* (can't be restarted; must create new ones per play).
4. **Pre-warm.** Play every sample once silently at startup to force decoder caching.

**WHS fit.** SFX infrastructure probably already does this. If not, an audit pass is worth it for perf.

### 1.8 Latency Management

Browser audio has three latency layers:

1. **Hardware latency** — can be tens of ms, especially on Windows WASAPI or bluetooth audio.
2. **Browser/OS buffer latency** — typically 10-40ms.
3. **Application latency** — schedule-ahead buffer (our 100ms lookahead).

**Strategy for perceived responsiveness:**
- Schedule audio events *at* the game event time (or as close as possible).
- Visual events can be delayed *slightly* to match audio — feel feels tighter when audio leads visuals by a few ms than the opposite.
- For truly tight sync (beat-matched combat), use a fixed *visual-to-audio offset* calibrated per device.

**WHS fit.** Given auto-combat and non-rhythm gameplay, this matters less than in a rhythm game. Don't over-engineer.

### 1.9 Limiting, Compression, Loudness

Final output must be limited to prevent clipping (going above 0 dBFS causes distortion).

**Standard output chain:**
```
Master Bus Gain → Compressor (soft knee) → Limiter (hard brick-wall)
```

Web Audio provides `DynamicsCompressorNode` with reasonable defaults. For a limiter, set:
- `threshold: -1` (dB)
- `knee: 0`
- `ratio: 20` (very aggressive)
- `attack: 0.003`
- `release: 0.050`

This prevents any clipping while preserving dynamics up to the threshold.

**LUFS targets.** Modern games target -14 to -18 LUFS integrated loudness (similar to streaming platforms). Too loud = fatiguing. Too quiet = users crank volume and startle on loud SFX.

**WHS fit.** `DynamicsCompressorNode` is in use per CLAUDE.md. Audit its parameters; consider a LUFS-style loudness audit with a browser loudness meter (EBU R128 plugins exist).

---

## Part 2 — Procedural & Generative Music

### 2.1 The Spectrum of Authorship

Game music exists on a spectrum from fully-authored to fully-generative:

1. **Fully authored** — a composer writes exact tracks. Traditional method.
2. **Authored with branching** — composer writes distinct cues that swap at branch points. Most "adaptive" music.
3. **Authored layers** — composer writes stems that combine dynamically. Vertical layering.
4. **Parameter-driven** — composer writes music-as-parameters; engine assembles.
5. **Rule-based generative** — engine generates notes from rules (scales, rhythms, phrases).
6. **Statistical generative** — engine uses models (Markov, neural) trained on human music.
7. **Pure algorithmic** — engine generates music from mathematical processes (cellular automata, chaos, etc).

**Fully generative rarely works well** without strong rules. The best procedural music systems are *hybrid* — human-authored constraints (scale, tempo, mood, instrument voicings) with generative *execution* within those constraints.

**WHS is at Tier 5** (rule-based generative): Euclidean rhythms, FM synthesis, scale-constrained melodic phrases, conductor reading game state. This is the sweet spot for *reactive* but *emotionally legible* music.

### 2.2 Rule-Based Composition Patterns

**Scale constraints.** The simplest procedural music rule: choose notes only from a specific scale (pentatonic, modal, etc.). Outputs are always *musically coherent*.

Scottish folk scales:
- **Pentatonic major** (do, re, mi, so, la) — universal folk.
- **Pentatonic minor** (la, do, re, mi, so) — melancholic.
- **Dorian mode** (d-e-f-g-a-b-c-d) — huge in Scottish/Celtic music ("Scarborough Fair", "Drunken Sailor"). Minor but with a raised 6th giving hopeful edge.
- **Mixolydian mode** — major with flat 7th. Pibroch-typical.
- **Aeolian (natural minor)** — darker, laments.

**WHS opportunity.** Explicit per-biome scale. Moor = Dorian. Bog = Aeolian. Loch = Mixolydian. Edinburgh Old Town = chromatic fragments. Cailleach = whole-tone scale (unsettling).

**Chord progressions.** Rules like:
- "Tonic → pre-dominant → dominant → tonic" (classic cadence).
- "I-V-vi-IV" (ubiquitous pop).
- "i-VII-VI-VII" (Celtic flavour — think "What Shall We Do With a Drunken Sailor").

**Voice leading rules.**
- Voices (bass, tenor, alto, soprano) move by small intervals.
- Parallel octaves and fifths generally avoided in Western harmony.
- Contrary motion preferred when possible.

**Rhythmic rules.**
- Beat 1 strong, beat 3 medium, 2 and 4 weak (for 4/4).
- Syncopation accent shifts to off-beats.
- In strathspeys, the "snap" on beats 1 and 3 (short-long rhythm).

### 2.3 Euclidean Rhythms (Bjorklund Algorithm)

**What it is.** An algorithm (Godfried Toussaint, 2004, from Bjorklund's neutron-accelerator timing work) that distributes *k* beats across *n* steps as evenly as possible. Produces musically-pleasing rhythms used across world music and procedural systems.

**Notation:** E(k, n). Examples:
- E(3, 8) = [1, 0, 0, 1, 0, 0, 1, 0] — a 3-against-8 pattern, typical of Cuban tresillo.
- E(5, 8) = [1, 0, 1, 1, 0, 1, 1, 0] — Cuban cinquillo.
- E(5, 16) = common Bulgarian folk.
- E(7, 12) = West African bell pattern.

**Why it works.** Produces rhythms that are *almost* regular but with just enough irregularity to feel alive.

**Implementation (simplified):**
```javascript
function euclidean(k, n) {
  const pattern = [];
  let count = 0;
  for (let i = 0; i < n; i++) {
    count += k;
    if (count >= n) {
      pattern.push(1);
      count -= n;
    } else {
      pattern.push(0);
    }
  }
  return pattern;
}
```

**WHS fit.** CLAUDE.md notes Euclidean rhythms are in use in the percussion layer. Opportunity: expose the (k, n) parameters as part of the `Conductor`'s state — intensity could shift the pattern from E(3,16) (sparse calm) to E(11,16) (dense combat).

### 2.4 Markov Chains for Melody

**What it is.** A probabilistic model where the next note depends only on the current note (and maybe the previous N notes for N-gram Markov). Train on a corpus of folk tunes → generate infinite new tunes *in that style*.

**Training step:**
1. Parse a corpus of (say, Scottish folk) tunes into note sequences.
2. For each note, count transitions to every next note.
3. Normalise counts to probabilities.

**Generation step:**
- Pick a random starting note (weighted by corpus frequency).
- At each step, sample the next note from the transition distribution.
- Stop when reaching an "end" state or a target length.

**Higher-order Markov (N-gram):** condition on the previous 2 or 3 notes instead of 1 — produces more structured output but needs more training data.

**WHS fit.** Speculative but feasible. A Markov-trained Scottish folk generator could spice up procedural music without departing from the folk idiom. Even a hand-authored transition table (no real training data) would work for ~100 distinctive output tunes.

### 2.5 Cellular Automata & Generative Rhythm

**Game of Life**-style cellular automata can produce rhythmically-interesting patterns. Not commonly used in games (too abstract) but distinctive when applied.

**Pattern.** Start with a seed row. Apply a rule (e.g., Rule 90 from Wolfram's 1D automata) to produce the next row. Each row becomes a rhythmic frame. Over time, patterns self-generate.

**WHS fit.** Not an immediate need; noted for speculation.

### 2.6 L-Systems for Melodic Structure

Lindenmayer systems — string-rewriting rules originally for plant modelling. Applicable to melodic phrase structure:

Rule: `F → F+F-F` (where `F` is a note, `+` transposes up, `-` transposes down).

Applied recursively, produces fractal-like melodic structures that self-similar at multiple scales. Distinctive; rarely-used in games.

**WHS fit.** Speculative.

### 2.7 Neural Models (2024–2026 State)

The mainstream of AI music generation:

**Magenta** (Google, 2016–) — TensorFlow-based, open-source, pioneer in neural music. Particular strengths: *Magenta Studio* plugins (Ableton), *Music Transformer*, *NSynth* (neural audio synthesis).

**MusicLM** (Google, 2023) — text-to-music via diffusion models. Not publicly usable in real-time game runtime.

**Suno** (commercial, 2023–) — text-to-music. v4.5 (May 2025) and v5 (Sept 2025) are flagship models. Explicitly marketed for *"personalized soundtracks that generate adaptive music for games or virtual reality"* — though runtime integration requires their API.

**Udio** — competitor to Suno. Known for strong vocal and lyric generation.

**Stable Audio** (Stability AI) — text-to-audio, including music and SFX. Open-weights variants exist.

**Riffusion** — diffusion over spectrograms. Interesting technique, niche use.

**For real-time game music:** none of these diffusion/transformer models run in-browser at real-time speeds *yet*. They are tools for *creating stem assets offline* that the game then uses adaptively.

**WHS fit.** Current use: *offline asset creation*. Future: as browser GPU inference matures (WebGPU + ONNX Runtime Web + smaller models), in-runtime generation becomes feasible. 2026 is probably too early; 2028 plausible. For now: AI tools help *create* the stems and presets; the real-time engine uses them.

### 2.8 Case Studies — Procedural Music Systems in Shipped Games

**No Man's Sky (Hello Games, 2016) — 65daysofstatic**
- Collaborated with the post-rock band 65daysofstatic.
- Generative system called *Pulse* assembles tracks from stems.
- Mood axes: exploration vs combat.
- Produces hours of unique music per session.
- *Verdict:* atmospheric and convincing; critics praise.

**Spore (Maxis, 2008) — Brian Eno**
- Eno composed small musical snippets that assemble procedurally.
- Cell / Creature / Civilisation / Space stages have different musical vocabularies.
- *Verdict:* organic and evolving; pioneering but dated.

**Red Dead Redemption 2 (Rockstar, 2018) — Woody Jackson**
- Stems recorded with the Americana ensemble (Senses of the South).
- Mission-based scores use layered stems that combine dynamically.
- Tension parameters swap between mellow, tense, and action layers.
- *Verdict:* gold standard for authored-layers adaptive music.

**Everything (David OReilly, 2017) — Ben Lukas Boysen**
- Music evolves based on player scale (small creature vs galaxy).
- Unusual scope axis — zoom level is a mood parameter.
- *Verdict:* meditative, highly reactive.

**Crypt of the NecroDancer (Brace Yourself Games, 2015) — Danny Baranowsky**
- Music is *mechanics* — player must move on the beat.
- Fixed tempo per level; beat-matching is gameplay.
- *Verdict:* extreme end of music-as-mechanic.

**Unavowed / Thimbleweed Park / LucasArts adventure games — various**
- iMuse system (1991, invented by Peter McConnell and Michael Land at LucasArts) — the ancestor of adaptive music middleware. Horizontal re-sequencing + vertical layering both pioneered here.

**WHS fit.** RDR2 is the closest kin for *authored-layers adaptive music*. No Man's Sky / Spore for *fully-generative*. WHS's bespoke approach is a hybrid — generative execution within authored vocabulary (instruments, scales, intensity rules).

### 2.9 Live-Coding Paradigms

**TidalCycles / Sonic Pi / FoxDot** — live-coding music languages. Write music as code in a text editor, patterns execute live.

**Key idea borrowed from live coding:** music as a *terse expression*. `bd ~ sd ~` means "kick, rest, snare, rest" — four-beat pattern in 8 characters.

**WHS fit.** The `Conductor` could read game state and *compile* a live-coding-style expression for the synthesis layers to execute. This DSL approach would make music-state transitions transparent in save data (debuggable).

### 2.10 The Generative-Music Quality Ladder

From my survey, five rungs of increasing quality:

1. **Randomly picking notes within a scale.** Sounds *random*, not musical.
2. **Adding rhythmic constraints** (beat grid, Euclidean rhythm). Sounds *rhythmic but aimless*.
3. **Adding harmonic progression** (chord changes on set schedule). Sounds *musical but mechanical*.
4. **Adding phrase structure** (antecedent/consequent, call-and-response). Sounds *like folk*.
5. **Adding expressive variation** (swing, velocity dynamics, subtle timing shifts). Sounds *human*.

Most indie procedural music stops at rung 3. Supergiant/Rockstar quality is rung 5. The extra layers are *massive* work per rung.

**WHS fit.** Probably at rung 3 currently. Pushing to rung 4 (Celtic phrase structures) is a spec-level project but achievable.

---

## Part 3 — Adaptive Music Patterns (Deep)

### 3.1 Vertical Layering (Re-Orchestration)

**What it is.** Multiple music stems playing simultaneously. Engine adds/removes layers based on game state. Phrase timing and key stay constant — only *orchestration* changes.

**Example — 4-layer combat track:**
- **Bed** — ambient pad, always-on.
- **Bass** — joins when first enemy appears.
- **Drums** — joins when combat intensifies (N enemies on screen).
- **Lead** — joins when boss present OR combo > 25.

All four tracks are pre-composed to be *in tempo, in key, and mutually compatible*. Crossfade on beat boundaries.

**Pros:** seamless; preserves musical flow.
**Cons:** requires composed stems; can feel "stuck" without variation.

**Implementation:** maintain per-layer GainNodes. Fade via `gainNode.gain.linearRampToValueAtTime(target, endTime)`. Transitions aligned to beat boundaries (not arbitrary ms).

**WHS fit.** Already implemented partially (4 layers, conductor). Strengthen: ensure crossfades are beat-aligned, not linear-time-aligned.

### 3.2 Horizontal Re-sequencing (Branching)

**What it is.** Music *switches* from one cue to another at a branch point. Used for bigger state changes: entering combat, boss appearing, act transition.

**Transition types:**
- **Hard cut** — instant. Jarring unless intentional.
- **Crossfade** — smooth. Works best with related musical material.
- **Musical transition** — a short bridge cue plays to smoothly lead from A to B. Ideal but requires composing bridges.
- **Stinger-masked cut** — a loud stinger covers an otherwise-jarring cut. Practical shortcut.

**Best practice:** cues composed in the same key OR pre-designed to transition (ending with a phrase that leads into the next cue's starting phrase).

**WHS fit.** Currently more vertical than horizontal. Adding horizontal re-sequencing for act transitions (moor → bog → loch) would feel more distinctive.

### 3.3 Parametric Composition (Conductor-Driven)

**What it is.** Music isn't composed as *cues* but as a *system* with parameters. Changing parameters reshapes the music in real time.

**Parameter axes (from current WHS and general practice):**
- **Intensity** (0-1) — overall energy level.
- **Danger** (0-1) — threat proximity.
- **Chaos** (0-1) — disorderliness.
- **Triumph** (0-1) — achievement mood.
- **Calmness** (0-1) — rest vs action.
- **Wonder** (0-1) — exploration mood.

Each parameter affects the system in defined ways — tempo, density, layer mix, scale choice, filter cutoff.

**Example:**
```
Intensity 0.2 → tempo 85 BPM, drums off, pad warm, filter soft
Intensity 0.8 → tempo 120 BPM, drums on, pad bright, filter open
```

**WHS fit.** Per CLAUDE.md: *mood axes (intensity, danger, chaos, triumph)* are already driving layers. This is excellent. Opportunity: document the full parameter→effect mapping as a matrix in a spec.

### 3.4 Transitional Composition

**What it is.** Cues composed *as transitions* — they bridge two states. Often 2-8 bars long.

**Example transitions:**
- Exploration → Combat.
- Combat → Victory.
- Victory → Exploration.
- Calm → Boss.
- Boss → Boss-phase-2.

Transitions can be:
- **Always the same** (reused each time).
- **Variation-pooled** (3-5 variants of each transition randomly picked).
- **Parametric** (transitions generated from current & target state).

**WHS fit.** Probably missing explicitly. Linear crossfades are the default. Adding even 5 named transition cues would dramatically improve musical grace.

### 3.5 Stinger Systems (Deep)

**What it is.** Short (0.5-4s) musical hits that fire on specific events. They ride *over* the current music without disrupting it.

**Design rules:**
- **Key-aware.** Stingers composed to match the song's key. Multi-key stingers need multiple versions.
- **Tempo-relative.** Stingers may be duration-fixed or beat-fixed depending on use.
- **Dynamically ducked.** Stingers briefly duck the underlying music if they need prominence.
- **Volume-balanced.** Stinger ~3-6 dB louder than music bed, not drowning it.
- **Reserved meaning.** A stinger should always mean one thing (level-up, boss-kill, combo-milestone, etc.).

**Stinger library for WHS** (per feel doc §4.6, deepened):

| Stinger | Length | Musical content | Notes |
|---|---|---|---|
| Level-up | 1.5s | Ascending arpeggio in pentatonic | Common, musical |
| Weapon L-up | 0.5s | Single bright pluck | Quieter |
| Evolution | 2.5s | Full Celtic fanfare flourish | Reserved — rare |
| First-time evolution | 3s | Extended flourish with specific instrument theme | Reserved for first ever |
| Boss warn | 2s | Descending minor, pibroch-inflected | Warning tone |
| Boss kill | 3s | Major-key triumphant | Celebration |
| Combo 10 | 0.3s | Single accent | Subtle |
| Combo 50 | 0.5s | 2-note hit | Noticeable |
| Combo 100 | 1s | 3-note hit + reverb | Remarkable |
| Combo 500 | 2.5s | Full celebratory gesture | Rare |
| Chest open | 0.5s | Bright chime | Common |
| Rare chest | 1s | Longer chime | Uncommon |
| Act complete | 2s | Cadential resolution to tonic | Once per act |
| Route chosen | 0.5s | Key-shift signal | Subtle |
| Low HP warn | 0.8s | Descending minor, distressed | Uses sparingly |
| Revival | 2s | Rising phoenix figure | Once per run if happens |

### 3.6 Musical State Machines

**What it is.** A state machine where each state is a music configuration. Transitions are events.

```
[Menu Hearth]
  ├─ on: start-run → [Run Calm]
  └─ on: daily-challenge → [Run Daily]

[Run Calm]
  ├─ on: combat-start → [Run Combat Low]
  └─ on: boss-approach → [Run Boss Warn]

[Run Combat Low]
  ├─ on: enemy-density-high → [Run Combat High]
  ├─ on: combat-end → [Run Calm]
  └─ on: boss-approach → [Run Boss Warn]

[Run Boss Warn] (2s)
  └─ auto → [Run Boss Fight]

[Run Boss Fight]
  ├─ on: boss-phase-2 → [Run Boss Phase 2]
  ├─ on: boss-dead → [Run Victory] (3s)
  └─ on: player-dead → [Run Death] (2s)

[Run Victory] (3s)
  └─ auto → [Run Calm]

[Run Death] (2s)
  └─ auto → [Menu Death]
```

Each state has: active layer set, tempo, key, filter state, mood-axis values. Transitions have: crossfade curve, duration, optional bridge-cue.

**WHS fit.** The `Conductor` may already be implicit state-machine; making it explicit (typed states, documented transitions) improves debugability and balance iteration.

### 3.7 Microtiming & Humanisation

Perfectly quantised music feels *mechanical*. Real musicians play *slightly* off the grid — intentionally or not.

**Humanisation parameters:**
- **Note timing jitter** — ±5-15ms randomisation per note.
- **Velocity jitter** — ±10% per note.
- **Groove** — systematic per-beat offset (beat 2 slightly early, beat 3 slightly late) producing swing.
- **Tempo drift** — ±0.5 BPM random walk over the course of a phrase.

**Trade-off:** too much humanisation = sloppy; too little = robotic. 5-10ms timing and 10% velocity jitter is a good starting range.

**WHS fit.** Opportunity — subtle humanisation across all procedural music would feel more "real."

### 3.8 Beat-Tied Gameplay Events

Even in non-rhythm games, beat-awareness can create subtle musical polish:

- **Soft-quantise attack SFX.** Weapon-fire SFX start on the *nearest* beat subdivision (shift by ±20ms).
- **Snap evolutions to the beat.** Evolution pickup fires its stinger on the next downbeat, not instantly.
- **Align combo milestones.** Combo-100 stinger fires on beat 1 of the next measure.
- **Heartbeat-aligned low HP.** HP pulse VFX throbs in sync with the music.

**Risk.** Over-quantising can make combat feel slower than it is. Keep delays ≤ 50ms.

**WHS fit.** Opportunity — this layer is *almost* invisible but elevates perception of craft.

---

## Part 4 — Synthesis & Sound Design

### 4.1 Synthesis Paradigms

**Subtractive synthesis** — start with a harmonically-rich wave (sawtooth, square, pulse), carve shape using filters (low-pass typical). Moog, ARP, Prophet tradition. Warm, analog-sounding. Great for *bass*, *pads*, *leads*.

Web Audio: `OscillatorNode` (sawtooth/square/triangle/sine) → `BiquadFilterNode` (lowpass).

**FM synthesis (frequency modulation)** — one oscillator's frequency modulates another's. Invented by John Chowning, Stanford, 1967. Used in Yamaha DX7. Characteristically *bright, bell-like, percussive*. Can produce acoustic-like tones (piano, bell, brass).

Web Audio: `OscillatorNode` (modulator) → `gain` → `AudioParam` (carrier.frequency).

**WHS current use:** FM piano synthesis is mentioned in the codebase — an excellent choice for Scottish folk piano feel.

**Additive synthesis** — sum sine waves to construct complex timbre. Matches Fourier theory. Expressive but expensive. Cathedral organs work this way.

Web Audio: many `OscillatorNode`s summed. Use `PeriodicWave` for pre-computed harmonic specs.

**Wavetable synthesis** — morph through pre-computed waves. Serum, Massive, Vital are famous. Good for evolving pads.

Web Audio: load table as `PeriodicWave` or sample buffers and interpolate.

**Granular synthesis** — slice audio into short grains (5-100ms) and replay them with variations. Reconstructs or deconstructs sound in interesting ways. Great for *atmosphere*, *texture*, *evolving drones*.

Web Audio: chain `AudioBufferSourceNode` with `playbackRate` variations and envelopes. AudioWorklet for efficiency.

**Physical modelling** — simulate the physics of acoustic instruments (string vibrations, air-column resonance, membrane modes). Karplus-Strong for string; waveguide for tubes.

Web Audio: possible in AudioWorklet. Specialty; rarely used.

**Sample-based** — play recorded audio directly. Most realistic; requires sample-library storage.

Web Audio: `AudioBufferSourceNode` with pitch-shift via `detune` or `playbackRate`.

**WHS opportunity.** A physical-modelled bagpipe drone using Karplus-Strong would be *extraordinary* for Scottish identity. Realistic-sounding bagpipe in synthesis rather than sample = infinite tuning.

### 4.2 Envelope Generators (ADSR)

The ADSR envelope is universal in synthesis:
- **Attack** — time for volume to rise from 0 to peak.
- **Decay** — time to fall from peak to sustain level.
- **Sustain** — the held level while the key is held.
- **Release** — time to fall from sustain to 0 after key-up.

Web Audio: `GainNode` with `gain.cancelScheduledValues()` + `linearRampToValueAtTime()` + `setTargetAtTime()` (exponential).

**Common envelope shapes:**
- **Percussive** (A:0.01, D:0.2, S:0, R:0.1) — plucks, drums.
- **Pad** (A:1.5, D:0, S:1, R:2.0) — sustained strings.
- **Organ** (A:0.01, D:0, S:1, R:0.1) — on/off hold.
- **Swell** (A:3.0, D:0, S:1, R:1.5) — slow fade-in.

**WHS** uses these patterns implicitly in its synthesis layers.

### 4.3 Filters & Tone Shaping

Biquad filter types in Web Audio:
- **Lowpass** — removes high frequencies. Makes sounds darker, more distant.
- **Highpass** — removes low frequencies. Thinner, clearer.
- **Bandpass** — lets only a band through. Telephony effect.
- **Notch** — removes a narrow band. Anti-whine.
- **Allpass** — passes all frequencies but shifts phase. Used in reverbs.
- **Peaking** — boosts a band. EQ.
- **Shelving (low/high)** — boosts above/below a point. EQ.

**Expressive filter automation** is a hallmark of good synth design:
- **Filter envelope** — a separate envelope controlling filter cutoff, decoupled from amplitude.
- **LFO (Low-Frequency Oscillator)** — slow sine/triangle wave modulating the filter for motion.
- **Game-state-driven filter** — low HP → filter gets progressively darker.

**WHS fit.** The music engine has a master filter (LP) for dark/bright mood per CLAUDE.md. Extending filter automation per-layer and per-parameter would deepen sonic character.

### 4.4 Effects (Reverb, Delay, Distortion)

**Reverb** — simulates acoustic space. Web Audio has `ConvolverNode` (convolution reverb, very natural) and algorithmic reverbs (build from delays + feedback).

**Convolution reverb** uses an *impulse response* (IR) — a short audio recording of a real space's reverberation. Load an IR of:
- A Scottish cathedral (Dunblane, Glasgow).
- A stone circle (Callanish).
- A highland glen (natural).
- A bothy (small wooden cabin).
- A pub (Still Game's Clansman).

Real IRs are freely available from openair.hull.ac.uk and similar.

**WHS opportunity.** Per-biome convolution reverb — moor music uses natural-glen IR; Edinburgh Old Town music uses stone-alley IR. Distinctive sonic signature.

**Delay** — echoes. `DelayNode` + feedback via GainNode.

**Distortion** — waveshaping via `WaveShaperNode` with a lookup curve.

**Chorus / Flanger / Phaser** — time-varying delays. Build from `DelayNode` + LFO modulation.

**Compressor** — dynamic range compression via `DynamicsCompressorNode`.

### 4.5 Impulse Response Library for Scottish Game

If we invest in convolution reverb:

| IR | Space | Use for |
|---|---|---|
| Cathedral | Large reverberant stone | Boss fights with gravity |
| Glen (outdoor, natural) | Moderate hazy decay | Moor biome ambience |
| Cave / Grotto | Small bright dense | Cairngorm / Caves |
| Wooden Bothy | Small damped | Gran's Croft |
| Stone Circle | Unique ring-tone | Callanish / Pict sites |
| Clyde Shipyard | Large metal resonance | Industrial biome |
| Pub (Clansman) | Small crowded | Victory rest moments |
| Hebridean Beach | Open ocean | Machair biome |

Each IR is 1-5 seconds of audio, loaded as an AudioBuffer into a ConvolverNode.

### 4.6 Layered SFX Recipe (Deep)

Per feel doc §4.1, three-layer SFX. Here's the practical recipe:

**For "Weapon hits enemy":**
- **Body** — a deep thud-like sample or low-frequency sine burst. Frequency: 80-200 Hz. Envelope: sharp attack, short decay (~80ms).
- **Accent** — a bright high-frequency element. Could be a metallic clink sample, or a synthesised noise burst filtered bandpass at 4-8 kHz. Envelope: instantaneous attack, ~20ms decay.
- **Tail** — a small reverb or a noise-whoosh that decays over 200-400ms.

**Variance per layer:**
- Body: ±2 semitones pitch, ±20% volume.
- Accent: ±5 semitones pitch, ±30% volume (more freedom — brighter part).
- Tail: ±1 semitone, fixed volume.

**Triggering:** all three play at the *same moment* (not sequentially). The layers are sub-frame staggered by 2-8ms for stereo width.

### 4.7 Audio Asset Budget

For a WHS-scale web game, rough budget per SFX:
- 5-50 KB per SFX (sample), compressed (OGG Vorbis or AAC).
- Up to 200-300 SFX in the full library.
- Budget: ~10-20 MB total.

For music:
- Procedural = minimal sample storage (just presets and IRs).
- Sample-based music = 100KB-1MB per minute.

**WHS approach** (procedural + compressed SFX) is ideal for web.

### 4.8 Spatial Audio

**Panning.** `StereoPannerNode` places sound left-right. Use game coords.

**3D positional audio.** `PannerNode` with `positionX/Y/Z` and `orientation`. Automatic distance attenuation. Works without player ears (top-down 2D still benefits from L/R panning).

**WHS opportunity.** Enemies attack with panned SFX — a kelpie on the left splashes *left*. Subtle but amplifies spatial awareness.

**HRTF (Head-Related Transfer Function)** — binaural spatialisation using ear-specific filters. `PannerNode`'s `panningModel: 'HRTF'`. Works well with headphones, mediocre with speakers.

---

## Part 5 — Modern Pixel Art & 2D Animation Pipelines

### 5.1 The Pixel Art Renaissance

Pixel art in 2026 is not a retro aesthetic; it's a *modern* medium. Developers choose it for:
- **Clarity over fidelity** — small pixel counts force readable silhouettes.
- **Animation feasibility** — drawing 8x8 frames by hand is faster than rendering HD.
- **Performance** — tiny textures; browsers handle easily.
- **Distinctive look** — differentiation from AAA.

Modern pixel art standards:
- **Resolution:** 16x16 to 64x64 per sprite, rarely larger.
- **Palette:** 4-32 colours per sprite; some games use global 64-color palettes.
- **Frame rate:** often 8-12 fps for animations, *not* 60. Stylistic choice.
- **Rendering:** crisp integer-scale upscaling. No blending or anti-aliasing (usually).

**WHS standard** per CLAUDE.md: `pixelArt: true, roundPixels: true`, no antialiasing. Correct for the aesthetic.

### 5.2 Aseprite — The Industry Standard

**Aseprite** is the dominant pixel art editor (~$20, cross-platform, open-source core). Features:
- Onion-skinning for animation.
- Tilemap mode with tile reuse.
- Slicing for spritesheet export.
- Tags for animation segmentation.
- Scripting API (Lua).
- Palette editing with constraints.
- Indexed mode (palette-swap friendly).

Alternatives: **Pixelorama** (free), **Piskel** (browser-based), **GraphicsGale**, **LibreSprite** (fork).

**Aseprite workflow for WHS-like games:**
1. Design character sheet (idle, walk, dash, hit, death).
2. Animate each action as a tagged sequence.
3. Export spritesheet with metadata JSON.
4. Phaser loads atlas + frame data.
5. Animations reference by tag name.

### 5.3 Dead Cells Pipeline — 3D-to-2D Baking

Motion Twin's famous Dead Cells pipeline, for teams with limited hand-animation capacity:

1. **Draw a low-fidelity 2D sprite** as a reference silhouette.
2. **Build a 3D model** matching the sprite's proportions (in 3DS Max, Blender, etc).
3. **Rig and animate in 3D** — standard skeletal animation.
4. **Render the 3D output** at low resolution, orthographic view, no AA.
5. **Post-process the render** — aggressive colour quantisation, outline enforcement, dither.
6. **Use the baked frames as sprites.**

**Advantages:**
- Rapid iteration — a "weightier sword" is an animation-weight tweak, not a redraw.
- Consistent perspective.
- Easy new-pose creation.

**Disadvantages:**
- Requires 3D art skills.
- Initial setup is substantial.
- Baked frames can look slightly uncanny without good post-processing.

**WHS fit.** **Candidate technique for expanded character/enemy animation** if current hand-animation becomes a bottleneck. Major investment but scales well.

### 5.4 Skeletal (Bone) Animation

**Spine** (Esoteric Software) and **DragonBones** (open source) allow skeletal animation of 2D sprites — define bones, skin with image parts, animate bones.

**Advantages:**
- Smaller file size than frame-by-frame (transforms, not pixels).
- Smooth in-between animation.
- Easy re-skinning.
- Runtime-tuneable (e.g., stretch on dash).

**Disadvantages:**
- Clashes with crisp pixel aesthetic — easy to look smooth-3D.
- Bone-pose interpolation can show seams.

**Phaser integration.** Spine officially supports Phaser via `phaser3-spine`. DragonBones has community Phaser integrations.

**WHS fit.** Probably *not* a fit given the handcrafted pixel aesthetic. The haggis's animations look best hand-placed, not interpolated.

### 5.5 Procedural Pixel Animation

A distinctive emerging pattern: *procedurally generate animation* from state, rather than playing pre-authored frames.

Examples:
- **Rain World (Videocult)** — creature animations driven by IK (inverse kinematics) and physics. Slugs stretch around terrain.
- **Phase Angle / Lush** — procedural limb animation from position/orientation state.
- **Proceduraly generated transforms in code** — a sprite that squashes based on velocity, rotates on impact, pulses on action.

**WHS fit.** *Procedural transform* animation is cheap and impactful. Already proposed in feel doc §3.5 (squash-and-stretch). Implementation pattern:

```typescript
// Apply squash when landing from dash
sprite.setScale(1.0, 0.7);
scene.tweens.add({
  targets: sprite,
  scaleY: 1.0,
  scaleX: 1.0,
  duration: 120,
  ease: 'Elastic.easeOut',
});
```

Every entity could have a "state-driven transform layer" that applies these micro-animations without needing new sprite frames.

### 5.6 Tilemaps & Tile-Based Rendering

Phaser 3 supports tilemaps natively (Tiled editor export, JSON import).

**Tilemap advantages:**
- Huge worlds with small memory footprint.
- Tile-based collision.
- Auto-tiling (neighbour-aware tile selection).

**Modern tilemap techniques:**
- **Auto-tile systems** — place a tile, and adjacent tiles update to match (corners, edges, etc).
- **Wang tiles** — tile edges are coded so that compatible tiles are adjacent.
- **Animated tiles** — water, fire, torches.

**WHS fit.** Currently uses Voronoi regions for biomes (per CLAUDE.md), not tilemaps. Tilemap integration could come with larger biomes or Edinburgh-close/Glasgow-close style tight spaces.

### 5.7 Color & Palette Strategy

**Global palette approach.** The entire game uses a fixed 32-64 color master palette. Every sprite's colours come from it. Creates tight visual coherence.

**Per-biome palette.** Each biome has 8-16 colour sub-palette; sprites tinted dynamically.

**Dynamic palette shifting.** Shader applies palette swap at render time (see Part 6.5). Same sprite → different appearance based on state.

**Dithering** — using contrasting pixel patterns to simulate intermediate colours.

Types:
- **Ordered (Bayer) dithering** — fixed 2x2, 4x4, 8x8 threshold patterns. Looks crunchy-retro.
- **Blue noise dithering** — random but spatially-distributed, less patterned.
- **Error diffusion (Floyd-Steinberg)** — each pixel error propagates to neighbours. Looks more "painted."

**WHS fit.** Blue noise dither in *lighting* (Part 8) and *fog* would give that crunchy pixel-art look without overprocessing. Bayer dither for heavier gradients in boss-fight backgrounds.

### 5.8 Sprite Animation Budget Discipline

Good pixel art animates with *few frames at good timing* rather than many frames at flat timing. Source: 80 Level, Dead Cells GameAnim interviews.

**Typical frame counts per animation:**
- Idle loop: 2-4 frames (6-8 fps).
- Walk cycle: 4-8 frames (10-12 fps).
- Attack: 3-6 frames (variable timing).
- Hit reaction: 2-3 frames (fast).
- Death: 4-8 frames (paced).

**Timing matters more than frame count.** A 4-frame walk with hold-times [2, 4, 2, 4] (per frame in 60fps game-frames) feels more organic than 8 equally-spaced frames.

**WHS fit.** Per-sprite animation tags probably exist in asset pipeline. Audit opportunity for *varied hold-times* rather than uniform.

### 5.9 Modern Pixel Art Rendering Enhancements

**Outline effect.** A distinct outline colour around sprites makes them pop from background. Shader-based (see Part 6).

**Pixel-perfect anti-aliasing.** Rather than bilinear blur, use *rotated-pixel* scaling (xBRZ, HqX) for visible-pixel upscaling. Usually not desired in pixel-art games — pure integer scale is better.

**CRT / scanline shaders.** Can add retro-CRT look. Careful: often looks tacky unless deliberately referencing that aesthetic.

**Film grain / noise overlay.** Subtle noise texture on top creates filmic feel. Popular in modern pixel games like Hyper Light Drifter.

**Chromatic aberration.** Slight R/G/B channel offset at screen edges. Use *sparingly* — mostly for specific moments (crit, hit-stun).

---

## Part 6 — Shader Art for 2D Games

### 6.1 The Shader Landscape in Phaser 3

Phaser 3 (since v3.50) has a robust *Pipeline* system for custom shaders:

- **Pre-FX pipelines** — run during sprite rendering.
- **Post-FX pipelines** — run after everything is drawn, before final output.
- **Built-in FX pipelines** — `Blur`, `Bokeh`, `Bloom`, `ColorMatrix`, `Glow`, `Pixelate`, `Shadow`, `Shine`, `Vignette`, `Wipe`, `Circle`, `Barrel`, `Displacement`, `Gradient`, `Tilt Shift`.

You can apply these to individual sprites, cameras, or groups.

**Custom pipelines** extend `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`:

```typescript
class MyShaderPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader: FRAG_SHADER_SOURCE,
    });
  }
  onPreRender() {
    this.set1f('uTime', performance.now() * 0.001);
  }
}
```

Register in game config, apply to camera: `camera.setPostPipeline(MyShaderPipeline)`.

**Constraint.** Custom pipelines only work in WebGL render mode, not Canvas.

**WHS fit.** Phaser 3 pipeline system is the right layer. A `ShaderRegistry` module would centralise custom-pipeline registration.

### 6.2 GLSL Fragment Shader Primer

WebGL shaders use GLSL ES 1.00 (WebGL 1) or GLSL ES 3.00 (WebGL 2). Phaser 3 supports both; WebGL 2 is default in modern browsers.

Minimum viable fragment shader:

```glsl
precision mediump float;

uniform sampler2D uMainSampler;   // the scene texture
uniform float uTime;              // time in seconds
uniform vec2 uResolution;         // screen size

varying vec2 outTexCoord;         // pixel UV

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);
  gl_FragColor = color;
}
```

**Useful uniforms to provide:**
- `uTime` — for time-based animations.
- `uResolution` — for correct UV math.
- `uPlayerPos` — for effects centred on player.
- `uIntensity` — a 0-1 parameter for animated strength.
- `uPalette[32]` — for palette-swap.

### 6.3 Palette Swap Shader

**Technique.** Sprite stored with indexed palette (pixels are indices 0-31, not colours). Fragment shader looks up each pixel's index, indexes into a palette uniform, outputs the colour.

**Preparation.** Convert sprites to index maps — each pixel's R channel stores its palette index (e.g., R=0 → index 0, R=8 → index 8, scaled to 0-255).

**Shader:**

```glsl
uniform sampler2D uSprite;        // index map (grayscale)
uniform sampler2D uPalette;       // 1D texture: 32 or 64 wide, 1 tall
uniform int uPaletteSize;

void main() {
  float index = texture2D(uSprite, outTexCoord).r;
  vec2 paletteUV = vec2(index * 255.0 / float(uPaletteSize - 1), 0.5);
  gl_FragColor = texture2D(uPalette, paletteUV);
}
```

**Swapping palettes** = swapping `uPalette` texture. A character's colour scheme changes instantly.

**WHS opportunity.** Variant haggis with different tartan palettes; Cailleach-aspect Moor with cold palette.

### 6.4 Outline Shader

Classic 2D outline detection — check if current pixel has an opaque neighbour but is itself transparent → draw outline colour.

```glsl
vec2 offset = 1.0 / uResolution;
float n = texture2D(uMainSampler, outTexCoord + vec2(0, offset.y)).a;
float s = texture2D(uMainSampler, outTexCoord + vec2(0, -offset.y)).a;
float e = texture2D(uMainSampler, outTexCoord + vec2(offset.x, 0)).a;
float w = texture2D(uMainSampler, outTexCoord + vec2(-offset.x, 0)).a;
float edge = max(max(n, s), max(e, w));

vec4 original = texture2D(uMainSampler, outTexCoord);
if (original.a == 0.0 && edge > 0.0) {
  gl_FragColor = uOutlineColor;  // draw outline
} else {
  gl_FragColor = original;
}
```

**WHS fit.** Conditional outline on *elite enemies* (gold outline), *hazards* (red outline), *pickups at low HP* (bright outline) adds visual hierarchy cheaply.

### 6.5 Dissolve Shader

Fades a sprite by noise-driven pattern rather than uniform alpha.

```glsl
uniform float uProgress;          // 0-1, 0 = opaque, 1 = gone
uniform sampler2D uNoiseTex;

void main() {
  float noise = texture2D(uNoiseTex, outTexCoord).r;
  if (noise < uProgress) discard;
  gl_FragColor = texture2D(uMainSampler, outTexCoord);
}
```

**Uses:** enemy death, evolution "fade-out-fade-in" transform, revival effect.

### 6.6 Heat-Shimmer / Distortion Shader

Sample the scene with UV offsets driven by noise. Creates a wavy distortion.

```glsl
uniform sampler2D uNoiseTex;
uniform float uTime;

void main() {
  vec2 uv = outTexCoord;
  vec2 offset = vec2(
    texture2D(uNoiseTex, uv + vec2(uTime * 0.1, 0.0)).r,
    texture2D(uNoiseTex, uv + vec2(0.0, uTime * 0.1)).r
  ) * 0.01;  // amplitude
  gl_FragColor = texture2D(uMainSampler, uv + offset);
}
```

**Uses:** heat near fire tiles, magical distortion around Cailleach, hazard shimmer.

### 6.7 Haar Fog Shader

Animated 2D fog layer based on moving noise. Used as post-FX overlaid on biome.

```glsl
uniform sampler2D uMainSampler;
uniform sampler2D uNoiseTex;
uniform float uTime;
uniform float uFogDensity;       // 0-1
uniform vec3 uFogColor;          // e.g. (0.9, 0.9, 0.95)

void main() {
  vec2 uv = outTexCoord;
  float n1 = texture2D(uNoiseTex, uv * 0.5 + uTime * 0.02).r;
  float n2 = texture2D(uNoiseTex, uv * 0.3 - uTime * 0.015).r;
  float fog = (n1 * 0.6 + n2 * 0.4) * uFogDensity;
  
  vec4 scene = texture2D(uMainSampler, uv);
  gl_FragColor = mix(scene, vec4(uFogColor, 1.0), fog);
}
```

**WHS fit.** **High priority.** A haar-shader as biome transition and ambient effect is a signature Scottish-feel opportunity.

### 6.8 CRT / Scanline Shader

Creates a retro-CRT look. Not always desired; use for *specific moments* (e.g., an Easter egg arcade minigame).

Techniques:
- Horizontal scanlines (darken every other row).
- Barrel distortion (curve at edges).
- Chromatic aberration on the RGB channels.
- Phosphor bloom.

### 6.9 Chromatic Aberration (Moment Shader)

Offset RGB channels. Fires only briefly (on crit, on hit-taken, on boss-phase-transition). Subtle.

```glsl
void main() {
  vec2 uv = outTexCoord;
  vec2 dir = (uv - 0.5) * uIntensity;
  float r = texture2D(uMainSampler, uv + dir * 0.005).r;
  float g = texture2D(uMainSampler, uv).g;
  float b = texture2D(uMainSampler, uv - dir * 0.005).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
```

`uIntensity` animated 0 → 1 → 0 over ~200ms. Visible only briefly.

### 6.10 Bloom / Glow

Sample high-luminance pixels, blur them, add back. Creates a soft glow around bright sprites.

Computationally: requires multiple render passes (downsample → gaussian blur → upsample). Phaser 3's built-in `Bloom` PostFX covers this.

**WHS fit.** Applying Bloom to specific sprites (fire hazards, evolution pickups, boss telegraphs) adds an ethereal quality without breaking pixel discipline.

### 6.11 Signed Distance Fields (SDF)

**What it is.** Instead of storing pixel alpha values, store the *distance to the nearest edge*. At rendering time, you can:
- Render sprites at arbitrary sizes with crisp edges.
- Draw outlines of any thickness for free.
- Fill patterns, gradients, shadows.

**Common in:** text rendering (Valve's *Chris Green paper*), UI elements.

**Trade-off:** texture prep is more complex; small sprites work better with raw pixel data.

**WHS fit.** Probably not a fit for small pixel-art sprites, but *text rendering* (especially the big stinger text like "BOSS!" or "EVOLUTION!") could use SDF for ultra-crisp variable-size text. Phaser has `BitmapText` which is adjacent.

### 6.12 Shader Composition & Pipeline Order

When layering multiple shaders, order matters:

1. **Pre-FX (per sprite)** — palette swap, outline, dissolve.
2. **Scene render** — everything to screen.
3. **Post-FX (scene-wide)** — haar fog, heat-shimmer, bloom, chromatic aberration, vignette, CRT.

Don't apply haar-fog to UI (would fog the HUD). Don't apply bloom before palette swap (would blend palette badly). Plan the pipeline.

### 6.13 Shader Performance

- **Fragment shaders run per pixel per frame.** At 1920x1080x60fps = 124 million shader-runs per second.
- **Keep shaders simple.** Lookups are cheap; trigonometry and conditionals are costly.
- **Avoid branches in shaders** — use `mix`, `step`, `smoothstep` to replace conditionals.
- **Use low-resolution render targets** for effects that don't need pixel-perfect detail (bloom, fog).

**Testing.** Profile on the *slowest* target device. A shader that runs fine on a gaming PC may tank on a budget laptop.

---

## Part 7 — Procedural Visual Content

### 7.1 Noise Functions

**Perlin noise** (Ken Perlin, 1983) — classic gradient noise. Smooth, natural. Originally designed for *Tron* (1982).

**Simplex noise** (Perlin, 2001) — improved variant. Faster, isotropic, better for higher dimensions. Patent expired 2022.

**Value noise** — simpler, cheaper. Slightly blockier output.

**Fractal noise (fBm)** — sum multiple octaves of noise at increasing frequencies. Creates terrain-like texture.

```
fBm(x) = noise(x) + 0.5 * noise(2x) + 0.25 * noise(4x) + ...
```

**Worley noise (cellular)** — distance-to-nearest-point noise. Produces Voronoi-like cells. Good for stones, cracked ice, reptile skin.

**Libraries:** `simplex-noise` npm package is canonical for JS. Noise is cheap at runtime.

**WHS uses Voronoi for biomes** per CLAUDE.md. Expanding to noise-driven decorations (heather patches, rock clusters, ground-tone variation) would add organic variety.

### 7.2 Procedural Patterns

Patterns beyond noise:

**Wang tiles** — tiles coded by edge-colour so compatible ones fit. Seamless tiling from small asset set.

**Voronoi diagrams** — divide space into cells by nearest-point. Organic-looking partitions. WHS uses this.

**L-systems** — string-rewriting rules for branching structures. Trees, lightning bolts, heather stems, rivers.

**Reaction-diffusion** — simulating chemical systems for Turing patterns (animal coats, corroded metal).

**Wave Function Collapse (WFC)** — constraint-solving for tilemap generation. Given tile rules, generate layouts.

**Model synthesis** — WFC's older, related approach.

### 7.3 Wave Function Collapse Deep Dive

WFC, popularised by Maxim Gumin (2016), is state of the art for procedural content generation from examples.

**Algorithm (simplified):**
1. **Input:** a set of tiles or a sample image.
2. **Extract constraints:** which tiles can be adjacent to which?
3. **Initialise:** every output cell is in a superposition of all possible tiles.
4. **Observe:** pick the cell with lowest entropy (fewest remaining possibilities), "collapse" it to one tile.
5. **Propagate:** update neighbours' possibilities based on the collapsed tile's constraints.
6. **Repeat** until all cells are collapsed (success) or contradiction (restart/backtrack).

**Games using WFC:**
- **Townscaper** (by Oskar Stålberg) — entire game is WFC-driven.
- **Bad North** (Plausible Concept) — WFC-generated islands.
- **Caves of Qud** — variants.
- **Many indie projects** — increasingly popular since 2020.

**Quantum WFC** (research, 2024) — uses quantum-like probability to be faster and produce more varied results.

**JS libraries:** `wavefunctioncollapse` npm, various community forks.

**WHS fit.** WFC could generate *tile-based biomes*. For current Voronoi-biome approach, it's not drop-in. But if WHS ever adds *dungeon-like* biomes (Edinburgh closes, Glasgow alleys, Clyde shipyards), WFC is the natural tool.

### 7.4 Procedural Tartan (WHS-Specific)

Tartan patterns are *already procedural* in WHS per codebase inventory. Worth deepening.

**Traditional tartan structure:**
- A *sett* (block of colour sequences) that repeats in both horizontal and vertical axes.
- Equal warp and weft (vertical and horizontal threads) produce squared patterns.
- Colour bands range from a few pixels to dozens.
- Colour choice follows clan tradition but custom tartans are common.

**Procedural tartan algorithm:**
```javascript
function generateTartan(palette, bandSequence) {
  // bandSequence: array of [colorIndex, widthPixels]
  // Example: [[0, 16], [1, 4], [2, 8], [1, 4]]
  // Creates: 16px of color0, 4px of color1, 8px of color2, 4px of color1
  
  const setWidth = bandSequence.reduce((s, [, w]) => s + w, 0);
  const canvas = createCanvas(setWidth, setWidth);
  
  // Horizontal threads
  for (let y = 0; y < setWidth; y++) {
    const [colorIndex] = pickBand(y, bandSequence);
    fillRow(canvas, y, palette[colorIndex]);
  }
  
  // Weave vertical threads using 50% opacity
  for (let x = 0; x < setWidth; x++) {
    const [colorIndex] = pickBand(x, bandSequence);
    blendColumn(canvas, x, palette[colorIndex], 0.5);
  }
  
  return canvas;
}
```

**Named tartan variants:**
- **Royal Stewart** — red base, black/gold/white accents.
- **Black Watch** — blue/green/black subtle.
- **Hunting Stewart** — green/blue/black muted.
- **MacDonald** — green/red.
- **Campbell** — green/blue/black.
- **Scotland National** — red/black/yellow.

**WHS opportunity.** Unlock new tartan patterns via meta-progression. Haggis wears a different tartan per variant. Procedural generation means unlimited customs (e.g., *Wild Haggis Survivors Tartan* as a legendary cosmetic).

### 7.5 Heather & Foliage Generation

**Heather field** — hundreds of tiny purple-tipped sprigs on moorland.

**Efficient rendering:**
- One sprite atlas with 4-6 heather variants.
- Instance them at noise-driven positions (not grid — noisy distribution).
- 2-frame wind animation (sway left, sway right).
- Wind phase offset per-instance so they don't move in unison.

**Scaling.** A moor might have 2,000 heather instances. At that scale, instance rendering (many sprites from few draw calls) matters. Phaser 3's `GameObject.RenderTexture` or `Group` can batch these.

### 7.6 Water Surface Effects

Loch biomes need convincing water. Techniques:

**Animated tile-based.** 4-8 frame loop of water texture. Cheap but obvious.

**Sinusoidal ripple shader.** Scene rendered to texture, then re-rendered with a wavy UV offset:

```glsl
vec2 ripple = vec2(
  sin(uv.y * 20.0 + uTime * 2.0) * 0.002,
  0.0
);
gl_FragColor = texture2D(uScene, uv + ripple);
```

**Reflection shader.** Sample the sky (top half) and flip it onto the water surface.

**Specular highlights.** Sparkles moving across the surface, driven by noise + sun position.

**WHS fit.** Loch biome is one of the 5 biome classes. Water-specific shader would be distinctive.

### 7.7 Particle Choreography

Particle systems can go beyond "emit N per second." Modern particle design includes:

**Keyframed particle emitters** — emitter parameters (rate, velocity, colour) animate over the emitter's lifetime. E.g., a boss-death burst starts dense, slowly, white; transitions to sparse, fast, red; ends with final bright flash.

**Curve-based emission** — particles spawn along a Bezier curve or circle, not from a point.

**Force fields** — attractors and repulsors shape particle motion. Used for magnet pickups, boss-AoE swirls.

**Flocking / boids** — particles influenced by neighbour behaviour. Creates swarms (midges!).

**WHS fit.** Midge swarm enemies could use *actual boids algorithm* (alignment, cohesion, separation) for convincing swarm dynamics. A small perf cost, huge feel impact.

### 7.8 Ambient Procedural Events

Little touches that aren't critical but add life:

- **Shooting star** appears once per run (rare).
- **A bird** crosses the screen randomly every N seconds.
- **Heather blooms** shift colour over time as biome ages.
- **Distant lightning** flashes occasionally.
- **Mist tendril** drifts past.
- **Falling leaf** (pine biome).
- **Bat** flies by at night.
- **Fish jumps** in loch.
- **Sheep bleats** from off-screen.

Each is a rare, procedurally-timed event. Lightweight, atmospheric, surprising.

**WHS fit.** **Low effort, high impact.** A named `AmbientEventSystem` could handle these.

---

## Part 8 — 2D Lighting, Atmosphere & Weather

### 8.1 Why 2D Lighting

Dynamic lighting in 2D games creates:
- **Atmospheric depth** — lanterns, candles, bonfires cast actual light.
- **Narrative focus** — player and enemies lit differently from background.
- **Diegetic danger cues** — hazards glow ominously.
- **Time-of-day and weather variation** — day vs dusk vs stormy.

Great 2D-lit games: *Hyper Light Drifter*, *Terraria*, *Starbound*, *Dead Cells*, *Hollow Knight* (selectively), *20 Minutes Till Dawn*.

### 8.2 Normal Maps for Pixel Art

**What it is.** A texture where RGB encodes surface normals (X, Y, Z unit vectors, mapped to [-1, 1] colour range).

**Effect.** Lights hitting the sprite can be computed per-pixel — convincing 3D-lit look on flat 2D art.

**Creating normal maps:**
- **Hand-paint** in Photoshop/Aseprite — tedious but precise.
- **SpriteIlluminator / Sprite DLight** — commercial tools that auto-generate from 2D art. Decent results.
- **Bake from 3D** — if Dead Cells-style pipeline, normals come free from the 3D model.

**Rendering.** Scene rendered in two passes: *diffuse* (colour only) and *normals*. A shader combines them with light source positions.

**Phaser 3 support.** Normal-mapped sprites work via `Sprite.setPipeline('Light2D')` with a `Normal` texture loaded alongside the diffuse. Official support exists.

**WHS fit.** *Speculative but transformative.* The handcrafted haggis art could sing with normal-map lighting — glint of a lantern, glow of a fire, shadow of a passing cloud. Significant art-pipeline investment.

### 8.3 Light Sources

Types in 2D:
- **Point light** — radiates from a position, falls off with distance.
- **Spot light** — conical illumination.
- **Ambient light** — global illumination level.
- **Directional light** — parallel rays from a direction (sunlight).

**Interactions.**
- Multiple lights additively combine.
- Each light affects pixels within its radius (falloff).
- Shaders compute per-pixel contribution.

### 8.4 Volumetric Fog / Haar

Beyond a flat haar shader overlay, *volumetric* fog gives depth:

- Fog density varies spatially (3D noise).
- Distant objects fade further than near ones.
- Light rays can shine through ("god rays").

**Implementation.** A shader samples density at the pixel's world position, computes transmission via exponential falloff.

**Trade-off.** Volumetric computations are expensive. For pixel art, a cheaper "layers-of-fog-parallaxing" effect often reads as well.

**WHS fit.** Haar is a signature Scottish atmosphere element. Even faked volumetric fog (parallaxing layers) would distinguish the game visually.

### 8.5 Soft Shadows

Shadows in 2D are often simple drop-shadows (offset black sprite with alpha). Modern techniques go further:

**Blob shadows** — a soft blob beneath each entity indicating ground contact.

**Directional shadows** — shadows cast *away* from the light source. Requires knowing the light direction per entity.

**Soft shadows** — shadow edges blurred for realism. Multi-sample or gaussian blur.

**Penumbra shadows** — lighter/softer at the edges (two-part shadow).

**WHS fit.** Blob shadows under the haggis and enemies would add weight without adding complexity. Directional shadows when a specific light source dominates (e.g., Beltane bonfire).

### 8.6 Day/Night Cycle

A full day/night cycle adds massive atmospheric variation:

- **Gloaming** (Scottish twilight) — specifically long in Scotland. Summer evenings stretch for hours.
- **Simmer dim** (Shetland midsummer) — twilight through the whole night.
- **Dawn palette** — cold blues warming to pinks.
- **Noon palette** — warm, bright.
- **Dusk palette** — oranges, reds, purples.
- **Night palette** — cool blues, stars.

**Implementation.** Apply a post-process colour tint + ambient-light adjustment to the entire scene based on time-of-day parameter. Shader-based, cheap.

**WHS fit.** Could pair with real-world clock (at 8pm local, WHS gameplay is in dusk palette) OR narrative clock (certain biomes at certain "times"). The real-world angle has cosmetic charm; narrative angle is more controllable.

### 8.7 Weather Systems

**Rain** — falling vertical lines of low-alpha white, animated. Add puddle ripples on ground.

**Smirr** (fine drizzle — Scottish) — denser rain, less movement, grayer scene.

**Snow** — slow-falling white particles with horizontal drift. Accumulates visually (particle-trail on ground).

**Fog** — see haar shader (§6.7).

**Wind** — animates foliage, clouds, weather particles. Direction-driven.

**Thunder** — random screen-flash + low rumble SFX.

**Weather states as gameplay axes.** Rain might slow fire-damage; snow might slow movement. But tonally: *weather should feel*, not punish. Soul Charter principle.

**WHS fit.** Weather is a *major* Scottish signature — dreich weather is iconic. Rain, smirr, fog, snow all align with Scottish identity. Each biome has a default weather profile; occasionally weather events override.

### 8.8 Scottish Atmosphere Palette Rotations

Palette-shift shader (§6.3 Palette Swap) can drive per-biome atmosphere:

| Biome + Condition | Palette Direction |
|---|---|
| Moor, sunny | Warm gold accent, saturated heather |
| Moor, dreich | Desaturated, gray-green |
| Loch, dawn | Pink sky reflected in peat-dark water |
| Loch, night | Deep blues, silver moon-glint |
| Bog, twilight | Purple-green, mysterious |
| Cairngorm, whiteout | Near-monochrome, brilliant |
| Edinburgh Old Town, night | Amber gas-lamps, deep shadow |
| Cailleach-present | Cold blues, silver sparkle, less saturation |

A "mood palette" variable interpolates between these via shader uniform.

---

## Part 9 — Performance & Web-Specific Considerations

### 9.1 Web Performance Budget

For a browser-running 60 fps game:
- **Frame budget** — 16.67ms per frame. Overrun once = dropped frame, players notice.
- **JavaScript main thread** — realistic budget ~10-12ms/frame for game logic, leaves headroom.
- **GPU budget** — draw calls should be under ~200/frame for comfortable 60fps on mid-range hardware.
- **Memory budget** — browsers throttle tabs above 1-2 GB RAM.
- **Bundle size** — initial JS bundle < 2MB ideal for fast first-load.

### 9.2 Phaser 3 Performance Patterns

**Object pooling.** Create a pool of reusable GameObjects; `setActive(false)` / `setVisible(false)` rather than destroying. WHS already does this per CLAUDE.md (particle pools, 200-projectile cap).

**Sprite atlases.** Pack sprites into large textures. One draw call renders many sprites.

**Culling.** Don't render off-screen entities. Phaser culls camera-outside; enemies far from player should still skip updates.

**Fixed-step physics.** WHS uses fixedStep: true at 60fps — deterministic and replay-friendly. Correct choice.

**WebGL batching.** Phaser batches draw calls for identical texture+shader. Keep entities using the same sprite atlas.

**Avoid creating objects during update.** Garbage collection stalls. Pre-allocate; reuse.

### 9.3 WebGL Best Practices

- **Minimise state changes.** Changing textures, shaders, or blend modes breaks the batch.
- **Use texture atlases.** One atlas per biome; don't swap atlases mid-frame.
- **Avoid `readPixels`.** Slow GPU→CPU round-trip.
- **Use render textures judiciously.** Each render target is a GPU buffer allocation.
- **Check `context.isContextLost()` and handle `webglcontextlost` event.** Browsers can recycle contexts.

### 9.4 AudioContext Battery & Power

Running music continuously drains battery on laptops/mobile. Mitigations:
- **Suspend on tab hide** (`visibilitychange` event) — pauses music, saves power.
- **Lower sample rate** where acceptable (22050 Hz instead of 48000 Hz for SFX).
- **Don't run DSP unnecessarily** — turn off reverb when not needed.
- **Consolidate effect nodes** — one reverb for all music layers rather than per-layer.

### 9.5 Texture Memory Management

**Packed sprite sheets** (TexturePacker format, Aseprite JSON-array export) minimise draw calls.

**Mipmaps** — downsampled versions of textures for when rendered small. Usually not needed for pixel-art (integer scale only).

**Compressed textures** — browsers increasingly support ASTC, BC7 via WebGL extensions. For production, this matters; for development, skip.

### 9.6 Web Workers & Offloading

**Main thread hogged by** game logic, rendering, audio-scheduler callback. Large computations should go to Web Workers.

**Candidates for workers:**
- **Music generation** — the next 2 seconds of notes pre-computed in a worker.
- **Procgen** — biome generation, WFC solving.
- **Save serialisation** — large JSON encoding.
- **Analytics** — compressing/sending telemetry.

**Not candidates (runs on audio thread already):**
- Web Audio synthesis.
- AudioWorklet processors.

**Phaser + workers.** Phaser itself runs in main thread; offloading game-logic to workers is non-trivial. Music/procgen are cleaner candidates.

### 9.7 Initial Load & Asset Streaming

**First-load latency** matters for web games.
- Target: **under 5 seconds** to interactive from cold load.
- Compress assets (texture atlases, audio as OGG).
- Code-split: load splash+menu first, game assets on-demand.
- Preload game assets during splash.
- Cache via Service Worker for repeat visits.

**WHS fit.** Vite handles code-splitting well. The `SCS` locale being lazy-loaded is the right pattern (CLAUDE.md mentions 37 KiB savings).

### 9.8 Mobile Considerations

Browser games increasingly play on mobile. Unique considerations:
- **Touch input** — virtual joystick already noted in CLAUDE.md.
- **Screen ratios and safe areas** — existing WHS spec (mobile-safe-area).
- **Performance** — mobile CPUs/GPUs are 5-10× slower than desktop. Test shader performance.
- **Audio latency** — mobile Safari has higher latency than desktop.
- **Battery consumption** — constant GPU activity kills phones fast.

**Mitigations.** Quality-tier detection at startup: offer "battery mode" with reduced particles, fewer shaders, lower music layer count.

### 9.9 Telemetry for Performance Tuning

Ship with lightweight perf monitoring:
- FPS distribution over sessions.
- Main-thread jank frames per session.
- GPU memory usage over time.
- Audio xruns (scheduling misses).

Only with user consent. Data-driven optimisation beats guessing.

---

## Part 10 — The AI-Era Tooling Landscape (2024–2026)

### 10.1 Current State of AI in Game Dev

As of April 2026, AI tools are firmly in the indie game development workflow — but their *appropriate* use varies. This section catalogues what exists, what it's good at, and where WHS's masterpiece bar draws lines.

The fundamental distinction: **AI as drafting tool** (accelerates asset creation with human direction and curation) vs **AI as replacement** (generates final shippable assets without human craft). The former is an accelerator; the latter is almost always noticeable and cheap-feeling.

Masterpiece-bar guidance: **AI-assisted, never AI-finalised.** Every piece of audio, art, or text that ships should pass through human intention, curation, and polish.

### 10.2 AI Music Generation Tools

**Suno** — text-to-music. v5 (Sept 2025) is flagship. Generates full songs with vocals. Commercial API for integrations.

**Udio** — Suno competitor. Strong vocals.

**MusicLM / MusicFX (Google)** — research / internal. Not publicly API-available at scale.

**Magenta Studio (Google)** — Ableton plugins for harmonic/rhythmic variations. Offline tool for composers.

**Stable Audio (Stability AI)** — open-weights text-to-audio. Self-hostable.

**AIVA** — AI composer targeting orchestral/soundtrack markets.

**Endel** — generative music tool for functional audio (focus, sleep, relax). Available via SDK.

**SoundStorm (Google research)** — parallel decoder, fast audio synthesis.

**Ethical considerations:** training data provenance is contested. Suno has faced lawsuits from music labels (2024–).

**WHS appropriate use:**
- **Stem drafting.** Generate 30 candidate bagpipe-drone samples; curator selects 3; polish in DAW.
- **Demo sketching.** Quick mood test before commissioning a human composer.
- **Never for shipped music.** Custom Scottish folk composition (human-made, respectful of tradition) should be the shipped standard.

### 10.3 AI Sound Effect Generation

**ElevenLabs Voice + SFX** — AI voice; some SFX generation. Good for quick placeholder voices.

**Riffusion** — spectrogram diffusion. Can generate ambience and musical SFX.

**NVIDIA Audio2Face / Voice AI** — real-time voice processing. Useful for voice-over but not SFX.

**Bespoke neural SFX models** — emerging research. Generate a specific sound from text.

**WHS appropriate use:**
- **Rapid ambience drafting** — AI-generate a "Scottish moor wind" ambient bed, use as placeholder while commissioning recorded audio.
- **Voice TTS for accessibility** — if WHS ever adds TTS banter for vision-impaired players, modern TTS quality is excellent.
- **Final SFX: record or synth yourself.** Quality matters. The *clink* of a caber hit should be handmade.

### 10.4 AI Image Generation & Editing

**Midjourney, DALL-E, Stable Diffusion, Flux, Imagen** — flagship text-to-image.

**Aseprite Diffusion / PixelLab / Retro Diffusion** — pixel-art specialised models. Notably limited quality and inconsistency.

**AI upscaling** — ESRGAN, Real-ESRGAN, Remini. Can upscale low-res concept art; poor at preserving pixel-art discipline.

**AI style transfer** — apply one image's style to another's structure.

**WHS appropriate use:**
- **Concept art / mood boards.** AI-generate 100 versions of "Scottish stone circle at dawn"; pick inspiration, hand-draw final.
- **Never for shipped pixel art.** Pixel art is a handcrafted medium. AI-generated pixel art is instantly recognisable and cheapens the game.
- **Tartan pattern exploration.** AI could suggest colour combinations, but procedural tartan generation (§7.4) is already superior.
- **Never for portraits of real people.** Legal risk.

### 10.5 AI Procedural Generation

**ML-driven level layout** — research-stage; GANs / diffusion models trained on level examples.

**Neural WFC variants** — combining WFC with learned tile-compatibility.

**Behaviour tree / NPC AI generation** — LLMs generating NPC dialogue and reactions. Used for games like *Nvidia ACE*-demos.

**WHS appropriate use:**
- **Quest / banter brainstorming.** LLM drafts 30 banter lines in a specific voice; human edits down to 8 polished ones. Already a viable workflow.
- **Not for core gameplay.** Procedural generation should be designed, not learned.

### 10.6 AI Code & Shader Assistance

**GitHub Copilot, Cursor, Claude Code** — code-generation for game dev. Especially useful for shader boilerplate, gameplay code, refactoring.

**ShaderGPT-like tools** — natural language to GLSL.

**WHS appropriate use:**
- **Scaffold shaders.** LLM drafts a palette-swap shader, human refines for correctness.
- **Write game logic boilerplate.** Enemy configs, passive systems scaffolding.
- **Review and debug.** Explain complex code, suggest optimisations.
- **Not for architecture decisions.** Those require human design taste.

### 10.7 AI Voice Synthesis

**ElevenLabs** — state-of-the-art voice clone. Can produce believable voices from short samples.

**Tortoise TTS, OpenVoice** — open-source TTS.

**Replica Studios** — game-industry-focused voice AI.

**Considerations:**
- **Ethical:** cloning a voice without consent is unacceptable. Licensing a Scottish voice actor's samples for TTS is possible but requires explicit contract.
- **Quality:** modern TTS is near-human. Most players cannot distinguish without prompting.
- **Emotion:** subtle but improving.

**WHS consideration.** A *limited* voice-over pass (Gran's lines, maybe Cailleach) using a licensed Scottish voice actor could be either hand-recorded or TTS-synthesised. Current VOICE_CARD speaks Hearth-Still-Game and Limmy-Edge — finding voice actors embodying these *could* be a late-game polish investment if banter pool grows large.

### 10.8 AI Translation & Localisation

**DeepL, Google Translate** — reasonable quality.

**Specialised game LOC** — translations with context awareness.

**WHS consideration.** English ↔ Scots translations are delicate. Scots is a living language with authentic speakers; AI translation is *unreliable* for preserving cultural nuance. The bilingual support should use human Scots speakers for authenticity.

### 10.9 AI Playtesting & Balancing

**Synthetic playtester agents** that play the game at scale to find exploits, imbalances, and fun dips.

**Reinforcement learning** to tune difficulty curves.

**Statistical analysis** of run data to surface anomalies.

**WHS appropriate use:**
- **Scale testing.** An AI agent plays 10,000 runs to detect enemy OP-ness or weapon underuse. Feasible with existing daily challenge infrastructure.
- **Human playtesters remain essential** for *fun* judgements.

### 10.10 Ethics & Craft Stance for WHS

A recommended policy:

**Accept AI as:**
- A drafting partner for mood boards, reference art, placeholder audio.
- A research accelerator (this very doc is an example).
- A code-assistance tool.
- A brainstorming partner for narrative and content.

**Reject AI as:**
- The final author of any shipped asset.
- A replacement for hand-crafted pixel art.
- A substitute for Scottish cultural authenticity in voice/text.
- A shortcut that bypasses Soul Charter's "handcrafted with care."

**Disclose:**
- If AI-generated assets ship, disclose this in credits. Players can forgive AI assistance; they can't forgive concealment.

**WHS's Soul Charter demands the handcrafted.** AI can accelerate the path to masterpiece, but the masterpiece itself must bear human fingerprints.

---

## Part 11 — WHS Technical Opportunities

Concrete engineering upgrades mapped to WHS's Phaser 3 + Web Audio codebase, prioritised by effort-to-impact ratio and Soul Charter alignment.

Legend (same as feel doc):
- **Effort:** ● (hour), ●● (day), ●●● (week), ●●●● (month), ●●●●● (multi-month)
- **Impact:** ★ (minor), ★★ (noticeable), ★★★ (significant), ★★★★ (transformative)

### 11.1 Music Engine Upgrades

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| MU1 | **Document + tune scheduler parameters** — verify lookahead=25ms / scheduleAhead=100ms canonical values | §1.2 | ● | ★★ |
| MU2 | **Explicit musical state machine** — replace implicit Conductor with typed states & transitions | §3.6 | ●●● | ★★★ |
| MU3 | **Beat-aligned evolution triggers** — evolutions fire on next downbeat | §1.6, §3.8 | ●● | ★★★ |
| MU4 | **Add bodhrán (frame drum) layer** — new percussion layer for low-HP pressure | §3.1, §4.3 | ●●● | ★★★ |
| MU5 | **Add fiddle lead layer** — triggers on combo > 50 | §3.1 | ●●● | ★★★ |
| MU6 | **Pibroch-style pre-boss swell** — 10s build-up before boss warning | §7.2, §3.4 | ●●●● | ★★★★ |
| MU7 | **Per-biome scale (Dorian/Mixolydian/etc.)** — Conductor chooses scale per biome | §2.2 | ●●● | ★★★ |
| MU8 | **Markov melodic generator** — train on Scottish folk corpus, generate in-style leads | §2.4 | ●●●● | ★★★ |
| MU9 | **Per-biome convolution reverb** — Scottish impulse responses loaded per-biome | §4.5 | ●●●● | ★★★★ |
| MU10 | **Humanisation pass** — ±8ms timing, ±10% velocity jitter | §3.7 | ●● | ★★ |
| MU11 | **Dynamic Euclidean rhythm expansion** — intensity shifts E(k,n) ratios | §2.3 | ●● | ★★ |
| MU12 | **Horizontal re-sequencing for act transitions** — actual cue swaps, not fades | §3.2 | ●●● | ★★★ |
| MU13 | **Transition cues** — composed 2-8 bar bridges between major states | §3.4 | ●●●● | ★★★ |
| MU14 | **Parameter↔effect mapping spec** — document how each mood axis shapes output | §3.3 | ●● | ★★ |
| MU15 | **LUFS loudness audit** — set integrated loudness to -14 LUFS | §1.9 | ●● | ★★ |
| MU16 | **Physical-model bagpipe drone** (Karplus-Strong) in AudioWorklet | §1.5, §4.1 | ●●●●● | ★★★★ |

### 11.2 Audio SFX Upgrades

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| AU1 | **Three-layer SFX for top 20 impact sounds** — boss hits, crits, evolution, etc. | §4.6 | ●●●● | ★★★★ |
| AU2 | **Pitch variance ±3 semitones on frequent SFX** | §4.2 (feel doc) | ●● | ★★★ |
| AU3 | **15 named musical stingers** per §3.5 table | §3.5 | ●●●● | ★★★★ |
| AU4 | **Per-biome ambience beds** — wind, water, birds, etc. | §4.10 (feel doc) | ●●● | ★★★ |
| AU5 | **Per-boss unique drone layer** | §7.4 (feel doc) | ●●● | ★★★★ |
| AU6 | **Stereo panning for enemy SFX** — spatial awareness | §4.8 | ●● | ★★ |
| AU7 | **Visibility-aware audio suspend** — pause music on tab hide | §9.4 | ● | ★ |
| AU8 | **SFX pool audit** — verify AudioBuffer reuse, pre-warm on load | §1.7 | ●● | ★ |

### 11.3 Pixel Art & Animation Upgrades

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| PA1 | **Document global master palette** — 32–64 named colours, enforce via linting | §5.7 | ●● | ★★★ |
| PA2 | **Procedural transform layer** — squash, stretch, smear for all entities | §5.5 | ●●● | ★★★★ |
| PA3 | **Tagged animation hold-time variance** — non-uniform timing per frame | §5.8 | ●● | ★★ |
| PA4 | **Blue noise dither for lighting/fog overlays** | §5.7 | ●● | ★★★ |
| PA5 | **Ambient event system** — bird, fish, falling leaf, shooting star, etc. | §7.8 | ●●● | ★★★★ |
| PA6 | **Heather field with per-sprig wind offset** — procedural motion | §7.5 | ●●● | ★★★ |
| PA7 | **Midge swarm as boids algorithm** — flocking behaviour | §7.7 | ●●● | ★★★ |
| PA8 | **Weather particle systems** — rain, smirr, snow | §8.7 | ●●● | ★★★ |
| PA9 | **Evaluate Dead Cells 3D-to-2D pipeline** for next character expansion | §5.3 | ●●●●● | ★★★ |
| PA10 | **Expand procedural tartan system** — clan-tartan variant unlocks | §7.4 | ●●● | ★★★ |

### 11.4 Shader Pipeline Upgrades

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| SH1 | **ShaderRegistry module** — centralise custom pipeline registration | §6.1 | ●● | ★★ |
| SH2 | **Palette swap shader** for variant haggis + Cailleach-touched biomes | §6.3 | ●●● | ★★★★ |
| SH3 | **Outline shader** for elites (gold), hazards (red), low-HP edges | §6.4 | ●● | ★★★ |
| SH4 | **Dissolve shader** for enemy deaths, evolution transforms | §6.5 | ●● | ★★ |
| SH5 | **Heat-shimmer shader** near fire hazards, Cailleach aura | §6.6 | ●● | ★★★ |
| SH6 | **Haar fog shader** as biome transition + ambient effect — **signature WHS** | §6.7 | ●●● | ★★★★ |
| SH7 | **Chromatic aberration** on crits + hit-taken + phase transitions | §6.9 | ●● | ★★ |
| SH8 | **Selective bloom** on evolution pickups, fire, boss telegraphs | §6.10 | ●● | ★★★ |
| SH9 | **Day/night cycle shader** — tint + ambient light adjustment | §8.6 | ●●● | ★★★★ |
| SH10 | **Per-biome atmosphere palette rotations** | §8.8 | ●●● | ★★★ |
| SH11 | **Normal-mapped sprites** for key characters (speculative — art pipeline investment) | §8.2 | ●●●●● | ★★★★ |
| SH12 | **Volumetric haar (parallaxing layers)** | §8.4 | ●●● | ★★★ |

### 11.5 Procedural Content Upgrades

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| PR1 | **Noise-driven biome decoration** — heather clumps, rocks, thistle patches | §7.1 | ●● | ★★★ |
| PR2 | **Evaluate WFC for future tight-space biomes** (Edinburgh closes, shipyard) | §7.3 | ●●●● | ★★★ |
| PR3 | **Procedural tartan unlock system** — new clan patterns unlocked via meta | §7.4 | ●●● | ★★★ |
| PR4 | **Water ripple shader** for Loch biome | §7.6 | ●● | ★★★ |

### 11.6 Performance & Polish Infrastructure

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| PF1 | **Quality-tier detection on startup** — offer battery/high-quality modes | §9.8 | ●● | ★★★ |
| PF2 | **Music generation in Web Worker** — precompute 2s ahead off-main-thread | §9.6 | ●●●● | ★★★ |
| PF3 | **Perf telemetry** — FPS distribution, audio xruns (consent-gated) | §9.9 | ●●● | ★★ |
| PF4 | **Shader perf profiling on low-end devices** | §6.13, §9.8 | ●● | ★★ |
| PF5 | **WebGL context-lost handling** | §9.3 | ●● | ★ |
| PF6 | **Service Worker caching** for fast repeat-load | §9.7 | ●● | ★★ |
| PF7 | **Asset compression audit** — OGG for audio, TexturePacker atlases | §9.5 | ●● | ★★ |

### 11.7 AI-Era Tooling Adoption

| # | Opportunity | Ref | Effort | Impact |
|---|---|---|---|---|
| AI1 | **LLM-assisted banter drafting workflow** — human always curator | §10.5 | ● | ★★★ |
| AI2 | **AI concept art generation** for new biome moodboards | §10.4 | ● | ★★ |
| AI3 | **Scaled AI playtesting** — synthetic agents run 1000s of daily challenges | §10.9 | ●●●● | ★★★ |
| AI4 | **Disclosure policy** — decide which AI uses ship with acknowledgment | §10.10 | ● | ★ |
| AI5 | **Stem drafting via Suno / Stable Audio** — never shipped raw | §10.2 | ● | ★★ |
| AI6 | **Live TTS for accessibility** — optional Scottish-voiced narrator | §10.7 | ●●●● | ★★★ |

### 11.8 Priority Phases

Suggested sequencing:

**Phase A — Music Engine Deepening (2 sprints):**
MU1, MU2, MU3, MU7, MU10, MU14 + AU1 top 5 + AU3 top 5 stingers

**Phase B — Signature Shaders (2 sprints):**
SH1, SH2, SH6 (haar), SH3, SH8, SH9 + PA1 (master palette)

**Phase C — Atmosphere & Ambience (2 sprints):**
MU4, MU5, MU9 (convolution reverb), AU4 (per-biome ambience), AU5 (per-boss drone), PA5 (ambient events), PA6 (heather field), PA8 (weather)

**Phase D — Content Multipliers (3 sprints):**
PR1 (noise decoration), PR3 (tartan unlocks), PA7 (boids midges), PA2 (procedural transforms)

**Phase E — Platform Maturity (ongoing):**
Performance tiers (PF1), telemetry (PF3), Service Worker (PF6), WebGL resilience (PF5), load-time polish (PF7).

**Phase F — Speculative / Masterpiece Layer (future):**
SH11 (normal maps), MU16 (physical-model bagpipes), MU13 (composed transitions), PR2 (WFC biomes), AI6 (TTS).

### 11.9 Cross-Reference to Other Docs

| WHS system | This doc | Game feel doc | Roguelite doc | Scottish doc |
|---|---|---|---|---|
| Music engine | §1, §2, §3, §11.1 | §4, §7.2–7.4 | §B5 (polish juice) | §4.3 (music forms) |
| Shaders / VFX | §6, §11.4 | §5, §3.8–3.9 | §B5 | §2.9 (atmosphere) |
| Procedural content | §7, §11.5 | §5.9 | §14 (procgen) | §2 (regions), §5.5 (biome ideas) |
| Audio SFX | §4, §11.2 | §4 | — | §4.2 (drink), §4.3 (pipes) |
| AI tooling | §10, §11.7 | — | — | — |

Read across for fuller context on any single system.

### 11.10 The Single-Highest-ROI Upgrade

If we had to pick **one** opportunity in this doc to prioritise, my pick: **SH6 — Haar fog shader as biome transition + ambient effect.**

Rationale:
- Scottish-specific (Soul Charter alignment — a uniquely-us visual).
- Technically reasonable effort (●●●, ~1 week).
- Transformative impact — players will *see* haar every run, creating signature visual memory.
- Opens a category — once haar is done, smirr, snow, volumetric fog all follow the same pipeline.
- Unifies with Scottish research (Part 4.9 atmosphere notes, Scottish research §2.9 haar).
- Directly enhances game-feel doc's §7.5 haar roll-in moments.

The runners-up: **MU6 (pibroch boss build-up)**, **AU3 (15 named stingers)**, and **SH2 (palette swap for variants)** — each compounds across many moments.

---

## Sources & Further Reading

### Web Audio & Music Architecture

- [A Tale of Two Clocks — Chris Wilson (web.dev)](https://web.dev/articles/audio-scheduling) — canonical scheduler article.
- [Web Audio API Best Practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Advanced Techniques: Creating and Sequencing Audio — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Web Audio API 1.1 spec — W3C](https://www.w3.org/TR/webaudio-1.1/)
- [Web Audio Timing Tutorial — Catarak](https://catarak.github.io/blog/2014/12/02/web-audio-timing-tutorial/)
- [Timing and Scheduling — IRCAM ISMM](https://ircam-ismm.github.io/webaudio-tutorials/scheduling/timing-and-scheduling.html)
- [Tone.js — the library + docs](https://tonejs.github.io/)
- [Tonal.js — music theory toolkit](https://github.com/tonaljs/tonal)
- [Making Procedural Music in JavaScript — YouTube](https://www.youtube.com/watch?v=tZN5Vzs_82A)
- [Generative music with Tone.js + Tonal.js — GitHub](https://github.com/devnowcommit/generative-music-with-tonejs)
- [An amateur quest to generative music — Ashish Dubey](https://ashishdubey.xyz/generative-music)

### Adaptive & Generative Music

- [Vertical Layering vs Horizontal Resequencing — The Game Audio Co.](https://www.thegameaudioco.com/making-your-game-s-music-more-dynamic-vertical-layering-vs-horizontal-resequencing)
- [Adaptive music — Wikipedia](https://en.wikipedia.org/wiki/Adaptive_music)
- [Adaptive Music Techniques in Video Games — Olly Bradbury](https://ollybradbury.wordpress.com/2021/10/19/adaptive-music-techniques-in-video-game-music/)
- [5 Legendary Adaptive Music Games — Mojo Kid](https://mojokid.com/adaptive_game_music/)
- [Scoring for Games — Berklee](https://online.berklee.edu/takenote/scoring-for-games-top-techniques-for-composing-music-for-interactive-media/)
- [FMOD Studio](https://www.fmod.com/)
- [Audiokinetic Wwise](https://www.audiokinetic.com/en/wwise/overview/)
- [Wwise or FMOD? — The Game Audio Co.](https://www.thegameaudioco.com/wwise-or-fmod-a-guide-to-choosing-the-right-audio-tool-for-every-game-developer)

### Synthesis & Sound Design

- [FM Synthesis origin — John Chowning papers, Stanford](https://ccrma.stanford.edu/) (search CCRMA).
- [Karplus-Strong string synthesis — Wikipedia](https://en.wikipedia.org/wiki/Karplus%E2%80%93Strong_string_synthesis)
- [OpenAIR — impulse response library](https://www.openair.hull.ac.uk/)
- [AudioWorklet — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)

### Pixel Art & Animation Pipelines

- [Art Design Deep Dive: Using a 3D pipeline for 2D animation in Dead Cells — Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)
- [Dead Cells: A 3D Pipeline For 2D Animation — Game Anim](https://www.gameanim.com/2018/01/31/dead-cells-3d-pipeline-2d-animation/)
- [Case Study: Dead Cells' Character Art Pipeline — 80.lv](https://80.lv/articles/case-study-dead-cells-character-art-pipeline)
- [Shaders Case Study — Dead Cells' Character Art Pipeline — YouTube](https://www.youtube.com/watch?v=iNDRre6q98g)
- [Aseprite](https://www.aseprite.org/)
- [Pixel Art Design for Game Development — Alain Galvan](https://alain.xyz/blog/pixel-art-design-for-game-dev)
- [2D pixel art style guide for games — Sprite-AI](https://www.sprite-ai.art/blog/2d-pixel-art-style-guide)
- [Lospec Palette List](https://lospec.com/palette-list)
- [SpriteIlluminator — normal map editor](https://www.codeandweb.com/spriteilluminator)

### Shaders & WebGL

- [Phaser 3 FX & PostFXPipeline — Phaser Help](https://docs.phaser.io/phaser/concepts/fx)
- [Phaser 3 Examples — Custom Post FX Pipeline](https://phaser.io/examples/v3.85.0/renderer/view/custom-post-fx-pipeline)
- [Phaser 3 Rex Notes — Post FX Pipeline](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/postfx-pipeline/)
- [Palette Swapping With Shaders — pvigier](https://pvigier.github.io/2019/10/06/palette-swapping-with-shaders.html)
- [Shaders Case Study — Pixel Art Palette Swapping — YouTube](https://www.youtube.com/watch?v=u4Iz5AJa31Q)
- [Emulating palette based graphics in WebGL — WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-qna-emulating-palette-based-graphics-in-webgl.html)
- [WebGL Shaders and GLSL — WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)
- [The Book of Shaders — Patricio Gonzalez Vivo](https://thebookofshaders.com/)
- [Shadertoy — community shader gallery](https://www.shadertoy.com/)

### Procedural Generation

- [Wave Function Collapse — Maxim Gumin (GitHub)](https://github.com/mxgmn/WaveFunctionCollapse)
- [Model synthesis — Wikipedia](https://en.wikipedia.org/wiki/Model_synthesis)
- [Wave Function Collapse — Excalibur.js blog](https://excaliburjs.com/blog/Wave%20Function%20Collapse/)
- [Procedural Generation with Wave Function Collapse and Model Synthesis — YouTube](https://www.youtube.com/watch?v=zIRTOgfsjl0)
- [Quantum Wave Function Collapse for PCG — arXiv](https://arxiv.org/abs/2312.13853)
- [simplex-noise npm package](https://github.com/jwagner/simplex-noise.js)

### 2D Lighting

- [How To Light Your 2D Game Using Normal Maps — GameMaker](https://gamemaker.io/en/blog/using-normal-maps-to-light-your-2d-game)
- [Normal map lighting for 2D Pixel Art sprites — Defold forum](https://forum.defold.com/t/normal-map-lighting-for-2d-pixel-art-sprites/70967)
- [Dynamic Lighting and Shadows In My 2D Game — Matt Greer](https://www.mattgreer.dev/blog/dynamic-lighting-and-shadows/)

### AI-Era Tools (2024-2026)

- [Suno — AI music generator](https://suno.com/)
- [Suno v5 launch coverage](https://musicgeneratorai.io/posts/suno-v5-ai-music)
- [AI Music in Gaming 2026 — Soundverse](https://www.soundverse.ai/blog/article/ai-music-in-gaming)
- [Magenta — Google](https://magenta.tensorflow.org/)
- [Stable Audio — Stability AI](https://stability.ai/stable-audio)
- [ElevenLabs](https://elevenlabs.io/)
- [Replica Studios](https://replicastudios.com/)

### Books & Canonical Talks

- Steve Swink, *Game Feel: A Game Designer's Guide to Virtual Sensation* (2008)
- Andy Farnell, *Designing Sound* (MIT Press, 2010) — procedural audio bible.
- Rob Hamilton et al. (eds), *The Oxford Handbook of Interactive Audio* (2014)
- Richard Stevens & Dave Raybould, *The Game Audio Tutorial* (2011)
- Ian Millington, *AI for Games* (3rd ed)
- Aaron A. Reed, *50 Years of Text Games* — narrative systems in games (adjacent to procedural).

### Phaser-Specific References

- `src/systems/music/` — WHS's current music engine (for internal reference).
- `src/systems/audioContext.ts` — shared audio context module.
- Phaser 3 CHANGELOG — keep abreast of pipeline changes.

### Cross-Reference WHS Internal Docs

- `docs/DESIGN_SOUL.md` — always the north-star filter.
- `docs/research/ROGUELITE_RESEARCH.md` — structural canon.
- `docs/research/SCOTTISH_RESEARCH.md` — cultural canon.
- `docs/research/GAME_FEEL_RESEARCH.md` — feel design canon.

---

## Changelog

- **2026-04-23** — Initial draft (Claude, at Michael's direction). 11 parts spanning music architecture, procedural & generative music, adaptive music patterns, synthesis & sound design, modern pixel art pipelines, shader art, procedural visual content, 2D lighting & atmosphere, web performance, the AI-era tooling landscape, and 100+ tagged WHS technical opportunities in Part 11 (music engine, audio SFX, pixel art & animation, shader pipeline, procedural content, performance, AI-era tooling) with effort/impact tagging across six priority phases (A–F). Fourth doc in the WHS research series. Technical depth calibrated to Phaser 3 + Web Audio stack.
