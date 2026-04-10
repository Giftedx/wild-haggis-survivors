import Phaser from 'phaser';
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { MetaShopScene } from './scenes/MetaShopScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ShopScene } from './scenes/ShopScene';

/** Main Phaser configuration — responsive, WebGL-first with Canvas fallback */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: document.body,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: GAME.PHYSICS_DEBUG,
    },
  },
  scene: [BootScene, MainMenuScene, MenuScene, GameScene, GameOverScene, ShopScene, MetaShopScene, SettingsScene],
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

// Accessibility: label the canvas for screen readers
game.events.once('ready', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Wild Haggis Survivors game. Use WASD or arrow keys to move. Press ESC to pause.');
  }
});
