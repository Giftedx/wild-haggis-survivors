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
import type { PickerSlot, RouteKey } from '../../data/routes';
import { getRoute } from '../../data/routes';
import { applyRouteModifierDeltas } from '../actIntermissionResolve';

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

  // Non-score run flags (still scene-owned for now).
  getRevivalAvailable(): boolean;
  getOwnedPassives(): readonly string[];
  getEvolvedWeapons(): readonly string[];
  setRevivalAvailable(v: boolean): void;
  setOwnedPassives(p: string[]): void;
  setEvolvedWeapons(e: string[]): void;

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
      revivalAvailable: h.getRevivalAvailable(),
      bestCombo: juice.getBestCombo(),
      comboCount: juice.getComboCount(),
      comboTimerMs: juice.getComboTimerRemainingMs(),
      dashCharges: player.getDashCharges(),
      dashCooldownMs: player.getDashCooldownMs(),
      weaponDamage: h.getRunStatsTracker().snapshot(),
      spawnedBossKeys: h.getSpawnSystem().getSpawnedBossKeys(),
      shieldCooldownMs: player.getShieldCooldownMs(),
      actState: snapshotRunActState(h.getRunActState()),
      ironmoor: h.isIronmoorRun(),
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
    } catch {
      /* ignore — best-effort save path */
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
    if (run.revivalAvailable !== undefined) {
      h.setRevivalAvailable(run.revivalAvailable);
    }
    h.getRunStatsTracker().restore(run.weaponDamage);
    h.getMoorMoments().pushAfterResume(run.gameTimeSec);
    restoreRunActStateAndModifiers(
      run.actState,
      h.getRunActState(),
      h.getRunModifiers(),
      h.getSpawnSystem(),
      h.getWeaponSystem(),
    );
  }

  /**
   * Install window-level auto-save hooks so an unexpected page close
   * still lands a last snapshot. No-op on non-browser hosts (Vitest /
   * headless tests).
   */
  registerMidRunHooks(): void {
    if (typeof window === 'undefined') return;
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
  return {
    currentAct: actState.currentAct,
    actStartTimeSec: actState.actStartTimeSec,
    pickerHistory: actState.pickerHistory.map((p) => ({
      slot: p.slot,
      routeKey: p.routeKey,
      atGameTimeSec: p.atGameTimeSec,
      defaultedBySetting: p.defaultedBySetting,
    })),
  };
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
  spawnSystem: { setSpawnIntervalMult(mult: number): void },
  weaponSystem: { setCurseCooldownMul(mul: number): void },
): void {
  if (!snapshot) return;
  actState.advanceToAct(snapshot.currentAct, snapshot.actStartTimeSec);
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
    applyRouteModifierDeltas(runModifiers, route);
  }
  // Resync cached multipliers — the same pair the onResolve resolver
  // touches after every live pick.
  spawnSystem.setSpawnIntervalMult(runModifiers.spawnIntervalMult);
  weaponSystem.setCurseCooldownMul(runModifiers.weaponCooldownMult);
}

function safeGetRoute(key: string) {
  try {
    return getRoute(key as RouteKey);
  } catch {
    return null;
  }
}
