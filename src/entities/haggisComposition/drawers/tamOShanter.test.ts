import { describe, expect, it, vi } from 'vitest';
import { TAM_O_SHANTER_DRAWER } from './tamOShanter';
import { CLASSIC_VARIANT } from '../../../art/palettes';
import { getFrameCountForState } from '../../../animation/frameClock';

function makeGraphicsStub() {
  return {
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillEllipse: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillTriangle: vi.fn().mockReturnThis(),
  };
}

describe('TAM_O_SHANTER_DRAWER', () => {
  it('has id tam_o_shanter on layer above', () => {
    expect(TAM_O_SHANTER_DRAWER.id).toBe('tam_o_shanter');
    expect(TAM_O_SHANTER_DRAWER.layer).toBe('above');
  });

  it('authors idle + walking + attacking + hurt + celebrating + dying', () => {
    expect(TAM_O_SHANTER_DRAWER.authoredStates).toEqual([
      'idle',
      'walking',
      'attacking',
      'hurt',
      'celebrating',
      'dying',
    ]);
  });

  it('draws primitives for every authored (state × frame) pair', () => {
    for (const state of TAM_O_SHANTER_DRAWER.authoredStates) {
      const framesInState = getFrameCountForState(state);
      for (let frame = 0; frame < framesInState; frame++) {
        const g = makeGraphicsStub();
        TAM_O_SHANTER_DRAWER.draw(g as unknown as Phaser.GameObjects.Graphics, {
          variantPalette: CLASSIC_VARIANT,
          state,
          frame,
        });
        const totalCalls =
          g.fillCircle.mock.calls.length +
          g.fillEllipse.mock.calls.length +
          g.fillRect.mock.calls.length +
          g.fillTriangle.mock.calls.length;
        expect(totalCalls, `${state} frame ${frame}`).toBeGreaterThan(0);
      }
    }
  });
});
