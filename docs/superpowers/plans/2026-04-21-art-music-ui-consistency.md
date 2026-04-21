# Art / Music / UI Consistency Pass — Implementation Plan

> **Shipped 2026-04-21** — verified 2026-04-22 against repo state. Checkboxes below remain unticked because superpowers:subagent-driven-development commits code without editing plan files. File retained in-tree as scope-vs-shipped record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify every visual, audio, and interaction element so the game feels handcrafted by one person — zero ad-hoc colors, zero orphan patterns, zero silent interactions.

**Architecture:** Three layers — (1) design tokens in config.ts as the single source of truth, (2) art/sprite fixes for outline and color consistency, (3) audio and UX fixes for missing SFX, volume bugs, and tween leaks. All scenes and UI components converge on shared constants.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

**Spec:** `docs/superpowers/specs/2026-04-21-art-music-ui-consistency-design.md`

---

## File Map

| File | Responsibility | Action |
|------|---------------|--------|
| `src/config.ts` | Color palette & UI constants | Add PANEL, PANEL_SURFACE, OVERLAY_ALPHA, text color CSS constants |
| `src/scenes/sceneFade.ts` | Scene transition timing | Add SCENE_FADE_OUT_MS constant |
| `src/scenes/sceneHeaderStyle.ts` | Scene title factory | Remove fontSize param, always use typography 'title' role |
| `src/scenes/BootScene.ts` | Texture generation | Add applyOutline to accessory atlas bake |
| `src/entities/haggisComposition/drawers/kilt.ts` | Kilt drawing | Palette-aware waistband color |
| `src/utils/brightenColor.ts` | Color utilities | Add darkenColor export |
| `src/art/sprites/icons/weapons.ts` | Weapon card icons | Fix thistle icon purple palette |
| `src/systems/AudioSystem.ts` | SFX engine | Fix wind gain, XP gain, add bossEnrage/eliteChain SFX, remove orphan |
| `src/ui/UpgradeCards.ts` | Level-up card overlay | Add reroll click, fix overlay alpha, fix sparkle stagger |
| `src/ui/HUD.ts` | In-game HUD | Normalize font sizes to typography roles |
| `src/scenes/MenuScene.ts` | Loadout picker | Fix title size, carousel colors, variant badge, tween leak |
| `src/scenes/ShopScene.ts` | Shop scene | Fix title size, buy button hover, panel color |
| `src/scenes/MetaShopScene.ts` | Meta shop | Fix title size |
| `src/scenes/CurseScene.ts` | Curse picker | Fix header size, buttons to factory, textStyle() |
| `src/scenes/ActIntermissionScene.ts` | Route picker | Fix overlay alpha, panel color, textStyle() |
| `src/scenes/GameOverScene.ts` | Death/victory screen | Fix overlay alpha, panel color, title size |
| `src/scenes/game/PauseMenu.ts` | Pause overlay | Fix overlay alpha |
| `src/scenes/game/wireSceneEventBus.ts` | Event bus wiring | Wire bossEnrage SFX |
| `src/scenes/game/EnemyKillHandler.ts` | Kill handling | Wire eliteChain SFX |
| `src/scenes/installShopBackdrop.ts` | Shop backdrop | Update panel color to COLORS.PANEL |

---

## Dependencies

```
Task 1 (design tokens) ──► Task 2 (panels & overlays)
                       ──► Task 3 (buttons)
                       ──► Task 4 (typography)

Tasks 5, 6, 7 (art fixes) — independent of all others
Tasks 8, 9 (audio, tweens) — independent of all others
Task 10 (verification) — after all others
```

Tasks 2, 3, 4, 5, 6, 7, 8, 9 can run in parallel once Task 1 is complete.

---

### Task 1: Design Tokens

**Files:**
- Modify: `src/config.ts:81-148`
- Modify: `src/scenes/sceneFade.ts:15-18`

- [ ] **Step 1: Add panel and overlay constants to config.ts**

In `src/config.ts`, after `BG_DARK: 0x1a1a2e,` (line 101), add:

```ts
  /** Primary panel/container background — menus, overlays, card
   *  backdrops. Unifies the 8 ad-hoc dark-navy values that drifted
   *  across scenes. */
  PANEL: 0x111728,
  /** Secondary surface — card interiors, list rows, tile fills.
   *  Slightly lighter than PANEL for layered depth. */
  PANEL_SURFACE: 0x1a1a28,
```

At the end of `COLORS` (before `} as const;` at line 118), add:

```ts
  /** Full-screen overlay dimming — level-up, pause, death, act
   *  intermission. One value for every overlay in the game. */
  OVERLAY_DIM: 0x000000,
```

After the `COLORS` block, add a UI constants object:

