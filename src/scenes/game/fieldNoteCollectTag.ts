/**
 * Field-note collect banter tag picker — DESIGN_IDEAS §11 Wildlife
 * Foundation follow-up.
 *
 * The Haggis Wildlife Foundation's field-guide pages unlock in the
 * Highland Almanac Finds tab at fixed lifetime-collection thresholds
 * (`FOUNDATION_THRESHOLDS`). The collect moment itself should know
 * about two beats:
 *
 *   - **first** — pre-bump count 0: the haggis discovers the Foundation
 *     keeps a book on him at all. Fires once per save.
 *   - **page**  — this collect crosses a Foundation threshold, i.e. a
 *     fresh field-guide page just unlocked on Gran's shelf. The line
 *     nods the player toward the Almanac without a UI toast.
 *
 * Anything else falls back to the flat `field_note_pickup` leaves.
 * Threshold 1 is subsumed by `first` (pre-bump 0 always crosses it),
 * so the two tags never compete.
 *
 * Pure — no save IO, no RNG. Caller feeds the pre-bump lifetime count
 * returned by `bumpFieldNotesLifetime()`; the storage-failure sentinel
 * (`Number.MAX_SAFE_INTEGER`) lands on `undefined` naturally. Banter is
 * cosmetic, so this sits outside the T1 replay contract either way.
 */
import { FOUNDATION_THRESHOLDS } from '../almanac/buildFindsEntries';

export type FieldNoteCollectTag = 'first' | 'page';

export function pickFieldNoteCollectTag(
  beforeCount: number,
): FieldNoteCollectTag | undefined {
  if (beforeCount === 0) return 'first';
  if ((FOUNDATION_THRESHOLDS as readonly number[]).includes(beforeCount + 1)) {
    return 'page';
  }
  return undefined;
}
