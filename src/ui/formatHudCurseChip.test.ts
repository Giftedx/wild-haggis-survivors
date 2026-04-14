import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { formatHudCurseChipLine } from './formatHudCurseChip';

describe('formatHudCurseChipLine', () => {
  it('returns null when there is no curse', () => {
    expect(formatHudCurseChipLine(null)).toBeNull();
  });

  it('matches ui.hud.curse_chip for a known curse def', () => {
    const line = formatHudCurseChipLine('heavy_legs');
    expect(line).toBe(
      t('ui.hud.curse_chip', { name: t('curse.heavy_legs.name'), pct: 30 }),
    );
  });
});
