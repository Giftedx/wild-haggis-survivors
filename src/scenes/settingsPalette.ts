/**
 * Pure palette resolver for the SettingsScene.
 *
 * The scene itself reads the `highContrastUi` accessibility toggle
 * and picks one of two palettes — a cozy warm set by default, and a
 * higher-contrast set for players with the toggle on. The colours
 * were inlined as ternaries in ~10 places throughout SettingsScene,
 * making the palette awkward to audit or adjust. This pulls the
 * whole swatch into a single pure function, tested in isolation.
 */

export interface SettingsPalette {
  /** Big title at the top of the screen. */
  titleColor: string;
  /** Subtitle under the title. */
  subtitleColor: string;
  /** Quiet hint text ("Comfort options…" helper line). */
  hintColor: string;
  /** Setting row label (e.g. "Master Volume"). */
  labelColor: string;
  /** Section header (e.g. "Sound", "Comfort"). */
  sectionColor: string;
  /** Numeric value text shown on the right of sliders. */
  valueColor: string;
  /** Soft ember glow drawn behind the title. */
  emberGlow: number;
  /** Warm accent used for slider fills, section strokes, etc. */
  sectionAccent: number;
  /** Red accent used on the Ironmoor confirm button (destructive). */
  dangerAccent: number;
}

export function resolveSettingsPalette(highContrastUi: boolean): SettingsPalette {
  if (highContrastUi) {
    return {
      titleColor: '#ffe6a8',
      subtitleColor: '#b8c3d4',
      hintColor: '#9ba6bc',
      labelColor: '#e6efff',
      sectionColor: '#ffe066',
      valueColor: '#a0c8f0',
      emberGlow: 0x4a2a12,
      sectionAccent: 0xffe066,
      dangerAccent: 0xff6a4a,
    };
  }
  return {
    titleColor: '#ffd98a',
    subtitleColor: '#8a93a8',
    hintColor: '#6a7388',
    labelColor: '#c8d0e0',
    sectionColor: '#d8b877',
    valueColor: '#88aacc',
    emberGlow: 0x2a1a0c,
    sectionAccent: 0xd8b877,
    dangerAccent: 0xb84a2a,
  };
}
