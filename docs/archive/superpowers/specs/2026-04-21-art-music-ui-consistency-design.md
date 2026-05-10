# Art / Music / UI Consistency Pass — Design Spec

**Date**: 2026-04-21
**Branch**: `art-music-polish-pass`
**Goal**: Every visual, audio, and interaction element in the game must feel like it was made by the same person on the same day. Zero ad-hoc colors, zero orphan patterns, zero silent interactions that should have sound.

---

## Scope

Fix all critical/high/medium consistency issues found in the full-game audit. Include low items when trivially adjacent. Skip new features (corner radius, hover audio, kill-milestone variation).

**Out of scope**: new visual features, gameplay changes, new SFX for events that never had them (menu hover, codex first-cull), tween easing documentation.

---

## Layer 1 — Design Tokens (Foundation)

### 1.1 Panel Background Colors

**Problem**: 8 different panel background hex values scattered across scenes (0x080d17, 0x0a0f1b, 0x0d1323, 0x10192d, 0x101729, 0x11172b, 0x1a1a28, 0x1a1a2e).

**Fix**: Add two named panel constants to `config.ts`:

```ts
// in COLORS
PANEL: 0x111728,        // primary panel background (menus, overlays, cards)
PANEL_SURFACE: 0x1a1a28 // secondary surface (card interiors, list rows)
```

Replace all ad-hoc panel fills:
- `MainMenuScene` header/main panel → `COLORS.PANEL`
- `GameOverScene` panel → `COLORS.PANEL`
- `ActIntermissionScene` cards → `COLORS.PANEL_SURFACE`
- `CurseScene` tiles → `COLORS.PANEL_SURFACE`
- `PauseMenu` overlay → `COLORS.BG_DARK` (already correct)
- `MenuScene` loadout panel → `COLORS.PANEL`
- `ShopScene` upgrade rows → `COLORS.PANEL_SURFACE`

### 1.2 Overlay Backdrop Alpha

**Problem**: Pause 0.85, UpgradeCards 0.85, ActIntermission 0.65 — inconsistent dimming.

**Fix**: Standardize overlay alpha in `config.ts`:

```ts
// in a new UI_CONSTANTS block or alongside COLORS
OVERLAY_ALPHA: 0.82         // all full-screen dimming overlays
OVERLAY_ALPHA_HC: 0.92      // high-contrast variant
```

Apply to: PauseMenu, UpgradeCards, ActIntermissionScene, GameOverScene overlay.

### 1.3 Scene Fade Timing

**Problem**: Fade-in 360ms (default), fade-out varies 260–500ms.

**Fix**: Standardize in `sceneFade.ts`:

```ts
export const SCENE_FADE_IN_MS = 360;
export const SCENE_FADE_OUT_MS = 360;
```

All `startSceneFadeOut` calls use `SCENE_FADE_OUT_MS`. No more per-call overrides.

### 1.4 Scene Header Font Sizes

**Problem**: CurseScene 28px, DeedsScene 30px, ShopScene 36px, MenuScene 56px, GameOver 52px.

**Fix**: Use the existing typography scale consistently:
- **Scene titles** (Curse, Deeds, Chronicle, Shop, Settings): `textStyle('title')` → 30px
- **Major titles** (MenuScene game title, GameOver): `textStyle('display')` → 48px
- No custom overrides. If 48px is too big for GameOver, the display role gets adjusted for everyone.

### 1.5 Text Color Consolidation

**Problem**: ~15 ad-hoc CSS color strings scattered across palette resolver files.

**Fix**: Add commonly used text colors to `COLORS_CSS`:

```ts
// in COLORS_CSS
WARM_TAN: '#e8d4a0',     // tertiary button text, HUD secondary, card text
DUSTY_TAN: '#b8a88a',    // subdued body text, stats, descriptions
HINT: '#6a7390',          // hints, placeholders, de-emphasized labels
COOL_GREY: '#c8d0e0',    // neutral body text on dark panels
```

Replace all inline hex strings in scenes with these named constants.

### 1.6 Button Unification

**Problem**: CurseScene, MenuScene variant badges, ActIntermission cards bypass `createGameButton`. MenuScene carousel uses different fill than tertiary. ShopScene buy button hovers green.

