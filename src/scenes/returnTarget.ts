export type SceneReturnTarget = 'MainMenu' | 'Croft';

export interface SceneReturnData {
  returnTo?: unknown;
}

export function resolveSceneReturnTarget(
  value: unknown,
  fallback: SceneReturnTarget = 'MainMenu',
): SceneReturnTarget {
  return value === 'Croft' || value === 'MainMenu' ? value : fallback;
}

export function returnTargetData(returnTo: SceneReturnTarget): SceneReturnData {
  return { returnTo };
}
