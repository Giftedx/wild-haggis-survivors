/**
 * Procedural Web Audio whispers for The Moor Remembers cairns.
 *
 * Two voice textures:
 *  - past-self: short formant-shaped noise burst (fundamental
 *    200-300 Hz, 1.2 s envelope) — voiceless whisper texture.
 *  - grandfather: distinct lower fundamental (120-180 Hz) + slower
 *    cadence (1.8 s envelope) — reads as elder Scots.
 *
 * Both are seeded by the cairn's `savedAt` so a given cairn always
 * whispers the same way. No audio assets — all maths.
 */

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WhisperParams {
  durationSec: number;
  fundamentalHz: number;
  filterFreqHz: number;
  filterQ: number;
  peakGain: number;
}

function renderWhisper(
  ctx: AudioContext,
  seed: number,
  bus: GainNode,
  params: WhisperParams,
): void {
  const sampleRate = ctx.sampleRate;
  const lengthSamples = Math.floor(params.durationSec * sampleRate);
  const buffer = ctx.createBuffer(1, lengthSamples, sampleRate);
  const data = buffer.getChannelData(0);
  const rng = seededRandom(seed);
  for (let i = 0; i < lengthSamples; i++) {
    const t = i / sampleRate;
    const lfo = Math.sin(2 * Math.PI * params.fundamentalHz * t);
    const noise = rng() * 2 - 1;
    data[i] = noise * 0.5 * (0.6 + 0.4 * lfo);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass' as BiquadFilterType;
  filter.frequency.setValueAtTime(params.filterFreqHz, ctx.currentTime);
  filter.Q.setValueAtTime(params.filterQ, ctx.currentTime);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, ctx.currentTime);
  envelope.gain.linearRampToValueAtTime(params.peakGain, ctx.currentTime + 0.15);
  envelope.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + params.durationSec);

  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(bus);
  source.start();
  source.stop(ctx.currentTime + params.durationSec + 0.05);
}

export function playPastSelfWhisper(ctx: AudioContext, seed: number, bus: GainNode): void {
  renderWhisper(ctx, seed, bus, {
    durationSec: 1.2,
    fundamentalHz: 240,
    filterFreqHz: 1800,
    filterQ: 6,
    peakGain: 0.18,
  });
}

export function playGrandfatherWhisper(ctx: AudioContext, seed: number, bus: GainNode): void {
  renderWhisper(ctx, seed, bus, {
    durationSec: 1.8,
    fundamentalHz: 150,
    filterFreqHz: 900,
    filterQ: 4,
    peakGain: 0.22,
  });
}
