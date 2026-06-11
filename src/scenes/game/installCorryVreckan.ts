/**
 * Corryvreckan Encounter — scene wire (DESIGN_IDEAS §3).
 *
 * The Cailleach's washing-pot: a hazard-arena encounter that fires once
 * per run in the corryvreckan biome past the 90 s threshold. Extracted
 * from GameScene to stay under the 2200-LOC ceiling (same pattern as
 * `installCailleachGauntlet`).
 *
 * Owns:
 *   - State machine advancement via `advanceCorryVreckan` each frame.
 *   - Whirlpool Graphics visual (3 concentric arc-rings, spinning tween).
 *   - Per-frame pull force applied to the player and nearby enemies.
 *   - Phase-transition side-effects: toast, banter, chest spawn, HP damage.
 *   - Teardown (destroy visuals + stop tween).
 *
 * Spawn position: pre-computed using seeded runRng at install time, cached
 * for the lifecycle of the encounter. Deterministic for T1 replay.
 *
 * Ref: SCOTTISH_RESEARCH.md §1.8; corryVreckanEncounter.ts (state machine).
 */
import * as Phaser from 'phaser';
import {
  advanceCorryVreckan,
  computeWhirlpoolPull,
  initialCorryVreckanState,
  CORRYVRECKAN_INNER_RADIUS,
  CORRYVRECKAN_OUTER_RADIUS,
  CORRYVRECKAN_WARN_PULL_MUL,
  type CorryVreckanState,
} from './corryVreckanEncounter';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { RNG } from '../../utils/rng';
import { t } from '../../core/i18n';

// ── Visual constants ──────────────────────────────────────────────────────────

const RING_OUTER_ALPHA = 0.18;
const RING_MID_ALPHA   = 0.32;
const RING_INNER_ALPHA = 0.55;
const RING_CORE_ALPHA  = 0.75;

/** Deep Atlantic sea-green for the outer pull halo. */
const COLOR_HALO  = 0x0a3848;
/** Stormy blue-grey middle ring. */
const COLOR_MID   = 0x1a5068;
/** Pale sea-foam for the inner danger ring. */
const COLOR_INNER = 0x40a8c0;
/** Near-white centre vortex — Cailleach's washing lather. */
const COLOR_CORE  = 0xc8eaf0;

/** Enemy pull at 40 % of player strength — drawn in but more slowly. */
const ENEMY_PULL_MUL = 0.40;

/** Spin speed during warning phase (radians/s). */
const SPIN_WARN_RAD_S = 0.6;
/** Spin speed during active phase. */
const SPIN_ACTIVE_RAD_S = 1.4;

// ── Public API ────────────────────────────────────────────────────────────────

export interface CorryVreckanInstall {
  /** Per-frame tick. Pass `scaledDelta` (ms, already scaled by timeScale). */
  tick(scaledDelta: number): void;
  getState(): CorryVreckanState;
  teardown(): void;
}

export interface CorryVreckanInstallDeps {
  readonly scene: Phaser.Scene;
  readonly getPlayer: () => Player | null;
  readonly getSpawnSystem: () => SpawnSystem;
  readonly getJuice: () => JuiceSystem;
  readonly getBanter: () => BanterSystem | null;
  readonly getCurrentBiomeId: () => string | null;
  readonly getGameTimeSec: () => number;
  readonly getRunRng: () => RNG;
  /** Called when the player survives — caller spawns a golden chest. */
  readonly onSurvived: () => void;
  /**
   * Called when the player enters the inner radius. Caller deals
   * `Math.floor(player.getMaxHp() * 0.35)` damage.
   */
  readonly onFailed: () => void;
}

// ── Install ───────────────────────────────────────────────────────────────────

