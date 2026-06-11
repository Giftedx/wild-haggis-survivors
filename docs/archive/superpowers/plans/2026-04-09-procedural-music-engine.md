# Procedural Music Engine Implementation Plan

> **STATUS: ✅ SHIPPED** — engine lives at `src/systems/music/` (DroneLayer, PianoLayer, PercussionLayer, NoteScheduler, Conductor, ProceduralMusicEngine + tests). Shared AudioContext at `src/systems/audioContext.ts`. Checklist below was not re-ticked post-ship; treat as historical reference for the implementation order, not an active task list.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing linear MusicSystem with a game-state-reactive procedural music engine ("The Invisible Band") that dynamically adapts to HP, enemy density, combos, and boss fights.

**Architecture:** A pull-model Conductor reads game state snapshots every frame and computes four mood axes (intensity, danger, chaos, triumph) that drive four audio layers (drone, FM piano, heartbeat, Euclidean rhythm) through a filtered fog delay, all synthesized via raw Web Audio API with a lookahead scheduler. SFX and music share a single AudioContext via a new shared module.

**Tech Stack:** Web Audio API (native), TypeScript, Phaser 3

**Spec:** `docs/superpowers/specs/2026-04-09-procedural-music-engine-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/systems/audioContext.ts` | **Create** | Shared AudioContext singleton + DynamicsCompressor output bus |
| `src/systems/AudioSystem.ts` | **Modify** | Change `ensureContext()` to use shared context |
| `src/systems/JuiceSystem.ts` | **Modify** | Add `getComboCount()` getter |
| `src/systems/SpawnSystem.ts` | **Modify** | Add `isBossActive()` with cached tracking |
| `src/systems/music/DroneLayer.ts` | **Create** | Dual-saw bagpipe drone with bandpass + LFO |
| `src/systems/music/PianoLayer.ts` | **Create** | FM-synthesized felt piano with 4-voice polyphony |
| `src/systems/music/PercussionLayer.ts` | **Create** | Heartbeat pulse + Euclidean rhythm patterns |
| `src/systems/music/NoteScheduler.ts` | **Create** | Lookahead scheduler for sample-accurate timing |
| `src/systems/music/Conductor.ts` | **Create** | Mood math, scale system, walk melody algorithm |
| `src/systems/music/ProceduralMusicEngine.ts` | **Create** | Public API, audio graph wiring, fog delay, lifecycle |
| `src/scenes/GameScene.ts` | **Modify** | Replace `music` import, wire state snapshot, update lifecycle calls |
| `src/scenes/MenuScene.ts` | **Modify** | Replace `music` import |
| `src/systems/MusicSystem.ts` | **Delete** | Fully replaced |

---

### Task 1: Shared AudioContext Module

**Files:**
- Create: `src/systems/audioContext.ts`
- Modify: `src/systems/AudioSystem.ts`

This is the foundation everything else connects to. Must land first.

- [ ] **Step 1: Create the shared AudioContext module**

```typescript
// src/systems/audioContext.ts

/**
 * Shared AudioContext singleton.
 * Both AudioSystem (SFX) and ProceduralMusicEngine connect here.
 * A DynamicsCompressorNode on the output prevents clipping during
 * chaotic boss fights when SFX + music + heartbeat fire simultaneously.
 */

let sharedCtx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioContext(): AudioContext | null {
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  try {
    sharedCtx = new AudioContext();
    compressor = sharedCtx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.connect(sharedCtx.destination);
    return sharedCtx;
  } catch {
    return null;
  }
}

export function getOutputNode(): AudioNode | null {
  if (!compressor) getAudioContext();
  return compressor;
}
```

- [ ] **Step 2: Modify AudioSystem to use the shared context**

In `src/systems/AudioSystem.ts`, replace the `ensureContext()` method:

```typescript
// Replace the import section — add:
import { getAudioContext, getOutputNode } from './audioContext';

// Replace the entire ensureContext() method (lines 19-30):
private ensureContext(): AudioContext | null {
  if (this.ctx) return this.ctx;
  const ctx = getAudioContext();
  if (!ctx) return null;
  this.ctx = ctx;
  this.masterGain = ctx.createGain();
  this.masterGain.gain.value = 0.3;
  const output = getOutputNode();
  if (output) {
    this.masterGain.connect(output);
  } else {
    this.masterGain.connect(ctx.destination);
  }
  return ctx;
}
```

- [ ] **Step 3: Verify build passes**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Verify SFX still work in-browser**