```ts
export const UI = {
  /** Overlay backdrop alpha — all full-screen dimming overlays. */
  OVERLAY_ALPHA: 0.82,
  /** High-contrast overlay alpha. */
  OVERLAY_ALPHA_HC: 0.92,
} as const;
```

- [ ] **Step 2: Add text color CSS constants**

In `src/config.ts`, inside `COLORS_CSS` (after `LEGENDARY: '#ddaa00',` at line 147), add:

```ts
  /** Warm tan — tertiary button text, HUD secondary info, card body. */
  WARM_TAN: '#e8d4a0',
  /** Dusty tan — subdued body text, stats, descriptions. */
  DUSTY_TAN: '#b8a88a',
  /** Hint grey — de-emphasized labels, placeholders. */
  HINT: '#6a7390',
  /** Cool grey — neutral body text on dark panels. */
  COOL_GREY: '#c8d0e0',
```

- [ ] **Step 3: Add scene fade-out constant**

In `src/scenes/sceneFade.ts`, after `export const SCENE_FADE_DEPTH = 999;` (line 18), add:

```ts
/** Standard fade-out duration — every scene exit uses this. */
export const SCENE_FADE_OUT_MS = 360;
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Clean build, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/scenes/sceneFade.ts
git commit -m "feat(ui): add unified design tokens — panel colors, overlay alpha, text palette, fade timing"
```

---

### Task 2: Panel Colors & Overlay Alpha Standardization

**Depends on:** Task 1

**Files:**
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/ActIntermissionScene.ts`
- Modify: `src/scenes/game/PauseMenu.ts`
- Modify: `src/ui/UpgradeCards.ts`
- Modify: `src/scenes/installShopBackdrop.ts`
- Modify: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Fix GameOverScene panel color and overlay alpha**

In `src/scenes/GameOverScene.ts`, add import for `UI` from `../config` if not present.

At line ~100, change the panel fill:
```ts
// OLD:
.rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, highContrastUi ? 0x080d17 : 0x101729, 0)
// NEW:
.rectangle(panelCenterX, panelCenterY, PANEL_W, PANEL_H, COLORS.PANEL, 0)
```

The overlay at line ~95 uses `COLORS.BG_DARK` which is correct (it's the scene background, not a dimming overlay). The alpha tween at line 104 already uses `0.82` — matches `UI.OVERLAY_ALPHA`. Replace the literal with the constant:
```ts
// OLD:
this.tweens.add({ targets: overlay, alpha: 0.82, duration: 420 });
// NEW:
this.tweens.add({ targets: overlay, alpha: UI.OVERLAY_ALPHA, duration: 420 });
```

- [ ] **Step 2: Fix ActIntermissionScene overlay alpha and panel color**

In `src/scenes/ActIntermissionScene.ts`, add imports for `COLORS`, `UI` from `../config`.

At line ~67, change backdrop:
```ts
// OLD:
this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
// NEW:
this.add.rectangle(width / 2, height / 2, width, height, COLORS.OVERLAY_DIM, UI.OVERLAY_ALPHA)
```

At line ~97, change card fill:
```ts
// OLD:
const bg = this.add.rectangle(x, y, w, h, 0x1a1a28, 0.98)
// NEW:
const bg = this.add.rectangle(x, y, w, h, COLORS.PANEL_SURFACE, 0.98)
```

- [ ] **Step 3: Fix UpgradeCards overlay alpha**

In `src/ui/UpgradeCards.ts`, add imports for `COLORS`, `UI` from `../config`.

At line ~104, change overlay:
```ts
// OLD:
const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.85)
// NEW:
const overlay = this.scene.add.rectangle(centerX, centerY, width, height, COLORS.OVERLAY_DIM, UI.OVERLAY_ALPHA)
```

- [ ] **Step 4: Fix PauseMenu overlay alpha**

In `src/scenes/game/PauseMenu.ts` (or `pauseMenuStyle.ts`), find where the overlay alpha is set to `0.85`/`0.95` and replace with `UI.OVERLAY_ALPHA` / `UI.OVERLAY_ALPHA_HC`. Import `UI` from config.

- [ ] **Step 5: Fix installShopBackdrop panel color**

In `src/scenes/installShopBackdrop.ts`, at line ~25:
```ts
// OLD:
scene.add.rectangle(width / 2, 318, width - 26, 452, 0x11182a, 0.62)
// NEW:
scene.add.rectangle(width / 2, 318, width - 26, 452, COLORS.PANEL, 0.62)
```

Add import for `COLORS` if not already present.

- [ ] **Step 6: Fix MenuScene panel colors**

In `src/scenes/MenuScene.ts`:

Header panel (line ~77):
```ts
// OLD:
highContrastUi ? 0x0a0f1b : 0x11172b
// NEW:
COLORS.PANEL
```

Main panel (line ~80):
```ts
// OLD:
0x0d1323
// NEW:
COLORS.PANEL
```

Variant panel (line ~269):
```ts
// OLD:
0x10192d
// NEW:
COLORS.PANEL
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 8: Commit**

