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

  it('applyMood() accepts the optional hazardPressure axis (WLW Phase 2)', () => {
    const layer = new AmbientBedLayer();
    expect(() => layer.applyMood({} as AudioContext, 0.5, 0.3, 0.4, 0.2, 0.8)).not.toThrow();
    // Out-of-range pressure values are clamped defensively (never
    // throws, never destabilises the bandpass filter).
    expect(() => layer.applyMood({} as AudioContext, 0.5, 0.3, 0.4, 0.2, 5)).not.toThrow();
    expect(() => layer.applyMood({} as AudioContext, 0.5, 0.3, 0.4, 0.2, -1)).not.toThrow();
  });
});
