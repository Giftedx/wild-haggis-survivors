/**
 * F9 / F10 capture handlers — extracted from GameScene as part of the
 * Phase 5 GameScene drain. F10 snaps the live canvas and saves a PNG;
 * F9 dumps the clip-recorder buffer to a downloadable clip. Both paths
 * are gated on the `captureEnabled` setting and surface a toast to
 * confirm success / failure.
 *
 * The factory pattern keeps the F9 rate-limit (`lastClipSaveAtMs`) as
 * closure-private state — the scene never has to hold or wipe it. The
 * caller stores the returned handlers object on the scene and forwards
 * F-key presses through `wireSceneKeybindings`.
 *
 * Pure presentation/IO: no replay determinism dependency (these only
 * fire from F-key edges, never from the run loop).
 */
import type { ClipRecorder } from '../../utils/clipRecorder';
import { buildCaptureFilename } from '../../utils/captureFilename';
import { formatLocalYmd } from '../../utils/formatDate';
import { saveScreenshot } from '../../utils/screenshot';
import { getSettingsManager } from '../../core/SettingsManager';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { t } from '../../core/i18n';
import type { JuiceSystem } from '../../systems/JuiceSystem';

export interface CaptureRunContext {
  mode: 'victory' | 'death';
  variantLabel: string;
  timeSurvivedSec: number;
  seedCode?: string;
}

export interface CaptureHandlersDeps {
  getCanvas: () => HTMLCanvasElement | null;
  getClipRecorder: () => ClipRecorder | null;
  getJuice: () => JuiceSystem | null | undefined;
  getRunContextForCapture: () => CaptureRunContext;
}

export interface CaptureHandlers {
  handleF10Screenshot(): void;
  handleF9SaveClip(): void;
}

export function createCaptureHandlers(deps: CaptureHandlersDeps): CaptureHandlers {
  let lastClipSaveAtMs = 0;

  const handleF10Screenshot = (): void => {
    if (!getSettingsManager().load().captureEnabled) return;
    const canvas = deps.getCanvas();
    if (!canvas) return;
    const ctx = deps.getRunContextForCapture();
    const filename = buildCaptureFilename('screenshot', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
    });
    void saveScreenshot(canvas, filename).then((ok) => {
      deps.getJuice()?.showToast(
        ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed'),
        ok ? TOAST_COLORS.positive : TOAST_COLORS.warning,
      );
    });
  };

  const handleF9SaveClip = (): void => {
    if (!getSettingsManager().load().captureEnabled) return;
    const recorder = deps.getClipRecorder();
    if (!recorder?.isAvailable()) {
      deps.getJuice()?.showToast(t('ui.toast.clip_unsupported'), TOAST_COLORS.warning);
      return;
    }

    const now = performance.now();
    if (now - lastClipSaveAtMs < 500) return;
    lastClipSaveAtMs = now;

    const ctx = deps.getRunContextForCapture();
    const filename = buildCaptureFilename('clip', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
      clipExtension: recorder.selectedExtension(),
    });

    void recorder.saveLast((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).then((blob) => {
      const key = blob === null ? 'ui.toast.clip_empty' : 'ui.toast.clip_saved';
      const color = blob ? TOAST_COLORS.positive : TOAST_COLORS.warning;
      deps.getJuice()?.showToast(t(key), color);
    }).catch(() => {
      deps.getJuice()?.showToast(t('ui.toast.clip_failed'), TOAST_COLORS.warning);
    });
  };

  return { handleF10Screenshot, handleF9SaveClip };
}