Run: `npm run dev`
Test: Click PLAY on menu (should hear click sound), start a game, hear hit/kill/XP sounds.
Expected: All existing SFX unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/systems/audioContext.ts src/systems/AudioSystem.ts
git commit -m "feat(audio): add shared AudioContext with compressor output"
```

---

### Task 2: Expose Game State for the Conductor

**Files:**
- Modify: `src/systems/JuiceSystem.ts`
- Modify: `src/systems/SpawnSystem.ts`

The Conductor needs combo count and boss status. These getters must exist before the Conductor can be built.

- [ ] **Step 1: Add comboCount getter to JuiceSystem**

In `src/systems/JuiceSystem.ts`, after the `hideCombo()` method, add:

```typescript
/** Current kill combo count (for music Conductor) */
getComboCount(): number { return this.comboCount; }
```

- [ ] **Step 2: Add boss tracking to SpawnSystem**

In `src/systems/SpawnSystem.ts`, add a field after `spawnedBossKeys`:

```typescript
/** Cached boss-active flag — avoids iterating 400 enemies per frame */
private bossActive: boolean = false;
```

In the `spawnBoss()` method, inside the `delayedCall(1500, ...)` callback, after `enemy.markAsBoss()` (around line 108), add:

```typescript
this.bossActive = true;
```

In the `update()` method, inside the enemy iteration loop (the `for` loop at line 52-55), add a check after calling `chaseTarget`:

```typescript
// After the existing loop at lines 52-55, add:
if (this.bossActive) {
  let foundBoss = false;
  for (let i = 0; i < active.length; i++) {
    if (active[i].active && active[i].isBoss()) { foundBoss = true; break; }
  }
  if (!foundBoss) this.bossActive = false;
}
```

Wait — this still iterates enemies. The goal was to avoid that. Better approach: only check when `bossActive` is true, and the boss kill event is already emitted by WeaponSystem. Let me use a simpler approach — check lazily in the getter, but cache for the frame:

Replace the above with a simpler cached getter. Add these fields:

```typescript
private bossActive: boolean = false;
private bossCheckFrame: number = -1;
```

Add this public method:

```typescript
isBossActive(): boolean {
  // Cache the check per frame — gameTimeSec changes every frame
  const frame = Math.floor(this.gameTimeSec * 60);
  if (frame === this.bossCheckFrame) return this.bossActive;
  this.bossCheckFrame = frame;

  if (!this.bossActive && this.spawnedBossKeys.size === 0) return false;

  // Only iterate if we believe a boss might be alive
  if (this.bossActive) {
    const active = this.pool.getChildren() as Enemy[];
    let found = false;
    for (let i = 0; i < active.length; i++) {
      if (active[i].active && (active[i] as Enemy).isBoss()) { found = true; break; }
    }
    this.bossActive = found;
  }
  return this.bossActive;
}
```

And in `spawnBoss()`, after `enemy.markAsBoss()`, add: `this.bossActive = true;`

- [ ] **Step 3: Add Enemy import to SpawnSystem if not present**

Check: `Enemy` is already imported at line 2 of SpawnSystem.ts. No change needed.

- [ ] **Step 4: Verify build passes**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/systems/JuiceSystem.ts src/systems/SpawnSystem.ts
git commit -m "feat(audio): expose comboCount and bossActive for music Conductor"
```

---

### Task 3: Drone Layer

**Files:**
- Create: `src/systems/music/DroneLayer.ts`

The always-on harmonic foundation. Two detuned sawtooth oscillators through a bandpass filter with LFO tremolo.

- [ ] **Step 1: Create the DroneLayer**

```typescript
// src/systems/music/DroneLayer.ts

/**
 * Highland Drone — two detuned sawtooth oscillators through a bandpass
 * filter with LFO tremolo. Sounds like distant bagpipes humming.
 *
 * The Conductor controls detuning (dissonance), bandpass frequency
 * (brightness), and volume.
 */
export class DroneLayer {
  private saw1: OscillatorNode | null = null;
  private saw2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private bandpass: BiquadFilterNode | null = null;

  private readonly BASE_FREQ = 110; // A2
  private readonly BASE_DETUNE = 1; // Hz — calm beating
  private readonly BASE_BANDPASS = 300;
  private readonly BASE_VOLUME = 0.2;

  /** Build the drone subgraph and connect to the provided output node */
  start(ctx: AudioContext, output: AudioNode): void {
    // Saw 1 — root pitch
    this.saw1 = ctx.createOscillator();
    this.saw1.type = 'sawtooth';
    this.saw1.frequency.value = this.BASE_FREQ;

    // Saw 2 — slightly detuned for organic beating
    this.saw2 = ctx.createOscillator();
    this.saw2.type = 'sawtooth';
    this.saw2.frequency.value = this.BASE_FREQ + this.BASE_DETUNE;

    // LFO tremolo on gain
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 2.5;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.06;

    // Mix gain
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = this.BASE_VOLUME;

    // Bandpass filter — nasal bagpipe character
    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = this.BASE_BANDPASS;
    this.bandpass.Q.value = 2;

    // Wire: saws → droneGain → bandpass → output
    this.saw1.connect(this.droneGain);
    this.saw2.connect(this.droneGain);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.droneGain.gain);
    this.droneGain.connect(this.bandpass);
    this.bandpass.connect(output);

    this.saw1.start();
    this.saw2.start();
    this.lfo.start();
  }

  /** Update drone parameters based on Conductor mood values */
  applyMood(
    ctx: AudioContext,
    intensity: number,
    danger: number,
    triumph: number,
    transitionSec: number = 1.0
  ): void {
    if (!this.saw1 || !this.saw2 || !this.bandpass || !this.droneGain || !this.lfo) return;
    const t = ctx.currentTime + transitionSec;

    // Pitch drops under danger
    const pitchOffset = -danger * 10;
    this.saw1.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset, t);

    // Detuning widens under danger (1Hz calm → 8Hz dissonant)
    const detune = this.BASE_DETUNE + danger * 7;
    this.saw2.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset + detune, t);

    // Bandpass opens with intensity + triumph
    const bpFreq = this.BASE_BANDPASS + intensity * 900 + triumph * 500;
    this.bandpass.frequency.linearRampToValueAtTime(bpFreq, t);

    // Volume rises with intensity and chaos
    const vol = this.BASE_VOLUME + intensity * 0.04;
    this.droneGain.gain.linearRampToValueAtTime(vol, t);

    // LFO speed increases with intensity (more frantic tremolo)
    this.lfo.frequency.linearRampToValueAtTime(2.5 + intensity * 4, t);
  }

  stop(): void {
    try {
      this.saw1?.stop();
      this.saw2?.stop();
      this.lfo?.stop();
      this.saw1?.disconnect();
      this.saw2?.disconnect();
      this.lfo?.disconnect();
      this.lfoGain?.disconnect();
      this.droneGain?.disconnect();
      this.bandpass?.disconnect();
    } catch { /* nodes may already be stopped */ }
    this.saw1 = this.saw2 = this.lfo = null;
    this.lfoGain = this.droneGain = null;
    this.bandpass = null;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors (file is self-contained, no imports needed)

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/DroneLayer.ts
git commit -m "feat(audio): add Highland drone layer — dual-saw bagpipe synthesis"
```

---

### Task 4: Piano Layer (FM Synthesis + Polyphony)

**Files:**
- Create: `src/systems/music/PianoLayer.ts`

The melodic voice. FM-synthesized "felt piano" with 4-voice polyphony and voice stealing.

- [ ] **Step 1: Create the PianoLayer**

