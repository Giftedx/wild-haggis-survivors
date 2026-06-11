/**
 * Clootie Rag Wager — DESIGN_IDEAS §1 mechanic.
 *
 * Sister to Reliquary (one rare landmark per run, walk-through pickup)
 * but with a twist that gives the moor a moral edge: the clootie tree
 * asks for a piece of you in exchange for a run-long boon. Walking
 * into the trunk wagers a slice of max-HP — *paid permanently for the
 * rest of the run* — and the haggis carries the boon for the rest of
 * the moor.
 *
 * The folklore is real and load-bearing. A clootie well (Scots/Gaelic
 * *cloot* "rag, cloth") is a holy spring or thorn-tree where pilgrims
 * tied a strip of cloth, dipped in the well water, to a branch as a
 * supplication for healing. The cloth represented the affliction; as
 * it weathered away on the branch, so the affliction would fade. The
 * supplicant gave something of themselves — a torn shirt-tail, a
 * ribbon — and trusted the saint or spirit to lift the burden in
 * return. Munlochy, Culloden, Avoch — wells still hung with rags
 * today.
 *
 * The mechanic preserves both halves of the bargain:
 *   - **You give something real** — max-HP, paid for the whole run.
 *   - **You receive something real** — a stat-class boon (wrath /
 *     patience / haste) that meaningfully reshapes the rest of the run.
 *
 * Distinct from sister landmarks:
 *   - Reliquary  — gift, no cost. Walk through, take the curio.
 *   - Standing Stones — trinity, you pick one of three at the moment.
 *   - Cairn      — multi-stone scheduler; collects across a run.
 *   - Clootie    — single landmark, single rolled boon, walk-through
 *                  *commits the wager* (no Y/N modal — the cost is
 *                  visible on the tree's banner before you arrive).
 *
 * The walk-through-commits decision is deliberate: a modal would turn
 * the moment from "an act of supplication you chose to make" into "a
 * GUI dialog with a confirm button". The folklore demands the former.
 * Players who don't want the trade walk around the tree.
 *
 * Pure helper — no Phaser, no scene state. Caller (clootieTree.ts)
 * supplies the run RNG + player baseline + world bounds and gets back
 * deterministic spawn second, boon roll, position, and cost. Replay-
 * deterministic per ADR-0002 Phase 3.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §22.4 (clootie wells); DESIGN_IDEAS.md §1
 * ("Clootie Rag Wager — walking through a Clootie Tree landmark =
 * sacrifice max HP for a run-long buff.").
 */
import type { Player } from './Player';
import type { RNG } from '../utils/rng';

/** The three standard boon-keys. One is rolled per run; tree displays
 *  it on its banner before the player commits. */
export type ClootieBoonId = 'wrath' | 'patience' | 'haste'
  | 'deep_wrath' | 'deep_patience' | 'deep_haste';

export interface ClootieBoon {
  readonly id: ClootieBoonId;
  readonly titleKey: string;
  readonly descKey: string;
}

/**
 * Stable order — shuffled per run via `shuffleClootieBoons(rng)`.
 * Three boons map to existing Player APIs (no new architecture):
 *   - wrath    → +25 % global damage (`addDamageMultiplier(0.25)`)
 *   - patience → +60 px pickup radius (`addPickupRadius(60)`)
 *   - haste    → −15 % weapon cooldown (`addCooldownReduction(0.15)`)
 *
 * Numbers picked for "felt as worth the trade" feel: each boon is at
 * the upper end of a level-up card (≈ peak-tier upgrade), in exchange
 * for ~12 % of run-base max-HP. The trade should reshape the run, not
 * tweak it — that's what the folklore promises.
 */
export const CLOOTIE_BOONS: readonly ClootieBoon[] = [
  {
    id: 'wrath',
    titleKey: 'ui.clootie.wrath.title',
    descKey: 'ui.clootie.wrath.desc',
  },
  {
    id: 'patience',
    titleKey: 'ui.clootie.patience.title',
    descKey: 'ui.clootie.patience.desc',
  },
  {
    id: 'haste',
    titleKey: 'ui.clootie.haste.title',
    descKey: 'ui.clootie.haste.desc',
  },
];

