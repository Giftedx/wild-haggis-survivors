/**
 * PickupSpawner — factory for the four collectable pickup types that used
 * to live in ~300 lines of GameScene: treasure chest, golden chest,
 * gold coin, health orb.
 *
 * Each spawn method wires the sprite, bob/pulse tweens, physics overlap
 * with the player, scaled-delta despawn ticker, and collection callback.
 * Kept in one module because the four share the same scaffolding shape
 * (sprite + glow + overlap + despawn) and splitting them would duplicate
 * that lifecycle four times without new clarity.
 *
 * Gameplay mutations (coinGoldEarned, chest tracking, evolution eligibility)
 * live on GameScene and are routed through the hooks object — this module
 * never reaches through `scene as any`.
 */
import Phaser from 'phaser';
import { GAME, COLORS } from '../../config';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { UpdateTickers, TickerHandle } from '../../utils/UpdateTickers';
import type { SFXManager } from '../../systems/audio/SFXManager';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';

export interface PickupSpawnerHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getXPSystem(): XPSystem;
  getUpdateTickers(): UpdateTickers;
  getSFXManager(): SFXManager;
  getChestDurationBonusMs(): number;
  onCoinCollected(amount: number): void;
  trackChest(sprite: Phaser.GameObjects.Sprite, golden: boolean): void;
  untrackChest(sprite: Phaser.GameObjects.Sprite): void;
  pushDespawnHandle(handle: TickerHandle): void;
  offerTreasureEvolutionIfEligible(): void;
  acquireFloatText(
    x: number, y: number, str: string,
    color: string, fontSize?: string, depth?: number,
  ): Phaser.GameObjects.Text | null;
}