```bash
git add -u src/scenes/ src/ui/UpgradeCards.ts
git commit -m "fix(ui): standardize panel colors and overlay alpha across all scenes"
```

---

### Task 3: Button Unification

**Depends on:** Task 1

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/scenes/CurseScene.ts`

- [ ] **Step 1: Fix MenuScene carousel buttons to use tertiary colors**

In `src/scenes/MenuScene.ts`, in `createCarouselButton` (line ~431):
```ts
// OLD:
fillOverride: 0x24314f, hoverOverride: 0x304269, textColorOverride: '#ffffff',
// NEW: (remove overrides — use tertiary defaults)
```

Remove the `fillOverride`, `hoverOverride`, and `textColorOverride` from the `createGameButton` call. The tertiary tier already provides `0x252540` / `0x2a2244` / `#e8d4a0`.

- [ ] **Step 2: Fix MenuScene variant badge to use createGameButton**

In `src/scenes/MenuScene.ts`, at line ~414-421, replace the raw rectangle badge with `createGameButton`:

```ts
// OLD:
badge.setInteractive({ useHandCursor: true });
attachButtonHoverFill(badge, COLORS.SCOTTISH_BLUE, 0x0b73d1);
// NEW:
attachButtonHoverFill(badge, COLORS.SCOTTISH_BLUE, 0x0077dd);
```

The hover color `0x0b73d1` should match the primary tier hover `0x0077dd`. The badge is already a rectangle with SCOTTISH_BLUE fill, so just fix the hover color to match primary tier.

- [ ] **Step 3: Fix ShopScene buy button hover color**

In `src/scenes/ShopScene.ts`, at line ~169:
```ts
// OLD:
hoverOverride: canAfford ? 0x3a6a3a : buyPalette.fillColor,
// NEW:
hoverOverride: canAfford ? 0x0077dd : buyPalette.fillColor,
```

Primary hover is `0x0077dd` (blue), not `0x3a6a3a` (green).

- [ ] **Step 4: Fix CurseScene buttons to use createGameButton**

In `src/scenes/CurseScene.ts`, at lines ~213-225, replace the raw rectangle + text with `createGameButton`:

```ts
// OLD:
const btn = this.add
  .rectangle(cx, btnY, w - 24, 32, opts.accentColor, 1)
  .setInteractive({ useHandCursor: true });
this.add
  .text(cx, btnY, t(opts.pickLabelKey), {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: COLORS_CSS.WHITE,
    fontStyle: 'bold',
  })
  .setOrigin(0.5)
  .setScale(uiScale);
attachButtonHoverFill(btn, opts.accentColor, brightenColor(opts.accentColor, 15));
btn.on('pointerdown', opts.onPick);

// NEW:
const { rect: btn, label: btnLabel } = createGameButton(this, {
  x: cx, y: btnY, width: w - 24, height: 32,
  label: t(opts.pickLabelKey), tier: 'primary',
  fontSize: '12px',
  fillOverride: opts.accentColor,
  hoverOverride: brightenColor(opts.accentColor, 15),
});
btnLabel.setScale(uiScale);
btn.on('pointerdown', opts.onPick);
```

Add import for `createGameButton` from `'../ui/gameButton'`.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/MenuScene.ts src/scenes/ShopScene.ts src/scenes/CurseScene.ts
git commit -m "fix(ui): unify all buttons through gameButton factory — consistent hover and tier colors"
```

---

### Task 4: Typography Cleanup

**Depends on:** Task 1

**Files:**
- Modify: `src/scenes/sceneHeaderStyle.ts`
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/scenes/MetaShopScene.ts`
- Modify: `src/scenes/CurseScene.ts`
- Modify: `src/scenes/ActIntermissionScene.ts`
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/ui/HUD.ts`

- [ ] **Step 1: Fix sceneHeaderTextStyle to not accept fontSize**

In `src/scenes/sceneHeaderStyle.ts`, remove the `fontSize` parameter — all scene headers use the `title` role (30px):

```ts
// OLD:
export function sceneHeaderTextStyle(
  fontSize: string,
  color: string,
): SceneHeaderTextStyle {
  return textStyle('title', { color, fontSize });
}