/**
 * Black Clootie deep boons — stronger than the standard three but cost
 * 20 % of run-base max-HP vs the standard 12 %.
 *   - deep_wrath    → +40 % global damage
 *   - deep_patience → +90 px pickup radius
 *   - deep_haste    → −22 % weapon cooldown
 */
export const DEEP_CLOOTIE_BOONS: readonly ClootieBoon[] = [
  {
    id: 'deep_wrath',
    titleKey: 'ui.clootie.deep_wrath.title',
    descKey: 'ui.clootie.deep_wrath.desc',
  },
  {
    id: 'deep_patience',
    titleKey: 'ui.clootie.deep_patience.title',
    descKey: 'ui.clootie.deep_patience.desc',
  },
  {
    id: 'deep_haste',
    titleKey: 'ui.clootie.deep_haste.title',
    descKey: 'ui.clootie.deep_haste.desc',
  },
];

/** Earliest second the clootie tree can spawn (inclusive). 4:00 — past
 *  the standing-stones trinity (5:00) so the early-run isn't a
 *  three-landmark scavenger hunt. */
export const CLOOTIE_SPAWN_MIN_SEC = 240;
/** Latest second the clootie tree can spawn (inclusive). 9:00 — sits
 *  before the reliquary's typical mid-spawn so a single run can
 *  chase both, and the wager's HP cost still matters going into the
 *  late wave-stack. */
export const CLOOTIE_SPAWN_MAX_SEC = 540;

/** Black Clootie chance — 25 % of runs, rolled at run-start. */
export const BLACK_CLOOTIE_CHANCE = 0.25;
/** Earliest second the black clootie can spawn (inclusive). 13:00 —
 *  well into the late wave-stack, past gordon's typical window. */
export const BLACK_CLOOTIE_SPAWN_MIN_SEC = 780;
/** Latest second the black clootie can spawn (inclusive). 18:00. */
export const BLACK_CLOOTIE_SPAWN_MAX_SEC = 1080;
/** Fraction of run-base max-HP the black clootie costs. Higher than
 *  the standard 12 % — the moor asks more the second time. */
export const BLACK_CLOOTIE_HP_COST_FRACTION = 0.20;
/** Floor on the black clootie cost. */
export const BLACK_CLOOTIE_HP_COST_MIN = 8;

/** Proximity threshold for committing the wager (pixels). Slightly
 *  larger than reliquary's 34 px because the tree's silhouette is
 *  taller — the trunk lives at the centre, and the player should
 *  trip on the tree, not the rags. */
export const CLOOTIE_PICK_RADIUS_PX = 36;

/** Minimum distance from the player when choosing a spawn position. */
export const CLOOTIE_MIN_SPAWN_DIST_PX = 380;
/** Maximum distance from the player when choosing a spawn position.
 *  Tighter than reliquary's 620 — the wager is a cost-bearing offer,
 *  so it should land more visibly in the player's path rather than
 *  being a deep detour. */
export const CLOOTIE_MAX_SPAWN_DIST_PX = 600;
/** Keep at least this margin from world edges so the sprite is reachable. */
export const CLOOTIE_EDGE_MARGIN_PX = 140;

/** Fraction of run-base max-HP the wager costs. 12 % gives a visible
 *  bite without being a death sentence — at 100 HP base the cost is
 *  12, leaving 88; iron-belly variants pay more in absolute terms but
 *  still keep the same proportional weight. */
export const CLOOTIE_HP_COST_FRACTION = 0.12;
/** Floor on the cost, so very-low-HP variants still feel the trade.
 *  Without this, a 30-HP variant would only pay 3 — invisible. */
export const CLOOTIE_HP_COST_MIN = 5;

/**
 * Roll the run's spawn second. Range [240, 540] sits between the
 * standing-stones trinity (5:00) and the reliquary's mid-window
 * (6:00–12:00) so a single run can route to all three landmarks
 * without them stacking on the same minute.
 */
export function chooseClootieSpawnSec(rng: RNG): number {
  return rng.int(CLOOTIE_SPAWN_MIN_SEC, CLOOTIE_SPAWN_MAX_SEC);
}

/**
 * Pick the first boon of a seeded shuffle. Pure; same seed + same
 * call order = same boon, so replay playback matches live.
 */
