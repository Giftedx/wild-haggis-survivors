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
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';

export interface BiomeControllerOptions {
  /** F1 — invoked every time the player transitions into a biome (first-entry
   *  AND subsequent re-entries), with the new biome id. Consumers tween haar
   *  density, swap ambient audio beds, etc. */
  onBiomeEnter?: (biome: BiomeId) => void;
}

export class BiomeController {
  private manager: BiomeManager;
  private renderer: BiomeRenderer;
  private lastBiome: BiomeId | null = null;
  private toasted = new Set<BiomeId>();
  private onBiomeEnter?: (biome: BiomeId) => void;

  constructor(
    scene: Phaser.Scene,
    rng: RNG,
    worldWidth: number,
    worldHeight: number,
    opts: BiomeControllerOptions = {},
  ) {
    const layout = createBiomeLayout(rng, worldWidth, worldHeight);
    this.manager = new BiomeManager(layout);
    this.renderer = new BiomeRenderer(scene, this.manager);
    this.onBiomeEnter = opts.onBiomeEnter;
  }

  /** Called once per update from GameScene. Toasts on first entry;
   *  pushes modifier into Player; fires onBiomeEnter on every transition. */
  tick(player: Player, juice: JuiceSystem): void {
    const current = this.manager.biomeAt(player.x, player.y);
    if (current === this.lastBiome) return;
    this.lastBiome = current;
    if (!this.toasted.has(current)) {
      this.toasted.add(current);
      const def = BIOMES[current];
      juice.showToast(t(def.entryToastKey), def.toastColor);
      juice.biomeEntryBurst(player.x, player.y, current);
      musicEngine.playBiomeAccent(def.moodTimbre);
    }
    player.setBiomeModifier(BIOMES[current].modifier);
    this.onBiomeEnter?.(current);
  }

  currentBiomeAt(x: number, y: number): BiomeId {
    return this.manager.biomeAt(x, y);
  }

  /**
   * V2 Track 2 — the set of biome IDs the player has actually entered
   * so far this run. Updated by `tick()` (same seam as the toast +
   * modifier-push). Exposed for RunHistoryRecorder so the Peerie
   * Shetlander coastal-only unlock can gate on the set.
   */
  getBiomesVisited(): BiomeId[] {
    return Array.from(this.toasted);
  }

  getManager(): BiomeManager {
    return this.manager;
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
