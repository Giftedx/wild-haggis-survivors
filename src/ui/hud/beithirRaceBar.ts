import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';
import { RACE_DURATION_MS } from '../../entities/raceTheBeithir';

export interface BeithirRaceBarRefs {
  /** Bar background — hidden when idle. */
  bg: Phaser.GameObjects.Rectangle;
  /** Foreground fill — width tracks remaining-fraction × chip width. */
  fill: Phaser.GameObjects.Rectangle;
  /** Label text — diegetic line above the bar. */
  text: Phaser.GameObjects.Text;
}

/**
 * Race the Beithir HUD bar (DESIGN_IDEAS §1) — top-centre live-tension
 * widget that appears only while a sting is active. *Distinct* from
 * the bottom-left skill-widget column (HP / whisky / stance / parry):
 * the race is an *event*, not a *state*, and the dramatic top-centre
 * placement signals "drop everything, this is now the loop's main
 * frame".
 *
 * Visual states:
 *   - **idle** — fully hidden (bg + fill + text invisible). The widget
 *     is unallocated visual real-estate when there's no race; the moor
 *     reads cleaner without a passive Beithir indicator.
 *   - **active** — visible. Bar drains left-to-right (full → empty);
 *     fill colour is rust-bronze (matches the Beithir sprite's scale-
 *     glint accent — the venom-warning palette). Text reads the
 *     localised "BEITHIR — HEAL OR KILL" label.
 *
 * Cure / expire is *not* a separate state on this widget — both paths
 * collapse to idle (hidden). The cure SFX + banter (heal-cure / kill-
 * cure) and the expire damage flash carry the *consequence* read; the
 * bar's job ends when the race ends.
 *
 * Position: top-centre of the viewport, below the boss-warn band so a
 * Beithir-during-boss doesn't fight the boss banner for the same row.
 */
const BAR_W = 168;
const BAR_H = 9;
const BAR_TOP_Y = 38;          // below standard boss-warn band
const TEXT_GAP_PX = 10;        // text sits this far above the bar

export function buildBeithirRaceBar(ctx: HudWidgetContext): BeithirRaceBarRefs {
  const { scene, depth: d, viewport } = ctx;
  const cx = viewport.x + viewport.width / 2;
  const x = cx - BAR_W / 2;
  const y = BAR_TOP_Y;

  const bg = ctx.addEl(
    scene.add.rectangle(x, y, BAR_W, BAR_H, 0x1a1410, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x6a4828, 0.85)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false),
  );
  const fill = ctx.addEl(
    scene.add.rectangle(x, y, BAR_W, BAR_H, 0xb88a4a, 0.95)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(d + 1.5)
      .setVisible(false),
  );
  const text = ctx.addEl(
    scene.add.text(cx, y - TEXT_GAP_PX, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e8c060',          // amber-green — sister to the sprite's eye glow
      fontStyle: 'bold',
      stroke: '#1a1410',
      strokeThickness: 2,
    })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(d + 2)
      .setVisible(false),
  );

  return { bg, fill, text };
}

/** Total race duration in ms — re-exported so HUD code keeps one
 *  import for tuning constants alongside the helper. */
export const BEITHIR_RACE_DURATION_MS = RACE_DURATION_MS;

/** Pixel width of the bar — used by HUD update to compute fill width. */
export const BEITHIR_RACE_BAR_PIXEL_WIDTH = BAR_W;
