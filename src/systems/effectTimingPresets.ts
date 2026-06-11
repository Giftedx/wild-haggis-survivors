/**
 * Standardized timing values for visual effects — rings, flashes,
 * and particle lifetimes. Referenced by JuiceSystem and any code
 * that spawns transient VFX. Using named presets instead of magic
 * numbers ensures similar events *feel* similar.
 */

export const RING_TIMING = {
  /** Kill burst, small impacts — snappy feedback. */
  tight: 200,
  /** Weapon acquire, pickup collect — moderate emphasis. */
  medium: 400,
  /** Boss death, evolution, level milestone — grand spectacle. */
  grand: 700,
} as const;

export const FLASH_TIMING = {
  /** Triple elite chain — brief punctuation. */
  short: 100,
  /** Level-up, white flash — standard feedback. */
  medium: 200,
  /** Boss death — weighty impact. */
  long: 400,
  /** Evolution spectacle — peak reward moment. */
  epic: 500,
} as const;

export const PARTICLE_DURATION = {
  /** Kill burst — fast scatter. */
  fast: { min: 250, max: 400 },
  /** Moor moment — moderate float. */
  medium: { min: 400, max: 600 },
  /** Boss death, evolution — lingering spectacle. */
  grand: { min: 800, max: 1400 },
} as const;
