import { describe, expect, it } from 'vitest';
import { computeGameOverBottomRowsLayout } from './renderGameOverSeedAndLinkRows';

describe('computeGameOverBottomRowsLayout', () => {
  it('reserves footer space below action buttons on mobile at high UI scale', () => {
    const layout = computeGameOverBottomRowsLayout({
      panelTop: 4,
      PANEL_H: 656,
      height: 664,
      compact: true,
      panelScale: 1.4,
      hasRerun: true,
      captureEnabled: true,
      recorderAvailable: true,
      highlightAvailable: true,
    });

    const panelBottom = 660;
    const weeTaleCenterY = layout.buttonsY + Math.round(40 * 1.4);
    const actionButtonBottom = layout.buttonsY + 21;
    const lastLinkBaselineY = layout.linkY + 16;

    expect(weeTaleCenterY).toBeLessThanOrEqual(panelBottom - Math.round(10 * 1.4));
    expect(weeTaleCenterY - actionButtonBottom).toBeGreaterThanOrEqual(24);
    expect(actionButtonBottom - lastLinkBaselineY).toBeGreaterThanOrEqual(24);
  });

  it('moves the full capture stack above the action row on desktop', () => {
    const layout = computeGameOverBottomRowsLayout({
      panelTop: 4,
      PANEL_H: 712,
      height: 720,
      compact: false,
      panelScale: 1,
      hasRerun: true,
      captureEnabled: true,
      recorderAvailable: true,
      highlightAvailable: true,
    });

    const actionButtonTop = layout.buttonsY - 21;
    const highlightBaselineY = layout.linkY + 64;

    expect(actionButtonTop - highlightBaselineY).toBeGreaterThanOrEqual(20);
    expect(layout.buttonsY + 42).toBeLessThanOrEqual(720 - 10);
  });

  it('keeps the simple postcard-only row close to the buttons without footer overlap', () => {
    const layout = computeGameOverBottomRowsLayout({
      panelTop: 4,
      PANEL_H: 712,
      height: 720,
      compact: false,
      panelScale: 1,
      hasRerun: false,
      captureEnabled: false,
      recorderAvailable: false,
      highlightAvailable: false,
    });

    expect(layout.buttonsY - layout.linkY).toBe(44);
    expect(layout.buttonsY + 42).toBeLessThanOrEqual(720 - 10);
  });
});
