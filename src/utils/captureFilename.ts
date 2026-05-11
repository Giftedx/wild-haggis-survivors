export type CaptureKind = 'screenshot' | 'clip' | 'highlight';

export interface CaptureFilenamePayload {
  mode: 'victory' | 'death';
  variantLabel: string;
  timeSurvivedSec: number;
  seedCode?: string;
  dateYmd: string;
  clipExtension?: 'webm' | 'mp4';
  /**
   * W82 highlight — when present, the filename gets a `_<bossSlug>`
   * slot between variant and mm-ss so a player can recognise which
   * boss kill the clip captures. Ignored for non-highlight kinds.
   */
  bossKey?: string;
}

const EXTENSIONS: Record<CaptureKind, string> = {
  screenshot: 'png',
  clip: 'webm',
  highlight: 'webm',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatMmSs(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${mm.toString().padStart(2, '0')}m${ss.toString().padStart(2, '0')}s`;
}

export function buildCaptureFilename(
  kind: CaptureKind,
  p: CaptureFilenamePayload,
): string {
  const prefix = kind === 'highlight' ? 'highlight' : p.mode;
  const parts: string[] = ['whs', prefix];
  const slug = slugify(p.variantLabel);
  if (slug) parts.push(slug);
  if (kind === 'highlight' && p.bossKey) {
    const bossSlug = slugify(p.bossKey);
    if (bossSlug) parts.push(bossSlug);
  }
  parts.push(formatMmSs(p.timeSurvivedSec));
  parts.push(p.dateYmd);
  if (p.seedCode) parts.push(p.seedCode);
  const extension = (kind === 'clip' || kind === 'highlight')
    ? p.clipExtension ?? EXTENSIONS[kind]
    : EXTENSIONS.screenshot;
  return `${parts.join('_')}.${extension}`;
}