// NEW:
export function sceneHeaderTextStyle(
  color: string,
): SceneHeaderTextStyle {
  return textStyle('title', { color });
}
```

- [ ] **Step 2: Update all sceneHeaderTextStyle call sites**

Every call site passes a fontSize that should be dropped:

`src/scenes/DeedsScene.ts:76`:
```ts
// OLD:
sceneHeaderTextStyle('30px', highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD)
// NEW:
sceneHeaderTextStyle(highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD)
```

`src/scenes/CurseScene.ts:50`:
```ts
// OLD:
sceneHeaderTextStyle('28px', highContrastUi ? '#ffbadc' : '#e8a0c6')
// NEW:
sceneHeaderTextStyle(highContrastUi ? '#ffbadc' : '#e8a0c6')
```

Find and update all other call sites the same way (grep for `sceneHeaderTextStyle(`).

- [ ] **Step 3: Fix MenuScene title to use display role (48px)**

In `src/scenes/MenuScene.ts`, line ~118-126:
```ts
// OLD:
.text(width / 2, 150, t('ui.menu.title'), {
  fontFamily: 'monospace',
  fontSize: '56px',
  color: COLORS_CSS.WHISKY_GOLD,
  align: 'center',
  fontStyle: 'bold',
  stroke: '#000',
  strokeThickness: 7,
})

// NEW:
.text(width / 2, 150, t('ui.menu.title'),
  textStyle('display', { color: COLORS_CSS.WHISKY_GOLD, align: 'center' }),
)
```

Add import for `textStyle` from `'../ui/typography'` if not present.

- [ ] **Step 4: Fix ShopScene title size**

In `src/scenes/ShopScene.ts`, line ~57:
```ts
// OLD:
textStyle('title', { fontSize: '36px', color: COLORS_CSS.WHISKY_GOLD })
// NEW:
textStyle('title', { color: COLORS_CSS.WHISKY_GOLD })
```

Remove the `fontSize: '36px'` override. Title role = 30px.

Gold text (line ~63):
```ts
// OLD:
textStyle('body', { fontSize: '20px', color: COLORS_CSS.WHISKY_GOLD })
// NEW:
textStyle('heading', { color: COLORS_CSS.WHISKY_GOLD })
```

20px is closest to heading (22px). Use the role.

Page text (line ~75):
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#b8a88a' })
// NEW:
textStyle('label', { color: COLORS_CSS.DUSTY_TAN })
```

14px → label (13px). Replace inline color with constant.

- [ ] **Step 5: Fix MetaShopScene title size**

In `src/scenes/MetaShopScene.ts`, line ~53:
```ts
// OLD:
textStyle('title', { fontSize: '32px', color: '#77c977' })
// NEW:
textStyle('title', { color: '#77c977' })
```

Remove `fontSize: '32px'` override.

Kills text (line ~59):
```ts
// OLD:
textStyle('body', { fontSize: '18px', color: COLORS_CSS.WHISKY_GOLD })
// NEW:
textStyle('body', { color: COLORS_CSS.WHISKY_GOLD })
```

Remove `fontSize: '18px'` override. Body = 16px.

Subtitle (line ~65):
```ts
// OLD:
textStyle('label', { fontSize: '12px', color: '#8a93a8' })
// NEW:
textStyle('label', { color: '#8a93a8' })
```

Remove `fontSize: '12px'` override. Label = 13px.

- [ ] **Step 6: Fix GameOverScene title size**

In `src/scenes/GameOverScene.ts`, line ~116:
```ts
// OLD:
textStyle('display', { fontSize: theme.titleFontSize, color: titleColor })
// NEW:
textStyle('display', { color: titleColor })
```

Remove the theme.titleFontSize override. Display = 48px for everyone.

- [ ] **Step 7: Fix ActIntermissionScene text sizes**

In `src/scenes/ActIntermissionScene.ts`:

Title (line ~75):
```ts
// OLD:
textStyle('heading', { fontSize: '28px', color: COLORS_CSS.TOAST_GOLD })
// NEW:
textStyle('title', { color: COLORS_CSS.TOAST_GOLD })
```

28px → use title role (30px) instead of heading with override.

Pick hint (line ~80):
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#aaaaaa' })
// NEW:
textStyle('label', { color: COLORS_CSS.HINT })
```

Route label (line ~101):
```ts
// OLD:
textStyle('body', { fontSize: '20px', color: COLORS_CSS.TOAST_GOLD, ... })
// NEW:
textStyle('heading', { color: COLORS_CSS.TOAST_GOLD, ... })
```

20px → heading (22px).

Description (line ~105):
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#ccccdd', ... })
// NEW:
textStyle('label', { color: COLORS_CSS.COOL_GREY, ... })
```

Shortcut digit (line ~109):
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#7f8ca7' })
// NEW:
textStyle('label', { color: COLORS_CSS.HINT })
```

- [ ] **Step 8: Fix CurseScene inline text dicts**

In `src/scenes/CurseScene.ts`, replace all inline text style objects with `textStyle()` calls. Import `textStyle` from `'../ui/typography'` and `COLORS_CSS` from `'../config'`.

Subtitle (line ~55-60):
```ts
// OLD:
{
  fontFamily: 'monospace',
  fontSize: '13px',
  color: '#c0a8b6',
  fontStyle: 'italic',
  align: 'center',
}
// NEW:
textStyle('subtitle', { color: '#c0a8b6', align: 'center' })
```

Tile title (line ~169-175):
```ts
// OLD:
{
  fontFamily: 'monospace',
  fontSize: '14px',
  color: '#f5e1a6',
  fontStyle: 'bold',
  align: 'center',
  wordWrap: { width: w - 16 },
}
// NEW:
textStyle('label', { color: COLORS_CSS.WARM_TAN, align: 'center', wordWrap: { width: w - 16 } })
```

Gold chip text (line ~188-191):
```ts
// OLD:
{ fontFamily: 'monospace', fontSize: '11px', color: '#f7d27a', fontStyle: 'bold' }
// NEW:
textStyle('small', { color: COLORS_CSS.WHISKY_GOLD })
```

Description (line ~202-206):
```ts
// OLD:
{ fontFamily: 'monospace', fontSize: '10px', color: '#bcc3d4', align: 'center', wordWrap: { width: w - 18 } }
// NEW:
textStyle('small', { color: COLORS_CSS.COOL_GREY, align: 'center', wordWrap: { width: w - 18 } })
```

Bested badge (line ~154-160):
```ts
// OLD:
{ fontFamily: 'monospace', fontSize: '9px', color: '#f7d27a', fontStyle: 'bold', backgroundColor: '#3a2c14', padding: { left: 4, right: 4, top: 2, bottom: 2 } }
// NEW:
{ ...textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }), backgroundColor: '#3a2c14', padding: { left: 4, right: 4, top: 2, bottom: 2 } }
```

- [ ] **Step 9: Normalize HUD font sizes**

In `src/ui/HUD.ts`, fix each text creation to remove fontSize overrides:

HP text (line ~210): `fontSize: '15px'` → remove override (body = 16px)
```ts
// OLD:
textStyle('body', { fontSize: '15px', color: '#e8d4a0' })
// NEW:
textStyle('body', { color: COLORS_CSS.WARM_TAN })
```

Timer (line ~219): `fontSize: '28px'` with heading role → use title role instead
```ts
// OLD:
textStyle('heading', { fontSize: '28px', color: '#e8d4a0' })
// NEW:
textStyle('title', { color: COLORS_CSS.WARM_TAN })
```

Objective (line ~222): `fontSize: '14px'` → label
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#b8a88a' })
// NEW:
textStyle('label', { color: COLORS_CSS.DUSTY_TAN })
```

