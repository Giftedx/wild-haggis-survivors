/**
 * E1 M4 T22 — Seasonal event banner.
 *
 * Subtle run-of-page banner that appears near the top of hub scenes
 * (MainMenu + Croft) when a seasonal event window is active. Fades
 * out on its own after ~5 s so it doesn't block the UI. Pure Phaser
 * Text + Tween; no event subscriptions — the caller re-evaluates on
 * every scene `create()` so the banner state tracks the device
 * calendar automatically across sessions.
 *
 * Rendered only when:
 *   - a seasonal event is active (opt-out resolved at call-site),
 *   - the scene is a hub (not GameScene — in-run UI is handled by
 *     the run-start ceremony stinger + banter, not a HUD banner).
 */

import * as Phaser from 'phaser';
import { t } from '../core/i18n';
import { COLORS_CSS } from '../config';
import { getActiveSeasonalEventKey } from '../systems/SeasonalEventManager';
import { getSettingsManager } from '../core/SettingsManager';

/** Handle returned to the caller so scene-shutdown can dispose cleanly. */
export interface SeasonalBannerHandle {
  destroy(): void;
}

const FADE_IN_MS = 400;
const DWELL_MS = 5_000;
const FADE_OUT_MS = 1_200;

/**
 * Render a seasonal event banner on the given scene if an event is
 * active. Returns a handle whose `destroy()` cancels any in-flight
 * tween and removes the text — hook it into your scene's shutdown
 * reset block so re-entering the scene doesn't layer banners.
 */
export function installSeasonalEventBanner(
  scene: Phaser.Scene,
): SeasonalBannerHandle | null {
  const disabled = getSettingsManager().load().disableSeasonalEvents;
  const eventKey = getActiveSeasonalEventKey(new Date(), disabled);
  if (!eventKey) return null;

  const bannerKey = `seasonalEvent.${eventKey}.ceremony_banner`;
  const text = t(bannerKey);
  // Defensive: unresolved key returns the dot-path verbatim — hide
  // the banner rather than render raw `seasonalEvent.foo...` at the
  // player. Older saves may stamp events that have since been
  // dropped from the i18n tree.
  if (!text || text === bannerKey) return null;

  const { width } = scene.scale;
  const label = scene.add
    .text(width / 2, 20, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: COLORS_CSS.WHISKY_GOLD,
      fontStyle: 'italic',
      align: 'center',
    })
    .setOrigin(0.5, 0)
    .setDepth(200)
    .setAlpha(0)
    .setScrollFactor(0);

  const fadeIn = scene.tweens.add({
    targets: label, alpha: 1, duration: FADE_IN_MS, ease: 'Quad.easeOut',
  });
  const fadeOut = scene.tweens.add({
    targets: label, alpha: 0, duration: FADE_OUT_MS, ease: 'Quad.easeIn',
    delay: FADE_IN_MS + DWELL_MS,
    onComplete: () => label.destroy(),
  });

  return {
    destroy(): void {
      scene.tweens.remove(fadeIn);
      scene.tweens.remove(fadeOut);
      label.destroy();
    },
  };
}
