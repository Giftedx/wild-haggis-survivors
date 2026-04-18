import { describe, expect, it } from 'vitest';
import { ACCESSORY_REGISTRY, getAccessoryDrawer } from './accessoryRegistry';

describe('accessoryRegistry', () => {
  it('has exactly one entry per registered id', () => {
    const ids = Object.keys(ACCESSORY_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Phase 0 ships tam_o_shanter', () => {
    expect(ACCESSORY_REGISTRY['tam_o_shanter']).toBeDefined();
    expect(ACCESSORY_REGISTRY['tam_o_shanter'].layer).toBe('above');
  });

  it('getAccessoryDrawer returns registered drawer', () => {
    const d = getAccessoryDrawer('tam_o_shanter');
    expect(d).toBeDefined();
    expect(d!.id).toBe('tam_o_shanter');
  });

  it('getAccessoryDrawer returns undefined for unknown id', () => {
    expect(getAccessoryDrawer('not_a_real_thing')).toBeUndefined();
  });
});