```typescript
// src/systems/music/PianoLayer.ts

/**
 * Felt Piano — FM-synthesized polyphonic voice.
 *
 * Each voice: sine carrier modulated by sine at 2:1 ratio.
 * Modulation index envelope: high attack (bright plunk) → low sustain (warm).
 * 4-voice max with voice stealing (quietest voice replaced).
 */

interface Voice {
  carrier: OscillatorNode;
  modulator: OscillatorNode;
  modGain: GainNode;
  voiceGain: GainNode;
  startTime: number;
  releaseTime: number;
}

export class PianoLayer {
  private voices: (Voice | null)[] = [null, null, null, null];
  private mixGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ctx: AudioContext | null = null;

  /** Build the piano mix bus and connect to output */
  start(ctx: AudioContext, output: AudioNode): void {
    this.ctx = ctx;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;

    this.mixGain = ctx.createGain();
    this.mixGain.gain.value = 1.0;

    this.filter.connect(this.mixGain);
    this.mixGain.connect(output);
  }

  /** Play a note at a specific time with given frequency and velocity (0-1) */
  playNote(freq: number, time: number, velocity: number, releaseSec: number = 1.5): void {
    if (!this.ctx || !this.filter) return;
    const ctx = this.ctx;

    // Find a free voice slot or steal the quietest
    const slotIdx = this.findVoiceSlot(time);
    this.releaseVoice(slotIdx);

    // Carrier oscillator (the audible tone)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = freq;

    // Modulator oscillator (shapes the timbre via FM)
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = freq * 2; // 2:1 ratio

    // Modulation index envelope — bright attack, warm sustain
    const modGain = ctx.createGain();
    const modDepth = freq * 0.8 * velocity; // higher velocity = brighter
    modGain.gain.setValueAtTime(modDepth, time);
    modGain.gain.exponentialRampToValueAtTime(freq * 0.1, time + 0.05);
    modGain.gain.exponentialRampToValueAtTime(freq * 0.02, time + 0.3);

    // Carrier amplitude envelope — ADSR
    const voiceGain = ctx.createGain();
    const peak = 0.25 * velocity;
    voiceGain.gain.setValueAtTime(0, time);
    voiceGain.gain.linearRampToValueAtTime(peak, time + 0.005);            // Attack: 5ms
    voiceGain.gain.linearRampToValueAtTime(peak * 0.5, time + 0.2);       // Decay: 200ms → 50%
    voiceGain.gain.linearRampToValueAtTime(peak * 0.3, time + 0.5);       // Sustain: 30%
    voiceGain.gain.linearRampToValueAtTime(0.001, time + releaseSec);     // Release

    // Wire: modulator → modGain → carrier.frequency, carrier → voiceGain → filter
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(voiceGain);
    voiceGain.connect(this.filter!);

    // Schedule start/stop
    carrier.start(time);
    modulator.start(time);
    const stopTime = time + releaseSec + 0.1;
    carrier.stop(stopTime);
    modulator.stop(stopTime);

    this.voices[slotIdx] = {
      carrier, modulator, modGain, voiceGain,
      startTime: time,
      releaseTime: stopTime,
    };

    // Auto-cleanup after voice finishes
    carrier.onended = () => {
      if (this.voices[slotIdx]?.carrier === carrier) {
        this.voices[slotIdx] = null;
      }
    };
  }

  /** Find the best voice slot: prefer empty, then steal quietest */
  private findVoiceSlot(now: number): number {
    // Prefer an empty slot
    for (let i = 0; i < this.voices.length; i++) {
      if (!this.voices[i]) return i;
    }
    // Steal the voice closest to finishing (latest into its release)
    let bestIdx = 0;
    let bestAge = 0;
    for (let i = 0; i < this.voices.length; i++) {
      const v = this.voices[i]!;
      const age = now - v.startTime;
      if (age > bestAge) { bestAge = age; bestIdx = i; }
    }
    return bestIdx;
  }

  private releaseVoice(idx: number): void {
    const v = this.voices[idx];
    if (!v) return;
    try {
      v.carrier.stop();
      v.modulator.stop();
      v.carrier.disconnect();
      v.modulator.disconnect();
      v.modGain.disconnect();
      v.voiceGain.disconnect();
    } catch { /* already stopped */ }
    this.voices[idx] = null;
  }

  /** Set the master volume for the piano mix */
  setVolume(ctx: AudioContext, vol: number, transitionSec: number = 0.5): void {
    if (!this.mixGain) return;
    this.mixGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + transitionSec);
  }

  stop(): void {
    for (let i = 0; i < this.voices.length; i++) {
      this.releaseVoice(i);
    }
    try {
      this.filter?.disconnect();
      this.mixGain?.disconnect();
    } catch { /* already disconnected */ }
    this.filter = null;
    this.mixGain = null;
    this.ctx = null;
  }

  /** Get the mix gain node (for connecting to fog delay) */
  getOutput(): GainNode | null { return this.mixGain; }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/PianoLayer.ts
git commit -m "feat(audio): add FM piano layer — 4-voice polyphony with voice stealing"
```

---

### Task 5: Percussion Layer (Heartbeat + Euclidean Rhythm)

**Files:**
- Create: `src/systems/music/PercussionLayer.ts`

- [ ] **Step 1: Create the PercussionLayer**

