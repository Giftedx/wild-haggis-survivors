import { globalEventBus } from './GlobalEventBus';
import { getSettingsManager } from './SettingsManager';

/** Swappable backend (CrazyGames, Poki, custom) — gameplay code never imports portal SDKs directly. */
export interface IAnalyticsProvider {
  logEvent(name: string, data?: Record<string, unknown>): void;
  triggerGameplayStart(): void;
  triggerGameplayStop(): void;
}

/** Default provider: visible in devtools; safe no-op for sensitive data (never log PII). */
export class ConsoleAnalyticsProvider implements IAnalyticsProvider {
  logEvent(name: string, data?: Record<string, unknown>): void {
    console.info('[analytics:logEvent]', name, data ?? {});
  }

  triggerGameplayStart(): void {
    console.info('[analytics:gameplayStart]');
  }

  triggerGameplayStop(): void {
    console.info('[analytics:gameplayStop]');
  }
}

/**
 * Bridges `GlobalEventBus` and portal lifecycle hooks. Start once after boot;
 * use `beginGameplaySession` / `endGameplaySession` from `GameScene` for strict portal semantics.
 *
 * `telemetryOptIn` gates only `run_start` / `run_end` logs; boss/tutorial events always forward.
 */
export class AnalyticsManager {
  private readonly provider: IAnalyticsProvider;
  private busUnsubs: Array<() => void> = [];
  private busStarted = false;
  private sessionDepth = 0;

  constructor(provider?: IAnalyticsProvider) {
    this.provider = provider ?? new ConsoleAnalyticsProvider();
  }

  /** Subscribe to global bus events (idempotent). */
  ensureBusHandlersStarted(): void {
    if (this.busStarted) return;
    this.busStarted = true;

    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_ENEMY_KILLED', (p) => {
        if (p.wasBoss) {
          this.safeLogEvent('boss_kill', {
            enemyKey: p.enemyKey,
            wasElite: p.wasElite,
            xpValue: p.xpValue,
          });
        }
        if (
          p.wasElite
          && p.eliteAffixId
          && this.runDistributionTelemetryEnabled()
        ) {
          this.safeLogEvent('elite_affix_kill', {
            eliteAffixId: p.eliteAffixId,
            enemyKey: p.enemyKey,
          });
        }
      })
    );

    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_RUN_ENDED', (p) => {
        if (!this.runDistributionTelemetryEnabled()) return;
        this.safeLogEvent('run_end', {
          outcome: p.outcome,
          gameTimeSec: p.gameTimeSec,
          enemiesKilled: p.enemiesKilled,
          ironmoor: p.ironmoor === true,
          isDaily: p.isDaily === true,
          ...(p.variantKey ? { variantKey: p.variantKey } : {}),
          ...(p.curseKey ? { curseKey: p.curseKey } : {}),
          ...(p.deathCause ? { deathCause: p.deathCause } : {}),
        });
      })
    );

    this.busUnsubs.push(
      globalEventBus.on('TUTORIAL_COMPLETED', () => {
        this.safeLogEvent('tutorial_completed', {});
      })
    );

    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_MOOR_MOMENT', (p) => {
        if (!this.runDistributionTelemetryEnabled()) return;
        this.safeLogEvent('moor_moment', {
          momentId: p.momentId,
          atHomeBiome: p.atHomeBiome,
          biomeId: p.biomeId,
        });
      })
    );

    // W2 Moor Road — route pick telemetry. Feeds the route-monotony and
    // skip-rate kill-criteria recorded in the W2 flagship ship-gate.
    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_ROUTE_PICKED', (p) => {
        if (!this.runDistributionTelemetryEnabled()) return;
        this.safeLogEvent('route_picked', {
          slot: p.slot,
          routeKey: p.routeKey,
          atGameTimeSec: p.atGameTimeSec,
          defaultedBySetting: p.defaultedBySetting,
        });
      })
    );

    // Weapon evolution telemetry — which base/evolved pairs actually
    // happen in the wild, for balance + card-pool tuning.
    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_WEAPON_EVOLVED', (p) => {
        if (!this.runDistributionTelemetryEnabled()) return;
        this.safeLogEvent('weapon_evolved', {
          weaponKey: p.weaponKey,
          evolvedKey: p.evolvedKey,
        });
      })
    );

    // Achievement unlock telemetry — deed-funnel conversion tracking.
    // Not gated by opt-in: unlocks are already visible to the player as
    // a Chronicle tile + toast, so logging the id is no new disclosure.
    this.busUnsubs.push(
      globalEventBus.on('ACHIEVEMENT_UNLOCKED', (p) => {
        this.safeLogEvent('achievement_unlocked', {
          id: p.id,
        });
      })
    );

    // Bestiary codex telemetry — fires once per account per enemy key.
    // Measures how far into the bestiary players actually reach. Opt-in
    // gated since it encodes playtime progression.
    this.busUnsubs.push(
      globalEventBus.on('CODEX_FIRST_CULL', (p) => {
        if (!this.runDistributionTelemetryEnabled()) return;
        this.safeLogEvent('codex_first_cull', {
          enemyKey: p.enemyKey,
        });
      })
    );
  }

  stopBusHandlers(): void {
    for (const u of this.busUnsubs) u();
    this.busUnsubs = [];
    this.busStarted = false;
  }

  /** Opt-in only: anonymous run_start / run_end distribution stats. */
  private runDistributionTelemetryEnabled(): boolean {
    try {
      return getSettingsManager().load().telemetryOptIn === true;
    } catch {
      return false;
    }
  }

  // Analytics must never break the game. Every call into the portal SDK
  // crosses an untrusted boundary — throws from here would abort bus emit
  // loops (silencing MetaProgress + Achievement handlers) or bubble up
  // through beginGameplaySession and crash scene init.
  private safeLogEvent(name: string, data?: Record<string, unknown>): void {
    try { this.provider.logEvent(name, data); } catch { /* swallow */ }
  }

  logEvent(name: string, data?: Record<string, unknown>): void {
    this.safeLogEvent(name, data);
  }

  triggerGameplayStart(): void {
    try { this.provider.triggerGameplayStart(); } catch { /* swallow */ }
  }

  triggerGameplayStop(): void {
    try { this.provider.triggerGameplayStop(); } catch { /* swallow */ }
  }

  /**
   * Call when the player enters an active run (`GameScene` ready to play).
   * Nests safely if ever re-entered without teardown (should not happen).
   */
  beginGameplaySession(meta: {
    variantKey: string;
    ironmoor?: boolean;
    curseKey?: string | null;
    isDaily?: boolean;
  }): void {
    if (this.sessionDepth === 0) {
      this.triggerGameplayStart();
      if (this.runDistributionTelemetryEnabled()) {
        this.logEvent('run_start', {
          variantKey: meta.variantKey,
          ironmoor: meta.ironmoor === true,
          isDaily: meta.isDaily === true,
          ...(meta.curseKey ? { curseKey: meta.curseKey } : {}),
        });
      }
    }
    this.sessionDepth++;
  }

  /** Call from `GameScene` `shutdown` (quit, death, victory all stop the scene). */
  endGameplaySession(): void {
    if (this.sessionDepth <= 0) return;
    this.sessionDepth--;
    if (this.sessionDepth === 0) {
      this.triggerGameplayStop();
    }
  }
}

const analyticsManager = new AnalyticsManager();

export function getAnalyticsManager(): AnalyticsManager {
  return analyticsManager;
}

/** @internal Vitest only — clears bus subscriptions so tests do not leak handlers. */
export function resetAnalyticsManagerForTests(): void {
  analyticsManager.stopBusHandlers();
}
