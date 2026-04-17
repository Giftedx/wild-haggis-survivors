import { describe, it, expect } from 'vitest';
import {
  resolveBackButtonPalette,
  BACK_BUTTON_FILL_IDLE,
  BACK_BUTTON_FILL_HOVER,
} from './backButtonPalette';

describe('resolveBackButtonPalette — shared idle / hover navy pair', () => {
  it('returns the expected idle fill', () => {
    expect(resolveBackButtonPalette().idle).toBe(BACK_BUTTON_FILL_IDLE);
    expect(BACK_BUTTON_FILL_IDLE).toBe(0x252540);
  });

  it('returns the expected hover fill', () => {
    expect(resolveBackButtonPalette().hover).toBe(BACK_BUTTON_FILL_HOVER);
    expect(BACK_BUTTON_FILL_HOVER).toBe(0x2a2244);
  });

  it('idle and hover are distinct (hover affordance reads on mouse-over)', () => {
    expect(BACK_BUTTON_FILL_IDLE).not.toBe(BACK_BUTTON_FILL_HOVER);
  });
});
