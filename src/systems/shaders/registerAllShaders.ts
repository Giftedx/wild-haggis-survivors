import { registerShader } from './ShaderRegistry';

/**
 * Single entry point called once at game-config build time. Every custom
 * shader ships its render-node class in this module. Keeping the registration
 * list here avoids module-import-for-side-effect patterns in `main.ts`.
 *
 * F1 M2 adds HaarFogRenderNode. Future shaders (palette-swap, outline,
 * dissolve, heat-shimmer) slot in the same way.
 */
export function registerAllShaders(): void {
  // Placeholder — no shaders registered yet. F1 M2 adds `HaarFog`.
  void registerShader;
}
