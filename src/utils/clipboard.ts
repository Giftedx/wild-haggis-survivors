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
