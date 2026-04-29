import * as Phaser from 'phaser';

export type LazyProductionSceneKey =
  | 'MainMenu'
  | 'Menu'
  | 'Croft'
  | 'GameOver'
  | 'Shop'
  | 'MetaShop'
  | 'Chronicle'
  | 'Deeds'
  | 'Almanac'
  | 'Curse'
  | 'Settings'
  | 'SettingsInput';

type SceneClass = new () => Phaser.Scene;
type SceneManager = Phaser.Scenes.SceneManager;
type SceneManagerWithLazyPatch = SceneManager & {
  __whsLazyProductionScenesInstalled?: boolean;
};
type SceneManagerQueuePatch = SceneManagerWithLazyPatch & {
  queueOp(
    op: string,
    keyA: string | Phaser.Scene,
    keyB?: unknown,
    data?: unknown,
  ): SceneManager;
};

const LAZY_KEYS = new Set<LazyProductionSceneKey>([
  'MainMenu',
  'Menu',
  'Croft',
  'GameOver',
  'Shop',
  'MetaShop',
  'Chronicle',
  'Deeds',
  'Almanac',
  'Curse',
  'Settings',
  'SettingsInput',
]);

const loadingScenes = new WeakMap<SceneManager, Map<LazyProductionSceneKey, Promise<void>>>();

function isLazyProductionSceneKey(key: unknown): key is LazyProductionSceneKey {
  return typeof key === 'string' && LAZY_KEYS.has(key as LazyProductionSceneKey);
}

async function loadProductionSceneClass(key: LazyProductionSceneKey): Promise<SceneClass> {
  switch (key) {
    case 'MainMenu': {
      const mod = await import('./MainMenuScene');
      return mod.MainMenuScene;
    }
    case 'Menu': {
      const mod = await import('./MenuScene');
      return mod.MenuScene;
    }
    case 'Croft': {
      const mod = await import('./CroftScene');
      return mod.CroftScene;
    }
    case 'GameOver': {
      const mod = await import('./GameOverScene');
      return mod.GameOverScene;
    }
    case 'Shop': {
      const mod = await import('./ShopScene');
      return mod.ShopScene;
    }
    case 'MetaShop': {
      const mod = await import('./MetaShopScene');
      return mod.MetaShopScene;
    }
    case 'Chronicle': {
      const mod = await import('./ChronicleScene');
      return mod.ChronicleScene;
    }
    case 'Deeds': {
      const mod = await import('./DeedsScene');
      return mod.DeedsScene;
    }
    case 'Almanac': {
      const mod = await import('./AlmanacScene');
      return mod.AlmanacScene;
    }
    case 'Curse': {
      const mod = await import('./CurseScene');
      return mod.CurseScene;
    }
    case 'Settings': {
      const mod = await import('./SettingsScene');
      return mod.SettingsScene;
    }
    case 'SettingsInput': {
      const mod = await import('./SettingsInputScene');
      return mod.SettingsInputScene;
    }
  }
}

/**
 * One retry on transient module-load failure. Firefox's preview-server
 * module loader occasionally rejects a precached lazy chunk with an
 * empty `Content-Type` during long sessions (verified from the
 * 2026-04-29 e2e suite — MainMenu lazy-load failed with `Loading module
 * from "…MainMenuScene-*.js" was blocked because of a disallowed MIME
 * type ("")` on the firefox long-session-smoke). A 250 ms-backoff retry
 * clears the transient case in practice; permanent failures still
 * surface to the existing catch block + console.error trail.
 */
async function loadProductionSceneClassWithRetry(
  key: LazyProductionSceneKey,
): Promise<SceneClass> {
  try {
    return await loadProductionSceneClass(key);
  } catch {
    await new Promise((r) => setTimeout(r, 250));
    return loadProductionSceneClass(key);
  }
}

async function ensureLazyProductionScene(
  manager: SceneManager,
  key: LazyProductionSceneKey,
): Promise<void> {
  if (manager.getScene(key)) return;

  let loading = loadingScenes.get(manager);
  if (!loading) {
    loading = new Map();
    loadingScenes.set(manager, loading);
  }

  const existing = loading.get(key);
  if (existing) return existing;

  const promise = loadProductionSceneClassWithRetry(key)
    .then((SceneClass) => {
      if (!manager.getScene(key)) {
        manager.add(key, SceneClass, false);
      }
    })
    .catch((err) => {
      console.error(`[lazyProductionScenes] Failed to load ${key}`, err);
      throw err;
    })
    .finally(() => {
      loading?.delete(key);
    });

  loading.set(key, promise);
  return promise;
}

/**
 * T310 — lazy-register non-Boot production scenes. Phaser's ScenePlugin
 * already queues scene operations, so this patch keeps every existing
 * `scene.start('Key')` / `scene.launch('Key')` call-site intact: if the
 * target key is not registered yet, load its chunk, add the real Scene
 * class, then replay the queued operation.
 */
export function installLazyProductionSceneLoader(): void {
  const proto = Phaser.Scenes.SceneManager.prototype as SceneManagerQueuePatch;
  if (proto.__whsLazyProductionScenesInstalled) return;
  proto.__whsLazyProductionScenesInstalled = true;

  const originalStart = proto.start;
  const originalRun = proto.run;
  const originalQueueOp = proto.queueOp;

  proto.start = function startWithLazyScene(
    this: SceneManagerQueuePatch,
    key: string | Phaser.Scene,
    data?: object,
  ): SceneManagerQueuePatch {
    if (isLazyProductionSceneKey(key) && !this.getScene(key)) {
      void ensureLazyProductionScene(this, key).then(() => {
        originalStart.call(this, key, data);
      });
      return this;
    }
    originalStart.call(this, key, data);
    return this;
  };

  proto.run = function runWithLazyScene(
    this: SceneManagerQueuePatch,
    key: string | Phaser.Scene,
    data?: object,
  ): SceneManagerQueuePatch {
    if (isLazyProductionSceneKey(key) && !this.getScene(key)) {
      void ensureLazyProductionScene(this, key).then(() => {
        originalRun.call(this, key, data);
      });
      return this;
    }
    originalRun.call(this, key, data);
    return this;
  };

  proto.queueOp = function queueOpWithLazyScene(
    this: SceneManagerQueuePatch,
    op: string,
    keyA: string | Phaser.Scene,
    keyB?: unknown,
    data?: unknown,
  ): SceneManagerQueuePatch {
    if ((op === 'start' || op === 'run') && isLazyProductionSceneKey(keyA) && !this.getScene(keyA)) {
      void ensureLazyProductionScene(this, keyA).then(() => {
        originalQueueOp.call(this, op, keyA, keyB, data);
      });
      return this;
    }
    originalQueueOp.call(this, op, keyA, keyB, data);
    return this;
  };
}
