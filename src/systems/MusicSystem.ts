/**
 * MusicSystem — procedural Highland soundtrack using Web Audio API.
 *
 * Layers:
 * 1. Bass drone: A2 sawtooth with tremolo — the bagpipe chanter
 * 2. Fifth drone: E3 triangle — adds harmonic depth (bagpipe drone interval)
 * 3. Rhythm: Kick-like pulse on a 4/4 pattern using filtered noise
 * 4. Melody: A minor pentatonic phrases that follow 4-bar patterns
 * 5. Filter sweep: Low-pass filter that opens over time for tension
 *
 * Intensity scales with game time — starts sparse, builds to frantic.
 * Zero external audio files.
 */
export class MusicSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private playing: boolean = false;
  private intensity: number = 0;
  private melodyTimeout: ReturnType<typeof setTimeout> | null = null;
  private rhythmInterval: ReturnType<typeof setInterval> | null = null;
  private rhythmResyncTimeout: ReturnType<typeof setTimeout> | null = null;

  // Audio nodes
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private fifthOsc: OscillatorNode | null = null;
  private fifthGain: GainNode | null = null;
  private melodyOsc: OscillatorNode | null = null;
  private melodyGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  // A minor pentatonic across two octaves for richer melodies
  private readonly SCALE = [
    220, 261.6, 293.7, 329.6, 392,      // A3, C4, D4, E4, G4
    440, 523.3, 587.3, 659.3, 784,       // A4, C5, D5, E5, G5
  ];

  // Pre-composed melodic phrases (indices into SCALE)
  // Each phrase is 4 notes played in sequence
  private readonly PHRASES = [
    [0, 2, 4, 3],   // A C G E — ascending then drop
    [4, 3, 2, 0],   // G E D A — descending
    [0, 4, 5, 4],   // A G A' G — octave jump
    [2, 3, 4, 2],   // D E G D — rising and falling
    [5, 7, 6, 5],   // A' D' C' A' — high register phrase
    [0, 1, 2, 4],   // A C D G — gentle ascent
    [3, 2, 0, 4],   // E D A G — folk melody shape
  ];

  private currentPhraseIdx: number = 0;
  private noteInPhrase: number = 0;
  private bpm: number = 90;

  start(): void {
    if (this.playing) return;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContext();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      return;
    }

    // Disconnect any orphaned nodes from a previous start/stop cycle
    this.disconnectAll();

    // Master output with low-pass filter for warmth
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 800; // Starts muffled, opens over time
    this.filter.Q.value = 1;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.07;
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // === Layer 1: Bass drone (A2, sawtooth) ===
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.value = 110;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.25;

    // LFO tremolo on drone
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.frequency.value = 2.5;
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = 0.08;
    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(this.droneGain.gain);

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.filter);

    // === Layer 2: Fifth drone (E3, triangle) ===
    this.fifthOsc = this.ctx.createOscillator();
    this.fifthOsc.type = 'triangle';
    this.fifthOsc.frequency.value = 164.8; // E3 — perfect fifth above A2
    this.fifthGain = this.ctx.createGain();
    this.fifthGain.gain.value = 0.12;
    this.fifthOsc.connect(this.fifthGain);
    this.fifthGain.connect(this.filter);

    // === Layer 3: Melody oscillator ===
    this.melodyOsc = this.ctx.createOscillator();
    this.melodyOsc.type = 'sine';
    this.melodyOsc.frequency.value = this.SCALE[0];
    this.melodyGain = this.ctx.createGain();
    this.melodyGain.gain.value = 0;
    this.melodyOsc.connect(this.melodyGain);
    this.melodyGain.connect(this.filter);

    // Start oscillators
    this.droneOsc.start();
    this.lfoOsc.start();
    this.fifthOsc.start();
    this.melodyOsc.start();
    this.playing = true;

    // Start melody phrase sequencer
    this.currentPhraseIdx = 0;
    this.noteInPhrase = 0;
    this.scheduleNextNote();

    // Start rhythm layer
    this.startRhythm();
  }

  stop(): void {
    if (!this.playing || !this.ctx) return;

    this.droneOsc?.stop();
    this.lfoOsc?.stop();
    this.fifthOsc?.stop();
    this.melodyOsc?.stop();
    this.disconnectAll();
    // Suspend instead of close to allow reuse across runs
    this.ctx.suspend();
    this.playing = false;

    if (this.melodyTimeout !== null) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
    if (this.rhythmInterval !== null) {
      clearInterval(this.rhythmInterval);
      this.rhythmInterval = null;
    }
    if (this.rhythmResyncTimeout !== null) {
      clearTimeout(this.rhythmResyncTimeout);
      this.rhythmResyncTimeout = null;
    }
  }

  /** Call each frame to evolve the music over time */
  update(gameTimeSec: number): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;

    // Resume AudioContext if browser suspended it (mobile tab background)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.intensity = Math.min(1, gameTimeSec / 1200);

    // Master volume ramps up
    this.masterGain.gain.value = 0.06 + this.intensity * 0.07;

    // Filter opens — muffled at start, bright at peak
    if (this.filter) {
      this.filter.frequency.value = 800 + this.intensity * 3000;
    }

    // LFO speed increases — more frantic tremolo
    if (this.lfoOsc) {
      this.lfoOsc.frequency.value = 2.5 + this.intensity * 5;
    }

    // Drone pitch creeps up for tension
    if (this.droneOsc) {
      this.droneOsc.frequency.value = 110 + this.intensity * 15;
    }

    // Fifth follows
    if (this.fifthOsc) {
      this.fifthOsc.frequency.value = 164.8 + this.intensity * 22;
    }

    // BPM increases with intensity
    this.bpm = 90 + this.intensity * 50;
  }

  // === Melody sequencer ===

  private scheduleNextNote(): void {
    if (!this.playing || !this.ctx || !this.melodyOsc || !this.melodyGain) return;

    const phrase = this.PHRASES[this.currentPhraseIdx];
    const scaleIdx = phrase[this.noteInPhrase];
    const freq = this.SCALE[scaleIdx];
    const t = this.ctx.currentTime;

    // Note envelope: attack → sustain → decay
    this.melodyOsc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
    this.melodyGain.gain.cancelScheduledValues(t);
    this.melodyGain.gain.setValueAtTime(0, t);
    this.melodyGain.gain.linearRampToValueAtTime(0.15 + this.intensity * 0.05, t + 0.03);
    this.melodyGain.gain.linearRampToValueAtTime(0.08, t + 0.2);
    this.melodyGain.gain.linearRampToValueAtTime(0, t + 0.5);

    // Advance to next note in phrase
    this.noteInPhrase++;
    if (this.noteInPhrase >= phrase.length) {
      this.noteInPhrase = 0;
      // Pick next phrase — weighted toward adjacent phrases for musicality
      this.currentPhraseIdx = (this.currentPhraseIdx + 1 + Math.floor(Math.random() * 2)) % this.PHRASES.length;
    }

    // Schedule next note based on current BPM
    const beatMs = (60 / this.bpm) * 1000;
    // Vary timing slightly for human feel (+/- 5%)
    const humanize = beatMs * (0.95 + Math.random() * 0.1);
    this.melodyTimeout = setTimeout(() => this.scheduleNextNote(), humanize);
  }

  // === Rhythm layer (kick-like pulse) ===

  private startRhythm(): void {
    if (!this.ctx || !this.masterGain) return;

    let beatCount = 0;
    let lastBeatTime = performance.now();

    const playBeat = () => {
      if (!this.playing || !this.ctx || !this.masterGain) return;

      // Guard against burst playback after tab-return: skip if too many beats
      // would have fired since last actual beat (browser throttles background timers)
      const now = performance.now();
      const elapsed = now - lastBeatTime;
      const beatMs = (60 / this.bpm) * 1000 / 2;
      if (elapsed < beatMs * 0.5) return; // Too soon — leftover from throttled burst
      lastBeatTime = now;

      beatCount++;

      // Kick on beats 1 and 3 (4/4 time)
      const isKick = beatCount % 4 === 1 || beatCount % 4 === 3;

      if (isKick) {
        this.playKick();
      }
      if (beatCount % 2 === 0) {
        this.playHat();
      }
    };

    // Use setInterval synced to BPM — update interval when BPM changes
    const updateRhythm = () => {
      if (!this.playing) return;

      if (this.rhythmInterval !== null) {
        clearInterval(this.rhythmInterval);
      }

      const beatMs = (60 / this.bpm) * 1000 / 2; // 8th note subdivision
      this.rhythmInterval = setInterval(playBeat, beatMs);

      // Re-sync every 4 seconds to track BPM changes
      this.rhythmResyncTimeout = setTimeout(updateRhythm, 4000);
    };

    updateRhythm();
  }

  private playKick(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    const vol = 0.1 + this.intensity * 0.08;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.filter!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playHat(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Noise-like hi-hat using high-frequency oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 6000 + Math.random() * 2000;

    const vol = 0.02 + this.intensity * 0.02;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 5000;

    osc.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.filter!);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** Disconnect all audio nodes to prevent orphaned subgraphs on restart */
  private disconnectAll(): void {
    try {
      this.droneOsc?.disconnect();
      this.droneGain?.disconnect();
      this.lfoOsc?.disconnect();
      this.lfoGain?.disconnect();
      this.fifthOsc?.disconnect();
      this.fifthGain?.disconnect();
      this.melodyOsc?.disconnect();
      this.melodyGain?.disconnect();
      this.filter?.disconnect();
      this.masterGain?.disconnect();
    } catch {
      // Nodes may already be disconnected
    }
  }

  isPlaying(): boolean { return this.playing; }
}

export const music = new MusicSystem();
