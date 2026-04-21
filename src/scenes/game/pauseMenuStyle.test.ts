import { describe, it, expect } from 'vitest';
import {
  resolvePauseMenuStyle,
  PAUSE_SHORT_VIEWPORT_HEIGHT,
  PAUSE_TITLE_SIZE_SHORT,
  PAUSE_TITLE_SIZE_WIDE,
  PAUSE_TITLE_COLOR,
  PAUSE_TITLE_COLOR_HC,
} from './pauseMenuStyle';

describe('resolvePauseMenuStyle — title size', () => {
  it('uses the short title below the threshold', () => {
    const s = resolvePauseMenuStyle(PAUSE_SHORT_VIEWPORT_HEIGHT - 1, false);
    expect(s.titlePx).toBe(PAUSE_TITLE_SIZE_SHORT);
    expect(s.shortViewport).toBe(true);
  });

  it('uses the wide title at exactly the threshold (>=)', () => {
    const s = resolvePauseMenuStyle(PAUSE_SHORT_VIEWPORT_HEIGHT, false);
    expect(s.titlePx).toBe(PAUSE_TITLE_SIZE_WIDE);
    expect(s.shortViewport).toBe(false);
  });

  it('uses the wide title on tall viewports', () => {
    const s = resolvePauseMenuStyle(800, false);
    expect(s.titlePx).toBe(PAUSE_TITLE_SIZE_WIDE);
  });
});

describe('resolvePauseMenuStyle — title colour', () => {
  it('normal HC-off uses gold', () => {
    expect(resolvePauseMenuStyle(600, false).titleColor).toBe(PAUSE_TITLE_COLOR);
  });

  it('HC-on uses amber-gold (brighter for contrast)', () => {
    expect(resolvePauseMenuStyle(600, true).titleColor).toBe(PAUSE_TITLE_COLOR_HC);
  });
});

describe('resolvePauseMenuStyle — title stroke (2×2 table)', () => {
  it('short + normal = 4', () => {
    expect(resolvePauseMenuStyle(300, false).titleStroke).toBe(4);
  });
  it('short + HC = 6', () => {
    expect(resolvePauseMenuStyle(300, true).titleStroke).toBe(6);
  });
  it('wide + normal = 5', () => {
    expect(resolvePauseMenuStyle(600, false).titleStroke).toBe(5);
  });
  it('wide + HC = 8', () => {
    expect(resolvePauseMenuStyle(600, true).titleStroke).toBe(8);
  });

  it('HC always thickens the stroke vs the matching non-HC row', () => {
    expect(resolvePauseMenuStyle(300, true).titleStroke)
      .toBeGreaterThan(resolvePauseMenuStyle(300, false).titleStroke);
    expect(resolvePauseMenuStyle(600, true).titleStroke)
      .toBeGreaterThan(resolvePauseMenuStyle(600, false).titleStroke);
  });
});

describe('resolvePauseMenuStyle — backdrop alpha', () => {
  it('HC-off uses standard overlay alpha', () => {
    expect(resolvePauseMenuStyle(600, false).backdropAlpha).toBe(0.82);
  });
  it('HC-on uses high-contrast overlay alpha', () => {
    expect(resolvePauseMenuStyle(600, true).backdropAlpha).toBe(0.92);
  });
});

describe('pause menu button palettes', () => {
  it('resume button uses Scottish blue + brighter hover', async () => {
    const { PAUSE_RESUME_BUTTON_PALETTE } = await import('./pauseMenuStyle');
    expect(PAUSE_RESUME_BUTTON_PALETTE.idle).toBe(0x005eb8);
    expect(PAUSE_RESUME_BUTTON_PALETTE.hover).toBe(0x0077dd);
  });

  it('quit button uses neutral grey + lifted hover', async () => {
    const { PAUSE_QUIT_BUTTON_PALETTE } = await import('./pauseMenuStyle');
    expect(PAUSE_QUIT_BUTTON_PALETTE.idle).toBe(0x444444);
    expect(PAUSE_QUIT_BUTTON_PALETTE.hover).toBe(0x555555);
  });

  it('resume + quit are visually distinct (different blues vs greys)', async () => {
    const { PAUSE_RESUME_BUTTON_PALETTE, PAUSE_QUIT_BUTTON_PALETTE } = await import('./pauseMenuStyle');
    expect(PAUSE_RESUME_BUTTON_PALETTE.idle).not.toBe(PAUSE_QUIT_BUTTON_PALETTE.idle);
  });
});