Curse chip (line ~226): `fontSize: '12px'` with label → remove override (label = 13px)
```ts
// OLD:
textStyle('label', { fontSize: '12px', color: '#c49bbf' })
// NEW:
textStyle('label', { color: '#c49bbf' })
```

Act chip (line ~231): `fontSize: '15px'` → body (16px)
```ts
// OLD:
textStyle('body', { fontSize: '15px', color: '#e8d4a0' })
// NEW:
textStyle('body', { color: COLORS_CSS.WARM_TAN })
```

Ironmoor chip (line ~236): `fontSize: '12px'` → remove override (label = 13px)
```ts
// OLD:
textStyle('label', { fontSize: '12px', color: '#c8a0a0' })
// NEW:
textStyle('label', { color: '#c8a0a0' })
```

Kill/DPS style (line ~202): `fontSize: '18px'` → body (16px)
```ts
// OLD:
textStyle('body', { fontSize: '18px', color: '#e8d4a0' })
// NEW:
textStyle('body', { color: COLORS_CSS.WARM_TAN })
```

Replay chip (line ~245) already uses label without fontSize override — just replace inline color:
```ts
// OLD:
textStyle('label', { color: '#88ccff' })
// NEW: (keep as-is, this color is unique to replay chip)
```

- [ ] **Step 10: Fix ShopScene upgrade row text**

In `src/scenes/ShopScene.ts`:

Upgrade name (line ~136): `fontSize: '15px'` → remove (body = 16px)
```ts
// OLD:
textStyle('body', { fontSize: '15px', color: isMaxed ? '#73c37d' : COLORS_CSS.WHITE })
// NEW:
textStyle('body', { color: isMaxed ? '#73c37d' : COLORS_CSS.WHITE })
```

MAX label (line ~156): `fontSize: '14px'` → label
```ts
// OLD:
textStyle('body', { fontSize: '14px', color: '#73c37d' })
// NEW:
textStyle('label', { color: '#73c37d' })
```

- [ ] **Step 11: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 12: Commit**

```bash
git add -u src/scenes/ src/ui/HUD.ts src/ui/UpgradeCards.ts
git commit -m "fix(ui): normalize all text styles to typography scale — no more ad-hoc font sizes"
```

---

### Task 5: Accessory Atlas Outline

**Independent — no dependencies.**

