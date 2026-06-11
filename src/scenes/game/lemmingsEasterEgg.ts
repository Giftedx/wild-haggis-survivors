/**
 * Lemmings Easter Egg — DESIGN_IDEAS §13 Scottish-games-lineage homage.
 *
 * Stand idle in coastal (cliff-edge) biome for 90 s and a tiny line of
 * pixel lemmings walks across the screen, falls off the cliff with a
 * cartoon "OH NO!" SFX, and a hearth toast: "The lemmings remember ye."
 * Reserved once-per-variant lifetime — each haggis variant earns the
 * parade once. A love-letter to DMA Design / Dundee 1991.
 *
 * Pure trigger logic lives in `src/entities/lemmingsTrigger.ts`. This
 * file is the Phaser-bound orchestrator — sprites, walk/fall tweens,
 * SFX, banter. Mirrors `clootieTree.ts` shape so resetTransientRunState
 * can wire it the same way (destroy + null on scene reuse).
 *
 * The parade is *cosmetic* — no gameplay state changes, no balance
 * impact, no minimap marker (the easter egg is meant to be discovered,
 * not advertised). One persistence side-effect: writes the variant key
 * into `save.lemmingsSeenForVariant` so the next run with that variant
 * doesn't re-trigger the parade.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §21 (Scottish games-lineage / DMA
 * Design); DESIGN_IDEAS.md §13 (Lemmings easter egg).
 */
import * as Phaser from 'phaser';
import {
  createLemmingsTriggerState,
  tickLemmingsTrigger,
  type LemmingsTriggerState,
} from '../../entities/lemmingsTrigger';
import { LEMMING_TEXTURE_KEY } from '../../art/sprites/fx/lemming';
import { buildLemmingsParadeCue } from '../../systems/lemmingsParadeCue';

export const LEMMING_COUNT = 5;
/** Px between adjacent lemmings on the marching line. */
export const LEMMING_GAP_PX = 22;
/** World-space x-offset of the leftmost lemming relative to the
 *  player at parade spawn. Negative = to the left. */
export const LEMMING_SPAWN_OFFSET_X = -280;
/** World-space y-offset of the parade line relative to the player.
 *  Negative = above the player on the screen. */
export const LEMMING_SPAWN_OFFSET_Y = -60;
/** How far each lemming walks rightward before falling. */
export const LEMMING_WALK_DISTANCE_PX = 380;
/** Walk duration (ms) before the fall begins. */
export const LEMMING_WALK_DURATION_MS = 2800;
/** How far each lemming falls vertically before despawn. */
export const LEMMING_FALL_DISTANCE_PX = 240;
/** Fall duration (ms). */
export const LEMMING_FALL_DURATION_MS = 1100;
/** Stagger between successive lemmings' fall starts (ms). One falls,
 *  then the next, in sequence — never all at once. */
export const LEMMING_FALL_STAGGER_MS = 200;
/** Delay before the FIRST lemming's fall begins (ms). The march needs
 *  a beat to read as "they're walking" before the joke lands. */
export const LEMMING_FALL_INITIAL_DELAY_MS = 2200;
/** Sprite render depth — above gameplay-critical (95-101 band per
 *  reference_phaser_depth_layers memory) so the parade sits in front
 *  of enemies but below the countdown overlay (1000+). */
export const LEMMING_DEPTH = 95;

export interface LemmingsEasterEggHooks {
  readonly scene: Phaser.Scene;
  /** Live player position accessor — read at parade-spawn time so the
   *  line is anchored to wherever the haggis was standing when the
   *  trigger fired. */
  getPlayerXY(): { x: number; y: number };
  /** Active variant key — used both for the once-per-variant gate and
   *  the persistence write on trigger. */
  getActiveVariantKey(): string;
  /** Current biome at the player's position, or null. */
  getCurrentBiomeId(): string | null;
  /** "Is the player effectively still right now?" Caller owns the
   *  velocity threshold; the helper just consumes the boolean. */
  isPlayerStill(): boolean;
  /** Save accessor — has THIS variant ever earned the parade? */
  hasVariantSeen(variantKey: string): boolean;
  /** Save mutator — append the variant key to the lifetime list.
   *  Best-effort; the orchestrator shouldn't crash on storage failure
   *  (the parade still plays — losing the lifetime mark just means
   *  the player gets the moment again on a future run). */
  persistVariantSeen(variantKey: string): void;
  /** Banter request — caller injects so the orchestrator stays free
   *  of BanterSystem-specific imports. Caller should map this to
   *  `banter.request('lemmings_remember')`. */
  requestBanter(): void;
  /** Accessibility caption for the OH NO! SFX and falling-parade beat.
   *  Caller maps to `GameScene.caption`; captions settings decide
   *  whether it is visible. */
  caption(id: string, message: string, tint?: string): void;
  /** SFX hook — the OH NO! warble. Caller maps to
   *  `audio.playLemmingsOhNo()`. */
  playSfx(): void;
}

export class LemmingsEasterEgg {
  private state: LemmingsTriggerState = createLemmingsTriggerState();
  private active = false;
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(private readonly hooks: LemmingsEasterEggHooks) {}

  /**
   * Per-frame tick. Drive with the *scaled* delta — the trigger
   * shouldn't accumulate during pauses or modals. Once-per-run
   * latch: after a successful trigger this becomes a no-op for the
   * remainder of the run (the parade plays out via tween callbacks,
   * the orchestrator doesn't re-evaluate).
   */
  tick(scaledDeltaMs: number): void {
    if (this.active) return;

    const variantKey = this.hooks.getActiveVariantKey();
    const variantAlreadyFired = this.hooks.hasVariantSeen(variantKey);

    const result = tickLemmingsTrigger(this.state, {
      dtMs: scaledDeltaMs,
      biomeId: this.hooks.getCurrentBiomeId(),
      playerStill: this.hooks.isPlayerStill(),
      variantAlreadyFired,
    });
    this.state = result.state;

    if (result.triggeredEdge) {
      this.fireParade(variantKey);
    }
  }

