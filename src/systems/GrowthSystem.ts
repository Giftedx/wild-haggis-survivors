import Phaser from 'phaser';
import { Player } from '../entities/Player';

/**
 * GrowthSystem — handles camera zoom-out as the haggis grows.
 * The player sprite scaling is handled in Player.onLevelUp.
 * This system smoothly adjusts the camera zoom to reveal more of the
 * battlefield as the haggis gets bigger.
 */
export class GrowthSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private targetZoom: number;
  private readonly baseZoom: number;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    // Preserve the scene's configured zoom (GameScene sets this to 1.2).
    // Camera zoom affects all rendered objects, including scrollFactor(0) UI,
    // so we keep zoom stable to guarantee HUD text stays pixel-consistent.
    this.baseZoom = scene.cameras.main.zoom;
    this.targetZoom = this.baseZoom;
  }

  /** Call when the player levels up to update camera zoom target */
  onLevelUp(newLevel: number): void {
    // IMPORTANT: UI is rendered in the same camera. Dynamic zoom would
    // shrink UI text/frames. Keep zoom stable for now.
    void newLevel;
    this.targetZoom = this.baseZoom;
  }

  /** Smoothly interpolate camera zoom each frame */
  update(): void {
    const cam = this.scene.cameras.main;
    const currentZoom = cam.zoom;
    if (Math.abs(currentZoom - this.targetZoom) > 0.001) {
      cam.setZoom(Phaser.Math.Linear(currentZoom, this.targetZoom, 0.02));
    }
  }
}
