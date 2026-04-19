import { describe, it, expect, vi } from 'vitest';
import { PLAYER } from '../../config';
import { applyPassiveEffect } from './passiveEffects';
import type { Player } from '../../entities/Player';

function mockPlayer(): Pick<
  Player,
  | 'addSpeed'
  | 'addMaxHp'
  | 'addPickupRadius'
  | 'addXpMultiplier'
  | 'addAoeMultiplier'
  | 'addAttackSpeedMultiplier'
  | 'addCritChance'
  | 'setThorns'
  | 'enableShield'
  | 'addDamageMultiplier'
  | 'equipAccessory'
> {
  return {
    addSpeed: vi.fn(),
    addMaxHp: vi.fn(),
    addPickupRadius: vi.fn(),
    addXpMultiplier: vi.fn(),
    addAoeMultiplier: vi.fn(),
    addAttackSpeedMultiplier: vi.fn(),
    addCritChance: vi.fn(),
    setThorns: vi.fn(),
    enableShield: vi.fn(),
    addDamageMultiplier: vi.fn(),
    equipAccessory: vi.fn(),
  };
}

describe('applyPassiveEffect', () => {
  it('does nothing for unknown passive keys', () => {
    const p = mockPlayer();
    applyPassiveEffect(p as unknown as Player, 'unknown_passive_xyz');
    expect(p.addSpeed).not.toHaveBeenCalled();
    expect(p.addMaxHp).not.toHaveBeenCalled();
  });

  it('maps each known passive to the expected stat hooks', () => {
    const p = mockPlayer();
    applyPassiveEffect(p as unknown as Player, 'tam_o_shanter');
    expect(p.addSpeed).toHaveBeenCalledWith(PLAYER.SPEED * 0.1);
    // Visible wear-build: picking the tam passive equips the accessory
    // sprite on the haggis — the Binding-of-Isaac-style visual feedback.
    expect(p.equipAccessory).toHaveBeenCalledWith('tam_o_shanter');

    applyPassiveEffect(p as unknown as Player, 'kilt');
    expect(p.addMaxHp).toHaveBeenCalledWith(Math.ceil(PLAYER.MAX_HP * 0.15));

    applyPassiveEffect(p as unknown as Player, 'loch_water');
    expect(p.addPickupRadius).toHaveBeenCalledWith(PLAYER.PICKUP_RADIUS * 0.4);
    expect(p.addSpeed).toHaveBeenCalledWith(PLAYER.SPEED * 0.05);

    applyPassiveEffect(p as unknown as Player, 'sporran');
    expect(p.addXpMultiplier).toHaveBeenCalledWith(0.1);

    applyPassiveEffect(p as unknown as Player, 'whisky_flask');
    expect(p.addAoeMultiplier).toHaveBeenCalledWith(0.2);

    applyPassiveEffect(p as unknown as Player, 'irn_bru');
    expect(p.addAttackSpeedMultiplier).toHaveBeenCalledWith(0.15);

    applyPassiveEffect(p as unknown as Player, 'thistle_crown');
    expect(p.addCritChance).toHaveBeenCalledWith(0.05);
    expect(p.setThorns).toHaveBeenCalledWith(3);

    applyPassiveEffect(p as unknown as Player, 'highland_shield');
    expect(p.enableShield).toHaveBeenCalledWith();

    applyPassiveEffect(p as unknown as Player, 'tartan_sash');
    expect(p.addDamageMultiplier).toHaveBeenCalledWith(0.08);
  });
});
