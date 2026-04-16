/**
 * BossHpTracker — caches the current "spotlight" boss enemy and pushes
 * its HP fraction to the HUD boss bar each tick. Re-scans the enemy
 * group only when the cached boss dies or goes inactive; when multiple
 * bosses overlap (stacked spawns), the one with the lowest HP fraction
 * wins focus (closest to death = most dramatic).
 *
 * Extracted from GameScene.updateBossHPBar. Scene owns the enemy group
 * + HUD; tracker just holds the cache.
 */
import type { Enemy } from '../../entities/Enemy';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import { BOSSES } from '../../data/enemies';
import { t } from '../../core/i18n';

export interface BossHpTrackerHooks {
  getSpawnSystem(): SpawnSystem;
  updateBossBar(data: { name: string; hpFraction: number } | null): void;
}

export class BossHpTracker {
  private cachedBoss: Enemy | null = null;
  private cachedBossConfig: (typeof BOSSES)[number] | null = null;

  constructor(private readonly hooks: BossHpTrackerHooks) {}

  /** Reset cache between runs. Called from scene's transient-state reset. */
  reset(): void {
    this.cachedBoss = null;
    this.cachedBossConfig = null;
  }

  /**
   * Tick — one frame of boss bar maintenance. Cheap when a cached boss
   * is still alive (no group scan); re-scans only on boss death.
   */
  tick(): void {
    // Re-scan only when the cached boss is dead or inactive.
    if (!this.cachedBoss || !this.cachedBoss.active || !this.cachedBoss.isBoss()) {
      this.cachedBoss = null;
      this.cachedBossConfig = null;
      const enemies = this.hooks.getSpawnSystem().getEnemyGroup().children.entries as Enemy[];
      for (const enemy of enemies) {
        if (enemy.active && enemy.isBoss()) {
          // Lowest HP fraction wins — drama follows the dying one.
          if (!this.cachedBoss || enemy.getHpFraction() < this.cachedBoss.getHpFraction()) {
            this.cachedBoss = enemy;
          }
        }
      }
      if (this.cachedBoss) {
        const bossKey = this.cachedBoss.getEnemyKey();
        this.cachedBossConfig = BOSSES.find((b) => b.key === bossKey) ?? null;
      }
    }

    if (this.cachedBoss) {
      this.hooks.updateBossBar({
        name: this.cachedBossConfig ? t(this.cachedBossConfig.nameKey) : this.cachedBoss.getEnemyKey(),
        hpFraction: this.cachedBoss.getHpFraction(),
      });
    } else {
      this.hooks.updateBossBar(null);
    }
  }
}
