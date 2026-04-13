/**
 * High-speed automated play harness for balance telemetry.
 * Enable with `globalThis.AUTO_BATTLE = true` before starting a run (e.g. devtools).
 */

export const AUTO_BATTLE_TIME_TOKEN = 'AUTO_BATTLE';

export type AutoBattleGem = { x: number; y: number; active: boolean };

export function isAutoBattleEnabled(): boolean {
  return typeof globalThis !== 'undefined' && Boolean(
    (globalThis as unknown as { AUTO_BATTLE?: boolean }).AUTO_BATTLE
  );
}

/** Unit-length steering: chase nearest XP gem, else slowly orbit world center. */
export function computeAutoBattleSteering(opts: {
  playerX: number;
  playerY: number;
  gems: AutoBattleGem[];
  worldWidth: number;
  worldHeight: number;
  timeSec: number;
}): { x: number; y: number } {
  let best = Infinity;
  let tx = 0;
  let ty = 0;
  let found = false;
  for (const g of opts.gems) {
    if (!g.active) continue;
    const dx = g.x - opts.playerX;
    const dy = g.y - opts.playerY;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      tx = g.x;
      ty = g.y;
      found = true;
    }
  }
  if (found) {
    const dx = tx - opts.playerX;
    const dy = ty - opts.playerY;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  const cx = opts.worldWidth * 0.5;
  const cy = opts.worldHeight * 0.5;
  const angle = opts.timeSec * 0.38;
  const ox = cx + Math.cos(angle) * 220;
  const oy = cy + Math.sin(angle) * 220;
  const dx = ox - opts.playerX;
  const dy = oy - opts.playerY;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function installAutoBattleTimeScale(scene: {
  getTimeManager: () => { request: (key: string, spec: { timeScale?: number }) => void };
}): void {
  scene.getTimeManager().request(AUTO_BATTLE_TIME_TOKEN, { timeScale: 10 });
}

export function uninstallAutoBattleTimeScale(scene: {
  getTimeManager: () => { release: (key: string) => void };
}): void {
  scene.getTimeManager().release(AUTO_BATTLE_TIME_TOKEN);
}

export function reportAutoBattleRunEnd(payload: {
  outcome: 'death' | 'victory';
  gameTimeSec: number;
  weaponDamage: Record<string, number>;
}): void {
  if (!isAutoBattleEnabled()) return;
  console.info('[AutoBattler] Run summary');
  console.table([
    { key: 'outcome', value: payload.outcome },
    { key: 'gameTimeSec', value: payload.gameTimeSec },
  ]);
  const rows = Object.entries(payload.weaponDamage).map(([weapon, damage]) => ({ weapon, damage }));
  if (rows.length > 0) console.table(rows);
}
