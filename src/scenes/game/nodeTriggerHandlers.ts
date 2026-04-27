/**
 * T401 slice 8 — Node-trigger handlers for GameScene.
 *
 * Pulls the per-type node-trigger handler set
 * (`handleNodeTriggered` + `applyEncounterNode` / `applyEliteNode` /
 * `applyRestNode` / `applyHiddenNode` + `enterInteractivePrompt` /
 * `exitInteractivePrompt` + `openShrineNode` / `applyShrineBoon` /
 * `showShrineTimedToast` + `openTraderNode` / `applyTraderRelic` /
 * `grantTraderPassive` + `openBargainNode` / `applyBargainOffer`)
 * out of `src/scenes/GameScene.ts` into a single Phaser-import-free
 * dispatch coordinator.
 *
 * Why extract: the trigger handler set was the largest cohesive cluster
 * remaining inside GameScene after slice 7. ~470 lines of pure
 * "node.type → resolver → side-effect" mapping with no scene
 * orchestration concerns beyond the deps it pulls. Slice 7 lifted the
 * node-map LIFECYCLE (install + teardown). Slice 8 lifts WHAT HAPPENS
 * when a node fires.
 *
 * Why one helper instead of per-type files: the seven node types share
 * the same callback contract (`finalizeNodeVisit` / `peekReplayChoiceFor` /
 * `enterInteractivePrompt` bracket), and the three interactive types
 * (shrine / wee_trader / bargain) share the replay-equivalence pattern
 * (live path and replay path run the same `applyXxx` body so `runRng`
 * consumption stays deterministic). Splitting per type would multiply
 * the deps-object boilerplate without separating any concerns. Single
 * helper, dispatcher at the top, per-type private functions below.
 *
 * Why callback for `finalizeNodeVisit` instead of inlining the helper
 * call here: `finalizeNodeVisitHelper` reads `nodeMapSystem`,
 * `runActState`, `replayRecorder`, `replayInput`, and `clock` (a 5-dep
 * surface this slice does not otherwise need). Closing those over a
 * callback at the GameScene call-site keeps the slice 8 deps interface
 * narrower and more focused on per-handler concerns. Same logic applies
 * to `peekReplayChoiceFor` — passed as a callback so slice 8 stays
 * decoupled from `replayInput`'s outcome-stream shape.
 *
 * Why setter callback for `interactivePromptIndex`: same reason as
 * slice 6's setter pattern. The field lives on GameScene, gets read at
 * the install-time gate inside `installNodeMap` (`if
 * (this.interactivePromptIndex >= 0) return`), and gets written by
 * enter/exit-prompt brackets inside this helper. A setter callback
 * keeps the helper from holding a `this` reference back to the scene
 * AND keeps the gate's read at the install layer (where it belongs)
 * rather than coupling slice 7 to slice 8.
 *
 * No Phaser imports — vitest under node-env breaks on Phaser eval (see
 * CLAUDE.md gotchas). All deps are typed via structural-type imports
 * (no value imports of Phaser-touching modules).
 *
 * Replay-determinism contract (CLAUDE.md "Arcade fixed-step T1 replay
 * contract"): each interactive handler MUST run the same RNG-consuming
 * apply path on the replay branch as on the live branch.
 *   - shrine `applyShrineBoon` consumes `runRng` for `buff_luck` (relic
 *     roll) — replay calls `applyShrineBoon` for any non-`refused`
 *     choice so the consumption stays in sync.
 *   - wee_trader `applyTraderRelic` consumes `runRng` for the relic roll
 *     — replay calls it on the recorded `relic` choice.
 *   - bargain `applyBargainOffer` consumes `runRng` for the relic roll
 *     when `offerKind === 'relic'` — replay calls it on the recorded
 *     `accept` choice.
 * Tests pin this with paired live/replay paths and an RNG-consumption
 * spy.
 *
 * Scene reuse contract (CLAUDE.md "Scene reuse"): handlers hold no
 * module-level state. Every dispatch builds a fresh deps object at the
 * call site (cheap — runs at most every few player seconds), so a
 * recycled scene instance always sees current refs.
 */
