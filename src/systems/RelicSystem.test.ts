import { describe, expect, it } from 'vitest';
import { RELICS } from '../data/relics';
import { RelicSystem } from './RelicSystem';

describe('RelicSystem — slot model (T11)', () => {
  it('has exactly 3 slots and all start empty', () => {
    const sys = new RelicSystem();
    expect(sys.getSlots()).toHaveLength(3);
    for (const slot of sys.getSlots()) {
      expect(slot.def).toBeNull();
    }
    expect(sys.heldCount()).toBe(0);
  });

  it('add() fills the next empty slot in order', () => {
    const sys = new RelicSystem();
    const added = sys.add(RELICS.sporran_of_holding);
    expect(added).toBe(true);
    expect(sys.getSlots()[0].def).toBe(RELICS.sporran_of_holding);
    expect(sys.getSlots()[1].def).toBeNull();
    expect(sys.heldCount()).toBe(1);
  });

  it('add() refuses duplicates of the same relic key', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    const dup = sys.add(RELICS.sporran_of_holding);
    expect(dup).toBe(false);
    expect(sys.heldCount()).toBe(1);
  });

  it('add() returns false when all 3 slots are full (4th offered)', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    sys.add(RELICS.oatcake_stash);
    sys.add(RELICS.grans_thimble);
    const fourth = sys.add(RELICS.bronze_clasp);
    expect(fourth).toBe(false);
    expect(sys.heldCount()).toBe(3);
  });

  it('canAdd() returns true iff space + not duplicate', () => {
    const sys = new RelicSystem();
    expect(sys.canAdd(RELICS.sporran_of_holding)).toBe(true);
    sys.add(RELICS.sporran_of_holding);
    expect(sys.canAdd(RELICS.sporran_of_holding)).toBe(false); // duplicate
    expect(sys.canAdd(RELICS.oatcake_stash)).toBe(true);
    sys.add(RELICS.oatcake_stash);
    sys.add(RELICS.grans_thimble);
    expect(sys.canAdd(RELICS.bronze_clasp)).toBe(false); // full
  });

  it('discardAt() clears a slot without shuffling the rest', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    sys.add(RELICS.oatcake_stash);
    sys.add(RELICS.grans_thimble);
    sys.discardAt(1);
    expect(sys.getSlots()[0].def).toBe(RELICS.sporran_of_holding);
    expect(sys.getSlots()[1].def).toBeNull();
    expect(sys.getSlots()[2].def).toBe(RELICS.grans_thimble);
    expect(sys.heldCount()).toBe(2);
  });

  it('replaceAt() swaps the held relic at a specific slot', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    sys.add(RELICS.oatcake_stash);
    sys.add(RELICS.grans_thimble);
    sys.replaceAt(0, RELICS.bronze_clasp);
    expect(sys.getSlots()[0].def).toBe(RELICS.bronze_clasp);
    expect(sys.getSlots()[1].def).toBe(RELICS.oatcake_stash);
    expect(sys.heldCount()).toBe(3);
  });

  it('isHolding() reports current state', () => {
    const sys = new RelicSystem();
    expect(sys.isHolding('sporran_of_holding')).toBe(false);
    sys.add(RELICS.sporran_of_holding);
    expect(sys.isHolding('sporran_of_holding')).toBe(true);
    sys.discardAt(0);
    expect(sys.isHolding('sporran_of_holding')).toBe(false);
  });

  it('heldKeys() returns in slot order, skipping empties', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    sys.add(RELICS.oatcake_stash);
    sys.add(RELICS.grans_thimble);
    sys.discardAt(1);
    expect(sys.heldKeys()).toEqual(['sporran_of_holding', 'grans_thimble']);
  });

  it('reset() clears all slots', () => {
    const sys = new RelicSystem();
    sys.add(RELICS.sporran_of_holding);
    sys.add(RELICS.oatcake_stash);
    sys.reset();
    expect(sys.heldCount()).toBe(0);
    for (const slot of sys.getSlots()) expect(slot.def).toBeNull();
  });
});
