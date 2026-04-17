import { describe, it, expect } from 'vitest';
import {
  resolveActIntermissionCardStyle,
  ACT_INTERMISSION_CARD_IDLE_COLOR,
  ACT_INTERMISSION_CARD_HOVER_COLOR,
} from './actIntermissionCardStyle';

describe('resolveActIntermissionCardStyle — 2-state card border', () => {
  it('idle is the warm dim gold at thickness 2', () => {
    const s = resolveActIntermissionCardStyle();
    expect(s.idle.color).toBe(ACT_INTERMISSION_CARD_IDLE_COLOR);
    expect(s.idle.thickness).toBe(2);
  });

  it('hover is the brighter gold at thickness 3', () => {
    const s = resolveActIntermissionCardStyle();
    expect(s.hover.color).toBe(ACT_INTERMISSION_CARD_HOVER_COLOR);
    expect(s.hover.thickness).toBe(3);
  });

  it('hover adds exactly +1 to the idle thickness', () => {
    const s = resolveActIntermissionCardStyle();
    expect(s.hover.thickness - s.idle.thickness).toBe(1);
  });

  it('idle and hover colours differ (affordance reads on hover)', () => {
    expect(ACT_INTERMISSION_CARD_IDLE_COLOR).not.toBe(ACT_INTERMISSION_CARD_HOVER_COLOR);
  });
});
