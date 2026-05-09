/**
 * Procedural tartan generator — DESIGN_IDEAS "Tartan Banner" (postcard slice).
 *
 * Derives a clan-flavoured plaid from a run's signature (variant + top
 * damage weapon + mode / mod tags) and composites a small patch into
 * the postcard footer. Same input → same tartan; shareable screenshots
 * carry a recognisable visual fingerprint without spelunking the save.
 *
 * Mantle-rendering (live in-game) is explicitly out of scope here —
 * that half of the DESIGN_IDEAS bullet requires the W71 rig layer.
 */
import type { VariantKey } from '../data/variants';
import type { WeaponKey } from '../data/weapons';
import { COLORS_CSS } from '../config';

/** A tartan's four-colour palette plus the fixed weave pattern. */
export interface TartanProfile {
  /** Background fill that shows between stripes. */
  base: string;
  /** Dominant stripe colour — the wide band. */
  primary: string;
  /** Secondary stripe colour — the narrow band. */
  secondary: string;
  /** Thin accent thread that crosses the pattern. */
  accent: string;
}

/**
 * Stripe geometry — fixed so every tartan reads at a glance. Pattern:
 * base fills, then a wide primary band, then a narrow secondary band,
 * then a thin accent thread, repeating on a 24 px cycle. Weft overlays
 * the same pattern at reduced alpha so crossings blend the two threads
 * into classic plaid cells.
 */
const CYCLE_PX = 24;
const PRIMARY_BAND_PX = 10;
const PRIMARY_OFFSET_PX = 0;
const SECONDARY_BAND_PX = 4;
const SECONDARY_OFFSET_PX = 12;
const ACCENT_BAND_PX = 1;
const ACCENT_OFFSET_PX = 20;
const WEFT_ALPHA = 0.55;

/** Variant key → clan palette. Keyed on `VariantKey` so adding a new
 *  variant in `src/data/variants.ts` surfaces here as a type error
 *  instead of silently falling back to the neutral palette. */
const VARIANT_PALETTES: Readonly<Record<VariantKey, { base: string; primary: string }>> = {
  classic:       { base: '#3d2a1e', primary: '#a84828' }, // haggis brown + rust
  iron_belly:    { base: '#1f2a24', primary: '#3d6a4b' }, // deep forest
  moor_runner:   { base: '#2c1e1f', primary: '#c0382b' }, // run-blood red
  glen_forager:  { base: '#2b2519', primary: '#b58a2b' }, // harvest gold
  surefoot:      { base: '#1f2024', primary: '#5a6170' }, // stone grey
  pipe_breath:   { base: '#25202e', primary: '#7a6ac0' }, // lilac reed
  laird:         { base: '#1f2a38', primary: '#2e6aa8' }, // royal blue
  wee_ghostie:   { base: '#1d2029', primary: '#9dabc2' }, // pale slate
  glaswegian:    { base: '#1a2028', primary: '#ff5a00' }, // urban slate + tram orange
  cailleach:     { base: '#0f1a12', primary: '#d4d0c0' }, // deep moss + elder silver
  anticlockwise: { base: '#2a2420', primary: '#c0d4d8' }, // mountain-hare silver + mercury
  doric_quinie:  { base: '#2a3040', primary: '#d0d4e0' }, // granite grey-blue + North Sea silver
  peerie_shetlander: { base: '#1e3545', primary: '#aa6030' }, // North Sea blue + Viking-iron rust
  burns_wee_beastie: { base: '#3a201c', primary: '#c82830' }, // aged ink + Ayrshire arterial red
  witch_hare:    { base: '#281428', primary: '#6a8848' }, // bruised heather + witch-eye green
};
const VARIANT_FALLBACK = { base: '#2a2420', primary: '#8a5a3a' };

/** Top-damage weapon key → secondary stripe colour. Keyed on
 *  `WeaponKey` so a new weapon declared in `src/data/weapons.ts`
 *  fails typecheck here until it's given a clan accent. */
const WEAPON_ACCENTS: Readonly<Record<WeaponKey, string>> = {
  thistle_shot:    '#8c4ab3', // thistle purple
  bagpipe_blast:   '#4fb3c9', // cyan skirl
  caber_toss:      '#8b5a2b', // timber brown
  scotch_mist:     '#a9b0b8', // fog slate
  haggis_hurler:   '#6b2a2a', // oxblood
  nessie_tentacle: '#2f7a7a', // loch teal
  claymore:        '#7a8fa8', // steel blue
  bagpipes:        COLORS_CSS.WHISKY_GOLD, // ceilidh gold
  shinty_stick:    '#3a6a28', // Camanachd-Cup turf-green (Newtonmore / Kingussie pitch)
};
const WEAPON_ACCENT_FALLBACK = '#a8c068';

/** Mode / mod accent thread — thinnest stripe, signals posture. */
const ACCENT_VICTORY = '#f7d27a';     // warm gold
const ACCENT_DEATH   = '#8a93a8';     // muted slate
const ACCENT_IRONMOOR = '#e8e8ec';    // single-life white
const ACCENT_CURSED  = '#1a1a20';     // curse-black thread
const ACCENT_POST_BELL = '#ffb347';   // past-the-bell amber

/** Minimal signature needed to generate a tartan. Subset of the
 *  postcard payload so the renderer stays free of scene coupling. */
export interface TartanSignature {
  /** Haggis variant key ("classic", "iron_belly", …). */
  variantKey?: string;
  /** Which weapon landed the most damage in this run. */
  topWeaponKey?: string;
  /** True on victory runs — picks a warmer accent thread. */
  victory: boolean;
  /** True on Ironmoor single-life runs. */
  ironmoor?: boolean;
  /** True when a curse was active for the run. */
  cursed?: boolean;
  /** True when the player survived past the Bell (Taxman kill). */
  postBell?: boolean;
}

