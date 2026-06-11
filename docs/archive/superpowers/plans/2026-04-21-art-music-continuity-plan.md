# Art & Music Continuity Polish — Implementation Plan

> **STATUS:** ✅ SHIPPED 2026-04-21 — verified 2026-04-22 against repo state. Checkboxes below remain unticked because superpowers:subagent-driven-development commits code without editing plan files. File retained in-tree as scope-vs-shipped record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify every visual and audio element across the entire game — zero orphan styles, zero tonal clashes, zero "different designer per page" moments.

**Architecture:** Palette-first DAG. Layer 0 (design tokens) is the bottleneck — once done, Layers 1a–1d are independent and can be parallelized. Layer 2 migrates all scene consumers. Layer 3 is integration testing.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Web Audio API

**Spec:** `docs/superpowers/specs/2026-04-21-art-music-continuity-design.md`

---

## Task 1: Layer 0 — Extend Color Palette Constants

**Files:**
- Modify: `src/config.ts:81-175`
- Modify: `src/ui/colorsCss.test.ts`

- [ ] **Step 1: Add new numeric COLORS constants**

In `src/config.ts`, add these entries inside the `COLORS` object (before the closing `} as const`), after the existing `DANGER_RED` entry at line 125:

```typescript
  /** Bright gold — crits, legendary particles, evolution beams. */
  CRIT_GOLD: 0xffdd44,
  /** Reward gold — pickup toasts, boss ring secondary, chest collect. */
  REWARD_GOLD: 0xffcc44,
  /** Positive green — weapon acquire, heal, health orb. */
  POSITIVE_GREEN: 0x44dd44,
  /** Combo amber — warm combo counter tier (20–49). */
  COMBO_AMBER: 0xe8a830,
```

- [ ] **Step 2: Add new COLORS_CSS text color constants**

In `src/config.ts`, add these entries inside the `COLORS_CSS` object (before the closing `} as const`), after the existing `COOL_GREY` entry at line 174:

```typescript
  /** Bright gold for CSS contexts — crits, legendary moments. */
  CRIT_GOLD: '#ffdd44',
  /** Reward gold for CSS contexts — pickup/milestone toasts. */
  REWARD_GOLD: '#ffcc44',
  /** Positive green for CSS contexts — weapon acquire, heal. */
  POSITIVE_GREEN: '#44dd44',
  /** Combo amber for CSS contexts — combo 20+ tier. */
  COMBO_AMBER: '#e8a830',

  // ── Text gray family (cool-blue grays for body text / labels) ──

  /** Brightest body text — bold titles, emphasis headings. */
  TEXT_BRIGHT: '#e4e9f0',
  /** Standard body text — default paragraph color. */
  TEXT_PRIMARY: '#c4cdd8',
  /** Secondary labels — less prominent info. */
  TEXT_SECONDARY: '#9ea8bb',
  /** De-emphasized info — tertiary context. */
  TEXT_MUTED: '#8a93a8',
  /** Italic subtitles — scene context, timestamps. */
  TEXT_SUBTITLE: '#7f8ca7',
  /** Footer / fine print — dimmest readable text. */
  TEXT_DIM: '#596780',

  // ── Semantic accent families ──

  /** Curse text — death banners, curse labels. */
  CURSE_MAUVE: '#c8a0a0',
  /** Curse emphasis — bright mauve for active curse display. */
  CURSE_MAUVE_BRIGHT: '#e8a0c6',
  /** Victory / unlock green. */
  VICTORY_GREEN: '#77c977',
  /** Warm label tan — stat labels in GameOver. */
  LABEL_TAN: '#b69643',
  /** Status/copyright tan — muted informational text. */
  STATUS_TAN: '#8a7a6a',
```

- [ ] **Step 3: Update colorsCss test to cover new pairs**

Read `src/ui/colorsCss.test.ts` to understand the existing test pattern. Add test cases for all new constants that exist in both `COLORS` and `COLORS_CSS` (CRIT_GOLD, REWARD_GOLD, POSITIVE_GREEN, COMBO_AMBER). The text-only constants (TEXT_BRIGHT, CURSE_MAUVE, etc.) don't have numeric mirrors so skip those.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/ui/colorsCss.test.ts`
Expected: PASS — all new hex↔CSS pairs validated

- [ ] **Step 5: Run build to verify types**

Run: `npm run build`
Expected: PASS — no type errors

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/ui/colorsCss.test.ts
git commit -m "feat(palette): extend COLORS/COLORS_CSS with semantic text, gold, mauve, green families"
```

---

## Task 2: Layer 1a — Highland Tartan Constant

**Files:**
- Modify: `src/art/kiltPalette.ts:24-40`

- [ ] **Step 1: Add HIGHLAND_TARTAN export**

In `src/art/kiltPalette.ts`, after the `KILT_PALETTES` record (line 34), before the `FALLBACK` line (line 36), add:

```typescript
/**
 * Shared tartan palette for all enemy and world tartan elements.
 * Muted Stewart red — reads as "generic Scottish" while sitting below
 * player kilt saturation in visual hierarchy. Accent uses WHISKY_GOLD
 * to tie into the game's primary accent language.
 */
