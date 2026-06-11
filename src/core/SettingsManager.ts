import type { StorageLike } from './SaveManager';
import type { LocaleKey } from './i18n';
import { emitSaveFailure } from '../utils/saveFailure';
import {
  ACTION_KEYS,
  DEFAULT_GAMEPAD_BINDINGS,
  DEFAULT_KEYBINDINGS,
  type ActionKey,
  type GamepadBinding,
  type KeyBinding,
} from './actions';

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
  /**
   * A1 M5 — strict photosensitivity posture. When true, caps flash alpha
   * at 0.4, floors flash duration at 200ms, hard-caps haar density at
   * MIN_CAP, and stretches shader ramp durations to MAX. Stronger than
   * motionScale alone — motionScale sits on a continuum; this is a hard
   * toggle the WCAG / PEAT guidance pairs with the "three flashes per
   * second or fewer" rule.
   */
  reduceFlashing: boolean;
  /**
   * A1 M5 — has the player dismissed the first-launch photosensitivity
   * warning splash? False on fresh saves; flips true on dismissal and
   * stays sticky. No UI in the settings panel — this is a one-way
   * acknowledgement, not a preference.
   */
  photosensitivityWarningSeen: boolean;
  /**
   * 2026-05-10 — has the player dismissed the first-launch cultural-content
   * notice? Mirrors `photosensitivityWarningSeen` shape. The notice tells
   * the player Scots / Doric / Shetlandic / Gaelic content is drafted by
   * the developer and is being native-reviewed; it sits between the
   * photosensitivity splash and the main menu on fresh saves. Sticky;
   * no settings-panel toggle — this is a one-way acknowledgement.
   */
  culturalContentSplashSeen: boolean;
  /**
   * A1 M6 — Assist Mode master toggle. Persisted and runtime-wired, but
   * hidden from the Settings panel until the balance / replay-parity
   * unhide pass clears.
   */
  assistMode: boolean;
  /**
   * A1 M6 — gameplay speed multiplier under Assist Mode (0.5–1.0).
   * 1.0 = normal. Clamped to a half-speed floor so the game stays
   * playable without crossing into stall territory.
   */
  assistModeGameSpeed: number;
  /** A1 M6 — extend post-dash iframe grace when Assist Mode is on. */
  assistModeExtendedIFrames: boolean;
  /** A1 M6 — extend combo-drop grace window when Assist Mode is on. */
  assistModeExtendedComboWindow: boolean;
  /** A1 M6 — full invincibility when Assist Mode is on. */
  assistModeInvincibility: boolean;
  /**
   * A1 M4 — caption text-size multiplier (0.8–1.4). Scales the
   * CaptionOverlay font independently of the HUD `uiScale` so players
   * can dial up captions without blowing out the rest of the interface.
   */
  captionTextScale: number;
  /**
   * A1 M2 — colorblind simulation / remap mode. 'off' is default; the
   * four modes apply a LUT remap via the F1 ShaderRegistry so hue pairs
   * that would collapse under each vision type remain distinguishable.
   */
  colorblindMode: ColorblindMode;
  /**
   * E1 M4 — opt-out for real-world-date-gated seasonal events (Burns
   * Night, Hogmanay, …). Off by default so the date logic stays
   * quiet; players who'd rather not have the game lean on calendar
   * behaviour can silence every event at once. Respected by
   * `SeasonalEventManager.activeSeasonalEvents` — when true the
   * list is always empty regardless of date.
   */
  disableSeasonalEvents: boolean;
  /**
   * Round 2 hazards — opt-out for the dynamic biome hazard system
   * (peat pits, falling slate, burn rapids, scree slides). Off by
   * default. When true, `HazardsSystem.start()` early-returns into a
   * disabled state and no hazards spawn for that run. Existing static
   * `HazardZones` (lava patches placed at run start) are unaffected
   * — they ship from a different system and remain on.
   */
  disableHazards: boolean;
  /**
   * P3 Cloud Saves — future opt-in for cloud sync of the existing
   * `whs_save` payload. Off by default; the game stays fully playable
   * offline-first when this is false (charter §Anti-patterns "Don't gate
   * single-player on cloud"). Runtime sync, Settings UI, privacy copy,
   * and conflict UX remain blocked on P3 product/legal work; the flag is
   * retained so pre-release tester saves do not churn.
   */
  cloudSaveOptIn: boolean;
  /**
   * A1 M3 — keyboard bindings per `ActionKey`. `KeyboardEvent.code`
   * values (`'ArrowUp'`, `'KeyW'`, `'Space'`). Every action has a
   * primary; secondary is optional. On legacy saves without the field,
   * coerce seeds `DEFAULT_KEYBINDINGS`.
   */
  keyBindings: Record<ActionKey, KeyBinding>;
  /**
   * A1 M3 — gamepad bindings per `ActionKey`. Only dash + pause are
   * gamepad-rebindable in M3; movement lives on sticks / D-pad. Numbers
   * are Standard Gamepad button indices (0 = South, 7 = RT, 9 = Start).
   * Actions without a gamepad binding simply aren't in the map.
   */
  gamepadBindings: Partial<Record<ActionKey, GamepadBinding>>;
}

