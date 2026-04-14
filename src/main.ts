import { registerSW } from 'virtual:pwa-register';
import Phaser from 'phaser';

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
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
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MetaShopScene } from './scenes/MetaShopScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ShopScene } from './scenes/ShopScene';
import { ChronicleScene } from './scenes/ChronicleScene';
import { DeedsScene } from './scenes/DeedsScene';
import { CurseScene } from './scenes/CurseScene';
import { SpriteExportScene } from './tools/SpriteExportScene';

/** Dev: ?export=sprites — sprite sheet. ?quickplay[&seed=n] — BootScene jumps into Game (dev build only). */
const isSpriteExport = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('export');

/** Main Phaser configuration — responsive, WebGL-first with Canvas fallback */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: document.body,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#1a1a2e',
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
    },
  },
  scene: isSpriteExport
    ? [BootScene, SpriteExportScene]
    : [BootScene, MainMenuScene, MenuScene, GameScene, GameOverScene, ShopScene, MetaShopScene, ChronicleScene, DeedsScene, CurseScene, SettingsScene],
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
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
    },
  },
};

if (typeof window !== 'undefined') {
  installAudioActivationOnUserGesture(window);
}

const game = new Phaser.Game(config);

if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Dev-only global for quick runtime inspection from browser console.
  (window as Window & { game?: Phaser.Game }).game = game;
  // Stress-test console hooks: startStressTest() / stopStressTest().
  void import('./dev/StressTest').then((m) => m.installStressTestConsoleHooks());
}

// Canvas role + aria-label are applied in `config.callbacks.postBoot` (see above).