```typescript
// src/systems/music/PercussionLayer.ts

/**
 * Percussion — heartbeat pulse + Euclidean rhythm patterns.
 *
 * Heartbeat: "lub-dub" double sine kick at fixed 72 BPM, volume driven by chaos.
 * Rhythm: hi-hat + kick on Euclidean patterns, density driven by intensity.
 */
export class PercussionLayer {
  private heartbeatGain: GainNode | null = null;
  private rhythmGain: GainNode | null = null;
  private ctx: AudioContext | null = null;
  private output: AudioNode | null = null;

  /** Current Euclidean pattern — array of booleans (hit/rest) */
  private pattern: boolean[] = [true, false, true, false, false, false, false, false];
  private patternIdx: number = 0;

  start(ctx: AudioContext, output: AudioNode): void {
    this.ctx = ctx;
    this.output = output;

    this.heartbeatGain = ctx.createGain();
    this.heartbeatGain.gain.value = 0; // silent until chaos rises
    this.heartbeatGain.connect(output);

    this.rhythmGain = ctx.createGain();
    this.rhythmGain.gain.value = 0.05;
    this.rhythmGain.connect(output);
  }

  /** Schedule a heartbeat "lub-dub" at the given audio time */
  scheduleHeartbeat(time: number, chaos: number): void {
    if (!this.ctx || !this.heartbeatGain) return;
    const vol = Math.max(0, (chaos - 0.3) / 0.7) * 0.3; // 0 below 0.3, ramps to 0.3
    if (vol < 0.01) return; // skip if silent

    // "Lub" (first beat)
    this.playSubKick(time, vol);
    // "Dub" (second beat, 50ms later, quieter)
    this.playSubKick(time + 0.05, vol * 0.7);
  }

  private playSubKick(time: number, vol: number): void {
    if (!this.ctx || !this.heartbeatGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.heartbeatGain!);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  /** Schedule a rhythm hit (kick or hat) at the given audio time */
  scheduleRhythmHit(time: number, intensity: number, swing: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const isHit = this.pattern[this.patternIdx];
    const isEvenSlot = this.patternIdx % 2 === 0;

    // Apply swing delay to even slots
    const swingDelay = isEvenSlot ? 0 : swing;
    const hitTime = time + swingDelay;

    this.patternIdx = (this.patternIdx + 1) % this.pattern.length;

    if (!isHit) return;

    // Alternate kick and hat
    if (this.patternIdx % 2 === 1) {
      this.playKick(hitTime, 0.08 + intensity * 0.06);
    } else {
      this.playHat(hitTime, 0.02 + intensity * 0.02);
    }
  }

  private playKick(time: number, vol: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playHat(time: number, vol: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const hpf = this.ctx.createBiquadFilter();
    osc.type = 'square';
    osc.frequency.value = 6000 + Math.random() * 2000;
    hpf.type = 'highpass';
    hpf.frequency.value = 5000;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  /** Update the Euclidean pattern based on density (N hits in 8 slots) */
  updatePattern(density: number): void {
    const n = Math.round(Math.max(1, Math.min(7, density * 7 + 1)));
    this.pattern = euclidean(n, 8);
  }

  stop(): void {
    try {
      this.heartbeatGain?.disconnect();
      this.rhythmGain?.disconnect();
    } catch { /* already disconnected */ }
    this.heartbeatGain = null;
    this.rhythmGain = null;
    this.ctx = null;
    this.output = null;
    this.patternIdx = 0;
  }
}

/** Bjorklund's Euclidean rhythm algorithm — distributes n hits across m slots */
function euclidean(hits: number, slots: number): boolean[] {
  if (hits >= slots) return new Array(slots).fill(true);
  if (hits <= 0) return new Array(slots).fill(false);

  let pattern: number[][] = [];
  for (let i = 0; i < slots; i++) {
    pattern.push(i < hits ? [1] : [0]);
  }

  let level = 0;
  while (true) {
    const counts = { ones: 0, zeros: 0 };
    for (const p of pattern) {
      if (p[p.length - 1] === 1) counts.ones++;
      else counts.zeros++;
    }
    if (counts.zeros <= 1) break;

    const newPattern: number[][] = [];
    let onesIdx = 0;
    let zerosStart = pattern.findIndex(p => p[p.length - 1] === 0);
    let zerosIdx = zerosStart;

    while (onesIdx < zerosStart && zerosIdx < pattern.length) {
      newPattern.push([...pattern[onesIdx], ...pattern[zerosIdx]]);
      onesIdx++;
      zerosIdx++;
    }
    while (onesIdx < zerosStart) {
      newPattern.push([...pattern[onesIdx]]);
      onesIdx++;
    }
    while (zerosIdx < pattern.length) {
      newPattern.push([...pattern[zerosIdx]]);
      zerosIdx++;
    }

    pattern = newPattern;
    level++;
    if (level > 20) break; // safety
  }

  return pattern.flat().map(v => v === 1);
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/PercussionLayer.ts
git commit -m "feat(audio): add percussion layer — heartbeat pulse + Euclidean rhythm"
```

---

### Task 6: Note Scheduler (Lookahead Pattern)

**Files:**
- Create: `src/systems/music/NoteScheduler.ts`

- [ ] **Step 1: Create the NoteScheduler**

```typescript
// src/systems/music/NoteScheduler.ts

/**
 * Lookahead note scheduler — replaces setTimeout/setInterval with
 * the Web Audio spec's recommended pattern.
 *
 * Ticked from the game loop. Looks 100ms ahead and schedules notes
 * using audioContext.currentTime for sample-accurate timing.
 */
export class NoteScheduler {
  private readonly SCHEDULE_AHEAD = 0.1; // 100ms lookahead

  private nextMelodyTime: number = 0;
  private nextRhythmTime: number = 0;
  private nextHeartbeatTime: number = 0;

  private melodyCallback: ((time: number) => number) | null = null;
  private rhythmCallback: ((time: number) => number) | null = null;
  private heartbeatCallback: ((time: number) => number) | null = null;

  /**
   * Register scheduling callbacks. Each callback receives the scheduled time
   * and returns the interval (in seconds) until the next event.
   */
  setMelodyCallback(cb: (time: number) => number): void {
    this.melodyCallback = cb;
  }

  setRhythmCallback(cb: (time: number) => number): void {
    this.rhythmCallback = cb;
  }

  setHeartbeatCallback(cb: (time: number) => number): void {
    this.heartbeatCallback = cb;
  }

  /** Initialize timing from the current audio clock */
  start(now: number): void {
    this.nextMelodyTime = now + 1.0; // 1s delay before first note
    this.nextRhythmTime = now;
    this.nextHeartbeatTime = now;
  }

  /** Tick the scheduler — call from update() every frame */
  tick(now: number): void {
    const horizon = now + this.SCHEDULE_AHEAD;

    // Schedule melody notes
    if (this.melodyCallback) {
      while (this.nextMelodyTime < horizon) {
        const interval = this.melodyCallback(this.nextMelodyTime);
        this.nextMelodyTime += Math.max(0.1, interval); // floor at 100ms
      }
    }

    // Schedule rhythm hits
    if (this.rhythmCallback) {
      while (this.nextRhythmTime < horizon) {
        const interval = this.rhythmCallback(this.nextRhythmTime);
        this.nextRhythmTime += Math.max(0.05, interval);
      }
    }

    // Schedule heartbeat
    if (this.heartbeatCallback) {
      while (this.nextHeartbeatTime < horizon) {
        const interval = this.heartbeatCallback(this.nextHeartbeatTime);
        this.nextHeartbeatTime += Math.max(0.1, interval);
      }
    }
  }

  reset(): void {
    this.nextMelodyTime = 0;
    this.nextRhythmTime = 0;
    this.nextHeartbeatTime = 0;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/NoteScheduler.ts
git commit -m "feat(audio): add lookahead note scheduler"
```

