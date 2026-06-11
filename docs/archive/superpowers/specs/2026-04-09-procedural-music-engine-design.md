# The Invisible Band — Procedural Music Engine

> Design spec for Wild Haggis Survivors' dynamic, game-state-reactive music system.
> All audio synthesized at runtime via Web Audio API. Zero audio files.

---

## Foundational Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Synthesis library | **Raw Web Audio API** | The "felt piano" sound is achievable via FM synthesis. Tone.js adds 150KB for marginal gain. The project's identity is procedural everything. Game-loop integration is tighter without Tone.js's Transport fighting the frame tick. |
| System architecture | **Separate SFX + Music, shared AudioContext** | SFX and music are independent concerns with independent user toggles. A shared `audioContext.ts` module provides the AudioContext + a DynamicsCompressorNode output bus. No merge needed. |
| State passing | **Pull model with internal state diffing** | The Conductor is called every frame from `GameScene.update()` with a plain state snapshot. All mood parameters are derivable from continuous game state. Web Audio's parameter automation handles sub-frame smoothing. No events needed. |

---

## 1. Audio Stack

### Shared AudioContext (`src/systems/audioContext.ts`)

A module-level singleton providing:
- `getAudioContext()`: Lazily creates and returns the shared `AudioContext`
- `getOutputNode()`: Returns a `DynamicsCompressorNode` connected to `ctx.destination`

Both `AudioSystem` (SFX) and `ProceduralMusicEngine` connect to the shared output node instead of `ctx.destination` directly. The compressor prevents clipping when SFX + music + heartbeat fire simultaneously during chaotic boss fights.

`AudioSystem.ts` changes: replace `ensureContext()` internals to call `getAudioContext()` and connect `masterGain` to `getOutputNode()`. ~5 lines changed.

### Audio Graph Topology

```
[Highland Drone]
  sawOsc1 (110Hz) ────────┐
  sawOsc2 (110Hz+detune) ──┼─► droneGain ──► bandpassFilter ──────────┐
  lfoOsc → lfoGain ─────────┘   (tremolo on gain)                     │
                                                                       │
[Felt Piano — 4 voices, each:]                                         │
  modOsc (freq*2) → modGain (index env) → carrierOsc.frequency        │
  carrierOsc (freq) → voiceGain (amp env) ──► pianoMix ──► fogDelay ──┤
                                                             │         │
                                                        fogReturn ─────┤
                                                                       │
[Heartbeat]                                                            │
  kickOsc → kickGain ──────────────────────────────────────────────────┤
                                                                       │
[Rhythm]                                                               │
  hatOsc → hatFilter → hatGain ────────────────────────────────────────┤
                                                                       │
                                                                       ▼
                                                                 masterFilter
                                                                       │
                                                                       ▼
                                                                 masterGain
                                                                       │
                                                                       ▼
                                                              getOutputNode()
                                                          (shared compressor)
```

### Fog Delay (Filtered Feedback Delay)

Creates the "fog rolling over hills" effect. Piano notes echo, getting softer and darker with each repetition.

```
pianoMix ──► DelayNode (2s) ──► lowpassFilter (600Hz) ──► feedbackGain ──┐
                 ▲                                                        │
                 └────────────────────────────────────────────────────────┘
                 │
                 ▼
           fogOutput ──► masterFilter
```

- Delay time: 2.0s baseline, shortens to 1.0s at high intensity
- Filter cutoff: 600Hz (each echo loses brightness)
- Feedback gain: 0.35 baseline, adjustable by Conductor
- **Safety clamp: feedback gain hard-capped at 0.65** to prevent self-oscillation regardless of Conductor output

---

## 2. Instrument Layers

### Layer 1: Highland Drone

**Synthesis:** Two slightly detuned sawtooth oscillators through a bandpass filter with LFO tremolo. The detuning creates organic "beating" that sounds like distant bagpipe breath.

