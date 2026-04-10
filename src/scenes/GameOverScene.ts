import Phaser from 'phaser';
import { COLORS } from '../config';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantKey } from '../data/variants';
import type { GameOverPayload } from './gameOverPayload';

/**
 * Run result screen — owns UI after GameScene tears down (macro lifecycle).
 */
export class GameOverScene extends Phaser.Scene {
  private payload!: GameOverPayload;

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data?: GameOverPayload): void {
    this.payload = data!;
  }

  create(): void {
    if (!this.payload?.summary || !this.payload.runResult) {
      this.scene.start('MainMenu');
      return;
    }
    const { width, height } = this.scale;
    const d = 200;
    const { mode, summary, runResult } = this.payload;
    const isVictory = mode === 'victory';
    const titleColor = isVictory ? '#d4a017' : '#cc3333';
    const panelStroke = isVictory ? COLORS.WHISKY_GOLD : 0xaa4444;
    const summaryTime = this.formatClockTime(summary.timeSurvivedSec);
    const goldBreakdown = `Time ${Math.floor(summary.timeSurvivedSec * 0.4)}  |  Kills ${Math.floor(summary.enemiesKilled * 0.4)}  |  Boss ${summary.bossGold}  |  Coins ${summary.coinGold ?? 0}`;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive();
    const panel = this.add
      .rectangle(width / 2, height / 2, 684, 520, 0x101729, 0)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setStrokeStyle(2, panelStroke, 1);
    this.tweens.add({ targets: overlay, alpha: 0.82, duration: 420 });
    this.tweens.add({ targets: panel, alpha: 0.98, duration: 420 });

    const title = this.add
      .text(width / 2, 86, isVictory ? 'VICTORY!' : 'YOU DIED', {
        fontFamily: 'monospace',
        fontSize: isVictory ? '56px' : '52px',
        color: titleColor,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0)
      .setScale(isVictory ? 0.7 : 1.4);
    const subtitle = this.add
      .text(width / 2, 126, isVictory ? 'The Highlands are safe... for now.' : 'The glen took its due. Bank the run and go again.', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#a8b0c0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 480,
      delay: 180,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 320, delay: 320 });

    const variantChip = this.add
      .rectangle(width / 2, 168, 596, 34, 0x16213a, 0.96)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x355079, 1)
      .setAlpha(0);
    const variantText = this.add
      .text(width / 2, 168, `Run Variant: ${this.payload.variantLabel}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d7e3ff',
        wordWrap: { width: 560 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    this.tweens.add({ targets: [variantChip, variantText], alpha: 1, duration: 260, delay: 430 });

    const statsPanel = this.add
      .rectangle(width / 2, 245, 596, 108, 0x131d32, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283a5f, 1)
      .setAlpha(0);
    const goldPanel = this.add
      .rectangle(width / 2, 343, 596, 72, 0x141d2f, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x2f435f, 1)
      .setAlpha(0);
    const unlockPanel = this.add
      .rectangle(width / 2, 443, 596, 112, 0x121a2a, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283447, 1)
      .setAlpha(0);
    this.tweens.add({ targets: [statsPanel, goldPanel, unlockPanel], alpha: 1, duration: 260, delay: 520 });

    const statBaseY = 214;
    const statGap = 142;
    this.createResultStat(width / 2 - statGap, statBaseY, 'Time', summaryTime, d + 3, 600);
    this.createResultStat(width / 2, statBaseY, 'Kills', `${summary.enemiesKilled}`, d + 3, 660);
    this.createResultStat(width / 2 + statGap, statBaseY, 'Level', `${this.payload.xpLevel}`, d + 3, 720);
    this.createResultStat(width / 2 - statGap / 2, statBaseY + 42, 'Bosses', `${this.payload.bossKillCount}`, d + 3, 780);
    this.createResultStat(width / 2 + statGap / 2, statBaseY + 42, 'Passives', `${this.payload.ownedPassiveCount}`, d + 3, 840);

    const loadoutSummary = this.add
      .text(
        width / 2,
        290,
        `Weapons ${this.payload.weaponCount} (${this.payload.evolvedCount} evolved)\n${this.payload.buildSummary}`,
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#9ea8bb',
          align: 'center',
          wordWrap: { width: 560 },
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    this.tweens.add({ targets: loadoutSummary, alpha: 1, duration: 260, delay: 900 });

    const goldTitle = this.add
      .text(width / 2, 326, `+${runResult.goldEarned} Gold`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#d4a017',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    const goldText = this.add
      .text(width / 2, 355, goldBreakdown, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#b69643',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    this.tweens.add({
      targets: goldTitle,
      alpha: 1,
      scale: { from: 0.7, to: 1 },
      duration: 300,
      delay: 980,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: goldText, alpha: 1, duration: 240, delay: 1080 });

    this.addRunResultUnlockContent(width / 2, 402, d + 3, runResult.newlyUnlockedVariants, 1140);

    this.createResultActionButton(width / 2 - 196, 542, 172, 42, 'PLAY AGAIN', COLORS.SCOTTISH_BLUE, '#ffffff', 1240, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Game');
    });
    this.createResultActionButton(width / 2, 542, 172, 42, 'UPGRADES', COLORS.WHISKY_GOLD, '#000000', 1300, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Shop');
    });
    this.createResultActionButton(width / 2 + 196, 542, 172, 42, 'MENU', 0x444444, '#ffffff', 1360, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('MainMenu');
    });
  }

  private addRunResultUnlockContent(
    centerX: number,
    y: number,
    depth: number,
    variantKeys: VariantKey[],
    delay: number
  ): void {
    const tips = [
      'Tip: Press SPACE to dash through enemies.',
      'Tip: Combos boost your damage when you keep killing.',
      'Tip: Armor reduces all incoming damage.',
      'Tip: Max a weapon plus its passive to evolve it.',
      'Tip: Pipers buff nearby enemies. Kill them first.',
      'Tip: Clockwise kiting works with the drift.',
    ];
    const hasUnlocks = variantKeys.length > 0;
    const headingText = hasUnlocks
      ? variantKeys.length === 1
        ? 'NEW VARIANT UNLOCKED'
        : 'NEW VARIANTS UNLOCKED'
      : 'NEXT RUN TIP';
    const headingColor = hasUnlocks ? '#77c977' : '#8aa4d7';

    const heading = this.add
      .text(centerX, y, headingText, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: headingColor,
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: heading, alpha: 1, duration: 260, delay });

    if (!hasUnlocks) {
      const tip = this.add
        .text(centerX, y + 34, tips[Math.floor(Math.random() * tips.length)], {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#a8b0c0',
          fontStyle: 'italic',
          align: 'center',
          wordWrap: { width: 520 },
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      this.tweens.add({ targets: tip, alpha: 1, duration: 260, delay: delay + 90 });
      return;
    }

    if (variantKeys.length === 1) {
      const variant = getVariantByKey(variantKeys[0]);
      const nameText = this.add
        .text(centerX, y + 26, variant.name, {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      const flavorText = this.add
        .text(centerX, y + 58, variant.flavorText, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#9ea8bb',
          align: 'center',
          wordWrap: { width: 520 },
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      this.tweens.add({ targets: [nameText, flavorText], alpha: 1, duration: 300, delay: delay + 90 });
      return;
    }

    const bodyText = variantKeys.length === 2
      ? variantKeys.map((key) => getVariantByKey(key).name).join('\n')
      : variantKeys.map((key) => `- ${getVariantByKey(key).name}`).join('\n');
    const unlockList = this.add
      .text(centerX, y + 30, bodyText, {
        fontFamily: 'monospace',
        fontSize: variantKeys.length === 2 ? '18px' : '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    this.tweens.add({ targets: unlockList, alpha: 1, duration: 300, delay: delay + 90 });
  }

  private createResultStat(
    x: number,
    y: number,
    label: string,
    value: string,
    depth: number,
    delay: number
  ): void {
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#7f8ca7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    const valueText = this.add
      .text(x, y + 18, value, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);

    this.tweens.add({ targets: [labelText, valueText], alpha: 1, duration: 220, delay });
  }

  private createResultActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    fill: number,
    textColor: string,
    delay: number,
    onClick: () => void
  ): void {
    const button = this.add
      .rectangle(x, y, width, height, fill, 1)
      .setScrollFactor(0)
      .setDepth(203)
      .setAlpha(0);
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(204)
      .setAlpha(0);

    this.tweens.add({
      targets: [button, text],
      alpha: 1,
      duration: 260,
      delay,
      onComplete: () => button.setInteractive({ useHandCursor: true }),
    });

    button.on('pointerover', () => button.setFillStyle(Phaser.Display.Color.ValueToColor(fill).lighten(16).color));
    button.on('pointerout', () => button.setFillStyle(fill));
    button.on('pointerdown', onClick);
  }

  private formatClockTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
