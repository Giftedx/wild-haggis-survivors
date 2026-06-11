/**
 * `?sporran=1` URL auto-route — viral sister to W82 shared-run URLs
 * (`src/utils/sharedRunUrl.ts`). A link of the form
 *   `https://wild-haggis-survivors.pages.dev/?sporran=1`
 * routes the recipient straight to the SporranScene picker instead of
 * the MainMenu/splash path, so a sharer can pre-deck a sporran for a
 * friend without walking them through the curse-vs-sporran choice.
 *
 * DESIGN_IDEAS §1 (Sporran Deck) v2 follow-up.
 *
 * Pure helper — predicate only; the scene transition + URL scrubbing
 * happen in `BootScene` so this module stays Phaser-free and unit-
 * testable under vitest's node env. Mirrors the `sharedRunUrl.ts` shape
 * (param const + URL/SearchParams coercer) for sister-pattern parity.
 *
 * Truthy values accepted: `1`, `true`, `yes`, `on` (case-insensitive),
 * plus the bare-flag form `?sporran` (param present, no value). Any
 * other value — including the explicit opt-out forms `0` / `false` /
 * `no` / `off` — is treated as no-auto-route. Sister to `?quickplay`
 * which uses bare-flag semantics; sister to the W82 share params which
 * use stricter format validation. The permissive truthy set covers the
 * shapes copy-pasted from chat clients that strip `=1` or normalise
 * the URL in surprising ways.
 *
 * Replay-determinism: this is a routing decision read once at boot,
 * never persisted. No T1 contract impact.
 */

/** Query-param name. Short + memorable for hand-typed share links. */
export const SPORRAN_AUTO_ROUTE_PARAM = 'sporran';

const TRUTHY_VALUES: ReadonlySet<string> = new Set(['1', 'true', 'yes', 'on']);

/**
 * Decide whether the current URL should auto-route to SporranScene.
 *
 * Accepts a full URL string (`window.location.href`), a query string
 * (`window.location.search`, with or without the leading `?`), or a
 * pre-built `URLSearchParams`. Returns `false` on malformed input
 * rather than throwing — boot routing must never crash on a corrupted
 * URL.
 */
export function isSporranAutoRoute(input: string | URLSearchParams | null | undefined): boolean {
  const params = coerceParams(input);
  if (!params) return false;
  if (!params.has(SPORRAN_AUTO_ROUTE_PARAM)) return false;
  const raw = params.get(SPORRAN_AUTO_ROUTE_PARAM);
  if (raw === null) return true;
  if (raw === '') return true;
  return TRUTHY_VALUES.has(raw.toLowerCase());
}

function coerceParams(
  input: string | URLSearchParams | null | undefined,
): URLSearchParams | null {
  if (input == null) return null;
  if (input instanceof URLSearchParams) return input;
  if (typeof input !== 'string' || input.length === 0) return null;
  try {
    return new URL(input).searchParams;
  } catch {
    // Fall through — treat as a bare query string.
  }
  const cleaned = input.startsWith('?') ? input.slice(1) : input;
  return new URLSearchParams(cleaned);
}
