import type Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';

/**
 * Wires the standard "stop the moor wind SFX on scene shutdown" hook.
 * Curse / Chronicle / Deeds all opened the same 3-line handler — pulled
 * out so a future audio-cleanup tweak (or extra teardown) lives in one
 * place instead of three.
 */
export function stopAmbientWindOnShutdown(scene: Phaser.Scene): void {
  scene.events.once('shutdown', () => {
    audio.stopAmbientWind();
  });
}