**Fix**:
- **CurseScene pick buttons**: Refactor to use `createGameButton` with `tier: 'primary'` (curse accent) or `tier: 'secondary'` (clean run). Use `fillOverride`/`hoverOverride` for the accent color, not raw rectangles.
- **MenuScene carousel buttons**: Change fillOverride to match tertiary tier (0x252540 / 0x2a2244) instead of bespoke 0x24314f / 0x304269.
- **MenuScene variant badge**: Refactor to use `createGameButton` with `tier: 'primary'`.
- **ShopScene buy button**: Change hover from green (0x3a6a3a) to standard primary hover (0x0077dd). "Affordable" is already communicated by the blue fill; green hover is confusing.
- **ActIntermissionScene route cards**: These are cards not buttons — keep current card styling but wire `attachButtonHoverFill` through the same hover color logic as `gameButton.ts`.

### 1.7 Amber Header Wash

**Problem**: Documented for Shop/MetaShop but not called in either.

**Fix**: Add `addAmberHeaderWash(this, AMBER_HEADER_WASH_ALPHA_QUIET)` to `ShopScene.create()` and `MetaShopScene.create()` after backdrop setup.

---

## Layer 2 — Art & Sprite Fixes

### 2.1 Accessory Atlas Outline

**Problem**: `bakeAccessoryAtlas()` in BootScene (line 357-386) does not call `applyOutline()`. Every other entity atlas does.

**Fix**: After baking each accessory frame, apply the same 1px dark outline post-process (`applyOutline` with `0x0a1408` tint) used by haggis/enemy atlases.

### 2.2 Kilt Waistband Palette

**Problem**: `kilt.ts:77` hardcodes waistband color to `0x1a0505` regardless of variant.

**Fix**: Derive waistband color from the kilt palette. Use `kiltPalette.fieldDark` darkened further (e.g. `darkenColor(kiltPalette.fieldDark, 40)`), or add a `waistband` field to `KiltPalette`. The waistband should look like a darker shade of the variant's primary tartan field.

Preferred approach: compute from `fieldDark` to avoid expanding the palette interface. Add a pure helper `darkenColor(hex: number, amount: number): number` in a color utils module (or reuse existing `brightenColor` with negative delta if it supports that).

### 2.3 Thistle Icon Color

**Problem**: Thistle projectile is purple (0x552288, 0x663399). Thistle weapon icon is green (0x2a5a14, 0x3a7a22).

**Fix**: Update `drawThistleShotIcon` in `src/art/sprites/icons/weapons.ts` to use the purple palette from the projectile: base 0x552288, highlight 0x663399, dark 0x331155. The thistle is a purple flower — both icon and projectile should read purple.

### 2.4 Weapon Icon Palette Centralization

**Problem**: All weapon icons use hardcoded hex values instead of centralized palette constants.

**Fix**: Create a `WEAPON_ICON_PALETTE` in `src/art/palettes.ts` (or co-locate with weapon icon code) mapping each weapon to its 3-4 drawing colors. Update `weapons.ts` icon drawers to reference these constants. This ensures a palette tweak propagates everywhere.

