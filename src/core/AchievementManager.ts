import type { AchievementId } from './BalanceConfig';
import { ACHIEVEMENT_DEFS } from './BalanceConfig';
import { t } from './i18n';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';
import { BOSSES } from '../data/enemies';

/**
 * Listens to global gameplay events and unlocks achievements into SaveManager.
 * Registered after MetaProgressSystem so kill totals are up to date on GLOBAL_ENEMY_KILLED.
 */
export class AchievementManager {
  private save: SaveManager;
  private started = false;
  private unsubs: Array<() => void> = [];

  constructor(saveManager?: SaveManager) {
    this.save = saveManager ?? new SaveManager();
  }

  /** Boss keys killed during the current run — reset on run start. */
  private runBossKills = new Set<string>();

  start(): void {
    if (this.started) return;
    this.started = true;
    this.runBossKills.clear();
    this.unsubs.push(
      globalEventBus.on('GLOBAL_ENEMY_KILLED', (p) => this.onEnemyKilled(p)),
      globalEventBus.on('GLOBAL_RUN_TIME_SEC', (p) => this.onRunTime(p)),
      globalEventBus.on('GLOBAL_RUN_ENDED', (p) => this.onRunEnded(p)),
      globalEventBus.on('GLOBAL_WEAPON_EVOLVED', () => this.tryUnlock('ach_first_evolution'))
    );
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }

  private onEnemyKilled(p: import('./GlobalEventBus').GlobalEnemyKilledPayload): void {
    const s = this.save.load();
    // Kill-count achievements read the LIFETIME total (balance + spent) so
    // heavy MetaShop spenders don't permanently fall off the unlock curve.
    const lifetimeKills = s.totalKills + s.totalKillsSpent;
    if (lifetimeKills >= 1000) this.tryUnlock('ach_kills_1000');
    if (lifetimeKills >= 5000) this.tryUnlock('ach_kills_5000');
    if (p.wasBoss) {
      this.runBossKills.add(p.enemyKey);
      if (p.enemyKey === 'taxman') this.tryUnlock('ach_defeat_taxman');
      // Derive from BOSSES data so adding/removing a boss type keeps the
      // achievement threshold honest.
      if (this.runBossKills.size >= BOSSES.length) this.tryUnlock('ach_all_bosses');
    }
  }

  private onRunTime(p: import('./GlobalEventBus').GlobalRunTimePayload): void {
    if (p.gameTimeSec >= 300) this.tryUnlock('ach_survive_5m');
    if (p.gameTimeSec >= 600) this.tryUnlock('ach_survive_10m');
    if (p.gameTimeSec >= 900) this.tryUnlock('ach_full_run');
  }

  private onRunEnded(p: import('./GlobalEventBus').GlobalRunEndedPayload): void {
    if (p.outcome === 'victory') this.tryUnlock('ach_first_victory');
    this.runBossKills.clear();
  }

  private tryUnlock(id: AchievementId): void {
    if (!ACHIEVEMENT_DEFS[id]) return;
    let did = false;
    this.save.update((cur) => {
      if (cur.unlockedAchievements.includes(id)) return cur;
      did = true;
      return {
        ...cur,
        unlockedAchievements: [...cur.unlockedAchievements, id],
      };
    });
    if (did) {
      globalEventBus.emit('ACHIEVEMENT_UNLOCKED', {
        id,
        title: t(ACHIEVEMENT_DEFS[id].titleKey),
      });
    }
  }
}

export const achievementManager = new AchievementManager();
