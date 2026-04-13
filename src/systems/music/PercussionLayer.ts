/**
 * Percussion — heartbeat pulse + Euclidean rhythm patterns.
 *
 * Heartbeat: "lub-dub" double sine kick at fixed 72 BPM, volume driven by chaos.
 * Rhythm: hi-hat + kick on Euclidean patterns, density driven by intensity.
 */
export class PercussionLayer {
  private heartbeatGain: GainNode | null = null;
  private rhythmGain: GainNode | null = null;
  private ctx: AudioContext | null = null;

  private pattern: boolean[] = [true, false, true, false, false, false, false, false];
  private patternIdx: number = 0;

  start(ctx: AudioContext, output: AudioNode): void {
    this.ctx = ctx;

    this.heartbeatGain = ctx.createGain();
    this.heartbeatGain.gain.value = 0;
    this.heartbeatGain.connect(output);

    this.rhythmGain = ctx.createGain();
    this.rhythmGain.gain.value = 0.05;
    this.rhythmGain.connect(output);
  }

  scheduleHeartbeat(time: number, chaos: number): void {
    if (!this.ctx || !this.heartbeatGain) return;
    const vol = Math.max(0, (chaos - 0.3) / 0.7) * 0.3;
    if (vol < 0.01) return;
    this.playSubKick(time, vol);
    this.playSubKick(time + 0.05, vol * 0.7);
  }

  private playSubKick(time: number, vol: number): void {
    if (!this.ctx || !this.heartbeatGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.heartbeatGain!);
    osc.start(time);
    osc.stop(time + 0.15);
    // Disconnect downstream nodes after the oscillator finishes — the osc
    // auto-disconnects itself when stopped, but the gain node it feeds stays
    // in the audio graph (held by heartbeatGain's input list) and accumulates
    // over a run otherwise.
    osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch { /* ignore */ } };
  }

  scheduleRhythmHit(time: number, intensity: number, swing: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const currentIdx = this.patternIdx;
    const isHit = this.pattern[currentIdx];
    const swingDelay = currentIdx % 2 === 0 ? 0 : swing;
    const hitTime = time + swingDelay;
    this.patternIdx = (this.patternIdx + 1) % this.pattern.length;
    // Apply pending pattern at phrase boundary
    if (this.patternIdx === 0 && this.pendingPattern) {
      this.pattern = this.pendingPattern;
      this.pendingPattern = null;
    }
    if (!isHit) return;
    // Kick on even slots (downbeats), hat on odd slots
    if (currentIdx % 2 === 0) {
      this.playKick(hitTime, 0.08 + intensity * 0.06);
    } else {
      this.playHat(hitTime, 0.02 + intensity * 0.02);
    }
  }

  private playKick(time: number, vol: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.15);
    osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch { /* ignore */ } };
  }

  private playHat(time: number, vol: number): void {
    if (!this.ctx || !this.rhythmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const hpf = this.ctx.createBiquadFilter();
    osc.type = 'square';
    osc.frequency.value = 6000 + Math.random() * 2000;
    hpf.type = 'highpass';
    hpf.frequency.value = 5000;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.rhythmGain!);
    osc.start(time);
    osc.stop(time + 0.04);
    osc.onended = () => { try { osc.disconnect(); hpf.disconnect(); gain.disconnect(); } catch { /* ignore */ } };
  }

  updatePattern(density: number): void {
    const n = Math.round(Math.max(1, Math.min(7, density * 7 + 1)));
    const newPattern = euclidean(n, 8);
    // Only apply new pattern at phrase boundary to avoid mid-sequence kick/hat flip
    if (this.patternIdx === 0) {
      this.pattern = newPattern;
    } else {
      this.pendingPattern = newPattern;
    }
  }

  private pendingPattern: boolean[] | null = null;

  stop(): void {
    try {
      this.heartbeatGain?.disconnect();
      this.rhythmGain?.disconnect();
    } catch { /* already disconnected */ }
    this.heartbeatGain = null;
    this.rhythmGain = null;
    this.ctx = null;
    this.patternIdx = 0;
    // Clear any high-density pattern queued right before this run ended —
    // otherwise it would leak across and override the calm 1/8 opening
    // of the next run at the first phrase boundary.
    this.pendingPattern = null;
  }
}

export function euclidean(hits: number, slots: number): boolean[] {
  if (hits >= slots) return new Array(slots).fill(true);
  if (hits <= 0) return new Array(slots).fill(false);

  let pattern: number[][] = [];
  for (let i = 0; i < slots; i++) {
    pattern.push(i < hits ? [1] : [0]);
  }

  let level = 0;
  while (true) {
    const zerosStart = pattern.findIndex(p => p[p.length - 1] === 0);
    if (zerosStart < 0 || zerosStart >= pattern.length - 1) break;

    const newPattern: number[][] = [];
    let onesIdx = 0;
    let zerosIdx = zerosStart;

    while (onesIdx < zerosStart && zerosIdx < pattern.length) {
      newPattern.push([...pattern[onesIdx], ...pattern[zerosIdx]]);
      onesIdx++;
      zerosIdx++;
    }
    while (onesIdx < zerosStart) {
      newPattern.push([...pattern[onesIdx]]);
      onesIdx++;
    }
    while (zerosIdx < pattern.length) {
      newPattern.push([...pattern[zerosIdx]]);
      zerosIdx++;
    }

    if (newPattern.length === pattern.length) break;
    pattern = newPattern;
    level++;
    if (level > 20) break;
  }

  return pattern.flat().map(v => v === 1);
}

/** Per-phrase kick/hat gain scales from Euclidean pulse count (1–8 in 8 slots). */
export function percussionKickHatGainScales(pulseCount: number): { kick: number; hat: number } {
  const n = Math.max(1, Math.min(8, Math.round(pulseCount)));
  const KICK = [1.0, 0.9, 0.88, 0.72, 0.68, 0.7, 0.72, 0.74];
  const HAT = [1.0, 0.95, 0.9, 0.82, 0.7, 0.55, 0.45, 0.42];
  return { kick: KICK[n - 1], hat: HAT[n - 1] };
}
