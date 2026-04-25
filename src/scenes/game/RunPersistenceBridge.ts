/**
 * RunPersistenceBridge — owns the active-run save/resume surface that
 * used to live on GameScene:
 *   - snapshot scene state into IRunState (collect)
 *   - write it through SaveManager (persist) — no-op during RUN_END
 *   - hydrate scene state back out of IRunState (applyResume)
 *   - install/remove the pagehide/beforeunload auto-save listeners
 *
 * Scene state mutation is routed through the hooks surface. All reads
 * use lazy getters so the bridge can be constructed before all systems
 * exist (matches the RunLifecycle / EnemyKillHandler / PlayerHitResolver
 * pattern in this package).
 */
import type { SaveManager, IRunState } from '../../core/SaveManager';
import type { Player } from '../../entities/Player';
import type { XPSystem } from '../../systems/XPSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { MoorMomentScheduler } from './MoorMomentScheduler';
import type { LevelUpFlow } from './LevelUpFlow';
import type { VariantDef } from '../../data/variants';
import type { RunScoreState } from './RunScoreState';
import type { RunActState } from './RunActState';
import type { RunModifiers } from '../../core/RunModifiers';
import type { PickerSlot, RouteDef, RouteKey } from '../../data/routes';
import {
  getRoute,
  KIRKYARD_SPAWN_RELEASE_MS,
  STAND_YER_GROUND_XP_RELEASE_MS,
} from '../../data/routes';
import { applyRouteModifierDeltas } from '../actIntermissionResolve';
import { emitSaveFailure } from '../../utils/saveFailure';
import { getNodeDef } from '../../data/nodeBanks';
import { buildNodeMapState } from '../../systems/NodeMapSystem';
import { restoreShrineBuffs } from '../../systems/shrineBuffRegistry';
import type { TempBuffBag } from '../../systems/TempBuffBag';

export interface RunPersistenceHooks {
  // Systems (reads)
  getPlayer(): Player;
  getXPSystem(): XPSystem;
  getWeaponSystem(): WeaponSystem;
  getSpawnSystem(): SpawnSystem;
  getJuice(): JuiceSystem;
  getTimeManager(): TimeManager;
  getRunStatsTracker(): RunStatsTracker;
  getMoorMoments(): MoorMomentScheduler;
  getLevelUpFlow(): LevelUpFlow;
  getSaveManager(): SaveManager;
  getActiveVariant(): VariantDef;

  /** Shared per-run score (kill/boss/gold counters). Read + mutated in place. */
  getRunScore(): RunScoreState;

  /** W2 Moor Road act state — read + mutated in place across the resume path. */
  getRunActState(): RunActState;

  /** Run-scoped modifier bag — read + mutated on resume to re-apply route deltas. */
  getRunModifiers(): RunModifiers;

  /** W66 Ironmoor — run-scoped flag (locked in at run start, NOT live setting). */
  isIronmoorRun(): boolean;

  /**
   * T101 follow-up — TempBuffBag accessor so the persistence bridge can
   * round-trip active shrine buffs through `IRunState.tempBuffs`. The
   * bag's serialisable snapshot covers `{ key, remainingMs }` only;
   * `apply` / `revert` route through the shrine-buff registry on
   * resume. Optional: scenes that don't yet wire it up keep the
   * legacy "buffs are dropped on resume" behaviour as a graceful fallback.
   */
  getTempBuffBag?(): TempBuffBag;

  /**
   * T101 — signal to GameScene that the next `initNodeMapForAct` call
   * should reuse the already-restored `currentActNodeMap` instead of
   * re-rolling. Optional: scenes that don't yet wire this up keep the
   * legacy re-roll-on-resume behaviour as a graceful fallback.
   */
  suppressNextNodeMapRoll?(): void;

  // Non-score run flags (still scene-owned for now).
  getRevivalAvailable(): boolean;
  getOwnedPassives(): readonly string[];
  getEvolvedWeapons(): readonly string[];
  getHeldRelicKeys?(): readonly string[];
  setRevivalAvailable(v: boolean): void;
  setOwnedPassives(p: string[]): void;
  setEvolvedWeapons(e: string[]): void;
  restoreHeldRelics?(keys: readonly string[]): void;

