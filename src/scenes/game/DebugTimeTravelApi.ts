/**
 * DebugTimeTravelApi — dev-only time-skip controls, previously inline on
 * GameScene. Installs two things:
 *   - `globalThis.DEBUG.{skipToMinute, skipToGameSecond}` for console use.
 *   - A Shift+`]` keybind that fast-forwards 60 game seconds.
 *
 * Browser-only surface; the global/keydown branches no-op when `window`
 * is undefined (Vitest / headless tests).
 */
import type { SpawnSystem } from '../../systems/SpawnSystem';

export interface DebugTimeTravelHooks {
  getSpawnSystem(): SpawnSystem;
  isSceneActive(): boolean;
}

/** Keybind: Shift+] advances 60 game seconds. */
const ADVANCE_KEY_CODE = 'BracketRight';
/** Seconds added per Shift+] press. */
const KEY_ADVANCE_SECONDS = 60;

export class DebugTimeTravelApi {
  private keydownHandler: ((e: KeyboardEvent) => void) | undefined;

  constructor(private readonly hooks: DebugTimeTravelHooks) {}

  /**
   * Install the global DEBUG object and keydown listener. Safe to call
   * multiple times — the listener is re-bound (prior handler dropped
   * via uninstall when relevant). No-op on non-browser hosts for the
   * keydown half; the globalThis.DEBUG assignment works everywhere.
   */
  install(): void {
    const g = globalThis as unknown as {
      DEBUG?: {
        skipToMinute: (m: number) => void;
        skipToGameSecond: (s: number) => void;
      };
    };
    g.DEBUG = {
      skipToMinute: (m: number) => {
        this.hooks.getSpawnSystem().timeTravelToSeconds(Math.max(0, Number(m) || 0) * 60);
      },
      skipToGameSecond: (s: number) => {
        this.hooks.getSpawnSystem().timeTravelToSeconds(Math.max(0, Number(s) || 0));
      },
    };

    if (typeof window === 'undefined') return;
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.code !== ADVANCE_KEY_CODE) return;
      if (!this.hooks.isSceneActive()) return;
      e.preventDefault();
      const spawn = this.hooks.getSpawnSystem();
      spawn.timeTravelToSeconds(spawn.getGameTimeSec() + KEY_ADVANCE_SECONDS);
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  /** Remove the DEBUG global and the keydown listener (idempotent). */
  uninstall(): void {
    const g = globalThis as unknown as { DEBUG?: unknown };
    if (g.DEBUG) delete g.DEBUG;
    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = undefined;
    }
  }
}
