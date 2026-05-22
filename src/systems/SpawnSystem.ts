import * as Phaser from 'phaser';
import type { SettingsManager } from '../core/SettingsManager';
import { getSettingsManager } from '../core/SettingsManager';
import { tryCameraShake } from '../utils/cameraShake';
import { Enemy } from '../entities/Enemy';
import { ENEMIES, GAME } from '../config';
import { getEnemyConfigsByKeys, getSpawnWeight, EnemyConfig, ENEMY_TYPES, BOSSES, BossConfig } from '../data/enemies';
import { BALANCE, getActiveWaveTimelineEntry } from '../core/BalanceConfig';
import { audio } from './AudioSystem';
import { ISceneContext } from '../core/ISceneContext';
import { getCameraViewport } from '../ui/cameraViewport';
import { t } from '../core/i18n';
import { BIOMES } from '../data/biomes';
import { computePostBellMultipliers, NEUTRAL_POST_BELL, type PostBellMultipliers } from '../core/PostBellEscalation';
import { shouldMarkCursed } from './cursedSpawnRoll';
import { evaluatePostBellBossTick } from './postBellBossCadence';
import { ELITE_AFFIXES, pickEliteAffixId } from '../data/eliteAffixes';
import { resolveEliteChance } from './eliteChance';
import { bossHpTimeScale } from './bossHpTimeScale';
import { snapToNearestWorldEdge } from './snapToWorldEdge';
import { resolveEnemyAmbientTrigger } from '../data/enemyAmbientTrigger';
import { bumpBeastieSeen, bumpSeenEnemy, loadSave } from '../utils/save';

/** First matching reason wins — see `getSpawnStallReason()`. Boss lifecycle is orthogonal to wave stalls. */
export type SpawnStallReason =
  | 'PAUSED'
  | 'POOL_SATURATED'
  | 'INTERVAL_WAIT'
  | 'NO_TYPES_AVAILABLE'
  | 'RUN_FINALE';

function bossPropTextureKey(bossKey: string): string | null {
  switch (bossKey) {
    case 'gordon': return 'boss_prop_gordon_chopping_board';
    case 'tour_bus': return 'boss_prop_tour_bus_sign';
    case 'the_laird': return 'boss_prop_laird_gate';
    case 'hunter_general': return 'boss_prop_hunter_target_flag';
    case 'taxman': return 'boss_prop_taxman_stamp';
    default: return null;
  }
}

/**
 * SpawnSystem — manages enemy object pool, wave spawning, and boss spawns.
 */
export class SpawnSystem {
  private pool: Phaser.GameObjects.Group;
  private scene: Phaser.Scene & ISceneContext;
  private spawnTimer: number = 0;
  private gameTimeSec: number = 0;
  private spawnInterval: number = 1.5;
  private burstSize: number = 2;
  /**
   * Per-run spawn cadence multiplier. 1.0 = default cadence (wave timeline
   * values untouched). <1.0 = faster spawns (used by the "Restless Spirits"
   * curse). Applied at every point where `spawnInterval` is refreshed from
   * the wave timeline — GameScene writes this once at run start.
   */
  private spawnIntervalMult: number = 1.0;
  /**
   * Per-run elite roll multiplier (W2 Moor Road). 1.0 = untouched.
   * Applied on top of base ELITE_SPAWN_CHANCE + killPressure nudge.
   * `up_the_brae` route sets this to 1.5 for act 2.
   */
  private eliteWeightMultiplier: number = 1.0;
  /**
   * Per-run enemy HP multiplier (W2 Moor Road). 1.0 = untouched.
   * `buckie_pitstop` sets 1.10 after the 15s pause.
   */
  private enemyHpMultiplier: number = 1.0;
  /**
   * Game-time (seconds) at which the `pauseSpawnsFor` hold ends. 0 = not
   * paused. Used by `spawnBurst` to no-op regular spawns for the duration
   * without touching token infrastructure. Game-time (not wall-clock) is
   * load-bearing for T1 deterministic replay — hit-freeze, pause, and
   * tab-backgrounding all freeze `gameTimeSec` but leave `Date.now()`
   * ticking, which previously caused the pause window to drift relative
   * to gameplay.
   */
  private spawnsPausedUntilGameSec: number = 0;
  /** Current segment from `WAVE_TIMELINE` — refreshed each update from `gameTimeSec`. */
  private directorEnemyKeys: string[] = [];
  /** Cached segment reference — avoids re-spreading enemyKeys when segment hasn't changed. */
  private lastWaveSeg: ReturnType<typeof getActiveWaveTimelineEntry> | null = null;

  /** Track which bosses have already spawned */
  private spawnedBossKeys: Set<string> = new Set();
  /** Boss intro scheduled (warning + timer) — avoids duplicate banners; key moves to spawnedBossKeys only after the entity spawns. */
  private bossSpawnScheduled: Set<string> = new Set();
  /** Cached boss-active flag — avoids iterating 400 enemies per frame */
  private bossActive: boolean = false;
  /**
   * Phase B Endless — game-time of the most recent post-bell boss
   * spawn. Initialised to -1 (= "no post-bell boss yet — first cadence
   * tick anchored at the bell time when secondsPastBell first goes
   * positive"). Reset on resetRunState.
   */
  private postBellBossLastSpawnSec: number = -1;
  /** One-shot: run reached `RUN_WIN_TIME_SEC` — timeline bursts off, finale boss queued. */
  private runWinFinaleStarted: boolean = false;
  /** 0–1 — rises on kills, decays over time; nudges elite spawn chance. */
  private killPressure: number = 0;
  /** When true, `spawnBurst` is a no-op (final boss phase). */
  private regularSpawnsDisabled: boolean = false;
  /** Bosses ready to spawn but physics is paused (level-up / manual pause).
   *  The next unpaused update() tick flushes them in FIFO order. Used as a
   *  queue (not a single slot) because when two boss windows cross the
   *  player's clock simultaneously — e.g. timeline-skip from 5:00 past
   *  10:00 lands the each_uisge (7:30) and tour_bus (10:00) warnings on
   *  the same frame — both can hit the paused branch and a single-slot
   *  field would silently drop one. */
  private pendingBossSpawns: Array<() => void> = [];
  private bossCheckFrame: number = -1;

