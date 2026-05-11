/**
 * ProceduralMusicEngine — "The Invisible Band"
 *
 * Public API for the game-state-reactive music system.
 * Wires the Conductor, Scheduler, and all layers into one audio graph.
 */

import { MOTION_TIMING } from '../../core/motionTiming';
import { globalEventBus } from '../../core/GlobalEventBus';
import { getAudioContext, getOutputNode, runWhenAudioActivated } from '../audioContext';
import { expApproach } from './musicMath';
import { clamp01 } from '../../utils/math';
import { AmbientBedLayer } from './AmbientBedLayer';
import { DroneLayer } from './DroneLayer';
import { PianoLayer } from './PianoLayer';
import { PercussionLayer } from './PercussionLayer';
import { NoteScheduler } from './NoteScheduler';
import { Conductor, GameMusicState } from './Conductor';
import {
  getActiveSeasonalEventKey,
} from '../SeasonalEventManager';
import {
  shouldConsiderBurnsPiperAccent,
} from '../seasonal/burnsNightEffects';
import { audio } from '../AudioSystem';
import { getSettingsManager } from '../../core/SettingsManager';

export type { GameMusicState };

class ProceduralMusicEngine {
  private ctx: AudioContext | null = null;
  private playing = false;
  private enabled = true;
  /** 0–1 user preference multiplier (SettingsManager.musicVolume × masterVolume). */
  private userMusicVolume = 1;

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

  private ambientBed = new AmbientBedLayer();
  private drone = new DroneLayer();
  private piano = new PianoLayer();
  private percussion = new PercussionLayer();

  private conductor = new Conductor();
  private scheduler = new NoteScheduler();

  private rhythmBPM = 90;
  private rafId: number | ReturnType<typeof setTimeout> | null = null;
  private cancelFrame: ((id: number | ReturnType<typeof setTimeout>) => void) | null = null;
  private fadeStopAtTimeSec: number | null = null;
  private resolutionPolling = false;
  /**
   * True between `fadeOut()` start and the scheduled stop. While set,
   * `update()` must NOT ramp masterGain back up — its per-frame ramp to a
   * positive volume would stomp the fade-to-zero curve on the automation
   * timeline and the fade would stall before reaching silence.
   */
  private fadingOut = false;
  /** Transient dip when heavy gameplay SFX fire (0 = no duck). */
  private musicSfxDuck = 0;
  /** Avoid stacking `runWhenAudioActivated` retries for `start()`. */
  private startRetryScheduled = false;

  /** Decaying bus-driven accents — merged into `GameMusicState` each frame. */
  private moorBloomAcc = 0;
  private evolutionGlowAcc = 0;
  private enragePressureAcc = 0;
  private busStarted = false;
  private busUnsubs: Array<() => void> = [];
  /** Throttle kill micro-accents — bosses are rare; elites can cluster. */
  private lastEliteAccentAtMs = 0;
  private lastBossDownAccentAtMs = 0;
  private lastMoorPianoFlourishAtMs = 0;
  /**
   * E1 M4 T21 — last tick (perf.now) a Burns Night piper accent
   * fired. Reset on `start()` so a stale timestamp from a prior
   * session never blocks the first accent after a reopen.
   */
  private lastBurnsPiperAccentAtMs = 0;
  private static readonly ELITE_KILL_ACCENT_COOLDOWN_MS = 3000;
  private static readonly BOSS_DOWN_ACCENT_COOLDOWN_MS = 12000;
  /** Pentatonic moor flourish — spaced so it never fights the SFX earcon. */
  private static readonly MOOR_PIANO_FLOURISH_COOLDOWN_MS = 8200;