export function chooseClootieBoon(rng: RNG): ClootieBoon {
  return shuffleClootieBoons(rng)[0];
}

/** Fisher-Yates shuffle over the boon list, driven by the supplied RNG. */
export function shuffleClootieBoons(rng: RNG): ClootieBoon[] {
  const a = CLOOTIE_BOONS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose a clootie tree position off the player's current line.
 * Same shape as `computeReliquaryPlacement` — sample angle + radius
 * from the RNG, clamp to world margins. A clamped spawn near the
 * player is still better than a tree stuck in the world wall.
 */
export function computeClootiePlacement(
  rng: RNG,
  playerX: number,
  playerY: number,
  worldWidth: number,
  worldHeight: number,
): { x: number; y: number } {
  const angle = rng.float(0, Math.PI * 2);
  const dist = rng.float(CLOOTIE_MIN_SPAWN_DIST_PX, CLOOTIE_MAX_SPAWN_DIST_PX);
  const rawX = playerX + Math.cos(angle) * dist;
  const rawY = playerY + Math.sin(angle) * dist;
  const minX = CLOOTIE_EDGE_MARGIN_PX;
  const maxX = worldWidth - CLOOTIE_EDGE_MARGIN_PX;
  const minY = CLOOTIE_EDGE_MARGIN_PX;
  const maxY = worldHeight - CLOOTIE_EDGE_MARGIN_PX;
  return {
    x: Math.max(minX, Math.min(maxX, rawX)),
    y: Math.max(minY, Math.min(maxY, rawY)),
  };
}

/**
 * Compute the integer HP cost from the run-base max-HP. Floor of the
 * fractional product, with a minimum so very-low-HP variants still
 * feel the trade. Pure — same input, same output; no RNG.
 *
 * Optional `fraction` / `min` overrides let the black clootie use a
 * steeper cost without duplicating this function.
 */
export function computeWagerHpCost(
  runBaseMaxHp: number,
  fraction = CLOOTIE_HP_COST_FRACTION,
  min = CLOOTIE_HP_COST_MIN,
): number {
  if (runBaseMaxHp <= 0) return min;
  return Math.max(min, Math.floor(runBaseMaxHp * fraction));
}

/**
 * Apply a boon's stat effect to the player via existing Player APIs.
 * Mirrors `applyReliquaryCurio` and `applyStoneBoon` — switch on the
 * id, call the matching add* method. No new Player surface needed.
 */
export function applyClootieBoon(player: Player, boon: ClootieBoon): void {
  switch (boon.id) {
    case 'wrath':
      player.addDamageMultiplier(0.25);
      break;
    case 'patience':
      player.addPickupRadius(60);
      break;
    case 'haste':
      player.addCooldownReduction(0.15);
      break;
    case 'deep_wrath':
      player.addDamageMultiplier(0.40);
      break;
    case 'deep_patience':
      player.addPickupRadius(90);
      break;
    case 'deep_haste':
      player.addCooldownReduction(0.22);
      break;
  }
}

/** Fisher-Yates shuffle over the deep boon list, driven by the supplied RNG. */
export function shuffleDeepClootieBoons(rng: RNG): ClootieBoon[] {
  const a = DEEP_CLOOTIE_BOONS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Pick the first deep boon of a seeded shuffle. Replay-deterministic. */
export function chooseDeepClootieBoon(rng: RNG): ClootieBoon {
  return shuffleDeepClootieBoons(rng)[0]!;
}

/**
 * Roll whether the black clootie tree should spawn this run. Consumes
 * one RNG token — must be called at a fixed position in the run-start
 * stream (after `chooseClootieSpawnSec`) for replay determinism.
 */
export function shouldSpawnBlackClootie(rng: RNG): boolean {
  return rng.float(0, 1) < BLACK_CLOOTIE_CHANCE;
}

/**
 * Roll the black clootie's spawn second. Only called when
 * `shouldSpawnBlackClootie` returned true. Range [13:00, 18:00].
 */
export function chooseBlackClootieSpawnSec(rng: RNG): number {
  return rng.int(BLACK_CLOOTIE_SPAWN_MIN_SEC, BLACK_CLOOTIE_SPAWN_MAX_SEC);
}

