/**
 * Clootie Tree — DESIGN_IDEAS §1 mechanic; folkloric supplication
 * landmark sister to the Reliquary.
 *
 * One tree per run, spawned once at a rolled second from the run RNG.
 * Sits in the world until walked through. Walk-through *commits the
 * wager*: the tree subtracts a percentage of run-base max-HP and grants
 * a single rolled boon (wrath / patience / haste) for the rest of the
 * run.
 *
 * The cost + boon are visible above the tree from the moment it spawns
 * — a small banner sigil reading the boon title + the integer HP cost.
 * No modal, no Y/N prompt: the cost is in plain sight, walking around
 * the tree is the "decline" path. The folklore demands the act of
 * supplication be a deliberate physical step, not a button.
 *
 * Pure decision math (spawn second, boon roll, placement, HP cost) lives
 * in `src/entities/clootieRagWager.ts`. This file is the Phaser-bound
 * orchestrator — sprites, banner, overlap, fade. Mirrors `reliquary.ts`
 * one-for-one so the moor_moments helper module can wire it the same way.
 */
import * as Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { RNG } from '../../utils/rng';
import {
  CLOOTIE_PICK_RADIUS_PX,
  CLOOTIE_HP_COST_FRACTION,
  CLOOTIE_HP_COST_MIN,
  type ClootieBoon,
  applyClootieBoon,
  chooseClootieBoon,
  computeClootiePlacement,
  computeWagerHpCost,
} from '../../entities/clootieRagWager';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';
import { t } from '../../core/i18n';
import { CLOOTIE_TREE_TEXTURE_KEY } from '../../art/sprites/pickups/clootieTree';

export { CLOOTIE_TREE_TEXTURE_KEY };

export interface ClootieTreeHooks {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly rng: RNG;
  readonly worldWidth: number;
  readonly worldHeight: number;
  /** Run-base max HP — used to compute the cost from a stable baseline
   *  rather than `getMaxHp()` so a rune-bag multiplier doesn't change
   *  the cost between spawn and commit. */
  readonly runBaseMaxHp: number;
  /** Called when the player walks into the tree. The orchestrator has
   *  already applied the HP cost + boon to the player; the callback is
   *  for the toast / caption / banter / save bumps. */
  onPick(boon: ClootieBoon, hpCost: number): void;

  // ── visual / cost overrides (optional — black clootie variant) ──────
  /** Override the boon-picker function. Defaults to `chooseClootieBoon`. */
  readonly chooseBoon?: (rng: RNG) => ClootieBoon;
  /** Override the HP cost fraction. Defaults to `CLOOTIE_HP_COST_FRACTION`. */
  readonly hpCostFraction?: number;
  /** Override the HP cost minimum. Defaults to `CLOOTIE_HP_COST_MIN`. */
  readonly hpCostMin?: number;
  /** Tint applied to the tree sprite (0xRRGGBB). Default: no tint. */
  readonly spriteTint?: number;
  /** Colour of the glow arc (0xRRGGBB). Default: `0x88a070`. */
  readonly glowTint?: number;
}

interface ClootieTreeInstance {
  x: number;
  y: number;
  boon: ClootieBoon;
  hpCost: number;
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  banner: Phaser.GameObjects.Container | null;
  glow: Phaser.GameObjects.Arc;
  alive: boolean;
}

export class ClootieTree {
  private instance: ClootieTreeInstance | null = null;
  private picked = false;
  private spawned = false;

  constructor(private readonly hooks: ClootieTreeHooks) {}