  // Auto-save gate (skip when scene is already torn down)
  isSceneActive(): boolean;
}

export class RunPersistenceBridge {
  private pageHideBound?: () => void;

  constructor(private readonly hooks: RunPersistenceHooks) {}

  /** Snapshot the current run into an IRunState. Read-only on scene. */
  collect(): IRunState {
    const h = this.hooks;
    const player = h.getPlayer();
    const xp = h.getXPSystem();
    const weapons = h.getWeaponSystem();
    const juice = h.getJuice();
    const score = h.getRunScore();
    const heldRelicKeys = h.getHeldRelicKeys?.() ?? [];
    return {
      gameTimeSec: h.getSpawnSystem().getGameTimeSec(),
      playerX: player.x,
      playerY: player.y,
      playerHealth: player.getHp(),
      playerMaxHp: player.getMaxHp(),
      currentXp: xp.getCurrentXP(),
      currentLevel: xp.getLevel(),
      acquiredWeapons: weapons.getWeapons().map((w) => ({
        key: w.config.key,
        level: w.level,
        evolved: w.evolved,
        evolutionKey: w.evolutionKey ?? '',
      })),
      selectedVariantKey: h.getActiveVariant().key,
      killCount: score.killCount,
      ownedPassives: [...h.getOwnedPassives()],
      evolvedWeaponKeys: [...h.getEvolvedWeapons()],
      bossKillCount: score.bossKillCount,
      bossGoldEarned: score.bossGoldEarned,
      coinGoldEarned: score.coinGoldEarned,
      coinGoldSpent: score.coinGoldSpent,
      revivalAvailable: h.getRevivalAvailable(),
      bestCombo: juice.getBestCombo(),
      comboCount: juice.getComboCount(),
      comboTimerMs: juice.getComboTimerRemainingMs(),
      dashCharges: player.getDashCharges(),
      dashCooldownMs: player.getDashCooldownMs(),
      weaponDamage: h.getRunStatsTracker().snapshot(),
      spawnedBossKeys: h.getSpawnSystem().getSpawnedBossKeys(),
      shieldCooldownMs: player.getShieldCooldownMs(),
      ...(heldRelicKeys.length > 0 ? { heldRelicKeys: [...heldRelicKeys] } : {}),
      actState: snapshotRunActState(h.getRunActState()),
      ironmoor: h.isIronmoorRun(),
      ...(() => {
        const bag = h.getTempBuffBag?.();
        if (!bag) return {};
        const entries = bag.snapshotEntries();
        return entries.length > 0 ? { tempBuffs: entries } : {};
      })(),
    };
  }

  /**
   * Persist the active run. Skipped when TimeManager is absent or a
   * RUN_END timer is live (the scene is tearing down the run and a
   * stale snapshot would reappear on next launch).
   */
  persist(): void {
    const h = this.hooks;
    const timeManager = h.getTimeManager();
    if (!timeManager) return;
    if (timeManager.has('RUN_END')) return;
    try {
      h.getSaveManager().saveActiveRun(this.collect());
    } catch (err) {
      // SaveManager.save() already emits via emitSaveFailure on its own
      // catch — this handles `JSON.stringify` failures in the snapshot
      // collect path (cyclic state, etc.). Distinct path tag.
      emitSaveFailure('active_run', err);
    }
  }

