# W95 Phase 0 — Mobile Safe-Area Pass

> **STATUS:** ✅ SHIPPED 2026-04-22 — Phase 0 safe-area pass; full W95 mobile rework remains a separate flagship blocked on T203 device matrix (see [`docs/MOBILE_DEVICE_TEST_MATRIX.md`](../../MOBILE_DEVICE_TEST_MATRIX.md) + [`docs/OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q7).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the game visually playable on notched phones + gesture-nav Androids without UI clipping. Tight scope; full W95 mobile-posture remains a separate flagship.

**Architecture:** Two edits. (1) CSS `env(safe-area-inset-*)` padding so fixed UI can't live under notches or gesture bars. (2) Joystick spawn clamp that keeps the thumb origin inside the safe area. Everything else — touch-target sizes, orientation reflow, HUD anchoring — already works per the mobile-readiness scan.

**Tech Stack:** HTML/CSS, TypeScript, Phaser 3 InputManager.

**Spec**: this file is spec + plan combined given the tiny scope. Design context was captured via the mobile-readiness Explore scan; see session log.

---

## Why only these two

Mobile-readiness scan found:
- ✅ Touch targets already ≥44×44 everywhere (no fix needed)
- ✅ Phaser `RESIZE` scale + anchor-based HUD already reflow portrait/landscape cleanly
- ✅ `cameraViewport.ts` runtime inset math clips UI reactively
- ❌ No CSS `env(safe-area-inset-*)` padding — notched phones clip fixed UI preemptively
- ❌ Joystick spawns at pointerdown location — can land under a notch or in the OS gesture zone

Kill criterion check later: a human plays a full run on a notched iPhone and a gesture-nav Android and **never has a UI element clipped by hardware UI**.

---

## Task 1: CSS safe-area insets

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add safe-area CSS to the existing inline `<style>` block**

In `index.html`, replace the current style block:

```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
  canvas { display: block; }
</style>
```

With:

```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #1a1a2e;
    /* W95 Phase 0: respect notch + gesture-bar insets on iOS/Android. */
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
  }
  canvas { display: block; }
</style>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS. No type issues — HTML-only change.

- [ ] **Step 3: Verify e2e still passes**

Run: `npm run test:e2e`
Expected: PASS — the 11 existing Playwright specs. Safe-area padding is transparent to desktop viewports (env() values are 0 there).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(mobile): apply safe-area insets to game container (W95 Phase 0)"
```

## Discipline for Task 1

- Do NOT touch `viewport-fit=cover` — already set correctly in the `<meta>` tag.
- Do NOT add a wrapper `<div>` around the canvas. Phaser manages its own DOM. Padding the body element is enough.
- Do NOT set `env()` fallbacks to hardcoded pixel values — the fallback is `0`, which is what we want on non-notched devices.

---

## Task 2: Joystick spawn safe-area clamp

**Files:**
- Modify: `src/core/InputManager.ts` (the joystick code)
- Modify: `src/core/InputManager.test.ts` or nearby pure-helper test file (if a thumb-zone helper is extracted)

- [ ] **Step 1: Read the joystick setup**

```bash
grep -n "setupTouchInput\|VirtualJoystick\|joystick\|pointerdown\|isTouchDevice" src/core/InputManager.ts | head -30
```

Confirm:
- Where `pointerdown` handler sets the joystick origin
- Whether there's a separate module for the joystick or it's inline in InputManager
- Whether input-math helpers are already extracted (look in `src/core/inputMath.ts` if mentioned)

- [ ] **Step 2: Extract a clamp helper (pure, testable)**

Add a pure function in `src/core/inputMath.ts` (or create if it doesn't exist):

```typescript
/**
 * W95 Phase 0 — clamp a touch-origin point so the joystick base + thumb
 * radius stays fully inside the viewport, with an additional safe-area
 * margin on each edge. Prevents the joystick spawning under a notch or
 * in the bottom gesture-bar zone where thumb drag is ambiguous.
 *
 * All coordinates are viewport-local (CSS pixels, pre-Phaser scaling).
 */
export interface ViewportSafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function clampJoystickOrigin(
  raw: { x: number; y: number },
  viewport: { width: number; height: number },
  insets: ViewportSafeInsets,
  joystickRadius: number,
): { x: number; y: number } {
  const minX = insets.left + joystickRadius;
  const maxX = viewport.width - insets.right - joystickRadius;
  const minY = insets.top + joystickRadius;
  const maxY = viewport.height - insets.bottom - joystickRadius;

  return {
    x: Math.max(minX, Math.min(maxX, raw.x)),
    y: Math.max(minY, Math.min(maxY, raw.y)),
  };
}
```

- [ ] **Step 3: Write tests for the clamp**

If `src/core/inputMath.test.ts` already exists, append. Otherwise create:

```typescript
import { describe, expect, it } from 'vitest';
import { clampJoystickOrigin } from './inputMath';

describe('clampJoystickOrigin', () => {
  const viewport = { width: 400, height: 800 };
  const insets = { top: 50, right: 0, bottom: 34, left: 0 };  // iPhone-ish
  const radius = 60;

  it('passes through points already inside the safe region', () => {
    const result = clampJoystickOrigin({ x: 200, y: 400 }, viewport, insets, radius);
    expect(result).toEqual({ x: 200, y: 400 });
  });

  it('clamps points under the notch (top inset)', () => {
    const result = clampJoystickOrigin({ x: 100, y: 20 }, viewport, insets, radius);
    expect(result.y).toBe(50 + 60);  // top inset + radius
  });

  it('clamps points in the gesture-bar zone (bottom inset)', () => {
    const result = clampJoystickOrigin({ x: 100, y: 790 }, viewport, insets, radius);
    expect(result.y).toBe(800 - 34 - 60);  // height - bottom inset - radius
  });

  it('clamps points off the left edge', () => {
    const result = clampJoystickOrigin({ x: 10, y: 400 }, viewport, insets, radius);
    expect(result.x).toBe(60);  // left inset 0 + radius
  });

  it('clamps points off the right edge', () => {
    const result = clampJoystickOrigin({ x: 395, y: 400 }, viewport, insets, radius);
    expect(result.x).toBe(340);  // 400 - 0 - 60
  });

  it('handles zero insets (non-notched device)', () => {
    const flat = { top: 0, right: 0, bottom: 0, left: 0 };
    const result = clampJoystickOrigin({ x: 10, y: 10 }, viewport, flat, radius);
    expect(result).toEqual({ x: 60, y: 60 });
  });
});
```

- [ ] **Step 4: Run failing tests**

Run: `npx vitest run src/core/inputMath.test.ts`
Expected: PASS — the tests lock in clamp behaviour. If `clampJoystickOrigin` doesn't exist yet, step 2 creates it.

- [ ] **Step 5: Add a runtime inset reader + use it in InputManager**

In `src/core/InputManager.ts` (or the joystick module), add a helper to read live safe-area insets from CSS:

```typescript
function readViewportSafeInsets(): ViewportSafeInsets {
  if (typeof window === 'undefined' || !window.getComputedStyle) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const style = getComputedStyle(document.documentElement);
  const parsePx = (s: string): number => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    top: parsePx(style.getPropertyValue('--safe-top')) || parseCssEnv('safe-area-inset-top'),
    right: parsePx(style.getPropertyValue('--safe-right')) || parseCssEnv('safe-area-inset-right'),
    bottom: parsePx(style.getPropertyValue('--safe-bottom')) || parseCssEnv('safe-area-inset-bottom'),
    left: parsePx(style.getPropertyValue('--safe-left')) || parseCssEnv('safe-area-inset-left'),
  };
}

