/**
 * Resolves the current replay mode from the runtime environment. Priority:
 *
 *   1. `globalThis.__REPLAY_MODE__` — dev/E2E override, takes precedence.
 *   2. `localStorage['whs_replay_mode']` — user-set preference.
 *   3. `undefined` → off.
 *
 * Only `'record'` is honoured in the v1 MVP; other values (`'play'`,
 * `'off'`, anything else) resolve to off. The dedicated off state is
 * there so a future UI can "pause" recording without tearing down the
 * integration.
 */

export type ReplayMode = 'record' | 'off';

const LOCALSTORAGE_KEY = 'whs_replay_mode';
const VALID_MODES: ReplayMode[] = ['record', 'off'];

interface ReplayConfigEnv {
  globalMode?: string | null;
  storageMode?: string | null;
}

/**
 * Pure resolver — easy to test with synthetic env. GameScene calls the
 * thin `resolveReplayMode()` wrapper below which reads the real globals.
 */
export function resolveReplayModeFromEnv(env: ReplayConfigEnv): ReplayMode {
  const candidate = env.globalMode ?? env.storageMode;
  if (typeof candidate !== 'string') return 'off';
  const lower = candidate.toLowerCase();
  if ((VALID_MODES as string[]).includes(lower)) return lower as ReplayMode;
  return 'off';
}

export function resolveReplayMode(): ReplayMode {
  const global = (globalThis as unknown as { __REPLAY_MODE__?: unknown }).__REPLAY_MODE__;
  let globalMode: string | null = null;
  if (typeof global === 'string') globalMode = global;

  let storageMode: string | null = null;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALSTORAGE_KEY) : null;
    if (raw) storageMode = raw;
  } catch {
    /* localStorage unavailable — fall through. */
  }

  return resolveReplayModeFromEnv({ globalMode, storageMode });
}

export const REPLAY_MODE_STORAGE_KEY = LOCALSTORAGE_KEY;