  /**
   * Cross-attenuate so moor / evolution / enrage don’t mask each other in one breath.
   * Higher-impact gestures (enrage) pull harder against the others.
   */
  /**
   * E1 M4 T21 — fire a quiet piper accent through the AudioSystem
   * when a Burns Night cooldown window clears during combat-intensity
   * music. Pure helper handles the gate; RNG trims half the eligible
   * windows so the colour lands irregularly.
   */
  private maybeFireBurnsPiperAccent(intensity: number): void {
    const disabled = getSettingsManager().load().disableSeasonalEvents;
    const burnsActive = getActiveSeasonalEventKey(new Date(), disabled) === 'burns_night';
    const nowMs = performance.now();
    if (!shouldConsiderBurnsPiperAccent(nowMs, this.lastBurnsPiperAccentAtMs, intensity, burnsActive)) {
      return;
    }
    // Coin-flip on top of the gate: the accent is *eligible* every
    // cooldown window, but fires only ~50% of them (scaled up with
    // intensity so combat peaks still get the colour).
    const p = 0.5 + (intensity - 0.35) * 0.6;
    if (Math.random() >= Math.min(0.9, p)) {
      // Still mark the timestamp so we don't retry every frame; the
      // accent gets a fresh window on the next cooldown boundary.
      this.lastBurnsPiperAccentAtMs = nowMs;
      return;
    }
    this.lastBurnsPiperAccentAtMs = nowMs;
    audio.playBurnsPiperAccent();
  }

  private attenuateOthersForMoor(): void {
    this.evolutionGlowAcc *= 0.78;
    this.enragePressureAcc *= 0.72;
  }

  private addMoorBloom(delta: number): void {
    this.attenuateOthersForMoor();
    this.moorBloomAcc = Math.min(1, this.moorBloomAcc + delta);
  }

  private addEvolutionGlow(delta: number): void {
    this.moorBloomAcc *= 0.72;
    this.enragePressureAcc *= 0.82;
    this.evolutionGlowAcc = Math.min(1, this.evolutionGlowAcc + delta);
  }

  private addEnragePressure(delta: number): void {
    this.moorBloomAcc *= 0.62;
    this.evolutionGlowAcc *= 0.74;
    this.enragePressureAcc = Math.min(1, this.enragePressureAcc + delta);
  }

