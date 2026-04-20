/**
 * HareWildlife — decorative mountain hares that idle in heather/pine
 * biomes and hop away when the player gets close. Purely cosmetic,
 * no collision or gameplay impact.
 */
import Phaser from 'phaser';
import type { BiomeManager } from './BiomeManager';
import type { RNG } from '../utils/rng';

interface Hare {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'idle' | 'hopping';
  hopTimer: number;
  frameAccum: number;
  frameIndex: number;
  idlePhase: number;
}

const HARE_COUNT = 4;
const FLEE_DIST = 200;
const HOP_DURATION_MS = 800;
const IDLE_FRAME_MS = 500;   // 2fps
const HOP_FRAME_MS = 83;     // ~12fps
const HOP_SPEED = 120;
const VALID_BIOMES = new Set(['heather', 'pine']);

export class HareWildlife {
  private hares: Hare[] = [];
  private worldW = 0;
  private worldH = 0;

  create(
    scene: Phaser.Scene,
    biomeManager: BiomeManager,
    worldW: number,
    worldH: number,
    rng: RNG,
  ): void {
    this.destroy();
    this.worldW = worldW;
    this.worldH = worldH;

    let placed = 0;
    let attempts = 0;
    while (placed < HARE_COUNT && attempts < 200) {
      attempts++;
      const x = rng.float(100, worldW - 100);
      const y = rng.float(100, worldH - 100);
      const biome = biomeManager.biomeAt(x, y);
      if (!VALID_BIOMES.has(biome)) continue;

      const sprite = scene.add.image(x, y, 'hare_idle_0')
        .setDepth(-3 + y / worldH * 0.5);
      const shadow = scene.add.image(x, y + 8, 'entity_shadow')
        .setScale(0.4)
        .setDepth(-3 + y / worldH * 0.5 - 0.01);

      this.hares.push({
        sprite,
        shadow,
        x,
        y,
        vx: 0,
        vy: 0,
        state: 'idle',
        hopTimer: 0,
        frameAccum: 0,
        frameIndex: 0,
        idlePhase: rng.float(0, 1000),
      });
      placed++;
    }
  }

  update(delta: number, playerX: number, playerY: number): void {
    for (const h of this.hares) {
      const dist = Math.hypot(h.x - playerX, h.y - playerY);

      if (h.state === 'idle') {
        h.frameAccum += delta;
        if (h.frameAccum > IDLE_FRAME_MS) {
          h.frameAccum = 0;
          h.frameIndex = (h.frameIndex + 1) % 2;
          h.sprite.setTexture(`hare_idle_${h.frameIndex}`);
        }
        if (dist < FLEE_DIST) {
          h.state = 'hopping';
          h.hopTimer = HOP_DURATION_MS;
          h.frameIndex = 0;
          h.frameAccum = 0;
          const angle = Math.atan2(h.y - playerY, h.x - playerX)
            + (Math.random() - 0.5) * 0.8;
          h.vx = Math.cos(angle) * HOP_SPEED;
          h.vy = Math.sin(angle) * HOP_SPEED;
        }
      } else {
        h.hopTimer -= delta;
        h.frameAccum += delta;
        if (h.frameAccum > HOP_FRAME_MS) {
          h.frameAccum = 0;
          h.frameIndex = (h.frameIndex + 1) % 4;
          h.sprite.setTexture(`hare_hop_${h.frameIndex}`);
        }
        h.x += h.vx * (delta / 1000);
        h.y += h.vy * (delta / 1000);
        h.x = Math.max(50, Math.min(this.worldW - 50, h.x));
        h.y = Math.max(50, Math.min(this.worldH - 50, h.y));

        if (h.hopTimer <= 0) {
          h.state = 'idle';
          h.vx = 0;
          h.vy = 0;
          h.frameIndex = 0;
          h.sprite.setTexture('hare_idle_0');
        }
      }

      h.sprite.setPosition(h.x, h.y);
      h.sprite.setDepth(-3 + h.y / this.worldH * 0.5);
      h.shadow.setPosition(h.x, h.y + 8);
      h.shadow.setDepth(h.sprite.depth - 0.01);
      if (h.state === 'hopping') h.sprite.setFlipX(h.vx < 0);
    }
  }

  destroy(): void {
    for (const h of this.hares) {
      h.sprite.destroy();
      h.shadow.destroy();
    }
    this.hares = [];
  }
}
