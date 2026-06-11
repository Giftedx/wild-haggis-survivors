/**
 * Best-effort text copy to the user's clipboard.
 *
 * Tries `navigator.clipboard.writeText` first (modern browsers +
 * HTTPS). Falls back to a legacy `textarea.select() + execCommand`
 * path for older Safari and non-secure contexts. Returns true
 * whenever a copy attempt was dispatched — the async clipboard API
 * resolves its permission dialog asynchronously, so we report success
 * as soon as the call is made (the seed code stays visible in the
 * label either way, so a denial isn't a hard failure).
 */
export function copyTextToClipboard(text: string): boolean {
  const nav = (globalThis as unknown as {
    navigator?: { clipboard?: { writeText: (s: string) => Promise<void> } };
  }).navigator;
  if (nav?.clipboard?.writeText) {
    void nav.clipboard.writeText(text).catch(() => { /* ignore */ });
    return true;
  }
  try {
    const doc = (globalThis as unknown as { document?: Document }).document;
    if (!doc) return false;
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand('copy');
    doc.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * W27 Phase 4 — copy a PNG image blob to the clipboard.
 *
 * Uses the modern async Clipboard API with `ClipboardItem` (Chrome 76+,
 * Firefox 127+, Safari 16.4+ for image write). No legacy fallback —
 * image clipboard write has no `execCommand` equivalent. Browsers that
 * don't support `ClipboardItem` return `false` and the caller falls
 * back to the existing "Save frame" download path.
 *
 * Privacy posture matches the rest of the capture surface: the image
 * stays client-side. The clipboard write is the user's deliberate act.
 *
 * Returns a Promise<boolean>:
 * - true when the write call resolved successfully
 * - false when the API is unavailable, ClipboardItem can't be built,
 *   or the write rejected (typically permission denial in iframes)
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  const g = globalThis as unknown as {
    navigator?: {
      clipboard?: {
        write?: (items: unknown[]) => Promise<void>;
      };
    };
    ClipboardItem?: new (record: Record<string, Blob>) => unknown;
  };
  if (!g.navigator?.clipboard?.write || !g.ClipboardItem) return false;
  try {
    const item = new g.ClipboardItem({ [blob.type || 'image/png']: blob });
    await g.navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

/**
 * W27 Phase 4 — render a canvas to a PNG blob and copy it to the
 * clipboard. Convenience wrapper that bridges the canvas → blob →
 * clipboard flow used by GameOverScene "Copy frame" surface.
 *
 * Returns false when:
 * - `canvas.toBlob` returned null (rare; usually OOM)
 * - the clipboard write was unsupported or denied
 */
export function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        copyImageToClipboard(blob).then(resolve, () => resolve(false));
      }, 'image/png');
    } catch {
      resolve(false);
    }
  });
}
