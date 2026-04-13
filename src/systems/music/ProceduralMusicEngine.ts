/**
 * ProceduralMusicEngine — "The Invisible Band"
 *
 * Public API for the game-state-reactive music system.
 * Wires the Conductor, Scheduler, and all layers into one audio graph.
 */

import { getAudioContext, getOutputNode } from '../audioContext';
import { MOTION_TIMING } from './musicMath';
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
  /** 0–1 user preference multiplier (SettingsManager.musicVolume × masterVolume). */
  private userMusicVolume = 1;

  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private fogDelay: DelayNode | null = null;
  private fogFilter: BiquadFilterNode | null = null;
  private fogFeedback: GainNode | null = null;
  private tap1: DelayNode | null = null;
  private tap2: DelayNode | null = null;
  private tap1Gain: GainNode | null = null;
  private tap2Gain: GainNode | null = null;
  private reverbMix: GainNode | null = null;
  private pianoSendGain: GainNode | null = null;

  private drone = new DroneLayer();
  private piano = new PianoLayer();
  private percussion = new PercussionLayer();

  private conductor = new Conductor();
  private scheduler = new NoteScheduler();

  private rhythmBPM = 90;
  private rafId: number | ReturnType<typeof setTimeout> | null = null;
  private cancelFrame: ((id: number | ReturnType<typeof setTimeout>) => void) | null = null;
  private fadeStopAtTimeSec: number | null = null;
  private resolutionPolling = false;
  /**
   * True between `fadeOut()` start and the scheduled stop. While set,
   * `update()` must NOT ramp masterGain back up — its per-frame ramp to a
   * positive volume would stomp the fade-to-zero curve on the automation
   * timeline and the fade would stall before reaching silence.
   */
  private fadingOut = false;
  /** Transient dip when heavy gameplay SFX fire (0 = no duck). */
  private musicSfxDuck = 0;
  start(): void {
    if (this.playing) { this.stop(); } // force-stop if still fading out from a prior run
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    if (ctx.state === 'suspended') void ctx.resume();

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 3500; // open enough to hear piano warmth
    this.masterFilter.Q.value = 0.5;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 0.25 * this.userMusicVolume : 0;

    const output = getOutputNode();
    this.masterFilter.connect(this.masterGain);
    this.masterGain.connect(output ?? ctx.destination);

    this.pianoSendGain = this.buildFogDelay(ctx) as GainNode;

    this.drone.start(ctx, this.masterFilter);
    this.piano.start(ctx, this.pianoSendGain);
    this.percussion.start(ctx, this.masterFilter);

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
      return (60 / this.rhythmBPM) / 2;
    });

    this.scheduler.setHeartbeatCallback((time) => {
      const mood = this.conductor.getMood();
      this.percussion.scheduleHeartbeat(time, mood.chaos);
      return 60 / 72;
    });

    this.scheduler.start(ctx.currentTime);
    this.playing = true;
    this.musicSfxDuck = 0;
  }

  /**
   * Briefly duck music when loud gameplay SFX play (`AudioSystem` calls this).
   * Recovers via exponential decay in `update()`.
   */
  notifyGameplaySfxImpulse(strength: number): void {
    if (!this.playing || this.fadingOut) return;
    const s = Math.max(0, Math.min(1, strength));
    this.musicSfxDuck = Math.min(1, this.musicSfxDuck + s);
  }

  stop(): void {
    if (!this.playing) return;
    this.teardownAudioGraph();
    // Reset narrative/musical state — run ended, next `start()` should begin
    // the melody fresh. This is the difference between stop() and the
    // closed-ctx rebuild path in update(), which preserves Conductor mood.
    this.conductor = new Conductor();
    this.scheduler.reset();
    this.musicSfxDuck = 0;
  }

  /** Tears down audio graph + layers without wiping the Conductor/Scheduler. */
  private teardownAudioGraph(): void {
    this.stopRafLoop();
    this.drone.stop();
    this.piano.stop();
    this.percussion.stop();
    this.disconnectGraph();
    this.playing = false;
    this.fadingOut = false;
  }

  fadeOut(ms: number): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    const fadeEnd = t + ms / 1000;
    this.masterGain.gain.linearRampToValueAtTime(0, fadeEnd);
    // Mark fading so update() won't counter-ramp on its per-frame pass.
    this.fadingOut = true;
    // Use AudioContext time + a self-owned rAF loop so fade-stop persists
    // across Phaser scene transitions (audio domain sits above scene domain).
    this.fadeStopAtTimeSec = fadeEnd + 0.1;
    this.startRafLoop();
  }

  playResolution(): void {
    if (!this.playing) return;
    this.conductor.enterResolution();
    this.resolutionPolling = true;
    this.startRafLoop();
  }

  update(delta: number, state: GameMusicState): void {
    if (!this.playing || !this.ctx) return;

    // Ctx was closed out from under us (browser aggressive audio lifecycle,
    // dev-tools close, etc.). Rebuild the graph against a fresh ctx — otherwise
    // the engine silently stays wired to a dead context. Tear down ONLY the
    // audio graph (not the Conductor) so accumulated mood state survives the
    // transparent reconnect — otherwise a mid-boss ctx reset would jarringly
    // reset intensity/danger/triumph to zero.
    if (this.ctx.state === 'closed') {
      this.teardownAudioGraph();
      this.start();
      if (!this.ctx) return;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    this.conductor.updateMood(delta, state);
    const mood = this.conductor.getMood();

    {
      const tau = MOTION_TIMING.musicSfxDuckRecoverMs;
      const a = 1 - Math.exp(-delta / tau);
      this.musicSfxDuck += (0 - this.musicSfxDuck) * Math.min(1, a);
    }

    this.drone.applyMood(this.ctx, mood.intensity, mood.danger, mood.triumph);

    if (this.masterFilter) {
      const freq = 3500 + mood.intensity * 2000;
      this.masterFilter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1);
    }

    if (this.masterGain && this.enabled && !this.fadingOut) {
      const duckMul = 1 - this.musicSfxDuck;
      const vol = (0.20 + mood.intensity * 0.10) * this.userMusicVolume * duckMul;
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
    }

    if (this.fogFeedback && this.fogDelay) {
      let feedback = 0.35;
      if (mood.danger > 0.2) feedback += mood.danger * 0.2;
      if (mood.chaos > 0.3) feedback -= mood.chaos * 0.1;
      feedback = Math.min(0.65, Math.max(0.1, feedback));
      this.fogFeedback.gain.linearRampToValueAtTime(feedback, this.ctx.currentTime + 1);

      const delayTime = 2.0 - mood.intensity * 1.0;
      this.fogDelay.delayTime.linearRampToValueAtTime(delayTime, this.ctx.currentTime + 1);
    }

    this.rhythmBPM = 90 + mood.intensity * 50;
    const rhythmDensity = mood.danger > 0.5
      ? 0.1 + (1 - mood.danger) * 0.3
      : mood.intensity;
    this.percussion.updatePattern(rhythmDensity);

    // Skip scheduling when muted — gain is 0, so note allocations are pure
    // GC churn. Conductor mood keeps advancing so a later unmute picks up
    // the current game state cleanly.
    if (!this.enabled) return;
    this.scheduler.tick(this.ctx.currentTime);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.masterGain && this.ctx) {
      // Cancel + re-anchor before the ramp, matching applyUserVolume. Without
      // this, the very next update() tick issues its own ramp to a different
      // target within the same automation quantum and the two ramps race —
      // causing a click or the wrong unmute volume depending on frame timing.
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(
        on ? 0.25 * this.userMusicVolume : 0,
        t + 0.3
      );
    }
  }

  /** Air-gapped prefs — scales dynamic music level. */
  applyUserVolume(masterVolume: number, musicVolume: number): void {
    this.userMusicVolume = Math.max(0, Math.min(1, masterVolume)) * Math.max(0, Math.min(1, musicVolume));
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      const target = this.enabled ? 0.25 * this.userMusicVolume : 0;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(target, t + 0.15);
    }
  }

  isPlaying(): boolean { return this.playing; }

  private startRafLoop(): void {
    if (this.rafId !== null) return;
    const requestFrame: (cb: FrameRequestCallback) => number | ReturnType<typeof setTimeout> =
      typeof globalThis.requestAnimationFrame === 'function'
        ? (cb) => globalThis.requestAnimationFrame(cb)
        : (cb) => setTimeout(() => cb(performance.now()), 16);
    this.cancelFrame =
      typeof globalThis.cancelAnimationFrame === 'function'
        ? (id) => globalThis.cancelAnimationFrame(id as number)
        : (id) => clearTimeout(id as ReturnType<typeof setTimeout>);

    const loop = () => {
      this.rafId = requestFrame(loop as unknown as FrameRequestCallback);
      this.tickRaf();
    };
    this.rafId = requestFrame(loop as unknown as FrameRequestCallback);
  }

  private stopRafLoop(): void {
    if (this.rafId !== null) {
      this.cancelFrame?.(this.rafId);
      this.rafId = null;
    }
    this.cancelFrame = null;
    this.fadeStopAtTimeSec = null;
    this.resolutionPolling = false;
  }

  private tickRaf(): void {
    if (!this.playing) return;

    // Resolution polling (independent of Phaser scene lifecycle)
    if (this.resolutionPolling) {
      if (this.conductor.isResolutionComplete()) {
        this.resolutionPolling = false;
        this.fadeOut(3000);
        return;
      }
    }

    // Fade stop (independent of Phaser scene lifecycle)
    if (this.fadeStopAtTimeSec !== null && this.ctx) {
      if (this.ctx.currentTime >= this.fadeStopAtTimeSec) {
        this.fadeStopAtTimeSec = null;
        this.stop();
      }
    }

    // If nothing needs rAF, stop the loop to avoid overhead.
    if (!this.resolutionPolling && this.fadeStopAtTimeSec === null) {
      this.stopRafLoop();
    }
  }

  private buildFogDelay(ctx: AudioContext): AudioNode {
    // Multi-tap reverb: instead of one long delay with feedback (which creates
    // obvious "echo echo echo"), use several short delays at prime-number
    // intervals. The overlapping taps create a diffuse wash — like a room, not a canyon.
    const pianoSend = ctx.createGain();
    pianoSend.gain.value = 1.0;
    pianoSend.connect(this.masterFilter!); // dry signal

    // Reverb bus: multiple delays mixed together
    this.reverbMix = ctx.createGain();
    this.reverbMix.gain.value = 0.35;
    this.reverbMix.connect(this.masterFilter!);

    // Tap 1: short early reflection
    this.tap1 = ctx.createDelay(1);
    this.tap1.delayTime.value = 0.11;
    this.tap1Gain = ctx.createGain();
    this.tap1Gain.gain.value = 0.4;

    // Tap 2: medium reflection
    this.tap2 = ctx.createDelay(1);
    this.tap2.delayTime.value = 0.27;
    this.tap2Gain = ctx.createGain();
    this.tap2Gain.gain.value = 0.3;

    // Tap 3: late reflection with feedback for tail
    this.fogDelay = ctx.createDelay(2);
    this.fogDelay.delayTime.value = 0.53;

    this.fogFilter = ctx.createBiquadFilter();
    this.fogFilter.type = 'lowpass';
    this.fogFilter.frequency.value = 1800;

    this.fogFeedback = ctx.createGain();
    this.fogFeedback.gain.value = 0.35;

    // Wire taps
    pianoSend.connect(this.tap1);
    this.tap1.connect(this.tap1Gain);
    this.tap1Gain.connect(this.reverbMix);

    pianoSend.connect(this.tap2);
    this.tap2.connect(this.tap2Gain);
    this.tap2Gain.connect(this.reverbMix);

    pianoSend.connect(this.fogDelay);
    this.fogDelay.connect(this.fogFilter);
    this.fogFilter.connect(this.fogFeedback);
    this.fogFeedback.connect(this.fogDelay); // feedback loop on tap 3 only
    this.fogDelay.connect(this.reverbMix);

    return pianoSend;
  }

  private disconnectGraph(): void {
    try {
      this.tap1?.disconnect();
      this.tap2?.disconnect();
      this.tap1Gain?.disconnect();
      this.tap2Gain?.disconnect();
      this.reverbMix?.disconnect();
      this.masterFilter?.disconnect();
      this.masterGain?.disconnect();
      this.fogDelay?.disconnect();
      this.fogFilter?.disconnect();
      this.fogFeedback?.disconnect();
      this.pianoSendGain?.disconnect();
    } catch { /* already disconnected */ }
    this.tap1 = this.tap2 = null;
    this.tap1Gain = this.tap2Gain = this.reverbMix = null;
    this.pianoSendGain = null;
    this.masterFilter = null;
    this.masterGain = null;
    this.fogDelay = null;
    this.fogFilter = null;
    this.fogFeedback = null;
  }
}

export const musicEngine = new ProceduralMusicEngine();