/** Pick the dominant weapon key from a weapon-damage record. */
export function pickTopWeaponKey(damage: Record<string, number> | undefined): string | undefined {
  if (!damage) return undefined;
  let best = -Infinity;
  let key: string | undefined;
  for (const [k, v] of Object.entries(damage)) {
    if (!Number.isFinite(v) || v <= 0) continue;
    if (v > best) { best = v; key = k; }
  }
  return key;
}

/** Resolve a `TartanSignature` → a concrete palette. Accent priority:
 *  cursed > ironmoor > post-bell > victory > death. Only the highest
 *  wins so the pattern never stacks conflicting threads into mud.
 *
 *  Lookups accept unknown `variantKey` / `topWeaponKey` strings (the
 *  signature type is intentionally loose since GameOverPayload can
 *  carry legacy keys from old saves) and fall back to the neutral
 *  palette. New keys declared in `variants.ts` / `weapons.ts` surface
 *  as type errors on the `Record<VariantKey, ...>` / `Record<WeaponKey,
 *  ...>` definitions above — that's the real guard. */
export function buildTartanProfile(sig: TartanSignature): TartanProfile {
  const variant = sig.variantKey
    ? VARIANT_PALETTES[sig.variantKey as VariantKey]
    : undefined;
  const base = (variant ?? VARIANT_FALLBACK).base;
  const primary = (variant ?? VARIANT_FALLBACK).primary;
  const secondary = sig.topWeaponKey
    ? WEAPON_ACCENTS[sig.topWeaponKey as WeaponKey] ?? WEAPON_ACCENT_FALLBACK
    : WEAPON_ACCENT_FALLBACK;

  let accent: string;
  if (sig.cursed) accent = ACCENT_CURSED;
  else if (sig.ironmoor) accent = ACCENT_IRONMOOR;
  else if (sig.postBell) accent = ACCENT_POST_BELL;
  else if (sig.victory) accent = ACCENT_VICTORY;
  else accent = ACCENT_DEATH;

  return { base, primary, secondary, accent };
}

import { pickAuthoredTartan } from './tartanAuthored';

/**
 * Resolve a signature to either a curated authored preset (rare
 * victory conditions — Ironmoor, cursed triumph, post-Bell) or the
 * procedural variant-+-weapon derivation. Postcards go through this
 * entry point so authored presets override procedurally on match;
 * tests that pin the procedural surface still call `buildTartanProfile`
 * directly.
 *
 * The returned `authoredId` is set only when an authored preset won —
 * consumers (gallery UI, analytics) can key on it to label the frame.
 */
export function resolveTartanProfile(
  sig: TartanSignature,
): { profile: TartanProfile; authoredId?: string } {
  const authored = pickAuthoredTartan(sig);
  if (authored) return { profile: authored.profile, authoredId: authored.id };
  return { profile: buildTartanProfile(sig) };
}

/**
 * Paint a tartan patch into `ctx` at `(x, y)` covering `w × h` pixels.
 * Draws warp stripes first (full alpha), then weft stripes at reduced
 * alpha so crossings blend — the cheap trick that reads as plaid.
 *
 * Expects the caller to have already cleared / background-filled the
 * region if needed; this function does NOT clear the canvas.
 */
export function renderTartan(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  profile: TartanProfile,
): void {
  const prevAlpha = ctx.globalAlpha;
  ctx.save();

  // Base fill.
  ctx.fillStyle = profile.base;
  ctx.fillRect(x, y, w, h);

  // Warp (vertical stripes): full alpha.
  drawStripes(ctx, 'vertical', x, y, w, h, profile);

  // Weft (horizontal stripes): alpha blend over warp.
  ctx.globalAlpha = WEFT_ALPHA;
  drawStripes(ctx, 'horizontal', x, y, w, h, profile);

  ctx.globalAlpha = prevAlpha;
  ctx.restore();
}

function drawStripes(
  ctx: CanvasRenderingContext2D,
  axis: 'vertical' | 'horizontal',
  x: number, y: number, w: number, h: number,
  profile: TartanProfile,
): void {
  const length = axis === 'vertical' ? w : h;
  // Draw primary bands.
  ctx.fillStyle = profile.primary;
  for (let i = PRIMARY_OFFSET_PX; i < length; i += CYCLE_PX) {
    const size = Math.min(PRIMARY_BAND_PX, length - i);
    if (size <= 0) break;
    if (axis === 'vertical') ctx.fillRect(x + i, y, size, h);
    else ctx.fillRect(x, y + i, w, size);
  }
  // Draw secondary bands.
  ctx.fillStyle = profile.secondary;
  for (let i = SECONDARY_OFFSET_PX; i < length; i += CYCLE_PX) {
    const size = Math.min(SECONDARY_BAND_PX, length - i);
    if (size <= 0) break;
    if (axis === 'vertical') ctx.fillRect(x + i, y, size, h);
    else ctx.fillRect(x, y + i, w, size);
  }
  // Draw accent threads.
  ctx.fillStyle = profile.accent;
  for (let i = ACCENT_OFFSET_PX; i < length; i += CYCLE_PX) {
    const size = Math.min(ACCENT_BAND_PX, length - i);
    if (size <= 0) break;
    if (axis === 'vertical') ctx.fillRect(x + i, y, size, h);
    else ctx.fillRect(x, y + i, w, size);
  }
}
