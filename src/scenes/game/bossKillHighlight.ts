/**
 * W82 Phase 3 — boss-kill highlight snapshot.
 *
 * A small typed record held on `GameScene` for the lifetime of a run,
 * representing the most recent boss kill the player landed. The
 * `blob` is captured non-destructively from `ClipRecorder.snapshot()`
 * at the exact frame the boss dies, so the rolling buffer keeps
 * recording for future highlights (a subsequent boss kill simply
 * replaces the held snapshot).
 *
 * Lives only in memory for the active run — does NOT persist across
 * page refresh by design. The Game Over screen reads it live through
 * `GameScene.getBossKillHighlight()` so a late-arriving payload still
 * sees the right snapshot at click time.
 *
 * Why latest-only (vs accumulating one snapshot per boss):
 *   - Keeps the memory footprint bounded at ~3–6 MB regardless of
 *     how many bosses get killed across a 12-minute run.
 *   - Mirrors the F9 rolling-buffer UX players already understand —
 *     "the most recent moment" is the affordance.
 *   - Players who want an earlier boss kill can still F9 manually
 *     during the run (the recorder is unaffected by snapshot).
 */
import type { ClipExtension } from '../../utils/clipRecorder';

export interface BossKillHighlight {
  /** Boss enemy key — e.g. 'gordon', 'tour_bus', 'taxman'. Used to
   *  build the download filename slug and the link label. */
  readonly bossKey: string;
  /** Snapshot taken at the moment the boss died. */
  readonly blob: Blob;
  /** Container extension chosen by the recorder (webm/mp4). */
  readonly extension: ClipExtension;
  /** Seconds survived at moment of capture (for the link label /
   *  filename mm-ss slug — uses the time-of-kill, not time-of-save). */
  readonly capturedAtSec: number;
}
