import type { EliteAffixId } from '../data/eliteAffixes';
import type { BiomeId } from '../data/biomes';
import type { PickerSlot, RouteKey } from '../data/routes';

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
  /** W66 Ironmoor — true when the run was taken with single-life mode
   *  on. Feeds portal telemetry so Ironmoor completion rates can be
   *  split from the baseline run pool. Absent on pre-W66 call sites. */
  ironmoor?: boolean;
  /** Variant key the run was taken with (`classic`, `moor_runner`, ...).
   *  Pairs with the matching `run_start` for funnel / completion math. */
  variantKey?: string;
  /** Curse key active for the run, if the player opted into one on the
   *  pre-run Curse screen. Lets the portal rank curse popularity and
   *  completion rates per curse. Absent for curse-less runs. */
  curseKey?: string;
  /** True when the run was taken as a Daily Challenge. Splits the daily
   *  cohort from regular runs in distribution stats. */
  isDaily?: boolean;
  /** Classifier for how the run ended (when `outcome === 'death'`). */
  deathCause?: string;
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

/**
 * A permanent upgrade was purchased (gold shop or meta shop). Feeds
 * portal analytics so upgrade popularity + economy pacing are visible.
 */
export type GlobalShopPurchasePayload = {
  itemKey: string;
  /** Which economy paid: `gold_shop` spends run gold, `meta_shop` spends kill crystals. */
  scope: 'gold_shop' | 'meta_shop';
  /** Currency amount debited. */
  cost: number;
  /** Level after the buy (gold shop only — meta shop items are binary unlocks). */
  newLevel?: number;
};

/**
 * W2 Moor Road — a between-act route was finalised (either player pick or
 * Skip-Intermissions auto-default). Feeds analytics so the route-monotony
 * and skip-rate kill-criteria can be verified against live session data.
 */
export type GlobalRoutePickedPayload = {
  slot: PickerSlot;
  routeKey: RouteKey;
  atGameTimeSec: number;
  /** True when Skip Intermissions was on and the slot auto-resolved. */
  defaultedBySetting: boolean;
};

/**
 * Kill combo crossed a notable threshold (e.g. 100 for the Storm Chaser
 * achievement). Emitted exactly once per threshold per run — JuiceSystem
 * fires on `comboCount === N`, so a dropped combo that rebuilds past N
 * re-triggers. Listeners that must dedupe should idempotent-check.
 */
export type GlobalComboMilestonePayload = {
  count: number;
};

/** A curse was activated at the start of a run. */
export type GlobalCurseStartedPayload = {
  curseKey: string;
};

/**
 * R1 M4 T28 — a Relic pickup was resolved (add or replace-held). The
 * `source` identifies where the roll originated so telemetry can
 * break down pick rate by drop channel (elite / boss / chest / …).
 * `replacedKey` is set on 4th-offered flows where an existing relic
 * was discarded; null otherwise.
 */
export type GlobalRelicPickedPayload = {
  relicKey: string;
  rarity: 'common' | 'uncommon' | 'rare';
  source: 'elite' | 'boss' | 'chest' | 'hidden_node' | 'bargain' | 'unknown';
  replacedKey: string | null;
  atGameTimeSec: number;
};

export type GlobalEvents = {
  GLOBAL_ENEMY_KILLED: GlobalEnemyKilledPayload;
  GLOBAL_RUN_TIME_SEC: GlobalRunTimePayload;
  ACHIEVEMENT_UNLOCKED: AchievementUnlockPayload;
  GLOBAL_RUN_ENDED: GlobalRunEndedPayload;
  GLOBAL_WEAPON_EVOLVED: GlobalWeaponEvolvedPayload;
  TUTORIAL_COMPLETED: TutorialCompletedPayload;
  GLOBAL_MOOR_MOMENT: GlobalMoorMomentPayload;
  GLOBAL_ROUTE_PICKED: GlobalRoutePickedPayload;
  CODEX_FIRST_CULL: CodexFirstCullPayload;
  GLOBAL_SHOP_PURCHASE: GlobalShopPurchasePayload;
  GLOBAL_COMBO_MILESTONE: GlobalComboMilestonePayload;
  GLOBAL_CURSE_STARTED: GlobalCurseStartedPayload;
  GLOBAL_RELIC_PICKED: GlobalRelicPickedPayload;
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
      try {
        h(payload);
      } catch (err) {
        // One bad listener must not break unrelated systems (achievements, analytics, etc.).
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[GlobalEventBus] listener threw', event, err);
        }
      }
    }
  }
}

/** Process-wide singleton (survives scene restarts). */
export const globalEventBus = new GlobalEventBus();

