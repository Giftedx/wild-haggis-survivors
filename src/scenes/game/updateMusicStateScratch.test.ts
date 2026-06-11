import { describe, expect, it } from 'vitest';
import { updateMusicStateScratch } from './updateMusicStateScratch';
import type { GameMusicState } from '../../systems/music/ProceduralMusicEngine';

/**
 * Scratch mutator: locks per-frame handoff from GameScene to the music
 * engine. Pure outside of the scratch object it mutates — no allocations.
 */
describe('updateMusicStateScratch', () => {
  const freshScratch = (): GameMusicState => ({
    hp: 0,
    maxHp: 0,
    gameTimeSec: 0,
    enemyCount: 0,
    comboCount: 0,
    killCount: 0,
    bossActive: false,
    biomeTimbre: 0,
  });

  function stubs(overrides: Record<string, unknown> = {}) {
    return {
      player: {
        getHp: () => (overrides.hp as number) ?? 80,
        getMaxHp: () => (overrides.maxHp as number) ?? 100,
      },
      spawn: {
        getGameTimeSec: () => (overrides.time as number) ?? 45,
        getActiveCount: () => (overrides.enemies as number) ?? 12,
        isBossActive: () => (overrides.boss as boolean) ?? false,
      },
      juice: {
        getComboCount: () => (overrides.combo as number) ?? 7,
      },
    };
  }

  it('writes every field from the collaborators into the scratch', () => {
    const scratch = freshScratch();
    const { player, spawn, juice } = stubs();
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 99, 0.5, 0.35, 0.4, 0.6);
    expect(scratch).toEqual({
      hp: 80,
      maxHp: 100,
      gameTimeSec: 45,
      enemyCount: 12,
      comboCount: 7,
      killCount: 99,
      bossActive: false,
      biomeTimbre: 0.5,
      buildDensity: 0.35,
      livingWorldPresence: 0.4,
      hazardPressure: 0.6,
    });
  });

  it('living-world presence defaults to 0 when omitted', () => {
    const scratch = freshScratch();
    const { player, spawn, juice } = stubs();
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 0, 0, 0);
    expect(scratch.livingWorldPresence).toBe(0);
  });

  it('hazard pressure defaults to 0 when omitted (WLW Phase 2)', () => {
    const scratch = freshScratch();
    const { player, spawn, juice } = stubs();
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 0, 0, 0);
    expect(scratch.hazardPressure).toBe(0);
  });

  it('mutates the same reference (no allocation)', () => {
    const scratch = freshScratch();
    const ref = scratch;
    const { player, spawn, juice } = stubs();
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 0, 0, 0);
    expect(scratch).toBe(ref);
  });

  it('overwrites previous frame values (no stale data)', () => {
    const scratch: GameMusicState = {
      hp: 1, maxHp: 1, gameTimeSec: 1, enemyCount: 1,
      comboCount: 1, killCount: 1, bossActive: true, biomeTimbre: 1,
      buildDensity: 1,
    };
    const { player, spawn, juice } = stubs({
      hp: 50, maxHp: 200, time: 999, enemies: 0, boss: false, combo: 0,
    });
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 42, 0.25, 0.6);
    expect(scratch.hp).toBe(50);
    expect(scratch.maxHp).toBe(200);
    expect(scratch.gameTimeSec).toBe(999);
    expect(scratch.enemyCount).toBe(0);
    expect(scratch.bossActive).toBe(false);
    expect(scratch.comboCount).toBe(0);
    expect(scratch.killCount).toBe(42);
    expect(scratch.biomeTimbre).toBe(0.25);
    expect(scratch.buildDensity).toBe(0.6);
  });

  it('propagates bossActive true', () => {
    const scratch = freshScratch();
    const { player, spawn, juice } = stubs({ boss: true });
    updateMusicStateScratch(scratch, player as never, spawn as never, juice as never, 0, 0, 0);
    expect(scratch.bossActive).toBe(true);
  });
});