**Files:**
- Modify: `src/scenes/BootScene.ts:357-386`

- [ ] **Step 1: Add applyOutline to accessory atlas bake**

In `src/scenes/BootScene.ts`, in the `bakeAccessoryAtlas` method, after `g.destroy();` (inside the innermost loop), add:

```ts
          g.destroy();
          applyOutline(this, key, 80, 80);
```

`applyOutline` is already imported at line 35. The call matches the haggis atlas pattern at line 328. Size is 80×80 for all accessories.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`, open browser. Start a game, pick up the kilt upgrade. Verify the kilt sprite now has a 1px dark outline matching the haggis body. Check sporran, tam o'shanter, etc.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "fix(art): apply 1px dark outline to accessory atlas — matches all other entity sprites"
```

---

### Task 6: Kilt Waistband Palette

**Independent — no dependencies.**

**Files:**
- Modify: `src/utils/brightenColor.ts`
- Modify: `src/entities/haggisComposition/drawers/kilt.ts`

- [ ] **Step 1: Add darkenColor to brightenColor.ts**

In `src/utils/brightenColor.ts`, add after the existing function:

```ts
/**
 * Darken a Phaser 0xRRGGBB colour number by `percent` points
 * (matches `Phaser.Display.Color.darken(n)`).
 */
export function darkenColor(color: number, percent: number): number {
  return Phaser.Display.Color.ValueToColor(color).darken(percent).color;
}
```

- [ ] **Step 2: Make kilt waistband palette-aware**

In `src/entities/haggisComposition/drawers/kilt.ts`, add import:
```ts
import { darkenColor } from '../../../utils/brightenColor';
```

Also ensure the kilt palette is available in the draw context. The drawer receives `ctx` with `variantKey`. Import `resolveKiltPalette`:
```ts
import { resolveKiltPalette } from '../../../art/kiltPalette';
```

At line ~77, replace the hardcoded waistband color:
```ts
// OLD:
g.fillStyle(0x1a0505, 1);

// NEW:
const kiltPal = resolveKiltPalette(ctx.variantKey ?? 'classic');
g.fillStyle(darkenColor(kiltPal.fieldDark, 40), 1);
```

This derives the waistband from each variant's `fieldDark` color, darkened by 40%, so:
- Classic: `darkenColor(0x6b2a14, 40)` → very dark rust
- Glaswegian: `darkenColor(0x8a2a00, 40)` → very dark orange
- Laird: `darkenColor(0x1a3a5a, 40)` → very dark navy

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add src/utils/brightenColor.ts src/entities/haggisComposition/drawers/kilt.ts
git commit -m "fix(art): derive kilt waistband color from variant palette — no more hardcoded 0x1a0505"
```

---

### Task 7: Thistle Icon Color Fix

**Independent — no dependencies.**

**Files:**
- Modify: `src/art/sprites/icons/weapons.ts`

- [ ] **Step 1: Update thistle icon to purple palette**

In `src/art/sprites/icons/weapons.ts`, in the `drawThistleShotIcon` function, the calyx (cup under the bloom) is green but should be purple to match the in-game projectile.

Replace the green calyx colors with purple equivalents:

```ts
// OLD calyx fills:
g.fillStyle(0x1a3308, 1);  // dark green
g.fillStyle(0x2a5a14, 1);  // medium green
g.fillStyle(0x3a7a22, 1);  // light green

// NEW calyx fills (purple, matching projectile palette):
g.fillStyle(0x1a0a30, 1);  // dark purple
g.fillStyle(0x331155, 1);  // medium purple
g.fillStyle(0x442266, 1);  // light purple
```

Also fix the calyx spike tips and stem:

```ts
// OLD spike tips:
g.fillStyle(0x2a5a14, 1);  // medium green (x3 triangles)

// NEW spike tips:
g.fillStyle(0x331155, 1);  // medium purple (x3 triangles)

// OLD stem:
g.fillStyle(0x1a3308, 1);  // dark green bar
g.fillStyle(0x2a5a14, 1);  // medium green bar

// NEW stem:
g.fillStyle(0x1a0a30, 1);  // dark purple bar
g.fillStyle(0x331155, 1);  // medium purple bar
```

The bloom section (already purple: 0x2a0a40, 0x4a1a6a, 0x7a3abb, etc.) stays unchanged.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`. In the level-up card pool, check that the Thistle Shot icon reads as a fully purple thistle flower (no green calyx/stem). Compare to the in-game thistle projectile — both should read purple.

- [ ] **Step 4: Commit**

```bash
git add src/art/sprites/icons/weapons.ts
git commit -m "fix(art): thistle icon calyx/stem purple to match projectile — was green, now consistent"
```

---

### Task 8: Audio Fixes

**Independent — no dependencies.**

