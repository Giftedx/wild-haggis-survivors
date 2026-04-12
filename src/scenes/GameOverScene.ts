import Phaser from 'phaser';
import { COLORS } from '../config';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import { getVariantByKey, VariantKey } from '../data/variants';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { WEAPON_DEFS } from '../data/weapons';
import { sortedWeaponDamageEntries } from '../systems/RunStatsTracker';
import type { GameOverPayload } from './gameOverPayload';
import { t } from '../core/i18n';
import { getSettingsManager } from '../core/SettingsManager';

/**
 * Run result screen — owns UI after GameScene tears down (macro lifecycle).
 */
export class GameOverScene extends Phaser.Scene {
  // Payload is optional because Phaser can restart a scene with no data
  // (e.g. during hot-reload in dev, or if a caller mis-uses scene.start).
  // We fall back to MainMenu in create() when it's missing rather than
  // asserting non-null here and crashing on the first field access.
  private payload: GameOverPayload | null = null;

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data?: GameOverPayload): void {
    this.payload = data ?? null;
  }

  create(): void {
    if (!this.payload?.summary || !this.payload.runResult) {
      this.scene.start('MainMenu');
      return;
    }
    const { width, height } = this.scale;
    const d = 200;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const { mode, summary, runResult } = this.payload;
    const isVictory = this.payload.isVictory ?? (mode === 'victory');
    const weaponDamage = this.payload.weaponDamage ?? {};
    const titleColor = isVictory ? '#d4a017' : '#cc3333';
    const panelStroke = isVictory ? COLORS.WHISKY_GOLD : 0xaa4444;
    const summaryTime = this.formatClockTime(summary.timeSurvivedSec);
    const goldBreakdown = t('ui.gameOver.gold_breakdown', {
      timeGold: Math.floor(summary.timeSurvivedSec * 0.4),
      killGold: Math.floor(summary.enemiesKilled * 0.4),
      bossGold: summary.bossGold,
      coinGold: summary.coinGold ?? 0,
    });

    // Responsive panel layout. Content positions are relative to the panel
    // top (not the screen top) so taller/narrower viewports don't leave the
    // title + subtitle dangling above the outline as a hardcoded
    // height/2 - 328 would do on screen sizes outside the original design
    // target (720px tall).
    const PANEL_W = 684;
    const PANEL_H = 656;
    // Clamp the panel so it stays fully visible even on viewports smaller
    // than PANEL_H. On small screens the panel becomes the clamp region;
    // on larger screens it centers naturally.
    const panelCenterX = width / 2;
    const panelCenterY = Math.max(PANEL_H / 2 + 8, Math.min(height - PANEL_H / 2 - 8, height / 2));
    const panelTop = panelCenterY - PANEL_H / 2;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 0)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive();
    const panel = this.add
      .rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, highContrastUi ? 0x080d17 : 0x101729, 0)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setStrokeStyle(2, highContrastUi ? 0x8fb4ff : panelStroke, 1);
    this.tweens.add({ targets: overlay, alpha: 0.82, duration: 420 });
    this.tweens.add({ targets: panel, alpha: 0.98, duration: 420 });

    // Rotating death titles/subtitles — each death feels different
    const deathTitleKey = isVictory ? 'ui.gameOver.victory_title'
      : ['ui.gameOver.death_title', 'ui.gameOver.death_title_2', 'ui.gameOver.death_title_3', 'ui.gameOver.death_title_4'][Phaser.Math.Between(0, 3)];
    const deathSubKey = isVictory ? 'ui.gameOver.victory_sub'
      : ['ui.gameOver.death_sub', 'ui.gameOver.death_sub_2', 'ui.gameOver.death_sub_3', 'ui.gameOver.death_sub_4'][Phaser.Math.Between(0, 3)];

    const title = this.add
      .text(panelCenterX, panelTop + 54, t(deathTitleKey), {
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
    title.setScale((isVictory ? 0.7 : 1.4) * uiScale);
    const subtitle = this.add
      .text(panelCenterX, panelTop + 94, t(deathSubKey), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#b8a88a',
        align: 'center',
        // Wrap within the panel so the subtitle doesn't run past the yellow
        // outline on narrow viewports.
        wordWrap: { width: PANEL_W - 48 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setAlpha(0);
    subtitle.setScale(uiScale);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: uiScale,
      duration: 480,
      delay: 180,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 320, delay: 320 });

    // Variant chip — warm identity reminder with haggis sprite + flavor text
    const variantChipY = panelTop + 140;
    const variantChip = this.add
      .rectangle(panelCenterX, variantChipY, 596, 48, 0x16213a, 0.96)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x355079, 1)
      .setAlpha(0);
    // Small haggis sprite — identity anchor even on the results screen
    const variantDef = this.payload.variantKey ? getVariantByKey(this.payload.variantKey) : null;
    if (variantDef && this.textures.exists(variantDef.textureKey)) {
      const miniHaggis = this.add
        .sprite(panelCenterX - 270, variantChipY, variantDef.textureKey)
        .setScale(1.4 * uiScale)
        .setScrollFactor(0)
        .setDepth(d + 3)
        .setAlpha(0);
      this.tweens.add({ targets: miniHaggis, alpha: 1, duration: 260, delay: 430 });
    }
    const variantText = this.add
      .text(panelCenterX + 8, variantChipY - 8, t('ui.gameOver.run_variant', { label: this.payload.variantLabel }), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#d7e3ff',
        fontStyle: 'bold',
        wordWrap: { width: 500 },
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    variantText.setScale(uiScale);
    // Flavor text — the variant's personality line, warm and quiet
    const flavorKey = variantDef?.flavorKey;
    if (flavorKey) {
      const variantFlavor = this.add
        .text(panelCenterX + 8, variantChipY + 10, t(flavorKey), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8a9ab8',
          fontStyle: 'italic',
          wordWrap: { width: 480 },
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(d + 3)
        .setAlpha(0);
      variantFlavor.setScale(uiScale);
      this.tweens.add({ targets: variantFlavor, alpha: 1, duration: 260, delay: 430 });
    }
    this.tweens.add({ targets: [variantChip, variantText], alpha: 1, duration: 260, delay: 430 });

    const statsPanel = this.add
      .rectangle(panelCenterX, panelTop + 204, 596, 92, 0x131d32, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283a5f, 1)
      .setAlpha(0);
    const goldPanel = this.add
      .rectangle(panelCenterX, panelTop + 446, 596, 70, 0x141d2f, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x2f435f, 1)
      .setAlpha(0);
    const weaponDamagePanel = this.add
      .rectangle(panelCenterX, panelTop + 330, 596, 158, 0x0f1828, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x243552, 1)
      .setAlpha(0);
    const unlockPanel = this.add
      .rectangle(panelCenterX, panelTop + 528, 596, 94, 0x121a2a, 0.95)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setStrokeStyle(1, 0x283447, 1)
      .setAlpha(0);
    this.tweens.add({ targets: [statsPanel, weaponDamagePanel, goldPanel, unlockPanel], alpha: 1, duration: 260, delay: 520 });

    const statBaseY = panelTop + 178;
    const statGap = 142;
    const pb = this.payload.previousBests;
    this.createResultStat(panelCenterX - statGap, statBaseY, t('ui.gameOver.stat_time'), summaryTime, d + 3, 600,
      pb && summary.timeSurvivedSec > pb.bestTime);
    this.createResultStat(panelCenterX, statBaseY, t('ui.gameOver.stat_kills'), `${summary.enemiesKilled}`, d + 3, 660,
      pb && summary.enemiesKilled > pb.bestKills);
    this.createResultStat(panelCenterX + statGap, statBaseY, t('ui.gameOver.stat_level'), `${this.payload.xpLevel}`, d + 3, 720,
      pb && this.payload.xpLevel > pb.bestLevel);
    this.createResultStat(panelCenterX - statGap, statBaseY + 42, t('ui.gameOver.stat_bosses'), `${this.payload.bossKillCount}`, d + 3, 780);
    this.createResultStat(panelCenterX, statBaseY + 42, t('ui.gameOver.stat_passives'), `${this.payload.ownedPassiveCount}`, d + 3, 840);
    this.createResultStat(panelCenterX + statGap, statBaseY + 42, t('ui.gameOver.stat_combo'), `${summary.bestCombo ?? 0}x`, d + 3, 900,
      pb && (summary.bestCombo ?? 0) > pb.bestCombo);

    const loadoutSummaryText = this.buildBoundedLoadoutSummary(this.payload.buildSummary, 2);
    const loadoutSummary = this.add
      .text(
        panelCenterX,
        panelTop + 266,
        `${t('ui.gameOver.weapons_line', { count: this.payload.weaponCount, evolved: this.payload.evolvedCount })}\n${loadoutSummaryText}`,
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#9ea8bb',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: 560 },
        }
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    loadoutSummary.setScale(uiScale);
    this.tweens.add({ targets: loadoutSummary, alpha: 1, duration: 260, delay: 900 });

    const weaponRows = this.buildWeaponDamageRows(weaponDamage, summary, runResult.goldEarned, 3);
    const loadoutBottom = loadoutSummary.y + loadoutSummary.height;
    const weaponHeading = this.add
      .text(panelCenterX, loadoutBottom + 10, t('ui.gameOver.damage_by_weapon'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#7f8ca7',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponHeading.setScale(uiScale);
    const weaponBody = this.add
      .text(panelCenterX, weaponHeading.y + 16, weaponRows, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#c4cdd8',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    weaponBody.setScale(uiScale);
    this.tweens.add({ targets: [weaponHeading, weaponBody], alpha: 1, duration: 260, delay: 940 });
    const weaponBodyBottom = weaponBody.y + weaponBody.height;
    const goldTitleY = Math.max(panelTop + 420, weaponBodyBottom + 16);

    const goldTitle = this.add
      .text(panelCenterX, goldTitleY, t('ui.gameOver.gold_title', { amount: runResult.goldEarned }), {
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
    goldTitle.setScale(uiScale);
    const goldText = this.add
      .text(panelCenterX, goldTitleY + 30, goldBreakdown, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#b69643',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 3)
      .setAlpha(0);
    goldText.setScale(uiScale);
    this.tweens.add({
      targets: goldTitle,
      alpha: 1,
      scale: { from: 0.7, to: 1 },
      duration: 300,
      delay: 980,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: goldText, alpha: 1, duration: 240, delay: 1080 });

    this.addRunResultUnlockContent(panelCenterX, panelTop + 490, d + 3, runResult.newlyUnlockedVariants, 1140);

    const buttonsY = panelTop + 612;
    this.createResultActionButton(panelCenterX - 196, buttonsY, 172, 42, t('ui.gameOver.play_again'), COLORS.SCOTTISH_BLUE, '#ffffff', 1240, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Game');
    });
    this.createResultActionButton(panelCenterX, buttonsY, 172, 42, t('ui.gameOver.upgrades'), COLORS.WHISKY_GOLD, '#000000', 1300, () => {
      audio.playClick();
      musicEngine.stop();
      this.scene.start('Shop');
    });
    this.createResultActionButton(panelCenterX + 196, buttonsY, 172, 42, t('ui.gameOver.menu'), 0x444444, '#ffffff', 1360, () => {
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
      t('ui.tips.dash'),
      t('ui.tips.combo'),
      t('ui.tips.armor'),
      t('ui.tips.evolve'),
      t('ui.tips.piper'),
      t('ui.tips.kite'),
    ];
    const hasUnlocks = variantKeys.length > 0;
    const headingText = hasUnlocks
      ? variantKeys.length === 1
        ? t('ui.gameOver.unlock_single')
        : t('ui.gameOver.unlock_multi')
      : t('ui.gameOver.next_tip');
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

    // Sparkle burst around the unlock heading — celebratory soul moment
    this.addUnlockSparkles(centerX, y + 20, depth + 1, delay + 60);

    if (variantKeys.length === 1) {
      const variant = getVariantByKey(variantKeys[0]);
      const nameText = this.add
        .text(centerX, y + 26, t(variant.nameKey), {
          fontFamily: 'monospace',
          fontSize: '26px',
          color: '#d4a017',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(0);
      const flavorText = this.add
        .text(centerX, y + 58, t(variant.flavorKey), {
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
      ? variantKeys.map((key) => t(getVariantByKey(key).nameKey)).join('\n')
      : variantKeys.map((key) => `- ${t(getVariantByKey(key).nameKey)}`).join('\n');
    const unlockList = this.add
      .text(centerX, y + 30, bodyText, {
        fontFamily: 'monospace',
        fontSize: variantKeys.length === 2 ? '18px' : '14px',
        color: '#d4a017',
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

  /** Celebratory sparkle burst — 8 golden particles radiating outward from center. */
  private addUnlockSparkles(cx: number, cy: number, depth: number, delay: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = this.add.circle(cx, cy, 3, 0xffdd44, 0)
        .setScrollFactor(0).setDepth(depth);
      this.tweens.add({
        targets: sparkle,
        x: cx + Math.cos(angle) * 60,
        y: cy + Math.sin(angle) * 40,
        alpha: { from: 0, to: 0.9 },
        scale: { from: 0.3, to: 1.5 },
        duration: 600,
        delay: delay + i * 50,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 0,
            duration: 400,
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }
  }

  private createResultStat(
    x: number,
    y: number,
    label: string,
    value: string,
    depth: number,
    delay: number,
    isNewBest?: boolean
  ): void {
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
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
        fontSize: '20px',
        color: isNewBest ? '#d4a017' : '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);

    this.tweens.add({ targets: [labelText, valueText], alpha: 1, duration: 220, delay });

    if (isNewBest) {
      const badge = this.add
        .text(x, y + 36, t('ui.gameOver.new_best'), {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#d4a017',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
        .setAlpha(0)
        .setScale(0.5);
      this.tweens.add({
        targets: badge,
        alpha: 1,
        scale: 1,
        duration: 360,
        delay: delay + 200,
        ease: 'Back.easeOut',
      });
    }
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

  private buildBoundedLoadoutSummary(rawSummary: string, maxDetailLines: number): string {
    const detailLines = rawSummary
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const visible = detailLines.slice(0, maxDetailLines);
    if (detailLines.length > maxDetailLines) {
      visible.push(t('ui.gameOver.more_weapons', { count: detailLines.length - maxDetailLines }));
    }
    return visible.join('\n');
  }

  private buildWeaponDamageRows(
    weaponDamage: Record<string, number>,
    summary: GameOverPayload['summary'],
    goldEarned: number,
    maxRows: number
  ): string {
    const entries = sortedWeaponDamageEntries(weaponDamage);
    const totalDamage = entries.reduce((sum, e) => sum + e.damage, 0);
    const lines: string[] = [
      t('ui.gameOver.damage_summary', {
        kills: summary.enemiesKilled,
        time: this.formatClockTime(summary.timeSurvivedSec),
        gold: goldEarned,
      }),
    ];
    if (entries.length === 0) {
      lines.push(t('ui.gameOver.no_weapon_damage'));
      return lines.join('\n');
    }
    const evoDisplay = new Map(EVOLUTION_RECIPES.map((r) => [r.evolvedWeapon, t(r.nameKey)]));
    for (const e of entries.slice(0, maxRows)) {
      const def = WEAPON_DEFS[e.key as import('../data/weapons').WeaponKey];
      const label = (def?.name ?? evoDisplay.get(e.key) ?? e.key).slice(0, 18);
      const pct = totalDamage > 0 ? Math.round((e.damage / totalDamage) * 100) : 0;
      lines.push(`${label.padEnd(18, ' ')} ${e.damage.toString().padStart(6, ' ')}   ${pct.toString().padStart(2, ' ')}%`);
    }
    if (entries.length > maxRows) {
      lines.push(t('ui.gameOver.more_weapons', { count: entries.length - maxRows }));
    }
    return lines.join('\n');
  }

  private formatClockTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