export const HIGHLAND_TARTAN: KiltPalette = {
  field: 0xa83030,
  fieldDark: 0x6b1a1a,
  stripe: 0x1a4422,
  accent: 0xd4a017,
};
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/art/kiltPalette.ts
git commit -m "feat(tartan): add HIGHLAND_TARTAN shared palette for enemy/world tartans"
```

---

## Task 3: Layer 1a — Migrate Enemy Tartans to HIGHLAND_TARTAN

**Files:**
- Modify: `src/art/sprites/enemies/angryScotsman.ts`
- Modify: `src/art/sprites/enemies/piper.ts`
- Modify: `src/art/sprites/enemies/tourist.ts`
- Modify: `src/art/sprites/enemies/ghost.ts`
- Modify: `src/art/sprites/enemies/ceilidhCaller.ts`
- Modify: `src/art/sprites/enemies/edinburghGhostGuide.ts`
- Modify: `src/art/sprites/icons/cards.ts:680-747`

- [ ] **Step 1: Read each enemy file to find hardcoded tartan colors**

Read each of the 6 enemy sprite files listed above. Identify every hardcoded tartan hex value (kilt fields, stripes, sash colors). Note the exact variable names or inline positions.

- [ ] **Step 2: Migrate angryScotsman.ts**

Add `import { HIGHLAND_TARTAN } from '../../../art/kiltPalette';` (adjust path based on file location). Replace all hardcoded kilt colors:
- Red fill → `HIGHLAND_TARTAN.field`
- Dark red / shadow → `HIGHLAND_TARTAN.fieldDark`
- Green stripes → `HIGHLAND_TARTAN.stripe`
- Gold/yellow accent → `HIGHLAND_TARTAN.accent`

- [ ] **Step 3: Migrate piper.ts**

Same pattern — import `HIGHLAND_TARTAN`, replace navy/blue kilt colors with `HIGHLAND_TARTAN` fields.

- [ ] **Step 4: Migrate tourist.ts**

Replace tartan bucket hat and bag colors with `HIGHLAND_TARTAN` fields.

- [ ] **Step 5: Migrate ghost.ts**

Replace tartan bleed colors with `HIGHLAND_TARTAN` fields.

- [ ] **Step 6: Migrate ceilidhCaller.ts**

Replace tartan sash colors with `HIGHLAND_TARTAN` fields.

- [ ] **Step 7: Migrate edinburghGhostGuide.ts**

Replace tartan hat band color with `HIGHLAND_TARTAN.field`.

- [ ] **Step 8: Migrate cards.ts tartan sash icon**

In `src/art/sprites/icons/cards.ts` (lines ~680-747), import `HIGHLAND_TARTAN` and replace hardcoded Royal Stewart colors in the `drawTartanSash` function with `HIGHLAND_TARTAN` fields.

- [ ] **Step 9: Run build + visual verification**

Run: `npm run build`
Expected: PASS

Start dev server (`npm run dev`), load the game, verify enemy sprites still render correctly with updated tartan colors. Check angryScotsman kilt, piper kilt, tourist hat, ghost bleed, ceilidh sash, ghost guide hat band.

- [ ] **Step 10: Commit**

```bash
git add src/art/sprites/enemies/angryScotsman.ts src/art/sprites/enemies/piper.ts src/art/sprites/enemies/tourist.ts src/art/sprites/enemies/ghost.ts src/art/sprites/enemies/ceilidhCaller.ts src/art/sprites/enemies/edinburghGhostGuide.ts src/art/sprites/icons/cards.ts
git commit -m "fix(tartan): unify all enemy/card tartans to shared HIGHLAND_TARTAN palette"
```

---

## Task 4: Layer 1b — Add Disabled State to gameButton

**Files:**
- Modify: `src/ui/gameButton.ts:58-117`
- Modify: `src/ui/gameButton.test.ts`

- [ ] **Step 1: Read existing gameButton test**

Read `src/ui/gameButton.test.ts` to understand the test patterns and available mocking strategy.

- [ ] **Step 2: Write failing test for disabled state**

Add a test to `src/ui/gameButton.test.ts`:

```typescript
it('setGameButtonDisabled dims rect and label when disabled', () => {
  // Create a button using existing test setup patterns
  // Then call setGameButtonDisabled(btn, true)
  // Assert: rect.alpha === 0.6, label.alpha === 0.5
  // Then call setGameButtonDisabled(btn, false)
  // Assert: rect.alpha === 1, label.alpha === 1
});
```

Adapt to the file's existing mock/scene patterns.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/ui/gameButton.test.ts`
Expected: FAIL — `setGameButtonDisabled` not defined

- [ ] **Step 4: Implement setGameButtonDisabled**

In `src/ui/gameButton.ts`, add after the `createGameButton` function:

```typescript
/**
 * Toggle disabled appearance on a game button. When disabled:
 *   - rect fill lerps toward 0x333340 (50% desaturation)
 *   - rect alpha → 0.6, label alpha → 0.5
 *   - interaction disabled (no hover, no click)
 * When re-enabled, restores original fill, full alpha, interaction.
 */
export function setGameButtonDisabled(
  btn: GameButtonResult,
  disabled: boolean,
  idleFill?: number,
  hoverFill?: number,
): void {
  if (disabled) {
    btn.rect.setAlpha(0.6);
    btn.label.setAlpha(0.5);
    btn.rect.disableInteractive();
  } else {
    btn.rect.setAlpha(1);
    btn.label.setAlpha(1);
    btn.rect.setInteractive({ useHandCursor: true });
    if (idleFill !== undefined) btn.rect.setFillStyle(idleFill);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/ui/gameButton.test.ts`
Expected: PASS

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/ui/gameButton.ts src/ui/gameButton.test.ts
git commit -m "feat(ui): add setGameButtonDisabled for visual disabled state on buttons"
```

---

## Task 5: Layer 1b — Create Panel Stroke Presets

**Files:**
- Create: `src/ui/panelStyle.ts`
- Create: `src/ui/panelStyle.test.ts`

- [ ] **Step 1: Write test**

Create `src/ui/panelStyle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PANEL_STROKE } from './panelStyle';