**Files:**
- Modify: `src/systems/AudioSystem.ts`
- Modify: `src/ui/UpgradeCards.ts`
- Modify: `src/scenes/game/wireSceneEventBus.ts`
- Modify: `src/scenes/game/EnemyKillHandler.ts`

- [ ] **Step 1: Add reroll click sound**

In `src/ui/UpgradeCards.ts`, at line ~138 inside the `rerollBtn.on('pointerdown', ...)` handler, add click sound:

```ts
// OLD:
rerollBtn.on('pointerdown', () => {
  if (this.rerollsLeft > 0) {
    this.rerollsLeft--;

// NEW:
rerollBtn.on('pointerdown', () => {
  if (this.rerollsLeft > 0) {
    audio.playClick();
    this.rerollsLeft--;
```

Verify `audio` is already imported in this file.

- [ ] **Step 2: Fix ambient wind to respect SFX volume**

In `src/systems/AudioSystem.ts`, in `startAmbientWind()` (line ~760), change the hardcoded gain:

```ts
// OLD:
gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);

// NEW:
gain.gain.linearRampToValueAtTime(0.08 * this.sfxGainMultiplier, ctx.currentTime + 1.5);
```

Also, in `applyFromSettings()` (wherever sfxGainMultiplier is updated), add wind gain update:

```ts
// After updating this.sfxGainMultiplier:
if (this.ambientGain) {
  this.ambientGain.gain.setValueAtTime(0.08 * this.sfxGainMultiplier, this.ctx!.currentTime);
}
```

`this.ambientGain` is already stored as a field (from the research).

- [ ] **Step 3: Raise XP pickup gain**

In `src/systems/AudioSystem.ts`, in `playXPCollectImmediate()` (line ~233):

```ts
// OLD:
gain.gain.setValueAtTime(0.10, t);

// NEW:
gain.gain.setValueAtTime(0.14, t);
```

- [ ] **Step 4: Remove orphaned playCeilidhPulse**

In `src/systems/AudioSystem.ts`, delete the entire `playCeilidhPulse()` method (lines ~484-508). Grep for `playCeilidhPulse` to confirm no callers exist (the research already confirmed this).

- [ ] **Step 5: Add playBossEnrage SFX**

In `src/systems/AudioSystem.ts`, add a new method near the other boss-related SFX:

```ts
/** Short descending growl for boss enrage — sawtooth, darker than warning. */
playBossEnrage(): void {
  if (!this.enabled) return;
  const ctx = this.ensureContext();
  if (!ctx || !this.masterGain) return;
  const t0 = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  applySfxDetune(osc);
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.25);

  gain.gain.setValueAtTime(0.18, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);

  osc.connect(gain);
  gain.connect(this.masterGain);
  osc.start(t0);
  osc.stop(t0 + 0.3);

  this.notifyGameplaySfxImpulse(MOTION_TIMING.musicDuckBoss * 0.5);
}
```

- [ ] **Step 6: Add playEliteChain SFX**

In `src/systems/AudioSystem.ts`, add:

```ts
/** Ascending tone for elite chain kills — pitch rises with count. */
playEliteChain(count: number): void {
  if (!this.enabled) return;
  const ctx = this.ensureContext();
  if (!ctx || !this.masterGain) return;
  const t0 = ctx.currentTime;

  // Higher pitch for higher chains: double = 660Hz, triple = 880Hz
  const baseFreq = 440 + (count - 1) * 220;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  applySfxDetune(osc);
  osc.frequency.setValueAtTime(baseFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t0 + 0.12);

  gain.gain.setValueAtTime(0.15, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

  osc.connect(gain);
  gain.connect(this.masterGain);
  osc.start(t0);
  osc.stop(t0 + 0.2);
}
```

- [ ] **Step 7: Wire bossEnrage SFX in wireSceneEventBus**

In `src/scenes/game/wireSceneEventBus.ts`, at line ~30:

```ts
// OLD:
const unsubBossEnraged = globalEventBus.on('bossEnraged', () => {
  hooks.getJuice().showToast(t('ui.game.boss_enraged'), COLORS_CSS.DANGER_RED);
});

// NEW:
const unsubBossEnraged = globalEventBus.on('bossEnraged', () => {
  hooks.getJuice().showToast(t('ui.game.boss_enraged'), COLORS_CSS.DANGER_RED);
  audio.playBossEnrage();
});
```

Verify `audio` is imported in this file.

- [ ] **Step 8: Wire eliteChain SFX in EnemyKillHandler**

In `src/scenes/game/EnemyKillHandler.ts`, at line ~139 (double chain):

```ts
// OLD:
juice.showToast(t('ui.game.elite_chain_double', { gold: g }), '#e8c060');

// NEW:
juice.showToast(t('ui.game.elite_chain_double', { gold: g }), '#e8c060');
audio.playEliteChain(2);
```

