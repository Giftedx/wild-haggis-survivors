import { describe, expect, it } from 'vitest';
import { CROFT_DRAW_ORDER, layoutCroft } from './CroftComposition';

describe('CroftComposition', () => {
  describe('layoutCroft', () => {
    it('places Gran on the horizontal center-right at canvas scale 1280×720', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 1280, height: 720 });
      // Gran sits slightly right of center (beside the hearth).
      expect(layout.gran.x).toBeGreaterThan(640);
      expect(layout.gran.x).toBeLessThan(1280);
    });

    it('places Gran at the expected position for 800×600 default canvas', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      expect(layout.center).toEqual({ x: 400, y: 300 });
      expect(layout.gran.x).toBeCloseTo(400 + 800 * 0.105);
    });

    it('scales every element position proportionally with canvas size', () => {
      const a = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      const b = layoutCroft({ uiScale: 1.0, width: 1600, height: 1200 });
      // Doubling width+height doubles every element's coordinates.
      expect(b.gran.x).toBeCloseTo(a.gran.x * 2);
      expect(b.gran.y).toBeCloseTo(a.gran.y * 2);
      expect(b.hearth.x).toBeCloseTo(a.hearth.x * 2);
      expect(b.mantelpiece.w).toBeCloseTo(a.mantelpiece.w * 2);
    });

    it('exposes uiScale unchanged as spriteScale', () => {
      expect(layoutCroft({ uiScale: 0.75, width: 800, height: 600 }).spriteScale).toBe(0.75);
      expect(layoutCroft({ uiScale: 1.5, width: 800, height: 600 }).spriteScale).toBe(1.5);
    });

    it('keeps hearth left of Gran (she sits to the right of the fire)', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      expect(layout.hearth.x).toBeLessThan(layout.gran.x);
    });

    it('places mantelpiece above hearth vertically', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      expect(layout.mantelpiece.y).toBeLessThan(layout.hearth.y);
    });

    it('places drove window on the left, photo wall on the right', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      expect(layout.drove.x).toBeLessThan(layout.center.x);
      expect(layout.photoWall.x).toBeGreaterThan(layout.center.x);
    });

    it('puts table and rug in the foreground (below center)', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      expect(layout.table.y).toBeGreaterThan(layout.center.y);
      expect(layout.rug.y).toBeGreaterThan(layout.center.y);
    });

    it('keeps every element within canvas bounds', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      const points: Array<{ x: number; y: number }> = [
        layout.gran,
        layout.hearth,
        layout.bookshelf,
        layout.wireless,
        layout.table,
        layout.thistle,
      ];
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(800);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(600);
      }
    });
  });

  describe('CROFT_DRAW_ORDER', () => {
    it('places Gran last (foreground) and windowView first (background)', () => {
      expect(CROFT_DRAW_ORDER[0]).toBe('windowView');
      expect(CROFT_DRAW_ORDER[CROFT_DRAW_ORDER.length - 1]).toBe('gran');
    });

    it('lists every element from the layout exactly once', () => {
      const layout = layoutCroft({ uiScale: 1.0, width: 800, height: 600 });
      // center + spriteScale are metadata, not drawable.
      const drawableKeys = Object.keys(layout).filter(
        (k) => k !== 'center' && k !== 'spriteScale',
      );
      expect([...CROFT_DRAW_ORDER].sort()).toEqual([...drawableKeys].sort());
    });
  });
});
