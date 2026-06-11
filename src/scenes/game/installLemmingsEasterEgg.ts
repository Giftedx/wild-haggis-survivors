/**
 * Lemmings Easter Egg install.
 *
 * Extracted from GameScene.create() to keep the scene under the
 * 2200-LOC hard ceiling. Owns the constructor call and inlines the
 * hooks that are pure save/audio lookups so GameScene only passes
 * scene-bound accessors.
 *
 * Pure cosmetic — no gameplay state, no replay determinism stake.
 * Refs: DESIGN_IDEAS.md §13; SCOTTISH_RESEARCH_DEEP.md §21.
 */
import * as Phaser from 'phaser';
import { LemmingsEasterEgg } from './lemmingsEasterEgg';
import { audio } from '../../systems/AudioSystem';
import { loadSave, bumpLemmingsSeenForVariant } from '../../utils/save';
import type { Player } from '../../entities/Player';

export interface InstallLemmingsEasterEggDeps {
  readonly scene: Phaser.Scene;
  readonly getPlayer: () => Player;
  readonly getActiveVariantKey: () => string;
  readonly getCurrentBiomeId: () => string | null;
  readonly requestBanter: () => void;
  readonly caption: (id: string, message: string, tint?: string) => void;
}

export function installLemmingsEasterEgg(
  deps: InstallLemmingsEasterEggDeps,
): LemmingsEasterEgg {
  return new LemmingsEasterEgg({
    scene: deps.scene,
    getPlayerXY: () => ({ x: deps.getPlayer().x, y: deps.getPlayer().y }),
    getActiveVariantKey: deps.getActiveVariantKey,
    getCurrentBiomeId: deps.getCurrentBiomeId,
    isPlayerStill: () => {
      const body = deps.getPlayer().body as Phaser.Physics.Arcade.Body | null;
      const vx = body?.velocity.x ?? 0;
      const vy = body?.velocity.y ?? 0;
      return Math.hypot(vx, vy) < 8;
    },
    hasVariantSeen: (key) => {
      try {
        return loadSave().lemmingsSeenForVariant.includes(key);
      } catch {
        return false;
      }
    },
    persistVariantSeen: (key) => bumpLemmingsSeenForVariant(key),
    requestBanter: () => deps.requestBanter(),
    caption: (id, message, tint) => deps.caption(id, message, tint),
    playSfx: () => audio.playLemmingsOhNo(),
  });
}
