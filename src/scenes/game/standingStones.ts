/**
 * Standing Stones — mid-run trinity choice. At 5:00 into the run,
 * three stones spawn near the player. Approaching one within 40px
 * grants its run-scoped boon; the other two crumble.
 *
 * From DESIGN_IDEAS.md §1 — chosen for this build because it uses
 * only existing Player boon APIs (addHpRegen, addCritChance,
 * addCooldownReduction), no new architecture needed beyond a small
 * proximity-check per frame.
 *
 * Pure helpers live beside the orchestrator class so the decision
 * math (boon shuffle, nearest-stone index) tests without Phaser.
 */
import Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { RNG } from '../../utils/rng';

export type StoneBoonId = 'mending' | 'fire' | 'haste';

export interface StoneBoon {
  readonly id: StoneBoonId;
  readonly titleKey: string;
  readonly descKey: string;
}

/** Stable order — shuffled per run via `shuffleBoons(rng)`. */
export const STONE_BOONS: readonly StoneBoon[] = [
  {
    id: 'mending',
    titleKey: 'ui.standingStones.mending.title',
    descKey: 'ui.standingStones.mending.desc',
  },
  {
    id: 'fire',
    titleKey: 'ui.standingStones.fire.title',
    descKey: 'ui.standingStones.fire.desc',
  },
  {
    id: 'haste',
    titleKey: 'ui.standingStones.haste.title',
    descKey: 'ui.standingStones.haste.desc',
  },
];

/** Seconds into a run when the stones spawn. */
export const STONE_SPAWN_SEC = 300;
/** Seconds into a run when the moor rumbles to telegraph the upcoming spawn. */
export const STONE_WARN_SEC = 285;
/** Proximity threshold for claiming a stone (pixels). */
export const STONE_PICK_RADIUS_PX = 40;
/** Distance from player at spawn time (pixels). */
export const STONE_SPAWN_RADIUS_PX = 180;

export function shuffleBoons(rng: RNG): StoneBoon[] {
  const a = STONE_BOONS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Stones are laid equilaterally around the player, starting at the
 * top. Pure — returns just the world-space positions so tests can
 * verify placement without a scene.
 */
export function stonePositions(playerX: number, playerY: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    out.push({
      x: playerX + Math.cos(a) * STONE_SPAWN_RADIUS_PX,
      y: playerY + Math.sin(a) * STONE_SPAWN_RADIUS_PX,
    });
  }
  return out;
}

/**
 * Returns the index of the stone within pick radius, or -1. When
 * multiple stones tie (rare — stones are spaced far apart), the
 * lowest index wins deterministically.
 */
export function nearestStoneIndex(
  stones: readonly { x: number; y: number }[],
  playerX: number,
  playerY: number,
  pickRadius: number = STONE_PICK_RADIUS_PX,
): number {
  const r2 = pickRadius * pickRadius;
  for (let i = 0; i < stones.length; i++) {
    const s = stones[i];
    if (!s) continue;
    const dx = playerX - s.x;
    const dy = playerY - s.y;
    if (dx * dx + dy * dy <= r2) return i;
  }
  return -1;
}

/** Apply a boon's stat effect to the player via existing Player APIs. */
export function applyStoneBoon(player: Player, boon: StoneBoon): void {
  switch (boon.id) {
    case 'mending':
      player.addHpRegen(0.3);
      break;
    case 'fire':
      player.addCritChance(0.05);
      break;
    case 'haste':
      player.addCooldownReduction(0.10);
      break;
  }
}

/** Hooks the orchestrator needs. */
export interface StandingStonesHooks {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly rng: RNG;
  onPick(boon: StoneBoon): void;
}

interface StoneInstance {
  x: number;
  y: number;
  boon: StoneBoon;
  graphic: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Arc;
  alive: boolean;
}

/**
 * Phaser-bound orchestrator. Keeps a trinity of stones on-screen
 * and awards the first one the player walks within pick radius.
 */
export class StandingStones {
  private stones: StoneInstance[] = [];
  private picked = false;
  private spawned = false;

  constructor(private readonly hooks: StandingStonesHooks) {}

