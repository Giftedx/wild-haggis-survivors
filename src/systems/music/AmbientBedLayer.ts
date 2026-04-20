/**
 * AmbientBedLayer — biome-reactive harmonic pad.
 *
 * Two detuned triangle oscillators through a bandpass filter with slow
 * LFO breathing. Volume driven by buildDensity (richer build = louder
 * pad). Filter frequency shifts with biomeTimbre (bog=dark, heather=bright).
 * Thinned under danger.
 */
export class AmbientBedLayer {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private bandpass: BiquadFilterNode | null = null;

  private readonly BASE_FREQ = 146.83; // D3
  private readonly DETUNE_HZ = 0.8;

  start(ctx: AudioContext, output: AudioNode): void {
    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.value = this.BASE_FREQ;

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = this.BASE_FREQ + this.DETUNE_HZ;

    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.3; // slow breathing
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.03;

    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0; // silent until buildDensity rises

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 300;
    this.bandpass.Q.value = 1.5;

    // Wire: oscs → padGain → bandpass → output
    this.osc1.connect(this.padGain);
    this.osc2.connect(this.padGain);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.padGain.gain);
    this.padGain.connect(this.bandpass);
    this.bandpass.connect(output);

    this.osc1.start();
    this.osc2.start();
    this.lfo.start();
  }

  applyMood(
    ctx: AudioContext,
    biomeTimbre: number,
    buildDensity: number,
    intensity: number,
    danger: number,
    transitionSec: number = 2.0,
  ): void {
    if (!this.osc1 || !this.osc2 || !this.padGain || !this.bandpass) return;
    const t = ctx.currentTime + transitionSec;

    // Volume: buildDensity drives presence, attenuated by danger
    const vol = buildDensity * 0.10 * (1 - danger * 0.5) * (0.5 + intensity * 0.5);
    this.padGain.gain.linearRampToValueAtTime(Math.max(0, vol), t);

    // Filter: bog (timbre~0.15) = 200Hz dark, heather (timbre~0.8) = 550Hz bright
    const freq = 180 + biomeTimbre * 450;
    this.bandpass.frequency.linearRampToValueAtTime(freq, t);

    // Q: tighter under danger (more anxious, nasal)
    const q = 1.5 + danger * 2.5;
    this.bandpass.Q.linearRampToValueAtTime(q, t);

    // Pitch: slight drop in bog, slight rise in heather
    const pitchOffset = (biomeTimbre - 0.5) * 8;
    this.osc1.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset, t);
    this.osc2.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset + this.DETUNE_HZ, t);
  }

  stop(): void {
    try {
      this.osc1?.stop(); this.osc2?.stop(); this.lfo?.stop();
      this.osc1?.disconnect(); this.osc2?.disconnect();
      this.lfo?.disconnect(); this.lfoGain?.disconnect();
      this.padGain?.disconnect(); this.bandpass?.disconnect();
    } catch { /* already stopped */ }
    this.osc1 = this.osc2 = this.lfo = null;
    this.lfoGain = this.padGain = null;
    this.bandpass = null;
  }
}