import type { NodeDef } from '../../data/nodeTypes';
import type { NodeMapState } from '../../systems/NodeMapSystem';
import type { NodeWaveMember, NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';
import type { Enemy } from '../../entities/Enemy';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { NodePromptUI } from '../../ui/NodePromptUI';
import type { RelicSystem } from '../../systems/RelicSystem';
import type { RelicPickupSpawner } from '../../entities/RelicPickup';
import type { TempBuffBag } from '../../systems/TempBuffBag';
import type { LevelUpFlow } from './LevelUpFlow';
import type { RunScoreState } from './RunScoreState';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RNG } from '../../utils/rng';
import { resolveEncounterEvent } from '../../systems/nodeEvents/encounterEvent';
import { resolveEliteEvent } from '../../systems/nodeEvents/eliteEvent';
import { resolveRestEvent } from '../../systems/nodeEvents/restEvent';
import { resolveHiddenEvent } from '../../systems/nodeEvents/hiddenEvent';
import { resolveShrineEvent } from '../../systems/nodeEvents/shrineEvent';
import { resolveWeeTraderEvent } from '../../systems/nodeEvents/weeTraderEvent';
import { resolveBargainEvent } from '../../systems/nodeEvents/bargainEvent';
import { rollRandomUnheldPassive } from '../../data/upgrades';
import { applyShrineBuff, isRegisteredShrineBuffKey } from '../../systems/shrineBuffRegistry';
import { shrineLabelFromKey, bargainLabelFromOfferKey } from './nodeEventLabels';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { t } from '../../core/i18n';

/**
 * Adapter contract a spawned `Enemy` must satisfy to participate in a
 * `NodeWaveTracker` wave. Mirrors the inline `buildEnemyWaveMember`
 * helper inside GameScene — kept here so the handler module is
 * self-contained and the test does not have to reach into the scene
 * file for this builder.
 */
function buildEnemyWaveMember(enemy: Enemy): NodeWaveMember {
  return {
    get x() { return enemy.x; },
    get y() { return enemy.y; },
    isAliveForWave(tag: string) {
      return enemy.active && enemy.nodeWaveTag === tag;
    },
  };
}

/**
 * Inputs to {@link dispatchNodeTrigger}. The deps surface is wide
 * because the seven node-types touch a wide swath of run state — this
 * is intentional. Each ref has a single, focused job inside the
 * handlers; the breadth reflects the breadth of the player's
 * decisions at a node, not coupling.
 */
export interface NodeTriggerHandlerDeps {
  /* — Combat state — */
  player: Player;
  runRng: RNG;
  runScore: RunScoreState;
  runModifiers: RunModifiers;
  tempBuffBag: TempBuffBag;
  ownedPassives: string[];

  /* — Systems — */
  nodeWaveTracker: NodeWaveTracker;
  spawnSystem: SpawnSystem;
  relicSystem: RelicSystem;
  relicPickupSpawner: RelicPickupSpawner | null;
  weaponSystem: WeaponSystem;
  xpSystem: XPSystem | undefined;
  upgradeUI: UpgradeCardsUI | null;
  levelUpFlow: LevelUpFlow;
  juice: JuiceSystem;
  timeManager: TimeManager;
  nodePromptUI: NodePromptUI | null;

  /* — Replay + closure-back — */
  /**
   * Returns the recorded `chosenRewardKey` for `nodeKey` when in
   * playback mode AND the next outcome matches; null otherwise. Slice
   * 8 closes over `replayInput` via this callback rather than holding
   * a direct ref.
   */
  peekReplayChoiceFor: (nodeKey: string) => string | null;
  /**
   * Setter for `GameScene.interactivePromptIndex`. The field lives on
   * the scene because `installNodeMap`'s trigger gate reads it; this
   * callback lets the slice 8 enter/exit-prompt bracket WRITE it
   * without holding a back-ref to the scene.
   */
  setInteractivePromptIndex: (next: number) => void;
  /**
   * Mark the node visited + walk the cursor + record the outcome. The
   * underlying helper (`finalizeNodeVisitHelper` in
   * `nodeVisitFinalizer.ts`) reads run-state refs slice 8 does not
   * otherwise touch (nodeMapSystem / runActState / replayRecorder /
   * replayInput / clock); closing those over a callback keeps the
   * slice 8 deps interface focused.
   */
  finalizeNodeVisit: (index: number, nodeKey: string, chosenRewardKey?: string) => void;
}

