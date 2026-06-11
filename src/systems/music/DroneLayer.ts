/**
 * Highland Pad — soft, evolving triangle-wave pad.
 *
 * NOT a buzzing bagpipe drone. A gentle harmonic wash that sits
 * underneath the piano, barely noticeable until intensity rises.
 * Starts SILENT and fades in as the game progresses.
 *
 * Two detuned triangle oscillators + a sub-octave sine for warmth,
 * through a lowpass filter. The detuning creates slow organic beating.
 */
import { clamp01 } from '../../utils/math';

export class DroneLayer {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private sub: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private subGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private readonly BASE_FREQ = 110; // A2

  start(ctx: AudioContext, output: AudioNode): void {
    // Main pad: two slightly detuned triangles for gentle chorusing
    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.value = this.BASE_FREQ;

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = this.BASE_FREQ + 0.8; // very slight detune

    // Sub-octave sine for low-end warmth
    this.sub = ctx.createOscillator();
    this.sub.type = 'sine';
    this.sub.frequency.value = this.BASE_FREQ / 2; // A1 = 55Hz

    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;

    // Pad mix — starts SILENT, fades in with intensity
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;

    // Gentle lowpass to keep it soft
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 400;
    this.filter.Q.value = 0.5;

    // Very slow LFO for gentle volume swell (breathing feel)
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.15; // one cycle every ~7 seconds
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.03;

    // Wire: oscs → padGain → filter → output
    this.osc1.connect(this.padGain);
    this.osc2.connect(this.padGain);
    this.sub.connect(this.subGain);
    this.subGain.connect(this.padGain);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.padGain.gain);
    this.padGain.connect(this.filter);
    this.filter.connect(output);

    this.osc1.start();
    this.osc2.start();
    this.sub.start();
    this.lfo.start();
  }

  applyMood(
    ctx: AudioContext,
    intensity: number,
    danger: number,
    triumph: number,
    transitionSec: number = 2.0,
    /** 0 = bog peat, 1 = heather brightness — widens pad breath. */
    biomeTimbre: number = 0.5
  ): void {
    if (!this.osc1 || !this.osc2 || !this.padGain || !this.filter || !this.subGain) return;
    const t = ctx.currentTime + transitionSec;
    const moor = clamp01(biomeTimbre);

    // Volume: silent at start, fades in as intensity grows
    // Only becomes noticeable after intensity > 0.15 (~3 minutes in)
    const vol = Math.max(0, (intensity - 0.15) * 0.25);
    this.padGain.gain.linearRampToValueAtTime(vol, t);

    // Sub bass: fades in with chaos for low-end rumble
    const subVol = Math.max(0, (intensity - 0.3) * 0.12);
    this.subGain.gain.linearRampToValueAtTime(subVol, t);

    // Filter opens slowly with intensity; open biomes get a little more air
    const freq = 400 + intensity * 600 + triumph * 400 + (moor - 0.5) * 220;
    this.filter.frequency.linearRampToValueAtTime(freq, t);

    // Danger: detune widens (dissonant), pitch drops
    const detune = 0.8 + danger * 6;
    this.osc2.frequency.linearRampToValueAtTime(this.BASE_FREQ + detune, t);

    const pitchDrop = danger * 8;
    this.osc1.frequency.linearRampToValueAtTime(this.BASE_FREQ - pitchDrop, t);

    // Pad “breathing” deepens with triumph and open biomes — still subliminal.
    if (this.lfoGain) {
      const lfoDepth = 0.022 + triumph * 0.028 + moor * 0.02 + intensity * 0.012;
      this.lfoGain.gain.linearRampToValueAtTime(
        Math.min(0.065, lfoDepth),
        t,
      );
    }
  }

  stop(): void {
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.sub?.stop();
      this.lfo?.stop();
      this.osc1?.disconnect();
      this.osc2?.disconnect();
      this.sub?.disconnect();
      this.subGain?.disconnect();
      this.lfo?.disconnect();
      this.lfoGain?.disconnect();
      this.padGain?.disconnect();
      this.filter?.disconnect();
    } catch { /* nodes may already be stopped */ }
    this.osc1 = this.osc2 = this.sub = this.lfo = null;
    this.lfoGain = this.subGain = this.padGain = null;
    this.filter = null;
  }
}
