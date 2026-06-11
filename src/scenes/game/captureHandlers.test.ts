import { describe, expect, it, vi } from 'vitest';
import { TOAST_COLORS } from '../../ui/toastPalette';

vi.mock('../../core/SettingsManager', () => ({
  getSettingsManager: () => ({
    load: () => ({ captureEnabled: true }),
  }),
}));

describe('createCaptureHandlers', () => {
  it('surfaces a warning toast when F9 clip capture is unsupported', async () => {
    const { createCaptureHandlers } = await import('./captureHandlers');
    const showToast = vi.fn();
    const handlers = createCaptureHandlers({
      getCanvas: () => null,
      getClipRecorder: () => null,
      getJuice: () => ({ showToast }) as never,
      getRunContextForCapture: () => ({
        mode: 'death',
        variantLabel: 'Classic Haggis',
        timeSurvivedSec: 0,
      }),
    });

    handlers.handleF9SaveClip();

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Clip saving is not supported'),
      TOAST_COLORS.warning,
    );
  });
});