**Conductor control:**
- `intensity` → bandpass filter opens (300Hz → 1200Hz), volume increases
- `danger` → detuning widens (1Hz → 8Hz = dissonant), pitch drops 5-10Hz
- `triumph` → filter brightens further

**Node count:** 3 oscillators + 1 filter + 2 gain nodes (continuous, always active)

### Layer 2: Felt Piano (FM Synthesis)

**Synthesis:** Each voice is an FM pair — a sine carrier modulated by a sine at 2:1 frequency ratio. The modulation index envelope creates the "felt piano" character:
- Attack: modulation index ~0.8 (bright percussive strike), decaying to ~0.1 over 50ms (warm muted sustain)
- Carrier amplitude: 5ms attack, 200ms decay, 30% sustain, 1-2s release
- Low-pass filter at ~2kHz on voice output rolls off harshness

**Polyphony:** Maximum 4 simultaneous voices. Voice stealing: when all 4 are active, steal the voice with the lowest current amplitude (most decayed = least audible theft).

**Node count per voice:** 2 oscillators + 2 gain nodes (modulator gain, voice gain). Transient — auto-stop after envelope completes. Peak: 8 oscillators + 8 gain nodes.

### Layer 3: Heartbeat Pulse

**Synthesis:** "Lub-dub" double sine kick. Two quick hits 50ms apart, second hit 70% volume of first. Frequency sweep 60Hz → 30Hz over 100ms per hit.

**Tempo:** Fixed 72 BPM, intentionally NOT synced to the music's tempo. The polyrhythmic drift against the melody creates tension — a known film-scoring technique.

**Conductor control:** Volume controlled entirely by `chaos` parameter:
- chaos < 0.3 → silent
- chaos 0.3-0.7 → fading in
- chaos > 0.7 → clearly audible, never dominant

**Node count:** 1 oscillator + 1 gain per hit, ~1.2 hits/sec. Transient, negligible.

### Layer 4: Rhythm (Euclidean Patterns)

**Synthesis:** Hi-hat = high-frequency square wave through highpass filter. Kick = sine sweep 150Hz → 40Hz.

**Pattern generation:** Euclidean rhythm algorithm — distributes N hits across M slots as evenly as possible. Intensity controls N:
- Low intensity: 2-in-8 (sparse pulse)
- Medium: 3-in-8 (tresillo feel), 5-in-8 (bossa nova clave)
- High: 7-in-8 (nearly continuous)

**Swing:** Even-numbered hits delayed by `swingAmount * beatDuration` (swingAmount 0.0-0.15 based on mood). Creates human feel.

**Conductor control:**
- `intensity` → Euclidean density increases, kick volume rises
- `danger` → pattern simplifies to 1-2 in 8 (minimal, stark)
- `triumph` → pattern fills out, swing increases (groove)

---

## 3. The Conductor

### Game State Snapshot

```typescript
interface GameMusicState {
  hp: number;
  maxHp: number;
  gameTimeSec: number;
  enemyCount: number;
  comboCount: number;       // from JuiceSystem.getComboCount() — needs getter added
  bossActive: boolean;      // from SpawnSystem — tracked internally, not per-frame iteration
}
```

**Integration changes required:**
- `JuiceSystem`: Add `getComboCount(): number` getter (1 line)
- `SpawnSystem`: Add `isBossActive(): boolean` that returns a cached boolean, set true on boss spawn, set false when boss enemy dies. Avoids iterating 400 enemies per frame.

### Mood Parameters

Four independent axes, each computed per frame with asymmetric smoothing:

**Intensity** (0.0-1.0) — "How far into the run"
```
target = clamp(gameTimeSec / 1200, 0, 1) * 0.7
       + clamp(enemyCount / 250, 0, 1) * 0.3
intensity = lerp(current, target, delta * 0.001)  // ~5s transition
```

