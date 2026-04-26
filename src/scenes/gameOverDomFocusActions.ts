import { t } from '../core/i18n';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for the run-result (GameOver) screen.
 *
 * Pure helper that builds the `DomFocusAction[]` consumed by
 * `createDomFocusLayer`. Phaser-free so unit tests can verify label
 * resolution + action ordering without booting a scene.
 *
 * Action layout matches the visible Phaser button row left-to-right:
 *   1. PLAY AGAIN  → restart through Curse picker
 *   2. GOLD SHOP   → between-run upgrade shop
 *   3. TAE GRAN'S  → Croft hub (post-T9)
 *
 * No Back / dismiss action — the GameOver overlay is terminal; every
 * resolution exits the scene through one of the three buttons.
 */
export interface GameOverDomActionInput {
  /** Restart the run through the Curse picker (matches the visible button). */
  onPlayAgain(): void;
  /** Open the between-run upgrade shop. */
  onGoldShop(): void;
  /** Return to Gran's Croft hub. */
  onTaeGran(): void;
}

export function buildGameOverDomFocusActions(
  input: GameOverDomActionInput,
): DomFocusAction[] {
  return [
    {
      id: 'gameover-play-again',
      label: t('ui.gameOver.play_again'),
      onActivate: () => input.onPlayAgain(),
    },
    {
      id: 'gameover-gold-shop',
      label: t('ui.gameOver.upgrades'),
      onActivate: () => input.onGoldShop(),
    },
    {
      id: 'gameover-tae-gran',
      label: t('ui.gameOver.menu'),
      onActivate: () => input.onTaeGran(),
    },
  ];
}
