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
import * as Phaser from 'phaser';
import { GAME, COLORS, COLORS_CSS } from '../../config';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { UpdateTickers, TickerHandle } from '../../utils/UpdateTickers';
import type { SFXManager } from '../../systems/audio/SFXManager';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { pickNearbyPosition } from './nearbySpawn';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';
import { pulsePickupGlow } from './pickupGlowPulse';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { BURNS_PLATTER_TEXTURE_KEY } from '../../art/sprites/pickups/burnsPlatter';

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
  /**
   * R1 M3 T20f — oatcake_stash adds +2 HP on a healing orb pickup.
   * Identity default when the driver isn't wired. Applied at pickup
   * time (not at drop time) so the spawn math stays unchanged.
   */
  modifyHealOrbAmount?(amount: number): number;
  /**
   * E1 M2 T10 — Burns Night platter pickup. Called on collision with
   * the one-per-run platter; GameScene owns the damage-buff start-ms
   * + banter dispatch. Hook is optional so non-Burns runs don't pay
   * a reference.
   */
  onBurnsPlatterCollect?(): void;
}

export class PickupSpawner {
  /**
   * Gold pickup float text aggregation — when a cluster of coins is
   * vacuumed in quick succession (common after an elite kill + ripple),
   * amend the active float text instead of spawning N overlapping floats.
   * The first coin anchors the position; subsequent coins within the
   * window just bump the displayed total.
   */
  private goldFloatAggregate:
    | { text: Phaser.GameObjects.Text; amount: number; createdMs: number }
    | null = null;
  private readonly GOLD_FLOAT_AGGREGATION_WINDOW_MS = 250;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: PickupSpawnerHooks,
  ) {}

  spawnTreasure(): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    // Spawn near the player but not on top of them
    const { x, y } = pickNearbyPosition({
      playerX: player.x,
      playerY: player.y,
      worldWidth: GAME.WORLD_WIDTH,
      worldHeight: GAME.WORLD_HEIGHT,
      rand: Math.random,
    });

    this.hooks.getJuice().showToast(t('ui.game.treasure_nearby'), TOAST_COLORS.reward);

    // Create a glowing chest with sprite. Prefer the authored Hearth
    // variant when BootScene has baked it; fall back to the legacy key in
    // narrow tests that stub texture generation.
    const chestKey = scene.textures.exists('pickup_chest_hearth') ? 'pickup_chest_hearth' : 'chest';
    const chest = scene.add.sprite(x, y, chestKey).setDepth(5).setScale(1.5);
    this.hooks.trackChest(chest, false);
    const glow = scene.add.circle(x, y, 18, COLORS.WHISKY_GOLD, 0.2).setDepth(4);

    // Pulsing glow animation
    pulsePickupGlow(scene, glow, 1.5, 700);

    // Floating bob animation
    scene.tweens.add({
      targets: chest,
      y: y - 4,
      duration: 600,
      ...TWEEN_INFINITE_BREATHE,
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
    const { x, y } = pickNearbyPosition({
      playerX: player.x,
      playerY: player.y,
      worldWidth: GAME.WORLD_WIDTH,
      worldHeight: GAME.WORLD_HEIGHT,
      rand: Math.random,
    });

    this.hooks.getJuice().showToast(t('ui.game.golden_nearby'), TOAST_COLORS.reward);

    const chestKey = scene.textures.exists('pickup_chest_legendary') ? 'pickup_chest_legendary' : 'chest';
    const chest = scene.add.sprite(x, y, chestKey).setDepth(5).setScale(1.5);
    if (chestKey === 'chest') chest.setTint(0xffdd44);
    this.hooks.trackChest(chest, true);
    const glow = scene.add.circle(x, y, 22, 0xffdd44, 0.3).setDepth(4);

    pulsePickupGlow(scene, glow, 1.5, 700);
    scene.tweens.add({ targets: chest, y: y - 4, duration: 500, ...TWEEN_INFINITE_BREATHE });

    scene.physics.add.existing(chest, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, chest, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      const goldReward = Phaser.Math.Between(5, 15);
      this.hooks.onCoinCollected(goldReward);
      this.hooks.getJuice().showToast(t('ui.game.golden_collected', { gold: goldReward }), TOAST_COLORS.reward);
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
    const coin = scene.textures.exists('pickup_gold_coin')
      ? scene.add.image(x, y, 'pickup_gold_coin').setDepth(5)
      : scene.add.circle(x, y, 5, COLORS.WHISKY_GOLD, 1).setDepth(5);

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

      const now = scene.time.now;
      const agg = this.goldFloatAggregate;
      if (agg && agg.text.visible && now - agg.createdMs < this.GOLD_FLOAT_AGGREGATION_WINDOW_MS) {
        agg.amount += goldAmount;
        agg.text.setText(t('ui.game.gold_pickup_float', { gold: agg.amount }));
      } else {
        const txt = this.hooks.acquireFloatText(
          coin.x, coin.y - 12,
          t('ui.game.gold_pickup_float', { gold: goldAmount }),
          COLORS_CSS.WHISKY_GOLD, '16px', 80,
        );
        if (txt) {
          const entry = { text: txt, amount: goldAmount, createdMs: now };
          this.goldFloatAggregate = entry;
          scene.tweens.add({
            targets: txt, y: txt.y - 20, alpha: 0, duration: 600,
            onComplete: () => {
              txt.setVisible(false);
              if (this.goldFloatAggregate === entry) this.goldFloatAggregate = null;
            },
          });
        }
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

  /**
   * E1 M2 T10 — Burns Night haggis-platter pickup. One-off, spawned
   * by GameScene during Burns Night runs only. Collision heals the
   * player fully, fires the 60 s damage buff (owned by GameScene),
   * and triggers a Burns-citational banter line. Visually a tinted
   * glow + a floating platter, spectacle-tier feedback on collect.
   */
  spawnBurnsPlatter(): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const { x, y } = pickNearbyPosition({
      playerX: player.x,
      playerY: player.y,
      worldWidth: GAME.WORLD_WIDTH,
      worldHeight: GAME.WORLD_HEIGHT,
      rand: Math.random,
    });

    this.hooks.getJuice().showToast(t('ui.game.burns_platter_nearby'), '#ffcc44');

    const platter = scene.add.sprite(x, y, BURNS_PLATTER_TEXTURE_KEY).setDepth(5);
    const glow = scene.add.circle(x, y, 28, 0xffcc44, 0.22).setDepth(4);

    pulsePickupGlow(scene, glow, 1.35, 800);
    scene.tweens.add({ targets: platter, y: y - 3, duration: 650, ...TWEEN_INFINITE_BREATHE });

    scene.physics.add.existing(platter, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, platter, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();

      // Full heal — generous because the buff itself is short-lived.
      player.heal(player.getMaxHp());

      // Pop spectacle — double gold-warm ring, platter scales up then
      // fades. Mirrors the treasure chest cadence so the player reads
      // this as a "bigger than a coin" moment.
      scene.tweens.killTweensOf(platter);
      scene.tweens.killTweensOf(glow);
      scene.tweens.add({
        targets: platter, y: y - 6, scale: 1.2, duration: 140, ease: 'Quad.easeOut',
      });
      const ring = scene.add.circle(x, y, 22, 0xffdd88, 0.85).setDepth(6);
      scene.tweens.add({
        targets: ring, scale: 5, alpha: 0, duration: 460, ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
      const ring2 = scene.add.circle(x, y, 14, 0xffbb33, 0.55).setDepth(6);
      scene.tweens.add({
        targets: ring2, scale: 5.5, alpha: 0, duration: 540, delay: 120, ease: 'Quad.easeOut',
        onComplete: () => ring2.destroy(),
      });
      // Gentle gold-flake spray — evokes steam curls caught by wind.
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = Phaser.Math.Between(30, 60);
        const dot = scene.add.circle(
          x, y, Phaser.Math.Between(2, 3),
          i % 2 === 0 ? 0xffd88a : 0xf0c070, 0.9,
        ).setDepth(7);
        const endX = x + Math.cos(angle) * speed;
        const peakY = y + Math.sin(angle) * speed - 12;
        scene.tweens.add({ targets: dot, x: endX, duration: 600 });
        scene.tweens.add({
          targets: dot, y: { value: peakY, duration: 260, ease: 'Quad.easeOut' },
        });
        scene.tweens.add({
          targets: dot, y: { value: y + 30, duration: 380, ease: 'Quad.easeIn', delay: 260 },
          alpha: { value: 0, duration: 300, delay: 320 }, onComplete: () => dot.destroy(),
        });
      }

      scene.tweens.add({
        targets: [platter, glow], alpha: 0, scale: 0.4, duration: 220, delay: 180,
        onComplete: () => {
          platter.destroy();
          glow.destroy();
        },
      });

      this.hooks.getJuice().flashWhite(100);
      this.hooks.getJuice().showToast(t('ui.game.burns_platter_collected'), '#ffdd88');
      audio.playLevelUp();
      scene.physics.world.removeCollider(overlapColl);
      this.hooks.onBurnsPlatterCollect?.();
    });

    // Platter lingers longer than a chest — it's a once-per-run gift.
    despawnHandle = this.hooks.getUpdateTickers().addOnce('scaled', 45_000, () => {
      if (collected) return;
      collected = true;
      scene.tweens.killTweensOf(glow);
      scene.tweens.killTweensOf(platter);
      scene.tweens.add({
        targets: [platter, glow], alpha: 0, duration: 500, onComplete: () => {
          platter.destroy();
          glow.destroy();
          scene.physics.world.removeCollider(overlapColl);
        },
      });
    });
    this.hooks.pushDespawnHandle(despawnHandle);
  }

  spawnHealthOrb(x: number, y: number, healAmount: number): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const orb = scene.textures.exists('pickup_health_thistle')
      ? scene.add.image(x, y, 'pickup_health_thistle').setDepth(5)
      : scene.add.circle(x, y, 6, 0x44dd44, 0.9).setDepth(5);
    const glow = scene.add.circle(x, y, 10, 0x44dd44, 0.3).setDepth(4);

    pulsePickupGlow(scene, glow, 1.5, 700);

    scene.physics.add.existing(orb, true);
    let collected = false;
    let despawnHandle: TickerHandle | null = null;

    const overlapColl = scene.physics.add.overlap(player, orb, () => {
      if (collected) return;
      collected = true;
      despawnHandle?.cancel();
      const effectiveHeal = this.hooks.modifyHealOrbAmount?.(healAmount) ?? healAmount;
      player.heal(effectiveHeal);
      this.hooks.getJuice().showDamageNumber(player.x, player.y - 20, effectiveHeal, false);
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
