import Phaser from 'phaser';
import { GAME } from '../../config';
import type { Player } from '../../entities/Player';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { BiomeId } from '../../data/biomes';
import { t } from '../../core/i18n';

export interface GameTickerHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
  getUiViewport(): { x: number; y: number; width: number; height: number };
  getBanter(): BanterSystem | null;
  getCurrentBiomeId(): BiomeId | null;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
}

export class GameTickers {
  private dashIndicator: Phaser.GameObjects.Graphics | null = null;
  private boundaryWarning: Phaser.GameObjects.Rectangle | null = null;
  private lowHpCaptionArmed = true;
  private lastBiomeForBanter: BiomeId | null = null;
  private lastBanterFireMs = 0;

  constructor(private readonly hooks: GameTickerHooks) {}

  reset(): void {
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
    this.lowHpCaptionArmed = true;
    this.lastBiomeForBanter = null;
    this.lastBanterFireMs = 0;
  }

  destroy(): void {
    this.dashIndicator?.destroy();
    this.dashIndicator = null;
    this.boundaryWarning?.destroy();
    this.boundaryWarning = null;
  }

  updateDashIndicator(): void {
    const scene = this.hooks.getScene();
    const player = this.hooks.getPlayer();
    if (!this.dashIndicator) {
      this.dashIndicator = scene.add.graphics().setDepth(10);
    }
    this.dashIndicator.clear();

    const frac = player.getDashCooldownFraction();
    if (frac <= 0) return;

    this.dashIndicator.lineStyle(2, 0xd4a017, 0.6);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (1 - frac) * Math.PI * 2;
    this.dashIndicator.beginPath();
    this.dashIndicator.arc(player.x, player.y + 20, 8, startAngle, endAngle, false);
    this.dashIndicator.strokePath();
  }

  updateBoundaryWarning(): void {
    const scene = this.hooks.getScene();
    const player = this.hooks.getPlayer();
    const { x, y, width, height } = this.hooks.getUiViewport();
    if (
      !this.boundaryWarning
      || this.boundaryWarning.width !== width
      || this.boundaryWarning.height !== height
      || this.boundaryWarning.x !== x + width / 2
      || this.boundaryWarning.y !== y + height / 2
    ) {
      this.boundaryWarning?.destroy();
      this.boundaryWarning = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0xff0000, 0)
        .setScrollFactor(0).setDepth(44);
    }
    const margin = 200;
    const distToEdge = Math.min(
      player.x, player.y,
      GAME.WORLD_WIDTH - player.x,
      GAME.WORLD_HEIGHT - player.y
    );
    if (distToEdge < margin) {
      this.boundaryWarning.setAlpha(0.15 * (1 - distToEdge / margin));
    } else {
      this.boundaryWarning.setAlpha(0);
    }
  }

  tickBanter(): void {
    const banter = this.hooks.getBanter();
    if (!banter) return;

    const biomeId = this.hooks.getCurrentBiomeId();
    if (biomeId && biomeId !== this.lastBiomeForBanter) {
      if (this.lastBiomeForBanter !== null) {
        banter.request('biome_change');
      }
      this.lastBiomeForBanter = biomeId;
    }

    const nowMs = this.hooks.getScene().time.now;
    if (nowMs - this.lastBanterFireMs > 90_000) {
      banter.request('idle');
      this.lastBanterFireMs = nowMs;
    }

    banter.flush();
  }

  tickLowHpCaption(): void {
    const player = this.hooks.getPlayer();
    const frac = player.getHp() / Math.max(1, player.getMaxHp());
    if (this.lowHpCaptionArmed && frac > 0 && frac < 0.2) {
      this.hooks.caption('low_hp', t('ui.captions.low_hp'), '#ee5566');
      this.hooks.getBanter()?.request('low_hp');
      this.lowHpCaptionArmed = false;
    } else if (!this.lowHpCaptionArmed && frac > 0.4) {
      this.hooks.getBanter()?.request('recover');
      this.lowHpCaptionArmed = true;
    }
  }
}
