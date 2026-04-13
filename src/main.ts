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

/** Dev tool: visit ?export=sprites to download a full sprite sheet PNG */
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
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Dev-only global for quick runtime inspection from browser console.
  (window as Window & { game?: Phaser.Game }).game = game;
}

// Accessibility: label the canvas for screen readers.
// The aria-label is intentionally hardcoded in English to match document lang="en".
// When localized builds ship, derive this from t('ui.menu.title') + a per-locale
// screen-reader instruction key (e.g. `ui.a11y.canvas_instructions`).
game.events.once('ready', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Wild Haggis Survivors game. Use WASD or arrow keys to move. Press ESC to pause.');
  }
});
