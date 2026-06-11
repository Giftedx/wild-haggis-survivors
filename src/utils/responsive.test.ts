import { describe, expect, it } from 'vitest';
import {
  getViewportClass,
  isMobileViewport,
  isTabletViewport,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
} from './responsive';

describe('getViewportClass', () => {
  it('returns mobile below the mobile breakpoint', () => {
    expect(getViewportClass(MOBILE_BREAKPOINT - 1)).toBe('mobile');
    expect(getViewportClass(390)).toBe('mobile');
    expect(getViewportClass(0)).toBe('mobile');
  });

  it('returns mobile at exactly the mobile breakpoint', () => {
    expect(getViewportClass(MOBILE_BREAKPOINT)).toBe('tablet');
  });

  it('returns tablet between the two breakpoints', () => {
    expect(getViewportClass(MOBILE_BREAKPOINT)).toBe('tablet');
    expect(getViewportClass(768)).toBe('tablet');
    expect(getViewportClass(TABLET_BREAKPOINT - 1)).toBe('tablet');
  });

  it('returns desktop at and above the tablet breakpoint', () => {
    expect(getViewportClass(TABLET_BREAKPOINT)).toBe('desktop');
    expect(getViewportClass(1280)).toBe('desktop');
    expect(getViewportClass(1920)).toBe('desktop');
  });
});

describe('isMobileViewport', () => {
  it('returns true below the mobile breakpoint', () => {
    expect(isMobileViewport(599)).toBe(true);
    expect(isMobileViewport(390)).toBe(true);
  });

  it('returns false at and above the mobile breakpoint', () => {
    expect(isMobileViewport(MOBILE_BREAKPOINT)).toBe(false);
    expect(isMobileViewport(1024)).toBe(false);
  });
});

describe('isTabletViewport', () => {
  it('returns true below the tablet breakpoint', () => {
    expect(isTabletViewport(TABLET_BREAKPOINT - 1)).toBe(true);
    expect(isTabletViewport(768)).toBe(true);
  });

  it('returns false at and above the tablet breakpoint', () => {
    expect(isTabletViewport(TABLET_BREAKPOINT)).toBe(false);
    expect(isTabletViewport(1920)).toBe(false);
  });
});

describe('breakpoint invariants', () => {
  it('mobile breakpoint is less than tablet breakpoint', () => {
    expect(MOBILE_BREAKPOINT).toBeLessThan(TABLET_BREAKPOINT);
  });
});
