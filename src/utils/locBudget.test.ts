import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(__dirname, '..');

/**
 * Ceiling values in lines (wc -l). Each entry: file path relative to src/, max LOC.
 *
 * Lower an entry only after that file has been split. Never raise silently.
 *
 * Baseline: 2026-04-30 audit (commit 46635f8). Re-baselined 2026-05-09 after
 * Phase 5 (GameScene regrowth extraction) + Phase 4 (GameOverScene/SettingsScene
 * splits) shipped. Charter target for GameScene: ≤1200 (T401 spec); current
 * ceiling 1680 honours T401 floor 1656 ± 24. See
 * docs/superpowers/plans/2026-04-30-codebase-restructure.md.
 */
const LOC_BUDGET: ReadonlyArray<readonly [string, number]> = [
  ['core/i18n.ts', 115], // was 4720 → 120 (Phase 3.1 split) → 115 (Phase 7 re-baseline 2026-05-09; current 110 + 5 grace)
  ['core/i18n.scs.ts', 20], // was 4010 (Phase 3.2 barrel; current 14 + 6 grace)
  ['scenes/GameScene.ts', 1680], // was 2985 → 2182 → 1680 (Phase 7 re-baseline 2026-05-09; Phase 5 buckets 1-11+14 shipped; current 1672 + 8 grace; T401 floor 1656)
  ['data/banter.ts', 2240], // current 2234 + 6 grace; pure data, kept whole
  ['utils/save.ts', 95], // was 1840 → 100 (Phase 1 split) → 95 (Phase 7 re-baseline; current 89 + 6 grace)
  ['art/sprites/icons/cards.ts', 5], // was 1725 (Phase 2.1 barrel)
  ['art/sprites/icons/weapons.ts', 5], // was 1615 (Phase 2.2 barrel)
  ['entities/Enemy.ts', 1570], // current 1564 + 6 grace; hot path, factored via entities/ siblings
  ['art/sprites/croft/seasonalProps.ts', 5], // was 1550 (Phase 2.3 barrel)
  ['entities/Player.ts', 1540], // current 1537 + 3 grace; hot path, factored via entities/ siblings
  ['systems/JuiceSystem.ts', 1065], // was 1380 → 1065 (Phase 6 sub-system split; current 1059 + 6 grace)
  ['scenes/SettingsScene.ts', 685], // was 1350 → 845 → 685 (Phase 7 re-baseline; row builders under scenes/settings/; current 677 + 8 grace)
  ['systems/WeaponSystem.ts', 1330], // current 1328 + 2 grace; orchestrator, no obvious sub-system seams
  ['scenes/GameOverScene.ts', 300], // was 1310 → 300 (Phase 7 re-baseline; panel/row/link/action builders under scenes/game-over/; current 292 + 8 grace)
  ['ui/HUD.ts', 1100], // was 1225 → 1100 (Phase 4 widget builders; current 1097 + 3 grace)
  ['systems/AudioSystem.ts', 1210], // current 1208 + 2 grace; orchestrator, no obvious sub-system seams
  ['art/sprites/decorations/biomeProps.ts', 5], // was 1095 (Phase 2.4 barrel)
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
