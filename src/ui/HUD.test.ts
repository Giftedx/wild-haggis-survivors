import { describe, expect, it, vi } from 'vitest';
import { HUD } from './HUD';
import { BALANCE } from '../core/BalanceConfig';
import { t } from '../core/i18n';
import { formatClockTime } from '../utils/formatClockTime';

vi.mock('phaser', () => {
  class GeomRectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) {}
    static Contains(_r: GeomRectangle, _x: number, _y: number) { return true; }
  }
  const __m = {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
    },
    Geom: { Rectangle: GeomRectangle },
  };
  return { default: __m, ...__m };
});
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
      // Drift Mastery pip widget — three Arc dots per HUD instance.
      // Stub matches `Phaser.GameObjects.Arc` shape closely enough for
      // the HUD's `setFillStyle` / `setStrokeStyle` / `setVisible`
      // chains via `MockObject` to satisfy the type checker.
      circle: (_x: number, _y: number, _radius: number, _fill: number, _alpha: number) =>
        new MockObject(),
      // Mood Portrait — Graphics object used for procedural face drawing.
      graphics: () => ({
        setScrollFactor() { return this; },
        setDepth() { return this; },
        setPosition() { return this; },
        clear() { return this; },
        fillStyle() { return this; },
        fillEllipse() { return this; },
        fillRect() { return this; },
        fillCircle() { return this; },
        lineStyle() { return this; },
        lineBetween() { return this; },
        destroy() {},
      }),
    },
    tweens: {
      add: () => ({}),
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

  it('Drift Mastery pips stay hidden until the first bank, then surface for the rest of the run', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    // Fresh HUD — widget should be invisible.
    const dots = (hud as any).gripPipDots as Array<{ visible: boolean }>;
    expect(dots).toHaveLength(3);
    expect(dots.every((d) => d.visible === false)).toBe(true);

    // Zero pips banked — still hidden.
    hud.setGripPips(0, false);
    expect(dots.every((d) => d.visible === false)).toBe(true);

    // First bank — widget surfaces; first dot fills.
    hud.setGripPips(1, false);
    expect(dots.every((d) => d.visible === true)).toBe(true);
    expect((hud as any).gripPipsVisible).toBe(true);

    // Drop back to zero (post-burst) — widget stays visible (sticky).
    hud.setGripPips(0, false);
    expect(dots.every((d) => d.visible === true)).toBe(true);
  });

  it('Drift Mastery pips clamp out-of-range values defensively', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    // Above max → clamped to 3, no throw.
    hud.setGripPips(99, false);
    expect((hud as any).prevGripPips).toBe(3);
    // Negative → clamped to 0.
    hud.setGripPips(-5, false);
    expect((hud as any).prevGripPips).toBe(0);
  });

  it('Whisky Breath bar stays hidden until first stack, then surfaces sticky', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    const fill = (hud as any).whiskyBarFill as { visible: boolean; width: number };
    const bg = (hud as any).whiskyBarBg as { visible: boolean };
    expect(fill.visible).toBe(false);
    expect(bg.visible).toBe(false);
    // Zero stacks — still hidden.
    hud.setWhiskyStacks(0, 12, false);
    expect(fill.visible).toBe(false);
    // First stack — surfaces.
    hud.setWhiskyStacks(1, 12, false);
    expect(fill.visible).toBe(true);
    expect(bg.visible).toBe(true);
    // Drop back to zero — sticky-visible.
    hud.setWhiskyStacks(0, 12, false);
    expect(fill.visible).toBe(true);
  });

  it('Whisky Breath bar fill width scales with stacks / stacksMax', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    const bg = (hud as any).whiskyBarBg as { width: number };
    const fill = (hud as any).whiskyBarFill as { width: number };
    bg.width = 36;
    hud.setWhiskyStacks(6, 12, false);
    expect(fill.width).toBeCloseTo(18, 1);
    hud.setWhiskyStacks(12, 12, true);
    expect(fill.width).toBeCloseTo(36, 1);
  });

  it('Whisky Breath stacks clamp out-of-range values defensively', () => {
    const scene = createScene();
    const hud = new HUD(scene);
    hud.setWhiskyStacks(99, 12, true);
    expect((hud as any).prevWhiskyStacks).toBe(12);
    hud.setWhiskyStacks(-3, 12, false);
    expect((hud as any).prevWhiskyStacks).toBe(0);
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