export class PickupSpawner {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: PickupSpawnerHooks,
  ) {}

  spawnTreasure(): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    // Spawn near the player but not on top of them
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 200;
    const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 50, GAME.WORLD_WIDTH - 50);
    const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 50, GAME.WORLD_HEIGHT - 50);

    this.hooks.getJuice().showToast(t('ui.game.treasure_nearby'), '#ffcc44');

    // Create a glowing chest with sprite
    const chest = scene.add.sprite(x, y, 'chest').setDepth(5).setScale(1.5);
    this.hooks.trackChest(chest, false);
    const glow = scene.add.circle(x, y, 18, COLORS.WHISKY_GOLD, 0.2).setDepth(4);

    // Pulsing glow animation
    scene.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0 },
      duration: 800,
      repeat: -1,
    });

    // Floating bob animation
    scene.tweens.add({
      targets: chest,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Enable physics for overlap detection
    scene.physics.add.existing(chest, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    // Collect on overlap with player
    const overlapColl = scene.physics.add.overlap(player, chest, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();

      player.heal(Math.ceil(player.getMaxHp() * 0.25));
      for (let i = 0; i < 8; i++) {
        this.hooks.getXPSystem().spawnGem(
          x + Phaser.Math.Between(-20, 20),
          y + Phaser.Math.Between(-20, 20),
          3,
        );
      }

      // ── Chest opening spectacle — satisfying lid-pop + particle spray ──
      scene.tweens.killTweensOf(chest);
      scene.tweens.killTweensOf(glow);
      // 1. Chest jolts upward (lid popping open)
      scene.tweens.add({
        targets: chest,
        y: y - 8,
        scale: 1.7,
        duration: 120,
        ease: 'Quad.easeOut',
      });
      // 2. Expanding bright ring (the moment of opening)
      const openRing = scene.add.circle(x, y, 18, 0xffee88, 0.8).setDepth(6);
      scene.tweens.add({
        targets: openRing,
        scale: 4.5,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => openRing.destroy(),
      });
      // 3. Secondary gold ring (layered spectacle)
      const openRing2 = scene.add.circle(x, y, 10, 0xffcc44, 0.6).setDepth(6);
      scene.tweens.add({
        targets: openRing2,
        scale: 5,
        alpha: 0,
        duration: 500,
        delay: 100,
        ease: 'Quad.easeOut',
        onComplete: () => openRing2.destroy(),
      });
      // 4. Gold particle spray (12 dots scattering up and outward with gravity)
      for (let i = 0; i < 12; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = Phaser.Math.Between(35, 70);
        const dot = scene.add.circle(x, y,
          Phaser.Math.Between(2, 4),
          i % 2 === 0 ? 0xffdd44 : 0xffcc22,
          0.95,
        ).setDepth(7);
        const endX = x + Math.cos(angle) * speed;
        const peakY = y + Math.sin(angle) * speed - 10;
        const finalY = y + Phaser.Math.Between(20, 50);
        scene.tweens.add({
          targets: dot, x: endX, duration: 600 + i * 20,
          onComplete: () => dot.destroy(),
        });
        scene.tweens.add({
          targets: dot,
          y: { value: peakY, duration: 250, ease: 'Quad.easeOut' },
        });
        scene.tweens.add({
          targets: dot,
          y: { value: finalY, duration: 400, ease: 'Quad.easeIn', delay: 250 },
          alpha: { value: 0, duration: 300, delay: 300 },
        });
      }
      // 5. Chest fades out after the pop
      scene.tweens.add({
        targets: [chest, glow],
        alpha: 0,
        scale: 0.3,
        duration: 200,
        delay: 180,
        onComplete: () => {
          this.hooks.untrackChest(chest);
          chest.destroy();
          glow.destroy();
        },
      });

      this.hooks.getJuice().flashWhite(120);
      this.hooks.getJuice().showToast(t('ui.game.treasure_collected'), '#ffcc44');
      audio.playLevelUp();

      scene.physics.world.removeCollider(overlapColl);
      this.hooks.offerTreasureEvolutionIfEligible();
    });

    despawnHandle = this.hooks.getUpdateTickers().addOnce(
      'scaled',
      15000 + this.hooks.getChestDurationBonusMs(),
      () => {
        if (collected) return;
        collected = true;
        scene.tweens.killTweensOf(glow);
        scene.tweens.add({
          targets: [chest, glow],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.hooks.untrackChest(chest);
            chest.destroy();
            glow.destroy();
            scene.physics.world.removeCollider(overlapColl);
          },
        });
      },
    );
    this.hooks.pushDespawnHandle(despawnHandle);
  }

  spawnGoldenChest(): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 200;
    const x = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 50, GAME.WORLD_WIDTH - 50);
    const y = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 50, GAME.WORLD_HEIGHT - 50);

    this.hooks.getJuice().showToast(t('ui.game.golden_nearby'), '#ffaa00');

    const chest = scene.add.sprite(x, y, 'chest').setDepth(5).setScale(1.5).setTint(0xffdd44);
    this.hooks.trackChest(chest, true);
    const glow = scene.add.circle(x, y, 22, 0xffdd44, 0.3).setDepth(4);

    scene.tweens.add({ targets: glow, scale: { from: 1, to: 1.6 }, alpha: { from: 0.3, to: 0 }, duration: 700, repeat: -1 });
    scene.tweens.add({ targets: chest, y: y - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    scene.physics.add.existing(chest, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, chest, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      const goldReward = Phaser.Math.Between(5, 15);
      this.hooks.onCoinCollected(goldReward);
      this.hooks.getJuice().showToast(t('ui.game.golden_collected', { gold: goldReward }), '#ffaa00');
      this.hooks.getJuice().flashWhite(150);
      audio.playLevelUp();
      scene.tweens.killTweensOf(glow); scene.tweens.killTweensOf(chest);
      this.hooks.untrackChest(chest);
      chest.destroy(); glow.destroy();
      scene.physics.world.removeCollider(overlapColl);
      this.hooks.offerTreasureEvolutionIfEligible();
    });

    despawnHandle = this.hooks.getUpdateTickers().addOnce(
      'scaled',
      12000 + this.hooks.getChestDurationBonusMs(),
      () => {
        if (collected) return;
        collected = true;
        scene.tweens.killTweensOf(glow);
        scene.tweens.killTweensOf(chest);
        scene.tweens.add({
          targets: [chest, glow], alpha: 0, duration: 400, onComplete: () => {
            this.hooks.untrackChest(chest);
            chest.destroy();
            glow.destroy();
            scene.physics.world.removeCollider(overlapColl);
          },
        });
      },
    );
    this.hooks.pushDespawnHandle(despawnHandle);
  }

  spawnGoldCoin(x: number, y: number, goldAmount: number): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const coin = scene.add.circle(x, y, 5, COLORS.WHISKY_GOLD, 1).setDepth(5);

    // Spinning effect
    scene.tweens.add({
      targets: coin,
      scaleX: { from: 1, to: 0.3 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    scene.physics.add.existing(coin, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, coin, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      this.hooks.onCoinCollected(goldAmount);

      const txt = this.hooks.acquireFloatText(
        coin.x, coin.y - 12,
        t('ui.game.gold_pickup_float', { gold: goldAmount }),
        '#d4a017', '16px', 80,
      );
      if (txt) {
        scene.tweens.add({
          targets: txt, y: txt.y - 20, alpha: 0, duration: 600,
          onComplete: () => { txt.setVisible(false); },
        });
      }

      this.hooks.getSFXManager().tryPlay('xp_pickup', () => audio.playXPCollectImmediate());
      coin.destroy();
      scene.physics.world.removeCollider(overlapColl);
    });

    despawnHandle = this.hooks.getUpdateTickers().addOnce('scaled', 12000, () => {
      if (collected) return;
      collected = true;
      scene.tweens.add({
        targets: coin, alpha: 0, duration: 400, onComplete: () => {
          coin.destroy();
          scene.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.hooks.pushDespawnHandle(despawnHandle);
  }

  spawnHealthOrb(x: number, y: number, healAmount: number): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const orb = scene.add.circle(x, y, 6, 0x44dd44, 0.9).setDepth(5);
    const glow = scene.add.circle(x, y, 10, 0x44dd44, 0.3).setDepth(4);

    scene.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.4 },
      alpha: { from: 0.3, to: 0 },
      duration: 600,
      repeat: -1,
    });

    scene.physics.add.existing(orb, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, orb, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      player.heal(healAmount);
      this.hooks.getJuice().showDamageNumber(player.x, player.y - 20, healAmount, false);
      scene.tweens.killTweensOf(glow);
      orb.destroy();
      glow.destroy();
      scene.physics.world.removeCollider(overlapColl);
    });

    despawnHandle = this.hooks.getUpdateTickers().addOnce('scaled', 10000, () => {
      if (collected) return;
      collected = true;
      scene.tweens.killTweensOf(glow);
      scene.tweens.add({
        targets: [orb, glow], alpha: 0, duration: 400,
        onComplete: () => {
          orb.destroy(); glow.destroy();
          scene.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.hooks.pushDespawnHandle(despawnHandle);
  }
}