  /**
   * Subscribe to `globalEventBus` once (call from `BootScene` with analytics).
   * Moor moments, evolutions, and enrage add musical colour without coupling scenes.
   */
  ensureBusHandlersStarted(): void {
    if (this.busStarted) return;
    this.busStarted = true;
    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_MOOR_MOMENT', (p) => {
        if (!this.playing) return;
        const home = p.atHomeBiome ? 0.26 : 0;
        this.addMoorBloom(0.4 + home);
        const now = performance.now();
        const sinceLast =
          this.lastMoorPianoFlourishAtMs === 0
            ? Infinity
            : now - this.lastMoorPianoFlourishAtMs;
        if (
          this.ctx &&
          sinceLast >= ProceduralMusicEngine.MOOR_PIANO_FLOURISH_COOLDOWN_MS
        ) {
          this.lastMoorPianoFlourishAtMs = now;
          this.piano.playMoorFlourish(this.ctx.currentTime, Boolean(p.atHomeBiome));
        }
      }),
      globalEventBus.on('GLOBAL_WEAPON_EVOLVED', () => {
        if (!this.playing) return;
        this.addEvolutionGlow(0.55);
      }),
      globalEventBus.on('bossEnraged', () => {
        if (!this.playing) return;
        this.addEnragePressure(0.65);
        this.percussion.requestPhaseLockedNudge(3);
      }),
      globalEventBus.on('ACHIEVEMENT_UNLOCKED', () => {
        if (!this.playing) return;
        this.addEvolutionGlow(0.07);
      }),
      globalEventBus.on('TUTORIAL_COMPLETED', () => {
        if (!this.playing) return;
        this.addMoorBloom(0.045);
      }),
      globalEventBus.on('GLOBAL_RUN_ENDED', () => {
        if (!this.playing) return;
        this.percussion.clearPendingPhaseNudge();
      }),
      globalEventBus.on('GLOBAL_CURSE_STARTED', () => {
        if (!this.playing) return;
        this.playShimmer();
      }),
      globalEventBus.on('GLOBAL_ENEMY_KILLED', (p) => {
        if (!this.playing) return;
        const now = performance.now();
        if (p.wasBoss) {
          if (now - this.lastBossDownAccentAtMs < ProceduralMusicEngine.BOSS_DOWN_ACCENT_COOLDOWN_MS) {
            return;
          }
          this.lastBossDownAccentAtMs = now;
          this.addEvolutionGlow(0.09);
          return;
        }
        if (!p.wasElite) return;
        if (now - this.lastEliteAccentAtMs < ProceduralMusicEngine.ELITE_KILL_ACCENT_COOLDOWN_MS) {
          return;
        }
        this.lastEliteAccentAtMs = now;
        this.addEnragePressure(0.052);
      }),
    );
  }

  /**
   * Strip bus accents before a closure gesture — victory cadence or death fade —
   * so the score doesn’t argue with the ending.
   */
  private squashAccentsForCadence(kind: 'victory' | 'death'): void {
    if (kind === 'victory') {
      this.moorBloomAcc *= 0.1;
      this.evolutionGlowAcc *= 0.1;
      this.enragePressureAcc *= 0.06;
    } else {
      this.moorBloomAcc *= 0.05;
      this.evolutionGlowAcc *= 0.05;
      this.enragePressureAcc *= 0.05;
    }
  }

  private resetBusAccents(): void {
    this.moorBloomAcc = 0;
    this.evolutionGlowAcc = 0;
    this.enragePressureAcc = 0;
    this.lastEliteAccentAtMs = 0;
    this.lastBossDownAccentAtMs = 0;
    this.lastMoorPianoFlourishAtMs = 0;
  }

  start(): void {
    if (this.playing) { this.stop(); } // force-stop if still fading out from a prior run
    // E1 M4 T21 — zero the piper-accent timestamp so the first
    // accent can fire as soon as cooldown clears on the new run.
    this.lastBurnsPiperAccentAtMs = 0;
    const ctx = getAudioContext();
    if (!ctx) {
      if (!this.startRetryScheduled) {
        this.startRetryScheduled = true;
        runWhenAudioActivated(() => {
          this.startRetryScheduled = false;
          this.start();
        });
      }
      return;
    }
    this.ctx = ctx;

    if (ctx.state === 'suspended') void ctx.resume();

    // Dev `?quickplay` skips BootScene — still wire bus accents before the graph.
    this.ensureBusHandlersStarted();

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 3500; // open enough to hear piano warmth
    this.masterFilter.Q.value = 0.5;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 0.35 * this.userMusicVolume : 0;

    const output = getOutputNode();
    this.masterFilter.connect(this.masterGain);
    this.masterGain.connect(output ?? ctx.destination);

    this.pianoSendGain = this.buildFogDelay(ctx) as GainNode;

    this.drone.start(ctx, this.masterFilter);
    this.ambientBed.start(ctx, this.masterFilter);
    this.piano.start(ctx, this.pianoSendGain);
    this.percussion.start(ctx, this.masterFilter);

    this.scheduler.setMelodyCallback((time) => {
      const note = this.conductor.nextNote();
      if (note) {
        this.piano.playNote(note.freq, time, note.velocity, note.releaseSec);
      }
      return note?.intervalSec ?? 2.0;
    });

    this.scheduler.setRhythmCallback((time) => {
      const mood = this.conductor.getMood();
      this.percussion.scheduleRhythmHit(time, mood.intensity, mood.triumph * 0.15);
      return (60 / Math.max(30, this.rhythmBPM)) / 2;
    });

    this.scheduler.setHeartbeatCallback((time) => {
      const mood = this.conductor.getMood();
      this.percussion.scheduleHeartbeat(time, mood.chaos);
      return 60 / 72;
    });

    this.scheduler.start(ctx.currentTime);
    this.playing = true;
    this.musicSfxDuck = 0;
    this.resetBusAccents();
  }

  /**
   * Briefly duck music when loud gameplay SFX play (`AudioSystem` calls this).
   * Recovers via exponential decay in `update()`.
   */
  notifyGameplaySfxImpulse(strength: number): void {
    if (!this.playing || this.fadingOut) return;
    const s = clamp01(strength);
    this.musicSfxDuck = Math.min(1, this.musicSfxDuck + s);
  }

  stop(): void {
    if (!this.playing) return;
    this.teardownAudioGraph();
    // Reset narrative/musical state — run ended, next `start()` should begin
    // the melody fresh. This is the difference between stop() and the
    // closed-ctx rebuild path in update(), which preserves Conductor mood.
    this.conductor = new Conductor();
    this.scheduler.reset();
    this.musicSfxDuck = 0;
    this.resetBusAccents();
  }

  /** Tears down audio graph + layers without wiping the Conductor/Scheduler. */
  private teardownAudioGraph(): void {
    this.stopRafLoop();
    this.drone.stop();
    this.ambientBed.stop();
    this.piano.stop();
    this.percussion.stop();
    this.disconnectGraph();
    this.playing = false;
    this.fadingOut = false;
  }

  fadeOut(ms: number): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;
    this.squashAccentsForCadence('death');
    this.percussion.clearPendingPhaseNudge();
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    const fadeEnd = t + ms / 1000;
    this.masterGain.gain.linearRampToValueAtTime(0, fadeEnd);
    // Mark fading so update() won't counter-ramp on its per-frame pass.
    this.fadingOut = true;
    // Use AudioContext time + a self-owned rAF loop so fade-stop persists
    // across Phaser scene transitions (audio domain sits above scene domain).
    this.fadeStopAtTimeSec = fadeEnd + 0.1;
    this.startRafLoop();
  }

  playResolution(): void {
    if (!this.playing) return;
    this.squashAccentsForCadence('victory');
    this.conductor.enterResolution();
    this.resolutionPolling = true;
    this.startRafLoop();
  }

  update(delta: number, state: GameMusicState): void {
    if (!this.playing || !this.ctx) return;

    // Ctx was closed out from under us (browser aggressive audio lifecycle,
    // dev-tools close, etc.). Rebuild the graph against a fresh ctx — otherwise
    // the engine silently stays wired to a dead context. Tear down ONLY the
    // audio graph (not the Conductor) so accumulated mood state survives the
    // transparent reconnect — otherwise a mid-boss ctx reset would jarringly
    // reset intensity/danger/triumph to zero.
    if (this.ctx.state === 'closed') {
      this.teardownAudioGraph();
      this.start();
      if (!this.ctx) return;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const accDecayMul = this.fadingOut ? 2.6 : 1;
    this.moorBloomAcc = expApproach(this.moorBloomAcc, 0, delta * accDecayMul, 840);
    this.evolutionGlowAcc = expApproach(this.evolutionGlowAcc, 0, delta * accDecayMul, 1180);
    this.enragePressureAcc = expApproach(this.enragePressureAcc, 0, delta * accDecayMul, 700);

    const merged: GameMusicState = {
      ...state,
      moorBloom: this.moorBloomAcc,
      evolutionGlow: this.evolutionGlowAcc,
      enragePressure: this.enragePressureAcc,
    };
    this.conductor.updateMood(delta, merged);
    const mood = this.conductor.getMood();
    const moor = this.conductor.getSmoothedBiomeTimbre();

    this.musicSfxDuck = expApproach(
      this.musicSfxDuck,
      0,
      delta,
      MOTION_TIMING.musicSfxDuckRecoverMs,
    );

    const droneDanger = Math.min(1, mood.danger + this.enragePressureAcc * 0.36);
    // Wild Living World bridge — the smoothed living-world presence
    // axis gently lifts the drone's warmth target. Cap the additive
    // contribution at +0.08 so a fully-blooming run never overpowers
    // the danger/triumph mix. Replay determinism is unaffected: audio
    // mix is non-authoritative and the input is purely cosmetic state.
    const livingPresence = this.conductor.getSmoothedLivingWorldPresence();
    const droneTriumph = Math.min(1, mood.triumph + livingPresence * 0.08);
    this.drone.applyMood(this.ctx, mood.intensity, droneDanger, droneTriumph, 2.0, moor);
    // Wild Living World Phase 2 — smoothed hazardPressure axis pulls
    // the ambient bed slightly muddier + tighter when the moor fills
    // with traps. Cosmetic-only; replay determinism unaffected.
    const hazardPressure = this.conductor.getSmoothedHazardPressure();
    this.ambientBed.applyMood(
      this.ctx,
      moor,
      mood.buildDensity,
      mood.intensity,
      mood.danger,
      hazardPressure,
    );

    // E1 M4 T21 — Burns Night piper accent. Pure helper gates on
    // cooldown + intensity; a subsequent RNG roll adds the "might
    // not fire this window" feel so the pipes don't become a
    // metronome. `disableSeasonalEvents` collapses the gate by
    // returning `null` from `getActiveSeasonalEventKey`.
    this.maybeFireBurnsPiperAccent(mood.intensity);

    if (this.masterFilter) {
      const freq = 3500 + mood.intensity * 2000 + (moor - 0.5) * 950
        - this.musicSfxDuck * 260;
      this.masterFilter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1);
    }

    if (this.masterGain && this.enabled && !this.fadingOut) {
      const duckMul = 1 - this.musicSfxDuck;
      const vol = (0.28 + mood.intensity * 0.12) * this.userMusicVolume * duckMul;
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
    }

    if (this.fogFeedback && this.fogDelay) {
      let feedback = 0.35;
      if (mood.danger > 0.2) feedback += mood.danger * 0.2;
      if (mood.chaos > 0.3) feedback -= mood.chaos * 0.1;
      feedback -= this.moorBloomAcc * 0.11;
      feedback = Math.min(0.65, Math.max(0.1, feedback));
      this.fogFeedback.gain.linearRampToValueAtTime(feedback, this.ctx.currentTime + 1);

      // Deeper bog (low moor): slightly longer delay tail; bright heather: tighter.
      // Moor bloom opens acoustic space — longer fog tail, slightly clearer loop.
      // `createDelay(2)` caps delayTime at 2s — values above clamp in browsers and spam the console.
      const rawDelay = 2.0 - mood.intensity * 1.0 + (0.45 - moor) * 0.35
        + this.moorBloomAcc * 0.44;
      const delayTime = Math.min(1.999, Math.max(0.01, rawDelay));
      this.fogDelay.delayTime.linearRampToValueAtTime(delayTime, this.ctx.currentTime + 1);
    }

    this.rhythmBPM = Math.min(220, Math.max(30, 90 + mood.intensity * 50));
    const rhythmDensity = mood.danger > 0.5
      ? 0.1 + (1 - mood.danger) * 0.3
      : mood.intensity;
    this.percussion.updatePattern(rhythmDensity);

    // Skip scheduling when muted — gain is 0, so note allocations are pure
    // GC churn. Conductor mood keeps advancing so a later unmute picks up
    // the current game state cleanly.
    if (!this.enabled) return;
    this.scheduler.tick(this.ctx.currentTime);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.masterGain && this.ctx) {
      // Cancel + re-anchor before the ramp, matching applyUserVolume. Without
      // this, the very next update() tick issues its own ramp to a different
      // target within the same automation quantum and the two ramps race —
      // causing a click or the wrong unmute volume depending on frame timing.
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(
        on ? 0.35 * this.userMusicVolume : 0,
        t + 0.3
      );
    }
  }

  /** Air-gapped prefs — scales dynamic music level. */
  applyUserVolume(masterVolume: number, musicVolume: number): void {
    this.userMusicVolume = clamp01(masterVolume) * clamp01(musicVolume);
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      const target = this.enabled ? 0.35 * this.userMusicVolume : 0;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(target, t + 0.15);
    }
  }

  /** Short biome-entry accent — 2-note interval pitched to biome timbre. */
  playBiomeAccent(biomeTimbre: number): void {
    if (!this.ctx || !this.playing) return;
    this.piano.playBiomeAccent(this.ctx.currentTime, biomeTimbre);
  }

  /** Boss arrival fanfare — descending D minor through the piano. */
  playBossFanfare(): void {
    if (!this.ctx || !this.playing) return;
    this.piano.playBossFanfare(this.ctx.currentTime);
  }

  isPlaying(): boolean { return this.playing; }

  /**
   * R1 M4.5 P4 — quarter-note period in ms, derived from current
   * rhythm BPM. Consumed by bodhran_skin's per-hit damage modifier.
   * Returns 0 when the engine isn't playing (caller's pure fn treats
   * that as "no beat", so baseline damage).
   */
  getQuarterNotePeriodMs(): number {
    if (!this.playing) return 0;
    const bpm = Math.max(30, this.rhythmBPM);
    return 60000 / bpm;
  }

  /**
   * R1 M4.5 P4 — ms since the last quarter-note downbeat, derived
   * directly from the shared AudioContext clock. Phase is defined as
   * `(audioCtxTimeMs) mod period`, so the window stays stable without
   * tracking individual rhythm-callback events; `msSinceLastBeat` is
   * always in [0, period). Returns 0 when not playing.
   */
  getMsSinceLastQuarterNote(): number {
    if (!this.playing || !this.ctx) return 0;
    const bpm = Math.max(30, this.rhythmBPM);
    const periodMs = 60000 / bpm;
    const nowMs = this.ctx.currentTime * 1000;
    return ((nowMs % periodMs) + periodMs) % periodMs;
  }

  /**
   * Wild Living World Phase 2 — current quarter-note index derived
   * directly from the shared AudioContext clock. Same source-of-truth
   * as `getMsSinceLastQuarterNote` so callers compare apples to apples.
   *
   * Returns -1 when the engine isn't playing (caller's pure fn treats
   * negative as "no beat right now" → baseline damage; matches the
   * defensive guard in `applyPibrochHammerRhythm`).
   *
   * Pibroch Hammer reads this to land its every-fourth-beat crescendo.
   * Cosmetic-leaning: the index drives a damage multiplier but the
   * weapon still hits without it (audio muted → bonus disabled,
   * baseline damage preserved).
   */
  getQuarterNoteIndex(): number {
    if (!this.playing || !this.ctx) return -1;
    const bpm = Math.max(30, this.rhythmBPM);
    const periodMs = 60000 / bpm;
    const nowMs = this.ctx.currentTime * 1000;
    return Math.floor(nowMs / periodMs);
  }

  /**
   * Diagnostic — lookahead horizons (ms) for each scheduler layer relative to
   * the audio-context current time. Returns null when the engine is not
   * playing or the audio context isn't available. Consumed by DebugOverlay.
   */
  getSchedulerHorizonsMs(): { melody: number; rhythm: number; heartbeat: number } | null {
    if (!this.playing || !this.ctx) return null;
    const h = this.scheduler.getHorizons(this.ctx.currentTime);
    return {
      melody: h.melody * 1000,
      rhythm: h.rhythm * 1000,
      heartbeat: h.heartbeat * 1000,
    };
  }

  private playShimmer(): void {
    if (!this.ctx || !this.masterFilter) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Dissonant oscillator at tritone above drone base (unsettling)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 155.56; // Eb3 — tritone against A2 drone

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 8; // narrow = metallic ring

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterFilter!);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  private startRafLoop(): void {
    if (this.rafId !== null) return;
    const requestFrame: (cb: FrameRequestCallback) => number | ReturnType<typeof setTimeout> =
      typeof globalThis.requestAnimationFrame === 'function'
        ? (cb) => globalThis.requestAnimationFrame(cb)
        : (cb) => setTimeout(() => cb(performance.now()), 16);
    this.cancelFrame =
      typeof globalThis.cancelAnimationFrame === 'function'
        ? (id) => globalThis.cancelAnimationFrame(id as number)
        : (id) => clearTimeout(id as ReturnType<typeof setTimeout>);

    const loop = () => {
      this.rafId = requestFrame(loop as unknown as FrameRequestCallback);
      this.tickRaf();
    };
    this.rafId = requestFrame(loop as unknown as FrameRequestCallback);
  }

  private stopRafLoop(): void {
    if (this.rafId !== null) {
      this.cancelFrame?.(this.rafId);
      this.rafId = null;
    }
    this.cancelFrame = null;
    this.fadeStopAtTimeSec = null;
    this.resolutionPolling = false;
  }

  private tickRaf(): void {
    if (!this.playing) return;

    // Resolution polling (independent of Phaser scene lifecycle)
    if (this.resolutionPolling) {
      if (this.conductor.isResolutionComplete()) {
        this.resolutionPolling = false;
        this.fadeOut(3000);
        return;
      }
    }

    // Fade stop (independent of Phaser scene lifecycle)
    if (this.fadeStopAtTimeSec !== null && this.ctx) {
      if (this.ctx.currentTime >= this.fadeStopAtTimeSec) {
        this.fadeStopAtTimeSec = null;
        this.stop();
      }
    }

    // If nothing needs rAF, stop the loop to avoid overhead.
    if (!this.resolutionPolling && this.fadeStopAtTimeSec === null) {
      this.stopRafLoop();
    }
  }

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
