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

/** Delay between the existing biome-entry toast and the lore-snippet
 *  follow-up. Long enough for the entry quip to register; short enough
 *  that the player still feels they're in the moment. */
const LORE_SNIPPET_DELAY_MS = 2500;

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
  /** Phaser scene retained for scheduling the lore-snippet follow-up. */
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    rng: RNG,
    worldWidth: number,
    worldHeight: number,
    opts: BiomeControllerOptions = {},
  ) {
    const layout = createBiomeLayout(rng, worldWidth, worldHeight);
    this.scene = scene;
    this.manager = new BiomeManager(layout);
    this.renderer = new BiomeRenderer(scene, this.manager);
    this.onBiomeEnter = opts.onBiomeEnter;
  }

  /**
   * Defer a follow-up toast carrying the biome's lore snippet. Pulled
   * out so the tick path stays scannable. Scene-active guard prevents
   * the line firing into a stopped scene if the player dies inside the
   * delay window.
   */
  private scheduleLoreSnippet(
    snippetKey: string,
    color: string,
    juice: JuiceSystem,
  ): void {
    this.scene.time.delayedCall(LORE_SNIPPET_DELAY_MS, () => {
      if (!this.scene.scene.isActive('Game')) return;
      juice.showToast(t(snippetKey), color);
    });
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
      // Lore snippet — a 1-line distillation of the biome's long-form
      // lore, surfaced 2.5 s after the entry toast on the first
      // encounter each run. The capture-loop closure preserves the
      // current biome key so the delayed call shows the correct line
      // even if the player sprints into the next biome inside 2.5 s.
      const snippetKey = def.loreSnippetKey;
      const snippetColor = def.toastColor;
      this.scheduleLoreSnippet(snippetKey, snippetColor, juice);
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

  /**
   * Phase B Endless — rebuild the biome layout + renderer from a fresh
   * RNG draw. Called every `POST_BELL_RESEED_INTERVAL_SEC` seconds while
   * the player is past the bell. The toasted-set is cleared so the
   * player gets the entry quip again on first contact with each new
   * region; lastBiome stays current so we don't fire a transition for
   * the cell we already occupy. The onBiomeEnter callback is re-fired
   * on the next tick if the player's position now sits in a different
   * biome cell.
   */
  reseed(scene: Phaser.Scene, rng: RNG, worldWidth: number, worldHeight: number): void {
    const layout = createBiomeLayout(rng, worldWidth, worldHeight);
    this.manager = new BiomeManager(layout);
    this.renderer.destroy();
    this.renderer = new BiomeRenderer(scene, this.manager);
    this.toasted.clear();
    // Clear lastBiome so the next tick triggers a fresh transition into
    // whichever cell the player is now standing in (post-reseed the cell
    // identity has almost certainly changed).
    this.lastBiome = null;
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
