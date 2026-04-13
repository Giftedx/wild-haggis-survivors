import type { StorageLike } from '../core/SaveManager';

/**
 * In-memory StorageLike implementation for unit tests — avoids touching
 * real localStorage. Every test file that creates a SaveManager,
 * SettingsManager, AchievementManager, etc. needs one of these; keeping
 * it here means one source of truth instead of 7 copy-pastes.
 */
export class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}
