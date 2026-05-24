import { formatClockTime } from './formatClockTime';
import { formatLocalYmd } from './formatDate';
import {
  renderTartan,
  resolveTartanProfile,
  type TartanSignature,
} from './tartan';

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
  /** Resolved curse display name (e.g. "Heavy Legs"). When set, footer
   *  adds a "☠ {name}" tag — pride for cursed wins, honesty for cursed deaths. */
  curseLabel?: string;
  /** Locale-resolved label overrides — W18 bilingual pass. Any omitted
   *  field falls back to the English default in `DEFAULT_POSTCARD_LABELS`.
   *  Callers that don't pass labels keep the pre-W18 English output
   *  (test fixtures, tooling that doesn't have a locale). */
  labels?: Partial<PostcardLabels>;
  /** Optional tartan signature — when present, a procedural plaid patch
   *  is composited into the footer. Absent = no tartan (pre-DESIGN_IDEAS
   *  output reproduced, test fixtures that don't care). */
  tartan?: TartanSignature;
}

/**
 * Viewer-facing strings composited into the postcard footer. Numbers
 * interpolate at render time so callers can pre-localize once per run.
 */
export interface PostcardLabels {
  /** Label before the MMSS clock ("time 12:34"). */
  time: string;
  /** Label before the kill count ("kills 432"). */
  kills: string;
  /** Label before the seed code ("seed ABC-123"). */
  seed: string;
  /** Victory outcome badge ("✦ VICTORY"). */
  victory: string;
  /** Death outcome badge ("FELL"). */
  fell: string;
  /** Ironmoor tag ("⚔ Ironmoor"). */
  ironmoor: string;
  /** Template for the past-bell tag; receives the MMSS clock string. */
  pastBell: (clock: string) => string;
  /** Template for the curse tag; receives the already-localized curse name. */
  curseTag: (curse: string) => string;
}

/**
 * English defaults. Callers who don't pass labels reproduce the pre-W18
 * output byte-for-byte.
 */
export const DEFAULT_POSTCARD_LABELS: PostcardLabels = {
  time: 'time',
  kills: 'kills',
  seed: 'seed',
  victory: '✦ VICTORY',
  fell: 'FELL',
  ironmoor: '⚔ Ironmoor',
  pastBell: (clock) => `🔔 +${clock} past the bell`,
  curseTag: (curse) => `☠ ${curse}`,
};

function resolveLabels(labels?: Partial<PostcardLabels>): PostcardLabels {
  if (!labels) return DEFAULT_POSTCARD_LABELS;
  return { ...DEFAULT_POSTCARD_LABELS, ...labels };
}

/** Footer band height in CSS pixels. */
const FOOTER_H = 72;
/** Top margin inside the footer band for the first text line. */
const FOOTER_PAD_TOP = 14;
/** Horizontal margin inside the footer band for text. */
const FOOTER_PAD_X = 20;
/** Tartan patch geometry — sits at the left edge of the footer band
 *  when a TartanSignature is passed. Text left-column shifts to
 *  `FOOTER_PAD_X + TARTAN_W + TARTAN_PAD_RIGHT` in that case. */
const TARTAN_W = 48;
const TARTAN_H = 48;
const TARTAN_PAD_RIGHT = 12;

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
 * Sync dataURL → Blob conversion (base64 decode via atob).
 * Extracted so `renderPostcardBlob` can stay synchronous and remain
 * within a user-gesture activation window (required by Web Share API).
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const sep = dataUrl.indexOf(',');
  const mime = dataUrl.slice(0, sep).match(/:(.*?);/)?.[1] ?? 'image/png';
  const raw = atob(dataUrl.slice(sep + 1));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Render the postcard to a Blob without triggering a download.
 * Returns null if the canvas is unavailable or tainted.
 *
 * Kept synchronous so callers can invoke it inside a user-gesture handler
 * and immediately call `navigator.share({ files: [...] })` — async blob
 * construction breaks the activation window in some browsers.
 */
