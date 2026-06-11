import type * as Phaser from 'phaser';

export type LazyToolSceneKey = 'SpriteExport' | 'CombinationsPreview';

type ToolSceneClass = new () => Phaser.Scene;

async function loadToolSceneClass(key: LazyToolSceneKey): Promise<ToolSceneClass> {
  switch (key) {
    case 'SpriteExport': {
      const mod = await import('./SpriteExportScene');
      return mod.SpriteExportScene;
    }
    case 'CombinationsPreview': {
      const mod = await import('../scenes/dev/CombinationsPreviewScene');
      return mod.CombinationsPreviewScene;
    }
  }
}

export async function ensureLazyToolScene(
  game: Phaser.Game,
  key: LazyToolSceneKey,
): Promise<void> {
  if (game.scene.getScene(key)) return;
  const SceneClass = await loadToolSceneClass(key);
  if (game.scene.getScene(key)) return;
  game.scene.add(key, SceneClass, false);
}

export function installLazyToolSceneLoader(game: Phaser.Game): void {
  if (typeof window === 'undefined') return;
  (window as Window & {
    __WHS_LOAD_TOOL_SCENE__?: (key: LazyToolSceneKey) => Promise<boolean>;
  }).__WHS_LOAD_TOOL_SCENE__ = async (key) => {
    await ensureLazyToolScene(game, key);
    return true;
  };
}
