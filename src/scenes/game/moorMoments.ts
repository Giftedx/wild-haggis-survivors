/**
 * Moor moments — once-per-run spawn helpers for the Moor Road act:
 * mercy-luck grant, ancestral echo, standing stones trinity, reliquary,
 * run-identity toast.
 *
 * Phase 5 Bucket 3 of the codebase restructure plan
 * (`docs/superpowers/plans/2026-04-30-codebase-restructure.md`). Each
 * function used to live as a private method on GameScene; the audit
 * (`docs/superpowers/specs/2026-04-30-gamescene-regrowth-audit.md`,
 * lines 78–80) called for extraction here.
 *
 * Pure named functions — caller (GameScene) holds the spawned entity
 * refs (echo / stones / reliquary) so the existing tick / minimap-marker
 * / destroy paths in `GameScene.update` and `resetTransientRunState`
 * stay untouched. Mercy-luck flag is a small state object the caller
 * resets each run.
 *
 * Determinism: `spawnStandingStones` and `spawnReliquary` consume
 * `runRng` exactly as the inlined methods did — replay parity per
 * ADR-0002 Phase 3.
 */
import type Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { RNG } from '../../utils/rng';
import type { RunScoreState } from './RunScoreState';
import type { VariantDef } from '../../data/variants';
import { GAME } from '../../config';
import { BALANCE } from '../../core/BalanceConfig';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import {
  loadSave,
  isLastDeathFresh,
  consumeLastDeath,
  bumpAncestralEchoesTouched,
  bumpStandingStonePick,
  bumpReliquaryCurioPick,
  bumpItemAcquired,
  bumpClootieWagerCommit,
} from '../../utils/save';
import {
  AncestralEcho,
  ECHO_GOLD_REWARD,
  ECHO_HEAL_REWARD,
} from './ancestralEcho';
import { StandingStones, type StoneBoon } from './standingStones';
import { Reliquary, type ReliquaryCurio } from './reliquary';
import { ClootieTree } from './clootieTree';
import {
  type ClootieBoon,
  BLACK_CLOOTIE_HP_COST_FRACTION,
  BLACK_CLOOTIE_HP_COST_MIN,
  chooseDeepClootieBoon,
} from '../../entities/clootieRagWager';
import { crossesMoorMercyHpFrac } from './moorMercyTrigger';
import { formatRunIdentityToast } from './runIdentityToast';

/** Mutable state held by the caller, reset per run. */
export interface MoorMomentsState {
  mercyLuckGranted: boolean;
}

export function createMoorMomentsState(): MoorMomentsState {
  return { mercyLuckGranted: false };
}

/** Read-only seam onto GameScene fields the helpers depend on. */
export interface MoorMomentsContext {
  scene: Phaser.Scene;
  player: Player;
  juice: JuiceSystem;
  banter: BanterSystem | null;
  tutorialSystem: TutorialSystem | null;
  runRng: RNG;
  runScore: RunScoreState;
  activeVariant: VariantDef;
  discoveryRunId: () => string;
  caption: (id: string, message: string, tint?: string, durationMs?: number) => void;
  /**
   * The Moor Remembers — optional handoff. Fired when the 30 s
   * AncestralEcho ghost expires WITHOUT being touched, so the caller
   * can register the just-settled ghost with the live
   * `CairnOfEchoesScheduler` (the cairn record itself was already
   * persisted at death time; this hook only lights up the in-scene
   * sprite for the rest of this run). `x` / `y` are the death-spot
   * the echo lived at. Absent for runs without the scheduler wired.
   */
  onEchoSettle?: (x: number, y: number) => void;
}

/**
 * Mercy-luck grant: when the player's HP crosses the configured fraction
 * of max for the first time on the moor, award a flat luck-draw bonus
 * and surface the toast / caption. One-shot via `state.mercyLuckGranted`.
 */