export function renderPostcardBlob(
  canvas: HTMLCanvasElement | null | undefined,
  payload: PostcardPayload,
): Blob | null {
  if (!canvas) return null;
  try {
    return dataUrlToBlob(renderPostcardDataUrl(canvas, payload));
  } catch {
    return null;
  }
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

  const labels = resolveLabels(payload.labels);

  // Tartan patch (optional) — paint first so subsequent text isn't
  // overdrawn. Left column shifts to clear the patch.
  let leftCol = FOOTER_PAD_X;
  if (payload.tartan) {
    const tartanX = FOOTER_PAD_X;
    const tartanY = h + Math.floor((FOOTER_H - TARTAN_H) / 2);
    renderTartan(ctx, tartanX, tartanY, TARTAN_W, TARTAN_H, resolveTartanProfile(payload.tartan).profile);
    leftCol = FOOTER_PAD_X + TARTAN_W + TARTAN_PAD_RIGHT;
  }

  // Top-line: outcome tag + kills/time/seed.
  ctx.font = 'bold 14px monospace';
  ctx.textBaseline = 'top';
  const outcome = payload.mode === 'victory' ? labels.victory : labels.fell;
  ctx.fillStyle = payload.mode === 'victory' ? '#f7d27a' : '#c8d0e0';
  ctx.textAlign = 'left';
  ctx.fillText(outcome, leftCol, h + FOOTER_PAD_TOP);

  // Right-aligned seed (if present).
  if (payload.seedCode) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8a93a8';
    ctx.fillText(`${labels.seed} ${payload.seedCode}`, w - FOOTER_PAD_X, h + FOOTER_PAD_TOP);
  }

  // Middle body: time · kills · variant · ironmoor tag
  ctx.font = '13px monospace';
  ctx.fillStyle = '#cdd4e0';
  ctx.textAlign = 'left';
  ctx.fillText(buildPostcardFooterParts(payload).join('  ·  '), leftCol, h + FOOTER_PAD_TOP + 22);

  // Bottom line: brand footer.
  ctx.font = 'italic 11px monospace';
  ctx.fillStyle = '#596780';
  ctx.textAlign = 'right';
  ctx.fillText('wild haggis survivors', w - FOOTER_PAD_X, h + FOOTER_PAD_TOP + 44);

  return out.toDataURL('image/png');
}

/**
 * Compose the dot-separated badge row that lives in the postcard footer.
 *
 * Order matters — players read left-to-right; "time / kills" anchor as
 * the load-bearing summary, then variant, then mode tags (ironmoor /
 * curse / post-bell). Returned as the raw string array (not joined) so
 * the renderer can pick its own separator and tests can inspect each
 * tag in isolation.
 *
 * Postcard payload defensively floors negatives + non-finite numbers,
 * since the payload is built from RunSummary which has its own
 * normalisation but we never want a malformed input to print "kills -3".
 */
export function buildPostcardFooterParts(payload: PostcardPayload): string[] {
  const labels = resolveLabels(payload.labels);
  const clock = formatClockTime(payload.timeSurvivedSec);
  const parts: string[] = [
    `${labels.time} ${clock}`,
    `${labels.kills} ${Math.max(0, Math.floor(payload.enemiesKilled))}`,
  ];
  if (payload.variantLabel) parts.push(payload.variantLabel);
  if (payload.ironmoor) parts.push(labels.ironmoor);
  if (payload.curseLabel) parts.push(labels.curseTag(payload.curseLabel));
  if (payload.postBellSec && payload.postBellSec > 0) {
    parts.push(labels.pastBell(formatClockTime(payload.postBellSec)));
  }
  return parts;
}

/**
 * Build a human-readable, filesystem-safe filename for the postcard.
 * Format: `haggis-YYYY-MM-DD-{victory|death}-{kills}k-{mmss}[-seed].png`
 */
export function buildPostcardFilename(p: PostcardPayload): string {
  const date = formatLocalYmd(new Date());

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
