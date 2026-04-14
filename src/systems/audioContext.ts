/**
 * Shared AudioContext singleton.
 * Both AudioSystem (SFX) and ProceduralMusicEngine connect here.
 * A DynamicsCompressorNode on the output prevents clipping during
 * chaotic boss fights when SFX + music + heartbeat fire simultaneously.
 *
 * Browser autoplay policy: we do **not** construct AudioContext until the
 * player has produced a user gesture (pointer / key / touch). That avoids
 * a suspended context + console noise on first paint, and matches how
 * players expect sound to unlock with their first input.
 */

let sharedCtx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;

/** True after first qualifying user input, or in Vitest (`VITEST=true`). */
let audioOutputActivated = false;

const pendingAfterActivate: Array<() => void> = [];

function isVitest(): boolean {
  return typeof process !== 'undefined' && process.env.VITEST === 'true';
}

function createSharedContext(): AudioContext | null {
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  try {
    if (compressor) {
      try {
        compressor.disconnect();
      } catch {
        /* dead ctx — fine */
      }
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

function flushPendingAfterActivate(): void {
  const q = pendingAfterActivate.splice(0, pendingAfterActivate.length);
  for (const fn of q) {
    try {
      fn();
    } catch {
      /* caller handles */
    }
  }
}

function tryResumeRunning(ctx: AudioContext): void {
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
}

/**
 * Run `fn` after Web Audio is allowed (immediately if already active).
 * Used to retry ambient SFX / music start when the first call ran before activation.
 */
export function runWhenAudioActivated(fn: () => void): void {
  if (audioOutputActivated) {
    queueMicrotask(fn);
    return;
  }
  pendingAfterActivate.push(fn);
}

function activateAudioOutput(): void {
  if (audioOutputActivated) return;
  audioOutputActivated = true;
  uninstallUserGestureListeners();

  const ctx = createSharedContext();
  if (ctx) tryResumeRunning(ctx);
  flushPendingAfterActivate();
}

let gestureListenersInstalled = false;
let targetWindow: Window | null = null;

const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

function onUserGestureForAudio(): void {
  activateAudioOutput();
}

function uninstallUserGestureListeners(): void {
  if (!gestureListenersInstalled || !targetWindow) return;
  gestureListenersInstalled = false;
  for (const ev of GESTURE_EVENTS) {
    targetWindow.removeEventListener(ev, onUserGestureForAudio, true);
  }
  targetWindow = null;
}

/**
 * Install capture-phase listeners so the **first** tap / key / touch creates
 * AudioContext inside a user gesture (usually `running`, not `suspended`).
 * Call once from `main.ts` before `new Phaser.Game`.
 */
export function installAudioActivationOnUserGesture(win: Window & typeof globalThis): void {
  if (gestureListenersInstalled || typeof win.addEventListener !== 'function') return;
  targetWindow = win;
  gestureListenersInstalled = true;
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  for (const ev of GESTURE_EVENTS) {
    win.addEventListener(ev, onUserGestureForAudio, opts);
  }

  win.addEventListener(
    'pagehide',
    () => {
      uninstallUserGestureListeners();
    },
    { once: true },
  );
}

/** Resume if the browser suspended audio while the tab was hidden. */
function installVisibilityResume(): void {
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (sharedCtx?.state === 'suspended') void sharedCtx.resume().catch(() => undefined);
  });
}

installVisibilityResume();

export function getAudioContext(): AudioContext | null {
  if (!audioOutputActivated && !isVitest()) return null;
  return createSharedContext();
}

export function getOutputNode(): AudioNode | null {
  getAudioContext();
  return compressor;
}