export function tryMoorMercyLuck(
  state: MoorMomentsState,
  ctx: MoorMomentsContext,
  hpBefore: number,
): void {
  if (state.mercyLuckGranted) return;
  const hpAfter = ctx.player.getHp();
  const maxHp = ctx.player.getMaxHp();
  const th = BALANCE.player.moorMercyHpFrac;
  if (!crossesMoorMercyHpFrac(hpBefore, hpAfter, maxHp, th)) return;
  state.mercyLuckGranted = true;
  ctx.player.addLuckDrawBonus(BALANCE.player.moorMercyLuckBonus);
  ctx.juice.showToast(t('ui.game.moor_mercy_luck'), '#c8a8e8');
  ctx.caption('moor_mercy', t('ui.game.moor_mercy_luck_caption'), '#c8a8e8', 4200);
}

/**
 * Ancestral Echo — if the previous run died recently (within TTL),
 * spawn a spectral haggis at that death spot. Touch grants a small
 * pity reward (gold + heal + toast). Returns the spawned echo so the
 * caller can store + tick / destroy it; null if no fresh death exists
 * or save read fails.
 *
 * `alreadySpawned` short-circuits when the caller already owns one
 * (matches the original `if (this.ancestralEcho) return;` guard).
 */
export function trySpawnAncestralEcho(
  ctx: MoorMomentsContext,
  alreadySpawned: boolean,
): AncestralEcho | null {
  if (alreadySpawned) return null;
  try {
    const save = loadSave();
    if (!save.lastDeath || !isLastDeathFresh(save.lastDeath)) return null;
    const echoX = save.lastDeath.x;
    const echoY = save.lastDeath.y;
    const echo = new AncestralEcho({
      scene: ctx.scene,
      player: ctx.player,
      textureKey: ctx.activeVariant.textureKey,
      echoX,
      echoY,
      onTouch: () => {
        ctx.runScore.addBossGold(ECHO_GOLD_REWARD);
        ctx.player.heal(ECHO_HEAL_REWARD);
        ctx.juice.showToast(t('ui.ancestralEcho.touch_toast'), '#b0d4ff');
        ctx.caption('ancestral_echo_touch', t('ui.ancestralEcho.touch_caption'), '#b0d4ff', 3000);
        audio.playEchoTouch();
        bumpAncestralEchoesTouched();
        // B1 Phase 4 Task 22 — "John Anderson My Jo" sub-pool. Echo touch
        // is naturally once-per-run (consumeLastDeath + caller's null
        // guard), so no extra throttle needed.
        ctx.banter?.request('burns_citation', { tag: 'lineage_moment' });
      },
      // The Moor Remembers (spec 2026-05-22) — when the 30 s ghost
      // expires without being touched, the prior death's cairn record
      // (already persisted on death) materialises in the live
      // scheduler so the player sees the candle settle into stone for
      // the rest of this run. No-op when the caller didn't wire the
      // hook (older scenes / tests that pre-date the scheduler).
      onSettle: ctx.onEchoSettle ? () => ctx.onEchoSettle!(echoX, echoY) : undefined,
    });
    echo.spawn();
    ctx.juice.showToast(t('ui.ancestralEcho.announce_toast'), '#b0d4ff');
    ctx.caption('ancestral_echo_announce', t('ui.ancestralEcho.announce_caption'), '#b0d4ff', 3500);
    ctx.tutorialSystem?.notifyAncestralEchoIfFirst();
    // Consume the echo so it doesn't re-spawn every run. Fresh death on
    // this run will write a new one via RunLifecycle.
    consumeLastDeath();
    return echo;
  } catch {
    return null;
  }
}

/**
 * Standing Stones — spawn the 5:00 trinity. First approach within
 * pick-radius wins its boon, the other two crumble. Returns the
 * spawned entity so the caller can tick / destroy it.
 */
