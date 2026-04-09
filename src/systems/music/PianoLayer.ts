/**
 * Felt Piano — FM-synthesized polyphonic voice.
 *
 * Each voice: sine carrier modulated by sine at 2:1 ratio.
 * Modulation index envelope: high attack (bright plunk) → low sustain (warm).
 * 4-voice max with voice stealing (quietest voice replaced).
 */

interface Voice {
  carrier: OscillatorNode;
  modulator: OscillatorNode;
  modGain: GainNode;
  voiceGain: GainNode;
  startTime: number;
  releaseTime: number;
}

export class PianoLayer {
  private voices: (Voice | null)[] = [null, null, null, null];
  private mixGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ctx: AudioContext | null = null;

  start(ctx: AudioContext, output: AudioNode): void {
    this.ctx = ctx;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3000; // let the gentle FM warmth through

    this.mixGain = ctx.createGain();
    this.mixGain.gain.value = 1.0;

    this.filter.connect(this.mixGain);
    this.mixGain.connect(output);
  }

  playNote(freq: number, time: number, velocity: number, releaseSec: number = 1.5): void {
    if (!this.ctx || !this.filter) return;
    const ctx = this.ctx;

    const slotIdx = this.findVoiceSlot(time);
    this.releaseVoice(slotIdx);

    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = freq;

    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.value = freq * 2;

    const modGain = ctx.createGain();
    // Gentle FM — just enough to add warmth, not metallic brightness
    // Low mod index = soft, round tone. C418 piano, not DX7 electric piano.
    const modDepth = freq * 0.3 * velocity;
    modGain.gain.setValueAtTime(modDepth, time);
    modGain.gain.exponentialRampToValueAtTime(Math.max(0.01, freq * 0.08), time + 0.12);
    modGain.gain.exponentialRampToValueAtTime(Math.max(0.01, freq * 0.01), time + 0.8);

    const voiceGain = ctx.createGain();
    // Soft, intimate piano — like it's in the next room
    const peak = 0.3 * velocity;
    voiceGain.gain.setValueAtTime(0, time);
    voiceGain.gain.linearRampToValueAtTime(peak, time + 0.008);        // soft attack
    voiceGain.gain.linearRampToValueAtTime(peak * 0.55, time + 0.3);   // gentle decay
    voiceGain.gain.linearRampToValueAtTime(peak * 0.25, time + 1.0);   // long sustain
    voiceGain.gain.linearRampToValueAtTime(0.001, time + releaseSec);   // fade to silence

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(voiceGain);
    voiceGain.connect(this.filter!);

    carrier.start(time);
    modulator.start(time);
    const stopTime = time + releaseSec + 0.1;
    carrier.stop(stopTime);
    modulator.stop(stopTime);

    this.voices[slotIdx] = {
      carrier, modulator, modGain, voiceGain,
      startTime: time,
      releaseTime: stopTime,
    };

    carrier.onended = () => {
      if (this.voices[slotIdx]?.carrier === carrier) {
        this.voices[slotIdx] = null;
      }
    };
  }

  private findVoiceSlot(now: number): number {
    for (let i = 0; i < this.voices.length; i++) {
      if (!this.voices[i]) return i;
    }
    let bestIdx = 0;
    let bestAge = 0;
    for (let i = 0; i < this.voices.length; i++) {
      const v = this.voices[i]!;
      const age = now - v.startTime;
      if (age > bestAge) { bestAge = age; bestIdx = i; }
    }
    return bestIdx;
  }

  private releaseVoice(idx: number): void {
    const v = this.voices[idx];
    if (!v) return;
    try {
      v.carrier.stop();
      v.modulator.stop();
      v.carrier.disconnect();
      v.modulator.disconnect();
      v.modGain.disconnect();
      v.voiceGain.disconnect();
    } catch { /* already stopped */ }
    this.voices[idx] = null;
  }

  setVolume(ctx: AudioContext, vol: number, transitionSec: number = 0.5): void {
    if (!this.mixGain) return;
    this.mixGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + transitionSec);
  }

  stop(): void {
    for (let i = 0; i < this.voices.length; i++) {
      this.releaseVoice(i);
    }
    try {
      this.filter?.disconnect();
      this.mixGain?.disconnect();
    } catch { /* already disconnected */ }
    this.filter = null;
    this.mixGain = null;
    this.ctx = null;
  }

  getOutput(): GainNode | null { return this.mixGain; }
}
