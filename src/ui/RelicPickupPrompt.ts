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
const PROMPT_DEPTH = 1600;
const NARROW_BREAKPOINT = 600;

export function openRelicPickupPrompt(opts: RelicPickupPromptOpts): RelicPickupPromptHandle {
  const { scene, held, incoming, onReplaceHeld, onReject } = opts;
  const uiScale = opts.uiScale ?? 1;
  const cam = scene.cameras.main;
  const cx = cam.width / 2;
  const cy = cam.height / 2;
  const isNarrow = cam.width < NARROW_BREAKPOINT;
  const availableW = Math.max(260, cam.width - (isNarrow ? 80 : 32));

  const objects: Phaser.GameObjects.GameObject[] = [];

  // Full-screen dim — blocks clicks so the modal owns input.
  const backdrop = scene.add
    .rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.72)
    .setScrollFactor(0)
    .setDepth(PROMPT_DEPTH)
    .setInteractive();
  backdrop.on('pointerdown', () => doReject());
  objects.push(backdrop);

  const title = scene.add
    .text(
      cx, cy - 180 * uiScale,
      resolveModalString('ui.relics.sporran_full.title', 'Sporran’s full'),
      textStyle('heading', {
        color: COLORS_CSS.TOAST_GOLD,
        align: 'center',
        fontSize: isNarrow ? '20px' : undefined,
        wordWrap: { width: Math.min(availableW, cam.width - 40) / Math.max(1, uiScale) },
      }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(PROMPT_DEPTH + 1)
    .setScale(uiScale);
  objects.push(title);

  const hint = scene.add
    .text(
      cx, cy - 140 * uiScale,
      resolveModalString(
        'ui.relics.sporran_full.hint',
        'Pick one to let go, or skip the new relic.',
      ),
      textStyle('label', {
        color: COLORS_CSS.COOL_GREY,
        align: 'center',
        fontSize: isNarrow ? '10px' : undefined,
        wordWrap: { width: Math.min(availableW, cam.width - 44) / Math.max(1, uiScale) },
      }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(PROMPT_DEPTH + 1)
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
  const cols = availableW < cards.length * CARD_W + (cards.length - 1) * CARD_GAP ? 2 : 4;
  const gap = cols === 2 ? 10 : CARD_GAP;
  const compactCards = cols === 2;
  const cardW = Math.min(
    CARD_W,
    compactCards ? 150 : Math.floor((availableW - (cols - 1) * gap) / cols),
    Math.max(120, Math.floor((availableW - (cols - 1) * gap) / cols)),
  );
  const cardH = compactCards ? 164 : CARD_H;
  const rows = Math.ceil(cards.length / cols);
  const totalW = cols * cardW + (cols - 1) * gap;
  const totalH = rows * cardH + (rows - 1) * gap;
  let gridTop = cy - totalH / 2;
  const minGridTop = (compactCards ? 126 : 116) * uiScale;
  const maxGridTop = cam.height - totalH - 16;
  gridTop = Math.max(Math.min(gridTop, maxGridTop), Math.min(minGridTop, maxGridTop));
  title.setY(gridTop - (compactCards ? 64 : 74) * uiScale);
  hint.setY(gridTop - (compactCards ? 28 : 40) * uiScale);
  if (compactCards) {
    const headerTop = Math.round(12 * uiScale);
    const headerBottom = Math.max(headerTop + Math.round(84 * uiScale), gridTop - Math.round(8 * uiScale));
    const header = scene.add
      .rectangle(
        cx,
        (headerTop + headerBottom) / 2,
        Math.min(cam.width - 16, totalW + 32),
        headerBottom - headerTop,
        COLORS.PANEL,
        0.94,
      )
      .setStrokeStyle(2, COLORS.WHISKY_GOLD, 0.5)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 0.5);
    objects.push(header);
  }

  for (let i = 0; i < cards.length; i++) {
    const def = cards[i];
    const isIncoming = i === 3;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cardX = cx - totalW / 2 + cardW / 2 + col * (cardW + gap);
    const cardY = gridTop + cardH / 2 + row * (cardH + gap);
    const cardTop = cardY - cardH / 2;

    const bg = scene.add
      .rectangle(cardX, cardY, cardW, cardH, COLORS.PANEL_SURFACE, 0.98)
      .setStrokeStyle(isIncoming ? 3 : 2, isIncoming ? COLORS.WHISKY_GOLD : def.particleColour)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    objects.push(bg);

    // Swatch at top = relic colour.
    const swatch = scene.add
      .circle(cardX, cardTop + 30, compactCards ? 15 : 18, def.particleColour, 1)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 3);
    objects.push(swatch);
    if (scene.textures.exists(def.iconSprite)) {
      const icon = scene.add
        .image(cardX, cardTop + 30, def.iconSprite)
        .setScrollFactor(0)
        .setDepth(PROMPT_DEPTH + 4)
        .setScale(compactCards ? 0.82 : 0.95);
      objects.push(icon);
    }

    const name = scene.add
      .text(
        cardX, cardTop + 56,
        resolveLocalisedOrPretty(def.nameKey, def.key),
        textStyle('label', { color: COLORS_CSS.TOAST_GOLD, align: 'center',
          fontSize: compactCards ? '12px' : '13px',
          wordWrap: { width: cardW - 16 } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 3);
    objects.push(name);

    const effect = scene.add
      .text(
        cardX, cardTop + (compactCards ? 82 : 108),
        resolveLocalisedOrPretty(def.effectKey, ''),
        textStyle('label', { color: COLORS_CSS.COOL_GREY, align: 'center',
          fontSize: compactCards ? '11px' : '13px', wordWrap: { width: cardW - 16 } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 3);
    objects.push(effect);

    const label = scene.add
      .text(
        cardX, cardY + cardH / 2 - (compactCards ? 14 : 24),
        isIncoming
          ? resolveModalString(
            compactCards ? 'ui.relics.sporran_full.keep_new_short' : 'ui.relics.sporran_full.keep_new',
            compactCards ? 'Skip new relic' : 'Click a held relic to swap, or here to skip',
          )
          : resolveModalString('ui.relics.sporran_full.discard', 'Let this go'),
        textStyle('label', {
          color: isIncoming ? COLORS_CSS.HINT : COLORS_CSS.WHISKY_GOLD,
          align: 'center',
          fontSize: compactCards ? '11px' : '13px',
          wordWrap: { width: cardW - 14 },
        }),
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(PROMPT_DEPTH + 3);
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