  /** Active boss warning / intro VFX objects — cleaned up on destroy to prevent stale tween callbacks. */
  private activeBossVfx: Phaser.GameObjects.GameObject[] = [];

  /**
   * B1 Phase 3 Task 17 — mirror of `SaveData.seenEnemies` loaded at
   * construction + mutated as fresh enemies surface. Holding an in-memory
   * set keeps the per-spawn trigger decision off localStorage (which would
   * be a syscall per mob). Writes go through `bumpSeenEnemy` only on the
   * first-encounter transition, so persistence stays cheap.
   */
  private seenEnemiesCache: Set<string> = new Set();

  /**
   * C1 M2 Task 11 — stable runId stamped into new DiscoveryLog entries
   * on first-encounter. Derived from the run RNG's 32-bit seed so a
   * player rerunning a Chronicle seed shows the same `run:${seed}` id
   * (cosmetic — not surfaced yet, but keeps the telemetry honest).
   */
  private discoveryRunId: string = 'run:unknown';

  /** Emits 'bossWarning' and 'bossKilled' events */
  readonly events = new Phaser.Events.EventEmitter();
  private readonly settings: SettingsManager;

  constructor(scene: Phaser.Scene & ISceneContext) {
    this.scene = scene;
    this.settings = getSettingsManager();

    this.pool = scene.add.group({
      classType: Enemy,
      maxSize: ENEMIES.MAX_ACTIVE,
      runChildUpdate: false,
    });

    for (let i = 0; i < 100; i++) {
      this.pool.add(new Enemy(scene, 0, 0));
    }

    const init = getActiveWaveTimelineEntry(this.gameTimeSec);
    this.spawnInterval = init.intervalSec * this.spawnIntervalMult;
    this.burstSize = init.burstSize;
    this.directorEnemyKeys = [...init.enemyKeys];
    this.lastWaveSeg = init;

    // Seed the `enemy_ambient` first-encounter cache from persisted save.
    // Best-effort — if localStorage is unavailable, treat every enemy as
    // fresh this session (over-firing is preferable to silence).
    try {
      this.seenEnemiesCache = new Set(loadSave().seenEnemies);
    } catch {
      this.seenEnemiesCache = new Set();
    }

    // C1 M2 Task 11 — capture the run seed as the DiscoveryLog runId.
    // Best-effort: test scenes without a run RNG keep the default
    // sentinel string.
    try {
      const seed = scene.getRunRng().seed;
      this.discoveryRunId = `run:${seed >>> 0}`;
    } catch {
      /* keep sentinel */
    }
  }

  /**
   * Install a run-scoped spawn cadence multiplier. Call once after
   * construction, before the first update tick — the stored value is read
   * every time `spawnInterval` is refreshed from the wave timeline.
   */
  setSpawnIntervalMult(mult: number): void {
    this.spawnIntervalMult = Math.max(0.1, mult);
    // Re-apply immediately so the very first segment uses the multiplier.
    const seg = this.lastWaveSeg ?? getActiveWaveTimelineEntry(this.gameTimeSec);
    this.spawnInterval = seg.intervalSec * this.spawnIntervalMult;
  }

  /**
   * W2 Moor Road: multiply base elite roll chance. `up_the_brae` route
   * sets 1.5 for act 2; reset to 1 on new run via resetRunState().
   * Clamped to [0.1, 5] so a bad delta can't totally mute or saturate.
   */
  setEliteWeightMultiplier(mult: number): void {
    this.eliteWeightMultiplier = Phaser.Math.Clamp(mult, 0.1, 5);
  }

  /**
   * W2 Moor Road: scale enemy HP at spawn time (stacks on top of the
   * standard post-Bell multiplier). `buckie_pitstop` sets 1.10.
   * Clamped to [0.25, 3].
   */
  setEnemyHpMultiplier(mult: number): void {
    this.enemyHpMultiplier = Phaser.Math.Clamp(mult, 0.25, 3);
  }

  /**
   * U1 M4 — broadcast a global enemy-slow multiplier from the rune
   * effect bag (Frost Rune in biome_cold; currently ungrounded but kept
   * wired for the future cold biome). Idempotent — applied as a fresh
   * `applyFreeze` pulse on every active enemy when the rune toggles
   * non-identity. Hands of-no rune state when called with `1`.
   *
   * Per the bag-vs-cached-field gotcha, the GameScene calls this every
   * frame so a transition flips behaviour mid-run without re-plumbing.
   */
  private runeEnemySlowMul: number = 1;
  setRuneEnemySlowMul(mul: number): void {
    const clamped = Math.max(0.1, Number.isFinite(mul) ? mul : 1);
    if (clamped === this.runeEnemySlowMul) return;
    this.runeEnemySlowMul = clamped;
    if (clamped >= 1) return;
    // One-shot freeze pulse so the new mul lands on already-spawned
    // enemies. New spawns pick it up via Enemy's freeze multiplier
    // baseline (long duration window). 30s window covers typical rune
    // transitions; further refresh re-applies through this same path.
    const enemies = this.pool.getChildren() as Enemy[];
    for (const e of enemies) {
      if (e.active) e.applyFreeze(clamped, 30_000);
    }
  }
  getRuneEnemySlowMul(): number {
    return this.runeEnemySlowMul;
  }

  /**
   * W2 Moor Road: suppress regular spawn bursts for `ms` of game-time.
   * Used by `buckie_pitstop` to give the player 15s of peace before
   * resuming. Boss timeline is untouched. Game-time (not wall-clock) so
   * the pause window is consistent under hit-freeze / tab-backgrounding,
   * which makes the behaviour seed-deterministic for T1 replay.
   */
  pauseSpawnsFor(ms: number): void {
    this.spawnsPausedUntilGameSec = this.gameTimeSec + Math.max(0, ms) / 1000;
  }