  /**
   * Spawn the tree. Boon, position, and cost are all derived from
   * the run RNG + run-base max-HP, so daily runs / replays resolve
   * deterministically. No-op after the first spawn or after a pick.
   */
  spawn(): void {
    if (this.spawned || this.picked) return;
    this.spawned = true;

    const pickBoon = this.hooks.chooseBoon ?? chooseClootieBoon;
    const boon = pickBoon(this.hooks.rng);
    const pos = computeClootiePlacement(
      this.hooks.rng,
      this.hooks.player.x,
      this.hooks.player.y,
      this.hooks.worldWidth,
      this.hooks.worldHeight,
    );
    const costFraction = this.hooks.hpCostFraction ?? CLOOTIE_HP_COST_FRACTION;
    const costMin = this.hooks.hpCostMin ?? CLOOTIE_HP_COST_MIN;
    const hpCost = computeWagerHpCost(this.hooks.runBaseMaxHp, costFraction, costMin);

    const glowColour = this.hooks.glowTint ?? 0x88a070;
    const glow = this.hooks.scene.add
      .circle(pos.x, pos.y + 4, CLOOTIE_PICK_RADIUS_PX + 8, glowColour, 0.18)
      .setDepth(4);

    // Sprite — use the baked clootie tree texture if available, fall
    // back to a tinted rectangle so unit-test scenes that skip BootScene
    // baking don't render the magenta missing-texture placeholder.
    // Pattern matches §"Phaser 4 Gotchas" / new-system-safety checklist.
    const rawSprite = this.hooks.scene.textures.exists(CLOOTIE_TREE_TEXTURE_KEY)
      ? this.hooks.scene.add.sprite(pos.x, pos.y, CLOOTIE_TREE_TEXTURE_KEY).setDepth(5)
      : this.hooks.scene.add
          .rectangle(pos.x, pos.y, 18, 26, 0x4a3a2c)
          .setStrokeStyle(1, 0x2a1a14)
          .setDepth(5);
    if (this.hooks.spriteTint !== undefined) {
      (rawSprite as Phaser.GameObjects.Sprite).setTint?.(this.hooks.spriteTint);
    }
    const sprite = rawSprite;

    // Gentle breathing pulse on the glow so the landmark is visible
    // without shouting. Tree itself stays still — clootie wells are
    // grave places, not festive ones.
    this.hooks.scene.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 0.92,
      duration: 1600,
      ...TWEEN_INFINITE_BREATHE,
    });

    const banner = this.buildBanner(pos.x, pos.y, boon, hpCost);

    this.instance = {
      x: pos.x,
      y: pos.y,
      boon,
      hpCost,
      sprite,
      banner,
      glow,
      alive: true,
    };
  }

  /**
   * Floating banner above the tree showing the cost + boon name. The
   * cost is always visible from spawn — the player commits with eyes
   * open or walks past. Returns null if container/text construction
   * is unavailable (test scene); a missing banner doesn't block the
   * commit path, the overlap still works.
   */
  private buildBanner(
    x: number,
    y: number,
    boon: ClootieBoon,
    hpCost: number,
  ): Phaser.GameObjects.Container | null {
    try {
      const title = t(boon.titleKey);
      const label = t('ui.clootie.banner', { cost: String(hpCost), boon: title });
      const text = this.hooks.scene.add.text(0, 0, label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e8e0c8',
        backgroundColor: '#2a2018',
        padding: { x: 4, y: 2 },
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      const c = this.hooks.scene.add.container(x, y - 22, [text]);
      c.setDepth(6);
      return c;
    } catch {
      // Test scene without a real text renderer — the banner is
      // strictly aesthetic, the commit path is overlap-driven.
      return null;
    }
  }

  /** Called per gameplay frame. Commits the wager when the player steps into range. */
  tick(): void {
    if (this.picked || !this.instance || !this.instance.alive) return;
    const dx = this.hooks.player.x - this.instance.x;
    const dy = this.hooks.player.y - this.instance.y;
    const r2 = CLOOTIE_PICK_RADIUS_PX * CLOOTIE_PICK_RADIUS_PX;
    if (dx * dx + dy * dy <= r2) this.commit();
  }

  /**
   * Apply the wager — HP cost + boon — and run the caller's onPick
   * callback for toast / caption / banter / save bumps. Side-effects
   * here are deliberate and irreversible: that's the contract of the
   * tree.
   */
  private commit(): void {
    if (this.picked || !this.instance) return;
    this.picked = true;
    const chosen = this.instance;

    // Apply the cost FIRST, then the boon. Order matters for the death
    // edge: if the cost would somehow drop the player to 1 HP and the
    // boon includes a future heal hook, the heal sees the post-sacrifice
    // HP. Today no boon heals, but the order is the safer default.
    this.hooks.player.applyClootieWagerCost(chosen.hpCost);
    applyClootieBoon(this.hooks.player, chosen.boon);

    this.hooks.onPick(chosen.boon, chosen.hpCost);

    // Visual: ribbons "fall" — the banner fades, the tree's glow dims,
    // and the sprite gives a small upward bob then settles. The tree
    // remains in the world after commit (an answered prayer leaves a
    // marker), it just stops glowing.
    if (chosen.banner) {
      this.hooks.scene.tweens.add({
        targets: chosen.banner,
        alpha: 0,
        y: chosen.banner.y - 6,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => chosen.banner?.destroy(),
      });
    }
    this.hooks.scene.tweens.add({
      targets: chosen.glow,
      alpha: 0,
      scale: 1.2,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => chosen.glow.destroy(),
    });
    this.hooks.scene.tweens.add({
      targets: chosen.sprite,
      y: chosen.y - 3,
      duration: 250,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    chosen.alive = false;
  }

  /** Clean up outstanding graphics on scene shutdown / reset. */
  destroy(): void {
    if (this.instance) {
      this.instance.sprite.destroy();
      this.instance.banner?.destroy();
      this.instance.glow.destroy();
      this.instance = null;
    }
    this.picked = false;
    this.spawned = false;
  }

  /** True once the wager has been committed this run. */
  isResolved(): boolean {
    return this.picked;
  }

  /**
   * Current world-space position for the minimap, or null when the
   * tree is unspawned / already committed. Surfaces a small marker
   * so the player can plan whether to detour for the wager — fair
   * UX for a cost-bearing landmark.
   */
  getMinimapMarker(): { x: number; y: number } | null {
    if (!this.instance || !this.instance.alive) return null;
    return { x: this.instance.x, y: this.instance.y };
  }
}
