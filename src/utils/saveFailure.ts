/**
 * T131 — central save-failure emitter.
 *
 * Three persistence paths can throw on `localStorage.setItem`:
 *   1. `SaveManager` (`whs_meta_save`) — meta progression + activeRun
 *   2. `SettingsManager` (`whs_game_settings`) — user settings
 *   3. `save.ts` (`whs_save`) — legacy combined save (still in use during
 *      transition; see T132 persistence diagram)
 *
 * Each catch site routes through here so:
 *   - one structured `console.warn` is emitted (with path + reason)
 *   - `globalEventBus` fires `GLOBAL_SAVE_FAILED` so any active scene can
 *     show a toast (UI listener wires in scene `create()` lifecycles)
 *
 * Pure module: no Phaser, no DOM. Safe to import from any layer.
 */
import { globalEventBus, type GlobalSaveFailedPayload } from '../core/GlobalEventBus';

export function emitSaveFailure(
  path: GlobalSaveFailedPayload['path'],
  err: unknown,
): void {
  const reason = extractReason(err);
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[save] persistence failure (${path}): ${reason}`);
  }
  globalEventBus.emit('GLOBAL_SAVE_FAILED', { path, reason });
}

function extractReason(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  if (typeof err === 'string' && err.length > 0) return err;
  return 'unknown';
}