  /**
   * Debug/test hook: find the highest-priority active boss in the pool,
   * or null. Used by DebugTimeTravelApi.killCurrentBoss to drive the W2
   * E2E boss-sequence playthrough without exposing the pool directly.
   *
   * **Latest-spawn preference.** When multiple bosses are alive at once
   * (timeline-skip past two consecutive boss windows like 7:30 each_uisge
   * + 10:00 tour_bus, or Phase B Endless post-bell cadence overlapping
   * the final boss at `RUN_WIN_TIME_SEC`), the boss with the latest
   * `spawnTimeSec` wins so `DEBUG.killCurrentBoss()` deterministically
   * targets the act-gating / final boss rather than whichever pre-act
   * boss happens to sit earlier in the pool. Single-boss scenarios
   * behave as before.
   */
  findActiveBoss(): Enemy | null {
    const active = this.pool.getChildren() as Enemy[];
    let best: Enemy | null = null;
    let bestSpawnTime = -1;
    for (let i = 0; i < active.length; i++) {
      const e = active[i];
      if (!e.active || !e.isBoss()) continue;
      const cfg = BOSSES.find(b => b.key === e.getEnemyKey());
      const spawnTime = cfg?.spawnTimeSec ?? -1;
      if (spawnTime > bestSpawnTime) {
        best = e;
        bestSpawnTime = spawnTime;
      }
    }
    return best;
  }

  /**
   * W2 Moor Road: bypass the director and spawn a single enemy by key
   * at the usual off-screen spawn position. Used by route onResume
   * bodies (e.g. `through_the_kirkyard` drops an elite haggis_hunter
   * the moment the run resumes from the picker).
   *
   * Returns the spawned Enemy (or null when the pool was saturated or
   * the enemy key was unknown). M1 F1+F2 — node-spawned enemies pass
   * `waveTag` so `NodeWaveTracker` can gate finalize-on-death.
   *
   * No-ops if the enemy key is unknown or the pool is saturated.
   */
  forceSpawn(
    enemyKey: string,
    opts?: { elite?: boolean; waveTag?: string | null },
  ): Enemy | null {
    const config = ENEMY_TYPES[enemyKey];
    if (!config) return null;
    const enemy = Enemy.acquireFromPool(this.pool, this.scene);
    if (!enemy) return null;
    const player = this.scene.getPlayer();
    const pos = this.getSpawnPosition(this.scene.cameras.main, player.x, player.y);
    enemy.spawn(pos.x, pos.y, config, this.gameTimeSec);
    if (opts?.elite) {
      enemy.markAsElite();
      const rng = this.scene.getRunRng();
      const affix = pickEliteAffixId(config.behavior, rng);
      if (affix) enemy.applyEliteAffix(affix);
    }
    if (opts?.waveTag) {
      enemy.nodeWaveTag = opts.waveTag;
    }
    this.notifyEnemyAmbient(config);
    return enemy;
  }

  /**
   * B1 Phase 3 Task 17 — route a regular enemy spawn through the
   * `enemy_ambient` banter pool. First-encounter fires a flavour line and
   * persists the key into `seenEnemies`; subsequent encounters roll a
   * rare 1/20 aside. Bosses bypass this path (they own their own
   * `boss_warn` pool), so `spawnBoss` deliberately does not call this.
   * No-op under the pending boss spawn path either.
   */
  private notifyEnemyAmbient(config: EnemyConfig): void {
    const decision = resolveEnemyAmbientTrigger(
      config.key,
      this.seenEnemiesCache,
      (p) => this.scene.getRunRng().bool(p),
    );
    if (decision === 'first') {
      this.seenEnemiesCache.add(config.key);
      bumpSeenEnemy(config.key);
      // C1 M2 Task 11 — persist into the DiscoveryLog so the Almanac's
      // Beasties book can paint in the silhouette. `bumpBeastieSeen`
      // itself short-circuits on a repeat key, so the cache above is
      // the per-run gate; this persists cross-run.
      bumpBeastieSeen(config.key, this.discoveryRunId, Date.now());
      this.scene.requestBanter('enemy_ambient', config.key);
    } else if (decision === 'respawn') {
      this.scene.requestBanter('enemy_ambient', config.key);
    }
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = getCameraViewport(this.scene);
    return { x, y, width, height };
  }

  /** Reset run-scoped spawn state and deactivate pooled enemies. */
  resetRunState(): void {
    this.spawnTimer = 0;
    this.gameTimeSec = 0;
    const init = getActiveWaveTimelineEntry(0);
    this.spawnInterval = init.intervalSec * this.spawnIntervalMult;
    this.burstSize = init.burstSize;
    this.directorEnemyKeys = [...init.enemyKeys];
    this.lastWaveSeg = init;
    this.spawnedBossKeys.clear();
    this.bossSpawnScheduled.clear();
    this.bossActive = false;
    this.pendingBossSpawns.length = 0;
    this.bossCheckFrame = -1;
    this.runWinFinaleStarted = false;
    this.regularSpawnsDisabled = false;
    this.killPressure = 0;
    this.eliteWeightMultiplier = 1.0;
    this.enemyHpMultiplier = 1.0;
    this.spawnsPausedUntilGameSec = 0;
    this.postBellBossLastSpawnSec = -1;
    this.events.removeAllListeners();

    if (this.activeBossVfx) {
      for (const obj of this.activeBossVfx) {
        this.scene.tweens.killTweensOf(obj);
        obj.destroy();
      }
      this.activeBossVfx = [];
    }

    this.scene.tweens.killTweensOf(this.scene.cameras.main);

    const enemies = this.pool.getChildren() as Enemy[];
    for (const e of enemies) {
      if (e.active) {
        try { e.destroy(); } catch { /* ignore */ }
        e.active = false;
        e.visible = false;
      }
    }
  }

  destroy(): void {
    this.resetRunState();
    try { this.pool.clear(true, true); } catch { /* ignore */ }
  }

