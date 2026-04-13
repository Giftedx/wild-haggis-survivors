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
    // Disconnect any stale compressor from the previous (now-dead) context
    // before abandoning the reference. Web Audio nodes from closed contexts
    // are invalid to operate on, so the try/catch is defensive.
    if (compressor) {
      try { compressor.disconnect(); } catch { /* dead ctx — fine */ }
    }
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
  // Always ensure the context is fresh — a `closed` shared ctx can leave
  // `compressor` pointing at a dead-context node until getAudioContext
  // runs again. Hit the validity check every call.
  getAudioContext();
  return compressor;
}
