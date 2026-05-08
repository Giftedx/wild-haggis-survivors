/**
 * Inner panel backgrounds (stats / weapon-damage / gold / unlock)
 * extracted from GameOverScene as part of the Phase 5 scene drain.
 * Owns the panel-stack vertical layout math (heights scale with
 * uiScale, lower panels clamp inside PANEL_H so link/button rows at
 * the bottom stay clickable) and mounts the four background rectangles
 * with their fade-in tween.
 *
 * Returns the layout positions downstream code needs to anchor its
 * text content (loadout summary, weapon rows, gold title, unlock
 * content, seed readout).
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';

export interface RenderGameOverInnerPanelsOpts {
  panelCenterX: number;
  panelTop: number;
  PANEL_W: number;
  PANEL_H: number;
  /** Canvas height — used to clamp the unlock panel above the bottom edge. */
  height: number;
  compact: boolean;
  uiScale: number;
  /** Base depth — panels render at depthBase + 2. */
  depthBase: number;
}

export interface GameOverInnerPanelLayout {
  /** Inner content width — `compact` shaves more for narrow viewports. */
  innerW: number;
  /** Effective scale applied to per-panel heights (`max(1, uiScale)`). */
  panelScale: number;
  /** Top edge of the weapon-damage panel — anchors loadout summary text. */
  weaponPanelTop: number;
  /** Centre Y of the gold panel — anchors gold-title text. */
  goldPanelCenterY: number;
  /** Final centre Y of the unlock panel after height/PANEL_H clamp. */
  unlockPanelY: number;
  /** Height of the unlock panel — used by seed-readout clamp math. */
  unlockPanelH: number;
}

export function renderGameOverInnerPanels(
  scene: Phaser.Scene,
  opts: RenderGameOverInnerPanelsOpts,
): GameOverInnerPanelLayout {
  const { panelCenterX, panelTop, PANEL_W, PANEL_H, height, compact, uiScale, depthBase: d } = opts;

  const innerW = compact ? PANEL_W - 32 : PANEL_W - 88;
  // Panel heights scale with uiScale so the scaled text inside each one
  // (weaponBody, goldText, unlockContent) doesn't spill past the panel
  // border at uiScale 1.4. The weaponDamagePanel holds the most text
  // (loadoutSummary + heading + 3 weapon rows) so it gets full scale;
  // gold/unlock panels scale a touch less since their content is tighter.
  // When the panel stack would exceed the PANEL_H budget, lower panels
  // clamp so link/button rows at the panel bottom stay clickable.
  const panelScale = Math.max(1, uiScale);
  const weaponPanelH = Math.round((compact ? 150 : 158) * panelScale);
  const goldPanelH = Math.round((compact ? 64 : 70) * panelScale);
  const unlockPanelH = Math.round((compact ? 90 : 94) * panelScale);
  // weaponDamagePanel: keep top anchored near stats panel bottom (+273)
  // so scaled content grows downward, not up into the variant/curse chips.
  const weaponPanelTop = panelTop + (compact ? 250 : 273);
  const weaponPanelCenterY = weaponPanelTop + weaponPanelH / 2;
  const weaponPanelBottom = weaponPanelTop + weaponPanelH;
  // goldPanel: sits immediately under the weapon panel with a small gap.
  const goldPanelCenterY = weaponPanelBottom + 2 + goldPanelH / 2;
  const goldPanelBottom = goldPanelCenterY + goldPanelH / 2;
  // unlockPanel: clamped so it never leaks past canvas bottom on short
  // viewports (native 600 was pushing ~9px offscreen even at uiScale 1)
  // *and* keeps breathing room above the link/button rows that anchor
  // at PANEL_H - 44 / PANEL_H - 22. Without the PANEL_H clamp a 1.4x
  // panel would push its bottom edge behind the rerun link.
  const unlockPanelCenterYIdeal = goldPanelBottom + 2 + unlockPanelH / 2;
  const unlockPanelCenterYMax = Math.min(
    height - 8 - unlockPanelH / 2,
    panelTop + PANEL_H - Math.round(56 * panelScale) - unlockPanelH / 2,
  );
  const unlockPanelY = Math.min(unlockPanelCenterYIdeal, unlockPanelCenterYMax);
  const statsPanel = scene.add
    .rectangle(panelCenterX, panelTop + (compact ? 204 : 226), innerW, 92, 0x131d32, 0.95)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setStrokeStyle(1, 0x283a5f, 1)
    .setAlpha(0);
  const goldPanel = scene.add
    .rectangle(panelCenterX, goldPanelCenterY, innerW, goldPanelH, 0x141d2f, 0.95)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setStrokeStyle(1, 0x2f435f, 1)
    .setAlpha(0);
  const weaponDamagePanel = scene.add
    .rectangle(panelCenterX, weaponPanelCenterY, innerW, weaponPanelH, 0x0f1828, 0.95)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setStrokeStyle(1, 0x243552, 1)
    .setAlpha(0);
  const unlockPanel = scene.add
    .rectangle(panelCenterX, unlockPanelY, innerW, unlockPanelH, 0x121a2a, 0.95)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setStrokeStyle(1, 0x283447, 1)
    .setAlpha(0);
  scene.tweens.add({ targets: [statsPanel, weaponDamagePanel, goldPanel, unlockPanel], alpha: 1, duration: 260, delay: 520 });

  return {
    innerW,
    panelScale,
    weaponPanelTop,
    goldPanelCenterY,
    unlockPanelY,
    unlockPanelH,
  };
}
