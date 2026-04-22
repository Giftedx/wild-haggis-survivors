/**
 * Shared AudioContext singleton.
 * Both AudioSystem (SFX) and ProceduralMusicEngine connect here.
 * A DynamicsCompressorNode on the output prevents clipping during
 * chaotic boss fights when SFX + music + heartbeat fire simultaneously.
 *
 * Browser autoplay policy: we do **not** construct AudioContext until the
 * player has produced a user gesture (pointer / key / touch / gamepad).
 * That avoids a suspended context + console noise on first paint, and
 * matches how players expect sound to unlock with their first input.
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
  stopGamepadPoll();
  uninstallUserGestureListeners();

  const ctx = createSharedContext();
  if (ctx) tryResumeRunning(ctx);
  flushPendingAfterActivate();
}

let gestureListenersInstalled = false;
let targetWindow: Window | null = null;

const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

/** Poll interval when a pad is already connected at load (TV / handheld). */
const GAMEPAD_POLL_MS = 50;
const GAMEPAD_POLL_MAX_MS = 5 * 60 * 1000;

/** DOM `setInterval` handle (number); avoid NodeJS.Timeout from ambient typings. */
let gamepadPollTimer: number | null = null;
let gamepadPollStartedAt = 0;

function onUserGestureForAudio(): void {
  activateAudioOutput();
}

function hasAnyConnectedGamepad(): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return false;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function gamepadShowsPlayerInput(gp: Gamepad): boolean {
  for (let i = 0; i < gp.buttons.length; i++) {
    if (gp.buttons[i]?.pressed) return true;
  }
  for (let i = 0; i < gp.axes.length; i++) {
    if (Math.abs(gp.axes[i] ?? 0) > 0.2) return true;
  }
  return false;
}

function pollGamepadsOnce(): void {
  if (audioOutputActivated) return;
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (gp && gamepadShowsPlayerInput(gp)) {
        activateAudioOutput();
        return;
      }
    }
  } catch {
    /* ignore */
  }
}

function stopGamepadPoll(): void {
  if (gamepadPollTimer != null) {
    clearInterval(gamepadPollTimer);
    gamepadPollTimer = null;
  }
  gamepadPollStartedAt = 0;
}

function startGamepadPoll(win: Window, opts?: { skipPadCheck?: boolean }): void {
  if (gamepadPollTimer != null || audioOutputActivated || isVitest()) return;
  if (typeof win.setInterval !== 'function') return;
  if (!opts?.skipPadCheck && !hasAnyConnectedGamepad()) return;
  gamepadPollStartedAt = Date.now();
  gamepadPollTimer = win.setInterval(() => {
    if (audioOutputActivated) {
      stopGamepadPoll();
      return;
    }
    if (Date.now() - gamepadPollStartedAt > GAMEPAD_POLL_MAX_MS) {
      stopGamepadPoll();
      return;
    }
    pollGamepadsOnce();
  }, GAMEPAD_POLL_MS);
}

function uninstallUserGestureListeners(): void {
  if (!gestureListenersInstalled || !targetWindow) return;
  gestureListenersInstalled = false;
  const win = targetWindow;
  for (const ev of GESTURE_EVENTS) {
    win.removeEventListener(ev, onUserGestureForAudio, true);
  }
  win.removeEventListener('gamepadconnected', onGamepadConnectedForAudio, true);
  targetWindow = null;
}

function onGamepadConnectedForAudio(ev: Event): void {
  if (!targetWindow || audioOutputActivated) return;
  const gp = typeof GamepadEvent !== 'undefined' && ev instanceof GamepadEvent ? ev.gamepad : null;
  if (gp && gamepadShowsPlayerInput(gp)) {
    activateAudioOutput();
    return;
  }
  startGamepadPoll(targetWindow, { skipPadCheck: true });
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
  win.addEventListener('gamepadconnected', onGamepadConnectedForAudio, opts);

  if (hasAnyConnectedGamepad()) startGamepadPoll(win);

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

let recordingDestination: MediaStreamAudioDestinationNode | null = null;

/**
 * W27 Phase 3 — expose an audio MediaStream that captures everything
 * routed through the shared output compressor. Parallel tap; does not
 * interfere with playback to `ctx.destination`.
 *
 * Returns null if AudioContext isn't available (pre-user-gesture or
 * unsupported browser). Caller tears down via `disposeRecordingAudioStream`.
 */
export function createRecordingAudioStream(): MediaStream | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (recordingDestination) return recordingDestination.stream;
  try {
    recordingDestination = ctx.createMediaStreamDestination();
    const output = getOutputNode();
    output?.connect(recordingDestination);
    return recordingDestination.stream;
  } catch {
    recordingDestination = null;
    return null;
  }
}

export function disposeRecordingAudioStream(): void {
  if (!recordingDestination) return;
  try {
    const output = getOutputNode();
    output?.disconnect(recordingDestination);
  } catch { /* already disconnected */ }
  recordingDestination = null;
}
