import { t } from '../core/i18n';

export const LEMMINGS_PARADE_CAPTION_ID = 'lemmings_parade';
export const LEMMINGS_PARADE_CAPTION_TINT = '#b4e2a8';
export const LEMMINGS_PARADE_BANTER_CONTEXT = 'lemmings_remember';

export interface LemmingsParadeCue {
  readonly captionId: typeof LEMMINGS_PARADE_CAPTION_ID;
  readonly caption: string;
  readonly captionTint: typeof LEMMINGS_PARADE_CAPTION_TINT;
  readonly banterContext: typeof LEMMINGS_PARADE_BANTER_CONTEXT;
}

export function buildLemmingsParadeCue(): LemmingsParadeCue {
  return {
    captionId: LEMMINGS_PARADE_CAPTION_ID,
    caption: t('captions.lemmings_parade'),
    captionTint: LEMMINGS_PARADE_CAPTION_TINT,
    banterContext: LEMMINGS_PARADE_BANTER_CONTEXT,
  };
}