---

### Task 7: Conductor (Mood Math + Melody Walk)

**Files:**
- Create: `src/systems/music/Conductor.ts`

The brain. Reads game state, computes moods, generates melody notes.

- [ ] **Step 1: Create the Conductor**

```typescript
// src/systems/music/Conductor.ts

/**
 * Conductor — reads game state, computes 4 mood axes, generates melody.
 *
 * Mood axes: intensity, danger, chaos, triumph.
 * Melody: constrained random walk with phrase contours over blended scales.
 */

export interface GameMusicState {
  hp: number;
  maxHp: number;
  gameTimeSec: number;
  enemyCount: number;
  comboCount: number;
  bossActive: boolean;
}

export interface MoodValues {
  intensity: number;
  danger: number;
  chaos: number;
  triumph: number;
}

// Scale frequencies — two octaves of each mode rooted on A
// Index: 0-6 = lower octave, 7-13 = upper octave
const DORIAN = [
  220.0, 246.9, 261.6, 293.7, 329.6, 370.0, 392.0,  // A3 B3 C4 D4 E4 F#4 G4
  440.0, 493.9, 523.3, 587.3, 659.3, 740.0, 784.0,   // A4 B4 C5 D5 E5 F#5 G5
];
const AEOLIAN_6TH = 349.2; // F4 (replaces F#4 at index 5)
const AEOLIAN_6TH_HI = 698.5; // F5 (replaces F#5 at index 12)
const MIXO_3RD = 277.2; // C#4 (replaces C4 at index 2)
const MIXO_3RD_HI = 554.4; // C#5 (replaces C5 at index 9)

// Stability weights per scale degree (0 = tonic)
const STABILITY = [1.0, 0.3, 0.5, 0.5, 0.7, 0.3, 0.3];

type Contour = 'ascending' | 'descending' | 'arch' | 'valley';

export class Conductor {
  // Mood values — smoothed per frame
  intensity = 0;
  danger = 0;
  chaos = 0;
  triumph = 0;

  // Kill rate tracking for triumph
  private killHistory: { time: number; count: number }[] = [];

  // Melody state
  private currentDegree = 0; // 0-6 scale degree
  private currentOctave = 0; // 0 = lower, 1 = upper
  private lastDirection = 1; // 1 = up, -1 = down
  private phraseNotesRemaining = 0;
  private phraseContour: Contour = 'arch';
  private phraseNoteIndex = 0;
  private phraseLength = 5;
  private inRest = false;

  // Resolution override
  private resolutionMode = false;

  /** Update moods from game state — call every frame */
  updateMood(delta: number, state: GameMusicState): void {
    if (this.resolutionMode) return; // locked during victory resolution

    const hpFrac = state.maxHp > 0 ? state.hp / state.maxHp : 1;

    // Intensity: game time + enemy density
    const intensityTarget = Math.min(1,
      Math.min(1, state.gameTimeSec / 1200) * 0.7 +
      Math.min(1, state.enemyCount / 250) * 0.3
    );
    this.intensity = lerp(this.intensity, intensityTarget, delta * 0.001);

    // Danger: HP below 30%
    if (hpFrac < 0.3) {
      const dangerTarget = (0.3 - hpFrac) / 0.3;
      this.danger = lerp(this.danger, dangerTarget, delta * 0.003);
    } else {
      this.danger = lerp(this.danger, 0, delta * 0.0008);
    }

    // Chaos: enemy density + combo
    const chaosTarget = Math.min(1,
      Math.min(1, state.enemyCount / 300) * 0.6 +
      Math.min(1, state.comboCount / 20) * 0.4
    );
    this.chaos = lerp(this.chaos, chaosTarget, delta * 0.002);

    // Triumph: combo + kill rate, suppressed by danger
    this.updateKillHistory(state.gameTimeSec, state.comboCount);
    const killRate = this.getRecentKillRate(state.gameTimeSec);
    let triumphTarget = 0;
    if (state.comboCount > 8 && hpFrac > 0.5) {
      triumphTarget = Math.min(1, Math.max(0, (killRate - 3) / 10));
    }
    this.triumph = lerp(this.triumph, triumphTarget, delta * 0.002);
    this.triumph *= (1 - this.danger);
  }

  /** Get a mood snapshot for layer parameter updates */
  getMood(): MoodValues {
    return {
      intensity: this.intensity,
      danger: this.danger,
      chaos: this.chaos,
      triumph: this.triumph,
    };
  }

  /**
   * Generate the next melody note. Returns { freq, velocity, intervalSec }
   * or null during a phrase rest.
   */
  nextNote(): { freq: number; velocity: number; intervalSec: number } | null {
    // Phrase rest
    if (this.inRest) {
      this.inRest = false;
      this.startNewPhrase();
      // 40% chance to resolve to tonic
      if (Math.random() < 0.4) {
        this.currentDegree = 0;
      }
    }

    // Start new phrase if needed
    if (this.phraseNotesRemaining <= 0) {
      this.startNewPhrase();
    }

    // Resolution mode: force descending to tonic
    if (this.resolutionMode) {
      if (this.currentDegree > 0) this.currentDegree--;
      else if (this.currentOctave > 0) { this.currentOctave = 0; this.currentDegree = 0; }
    } else {
      this.walkToNextDegree();
    }

    const freq = this.getFrequency(this.currentDegree, this.currentOctave);
    const velocity = this.computeVelocity();

    this.phraseNotesRemaining--;
    this.phraseNoteIndex++;

    // Compute interval until next note
    let interval = 3.0 - this.intensity * 2.2; // 3.0s → 0.8s
    if (this.danger > 0.2) interval *= 1.0 + this.danger * 0.4;
    // Gaussian-ish jitter: ±20%
    interval *= 0.8 + Math.random() * 0.4;

    // Insert phrase rest after phrase ends
    if (this.phraseNotesRemaining <= 0 && !this.resolutionMode) {
      this.inRest = true;
      interval += interval * 2.5; // long pause
    }

    return { freq, velocity, intervalSec: interval };
  }

  /** Enter resolution mode — forces descending phrase to tonic then signals done */
  enterResolution(): void {
    this.resolutionMode = true;
    this.triumph = 1;
    this.danger = 0;
    this.chaos = 0;
    this.phraseNotesRemaining = this.currentDegree + this.currentOctave * 7 + 2;
    this.phraseNoteIndex = 0;
  }

  isResolutionComplete(): boolean {
    return this.resolutionMode && this.currentDegree === 0 && this.currentOctave === 0;
  }

  // ── Private: melody walk ──

  private startNewPhrase(): void {
    // Choose contour
    const r = Math.random();
    if (r < 0.30) this.phraseContour = 'ascending';
    else if (r < 0.55) this.phraseContour = 'descending';
    else if (r < 0.80) this.phraseContour = 'arch';
    else this.phraseContour = 'valley';

    this.phraseLength = 3 + Math.floor(Math.random() * 5); // 3-7 notes
    this.phraseNotesRemaining = this.phraseLength;
    this.phraseNoteIndex = 0;
  }

  private walkToNextDegree(): void {
    // Contour direction bias
    const progress = this.phraseLength > 1
      ? this.phraseNoteIndex / (this.phraseLength - 1)
      : 0.5;
    let dirBias = 0; // positive = up
    switch (this.phraseContour) {
      case 'ascending': dirBias = 0.4; break;
      case 'descending': dirBias = -0.4; break;
      case 'arch': dirBias = progress < 0.5 ? 0.4 : -0.4; break;
      case 'valley': dirBias = progress < 0.5 ? -0.4 : 0.4; break;
    }

    // Mood modifiers
    dirBias -= this.danger * 0.2; // danger biases down
    dirBias += this.triumph * 0.15; // triumph biases up

    // Direction from bias + momentum
    const momentumBias = this.lastDirection * 0.1;
    const direction = (Math.random() < 0.5 + dirBias + momentumBias) ? 1 : -1;
    this.lastDirection = direction;

    // Interval size
    const landingBoost = this.danger * 0.1 + (this.phraseNotesRemaining <= 1 ? 0.3 : 0);
    const r = Math.random();
    let step: number;
    if (r < 0.1 + landingBoost) {
      // Landing — jump to stable degree
      const stableDegrees = [0, 4]; // tonic, fifth
      this.currentDegree = stableDegrees[Math.floor(Math.random() * stableDegrees.length)];
      return;
    } else if (r < 0.6) {
      step = 1;
    } else if (r < 0.85) {
      step = 2;
    } else {
      step = 3 + (this.triumph > 0.3 ? 1 : 0);
    }

    this.currentDegree += direction * step;

    // Wrap octaves
    if (this.currentDegree > 6) {
      if (this.currentOctave === 0) { this.currentOctave = 1; this.currentDegree -= 7; }
      else { this.currentDegree = 6; }
    } else if (this.currentDegree < 0) {
      if (this.currentOctave === 1) { this.currentOctave = 0; this.currentDegree += 7; }
      else { this.currentDegree = 0; }
    }

    // Register bias from mood
    const registerBias = -this.danger * 0.3 + this.triumph * 0.3;
    if (Math.random() < Math.abs(registerBias)) {
      this.currentOctave = registerBias > 0 ? 1 : 0;
    }
  }

  private getFrequency(degree: number, octave: number): number {
    const idx = octave * 7 + degree;
    const baseFreq = DORIAN[idx];

    // Scale blending: danger shifts 6th degree, triumph shifts 3rd
    if (degree === 5) {
      if (Math.random() < this.danger) {
        return octave === 0 ? AEOLIAN_6TH : AEOLIAN_6TH_HI;
      }
    }
    if (degree === 2) {
      if (Math.random() < this.triumph) {
        return octave === 0 ? MIXO_3RD : MIXO_3RD_HI;
      }
    }

    return baseFreq;
  }

  private computeVelocity(): number {
    let vel = 0.12 + this.intensity * 0.06;
    if (this.danger > 0.2) vel *= 0.6 + (1 - this.danger) * 0.4;
    if (this.triumph > 0.2) vel *= 1.0 + this.triumph * 0.3;
    vel *= 0.85 + Math.random() * 0.3; // ±15% jitter
    return Math.min(1, Math.max(0.05, vel));
  }

  // ── Kill rate tracking ──

  private updateKillHistory(gameTimeSec: number, comboCount: number): void {
    this.killHistory.push({ time: gameTimeSec, count: comboCount });
    // Keep only last 10 seconds
    while (this.killHistory.length > 0 && this.killHistory[0].time < gameTimeSec - 10) {
      this.killHistory.shift();
    }
  }

  private getRecentKillRate(gameTimeSec: number): number {
    if (this.killHistory.length < 2) return 0;
    const oldest = this.killHistory[0];
    const newest = this.killHistory[this.killHistory.length - 1];
    const timeDiff = newest.time - oldest.time;
    if (timeDiff < 1) return 0;
    return (newest.count - oldest.count) / timeDiff;
  }
}

function lerp(current: number, target: number, t: number): number {
  return current + (target - current) * Math.min(1, t);
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/Conductor.ts
git commit -m "feat(audio): add Conductor — mood math, scale blending, melody walk"
```