  /**
   * Hydrate a previously-saved IRunState back onto the scene. Replays
   * level-ups for stat growth, restores passives, and rebuilds the
   * weapon roster. Counter state is pushed back through setter hooks.
   */
  applyResume(run: IRunState): void {
    const h = this.hooks;
    const xp = h.getXPSystem();
    const player = h.getPlayer();
    const weapons = h.getWeaponSystem();
    const levelUpFlow = h.getLevelUpFlow();
    const score = h.getRunScore();

    xp.hydrateRunState(run.currentLevel, run.currentXp);
    for (let lv = 2; lv <= run.currentLevel; lv++) {
      player.onLevelUp(lv);
    }
    const passives = [...run.ownedPassives];
    h.setOwnedPassives(passives);
    h.setEvolvedWeapons([...run.evolvedWeaponKeys]);
    for (const p of passives) {
      levelUpFlow.applyPassiveEffect(p);
    }
    player.setResumeHealth(run.playerHealth);
    player.setResumeShieldCooldown(run.shieldCooldownMs);
    player.setResumeDashState(run.dashCharges, run.dashCooldownMs);
    weapons.replaceWeaponsFromRun(run.acquiredWeapons);
    // WeaponSystem can re-derive evolved state from the imported roster —
    // overwrite our transient copy so it matches what's actually equipped.
    h.setEvolvedWeapons(
      weapons
        .getWeapons()
        .filter((w) => w.evolved)
        .map((w) => w.config.key),
    );
    h.getSpawnSystem().applyResumeTime(run.gameTimeSec, run.spawnedBossKeys);
    score.killCount = run.killCount;
    score.bossKillCount = Math.max(0, run.bossKillCount ?? 0);
    score.bossGoldEarned = Math.max(0, run.bossGoldEarned ?? 0);
    score.coinGoldEarned = Math.max(0, run.coinGoldEarned ?? 0);
    score.coinGoldSpent = Math.max(0, run.coinGoldSpent ?? 0);
    if (run.revivalAvailable !== undefined) {
      h.setRevivalAvailable(run.revivalAvailable);
    }
    if (run.heldRelicKeys) {
      h.restoreHeldRelics?.(run.heldRelicKeys);
    }
    h.getRunStatsTracker().restore(run.weaponDamage);
    h.getMoorMoments().pushAfterResume(run.gameTimeSec);
    const restoredNodeMap = restoreRunActStateAndModifiers(
      run.actState,
      h.getRunActState(),
      h.getRunModifiers(),
      h.getSpawnSystem(),
      h.getWeaponSystem(),
      h.getXPSystem(),
      h.getTimeManager(),
      run.gameTimeSec,
    );
    if (restoredNodeMap) {
      h.suppressNextNodeMapRoll?.();
    }
    // T101 follow-up — re-attach active shrine buffs after the player is
    // built and the act state is restored. Each entry's remainingMs
    // survives through the bag's tick loop; the registry's apply/revert
    // run against the live Player.
    if (run.tempBuffs && run.tempBuffs.length > 0) {
      const bag = h.getTempBuffBag?.();
      if (bag) {
        restoreShrineBuffs(bag, run.tempBuffs, { player });
      }
    }
  }

