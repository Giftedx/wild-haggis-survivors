import type { KeyBinding } from '../core/actions';

/** True when `code` matches a remapped pause slot (KeyboardEvent.code). */
export function keyCodeBoundToPause(code: string, pause: KeyBinding): boolean {
  return code === pause.primary || (pause.secondary != null && code === pause.secondary);
}
