import type { StorageLike } from './SaveManager';
import type { LocaleKey } from './i18n';

export const SETTINGS_STORAGE_KEY = 'whs_game_settings';
export const CURRENT_SETTINGS_VERSION = 1 as const;

/** User preferences — separate storage from meta save (`SaveManager`). */
export interface ISettingsData {
  settingsVersion: typeof CURRENT_SETTINGS_VERSION;
  /** 0–1 master multiplier on top of SFX bus */
  masterVolume: number;
  /** 0–1 SFX loudness */
  sfxVolume: number;
  /** 0–1 music loudness */
  musicVolume: number;
  screenShake: boolean;
  damageNumbers: boolean;
  /** Fewer transient particles (kill bursts, boss fx) */
  reduceParticles: boolean;
  /** UI scale multiplier for readability-sensitive HUD/menus. */
  uiScale: number;
  /** Boost contrast for key HUD/overlay text + panel strokes. */
  highContrastUi: boolean;
  /**
   * Graduated motion intensity in [0, 1]. Multiplies shake amplitude,
   * flash alpha, slow-motion duration, and particle counts. The binary
   * `screenShake` toggle stays as a master off switch; `motionScale`
   * lets players dial comfort without killing feedback entirely.
   */
  motionScale: number;
  /**
   * Show on-screen captions for critical audio cues (boss intros,
   * low HP, evolution ready, death, victory). Off by default; opt-in
   * from the Comfort panel.
   */
  captionsEnabled: boolean;
  /**
   * Ambient Glesga commentary frequency. 'normal' by default; 'sparing'
   * honours players who prefer silence without losing soul entirely.
   * 'off' silences BanterSystem outright (milestone easter eggs keep firing).
   */
  banterFrequency: BanterFrequency;
  /**
   * Opt-in anonymous run-end distribution stats (`run_start` / `run_end` only).
   * Off by default.
   */
  telemetryOptIn: boolean;
  /** W2 Moor Road: skip between-act picker scenes; applies the default route automatically. */
  skipActIntermissions: boolean;
  /**
   * W66 Ironmoor: opt-in single-life mode. When true, the Second-Wind
   * revival granted by permanent upgrades is suppressed — any fatal hit
   * ends the run. No balance changes; pure opt-in difficulty posture.
   */
  ironmoorMode: boolean;
  /**
   * H1 speedrun timer. When true, the HUD timer renders centisecond
   * precision (M:SS.cc) instead of the calm M:SS. Off by default so
   * the moor keeps its unhurried pace for players not chasing splits.
   */
  speedrunTimerVisible: boolean;
  /**
   * W27 capture opt-out. When false, ClipRecorder doesn't start and
   * both capture UI buttons hide. Default true — capture is lightweight
   * and the kill-criterion is >3% CPU or >200 KB bundle; neither applies
   * at default settings.
   */
  captureEnabled: boolean;
  /**
   * W18 locale key. 'en' is the reference language (Glesga-register
   * English); 'scs' overlays Scots where translations exist, falling
   * back to English silently for unresolved keys. Optional for back-
   * compat with saves/test fixtures written before W18 scaffolding —
   * absent or malformed values coerce to 'en'.
   */
  localeKey?: LocaleKey;
}

const LOCALE_KEYS: readonly LocaleKey[] = ['en', 'scs'];

function toLocaleKey(v: unknown, fallback: LocaleKey): LocaleKey {
  return typeof v === 'string' && (LOCALE_KEYS as readonly string[]).includes(v)
    ? (v as LocaleKey)
    : fallback;
}

export type BanterFrequency = 'off' | 'sparing' | 'normal' | 'chatty';
const BANTER_FREQUENCIES: readonly BanterFrequency[] = ['off', 'sparing', 'normal', 'chatty'];

const DEFAULT_SETTINGS: ISettingsData = {
  settingsVersion: CURRENT_SETTINGS_VERSION,
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  screenShake: true,
  damageNumbers: true,
  reduceParticles: false,
  uiScale: 1,
  highContrastUi: false,
  motionScale: 1,
  captionsEnabled: false,
  banterFrequency: 'normal',
  telemetryOptIn: false,
  skipActIntermissions: false,
  ironmoorMode: false,
  speedrunTimerVisible: false,
  captureEnabled: true,
  localeKey: 'en',
};

function toBanterFrequency(v: unknown, fallback: BanterFrequency): BanterFrequency {
  return typeof v === 'string' && (BANTER_FREQUENCIES as readonly string[]).includes(v)
    ? (v as BanterFrequency)
    : fallback;
}