Not blocking: caber bark color (issue #26) — low impact at gameplay scale and would require passing variant context through projectile creation. Note for future.

---

## Layer 3 — Audio & UX Fixes

### 3.1 Reroll Click SFX

**Problem**: Reroll button in `UpgradeCards.ts:135-141` is silent.

**Fix**: Call `audio.playClick()` on reroll button pointerdown. Simple — same click used by every other button.

### 3.2 Ambient Wind Volume

**Problem**: `AudioSystem.ts:760` ramps wind to hardcoded 0.08, ignoring `sfxGainMultiplier`.

**Fix**: Multiply wind target gain by `this.sfxGainMultiplier`. When user changes SFX volume, wind should also update (add wind gain node to the list managed by `applyFromSettings`).

### 3.3 XP Pickup Gain

**Problem**: XP collect gain is 0.10 — too quiet relative to hit (0.15) and kill (0.20).

**Fix**: Raise `playXPCollectImmediate()` peak gain to 0.14. XP gems are frequent positive feedback — they should feel crisp, not muted.

### 3.4 Orphaned playCeilidhPulse

**Problem**: Method defined but never called anywhere in the codebase.

**Fix**: Remove the method entirely. Dead code.

### 3.5 Boss Enrage SFX

**Problem**: Boss enrage event only triggers music accent, no SFX.

**Fix**: Add `playBossEnrage()` to AudioSystem — a short descending sawtooth growl (similar frequency range to `playBossWarning` but darker, shorter). Call from `wireSceneEventBus.ts` on `bossEnraged` event.

### 3.6 Elite Chain SFX

**Problem**: Double/triple elite chain kills show toast but are silent.

**Fix**: Add `playEliteChain(count: number)` to AudioSystem — ascending tone (higher pitch for higher chain). Call from `EnemyKillHandler.ts` at the chain notification points.

### 3.7 MenuScene Tween Leak

**Problem**: `MenuScene.ts:91-98` creates 24 floating dot tweens with `repeat: -1` but never kills them on scene shutdown.

**Fix**: Track dot tween targets in an array (like `MainMenuScene.cozyTweenTargets`). Add shutdown listener to kill all tweens.

### 3.8 Upgrade Card Stagger Alignment

**Problem**: Card entry stagger is 120ms per card, but sparkle delays use 300ms — rhythm mismatch.

**Fix**: Align sparkle delay to card stagger. Use `i * 120` for sparkle stagger base to match card entry cadence.

### 3.9 HUD Font Size Normalization

**Problem**: Multiple 1-2px deviations from typography scale (15px when body=16px, 28px when heading=22px).

**Fix**: Replace all HUD inline font sizes with nearest `textStyle()` role:
- 15px → `body` (16px)
- 28px → `heading` (22px) or `title` (30px) depending on prominence
- 14px → `label` (13px)
- 17px → `body` (16px)
- 18px → `body` (16px)

The 1-2px shifts were likely micro-adjustments that accumulated; the typography scale is the source of truth.

### 3.10 Inline Text Style Cleanup

**Problem**: ActIntermissionScene, CurseScene use inline `{fontSize, fontFamily, color}` dicts instead of `textStyle()`.

**Fix**: Replace all inline text style dicts in these scenes with `textStyle(role, opts)` calls. Map each to the appropriate role.

---

## Verification

After all changes:

1. `npm run build` — clean tsc + vite build
2. `npm test` — all unit tests pass
3. `npm run lint` — no lint errors
4. Visual spot-check in browser:
   - Boot → Main Menu → Loadout → Game → Pause → Resume → Level-up → Game Over
   - Shop, Deeds, Chronicle, Settings, Curse scene
   - Verify: consistent panel colors, button styles, text sizes, fade timing
   - Verify: accessories have outlines, kilt waistband adapts to variant
   - Verify: thistle icon is purple
5. Audio spot-check:
   - Reroll button clicks
   - XP gems audible
   - Wind respects volume slider
   - Boss enrage has SFX

---

## Files Modified (estimated)

| File | Changes |
|------|---------|
| `src/config.ts` | Add PANEL, PANEL_SURFACE colors; add OVERLAY_ALPHA; add COLORS_CSS text colors |
| `src/ui/gameButton.ts` | No structural changes — already supports overrides |
| `src/ui/typography.ts` | No changes — already correct |
| `src/scenes/sceneFade.ts` | Add SCENE_FADE_OUT_MS constant |
| `src/scenes/BootScene.ts` | Add applyOutline to accessory atlas bake |
| `src/art/kiltPalette.ts` | Possibly add waistband derivation helper |
| `src/entities/haggisComposition/drawers/kilt.ts` | Use palette-derived waistband color |
| `src/art/sprites/icons/weapons.ts` | Fix thistle icon colors; centralize palette refs |
| `src/art/sprites/projectiles/thistle.ts` | Reference only (colors are correct here) |
| `src/art/palettes.ts` | Add WEAPON_ICON_PALETTE |
| `src/systems/AudioSystem.ts` | Add reroll click routing, fix wind gain, bump XP gain, add bossEnrage + eliteChain SFX, remove playCeilidhPulse |
| `src/ui/UpgradeCards.ts` | Add reroll click, fix sparkle stagger |
| `src/scenes/MenuScene.ts` | Fix carousel button colors, variant badge to factory, fix tween leak, fix title size |
| `src/scenes/ShopScene.ts` | Fix buy button hover, fix title size, add amber wash, use PANEL_SURFACE |
| `src/scenes/MetaShopScene.ts` | Add amber wash |
| `src/scenes/CurseScene.ts` | Refactor buttons to factory, fix header size, use textStyle() |
| `src/scenes/ActIntermissionScene.ts` | Fix overlay alpha, use textStyle(), use PANEL_SURFACE |
| `src/scenes/DeedsScene.ts` | Verify header uses textStyle('title') |
| `src/scenes/ChronicleScene.ts` | Verify header uses textStyle('title') |
| `src/scenes/GameOverScene.ts` | Fix overlay alpha, fix title size, use PANEL |
| `src/scenes/game/PauseMenu.ts` | Fix overlay alpha |
| `src/scenes/game/LevelUpFlow.ts` | No changes expected |
| `src/ui/HUD.ts` | Normalize font sizes to typography roles |
| `src/scenes/game/wireSceneEventBus.ts` | Wire bossEnrage SFX |
| `src/scenes/game/EnemyKillHandler.ts` | Wire eliteChain SFX |