/**
 * Dispatch a node trigger to the right per-type handler. The
 * `installNodeMap` callback in GameScene's `create()` filters out
 * already-visited nodes and the active-prompt re-entrancy case BEFORE
 * calling this entry point; slice 8 trusts those gates and dispatches
 * straight to the typed handler.
 */
export function dispatchNodeTrigger(
  deps: NodeTriggerHandlerDeps,
  node: NodeDef,
  index: number,
  state: NodeMapState,
): void {
  switch (node.type) {
    case 'encounter':
      applyEncounterNode(deps, node, index, state);
      break;
    case 'elite':
      applyEliteNode(deps, node, index, state);
      break;
    case 'rest':
      applyRestNode(deps, node, index);
      break;
    case 'hidden':
      applyHiddenNode(deps, node, index, state);
      break;
    case 'shrine':
      openShrineNode(deps, node, index);
      break;
    case 'wee_trader':
      openTraderNode(deps, node, index, state);
      break;
    case 'bargain':
      openBargainNode(deps, node, index);
      break;
  }
}

/**
 * Encounter node (M1 F1) — spawn the declared enemy mix with a wave
 * tag, then defer finalize until every spawned enemy dies. Each
 * `forceSpawn` call returns the acquired Enemy; it's wrapped as a
 * NodeWaveMember whose `isAliveForWave(tag)` gate keys off the
 * scene-visible `Enemy.active` + `Enemy.nodeWaveTag`. Pool re-acquire
 * nulls the tag in `Enemy.spawn()`, so a stale reference reads as
 * "not alive for this wave" even if the pool recycles the object.
 *
 * Empty `enemyMix` (should not happen in authored data, but resolver
 * contract allows it) falls through the tracker's zero-member path and
 * finalizes synchronously.
 */
function applyEncounterNode(
  deps: NodeTriggerHandlerDeps,
  node: NodeDef,
  index: number,
  state: NodeMapState,
): void {
  const spec = resolveEncounterEvent(node);
  const spawnPos = state.worldPositions[index];
  deps.nodeWaveTracker.register(
    index,
    node.key,
    'encounter',
    (tag) => {
      const members: NodeWaveMember[] = [];
      for (const entry of spec.enemyMix) {
        for (let i = 0; i < entry.count; i++) {
          const enemy = deps.spawnSystem.forceSpawn(entry.key, { waveTag: tag });
          if (enemy) members.push(buildEnemyWaveMember(enemy));
        }
      }
      return members;
    },
    () => {
      deps.finalizeNodeVisit(index, node.key);
    },
    { x: spawnPos.x, y: spawnPos.y },
  );
}

/**
 * Elite node (M1 F2) — force-spawn the declared elite with a wave
 * tag; defer finalize AND the guaranteed relic drop until the elite
 * dies. Relic drops at the kill position (centroid from the tracker's
 * last tick while alive) so the reward reads as earned rather than
 * as a free pickup at the node pip. Drop roll is rolled on death so
 * `runRng` consumption stays deterministic (same seed → same relic).
 *
 * If the pool is saturated and `forceSpawn` returns null, the wave has
 * zero members and finalizes synchronously via the zero-member path
 * (the relic drop still fires at the node position).
 */
function applyEliteNode(
  deps: NodeTriggerHandlerDeps,
  node: NodeDef,
  index: number,
  state: NodeMapState,
): void {
  const spec = resolveEliteEvent(node);
  const spawnPos = state.worldPositions[index];
  deps.nodeWaveTracker.register(
    index,
    node.key,
    'elite',
    (tag) => {
      const enemy = deps.spawnSystem.forceSpawn(spec.enemyKey, { elite: true, waveTag: tag });
      return enemy ? [buildEnemyWaveMember(enemy)] : [];
    },
    (killPos) => {
      if (spec.guaranteedRelic && deps.relicPickupSpawner) {
        const relic = deps.relicSystem.rollDrop('elite', deps.runRng, { luckMultiplier: 2 });
        if (relic) {
          deps.relicPickupSpawner.spawn(relic, killPos.x, killPos.y, 'elite');
        }
      }
      deps.finalizeNodeVisit(index, node.key);
    },
    { x: spawnPos.x, y: spawnPos.y },
  );
}

