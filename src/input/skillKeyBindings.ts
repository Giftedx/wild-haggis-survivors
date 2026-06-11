import * as Phaser from 'phaser';
import type { KeyBinding } from '../core/actions';
import { getSettingsManager } from '../core/SettingsManager';
import { codeToPhaserKeyCode } from './keyCodeMap';

export type SkillActionKey =
  | 'stanceToggle'
  | 'shintyParry'
  | 'whiskyBreath'
  | 'driftMastery';

export const SKILL_ACTION_KEYS: readonly SkillActionKey[] = [
  'stanceToggle',
  'shintyParry',
  'whiskyBreath',
  'driftMastery',
];

export interface SkillKeyHandles {
  stanceToggle: Phaser.Input.Keyboard.Key | null;
  shintyParry: Phaser.Input.Keyboard.Key | null;
  whiskyBreath: Phaser.Input.Keyboard.Key | null;
  driftMastery: Phaser.Input.Keyboard.Key | null;
}

function bindKey(scene: Phaser.Scene, code: string): Phaser.Input.Keyboard.Key | null {
  const keyboard = scene.input?.keyboard;
  if (!keyboard) return null;
  const phaserCode = codeToPhaserKeyCode(code);
  if (phaserCode == null) return null;
  return keyboard.addKey(phaserCode);
}

/** Load remappable skill keys from persisted settings (primary slot only). */
export function loadSkillKeyHandles(scene: Phaser.Scene): SkillKeyHandles {
  const { keyBindings } = getSettingsManager().load();
  const out = {} as SkillKeyHandles;
  for (const action of SKILL_ACTION_KEYS) {
    out[action] = bindKey(scene, keyBindings[action].primary);
  }
  return out;
}

/** True when any code slot on `a` matches any slot on `b`. */
export function keyBindingsOverlap(a: KeyBinding, b: KeyBinding): boolean {
  const codesA = [a.primary, a.secondary].filter((c): c is string => !!c);
  const codesB = [b.primary, b.secondary].filter((c): c is string => !!c);
  return codesA.some((ca) => codesB.includes(ca));
}

/** Pause wins when stance shares a binding — avoids double-firing on one edge. */
export function stanceBindingOverlapsPause(
  stance: KeyBinding,
  pause: KeyBinding,
): boolean {
  return keyBindingsOverlap(stance, pause);
}