---

### Task 8: Procedural Music Engine (Wiring + Lifecycle)

**Files:**
- Create: `src/systems/music/ProceduralMusicEngine.ts`

The public API that wires everything together.

- [ ] **Step 1: Create ProceduralMusicEngine**

```typescript
// src/systems/music/ProceduralMusicEngine.ts

/**
 * ProceduralMusicEngine — "The Invisible Band"
 *
 * Public API for the game-state-reactive music system.
 * Wires the Conductor, Scheduler, and all layers into one audio graph.
 */

import { getAudioContext, getOutputNode } from '../audioContext';
import { DroneLayer } from './DroneLayer';
import { PianoLayer } from './PianoLayer';
import { PercussionLayer } from './PercussionLayer';
import { NoteScheduler } from './NoteScheduler';
import { Conductor, GameMusicState } from './Conductor';

export type { GameMusicState };

class ProceduralMusicEngine {
  private ctx: AudioContext | null = null;
  private playing = false;
  private enabled = true;

  // Audio graph
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private fogDelay: DelayNode | null = null;
  private fogFilter: BiquadFilterNode | null = null;
  private fogFeedback: GainNode | null = null;

  // Layers
  private drone = new DroneLayer();
  private piano = new PianoLayer();
  private percussion = new PercussionLayer();

  // Brain + clock
  private conductor = new Conductor();
  private scheduler = new NoteScheduler();

  // Rhythm timing
  private rhythmBPM = 90;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    if (ctx.state === 'suspended') ctx.resume();

    // Master chain: masterFilter → masterGain → output
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 800;
    this.masterFilter.Q.value = 0.7;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 0.08 : 0;

    const output = getOutputNode();
    this.masterFilter.connect(this.masterGain);
    this.masterGain.connect(output ?? ctx.destination);

    // Fog delay: piano → delay → filter → feedback → delay, and also → masterFilter
    const pianoOut = this.buildFogDelay(ctx);

    // Start layers
    this.drone.start(ctx, this.masterFilter);
    this.piano.start(ctx, pianoOut);
    this.percussion.start(ctx, this.masterFilter);

    // Wire scheduler callbacks
    this.scheduler.setMelodyCallback((time) => {
      const note = this.conductor.nextNote();
      if (note) {
        this.piano.playNote(note.freq, time, note.velocity);
      }
      return note?.intervalSec ?? 2.0;
    });

    this.scheduler.setRhythmCallback((time) => {
      const mood = this.conductor.getMood();
      this.percussion.scheduleRhythmHit(time, mood.intensity, mood.triumph * 0.15);
      return (60 / this.rhythmBPM) / 2; // 8th note subdivision
    });

    this.scheduler.setHeartbeatCallback((time) => {
      const mood = this.conductor.getMood();
      this.percussion.scheduleHeartbeat(time, mood.chaos);
      return 60 / 72; // fixed 72 BPM
    });

    this.scheduler.start(ctx.currentTime);
    this.playing = true;
  }

  stop(): void {
    if (!this.playing) return;
    this.drone.stop();
    this.piano.stop();
    this.percussion.stop();
    this.disconnectGraph();
    if (this.ctx) this.ctx.suspend();
    this.playing = false;
    this.conductor = new Conductor(); // reset state for next run
    this.scheduler.reset();
  }

  fadeOut(ms: number): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
    // Stop everything after fade completes
    setTimeout(() => this.stop(), ms + 100);
  }

  playResolution(): void {
    if (!this.playing) return;
    this.conductor.enterResolution();
    // The scheduler will keep ticking — the Conductor now generates
    // descending notes to tonic. We poll for completion.
    const checkDone = () => {
      if (this.conductor.isResolutionComplete()) {
        this.fadeOut(3000);
      } else {
        setTimeout(checkDone, 200);
      }
    };
    setTimeout(checkDone, 500);
  }

  update(delta: number, state: GameMusicState): void {
    if (!this.playing || !this.ctx) return;

    // Resume if browser suspended the context (mobile tab background)
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Update Conductor mood from game state
    this.conductor.updateMood(delta, state);
    const mood = this.conductor.getMood();

    // Update layers from mood
    this.drone.applyMood(this.ctx, mood.intensity, mood.danger, mood.triumph);

    // Update master filter (opens with intensity)
    if (this.masterFilter) {
      const freq = 800 + mood.intensity * 3000;
      this.masterFilter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1);
    }

    // Update master volume
    if (this.masterGain && this.enabled) {
      const vol = 0.06 + mood.intensity * 0.06;
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
    }

    // Update fog delay feedback based on mood
    if (this.fogFeedback && this.fogDelay) {
      let feedback = 0.35;
      if (mood.danger > 0.2) feedback += mood.danger * 0.2;
      if (mood.chaos > 0.3) feedback -= mood.chaos * 0.1;
      feedback = Math.min(0.65, Math.max(0.1, feedback)); // safety clamp
      this.fogFeedback.gain.linearRampToValueAtTime(feedback, this.ctx.currentTime + 1);

      const delayTime = 2.0 - mood.intensity * 1.0; // 2s → 1s
      this.fogDelay.delayTime.linearRampToValueAtTime(delayTime, this.ctx.currentTime + 1);
    }

    // Update rhythm BPM and pattern
    this.rhythmBPM = 90 + mood.intensity * 50;
    const rhythmDensity = mood.danger > 0.5
      ? 0.1 + (1 - mood.danger) * 0.3 // sparse during danger
      : mood.intensity;
    this.percussion.updatePattern(rhythmDensity);

    // Tick the scheduler
    this.scheduler.tick(this.ctx.currentTime);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        on ? 0.08 : 0,
        this.ctx.currentTime + 0.3
      );
    }
    if (!on && this.playing) {
      // Don't stop — just mute. Keeps state running for smooth un-mute.
    }
  }

  isPlaying(): boolean { return this.playing; }

  // ── Private ──

  private buildFogDelay(ctx: AudioContext): AudioNode {
    // Piano routes through this node, which feeds both masterFilter and delay loop
    const pianoSend = ctx.createGain();
    pianoSend.gain.value = 1.0;
    pianoSend.connect(this.masterFilter!);

    // Delay line
    this.fogDelay = ctx.createDelay(4); // max 4 seconds
    this.fogDelay.delayTime.value = 2.0;

    // Feedback filter (each echo gets darker)
    this.fogFilter = ctx.createBiquadFilter();
    this.fogFilter.type = 'lowpass';
    this.fogFilter.frequency.value = 600;

    // Feedback gain (clamped to 0.65 max)
    this.fogFeedback = ctx.createGain();
    this.fogFeedback.gain.value = 0.35;

    // Wire the feedback loop: pianoSend → delay → fogFilter → feedback → delay
    pianoSend.connect(this.fogDelay);
    this.fogDelay.connect(this.fogFilter);
    this.fogFilter.connect(this.fogFeedback);
    this.fogFeedback.connect(this.fogDelay);

    // Delay output also goes to master
    this.fogDelay.connect(this.masterFilter!);

    return pianoSend;
  }

  private disconnectGraph(): void {
    try {
      this.masterFilter?.disconnect();
      this.masterGain?.disconnect();
      this.fogDelay?.disconnect();
      this.fogFilter?.disconnect();
      this.fogFeedback?.disconnect();
    } catch { /* already disconnected */ }
    this.masterFilter = null;
    this.masterGain = null;
    this.fogDelay = null;
    this.fogFilter = null;
    this.fogFeedback = null;
  }
}

export const musicEngine = new ProceduralMusicEngine();
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/systems/music/ProceduralMusicEngine.ts
git commit -m "feat(audio): add ProceduralMusicEngine — full audio graph + lifecycle"
```

