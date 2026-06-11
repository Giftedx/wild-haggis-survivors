import * as Phaser from 'phaser';

export interface HudWidgetContext {
  scene: Phaser.Scene;
  /** Initial viewport snapshot — widgets place themselves here, then `refreshResponsiveLayout` repositions on resize. */
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  /** Base depth (50). Widget builders may stack +1, +2, +3 on top. */
  depth: number;
  /** Comfort UI scale from settings. */
  uiScale: number;
  /** Bar dimensions shared by HP/XP/whisky widgets. */
  hpBarW: number;
  hpBarH: number;
  xpBarH: number;
  /** Append-tracker for HUD lifecycle (destroy()). Bound to `this.addEl`. */
  addEl<T extends Phaser.GameObjects.GameObject>(el: T): T;
}
