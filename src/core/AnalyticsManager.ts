import { globalEventBus } from './GlobalEventBus';

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
        if (!p.wasBoss) return;
        this.safeLogEvent('boss_kill', {
          enemyKey: p.enemyKey,
          wasElite: p.wasElite,
          xpValue: p.xpValue,
        });
      })
    );

    this.busUnsubs.push(
      globalEventBus.on('GLOBAL_RUN_ENDED', (p) => {
        this.safeLogEvent('run_end', {
          outcome: p.outcome,
          gameTimeSec: p.gameTimeSec,
          enemiesKilled: p.enemiesKilled,
        });
      })
    );

    this.busUnsubs.push(
      globalEventBus.on('TUTORIAL_COMPLETED', () => {
        this.safeLogEvent('tutorial_completed', {});
      })
    );
  }

  stopBusHandlers(): void {
    for (const u of this.busUnsubs) u();
    this.busUnsubs = [];
    this.busStarted = false;
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
  beginGameplaySession(meta: { variantKey: string }): void {
    if (this.sessionDepth === 0) {
      this.triggerGameplayStart();
      this.logEvent('run_start', { variantKey: meta.variantKey });
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
