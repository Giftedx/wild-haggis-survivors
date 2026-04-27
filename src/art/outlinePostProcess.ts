/**
 * Post-process outline -- stamps a 1px dark border around any baked
 * sprite texture using RenderTexture.  Called once per texture key
 * immediately after the Graphics-based bake writes it into the
 * TextureManager.
 */
import * as Phaser from 'phaser';

/** 8-direction offsets for 1px outline. */
const OFFSETS: ReadonlyArray<[number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

/** Dark moor-green tint for outline. */
const OUTLINE_TINT = 0x0a1408;

/**
 * Replace the texture at `textureKey` with an outlined version that is
 * 2px wider and 2px taller (1px border on each side).
 */
export function applyOutline(
  scene: Phaser.Scene,
  textureKey: string,
  width: number,
  height: number,
): void {
  const rt = scene.make.renderTexture(
    { width: width + 2, height: height + 2 },
    false,
  );

  const stamp = new Phaser.GameObjects.Image(scene, 0, 0, textureKey);
  stamp.setOrigin(0, 0);

  // Stamp dark-tinted copies at 8 offsets
  stamp.setTint(OUTLINE_TINT).setTintMode(Phaser.TintModes.FILL);
  for (const [dx, dy] of OFFSETS) {
    stamp.setPosition(1 + dx, 1 + dy);
    rt.draw(stamp);
  }

  // Stamp original (no tint) on top, centred
  stamp.clearTint();
  stamp.setPosition(1, 1);
  rt.draw(stamp);

  // Phaser 4: RenderTexture buffers draw commands; flush before saveTexture.
  rt.render();

  // Replace the original texture with the outlined version.
  // saveTexture rejects duplicate keys, so remove first.
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }
  rt.saveTexture(textureKey);

  // Cleanup
  stamp.destroy();
  rt.destroy();
}

/**
 * Snapshot texture keys currently in the TextureManager.
 * Used with {@link outlineNewTextures} to batch-outline everything a
 * bake function added.
 */
export function snapshotTextureKeys(scene: Phaser.Scene): Set<string> {
  return new Set(scene.textures.getTextureKeys());
}

/** Keys that must never receive an outline (shadows, pickups, UI). */
const OUTLINE_SKIP = new Set([
  'entity_shadow',
  'boss_shadow',
]);

/**
 * Apply outlines to every texture key that appeared since `before` was
 * captured, skipping any key in the OUTLINE_SKIP set.
 *
 * Skipped entirely in sprite-export mode (`?export=sprites`): each
 * `applyOutline` call mounts its own `RenderTexture`, and 200+ FBO
 * creations in a row trip headless Chromium's framebuffer-attachment
 * limit ("Framebuffer Unsupported" pageerror → context lost). The
 * exported atlas PNG renders bare sprites in that mode — still a useful
 * visual reference. Production / dev / playtest paths run with the
 * outline pass on, unchanged. See memory
 * `reference_atlas_export_phaser4_limit.md` for the failure trace.
 */
export function outlineNewTextures(
  scene: Phaser.Scene,
  before: Set<string>,
): void {
  if (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('export')
  ) {
    return;
  }
  for (const key of scene.textures.getTextureKeys()) {
    if (before.has(key)) continue;
    if (OUTLINE_SKIP.has(key)) continue;

    const frame = scene.textures.getFrame(key);
    if (!frame) continue;
    applyOutline(scene, key, frame.width, frame.height);
  }
}
