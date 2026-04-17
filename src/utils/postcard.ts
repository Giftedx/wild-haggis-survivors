/**
 * W27 Capture & Share — postcard export with composited run-summary footer.
 *
 * The game renders end-of-run ceremony into the main Phaser canvas, which
 * IS most of the postcard. But when a player saves mid-animation (pre-tween
 * or between panel states) the raw frame may not carry the load-bearing
 * stats. We composite a small summary band at the bottom of the exported
 * PNG so every postcard reads correctly standalone.
 *
 * Buckets of fidelity intentionally omitted:
 *   - No per-frame highlight reel (that's video, out of scope).
 *   - No server upload (W27 charter: "Share is local-save-then-user-uploads").
 *   - Single font face + stack — canvas 2D is the minimum viable renderer.
 */

export interface PostcardPayload {
  /** Who lived / died — shapes the filename + banner copy. */
  mode: 'victory' | 'death';
  /** Kill count for this run. */
  enemiesKilled: number;
  /** Seconds survived — encoded as MMmSSs in the filename + clock in the footer. */
  timeSurvivedSec: number;
  /** Optional seed code for the filename + footer. */
  seedCode?: string;
  /** Variant display name ("Classic Haggis") for the footer. */
  variantLabel?: string;
  /** True when this run was Ironmoor — footer gets a "⚔ Ironmoor" tag. */
  ironmoor?: boolean;
  /** Seconds the player survived past the Bell (Taxman kill). When > 0,
   *  the footer adds a "🔔 +M:SS past the bell" tag — pride for endless runs. */
  postBellSec?: number;
}

/** Footer band height in CSS pixels. */
const FOOTER_H = 72;
/** Top margin inside the footer band for the first text line. */
const FOOTER_PAD_TOP = 14;
/** Horizontal margin inside the footer band for text. */
const FOOTER_PAD_X = 20;

/**
 * Read the Phaser canvas, composite a summary footer, and trigger a
 * download via a synthetic anchor. Returns true on success, false if
 * the browser can't render or export the canvas (tainted source,
 * node-env).
 */
export function downloadPostcard(
  canvas: HTMLCanvasElement | null | undefined,
  payload: PostcardPayload,
): boolean {
  if (!canvas || typeof document === 'undefined') return false;
  let dataUrl: string;
  try {
    dataUrl = renderPostcardDataUrl(canvas, payload);
  } catch {
    // Tainted canvas or 2D context unavailable — can't export.
    return false;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = buildPostcardFilename(payload);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

/**
 * Render the source canvas into a new offscreen canvas and composite the
 * summary footer. Exposed separately so tests / preview tooling can
 * sanity-check the data URL without triggering a download.
 */
export function renderPostcardDataUrl(
  canvas: HTMLCanvasElement,
  payload: PostcardPayload,
): string {
  const w = canvas.width;
  const h = canvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h + FOOTER_H;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('postcard: 2d context unavailable');

  // Blit the game frame.
  ctx.drawImage(canvas, 0, 0);

  // Footer band — warm dark underlay so the canvas transitions cleanly
  // into the summary without a hard seam.
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, h, w, FOOTER_H);
  ctx.fillStyle = 'rgba(212, 160, 23, 0.10)';
  ctx.fillRect(0, h, w, FOOTER_H);

  // Top-line: outcome tag + kills/time/seed.
  ctx.font = 'bold 14px monospace';
  ctx.textBaseline = 'top';
  const outcome = payload.mode === 'victory' ? '✦ VICTORY' : 'FELL';
  ctx.fillStyle = payload.mode === 'victory' ? '#f7d27a' : '#c8d0e0';
  ctx.textAlign = 'left';
  ctx.fillText(outcome, FOOTER_PAD_X, h + FOOTER_PAD_TOP);

  // Right-aligned seed (if present).
  if (payload.seedCode) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8a93a8';
    ctx.fillText(`seed ${payload.seedCode}`, w - FOOTER_PAD_X, h + FOOTER_PAD_TOP);
  }

  // Middle body: time · kills · variant · ironmoor tag
  ctx.font = '13px monospace';
  ctx.fillStyle = '#cdd4e0';
  ctx.textAlign = 'left';
  const mins = Math.floor(Math.max(0, payload.timeSurvivedSec) / 60);
  const secs = Math.floor(Math.max(0, payload.timeSurvivedSec) % 60);
  const clock = `${mins}:${String(secs).padStart(2, '0')}`;
  const parts = [
    `time ${clock}`,
    `kills ${Math.max(0, Math.floor(payload.enemiesKilled))}`,
  ];
  if (payload.variantLabel) parts.push(payload.variantLabel);
  if (payload.ironmoor) parts.push('⚔ Ironmoor');
  if (payload.postBellSec && payload.postBellSec > 0) {
    const pbMin = Math.floor(payload.postBellSec / 60);
    const pbSec = Math.floor(payload.postBellSec % 60);
    parts.push(`🔔 +${pbMin}:${String(pbSec).padStart(2, '0')} past the bell`);
  }
  ctx.fillText(parts.join('  ·  '), FOOTER_PAD_X, h + FOOTER_PAD_TOP + 22);

  // Bottom line: brand footer.
  ctx.font = 'italic 11px monospace';
  ctx.fillStyle = '#596780';
  ctx.textAlign = 'right';
  ctx.fillText('wild haggis survivors', w - FOOTER_PAD_X, h + FOOTER_PAD_TOP + 44);

  return out.toDataURL('image/png');
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
