/**
 * Selkie Dual-Form — pure form-state helper.
 *
 * The Selkie variant flips between two forms on every dash edge:
 *   - `haggis` — the default form, standard speed / drift / pickup.
 *   - `seal` — sea-form: slightly faster, drift halved, pickup radius
 *     widened. Weapons still fire on the first ship; future slices
 *     may soft-reduce or suppress weapon firing in seal form.
 *
 * The form change is cosmetic-leaning by design: every multiplier is
 * a small percentage so a balance regression couldn't tip a run into
 * "must hold seal to play". Numbers are chosen to feel "the same haggis,
 * a different body" — not a power-up form, not a punishment form.
 *
 * Framework-free so the dash-edge toggle is unit-tested independently
 * of Phaser. The Player wires `toggleSelkieFormOnDashEdge` into its
 * dash callback; HUD reads `getSelkieFormLabel` for the chip.
 */

export type SelkieForm = 'haggis' | 'seal';

export const DEFAULT_SELKIE_FORM: SelkieForm = 'haggis';

export interface SelkieFormState {
  form: SelkieForm;
  /**
   * Number of times the player has shifted forms this run. Surfaces
   * in Chronicle followups; for now it gives the HUD a way to skip
   * the "first time" pulse vs. the steady-state pulse.
   */
  shiftCount: number;
}

export function createSelkieFormState(): SelkieFormState {
  return { form: DEFAULT_SELKIE_FORM, shiftCount: 0 };
}

export interface SelkieFormModifiers {
  /** Multiplicative speed adjustment vs. base. 1 = unchanged. */
  speedMul: number;
  /** Multiplicative drift adjustment vs. base. < 1 → calmer steering. */
  driftMul: number;
  /** Additive pickup radius bonus (pixels). */
  pickupRadiusFlat: number;
}

const FORM_MODIFIERS: Readonly<Record<SelkieForm, SelkieFormModifiers>> = {
  haggis: { speedMul: 1, driftMul: 1, pickupRadiusFlat: 0 },
  seal: { speedMul: 1.08, driftMul: 0.55, pickupRadiusFlat: 18 },
};

/**
 * Wild Living World Phase 2 — biome IDs where the seal form gets a
 * coastal affinity bloom (small additional speed + pickup boost). The
 * water-folk recognise the salt; on a loch or among coastal pines the
 * seal moves like it belongs.
 *
 * Kept in sync with `COASTAL_BIOMES` in `save/schema.ts` (`loch` + `pine`)
 * but typed locally so this helper has no save-module dependency cycle.
 */
const COASTAL_AFFINITY_BIOMES: ReadonlySet<string> = new Set(['loch', 'pine']);

/**
 * Wild Living World Phase 2 — additive boost layered on top of the
 * seal form's base modifiers when the run is in a coastal biome.
 * Kept small so the dash-toggle game-feel stays the dominant variable;
 * coastal affinity is a "right place, right form" wink, not a build.
 */
const SEAL_COASTAL_BLOOM: SelkieFormModifiers = {
  speedMul: 1.05,
  driftMul: 1.0, // No further drift relief — base seal already calmer.
  pickupRadiusFlat: 12,
};

/**
 * Return the seal/haggis form modifiers, optionally layered with the
 * coastal-affinity bloom when `biome` resolves into the affinity set.
 *
 * Layer composition (multiplicative on `speedMul`/`driftMul`, additive
 * on `pickupRadiusFlat`):
 *   - Base form modifier
 *   - Coastal bloom (only when `form === 'seal'` and biome is coastal)
 *
 * Haggis form never blooms — affinity is a "the seal feels at home"
 * beat, not a flat variant-wide buff.
 */
export function getSelkieFormModifiers(
  form: SelkieForm,
  biome?: string | null,
): SelkieFormModifiers {
  const base = FORM_MODIFIERS[form];
  if (form !== 'seal' || !biome || !COASTAL_AFFINITY_BIOMES.has(biome)) {
    return base;
  }
  return {
    speedMul: base.speedMul * SEAL_COASTAL_BLOOM.speedMul,
    driftMul: base.driftMul * SEAL_COASTAL_BLOOM.driftMul,
    pickupRadiusFlat: base.pickupRadiusFlat + SEAL_COASTAL_BLOOM.pickupRadiusFlat,
  };
}

/**
 * Wild Living World Phase 2 — flat pickup-radius blessing applied at
 * run start for the Selkie variant. Tiny — just enough for the
 * Chronicle to read "the tide goes with them" rather than "no
 * change". Layered additively on whatever the form/affinity layer
 * computes each frame.
 */
export function getSelkieRunStartPickupBonus(variantKey: string): number {
  return variantKey === 'selkie' ? 14 : 0;
}

/**
 * Convenience predicate exposed for unit tests + Croft surfaces so
 * the coastal-affinity rule has one source of truth.
 */
export function isCoastalAffinityBiome(biome: string | null | undefined): boolean {
  return typeof biome === 'string' && COASTAL_AFFINITY_BIOMES.has(biome);
}

/**
 * Toggle the form. Returns the new form (for callers that want the
 * fresh value without a re-read).
 */
export function shiftSelkieForm(state: SelkieFormState): SelkieForm {
  state.form = state.form === 'haggis' ? 'seal' : 'haggis';
  state.shiftCount++;
  return state.form;
}

/**
 * Dash-edge handler. Player code emits a "dash started" edge each
 * time a dash fires; this helper translates the edge into a form
 * shift. Returns the new form when a shift occurred, or `null` when
 * the caller is not the Selkie variant (cheap early-out).
 *
 * Keeping the variant gate in the helper means Player code can call
 * it unconditionally without branching every dash.
 */
export function toggleSelkieFormOnDashEdge(
  state: SelkieFormState,
  variantKey: string,
): SelkieForm | null {
  if (variantKey !== 'selkie') return null;
  return shiftSelkieForm(state);
}

/**
 * i18n leaf key for the HUD chip. Caller passes through `t()`.
 */
export function getSelkieFormLabelKey(form: SelkieForm): string {
  return `ui.hud.selkie.${form}`;
}
