export function getComboTimeoutMs(baseTimeoutMs: number, extendedComboWindowEnabled: boolean): number {
  return extendedComboWindowEnabled ? baseTimeoutMs * 2 : baseTimeoutMs;
}
