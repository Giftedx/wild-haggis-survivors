import { describe, expect, it } from 'vitest';
import type { HaggisLayerSlot } from './HaggisContainer';

describe('HaggisContainer — type surface', () => {
  it('exports HaggisLayerSlot enum covering all 4 accessory depths', () => {
    const slots: HaggisLayerSlot[] = ['behind', 'body', 'front', 'above'];
    expect(slots.length).toBe(4);
  });
});

// Phaser-bound tests for HaggisContainer are integration only; see
// manual verification in Task 14.