/**
 * Rest node — heal + grant a reroll token. Toast carries the flavour
 * line (full i18n copy lands in M5).
 */
function applyRestNode(deps: NodeTriggerHandlerDeps, node: NodeDef, index: number): void {
  const spec = resolveRestEvent(node);
  const heal = Math.max(1, Math.ceil(deps.player.getMaxHp() * spec.healRatio));
  deps.player.heal(heal);
  for (let i = 0; i < spec.rerollTokens; i++) {
    deps.upgradeUI?.grantReroll();
  }
  deps.juice.showToast(t('nodes.ui.toast.rest'), TOAST_COLORS.reward);
  deps.finalizeNodeVisit(index, node.key);
}

/**
 * Hidden node — roll reward. 'relic' spawns a relic pickup at the
 * node position; 'lore_fragment' surfaces a toast. Relic falls back
 * to a lore toast if every relic is already held.
 */
function applyHiddenNode(
  deps: NodeTriggerHandlerDeps,
  node: NodeDef,
  index: number,
  state: NodeMapState,
): void {
  const spec = resolveHiddenEvent(node, deps.runRng);
  if (spec.kind === 'relic' && deps.relicPickupSpawner) {
    const relic = deps.relicSystem.rollDrop('hidden_node', deps.runRng);
    if (relic) {
      const pos = state.worldPositions[index];
      deps.relicPickupSpawner.spawn(relic, pos.x, pos.y, 'hidden_node');
      deps.finalizeNodeVisit(index, node.key, 'relic');
      return;
    }
  }
  deps.juice.showToast(t('nodes.ui.toast.hidden_empty'), TOAST_COLORS.reward);
  deps.finalizeNodeVisit(index, node.key, 'lore_fragment');
}

/** Open/close pause bracket for interactive node prompts. */
function enterInteractivePrompt(deps: NodeTriggerHandlerDeps, index: number): void {
  deps.setInteractivePromptIndex(index);
  deps.timeManager.request('NODE_PROMPT', { pausePhysics: true, timeScale: 0 });
}

function exitInteractivePrompt(
  deps: NodeTriggerHandlerDeps,
  index: number,
  nodeKey: string,
  chosenRewardKey: string | null,
): void {
  deps.timeManager.release('NODE_PROMPT');
  deps.setInteractivePromptIndex(-1);
  deps.finalizeNodeVisit(index, nodeKey, chosenRewardKey ?? undefined);
}

/**
 * Shrine node — prompt with 3 buff candidates. Combat-buff keys
 * (damage / speed / armor / crit / pickup) route through `TempBuffBag`
 * with the resolver's `durationMs`; gold / xp / luck stay immediate.
 */
function openShrineNode(deps: NodeTriggerHandlerDeps, node: NodeDef, index: number): void {
  const spec = resolveShrineEvent(node, deps.runRng);
  if (spec.candidates.length === 0) {
    deps.finalizeNodeVisit(index, node.key, 'empty_pool');
    return;
  }
  // M1 F5 — playback auto-applies the recorded boon pick instead of
  // re-opening the modal. `applyShrineBoon` consumes runRng for
  // `buff_luck`, so skipping it in replay would desync future rolls —
  // we run the same apply path here.
  const replayChoice = deps.peekReplayChoiceFor(node.key);
  if (replayChoice !== null) {
    if (replayChoice !== 'refused') applyShrineBoon(deps, replayChoice, spec.durationMs);
    deps.finalizeNodeVisit(index, node.key, replayChoice);
    return;
  }
  enterInteractivePrompt(deps, index);
  deps.nodePromptUI?.show({
    title: t('nodes.ui.shrine_title'),
    body: t('nodes.ui.shrine_body'),
    options: spec.candidates.map((c) => ({
      key: c.key,
      label: shrineLabelFromKey(c.key),
    })),
    allowSkip: true,
    onResolve: (chosenKey) => {
      if (chosenKey) applyShrineBoon(deps, chosenKey, spec.durationMs);
      exitInteractivePrompt(deps, index, node.key, chosenKey ?? 'refused');
    },
  });
}

