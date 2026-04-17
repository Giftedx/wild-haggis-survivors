/**
 * Pure layout maths for the Level-Up upgrade card row.
 *
 * Given the UI viewport (left / top / width / height) and the
 * number of cards to show, produces the per-card width, height,
 * horizontal gap, and the x / y coordinates of the first card's
 * centre. Extracted from UpgradeCardsUI so the responsive sizing
 * rules — "reserve hover-expansion room", "center the row when it
 * fits", "shrink the cards before overflowing" — are unit-testable
 * without spinning up Phaser.
 *
 * The 210×260 card is the design target; narrower viewports shrink
 * proportionally down to the 72-pixel hard floor so the cards
 * remain interactable even on a phone.
 */

export const UPGRADE_CARD_MAX_W = 210;
export const UPGRADE_CARD_ASPECT = 260 / 210;
export const UPGRADE_CARD_HOVER_SCALE = 1.05;
export const UPGRADE_CARD_MIN_W = 90;
/** Hard floor — the UI remains usable even when the player is on a 320px wide viewport. */
export const UPGRADE_CARD_HARD_MIN_W = 72;

export interface UpgradeCardLayoutInput {
  left: number;
  top: number;
  width: number;
  height: number;
  cardCount: number;
}

export interface UpgradeCardLayout {
  cardW: number;
  cardH: number;
  gap: number;
  startX: number;
  cardY: number;
}

export function computeUpgradeCardLayout(input: UpgradeCardLayoutInput): UpgradeCardLayout {
  const { left, top, width, height, cardCount } = input;
  const gap = Math.max(10, Math.min(20, Math.round(width * 0.02)));
  const sideMargin = Math.max(16, Math.round(width * 0.06));
  const availableW = Math.max(160, width - sideMargin * 2);

  // Reserve hover-expansion room so the outer edge of hovered edge-cards
  // stays visible on narrow viewports.
  let cardW = Math.min(
    UPGRADE_CARD_MAX_W,
    ((availableW - (cardCount - 1) * gap) / cardCount) / UPGRADE_CARD_HOVER_SCALE,
  );
  cardW = Math.max(UPGRADE_CARD_MIN_W, cardW);
  // Still overflowing? Drop hover-room and use the hard floor.
  if (cardCount * cardW + (cardCount - 1) * gap > availableW) {
    cardW = Math.max(UPGRADE_CARD_HARD_MIN_W, (availableW - (cardCount - 1) * gap) / cardCount);
  }

  const cardH = Math.round(cardW * UPGRADE_CARD_ASPECT);
  const totalW = cardCount * cardW + (cardCount - 1) * gap;
  const startX = left + sideMargin + cardW / 2 + Math.max(0, (availableW - totalW) / 2);

  const minCardY = cardH / 2 + 20;
  const maxCardY = height - cardH / 2 - 72;
  const cardY = top + Math.max(minCardY, Math.min(height / 2 + 20, maxCardY));

  return { cardW, cardH, gap, startX, cardY };
}
