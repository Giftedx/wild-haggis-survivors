import { describe, it, expect } from 'vitest';
import {
  resolveMainMenuPalette,
  MAIN_MENU_PALETTE_NORMAL,
  MAIN_MENU_PALETTE_HC,
} from './mainMenuPalette';

describe('resolveMainMenuPalette', () => {
  it('normal palette for highContrast = false', () => {
    expect(resolveMainMenuPalette(false)).toBe(MAIN_MENU_PALETTE_NORMAL);
  });

  it('HC palette for highContrast = true', () => {
    expect(resolveMainMenuPalette(true)).toBe(MAIN_MENU_PALETTE_HC);
  });

  it('every text field differs between normal and HC', () => {
    expect(MAIN_MENU_PALETTE_NORMAL.title).not.toBe(MAIN_MENU_PALETTE_HC.title);
    expect(MAIN_MENU_PALETTE_NORMAL.subdued).not.toBe(MAIN_MENU_PALETTE_HC.subdued);
    expect(MAIN_MENU_PALETTE_NORMAL.hint).not.toBe(MAIN_MENU_PALETTE_HC.hint);
  });

  it('mountain silhouette colours differ between modes', () => {
    expect(MAIN_MENU_PALETTE_NORMAL.mountainDark).not.toBe(MAIN_MENU_PALETTE_HC.mountainDark);
    expect(MAIN_MENU_PALETTE_NORMAL.mountainLight).not.toBe(MAIN_MENU_PALETTE_HC.mountainLight);
  });

  it('each palette uses mountainLight > mountainDark (accent layer on top)', () => {
    // "Light" hex int should be higher — simple proxy for brighter value.
    expect(MAIN_MENU_PALETTE_NORMAL.mountainLight).toBeGreaterThan(MAIN_MENU_PALETTE_NORMAL.mountainDark);
    expect(MAIN_MENU_PALETTE_HC.mountainLight).toBeGreaterThan(MAIN_MENU_PALETTE_HC.mountainDark);
  });

  it('title is a valid 7-char hex in both palettes', () => {
    expect(MAIN_MENU_PALETTE_NORMAL.title).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(MAIN_MENU_PALETTE_HC.title).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
