/**
 * Post-pause world+entity tick body of `GameScene.updateInner`.
 *
 * Pulled from the slab between `tickFrameHeader` returning `continue`
 * and the pre-existing `tickPresentationFrame` / `updateRunHudFrame`
 * helper calls. Covers:
 *
 *   - death-cause classifier health pointer
 *   - hazardZones / haar fog
 *   - biome controller tick + post-bell reseed (3-min cadence past
 *     the Bodach Glas bell — mutates `postBellLastReseedSec`)
 *   - flora / wildlife / mist scatter updates
 *   - low-hp + banter cadence
 *   - player input + regen + mantle pulse + spawn system
 *   - node-map proximity + UI + marker tick
 *   - second-counter hook (mutates `lastEmittedRunSecond`)
 *   - standing stones / reliquary / relic-effect frame
 *   - ancestral echo tick (nulls ref on resolve)
 *   - weapon facing + multiplier fold + weapon update
 *   - relic-orchestrator Fianna spirit sweep
 *   - XP / juice / weather / hazards
 *
 * Three pieces of state mutate via setters: `postBellLastReseedSec`,
 * `lastEmittedRunSecond`, `ancestralEcho`. Everything else routes
 * through method calls on the live system refs.
 *
 * Determinism contract: tick order is preserved one-for-one. Player
 * input/movement stays on RAW delta so controls remain snappy during
 * boss-kill slow-motion (the cinematic shouldn't rob the player of
 * responsiveness); game-time systems use `scaledDelta` so regen, AI,
 * spawns, cooldowns, and projectile TTLs slow in lockstep with the
 * visible time-scale. Juice / weather / hazards keep raw delta — see
 * the inline comments below for the rationale per concern.
 *
 * No Phaser imports — `cameras.main` is exposed via a `getMainCamera`
 * getter so the helper avoids `Phaser.Cameras.Scene2D.Camera` typing.
 * `runeBag` and `burnsPlatterPickedUpAtMs` are read at tick time so
 * mid-run mutations land on the next tick.
 */
import type Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { HazardZones } from './HazardZones';
import type { HazardsSystem } from '../../systems/HazardsSystem';
import type { AmbientWeatherSystem } from '../../systems/AmbientWeatherSystem';
import type { HaarFogController } from '../../systems/shaders/HaarFogController';
import type { BiomeController } from './BiomeController';
import type { BiomeManager } from '../../systems/BiomeManager';
import type { Minimap } from '../../ui/Minimap';
import type { FloraScatter } from '../../systems/FloraScatter';
import type { WildlifeSystem } from '../../systems/WildlifeSystem';
import type { MistLayer } from '../../systems/MistLayer';
import type { GameTickers } from './GameTickers';
import type { NodeMapSystem } from '../../systems/NodeMapSystem';
import type { NodeMarkerSystem } from '../../systems/NodeMarkerSystem';
import type { NodeMapUI } from '../../ui/NodeMapUI';
import type { RunActState } from './RunActState';
import type { RunLifecycle } from './RunLifecycle';
import type { StandingStones } from './standingStones';
import type { Reliquary } from './reliquary';
import type { ClootieTree } from './clootieTree';
import type { LemmingsEasterEgg } from './lemmingsEasterEgg';
import type { AncestralEcho } from './ancestralEcho';
import type { CairnOfEchoesScheduler } from './CairnOfEchoesScheduler';
import type { RelicSlotUI } from '../../ui/RelicSlotUI';
import type { RelicOrchestrator } from './RelicOrchestrator';
import type { RNG } from '../../utils/rng';
import type { RuneEffectBag } from '../../systems/runes/runeEffects';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import type { NicnevinWildHuntController } from './NicnevinWildHuntController';
import type { SecondTickHookContext } from './runtimeTickHooks';
import { tickMantlePulse, tickRelicEffectFrame, tickSecondCounter } from './runtimeTickHooks';
import { applyWeaponMultiplierFold } from './weaponMultiplierFold';
import { shouldReseedAtSec } from '../../systems/biomeReseedSchedule';
import { GAME } from '../../config';
import { t } from '../../core/i18n';

