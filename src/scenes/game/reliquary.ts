/**
 * Reliquary Pickup — rare off-path curio, one per run.
 *
 * DESIGN_IDEAS § 1 M15 — "~1 per run, a hidden relic spawns off-path;
 * grants a run-scoped curio + a lore page. Optional, non-blocking."
 * Ships the curio + collect toast; lore page stays open for a future
 * codex pass. Sibling to the Standing Stones at 5:00 but distinct:
 *  - Single pickup, not a trinity.
 *  - Spawned at a run-random second in a 6:00–12:00 window, not a fixed mark.
 *  - Placed far from the player (400+ px) so finding it is a routing
 *    detour, not a walk-in.
 *  - No time-pressure telegraph — it just sits in the world until
 *    walked over.
 *
 * Pure helpers live alongside the orchestrator class so the decision
 * math (curio shuffle, placement sampling) tests without Phaser.
 */
import * as Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { RNG } from '../../utils/rng';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';

export type ReliquaryCurioId = 'echoing_reed' | 'flint_charm' | 'cairn_moss';

export interface ReliquaryCurio {
  readonly id: ReliquaryCurioId;
  readonly titleKey: string;
  readonly descKey: string;
}

/** Stable order — shuffled per run via `shuffleCurios(rng)`. */
export const RELIQUARY_CURIOS: readonly ReliquaryCurio[] = [
  {
    id: 'echoing_reed',
    titleKey: 'ui.reliquary.echoing_reed.title',
    descKey: 'ui.reliquary.echoing_reed.desc',
  },
  {
    id: 'flint_charm',
    titleKey: 'ui.reliquary.flint_charm.title',
    descKey: 'ui.reliquary.flint_charm.desc',
  },
  {
    id: 'cairn_moss',
    titleKey: 'ui.reliquary.cairn_moss.title',
    descKey: 'ui.reliquary.cairn_moss.desc',
  },
];

/** Earliest second the reliquary can spawn (inclusive). */
export const RELIQUARY_SPAWN_MIN_SEC = 360;
/** Latest second the reliquary can spawn (inclusive). */
export const RELIQUARY_SPAWN_MAX_SEC = 720;
/** Proximity threshold for claiming the relic (pixels). */
export const RELIQUARY_PICK_RADIUS_PX = 34;
/** Minimum distance from the player when choosing a spawn position. */
export const RELIQUARY_MIN_SPAWN_DIST_PX = 400;
/** Maximum distance from the player when choosing a spawn position. */
export const RELIQUARY_MAX_SPAWN_DIST_PX = 620;
/** Keep at least this margin from world edges so the sprite is reachable. */
export const RELIQUARY_EDGE_MARGIN_PX = 140;

/**
 * Roll the run's spawn second. Range covers the mid-run stretch after
 * the Standing Stones (5:00) have already resolved so the two events
 * don't step on each other — a player chasing a stone shouldn't also
 * have a relic pulling them in a third direction.
 */
export function chooseReliquarySpawnSec(rng: RNG): number {
  return rng.int(RELIQUARY_SPAWN_MIN_SEC, RELIQUARY_SPAWN_MAX_SEC);
}

/**
 * Pick the first curio of a seeded shuffle. Pure; same seed + same
 * call order = same curio, so replay playback matches live.
 */
export function chooseReliquaryCurio(rng: RNG): ReliquaryCurio {
  const curios = shuffleCurios(rng);
  return curios[0];
}

