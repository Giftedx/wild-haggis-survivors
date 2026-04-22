export type CaptureKind = 'screenshot' | 'clip';

export interface CaptureFilenamePayload {
  mode: 'victory' | 'death';
  variantLabel: string;
  timeSurvivedSec: number;
  seedCode?: string;
  dateYmd: string;
}

const EXTENSIONS: Record<CaptureKind, string> = {
  screenshot: 'png',
  clip: 'webm',
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
  const parts: string[] = ['whs', p.mode];
  const slug = slugify(p.variantLabel);
  if (slug) parts.push(slug);
  parts.push(formatMmSs(p.timeSurvivedSec));
  parts.push(p.dateYmd);
  if (p.seedCode) parts.push(p.seedCode);
  return `${parts.join('_')}.${EXTENSIONS[kind]}`;
}
