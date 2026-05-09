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
  ['scenes/GameScene.ts', 1790], // bumped 2026-05-09 (1740→1790) for Lemmings Easter Egg wiring (DESIGN_IDEAS §13 — lemmingsEasterEgg field + LemmingsEasterEgg ctor block + reset deps + setter); current 1781 + 9 grace; was 2985 → 2182 → 1680 (Phase 7 re-baseline); T401 floor 1656
  ['data/banter.ts', 2700], // bumped 2026-05-09 (2670→2700) for up_helly_aa seasonal sub-pool (DESIGN_IDEAS §12 Up Helly Aa Shetland fire festival — 12 leaves under seasonal_event keysByTag, lifts cohort to 13/13; window Feb 9-15 honours broader Shetland season — Lerwick marquee sits inside Burns Night, codebase resolves overlap by insertion order); current 2681 + 19 grace; pure data, parity-fenced, kept whole. Earlier bumps same day: 2620→2670 (field_note_pickup), 2565→2620 (beithir_sting), 2535→2565 (lemmings_remember), 2490→2535 (taxman_grudge), 2455→2490 (clootie_wager), 2430→2455 (shinty_parry), 2400→2430 (stance_change), 2375→2400 (simmer_dim seasonal)
  ['utils/save.ts', 95], // was 1840 → 100 (Phase 1 split) → 95 (Phase 7 re-baseline; current 89 + 6 grace)
  ['art/sprites/icons/cards.ts', 5], // was 1725 (Phase 2.1 barrel)
  ['art/sprites/icons/weapons.ts', 5], // was 1615 (Phase 2.2 barrel)
  ['entities/Enemy.ts', 1670], // bumped 2026-05-09 (1585→1670) for Race the Beithir (DESIGN_IDEAS §1 — `fireBeithirFang` mirrors `fireNet` shape with parry hook + venom-fang projectile + sting-on-contact via `applyBeithirStingFromFang`; behaviorRanged forks on config.key === 'beithir'; die() top-of-method routes through cureBeithirStingFromKill); current 1657 + 13 grace; hot path, factored via entities/ siblings. Earlier bump same day (1570→1585) for Nicnevin spawnerMinionKey
  ['art/sprites/croft/seasonalProps.ts', 5], // was 1550 (Phase 2.3 barrel)
  ['entities/Player.ts', 1860], // bumped 2026-05-09 (1840→1860) for Stag Antler weapon (DESIGN_IDEAS §5 — getIsDashing + getDashFacingAngle public getters exposing the dash state for the WeaponSystem dash-strike fork); current 1847 + 13 grace; hot path. Earlier bumps same day: 1720→1840 (Race the Beithir), 1705→1720 (Clootie Rag Wager), 1620→1705 (Shinty Parry), 1556→1620 (Stance Toggle)
  ['systems/JuiceSystem.ts', 1065], // was 1380 → 1065 (Phase 6 sub-system split; current 1059 + 6 grace)
  ['scenes/SettingsScene.ts', 685], // was 1350 → 845 → 685 (Phase 7 re-baseline; row builders under scenes/settings/; current 677 + 8 grace)
  ['systems/WeaponSystem.ts', 1685], // bumped 2026-05-09 (1450→1685) for Stag Antler weapon (DESIGN_IDEAS §5 — dashStrikeStates Map + tickDashStrike per-frame fork in update() + fireDashStrike method (140 LOC: arc/full-circle damage + visual + knockback + freeze branches) + monarch_charge fireEvolved case + arc_sweep visual fork for stag colour); current 1670 + 15 grace; orchestrator, no obvious sub-system seams. Earlier bumps same day: 1415→1450 (Sgian Dubh), 1385→1415 (Shinty Stick weapon), 1360→1385 (Taxman Grudge Ledger emit)
  ['scenes/GameOverScene.ts', 300], // was 1310 → 300 (Phase 7 re-baseline; panel/row/link/action builders under scenes/game-over/; current 292 + 8 grace)
  ['ui/HUD.ts', 1310], // bumped 2026-05-09 (1245→1310) for Race the Beithir HUD bar (DESIGN_IDEAS §1 — top-centre live-tension bar widget refs + setBeithirRace updater + visibility-edge cache + onset pulse tween); chip widget extracted to ui/hud/beithirRaceBar.ts so most of the bulk lives outside HUD.ts; current 1294 + 16 grace. Earlier bumps same day: 1165→1245 (Shinty Parry), 1100→1165 (Stance Toggle)
  ['systems/AudioSystem.ts', 1500], // bumped 2026-05-09 (1365→1500) for Race the Beithir SFX trio (DESIGN_IDEAS §1 — `playBeithirSting` hiss+bite+tail-drop layered, `playBeithirCure` clean upward sine sweep, `playBeithirExpire` low square thud + dirty noise transient); current 1485 + 15 grace; orchestrator, no obvious sub-system seams. Earlier bumps same day: 1315→1365 (Lemmings OH NO!), 1245→1315 (Shinty Parry SFX pair), 1210→1245 (Pibroch sting)
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