export function spawnStandingStones(ctx: MoorMomentsContext): StandingStones {
  const stones = new StandingStones({
    scene: ctx.scene,
    player: ctx.player,
    rng: ctx.runRng,
    onPick: (boon: StoneBoon) => {
      const title = t(boon.titleKey);
      ctx.juice.showToast(t('ui.standingStones.grant_toast', { title }), '#ffe080');
      ctx.caption('standing_stones_pick', t(boon.descKey), '#ffe080', 3500);
      audio.playStoneGrant();
      bumpStandingStonePick(boon.id);
    },
  });
  stones.spawn();
  ctx.juice.showToast(t('ui.standingStones.announce_toast'), '#ffe080');
  ctx.caption('standing_stones_announce', t('ui.standingStones.announce_caption'), '#ffe080', 3000);
  ctx.tutorialSystem?.notifyStandingStonesIfFirst();
  return stones;
}

/**
 * Reliquary — single off-path relic. Grants a run-scoped curio when
 * the player walks into it. No pre-warning, no crumble — finding it
 * is itself the reward, so the announcement stays tight.
 */
export function spawnReliquary(ctx: MoorMomentsContext): Reliquary {
  const reliquary = new Reliquary({
    scene: ctx.scene,
    player: ctx.player,
    rng: ctx.runRng,
    worldWidth: GAME.WORLD_WIDTH,
    worldHeight: GAME.WORLD_HEIGHT,
    onPick: (curio: ReliquaryCurio) => {
      const title = t(curio.titleKey);
      const desc = t(curio.descKey);
      ctx.juice.showToast(t('ui.reliquary.grant_toast', { title }), '#ffb060');
      ctx.caption('reliquary_pick', t('ui.reliquary.grant_caption', { desc }), '#ffb060', 3500);
      audio.playStoneGrant();
      // bumpReliquaryCurioPick returns the pre-bump TOTAL across all
      // curios — pre-bump 0 routes the first curio ever to a wonder
      // sub-pool, subsequent picks to the generic reliquary_pick pool.
      // Sister to clootie/beithir/cairn first-time routing (v22 cohort).
      const beforeTotal = bumpReliquaryCurioPick(curio.id);
      // C1 M3 Task 16 — also persist into the DiscoveryLog so the
      // Almanac's Finds book lights up the relic entry. Lifetime
      // counter (`bumpReliquaryCurioPick`) and discovery counter are
      // kept distinct: the lifetime counter powers the
      // `ach_relic_seeker` deed, the discovery log feeds Finds.
      bumpItemAcquired(curio.id, ctx.discoveryRunId(), Date.now());
      const tag = beforeTotal === 0 ? 'first_curio' : undefined;
      ctx.banter?.request('reliquary_pick', tag !== undefined ? { tag } : undefined);
    },
  });
  reliquary.spawn();
  return reliquary;
}

/**
 * Clootie Tree — single sacred-supplication landmark per run. Walking
 * into the trunk wagers a slice of max-HP for a single rolled boon
 * (wrath / patience / haste). Cost is visible above the tree from the
 * moment it spawns; walking around it is the "decline" path.
 *
 * Mirrors `spawnReliquary` but distinct: where the reliquary is a
 * gift, the clootie tree is a *trade*. Save bumps land in a new
 * `bumpClootieWagerCommit` slot once the save schema is bumped to
 * track it; v1 ships the gameplay loop without the deed counter.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §22.4 (clootie wells); DESIGN_IDEAS.md §1.
 */
