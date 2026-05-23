/**
 * Scene-side wire for The Moor Remembers cairn lifecycle. Extracted from
 * `GameScene` to keep the scene under the LOC ceiling — the orchestrator
 * stays in `CairnOfEchoesScheduler.ts`; the audio synth in
 * `systems/audio/cairnWhisper.ts`; this file only carries the Phaser
 * sprite / tween / caption / banter / save-counter wiring that needs
 * access to scene-bound refs.
 *
 * Pure functions over a `CairnSceneWireDeps` shape — testable without
 * Phaser if the deps are stubbed.
 */
import type * as Phaser from 'phaser';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { bumpAncestralEchoesTouched } from '../../utils/save';
import { CAIRN_INHERITED_BUFF_PCT, WREATHED_INHERITED_BUFF_PCT, type FallenCairn } from '../../utils/save/fallenCairns';
import type { WhisperResult } from './cairnOfEchoesWhisper';
import type { Player } from '../../entities/Player';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { SaveManager } from '../../core/SaveManager';

export interface CairnSceneWireDeps {
  readonly scene: Phaser.Scene;
  readonly player: Player | null;
  readonly banter: BanterSystem | null;
  readonly metaSaveManager: SaveManager;
  readonly floatTextPool: {
    acquire(
      x: number,
      y: number,
      text: string,
      color: string,
      font: string,
      depth: number,
    ): Phaser.GameObjects.Text | null;
  };
  readonly settingsManager: { load(): { reduceFlashing: boolean } };
  /** Scene-level caption channel — same signature as `GameScene.caption`. */
  caption(id: string, message: string, color: string, durationMs: number): void;
}

export interface WalkOverRunState {
  /** Mutable per-run flag — true until the first cairn touch this run. */
  firstThisRun: boolean;
  /** Setter the caller uses to clear the flag after the first touch. */
  setFirstThisRun(value: boolean): void;
}

/**
 * Create the small stacked-stones sprite for a cairn that just entered
 * render range. Soft candle-flicker tween unless `reduceFlashing` is
 * enabled. Texture is `textures.exists()`-guarded so unit-test stubs
 * that skip BootScene baking don't render a magenta placeholder.
 *
 * Returns the sprite for the caller to store; returns null when the
 * texture is absent (test stub path).
 */
export function createCairnSpriteForScene(
  deps: CairnSceneWireDeps,
  cairn: FallenCairn,
): Phaser.GameObjects.Sprite | null {
  if (!deps.scene.textures.exists('cairn_of_echoes')) return null;
  const sprite = deps.scene.add
    .sprite(cairn.x, cairn.y, 'cairn_of_echoes')
    .setDepth(5)
    .setScale(0.85);
  // Wreathed = gold; extinguished = cool slate-blue. Matches spec §Risk-6.
  if (cairn.wreathedAt !== undefined) {
    sprite.setTint(0xf5d04e);
  } else if (cairn.extinguishedAt !== undefined) {
    sprite.setTint(0x6080a0);
  }
  const settings = deps.settingsManager.load();
  if (!settings.reduceFlashing) {
    deps.scene.tweens.add({
      targets: sprite,
      alpha: { from: 0.65, to: 1.0 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  } else {
    sprite.setAlpha(0.85);
  }
  return sprite;
}

/**
 * Release a cairn sprite when the player walks beyond render radius.
 * Tween is killed before destroy so a yoyo timing-window doesn't write
 * to a destroyed target.
 */
export function destroyCairnSpriteOnScene(
  deps: CairnSceneWireDeps,
  sprite: Phaser.GameObjects.Sprite,
): void {
  deps.scene.tweens.killTweensOf(sprite);
  sprite.destroy();
}

/**
 * Walk-over handler. Routes the whisper (past-self or grandfather) to
 * audio + caption + floating buff text + banter sub-pool + the
 * Achievement counter. The +1 % inherited buff is applied to the live
 * Player; channel routing lives in `Player.applyInheritedCairnBuff`.
 */
export function handleCairnWalkOverOnScene(
  deps: CairnSceneWireDeps,
  cairn: FallenCairn,
  whisper: WhisperResult,
  state: WalkOverRunState,
): void {
  // Audio — seed by the cairn's savedAt so a given cairn always whispers
  // the same way (T1 determinism). Grandfather branch also advances the
  // Old Drover reveal counter.
  if (whisper.kind === 'past_self') {
    audio.playCairnPastSelfWhisper(cairn.savedAt);
  } else {
    audio.playCairnGrandfatherWhisper(cairn.savedAt);
    try {
      deps.metaSaveManager.incrementOldDroverRevealed();
    } catch {
      /* best-effort */
    }
  }

  // Caption — the i18nKey is replay-deterministic from `pickWhisper`.
  deps.caption('cairn_walkover', t(whisper.i18nKey), '#a8c4dc', 4000);

  // Wreathed cairns (Cailleach Gauntlet win) grant double buff — spec §4.3.
  const wreathed = cairn.wreathedAt !== undefined;
  const buffPct = wreathed ? WREATHED_INHERITED_BUFF_PCT : CAIRN_INHERITED_BUFF_PCT;
  const buffLabel = `+${wreathed ? 2 : 1}% ${cairn.inheritedStat}`;

  // Floating buff text — slate-blue / gold marker that rises from the
  // cairn coord. Pulled from the shared FloatTextPool so combat / pickup
  // feedback channels don't compete for the same slots.
  const buffColor = wreathed ? '#f5d04e' : '#a8c4dc';
  const buffText = deps.floatTextPool.acquire(
    cairn.x,
    cairn.y - 24,
    buffLabel,
    buffColor,
    '14px',
    85,
  );
  if (buffText) {
    deps.scene.tweens.add({
      targets: buffText,
      y: buffText.y - 22,
      alpha: 0,
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => {
        buffText.setVisible(false);
      },
    });
  }

  // Apply the inherited buff to the live Player. Channel mapping +
  // multiplier folding lives on the Player side.
  deps.player?.applyInheritedCairnBuff(cairn.inheritedStat, buffPct);

  // Banter — pick sub-pool by whisper kind + this-run-touched flag.
  const subPool: string =
    whisper.kind === 'grandfather' && whisper.leafIndex === 25
      ? 'grandfather_complete'
      : whisper.kind === 'grandfather' && whisper.leafIndex === 1
        ? 'grandfather_first'
        : whisper.kind === 'grandfather'
          ? 'grandfather_revealed'
          : state.firstThisRun
            ? 'past_self_first'
            : 'past_self';
  deps.banter?.request('cairn_walkover', { tag: subPool });
  state.setFirstThisRun(false);

  // Lifetime touch counter — shared with AncestralEcho per spec §4.4
  // ("the cairn IS the persistent echo"). Bump is best-effort.
  try {
    bumpAncestralEchoesTouched();
  } catch {
    /* best-effort */
  }
}
