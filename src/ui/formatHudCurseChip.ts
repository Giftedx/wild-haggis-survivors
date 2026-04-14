import { t } from '../core/i18n';
import { getCurseByKey, type CurseKey } from '../data/curses';

/** Same string as `HUD` curse chip and pause overlay — single source for `ui.hud.curse_chip`. */
export function formatHudCurseChipLine(activeKey: CurseKey | null): string | null {
  const c = activeKey ? getCurseByKey(activeKey) : null;
  return c ? t('ui.hud.curse_chip', { name: t(c.nameKey), pct: c.goldBonusPct }) : null;
}
