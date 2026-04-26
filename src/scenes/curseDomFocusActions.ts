import { t } from '../core/i18n';
import { CURSES, type CurseKey } from '../data/curses';
import type { DomFocusAction } from '../ui/domFocusLayer';

/**
 * T407 — DOM-visible focus mirror for the Curse picker.
 *
 * Pure helper that builds the `DomFocusAction[]` consumed by
 * `createDomFocusLayer`. Kept Phaser-free so unit tests can verify
 * label resolution + action ordering without booting a scene.
 *
 * Action layout matches the Phaser-side tile order — 4 curses + the
 * "clean run" opt-out + an explicit Back action. The DOM layer exposes
 * Back as a separate focusable rather than relying on ESC, which screen
 * readers handle inconsistently.
 */
export interface CurseDomActionInput {
  /** Called when the user activates a curse tile (DOM click, Enter, Space). */
  onPickCurse(key: CurseKey): void;
  /** Called when the user activates the "clean run" opt-out tile. */
  onPickClean(): void;
  /** Called when the user activates the Back action (parity with ESC). */
  onBack(): void;
  /**
   * Called when the focused index changes via DOM focus events. The
   * scene mirrors this back into its Phaser-side `focusedTileIndex` so
   * tile highlighting + the visible cursor stay in sync with assistive
   * technology focus.
   */
  onFocusChange?(index: number): void;
}

export function buildCurseDomFocusActions(input: CurseDomActionInput): DomFocusAction[] {
  const actions: DomFocusAction[] = CURSES.map((curse) => ({
    id: `curse-${curse.key}`,
    label: `${t(curse.nameKey)} — ${t(curse.descKey)} (${t('ui.curseScene.gold_chip', { pct: curse.goldBonusPct })})`,
    onActivate: () => input.onPickCurse(curse.key),
  }));
  actions.push({
    id: 'curse-clean-run',
    label: `${t('ui.curseScene.none_title')} — ${t('ui.curseScene.none_desc')}`,
    onActivate: () => input.onPickClean(),
  });
  actions.push({
    id: 'curse-back',
    label: t('ui.curseScene.back'),
    onActivate: () => input.onBack(),
  });
  return actions;
}
