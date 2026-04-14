import type { EliteAffixId } from '../data/eliteAffixes';
import type { BiomeId } from '../data/biomes';

export type GlobalEnemyKilledPayload = {
  enemyKey: string;
  xpValue: number;
  wasBoss: boolean;
  wasElite: boolean;
  /** Present when this was a gold elite that rolled an affix. */
  eliteAffixId?: EliteAffixId | null;
};

export type GlobalRunTimePayload = {
  /** Continuous run clock (seconds). */
  gameTimeSec: number;
  /** Floor(gameTimeSec), emitted once per crossed integer second. */
  wholeSecond: number;
};

export type AchievementUnlockPayload = {
  id: string;
  title: string;
};

export type GlobalRunEndedPayload = {
  outcome: 'death' | 'victory';
  gameTimeSec: number;
  enemiesKilled: number;
};

export type GlobalWeaponEvolvedPayload = {
  weaponKey: string;
  evolvedKey: string;
};

export type TutorialCompletedPayload = Record<string, never>;

/** Moor moment hearth beat — rewards already applied; listeners update meta/stats. */
export type GlobalMoorMomentPayload = {
  momentId: string;
  atHomeBiome: boolean;
  biomeId: BiomeId | null;
};

/** First time this account culled an enemy key — meta codex entry added. */
export type CodexFirstCullPayload = {
  enemyKey: string;
};

export type GlobalEvents = {
  GLOBAL_ENEMY_KILLED: GlobalEnemyKilledPayload;
  GLOBAL_RUN_TIME_SEC: GlobalRunTimePayload;
  ACHIEVEMENT_UNLOCKED: AchievementUnlockPayload;
  GLOBAL_RUN_ENDED: GlobalRunEndedPayload;
  GLOBAL_WEAPON_EVOLVED: GlobalWeaponEvolvedPayload;
  TUTORIAL_COMPLETED: TutorialCompletedPayload;
  GLOBAL_MOOR_MOMENT: GlobalMoorMomentPayload;
  CODEX_FIRST_CULL: CodexFirstCullPayload;
  bossEnraged: string;
};

type Handler<T> = (payload: T) => void;

class GlobalEventBus {
  private listeners = new Map<keyof GlobalEvents, Set<Handler<any>>>();

  on<K extends keyof GlobalEvents>(event: K, handler: Handler<GlobalEvents[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Handler<any>);
    return () => this.off(event, handler);
  }

  off<K extends keyof GlobalEvents>(event: K, handler: Handler<GlobalEvents[K]>): void {
    this.listeners.get(event)?.delete(handler as Handler<any>);
  }

  emit<K extends keyof GlobalEvents>(event: K, payload: GlobalEvents[K]): void {
    for (const h of this.listeners.get(event) ?? []) {
      h(payload);
    }
  }
}

/** Process-wide singleton (survives scene restarts). */
export const globalEventBus = new GlobalEventBus();