---

### Task 9: Wire into GameScene + Replace Old MusicSystem

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/MenuScene.ts`
- Delete: `src/systems/MusicSystem.ts`

- [ ] **Step 1: Update GameScene imports and music calls**

In `src/scenes/GameScene.ts`:

Replace the import (line 17):
```typescript
// OLD:
import { music } from '../systems/MusicSystem';
// NEW:
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
```

Replace `music.start()` in create() (line ~152):
```typescript
// OLD:
if (audioSave.settings.musicOn) {
  music.start();
}
// NEW:
if (audioSave.settings.musicOn) {
  musicEngine.start();
}
```

Replace `music.update(...)` in update() (line ~268):
```typescript
// OLD:
music.update(this.spawnSystem.getGameTimeSec());
// NEW:
const musicState: GameMusicState = {
  hp: this.player.getHp(),
  maxHp: this.player.getMaxHp(),
  gameTimeSec: this.spawnSystem.getGameTimeSec(),
  enemyCount: this.spawnSystem.getActiveCount(),
  comboCount: this.juice.getComboCount(),
  bossActive: this.spawnSystem.isBossActive(),
};
musicEngine.update(delta, musicState);
```

Replace `music.stop()` in handleVictory() (line ~600):
```typescript
// OLD:
music.stop();
// NEW:
musicEngine.playResolution();
```

Replace `music.stop()` in handlePlayerDeath() (line ~676):
```typescript
// OLD:
music.stop();
// NEW:
musicEngine.fadeOut(2000);
```

Replace `music.stop()` / `music.start()` in pause menu toggle (line ~523):
```typescript
// OLD:
if (musicOn) { music.start(); } else { music.stop(); }
// NEW:
musicEngine.setEnabled(musicOn);
```

Replace `music.stop()` in quit button (line ~533):
```typescript
// OLD:
music.stop(); this.scene.start('Menu');
// NEW:
musicEngine.stop(); this.scene.start('Menu');
```

- [ ] **Step 2: Update MenuScene**

In `src/scenes/MenuScene.ts`:

Replace the import (line 5):
```typescript
// OLD:
import { music } from '../systems/MusicSystem';
// NEW:
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
```

Replace the music toggle callback (line ~125):
```typescript
// OLD:
if (on) { music.start(); } else { music.stop(); }
// NEW:
musicEngine.setEnabled(on);
```

Replace the settings application (line ~130):
```typescript
// OLD:
if (!save.settings.musicOn) music.stop();
// NEW:
musicEngine.setEnabled(save.settings.musicOn);
```

- [ ] **Step 3: Delete old MusicSystem**

```bash
rm src/systems/MusicSystem.ts
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors. If any file still imports `MusicSystem`, fix the import.