function parseCssEnv(name: string): number {
  // env() values aren't directly readable. We synthesise by measuring
  // the body's padding that Task 1 applied.
  if (typeof document === 'undefined') return 0;
  const body = document.body;
  if (!body) return 0;
  const style = getComputedStyle(body);
  switch (name) {
    case 'safe-area-inset-top': return parseFloat(style.paddingTop) || 0;
    case 'safe-area-inset-right': return parseFloat(style.paddingRight) || 0;
    case 'safe-area-inset-bottom': return parseFloat(style.paddingBottom) || 0;
    case 'safe-area-inset-left': return parseFloat(style.paddingLeft) || 0;
    default: return 0;
  }
}
```

Task 1's CSS puts `env(safe-area-inset-*)` values onto the body's padding, so reading `computedStyle(body).paddingTop` gives us the actual pixel value.

Find where the joystick origin is set on pointerdown. Replace the direct assignment with a clamp call:

```typescript
// Before:
// this.joystickOrigin = { x: pointer.x, y: pointer.y };

// After:
const insets = readViewportSafeInsets();
const viewport = {
  width: this.scene.game.canvas.clientWidth,
  height: this.scene.game.canvas.clientHeight,
};
const JOYSTICK_BASE_RADIUS = 60;  // match existing constant
this.joystickOrigin = clampJoystickOrigin(
  { x: pointer.x, y: pointer.y },
  viewport,
  insets,
  JOYSTICK_BASE_RADIUS,
);
```

The exact field name (`joystickOrigin`, `base`, `anchor`, etc.) must match the local InputManager's existing naming. Look at the pointerdown handler's current assignment and adapt.

Add the import:
```typescript
import { clampJoystickOrigin, type ViewportSafeInsets } from './inputMath';
```

- [ ] **Step 6: Run build + tests**

Run: `npm run ci`
Expected: PASS — lint + 2949+ vitest (tests for clampJoystickOrigin added) + build.

- [ ] **Step 7: Commit**

```bash
git add src/core/InputManager.ts src/core/inputMath.ts src/core/inputMath.test.ts
git commit -m "feat(mobile): joystick spawn clamped to viewport safe area (W95 Phase 0)"
```

## Discipline for Task 2

- The clamp ONLY shifts the origin. It does not change drag behaviour, dead-zone, or max radius. All other joystick math stays identical.
- If the existing InputManager has a different coordinate space (Phaser-scaled vs CSS pixels), match what it already uses — the clamp function is coordinate-space-agnostic; just be consistent.
- Don't add new joystick features (knob visuals, deadzone tuning, haptic). Scope is the clamp ONLY.
- If `inputMath.ts` already exists with unrelated pure helpers, append; don't rewrite.

---

## Kill-criterion verification (no separate task)

Manual. Will require human playtest:
- Open the game on an iPhone 12 or later (notched)
- Rotate to landscape
- Verify HUD top-left HP bar is visible (not under the notch)
- Verify HUD bottom-center XP bar is visible (not under home-indicator)
- Tap bottom-left near the home-indicator zone — verify the joystick base renders at a thumb-reachable position, not clipped
- Repeat on Android with gesture nav

If any fails, file follow-up — but don't revert Phase 0. These changes are additive and safer than the pre-Phase-0 state regardless.

## Summary

Two tiny changes. Both additive. Both revertable independently. Together they turn "this compiles for mobile" into "this is actually playable on a notched phone."

Full W95 (portrait-native layout, gesture grammar, one-thumb control) remains its own multi-session flagship awaiting real playtest feedback.
