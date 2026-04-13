/**
 * In-browser stress test harness — measures real-world FPS at + beyond the
 * configured entity caps to find where the engine actually drops below 60fps.
 *
 * Usage (DEV builds only):
 *   1. `npm run dev`, open the game, start any run.
 *   2. In the browser console: `startStressTest()` (toggle off with `stopStressTest()`).
 *   3. The HUD shows live FPS + active counts. Per-second samples log to console.
 *      `stopStressTest()` returns a summary { median, p5, p95, durationSec, samples }.
 *
 * What the harness does each frame while active:
 *   - Tops up enemy pool to ENEMIES.MAX_ACTIVE (rate-limited per frame so we
 *     don't stall on a single tick).
 *   - Tops up XP gem pool to BALANCE.xp.gemPoolMax.
 *   - Equips the player with all weapons at max level — saturates the
 *     projectile pool naturally.
 *   - Samples `game.loop.actualFps` every wall-second.
 */

import type Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { Enemy } from '../entities/Enemy';
import { ENEMIES } from '../config';
import { BALANCE } from '../core/BalanceConfig';
import { ENEMY_TYPES } from '../data/enemies';
import { WEAPON_DEFS } from '../data/weapons';

let active = false;
let hudText: Phaser.GameObjects.Text | null = null;

let frameCounter = 0;
let lastSampleMs = 0;
const fpsSamples: number[] = [];
let weaponsEquipped = false;

const ENEMY_KEY_CYCLE = ['tourist', 'midgie_swarm', 'haggis_hunter', 'sheep'];
let enemyCycleIdx = 0;

const SPAWN_BATCH_PER_FRAME = 25;   // Don't spend all frame budget topping up.
const GEM_BATCH_PER_FRAME = 30;
const HUD_UPDATE_EVERY_N_FRAMES = 6; // ~10 Hz HUD refresh.

export function isStressTestActive(): boolean {
  return active;
}

/** Start the stress harness. Returns a one-line status. */
export function startStressTest(): string {
  active = true;
  weaponsEquipped = false;
  fpsSamples.length = 0;
  frameCounter = 0;
  lastSampleMs = performance.now();
  enemyCycleIdx = 0;
  console.info('[stress] ON — flooding enemy/gem pools, sampling FPS each second');
  return 'stress test ON. Toggle off via stopStressTest().';
}

