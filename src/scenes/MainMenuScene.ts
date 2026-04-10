import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveManager } from '../core/SaveManager';
import { t } from '../core/i18n';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';

/**
 * Entry hub after boot: shows persistent meta stats and routes into loadout (Menu).
 */
export class MainMenuScene extends Phaser.Scene {
  private saveManager = new SaveManager();
  private gamepadNav: GamepadMenuNav | null = null;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;
    const meta = this.saveManager.load();

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    this.add
      .text(width / 2, 96, t('ui.menu.title'), {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#d4a017',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 154, t('ui.menu.kill_credits', { count: meta.totalKills }), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#95a5c3',
      })
      .setOrigin(0.5);

    const suspended = meta.activeRun != null;

    this.add
      .text(
        width / 2,
        196,
        suspended ? t('ui.menu.hint_suspended') : t('ui.menu.hint_fresh'),
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#6a7390',
          align: 'center',
          wordWrap: { width: width - 80 },
        }
      )
      .setOrigin(0.5);

    const btnW = 240;
    const btnH = 48;
    const bx = width / 2;
    const startY = height / 2 + 12;
    let metaY = startY + btnH + 14;
    let abandonBtn: Phaser.GameObjects.Rectangle | null = null;
    let goLoadoutFresh: (() => void) | null = null;

    const startBtn = this.add
      .rectangle(bx, startY, btnW, btnH, COLORS.SCOTTISH_BLUE, 1)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(bx, startY, suspended ? t('ui.menu.resume_run') : t('ui.menu.start_run'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const goPrimary = () => {
      if (suspended) {
        this.scene.start('Game');
      } else {
        this.scene.start('Menu');
      }
    };

    startBtn.on('pointerover', () => startBtn.setFillStyle(Phaser.Display.Color.ValueToColor(COLORS.SCOTTISH_BLUE).lighten(18).color));
    startBtn.on('pointerout', () => startBtn.setFillStyle(COLORS.SCOTTISH_BLUE));
    startBtn.on('pointerdown', goPrimary);

    startTxt.setInteractive({ useHandCursor: true });
    startTxt.on('pointerdown', goPrimary);

    if (suspended) {
      const newY = startY + btnH + 10;
      metaY = newY + btnH + 14;
      goLoadoutFresh = () => {
        this.saveManager.clearActiveRun();
        this.scene.start('Menu');
      };
      abandonBtn = this.add
        .rectangle(bx, newY, btnW, 42, 0x3a4357, 1)
        .setInteractive({ useHandCursor: true });
      const abandonTxt = this.add
        .text(bx, newY, t('ui.menu.new_run_loadout'), {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#e0e4ee',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      abandonBtn.on('pointerover', () => abandonBtn!.setFillStyle(0x4a5568));
      abandonBtn.on('pointerout', () => abandonBtn!.setFillStyle(0x3a4357));
      abandonBtn.on('pointerdown', goLoadoutFresh);
      abandonTxt.setInteractive({ useHandCursor: true });
      abandonTxt.on('pointerdown', goLoadoutFresh);
    }

    const metaBtn = this.add
      .rectangle(bx, metaY, btnW, btnH, 0x2d6a3e, 1)
      .setInteractive({ useHandCursor: true });
    const metaTxt = this.add
      .text(bx, metaY, t('ui.menu.meta_upgrades'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    metaBtn.on('pointerover', () => metaBtn.setFillStyle(0x3a8f4f));
    metaBtn.on('pointerout', () => metaBtn.setFillStyle(0x2d6a3e));
    metaBtn.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });
    metaTxt.setInteractive({ useHandCursor: true });
    metaTxt.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });

    const optY = metaY + btnH + 14;
    const optBtn = this.add
      .rectangle(bx, optY, btnW, 42, 0x2d3e62, 1)
      .setInteractive({ useHandCursor: true });
    const optTxt = this.add
      .text(bx, optY, t('ui.menu.options'), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    optBtn.on('pointerover', () => optBtn.setFillStyle(0x3d4e72));
    optBtn.on('pointerout', () => optBtn.setFillStyle(0x2d3e62));
    optBtn.on('pointerdown', () => {
      this.scene.start('Settings');
    });
    optTxt.setInteractive({ useHandCursor: true });
    optTxt.on('pointerdown', () => {
      this.scene.start('Settings');
    });

    const entries: GamepadMenuEntry[] = [{ rect: startBtn, activate: goPrimary }];
    if (abandonBtn && goLoadoutFresh) entries.push({ rect: abandonBtn, activate: goLoadoutFresh });
    entries.push(
      { rect: metaBtn, activate: () => this.scene.start('MetaShop') },
      { rect: optBtn, activate: () => this.scene.start('Settings') }
    );
    this.gamepadNav = new GamepadMenuNav(this, entries);
    this.events.once('shutdown', () => {
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
    });
  }
}
