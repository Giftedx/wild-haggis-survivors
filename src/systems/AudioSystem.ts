/**
 * AudioSystem — procedurally generated sound effects using Web Audio API.
 * Zero external audio files needed. All sounds are synthesized at runtime.
 *
 * Gameplay scenes should prefer `scene.getSFXManager().tryPlay(key, () => audio.play*Immediate())`
 * so concurrency is visible on ISceneContext. Menu code may call `playClick()` / gated helpers directly.
 * Oscillator detune spreads identical clips slightly to reduce phasing.
 */
import { getAudioContext, getOutputNode } from './audioContext';
import { sfxManager } from './audio/SFXManager';
import { MOTION_TIMING } from './music/musicMath';
import { musicEngine } from './music/ProceduralMusicEngine';

const BASE_SFX_GAIN = 0.3;

/** Random detune in cents — keeps stacked identical SFX from comb-filtering. */
function applySfxDetune(osc: OscillatorNode): void {
  osc.detune.value = Math.random() * 200 - 100;
}

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

  private gatedSfx(key: string, play: () => void): void {
    if (!this.enabled) return;
    sfxManager.tryPlay(key, play);
  }

  /** Brief music duck during loud run SFX; `musicEngine` no-ops when not playing. */
  private duckMusicForGameplaySfx(strength: number): void {
    musicEngine.notifyGameplaySfxImpulse(strength);
  }

  /** Enemy hit — use inside `getSFXManager().tryPlay('hit', …)` from gameplay. */
  playHitImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    applySfxDetune(osc);
    osc.frequency.value = 200 + Math.random() * 100;
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Gated fallback when no scene / SFXManager routing. */
  playHit(): void {
    this.gatedSfx('hit', () => this.playHitImmediate());
  }

  playKillImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckKill);

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    applySfxDetune(osc);
    osc.frequency.value = 400 + Math.random() * 200;
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playKill(): void {
    this.gatedSfx('kill', () => this.playKillImmediate());
  }

  playXPCollectImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    applySfxDetune(osc);
    osc.frequency.value = 800 + Math.random() * 400;
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 200, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  playXPCollect(): void {
    this.gatedSfx('xp_pickup', () => this.playXPCollectImmediate());
  }

  /** Level up — ascending three-note arpeggio */
  playLevelUp(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckLevelUp);

    const notes = [523, 659, 784]; // C5, E5, G5
    const t = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      applySfxDetune(osc);
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

  /** Achievement unlocked — bright two-note perfect fifth with shimmer. */
  playAchievement(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckAchievement);

    const t0 = ctx.currentTime;
    // Two notes: C5 then G5, each with a pair of slightly detuned oscillators
    const notes = [
      { freq: 523, start: 0 },
      { freq: 784, start: 0.12 },
    ];

    for (const note of notes) {
      for (let d = 0; d < 2; d++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        osc.detune.value = d === 0 ? -8 : 8; // shimmer
        const start = t0 + note.start;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.35);
      }
    }
  }

  /** Shop / meta purchase — short bright ding (distinct from level-up arpeggio). */
  playPurchaseImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckPurchase);

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    applySfxDetune(osc);
    osc.frequency.setValueAtTime(660, t0);
    osc.frequency.exponentialRampToValueAtTime(990, t0 + 0.1);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.16, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  }

  playPurchase(): void {
    this.gatedSfx('purchase', () => this.playPurchaseImmediate());
  }

  /** Player takes damage — low thud */
  playPlayerHit(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckPlayerHit);

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    applySfxDetune(osc);
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
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckBoss);

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    applySfxDetune(osc);
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
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckDeath);

    const t = ctx.currentTime;
    const notes = [400, 350, 280, 200];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      applySfxDetune(osc);
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

  playShootImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    applySfxDetune(osc);
    osc.frequency.value = 600 + Math.random() * 200;
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  playShoot(): void {
    this.gatedSfx('shoot', () => this.playShootImmediate());
  }

  /** Menu button click */
  playClick(): void {
    this.gatedSfx('click', () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      applySfxDetune(osc);
      osc.frequency.value = 700;

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    });
  }
  // ── Ambient wind (menu/shop scenes) ──────────────────────────────

  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  /**
   * Start a gentle moor-wind ambient loop. Very quiet, filtered brown
   * noise that makes non-combat scenes feel alive without competing with
   * the procedural music engine (which runs during GameScene only).
   *
   * Safe to call multiple times — starts only once.
   */
  startAmbientWind(): void {
    if (this.ambientSource) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Generate a brown noise buffer (2 seconds, loopable)
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5; // scale for audibility
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Low-pass filter — only the deep rumble, no hiss
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 180;
    lpf.Q.value = 0.7;

    // Very quiet — ambient should be felt, not heard
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);

    source.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.ambientSource = source;
    this.ambientGain = gain;
  }

  /** Fade out and stop ambient wind. */
  stopAmbientWind(): void {
    if (!this.ambientSource || !this.ambientGain) return;
    const ctx = this.ctx;
    if (!ctx) return;

    const gain = this.ambientGain;
    const source = this.ambientSource;
    this.ambientSource = null;
    this.ambientGain = null;

    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
      gain.disconnect();
    }, 1000);
  }
}

/** Singleton instance shared across all scenes */
export const audio = new AudioSystem();