export function installCorryVreckan(
  deps: CorryVreckanInstallDeps,
): CorryVreckanInstall {
  let state: CorryVreckanState = initialCorryVreckanState();

  // Pre-compute spawn position using seeded runRng (deterministic replay).
  const rng = deps.getRunRng();
  const spawnAngle = rng.float(0, Math.PI * 2);
  const spawnDist  = 240 + rng.int(0, 100);
  // Actual world coords resolved at trigger time from player position —
  // stored as offsets; snapped into absolute coords on the idle→warning edge.
  const spawnOffsetX = Math.cos(spawnAngle) * spawnDist;
  const spawnOffsetY = Math.sin(spawnAngle) * spawnDist;

  // Visuals — created lazily when the encounter enters 'warning'.
  let rings: Phaser.GameObjects.Graphics | null = null;
  let dangerRing: Phaser.GameObjects.Graphics | null = null;
  let spinTween: Phaser.Tweens.Tween | null = null;
  let spinAngle = 0;

  // ── Visual creation ────────────────────────────────────────────────────────

  function spawnVisuals(wx: number, wy: number): void {
    if (rings) return; // Guard against double-spawn.

    // Outer/mid/inner arc-rings on a single Graphics object (rotated together).
    rings = deps.scene.add.graphics();
    rings.setDepth(2); // Below player (depth 5), above floor (depth 0).
    drawRings(rings, wx, wy);

    // Inner danger ring — separate object, doesn't spin (steady pulse).
    dangerRing = deps.scene.add.graphics();
    dangerRing.setDepth(3);
    drawDangerRing(dangerRing, wx, wy);

    // Breathe-pulse tween on the danger ring alpha.
    deps.scene.tweens.add({
      targets: dangerRing,
      alpha: { from: 0.6, to: 1.0 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  function drawRings(g: Phaser.GameObjects.Graphics, wx: number, wy: number): void {
    // Three concentric spiral arcs — drawn as thick filled circles with gaps
    // (simulated with overlapping arcs at different start angles).
    // Outer halo
    g.fillStyle(COLOR_HALO, RING_OUTER_ALPHA);
    g.fillCircle(wx, wy, CORRYVRECKAN_OUTER_RADIUS);

    // Erase the non-halo interior with a subtracted fill (draw over with
    // slightly smaller transparent circle — Phaser Graphics composites in
    // order, so we layer dark fill then lighter inner).
    g.fillStyle(COLOR_MID, RING_MID_ALPHA);
    g.fillCircle(wx, wy, CORRYVRECKAN_OUTER_RADIUS * 0.62);

    g.fillStyle(COLOR_INNER, RING_INNER_ALPHA);
    g.fillCircle(wx, wy, CORRYVRECKAN_OUTER_RADIUS * 0.35);

    g.fillStyle(COLOR_CORE, RING_CORE_ALPHA);
    g.fillCircle(wx, wy, CORRYVRECKAN_OUTER_RADIUS * 0.14);

    // Spiral arms: 3 thin arcs at 120° intervals.
    for (let i = 0; i < 3; i++) {
      const arcStart = (i / 3) * Math.PI * 2;
      const arcEnd   = arcStart + Math.PI * 0.6; // 108° arc
      g.lineStyle(6, COLOR_INNER, 0.65);
      g.beginPath();
      g.arc(wx, wy, CORRYVRECKAN_OUTER_RADIUS * 0.52, arcStart, arcEnd, false);
      g.strokePath();

      g.lineStyle(4, COLOR_CORE, 0.50);
      g.beginPath();
      g.arc(wx, wy, CORRYVRECKAN_OUTER_RADIUS * 0.25, arcStart + 0.4, arcEnd + 0.4, false);
      g.strokePath();
    }
  }

  function drawDangerRing(g: Phaser.GameObjects.Graphics, wx: number, wy: number): void {
    // Solid danger circle at inner radius.
    g.fillStyle(0xff4040, 0.28);
    g.fillCircle(wx, wy, CORRYVRECKAN_INNER_RADIUS);
    g.lineStyle(2, 0xff8080, 0.85);
    g.strokeCircle(wx, wy, CORRYVRECKAN_INNER_RADIUS);
  }

  function destroyVisuals(): void {
    spinTween?.stop();
    spinTween = null;
    rings?.destroy();
    rings = null;
    dangerRing?.destroy();
    dangerRing = null;
  }

  // ── Phase-transition effects ───────────────────────────────────────────────

  function onWarningStart(wx: number, wy: number): void {
    spawnVisuals(wx, wy);
    deps.getJuice().showToast(t('ui.banter.corryvreckan_warn.toast'), '#3a7088');
    deps.getBanter()?.request('corryvreckan_warn', {});
  }

  function onActiveStart(): void {
    // Speed up the spin.
    deps.getJuice().flashWhite(40);
  }

  function onSurvived(wx: number, wy: number): void {
    deps.getJuice().showMoorMomentBurst(wx, wy);
    deps.getJuice().flashWhite(80);
    deps.getBanter()?.request('corryvreckan_survived', {});
    deps.onSurvived();
    destroyVisuals();
  }

  function onFailed(): void {
    deps.getJuice().flashWhite(200);
    deps.onFailed();
    destroyVisuals();
  }

  // ── Per-frame tick ─────────────────────────────────────────────────────────

  function tick(scaledDelta: number): void {
    const player = deps.getPlayer();
    if (!player?.active) return;

    const gameTimeSec = deps.getGameTimeSec();
    const biomeId = deps.getCurrentBiomeId();

    // Resolve spawn coords: offset from player at trigger time.
    // These are snapped when the machine transitions out of idle.
    const spawnX = player.x + spawnOffsetX;
    const spawnY = player.y + spawnOffsetY;

    const prev = state;
    state = advanceCorryVreckan(state, {
      gameTimeSec,
      currentBiomeId: biomeId,
      playerX: player.x,
      playerY: player.y,
      spawnX,
      spawnY,
      isPlayerDead: !player.active,
      isVictoryPending: false,
    });

    // Transition side-effects (one-shot per edge).
    if (state !== prev) {
      const np = state.phase;
      if (np === 'warning') onWarningStart(state.wx, state.wy);
      if (np === 'active')  onActiveStart();
      if (np === 'survived') onSurvived(state.wx, state.wy);
      if (np === 'failed')   onFailed();
    }

    // Per-frame effects while the encounter is running.
    const phase = state.phase;
    if (phase !== 'warning' && phase !== 'active') return;

    const strengthMul = phase === 'warning' ? CORRYVRECKAN_WARN_PULL_MUL : 1.0;
    const { wx, wy } = state;
    const deltaSec = scaledDelta / 1000;

    // ── Apply pull to player ─────────────────────────────────────────────
    const pBody = player.body as Phaser.Physics.Arcade.Body;
    if (pBody) {
      const f = computeWhirlpoolPull(player.x, player.y, wx, wy, strengthMul);
      pBody.velocity.x += f.fx * deltaSec;
      pBody.velocity.y += f.fy * deltaSec;
    }

    // ── Apply pull to enemies ────────────────────────────────────────────
    if (phase === 'active') {
      const enemies = deps.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const eBody = enemy.body as Phaser.Physics.Arcade.Body;
        if (!eBody) continue;
        const ef = computeWhirlpoolPull(enemy.x, enemy.y, wx, wy, strengthMul * ENEMY_PULL_MUL);
        eBody.velocity.x += ef.fx * deltaSec;
        eBody.velocity.y += ef.fy * deltaSec;

        // Enemy reaches inner radius — consumed by the whirlpool.
        if (Math.hypot(enemy.x - wx, enemy.y - wy) < CORRYVRECKAN_INNER_RADIUS) {
          enemy.takeDamageWithKillEvents(9999);
        }
      }
    }

    // ── Spin the ring graphic ────────────────────────────────────────────
    if (rings) {
      const spinRate = phase === 'warning' ? SPIN_WARN_RAD_S : SPIN_ACTIVE_RAD_S;
      spinAngle += spinRate * deltaSec;
      // The rings are centred at wx,wy; rotation around that point.
      // Phaser Graphics origin defaults to (0,0), so we translate
      // to the whirlpool centre, rotate, translate back.
      rings.x = wx;
      rings.y = wy;
      rings.setRotation(spinAngle);
      // Redraw at origin — cleared each frame for smooth rotation.
      rings.clear();
      drawRings(rings, 0, 0);
    }
  }

  // ── Teardown ───────────────────────────────────────────────────────────────

  function teardown(): void {
    destroyVisuals();
    state = initialCorryVreckanState();
  }

  // ── Return install handle ──────────────────────────────────────────────────

  return {
    tick,
    getState: () => state,
    teardown,
  };
}
