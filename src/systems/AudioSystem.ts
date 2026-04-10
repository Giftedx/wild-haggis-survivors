/**
 * AudioSystem — procedurally generated sound effects using Web Audio API.
 * Zero external audio files needed. All sounds are synthesized at runtime.
 *
 * Each sound function creates a short-lived oscillator/noise with
 * precise envelope shaping. Pitch is slightly randomized per call
 * to prevent repetition fatigue.
 */
import { getAudioContext, getOutputNode } from './audioContext';

const BASE_SFX_GAIN = 0.3;

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  /** masterVolume × sfxVolume from SettingsManager */
  private sfxGainMultiplier: number = 1;

  constructor() {
    // AudioContext requires user interaction to start on most browsers
    // We'll create it lazily on first sound
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const ctx = getAudioContext();
    if (!ctx) return null;
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = BASE_SFX_GAIN * this.sfxGainMultiplier * (this.enabled ? 1 : 0);
    const output = getOutputNode();
    if (output) {
      this.masterGain.connect(output);
    } else {
      this.masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.refreshOutputGain();
  }

  /** Air-gapped prefs — does not touch meta save. */
  applyFromSettings(masterVolume: number, sfxVolume: number): void {
    this.sfxGainMultiplier = Math.max(0, Math.min(1, masterVolume)) * Math.max(0, Math.min(1, sfxVolume));
    this.refreshOutputGain();
  }

  private refreshOutputGain(): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = BASE_SFX_GAIN * this.sfxGainMultiplier * (this.enabled ? 1 : 0);
  }

  /** Throttle: max one hit sound per 50ms to prevent audio spam from AoE weapons */
  private lastHitTime: number = 0;

  /** Enemy hit — short noise burst with quick decay */
  playHit(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Throttle — AoE weapons can deal 10+ hits per frame
    const t = ctx.currentTime;
    if (t - this.lastHitTime < 0.05) return;
    this.lastHitTime = t;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 200 + Math.random() * 100;
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Throttle: max one kill sound per 30ms to prevent audio spam from AoE kills */
  private lastKillTime: number = 0;

  /** Enemy killed — satisfying "pop" */
  playKill(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    if (t - this.lastKillTime < 0.03) return;
    this.lastKillTime = t;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 400 + Math.random() * 200;
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Throttle: max one collect sound per 40ms to prevent audio spam from gem vacuum */
  private lastCollectTime: number = 0;

  /** XP gem collected — tiny ascending blip */
  playXPCollect(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    if (t - this.lastCollectTime < 0.04) return;
    this.lastCollectTime = t;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 800 + Math.random() * 400;
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 200, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Level up — ascending three-note arpeggio */
  playLevelUp(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const notes = [523, 659, 784]; // C5, E5, G5
    const t = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = t + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  /** Player takes damage — low thud */
  playPlayerHit(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 80;
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Boss warning — ominous rising tone */
  playBossWarning(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.8);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.0);
  }

  /** Player death — descending wah-wah */
  playDeath(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const notes = [400, 350, 280, 200];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const start = t + i * 0.2;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /** Throttle: max one shoot sound per 100ms to prevent spam from multi-weapon fire */
  private lastShootTime: number = 0;

  /** Weapon fire — quick zap */
  playShoot(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    if (t - this.lastShootTime < 0.1) return;
    this.lastShootTime = t;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 600 + Math.random() * 200;
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Menu button click */
  playClick(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 700;

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

/** Singleton instance shared across all scenes */
export const audio = new AudioSystem();
