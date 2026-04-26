/**
 * updateRunHudFrame — per-frame HUD orchestration for GameScene.
 *
 * Keeps the scene update loop focused on gameplay sequencing while this
 * helper owns the ordering and argument contract for the HUD surface.
 * Phaser-free so the coordinator can be covered by node-env Vitest.
 */
import type { CurseKey } from '../../data/curses';
import type { ActiveWeapon } from '../../systems/WeaponSystem';
import { updateHudWeaponRows, type HudWeaponRow } from './updateHudWeaponRows';

export interface RunHudSink {
  updateDPS(delta: number): void;
  updateShield(hasShield: boolean): void;
  setAct(currentAct: 1 | 2 | 3): void;
  setIronmoor(active: boolean): void;
  setDaily(active: boolean, seedCode?: string): void;
  setGold(balance: number): void;
  update(
    hp: number,
    maxHp: number,
    level: number,
    xpFraction: number,
    gameTimeSec: number,
    killCount: number,
    enemyCount: number,
    dashCharges?: number,
    maxDashCharges?: number,
    dashCooldownFrac?: number,
    weapons?: HudWeaponRow[],
    passives?: string[],
    weaponSlotCount?: number,
    activeCurseKey?: CurseKey | null,
  ): void;
}

export interface RunHudPlayerSource {
  getHp(): number;
  getMaxHp(): number;
  hasShield(): boolean;
  getDashCharges(): number;
  getMaxDashCharges(): number;
  getDashCooldownFraction(): number;
}

export interface RunHudXpSource {
  getLevel(): number;
  getXPFraction(): number;
}

export interface RunHudSpawnSource {
  getGameTimeSec(): number;
  getActiveCount(): number;
}

export interface UpdateRunHudFrameInput {
  delta: number;
  hud: RunHudSink;
  player: RunHudPlayerSource;
  xpSystem: RunHudXpSource;
  spawnSystem: RunHudSpawnSource;
  weaponRows: HudWeaponRow[];
  weapons: readonly ActiveWeapon[];
  ownedPassives: string[];
  killCount: number;
  currentAct: 1 | 2 | 3;
  ironmoor: boolean;
  daily: boolean;
  seedCode?: string;
  goldBalance: number;
  activeCurseKey: CurseKey | null;
}

/**
 * Push the current run state into the HUD. Returns the number of weapon
 * rows written so tests and future callers can assert the scratch-buffer
 * contract without inspecting the HUD implementation.
 */
export function updateRunHudFrame(input: UpdateRunHudFrameInput): number {
  const {
    delta,
    hud,
    player,
    xpSystem,
    spawnSystem,
    weaponRows,
    weapons,
    ownedPassives,
    killCount,
    currentAct,
    ironmoor,
    daily,
    seedCode,
    goldBalance,
    activeCurseKey,
  } = input;

  hud.updateDPS(delta);
  hud.updateShield(player.hasShield());
  hud.setAct(currentAct);
  hud.setIronmoor(ironmoor);
  hud.setDaily(daily, seedCode);
  hud.setGold(goldBalance);

  const weaponSlotCount = updateHudWeaponRows(weaponRows, weapons);
  hud.update(
    player.getHp(),
    player.getMaxHp(),
    xpSystem.getLevel(),
    xpSystem.getXPFraction(),
    spawnSystem.getGameTimeSec(),
    killCount,
    spawnSystem.getActiveCount(),
    player.getDashCharges(),
    player.getMaxDashCharges(),
    player.getDashCooldownFraction(),
    weaponRows,
    ownedPassives,
    weaponSlotCount,
    activeCurseKey,
  );
  return weaponSlotCount;
}