  update(delta: number, playerX: number, playerY: number): void {
    this.gameTimeSec += delta / 1000;
    this.spawnTimer += delta / 1000;
    const ds = delta / 1000;
    this.killPressure *= Math.exp(-ds * BALANCE.director.killPressureDecayPerSec);

    // Flush a deferred boss spawn once physics is running again.
    // scene.time.delayedCall still fires during the level-up modal (physics
    // pause), but we don't want a boss to materialize and bossActive to flip
    // while the player is picking cards. Warning callbacks push their
    // doSpawn closures into the queue when paused — flush them in FIFO
    // order on the next unpaused tick so simultaneous warnings (e.g.
    // each_uisge + tour_bus crossing thresholds in the same skip-frame)
    // both materialize.
    if (this.pendingBossSpawns.length > 0 && !this.scene.getTimeManager().isGameplayPaused()) {
      const queued = this.pendingBossSpawns.splice(0, this.pendingBossSpawns.length);
      for (const fn of queued) fn();
    }

    if (!this.runWinFinaleStarted && this.gameTimeSec >= BALANCE.run.RUN_WIN_TIME_SEC) {
      this.beginRunWinFinale(playerX, playerY);
    }

    this.syncWaveDirectorFromTimeline();
    this.checkBossSpawns(playerX, playerY);
    this.tickPostBellBoss(playerX, playerY);

    if (this.spawnTimer >= this.spawnInterval) {
      // Carry over small overshoots for accurate rate, but cap to prevent
      // burst-spawning after lag spikes
      this.spawnTimer = Math.min(this.spawnTimer - this.spawnInterval, this.spawnInterval);
      this.spawnBurst(playerX, playerY);
    }

    if (!this.scene.getTimeManager().isGameplayPaused()) {
      const active = this.pool.getChildren() as Enemy[];
      for (let i = 0; i < active.length; i++) {
        if (active[i].active) active[i].chaseTarget(playerX, playerY, delta);
      }
    }
  }

  // ── Boss spawning ──

  private checkBossSpawns(playerX: number, playerY: number): void {
    for (const boss of BOSSES) {
      // V2 (Cailleach Gauntlet) — manualSpawn bosses are excluded from
      // the time-based path; they spawn via `spawnBossManually`.
      if (boss.manualSpawn) continue;
      if (this.spawnedBossKeys.has(boss.key)) continue;
      if (this.gameTimeSec < boss.spawnTimeSec) continue;
      if (this.bossSpawnScheduled.has(boss.key)) continue;
      this.bossSpawnScheduled.add(boss.key);
      this.spawnBoss(boss, playerX, playerY);
    }
  }

  /**
   * V2 (Cailleach Gauntlet) — manual boss spawn entry point. Called by
   * `CailleachGauntletScheduler` when the gauntlet enters the 'engaged'
   * phase at 15:00. Bypasses the time-based eligibility checks; just
   * runs the standard `spawnBoss` body and returns the spawned Enemy
   * (the gauntlet scheduler holds the ref to read its dead flag).
   */
  spawnBossManually(bossKey: string, playerX: number, playerY: number): void {
    const boss = BOSSES.find((b) => b.key === bossKey);
    if (!boss) return;
    if (this.spawnedBossKeys.has(boss.key)) return;
    this.bossSpawnScheduled.add(boss.key);
    this.spawnBoss(boss, playerX, playerY);
  }

  /**
   * Phase B Endless — recurring boss respawn while the player is past
   * the bell. Pulls cadence + flag from `getPostBellMultipliers`, picks
   * a random non-final boss from the seeded run RNG, and respawns it
   * via the existing spawnBoss path (cleared from `spawnedBossKeys`
   * first so the boss-key dedupe doesn't reject the re-spawn).
   */
  private tickPostBellBoss(playerX: number, playerY: number): void {
    const sec = this.scene.getSecondsPastBell();
    if (!sec || sec <= 0) return;
    const pb = this.getPostBellMultipliers();
    if (this.postBellBossLastSpawnSec < 0) {
      this.postBellBossLastSpawnSec = this.gameTimeSec - sec; // bell time
    }
    const sched = evaluatePostBellBossTick(
      this.gameTimeSec,
      this.postBellBossLastSpawnSec,
      pb.bossCadenceSec,
      this.isBossActive(),
    );
    if (!sched.due) return;
    // V2 — exclude manual-spawn bosses (Cailleach Gauntlet) from the
    // post-bell recurring respawn pool. The gauntlet boss is gated on
    // a separate condition (7 cairns touched), not the cadence.
    const candidates = BOSSES.filter(b => b.key !== BALANCE.run.FINAL_BOSS_KEY && !b.manualSpawn);
    if (candidates.length === 0) return;
    const rng = this.scene.getRunRng();
    const boss = candidates[rng.int(0, candidates.length - 1)];
    // Clear key + scheduled-set so the existing spawnBoss path proceeds.
    this.spawnedBossKeys.delete(boss.key);
    this.bossSpawnScheduled.delete(boss.key);
    this.bossSpawnScheduled.add(boss.key);
    this.postBellBossLastSpawnSec = this.gameTimeSec;
    this.spawnBoss(boss, playerX, playerY);
  }