/**
 * Apply a shrine boon. M1 F4 — combat buffs (damage / speed / armor /
 * crit / pickup) route through `TempBuffBag` via the shrine-buff
 * registry (single applyShrineBuff entry point so the deltas stay in
 * one place AND the bag's snapshot stays JSON-serialisable for resume
 * — T101 follow-up). Gold / xp / luck stay immediate, and unsupported
 * keys (regen / reflect / dodge — missing revertible stat hooks) fall
 * back to the pre-F4 20% heal stand-in so the pick always delivers
 * something.
 */
function applyShrineBoon(deps: NodeTriggerHandlerDeps, key: string, durationMs: number): void {
  if (isRegisteredShrineBuffKey(key)) {
    applyShrineBuff(deps.tempBuffBag, key, durationMs, { player: deps.player });
    showShrineTimedToast(deps, key, durationMs);
    return;
  }
  switch (key) {
    case 'buff_regen':
    case 'buff_reflect':
    case 'buff_dodge': {
      // Missing revertible hooks (addHpRegen is capped, setThorns is
      // non-additive, no dodge stat). Ship the 20% heal stand-in until
      // the stat API grows — documented as a known F4 gap.
      const heal = Math.max(1, Math.ceil(deps.player.getMaxHp() * 0.2));
      deps.player.heal(heal);
      deps.juice.showToast(t('nodes.ui.toast.shrine_boon', { label: shrineLabelFromKey(key) }), TOAST_COLORS.reward);
      break;
    }
    case 'buff_gold': {
      deps.runScore.addCoinGold(50);
      deps.juice.showToast(t('nodes.ui.toast.shrine_gold'), TOAST_COLORS.reward);
      break;
    }
    case 'buff_xp': {
      deps.xpSystem?.spawnGem(deps.player.x, deps.player.y, 25);
      deps.juice.showToast(t('nodes.ui.toast.shrine_xp'), TOAST_COLORS.reward);
      break;
    }
    case 'buff_luck': {
      // v1: drop a rare relic right there, treated as "lucky pick".
      if (deps.relicPickupSpawner) {
        const relic = deps.relicSystem.rollDrop('hidden_node', deps.runRng);
        if (relic) {
          deps.relicPickupSpawner.spawn(relic, deps.player.x, deps.player.y, 'hidden_node');
          deps.juice.showToast(t('nodes.ui.toast.shrine_luck_relic'), TOAST_COLORS.reward);
          break;
        }
      }
      deps.runScore.addCoinGold(30);
      deps.juice.showToast(t('nodes.ui.toast.shrine_luck_gold'), TOAST_COLORS.reward);
      break;
    }
    default:
      deps.juice.showToast(t('nodes.ui.toast.shrine_boon', { label: shrineLabelFromKey(key) }), TOAST_COLORS.reward);
  }
}

/**
 * M1 F4 — compose the shrine timed-buff toast with a rounded-seconds
 * duration tag so the player sees how long the buff will live.
 */
function showShrineTimedToast(deps: NodeTriggerHandlerDeps, key: string, durationMs: number): void {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  deps.juice.showToast(
    t('nodes.ui.toast.shrine_buff_timed', {
      label: shrineLabelFromKey(key),
      seconds: String(seconds),
    }),
    TOAST_COLORS.reward,
  );
}

/**
 * Wee Trader node — prompt with the resolver's stock. Each pick costs
 * the rolled `priceGold`, deducted from `RunScoreState.coinGoldSpent`
 * via `spendCoinGold`. Unaffordable options are disabled at the modal.
 * F8-pending: the 'passive' slot still grants a stub +40g refund when
 * accepted because no mid-run passive grant exists yet.
 */
