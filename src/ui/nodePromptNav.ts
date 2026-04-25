export interface NodePromptNavEntry {
  readonly disabled?: boolean;
}

export function firstEnabledPromptEntryIndex(
  entries: readonly NodePromptNavEntry[],
): number {
  return entries.findIndex((entry) => entry.disabled !== true);
}

export function movePromptFocusIndex(
  entries: readonly NodePromptNavEntry[],
  currentIndex: number,
  direction: -1 | 1,
): number {
  if (entries.length === 0) return -1;
  const first = firstEnabledPromptEntryIndex(entries);
  if (first === -1) return -1;

  if (currentIndex < 0 || currentIndex >= entries.length) return first;
  const start = currentIndex;

  for (let step = 1; step <= entries.length; step++) {
    const next = (start + direction * step + entries.length) % entries.length;
    if (entries[next]?.disabled !== true) return next;
  }
  return first;
}