/** Stop the harness, tear down the HUD, and return summary stats. */
export function stopStressTest(): {
  durationSec: number;
  samples: number;
  median: number;
  p5: number;
  p95: number;
} {
  active = false;
  if (hudText) {
    hudText.destroy();
    hudText = null;
  }
  weaponsEquipped = false;
  const sorted = [...fpsSamples].sort((a, b) => a - b);
  const pick = (q: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : 0;
  const summary = {
    durationSec: sorted.length,
    samples: sorted.length,
    median: pick(0.5),
    p5: pick(0.05),
    p95: pick(0.95),
  };
  console.info('[stress] OFF', summary);
  return summary;
}

/** Called each GameScene update tick. No-op when inactive. */
export function tickStressTest(scene: GameScene): void {
  if (!active) return;

  if (!weaponsEquipped) {
    equipAllWeapons(scene);
    weaponsEquipped = true;
  }

  topUpEnemies(scene);
  topUpGems(scene);

  frameCounter++;
  const now = performance.now();
  const elapsed = now - lastSampleMs;
  if (elapsed >= 1000) {
    const fps = scene.game.loop.actualFps;
    fpsSamples.push(fps);
    const enemies = scene.getSpawnSystem().getActiveCount();
    const projectiles = countActive(scene.getWeaponSystem().getProjectileGroup());
    const gems = countActive(scene.getXPSystem().getGemGroup());
    console.info(
      `[stress] t=${fpsSamples.length}s  fps=${fps.toFixed(1)}  ` +
      `enemies=${enemies}/${ENEMIES.MAX_ACTIVE}  ` +
      `projectiles=${projectiles}/${BALANCE.weapons.projectilePoolMax}  ` +
      `gems=${gems}/${BALANCE.xp.gemPoolMax}`
    );
    lastSampleMs = now;
  }

  if (frameCounter % HUD_UPDATE_EVERY_N_FRAMES === 0) {
    updateHud(scene);
  }
}

function equipAllWeapons(scene: GameScene): void {
  const ws = scene.getWeaponSystem();
  for (const key of Object.keys(WEAPON_DEFS)) {
    if (ws.hasWeapon(key)) continue;
    ws.addWeapon(key);
  }
  // Push every weapon to a high level so cooldowns are short and pierce/aoe
  // are at peak — the projectile pool will saturate within seconds.
  for (const w of ws.getWeapons()) {
    for (let i = 0; i < 5; i++) ws.levelUpWeapon(w.config.key);
  }
}

function topUpEnemies(scene: GameScene): void {
  const spawn = scene.getSpawnSystem();
  const pool = spawn.getEnemyGroup();
  const player = scene.getPlayer();
  const need = ENEMIES.MAX_ACTIVE - spawn.getActiveCount();
  const batch = Math.min(need, SPAWN_BATCH_PER_FRAME);
  if (batch <= 0) return;

  const gameTime = spawn.getGameTimeSec();
  for (let i = 0; i < batch; i++) {
    const e = Enemy.acquireFromPool(pool, scene);
    if (!e) break;
    const angle = Math.random() * Math.PI * 2;
    const dist = 240 + Math.random() * 360; // ring around player
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    const cfgKey = ENEMY_KEY_CYCLE[enemyCycleIdx % ENEMY_KEY_CYCLE.length];
    enemyCycleIdx++;
    const cfg = ENEMY_TYPES[cfgKey] ?? ENEMY_TYPES.tourist;
    e.spawn(x, y, cfg, gameTime);
  }
}

function topUpGems(scene: GameScene): void {
  const xp = scene.getXPSystem();
  const player = scene.getPlayer();
  const cur = countActive(xp.getGemGroup());
  const need = BALANCE.xp.gemPoolMax - cur;
  const batch = Math.min(need, GEM_BATCH_PER_FRAME);
  if (batch <= 0) return;

  // Drop gems just outside the pickup radius so they linger and stress the
  // per-frame distSq check rather than getting vacuumed instantly.
  const pickup = player.getPickupRadius();
  const ringMin = pickup + 80;
  const ringMax = pickup + 400;
  for (let i = 0; i < batch; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = ringMin + Math.random() * (ringMax - ringMin);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    xp.spawnGem(x, y, 1);
  }
}

function countActive(group: Phaser.GameObjects.Group): number {
  return group.countActive(true);
}

function updateHud(scene: GameScene): void {
  if (!hudText) {
    hudText = scene.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(9999);
  }
  const fps = scene.game.loop.actualFps;
  const enemies = scene.getSpawnSystem().getActiveCount();
  const projectiles = countActive(scene.getWeaponSystem().getProjectileGroup());
  const gems = countActive(scene.getXPSystem().getGemGroup());
  hudText.setText(
    `STRESS  fps ${fps.toFixed(1).padStart(5)}\n` +
    `enemies      ${String(enemies).padStart(4)} / ${ENEMIES.MAX_ACTIVE}\n` +
    `projectiles  ${String(projectiles).padStart(4)} / ${BALANCE.weapons.projectilePoolMax}\n` +
    `gems         ${String(gems).padStart(4)} / ${BALANCE.xp.gemPoolMax}`
  );
}

/** Self-install console hooks in DEV builds. Called from main.ts. */
export function installStressTestConsoleHooks(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & {
    startStressTest?: () => string;
    stopStressTest?: () => unknown;
    isStressTestActive?: () => boolean;
  };
  w.startStressTest = startStressTest;
  w.stopStressTest = stopStressTest;
  w.isStressTestActive = isStressTestActive;
  console.info('[stress] console hooks ready: startStressTest() / stopStressTest()');
}