function openTraderNode(
  deps: NodeTriggerHandlerDeps,
  node: NodeDef,
  index: number,
  state: NodeMapState,
): void {
  const spec = resolveWeeTraderEvent(node, deps.runRng);
  const items = spec.items;
  if (items.length === 0) {
    deps.finalizeNodeVisit(index, node.key, 'no_stock');
    return;
  }
  // M1 F5 — playback auto-applies the recorded trader pick. applyTraderRelic
  // consumes runRng for the relic roll, so we run the same apply path here
  // to keep the rolled-relic deterministic with the live run.
  const replayChoice = deps.peekReplayChoiceFor(node.key);
  if (replayChoice !== null) {
    const replayItem = items.find((it) => it.kind === replayChoice);
    if (replayItem) deps.runScore.spendCoinGold(replayItem.priceGold);
    if (replayChoice === 'relic') {
      applyTraderRelic(deps, state.worldPositions[index]);
    } else if (replayChoice === 'passive') {
      grantTraderPassive(deps);
    } else if (replayChoice === 'reroll') {
      deps.upgradeUI?.grantReroll();
      deps.juice.showToast(t('nodes.ui.toast.trader_reroll'), TOAST_COLORS.reward);
    }
    deps.finalizeNodeVisit(index, node.key, replayChoice);
    return;
  }
  enterInteractivePrompt(deps, index);
  const balance = deps.runScore.getGoldBalance();
  deps.nodePromptUI?.show({
    title: t('nodes.ui.trader_title'),
    body: t('nodes.ui.trader_body', { gold: String(balance) }),
    options: items.map((item) => {
      const canAfford = balance >= item.priceGold;
      return {
        key: item.kind,
        label: t(`nodes.ui.trader_item.${item.kind}`),
        subLabel: canAfford
          ? t('nodes.ui.trader_price', { price: String(item.priceGold) })
          : t('nodes.ui.trader_price_short', { price: String(item.priceGold) }),
        disabled: !canAfford,
      };
    }),
    allowSkip: true,
    onResolve: (chosenKey) => {
      const item = chosenKey ? items.find((it) => it.kind === chosenKey) : null;
      if (item && deps.runScore.spendCoinGold(item.priceGold)) {
        if (chosenKey === 'relic') {
          applyTraderRelic(deps, state.worldPositions[index]);
        } else if (chosenKey === 'passive') {
          grantTraderPassive(deps);
        } else if (chosenKey === 'reroll') {
          deps.upgradeUI?.grantReroll();
          deps.juice.showToast(t('nodes.ui.toast.trader_reroll'), TOAST_COLORS.reward);
        }
      }
      exitInteractivePrompt(deps, index, node.key, chosenKey ?? 'refused');
    },
  });
}

function applyTraderRelic(deps: NodeTriggerHandlerDeps, pos: { x: number; y: number }): void {
  if (!deps.relicPickupSpawner) return;
  const relic = deps.relicSystem.rollDrop('hidden_node', deps.runRng);
  if (!relic) {
    deps.runScore.addCoinGold(40);
    deps.juice.showToast(t('nodes.ui.toast.trader_empty_pack'), TOAST_COLORS.reward);
    return;
  }
  deps.relicPickupSpawner.spawn(relic, pos.x, pos.y, 'hidden_node');
  deps.juice.showToast(t('nodes.ui.toast.trader_relic'), TOAST_COLORS.reward);
}

/**
 * M1 F8 — trader "passive" branch. Rolls an unheld passive from the
 * catalogue and grants it through `LevelUpFlow.grantPassive` (same
 * effect path as the level-up modal). Falls back to the pre-F8
 * +40g stub when the player's roster is already full, keeping the
 * slot honest even at endgame. Uses `runRng` for replay determinism.
 */
function grantTraderPassive(deps: NodeTriggerHandlerDeps): void {
  const card = rollRandomUnheldPassive(deps.runRng, deps.ownedPassives);
  if (!card) {
    deps.runScore.addCoinGold(40);
    deps.juice.showToast(t('nodes.ui.toast.trader_no_passives'), TOAST_COLORS.reward);
    return;
  }
  const key = (card.effect as { passiveKey: string }).passiveKey;
  deps.levelUpFlow.grantPassive(key);
  deps.juice.showToast(
    t('nodes.ui.toast.trader_passive_granted', { name: t(card.name) }),
    TOAST_COLORS.reward,
  );
}

