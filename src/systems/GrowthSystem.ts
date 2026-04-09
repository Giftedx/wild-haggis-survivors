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
  private targetZoom: number = 1;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
  }

  /** Call when the player levels up to update camera zoom target */
  onLevelUp(newLevel: number): void {
    // Zoom out as level increases: 1.0 at level 1, ~0.75 at level 30
    this.targetZoom = Math.max(0.75, 1.0 - (newLevel - 1) * 0.008);
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
