/**
 * Shared dependency bag used by per-row builder helpers extracted from
 * SettingsScene. The class still owns its private fields; this context
 * is constructed once via SettingsScene.rowContext() and passed by
 * reference into each builder so the builders can read scale/uiScale,
 * advance the row cursor, and push to gpRows / domRowSyncs without
 * re-entering the class through `this`.
 *
 * `takeRowY()` reads-and-advances `rowY` per call — matches the existing
 * inline pattern of `const y = this.rowY; this.rowY += rowStep;`.
 *
 * Pure shape — no Phaser eval at module top, safe under vitest node env.
 */
import type * as Phaser from 'phaser';
import type { ISettingsData } from '../../core/SettingsManager';
import type { SettingsDomActionInput } from '../settingsDomFocusActions';

export type SettingsGpRowKind = 'slider' | 'toggle' | 'back';

export type SettingsGpRow =
  | {
      kind: 'slider';
      minus: () => void;
      plus: () => void;
      mark: Phaser.GameObjects.Rectangle;
    }
  | {
      kind: 'toggle';
      toggle: () => void;
      mark: Phaser.GameObjects.Rectangle;
    }
  | {
      kind: 'back';
      go: () => void;
      mark: Phaser.GameObjects.Rectangle;
    };

export interface SettingsRowContext {
  /** Phaser scene used for `add.*`, `tweens`, and `scale.width`. */
  scene: Phaser.Scene;
  /** Mutable working copy of settings — row builders read+write fields. */
  working: ISettingsData;
  /** UI scale — applied to widget visuals (text/scale on rectangles). */
  uiScale: number;
  /** Layout scale — drives row stride compression on small viewports. */
  layoutScale: number;
  /** Base row stride before layoutScale (pre-multiplied step). */
  baseRowStep: number;
  /** Foreground color for slider value text. */
  valueColor: string;
  /** True when high-contrast theming is active — affects palette anchors. */
  highContrastUi: boolean;
  /** Reads current `rowY` and advances by `round(baseRowStep * layoutScale)`. */
  takeRowY(): { y: number; rowStep: number };
  /** Live array — builders push their `gpRow` here. */
  gpRows: SettingsGpRow[];
  /** Live array — builders push a domAction-syncer thunk here. */
  domRowSyncs: Array<() => SettingsDomActionInput>;
  isNarrowLayout(): boolean;
  /** Adds the standard left-aligned row label and returns the text object. */
  addRowLabel(label: string, y: number, yOffset?: number): Phaser.GameObjects.Text;
  /** Returns the centered x for a right-side control of the given width. */
  rightControlCenter(controlWidth: number): number;
  /** Compacts a label for the DOM mirror (pure passthrough). */
  compactSettingsLabel(label: string): string;
  /** Persist working copy + apply audio/locale/preview side-effects. */
  persistAndApply(): void;
  /** Refresh the DOM action layer (call after a row's value changes). */
  refreshDomActions(): void;
}
