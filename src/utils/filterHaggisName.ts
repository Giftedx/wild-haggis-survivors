export const HAGGIS_NAME_MAX_LEN = 24;

// Minimal blocklist — cosmetic only (solo game, client-side).
// Catches the most common English profanities without being exhaustive.
const BLOCKED: readonly string[] = [
  'fuck', 'shit', 'cunt', 'nigger', 'nigga', 'faggot', 'fag',
  'bastard', 'bitch', 'asshole', 'arsehole', 'twat', 'wanker',
];

/**
 * Sanitise a player-supplied haggis name.
 * Returns the cleaned name (trimmed, max 24 chars) or '' if invalid / blocked.
 */
export function filterHaggisName(raw: string): string {
  const trimmed = raw.trim().slice(0, HAGGIS_NAME_MAX_LEN);
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (BLOCKED.some((w) => lower.includes(w))) return '';
  return trimmed;
}
