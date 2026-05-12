import type Phaser from 'phaser';
import { paginationState } from './pagination';
import { createGameButton } from './gameButton';
import { textStyle } from './typography';

/** Returned by `createPaginationNav` — wire rects into `GamepadMenuNav` (T407). */
export interface PaginationNavHandle {
  destroy: () => void;
  prevRect: Phaser.GameObjects.Rectangle | null;
  nextRect: Phaser.GameObjects.Rectangle | null;
}

/** Pure layout calculator — testable without Phaser. */
export function buildPaginationLayout(totalItems: number, perPage: number, page: number) {
  return paginationState(totalItems, perPage, page);
}

/**
 * Render a prev/page/next navigation row using tertiary-tier buttons.
 * Returns a handle with `destroy` plus prev/next rects for `GamepadMenuNav` (T407).
 */
export function createPaginationNav(
  scene: Phaser.Scene,
  x: number,
  y: number,
  totalItems: number,
  perPage: number,
  page: number,
  onPageChange: (newPage: number) => void,
): PaginationNavHandle {
  const state = paginationState(totalItems, perPage, page);
  const objects: Phaser.GameObjects.GameObject[] = [];

  if (!state.pageVisible) return { destroy: () => {}, prevRect: null, nextRect: null };

  // Prev button — tertiary tier, disabled if on first page
  const prevBtn = createGameButton(scene, {
    x: x - 80, y, width: 38, height: 32,
    label: '◀', tier: 'tertiary', fontSize: '14px',
  });
  if (state.prevEnabled) {
    prevBtn.rect.on('pointerdown', () => onPageChange(state.clampedPage - 1));
  } else {
    prevBtn.rect.setAlpha(0.4);
    prevBtn.label.setAlpha(0.4);
    prevBtn.rect.disableInteractive();
  }
  objects.push(prevBtn.rect, prevBtn.label);

  // Page label
  const pageLabel = scene.add.text(x, y, state.pageLabel, textStyle('label')).setOrigin(0.5);
  objects.push(pageLabel);

  // Next button
  const nextBtn = createGameButton(scene, {
    x: x + 80, y, width: 38, height: 32,
    label: '▶', tier: 'tertiary', fontSize: '14px',
  });
  if (state.nextEnabled) {
    nextBtn.rect.on('pointerdown', () => onPageChange(state.clampedPage + 1));
  } else {
    nextBtn.rect.setAlpha(0.4);
    nextBtn.label.setAlpha(0.4);
    nextBtn.rect.disableInteractive();
  }
  objects.push(nextBtn.rect, nextBtn.label);

  return {
    destroy: () => objects.forEach((o) => o.destroy()),
    prevRect: prevBtn.rect,
    nextRect: nextBtn.rect,
  };
}
