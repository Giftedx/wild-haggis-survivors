import Phaser from 'phaser';
import type { SettingsManager } from '../../core/SettingsManager';
import { resetCameraViewportCache } from '../../ui/cameraViewport';
import { resolveFilmGrainBaseAlpha, resolveFilmGrainDriftPx } from './filmGrainTuning';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Subtle scroll-locked film grain over the playfield. Disabled under
 * high-contrast; dampened when reduce-particles is on. Self-rebinds on
 * viewport resize via a debounced wall-clock handler (scene timers would
 * respect gameplay pause and stall during level-up).
 */
export class FilmGrainOverlay {
  private image: Phaser.GameObjects.Image | null = null;
  private resizeHandler?: () => void;
  private resizeDebounceId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly settingsManager: SettingsManager,
    private readonly getUiViewport: () => Viewport,
  ) {}

  install(): void {
    this.destroyOverlay();
    const prefs = this.settingsManager.load();
    if (prefs.highContrastUi) return;
    if (!this.scene.textures.exists('film_grain')) return;
    const v = this.getUiViewport();
    const baseAlpha = resolveFilmGrainBaseAlpha(prefs.reduceParticles, prefs.motionScale);
    const img = this.scene.add
      .image(v.x + v.width / 2, v.y + v.height / 2, 'film_grain')
      .setScrollFactor(0)
      .setDepth(22)
      .setBlendMode(Phaser.BlendModes.ADD);
    img.setDisplaySize(v.width + 6, v.height + 6);
    img.setAlpha(baseAlpha * 0.82);
    this.scene.tweens.add({
      targets: img,
      alpha: baseAlpha * 1.1,
      duration: 3800,
      ...TWEEN_INFINITE_BREATHE,
    });
    const driftPx = resolveFilmGrainDriftPx(prefs.reduceParticles, prefs.motionScale);
    this.scene.tweens.add({
      targets: img,
      x: img.x + driftPx,
      duration: 9200 + Math.random() * 1800,
      ...TWEEN_INFINITE_BREATHE,
    });
    this.image = img;
  }

  bindViewportResize(): void {
    this.unbindViewportResize();
    this.resizeHandler = () => {
      resetCameraViewportCache();
      this.scheduleRelayout();
    };
    this.scene.scale.on('resize', this.resizeHandler);
  }

  unbindViewportResize(): void {
    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
      this.resizeDebounceId = null;
    }
    if (this.resizeHandler) {
      try {
        this.scene.scale.off('resize', this.resizeHandler);
      } catch {
        /* ignore */
      }
      this.resizeHandler = undefined;
    }
  }

  destroy(): void {
    this.unbindViewportResize();
    this.destroyOverlay();
  }

  private destroyOverlay(): void {
    if (!this.image) return;
    try {
      this.scene.tweens.killTweensOf(this.image);
    } catch {
      /* ignore */
    }
    try {
      this.image.destroy();
    } catch {
      /* ignore */
    }
    this.image = null;
  }

  private scheduleRelayout(): void {
    if (this.resizeDebounceId !== null) {
      clearTimeout(this.resizeDebounceId);
      this.resizeDebounceId = null;
    }
    this.resizeDebounceId = setTimeout(() => {
      this.resizeDebounceId = null;
      if (!this.scene.sys?.isActive()) return;
      this.install();
    }, 72);
  }
}
