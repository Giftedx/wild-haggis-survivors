/**
 * ShopAmbientLoop — warm drone pad for the between-run shop.
 *
 * Two detuned triangle oscillators + a sub-bass sine, modulated by a slow
 * LFO. Deliberately subtle (MAX_VOL=0.08) — it sits underneath the ambient
 * wind noise already present in the shop, not above it.
 *
 * Connects to the shared compressor output node so it benefits from the
 * same dynamics limiting as SFX and the procedural music engine.
 */
import { getAudioContext, getOutputNode } from '../audioContext';

export class ShopAmbientLoop {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private sub: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private playing = false;

  static readonly BASE_FREQ = 146.83; // D3
  static readonly SUB_FREQ = 73.42;   // D2
  static readonly DETUNE_HZ = 0.7;
  static readonly LFO_RATE = 0.18;    // Very slow breathing
  static readonly MAX_VOL = 0.08;     // Subtle — underneath the wind

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    const output = getOutputNode();
    if (!ctx || !output) return;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain.connect(output);

    // Two detuned triangles for warmth
    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.value = ShopAmbientLoop.BASE_FREQ;

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = ShopAmbientLoop.BASE_FREQ + ShopAmbientLoop.DETUNE_HZ;

    // Sub-bass sine for depth
    this.sub = ctx.createOscillator();
    this.sub.type = 'sine';
    this.sub.frequency.value = ShopAmbientLoop.SUB_FREQ;

    // LFO on master gain — slow breathing
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = ShopAmbientLoop.LFO_RATE;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = ShopAmbientLoop.MAX_VOL * 0.3;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.masterGain.gain);

    this.osc1.connect(this.masterGain);
    this.osc2.connect(this.masterGain);
    this.sub.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.sub.start();
    this.lfo.start();

    // Fade in over 2s
    this.masterGain.gain.linearRampToValueAtTime(
      ShopAmbientLoop.MAX_VOL,
      ctx.currentTime + 2.0,
    );
    this.playing = true;
  }

  stop(): void {
    if (!this.playing) return;
    const ctx = getAudioContext();
    if (!ctx || !this.masterGain) {
      this.teardown();
      return;
    }
    this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => this.teardown(), 900);
  }

  private teardown(): void {
    try {
      this.osc1?.stop(); this.osc2?.stop();
      this.sub?.stop(); this.lfo?.stop();
    } catch { /* already stopped */ }
    this.osc1?.disconnect(); this.osc2?.disconnect();
    this.sub?.disconnect(); this.lfo?.disconnect();
    this.lfoGain?.disconnect(); this.masterGain?.disconnect();
    this.osc1 = this.osc2 = this.sub = this.lfo = null;
    this.lfoGain = this.masterGain = null;
    this.playing = false;
  }

  applyVolume(masterVol: number, musicVol: number): void {
    if (!this.masterGain) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const vol = ShopAmbientLoop.MAX_VOL * masterVol * musicVol;
    this.masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
  }
}
