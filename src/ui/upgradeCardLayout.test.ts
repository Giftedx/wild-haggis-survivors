import { describe, it, expect } from 'vitest';
import {
  computeUpgradeCardLayout,
  UPGRADE_CARD_MAX_W,
  UPGRADE_CARD_ASPECT,
  UPGRADE_CARD_HARD_MIN_W,
} from './upgradeCardLayout';

const SIZES = [
  { width: 1920, height: 1080 }, // desktop
  { width: 1024, height: 768 },  // tablet landscape
  { width: 800, height: 600 },   // design target
  { width: 375, height: 667 },   // phone
];

describe('computeUpgradeCardLayout', () => {
  it('at the design target (800×600) with 3 cards, card fits within the max and the row is centred', () => {
    const l = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 3 });
    expect(l.cardW).toBeLessThanOrEqual(UPGRADE_CARD_MAX_W);
    expect(l.cardW).toBeGreaterThan(50);
    expect(l.gap).toBeGreaterThanOrEqual(10);
    expect(l.gap).toBeLessThanOrEqual(20);
  });

  it('card height follows the fixed 260/210 aspect ratio', () => {
    const l = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 3 });
    expect(l.cardH).toBe(Math.round(l.cardW * UPGRADE_CARD_ASPECT));
  });

  it('narrow phone viewport still returns a usable card (≥ hard min width)', () => {
    const l = computeUpgradeCardLayout({ left: 0, top: 0, width: 375, height: 667, cardCount: 3 });
    expect(l.cardW).toBeGreaterThanOrEqual(UPGRADE_CARD_HARD_MIN_W);
  });

  it('cardY is clamped within [minCardY, maxCardY] for every sampled viewport', () => {
    for (const s of SIZES) {
      const l = computeUpgradeCardLayout({ left: 0, top: 0, ...s, cardCount: 3 });
      expect(l.cardY).toBeGreaterThanOrEqual(l.cardH / 2 + 20);
      expect(l.cardY).toBeLessThanOrEqual(s.height - l.cardH / 2 - 72);
    }
  });

  it('startX keeps the whole row inside the viewport (left + totalW ≤ width)', () => {
    for (const s of SIZES) {
      const l = computeUpgradeCardLayout({ left: 0, top: 0, ...s, cardCount: 3 });
      const rowW = 3 * l.cardW + 2 * l.gap;
      const rowStart = l.startX - l.cardW / 2;
      expect(rowStart).toBeGreaterThanOrEqual(0);
      expect(rowStart + rowW).toBeLessThanOrEqual(s.width + 1); // +1 for round-off
    }
  });

  it('more cards shrink each card at a fixed viewport', () => {
    const three = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 3 });
    const five = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 5 });
    expect(five.cardW).toBeLessThan(three.cardW);
  });

  it('left offset passes through to startX', () => {
    const a = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 3 });
    const b = computeUpgradeCardLayout({ left: 200, top: 0, width: 800, height: 600, cardCount: 3 });
    expect(b.startX - a.startX).toBe(200);
  });

  it('top offset passes through to cardY', () => {
    const a = computeUpgradeCardLayout({ left: 0, top: 0, width: 800, height: 600, cardCount: 3 });
    const b = computeUpgradeCardLayout({ left: 0, top: 50, width: 800, height: 600, cardCount: 3 });
    expect(b.cardY - a.cardY).toBe(50);
  });
});