  /**
   * Spawn the trinity. Boons are shuffled from the run RNG so daily
   * runs still resolve deterministically. No-op after the first
   * spawn or after a pick.
   */
  spawn(): void {
    if (this.spawned || this.picked) return;
    this.spawned = true;
    const boons = shuffleBoons(this.hooks.rng);
    const positions = stonePositions(this.hooks.player.x, this.hooks.player.y);
    for (let i = 0; i < 3; i++) {
      const pos = positions[i];
      const boon = boons[i];
      if (!pos || !boon) continue;
      const glow = this.hooks.scene.add
        .circle(pos.x, pos.y, STONE_PICK_RADIUS_PX + 6, 0xffe080, 0.22)
        .setDepth(5);
      const g = this.drawStone(pos.x, pos.y);
      // Gentle breathing pulse to telegraph interactability.
      this.hooks.scene.tweens.add({
        targets: [glow],
        alpha: 0.08,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.stones.push({ x: pos.x, y: pos.y, boon, graphic: g, glow, alive: true });
    }
  }

  /** Called per gameplay frame. Picks the first stone within radius. */
  tick(): void {
    if (this.picked || !this.spawned) return;
    const snap = this.stones
      .map((s) => (s.alive ? { x: s.x, y: s.y } : null))
      .filter((s): s is { x: number; y: number } => s !== null);
    const idx = nearestStoneIndex(snap, this.hooks.player.x, this.hooks.player.y);
    if (idx === -1) return;
    // `snap` filters dead stones — map back to the real index.
    let realIdx = -1;
    let seen = 0;
    for (let k = 0; k < this.stones.length; k++) {
      if (!this.stones[k]?.alive) continue;
      if (seen === idx) {
        realIdx = k;
        break;
      }
      seen++;
    }
    if (realIdx === -1) return;
    this.pick(realIdx);
  }

  private pick(idx: number): void {
    if (this.picked) return;
    this.picked = true;
    const chosen = this.stones[idx];
    if (!chosen) return;

    applyStoneBoon(this.hooks.player, chosen.boon);
    this.hooks.onPick(chosen.boon);

    // Chosen: bright flash + fade-up
    this.hooks.scene.tweens.add({
      targets: [chosen.graphic, chosen.glow],
      scale: 1.6,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        chosen.graphic.destroy();
        chosen.glow.destroy();
      },
    });
    chosen.alive = false;

    // Others: crumble + sink
    for (let j = 0; j < this.stones.length; j++) {
      if (j === idx) continue;
      const s = this.stones[j];
      if (!s || !s.alive) continue;
      s.alive = false;
      this.hooks.scene.tweens.add({
        targets: [s.graphic, s.glow],
        alpha: 0,
        y: s.y + 8,
        duration: 700,
        onComplete: () => {
          s.graphic.destroy();
          s.glow.destroy();
        },
      });
    }
  }

  /** Clean up outstanding graphics on scene shutdown / reset. */
  destroy(): void {
    for (const s of this.stones) {
      if (!s) continue;
      s.graphic.destroy();
      s.glow.destroy();
    }
    this.stones = [];
    this.picked = false;
    this.spawned = false;
  }

  /** True once a boon has been awarded this run. */
  isResolved(): boolean {
    return this.picked;
  }

  private drawStone(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.hooks.scene.add.graphics().setDepth(6);
    g.x = x;
    g.y = y;
    // Rough menhir silhouette — dark grey stone with mossy highlights
    // and an amber rune scratched in its face.
    g.fillStyle(0x2a2a30, 1);
    g.fillRect(-10, -18, 20, 30);
    g.fillStyle(0x3a3a44, 1);
    g.fillRect(-9, -17, 18, 28);
    // Top slope
    g.fillTriangle(-10, -18, 10, -18, 0, -22);
    // Moss
    g.fillStyle(0x456a30, 0.8);
    g.fillRect(-10, 8, 20, 4);
    g.fillCircle(-6, 6, 2);
    g.fillCircle(4, 10, 1.5);
    // Rune — amber slash
    g.fillStyle(0xffd070, 0.9);
    g.fillRect(-5, -10, 10, 2);
    g.fillRect(-1, -8, 2, 8);
    // Shadow under base
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 14, 22, 4);
    return g;
  }
}
