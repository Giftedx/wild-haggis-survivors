import { describe, expect, it } from 'vitest';
import { AmbientBedLayer } from './AmbientBedLayer';

describe('AmbientBedLayer', () => {
  it('can be instantiated without throwing', () => {
    const layer = new AmbientBedLayer();
    expect(layer).toBeDefined();
  });

  it('stop() is safe to call without start()', () => {
    const layer = new AmbientBedLayer();
    expect(() => layer.stop()).not.toThrow();
  });

  it('applyMood() is safe to call without start()', () => {
    const layer = new AmbientBedLayer();
    // Should no-op gracefully when nodes are null
    expect(() => layer.applyMood({} as AudioContext, 0.5, 0.3, 0.4, 0.2)).not.toThrow();
  });
});
