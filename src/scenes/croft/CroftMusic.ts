/**
 * H1 T6 — CroftAmbientLoop.
 *
 * Warm pibroch-soft ambient pad for CroftScene. Sits underneath Gran's
 * banter and the hearth crackle SFX. Two detuned triangles for body,
 * one higher sine for "open fifth" Highland air, and a very slow LFO
 * breathing gain so the room feels lit rather than static.
 *
 * Shares the output compressor with SFX and the procedural engine via
 * `getOutputNode()`. Deliberately *lower* MAX_VOL than `ShopAmbientLoop`
 * because CroftScene is where the player lingers between runs — the
 * bed can't fatigue.
 *
 * Web Audio is unavailable under the vitest node env; `start()`,
 * `stop()`, `applyVolume()` all no-op gracefully when the AudioContext
 * is missing. Structural constants are the testable surface.
 */
import { getAudioContext, getOutputNode } from '../../systems/audioContext';

export class CroftAmbientLoop {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private fifth: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private playing = false;

  /** A3 — warm mid-register tonic, kinder on the ear than D3. */
  static readonly BASE_FREQ = 220.0;
  /** Open fifth (E4) — Highland air feel without committing to major/minor. */
  static readonly FIFTH_FREQ = 329.63;
  /** Detune width between paired triangles (chorus warmth). */
  static readonly DETUNE_HZ = 0.6;
  /** Very slow LFO — under half a breath cycle per second so the room "lives". */
  static readonly LFO_RATE = 0.12;
  /** Peak volume — deliberately quieter than ShopAmbientLoop; the player dwells here. */
  static readonly MAX_VOL = 0.055;
  /** Target fade-in seconds on start() so entering the croft doesn't "thunk". */
  static readonly FADE_IN_SEC = 1.6;
  /** Target fade-out seconds on stop(). */
  static readonly FADE_OUT_SEC = 0.8;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    const output = getOutputNode();
    if (!ctx || !output) return;

    const now = ctx.currentTime;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(CroftAmbientLoop.MAX_VOL, now + CroftAmbientLoop.FADE_IN_SEC);
    this.masterGain.connect(output);

    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.value = CroftAmbientLoop.BASE_FREQ;

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = CroftAmbientLoop.BASE_FREQ + CroftAmbientLoop.DETUNE_HZ;

    this.fifth = ctx.createOscillator();
    this.fifth.type = 'sine';
    this.fifth.frequency.value = CroftAmbientLoop.FIFTH_FREQ;

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = CroftAmbientLoop.LFO_RATE;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = CroftAmbientLoop.MAX_VOL * 0.25;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.masterGain.gain);

    this.osc1.connect(this.masterGain);
    this.osc2.connect(this.masterGain);
    this.fifth.connect(this.masterGain);

    this.osc1.start(now);
    this.osc2.start(now);
    this.fifth.start(now);
    this.lfo.start(now);
    this.playing = true;
  }

  stop(): void {
    if (!this.playing) return;
    const ctx = getAudioContext();
    if (!ctx) {
      this.cleanup();
      return;
    }
    const now = ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + CroftAmbientLoop.FADE_OUT_SEC);
    }
    const stopAt = now + CroftAmbientLoop.FADE_OUT_SEC + 0.05;
    this.osc1?.stop(stopAt);
    this.osc2?.stop(stopAt);
    this.fifth?.stop(stopAt);
    this.lfo?.stop(stopAt);
    setTimeout(() => this.cleanup(), (CroftAmbientLoop.FADE_OUT_SEC + 0.1) * 1000);
    this.playing = false;
  }

  /**
   * Scale the ambient loop against the user's music-volume setting so
   * Settings changes take effect live (same pattern as ShopAmbientLoop).
   */
  applyVolume(musicVol: number, masterVol: number): void {
    if (!this.masterGain) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const effective = CroftAmbientLoop.MAX_VOL * musicVol * masterVol;
    this.masterGain.gain.setValueAtTime(effective, ctx.currentTime);
  }

  private cleanup(): void {
    this.osc1?.disconnect();
    this.osc2?.disconnect();
    this.fifth?.disconnect();
    this.lfo?.disconnect();
    this.lfoGain?.disconnect();
    this.masterGain?.disconnect();
    this.osc1 = this.osc2 = this.fifth = this.lfo = null;
    this.lfoGain = this.masterGain = null;
  }
}
