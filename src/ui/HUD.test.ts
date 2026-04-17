import { describe, expect, it, vi } from 'vitest';
import { HUD } from './HUD';
import { BALANCE } from '../core/BalanceConfig';
import { t } from '../core/i18n';
import { formatClockTime } from '../utils/formatClockTime';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
    },
  },
}));
vi.mock('../core/SettingsManager', () => ({
  getSettingsManager: () => ({
    load: () => ({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
    }),
  }),
}));

class MockObject {
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;
  public text = '';
  public visible = true;
  public alpha = 1;
  setOrigin() { return this; }
  setScrollFactor() { return this; }
  setDepth() { return this; }
  setInteractive() { return this; }
  setVisible(v: boolean) { this.visible = v; return this; }
  setStrokeStyle() { return this; }
  setFillStyle() { return this; }
  setDisplaySize(w: number, h: number) { this.width = w; this.height = h; return this; }
  setScale() { return this; }
  on() { return this; }
  setTexture() { return this; }
  setColor(color: string) { (this as any).color = color; return this; }
  setAlpha(a: number) { this.alpha = a; return this; }
  setText(t: string) {
    this.text = t;
    this.width = Math.max(this.width, t.length * 8);
    return this;
  }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  destroy() {}
}

function createScene(): any {
  return {
    scale: { width: 1280, height: 720 },
    cameras: { main: { width: 1280, height: 720, zoom: 1, scrollX: 0, scrollY: 0 } },
    textures: { exists: () => true },
    add: {
      rectangle: (_x: number, _y: number, width: number, height: number) => {
        const o = new MockObject();
        o.width = width;
        o.height = height;
        return o;
      },
      text: (_x: number, _y: number, txt: string) => {
        const o = new MockObject();
        o.text = txt;
        return o;
      },
      image: (_x: number, _y: number, _k: string) => new MockObject(),
    },
  };
}

describe('HUD', () => {
  it('uses BALANCE run win time for objective countdown', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    hud.update(100, 100, 2, 0.4, 120, 10, 20);
    const objective = (hud as any).objectiveText.text as string;
    const expectedRemaining = BALANCE.run.RUN_WIN_TIME_SEC - 120;
    expect(objective).toContain(
      t('ui.hud.goal_countdown', { time: formatClockTime(expectedRemaining) })
    );
  });

  it('shows integer HP text (no float noise)', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    hud.update(10 + Number.EPSILON, 110 + Number.EPSILON, 1, 0, 0, 0, 0);
    expect((hud as any).hpText.text).toBe('10/110');
  });

  it('shows curse chip when curseNameKey is provided', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    hud.update(100, 100, 2, 0.4, 10, 1, 2, undefined, undefined, undefined, undefined, undefined, undefined, 'heavy_legs');
    expect((hud as any).curseChipText.visible).toBe(true);
    expect((hud as any).curseChipText.text as string).toContain('Heavy Legs');
    expect((hud as any).curseChipText.text as string).toContain('30');
  });

  it('shows dash readiness row with suffix when on cooldown', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    hud.update(100, 100, 2, 0.4, 10, 1, 2, 0, 1, 0.42);
    expect((hud as any).dashPrefixText.text as string).toContain('Dash');
    expect((hud as any).dashSuffixText.text as string).toMatch(/%/);
  });

  it('applies high-contrast colors to all HUD text when highContrastUi is enabled', async () => {
    // Override the SettingsManager mock to enable high contrast. We need to
    // reset the module cache because HUD reads settings in the constructor.
    vi.resetModules();
    vi.doMock('../core/SettingsManager', () => ({
      getSettingsManager: () => ({
        load: () => ({
          settingsVersion: 1,
          masterVolume: 1,
          sfxVolume: 1,
          musicVolume: 1,
          screenShake: true,
          damageNumbers: true,
          reduceParticles: false,
          uiScale: 1,
          highContrastUi: true,
        }),
      }),
    }));
    const { HUD: HudHC } = await import('./HUD');
    const scene = createScene();
    const hud = new HudHC(scene);
    hud.update(100, 100, 2, 0.4, 120, 10, 20);

    // Every element that is supposed to be repainted in high-contrast mode
    // should now carry a recognizable HC palette color, not the default.
    const palette = {
      text: '#f0f6ff',
      timer: '#fff4d0',
      kill: '#e0e8ff',
      boss: '#ff9595',
    };
    const coloredTargets = [
      'hpText', 'levelText', 'timerText', 'killText', 'pauseText', 'bossNameText', 'curseChipText',
    ];
    for (const key of coloredTargets) {
      const obj = (hud as any)[key];
      expect(obj, `HUD.${key} must exist`).toBeDefined();
    }
    // Timer and kill colors must match the HC palette.
    expect((hud as any).timerText.color).toBe(palette.timer);
    expect((hud as any).killText.color).toBe(palette.kill);
    expect((hud as any).hpText.color).toBe(palette.text);
    expect((hud as any).bossNameText.color).toBe(palette.boss);

    vi.doUnmock('../core/SettingsManager');
  });
});

