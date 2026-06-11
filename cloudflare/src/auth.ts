/**
 * task_08 cloud-save Worker — bearer parsing.
 *
 * The current spike auth scheme: `Authorization: Bearer {userId}`. This
 * matches what `src/cloud/httpCloudSaveClient.ts` already sends. It is
 * NOT real auth — anyone who guesses a userId can read/write that user.
 *
 * Real magic-link auth is the T421 follow-up. The bearer-equals-userId
 * scheme exists so the contract round-trip can be exercised end-to-end
 * without standing up email infrastructure.
 *
 * Returns the userId on success or `null` on missing/malformed header
 * so the caller can map to a 401.
 */
export function parseBearerUserId(req: Request): string | null {
  const header = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? '';
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return null;
  const userId = match[1].trim();
  if (userId.length === 0) return null;
  // Defensive: reject characters that could confuse downstream code.
  // The client always sends a UUID-shaped opaque string.
  if (!/^[A-Za-z0-9_\-.]{1,128}$/.test(userId)) return null;
  return userId;
}
