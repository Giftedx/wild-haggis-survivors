import Phaser from 'phaser';
import { audio } from '../../systems/AudioSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { UpdateTickers } from '../../utils/UpdateTickers';
import { t } from '../../core/i18n';

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Run-start 3-2-1-Go countdown. Owns the COUNTDOWN time lock — releases it
 * once the final step fades. Countdown steps are scheduled on raw-time
 * update tickers (not scene.time.delayedCall) so they also fire if the
 * caller uses the same raw/scaled split this scene uses everywhere.
 */
export function showCountdown(
  scene: Phaser.Scene,
  timeManager: TimeManager,
  updateTickers: UpdateTickers,
  getUiViewport: () => Viewport,
): void {
  const { x, y, width, height } = getUiViewport();
  const steps = ['3', '2', '1', t('ui.game.countdown_go')];
  let i = 0;

  const showNext = () => {
    if (i >= steps.length) {
      timeManager.release('COUNTDOWN');
      return;
    }

    const label = steps[i];
    const isFinal = i === steps.length - 1;
    const text = scene.add.text(x + width / 2, y + height / 2, label, {
      fontFamily: 'monospace',
      fontSize: isFinal ? '40px' : '64px',
      color: isFinal ? '#d4a017' : '#ffffff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setScale(0.5).setAlpha(0);

    scene.tweens.add({
      targets: text,
      scale: isFinal ? 1.2 : 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: text,
          alpha: 0,
          scale: 1.5,
          duration: isFinal ? 400 : 250,
          delay: isFinal ? 300 : 200,
          onComplete: () => {
            text.destroy();
            i++;
            showNext();
          },
        });
      },
    });

    audio.playClick();
  };

  updateTickers.addOnce('raw', 300, showNext);
}
