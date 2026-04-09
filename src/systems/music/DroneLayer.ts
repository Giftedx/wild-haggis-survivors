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

  private readonly BASE_FREQ = 110;
  private readonly BASE_DETUNE = 1.5;
  private readonly BASE_BANDPASS = 500;
  private readonly BASE_VOLUME = 0.3;

  start(ctx: AudioContext, output: AudioNode): void {
    this.saw1 = ctx.createOscillator();
    this.saw1.type = 'sawtooth';
    this.saw1.frequency.value = this.BASE_FREQ;

    this.saw2 = ctx.createOscillator();
    this.saw2.type = 'sawtooth';
    this.saw2.frequency.value = this.BASE_FREQ + this.BASE_DETUNE;

    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 2.5;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.06;

    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = this.BASE_VOLUME;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = this.BASE_BANDPASS;
    this.bandpass.Q.value = 0.8;

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

  applyMood(
    ctx: AudioContext,
    intensity: number,
    danger: number,
    triumph: number,
    transitionSec: number = 1.0
  ): void {
    if (!this.saw1 || !this.saw2 || !this.bandpass || !this.droneGain || !this.lfo) return;
    const t = ctx.currentTime + transitionSec;

    const pitchOffset = -danger * 10;
    this.saw1.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset, t);

    const detune = this.BASE_DETUNE + danger * 7;
    this.saw2.frequency.linearRampToValueAtTime(this.BASE_FREQ + pitchOffset + detune, t);

    const bpFreq = this.BASE_BANDPASS + intensity * 900 + triumph * 500;
    this.bandpass.frequency.linearRampToValueAtTime(bpFreq, t);

    const vol = this.BASE_VOLUME + intensity * 0.04;
    this.droneGain.gain.linearRampToValueAtTime(vol, t);

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
