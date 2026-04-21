# Art & Music Polish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve perfect visual and audio continuity across every scene — unified buttons, consistent typography, variant-aware kilts, standardised sprite shadows, and balanced audio.

**Architecture:** Three phases. Phase A builds foundation systems (color constants, button factory, typography scale) that Phase B (visual continuity) and Phase C (audio polish) depend on. Within each phase, tasks are independent and parallelisable.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

---

## File Structure

### New files to create:
- `src/ui/gameButton.ts` — Unified button factory (3 tiers + text-link)
- `src/ui/typography.ts` — Font size scale, text style factories, stroke thickness rules
- `src/art/kiltPalette.ts` — Variant-aware kilt color derivation

### Files to modify (key touchpoints):
- `src/config.ts` — Add missing color constants
- `src/entities/haggisComposition/drawers/kilt.ts` — Accept variant palette
- `src/art/sprites/icons/cards.ts` — Kilt card icon uses variant colors
- `src/ui/buttonHover.ts` — Extended with click sound integration
- `src/scenes/MainMenuScene.ts` — Button + typography migration
- `src/scenes/MenuScene.ts` — Button + typography migration
- `src/scenes/ShopScene.ts` — Button + typography migration
- `src/scenes/GameOverScene.ts` — Button + typography migration
- `src/scenes/game/PauseMenu.ts` — Button migration + add click SFX
- `src/scenes/MetaShopScene.ts` — Button + typography migration
- `src/scenes/SettingsScene.ts` — Button migration
- `src/scenes/CurseScene.ts` — Button migration
- `src/art/sprites/enemies/*.ts` (9 files) — Remove inline shadows
- `src/systems/AudioSystem.ts` — Gain rebalance + new SFX
- `src/systems/music/ProceduralMusicEngine.ts` — Default gain adjustment

---

## Phase A: Foundation Systems

### Task 1: Expand Color Palette Constants

**Files:**
- Modify: `src/config.ts`
- Test: `src/config.test.ts` (if exists, else inline verification)

Audit found these colors used 3+ times with no named constant. Add them to the palette so every call site can reference a single source of truth.

- [ ] **Step 1: Add missing hex constants to COLORS**

In `src/config.ts`, after the existing `BG_DARK` entry in COLORS (line 101), add:

```typescript
export const COLORS = {
  // ... existing entries ...

  /** Background */
  BG_DARK: 0x1a1a2e,

  /** Sprite art red — slightly cooler than HP_RED, used for clothing /
   *  armour across angryScotsman, hunterGeneral, deepFryer, chest, and
   *  the boss HP bar fill. Kept distinct from HP_RED (UI health bars)
   *  so art palette and HUD palette can evolve independently. */
  SPRITE_RED: 0xcc2222,

  /** Toast / achievement overlay gold — warm highlight for transient
   *  notifications (act intermission titles, achievement pops, event
   *  bus toasts). */
  TOAST_GOLD: 0xffdd88,

  /** Danger-flash red — damage vignette, low-FPS indicator, HP-crit
   *  feedback. Brighter and more saturated than HP_RED so it punches
   *  through particle noise. */
  DANGER_RED: 0xff4444,
} as const;
```

- [ ] **Step 2: Add matching CSS constants to COLORS_CSS**

After the existing `HP_RED` entry in COLORS_CSS (line 127), add:

```typescript
export const COLORS_CSS = {
  // ... existing entries ...
  HP_RED: '#cc3333',

  SPRITE_RED: '#cc2222',
  TOAST_GOLD: '#ffdd88',
  DANGER_RED: '#ff4444',
  LEGENDARY: '#ddaa00',
} as const;
```

- [ ] **Step 3: Run build to verify no type errors**

Run: `npm run build`
Expected: Clean pass — only additive changes.

- [ ] **Step 4: Commit**

```bash
git add src/config.ts
git commit -m "feat(palette): add SPRITE_RED, TOAST_GOLD, DANGER_RED, LEGENDARY CSS constants"
```

---

### Task 2: Replace Hardcoded UI Color Duplicates

**Files:**
- Modify: 13 files across `src/scenes/`, `src/ui/`, `src/systems/`

Replace every hardcoded hex duplicate that should reference a COLORS / COLORS_CSS constant. Sprite art files (`src/art/sprites/`) are **excluded** — their local color values are part of hand-tuned pixel art and should stay local.

- [ ] **Step 1: Replace `'#ffdd88'` → `COLORS_CSS.TOAST_GOLD` (5 files)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/scenes/ActIntermissionScene.ts` | 73 | `'#ffdd88'` | `COLORS_CSS.TOAST_GOLD` |
| `src/scenes/ActIntermissionScene.ts` | 102 | `'#ffdd88'` | `COLORS_CSS.TOAST_GOLD` |
| `src/scenes/game/RunLifecycle.ts` | 160 | `'#ffdd88'` | `COLORS_CSS.TOAST_GOLD` |
| `src/scenes/game/wireSceneEventBus.ts` | 25 | `'#ffdd88'` | `COLORS_CSS.TOAST_GOLD` |
| `src/scenes/GameScene.ts` | 1585 | `'#ffdd88'` | `COLORS_CSS.TOAST_GOLD` |

Add `import { COLORS_CSS } from '../config';` (or adjust relative path) to each file if not already imported.

- [ ] **Step 2: Replace `'#ddaa00'` → `COLORS_CSS.LEGENDARY` (3 files)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/scenes/game/LevelUpFlow.ts` | 233 | `'#ddaa00'` | `COLORS_CSS.LEGENDARY` |
| `src/scenes/game/PauseMenu.ts` | 231 | `'#ddaa00'` | `COLORS_CSS.LEGENDARY` |
| `src/ui/HUD.ts` | 802 | `'#ddaa00'` | `COLORS_CSS.LEGENDARY` |

- [ ] **Step 3: Replace `'#ff4444'` → `COLORS_CSS.DANGER_RED` (3 files)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/scenes/game/wireSceneEventBus.ts` | 29 | `'#ff4444'` | `COLORS_CSS.DANGER_RED` |
| `src/ui/fpsColor.ts` | 21 | `'#ff4444'` | `COLORS_CSS.DANGER_RED` |
| `src/ui/HUD.ts` | 544 | `'#ff4444'` | `COLORS_CSS.DANGER_RED` |

- [ ] **Step 4: Replace `'#ee5566'` → `COLORS_CSS.DANGER_RED` (1 file)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/scenes/game/GameTickers.ts` | 117 | `'#ee5566'` | `COLORS_CSS.DANGER_RED` |

Note: `#ee5566` is close enough to `#ff4444` that unifying under DANGER_RED is correct — both serve as "damage/danger flash" indicators. The slight hue difference was accidental drift.

- [ ] **Step 5: Replace `'#d4a017'` → `COLORS_CSS.WHISKY_GOLD` (2 files)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/scenes/game/EnemyKillHandler.ts` | 260 | `'#d4a017'` | `COLORS_CSS.WHISKY_GOLD` |
| `src/utils/tartan.ts` | 70 | `'#d4a017'` | `COLORS_CSS.WHISKY_GOLD` |

- [ ] **Step 6: Replace `0xcc2222` → `COLORS.SPRITE_RED` in HUD (1 file)**

| File | Line | Old | New |
|------|------|-----|-----|
| `src/ui/hudBossBar.ts` | 66 | `0xcc2222` | `COLORS.SPRITE_RED` |

The other 0xcc2222 occurrences are in sprite art files — leave those as-is.

- [ ] **Step 7: Run build + tests**

Run: `npm run build && npm test`
Expected: All pass — pure find-and-replace of identical values.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(palette): replace hardcoded UI color duplicates with COLORS/COLORS_CSS refs"
```