function clamp01(n: unknown, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function toBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function clampRange(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

let singleton: SettingsManager | null = null;

export function getSettingsManager(): SettingsManager {
  if (!singleton) singleton = new SettingsManager();
  return singleton;
}

/** Test-only: reset process singleton */
export function resetSettingsManagerSingletonForTests(): void {
  singleton = null;
}

export class SettingsManager {
  private key: string;
  private storage: StorageLike;

  constructor(opts?: { key?: string; storage?: StorageLike }) {
    this.key = opts?.key ?? SETTINGS_STORAGE_KEY;
    this.storage = opts?.storage ?? defaultStorage();
  }

  load(): ISettingsData {
    const raw = this.storage.getItem(this.key);
    if (!raw) return { ...DEFAULT_SETTINGS };
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.coerce(parsed);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  save(data: ISettingsData): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.coerce(data)));
    } catch {
      // Keep gameplay/settings UI responsive if persistence is unavailable.
    }
  }

  reset(): void {
    this.storage.removeItem(this.key);
  }

  update(fn: (cur: ISettingsData) => ISettingsData): ISettingsData {
    const next = fn(this.load());
    this.save(next);
    return next;
  }

  private coerce(input: unknown): ISettingsData {
    if (typeof input !== 'object' || input === null) return { ...DEFAULT_SETTINGS };
    const o = input as Record<string, unknown>;
    const v = typeof o.settingsVersion === 'number' && o.settingsVersion > 0
      ? Math.floor(o.settingsVersion)
      : CURRENT_SETTINGS_VERSION;

    // Unknown future version (saved by a newer client, then loaded by this
    // one) — can't trust the shape, so wipe. For past versions, coerce
    // field-by-field: every known field is clamped to its valid range
    // (falling back to defaults only when the field is missing or malformed),
    // so bumping CURRENT_SETTINGS_VERSION no longer nukes every player's
    // volume / accessibility prefs on the next run.
    if (v > CURRENT_SETTINGS_VERSION) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      settingsVersion: CURRENT_SETTINGS_VERSION,
      masterVolume: clamp01(o.masterVolume, DEFAULT_SETTINGS.masterVolume),
      sfxVolume: clamp01(o.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      musicVolume: clamp01(o.musicVolume, DEFAULT_SETTINGS.musicVolume),
      screenShake: toBool(o.screenShake, DEFAULT_SETTINGS.screenShake),
      damageNumbers: toBool(o.damageNumbers, DEFAULT_SETTINGS.damageNumbers),
      reduceParticles: toBool(o.reduceParticles, DEFAULT_SETTINGS.reduceParticles),
      uiScale: clampRange(o.uiScale, 0.8, 1.4, DEFAULT_SETTINGS.uiScale),
      highContrastUi: toBool(o.highContrastUi, DEFAULT_SETTINGS.highContrastUi),
      motionScale: clamp01(o.motionScale, DEFAULT_SETTINGS.motionScale),
      captionsEnabled: toBool(o.captionsEnabled, DEFAULT_SETTINGS.captionsEnabled),
      banterFrequency: toBanterFrequency(o.banterFrequency, DEFAULT_SETTINGS.banterFrequency),
      telemetryOptIn: toBool(o.telemetryOptIn, DEFAULT_SETTINGS.telemetryOptIn),
      skipActIntermissions: toBool(o.skipActIntermissions, DEFAULT_SETTINGS.skipActIntermissions),
      ironmoorMode: toBool(o.ironmoorMode, DEFAULT_SETTINGS.ironmoorMode),
      speedrunTimerVisible: toBool(o.speedrunTimerVisible, DEFAULT_SETTINGS.speedrunTimerVisible),
      captureEnabled: toBool(o.captureEnabled, DEFAULT_SETTINGS.captureEnabled),
      localeKey: toLocaleKey(o.localeKey, DEFAULT_SETTINGS.localeKey ?? 'en'),
    };
  }
}

function defaultStorage(): StorageLike {
  const ls = (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
  // Duck-type: some environments (e.g. bare Node running unit tests) expose
  // a truthy `localStorage` stub without actual methods. Fall back to the
  // in-memory map when the required methods aren't functions.
  if (
    ls
    && typeof ls.getItem === 'function'
    && typeof ls.setItem === 'function'
    && typeof ls.removeItem === 'function'
  ) {
    return ls;
  }
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => { mem.set(k, v); },
    removeItem: (k) => { mem.delete(k); },
  };
}
