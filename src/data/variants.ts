import { t } from '../core/i18n';

export type VariantKey = 'classic' | 'moor_runner' | 'iron_belly' | 'glen_forager' | 'surefoot';

export interface VariantModifier {
  moveSpeedPct?: number;
  maxHpFlat?: number;
  armorFlat?: number;
  pickupRadiusFlat?: number;
  xpMultiplierPct?: number;
  damagePct?: number;
  driftReductionPct?: number;
  cooldownReductionPct?: number;
}

export type VariantUnlockCondition =
  | { type: 'default' }
  | { type: 'best_time'; required: number }
  | { type: 'best_kills'; required: number }
  | { type: 'total_gold_earned'; required: number }
  | { type: 'victories'; required: number };

export interface HaggisPalette {
  outline: number;
  bodyDark: number;
  bodyLight: number;
  fur: number;
  snout: number;
  accent: number;
}

export type HaggisAccentStyle = 'none' | 'racing_band' | 'iron_belly' | 'forager' | 'surefoot';

export interface VariantAppearance {
  palette: HaggisPalette;
  accentStyle: HaggisAccentStyle;
}

export interface VariantDef {
  key: VariantKey;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(flavorKey)` at render time. */
  flavorKey: string;
  /** @deprecated Use t(nameKey). Kept during migration for auto-battler logs. */
  name: string;
  textureKey: string;
  /** @deprecated Use t(flavorKey). */
  flavorText: string;
  modifiers: VariantModifier;
  unlock: VariantUnlockCondition;
  appearance: VariantAppearance;
}

export interface VariantProgressSnapshot {
  bestTime: number;
  bestKills: number;
  totalGoldEarned: number;
  victories: number;
  unlockedVariants?: readonly VariantKey[];
}

export interface VariantUnlockProgress {
  label: string;
  current: number;
  required: number;
  currentText: string;
  requiredText: string;
  ratio: number;
}

export const DEFAULT_VARIANT_KEY: VariantKey = 'classic';

export const VARIANTS: VariantDef[] = [
  {
    key: 'classic',
    nameKey: 'variant.classic.name',
    flavorKey: 'variant.classic.flavor',
    name: 'Classic Haggis',
    textureKey: 'haggis_classic',
    flavorText: 'The baseline beast. Crooked legs, straight ambition.',
    modifiers: {},
    unlock: { type: 'default' },
    appearance: {
      accentStyle: 'none',
      palette: {
        outline: 0x3a2808,
        bodyDark: 0x6b4e0a,
        bodyLight: 0x8b6914,
        fur: 0xa07818,
        snout: 0xd4956b,
        accent: 0xd4a017,
      },
    },
  },
  {
    key: 'moor_runner',
    nameKey: 'variant.moor_runner.name',
    flavorKey: 'variant.moor_runner.flavor',
    name: 'Moor Runner',
    textureKey: 'haggis_moor_runner',
    flavorText: 'Lean and wind-cut, built to skim the heather.',
    modifiers: { moveSpeedPct: 0.12, maxHpFlat: -10 },
    unlock: { type: 'best_time', required: 600 },
    appearance: {
      accentStyle: 'racing_band',
      palette: {
        outline: 0x203010,
        bodyDark: 0x365321,
        bodyLight: 0x4e7430,
        fur: 0x6f9a48,
        snout: 0xc79b6d,
        accent: 0x6fb3ff,
      },
    },
  },
  {
    key: 'iron_belly',
    nameKey: 'variant.iron_belly.name',
    flavorKey: 'variant.iron_belly.flavor',
    name: 'Iron Belly',
    textureKey: 'haggis_iron_belly',
    flavorText: 'Heavy, stubborn, and hard to stop once it starts rolling.',
    modifiers: { maxHpFlat: 15, armorFlat: 1, moveSpeedPct: -0.08 },
    unlock: { type: 'best_kills', required: 750 },
    appearance: {
      accentStyle: 'iron_belly',
      palette: {
        outline: 0x2f2f34,
        bodyDark: 0x575d66,
        bodyLight: 0x7d8694,
        fur: 0xaab4c1,
        snout: 0xc6a17c,
        accent: 0xd4a017,
      },
    },
  },
  {
    key: 'glen_forager',
    nameKey: 'variant.glen_forager.name',
    flavorKey: 'variant.glen_forager.flavor',
    name: 'Glen Forager',
    textureKey: 'haggis_glen_forager',
    flavorText: 'A scavenger of glens and glittering spoils.',
    modifiers: { pickupRadiusFlat: 20, xpMultiplierPct: 0.1, damagePct: -0.1 },
    unlock: { type: 'total_gold_earned', required: 1500 },
    appearance: {
      accentStyle: 'forager',
      palette: {
        outline: 0x1f2d14,
        bodyDark: 0x455f22,
        bodyLight: 0x6e8a39,
        fur: 0x99b94d,
        snout: 0xc7a26e,
        accent: 0x7dd66e,
      },
    },
  },
  {
    key: 'surefoot',
    nameKey: 'variant.surefoot.name',
    flavorKey: 'variant.surefoot.flavor',
    name: 'Surefoot',
    textureKey: 'haggis_surefoot',
    flavorText: 'The drift still whispers, but it no longer decides.',
    modifiers: { driftReductionPct: 0.25, cooldownReductionPct: 0.05, maxHpFlat: -10 },
    unlock: { type: 'victories', required: 1 },
    appearance: {
      accentStyle: 'surefoot',
      palette: {
        outline: 0x341919,
        bodyDark: 0x6a2c2c,
        bodyLight: 0x973f3f,
        fur: 0xc56a52,
        snout: 0xd9a17a,
        accent: 0x66d0ff,
      },
    },
  },
];

export const VARIANT_KEYS = VARIANTS.map((variant) => variant.key) as VariantKey[];

const VARIANT_BY_KEY: Record<VariantKey, VariantDef> = VARIANTS.reduce((acc, variant) => {
  acc[variant.key] = variant;
  return acc;
}, {} as Record<VariantKey, VariantDef>);

export function isVariantKey(value: unknown): value is VariantKey {
  return typeof value === 'string' && value in VARIANT_BY_KEY;
}

export function coerceVariantKeys(values: unknown): VariantKey[] {
  if (!Array.isArray(values)) return [];

  const coerced = new Set<VariantKey>();
  for (const value of values) {
    if (isVariantKey(value)) coerced.add(value);
  }
  return VARIANT_KEYS.filter((key) => coerced.has(key));
}

export function getVariantByKey(key: VariantKey | string | null | undefined): VariantDef {
  if (!key || !isVariantKey(key)) return VARIANT_BY_KEY[DEFAULT_VARIANT_KEY];
  return VARIANT_BY_KEY[key];
}

export function meetsVariantUnlockCondition(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): boolean {
  switch (variant.unlock.type) {
    case 'default':
      return true;
    case 'best_time':
      return progress.bestTime >= variant.unlock.required;
    case 'best_kills':
      return progress.bestKills >= variant.unlock.required;
    case 'total_gold_earned':
      return progress.totalGoldEarned >= variant.unlock.required;
    case 'victories':
      return progress.victories >= variant.unlock.required;
  }
}

export function isVariantUnlocked(variant: VariantDef, progress: VariantProgressSnapshot): boolean {
  if (progress.unlockedVariants?.includes(variant.key)) return true;
  return meetsVariantUnlockCondition(variant, progress);
}

export function getVariantUnlockProgress(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): VariantUnlockProgress | null {
  switch (variant.unlock.type) {
    case 'default':
      return null;
    case 'best_time':
      return createUnlockProgress(
        t('variant.unlock.survive'),
        progress.bestTime,
        variant.unlock.required,
        formatTime(progress.bestTime),
        formatTime(variant.unlock.required)
      );
    case 'best_kills':
      return createUnlockProgress(
        t('variant.unlock.best_kills'),
        progress.bestKills,
        variant.unlock.required,
        `${progress.bestKills}`,
        `${variant.unlock.required}`
      );
    case 'total_gold_earned':
      return createUnlockProgress(
        t('variant.unlock.total_gold'),
        progress.totalGoldEarned,
        variant.unlock.required,
        `${progress.totalGoldEarned}`,
        `${variant.unlock.required}`
      );
    case 'victories':
      return createUnlockProgress(
        t('variant.unlock.victories'),
        progress.victories,
        variant.unlock.required,
        `${progress.victories}`,
        `${variant.unlock.required}`
      );
  }
}

export function formatVariantModifierSummary(variant: VariantDef): string {
  const parts: string[] = [];
  const { modifiers } = variant;
  const pctInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    pct: Math.round(value * 100),
  });
  const flatInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    val: value,
  });

  if (modifiers.moveSpeedPct) parts.push(t('variant.summary.speed', pctInterp(modifiers.moveSpeedPct)));
  if (modifiers.maxHpFlat) parts.push(t('variant.summary.hp', flatInterp(modifiers.maxHpFlat)));
  if (modifiers.armorFlat) parts.push(t('variant.summary.armor', flatInterp(modifiers.armorFlat)));
  if (modifiers.pickupRadiusFlat) parts.push(t('variant.summary.pickup', flatInterp(modifiers.pickupRadiusFlat)));
  if (modifiers.xpMultiplierPct) parts.push(t('variant.summary.xp', pctInterp(modifiers.xpMultiplierPct)));
  if (modifiers.damagePct) parts.push(t('variant.summary.dmg', pctInterp(modifiers.damagePct)));
  if (modifiers.driftReductionPct) parts.push(t('variant.summary.drift', pctInterp(modifiers.driftReductionPct)));
  if (modifiers.cooldownReductionPct) parts.push(t('variant.summary.cdr', pctInterp(modifiers.cooldownReductionPct)));

  return parts.length > 0 ? parts.join('  |  ') : t('variant.summary.baseline');
}

export function formatVariantUnlockText(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): string {
  if (isVariantUnlocked(variant, progress)) return t('variant.unlock.ready');

  const unlockProgress = getVariantUnlockProgress(variant, progress);
  if (!unlockProgress) return t('variant.unlock.ready');

  return `${unlockProgress.label}: ${unlockProgress.currentText} / ${unlockProgress.requiredText}`;
}

export function formatRunVariantLabel(variant: VariantDef): string {
  const summary = formatVariantModifierSummary(variant);
  return summary === 'Baseline stats' ? variant.name : `${variant.name}  |  ${summary}`;
}

function createUnlockProgress(
  label: string,
  currentValue: number,
  requiredValue: number,
  currentText: string,
  requiredText: string
): VariantUnlockProgress {
  const current = Math.min(Math.max(0, currentValue), requiredValue);
  const required = Math.max(1, requiredValue);

  return {
    label,
    current,
    required,
    currentText,
    requiredText,
    ratio: Math.min(1, current / required),
  };
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
}

function formatSignedNumber(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
