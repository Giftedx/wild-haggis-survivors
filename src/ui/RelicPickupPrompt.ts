/**
 * RelicPickupPrompt — 4th-relic discard picker modal (R1 M2 T17).
 *
 * Opens when the player picks up a Relic while all 3 slots are full.
 * Shows the 3 held + the incoming relic as clickable cards. Clicking
 * a held card discards it and takes the incoming. Clicking the
 * incoming card (or pressing Escape) cancels — pickup is consumed,
 * no slot change.
 *
 * Time stops while the prompt is open (via the TimeManager token the
 * caller acquires) so the player reads the options without pressure.
 *
 * Routing logic is in `relicCollect.ts` (pure, unit-tested); this
 * file is the Phaser render path only.
 *
 * M3 adds tooltip + better art. M2 ships the minimum functional UI so
 * the e2e smoke can exercise the 4th-offered path.
 */
import type Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { textStyle } from './typography';
import type { RelicDef } from '../data/relics';

/**
 * Resolve an i18n key to a display string with a pretty-printed
 * fallback derived from the relic key. M4 Task 25 authors the real
 * copy; until then the modal still reads as "Sporran Of Holding"
 * instead of the raw `relics.sporran_of_holding.name` path.
 */
function resolveLocalisedOrPretty(key: string, fallbackFromRelicKey: string): string {
  const resolved = t(key);
  if (resolved !== key) return resolved;
  return fallbackFromRelicKey
    .split('_')
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function resolveModalString(key: string, fallback: string): string {
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

export interface RelicPickupPromptOpts {
  scene: Phaser.Scene;
  held: readonly (RelicDef | null)[];
  incoming: RelicDef;
  uiScale?: number;
  /** Called with the held-slot index the player chose to discard. */
  onReplaceHeld(slotIndex: 0 | 1 | 2): void;
  /** Called when the player rejects the incoming (Escape / click incoming). */
  onReject(): void;
}

export interface RelicPickupPromptHandle {
  close(): void;
}

const CARD_W = 180;
const CARD_H = 220;
const CARD_GAP = 16;

export function openRelicPickupPrompt(opts: RelicPickupPromptOpts): RelicPickupPromptHandle {
  const { scene, held, incoming, onReplaceHeld, onReject } = opts;
  const uiScale = opts.uiScale ?? 1;
  const cam = scene.cameras.main;
  const cx = cam.worldView.x + cam.width / 2;
  const cy = cam.worldView.y + cam.height / 2;

  const objects: Phaser.GameObjects.GameObject[] = [];

  // Full-screen dim — blocks clicks so the modal owns input.
  const backdrop = scene.add
    .rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.72)
    .setScrollFactor(0)
    .setDepth(1000)
    .setInteractive();
  backdrop.on('pointerdown', () => doReject());
  objects.push(backdrop);

  const title = scene.add
    .text(
      cx, cy - 180 * uiScale,
      resolveModalString('ui.relics.sporran_full.title', 'Sporran’s full'),
      textStyle('heading', { color: COLORS_CSS.TOAST_GOLD, align: 'center' }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1001)
    .setScale(uiScale);
  objects.push(title);

  const hint = scene.add
    .text(
      cx, cy - 140 * uiScale,
      resolveModalString(
        'ui.relics.sporran_full.hint',
        'Pick one to let go, or skip the new relic.',
      ),
      textStyle('label', { color: COLORS_CSS.COOL_GREY, align: 'center' }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1001)
    .setScale(uiScale);
  objects.push(hint);

  // 4 cards laid out left → right: held[0], held[1], held[2], incoming.
  // Each card blocks the backdrop's click so the modal reads correctly.
  const cards: RelicDef[] = [
    held[0]!,
    held[1]!,
    held[2]!,
    incoming,
  ];
  const totalW = cards.length * CARD_W + (cards.length - 1) * CARD_GAP;
  const startX = cx - totalW / 2 + CARD_W / 2;
  for (let i = 0; i < cards.length; i++) {
    const def = cards[i];
    const isIncoming = i === 3;
    const cardX = startX + i * (CARD_W + CARD_GAP);
    const cardY = cy;

    const bg = scene.add
      .rectangle(cardX, cardY, CARD_W, CARD_H, COLORS.PANEL_SURFACE, 0.98)
      .setStrokeStyle(isIncoming ? 3 : 2, isIncoming ? COLORS.WHISKY_GOLD : def.particleColour)
      .setScrollFactor(0)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
    objects.push(bg);

    // Swatch at top = relic colour.
    const swatch = scene.add
      .circle(cardX, cardY - CARD_H / 2 + 32, 18, def.particleColour, 1)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(1003);
    objects.push(swatch);

    const name = scene.add
      .text(
        cardX, cardY - CARD_H / 2 + 64,
        resolveLocalisedOrPretty(def.nameKey, def.key),
        textStyle('label', { color: COLORS_CSS.TOAST_GOLD, align: 'center',
          wordWrap: { width: CARD_W - 16 } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1003);
    objects.push(name);

    const effect = scene.add
      .text(
        cardX, cardY - 8,
        resolveLocalisedOrPretty(def.effectKey, ''),
        textStyle('label', { color: COLORS_CSS.COOL_GREY, align: 'center',
          fontSize: '13px', wordWrap: { width: CARD_W - 16 } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1003);
    objects.push(effect);

    const label = scene.add
      .text(
        cardX, cardY + CARD_H / 2 - 24,
        isIncoming
          ? resolveModalString('ui.relics.sporran_full.keep_new', 'Click a held relic to swap, or here to skip')
          : resolveModalString('ui.relics.sporran_full.discard', 'Let this go'),
        textStyle('label', { color: isIncoming ? COLORS_CSS.HINT : COLORS_CSS.WHISKY_GOLD, align: 'center' }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1003);
    objects.push(label);

    bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff, 1));
    bg.on('pointerout', () => bg.setStrokeStyle(
      isIncoming ? 3 : 2,
      isIncoming ? COLORS.WHISKY_GOLD : def.particleColour,
    ));
    bg.on('pointerdown', () => {
      if (isIncoming) {
        doReject();
      } else {
        doReplace(i as 0 | 1 | 2);
      }
    });
  }

  // Escape key also cancels.
  const escKey = scene.input.keyboard?.addKey('ESC');
  escKey?.once('down', () => doReject());

  let closed = false;
  function close(): void {
    if (closed) return;
    closed = true;
    escKey?.removeAllListeners();
    for (const o of objects) {
      if (o) o.destroy();
    }
  }

  function doReplace(index: 0 | 1 | 2): void {
    if (closed) return;
    close();
    onReplaceHeld(index);
  }

  function doReject(): void {
    if (closed) return;
    close();
    onReject();
  }

  return { close };
}
