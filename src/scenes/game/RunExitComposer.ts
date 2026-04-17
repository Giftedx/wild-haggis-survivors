/**
 * RunExitComposer — the run-end data + transition plumbing. Owns:
 *   - buildSummary(victory)       → RunSummary (time, kills, gold, combo)
 *   - buildBuildSummary()         → multi-line "weapon lv★" string
 *   - buildGameOverPayload(...)   → full GameOverPayload for GameOverScene
 *   - transitionToGameOver(...)   → scene.stop(Game) + scene.start(GameOver)
 *                                   + auto-battle report + globalEventBus
 *                                   + clearActiveRun
 *   - abandonRunToMainMenu()      → clearActiveRun + music stop + MainMenu
 *
 * Scene transitions are routed through three callback hooks so this
 * class doesn't import Phaser directly — tests mock them.
 */
import type { SaveManager } from '../../core/SaveManager';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { VariantDef } from '../../data/variants';
import type { CurseKey } from '../../data/curses';
import type { RNG } from '../../utils/rng';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RunSummary, RunResult } from '../../utils/save';
import type { GameOverPayload } from '../gameOverPayload';
import type { PersonalBests } from '../../core/SaveManager';
import type { DeathCause } from '../../core/deathCauseClassifier';
import type { RunScoreState } from './RunScoreState';
import { formatRunVariantLabel } from '../../data/variants';
import { encodeSeed } from '../../utils/rng';
import { t } from '../../core/i18n';
import { globalEventBus } from '../../core/GlobalEventBus';
import { reportAutoBattleRunEnd } from '../../dev/AutoBattler';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';

export interface RunExitHooks {
  getWeaponSystem(): WeaponSystem;
  getSpawnSystem(): SpawnSystem;
  getJuice(): JuiceSystem;
  getXPSystem(): XPSystem;
  getRunStatsTracker(): RunStatsTracker;
  getSaveManager(): SaveManager;
  getActiveVariant(): VariantDef;
  getActiveCurseKey(): CurseKey | null;
  getRunRng(): RNG;
  getRunModifiers(): RunModifiers;
  isDailyRun(): boolean;
  /** W66 Ironmoor: flags the run as single-life mode for the GameOver payload. */
  isIronmoorRun(): boolean;
  /** Seconds the player survived past the Bell — 0 when not in Post-Bell. */
  getSecondsPastBell(): number;

  /** Shared per-run score (kill/boss/gold counters). */
  getRunScore(): RunScoreState;

  getOwnedPassivesLength(): number;
  getEvolvedWeaponsLength(): number;

  // Phaser-side transitions — injected so this module stays Phaser-free.
  stopGameScene(): void;
  startGameOverScene(payload: GameOverPayload): void;
  startMainMenuScene(): void;
}

/** Number of weapons listed per line in the build summary. */
const BUILD_SUMMARY_WEAPONS_PER_LINE = 3;
/** Separator between weapons on the same line. */
const BUILD_SUMMARY_SEPARATOR = '  |  ';

export class RunExitComposer {
  constructor(private readonly hooks: RunExitHooks) {}

  /** Snapshot the per-run totals needed for result screens + history. */
  buildSummary(victory: boolean): RunSummary {
    const h = this.hooks;
    const score = h.getRunScore();
    return {
      timeSurvivedSec: h.getSpawnSystem().getGameTimeSec(),
      enemiesKilled: score.killCount,
      bossGold: score.bossGoldEarned,
      coinGold: score.coinGoldEarned,
      bestCombo: h.getJuice().getBestCombo(),
      victory,
      goldMult: h.getRunModifiers().goldMult,
    };
  }

  /** Multi-line "weapon lv★" build summary, 3 weapons per line. */
  buildBuildSummary(): string {
    const parts = this.hooks.getWeaponSystem().getWeapons().map((weapon) => {
      const name = t(weapon.config.nameKey);
      const lv = t('ui.hud.level_fmt', { level: weapon.level });
      return `${name} ${lv}${weapon.evolved ? '★' : ''}`;
    });
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += BUILD_SUMMARY_WEAPONS_PER_LINE) {
      lines.push(parts.slice(i, i + BUILD_SUMMARY_WEAPONS_PER_LINE).join(BUILD_SUMMARY_SEPARATOR));
    }
    return lines.join('\n');
  }

  /** Assemble the full payload passed to GameOverScene on transition. */
  buildGameOverPayload(
    mode: 'victory' | 'death',
    summary: RunSummary,
    runResult: RunResult,
    previousBests?: PersonalBests,
    deathCause?: DeathCause,
  ): GameOverPayload {
    const h = this.hooks;
    return {
      mode,
      isVictory: mode === 'victory',
      summary,
      runResult,
      xpLevel: h.getXPSystem().getLevel(),
      bossKillCount: h.getRunScore().bossKillCount,
      ownedPassiveCount: h.getOwnedPassivesLength(),
      weaponCount: h.getWeaponSystem().getWeapons().length,
      evolvedCount: h.getEvolvedWeaponsLength(),
      buildSummary: this.buildBuildSummary(),
      variantLabel: formatRunVariantLabel(h.getActiveVariant()),
      variantKey: h.getActiveVariant().key,
      weaponDamage: h.getRunStatsTracker().snapshot(),
      previousBests,
      seedCode: encodeSeed(h.getRunRng().seed),
      runSeed: h.getRunRng().seed,
      isDaily: h.isDailyRun(),
      ...(h.isIronmoorRun() ? { ironmoor: true } : {}),
      ...(h.getSecondsPastBell() > 0 ? { postBellSec: Math.floor(h.getSecondsPastBell()) } : {}),
      curseKey: h.getActiveCurseKey() ?? undefined,
      deathCause,
    };
  }

  /**
   * Stop GameScene and hand UI off to GameOverScene. Side effects are
   * best-effort (try/catch each) so a failure in one branch doesn't
   * strand the player on a frozen scene.
   */
  transitionToGameOver(payload: GameOverPayload): void {
    try {
      reportAutoBattleRunEnd({
        outcome: payload.mode === 'victory' ? 'victory' : 'death',
        gameTimeSec: payload.summary.timeSurvivedSec,
        weaponDamage: payload.weaponDamage,
      });
    } catch {
      /* ignore */
    }
    try {
      globalEventBus.emit('GLOBAL_RUN_ENDED', {
        outcome: payload.mode,
        gameTimeSec: payload.summary.timeSurvivedSec,
        enemiesKilled: payload.summary.enemiesKilled,
        ironmoor: payload.ironmoor,
      });
    } catch {
      /* ignore */
    }
    try {
      this.hooks.getSaveManager().clearActiveRun();
    } catch {
      /* ignore */
    }
    this.hooks.stopGameScene();
    this.hooks.startGameOverScene(payload);
  }

  /** Quit-to-menu from a pause menu or forfeit path. Drops the active run. */
  abandonToMainMenu(): void {
    try {
      this.hooks.getSaveManager().clearActiveRun();
    } catch {
      /* ignore */
    }
    musicEngine.stop();
    this.hooks.startMainMenuScene();
  }
}