**Danger** (0.0-1.0) — "About to die"
```
hpFrac = hp / maxHp
if hpFrac < 0.3:
    dangerTarget = (0.3 - hpFrac) / 0.3
    danger = lerp(current, dangerTarget, delta * 0.003)  // ~1.5s ramp UP (fast alert)
else:
    danger = lerp(current, 0, delta * 0.0008)            // ~6s ramp DOWN (slow relief)
```

**Chaos** (0.0-1.0) — "Screen is swarming"
```
densityRatio = clamp(enemyCount / 300, 0, 1)
comboRatio = clamp(comboCount / 20, 0, 1)
chaosTarget = densityRatio * 0.6 + comboRatio * 0.4
chaos = lerp(current, chaosTarget, delta * 0.002)  // ~2.5s both directions
```

**Triumph** (0.0-1.0) — "Dominating"
```
// Tracks kills in last 8 seconds internally (stores killCount snapshots)
recentKillRate = (currentKillCount - killCount8SecondsAgo) / 8
if comboCount > 8 AND hpFrac > 0.5:
    triumphTarget = clamp((recentKillRate - 3) / 10, 0, 1)  // >3 kills/sec starts ramping
else:
    triumphTarget = 0
triumph = lerp(current, triumphTarget, delta * 0.002)
triumph *= (1 - danger)  // danger suppresses triumph
```

The triumph fix from the critique: uses both combo (> 8, lowered from 15) AND kill rate (> 3 kills/sec). This triggers reliably with AoE weapons in mid-game density.

### Mood → Layer Parameter Mapping

All parameter changes to Web Audio nodes use `linearRampToValueAtTime(target, ctx.currentTime + transitionSec)` for click-free transitions.

| Parameter | Drone | Piano | Heartbeat | Rhythm | Fog Delay |
|---|---|---|---|---|---|
| **Intensity ↑** | Bandpass 300→1200Hz, vol +20% | Note interval 3s→0.8s, velocity +40% | — | Euclidean N: 2→7 | Delay time 2s→1s |
| **Danger ↑** | Detune 1→8Hz, pitch -10Hz | Scale → Aeolian, sparser, lower register | — | Pattern → 1-2 in 8 | Feedback 0.35→0.55 |
| **Chaos ↑** | Vol +15% | — | Vol 0→0.8 | Kick vol +30% | Feedback 0.35→0.25 |
| **Triumph ↑** | Filter bright +500Hz | Scale → Mixolydian, higher register, leaps | Vol fades | Swing +, fills | Delay mix + |

---

## 4. Melody Generation

### Scale System

Four scales rooted on A, each mood-associated:

| Scale | Notes | Mood | Character |
|---|---|---|---|
| A Dorian | A B C D E F# G | Baseline | Celtic, wistful — the "Scottish Highlands" sound |
| A Aeolian | A B C D E F G | Danger | Bleak — drops F# to F, removes bittersweet quality |
| A Mixolydian | A B C# D E F# G | Triumph | Bright folk-dance feel — raises C to C# |
| A Pentatonic | A C D E G | Chaos fallback | Primal, fewer choices, works with fast patterns |

Two octaves (A3-G4 and A4-G5) = 14 pitches available.

**Scale blending:** The active scale is stored as a 7-element frequency array. When danger > 0, the 6th degree (index 5) blends between F# (Dorian) and F (Aeolian) probabilistically: `use_aeolian_6th = random() < danger`. Same for triumph on the 3rd degree (C vs C#). Notes that don't differ between scales are unaffected. This means the scale *drifts* between moods — no hard switches.

**Register bias:** `registerBias = -danger * 0.3 + triumph * 0.3`. Negative = prefer lower octave (danger), positive = prefer higher (triumph). Applied as a probability weight when selecting octave.

### Constrained Walk Algorithm with Phrase Contours

**Phase 1 — Choose phrase contour** (before each 3-7 note phrase):
- `ascending` (30%): direction bias strongly upward
- `descending` (25%): direction bias strongly downward
- `arch` (25%): first half up, second half down
- `valley` (20%): first half down, second half up

