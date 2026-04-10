import Phaser from 'phaser';
import type { ISceneContext } from '../core/ISceneContext';
import { SaveManager } from '../core/SaveManager';
import { t } from '../core/i18n';

const TOKEN_MOVE = 'TUTORIAL_MOVE';
const TOKEN_GEM = 'TUTORIAL_GEM';

type Phase = 'done' | 'move' | 'await_gem' | 'await_level';

/**
 * One-shot FTUE: movement tip → first gem tip → complete on first level-up (level 2).
 */
export class TutorialSystem {
  private phase: Phase = 'done';
  private readonly scene: Phaser.Scene & ISceneContext;
  private readonly metaSave: SaveManager;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private bodyText: Phaser.GameObjects.Text | null = null;
  private highlight: Phaser.GameObjects.Arc | null = null;
  private gemHandler?: (gx: number, gy: number, value: number) => void;
  private keyDownHandler?: (e: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene & ISceneContext, metaSave: SaveManager) {
    this.scene = scene;
    this.metaSave = metaSave;
  }

  dispose(): void {
    this.detachGemListener();
    this.detachKeyHandler();
    this.clearVisuals();
    this.releaseTokens();
    this.phase = 'done';
  }

  startRunIfNeeded(): void {
    if (this.metaSave.load().hasCompletedTutorial) {
      this.phase = 'done';
      return;
    }
    this.phase = 'move';
    this.openPausedOverlay(t('tutorial.move'), TOKEN_MOVE, () => {
      this.phase = 'await_gem';
      this.bindGemOnce();
    });
  }

  /** Call when the player reaches a new character level (first time is `newLevel === 2`). */
  notifyFirstLevelReached(newLevel: number): void {
    if (newLevel < 2) return;
    if (this.metaSave.load().hasCompletedTutorial) return;
    this.detachGemListener();
    this.detachKeyHandler();
    this.clearVisuals();
    this.releaseTokens();
    this.metaSave.update((cur) => ({ ...cur, hasCompletedTutorial: true }));
    this.phase = 'done';
  }

  private releaseTokens(): void {
    const tm = this.scene.getTimeManager();
    tm.release(TOKEN_MOVE);
    tm.release(TOKEN_GEM);
  }

  private clearModal(): void {
    this.overlay?.destroy();
    this.overlay = null;
    this.bodyText?.destroy();
    this.bodyText = null;
  }

  private clearVisuals(): void {
    this.highlight?.destroy();
    this.highlight = null;
    this.clearModal();
  }

  private detachKeyHandler(): void {
    if (this.keyDownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    this.keyDownHandler = undefined;
  }

  private detachGemListener(): void {
    if (!this.gemHandler) return;
    this.scene.getXPSystem().events.off('gemSpawned', this.gemHandler);
    this.gemHandler = undefined;
  }

  private bindGemOnce(): void {
    const xp = this.scene.getXPSystem();
    this.gemHandler = (gx: number, gy: number, _v: number) => {
      if (this.phase !== 'await_gem') return;
      this.gemHandler = undefined;
      this.pulseAt(gx, gy);
      this.openPausedOverlay(t('tutorial.gem'), TOKEN_GEM, () => {
        this.phase = 'await_level';
      });
    };
    xp.events.once('gemSpawned', this.gemHandler);
  }

  private pulseAt(wx: number, wy: number): void {
    const r = this.scene.add.circle(wx, wy, 28, 0xffee88, 0.35).setDepth(55);
    this.highlight = r;
    this.scene.tweens.add({
      targets: r,
      scale: 1.8,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.highlight === r) this.highlight = null;
        r.destroy();
      },
    });
  }

  private openPausedOverlay(message: string, token: string, afterDismiss: () => void): void {
    this.releaseTokens();
    this.clearModal();
    this.scene.getTimeManager().request(token, { pausePhysics: true, timeScale: 0 });

    const { width, height } = this.scene.scale;
    const pad = 28;
    this.overlay = this.scene.add
      .rectangle(width / 2, height / 2, width - pad * 2, 120, 0x0a1020, 0.94)
      .setStrokeStyle(2, 0x5a7ab8, 1)
      .setScrollFactor(0)
      .setDepth(600);
    this.bodyText = this.scene.add
      .text(width / 2, height / 2, message, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e8eef8',
        align: 'center',
        wordWrap: { width: width - pad * 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(601);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.detachKeyHandler();
      this.scene.getTimeManager().release(token);
      this.clearModal();
      afterDismiss();
    };

    this.keyDownHandler = (e: KeyboardEvent) => {
      e.preventDefault();
      finish();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keyDownHandler);
    }
    this.scene.input.once('pointerdown', finish);
  }
}
