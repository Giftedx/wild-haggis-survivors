import { registerSW } from 'virtual:pwa-register';
import * as Phaser from 'phaser';

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (!registration) return;
      const ping = () => {
        void registration.update();
      };
      // Tab focus: pick up new deploys without asking playtesters to hard-refresh.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') ping();
      });
      // Periodic check while the game tab stays open (autoUpdate applies when SW changes).
      window.setInterval(ping, 5 * 60 * 1000);
    },
  });
}
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Defensive dev cleanup: prevent stale PWA code from masking layout fixes.
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => undefined);
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => undefined);
  }
}
import { installAudioActivationOnUserGesture } from './systems/audioContext';
import { GAME_CANVAS_ARIA_LABEL } from './constants/gameCanvasA11y';
import { GAME, COLORS_CSS } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ActIntermissionScene } from './scenes/ActIntermissionScene';
import { installLazyProductionSceneLoader } from './scenes/lazyProductionScenes';
import { buildRenderNodesConfig } from './systems/shaders/ShaderRegistry';
import { registerAllShaders } from './systems/shaders/registerAllShaders';
import { applyColorblindFilterToCanvas } from './systems/accessibility/applyColorblindFilter';
import { getSettingsManager } from './core/SettingsManager';
import { installLazyToolSceneLoader } from './tools/lazyToolScenes';

// Register custom render-node shaders before the Phaser.Game constructor reads
// the config map. See docs/adr/0003-shader-registry-phaser-postfx-pipeline.md.
registerAllShaders();
installLazyProductionSceneLoader();

/** Dev: ?export=sprites — sprite sheet. ?quickplay[&seed=n] — BootScene jumps into Game (dev build only). */

/** Main Phaser configuration — responsive, WebGL-first with Canvas fallback */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: document.body,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS_CSS.BG_DARK,
  scale: {
    mode: Phaser.Scale.RESIZE,
    // RESIZE already tracks window size; centering can introduce offsets
    // on some DPI/browser combinations and push fixed UI out of view.
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: GAME.PHYSICS_DEBUG,
      // T1 Phase 3 — fixed-step integration decouples physics from RAF
      // jitter. With `fixedStep: true`, Arcade advances in constant
      // 1/fps increments regardless of the raw delta scenes receive.
      // Necessary for byte-accurate replay playback (ADR-0002 Phase 3).
      fps: 60,
      fixedStep: true,
    },
  },
  scene: [BootScene, GameScene, ActIntermissionScene],
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    // F1 — custom shader render nodes. Map is populated by
    // `registerAllShaders()` above. Phaser's `RenderNodesConfig` type claims
    // values are `{key?, function?}` wrappers, but the runtime
    // (`RenderNodeManager.js` ~line 234) calls `addNodeConstructor(name, entry[1])`
    // directly — wrappers crash with `_nodeConstructors[name] is not a constructor`
    // at first render. Bare constructors are correct; cast to bypass the wrong type.
    renderNodes: buildRenderNodesConfig() as unknown as Record<string, Phaser.Types.Core.RenderNodesConfig>,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: true,
  },
  // Canvas a11y must run via postBoot: if the document is already interactive,
  // Phaser can emit `ready` during `new Phaser.Game()` before any code after
  // the constructor runs — so `game.events.once('ready', …)` may never fire.
  callbacks: {
    postBoot: (game: Phaser.Game) => {
      const canvas = game.canvas ?? document.querySelector('canvas');
      if (!canvas) return;
      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', GAME_CANVAS_ARIA_LABEL);
      // A1 M2 — apply the persisted colorblind filter mode to the
      // canvas on boot. SettingsScene also calls this on change.
      try {
        applyColorblindFilterToCanvas(
          canvas as HTMLCanvasElement,
          getSettingsManager().load().colorblindMode,
        );
      } catch {
        /* non-DOM environments (tests) skip silently */
      }
    },
  },
};

if (typeof window !== 'undefined') {
  installAudioActivationOnUserGesture(window);
}

const game = new Phaser.Game(config);

if (typeof window !== 'undefined') {
  // Exposed unconditionally so Playwright E2E can drive scene transitions
  // (see e2e/resume.spec.ts). Dev convenience still works identically.
  (window as Window & { game?: Phaser.Game }).game = game;
  const params = new URLSearchParams(window.location.search);
  if (import.meta.env.DEV || params.has('devScenes')) {
    installLazyToolSceneLoader(game);
  }
}
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Stress-test console hooks: startStressTest() / stopStressTest().
  void import('./dev/StressTest').then((m) => m.installStressTestConsoleHooks());
  // Live tuning panel for WEAPON_DEFS / ENEMY_TYPES (Tweakpane).
  // Pair with `?quickplay&seed=N` for fast iterate-by-restart loops.
  void import('./dev/TuningPanel').then((m) => m.installTuningPanel());
}

// Canvas role + aria-label are applied in `config.callbacks.postBoot` (see above).
