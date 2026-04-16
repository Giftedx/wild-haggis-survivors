import type { AchievementId } from './BalanceConfig';
import { ACHIEVEMENT_DEFS } from './BalanceConfig';
import { t } from './i18n';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';
import { BOSSES } from '../data/enemies';
import { ROUTES } from '../data/routes';
import { VARIANT_KEYS } from '../data/variants';
import { getCodexRosterTotal } from '../ui/chronicleAggregates';
import { loadSave } from '../utils/save';

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
      globalEventBus.on('GLOBAL_WEAPON_EVOLVED', () => this.tryUnlock('ach_first_evolution')),
      globalEventBus.on('GLOBAL_MOOR_MOMENT', () => this.onMoorMoment())
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
    if (p.enemyKey) {
      let codexNew = false;
      this.save.update((cur) => {
        if (cur.codexCulledKeys.includes(p.enemyKey)) return cur;
        codexNew = true;
        return {
          ...cur,
          codexCulledKeys: [...cur.codexCulledKeys, p.enemyKey].sort(),
        };
      });
      if (codexNew) {
        globalEventBus.emit('CODEX_FIRST_CULL', { enemyKey: p.enemyKey });
        const n = this.save.load().codexCulledKeys.length;
        const total = getCodexRosterTotal();
        const halfTarget = Math.max(1, Math.ceil(total * 0.5));
        if (n >= halfTarget) this.tryUnlock('ach_codex_half');
        if (n >= total) this.tryUnlock('ach_codex_loremaster');
      }
    }
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
    // W2 + W66 deeds read the gameplay save's freshly-written final
    // entry — RunHistoryRecorder runs ahead of this bus emit.
    try {
      const gameplay = loadSave();
      const seen = new Set<string>();
      for (const entry of gameplay.runHistory ?? []) {
        for (const pick of entry.routes ?? []) seen.add(pick.routeKey);
      }
      if (seen.size >= ROUTES.length) this.tryUnlock('ach_walk_every_road');

      if (p.outcome === 'victory') {
        const lastEntry = gameplay.runHistory?.[gameplay.runHistory.length - 1];
        if (lastEntry?.ironmoor === true) this.tryUnlock('ach_ironmoor_victor');
        if (lastEntry?.variantKey === 'laird') this.tryUnlock('ach_laird_victor');
      }

      // ach_full_herd: unlocked every playable variant. Read after the
      // save migrator's `evaluateVariantUnlocks` pass has run on this
      // run's stats, so freshly-won unlocks are reflected immediately.
      const unlocked = gameplay.unlockedVariants ?? [];
      if (unlocked.length >= VARIANT_KEYS.length) this.tryUnlock('ach_full_herd');
    } catch {
      // best-effort — don't let a corrupt save block run-end flow.
    }
  }

  private onMoorMoment(): void {
    let next = 0;
    this.save.update((cur) => {
      next = cur.moorMomentsLifetime + 1;
      return { ...cur, moorMomentsLifetime: next };
    });
    if (next >= 30) this.tryUnlock('ach_moor_hearth_30');
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