const LOCALE_KEYS: readonly LocaleKey[] = ['en', 'scs'];

function toLocaleKey(v: unknown, fallback: LocaleKey): LocaleKey {
  return typeof v === 'string' && (LOCALE_KEYS as readonly string[]).includes(v)
    ? (v as LocaleKey)
    : fallback;
}

export type BanterFrequency = 'off' | 'sparing' | 'normal' | 'chatty';
const BANTER_FREQUENCIES: readonly BanterFrequency[] = ['off', 'sparing', 'normal', 'chatty'];

export type ColorblindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
const COLORBLIND_MODES: readonly ColorblindMode[] = ['off', 'protanopia', 'deuteranopia', 'tritanopia', 'monochrome'];

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
  // 2026-05-10: defaulted ON for safety. The live build has not been
  // independently photosensitivity-audited (PEAT pass pending — see
  // README.md and docs/A1_PEAT_AUDIT.md). The cap (≤ 0.4 alpha + 200ms
  // floor) is a small fidelity loss for non-photosensitive players and
  // a meaningful safety guarantee for photosensitive ones. Existing
  // saves keep their stored value (toBool below); only fresh saves
  // pick up the new default.
  reduceFlashing: true,
  photosensitivityWarningSeen: false,
  culturalContentSplashSeen: false,
  assistMode: false,
  assistModeGameSpeed: 1,
  assistModeExtendedIFrames: false,
  assistModeExtendedComboWindow: false,
  assistModeInvincibility: false,
  captionTextScale: 1,
  colorblindMode: 'off',
  disableSeasonalEvents: false,
  disableHazards: false,
  cloudSaveOptIn: false,
  keyBindings: cloneKeyBindings(DEFAULT_KEYBINDINGS),
  gamepadBindings: cloneGamepadBindings(DEFAULT_GAMEPAD_BINDINGS),
};

function cloneKeyBindings(src: Record<ActionKey, KeyBinding>): Record<ActionKey, KeyBinding> {
  const out = {} as Record<ActionKey, KeyBinding>;
  for (const a of ACTION_KEYS) {
    const b = src[a];
    out[a] = b.secondary ? { primary: b.primary, secondary: b.secondary } : { primary: b.primary };
  }
  return out;
}

function cloneGamepadBindings(
  src: Partial<Record<ActionKey, GamepadBinding>>,
): Partial<Record<ActionKey, GamepadBinding>> {
  const out: Partial<Record<ActionKey, GamepadBinding>> = {};
  for (const a of ACTION_KEYS) {
    const b = src[a];
    if (!b) continue;
    out[a] = b.secondary != null ? { primary: b.primary, secondary: b.secondary } : { primary: b.primary };
  }
  return out;
}

function coerceKeyBinding(v: unknown, fallback: KeyBinding): KeyBinding {
  if (typeof v !== 'object' || v === null) return { ...fallback };
  const o = v as Record<string, unknown>;
  const primary = typeof o.primary === 'string' && o.primary.length > 0 ? o.primary : fallback.primary;
  const secondary = typeof o.secondary === 'string' && o.secondary.length > 0 ? o.secondary : fallback.secondary;
  return secondary ? { primary, secondary } : { primary };
}

function coerceGamepadBinding(
  v: unknown,
  fallback: GamepadBinding | undefined,
): GamepadBinding | undefined {
  if (typeof v !== 'object' || v === null) return fallback ? { ...fallback } : undefined;
  const o = v as Record<string, unknown>;
  const primaryRaw = o.primary;
  if (typeof primaryRaw !== 'number' || !Number.isInteger(primaryRaw) || primaryRaw < 0 || primaryRaw > 31) {
    return fallback ? { ...fallback } : undefined;
  }
  const secondaryRaw = o.secondary;
  const secondary =
    typeof secondaryRaw === 'number' && Number.isInteger(secondaryRaw) && secondaryRaw >= 0 && secondaryRaw <= 31
      ? secondaryRaw
      : undefined;
  return secondary != null ? { primary: primaryRaw, secondary } : { primary: primaryRaw };
}

function coerceKeyBindings(v: unknown): Record<ActionKey, KeyBinding> {
  const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  const out = {} as Record<ActionKey, KeyBinding>;
  for (const a of ACTION_KEYS) {
    out[a] = coerceKeyBinding(o[a], DEFAULT_KEYBINDINGS[a]);
  }
  return out;
}