---

### Task 3: Create Unified Button Factory

**Files:**
- Create: `src/ui/gameButton.ts`
- Modify: `src/ui/buttonHover.ts` — add click sound integration
- Test: `src/ui/gameButton.test.ts`

The game has 12+ different button visual styles across scenes. This task creates a single factory producing 3 tiers of button with consistent sizing, colors, hover behavior, and click audio.

**Design decisions:**
- **Primary** (Scottish Blue): main CTA — "Play", "Resume", "Start Run"
- **Secondary** (slate grey `0x3a4357`): secondary actions — "Upgrades", "Back", "End Run"
- **Tertiary** (dark navy `0x252540`): quiet navigation — "Chronicle", "Deeds", "Options"
- **Text-link**: no background rectangle — "copy seed", "rerun"
- All rectangle buttons get `attachButtonHoverFill` + `playClick()` on pointerdown
- All tiers share `fontFamily: 'monospace'`, `fontStyle: 'bold'`, `stroke: '#000'`

- [ ] **Step 1: Write test for button factory**

Create `src/ui/gameButton.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  resolveButtonStyle,
  BUTTON_TIER,
  type ButtonTier,
} from './gameButton';

describe('resolveButtonStyle', () => {
  it('primary tier uses SCOTTISH_BLUE fill', () => {
    const s = resolveButtonStyle('primary');
    expect(s.fill).toBe(0x005eb8);
  });

  it('secondary tier uses slate fill', () => {
    const s = resolveButtonStyle('secondary');
    expect(s.fill).toBe(0x3a4357);
  });

  it('tertiary tier uses dark navy fill', () => {
    const s = resolveButtonStyle('tertiary');
    expect(s.fill).toBe(0x252540);
  });

  it('all tiers define hover fill different from idle', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.hover).not.toBe(s.fill);
    }
  });

  it('all tiers define text color', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.textColor).toBeTruthy();
    }
  });

  it('all tiers define fontSize', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.fontSize).toMatch(/^\d+px$/);
    }
  });

  it('all tiers have strokeThickness >= 2', () => {
    for (const tier of ['primary', 'secondary', 'tertiary'] as ButtonTier[]) {
      const s = resolveButtonStyle(tier);
      expect(s.strokeThickness).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/gameButton.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the button factory**

Create `src/ui/gameButton.ts`:

```typescript
/**
 * Unified button factory — one visual language for every interactive
 * rectangle in the game. Three tiers (primary / secondary / tertiary)
 * and a text-link variant cover every semantic role.
 *
 * Scene call sites swap from ad-hoc rectangles + text pairs to:
 *   const { rect, label } = createGameButton(scene, { ... });
 *
 * Palette, hover-fill, click sound, and hand-cursor are all wired
 * internally — scenes only choose tier, position, size, and label.
 */
import type Phaser from 'phaser';
import { COLORS } from '../config';
import { attachButtonHoverFill } from './buttonHover';

// ── Tier palette ────────────────────────────────────────────────────

export type ButtonTier = 'primary' | 'secondary' | 'tertiary';

export interface ButtonStyle {
  fill: number;
  hover: number;
  textColor: string;
  fontSize: string;
  strokeThickness: number;
}

const STYLES: Record<ButtonTier, ButtonStyle> = {
  primary: {
    fill: COLORS.SCOTTISH_BLUE,
    hover: 0x0077dd,
    textColor: '#ffffff',
    fontSize: '18px',
    strokeThickness: 3,
  },
  secondary: {
    fill: 0x3a4357,
    hover: 0x4a5568,
    textColor: '#ffffff',
    fontSize: '16px',
    strokeThickness: 2,
  },
  tertiary: {
    fill: 0x252540,
    hover: 0x2a2244,
    textColor: '#e8d4a0',
    fontSize: '15px',
    strokeThickness: 2,
  },
};

export function resolveButtonStyle(tier: ButtonTier): ButtonStyle {
  return STYLES[tier];
}

// ── Factory ─────────────────────────────────────────────────────────

export interface GameButtonOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  tier: ButtonTier;
  /** Override default font size for this tier. */
  fontSize?: string;
  /** UI scale multiplier (from settings). */
  uiScale?: number;
}