  /**
   * Kick off the parade. Persists the variant lifetime mark, fires
   * the banter beat, plays the SFX (immediately; the OH NO is heard
   * "in the haggis's mind" the moment the trigger fires, even if the
   * visible fall starts a beat later), then spawns the marching
   * line.
   */
  private fireParade(variantKey: string): void {
    this.active = true;
    this.hooks.persistVariantSeen(variantKey);
    const cue = buildLemmingsParadeCue();
    this.hooks.caption(cue.captionId, cue.caption, cue.captionTint);
    this.hooks.requestBanter();
    this.hooks.playSfx();
    this.spawnAndAnimate();
  }

  private spawnAndAnimate(): void {
    const { x: px, y: py } = this.hooks.getPlayerXY();
    const baseX = px + LEMMING_SPAWN_OFFSET_X;
    const baseY = py + LEMMING_SPAWN_OFFSET_Y;

    // Texture-exists guard — unit-test stubs that skip BootScene baking
    // would otherwise render the magenta missing-texture placeholder.
    // The fallback is a tinted rectangle that still sells the parade
    // beat in headless test scenes.
    const useTexture = this.hooks.scene.textures.exists(LEMMING_TEXTURE_KEY);

    for (let i = 0; i < LEMMING_COUNT; i++) {
      const startX = baseX + i * LEMMING_GAP_PX;
      const sprite = useTexture
        ? this.hooks.scene.add.image(startX, baseY, LEMMING_TEXTURE_KEY)
        : this.makeFallbackSprite(startX, baseY);
      sprite.setDepth(LEMMING_DEPTH);
      sprite.setScale(0.95);
      this.sprites.push(sprite);

      // Walk tween — slow march to the right.
      this.hooks.scene.tweens.add({
        targets: sprite,
        x: startX + LEMMING_WALK_DISTANCE_PX,
        duration: LEMMING_WALK_DURATION_MS,
        ease: 'Linear',
      });

      // Fall tween — staggered so the lemmings drop one-by-one. Each
      // lemming's fall starts at `INITIAL_DELAY + i * STAGGER`; the
      // tween itself is a downward arc with fade + slight rotation.
      const fallDelay = LEMMING_FALL_INITIAL_DELAY_MS + i * LEMMING_FALL_STAGGER_MS;
      const tween = this.hooks.scene.tweens.add({
        targets: sprite,
        y: baseY + LEMMING_FALL_DISTANCE_PX,
        alpha: 0,
        scaleX: 0.55,
        scaleY: 0.55,
        rotation: 0.35,
        duration: LEMMING_FALL_DURATION_MS,
        ease: 'Cubic.easeIn',
        delay: fallDelay,
        onComplete: () => {
          sprite.destroy();
          // Last-lemming-down housekeeping — drop the array reference
          // so a destroy() call after the parade has no stale handles.
          if (i === LEMMING_COUNT - 1) {
            this.sprites = [];
          }
        },
      });
      // Stash the tween on the sprite for cleanup if the scene shuts
      // down mid-parade. Phaser kills tweens on sprite.destroy() but
      // not the other way; explicit kill from destroy() is cheap and
      // defensive.
      (sprite as Phaser.GameObjects.Image & { _lemmingFallTween?: Phaser.Tweens.Tween })
        ._lemmingFallTween = tween;
    }
  }

  /**
   * Headless-test fallback sprite — the parade still plays beat-wise
   * but with a tinted rectangle instead of a baked texture. Keeps the
   * orchestrator usable in unit tests that skip BootScene without
   * forcing every test to bake the fx atlas.
   */
  private makeFallbackSprite(x: number, y: number): Phaser.GameObjects.Image {
    // Phaser still requires SOME texture for `add.image`. The Graphics
    // path is a small detour — generate a one-shot tinted rect texture
    // under a unique key so we never fight the texture cache.
    const key = `__lemming_fallback_${Phaser.Math.RND.uuid()}`;
    const g = this.hooks.scene.add.graphics();
    g.fillStyle(0x3050cc, 1);
    g.fillRect(0, 0, 8, 12);
    g.generateTexture(key, 8, 12);
    g.destroy();
    return this.hooks.scene.add.image(x, y, key);
  }

  /**
   * True after the parade has fired this run. Subsequent ticks are
   * no-ops; the trigger latch + the orchestrator's `active` flag both
   * gate re-entry.
   */
  isFired(): boolean {
    return this.state.fired;
  }

  /** Test/debug accessor — reports the trigger's idle progress
   *  fraction [0..1]. Production HUD never reads this (the easter
   *  egg is meant to be discovered, not telegraphed); the accessor
   *  exists so a future debug overlay can verify the timer ticks. */
  getProgress(): number {
    return this.state.idleMs / 90_000;
  }

  /**
   * Clean up sprites + tweens on scene shutdown / reset. Mirrors
   * `ClootieTree.destroy()` — destroy the live graphics, clear the
   * arrays, restore the trigger to a fresh state.
   */
  destroy(): void {
    for (const sprite of this.sprites) {
      const stash = sprite as Phaser.GameObjects.Image & {
        _lemmingFallTween?: Phaser.Tweens.Tween;
      };
      stash._lemmingFallTween?.stop();
      this.hooks.scene.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.sprites = [];
    this.active = false;
    this.state = createLemmingsTriggerState();
  }
}
