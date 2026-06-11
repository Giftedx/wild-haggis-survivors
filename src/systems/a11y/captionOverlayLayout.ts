/** Last N ms of a caption's life — opacity ramps to 0 (matches `CaptionOverlay`). */
export const CAPTION_FADE_OUT_MS = 400;

/**
 * Line alpha for a caption given remaining lifetime. Full opacity until the
 * fade window, then linear falloff to 0.
 */
export function captionFadeAlpha(remainingMs: number, fadeWindowMs: number): number {
  if (fadeWindowMs <= 0) return remainingMs > 0 ? 1 : 0;
  if (remainingMs <= 0) return 0;
  if (remainingMs >= fadeWindowMs) return 1;
  return remainingMs / fadeWindowMs;
}

/**
 * Vertical offset for line `lineIndex` (0 = oldest / top of stack) so newer
 * lines sit lower without pushing the current read upward.
 */
export function captionStackYOffset(
  lineIndex: number,
  lineCount: number,
  lineSpacing: number,
): number {
  if (lineCount <= 0) return 0;
  const step = (lineCount - 1 - lineIndex) * lineSpacing;
  return step === 0 ? 0 : -step;
}
