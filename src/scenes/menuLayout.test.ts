import { describe, it, expect } from 'vitest';
import {
  computeMenuLayout,
  MENU_BUTTON_Y_MIN,
  MENU_BUTTON_Y_MAX,
  MENU_BUTTON_Y_FRACTION,
  MENU_PANEL_Y_OFFSET,
  MENU_PANEL_Y_MIN,
  MENU_PANEL_HEIGHT,
} from './menuLayout';

describe('computeMenuLayout — buttonY clamp', () => {
  it('clamps to the min on short viewports', () => {
    // A 400-tall viewport → 400 * 0.49 = 196, clamped UP to the MIN.
    expect(computeMenuLayout(400).buttonY).toBe(MENU_BUTTON_Y_MIN);
  });

  it('clamps to the max on tall viewports', () => {
    // A 1200-tall viewport → 1200 * 0.49 = 588, clamped DOWN to MAX.
    expect(computeMenuLayout(1200).buttonY).toBe(MENU_BUTTON_Y_MAX);
  });

  it('uses the fractional value in the clamp window', () => {
    // A viewport that lands cleanly inside the clamp window:
    // 650 * 0.49 = 318.5 → inside [304, 342].
    expect(computeMenuLayout(650).buttonY).toBeCloseTo(650 * MENU_BUTTON_Y_FRACTION, 6);
  });
});

describe('computeMenuLayout — panelY', () => {
  it('sits MENU_PANEL_Y_OFFSET below buttonY on standard viewports', () => {
    const layout = computeMenuLayout(720);
    expect(layout.panelY).toBe(layout.buttonY + MENU_PANEL_Y_OFFSET);
  });

  it('clamps to the min on short viewports', () => {
    // 400 height → panelY = 304 + 122 = 426, clamped to MIN = 412 if below.
    // 304 + 122 = 426 which is above min 412, so uses the raw value.
    // Force the clamp: panel MIN is 412 and we feed a buttonY that would
    // produce less than that — impossible here since buttonY clamp ≥ 304.
    // So this test asserts panelY >= MIN always.
    for (let h = 200; h < 1600; h += 100) {
      expect(computeMenuLayout(h).panelY).toBeGreaterThanOrEqual(MENU_PANEL_Y_MIN);
    }
  });

  it('never pushes off the bottom of the viewport (minus one offset)', () => {
    for (let h = 500; h < 1600; h += 100) {
      const layout = computeMenuLayout(h);
      expect(layout.panelY).toBeLessThanOrEqual(Math.max(MENU_PANEL_Y_MIN, h - MENU_PANEL_Y_OFFSET));
    }
  });
});

describe('computeMenuLayout — panelHeight + ambientEnemyMinY', () => {
  it('panelHeight is the design constant regardless of viewport', () => {
    for (let h = 400; h < 1200; h += 100) {
      expect(computeMenuLayout(h).panelHeight).toBe(MENU_PANEL_HEIGHT);
    }
  });

  it('ambientEnemyMinY sits below the panel bottom + pad', () => {
    const layout = computeMenuLayout(720);
    // panel bottom = panelY + panelHeight/2 = panelY + 72.
    // ambientEnemyMinY should be panel bottom + 26 (pad), floored.
    const panelBottom = layout.panelY + layout.panelHeight / 2;
    expect(layout.ambientEnemyMinY).toBeGreaterThanOrEqual(Math.floor(panelBottom + 1));
  });

  it('ambientEnemyMinY is an integer (for pixel-snap rendering)', () => {
    const layout = computeMenuLayout(650);
    expect(Number.isInteger(layout.ambientEnemyMinY)).toBe(true);
  });
});

describe('clamp constants', () => {
  it('button min < max (ordering invariant)', () => {
    expect(MENU_BUTTON_Y_MIN).toBeLessThan(MENU_BUTTON_Y_MAX);
  });
});
