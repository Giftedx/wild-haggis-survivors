import { describe, expect, it } from 'vitest';
import { BOSSES } from '../data/enemies';
import {
  BOSS_WARNING_BANTER_CONTEXT,
  BOSS_WARNING_CAPTION_TINT,
  buildBossWarningCue,
} from './bossWarningCue';

describe('buildBossWarningCue', () => {
  it('builds a caption and banter cue for every boss warning', () => {
    for (const boss of BOSSES) {
      const cue = buildBossWarningCue(boss);
      expect(cue.warning, `warning for ${boss.key}`).not.toBe(boss.warningKey);
      expect(cue.warning.length, `warning length for ${boss.key}`).toBeGreaterThan(0);
      expect(cue.captionId).toBe(`boss_${boss.key}`);
      expect(cue.captionTint).toBe(BOSS_WARNING_CAPTION_TINT);
      expect(cue.banterContext).toBe(BOSS_WARNING_BANTER_CONTEXT);
      expect(cue.banterTag).toBe(boss.key);
    }
  });

  it('keeps boss warnings in the ui.bossWarning i18n namespace', () => {
    for (const boss of BOSSES) {
      expect(boss.warningKey, `warningKey for ${boss.key}`).toMatch(/^ui\.bossWarning\./);
    }
  });
});