export interface GameButtonResult {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

/**
 * Create a rectangle button with consistent tier styling, hover fill,
 * click sound, and hand cursor. Returns both objects so the caller
 * can wire pointerdown handlers and manage depth/scroll.
 */
export function createGameButton(
  scene: Phaser.Scene,
  opts: GameButtonOpts,
): GameButtonResult {
  const style = STYLES[opts.tier];
  const fontSize = opts.fontSize ?? style.fontSize;

  const rect = scene.add
    .rectangle(opts.x, opts.y, opts.width, opts.height, style.fill, 1)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(opts.x, opts.y, opts.label, {
      fontFamily: 'monospace',
      fontSize,
      color: style.textColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: style.strokeThickness,
    })
    .setOrigin(0.5);

  if (opts.uiScale !== undefined) label.setScale(opts.uiScale);

  attachButtonHoverFill(rect, style.fill, style.hover);

  return { rect, label };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/gameButton.test.ts`
Expected: All PASS.

- [ ] **Step 5: Add click sound to buttonHover utility**

Modify `src/ui/buttonHover.ts` — add an optional `withClick` parameter that wires `playClick()` on pointerdown. This lets scenes opt-in to consistent click audio without managing it themselves.

```typescript
import type Phaser from 'phaser';

/**
 * Wires standard pointerover / pointerout fill swap. Optionally wires
 * pointerdown click sound when `withClick` is true.
 */
export function attachButtonHoverFill(
  btn: Phaser.GameObjects.Rectangle,
  idle: number,
  hover: number,
  withClick?: boolean,
): void {
  btn.on('pointerover', () => btn.setFillStyle(hover));
  btn.on('pointerout', () => btn.setFillStyle(idle));
  if (withClick) {
    btn.on('pointerdown', () => {
      // Dynamic import avoids circular dependency — AudioSystem is a
      // singleton that may not be initialised when buttonHover loads.
      import('../systems/AudioSystem').then(m => m.audio?.playClick());
    });
  }
}
```

- [ ] **Step 6: Wire click sound into createGameButton**

In `src/ui/gameButton.ts`, update the `attachButtonHoverFill` call to pass `true` for `withClick`:

```typescript
  attachButtonHoverFill(rect, style.fill, style.hover, true);
```

- [ ] **Step 7: Run build + tests**

Run: `npm run build && npm test`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/ui/gameButton.ts src/ui/gameButton.test.ts src/ui/buttonHover.ts
git commit -m "feat(ui): unified button factory — 3 tiers with consistent palette, hover, and click audio"
```

---

### Task 4: Create Typography Scale System

**Files:**
- Create: `src/ui/typography.ts`
- Test: `src/ui/typography.test.ts`

The game has ~40 ad-hoc inline text styles with no hierarchy. This task defines a type scale and provides factory functions that every scene uses.

**Scale (based on what exists, standardised):**

| Role | Size | Weight | Stroke | Use |
|------|------|--------|--------|-----|
| `display` | 48px | bold | 7 | Main menu title only |
| `title` | 30px | bold | 4 | Scene headers (Chronicle, Deeds, Shop, etc.) |
| `heading` | 22px | bold | 3 | Pause title, panel headers |
| `body` | 16px | bold | 2 | HUD labels, float text, descriptions |
| `label` | 13px | bold | 2 | Button text, chips, small labels |
| `small` | 11px | bold | 2 | Pagination, metadata, pips |
| `subtitle` | 13px | italic | 0 | Scene subtitles, flavor text |

- [ ] **Step 1: Write tests for typography system**

Create `src/ui/typography.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  FONT_SCALE,
  textStyle,
  type FontRole,
} from './typography';

describe('FONT_SCALE', () => {
  it('defines all 7 roles', () => {
    const roles: FontRole[] = [
      'display', 'title', 'heading', 'body', 'label', 'small', 'subtitle',
    ];
    for (const role of roles) {
      expect(FONT_SCALE[role]).toBeDefined();
      expect(FONT_SCALE[role].size).toMatch(/^\d+px$/);
    }
  });

  it('sizes decrease from display to small', () => {
    const ordered: FontRole[] = ['display', 'title', 'heading', 'body', 'label', 'small'];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = parseInt(FONT_SCALE[ordered[i]].size);
      const b = parseInt(FONT_SCALE[ordered[i + 1]].size);
      expect(a).toBeGreaterThan(b);
    }
  });
});

describe('textStyle', () => {
  it('returns correct fontFamily', () => {
    const s = textStyle('body');
    expect(s.fontFamily).toBe('monospace');
  });

  it('applies color override', () => {
    const s = textStyle('body', { color: '#ff0000' });
    expect(s.color).toBe('#ff0000');
  });

  it('uses white as default color', () => {
    const s = textStyle('body');
    expect(s.color).toBe('#ffffff');
  });

  it('subtitle role uses italic', () => {
    const s = textStyle('subtitle');
    expect(s.fontStyle).toBe('italic');
  });

  it('non-subtitle roles use bold', () => {
    const s = textStyle('title');
    expect(s.fontStyle).toBe('bold');
  });

  it('applies stroke for non-subtitle roles', () => {
    const s = textStyle('title');
    expect(s.stroke).toBe('#000');
    expect(s.strokeThickness).toBe(4);
  });

  it('subtitle has no stroke by default', () => {
    const s = textStyle('subtitle');
    expect(s.strokeThickness).toBe(0);
  });

  it('align option is passed through', () => {
    const s = textStyle('body', { align: 'center' });
    expect(s.align).toBe('center');
  });

  it('wordWrap option is passed through', () => {
    const s = textStyle('subtitle', { wordWrap: { width: 300 } });
    expect(s.wordWrap).toEqual({ width: 300 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/typography.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the typography system**

Create `src/ui/typography.ts`:

```typescript
/**
 * Typography scale — single source of truth for every text style in
 * the game. Seven roles from `display` (48px scene titles) down to
 * `small` (11px metadata) plus `subtitle` (13px italic).
 *
 * Usage:
 *   scene.add.text(x, y, 'Hello', textStyle('title', { color: COLORS_CSS.WHISKY_GOLD }));
 */

export type FontRole =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'small'
  | 'subtitle';

export interface FontScaleEntry {
  size: string;
  weight: 'bold' | 'italic';
  strokeThickness: number;
}

export const FONT_SCALE: Readonly<Record<FontRole, FontScaleEntry>> = {
  display:  { size: '48px', weight: 'bold',   strokeThickness: 7 },
  title:    { size: '30px', weight: 'bold',   strokeThickness: 4 },
  heading:  { size: '22px', weight: 'bold',   strokeThickness: 3 },
  body:     { size: '16px', weight: 'bold',   strokeThickness: 2 },
  label:    { size: '13px', weight: 'bold',   strokeThickness: 2 },
  small:    { size: '11px', weight: 'bold',   strokeThickness: 2 },
  subtitle: { size: '13px', weight: 'italic', strokeThickness: 0 },
};

export interface TextStyleOpts {
  color?: string;
  align?: string;
  wordWrap?: { width: number };
  /** Override the scale's default font size. */
  fontSize?: string;
}

export interface GameTextStyle {
  fontFamily: 'monospace';
  fontSize: string;
  color: string;
  fontStyle: 'bold' | 'italic';
  stroke: string;
  strokeThickness: number;
  align?: string;
  wordWrap?: { width: number };
}

/**
 * Build a Phaser-compatible text style object from a typography role.
 *
 * ```ts
 * scene.add.text(x, y, label, textStyle('title', { color: '#d4a017' }));
 * ```
 */
export function textStyle(
  role: FontRole,
  opts?: TextStyleOpts,
): GameTextStyle {
  const entry = FONT_SCALE[role];
  const style: GameTextStyle = {
    fontFamily: 'monospace',
    fontSize: opts?.fontSize ?? entry.size,
    color: opts?.color ?? '#ffffff',
    fontStyle: entry.weight === 'italic' ? 'italic' : 'bold',
    stroke: entry.strokeThickness > 0 ? '#000' : '',
    strokeThickness: entry.strokeThickness,
  };
  if (opts?.align) style.align = opts.align;
  if (opts?.wordWrap) style.wordWrap = opts.wordWrap;
  return style;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/typography.test.ts`
Expected: All PASS.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: Clean pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/typography.ts src/ui/typography.test.ts
git commit -m "feat(ui): typography scale system — 7 roles from display to small"
```

---

### Task 5: Migrate Scene Buttons to Unified Factory

**Files:**
- Modify: `src/scenes/MainMenuScene.ts`, `src/scenes/MenuScene.ts`, `src/scenes/ShopScene.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/game/PauseMenu.ts`, `src/scenes/MetaShopScene.ts`, `src/scenes/SettingsScene.ts`, `src/scenes/CurseScene.ts`
- Modify: `src/scenes/createBackButton.ts` — rewrite to use factory internally

**Strategy:** Keep each scene's existing layout positioning. Only change how buttons are constructed — swap ad-hoc `scene.add.rectangle` + `scene.add.text` pairs for `createGameButton()`. Preserve all existing pointerdown handlers.

**Tier mapping for every button in the game:**

| Scene | Button | Current Fill | Target Tier | Notes |
|-------|--------|-------------|-------------|-------|
| MainMenu | Start Run / Resume Run | SCOTTISH_BLUE | `primary` | Main CTA |
| MainMenu | New Run / Loadout | 0x3a4357 | `secondary` | |
| MainMenu | Daily Challenge | 0x8b6914 | `secondary` | Keep whisky-gold fill as custom override |
| MainMenu | Meta Upgrades | 0x2d6a3e | `secondary` | Keep green fill as custom override |
| MainMenu | Chronicle | 0x3a2c52 | `tertiary` | |
| MainMenu | Deeds | 0x523a2c | `tertiary` | |
| MainMenu | Options | 0x2d3e62 | `tertiary` | |
| Menu | Play | SCOTTISH_BLUE | `primary` | |
| Menu | Upgrades | 0x3a4357 | `secondary` | |
| Menu | Carousel < / > | 0x24314f | `tertiary` | |
| Shop | Buy (affordable) | SCOTTISH_BLUE | `primary` | |
| Shop | Page Nav | 0x24314f | `tertiary` | |
| Shop | Back to Menu | 0x3a4357 | `secondary` | |
| GameOver | Play Again | SCOTTISH_BLUE | `primary` | |
| GameOver | Upgrades | WHISKY_GOLD | `secondary` | Keep gold fill override |
| GameOver | Menu | 0x444444 | `secondary` | |
| Pause | Resume | SCOTTISH_BLUE | `primary` | |
| Pause | End Run | 0x444444 | `secondary` | |
| MetaShop | Back | 0x252540 | `tertiary` | Via createBackButton |
| MetaShop | Buy | Variable | `primary` (affordable) / disabled | |
| Settings | Back | 0x252540 | `tertiary` | Via createBackButton |
| Curse | Back | 0x252540 | `tertiary` | Via createBackButton |

**Important:** The MainMenu's Daily Challenge and Meta Upgrades buttons have intentionally distinct fill colors (whisky gold, green) to signal their unique nature. These should use `createGameButton` for structure (hover, click, typography) but receive a **custom fill/hover override**. Add an optional `fillOverride` and `hoverOverride` to `GameButtonOpts`.

- [ ] **Step 1: Add fill/hover override to GameButtonOpts**

In `src/ui/gameButton.ts`, extend the opts interface and factory:

```typescript
export interface GameButtonOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  tier: ButtonTier;
  fontSize?: string;
  uiScale?: number;
  /** Override tier's default fill color (e.g. whisky gold for Daily). */
  fillOverride?: number;
  /** Override tier's default hover color. */
  hoverOverride?: number;
  /** Override tier's default text color. */
  textColorOverride?: string;
}
```

In `createGameButton`, apply overrides:

```typescript
  const fill = opts.fillOverride ?? style.fill;
  const hover = opts.hoverOverride ?? style.hover;
  const textColor = opts.textColorOverride ?? style.textColor;

  const rect = scene.add
    .rectangle(opts.x, opts.y, opts.width, opts.height, fill, 1)
    .setInteractive({ useHandCursor: true });

  const label = scene.add
    .text(opts.x, opts.y, opts.label, {
      fontFamily: 'monospace',
      fontSize,
      color: textColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: style.strokeThickness,
    })
    .setOrigin(0.5);

  if (opts.uiScale !== undefined) label.setScale(opts.uiScale);
  attachButtonHoverFill(rect, fill, hover, true);
```

- [ ] **Step 2: Rewrite createBackButton to use factory**

Replace `src/scenes/createBackButton.ts`:

```typescript
import type Phaser from 'phaser';
import { createGameButton, type GameButtonResult } from '../ui/gameButton';

export interface BackButtonOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize: string;
  uiScale?: number;
}

export function createBackButton(
  scene: Phaser.Scene,
  opts: BackButtonOpts,
): Phaser.GameObjects.Rectangle {
  const { rect } = createGameButton(scene, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    label: opts.label,
    tier: 'tertiary',
    fontSize: opts.fontSize,
    uiScale: opts.uiScale,
  });
  return rect;
}
```

- [ ] **Step 3: Migrate PauseMenu buttons**

In `src/scenes/game/PauseMenu.ts`, replace the Resume and Quit button creation code. Currently they create `scene.add.rectangle` + `scene.add.text` pairs manually. Replace with:

```typescript
import { createGameButton } from '../../ui/gameButton';

// Resume button
const { rect: resumeRect, label: resumeLabel } = createGameButton(scene, {
  x: cx, y: resumeY, width: 220, height: 50,
  label: t('ui.pause.resume'), tier: 'primary',
  fontSize: '22px',
});
// wire existing pointerdown handler to resumeRect

// Quit button
const { rect: quitRect, label: quitLabel } = createGameButton(scene, {
  x: cx, y: quitY, width: 220, height: 50,
  label: t('ui.pause.quit'), tier: 'secondary',
  fontSize: '22px',
});
// wire existing pointerdown handler to quitRect
```

This also fixes the **missing click audio in PauseMenu** — the factory wires it automatically.

- [ ] **Step 4: Migrate GameOverScene buttons**

In `src/scenes/GameOverScene.ts`, replace the three action button creation blocks:

```typescript
import { createGameButton } from '../ui/gameButton';
import { COLORS } from '../config';

// Play Again — primary
const { rect: playBtn } = createGameButton(scene, {
  x: playX, y: btnY, width: 172, height: 42,
  label: t('ui.gameover.play_again'), tier: 'primary',
});

// Upgrades — secondary with gold override
const { rect: upgradeBtn } = createGameButton(scene, {
  x: upgradeX, y: btnY, width: 172, height: 42,
  label: t('ui.gameover.upgrades'), tier: 'secondary',
  fillOverride: COLORS.WHISKY_GOLD,
  hoverOverride: 0xe0b830,
  textColorOverride: '#000000',
});

// Menu — secondary
const { rect: menuBtn } = createGameButton(scene, {
  x: menuX, y: btnY, width: 172, height: 42,
  label: t('ui.gameover.menu'), tier: 'secondary',
});
```

- [ ] **Step 5: Migrate MainMenuScene buttons**

Replace the Start Run, New Run, Daily Challenge, Meta Upgrades, Chronicle, Deeds, and Options button creation blocks. Each follows the same pattern as above. Use tier mapping from the table.

For Daily Challenge (custom whisky-gold fill):
```typescript
const { rect: dailyBtn } = createGameButton(scene, {
  x, y, width: 240, height: 48,
  label: dailyLabel, tier: 'secondary',
  fillOverride: 0x8b6914,
  hoverOverride: 0xa87e1a,
});
```

For Meta Upgrades (custom green fill):
```typescript
const { rect: metaBtn } = createGameButton(scene, {
  x, y, width: 240, height: 48,
  label: t('ui.main.meta_upgrades'), tier: 'secondary',
  fillOverride: 0x2d6a3e,
  hoverOverride: 0x3a8f4f,
});
```

- [ ] **Step 6: Migrate MenuScene buttons (Play, Upgrades, Carousel)**

Replace Play (primary), Upgrades (secondary), and carousel left/right (tertiary) buttons. Remove the per-button scale-on-hover — the factory handles hover via fill change only (consistent with all other scenes).

- [ ] **Step 7: Migrate ShopScene buttons**

Replace Buy buttons (primary when affordable, disabled when not), Page Nav (tertiary), Back (secondary). Keep the existing disabled-state logic but use the factory for the enabled state.

- [ ] **Step 8: Migrate MetaShopScene, SettingsScene, CurseScene buttons**

These already use `createBackButton` (which is now updated), so only the scene-specific buttons need migration. MetaShop buy buttons → primary. Settings reset → secondary. Curse tiles keep their per-curse accent colors via `fillOverride`.

- [ ] **Step 9: Remove now-unused palette modules**

Delete or reduce:
- `src/scenes/mainMenuButtonPalettes.ts` — palettes now live in `gameButton.ts` or as overrides
- `src/scenes/backButtonPalette.ts` — replaced by tertiary tier
- `src/scenes/game/pauseMenuStyle.ts` — button palette portion replaced (keep title style)

Only delete if zero remaining imports. Run `npm run build` to verify.

- [ ] **Step 10: Run full CI gate**

Run: `npm run ci`
Expected: Lint + tests + build all pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor(ui): migrate all scene buttons to unified gameButton factory

Replaces 12+ ad-hoc button styles with 3-tier system. Every button
now has consistent fill, hover, click audio, and typography. Custom
fills preserved for Daily (whisky gold) and Meta (green) via overrides."
```

---

### Task 6: Migrate Scene Text to Typography System

**Files:**
- Modify: All scene files listed above + `src/ui/HUD.ts`, `src/scenes/game/FloatTextPool.ts`
- Modify: `src/scenes/sceneHeaderStyle.ts` — rewrite to delegate to typography system

**Strategy:** Migrate incrementally — scene headers first (they already use a shared helper), then HUD, then remaining scenes.

- [ ] **Step 1: Rewrite sceneHeaderStyle to use typography system**

Replace `src/scenes/sceneHeaderStyle.ts`:

```typescript
import { textStyle, type GameTextStyle } from '../ui/typography';

export type SceneHeaderTextStyle = GameTextStyle;
export type SceneSubtitleTextStyle = GameTextStyle;

export function sceneHeaderTextStyle(
  fontSize: string,
  color: string,
): SceneHeaderTextStyle {
  return textStyle('title', { color, fontSize });
}

export function sceneSubtitleTextStyle(
  color: string,
  sceneWidth: number,
): SceneSubtitleTextStyle {
  return textStyle('subtitle', {
    color,
    align: 'center',
    wordWrap: { width: sceneWidth - 60 },
  });
}
```

This keeps the existing API so all callers continue working without changes, but the implementation now delegates to the typography system.

- [ ] **Step 2: Update FloatTextPool to use typography system**

In `src/scenes/game/FloatTextPool.ts`, replace the inline style in `init()`:

```typescript
import { textStyle } from '../../ui/typography';
import { COLORS_CSS } from '../../config';

// In init():
const style = textStyle('body', { color: COLORS_CSS.WHITE });
```

- [ ] **Step 3: Migrate HUD text styles**

In `src/ui/HUD.ts`, replace inline style objects with `textStyle()` calls:
- Timer (28px) → `textStyle('heading', { fontSize: '28px', color: ... })`
- HP/Level labels (18px) → `textStyle('body', { color: ... })`
- Weapon pips (11px) → `textStyle('small', { color: ... })`
- Passive pills (12px) → `textStyle('label', { color: ... })`

- [ ] **Step 4: Migrate MainMenuScene title**

Replace the 48-56px title style with `textStyle('display', { color: ... })`.

- [ ] **Step 5: Migrate remaining scene titles and text**

For each scene that creates ad-hoc text styles (ChronicleScene, DeedsScene, ShopScene, MetaShopScene, GameOverScene, PauseMenu, ActIntermissionScene), replace inline style objects with appropriate `textStyle(role)` calls:
- Scene titles → `textStyle('title', ...)`
- Section headers → `textStyle('heading', ...)`
- Body text → `textStyle('body', ...)`
- Labels → `textStyle('label', ...)`
- Pagination → `textStyle('small', ...)`

- [ ] **Step 6: Run full CI gate**

Run: `npm run ci`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ui): migrate all scene text to typography scale system

Replaces ~40 ad-hoc inline styles with 7-role typography scale.
Scene headers, HUD, float text, and all labels now share a single
font-size hierarchy."
```

---

## Phase B: Visual Continuity

### Task 7: Variant-Aware Kilt Palette System

**Files:**
- Create: `src/art/kiltPalette.ts`
- Test: `src/art/kiltPalette.test.ts`

The player kilt is hardcoded Red Royal Stewart regardless of variant. The postcard tartan system already maps variants to color palettes (`VARIANT_PALETTES` in `src/utils/tartan.ts`). This task creates a kilt-specific palette derivation that converts a variant's tartan colors into the 4 colors the kilt drawer needs: `red` (main field), `redDark` (shadow/pleat), `green` (warp/weft stripes), `accent` (pinstripes).

**Design:** The kilt palette maps `primary` → main field, `base` darkened → shadow, a calculated complement → stripe, and the variant's accent color → pinstripe. This preserves the tartan structure while giving each variant a distinct kilt.

- [ ] **Step 1: Write tests**

Create `src/art/kiltPalette.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveKiltPalette, type KiltPalette } from './kiltPalette';

describe('resolveKiltPalette', () => {
  it('classic variant produces warm red field', () => {
    const p = resolveKiltPalette('classic');
    expect(p.field).toBe(0xa84828);     // rust from VARIANT_PALETTES
  });

  it('laird variant produces blue field', () => {
    const p = resolveKiltPalette('laird');
    expect(p.field).toBe(0x2e6aa8);     // royal blue
  });

  it('glaswegian variant produces orange field', () => {
    const p = resolveKiltPalette('glaswegian');
    expect(p.field).toBe(0xff5a00);     // tram orange
  });

  it('all variants produce 4 distinct colors', () => {
    const variants = [
      'classic', 'iron_belly', 'moor_runner', 'glen_forager',
      'surefoot', 'pipe_breath', 'laird', 'wee_ghostie', 'glaswegian',
    ] as const;
    for (const v of variants) {
      const p = resolveKiltPalette(v);
      const colors = [p.field, p.fieldDark, p.stripe, p.accent];
      // All defined
      for (const c of colors) expect(c).toBeGreaterThan(0);
      // field and fieldDark are different
      expect(p.field).not.toBe(p.fieldDark);
    }
  });

  it('unknown variant falls back to classic', () => {
    const p = resolveKiltPalette('unknown_key' as any);
    const classic = resolveKiltPalette('classic');
    expect(p.field).toBe(classic.field);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/art/kiltPalette.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement kilt palette derivation**

Create `src/art/kiltPalette.ts`:

```typescript
/**
 * Variant-aware kilt color palette — derives the 4 kilt drawing colors
 * from the tartan VARIANT_PALETTES so each haggis variant wears a
 * distinct tartan. Consumed by the kilt AccessoryDrawer and the kilt
 * upgrade card icon.
 *
 * The mapping:
 *   variant.primary → field (main kilt color)
 *   variant.base darkened → fieldDark (pleats / shadow)
 *   computed complement → stripe (warp/weft bars)
 *   variant accent → accent (pinstripes)
 */
import type { VariantKey } from '../data/variants';

export interface KiltPalette {
  /** Main kilt field color (was KILT_RED). */
  field: number;
  /** Darker shade for pleat shadows (was KILT_RED_DARK). */
  fieldDark: number;
  /** Warp/weft stripe color (was KILT_GREEN). */
  stripe: number;
  /** Pinstripe accent (was KILT_YELLOW). */
  accent: number;
}

/**
 * Variant → kilt palette. Hand-tuned per variant to ensure each kilt
 * reads clearly at small sprite scale. The field color comes from
 * VARIANT_PALETTES.primary; stripe and accent are chosen to
 * complement it.
 */
const KILT_PALETTES: Record<VariantKey, KiltPalette> = {
  classic:      { field: 0xa84828, fieldDark: 0x6b2a14, stripe: 0x244a2a, accent: 0xd4a017 },
  iron_belly:   { field: 0x3d6a4b, fieldDark: 0x1f3a28, stripe: 0x2a4a5a, accent: 0x88bb66 },
  moor_runner:  { field: 0xc0382b, fieldDark: 0x6b1010, stripe: 0x244a2a, accent: 0xffcc44 },
  glen_forager: { field: 0xb58a2b, fieldDark: 0x6a4a10, stripe: 0x3a5a2a, accent: 0xffe08a },
  surefoot:     { field: 0x5a6170, fieldDark: 0x2a3040, stripe: 0x4a5a6a, accent: 0xa8b8c8 },
  pipe_breath:  { field: 0x7a6ac0, fieldDark: 0x3a2a60, stripe: 0x4a3a6a, accent: 0xccaaff },
  laird:        { field: 0x2e6aa8, fieldDark: 0x1a3a5a, stripe: 0x4a6a8a, accent: 0x88ccff },
  wee_ghostie:  { field: 0x9dabc2, fieldDark: 0x5a6878, stripe: 0x6a7a8a, accent: 0xd8e8f8 },
  glaswegian:   { field: 0xff5a00, fieldDark: 0x8a2a00, stripe: 0x1a2028, accent: 0xffaa44 },
};

const FALLBACK: KiltPalette = KILT_PALETTES.classic;

export function resolveKiltPalette(variantKey: string): KiltPalette {
  return KILT_PALETTES[variantKey as VariantKey] ?? FALLBACK;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/art/kiltPalette.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/art/kiltPalette.ts src/art/kiltPalette.test.ts
git commit -m "feat(art): variant-aware kilt palette — 9 hand-tuned tartans"
```

---

### Task 8: Update Kilt Drawer + Card Icon to Use Variant Palette

**Files:**
- Modify: `src/entities/haggisComposition/drawers/kilt.ts`
- Modify: `src/art/sprites/icons/cards.ts`
- Modify: `src/entities/haggisComposition/AccessoryDrawer.ts` (if ctx needs variant)

The kilt drawer currently uses hardcoded KILT_RED / KILT_GREEN / KILT_YELLOW. This task threads the variant key through the drawing context so the kilt uses the correct variant-specific palette.

- [ ] **Step 1: Thread variantKey through AccessoryDrawCtx**

Check `src/entities/haggisComposition/AccessoryDrawer.ts` — the `AccessoryDrawCtx` interface needs a `variantKey` field if it doesn't have one. Add:

```typescript
export interface AccessoryDrawCtx {
  state: string;
  frame: number;
  /** Haggis variant key — used by kilt drawer for tartan colors. */
  variantKey: string;
}
```

Ensure the call site that constructs `AccessoryDrawCtx` passes the variant key from `HaggisContainer.variantKey`.

- [ ] **Step 2: Update kilt drawer to use variant palette**

In `src/entities/haggisComposition/drawers/kilt.ts`:

1. Remove the hardcoded color constants (lines 30-33):
```typescript
// DELETE:
// const KILT_RED = 0x9a1f1f;
// const KILT_RED_DARK = 0x6b1010;
// const KILT_GREEN = 0x244a2a;
// const KILT_YELLOW = PALETTE.gold.bright;
```

2. Import the palette resolver:
```typescript
import { resolveKiltPalette, type KiltPalette } from '../../../art/kiltPalette';
```

3. Add palette parameter to drawKilt:
```typescript
function drawKilt(g: Phaser.GameObjects.Graphics, frame: KiltFrame, palette: KiltPalette): void {
  const cx = CX + (frame.x ?? 0);
  const cy = BASE_CY + frame.y;

  g.fillStyle(palette.fieldDark, 1);
  g.fillRect(cx - 15, cy - 5, 30, 10);
  g.fillStyle(palette.field, 1);
  g.fillRect(cx - 14, cy - 5, 28, 9);

  // Warp stripes
  g.fillStyle(palette.stripe, 0.85);
  g.fillRect(cx - 11, cy - 5, 2, 9);
  g.fillRect(cx - 3, cy - 5, 2, 9);
  g.fillRect(cx + 5, cy - 5, 2, 9);
  g.fillRect(cx + 11, cy - 5, 1, 9);

  // Weft stripes
  g.fillStyle(palette.stripe, 0.7);
  g.fillRect(cx - 14, cy - 3, 28, 1);
  g.fillRect(cx - 14, cy + 1, 28, 1);

  // Pinstripes
  g.fillStyle(palette.accent, 0.9);
  g.fillRect(cx - 9, cy - 5, 1, 9);
  g.fillRect(cx - 1, cy - 5, 1, 9);
  g.fillRect(cx + 7, cy - 5, 1, 9);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(cx - 14, cy, 28, 1);

  // Pleats
  g.fillStyle(palette.fieldDark, 1);
  const pleatY = cy + 4;
  for (let i = -14; i <= 14; i += 4) {
    g.fillTriangle(cx + i, pleatY, cx + i + 2, pleatY + 4, cx + i + 4, pleatY);
  }

  // Waistband
  g.fillStyle(0x1a0505, 1);
  g.fillRect(cx - 15, cy - 6, 30, 2);
  g.fillStyle(PALETTE.gold.aged, 0.85);
  g.fillRect(cx - 14, cy - 5, 28, 1);

  // Belt buckle
  g.fillStyle(PALETTE.gold.bright, 1);
  g.fillRect(cx - 2, cy - 6, 4, 3);
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - 1, cy - 5, 2, 1);
}
```

4. Update all frame functions to thread palette:
```typescript
function drawKiltIdle0(g: Phaser.GameObjects.Graphics, p: KiltPalette): void {
  drawKilt(g, { y: 0 }, p);
}
// ... repeat for all 17 frame functions
```

5. Update the KILT_DRAWER.draw method:
```typescript
export const KILT_DRAWER: AccessoryDrawer = {
  id: 'kilt',
  layer: 'body',
  authoredStates: ['idle', 'walking', 'attacking', 'hurt', 'celebrating', 'dying'] as const,
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void {
    const palette = resolveKiltPalette(ctx.variantKey);
    const drawers = FRAMES[ctx.state as AuthoredState];
    if (!drawers) {
      FRAMES.idle[0](g, palette);
      return;
    }
    const drawer = drawers[ctx.frame];
    if (!drawer) {
      throw new Error(`kilt: frame ${ctx.frame} out of range for state ${ctx.state}`);
    }
    drawer(g, palette);
  },
};
```

- [ ] **Step 3: Update kilt card icon to use variant palette**

In `src/art/sprites/icons/cards.ts`, the `drawKilt` function (line 205) currently uses hardcoded blue tartan colors. Update it to accept a variant key and use the kilt palette:

```typescript
import { resolveKiltPalette } from '../../art/kiltPalette';

/**
 * Draw kilt upgrade card icon using the active variant's tartan.
 * Falls back to classic if no variant provided.
 */
function drawKilt(scene: Phaser.Scene, variantKey: string = 'classic'): void {
  const s = 32, g = scene.add.graphics();
  const palette = resolveKiltPalette(variantKey);
  cardIconBg(g, s, darkenHex(palette.field, 0.4));
  const cx = 16;

  // Main field
  g.fillStyle(darkenHex(palette.field, 0.6), 1);
  g.fillRect(cx - 10, 8, 20, 18);
  g.fillStyle(palette.field, 1);
  g.fillRect(cx - 9, 9, 18, 16);

  // Vertical stripes (warp)
  g.fillStyle(palette.stripe, 0.7);
  g.fillRect(cx - 6, 9, 2, 16);
  g.fillRect(cx + 1, 9, 2, 16);
  g.fillRect(cx + 6, 9, 2, 16);

  // Horizontal stripes (weft)
  g.fillStyle(palette.stripe, 0.5);
  g.fillRect(cx - 9, 12, 18, 1);
  g.fillRect(cx - 9, 17, 18, 1);
  g.fillRect(cx - 9, 22, 18, 1);

  // Accent stripes
  g.fillStyle(palette.accent, 0.6);
  g.fillRect(cx - 9, 14, 18, 1);
  g.fillRect(cx - 9, 20, 18, 1);
  g.fillRect(cx - 2, 9, 1, 16);

  // Shadow lines
  g.fillStyle(palette.fieldDark, 0.4);
  g.fillRect(cx - 4, 9, 1, 16);
  g.fillRect(cx + 4, 9, 1, 16);

  // Waistband
  g.fillStyle(0x2a1a0a, 1);
  g.fillRect(cx - 10, 7, 20, 3);
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx - 9, 8, 18, 1);

  // Belt buckle
  g.fillStyle(0xccaa44, 1);
  g.fillRect(cx - 2, 7, 4, 3);
  g.fillStyle(0xffdd66, 1);
  g.fillRect(cx - 1, 8, 2, 1);

  g.generateTexture('ucard_kilt', s, s);
  g.destroy();
}

/** Darken a hex color by a factor (0-1, lower = darker). */
function darkenHex(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
```

Update the call site in BootScene/cards baking to pass the current variant key. If the card is baked once at boot (before variant is known), bake with 'classic' and re-bake when a run starts with a specific variant. Alternatively, bake all 9 variant kilt textures at boot as `ucard_kilt_classic`, `ucard_kilt_laird`, etc.

- [ ] **Step 4: Bake per-variant kilt card textures at boot**

In the cards baking section of BootScene, loop over variant keys:

```typescript
import { VARIANT_KEYS } from '../data/variants';

for (const vk of VARIANT_KEYS) {
  drawKilt(this, vk);  // generates 'ucard_kilt_<vk>'
}
// Keep a default 'ucard_kilt' pointing to 'classic' for backwards compat
drawKilt(this, 'classic');
```

Update `drawKilt` to generate texture key `ucard_kilt_${variantKey}` (and `ucard_kilt` when variantKey is `'classic'`).

- [ ] **Step 5: Update UpgradeCards to use variant-specific kilt icon**

Where the level-up card UI renders the kilt upgrade icon, look up the active variant key and use `ucard_kilt_${variantKey}` instead of `ucard_kilt`.

- [ ] **Step 6: Run build + tests**

Run: `npm run build && npm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(art): variant-aware kilts — each haggis wears its own tartan

Kilt drawer + card icon now derive colors from the selected variant's
palette. Classic = rust/green, Laird = royal blue, Glaswegian = tram
orange, etc. Card textures baked per-variant at boot."
```

---

### Task 9: Standardise Enemy Shadows

**Files:**
- Modify: 9 enemy sprite files (remove inline shadows)
- Verify: `src/entities/Enemy.ts` (runtime shadow application)

9 of 30 enemies have bespoke inline shadows (pure black ellipses baked into the texture). The other 21 rely on the runtime `entity_shadow` (warm green-tinted, layered penumbra). This inconsistency means some enemies appear to have two shadows (inline + runtime). Fix: remove all inline shadows so every enemy uses the runtime system uniformly.

- [ ] **Step 1: Remove inline shadow from angryScotsman.ts**

In `src/art/sprites/enemies/angryScotsman.ts`, delete lines 201-203:
```typescript
// DELETE:
// g.fillStyle(0x000000, 0.25);
// g.fillEllipse(cx, cy + 23, 14, 3);
```
Also delete any `// Shadow under the figure` comment above it.

- [ ] **Step 2: Remove inline shadow from barghest.ts**

Delete the shadow block (lines ~21-22):
```typescript
// DELETE: g.fillStyle(0x000000, 0.35); g.fillEllipse(cx, cy + 15, 26, 5);
```

- [ ] **Step 3: Remove inline shadow from buckfastNed.ts**

Delete shadow block (lines ~95-96).

- [ ] **Step 4: Remove inline shadow from haggisHunter.ts**

Delete shadow block (lines ~27-28).

- [ ] **Step 5: Remove inline shadow from nest.ts**

Delete BOTH shadow instances:
- Ground shadow (lines ~19-20)
- Egg shadow (lines ~86-87) — keep this one only if it's a shadow ON the nest (part of the art), not a ground shadow

- [ ] **Step 6: Remove inline shadow from redcap.ts**

Delete shadow block (lines ~28-29).

- [ ] **Step 7: Remove inline shadow from sheep.ts**

Delete shadow block (lines ~27-28).

- [ ] **Step 8: Remove inline shadow from tourist.ts**

Delete shadow block (lines ~28-29).

- [ ] **Step 9: Remove inline shadow from trafficConeTotem.ts**

Delete shadow block (lines ~21-22). Note: this had 0.7 alpha (very dark) — the runtime shadow will be softer, which is more consistent.

- [ ] **Step 10: Verify runtime shadow covers all enemies**

In `src/entities/Enemy.ts`, confirm the shadow creation in `spawn()` applies to all non-hazard enemies. Check that no enemy type bypasses the shadow system.

Run: `npm run build`

- [ ] **Step 11: Commit**

```bash
git add src/art/sprites/enemies/*.ts
git commit -m "fix(art): remove inline enemy shadows — standardise on runtime entity_shadow

9 enemies had bespoke pure-black ellipses baked into sprite textures
while 21 others relied on the warm green-tinted runtime shadow. Now
all 30 use the same layered penumbra shadow applied at runtime."
```

---

### Task 10: Sprite Outline Post-Process

**Files:**
- Create: `src/art/outlinePostProcess.ts`
- Modify: `src/scenes/BootScene.ts` — integrate outline step into bake pipeline
- Test: `src/art/outlinePostProcess.test.ts`

Design doc specifies "chunky 1-2px dark borders" but ~80% of sprites have none. Rather than editing 30+ sprite drawers individually, add a post-process step in the baking pipeline that stamps a 1px dark outline around each sprite texture.

**Approach:** After each sprite is drawn to a Graphics context and baked to a temp texture, use Phaser's `RenderTexture` to:
1. Stamp the temp texture at 8 directional offsets (±1px) with dark tint
2. Stamp the original texture on top (centered)
3. Save the composite as the final texture

This gives every sprite a uniform 1px dark border without touching individual drawers.

- [ ] **Step 1: Write the outline utility**

Create `src/art/outlinePostProcess.ts`:

```typescript
/**
 * Post-process outline — stamps a 1px dark border around any baked
 * sprite texture. Works by drawing the source at 8 cardinal offsets
 * with a dark tint, then drawing the original on top.
 *
 * Used in BootScene's bake pipeline to give all entities the "chunky
 * borders" specified in DESIGN_SOUL.md without editing individual
 * sprite drawers.
 */
import type Phaser from 'phaser';

/** 8-direction offsets for 1px outline. */
const OFFSETS: ReadonlyArray<[number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
];

/** Outline tint — very dark green-black to match moor palette. */
const OUTLINE_TINT = 0x0a1408;

/**
 * Apply a 1px dark outline to an existing texture and replace it.
 *
 * @param scene - Active Phaser scene (for creating temp objects)
 * @param textureKey - Key of the texture to outline
 * @param size - Width/height of the square texture
 */
export function applyOutline(
  scene: Phaser.Scene,
  textureKey: string,
  size: number,
): void {
  // Padded size for the outline
  const padded = size + 2;

  const rt = scene.add.renderTexture(0, 0, padded, padded).setVisible(false);

  // Stamp dark outlines at 8 offsets
  for (const [dx, dy] of OFFSETS) {
    rt.drawFrame(textureKey, undefined, 1 + dx, 1 + dy, 1, OUTLINE_TINT);
  }

  // Stamp original on top (centered at +1,+1 to account for padding)
  rt.drawFrame(textureKey, undefined, 1, 1);

  // Replace the original texture
  rt.saveTexture(textureKey);
  rt.destroy();
}
```

**Note:** The `drawFrame` tint parameter may need adjustment depending on Phaser 3.90's RenderTexture API. The `tint` argument applies a color multiplication. If the API doesn't support tint on `drawFrame`, use an intermediate `Image` with `setTintFill(OUTLINE_TINT)` and `draw()` that image instead.

- [ ] **Step 2: Integrate into BootScene bake pipeline**

In `src/scenes/BootScene.ts`, after each enemy texture is generated in `bakeEnemyAtlas()`, apply the outline:

```typescript
import { applyOutline } from '../art/outlinePostProcess';

// In the bake loop, after g.generateTexture(key, size, size):
g.generateTexture(key, size, size);
g.destroy();
applyOutline(this, key, size);
```

Apply to:
- Enemy textures
- Boss textures
- Player haggis textures
- Projectile textures

Do NOT apply to:
- `entity_shadow` (it's a soft glow, not an entity)
- HUD icons (they have their own styling)
- UI elements
- Pickup textures (XP gems and health orbs have their own glow which would fight with outlines)

- [ ] **Step 3: Test visually**

Run: `npm run dev`
Open browser, start a run. Verify:
- Enemies have a subtle dark border visible at gameplay scale
- Player haggis has a matching border
- Projectiles have borders
- No visual artifacts (double borders, clipped edges)
- Performance is acceptable (outline adds ~30 RenderTexture operations at boot)

- [ ] **Step 4: Adjust outline if needed**

If 1px outline is too subtle at gameplay scale, increase to 2px (add 16-direction offsets: the 8 above plus 8 at distance 2). If too strong, reduce tint alpha.

If the canvas size needs to increase by 2px to accommodate the outline, update the sprite `canvasSize` accordingly. However, since most sprites have transparent padding around the art, the 1px outline should fit within existing canvas dimensions.

- [ ] **Step 5: Run build + tests**

Run: `npm run build && npm test`
Expected: All pass. The outline is purely visual — no logic changes.

- [ ] **Step 6: Commit**

```bash
git add src/art/outlinePostProcess.ts src/scenes/BootScene.ts
git commit -m "feat(art): 1px dark outline post-process on all entity sprites

Applies uniform 'chunky border' to enemies, bosses, player, and
projectiles via RenderTexture stamp at 8 offsets. Matches
DESIGN_SOUL.md spec without modifying individual sprite drawers."
```

---

## Phase C: Audio Polish

### Task 11: Rebalance Music vs SFX Default Gains

**Files:**
- Modify: `src/systems/music/ProceduralMusicEngine.ts`
- Modify: `src/systems/AudioSystem.ts`

At default settings, music effective volume (0.0625) is lower than SFX (0.09). Music should sit above SFX as the bed. Also, `playShoot()` at 0.06 gain is too quiet relative to other SFX (4x quieter than `playPlayerHit()` at 0.25).

- [ ] **Step 1: Raise music base gain**

In `src/systems/music/ProceduralMusicEngine.ts`, find the master gain initialization (currently `0.25`):

```typescript
// Change from:
this.masterGain.gain.value = this.enabled ? 0.25 * this.userMusicVolume : 0;
// To:
this.masterGain.gain.value = this.enabled ? 0.35 * this.userMusicVolume : 0;
```

Also update the dynamic volume base in `update()`:
```typescript
// Change from:
// Base: 0.20 + mood.intensity * 0.10
// To:
// Base: 0.28 + mood.intensity * 0.12
```

Update the `setEnabled` ramp target similarly.

This brings music effective volume from ~0.0625 to ~0.105 at default user volume (0.3), putting it above SFX baseline.

- [ ] **Step 2: Boost quiet SFX**

In `src/systems/AudioSystem.ts`:

| SFX Method | Current Gain | New Gain | Rationale |
|------------|-------------|----------|-----------|
| `playShootImmediate()` | 0.06 | 0.10 | Too quiet in chaos |
| `playBurnLeap()` | 0.06 | 0.10 | Same issue |
| `playXPCollectImmediate()` | 0.08 | 0.10 | Slightly too quiet |
| `playEchoTouch()` | 0.09 | 0.11 | Slightly too quiet |

Leave `playPlayerHit()` (0.25) and `playBossWarning()` (0.25 peak) at current levels — they're intentionally loud for danger feedback.

- [ ] **Step 3: Test audio balance**

Run: `npm run dev`
Play through a run with both music and SFX enabled at default volumes. Verify:
- Music is audible as a bed underneath gameplay
- Shoot SFX is clearly audible during combat
- Player hit still cuts through as a spike
- No clipping from the compressor (listen for pumping artifacts)

- [ ] **Step 4: Commit**

```bash
git add src/systems/music/ProceduralMusicEngine.ts src/systems/AudioSystem.ts
git commit -m "fix(audio): rebalance music/SFX — raise music base gain, boost quiet SFX

Music was quieter than SFX at default settings (inverted hierarchy).
Raised music master from 0.25 to 0.35. Boosted shoot/burn/xp SFX
from 0.06-0.08 to 0.10-0.11 so they cut through during chaos."
```

---

### Task 12: Add Missing UI Audio Feedback

**Files:**
- Modify: `src/scenes/game/PauseMenu.ts` — add click sounds
- Modify: `src/systems/AudioSystem.ts` — add `playBoonSelect()` SFX

The PauseMenu has 4 interactive elements (Resume, Quit, SFX toggle, Music toggle) with **zero click audio**. Every other menu scene calls `playClick()`. Additionally, selecting a boon/passive in the level-up flow has no audio confirmation distinct from the card reveal sound.

- [ ] **Step 1: PauseMenu click sounds (already fixed by Task 5)**

If Task 5 (button migration) has been completed, PauseMenu buttons already have click audio via the factory. Verify this is the case.

If PauseMenu SFX/Music toggle buttons were NOT migrated to the factory (they're text-only, not rectangles), add `playClick()` to their pointerdown handlers manually:

```typescript
import { audio } from '../../systems/AudioSystem';

// In SFX toggle pointerdown:
audio.playClick();

// In Music toggle pointerdown:
audio.playClick();
```

- [ ] **Step 2: Add boon selection SFX**

In `src/systems/AudioSystem.ts`, add a new method for boon/passive selection — a warm confirmation tone that's distinct from the existing `playClick()` (which is 700Hz sine, very short):

```typescript
/**
 * Warm confirmation tone for selecting a passive/boon in the level-up
 * flow. Two-note ascending sine (D5→A5) with soft attack, 200ms total.
 * Ducks music gently (0.06).
 */
playBoonSelect(): void {
  if (!this.canPlay()) return;
  const ctx = this.ctx();
  const now = ctx.currentTime;
  const gain = this.createGainNode(0.14);

  // D5
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(587.3, now);
  o1.connect(gain);
  o1.start(now);
  o1.stop(now + 0.1);

  // A5 (delayed 80ms)
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(880, now + 0.08);
  o2.connect(gain);
  o2.start(now + 0.08);
  o2.stop(now + 0.2);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  this.notifyMusicDuck(0.06);
}
```

- [ ] **Step 3: Wire boon selection SFX to level-up flow**

In the level-up card selection handler (likely `src/scenes/game/LevelUpFlow.ts` or `src/ui/UpgradeCards.ts`), when a passive/boon card is selected (not a weapon), call:

```typescript
audio.playBoonSelect();
```

Keep `playClick()` for weapon selections — they already have audio.

- [ ] **Step 4: Test audio**

Run: `npm run dev`
- Pause the game → Resume / Quit should click
- Level up → select a passive card → hear warm confirmation tone
- Verify tone is distinct from `playClick()`

- [ ] **Step 5: Commit**

```bash
git add src/systems/AudioSystem.ts src/scenes/game/PauseMenu.ts src/scenes/game/LevelUpFlow.ts
git commit -m "feat(audio): add missing UI feedback — pause clicks + boon selection tone

PauseMenu now plays click on all buttons (via factory or explicit).
New playBoonSelect() SFX: ascending D5→A5 sine for passive/boon
selection in level-up flow."
```

---

## Verification

After all tasks are complete:

- [ ] **Run full CI gate:** `npm run ci`
- [ ] **Run E2E tests:** `npm run ci:all` (after `npx playwright install`)
- [ ] **Manual playtest checklist:**
  - [ ] Main menu → all buttons have consistent styling, click audio, hover feedback
  - [ ] Start run with each variant → kilt matches variant's tartan colors
  - [ ] Level-up → kilt card icon matches current variant's tartan
  - [ ] All enemies have uniform runtime shadows (no double shadows)
  - [ ] All entity sprites have subtle dark outline visible at gameplay scale
  - [ ] Music sits above SFX as ambient bed
  - [ ] Shoot SFX audible during intense combat
  - [ ] Pause menu buttons all click
  - [ ] Boon selection has distinct confirmation tone
  - [ ] Typography consistent: scene headers all same size, body text all same size
  - [ ] No hardcoded `#ffdd88`, `#ff4444`, `#ddaa00` in codebase (grep to verify)