The contour sets a per-note direction bias that the walk consults.

**Phase 2 — Generate notes within the phrase:**

```
1. Start on tonic (A) or fifth (E) — 40% each, 20% random
2. For each note:
   a. Consult contour for direction bias (e.g., arch at note 3/5 = downward)
   b. Roll interval:
      - 50%: step (1 scale degree)
      - 25%: skip (2 degrees)
      - 15%: leap (3-4 degrees)
      - 10%: return to tonic/fifth ("landing")
   c. Apply mood modifiers:
      - Danger: +20% downward, +10% landing chance
      - Triumph: +15% upward, +10% leap chance
   d. Clamp to scale range (wrap octave if exceeded)
3. Compute velocity:
   - Base: 0.12 + intensity * 0.06
   - Danger: * 0.6 (quieter)
   - Triumph: * 1.3 (bolder)
   - Random jitter: +/- 15%
4. Compute time until next note:
   - Base interval: 3.0 - intensity * 2.2 (3.0s calm → 0.8s intense)
   - Danger: * 1.4 (longer gaps = sparse tension)
   - Gaussian jitter: +/- 20%
5. After phrase ends (3-7 notes), insert phrase rest:
   - Rest = noteInterval * 2.5
   - 40% chance to resolve to tonic on re-entry
```

### Resolution Tension