/**
 * Bargain node — accept takes hpCost damage + grants the offered
 * boon, refuse marks visited with no effect. Skip on scrim-click
 * counts as refuse.
 */
function openBargainNode(deps: NodeTriggerHandlerDeps, node: NodeDef, index: number): void {
  const spec = resolveBargainEvent(node, deps.runRng, deps.player.getMaxHp());
  // M1 F5 — playback auto-applies the recorded bargain pick. Accept
  // consumes HP + applies the offer (which may roll a relic via runRng,
  // so we run the same apply path to stay deterministic). Refuse just
  // surfaces the toast. `canAfford` is ignored in replay — if the live
  // run was able to accept, HP at this game-time was enough.
  const replayChoice = deps.peekReplayChoiceFor(node.key);
  if (replayChoice !== null) {
    if (replayChoice === 'accept') {
      deps.player.takeDamage(spec.hpCost);
      applyBargainOffer(deps, spec.offerKind, spec.offerKey);
    } else {
      deps.juice.showToast(t('nodes.ui.toast.bargain_refused'), '#cccccc');
    }
    deps.finalizeNodeVisit(index, node.key, replayChoice);
    return;
  }
  enterInteractivePrompt(deps, index);
  const canAfford = deps.player.getHp() > spec.hpCost;
  deps.nodePromptUI?.show({
    title: t('nodes.ui.bargain_title'),
    body: t('nodes.ui.bargain_body', {
      hp: String(spec.hpCost),
      offer: bargainLabelFromOfferKey(spec.offerKey),
    }),
    options: [
      {
        key: 'accept',
        label: t('nodes.ui.accept'),
        subLabel: t('nodes.ui.accept_cost', { hp: String(spec.hpCost) }),
        disabled: !canAfford,
      },
    ],
    allowSkip: true,
    onResolve: (chosenKey) => {
      if (chosenKey === 'accept') {
        deps.player.takeDamage(spec.hpCost);
        applyBargainOffer(deps, spec.offerKind, spec.offerKey);
      } else {
        deps.juice.showToast(t('nodes.ui.toast.bargain_refused'), '#cccccc');
      }
      exitInteractivePrompt(deps, index, node.key, chosenKey ?? 'refused');
    },
  });
}

function applyBargainOffer(
  deps: NodeTriggerHandlerDeps,
  offerKind: 'relic' | 'buff_run' | 'weapon_upgrade_token',
  offerKey: string,
): void {
  if (offerKind === 'relic' && deps.relicPickupSpawner) {
    const relic = deps.relicSystem.rollDrop('bargain', deps.runRng);
    if (relic) {
      deps.relicPickupSpawner.spawn(relic, deps.player.x, deps.player.y, 'bargain');
      deps.juice.showToast(t('nodes.ui.toast.bargain_relic'), TOAST_COLORS.reward);
      return;
    }
  }
  if (offerKind === 'buff_run') {
    // v1: run-long bag multiplier bumps. One of goldMult / damageTakenMult /
    // weaponCooldownMult depending on the key.
    if (offerKey.includes('gold')) {
      deps.runModifiers.goldMult *= 1.1;
      deps.juice.showToast(t('nodes.ui.toast.bargain_gold'), TOAST_COLORS.reward);
    } else if (offerKey.includes('cooldown')) {
      deps.runModifiers.weaponCooldownMult *= 0.9;
      deps.weaponSystem.setCurseCooldownMul(deps.runModifiers.weaponCooldownMult);
      deps.juice.showToast(t('nodes.ui.toast.bargain_cooldown'), TOAST_COLORS.reward);
    } else {
      deps.runModifiers.damageTakenMult *= 0.9;
      deps.juice.showToast(t('nodes.ui.toast.bargain_armor'), TOAST_COLORS.reward);
    }
    return;
  }
  // weapon_upgrade_token — v1 placeholder: +1 reroll + 30g.
  deps.upgradeUI?.grantReroll();
  deps.runScore.addCoinGold(30);
  deps.juice.showToast(t('nodes.ui.toast.bargain_token'), TOAST_COLORS.reward);
}
