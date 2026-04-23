/**
 * Pure schema-derivation for the dev tuning panel.
 *
 * Walks a sample object (e.g. a WeaponDef or EnemyConfig) and emits a flat list
 * of FieldSpec records describing every numeric leaf the panel should expose.
 * Non-numeric fields, identifier-style keys, arrays, and i18n paths are skipped.
 *
 * Range/step are looked up from a hints table keyed by the leaf field name.
 * Unhinted numeric leaves get a sensible default (0 → 4× current value).
 */

export interface FieldHint {
  min: number;
  max: number;
  step: number;
}

export interface FieldSpec {
  path: string[];
  label: string;
  min: number;
  max: number;
  step: number;
}

const SKIP_LEAF_KEYS = new Set([
  'key',
  'texture',
  'behavior',
  'evolutionKey',
]);

export function isHintedNumberLeaf(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function shouldSkipKey(key: string): boolean {
  if (SKIP_LEAF_KEYS.has(key)) return true;
  if (key.endsWith('Key')) return true;
  return false;
}

function defaultHint(value: number): FieldHint {
  if (value === 0) return { min: 0, max: 1, step: 0.01 };
  const max = Math.max(1, Math.abs(value) * 4);
  const isInt = Number.isInteger(value);
  return {
    min: 0,
    max,
    step: isInt ? 1 : Math.max(0.001, max / 1000),
  };
}

export function deriveFieldSpecs(
  target: Record<string, unknown>,
  hints: Record<string, FieldHint> = {},
  parentPath: string[] = [],
): FieldSpec[] {
  const out: FieldSpec[] = [];
  for (const [key, value] of Object.entries(target)) {
    if (shouldSkipKey(key)) continue;
    if (Array.isArray(value)) continue;
    if (value === null) continue;

    if (isHintedNumberLeaf(value)) {
      const hint = hints[key] ?? defaultHint(value);
      out.push({
        path: [...parentPath, key],
        label: parentPath.length > 0 ? `${parentPath.join('.')}.${key}` : key,
        min: hint.min,
        max: hint.max,
        step: hint.step,
      });
      continue;
    }

    if (typeof value === 'object') {
      out.push(
        ...deriveFieldSpecs(
          value as Record<string, unknown>,
          hints,
          [...parentPath, key],
        ),
      );
    }
  }
  return out;
}

export const WEAPON_FIELD_HINTS: Record<string, FieldHint> = {
  damage: { min: 0, max: 100, step: 0.5 },
  cooldownMs: { min: 50, max: 10000, step: 50 },
  projectileSpeed: { min: 0, max: 1500, step: 10 },
  projectileCount: { min: 0, max: 20, step: 1 },
  pierce: { min: 0, max: 20, step: 1 },
  range: { min: 0, max: 2000, step: 10 },
  aoeRadius: { min: 0, max: 600, step: 5 },
  arcDegrees: { min: 0, max: 360, step: 1 },
  knockback: { min: 0, max: 800, step: 5 },
  cooldown: { min: 0.3, max: 1.5, step: 0.01 },
  radius: { min: 0.5, max: 3, step: 0.05 },
};

export const ENEMY_FIELD_HINTS: Record<string, FieldHint> = {
  speed: { min: 0, max: 400, step: 5 },
  hp: { min: 1, max: 2000, step: 1 },
  damage: { min: 0, max: 200, step: 1 },
  xpValue: { min: 0, max: 100, step: 1 },
  appearsAt: { min: 0, max: 1800, step: 5 },
  packSize: { min: 1, max: 50, step: 1 },
  massOverride: { min: 0.1, max: 20, step: 0.1 },
};
