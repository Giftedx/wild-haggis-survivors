import type Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';

/**
 * Returns a click handler that plays the standard click SFX and then
 * starts the given scene. Pulled out of the back-button + ESC-key
 * handlers in Curse / Chronicle / Deeds, which all opened the same
 * 4-line lambda.
 */
export function clickToScene(scene: Phaser.Scene, sceneKey: string): () => void {
  return () => {
    audio.playClick();
    scene.scene.start(sceneKey);
  };
}
