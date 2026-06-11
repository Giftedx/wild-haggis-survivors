/**
 * W27 Phase 2a — one-shot canvas-to-PNG saver.
 *
 * Zero runtime cost until invoked. No buffer, no background work.
 */
export function saveScreenshot(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve(true);
    }, 'image/png');
  });
}
