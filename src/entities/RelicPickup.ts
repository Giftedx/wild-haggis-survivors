/**
 * RelicPickup — Phaser-bound Relic drop entity (R1 M2 T16).
 *
 * A dropped Relic sits in the world as a glowing gem. The player
 * walks into it to collect; no action-key press, matching the
 * walk-over vocabulary the rest of the game uses (gold, orbs, chests,
 * reliquary). Spec §4 mentions a "Pick up the Relic?" prompt — we
 * treat that as label/VFX, not a keypress gate, so pickup feel stays
 * consistent with every other collectable.
 *
 * Lifetime: 60s (spec §6 drop-roll flow). After that the pickup fades
 * and despawns silently — urgency without instant-lose.
 *
 * Visual: a soft glow plus the Relic's authored iconSprite texture, so
 * every dropped Relic reads as a specific object instead of a generic gem.
 *
 * Multi-instance: `RelicPickupSpawner` owns the active set. Each
 * pickup registers its own overlap collider + despawn handle via the
 * shared UpdateTickers so scene teardown cleans up by the existing
 * scene-reset path.
 */
import * as Phaser from 'phaser';
import type { Player } from './Player';
import type { RelicDef } from '../data/relics';
import type { TickerHandle, UpdateTickers } from '../utils/UpdateTickers';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import {
  RELIC_PICKUP_LIFETIME_MS,
  RELIC_PICKUP_RADIUS_PX,
} from './relicPickupMath';

/**
 * R1 M4 T28 — drop source is threaded through so analytics can
 * break down pick rate by channel (elite / boss / chest / …).
 * `unknown` covers the DEBUG e2e seam + any future caller that
 * doesn't annotate.
 */
export type RelicPickupSource =
  | 'elite'
  | 'boss'
  | 'chest'
  | 'hidden_node'
  | 'bargain'
  | 'unknown';

export interface RelicPickupSpawnerHooks {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly tickers: UpdateTickers;
  /**
   * Called when the player walks into the pickup. Scene is responsible
   * for slot-model routing (add vs discard UI) — this entity just fires
   * the callback, plays a collect sting, and removes itself.
   */
  onCollect(relic: RelicDef, x: number, y: number, source: RelicPickupSource): void;
}

interface RelicPickupInstance {
  relic: RelicDef;
  x: number;
  y: number;
  source: RelicPickupSource;
  icon: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Arc;
  overlap: Phaser.Physics.Arcade.Collider | null;
  despawnHandle: TickerHandle | null;
  hitbox: Phaser.GameObjects.Arc;
  alive: boolean;
}

export class RelicPickupSpawner {
  private readonly active: Set<RelicPickupInstance> = new Set();

  constructor(private readonly hooks: RelicPickupSpawnerHooks) {}

  /**
   * Spawn a Relic pickup at (x, y). The pickup bobs gently, fades at
   * 60s, or collects on player overlap. Colour = relic.particleColour.
   * `source` is threaded to the collect callback for telemetry.
   */
  spawn(relic: RelicDef, x: number, y: number, source: RelicPickupSource = 'unknown'): void {
    const scene = this.hooks.scene;
    const colour = relic.particleColour;

    const glow = scene.add.circle(x, y, 20, colour, 0.25).setDepth(4);
    const textureKey = scene.textures.exists(relic.iconSprite) ? relic.iconSprite : 'xp_gem';
    const icon = scene.add.image(x, y, textureKey)
      .setDepth(5)
      .setScale(1.2);
    scene.tweens.add({
      targets: icon,
      scale: 1.05,
      duration: 180,
      ease: 'Sine.easeOut',
    });

    // Invisible physics hitbox — we can't attach physics directly to a
    // Graphics object (no bounds for Arcade overlap), so a transparent
    // circle rides along at the pickup's centre and owns the collider.
    const hitbox = scene.add.circle(x, y, RELIC_PICKUP_RADIUS_PX, 0x000000, 0).setDepth(3);
    scene.physics.add.existing(hitbox, true);

    const instance: RelicPickupInstance = {
      relic,
      x,
      y,
      source,
      icon,
      glow,
      hitbox,
      overlap: null,
      despawnHandle: null,
      alive: true,
    };

    // Gentle breathing — pickup reads as "precious" without screaming.
    scene.tweens.add({
      targets: glow,
      alpha: 0.1,
      scale: 0.9,
      duration: 1200,
      ...TWEEN_INFINITE_BREATHE,
    });
    scene.tweens.add({
      targets: icon,
      y: y - 3,
      duration: 900,
      ...TWEEN_INFINITE_BREATHE,
    });

    instance.overlap = scene.physics.add.overlap(
      this.hooks.player,
      hitbox,
      () => this.collect(instance),
    );
    instance.despawnHandle = this.hooks.tickers.addOnce(
      'scaled',
      RELIC_PICKUP_LIFETIME_MS,
      () => this.despawn(instance),
    );
    this.active.add(instance);
  }

  private collect(instance: RelicPickupInstance): void {
    if (!instance.alive) return;
    instance.alive = false;
    instance.despawnHandle?.cancel();
    const scene = this.hooks.scene;
    if (instance.overlap) scene.physics.world.removeCollider(instance.overlap);
    scene.tweens.killTweensOf(instance.glow);
    scene.tweens.killTweensOf(instance.icon);
    this.active.delete(instance);
    // Collection pulse — quick scale-up + fade to read as "picked up".
    scene.tweens.add({
      targets: [instance.glow],
      scale: 2.4,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => instance.glow.destroy(),
    });
    scene.tweens.add({
      targets: [instance.icon],
      alpha: 0,
      scale: 1.35,
      duration: 220,
      onComplete: () => instance.icon.destroy(),
    });
    instance.hitbox.destroy();
    this.hooks.onCollect(instance.relic, instance.x, instance.y, instance.source);
  }

  private despawn(instance: RelicPickupInstance): void {
    if (!instance.alive) return;
    instance.alive = false;
    const scene = this.hooks.scene;
    if (instance.overlap) scene.physics.world.removeCollider(instance.overlap);
    scene.tweens.killTweensOf(instance.glow);
    scene.tweens.killTweensOf(instance.icon);
    this.active.delete(instance);
    scene.tweens.add({
      targets: [instance.glow, instance.icon],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        instance.glow.destroy();
        instance.icon.destroy();
      },
    });
    instance.hitbox.destroy();
  }

  /** Clean up every active pickup. Called from GameScene teardown. */
  destroyAll(): void {
    for (const instance of Array.from(this.active)) {
      this.despawn(instance);
    }
    this.active.clear();
  }

  /** Test/inspection — number of active pickups. */
  activeCount(): number {
    return this.active.size;
  }

  /**
   * R1 M4.5 P2 — positions of every live pickup, for pictish_compass
   * minimap pins. Returns rarity so the minimap can tint each pin by
   * the Relic's particleColour downstream.
   */
  getActivePickupPositions(): Array<{ x: number; y: number; colour: number }> {
    const out: Array<{ x: number; y: number; colour: number }> = [];
    for (const inst of this.active) {
      if (!inst.alive) continue;
      out.push({ x: inst.x, y: inst.y, colour: inst.relic.particleColour });
    }
    return out;
  }

}
