/**
 * WildlifeSystem — decorative Scottish ambient creatures that idle in their
 * biomes and flee when the player approaches. Purely cosmetic, no collision
 * or gameplay impact.
 *
 * Supersedes the original HareWildlife system (2026-04-22): static
 * seed-deterministic placement via RunRng remains, generalized to
 * support multiple creature types from WILDLIFE_DEFS.
 */
import * as Phaser from 'phaser';
import type { BiomeManager } from './BiomeManager';
import type { BiomeId } from '../data/biomes';
import type { RNG } from '../utils/rng';
import { WILDLIFE_DEFS, type WildlifeDef, type WildlifeKey } from '../data/wildlife';
import { safeAddImage } from '../scenes/safeAddImage';

// How many of each creature to place per run. Counts stay conservative because
// wildlife is background warmth, not a gameplay hazard.
const COUNTS: Record<WildlifeKey, number> = {
  hare: 4,
  red_deer: 2,
  buzzard: 3,
  red_squirrel: 3,
  pine_marten: 2,
  capercaillie: 2,
  otter: 2,
  puffin: 2,
  golden_eagle: 1,
  scottish_wildcat: 2,
  rook: 3,
  sheep: 3,
  grey_seal: 2,
  ptarmigan: 2,
  common_frog: 3,
  pipistrelle_bat: 2,
  field_mouse: 3,
  salmon: 2,
};

// Which biomes each creature is allowed in. Buzzards aerial —
// effectively always valid. Woodland species use pine/heather so they can
// appear reliably while their data weights still favour pine.
const VALID_BIOMES: Record<WildlifeKey, Set<BiomeId>> = {
  hare: new Set(['heather', 'pine']),
  red_deer: new Set(['heather', 'pine']),
  buzzard: new Set(['bog', 'loch', 'pine', 'heather']),
  red_squirrel: new Set(['heather', 'pine']),
  pine_marten: new Set(['heather', 'pine']),
  capercaillie: new Set(['heather', 'pine']),
  otter: new Set(['bog', 'loch']),
  puffin: new Set(['bog', 'loch', 'heather']),
  golden_eagle: new Set(['bog', 'loch', 'pine', 'heather']),
  scottish_wildcat: new Set(['heather', 'pine']),
  rook: new Set(['bog', 'loch', 'pine', 'heather']),
  sheep: new Set(['heather']),
  grey_seal: new Set(['loch']),
  ptarmigan: new Set(['heather', 'pine']),
  common_frog: new Set(['bog', 'loch']),
  pipistrelle_bat: new Set(['bog', 'loch', 'pine', 'heather']),
  field_mouse: new Set(['heather', 'pine']),
  salmon: new Set(['bog', 'loch']),
};

const FLEE_DIST = 200;
const HOP_DURATION_MS = 800;
const IDLE_FRAME_MS = 500;
const HOP_FRAME_MS = 120;    // slower for 2-frame cycle

interface Creature {
  key: WildlifeKey;
  def: WildlifeDef;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image | null;  // null for aerial
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'idle' | 'fleeing';
  fleeTimer: number;
  frameAccum: number;
  frameIndex: number;
  idlePhase: number;
}

export class WildlifeSystem {
  private creatures: Creature[] = [];
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