At line ~143 (triple chain):
```ts
// OLD:
juice.showToast(t('ui.game.elite_chain_triple', { gold: g }), '#ffdd44');

// NEW:
juice.showToast(t('ui.game.elite_chain_triple', { gold: g }), '#ffdd44');
audio.playEliteChain(3);
```

Verify `audio` is imported.

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 10: Commit**

```bash
git add src/systems/AudioSystem.ts src/ui/UpgradeCards.ts src/scenes/game/wireSceneEventBus.ts src/scenes/game/EnemyKillHandler.ts
git commit -m "fix(audio): add missing SFX (reroll, boss enrage, elite chain), fix wind volume + XP gain, remove orphan"
```

---

### Task 9: Tween Leak & Sparkle Alignment

**Independent — no dependencies.**

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/ui/UpgradeCards.ts`

- [ ] **Step 1: Fix MenuScene tween leak**

In `src/scenes/MenuScene.ts`, add a tracking array for the floating dots. Near the top of the class (with other field declarations), add:

```ts
private floatingDots: Phaser.GameObjects.Arc[] = [];
```

In `create()`, where the floating dots are created (line ~84-99), track them:

```ts
// After creating each dot (inside the for loop):
this.floatingDots.push(dot);
```

Add shutdown cleanup at the end of `create()` (or in a dedicated cleanup method):

```ts
this.events.once('shutdown', () => {
  for (const dot of this.floatingDots) {
    try { this.tweens.killTweensOf(dot); } catch { /* ignore */ }
  }
  this.floatingDots.length = 0;
});
```

- [ ] **Step 2: Fix scene fade-out timing**

In `src/scenes/MenuScene.ts`, find the `startSceneFadeOut` call (when navigating away) and replace the hardcoded duration with `SCENE_FADE_OUT_MS`:

Import at top:
```ts
import { SCENE_FADE_OUT_MS } from './sceneFade';
```

Replace any `startSceneFadeOut(this, 500, ...)` with `startSceneFadeOut(this, SCENE_FADE_OUT_MS, ...)`.

Do the same in `src/scenes/ShopScene.ts` (line ~238):
```ts
// OLD:
startSceneFadeOut(this, 260, () => this.scene.start('MainMenu'), 0x1a1008);
// NEW:
startSceneFadeOut(this, SCENE_FADE_OUT_MS, () => this.scene.start('MainMenu'));
```

Note: also remove the custom color `0x1a1008` — use the default `SCENE_FADE_COLOR` for consistency.

Check all other scenes for `startSceneFadeOut` calls and standardize.

- [ ] **Step 3: Fix UpgradeCards sparkle stagger**

In `src/ui/UpgradeCards.ts`, at line ~222, align sparkle delay with card stagger:

```ts
// OLD:
delay: s * 300,

// NEW:
delay: s * 120,
```

This matches the 120ms per-card stagger so sparkles and card reveals have the same rhythm.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/MenuScene.ts src/scenes/ShopScene.ts src/ui/UpgradeCards.ts
git commit -m "fix(ux): kill MenuScene tween leak, standardize fade timing, align sparkle stagger"
```

---

### Task 10: Verification & Cleanup

**Depends on:** All previous tasks.

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Clean build, zero errors.

- [ ] **Step 2: Run unit tests**

Run: `npm test`
Expected: All tests pass. If `colorsCss.test.ts` fails (it enforces COLORS ↔ COLORS_CSS sync), add the new CSS entries.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: Clean.

- [ ] **Step 4: Visual spot-check**

Run: `npm run dev` and check each screen:

1. **Boot → Main Menu**: Title is 48px (was 56px). Floating dots are present. Panel colors are unified.
2. **Loadout picker**: Carousel buttons match tertiary tier. Variant badge hover matches primary.
3. **Game → Level-up**: Overlay dims at consistent 82% alpha. Reroll button clicks. Sparkles sync with card reveals.
4. **Pause menu**: Overlay alpha matches level-up.
5. **Game Over**: Panel color unified. Title is 48px display.
6. **Shop**: Title is 30px (was 36px). Buy buttons hover blue (not green). Panel color unified.
7. **Curse picker**: Buttons use gameButton factory. Header is 30px.
8. **Act Intermission**: Overlay at 82% (was 65%). Cards use PANEL_SURFACE.
9. **Settings / Deeds / Chronicle**: Headers at 30px.
10. **Kilt upgrade**: Kilt has 1px outline. Waistband color matches variant tartan.
11. **Thistle weapon**: Icon is purple, matches projectile.
12. **Audio**: XP gems crisp. Wind scales with volume slider. Boss enrage has growl SFX. Elite chains have ascending tone.

- [ ] **Step 5: Final commit if any fixes needed**

If spot-checking reveals issues, fix and commit.
