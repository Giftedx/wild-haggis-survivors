/**
 * CompanionSystem — Phaser orchestrator for the Whistle-Call
 * Companions track (first slice: sheepdog).
 *
 * Owns:
 *   - the sprite + state for active companions (cap: `MAX_COMPANIONS_PER_RUN`)
 *   - texture-existence guard so unit-test stubs that skip the boot
 *     baking never render the magenta missing-texture placeholder
 *     (CLAUDE.md "new-system safety pattern" rule (c))
 *   - lifecycle: whistle-call → spawn, dismiss → fade-out, destroy
 *     → drop everything
 *   - LivingWorldSubsystem hookup so the per-frame tick runs through
 *     the director's pause-aware path
 *
 * Explicitly does NOT:
 *   - damage enemies, collect XP, alter spawn behaviour, or interact
 *     with pickups
 *   - use Math.random() for anything visible to gameplay (first
 *     slice is purely cosmetic so no replay-determinism stake)
 *   - cache the LivingWorldRunContext object — fields are read fresh
 *     each frame, matching the contract in `livingWorldTypes.ts`.
 *
 * Future slices (stoat scout, eagle marker, kelpie-foal hint) widen
 * `CompanionKey` + `COMPANION_DEFS` and may add per-companion
 * behaviour modules under `src/entities/companions/*`; this
 * orchestrator stays as the single Phaser surface.
 */

import * as Phaser from 'phaser';
import {
  COMPANION_DEFS,
  MAX_COMPANIONS_PER_RUN,
  type CompanionKey,
} from '../../entities/companions/companionTypes';
import {
  stepFollow,
  tailPosition,
  type SheepdogState,
} from '../../entities/companions/sheepdogCompanion';
import type { Player } from '../../entities/Player';
import type { LivingWorldDirector, LivingWorldSubsystem } from './LivingWorldDirector';
import type { LivingWorldRunContext } from './livingWorldTypes';

const COMPANION_SPRITE_DEPTH = 11; // Just above player ground tier, below HUD.

interface ActiveCompanion {
  readonly key: CompanionKey;
  readonly sprite: Phaser.GameObjects.Image;
  state: SheepdogState;
}

export class CompanionSystem implements LivingWorldSubsystem {
  readonly id = 'companions';

  private readonly scene: Phaser.Scene;
  private readonly getPlayer: () => Player | null;
  private active: ActiveCompanion | null = null;
  /** Cached velocity so paused frames carry the last-seen direction. */
  private lastVx = 0;
  private lastVy = 0;
  private destroyed = false;
  private director: LivingWorldDirector | null = null;

  constructor(opts: { scene: Phaser.Scene; getPlayer: () => Player | null }) {
    this.scene = opts.scene;
    this.getPlayer = opts.getPlayer;
  }

  /** Register with the director — emits + receives moments. */
  attachDirector(director: LivingWorldDirector): void {
    if (this.destroyed) return;
    this.director = director;
    director.addSubsystem(this);
  }

  /**
   * Spawn the requested companion if there's room under the cap.
   * Returns `true` when the call succeeded. No-ops when already at
   * cap or already showing the same companion — the call surface
   * stays idempotent.
   */
  whistleCall(key: CompanionKey): boolean {
    if (this.destroyed) return false;
    if (this.active && this.active.key === key) return false;
    if (this.active) return false;
    if (this.countActive() >= MAX_COMPANIONS_PER_RUN) return false;
    const def = COMPANION_DEFS[key];
    if (!def) return false;
    const player = this.getPlayer();
    if (!player) return false;

    // Texture-existence guard — skip silently when the bake never
    // ran. This protects unit-test scenes from rendering Phaser's
    // magenta missing-texture placeholder and matches the sibling
    // pattern referenced in CLAUDE.md.
    if (!this.scene.textures.exists(def.textureKeys[0])) return false;

    const playerSnap = this.readPlayerSnapshot(player);
    const start = tailPosition(playerSnap, def);
    const sprite = this.scene.add.image(start.x, start.y, def.textureKeys[0]);
    sprite.setDepth(COMPANION_SPRITE_DEPTH);
    sprite.setOrigin(0.5, 0.85);
    sprite.setAlpha(0);
    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 240,
      ease: 'Sine.easeOut',
    });
    this.active = {
      key,
      sprite,
      state: { x: start.x, y: start.y, animPhaseSec: 0 },
    };
    if (this.director) {
      this.director.notify({
        kind: 'companion_called',
        companionKey: key,
        playerX: player.x,
        playerY: player.y,
      });
    }
    return true;
  }

  /** Dismiss the active companion with a short fade-out. */
  dismiss(): void {
    if (!this.active) return;
    const goingKey = this.active.key;
    const sprite = this.active.sprite;
    this.active = null;
    if (this.director) {
      this.director.notify({ kind: 'companion_dismissed', companionKey: goingKey });
    }
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 220,
      ease: 'Sine.easeIn',
      onComplete: () => sprite.destroy(),
    });
  }

  /** Number of currently-active companions (capped at `MAX_COMPANIONS_PER_RUN`). */
  countActive(): number {
    return this.active ? 1 : 0;
  }

  /** Returns the currently active companion key, or null. */
  getActiveKey(): CompanionKey | null {
    return this.active?.key ?? null;
  }

  /**
   * Per-frame tick — driven by LivingWorldDirector AFTER the
   * gameplay-pause guard cleared, so we don't need to re-check pause
   * here. Hardens against null player (between runs) and missing
   * companion (no whistle this run).
   */
  update(delta: number, _ctx: LivingWorldRunContext): void {
    if (this.destroyed || !this.active) return;
    const player = this.getPlayer();
    if (!player) return;
    const dtSec = Math.max(0, delta) / 1000;
    const def = COMPANION_DEFS[this.active.key];
    const snap = this.readPlayerSnapshot(player);
    const next = stepFollow(this.active.state, snap, def, dtSec);
    this.active.state = {
      x: next.x,
      y: next.y,
      animPhaseSec: (this.active.state.animPhaseSec + dtSec) %
        Math.max(def.idleFrameSec * 2, 0.0001),
    };
    this.active.sprite.x = next.x;
    this.active.sprite.y = next.y;
    const frameKey = def.textureKeys[next.frameIndex];
    if (frameKey && this.scene.textures.exists(frameKey)) {
      this.active.sprite.setTexture(frameKey);
    }
    // Mirror horizontally so the dog faces the player on the X axis.
    this.active.sprite.setFlipX(player.x < next.x);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.active) {
      this.active.sprite.destroy();
      this.active = null;
    }
    this.director = null;
  }

  private readPlayerSnapshot(player: Player) {
    // Player uses Arcade physics. Velocity may be zero (e.g. during
    // hit-freeze) — fall back to the last seen direction so the
    // follow target doesn't jitter when the player pauses input.
    const body = (player as unknown as {
      body?: { velocity?: { x: number; y: number } };
    }).body;
    const vx = body?.velocity?.x ?? 0;
    const vy = body?.velocity?.y ?? 0;
    if (Math.hypot(vx, vy) > 1) {
      this.lastVx = vx;
      this.lastVy = vy;
    }
    return {
      x: player.x,
      y: player.y,
      vx: this.lastVx,
      vy: this.lastVy,
    };
  }
}
