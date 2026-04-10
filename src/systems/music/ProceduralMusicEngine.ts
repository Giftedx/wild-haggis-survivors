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
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private resolutionTimeouts: ReturnType<typeof setTimeout>[] = [];

  start(): void {
    if (this.playing) { this.stop(); } // force-stop if still fading out from a prior run
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    if (ctx.state === 'suspended') ctx.resume();

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 3500; // open enough to hear piano warmth
    this.masterFilter.Q.value = 0.5;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 0.25 : 0;

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
  }

  stop(): void {
    if (!this.playing) return;
    // Cancel any pending fade-out timeout so it doesn't kill a new run's music
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
    // Cancel any pending resolution polling timeouts
    for (const t of this.resolutionTimeouts) clearTimeout(t);
    this.resolutionTimeouts = [];
    this.drone.stop();
    this.piano.stop();
    this.percussion.stop();
    this.disconnectGraph();
    this.playing = false;
    this.conductor = new Conductor();
    this.scheduler.reset();
  }

  fadeOut(ms: number): void {
    // Clear any prior pending fade timeout so a second fadeOut call doesn't
    // lose its reference — otherwise the first setTimeout's stop() could
    // fire during or after the second fade, cutting it short.
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
    this.fadeTimeout = setTimeout(() => {
      this.fadeTimeout = null;
      this.stop();
    }, ms + 100);
  }

  playResolution(): void {
    if (!this.playing) return;
    this.conductor.enterResolution();
    const conductorRef = this.conductor; // capture reference to detect reset
    const checkDone = () => {
      if (!this.playing || this.conductor !== conductorRef) return; // stopped or reset
      if (this.conductor.isResolutionComplete()) {
        this.fadeOut(3000);
      } else {
        this.resolutionTimeouts.push(setTimeout(checkDone, 200));
      }
    };
    this.resolutionTimeouts.push(setTimeout(checkDone, 500));
  }

  update(delta: number, state: GameMusicState): void {
    if (!this.playing || !this.ctx) return;

    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.conductor.updateMood(delta, state);
    const mood = this.conductor.getMood();

    this.drone.applyMood(this.ctx, mood.intensity, mood.danger, mood.triumph);

    if (this.masterFilter) {
      const freq = 3500 + mood.intensity * 2000;
      this.masterFilter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1);
    }

    if (this.masterGain && this.enabled) {
      const vol = 0.20 + mood.intensity * 0.10;
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

    this.scheduler.tick(this.ctx.currentTime);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        on ? 0.25 : 0,
        this.ctx.currentTime + 0.3
      );
    }
  }

  isPlaying(): boolean { return this.playing; }

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
