/* eslint-disable @typescript-eslint/no-explicit-any -- the bus stores typed
   handlers in a single Map with type-erased values (`Set<Handler<any>>`).
   The public `on/off/emit<K>(...)` API enforces the per-event payload type;
   the internal `any` is the type-erasure boundary. Replacing with `unknown`
   would force every callsite to add a redundant cast for no real benefit. */

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

/**
 * T131 — emitted whenever a `localStorage.setItem` call fails (quota
 * exhausted, private mode, blocked context). UI surfaces (Game / Menu /
 * Settings) listen and show a one-shot toast so silent persistence
 * failures stop hiding behind a swallowed catch.
 */
export type GlobalSaveFailedPayload = {
  /** Which storage path threw — disambiguates meta vs settings vs legacy save.ts. */
  path: 'meta' | 'active_run' | 'settings' | 'legacy_save';
  /** Best-effort error message (Error.message, or 'unknown'). */
  reason: string;
};

/**
 * Cu Sith Three-Bay Warning telegraph event. Fires once per bay
 * transition from `Enemy.behaviorThreeBay`. GameScene listens, throttles
 * across multiple Cu Siths (max 1 toast per ~3 s), and surfaces a
 * Hearth-grave toast announcing the bay number — first / second /
 * third (the third coincides with the charge lock-on).
 */
export type CuSithBayPayload = {
  /** 1, 2, or 3. The third bay locks on; the player has the third
   *  bay's window to sidestep before charge release. */
  stage: 1 | 2 | 3;
  /** Bay-source position so the GameScene listener can play
   *  spatialised audio / scatter visual particles if it wants. */
  x: number;
  y: number;
};

export interface GlobalCailleachGauntletWonPayload {
  /** Cairns wreathed by this gauntlet completion. */
  readonly wreathedSavedAts: readonly number[];
}

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
  GLOBAL_SAVE_FAILED: GlobalSaveFailedPayload;
  CU_SITH_BAY: CuSithBayPayload;
  /** V2 — Cailleach Gauntlet completed successfully. */
  GLOBAL_CAILLEACH_GAUNTLET_WON: GlobalCailleachGauntletWonPayload;
  bossEnraged: string;
  /** Nuckelavee periodic breath attack — payload is the boss position
   *  so the receiver can spawn the drought zone at the right location. */
  nuckelaveeBreath: { x: number; y: number };
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