- [ ] **Step 5: Full browser test**

Run: `npm run dev`

Test each scenario:
1. **Menu**: Click PLAY — no crash, no music on menu (scope exclusion)
2. **Game start**: After countdown, hear the drone start softly. Piano notes begin after ~1 second.
3. **Early game**: Sparse, slow notes with long pauses. "Fog rolling over hills" feel.
4. **Mid game (5+ min)**: Notes get closer together, filter opens (brighter), rhythm fades in.
5. **Low HP**: Drone becomes dissonant (wider detuning), piano goes sparse and low-register.
6. **High combo/density**: Heartbeat pulse fades in, rhythm intensifies.
7. **Boss fight**: Music intensifies (if boss spawns).
8. **Death**: Music fades out over 2 seconds.
9. **Victory**: Descending resolving phrase, then 3-second fade.
10. **Pause menu**: Music continues while paused. SFX/Music toggles work.
11. **Quit to menu**: Music stops immediately.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(audio): wire ProceduralMusicEngine into game, delete old MusicSystem"
```

---

### Task 10: Production Build + Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: Build succeeds with 0 TypeScript errors.

- [ ] **Step 2: Verify no references to old MusicSystem remain**

Run: `grep -r "MusicSystem" src/`
Expected: No matches.

Run: `grep -r "from.*MusicSystem" src/`
Expected: No matches.

- [ ] **Step 3: Verify the music/ directory structure is correct**

Run: `ls src/systems/music/`
Expected:
```
Conductor.ts
DroneLayer.ts
NoteScheduler.ts
PercussionLayer.ts
PianoLayer.ts
ProceduralMusicEngine.ts
```

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: final cleanup — verify production build"
```
