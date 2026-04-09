/**
 * Shared AudioContext singleton.
 * Both AudioSystem (SFX) and ProceduralMusicEngine connect here.
 * A DynamicsCompressorNode on the output prevents clipping during
 * chaotic boss fights when SFX + music + heartbeat fire simultaneously.
 */

let sharedCtx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioContext(): AudioContext | null {
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  try {
    sharedCtx = new AudioContext();
    compressor = sharedCtx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.connect(sharedCtx.destination);
    return sharedCtx;
  } catch {
    return null;
  }
}

export function getOutputNode(): AudioNode | null {
  if (!compressor) getAudioContext();
  return compressor;
}
