/**
 * Central registry for custom Phaser 4 render-node shader classes.
 *
 * Each entry maps a stable string id (e.g. `'HaarFog'`) to the
 * `BaseFilterShader` subclass constructor that owns the GLSL source + uniform
 * logic. At game-config time, `buildRenderNodesConfig()` flattens the registry
 * into the shape Phaser expects on `GameConfig.renderNodes`.
 *
 * Controllers (`Filters.Controller` subclasses) reference their render-node
 * by id via `super(camera, 'HaarFog')`; Phaser resolves the id against the
 * config map at draw time. See `docs/adr/0003-shader-registry-phaser-postfx-pipeline.md`.
 */

// Phaser's `Types.Core.RenderNodesConfig` type def claims values are
// `{ key?: string; function?: any }`, but the runtime
// (`RenderNodeManager.js` line ~234) iterates `Object.entries(renderNodes)`
// and calls `addNodeConstructor(name, entry[1])` — passing entry[1] as the
// constructor directly. The wrapper object the type def implies fails with
// `_nodeConstructors[name] is not a constructor` at first render. Pass the
// bare class.
type ShaderClass = new (...args: any[]) => unknown;

const registry = new Map<string, ShaderClass>();

export function registerShader(id: string, ctor: ShaderClass): void {
  if (registry.has(id)) {
    throw new Error(`ShaderRegistry: duplicate registration for id '${id}'`);
  }
  registry.set(id, ctor);
}

export function getShader(id: string): ShaderClass | undefined {
  return registry.get(id);
}

export function listShaderIds(): string[] {
  return Array.from(registry.keys());
}

export function clearShaderRegistry(): void {
  registry.clear();
}

export function buildRenderNodesConfig(): Record<string, ShaderClass> {
  const out: Record<string, ShaderClass> = {};
  for (const [id, ctor] of registry) {
    out[id] = ctor;
  }
  return out;
}