export interface TickFrameWorldDeps {
  // ── always-live system refs ────────────────────────────────────────
  deathCauseTracker: DeathCauseTracker;
  /** Constructed in `installHazardZones`; non-null in active runs. */
  hazardZones: HazardZones;
  /** Lazy — null between runs. */
  getHaarFog: () => HaarFogController | null;
  /** Lazy — destroyed + nulled between runs. */
  getBiomeController: () => BiomeController | null;
  /** Lazy — null until `installRunFlow` lands. */
  getRunLifecycle: () => RunLifecycle | null;
  /** Constructed lazily after first scatter install. */
  getFloraScatter: () => FloraScatter | null;
  getWildlifeSystem: () => WildlifeSystem | null;
  getMistLayer: () => MistLayer | null;
  /** Constructed in `installRuntimeAmbient`. */
  gameTickers: GameTickers;
  /** Lazy — null until `installRuntimeAmbient` lands. */
  getWeather: () => AmbientWeatherSystem | null;
  /** Lazy — null until `installRuntimeAmbient` lands. */
  getHazards: () => HazardsSystem | null;
  player: Player;
  juice: JuiceSystem;
  spawnSystem: SpawnSystem;
  nodeMapSystem: NodeMapSystem;
  nodeMarkerSystem: NodeMarkerSystem;
  /** Lazy — node-map UI rebuilt across resets. */
  getNodeMapUI: () => NodeMapUI | null;
  runActState: RunActState;
  /** Lazy — destroyed + nulled between runs. */
  getStandingStones: () => StandingStones | null;
  getReliquary: () => Reliquary | null;
  getClootieTree: () => ClootieTree | null;
  /** Lemmings Easter Egg orchestrator (DESIGN_IDEAS §13). Lazy — null
   *  between runs / before the in-line ctor in GameScene.create() runs. */
  getLemmingsEasterEgg: () => LemmingsEasterEgg | null;
  getAncestralEcho: () => AncestralEcho | null;
  /** Setter for the `null` write when the ancestral echo resolves. */
  setAncestralEcho: (v: AncestralEcho | null) => void;
  /**
   * The Moor Remembers — persistent cross-run cairn scheduler. Ticked
   * once per frame here so culling + walk-over detection sit inside
   * the post-pause-gate window per CLAUDE.md new-mechanic safety
   * pattern (d). Null between runs and during early scene boot.
   */
  getCairnOfEchoesScheduler: () => CairnOfEchoesScheduler | null;
  /** Lazy — destroyed + nulled between runs. */
  getRelicSlotUI: () => RelicSlotUI | null;
  /** Driver lives on the orchestrator (non-null in active runs) and is
   *  rebuilt per run via `RelicOrchestrator.resetForNewRun`. */
  getRelicEffectDriver: () => RelicEffectDriver;
  relicOrchestrator: RelicOrchestrator;
  weaponSystem: WeaponSystem;
  xpSystem: XPSystem;
  /** N1 Tier-2 mythos boss #2 — Wild Hunt controller. Null between
   *  runs / before installRunStartupHud has run. */
  getNicnevinWildHunt: () => NicnevinWildHuntController | null;
  /** Lazy — bag rebuilt per run. */
  getRuneBag: () => RuneEffectBag;
  /** Lazy — null until Burns platter is picked up. */
  getBurnsPlatterPickedUpAtMs: () => number | null;
  /** Lazy — minimap rebuilt across resets; null until first install. */
  getMinimap: () => Minimap | null;
  /** Live RNG access — branched per run. */
  getRunRng: () => RNG;
  /** Live biome manager access — rebuilt across resets. */
  getBiomeManager: () => BiomeManager | null;
  /** Wall-clock now (ms) — `scene.time.now`. */
  getTimeNowMs: () => number;
  /** Camera ref for the flora scatter. Caller passes
   *  `() => scene.cameras.main`. */
  getMainCamera: () => Phaser.Cameras.Scene2D.Camera;
  /** Built fresh by GameScene. Resolved at tick time so any newly-
   *  added context fields land without a re-wire. */
  getSecondTickContext: () => SecondTickHookContext;

  // ── mutation pointers ──────────────────────────────────────────────
  getPostBellLastReseedSec: () => number;
  setPostBellLastReseedSec: (v: number) => void;
  getLastEmittedRunSecond: () => number;
  setLastEmittedRunSecond: (v: number) => void;