export function spawnClootieTree(ctx: MoorMomentsContext): ClootieTree {
  const tree = new ClootieTree({
    scene: ctx.scene,
    player: ctx.player,
    rng: ctx.runRng,
    worldWidth: GAME.WORLD_WIDTH,
    worldHeight: GAME.WORLD_HEIGHT,
    runBaseMaxHp: ctx.player.getRunBaseMaxHp(),
    onPick: (boon: ClootieBoon, hpCost: number) => {
      const title = t(boon.titleKey);
      const desc = t(boon.descKey);
      ctx.juice.showToast(
        t('ui.clootie.commit_toast', { title, cost: String(hpCost) }),
        '#cfd0a8',
      );
      ctx.caption('clootie_commit', desc, '#cfd0a8', 3500);
      // Bespoke clootie SFX — a low triangle drone (bough leaning)
      // under a soft cloth-rustle and a warm mid bell that folds
      // into the drone tail. Sister to playStoneGrant but distinct
      // shape: the stones rise (triadic blessing), the clootie folds
      // in (intimate trade). v2 followup #3 (DESIGN_IDEAS §1).
      audio.playClootieBound();
      // Lifetime counter routes the first wager ever to bound_first
      // (folkloric supplication wonder) and subsequent commits to the
      // existing bound pool (familiar trade). Pre-bump 0 = first
      // ever; bumper persists to v21 save. Sister to beithir cure
      // routing pattern.
      const beforeCount = bumpClootieWagerCommit();
      const tag = beforeCount === 0 ? 'bound_first' : 'bound';
      ctx.banter?.request('clootie_wager', { tag });
    },
  });
  tree.spawn();
  ctx.juice.showToast(t('ui.clootie.announce_toast'), '#cfd0a8');
  ctx.caption('clootie_announce', t('ui.clootie.announce_caption'), '#cfd0a8', 3000);
  return tree;
}

/**
 * Black Clootie — rare second wager (25 % of runs, late-game window).
 * Darker visual, deeper boons (40 %/90 px/22 % vs 25 %/60 px/15 %),
 * steeper HP cost (20 % of run-base max vs 12 %). Same ClootieTree
 * class; overrides injected via optional hooks.
 *
 * Announces with a distinct colour (#b0a0b8 muted lavender) and a
 * separate i18n key so the toast reads as a different event.
 */
export function spawnBlackClootieTree(ctx: MoorMomentsContext): ClootieTree {
  const tree = new ClootieTree({
    scene: ctx.scene,
    player: ctx.player,
    rng: ctx.runRng,
    worldWidth: GAME.WORLD_WIDTH,
    worldHeight: GAME.WORLD_HEIGHT,
    runBaseMaxHp: ctx.player.getRunBaseMaxHp(),
    chooseBoon: chooseDeepClootieBoon,
    hpCostFraction: BLACK_CLOOTIE_HP_COST_FRACTION,
    hpCostMin: BLACK_CLOOTIE_HP_COST_MIN,
    glowTint: 0x6a3050,
    spriteTint: 0x9a6880,
    onPick: (boon: ClootieBoon, hpCost: number) => {
      const title = t(boon.titleKey);
      const desc = t(boon.descKey);
      ctx.juice.showToast(
        t('ui.clootie.second_commit_toast', { title, cost: String(hpCost) }),
        '#b0a0b8',
      );
      ctx.caption('black_clootie_commit', desc, '#b0a0b8', 3500);
      audio.playClootieBound();
      const beforeCount = bumpClootieWagerCommit();
      const tag = beforeCount === 0 ? 'bound_first' : 'bound';
      ctx.banter?.request('clootie_wager', { tag });
    },
  });
  tree.spawn();
  ctx.juice.showToast(t('ui.clootie.second_announce_toast'), '#b0a0b8');
  ctx.caption('black_clootie_announce', t('ui.clootie.second_announce_caption'), '#b0a0b8', 3000);
  return tree;
}

/**
 * Run-identity toast — surface the active variant's name + flavor at
 * run start (or resume). Branching i18n + truncation lives in
 * `runIdentityToast.formatRunIdentityToast`.
 */
export function showRunIdentityToast(ctx: MoorMomentsContext, isResume: boolean): void {
  const v = ctx.activeVariant;
  ctx.juice.showToast(
    formatRunIdentityToast(isResume, t(v.nameKey), t(v.flavorKey)),
    '#c8dcff',
  );
}