function coerceGamepadBindings(v: unknown): Partial<Record<ActionKey, GamepadBinding>> {
  const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  const out: Partial<Record<ActionKey, GamepadBinding>> = {};
  for (const a of ACTION_KEYS) {
    const coerced = coerceGamepadBinding(o[a], DEFAULT_GAMEPAD_BINDINGS[a]);
    if (coerced) out[a] = coerced;
  }
  return out;
}

function toBanterFrequency(v: unknown, fallback: BanterFrequency): BanterFrequency {
  return typeof v === 'string' && (BANTER_FREQUENCIES as readonly string[]).includes(v)
    ? (v as BanterFrequency)
    : fallback;
}

function toColorblindMode(v: unknown, fallback: ColorblindMode): ColorblindMode {
  return typeof v === 'string' && (COLORBLIND_MODES as readonly string[]).includes(v)
    ? (v as ColorblindMode)
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
  /** Memoised result of the most recent `load()`. GameScene reads
   *  from `load()` at 14+ sites; without memo, every read hit
   *  storage + JSON.parse + coerce. The cache is invalidated on
   *  `save()` and `reset()` so callers always see fresh state after
   *  a settings mutation. */
  private cached: ISettingsData | null = null;

  constructor(opts?: { key?: string; storage?: StorageLike }) {
    this.key = opts?.key ?? SETTINGS_STORAGE_KEY;
    this.storage = opts?.storage ?? defaultStorage();
  }

  load(): ISettingsData {
    if (this.cached !== null) return this.cached;
    const raw = this.storage.getItem(this.key);
    if (!raw) {
      this.cached = { ...DEFAULT_SETTINGS };
      return this.cached;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      this.cached = this.coerce(parsed);
      return this.cached;
    } catch {
      this.cached = { ...DEFAULT_SETTINGS };
      return this.cached;
    }
  }

  save(data: ISettingsData): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.coerce(data)));
    } catch (err) {
      // Keep gameplay/settings UI responsive if persistence is unavailable —
      // T131 surfaces the failure to the UI toast listener.
      emitSaveFailure('settings', err);
    }
    // Invalidate cache so the next load() reflects the just-saved data
    // (re-coerced to catch any version bumps `coerce` would apply).
    this.cached = null;
  }

  reset(): void {
    this.storage.removeItem(this.key);
    this.cached = null;
  }

  /**
   * Force the next `load()` to re-read storage. Production code should
   * never need this — `save()` and `reset()` already invalidate. Use
   * only when storage was modified by a path that bypasses this manager
   * (raw test fixtures via `storage.setItem`, future cross-tab `storage`
   * events, etc.).
   */
  invalidateCache(): void {
    this.cached = null;
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
      reduceFlashing: toBool(o.reduceFlashing, DEFAULT_SETTINGS.reduceFlashing),
      photosensitivityWarningSeen: toBool(
        o.photosensitivityWarningSeen,
        DEFAULT_SETTINGS.photosensitivityWarningSeen,
      ),
      culturalContentSplashSeen: toBool(
        o.culturalContentSplashSeen,
        DEFAULT_SETTINGS.culturalContentSplashSeen,
      ),
      assistMode: toBool(o.assistMode, DEFAULT_SETTINGS.assistMode),
      assistModeGameSpeed: clampRange(
        o.assistModeGameSpeed,
        0.5,
        1,
        DEFAULT_SETTINGS.assistModeGameSpeed,
      ),
      assistModeExtendedIFrames: toBool(
        o.assistModeExtendedIFrames,
        DEFAULT_SETTINGS.assistModeExtendedIFrames,
      ),
      assistModeExtendedComboWindow: toBool(
        o.assistModeExtendedComboWindow,
        DEFAULT_SETTINGS.assistModeExtendedComboWindow,
      ),
      assistModeInvincibility: toBool(
        o.assistModeInvincibility,
        DEFAULT_SETTINGS.assistModeInvincibility,
      ),
      captionTextScale: clampRange(
        o.captionTextScale,
        0.8,
        1.4,
        DEFAULT_SETTINGS.captionTextScale,
      ),
      colorblindMode: toColorblindMode(o.colorblindMode, DEFAULT_SETTINGS.colorblindMode),
      disableSeasonalEvents: toBool(
        o.disableSeasonalEvents,
        DEFAULT_SETTINGS.disableSeasonalEvents,
      ),
      disableHazards: toBool(o.disableHazards, DEFAULT_SETTINGS.disableHazards),
      cloudSaveOptIn: toBool(o.cloudSaveOptIn, DEFAULT_SETTINGS.cloudSaveOptIn),
      keyBindings: coerceKeyBindings(o.keyBindings),
      gamepadBindings: coerceGamepadBindings(o.gamepadBindings),
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