export function shuffleCurios(rng: RNG): ReliquaryCurio[] {
  const a = RELIQUARY_CURIOS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose a reliquary position far from the player but within world
 * bounds. Samples an angle + radius from the supplied RNG, then
 * clamps to world margins. Returns the clamped coords; if clamping
 * pulls the point inside the min-distance shell the caller is
 * expected to accept it — a clamped spawn near the player is still
 * better than a stuck relic outside the world.
 */
export function computeReliquaryPlacement(
  rng: RNG,
  playerX: number,
  playerY: number,
  worldWidth: number,
  worldHeight: number,
): { x: number; y: number } {
  const angle = rng.float(0, Math.PI * 2);
  const dist = rng.float(RELIQUARY_MIN_SPAWN_DIST_PX, RELIQUARY_MAX_SPAWN_DIST_PX);
  const rawX = playerX + Math.cos(angle) * dist;
  const rawY = playerY + Math.sin(angle) * dist;
  const minX = RELIQUARY_EDGE_MARGIN_PX;
  const maxX = worldWidth - RELIQUARY_EDGE_MARGIN_PX;
  const minY = RELIQUARY_EDGE_MARGIN_PX;
  const maxY = worldHeight - RELIQUARY_EDGE_MARGIN_PX;
  return {
    x: Math.max(minX, Math.min(maxX, rawX)),
    y: Math.max(minY, Math.min(maxY, rawY)),
  };
}

/** Apply a curio's stat effect to the player via existing Player APIs. */
export function applyReliquaryCurio(player: Player, curio: ReliquaryCurio): void {
  switch (curio.id) {
    case 'echoing_reed':
      player.addPickupRadius(20);
      break;
    case 'flint_charm':
      player.addCritChance(0.07);
      break;
    case 'cairn_moss':
      player.addHpRegen(0.4);
      break;
  }
}

export interface ReliquaryHooks {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly rng: RNG;
  readonly worldWidth: number;
  readonly worldHeight: number;
  onPick(curio: ReliquaryCurio): void;
}

interface ReliquaryInstance {
  x: number;
  y: number;
  curio: ReliquaryCurio;
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Arc;
  alive: boolean;
}

/**
 * Phaser-bound orchestrator. Places a single relic in the world and
 * awards its curio when the player walks within pick radius.
 */
export class Reliquary {
  private instance: ReliquaryInstance | null = null;
  private picked = false;
  private spawned = false;

  constructor(private readonly hooks: ReliquaryHooks) {}

  /**
   * Spawn the relic. Curio + position are drawn from the run RNG so
   * daily runs still resolve deterministically. No-op after the
   * first spawn or after a pick.
   */
  spawn(): void {
    if (this.spawned || this.picked) return;
    this.spawned = true;
    const curio = chooseReliquaryCurio(this.hooks.rng);
    const pos = computeReliquaryPlacement(
      this.hooks.rng,
      this.hooks.player.x,
      this.hooks.player.y,
      this.hooks.worldWidth,
      this.hooks.worldHeight,
    );
    const glow = this.hooks.scene.add
      .circle(pos.x, pos.y, RELIQUARY_PICK_RADIUS_PX + 10, 0xffb060, 0.2)
      .setDepth(4);
    const sprite = this.hooks.scene.add.sprite(pos.x, pos.y, 'reliquary').setDepth(5);
    // Gentle breathing pulse so the relic is visible without shouting.
    this.hooks.scene.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 0.9,
      duration: 1400,
      ...TWEEN_INFINITE_BREATHE,
    });
    this.hooks.scene.tweens.add({
      targets: sprite,
      y: pos.y - 3,
      duration: 1100,
      ...TWEEN_INFINITE_BREATHE,
    });
    this.instance = { x: pos.x, y: pos.y, curio, sprite, glow, alive: true };
  }

  /** Called per gameplay frame. Picks the relic when the player steps into range. */
  tick(): void {
    if (this.picked || !this.instance || !this.instance.alive) return;
    const dx = this.hooks.player.x - this.instance.x;
    const dy = this.hooks.player.y - this.instance.y;
    const r2 = RELIQUARY_PICK_RADIUS_PX * RELIQUARY_PICK_RADIUS_PX;
    if (dx * dx + dy * dy <= r2) this.pick();
  }

  private pick(): void {
    if (this.picked || !this.instance) return;
    this.picked = true;
    const chosen = this.instance;

    applyReliquaryCurio(this.hooks.player, chosen.curio);
    this.hooks.onPick(chosen.curio);

    // Bright flash then fade — relic dissolves into the player.
    this.hooks.scene.tweens.add({
      targets: [chosen.sprite, chosen.glow],
      scale: 1.6,
      alpha: 0,
      duration: 550,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        chosen.sprite.destroy();
        chosen.glow.destroy();
      },
    });
    chosen.alive = false;
  }

  /** Clean up outstanding graphics on scene shutdown / reset. */
  destroy(): void {
    if (this.instance) {
      this.instance.sprite.destroy();
      this.instance.glow.destroy();
      this.instance = null;
    }
    this.picked = false;
    this.spawned = false;
  }

  /** True once the curio has been awarded this run. */
  isResolved(): boolean {
    return this.picked;
  }

  /**
   * Current world-space position of the relic for the minimap, or null
   * when unpicked / unspawned. Minimap uses this to render a small
   * amber star so the relic is discoverable — it's off-path by
   * design, but hidden completely would punish players who never
   * wander.
   */
  getMinimapMarker(): { x: number; y: number } | null {
    if (!this.instance || !this.instance.alive) return null;
    return { x: this.instance.x, y: this.instance.y };
  }
}
