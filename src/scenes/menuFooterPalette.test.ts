import { describe, it, expect } from 'vitest';
import { resolveMenuFooterPalette } from './menuFooterPalette';

describe('resolveMenuFooterPalette — 3 quiet foot-strip lines × 2 contrast modes', () => {
  it('default mode has no credit stroke (credit floats on dim base, legible as-is)', () => {
    const p = resolveMenuFooterPalette(false);
    expect(p.creditStroke).toBeNull();
    expect(p.statsStrip).toBe('#556280');
    expect(p.historyStrip).toBe('#4a5c78');
    expect(p.creditText).toBe('#445572');
  });

  it('high-contrast adds a dark credit stroke (mountain silhouette is lighter in HC)', () => {
    const p = resolveMenuFooterPalette(true);
    expect(p.creditStroke).toEqual({ color: '#0a0c10', thickness: 3 });
    expect(p.statsStrip).toBe('#6a7894');
    expect(p.historyStrip).toBe('#5a6888');
    expect(p.creditText).toBe('#5a6888');
  });

  it('every line colour lifts in HC (nothing gets dimmer when contrast is on)', () => {
    const base = resolveMenuFooterPalette(false);
    const hc = resolveMenuFooterPalette(true);
    expect(base.statsStrip).not.toBe(hc.statsStrip);
    expect(base.historyStrip).not.toBe(hc.historyStrip);
    expect(base.creditText).not.toBe(hc.creditText);
  });

  it('in HC the history and credit colours converge (both become #5a6888 — intentional)', () => {
    const hc = resolveMenuFooterPalette(true);
    expect(hc.historyStrip).toBe(hc.creditText);
  });
});