describe('PANEL_STROKE', () => {
  it('defines standard and accent presets', () => {
    expect(PANEL_STROKE.standard).toEqual({ width: 2, color: 0x2a3450, alpha: 0.8 });
    expect(PANEL_STROKE.accent).toEqual({ width: 2, color: 0xd4a017, alpha: 0.6 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/panelStyle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement panelStyle.ts**

Create `src/ui/panelStyle.ts`:

```typescript
import { COLORS } from '../config';

export interface PanelStrokePreset {
  width: number;
  color: number;
  alpha: number;
}

export const PANEL_STROKE = {
  /** Standard panel border — menus, overlays, card frames. */
  standard: { width: 2, color: 0x2a3450, alpha: 0.8 } as PanelStrokePreset,
  /** Gold accent border — curse tiles, highlighted cards. */
  accent: { width: 2, color: COLORS.WHISKY_GOLD, alpha: 0.6 } as PanelStrokePreset,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/panelStyle.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/panelStyle.ts src/ui/panelStyle.test.ts
git commit -m "feat(ui): add PANEL_STROKE presets for unified panel borders"
```

---

## Task 6: Layer 1b — Create Toast Color Palette

**Files:**
- Create: `src/ui/toastPalette.ts`
- Create: `src/ui/toastPalette.test.ts`

- [ ] **Step 1: Write test**

Create `src/ui/toastPalette.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TOAST_COLORS } from './toastPalette';

describe('TOAST_COLORS', () => {
  it('covers all semantic categories', () => {
    expect(TOAST_COLORS.reward).toBe('#ffcc44');
    expect(TOAST_COLORS.legendary).toBe('#ddaa00');
    expect(TOAST_COLORS.positive).toBe('#44dd44');
    expect(TOAST_COLORS.info).toBe('#c8d0e0');
    expect(TOAST_COLORS.warning).toBe('#ff8844');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/toastPalette.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement toastPalette.ts**

Create `src/ui/toastPalette.ts`:

```typescript
import { COLORS_CSS } from '../config';

/**
 * Semantic toast color categories. Every showToast() call should
 * reference one of these instead of inline hex strings.
 */
export const TOAST_COLORS = {
  /** Gold pickups, milestone rewards, elite chain bonuses. */
  reward: COLORS_CSS.REWARD_GOLD,
  /** Evolution, legendary card selection. */
  legendary: COLORS_CSS.LEGENDARY,
  /** Weapon acquire, heal, positive state change. */
  positive: COLORS_CSS.POSITIVE_GREEN,
  /** Neutral status info, non-critical notifications. */
  info: COLORS_CSS.COOL_GREY,
  /** Curse, danger, caution. */
  warning: '#ff8844',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/toastPalette.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/toastPalette.ts src/ui/toastPalette.test.ts
git commit -m "feat(ui): add TOAST_COLORS semantic palette for unified toast notifications"
```

---

## Task 7: Layer 1c — Create Effect Timing Presets

**Files:**
- Create: `src/systems/effectTimingPresets.ts`
- Create: `src/systems/effectTimingPresets.test.ts`

- [ ] **Step 1: Write test**

Create `src/systems/effectTimingPresets.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { RING_TIMING, FLASH_TIMING, PARTICLE_DURATION } from './effectTimingPresets';

describe('effectTimingPresets', () => {
  it('RING_TIMING has tight < medium < grand', () => {
    expect(RING_TIMING.tight).toBeLessThan(RING_TIMING.medium);
    expect(RING_TIMING.medium).toBeLessThan(RING_TIMING.grand);
  });

  it('FLASH_TIMING has short < medium < long < epic', () => {
    expect(FLASH_TIMING.short).toBeLessThan(FLASH_TIMING.medium);
    expect(FLASH_TIMING.medium).toBeLessThan(FLASH_TIMING.long);
    expect(FLASH_TIMING.long).toBeLessThan(FLASH_TIMING.epic);
  });

  it('PARTICLE_DURATION ranges are valid', () => {
    for (const range of Object.values(PARTICLE_DURATION)) {
      expect(range.min).toBeLessThan(range.max);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/effectTimingPresets.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement effectTimingPresets.ts**

Create `src/systems/effectTimingPresets.ts`:

```typescript
/**
 * Standardized timing values for visual effects — rings, flashes,
 * and particle lifetimes. Referenced by JuiceSystem and any code
 * that spawns transient VFX. Using named presets instead of magic
 * numbers ensures similar events *feel* similar.
 */

export const RING_TIMING = {
  /** Kill burst, small impacts — snappy feedback. */
  tight: 200,
  /** Weapon acquire, pickup collect — moderate emphasis. */
  medium: 400,
  /** Boss death, evolution, level milestone — grand spectacle. */
  grand: 700,
} as const;

export const FLASH_TIMING = {
  /** Triple elite chain — brief punctuation. */
  short: 100,
  /** Level-up, white flash — standard feedback. */
  medium: 200,
  /** Boss death — weighty impact. */
  long: 400,
  /** Evolution spectacle — peak reward moment. */
  epic: 500,
} as const;

export const PARTICLE_DURATION = {
  /** Kill burst — fast scatter. */
  fast: { min: 250, max: 400 },
  /** Moor moment — moderate float. */
  medium: { min: 400, max: 600 },
  /** Boss death, evolution — lingering spectacle. */
  grand: { min: 800, max: 1400 },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/effectTimingPresets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/effectTimingPresets.ts src/systems/effectTimingPresets.test.ts
git commit -m "feat(vfx): add effect timing presets — ring, flash, particle duration standards"
```

---

## Task 8: Layer 1d — Fix Off-Key SFX Frequencies

**Files:**
- Modify: `src/systems/AudioSystem.ts`

This task corrects 7 SFX methods to use A Dorian scale degrees. Each change is a frequency number swap — no structural changes.

- [ ] **Step 1: Read the 5 SFX methods that need changes**

Read `src/systems/AudioSystem.ts` at these line ranges:
- Lines 287-314 (playLevelUp)
- Lines 317-347 (playAchievement)
- Lines 350-370 (playPurchaseImmediate)
- Lines 656-679 (playCardReveal)
- Lines 742-763 (playClick)

Also find and read the elite affix SFX methods — search for `swift` and `volatile` frequency values.

- [ ] **Step 2: Fix playLevelUp — C major → A minor**

Change the ascending arpeggio frequencies:
- `523` → `440` (C5 → A4)
- `659` → `523` (E5 → C5)
- `784` → `659` (G5 → E5)

This changes C-E-G (C major) to A-C-E (A minor) — diatonic to A Dorian.

- [ ] **Step 3: Fix playCardReveal — G major → G-A-D**

Change the three note frequencies:
- `392.0` stays (G4 — in key)
- `493.88` → `440.0` (B4 → A4 — tonic)
- `587.33` stays (D5 — in key)

- [ ] **Step 4: Fix playAchievement — C-G → A-E**

Change the chord frequencies:
- `523` → `440` (C5 → A4)
- `784` → `659` (G5 → E5)

Preserves the perfect-fifth interval, moves to tonic root.

- [ ] **Step 5: Fix playPurchaseImmediate — off-grid → D5-A5**

Change the frequency ramp:
- Start: `660` → `587` (E5 → D5)
- End: `990` → `880` (B5 → A5)

- [ ] **Step 6: Fix playClick — 700Hz → G4**

Change: `700` → `392` (unanchored → G4, diatonic)

- [ ] **Step 7: Fix elite affix Swift — C#5 → A4**

Find the Swift affix SFX. Change start frequency:
- `520` → `440` (C#5 → A4)
- End frequency: `1240` → `880` (→ A5, octave sweep)

- [ ] **Step 8: Fix elite affix Volatile — G#3 → A3**

Find the Volatile affix SFX. Change start frequency:
- `420` → `440` (G#3 → A3)
- End: `70` → `55` (→ A1, clean octave descent)

- [ ] **Step 9: Run build + manual audio test**

Run: `npm run build`
Expected: PASS

Start dev server, trigger each SFX in-game:
- Level up (gain XP until level up)
- Card reveal (open upgrade cards)
- Achievement (if accessible)
- Purchase (buy something in shop)
- Menu click (click any menu button)
- Elite affix (play until elite spawns — or test via console)

Verify each sounds consonant with background music, not jarring.

- [ ] **Step 10: Commit**

```bash
git add src/systems/AudioSystem.ts
git commit -m "fix(audio): retune 7 off-key SFX to A Dorian — levelUp, cardReveal, achievement, purchase, click, swift, volatile"
```

---

## Task 9: Layer 1d — Add Scene Transition Audio Bridges

**Files:**
- Modify: `src/systems/AudioSystem.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/ActIntermissionScene.ts`
- Modify: `src/systems/music/ProceduralMusicEngine.ts`

- [ ] **Step 1: Read audio transition code**

Read:
- `src/systems/AudioSystem.ts` — find `startAmbientWind` and `stopAmbientWind` methods
- `src/scenes/GameScene.ts` — find the shutdown handler (events.once shutdown) and the game-over trigger path
- `src/scenes/ActIntermissionScene.ts` — find create() method to check current audio state
- `src/systems/music/ProceduralMusicEngine.ts` — read fadeOut (lines 302-317) and stop (lines 278-288)

- [ ] **Step 2: Add fadeOutAmbientWind method to AudioSystem**

In `src/systems/AudioSystem.ts`, add a new method near the existing `stopAmbientWind`:

```typescript
/**
 * Fade ambient wind to silence over the given duration.
 * Used for crossfade transitions (menu→game). No-op if wind is not playing.
 */
fadeOutAmbientWind(ms: number): void {
  if (!this.windSource || !this.windGain) return;
  const ctx = getAudioContext();
  this.windGain.gain.linearRampToValueAtTime(0, ctx.currentTime + ms / 1000);
  const src = this.windSource;
  const gain = this.windGain;
  setTimeout(() => {
    try { src.stop(); } catch { /* already stopped */ }
    try { gain.disconnect(); } catch { /* already disconnected */ }
  }, ms + 100);
  this.windSource = null;
  this.windGain = null;
}
```

Also add an optional volume parameter to `startAmbientWind`:

```typescript
startAmbientWind(volume?: number): void {
  // Use (volume ?? 0.08) instead of hardcoded 0.08 for the target gain
  // ... rest of existing implementation
}
```

- [ ] **Step 3: Wire Menu → Game crossfade**

In `src/scenes/GameScene.ts` create method, before `musicEngine.start()` (line 1024), add:

```typescript
audio.fadeOutAmbientWind(800);
```

This starts the wind fade-out while music fades in, creating an 800ms overlap instead of silence gap.

- [ ] **Step 4: Wire Game → Shop music fadeout**

In `src/scenes/GameScene.ts`, find the transition path to Shop. In the shutdown handler, add conditional music fadeout:

```typescript
// If transitioning to Shop (not GameOver), fade music gracefully
if (musicEngine.isPlaying()) {
  musicEngine.fadeOut(600);
}
```

Read the existing shutdown handler to understand where to place this — it must happen before the existing cleanup operations.

- [ ] **Step 5: Wire Game → GameOver music fadeout**

Find the game-over trigger path in GameScene (the `startGameOverScene` callback or the death handling code). Before the scene transition, add:

```typescript
musicEngine.fadeOut(800);
```

- [ ] **Step 6: Add ambient wind to ActIntermissionScene**

In `src/scenes/ActIntermissionScene.ts` create() method, add:

```typescript
audio.startAmbientWind(0.04);  // half volume — subtle continuity
```

And in the shutdown handler (or add one if missing):

```typescript
this.events.once('shutdown', () => {
  audio.fadeOutAmbientWind(400);
});
```

- [ ] **Step 7: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Manual test — play through scene transitions**

Start dev server. Test these transitions:
1. Menu → Game: wind should smoothly crossfade into music (no silence gap)
2. Game → Shop: music should fade before shop drone starts
3. Game → GameOver: music should fade to silence (no abrupt cut)
4. Boss kill → Intermission: subtle wind should play during route selection

- [ ] **Step 9: Commit**

```bash
git add src/systems/AudioSystem.ts src/scenes/GameScene.ts src/scenes/ActIntermissionScene.ts src/systems/music/ProceduralMusicEngine.ts
git commit -m "fix(audio): add scene transition crossfades — wind↔music bridges, intermission ambient"
```

---

## Task 10: Layer 1d — Orchestrate Boss Arrival Sting

**Files:**
- Modify: `src/systems/AudioSystem.ts`

- [ ] **Step 1: Read boss audio methods**

Read `src/systems/AudioSystem.ts` — find `playBossWarning` and `playBossFanfare` methods. Note their durations and ducking behavior.

- [ ] **Step 2: Create playBossArrival orchestration method**

Add a new method that sequences the two existing methods:

```typescript
/**
 * Orchestrated boss entrance — warning swell into fanfare.
 * Replaces calling playBossWarning + playBossFanfare separately.
 * Warning plays first (1.5s swell), fanfare starts at swell peak.
 */
playBossArrival(): void {
  this.playBossWarning();
  setTimeout(() => {
    this.playBossFanfare();
  }, 1400); // Fanfare starts just before warning peaks
}
```

- [ ] **Step 3: Find and update call sites**

Search for where `playBossWarning` and `playBossFanfare` are called. If they're called separately in sequence, replace with single `playBossArrival()` call. If they're called from different contexts, wire `playBossArrival` into the boss spawn path.

- [ ] **Step 4: Run build + test boss spawn**

Run: `npm run build`
Expected: PASS

In dev server, trigger a boss spawn and verify the warning→fanfare sequence sounds orchestrated, not competing.

- [ ] **Step 5: Commit**

```bash
git add src/systems/AudioSystem.ts
git commit -m "fix(audio): orchestrate boss arrival — sequence warning swell into fanfare with 1.4s gap"
```

Find and update any call sites in other files if needed — add those to the commit.

---

## Task 11: Layer 2 — Migrate Scene Inline Colors (Batch 1: Chronicle + GameOver)

**Files:**
- Modify: `src/scenes/ChronicleScene.ts`
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/gameOverPanelTheme.ts`
- Modify: `src/scenes/gameOverVariantChip.ts`

These two scenes have the most inline hex colors (~22 combined).

- [ ] **Step 1: Read ChronicleScene for all inline hex strings**

Read `src/scenes/ChronicleScene.ts`. Search for all `'#` and `0x` color literals. Map each to the appropriate `COLORS_CSS.*` or `COLORS.*` constant from Task 1.

- [ ] **Step 2: Migrate ChronicleScene colors**

Replace each inline hex with the named constant. Import `COLORS_CSS` from `../config`. Examples:
- `'#cdd4e0'` → `COLORS_CSS.TEXT_BRIGHT`
- `'#7f8ca7'` → `COLORS_CSS.TEXT_SUBTITLE`
- `'#e4e9f0'` → `COLORS_CSS.TEXT_BRIGHT`
- `'#c4cdd8'` → `COLORS_CSS.TEXT_PRIMARY`
- `'#596780'` → `COLORS_CSS.TEXT_DIM`
- `'#8a93a8'` → `COLORS_CSS.TEXT_MUTED`
- `'#c8a0a0'` → `COLORS_CSS.CURSE_MAUVE`
- `'#e8a0c6'` → `COLORS_CSS.CURSE_MAUVE_BRIGHT`
- `'#8097c2'` → `COLORS_CSS.TEXT_MUTED` (close enough)

For any color that doesn't match a new constant exactly, find the nearest semantic match. If truly unique, keep it but add a comment explaining why.

- [ ] **Step 3: Read and migrate GameOverScene colors**

Same process for `src/scenes/GameOverScene.ts`. Also migrate:
- `src/scenes/gameOverPanelTheme.ts` — `'#f7c270'` → `COLORS_CSS.REWARD_GOLD` or close match, `'#c8a0a0'` → `COLORS_CSS.CURSE_MAUVE`
- `src/scenes/gameOverVariantChip.ts` — `'#d7e3ff'` → `COLORS_CSS.TEXT_BRIGHT` (close), `'#8a9ab8'` → `COLORS_CSS.TEXT_MUTED`

- [ ] **Step 4: Run build + tests**

Run: `npm run build && npm test`
Expected: PASS — no type errors, no test regressions

- [ ] **Step 5: Visual spot-check**

Start dev server. Navigate to Chronicle and GameOver screens. Verify colors look correct — should be visually identical or extremely close to before (we're replacing inline values with named constants holding the same or very similar values).

- [ ] **Step 6: Commit**

```bash
git add src/scenes/ChronicleScene.ts src/scenes/GameOverScene.ts src/scenes/gameOverPanelTheme.ts src/scenes/gameOverVariantChip.ts
git commit -m "fix(palette): migrate Chronicle + GameOver inline colors to named COLORS_CSS constants"
```

---

## Task 12: Layer 2 — Migrate Scene Inline Colors (Batch 2: Menu, Pause, Settings, Curse, Boot, Misc)

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/PauseMenu.ts` (or `src/game/PauseMenu.ts` — verify path)
- Modify: `src/scenes/CurseScene.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/menuFooterPalette.ts`
- Modify: `src/systems/comboDisplay.ts`
- Modify: `src/systems/damageNumberStyle.ts`
- Modify: `src/scenes/installRunIntroFx.ts` (or wherever located — verify path)

- [ ] **Step 1: Read each file, identify inline hex colors**

For each file listed, read and map inline hex strings to named constants:
- MenuScene: `'#9fb0cf'` → `COLORS_CSS.TEXT_SECONDARY`, `'#c4dcff'` → `COLORS_CSS.TEXT_PRIMARY`
- PauseMenu: `'#8a7a6a'` → `COLORS_CSS.STATUS_TAN`, `'#bbbbbb'` → `COLORS_CSS.COOL_GREY`, `'#7a8a98'` → `COLORS_CSS.TEXT_SUBTITLE`
- CurseScene: `'#c0a8b6'` → `COLORS_CSS.CURSE_MAUVE`
- BootScene: `'#8a7a5a'` → `COLORS_CSS.STATUS_TAN`
- menuFooterPalette: `'#556280'` → `COLORS_CSS.TEXT_DIM`, etc.
- comboDisplay: `'#e8a830'` → `COLORS_CSS.COMBO_AMBER`, `'#cc8822'` → keep or add, `'#ff8800'` → keep (hidden state)
- damageNumberStyle: `'#ffdd44'` → `COLORS_CSS.CRIT_GOLD`, `'#e8c848'` → keep or add as `COLORS_CSS.WARM_TAN` variant
- installRunIntroFx: `'#a09890'` → `COLORS_CSS.STATUS_TAN` or close

- [ ] **Step 2: Migrate all files**

Apply replacements. Import `COLORS_CSS` where not already imported.

- [ ] **Step 3: Run build + tests**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/scenes/MenuScene.ts src/scenes/CurseScene.ts src/scenes/BootScene.ts src/systems/comboDisplay.ts src/systems/damageNumberStyle.ts
git add <any other modified files>
git commit -m "fix(palette): migrate remaining scene/system inline colors to named constants"
```

---

## Task 13: Layer 2 — Wire Disabled Button State in Shop Scenes

**Files:**
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/scenes/MetaShopScene.ts`

- [ ] **Step 1: Read ShopScene buy button code**

Read `src/scenes/ShopScene.ts` around line 175. Find where `disableInteractive()` is called and understand the button creation context.

- [ ] **Step 2: Wire setGameButtonDisabled in ShopScene**

Import `setGameButtonDisabled` from `../ui/gameButton`. Replace the bare `disableInteractive()` call with:

```typescript
setGameButtonDisabled(buyButton, !canAfford, buyFill, buyHover);
```

Where `buyFill` and `buyHover` are the idle/hover fill colors used when creating the button.

- [ ] **Step 3: Read and wire MetaShopScene**

Same pattern for `src/scenes/MetaShopScene.ts` around line 191.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Visual verification**

Start dev server. Go to Shop with insufficient gold. Verify disabled buy buttons look dimmed (alpha reduced, not clickable). Buy something, verify enabled buttons restore to full appearance.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/ShopScene.ts src/scenes/MetaShopScene.ts
git commit -m "fix(ui): wire visual disabled state for shop buy buttons when unaffordable"
```

---

## Task 14: Layer 2 — Create Pagination Nav Component + Migrate Scenes

**Files:**
- Create: `src/ui/gamePagination.ts`
- Create: `src/ui/gamePagination.test.ts`
- Modify: `src/scenes/ChronicleScene.ts`
- Modify: `src/scenes/MetaShopScene.ts`

- [ ] **Step 1: Read existing pagination UI in ChronicleScene and MetaShopScene**

Read `src/scenes/ChronicleScene.ts` — find the PREV/NEXT text creation and handlers.
Read `src/scenes/MetaShopScene.ts` lines 115-141 — find pagination section.

Note: `src/ui/pagination.ts` already has `paginationState()` for the math. The new file adds the **visual** component.

- [ ] **Step 2: Write test for gamePagination**

Create `src/ui/gamePagination.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildPaginationLayout } from './gamePagination';

describe('buildPaginationLayout', () => {
  it('returns prev/next enabled state from paginationState', () => {
    const layout = buildPaginationLayout(3, 10, 0);
    expect(layout.prevEnabled).toBe(false);
    expect(layout.nextEnabled).toBe(true);
    expect(layout.pageLabel).toBe('1 / 4');
  });

  it('page 3 of 4 enables both', () => {
    const layout = buildPaginationLayout(3, 10, 2);
    expect(layout.prevEnabled).toBe(true);
    expect(layout.nextEnabled).toBe(true);
  });

  it('single page hides pagination', () => {
    const layout = buildPaginationLayout(2, 10, 0);
    expect(layout.pageVisible).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/ui/gamePagination.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement gamePagination.ts**

Create `src/ui/gamePagination.ts`:

```typescript
import type Phaser from 'phaser';
import { paginationState } from './pagination';
import { createGameButton } from './gameButton';
import { textStyle } from './typography';

/**
 * Pure layout calculator — reuses paginationState but adds the
 * fields the UI component needs. Testable without Phaser.
 */
export function buildPaginationLayout(
  totalItems: number,
  perPage: number,
  page: number,
) {
  return paginationState(totalItems, perPage, page);
}

/**
 * Render a prev/page/next navigation row. Returns cleanup destroy fn.
 * Uses tertiary-tier mini-buttons for prev/next, centered page label.
 */
export function createPaginationNav(
  scene: Phaser.Scene,
  x: number,
  y: number,
  totalItems: number,
  perPage: number,
  page: number,
  onPageChange: (newPage: number) => void,
): { destroy: () => void } {
  const state = paginationState(totalItems, perPage, page);
  const objects: Phaser.GameObjects.GameObject[] = [];

  if (!state.pageVisible) return { destroy: () => {} };

  const prevBtn = createGameButton(scene, {
    x: x - 80, y, width: 38, height: 32,
    label: '◀', tier: 'tertiary', fontSize: '14px',
  });
  if (state.prevEnabled) {
    prevBtn.rect.on('pointerdown', () => onPageChange(state.clampedPage - 1));
  } else {
    prevBtn.rect.setAlpha(0.4);
    prevBtn.label.setAlpha(0.4);
    prevBtn.rect.disableInteractive();
  }
  objects.push(prevBtn.rect, prevBtn.label);

  const pageLabel = scene.add
    .text(x, y, state.pageLabel, textStyle('label'))
    .setOrigin(0.5);
  objects.push(pageLabel);

  const nextBtn = createGameButton(scene, {
    x: x + 80, y, width: 38, height: 32,
    label: '▶', tier: 'tertiary', fontSize: '14px',
  });
  if (state.nextEnabled) {
    nextBtn.rect.on('pointerdown', () => onPageChange(state.clampedPage + 1));
  } else {
    nextBtn.rect.setAlpha(0.4);
    nextBtn.label.setAlpha(0.4);
    nextBtn.rect.disableInteractive();
  }
  objects.push(nextBtn.rect, nextBtn.label);

  return {
    destroy: () => objects.forEach((o) => o.destroy()),
  };
}
```

- [ ] **Step 5: Run test**

Run: `npx vitest run src/ui/gamePagination.test.ts`
Expected: PASS

- [ ] **Step 6: Migrate ChronicleScene pagination**

In `src/scenes/ChronicleScene.ts`, find the bare-text PREV/NEXT creation. Replace with `createPaginationNav()`. Store the returned object for cleanup on page change or scene shutdown.

- [ ] **Step 7: Migrate MetaShopScene pagination**

Same in `src/scenes/MetaShopScene.ts` lines 115-141.

- [ ] **Step 8: Run build + visual test**

Run: `npm run build`
Expected: PASS

Start dev server. Navigate to Chronicle and MetaShop — verify pagination shows styled prev/next buttons with correct enabled/disabled states.

- [ ] **Step 9: Commit**

```bash
git add src/ui/gamePagination.ts src/ui/gamePagination.test.ts src/scenes/ChronicleScene.ts src/scenes/MetaShopScene.ts
git commit -m "feat(ui): add createPaginationNav component, migrate Chronicle + MetaShop pagination"
```

---

## Task 15: Layer 2 — Create Toggle Factory + Migrate Scenes

**Files:**
- Create: `src/ui/gameToggle.ts`
- Create: `src/ui/gameToggle.test.ts`
- Modify: `src/scenes/MenuScene.ts:520-553`
- Modify: `src/scenes/SettingsScene.ts`

- [ ] **Step 1: Read MenuScene toggle code**

Read `src/scenes/MenuScene.ts` lines 520-553 — the `createToggle` method. Note the interface, state management, and visual behavior.

- [ ] **Step 2: Read SettingsScene toggle code**

Read `src/scenes/SettingsScene.ts` lines 526-652 — the `addToggleRow` method. Identify which settings are boolean on/off (these migrate) vs continuous sliders (these stay).

- [ ] **Step 3: Write test**

Create `src/ui/gameToggle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
// Test the pure state logic, not Phaser rendering
import { resolveToggleVisual } from './gameToggle';

describe('resolveToggleVisual', () => {
  it('returns ON colors when value is true', () => {
    const v = resolveToggleVisual(true);
    expect(v.trackColor).not.toBe(v.trackColorOff);
    expect(v.thumbX).toBeGreaterThan(0);
  });

  it('returns OFF colors when value is false', () => {
    const v = resolveToggleVisual(false);
    expect(v.thumbX).toBeLessThan(0);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/ui/gameToggle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 5: Implement gameToggle.ts**

Create `src/ui/gameToggle.ts`:

```typescript
import type Phaser from 'phaser';
import { COLORS } from '../config';
import { textStyle } from './typography';
import { audio } from '../systems/AudioSystem';

const TRACK_W = 40;
const TRACK_H = 20;
const THUMB_R = 8;
const TRACK_ON = COLORS.SCOTTISH_BLUE;
const TRACK_OFF = COLORS.PANEL_SURFACE;
const TRACK_HOVER_ON = 0x0077dd;
const TRACK_HOVER_OFF = 0x252540;

/** Pure visual state — testable without Phaser. */
export function resolveToggleVisual(on: boolean) {
  return {
    trackColor: on ? TRACK_ON : TRACK_OFF,
    trackColorOff: TRACK_OFF,
    trackHover: on ? TRACK_HOVER_ON : TRACK_HOVER_OFF,
    thumbX: on ? TRACK_W / 2 - THUMB_R : -(TRACK_W / 2 - THUMB_R),
  };
}

export interface GameToggleOpts {
  x: number;
  y: number;
  width?: number;
  label: string;
  initialValue: boolean;
  onChange: (value: boolean) => void;
}

export interface GameToggleResult {
  container: Phaser.GameObjects.Container;
  setValue: (on: boolean) => void;
  destroy: () => void;
}

/**
 * Unified boolean toggle — replaces ad-hoc text toggles in Menu
 * and custom slider toggles in Settings (for on/off only).
 */
export function createGameToggle(
  scene: Phaser.Scene,
  opts: GameToggleOpts,
): GameToggleResult {
  let on = opts.initialValue;

  const label = scene.add
    .text(-60, 0, opts.label, textStyle('label'))
    .setOrigin(1, 0.5);

  const track = scene.add
    .rectangle(0, 0, TRACK_W, TRACK_H, on ? TRACK_ON : TRACK_OFF)
    .setInteractive({ useHandCursor: true });

  const thumb = scene.add
    .circle(on ? TRACK_W / 2 - THUMB_R : -(TRACK_W / 2 - THUMB_R), 0, THUMB_R, 0xffffff);

  const container = scene.add.container(opts.x, opts.y, [label, track, thumb]);

  function updateVisual() {
    const v = resolveToggleVisual(on);
    track.setFillStyle(v.trackColor);
    thumb.setX(v.thumbX);
  }

  track.on('pointerover', () => {
    const v = resolveToggleVisual(on);
    track.setFillStyle(v.trackHover);
  });
  track.on('pointerout', () => {
    const v = resolveToggleVisual(on);
    track.setFillStyle(v.trackColor);
  });
  track.on('pointerdown', () => {
    on = !on;
    updateVisual();
    audio.playClick();
    opts.onChange(on);
  });

  return {
    container,
    setValue: (val: boolean) => { on = val; updateVisual(); },
    destroy: () => container.destroy(),
  };
}
```

- [ ] **Step 6: Run test**

Run: `npx vitest run src/ui/gameToggle.test.ts`
Expected: PASS

- [ ] **Step 7: Migrate MenuScene toggles**

In `src/scenes/MenuScene.ts`, replace the `createToggle` method body (lines ~520-553) with calls to `createGameToggle()`. Match the existing callback behavior.

- [ ] **Step 8: Migrate SettingsScene boolean toggles**

In `src/scenes/SettingsScene.ts`, identify which `addToggleRow` calls are boolean on/off (SFX, Music, Damage Numbers, Film Grain, etc.). Replace those with `createGameToggle()`. Leave volume sliders as-is.

- [ ] **Step 9: Run build + visual test**

Run: `npm run build`
Expected: PASS

Start dev server. Check Menu toggles and Settings toggles — both should show the same visual toggle component (track + thumb). Click to verify state changes work.

- [ ] **Step 10: Commit**

```bash
git add src/ui/gameToggle.ts src/ui/gameToggle.test.ts src/scenes/MenuScene.ts src/scenes/SettingsScene.ts
git commit -m "feat(ui): add createGameToggle factory, unify Menu + Settings boolean toggles"
```

---

## Task 16: Layer 2 — Migrate ActIntermission Route Cards

**Files:**
- Create: `src/ui/routeCard.ts`
- Modify: `src/scenes/ActIntermissionScene.ts`

- [ ] **Step 1: Read ActIntermissionScene card creation code**

Read `src/scenes/ActIntermissionScene.ts` — find the full route card creation section (~lines 96-118 and surrounding context). Note the rectangle creation, stroke styling, text content, hover handlers, and selection behavior.

- [ ] **Step 2: Extract route card into src/ui/routeCard.ts**

Create `src/ui/routeCard.ts` that encapsulates the route card visual. Use:
- `COLORS.PANEL_SURFACE` for background fill
- `resolveActIntermissionCardStyle()` for accent stroke (import existing resolver)
- `attachButtonHoverFill()` for hover (import from buttonHover)
- `textStyle()` for all text content

The function should accept a `RouteDef`, position, dimensions, and `onSelect` callback. Return the created game objects for cleanup.

- [ ] **Step 3: Wire into ActIntermissionScene**

Replace the inline rectangle + text creation in ActIntermissionScene with calls to the new route card component. Maintain all existing selection logic.

- [ ] **Step 4: Run build + visual test**

Run: `npm run build`
Expected: PASS

Start dev server. Play until a boss kill triggers the intermission. Verify:
- Route cards display correctly with proper text
- Hover effects work (consistent with other buttons)
- Selection works and game continues

- [ ] **Step 5: Commit**

```bash
git add src/ui/routeCard.ts src/scenes/ActIntermissionScene.ts
git commit -m "feat(ui): extract route card component, migrate ActIntermission to unified button/panel patterns"
```

---

## Task 17: Layer 2 — Migrate Panel Strokes Across Scenes

**Files:**
- Modify: Multiple scene files that use `setStrokeStyle`

- [ ] **Step 1: Find all setStrokeStyle calls**

Search across all scene and UI files for `setStrokeStyle`. List each occurrence with file, line, and current stroke values.

- [ ] **Step 2: Migrate each to PANEL_STROKE presets**

For each `setStrokeStyle` call, determine whether it should use `PANEL_STROKE.standard` or `PANEL_STROKE.accent`:
- Standard (dark blue, most panels): menu panels, game over panels, settings, chronicle
- Accent (gold, highlighted elements): curse tiles, active selections

Import `PANEL_STROKE` from `../ui/panelStyle` and replace inline values:
```typescript
// Before:
rect.setStrokeStyle(2, 0x2a3450, 0.8);
// After:
rect.setStrokeStyle(PANEL_STROKE.standard.width, PANEL_STROKE.standard.color, PANEL_STROKE.standard.alpha);
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add <modified scene files>
git commit -m "fix(ui): migrate panel strokes to PANEL_STROKE presets for unified borders"
```

---

## Task 18: Layer 2 — Migrate JuiceSystem to Toast Palette + Timing Presets

**Files:**
- Modify: `src/systems/JuiceSystem.ts`

- [ ] **Step 1: Read JuiceSystem toast calls**

Read `src/systems/JuiceSystem.ts`. Find every `showToast` call and note its inline color string. Find ring expansion durations and flash durations.

- [ ] **Step 2: Migrate toast colors**

Import `TOAST_COLORS` from `../ui/toastPalette`. Replace each inline toast color:
- Gold pickup/milestone toasts → `TOAST_COLORS.reward`
- Evolution/legendary toasts → `TOAST_COLORS.legendary`
- Weapon acquire / heal toasts → `TOAST_COLORS.positive`
- Status info toasts → `TOAST_COLORS.info`

- [ ] **Step 3: Migrate timing values**

Import from `../systems/effectTimingPresets`. Replace inline timing numbers where they match preset categories:
- Kill burst ring: `200` → `RING_TIMING.tight`
- Weapon acquire ring: → `RING_TIMING.medium`
- Boss/evolution rings: → `RING_TIMING.grand`
- Flash durations: match to `FLASH_TIMING.*`

Only replace values that clearly map to a preset. Don't force-fit unique timings.

- [ ] **Step 4: Ensure scaledParticleCount usage**

Find any hardcoded particle counts (kill burst, moor moment, chest collect) that should use `scaledParticleCount()`. Wrap them.

- [ ] **Step 5: Unify pickup pulse rates**

Find all `pulsePickupGlow()` calls (treasure chest, golden chest, health orb). Unify to scale 1.5, duration 700ms for all three. Currently treasure=1.5/800, golden=1.6/700, orb=1.4/600. The visual distinction comes from color and size, not pulse rate.

- [ ] **Step 6: Run build + tests**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/systems/JuiceSystem.ts
git commit -m "fix(vfx): migrate JuiceSystem to toast palette + timing presets, unify pickup pulses, ensure a11y particle scaling"
```

---

## Task 19: Layer 3 — Full Integration Test Pass

**Files:** None modified — this is verification only.

- [ ] **Step 1: Run full test suite**

Run: `npm run ci`
Expected: Lint PASS, Vitest PASS, Build PASS

- [ ] **Step 2: Run E2E tests**

Run: `npm run build && npm run test:e2e`
Expected: All E2E smoke tests PASS

- [ ] **Step 3: Manual play-through — visual continuity**

Start dev server. Play a full run checking:
- [ ] All 3 button tiers look consistent across every scene
- [ ] Disabled shop buttons are visually dimmed
- [ ] Pagination in Chronicle and MetaShop matches
- [ ] Toggles in Menu and Settings match
- [ ] Panel strokes are uniform
- [ ] Enemy tartans are unified HIGHLAND_TARTAN (muted red/green/gold)
- [ ] Player kilt matches selected variant across menu preview, in-game, and upgrade card

- [ ] **Step 4: Manual play-through — audio continuity**

- [ ] Menu → Game transition: smooth crossfade, no silence
- [ ] Level-up SFX: consonant with music (A-C-E arpeggio)
- [ ] Card reveal: consonant (G-A-D)
- [ ] Purchase ding: consonant (D→A sweep)
- [ ] Menu click: warm G4, not piercing
- [ ] Boss arrival: orchestrated warning → fanfare sequence
- [ ] Game → Shop: music fades before shop drone
- [ ] Game → GameOver: music fades to silence
- [ ] Intermission: subtle wind ambient

- [ ] **Step 5: Verify no inline hex colors remain in scenes**

Run a search for orphan inline hex strings in scene files:
```bash
grep -rn "'#[0-9a-fA-F]\{6\}'" src/scenes/ --include="*.ts" | grep -v "import\|COLORS_CSS\|test"
```

Any remaining hits should be justified or migrated.

- [ ] **Step 6: Commit any fixes found during integration testing**

If any issues are found, fix and commit with descriptive messages.

---

## Task 20: Final — Run CI Gate + Commit Summary

- [ ] **Step 1: Run full CI**

Run: `npm run ci`
Expected: PASS

- [ ] **Step 2: Verify git log**

Run: `git log --oneline -20`
Expected: Clean sequence of descriptive commits from this polish pass.

- [ ] **Step 3: Run E2E one final time**

Run: `npm run build && npm run test:e2e`
Expected: PASS

---

## Execution Order Summary

```
Task 1:  Layer 0 — Palette constants (BOTTLENECK — do first)
    ├── Task 2-3:   Layer 1a — Highland tartan + enemy migration
    ├── Task 4-6:   Layer 1b — Disabled buttons, panel presets, toast palette
    ├── Task 7:     Layer 1c — Effect timing presets
    └── Task 8-10:  Layer 1d — SFX frequencies, crossfades, boss sting
Task 11-12: Layer 2 — Scene color migrations (batch 1 + 2)
Task 13:    Layer 2 — Disabled buttons in shops
Task 14:    Layer 2 — Pagination component + migration
Task 15:    Layer 2 — Toggle factory + migration
Task 16:    Layer 2 — Route card extraction
Task 17:    Layer 2 — Panel stroke migration
Task 18:    Layer 2 — JuiceSystem toast/timing migration
Task 19:    Layer 3 — Integration testing
Task 20:    Final CI gate
```

Tasks 2-10 are independent after Task 1 and can be parallelized.
Tasks 11-18 can be parallelized after their Layer 1 dependencies.
