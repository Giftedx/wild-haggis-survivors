/**
 * BiomeController — owns every piece of GameScene's biome state that was
 * accumulating inline in the scene after Phase A: the manager, the
 * renderer, the entry-toast bookkeeping, and the per-frame tick that
 * pushes modifier kind into Player.
 *
 * Kept deliberately small — a handful of fields, three methods — so
 * future biome work (more biomes, transitions, music hooks) lives here
 * instead of bloating GameScene further.
 */
import type Phaser from 'phaser';
import { BIOMES, type BiomeId } from '../../data/biomes';
import { BiomeManager, createBiomeLayout } from '../../systems/BiomeManager';
import { BiomeRenderer } from '../../systems/BiomeRenderer';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { RNG } from '../../utils/rng';
import { t } from '../../core/i18n';

export class BiomeController {
  private manager: BiomeManager;
  private renderer: BiomeRenderer;
  private lastBiome: BiomeId | null = null;
  private toasted = new Set<BiomeId>();

  constructor(
    scene: Phaser.Scene,
    rng: RNG,
    worldWidth: number,
    worldHeight: number,
  ) {
    const layout = createBiomeLayout(rng, worldWidth, worldHeight);
    this.manager = new BiomeManager(layout);
    this.renderer = new BiomeRenderer(scene, this.manager);
  }

  /** Called once per update from GameScene. Toasts on first entry;
   *  pushes modifier into Player. */
  tick(player: Player, juice: JuiceSystem): void {
    const current = this.manager.biomeAt(player.x, player.y);
    if (current === this.lastBiome) return;
    this.lastBiome = current;
    if (!this.toasted.has(current)) {
      this.toasted.add(current);
      const def = BIOMES[current];
      juice.showToast(t(def.entryToastKey), def.toastColor);
    }
    player.setBiomeModifier(BIOMES[current].modifier);
  }

  currentBiomeAt(x: number, y: number): BiomeId {
    return this.manager.biomeAt(x, y);
  }

  getManager(): BiomeManager {
    return this.manager;
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
