import type { GameScene } from '../GameScene';

const REPLAY_STATE_HASH_INTERVAL = 30;

export function shouldCaptureReplayStateHash(frameIndex: number): boolean {
  return frameIndex >= 0 && frameIndex % REPLAY_STATE_HASH_INTERVAL === 0;
}

export function captureReplayStateHash(scene: GameScene, frameIndex: number): string {
  const player = scene.player;
  const xp = scene.xpSystem;
  const spawn = scene.spawnSystem;
  const payload = [
    frameIndex,
    q(player.x),
    q(player.y),
    q(player.getHp()),
    q(player.getMaxHp()),
    q(player.getMoveSpeed()),
    xp.getLevel(),
    q(xp.getCurrentXP()),
    q(xp.getXPToNext()),
    scene.runScore.killCount,
    q(scene.runScore.getGoldBalance()),
    q(spawn.getGameTimeSec()),
    scene.weaponSystem.getWeapons().length,
    scene.ownedPassives.length,
    scene.runActState.currentAct,
    scene.getCurrentBiomeId() ?? 'none',
  ].join('|');
  return fnv1a32(payload);
}

function q(value: number): number {
  return Math.round(value * 1000);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
