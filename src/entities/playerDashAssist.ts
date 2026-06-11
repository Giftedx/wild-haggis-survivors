export function getPostDashGraceMs(baseGraceMs: number, extendedIFramesEnabled: boolean): number {
  return extendedIFramesEnabled ? baseGraceMs * 2 : baseGraceMs;
}
