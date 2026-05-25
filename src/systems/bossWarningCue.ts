import type { BossConfig } from '../data/enemies';
import { t } from '../core/i18n';

export const BOSS_WARNING_CAPTION_TINT = '#ff6644';
export const BOSS_WARNING_BANTER_CONTEXT = 'boss_warn';

export interface BossWarningCue {
  readonly warning: string;
  readonly captionId: string;
  readonly captionTint: string;
  readonly banterContext: typeof BOSS_WARNING_BANTER_CONTEXT;
  readonly banterTag: string;
}

export function buildBossWarningCue(
  boss: Pick<BossConfig, 'key' | 'warningKey'>,
): BossWarningCue {
  return {
    warning: t(boss.warningKey),
    captionId: `boss_${boss.key}`,
    captionTint: BOSS_WARNING_CAPTION_TINT,
    banterContext: BOSS_WARNING_BANTER_CONTEXT,
    banterTag: boss.key,
  };
}
