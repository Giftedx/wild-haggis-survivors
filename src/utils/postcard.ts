/**
 * W27 Capture & Share — MVP postcard export.
 *
 * The game renders all of its end-of-run ceremony (variant portrait, run
 * summary, boss kills, seed, the lot) into the main Phaser canvas. That
 * frame IS the postcard — no compositing required. We just read the
 * pixel buffer as a PNG and hand it back as a one-click download.
 *
 * Buckets of fidelity are intentionally omitted from the MVP:
 *   - No per-frame highlight reel (that's video, out of scope).
 *   - No server upload (W27 charter: "Share is local-save-then-user-uploads").
 *   - No composited watermark; the canvas already carries the brand.
 */

export interface PostcardPayload {
  /** Who lived / died — shapes the filename. */
  mode: 'victory' | 'death';
  /** Kill count for this run. */
  enemiesKilled: number;
  /** Seconds survived — encoded as MMmSSs in the filename. */
  timeSurvivedSec: number;
  /** Optional seed code for the filename (seeded/daily runs). */
  seedCode?: string;
}

/**
 * Read the Phaser canvas as a PNG data URL and trigger a download via
 * a synthetic anchor. Returns true on success, false if the browser
 * can't render the canvas (e.g. tainted due to cross-origin image).
 *
 * Safe on headless / node — no-ops with a false return.
 */
export function downloadPostcard(
  canvas: HTMLCanvasElement | null | undefined,
  payload: PostcardPayload,
): boolean {
  if (!canvas || typeof document === 'undefined') return false;
  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    // Tainted canvas (e.g. external textures); can't export.
    return false;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = buildPostcardFilename(payload);
  // Some browsers require the anchor in the DOM for the click to fire.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

/**
 * Build a human-readable, filesystem-safe filename for the postcard.
 * Format: `haggis-YYYY-MM-DD-{victory|death}-{kills}k-{mmss}[-seed].png`
 */
export function buildPostcardFilename(p: PostcardPayload): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;

  const totalSec = Math.max(0, Math.floor(p.timeSurvivedSec));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const clock = `${String(mins).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`;

  const kills = Math.max(0, Math.floor(p.enemiesKilled));
  const seedSuffix = p.seedCode
    ? `-${sanitiseForFilename(p.seedCode)}`
    : '';

  return `haggis-${date}-${p.mode}-${kills}k-${clock}${seedSuffix}.png`;
}

/** Strips filesystem-hostile chars so a weird seed code can't break the download. */
function sanitiseForFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
}