    for (const key of Object.keys(COUNTS) as WildlifeKey[]) {
      const target = COUNTS[key];
      const def = WILDLIFE_DEFS[key];
      const validBiomes = VALID_BIOMES[key];
      let placed = 0;
      let attempts = 0;
      while (placed < target && attempts < 200) {
        attempts++;
        const x = rng.float(100, worldW - 100);
        const y = rng.float(100, worldH - 100);
        const biome = biomeManager.biomeAt(x, y);
        if (!validBiomes.has(biome)) continue;

        // Guard via safeAddImage — see FloraScatter for context. Wildlife
        // sprite + shadow keys are baked by BootScene in production; the
        // null path covers test stubs that skip the bake.
        const sprite = safeAddImage(scene, x, y, def.spriteKeyIdle);
        if (!sprite) continue;
        sprite.setScale(def.scale)
          .setDepth(def.aerial ? 450 : -3 + y / worldH * 0.5);

        // Aerial creatures render above gameplay layer; no shadow.
        const shadow = def.aerial ? null : safeAddImage(scene, x, y + 8, 'entity_shadow');
        if (shadow) {
          shadow.setScale(0.4).setDepth(-3 + y / worldH * 0.5 - 0.01);
        }

        this.creatures.push({
          key,
          def,
          sprite,
          shadow,
          x,
          y,
          vx: 0,
          vy: 0,
          state: 'idle',
          fleeTimer: 0,
          frameAccum: 0,
          frameIndex: 0,
          idlePhase: rng.float(0, 1000),
        });
        placed++;
      }
    }
  }

  update(delta: number, playerX: number, playerY: number): void {
    for (const c of this.creatures) {
      const dist = Math.hypot(c.x - playerX, c.y - playerY);

      if (c.state === 'idle') {
        c.frameAccum += delta;
        if (c.frameAccum > IDLE_FRAME_MS) {
          c.frameAccum = 0;
          c.frameIndex = (c.frameIndex + 1) % 2;
          const key = c.frameIndex === 0 ? c.def.spriteKeyIdle : c.def.spriteKeyMove;
          c.sprite.setTexture(key);
        }
        // Buzzards never flee — they're overhead. Set aerial drift instead.
        if (c.def.aerial) {
          // Slow aerial drift: gentle arc motion
          const t = performance.now() * 0.0002 + c.idlePhase;
          c.x += Math.cos(t) * c.def.baseSpeed * delta / 1000;
          c.y += Math.sin(t * 0.7) * c.def.baseSpeed * 0.3 * delta / 1000;
          c.x = Math.max(50, Math.min(this.worldW - 50, c.x));
          c.y = Math.max(50, Math.min(this.worldH - 50, c.y));
        } else if (dist < FLEE_DIST) {
          c.state = 'fleeing';
          c.fleeTimer = HOP_DURATION_MS;
          c.frameIndex = 0;
          c.frameAccum = 0;
          const angle = Math.atan2(c.y - playerY, c.x - playerX)
            + (Math.random() - 0.5) * 0.8;
          c.vx = Math.cos(angle) * c.def.fleeSpeed;
          c.vy = Math.sin(angle) * c.def.fleeSpeed;
        }
      } else {
        c.fleeTimer -= delta;
        c.frameAccum += delta;
        if (c.frameAccum > HOP_FRAME_MS) {
          c.frameAccum = 0;
          c.frameIndex = (c.frameIndex + 1) % 2;
          const key = c.frameIndex === 0 ? c.def.spriteKeyMove : c.def.spriteKeyIdle;
          c.sprite.setTexture(key);
        }
        c.x += c.vx * (delta / 1000);
        c.y += c.vy * (delta / 1000);
        c.x = Math.max(50, Math.min(this.worldW - 50, c.x));
        c.y = Math.max(50, Math.min(this.worldH - 50, c.y));

        if (c.fleeTimer <= 0) {
          c.state = 'idle';
          c.vx = 0;
          c.vy = 0;
          c.frameIndex = 0;
          c.sprite.setTexture(c.def.spriteKeyIdle);
        }
      }

      c.sprite.setPosition(c.x, c.y);
      if (!c.def.aerial) {
        c.sprite.setDepth(-3 + c.y / this.worldH * 0.5);
      }
      if (c.shadow) {
        c.shadow.setPosition(c.x, c.y + 8);
        c.shadow.setDepth(c.sprite.depth - 0.01);
      }
      if (c.state === 'fleeing' && !c.def.aerial) {
        c.sprite.setFlipX(c.vx < 0);
      }
    }
  }

  destroy(): void {
    for (const c of this.creatures) {
      c.sprite.destroy();
      c.shadow?.destroy();
    }
    this.creatures = [];
  }

  getActiveCount(): number {
    return this.creatures.length;
  }
}