  // ── reseed callback (`biomeController.reseed` needs the scene) ────
  /** Caller binds this to `() => biomeController.reseed(this, getRunRng(),
   *  WORLD_WIDTH, WORLD_HEIGHT)` so the helper avoids a Phaser scene ref. */
  reseedBiome: () => void;
}

/**
 * Tick the world+entity layer for one frame. Caller has already
 * resolved the pause-gate via `tickFrameHeader`; `scaledDelta` is the
 * gameplay-paced slice it returned.
 */
export function tickFrameWorld(deps: TickFrameWorldDeps, delta: number, scaledDelta: number): void {
  // Advance the "last time player was healthy" pointer — feeds the
  // low_hp_neglect classifier. Only tracks game-time, not wall-clock, so
  // a long pause doesn't incorrectly age the player's health state.
  deps.deathCauseTracker.tickHealthyPointer(
    deps.spawnSystem.getGameTimeSec(),
    deps.player.getHp(),
    deps.player.getMaxHp(),
  );

  deps.hazardZones.tick(scaledDelta);
  const haarFog = deps.getHaarFog();
  if (haarFog) haarFog.advanceTime(delta * 0.001);
  const biomeController = deps.getBiomeController();
  if (biomeController) {
    biomeController.tick(deps.player, deps.juice);
    // Phase B Endless — fresh voronoi every 3 min past the bell so
    // the world keeps shifting under a player who refuses to leave.
    const sec = deps.getRunLifecycle()?.getSecondsPastBell() ?? 0;
    if (sec > 0) {
      let lastReseed = deps.getPostBellLastReseedSec();
      if (lastReseed < 0) {
        lastReseed = 0;
        deps.setPostBellLastReseedSec(0);
      }
      if (shouldReseedAtSec(sec, lastReseed)) {
        deps.setPostBellLastReseedSec(sec);
        deps.reseedBiome();
        deps.getMinimap()?.setBiomeManager(deps.getBiomeManager());
        deps.juice.showToast(t('ui.gameOver.post_bell_reseed'), '#aa66dd');
      }
    }
  }
  deps.getFloraScatter()?.update(scaledDelta, deps.getMainCamera());
  deps.getWildlifeSystem()?.update(scaledDelta, deps.player.x, deps.player.y);
  deps.getMistLayer()?.update(scaledDelta, GAME.WORLD_WIDTH);
  deps.gameTickers.tickLowHpCaption();
  deps.gameTickers.tickBanter();
  // Player input/movement stays on raw delta so controls stay snappy during
  // boss-kill slow-motion (the cinematic effect shouldn't rob the player of
  // responsiveness). Game-time systems below use scaledDelta so regen, AI,
  // spawns, cooldowns, and projectile TTLs all slow in lockstep with the
  // visible time-scale.
  deps.player.update(delta);
  deps.player.tickRegen(scaledDelta);
  tickMantlePulse(deps.player, deps.spawnSystem, scaledDelta);
  deps.spawnSystem.update(scaledDelta, deps.player.x, deps.player.y);

  // M1 — tick node proximity + refresh HUD widget. Tick fires listener
  // while player is within trigger radius of an un-visited node; the
  // registered listener marks visited + logs outcome + advances cursor.
  deps.nodeMapSystem.tick({ x: deps.player.x, y: deps.player.y });
  deps.getNodeMapUI()?.update(
    deps.runActState.currentActNodeMap,
    deps.runActState.currentNodeIndex,
  );
  deps.nodeMarkerSystem.update(deps.runActState.currentNodeIndex, scaledDelta);

  deps.setLastEmittedRunSecond(
    tickSecondCounter(deps.getSecondTickContext(), deps.getLastEmittedRunSecond()),
  );

  deps.getStandingStones()?.tick();
  deps.getReliquary()?.tick();
  deps.getClootieTree()?.tick();
  // Lemmings Easter Egg (DESIGN_IDEAS §13) — once-per-variant cliff-edge
  // parade trigger. Drives off scaledDelta so paused frames don't tick
  // toward the 90 s threshold (a pause-menu camp must not earn the
  // joke). Cosmetic only; the orchestrator handles the parade tweens
  // internally via Phaser's scene tween manager.
  deps.getLemmingsEasterEgg()?.tick(scaledDelta);
  tickRelicEffectFrame({
    scaledDelta,
    player: deps.player,
    relicEffectDriver: deps.getRelicEffectDriver(),
    relicSlotUI: deps.getRelicSlotUI(),
  });

  const echo = deps.getAncestralEcho();
  if (echo) {
    const resolved = echo.tick(scaledDelta);
    if (resolved) deps.setAncestralEcho(null);
  }

  // The Moor Remembers (spec 2026-05-22) — tick the persistent cairn
  // scheduler. Sits after the pause-gate (handled by the outer caller)
  // per CLAUDE.md new-mechanic safety pattern (d). The scheduler's
  // walk-over detection is once-per-cairn-per-run; sprite culling is
  // per-frame (cheap O(n) over loaded cairns ≤ 50). Minimap markers
  // are refreshed inline so the dim-slate pixels track FIFO rotation
  // mid-run when a fresh cairn settles via `addCairn`.
  const cairnSched = deps.getCairnOfEchoesScheduler();
  if (cairnSched) {
    cairnSched.tick(scaledDelta, deps.player.x, deps.player.y);
    const mm = deps.getMinimap();
    if (mm) mm.cairnMarkers = cairnSched.getMinimapMarkers();
  }

  // Pass player facing — own concern, kept out of the multiplier fold.
  // Always read from `player.rotation` (persists when stationary) so
  // directional weapons like arc_sweep don't use a stale angle.
  deps.weaponSystem.setPlayerFacing(deps.player.rotation - Math.PI / 2);
  // DESIGN_IDEAS §5 — Stag Antler dash-strike trigger reads these
  // each frame; the rising edge of `isDashing` (gated by a per-
  // weapon cooldown) fires the bonus arc. Kept here next to
  // `setPlayerFacing` because both are weapon-system reads of the
  // live player state, neither belonging in the multiplier fold.
  deps.weaponSystem.setPlayerDashState(
    deps.player.getIsDashing(),
    deps.player.getDashFacingAngle(),
  );
  applyWeaponMultiplierFold({
    player: deps.player,
    juice: deps.juice,
    weaponSystem: deps.weaponSystem,
    runeBag: deps.getRuneBag(),
    relicEffectDriver: deps.getRelicEffectDriver(),
    timeNowMs: deps.getTimeNowMs(),
    burnsPlatterPickedUpAtMs: deps.getBurnsPlatterPickedUpAtMs(),
  });
  deps.weaponSystem.update(scaledDelta, deps.player.x, deps.player.y);

  // R1 M4.5 P5 — tick live Fianna summons + sweep expired. Use
  // scaledDelta so slow-mo shortens the spirits' effective lifetime
  // in lockstep with every other timed effect.
  deps.relicOrchestrator.tickFiannaSpirits(scaledDelta);

  // N1 Wild Hunt — tick BEFORE xpSystem.update so the override pin
  // (or its release) is reflected on the same frame's gem magnet pass.
  // Reads Nicnevin's live position via SpawnSystem.getActiveBossByKey;
  // null = no active Nicnevin (cycle force-resets to idle on next tick).
  const wildHunt = deps.getNicnevinWildHunt();
  if (wildHunt) {
    const nicnevin = deps.spawnSystem.getActiveBossByKey('nicnevin');
    wildHunt.tick(scaledDelta, {
      bossX: nicnevin?.x ?? 0,
      bossY: nicnevin?.y ?? 0,
      bossActive: !!nicnevin,
    });
  }

  deps.xpSystem.update(deps.player.x, deps.player.y, deps.player.getPickupRadius(), deps.player.getHpFraction());
  // Juice is cosmetic (shake, combo toasts, damage numbers) — stays on raw
  // delta so VFX don't stall during slow-mo and the combo meter still decays
  // at wall-clock rate.
  deps.juice.update(delta, deps.player.getHpFraction());
  // Ambient weather likewise stays on raw delta — sky is sky.
  deps.getWeather()?.update(delta);
  // Hazards run on raw delta too — environment is environment.
  deps.getHazards()?.update(delta);
}