  /**
   * Install window-level auto-save hooks so an unexpected page close
   * still lands a last snapshot. No-op on non-browser hosts (Vitest /
   * headless tests).
   */
  registerMidRunHooks(): void {
    if (typeof window === 'undefined') return;
    // Defensive: idempotent re-entry — avoid orphan listeners if create()
    // ever double-installs (abnormal) before shutdown.
    this.unregisterMidRunHooks();
    this.pageHideBound = () => {
      try {
        if (!this.hooks.isSceneActive()) return;
        this.persist();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pagehide', this.pageHideBound);
    window.addEventListener('beforeunload', this.pageHideBound);
  }

  /** Remove the listeners registered by registerMidRunHooks (idempotent). */
  unregisterMidRunHooks(): void {
    if (typeof window === 'undefined' || !this.pageHideBound) return;
    window.removeEventListener('pagehide', this.pageHideBound);
    window.removeEventListener('beforeunload', this.pageHideBound);
    this.pageHideBound = undefined;
  }
}

/**
 * Flatten the live `RunActState` instance into the plain serialisable
 * shape expected by `IRunState.actState`. Exported as a named module
 * function so the `applyResume` path and future tests can share the
 * round-trip helpers.
 */
function snapshotRunActState(actState: RunActState): IRunState['actState'] {
  const out: NonNullable<IRunState['actState']> = {
    currentAct: actState.currentAct,
    actStartTimeSec: actState.actStartTimeSec,
    pickerHistory: actState.pickerHistory.map((p) => ({
      slot: p.slot,
      routeKey: p.routeKey,
      atGameTimeSec: p.atGameTimeSec,
      defaultedBySetting: p.defaultedBySetting,
    })),
  };
  if (actState.currentNodeIndex > 0) out.currentNodeIndex = actState.currentNodeIndex;
  if (actState.nodeOutcomes.length > 0) {
    out.nodeOutcomes = actState.nodeOutcomes.map((o) => ({
      nodeKey: o.nodeKey,
      ...(o.chosenRewardKey ? { chosenRewardKey: o.chosenRewardKey } : {}),
      visitedAtGameTimeSec: o.visitedAtGameTimeSec,
    }));
  }
  // T101 — freeze the rolled per-act node map so resume rebuilds the
  // exact path the player saw, including which nodes they've cleared.
  // Empty when the active map hasn't been generated yet (the resume
  // path then falls back to the legacy re-roll behaviour).
  const map = actState.currentActNodeMap;
  if (map && map.nodes.length > 0) {
    out.nodeMap = {
      act: map.act,
      nodeKeys: map.nodes.map((n) => n.key),
      worldPositions: map.worldPositions.map((p) => ({ x: p.x, y: p.y })),
      visited: map.visited.slice(),
    };
  }
  return out;
}

/**
 * Rehydrate the act state + re-apply modifier deltas so resumed runs
 * don't re-fire a picker the player already resolved AND keep their
 * route-granted multipliers live. Silent no-op when `snapshot` is
 * absent (pre-W2 payloads or fresh-act-1 state).
 */
function restoreRunActStateAndModifiers(
  snapshot: IRunState['actState'] | undefined,
  actState: RunActState,
  runModifiers: RunModifiers,
  spawnSystem: {
    setSpawnIntervalMult(mult: number): void;
    setEliteWeightMultiplier?(mult: number): void;
    setEnemyHpMultiplier?(mult: number): void;
  },
  weaponSystem: { setCurseCooldownMul(mul: number): void },
  xpSystem: { setDropValueMultiplier?(mult: number): void },
  timeManager: { scheduleRealTime?(ms: number, cb: () => void): unknown },
  gameTimeSec: number,
): boolean {
  if (!snapshot) return false;
  actState.advanceToAct(snapshot.currentAct, snapshot.actStartTimeSec);
  // Restore append-only log + cursor BEFORE GameScene re-rolls the act's
  // node-map. The freshly-generated map's `visited[]` is not yet
  // reconstructed (run RNG state is not serialised — tracked as a plan
  // exception). Cursor + log restoration keeps Chronicle breadcrumbs and
  // replay node-cursor counts coherent on resume.
  if (snapshot.currentNodeIndex !== undefined) {
    actState.currentNodeIndex = Math.max(0, Math.floor(snapshot.currentNodeIndex));
  }
  if (snapshot.nodeOutcomes) {
    for (const o of snapshot.nodeOutcomes) {
      actState.recordNodeOutcome({
        nodeKey: o.nodeKey,
        ...(o.chosenRewardKey ? { chosenRewardKey: o.chosenRewardKey } : {}),
        visitedAtGameTimeSec: o.visitedAtGameTimeSec,
      });
    }
  }
  for (const p of snapshot.pickerHistory) {
    const route = safeGetRoute(p.routeKey);
    if (!route) continue;
    actState.recordPick({
      slot: p.slot as PickerSlot,
      routeKey: p.routeKey as RouteKey,
      atGameTimeSec: p.atGameTimeSec,
      defaultedBySetting: p.defaultedBySetting,
    });
    runModifiers.routePicks.push({
      slot: p.slot as PickerSlot,
      routeKey: p.routeKey as RouteKey,
      atGameTimeSec: p.atGameTimeSec,
      defaultedBySetting: p.defaultedBySetting,
    });
    restoreRouteRuntimeState(
      p,
      route,
      gameTimeSec,
      runModifiers,
      spawnSystem,
      xpSystem,
      timeManager,
    );
  }
  // Resync cached multipliers — the same pair the onResolve resolver
  // touches after every live pick.
  spawnSystem.setSpawnIntervalMult(runModifiers.spawnIntervalMult);
  weaponSystem.setCurseCooldownMul(runModifiers.weaponCooldownMult);
  // T101 — restore the rolled node-map last so visited[] survives
  // resume. Returns whether a map was actually restored so the caller
  // can signal GameScene to skip its own re-roll.
  return restoreNodeMapFromSnapshot(snapshot, actState);
}

function restoreNodeMapFromSnapshot(
  snapshot: NonNullable<IRunState['actState']>,
  actState: RunActState,
): boolean {
  const nm = snapshot.nodeMap;
  if (!nm) return false;
  if (nm.nodeKeys.length !== nm.worldPositions.length) return false;
  if (nm.visited.length !== nm.nodeKeys.length) return false;
  // A drifted node-bank between save + load (build with a renamed key
  // would fail this lookup) silently falls back to a fresh re-roll
  // rather than crashing the resume; the save-version coercion already
  // dropped malformed entries upstream.
  const nodes: Array<NonNullable<ReturnType<typeof getNodeDef>>> = [];
  for (const key of nm.nodeKeys) {
    const def = getNodeDef(key);
    if (!def) return false;
    nodes.push(def);
  }
  const restored = buildNodeMapState(
    nm.act,
    nodes,
    nm.worldPositions.map((p) => ({ x: p.x, y: p.y })),
  );
  for (let i = 0; i < nm.visited.length; i++) {
    restored.visited[i] = nm.visited[i];
  }
  actState.currentActNodeMap = restored;
  return true;
}

function restoreRouteRuntimeState(
  pick: NonNullable<IRunState['actState']>['pickerHistory'][number],
  route: RouteDef,
  gameTimeSec: number,
  runModifiers: RunModifiers,
  spawnSystem: {
    setSpawnIntervalMult(mult: number): void;
    setEliteWeightMultiplier?(mult: number): void;
    setEnemyHpMultiplier?(mult: number): void;
  },
  xpSystem: { setDropValueMultiplier?(mult: number): void },
  timeManager: { scheduleRealTime?(ms: number, cb: () => void): unknown },
): void {
  switch (route.key) {
    case 'up_the_brae':
      applyRouteModifierDeltas(runModifiers, route);
      spawnSystem.setEliteWeightMultiplier?.(1.5);
      return;
    case 'through_the_kirkyard': {
      const remainingMs = remainingRouteMs(
        pick.atGameTimeSec,
        gameTimeSec,
        KIRKYARD_SPAWN_RELEASE_MS,
      );
      if (remainingMs <= 0) return;
      applyRouteModifierDeltas(runModifiers, route);
      timeManager.scheduleRealTime?.(remainingMs, () => {
        runModifiers.spawnIntervalMult = 1;
        spawnSystem.setSpawnIntervalMult(1);
      });
      return;
    }
    case 'stand_yer_ground': {
      const remainingMs = remainingRouteMs(
        pick.atGameTimeSec,
        gameTimeSec,
        STAND_YER_GROUND_XP_RELEASE_MS,
      );
      if (remainingMs <= 0) return;
      xpSystem.setDropValueMultiplier?.(2);
      timeManager.scheduleRealTime?.(remainingMs, () => xpSystem.setDropValueMultiplier?.(1));
      return;
    }
    case 'run_for_the_hills':
      applyRouteModifierDeltas(runModifiers, route);
      return;
    case 'buckie_pitstop':
      applyRouteModifierDeltas(runModifiers, route);
      spawnSystem.setEnemyHpMultiplier?.(1.10);
      return;
    case 'round_the_loch':
      applyRouteModifierDeltas(runModifiers, route);
      return;
  }
}

function remainingRouteMs(
  pickedAtGameTimeSec: number,
  resumeGameTimeSec: number,
  totalMs: number,
): number {
  const elapsedMs = Math.max(0, resumeGameTimeSec - pickedAtGameTimeSec) * 1000;
  return Math.max(0, Math.round(totalMs - elapsedMs));
}

function safeGetRoute(key: string) {
  try {
    return getRoute(key as RouteKey);
  } catch {
    return null;
  }
}
