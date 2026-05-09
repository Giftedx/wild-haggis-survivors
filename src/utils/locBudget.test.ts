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
  ['scenes/GameScene.ts', 1740], // bumped 2026-05-09 (1715→1740) for Clootie Rag Wager wiring (DESIGN_IDEAS §1 — clootieTree field + clootieSpawnSec field + reset deps + buildSecondTickHookContext entries + spawnClootieTree method, all sister-pattern to reliquary); current 1731 + 9 grace; was 2985 → 2182 → 1680 (Phase 7 re-baseline); T401 floor 1656
  ['data/banter.ts', 2535], // bumped 2026-05-09 (2490→2535) for taxman_grudge pool (DESIGN_IDEAS §1 Taxman Grudge Ledger — context union member + pool entry, edge tone, priority 85, four verdict sub-pools coward/bruiser/precise/reckless + generic-even fallback through `keys`); current 2524 + 11 grace; pure data, parity-fenced, kept whole. Earlier bumps same day: 2455→2490 (clootie_wager) + 2430→2455 (shinty_parry) + 2400→2430 (stance_change) + 2375→2400 (simmer_dim seasonal)
  ['utils/save.ts', 95], // was 1840 → 100 (Phase 1 split) → 95 (Phase 7 re-baseline; current 89 + 6 grace)
  ['art/sprites/icons/cards.ts', 5], // was 1725 (Phase 2.1 barrel)
  ['art/sprites/icons/weapons.ts', 5], // was 1615 (Phase 2.2 barrel)
  ['entities/Enemy.ts', 1585], // bumped 2026-05-09 (1570→1585) for spawnerMinionKey passthrough (Nicnevin's unseelie_fiddler summoner); current 1577 + 8 grace; hot path, factored via entities/ siblings
  ['art/sprites/croft/seasonalProps.ts', 5], // was 1550 (Phase 2.3 barrel)
  ['entities/Player.ts', 1720], // bumped 2026-05-09 (1705→1720) for Clootie Rag Wager (DESIGN_IDEAS §1 — applyClootieWagerCost method clamps current HP to new max with floor 1, sister to addMaxHp); current 1715 + 5 grace; hot path. Earlier bumps same day: 1620→1705 (Shinty Parry), 1556→1620 (Stance Toggle)
  ['systems/JuiceSystem.ts', 1065], // was 1380 → 1065 (Phase 6 sub-system split; current 1059 + 6 grace)
  ['scenes/SettingsScene.ts', 685], // was 1350 → 845 → 685 (Phase 7 re-baseline; row builders under scenes/settings/; current 677 + 8 grace)
  ['systems/WeaponSystem.ts', 1385], // bumped 2026-05-09 (1360→1385) for Taxman Grudge Ledger emit (DESIGN_IDEAS §1 — `eliteOrBossFinished` event added in dealDamageToEnemy, fires only on elite/boss kill with precomputed distancePx); current 1377 + 8 grace; orchestrator, no obvious sub-system seams. Earlier bump same day (1335→1360) for Pibroch on-fire stamping
  ['scenes/GameOverScene.ts', 300], // was 1310 → 300 (Phase 7 re-baseline; panel/row/link/action builders under scenes/game-over/; current 292 + 8 grace)
  ['ui/HUD.ts', 1245], // bumped 2026-05-09 (1165→1245) for Shinty Parry setShintyParry method + chip refs + per-state fill/stroke palette + cooldown sweep fill + one-shot pulse tween (DESIGN_IDEAS §1); chip widget itself extracted to ui/hud/parryChip.ts; current 1238 + 7 grace. Earlier bump same day (1100→1165) for Stance Toggle
  ['systems/AudioSystem.ts', 1315], // bumped 2026-05-09 (1245→1315) for Shinty Parry SFX pair (`playShintyParryOpen` woosh + `playShintyParry` caman-tok with noise transient, DESIGN_IDEAS §1); current 1305 + 10 grace; orchestrator, no obvious sub-system seams. Earlier bump same day (1210→1245) for Pibroch sting
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
