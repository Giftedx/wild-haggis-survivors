/**
 * Dev-only live-tuning panel for weapon + enemy data tables.
 *
 * - Mounts a Tweakpane on document.body (top-right, draggable, collapsed).
 * - Edits mutate WEAPON_DEFS and ENEMY_TYPES in place, persisted to
 *   localStorage so the iterate-by-restart workflow survives reloads.
 * - WeaponSystem snapshots stats at addWeapon/levelUpWeapon time, so live
 *   edits land on the NEXT spawn — pair with `?quickplay&seed=N` for fast loops.
 * - This module is dynamic-imported only when `import.meta.env.DEV`. The
 *   prod bundle never references tweakpane.
 */

import { Pane, type FolderApi } from 'tweakpane';
import { WEAPON_DEFS } from '../data/weapons';
import { ENEMY_TYPES } from '../data/enemies';
import {
  deriveFieldSpecs,
  ENEMY_FIELD_HINTS,
  WEAPON_FIELD_HINTS,
  type FieldSpec,
} from './tuningPanelSchema';

const STORAGE_KEY = 'whs_dev_tuning_overrides';

type OverrideMap = Record<string, number>;

function loadOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: OverrideMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function saveOverrides(map: OverrideMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded or storage disabled — silent in dev tool.
  }
}

function setByPath(target: Record<string, unknown>, path: string[], value: number): void {
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < path.length - 1; i++) {
    const next = cur[path[i]];
    if (!next || typeof next !== 'object') return;
    cur = next as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
}

function applyOverrides(overrides: OverrideMap): void {
  for (const [key, value] of Object.entries(overrides)) {
    const [domain, entity, ...rest] = key.split('.');
    const table =
      domain === 'weapons'
        ? (WEAPON_DEFS as Record<string, unknown>)
        : domain === 'enemies'
          ? (ENEMY_TYPES as Record<string, unknown>)
          : null;
    if (!table) continue;
    const target = table[entity];
    if (!target || typeof target !== 'object') continue;
    setByPath(target as Record<string, unknown>, rest, value);
  }
}

function buildEntityFolder(
  parent: FolderApi,
  domain: 'weapons' | 'enemies',
  entityKey: string,
  target: Record<string, unknown>,
  hints: typeof WEAPON_FIELD_HINTS,
  overrides: OverrideMap,
): void {
  const folder = parent.addFolder({ title: entityKey, expanded: false });
  const specs = deriveFieldSpecs(target, hints);
  for (const spec of specs) {
    addBindingForSpec(folder, target, spec, domain, entityKey, overrides);
  }
}

function addBindingForSpec(
  folder: FolderApi,
  target: Record<string, unknown>,
  spec: FieldSpec,
  domain: 'weapons' | 'enemies',
  entityKey: string,
  overrides: OverrideMap,
): void {
  // Tweakpane needs a (target, key) pair. For nested paths, bind to the
  // parent object using the leaf key.
  let bindTarget: Record<string, unknown> = target;
  for (let i = 0; i < spec.path.length - 1; i++) {
    bindTarget = bindTarget[spec.path[i]] as Record<string, unknown>;
  }
  const leafKey = spec.path[spec.path.length - 1];
  const overrideKey = `${domain}.${entityKey}.${spec.path.join('.')}`;

  folder
    .addBinding(bindTarget, leafKey, {
      label: spec.label,
      min: spec.min,
      max: spec.max,
      step: spec.step,
    })
    .on('change', (ev) => {
      if (typeof ev.value !== 'number') return;
      overrides[overrideKey] = ev.value;
      saveOverrides(overrides);
    });
}

let panelInstance: Pane | null = null;

export function installTuningPanel(): Pane {
  if (panelInstance) return panelInstance;

  const overrides = loadOverrides();
  applyOverrides(overrides);

  const container = document.createElement('div');
  container.id = 'whs-dev-tuning';
  Object.assign(container.style, {
    position: 'fixed',
    top: '8px',
    right: '8px',
    width: '320px',
    maxHeight: 'calc(100vh - 16px)',
    overflowY: 'auto',
    zIndex: '99999',
    fontSize: '11px',
  });
  document.body.appendChild(container);

  const pane = new Pane({ container, title: 'Dev tuning (DEV only)', expanded: false });
  panelInstance = pane;

  const weaponsFolder = pane.addFolder({ title: 'Weapons', expanded: false });
  for (const [key, def] of Object.entries(WEAPON_DEFS)) {
    buildEntityFolder(
      weaponsFolder,
      'weapons',
      key,
      def as unknown as Record<string, unknown>,
      WEAPON_FIELD_HINTS,
      overrides,
    );
  }

  const enemiesFolder = pane.addFolder({ title: 'Enemies', expanded: false });
  for (const [key, cfg] of Object.entries(ENEMY_TYPES)) {
    buildEntityFolder(
      enemiesFolder,
      'enemies',
      key,
      cfg as unknown as Record<string, unknown>,
      ENEMY_FIELD_HINTS,
      overrides,
    );
  }

  const actions = pane.addFolder({ title: 'Actions', expanded: false });
  actions.addButton({ title: 'Reset all overrides + reload' }).on('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
    location.reload();
  });
  actions.addButton({ title: 'Copy overrides as JSON' }).on('click', () => {
    const text = JSON.stringify(loadOverrides(), null, 2);
    void navigator.clipboard?.writeText(text);
    // Dev-only: clipboard write may be denied in some contexts; dump JSON to
    // console so the caller can hand-copy. Production gameplay never reaches
    // this path (TuningPanel is gated behind dev flags).
    // eslint-disable-next-line no-console
    console.log('[TuningPanel] overrides:', text);
  });

  return pane;
}
