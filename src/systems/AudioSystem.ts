/**
 * AudioSystem — procedurally generated sound effects using Web Audio API.
 * Zero external audio files needed. All sounds are synthesized at runtime.
 *
 * Gameplay scenes should prefer `scene.getSFXManager().tryPlay(key, () => audio.play*Immediate())`
 * so concurrency is visible on ISceneContext. Menu code may call `playClick()` / gated helpers directly.
 * Oscillator detune spreads identical clips slightly to reduce phasing.
 */
import { MOTION_TIMING } from '../core/motionTiming';
import type { EliteAffixId } from '../data/eliteAffixes';
import { getAudioContext, getOutputNode, runWhenAudioActivated } from './audioContext';
import { sfxManager } from './audio/SFXManager';
import { musicEngine } from './music/ProceduralMusicEngine';
import { clamp01 } from '../utils/math';

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
  /** Web Audio is gated on first user gesture — retry wiring once it unlocks. */
  private awaitingAudioActivation = false;
  private ambientRetryScheduled = false;

  constructor() {
    // AudioContext is created after the first user gesture (see audioContext.ts).
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const ctx = getAudioContext();
    if (!ctx) {
      if (!this.awaitingAudioActivation) {
        this.awaitingAudioActivation = true;
        runWhenAudioActivated(() => {
          this.awaitingAudioActivation = false;
          void this.ensureContext();
        });
      }
      return null;
    }
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = BASE_SFX_GAIN * this.sfxGainMultiplier * (this.enabled ? 1 : 0);
    const output = getOutputNode();
    if (output) {
      this.masterGain.connect(output);
    } else {
      this.masterGain.connect(ctx.destination);
    }
    this.awaitingAudioActivation = false;
    return ctx;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.refreshOutputGain();
  }

  /** Air-gapped prefs — does not touch meta save. */
  applyFromSettings(masterVolume: number, sfxVolume: number): void {
    this.sfxGainMultiplier = clamp01(masterVolume) * clamp01(sfxVolume);
    this.refreshOutputGain();
    if (this.ambientGain) {
      const ctx = this.ctx;
      if (ctx) this.ambientGain.gain.setValueAtTime(0.08 * this.sfxGainMultiplier, ctx.currentTime);
    }
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

  /** Short trait-specific chirp when a gold elite receives an affix. */
  playEliteAffixSpawnImmediate(affixId: EliteAffixId): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckLevelUp);

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const presets: Record<EliteAffixId, { f0: number; f1: number; type: OscillatorType; dur: number }> = {
      swift: { f0: 520, f1: 1240, type: 'sine', dur: 0.1 },
      bulwark: { f0: 110, f1: 95, type: 'sine', dur: 0.14 },
      relentless: { f0: 180, f1: 140, type: 'square', dur: 0.1 },
      wealthy: { f0: 740, f1: 990, type: 'triangle', dur: 0.1 },
      volatile: { f0: 420, f1: 70, type: 'sawtooth', dur: 0.12 },
    };
    const p = presets[affixId];
    osc.type = p.type;
    applySfxDetune(osc);
    osc.frequency.setValueAtTime(p.f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.f1), t0 + p.dur);

    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + p.dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + p.dur + 0.02);
  }

  playEliteAffixSpawn(affixId: EliteAffixId): void {
    this.gatedSfx('elite_affix_spawn', () => this.playEliteAffixSpawnImmediate(affixId));
  }

  /** Volatile affix death — low boom + crack; GameScene skips generic kill SFX for this affix. */
  playEliteVolatileDeathImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckKill * 0.42);

    const t0 = ctx.currentTime;
    const dur = 0.22;

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sawtooth';
    applySfxDetune(body);
    body.frequency.setValueAtTime(140, t0);
    body.frequency.exponentialRampToValueAtTime(45, t0 + dur);
    bodyGain.gain.setValueAtTime(0.14, t0);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    body.connect(bodyGain);
    bodyGain.connect(this.masterGain);
    body.start(t0);
    body.stop(t0 + dur + 0.02);

    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(2200, t0);
    crack.frequency.exponentialRampToValueAtTime(400, t0 + 0.05);
    crackGain.gain.setValueAtTime(0.06, t0);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    crack.connect(crackGain);
    crackGain.connect(this.masterGain);
    crack.start(t0);
    crack.stop(t0 + 0.09);
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

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  playXPCollect(): void {
    this.gatedSfx('xp_pickup', () => this.playXPCollectImmediate());
  }

  /**
   * Moor moment hearth beat — warm fifth (D4→A4) with soft bloom; distinct from
   * level-up arpeggio and shop ding.
   */
  playMoorMomentImmediate(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckMoorMoment);

    const t0 = ctx.currentTime;
    const notes = [
      { freq: 293.66, start: 0 },
      { freq: 440, start: 0.09 },
    ];
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      applySfxDetune(osc);
      osc.frequency.value = note.freq;
      const start = t0 + note.start;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.34);
    }
  }

  playMoorMoment(): void {
    this.gatedSfx('moor_moment', () => this.playMoorMomentImmediate());
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

  /** Short descending growl for boss enrage — sawtooth, darker than warning. */
  playBossEnrage(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    applySfxDetune(osc);
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.25);

    gain.gain.setValueAtTime(0.18, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.3);

    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckBoss * 0.5);
  }

  /** Ascending tone for elite chain kills — pitch rises with count. */
  playEliteChain(count: number): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;

    const baseFreq = 440 + (count - 1) * 220;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    applySfxDetune(osc);
    osc.frequency.setValueAtTime(baseFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t0 + 0.12);

    gain.gain.setValueAtTime(0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.2);
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

    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  playShoot(): void {
    this.gatedSfx('shoot', () => this.playShootImmediate());
  }

  /**
   * Ceilidh Chain pulse — bright two-note lift (G4 → D5) that lands
   * with the every-8th-kill magnet flare. Short and peppy to not
   * compete with the combo toast that fires on the same frame.
   */
  playCeilidhPulse(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;
    const notes = [
      { freq: 392, start: 0 },    // G4
      { freq: 587, start: 0.07 }, // D5
    ];
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      applySfxDetune(osc);
      osc.frequency.value = note.freq;
      const start = t0 + note.start;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.24);
    }
  }

  /**
   * Standing Stones boon grant — three-note rising bell triad
   * (A3, E4, A4) with long release. Fires on pick so it doesn't
   * stack with the 5:00 announce toast.
   */
  playStoneGrant(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(MOTION_TIMING.musicDuckAchievement);
    const t0 = ctx.currentTime;
    const notes = [
      { freq: 220, start: 0 },    // A3
      { freq: 329.63, start: 0.1 }, // E4
      { freq: 440, start: 0.2 }, // A4
    ];
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      applySfxDetune(osc);
      osc.frequency.value = note.freq;
      const start = t0 + note.start;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.72);
    }
  }

  /**
   * Ancestral Echo touch — ghostly detuned pair with a falling pitch
   * sweep. Soft and airy; the ghost dissipates as the note decays.
   */
  playEchoTouch(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;
    // Two detuned sines, each sweeping from ~A4 down to ~E4 over 500ms
    for (let d = 0; d < 2; d++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.detune.value = d === 0 ? -12 : 12;
      osc.frequency.setValueAtTime(440, t0);
      osc.frequency.exponentialRampToValueAtTime(329.63, t0 + 0.5);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.11, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.56);
    }
  }

  /**
   * Burn Leap whoosh — fast upward filter sweep on a noisy saw pair,
   * tuned to read as "air-rush on a quick hop" rather than "dash".
   * No music duck — the leap fires often enough that ducking would
   * chop the procedural pad under every gesture.
   */
  playBurnLeap(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;
    // Two detuned sawtooths swept from ~220 Hz up to ~660 Hz over 180 ms
    // — the upward glide mirrors the visual cyan flare.
    for (let d = 0; d < 2; d++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.detune.value = d === 0 ? -14 : 14;
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.18);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.10, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    }
  }

  /** Rising tone per card slot — creates anticipation as cards fan out.
   *  Index 0/1/2 maps to ascending G4/B4/D5 pitches. */
  playCardReveal(index: number): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const freqs = [392.0, 493.88, 587.33]; // G4, B4, D5
    const freq = freqs[Math.min(index, freqs.length - 1)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    applySfxDetune(osc);
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
    this.duckMusicForGameplaySfx(0.15);
  }

  /** Dramatic ascending arpeggio for legendary weapon evolution selection. */
  playLegendarySelect(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const freqs = [293.66, 369.99, 440.0, 587.33, 739.99]; // D major ascending
    const offsets = [0, 0.06, 0.12, 0.2, 0.3];
    const vols = [0.14, 0.14, 0.14, 0.16, 0.12];

    for (let i = 0; i < freqs.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      applySfxDetune(osc);
      osc.frequency.value = freqs[i];
      gain.gain.setValueAtTime(vols[i], t + offsets[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offsets[i] + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + offsets[i]);
      osc.stop(t + offsets[i] + 0.25);
    }
    this.duckMusicForGameplaySfx(0.35);
  }

  /**
   * Warm confirmation tone for selecting a passive/boon in the level-up
   * flow. Two-note ascending sine (D5→A5) with soft attack, 200ms total.
   */
  playBoonSelect(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.duckMusicForGameplaySfx(0.06);

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    gain.connect(this.masterGain);

    // D5
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(587.3, now);
    o1.connect(gain);
    o1.start(now);
    o1.stop(now + 0.1);

    // A5 (delayed 80ms)
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(880, now + 0.08);
    o2.connect(gain);
    o2.start(now + 0.08);
    o2.stop(now + 0.2);
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
    if (!ctx || !this.masterGain) {
      if (!this.ambientRetryScheduled) {
        this.ambientRetryScheduled = true;
        runWhenAudioActivated(() => {
          this.ambientRetryScheduled = false;
          this.startAmbientWind();
        });
      }
      return;
    }

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
    gain.gain.linearRampToValueAtTime(0.08 * this.sfxGainMultiplier, ctx.currentTime + 1.5);

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