  private spawnBoss(boss: BossConfig, _playerX: number, _playerY: number): void {
    // Show warning banner
    const warning = t(boss.warningKey);
    this.showBossWarning(warning, boss.key);
    this.scene.caption(`boss_${boss.key}`, warning, '#ff6644');
    // A beat of Glesga nerves right as the screen shakes. Pass the boss
    // key so the engine picks from the authored per-boss pool when one
    // exists — Gordon, Taxman etc. each get their own warning voice.
    this.scene.requestBanter('boss_warn', boss.key);

    // Burns echo — final-boss approach overlay. "Now's the day, and now's
    // the hour" / "Kings may be blest, but Tam was glorious" couplets in
    // the burns_citation.victory_open sub-pool. Scheduled past the 8 s
    // banter cooldown + a small grace so it lands on a quiet tick after
    // boss_warn (priority 100) has flushed.
    if (boss.key === 'taxman') {
      this.scene.time.delayedCall(9_000, () => {
        this.scene.requestBanter('burns_citation', 'victory_open');
      });
    }

    // The actual spawn work — captured so we can defer it if physics is
    // paused (e.g. level-up modal open) when the 1500ms warning finishes.
    const doSpawn = () => {
      // Idempotency guard: stale/duplicate callbacks must never spawn another
      // instance once this boss key has already been materialized.
      if (this.spawnedBossKeys.has(boss.key)) {
        return;
      }
      const player = this.scene.getPlayer();
      const currentX = player?.x ?? _playerX;
      const currentY = player?.y ?? _playerY;
      const camera = this.scene.cameras.main;
      const pos = this.getSpawnPosition(camera, currentX, currentY);

      const enemy = Enemy.acquireFromPool(this.pool, this.scene);
      if (!enemy) {
        // Pool saturated — retry next unpaused tick (do not consume spawnedBossKeys).
        this.pendingBossSpawns.push(doSpawn);
        return;
      }

      // Bosses default to chase; N1 mythos bosses can override via
      // BossConfig.behaviorOverride (Each-uisge → 'phase' for the
      // shapeshifter blink, Nicnevin → 'spawner' with unseelie_fiddler
      // as the configured minion).
      const bossAsConfig: EnemyConfig = {
        key: boss.key,
        texture: boss.texture,
        speed: boss.speed,
        hp: boss.hp,
        damage: boss.damage,
        xpValue: boss.xpValue,
        appearsAt: 0,
        behavior: boss.behaviorOverride ?? 'chase',
        packSize: 1,
        spawnerMinionKey: boss.spawnerMinionKey,
      };

      // Scale boss HP with game time — keeps bosses challenging as player
      // power grows. bossHpTimeScale() encodes the grace period + ramp.
      const timeScale = bossHpTimeScale(this.gameTimeSec);
      // R1 M4 — stone_of_destiny_shard adds +15% boss HP on top of the
      // time-ramp. Default 1 when the relic isn't held / scene doesn't
      // expose the hook.
      const relicMult = this.scene.getBossHpMultiplier?.() ?? 1;
      if (timeScale > 1 || relicMult !== 1) {
        bossAsConfig.hp = Math.ceil(boss.hp * timeScale * relicMult);
      }

      // Pass gameTimeSec=0 so regular HP_SCALE_PER_MINUTE isn't applied
      // on top — the time scaling above is the boss-specific formula.
      enemy.spawn(pos.x, pos.y, bossAsConfig, 0);
      // setBaseDisplayScale updates the anchor the idle bob wobbles around,
      // so bosses actually breathe now instead of being frozen at base scale.
      enemy.setBaseDisplayScale(boss.scale);
      enemy.setBaseTint(0xff4444);
      enemy.markAsBoss();
      this.bossActive = true;
      this.spawnedBossKeys.add(boss.key);

      if (this.scene.textures.exists('fx_telegraph_stomp')) {
        const stomp = this.scene.add.image(pos.x, pos.y, 'fx_telegraph_stomp')
          .setDepth(10)
          .setAlpha(0.9)
          .setScale(0.8);
        (this.activeBossVfx ??= []).push(stomp);
        this.scene.tweens.add({
          targets: stomp,
          scale: 2.8,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            stomp.destroy();
            if (this.activeBossVfx) this.activeBossVfx = this.activeBossVfx.filter(o => o !== stomp);
          },
        });
      }

      // C1 M2 Task 11 — bosses are beasties too. Skip the `enemy_ambient`
      // path (bosses own their own warning banter) but still seed the
      // DiscoveryLog so the Almanac's Beasties book reveals the sprite
      // on first spawn.
      bumpBeastieSeen(boss.key, this.discoveryRunId, Date.now());

      // Dramatic entrance — camera zoom pulse + shake
      const cam = this.scene.cameras.main;
      tryCameraShake(cam, 400, 0.015, this.settings);

      // Brief zoom-in then back out
      const originalZoom = cam.zoom;
      this.scene.tweens.add({
        targets: cam,
        zoom: originalZoom * 1.15,
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Dark vignette flash — position in camera-viewport coordinates so
      // it centers inside the visible area even when cameras.main.zoom > 1.
      const { x: vx, y: vy, width: vw, height: vh } = this.getUiViewport();
      const vig = this.scene.add.rectangle(vx + vw / 2, vy + vh / 2, vw, vh, 0x000000, 0.3)
        .setScrollFactor(0).setDepth(45);
      (this.activeBossVfx ??= []).push(vig);
      this.scene.tweens.add({
        targets: vig, alpha: 0, duration: 800,
        onComplete: () => {
          vig.destroy();
          if (this.activeBossVfx) this.activeBossVfx = this.activeBossVfx.filter(o => o !== vig);
        },
      });
    };

    // Spawn after the warning fades — use CURRENT player position, not the
    // stale coordinates from 1.5 seconds ago when the warning started.
    // Raw timer lives outside physics/timeScale; if the player is paused
    // mid-level-up, defer the spawn work to the next unpaused update() tick.
    //
    // Stale-run guard: if the run restarts between schedule and fire, the
    // `spawnedBossKeys` Set reference changes. Compare before calling
    // doSpawn so a cross-run callback can't double-spawn a boss.
    const runRef = this.spawnedBossKeys;
    this.scene.getUpdateTickers().addOnce('raw', BALANCE.bossWarning.spawnDelayMs, () => {
      if (this.spawnedBossKeys !== runRef) return;
      if (this.scene.getTimeManager().isGameplayPaused()) {
        this.pendingBossSpawns.push(doSpawn);
      } else {
        doSpawn();
      }
    });
  }

  private showBossWarning(text: string, bossKey: string): void {
    audio.playBossArrival();
    const { x, y, width, height } = this.getUiViewport();
    const settings = this.settings.load();
    // Accessibility: scale font by uiScale, swap palette when high-contrast.
    // Boss warning is a Soul-critical moment — kindness applies here too.
    const baseFontPx = 36;
    const scaledFontPx = Math.round(baseFontPx * settings.uiScale);
    const labelColor = settings.highContrastUi ? '#ffd8d8' : '#ff6644';
    const strokeThickness = settings.highContrastUi ? 6 : 5;

    // Center the warning banner within the VISIBLE camera viewport.
    const cx = x + width / 2;
    const cy = y + height / 2;

    // ── Dramatic entrance worthy of a boss ──
    // Screen-edge vignette darkening (danger is here)
    const vignette = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(149);
    // Dark banner background with red-tinted edges
    const bg = this.scene.add.rectangle(cx, cy, width, 80, 0x0a0000, 0)
      .setScrollFactor(0).setDepth(150);
    // Pulsing red glow line above and below the banner
    const glowTop = this.scene.add.rectangle(cx, cy - 40, width, 2, 0xff4422, 0)
      .setScrollFactor(0).setDepth(150);
    const glowBot = this.scene.add.rectangle(cx, cy + 40, width, 2, 0xff4422, 0)
      .setScrollFactor(0).setDepth(150);
    const propTexture = bossPropTextureKey(bossKey);
    const prop = propTexture && this.scene.textures.exists(propTexture)
      ? this.scene.add.image(
        Math.max(x + 44, cx - Math.min(width * 0.32, 220)),
        cy,
        propTexture,
      ).setScrollFactor(0).setDepth(151).setAlpha(0).setScale(1.15 * settings.uiScale)
      : null;
    const label = this.scene.add.text(cx, cy, text, {
      fontFamily: 'monospace',
      fontSize: `${scaledFontPx}px`,
      color: labelColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152).setAlpha(0);

    const allTargets = prop
      ? [vignette, bg, glowTop, glowBot, prop, label]
      : [vignette, bg, glowTop, glowBot, label];
    (this.activeBossVfx ??= []).push(...allTargets);

    // Vignette darkens the edges
    this.scene.tweens.add({
      targets: vignette, alpha: 0.3, duration: 200,
    });
    // Banner slams in (fast, hard)
    this.scene.tweens.add({
      targets: bg, alpha: 0.8, duration: 150,
    });
    // Text scales from large to normal (impact feel)
    label.setScale(1.3);
    this.scene.tweens.add({
      targets: label, alpha: 1, scale: 1, duration: 250, ease: 'Back.easeOut',
    });
    if (prop) {
      prop.setScale(1.4 * settings.uiScale);
      this.scene.tweens.add({
        targets: prop,
        alpha: 0.95,
        scale: 1.15 * settings.uiScale,
        duration: 260,
        ease: 'Back.easeOut',
      });
    }
    // Red glow lines pulse
    this.scene.tweens.add({
      targets: [glowTop, glowBot], alpha: 0.8, duration: 200,
    });
    this.scene.tweens.add({
      targets: [glowTop, glowBot],
      alpha: { from: 0.8, to: 0.3 },
      duration: 400,
      delay: 200,
      yoyo: true,
      repeat: 1,
    });

    // Hold, then fade everything out
    this.scene.tweens.add({
      targets: allTargets,
      alpha: 0,
      delay: BALANCE.bossWarning.fadeOutDelayMs,
      duration: BALANCE.bossWarning.fadeOutDurationMs,
      onComplete: () => {
        allTargets.forEach(t => t.destroy());
        if (this.activeBossVfx) this.activeBossVfx = this.activeBossVfx.filter(o => !(allTargets as Phaser.GameObjects.GameObject[]).includes(o));
      },
    });
  }

  // ── Regular spawning ──

  private syncWaveDirectorFromTimeline(): void {
    const seg = getActiveWaveTimelineEntry(this.gameTimeSec);
    if (seg === this.lastWaveSeg) return;
    this.lastWaveSeg = seg;
    this.spawnInterval = seg.intervalSec * this.spawnIntervalMult;
    this.burstSize = seg.burstSize;
    this.directorEnemyKeys = [...seg.enemyKeys];
  }

  private getDirectorEnemyConfigs(): EnemyConfig[] {
    return getEnemyConfigsByKeys(this.directorEnemyKeys);
  }

  private beginRunWinFinale(playerX: number, playerY: number): void {
    if (this.runWinFinaleStarted) return;
    this.runWinFinaleStarted = true;
    this.regularSpawnsDisabled = true;

    for (const b of BOSSES) {
      if (b.key !== BALANCE.run.FINAL_BOSS_KEY) {
        this.spawnedBossKeys.add(b.key);
      }
    }

    this.clearNonBossEnemiesForFinale();
    this.clearLingeringNonFinalBossesForFinale();

    const finalBoss = BOSSES.find(b => b.key === BALANCE.run.FINAL_BOSS_KEY);
    if (!finalBoss) return;
    if (this.spawnedBossKeys.has(BALANCE.run.FINAL_BOSS_KEY)) return;

    this.bossSpawnScheduled.add(BALANCE.run.FINAL_BOSS_KEY);
    this.spawnBoss(finalBoss, playerX, playerY);
  }

  /** Removes active non-boss enemies without kill XP (screen wipe for finale). */
  private clearNonBossEnemiesForFinale(): void {
    const enemies = this.pool.getChildren() as Enemy[];
    for (const e of enemies) {
      if (!e.active) continue;
      if (e.isBoss()) continue;
      e.forceKill();
    }
  }

  /**
   * Force-removes any non-final bosses still alive when the finale starts.
   * In normal play, time advances continuously and the player will have
   * already killed mid-run bosses (each_uisge / the_laird / hunter_general)
   * by the time gameTimeSec hits `RUN_WIN_TIME_SEC`. The only way a
   * non-final boss is alive at finale-start is via timeline-skip debug
   * tooling, in which case we want a clean stage for taxman rather than
   * a chaotic two-boss fight that breaks killCurrentBoss determinism.
   * Uses `forceKill` (no XP / drops) so dev-skip flows don't gift the
   * player extra rewards.
   */
  private clearLingeringNonFinalBossesForFinale(): void {
    const enemies = this.pool.getChildren() as Enemy[];
    for (const e of enemies) {
      if (!e.active || !e.isBoss()) continue;
      if (e.getEnemyKey() === BALANCE.run.FINAL_BOSS_KEY) continue;
      e.forceKill();
    }
    this.bossActive = false;
  }

  private spawnBurst(playerX: number, playerY: number): void {
    if (this.regularSpawnsDisabled) return;
    if (this.gameTimeSec < this.spawnsPausedUntilGameSec) return;
    const availableTypes = this.getDirectorEnemyConfigs();
    if (availableTypes.length === 0) return;

    const camera = this.scene.cameras.main;

    for (let i = 0; i < this.burstSize; i++) {
      const config = this.pickWeightedEnemy(availableTypes);
      const pos = this.getSpawnPosition(camera, playerX, playerY);

      const count = config.packSize || 1;
      const rng = this.scene.getRunRng();
      for (let j = 0; j < count; j++) {
        const enemy = Enemy.acquireFromPool(this.pool, this.scene);
        if (!enemy) continue;
        // Pack scatter is a visual feel detail, but it's tied to enemy spawn
        // position which affects gameplay (aggro distances). Seed it.
        const scatter = j > 0 ? rng.int(-30, 30) : 0;
        enemy.spawn(pos.x + scatter, pos.y + scatter, config, this.gameTimeSec);

        // Post-Bell escalation — applied after spawn so it stacks on top of
        // the standard time-based HP scale instead of replacing it.
        const pb = this.getPostBellMultipliers();
        if (pb.enemyHpMul !== 1 || pb.enemySpeedMul !== 1) {
          enemy.applyPostBellScaling(pb.enemyHpMul, pb.enemySpeedMul);
        }
        // W2 Moor Road: run-scoped HP multiplier (buckie_pitstop +10%).
        if (this.enemyHpMultiplier !== 1) {
          enemy.applyPostBellScaling(this.enemyHpMultiplier, 1);
        }

        // Elite chance — base from BalanceConfig + kill-pressure nudge (decays),
        // then tilted by the run-scoped W2 route weight and capped at 24%.
        // R1 M4 — highland_torque relic adds a further *1.2 multiplier on
        // top (clamped to [0, 1]) so elite-hunter builds get even heavier
        // elite flow.
        const baseEliteChance = resolveEliteChance(this.killPressure, this.eliteWeightMultiplier);
        const relicEliteMult = this.scene.getEliteSpawnMultiplier?.() ?? 1;
        // Phase B Endless — bonusEliteSlots tilts the per-spawn elite
        // roll upward instead of opening a separate slot pipeline; +25% per
        // bonus slot keeps the curve readable and clamps at 1.0 anyway.
        const postBellEliteTilt = 1 + pb.bonusEliteSlots * 0.25;
        const eliteChance = Math.min(1, baseEliteChance * relicEliteMult * postBellEliteTilt);
        if (this.gameTimeSec > BALANCE.enemy.ELITE_UNLOCK_SEC
            && config.behavior !== 'hazard'
            && config.packSize <= 1
            && rng.bool(eliteChance)) {
          enemy.markAsElite();
          const affix = pickEliteAffixId(config.behavior, rng);
          if (affix) enemy.applyEliteAffix(affix);
          const flashTint = affix ? ELITE_AFFIXES[affix].indicatorTint : 0xffdd44;
          const flash = this.scene.getStatusFxPool().acquireArc(pos.x + scatter, pos.y + scatter, 15, flashTint, 0.55);
          this.scene.tweens.add({
            targets: flash, scale: 2, alpha: 0, duration: 400,
            onComplete: () => { flash.setVisible(false); },
          });
        }

        // Phase B Endless — Cursed variant. Pure helper consumes the seeded
        // RNG so a replay reproduces the same cursed population. Cursed
        // does not stack on elite, hazards, or pack spawns; eligibility
        // lives in shouldMarkCursed.
        if (shouldMarkCursed({
          cursedChance: pb.cursedChance,
          isElite: enemy.isElite(),
          behavior: config.behavior,
          packSize: config.packSize,
          rng01: rng.next(),
        })) {
          enemy.markAsCursed();
          // Soft purple pop on the spawn point — quieter than the elite
          // gold flash so the two cues stay readable side by side.
          const cursedFlash = this.scene.getStatusFxPool().acquireArc(
            pos.x + scatter, pos.y + scatter, 13, 0xaa66dd, 0.4,
          );
          this.scene.tweens.add({
            targets: cursedFlash, scale: 1.6, alpha: 0, duration: 360,
            onComplete: () => { cursedFlash.setVisible(false); },
          });
        }
      }

      // Ambient banter hook — fires once per enemy *type* in the burst
      // (not per pack member), since pack members share the same key
      // and we already only want one request per context per tick anyway.
      this.notifyEnemyAmbient(config);
    }
  }

  private getSpawnPosition(
    camera: Phaser.Cameras.Scene2D.Camera,
    playerX: number,
    playerY: number
  ): { x: number; y: number } {
    const buffer = ENEMIES.SPAWN_BUFFER;
    const z = Math.max(0.001, camera.zoom);
    const halfW = camera.width / (2 * z);
    const halfH = camera.height / (2 * z);

    const left = playerX - halfW - buffer;
    const right = playerX + halfW + buffer;
    const top = playerY - halfH - buffer;
    const bottom = playerY + halfH + buffer;

    // Spawn edge + position via seeded RNG — enemies appear from the same
    // compass directions at the same moments for a given seed, which is the
    // bulk of what makes a run "replayable" in the Balatro sense.
    const rng = this.scene.getRunRng();
    const edge = rng.int(0, 3);
    let x: number, y: number;

    switch (edge) {
      case 0: x = rng.float(left, right); y = top; break;
      case 1: x = rng.float(left, right); y = bottom; break;
      case 2: x = left; y = rng.float(top, bottom); break;
      default: x = right; y = rng.float(top, bottom); break;
    }

    x = Phaser.Math.Clamp(x, 0, GAME.WORLD_WIDTH);
    y = Phaser.Math.Clamp(y, 0, GAME.WORLD_HEIGHT);

    // If clamping pushed the position inside the visible area (player near world edge),
    // push it to the nearest world edge so enemies don't pop in on-screen.
    const inViewX = Math.abs(x - playerX) < halfW;
    const inViewY = Math.abs(y - playerY) < halfH;
    if (inViewX && inViewY) {
      const snapped = snapToNearestWorldEdge(x, y, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);
      x = snapped.x;
      y = snapped.y;
    }

    return { x, y };
  }

  /** Pick an enemy type weighted by game time — newer enemies spawn more often.
   *  Biome modifiers (from the player's current region) multiply the base weights. */
  private pickWeightedEnemy(types: EnemyConfig[]): EnemyConfig {
    const biomeMods = this.getBiomeWeightMods();
    let totalWeight = 0;
    for (const t of types) {
      totalWeight += getSpawnWeight(t, this.gameTimeSec) * (biomeMods[t.key] ?? 1);
    }

    // Seeded so the same wave composition appears for a given seed.
    let roll = this.scene.getRunRng().next() * totalWeight;
    for (const t of types) {
      roll -= getSpawnWeight(t, this.gameTimeSec) * (biomeMods[t.key] ?? 1);
      if (roll <= 0) return t;
    }
    return types[types.length - 1];
  }

  /** Biome-driven spawn weight multipliers for the player's current biome.
   *  Returns an empty object when no biome is active (e.g., during tests). */
  private getBiomeWeightMods(): Readonly<Record<string, number>> {
    const id = this.scene.getCurrentBiomeId?.();
    if (!id) return {};
    return BIOMES[id].spawnWeightMods;
  }

  /** Post-Bell escalation multipliers, or neutral when the run hasn't crossed
   *  the Bell yet / the scene doesn't expose the hook (e.g., unit tests). */
  private getPostBellMultipliers(): PostBellMultipliers {
    const sec = this.scene.getSecondsPastBell();
    if (sec === undefined || sec <= 0) return NEUTRAL_POST_BELL;
    return computePostBellMultipliers(sec);
  }

  getEnemyGroup(): Phaser.GameObjects.Group { return this.pool; }
  getActiveCount(): number { return this.pool.countActive(true); }
  getGameTimeSec(): number { return this.gameTimeSec; }
  getSpawnTimerSec(): number { return this.spawnTimer; }
  getSpawnIntervalSec(): number { return this.spawnInterval; }
  getBurstSize(): number { return this.burstSize; }
  getSpawnedBossCount(): number { return this.spawnedBossKeys.size; }
  getBossScheduledCount(): number { return this.bossSpawnScheduled.size; }

  isBossActive(): boolean {
    const frame = Math.floor(this.gameTimeSec * 60);
    if (frame === this.bossCheckFrame) return this.bossActive;
    this.bossCheckFrame = frame;
    if (!this.bossActive) return false;
    const active = this.pool.getChildren() as Enemy[];
    let found = false;
    for (let i = 0; i < active.length; i++) {
      if (active[i].active && (active[i] as Enemy).isBoss()) { found = true; break; }
    }
    this.bossActive = found;
    return this.bossActive;
  }

  /**
   * Look up the live boss Enemy with the given key, or null if no
   * matching boss is currently active. Walks the enemy pool — call
   * sites should cache the result per frame, not per gem.
   *
   * Used by N1 Nicnevin's Wild Hunt controller to read her position
   * each frame for the gem-pull magnet target.
   */
  getActiveBossByKey(key: string): Enemy | null {
    if (!this.bossActive) return null;
    const active = this.pool.getChildren() as Enemy[];
    for (let i = 0; i < active.length; i++) {
      const e = active[i];
      if (!e.active || !e.isBoss()) continue;
      if (e.getEnemyKey() === key) return e;
    }
    return null;
  }

  /**
   * Why regular spawn bursts are not executing *right now* (telemetry).
   * Priority: PAUSED → RUN_FINALE → POOL_SATURATED → INTERVAL_WAIT → NO_TYPES_AVAILABLE.
   * Boss intro / active boss do not gate regular waves — omit from this signal.
   * Returns null when the director would fire a burst on the next evaluation (timer satisfied, types exist, pool has capacity).
   */
  getSpawnStallReason(): SpawnStallReason | null {
    const tm = this.scene.getTimeManager();
    if (tm.isGameplayPaused()) return 'PAUSED';
    if (this.regularSpawnsDisabled) return 'RUN_FINALE';
    if (this.pool.countActive(true) >= ENEMIES.MAX_ACTIVE) return 'POOL_SATURATED';
    if (this.spawnTimer < this.spawnInterval) return 'INTERVAL_WAIT';
    if (this.getDirectorEnemyConfigs().length === 0) return 'NO_TYPES_AVAILABLE';
    return null;
  }

  /**
   * Dev tooling: snap the run clock and refresh the wave director (no boss bookkeeping).
   * Use `applyResumeTime` when restoring a saved run.
   */
  timeTravelToSeconds(sec: number): void {
    this.gameTimeSec = Math.max(0, sec);
    this.syncWaveDirectorFromTimeline();
    this.spawnTimer = Math.min(this.spawnTimer, this.spawnInterval);
  }

  /**
   * Mid-run resume: clock + director + suppress boss intros that are already in the past.
   */
  applyResumeTime(sec: number, spawnedBossKeys?: string[]): void {
    this.gameTimeSec = Math.max(0, sec);
    this.syncWaveDirectorFromTimeline();
    this.spawnTimer = 0;
    this.spawnedBossKeys.clear();
    this.bossSpawnScheduled.clear();
    if (spawnedBossKeys !== undefined) {
      const validBossKeys = new Set(BOSSES.map((b) => b.key));
      for (const key of spawnedBossKeys) {
        if (validBossKeys.has(key)) this.spawnedBossKeys.add(key);
      }
    } else {
      for (const b of BOSSES) {
        // V2 — manualSpawn bosses (Cailleach Gauntlet) have negative
        // spawnTimeSec sentinels; never seed them as "already spawned"
        // on resume.
        if (b.manualSpawn) continue;
        if (b.spawnTimeSec <= sec) this.spawnedBossKeys.add(b.key);
      }
    }
    if (sec >= BALANCE.run.RUN_WIN_TIME_SEC) {
      this.runWinFinaleStarted = true;
      this.regularSpawnsDisabled = true;
      for (const b of BOSSES) {
        if (b.manualSpawn) continue;
        if (b.key !== BALANCE.run.FINAL_BOSS_KEY) {
          this.spawnedBossKeys.add(b.key);
        }
      }
    }
  }

  getSpawnedBossKeys(): string[] {
    return [...this.spawnedBossKeys];
  }

  /** Called when the player scores a kill — feeds short-lived elite pressure. */
  noteKillPressure(): void {
    this.killPressure = Math.min(1, this.killPressure + BALANCE.director.killPressurePerKill);
  }
}
