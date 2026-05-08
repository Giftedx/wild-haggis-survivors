import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(__dirname, '..');

/**
 * Ceiling values in lines (wc -l). Each entry: file path relative to src/, max LOC.
 *
 * Lower an entry only after that file has been split. Never raise silently.
 *
 * Baseline: 2026-04-30 audit (commit 46635f8). Charter target for
 * GameScene: ≤1200 (T401 spec). See docs/superpowers/plans/2026-04-30-codebase-restructure.md.
 */
const LOC_BUDGET: ReadonlyArray<readonly [string, number]> = [
  ['core/i18n.ts', 4720],
  ['core/i18n.scs.ts', 4010],
  ['scenes/GameScene.ts', 2985],
  ['data/banter.ts', 2240],
  ['utils/save.ts', 100], // was 1840 (Phase 1 split — barrel re-export over save/*.ts)
  ['art/sprites/icons/cards.ts', 5], // was 1725 (Phase 2.1 split — barrel re-export over cards/*.ts)
  ['art/sprites/icons/weapons.ts', 5], // was 1615 (Phase 2.2 split — barrel re-export over weapons/*.ts)
  ['entities/Enemy.ts', 1570],
  ['art/sprites/croft/seasonalProps.ts', 5], // was 1550 (Phase 2.3 split — barrel re-export over seasonalProps/*.ts)
  ['entities/Player.ts', 1540],
  ['systems/JuiceSystem.ts', 1380],
  ['scenes/SettingsScene.ts', 1350],
  ['systems/WeaponSystem.ts', 1330],
  ['scenes/GameOverScene.ts', 1310],
  ['ui/HUD.ts', 1225],
  ['systems/AudioSystem.ts', 1210],
  ['art/sprites/decorations/biomeProps.ts', 1095],
];

describe('LOC budget ratchet', () => {
  for (const [relPath, ceiling] of LOC_BUDGET) {
    it(`${relPath} ≤ ${ceiling} LOC`, () => {
      const abs = join(SRC_ROOT, relPath);
      const lines = readFileSync(abs, 'utf-8').split('\n').length;
      expect(
        lines,
        `${relPath} grew to ${lines} LOC (ceiling ${ceiling}). Either split the file or raise the ceiling intentionally — never silently.`,
      ).toBeLessThanOrEqual(ceiling);
    });
  }
});