Scale degrees have stability weights:
- Tonic (A), fifth (E): stable — the walk gravitates toward these for phrase endings
- Third (C/C#), fourth (D): moderately stable
- Second (B), sixth (F/F#), seventh (G): unstable — the walk prefers to step away from these

The landing probability (10% per note) always targets stable degrees. Phrase-final notes have a 60% chance of being forced to a stable degree. This creates natural tension-resolution cadences without a full harmony system.

---

## 5. Scheduling: Lookahead Pattern

Replaces all `setTimeout`/`setInterval` with the Web Audio spec's recommended approach.

### How It Works

A single scheduler ticked from `ProceduralMusicEngine.update()` (called every frame at ~60fps). It looks 100ms ahead and schedules any notes that fall within that window using `audioContext.currentTime`:

```
scheduleAheadTime = 0.1  // 100ms lookahead

tick(ctx):
    while nextMelodyTime < ctx.currentTime + scheduleAheadTime:
        scheduleMelodyNote(nextMelodyTime)
        advanceMelodyTime()  // walk algorithm sets next time

    while nextRhythmTime < ctx.currentTime + scheduleAheadTime:
        scheduleRhythmHit(nextRhythmTime)
        advanceRhythmTime()  // Euclidean pattern sets next time

    while nextHeartbeatTime < ctx.currentTime + scheduleAheadTime:
        scheduleHeartbeat(nextHeartbeatTime)
        advanceHeartbeatTime()  // fixed 72 BPM
```

Each `schedule*` call creates short-lived oscillators with `.start(time)` and `.stop(time + duration)`. The audio thread plays them at sample-accurate times regardless of JavaScript thread jitter.

### Why This Works

- Notes are timed by `ctx.currentTime` (audio clock) — zero drift
- Tab backgrounding only affects the JavaScript poll, not the pre-scheduled audio
- Even a 50ms frame spike leaves 50ms of pre-scheduled buffer
- One unified mechanism for all layers — no `setInterval`/`setTimeout` anywhere

---

## 6. Public API and Lifecycle

### ProceduralMusicEngine API

```typescript
class ProceduralMusicEngine {
    start(): void           // Build audio graph, start drone, begin scheduling
    stop(): void            // Hard stop (used on scene transition to menu)
    fadeOut(ms: number): void  // Graceful fade — used on death (2000ms) and victory
    update(delta: number, state: GameMusicState): void  // Called from GameScene.update()
    setEnabled(on: boolean): void  // Mute toggle from settings

    // Victory-specific: play a final resolving phrase then fade
    playResolution(): void
}

export const musicEngine: ProceduralMusicEngine;
```

### Lifecycle Integration

| Game event | Current code | New code |
|---|---|---|
| Game start | `music.start()` | `musicEngine.start()` |
| Per frame | `music.update(gameTimeSec)` | `musicEngine.update(delta, stateSnapshot)` |
| Player death | `music.stop()` | `musicEngine.fadeOut(2000)` |
| Victory | `music.stop()` | `musicEngine.playResolution()` |
| Quit to menu | `music.stop()` | `musicEngine.stop()` |
| Settings toggle | `music.start()/stop()` | `musicEngine.setEnabled(on)` |

### playResolution() Behavior

When the Taxman is killed and victory triggers:
1. The Conductor locks triumph to 1.0 and danger/chaos to 0.0
2. The walk algorithm forces a descending phrase landing on the tonic (A)
3. The drone detuning narrows to 0 (pure unison = consonant resolution)
4. After the final tonic note, `fadeOut(3000)` is called automatically
5. Total duration: ~4-5 seconds of resolving music, then a 3-second fade to silence

### Scope Exclusions

- **Menu and Shop scenes remain silent.** The procedural engine is a gameplay system. Ambient menu music is a separate future concern.
- **SFX are unchanged.** AudioSystem keeps its existing methods. Only the AudioContext source changes.

---

## 7. File Structure

```
src/systems/
    audioContext.ts                  — Shared AudioContext + compressor output (~20 lines)
    AudioSystem.ts                  — SFX (existing, ~5 lines changed)
    music/
        ProceduralMusicEngine.ts    — Public API, audio graph, fog delay, lifecycle (~120 lines)
        Conductor.ts                — Mood math, walk algorithm, scale system (~180 lines)
        NoteScheduler.ts            — Lookahead scheduling loop (~70 lines)
        DroneLayer.ts               — Dual-saw drone with bandpass + LFO (~80 lines)
        PianoLayer.ts               — FM voice + 4-voice polyphony manager (~130 lines)
        PercussionLayer.ts          — Heartbeat + Euclidean rhythm (~110 lines)
```

Total: ~710 lines across 7 new files + ~25 lines changed in existing files.

The `music/` subdirectory follows the same grouping pattern as `src/data/` and `src/ui/`.

---

## 8. Performance Budget

| Component | Continuous nodes | Peak transient nodes |
|---|---|---|
| Drone | 3 osc + 1 filter + 2 gain = 6 | — |
| Piano | — | 4 voices * (2 osc + 2 gain) = 16 |
| Heartbeat | — | 1 osc + 1 gain = 2 |
| Rhythm | — | ~2 osc + 2 gain + 1 filter = 5 |
| Fog Delay | 1 delay + 1 filter + 1 gain = 3 | — |
| Master chain | 1 filter + 1 gain = 2 | — |
| **Total** | **11** | **~23** |

Peak total: ~34 active nodes. Web Audio handles hundreds. Mobile Safari handles 50+ comfortably. Well within budget.

Conductor per-frame cost: 4 lerps + ~10 comparisons + 1 kill-rate snapshot. ~0.01ms. Negligible.

---

## 9. Required Changes to Existing Code

| File | Change | Lines affected |
|---|---|---|
| `src/systems/AudioSystem.ts` | Use shared context from `audioContext.ts` | ~5 |
| `src/systems/JuiceSystem.ts` | Add `getComboCount(): number` getter | 1 |
| `src/systems/SpawnSystem.ts` | Add `isBossActive(): boolean` with cached tracking | ~8 |
| `src/scenes/GameScene.ts` | Replace `music` import with `musicEngine`, update call signature | ~15 |
| `src/scenes/MenuScene.ts` | Replace `music` import | ~3 |
| `src/systems/MusicSystem.ts` | **DELETE** — fully replaced | -347 |

Net: ~680 new lines, ~315 removed, ~32 changed = ~400 net new lines.
