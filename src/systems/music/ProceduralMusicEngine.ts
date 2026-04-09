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

  private drone = new DroneLayer();
  private piano = new PianoLayer();
  private percussion = new PercussionLayer();

  private conductor = new Conductor();
  private scheduler = new NoteScheduler();

  private rhythmBPM = 90;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    if (ctx.state === 'suspended') ctx.resume();

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 2500;
    this.masterFilter.Q.value = 0.5;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 0.22 : 0;

    const output = getOutputNode();
    this.masterFilter.connect(this.masterGain);
    this.masterGain.connect(output ?? ctx.destination);

    const pianoOut = this.buildFogDelay(ctx);

    this.drone.start(ctx, this.masterFilter);
    this.piano.start(ctx, pianoOut);
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
    this.drone.stop();
    this.piano.stop();
    this.percussion.stop();
    this.disconnectGraph();
    if (this.ctx) this.ctx.suspend();
    this.playing = false;
    this.conductor = new Conductor();
    this.scheduler.reset();
  }

  fadeOut(ms: number): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
    setTimeout(() => this.stop(), ms + 100);
  }

  playResolution(): void {
    if (!this.playing) return;
    this.conductor.enterResolution();
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

    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.conductor.updateMood(delta, state);
    const mood = this.conductor.getMood();

    this.drone.applyMood(this.ctx, mood.intensity, mood.danger, mood.triumph);

    if (this.masterFilter) {
      const freq = 2500 + mood.intensity * 2500;
      this.masterFilter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1);
    }

    if (this.masterGain && this.enabled) {
      const vol = 0.18 + mood.intensity * 0.10;
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
        on ? 0.22 : 0,
        this.ctx.currentTime + 0.3
      );
    }
  }

  isPlaying(): boolean { return this.playing; }

  private buildFogDelay(ctx: AudioContext): AudioNode {
    const pianoSend = ctx.createGain();
    pianoSend.gain.value = 1.0;
    pianoSend.connect(this.masterFilter!);

    this.fogDelay = ctx.createDelay(4);
    this.fogDelay.delayTime.value = 1.5;

    this.fogFilter = ctx.createBiquadFilter();
    this.fogFilter.type = 'lowpass';
    this.fogFilter.frequency.value = 1200;

    this.fogFeedback = ctx.createGain();
    this.fogFeedback.gain.value = 0.4;

    pianoSend.connect(this.fogDelay);
    this.fogDelay.connect(this.fogFilter);
    this.fogFilter.connect(this.fogFeedback);
    this.fogFeedback.connect(this.fogDelay);

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
