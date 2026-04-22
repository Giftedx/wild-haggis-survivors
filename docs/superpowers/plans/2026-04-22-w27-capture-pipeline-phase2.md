# W27 Capture Pipeline — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full-canvas PNG screenshot and rolling 15-second WebM clip export to the existing postcard capture surface, gated by a Comfort setting, following Phase 1 conventions.

**Architecture:** Two independent utility modules (`screenshot.ts`, `clipRecorder.ts`) + one shared filename helper + UI surfaces on GameOverScene and PauseMenu + keybinds. Rolling buffer model — always recording the last 15s when enabled, save-on-demand. Screenshot ships first (Phase 2a) to validate the integration pattern; clip follows (Phase 2b) with the MediaRecorder complexity.

**Tech Stack:** TypeScript, Phaser 3, Vitest, browser-native MediaRecorder + canvas.captureStream + canvas.toBlob. No new npm deps.

**Spec:** `docs/superpowers/specs/2026-04-22-w27-capture-pipeline-phase2-design.md`

---

## File Structure

### New files
- `src/utils/captureFilename.ts` — shared filename builder for both capture kinds
- `src/utils/captureFilename.test.ts` — filename shape tests
- `src/utils/screenshot.ts` — canvas→PNG one-shot saver (Phase 2a)
- `src/utils/screenshot.test.ts` — toBlob + anchor tests (Phase 2a)
- `src/utils/clipRecorder.ts` — MediaRecorder ring-buffer recorder (Phase 2b)
- `src/utils/clipRecorder.test.ts` — ring buffer + feature detect tests (Phase 2b)

### Modified files
- `src/core/SettingsManager.ts` — add `captureEnabled` flat field + coercion + default
- `src/scenes/SettingsScene.ts` — add capture toggle row
- `src/scenes/GameOverScene.ts` — add "Save frame" + "Save clip" buttons in footer
- `src/scenes/game/PauseMenu.ts` — add "Save screenshot" + "Save last 15s" entries
- `src/scenes/GameScene.ts` — construct + start/stop `ClipRecorder` per run
- `src/core/i18n.ts` — add capture UI + toast EN keys
- `src/core/i18n.scs.ts` — add capture UI + toast SCS keys
- `e2e/capture-smoke.spec.ts` — new Playwright smoke for clip save flow

---

## Phase 2a — Screenshot (lowest risk, validates the integration pattern)

### Task 1: Capture filename builder

**Files:**
- Create: `src/utils/captureFilename.ts`
- Create: `src/utils/captureFilename.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/captureFilename.test.ts
import { describe, expect, it } from 'vitest';
import { buildCaptureFilename } from './captureFilename';

describe('buildCaptureFilename', () => {
  it('builds a screenshot filename for a victory run', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'victory',
      variantLabel: 'Classic Haggis',
      timeSurvivedSec: 754,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_victory_classic-haggis_12m34s_2026-04-22.png');
  });

  it('builds a clip filename for a death run with a seed', () => {
    const name = buildCaptureFilename('clip', {
      mode: 'death',
      variantLabel: 'The Laird',
      timeSurvivedSec: 321,
      seedCode: 'AB12CD',
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_death_the-laird_05m21s_2026-04-22_AB12CD.webm');
  });

  it('omits variant slug when label is empty', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'death',
      variantLabel: '',
      timeSurvivedSec: 0,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_death_00m00s_2026-04-22.png');
  });

  it('strips path-hostile characters from variant label', () => {
    const name = buildCaptureFilename('screenshot', {
      mode: 'victory',
      variantLabel: 'Fancy / Haggis : Prime?',
      timeSurvivedSec: 61,
      dateYmd: '2026-04-22',
    });
    expect(name).toBe('whs_victory_fancy-haggis-prime_01m01s_2026-04-22.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/captureFilename.test.ts`
Expected: FAIL with "Cannot find module './captureFilename'"

- [ ] **Step 3: Implement the filename builder**

```typescript
// src/utils/captureFilename.ts
export type CaptureKind = 'screenshot' | 'clip';

export interface CaptureFilenamePayload {
  mode: 'victory' | 'death';
  variantLabel: string;
  timeSurvivedSec: number;
  seedCode?: string;
  dateYmd: string;
}

const EXTENSIONS: Record<CaptureKind, string> = {
  screenshot: 'png',
  clip: 'webm',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatMmSs(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${mm.toString().padStart(2, '0')}m${ss.toString().padStart(2, '0')}s`;
}

export function buildCaptureFilename(
  kind: CaptureKind,
  p: CaptureFilenamePayload,
): string {
  const parts: string[] = ['whs', p.mode];
  const slug = slugify(p.variantLabel);
  if (slug) parts.push(slug);
  parts.push(formatMmSs(p.timeSurvivedSec));
  parts.push(p.dateYmd);
  if (p.seedCode) parts.push(p.seedCode);
  return `${parts.join('_')}.${EXTENSIONS[kind]}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/captureFilename.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/captureFilename.ts src/utils/captureFilename.test.ts
git commit -m "feat(capture): shared filename builder for screenshot + clip"
```

---

### Task 2: Screenshot module

**Files:**
- Create: `src/utils/screenshot.ts`
- Create: `src/utils/screenshot.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/screenshot.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveScreenshot } from './screenshot';

describe('saveScreenshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves true and triggers a download when toBlob succeeds', async () => {
    const blob = new Blob(['fake-png-bytes'], { type: 'image/png' });
    const canvas = {
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(blob)),
    } as unknown as HTMLCanvasElement;

    const click = vi.fn();
    const anchor = { href: '', download: '', click, style: {} } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    (globalThis.URL as unknown as { createObjectURL: typeof createObjectURL; revokeObjectURL: typeof revokeObjectURL }).createObjectURL = createObjectURL;
    (globalThis.URL as unknown as { createObjectURL: typeof createObjectURL; revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    const ok = await saveScreenshot(canvas, 'my-run.png');

    expect(ok).toBe(true);
    expect(canvas.toBlob).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('my-run.png');
    expect(anchor.href).toBe('blob:fake');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('resolves false when toBlob returns null', async () => {
    const canvas = {
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
    } as unknown as HTMLCanvasElement;

    const ok = await saveScreenshot(canvas, 'my-run.png');

    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/screenshot.test.ts`
Expected: FAIL with "Cannot find module './screenshot'"

- [ ] **Step 3: Implement the screenshot saver**

```typescript
// src/utils/screenshot.ts
/**
 * W27 Phase 2a — one-shot canvas-to-PNG saver.
 *
 * Zero runtime cost until invoked. No buffer, no background work.
 */
export function saveScreenshot(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve(true);
    }, 'image/png');
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/screenshot.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/screenshot.ts src/utils/screenshot.test.ts
git commit -m "feat(capture): saveScreenshot utility — canvas to PNG download"
```

---

### Task 3: Capture i18n keys (EN + SCS, both phases together)

**Files:**
- Modify: `src/core/i18n.ts`
- Modify: `src/core/i18n.scs.ts`

Adding both phase 2a and 2b keys now prevents parity-fence churn when 2b lands.

- [ ] **Step 1: Add EN keys to `src/core/i18n.ts`**

Find the `ui.pause.*` block in the EN source map. After it, add (inside the same top-level map):

```typescript
'ui.pause.save_screenshot': 'Save screenshot',
'ui.pause.save_clip': 'Save last 15s',
'ui.gameover.save_frame': 'Save frame',
'ui.gameover.save_clip': 'Save clip',
'ui.settings.capture_enabled': 'Capture enabled',
'ui.toast.screenshot_saved': 'Screenshot saved to downloads.',
'ui.toast.screenshot_failed': "Couldnae save the frame — gie it another go.",
'ui.toast.clip_saved': 'Clip saved to downloads.',
'ui.toast.clip_failed': "Couldnae save the clip — gie it a wee minute.",
'ui.toast.clip_empty': 'Play a wee bit longer before saving a clip.',
```

- [ ] **Step 2: Add SCS keys to `src/core/i18n.scs.ts`**

Find the matching `ui.pause.*` block. After it, add:

```typescript
'ui.pause.save_screenshot': 'Save a pic',
'ui.pause.save_clip': 'Keep the last 15s',
'ui.gameover.save_frame': 'Keep this frame',
'ui.gameover.save_clip': 'Keep the clip',
'ui.settings.capture_enabled': 'Capture on',
'ui.toast.screenshot_saved': 'Pic saved, aye.',
'ui.toast.screenshot_failed': 'Couldnae save it — try again.',
'ui.toast.clip_saved': 'Clip saved, braw.',
'ui.toast.clip_failed': 'Couldnae save the clip — wait a wee minute.',
'ui.toast.clip_empty': 'Play a bit longer before clipping.',
```

- [ ] **Step 3: Run i18n parity test**

Run: `npx vitest run src/core/i18n.locale.test.ts`
Expected: PASS — no orphan keys, EN→SCS parity intact

- [ ] **Step 4: Run build to verify**

Run: `npm run build`
Expected: Clean pass — no type errors

- [ ] **Step 5: Commit**

```bash
git add src/core/i18n.ts src/core/i18n.scs.ts
git commit -m "feat(i18n): capture UI + toast keys (EN + SCS parity)"
```

---

### Task 4: SettingsManager captureEnabled field

**Files:**
- Modify: `src/core/SettingsManager.ts`
- Modify: `src/core/SettingsManager.test.ts`

- [ ] **Step 1: Add the field to `ISettingsData` interface**

In `src/core/SettingsManager.ts`, inside the `ISettingsData` interface, after `speedrunTimerVisible: boolean;` and before `localeKey?: LocaleKey;`, add:

```typescript
  /**
   * W27 capture opt-out. When false, ClipRecorder doesn't start and
   * both capture UI buttons hide. Default true — capture is lightweight
   * and the kill-criterion is >3% CPU or >200 KB bundle; neither applies
   * at default settings.
   */
  captureEnabled: boolean;
```

- [ ] **Step 2: Add the default**

In the same file, inside `DEFAULT_SETTINGS`, after `speedrunTimerVisible: false,` and before `localeKey: 'en',`, add:

```typescript
  captureEnabled: true,
```

- [ ] **Step 3: Add the coercion**

Find the `coerce()` method of `SettingsManager`. Locate the line that reads `speedrunTimerVisible: toBool(...)`. Directly after it, add:

```typescript
      captureEnabled: toBool(obj['captureEnabled'], DEFAULT_SETTINGS.captureEnabled),
```

Make sure the enclosing object still parses — trailing comma is fine.

- [ ] **Step 4: Add a unit test**

Append to `src/core/SettingsManager.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { SettingsManager } from './SettingsManager';

describe('SettingsManager captureEnabled', () => {
  it('defaults captureEnabled to true on a fresh load', () => {
    const mgr = new SettingsManager({
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    });
    expect(mgr.load().captureEnabled).toBe(true);
  });

  it('coerces saved captureEnabled=false', () => {
    const storage = {
      _v: JSON.stringify({ captureEnabled: false }),
      getItem(this: { _v: string }) { return this._v; },
      setItem() {},
      removeItem() {},
    };
    const mgr = new SettingsManager({ storage });
    expect(mgr.load().captureEnabled).toBe(false);
  });

  it('coerces missing captureEnabled back to the default', () => {
    const storage = {
      _v: JSON.stringify({ masterVolume: 0.5 }),
      getItem(this: { _v: string }) { return this._v; },
      setItem() {},
      removeItem() {},
    };
    const mgr = new SettingsManager({ storage });
    expect(mgr.load().captureEnabled).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/core/SettingsManager.test.ts`
Expected: PASS — including the 3 new tests

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/core/SettingsManager.ts src/core/SettingsManager.test.ts
git commit -m "feat(settings): captureEnabled flat field (default true)"
```

---

### Task 5: Settings scene capture toggle

**Files:**
- Modify: `src/scenes/SettingsScene.ts`

SettingsScene already has a toggle-row helper (`addToggleRow` or `createGameToggle`) used by existing fields. This task wires a new row for `captureEnabled` in the Comfort section.

- [ ] **Step 1: Locate the Comfort section in SettingsScene**

Open `src/scenes/SettingsScene.ts` and search for `reduceParticles` — that toggle belongs to the Comfort section. Find the block where Comfort rows are added (look for repeated `addToggleRow(...)` or `createGameToggle(...)` calls).

- [ ] **Step 2: Add the capture toggle after reduceParticles**

Immediately after the `reduceParticles` toggle row in the Comfort section, add a parallel row for `captureEnabled` using the same pattern. Example (match local pattern exactly):

```typescript
addToggleRow({
  labelKey: 'ui.settings.capture_enabled',
  get: () => settings.captureEnabled,
  set: (v: boolean) => {
    settings.captureEnabled = v;
    settingsManager.save(settings);
  },
});
```

If the local pattern uses a different function name, match it — the goal is a new row visually identical to `reduceParticles` with the new key.

- [ ] **Step 3: Run type-check and lint**

Run: `npm run lint`
Expected: Clean

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual smoke**

Run: `npm run dev` (opens browser)
Navigate: Menu → Settings → Comfort section
Expected: "Capture enabled" toggle visible, default ON, toggles and persists across reload.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/SettingsScene.ts
git commit -m "feat(settings): capture enabled toggle under Comfort"
```

---

### Task 6: GameOverScene "Save frame" button

**Files:**
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Add the import**

At the top of `src/scenes/GameOverScene.ts`, add:

```typescript
import { saveScreenshot } from '@/utils/screenshot';
import { buildCaptureFilename } from '@/utils/captureFilename';
import { getSettingsManager } from '@/core/SettingsManager';
import { formatLocalYmd } from '@/utils/formatDate';
```

(Skip any that are already present.)

- [ ] **Step 2: Locate the postcard save button and add a sibling**

Search the file for where the postcard save button is created — likely a `createGameButton` call with a label resolved from `t('ui.gameover.save_postcard')` or similar. Directly after that button is added to the scene, add:

```typescript
if (getSettingsManager().load().captureEnabled) {
  const saveFrameBtn = createGameButton(this, {
    x: <same x as postcard, offset y by button height + 8>,
    y: <...>,
    width: <same as postcard>,
    height: <same as postcard>,
    tier: 'secondary',
    labelKey: 'ui.gameover.save_frame',
    onPress: () => {
      void this.handleSaveFrame();
    },
  });
  // Match existing pattern for depth / add-to-scene if present
}
```

Replace the `x`, `y`, `width`, `height` placeholders with the literal values used by the postcard button above. Keep the layout consistent.

- [ ] **Step 3: Add the handler method**

Inside the `GameOverScene` class, add:

```typescript
private async handleSaveFrame(): Promise<void> {
  const canvas = this.game.canvas;
  if (!canvas) return;
  const payload = this.payload; // existing GameOverPayload reference
  const filename = buildCaptureFilename('screenshot', {
    mode: payload.mode,
    variantLabel: payload.variantLabel ?? '',
    timeSurvivedSec: payload.timeSurvivedSec,
    seedCode: payload.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  const ok = await saveScreenshot(canvas, filename);
  this.juice?.showToast(
    ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed'),
    ok ? TOAST_COLORS.positive : TOAST_COLORS.warning,
  );
}
```

If the local property for the payload is called something other than `this.payload`, match the existing reference.

- [ ] **Step 4: Run build + lint**

Run: `npm run build && npm run lint`
Expected: PASS both

- [ ] **Step 5: Manual smoke**

Run: `npm run dev`, finish a run (victory or death), click "Save frame".
Expected: PNG file downloads with `whs_<mode>_<variant>_<time>_<date>.png` filename.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat(capture): GameOver Save frame button + screenshot wiring"
```

---

### Task 7: PauseMenu "Save screenshot" entry

**Files:**
- Modify: `src/scenes/game/PauseMenu.ts`

- [ ] **Step 1: Add the imports**

At the top of `src/scenes/game/PauseMenu.ts`, add (skip duplicates):

```typescript
import { saveScreenshot } from '@/utils/screenshot';
import { buildCaptureFilename } from '@/utils/captureFilename';
import { getSettingsManager } from '@/core/SettingsManager';
import { formatLocalYmd } from '@/utils/formatDate';
```

- [ ] **Step 2: Add a button under the existing pause entries**

Find the list of pause menu buttons. After the last one (likely "Settings" or "Return to menu"), conditionally add:

```typescript
if (getSettingsManager().load().captureEnabled) {
  this.createEntry({
    labelKey: 'ui.pause.save_screenshot',
    onPress: () => {
      void this.handleSaveScreenshot();
    },
  });
}
```

Match the local `createEntry` / `addButton` API exactly.

- [ ] **Step 3: Add the handler method**

Inside the `PauseMenu` class (or its factory):

```typescript
private async handleSaveScreenshot(): Promise<void> {
  const scene = this.scene;
  const canvas = scene.game.canvas;
  if (!canvas) return;

  // Read the in-run payload approximation — pause context doesn't have
  // the final payload, so use the live run state for naming.
  const runCtx = (scene as GameScene).getRunContextForCapture();
  const filename = buildCaptureFilename('screenshot', {
    mode: runCtx.mode,
    variantLabel: runCtx.variantLabel,
    timeSurvivedSec: runCtx.timeSurvivedSec,
    seedCode: runCtx.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  const ok = await saveScreenshot(canvas, filename);
  (scene as GameScene).juiceSystem?.showToast(
    ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed'),
    ok ? TOAST_COLORS.positive : TOAST_COLORS.warning,
  );
}
```

- [ ] **Step 4: Add `getRunContextForCapture` helper on GameScene**

In `src/scenes/GameScene.ts`, add a public method:

```typescript
public getRunContextForCapture(): {
  mode: 'victory' | 'death';
  variantLabel: string;
  timeSurvivedSec: number;
  seedCode?: string;
} {
  return {
    mode: this.player?.hp > 0 ? 'victory' : 'death',
    variantLabel: this.variantLabel ?? '',
    timeSurvivedSec: Math.floor(this.gameTimeMs / 1000),
    seedCode: this.runSeedCode,
  };
}
```

Match local field names exactly — if `this.gameTimeMs` is instead `this.runTimeMs`, use that. The `mode` value is a live approximation ("death" only becomes definitive at run end; during pause it's "victory" since the player is alive).

- [ ] **Step 5: Run build + lint**

Run: `npm run build && npm run lint`
Expected: PASS both

- [ ] **Step 6: Manual smoke**

Run: `npm run dev`. Start a run, pause, click "Save screenshot".
Expected: PNG downloads with current-run filename.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts src/scenes/game/PauseMenu.ts
git commit -m "feat(capture): Pause Save screenshot entry + run context helper"
```

---

### Task 8: F10 keybind + Phase 2a bundle baseline

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Wire F10 keybind in GameScene**

In `src/scenes/GameScene.ts`, inside `create()`, locate the input-setup block (search for `.keyboard?.on('keydown-`). Add:

```typescript
this.input.keyboard?.on('keydown-F10', () => {
  if (!getSettingsManager().load().captureEnabled) return;
  const canvas = this.game.canvas;
  if (!canvas) return;
  const ctx = this.getRunContextForCapture();
  const filename = buildCaptureFilename('screenshot', {
    mode: ctx.mode,
    variantLabel: ctx.variantLabel,
    timeSurvivedSec: ctx.timeSurvivedSec,
    seedCode: ctx.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  void saveScreenshot(canvas, filename).then((ok) => {
    this.juiceSystem?.showToast(
      ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed'),
      ok ? TOAST_COLORS.positive : TOAST_COLORS.warning,
    );
  });
});
```

- [ ] **Step 2: Run build + lint + tests**

Run: `npm run ci`
Expected: PASS — lint + all vitest + build

- [ ] **Step 3: Capture the pre-2b bundle baseline**

Run: `npm run build`
Record the `dist/assets/index-*.js` gzip size from the output. Save the number in the commit body below.

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`. Start a run, press F10. Expected: PNG downloads.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(capture): F10 screenshot keybind — Phase 2a complete

App chunk gzip baseline (pre-clip Phase 2b): <record number>.
"
```

**Phase 2a gate:** After this commit, Phase 2a is complete. Stop here and assess before starting 2b if time is short — 2a is independently shippable.

---

## Phase 2b — Clip (MediaRecorder + rolling buffer)

### Task 9: clipRecorder — ring buffer + MediaRecorder

**Files:**
- Create: `src/utils/clipRecorder.ts`
- Create: `src/utils/clipRecorder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/clipRecorder.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClipRecorder } from './clipRecorder';

interface MockRecorder extends EventTarget {
  state: 'inactive' | 'recording' | 'paused';
  start(ms?: number): void;
  stop(): void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
}

function makeMockRecorder(): MockRecorder {
  const target = new EventTarget() as MockRecorder;
  target.state = 'inactive';
  target.ondataavailable = null;
  target.start = function (_ms?: number) {
    this.state = 'recording';
  };
  target.stop = function () {
    this.state = 'inactive';
  };
  return target;
}

function makeMockCanvas(): HTMLCanvasElement {
  return {
    captureStream: vi.fn(() => ({} as MediaStream)),
  } as unknown as HTMLCanvasElement;
}

function installMediaRecorderMock(): MockRecorder[] {
  const instances: MockRecorder[] = [];
  const MR = function (this: MockRecorder, _stream: MediaStream) {
    const r = makeMockRecorder();
    instances.push(r);
    return r;
  } as unknown as typeof MediaRecorder & { isTypeSupported: (t: string) => boolean };
  MR.isTypeSupported = (t: string) => t.includes('webm');
  (globalThis as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder = MR;
  return instances;
}

describe('ClipRecorder', () => {
  beforeEach(() => {
    installMediaRecorderMock();
  });

  it('isAvailable true when MediaRecorder and captureStream both exist', () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
    expect(rec.isAvailable()).toBe(true);
  });

  it('isAvailable false when MediaRecorder is missing', () => {
    delete (globalThis as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
    expect(rec.isAvailable()).toBe(false);
  });

  it('ring buffer drops oldest chunks past the duration window', async () => {
    const instances = installMediaRecorderMock();
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2, timesliceMs: 500 });
    rec.start();
    const mr = instances[0]!;
    // Capacity = durationSec * 2 (matches `durationSec * 1000 / timesliceMs`).
    // Push 8 chunks — expect only the last 4 retained.
    for (let i = 0; i < 8; i++) {
      mr.ondataavailable?.({ data: new Blob([`chunk-${i}`], { type: 'video/webm' }) });
    }
    const blob = await rec.saveLast(() => {});
    expect(blob).not.toBeNull();
    expect(rec.bufferedChunkCount()).toBe(4);
  });

  it('saveLast returns null when buffer is empty', async () => {
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2, timesliceMs: 500 });
    rec.start();
    const blob = await rec.saveLast(() => {});
    expect(blob).toBeNull();
  });

  it('codec fallback tries vp9 → vp8 → plain webm', () => {
    const MR = globalThis.MediaRecorder as unknown as { isTypeSupported: (t: string) => boolean };
    const calls: string[] = [];
    MR.isTypeSupported = (t: string) => {
      calls.push(t);
      return t === 'video/webm';
    };
    const canvas = makeMockCanvas();
    const rec = new ClipRecorder(canvas, { fps: 30, durationSec: 2 });
    expect(rec.selectedMimeType()).toBe('video/webm');
    expect(calls).toContain('video/webm;codecs=vp9');
    expect(calls).toContain('video/webm;codecs=vp8');
    expect(calls).toContain('video/webm');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/clipRecorder.test.ts`
Expected: FAIL — module missing

- [ ] **Step 3: Implement the recorder**

```typescript
// src/utils/clipRecorder.ts
/**
 * W27 Phase 2b — rolling WebM clip recorder.
 *
 * Always recording the last `durationSec` of canvas output into a fixed
 * ring buffer. `saveLast()` concatenates current buffer into a Blob and
 * triggers a download. Lightweight — buffer is ~3–6 MB resident, same
 * order as one Phaser texture atlas.
 */
export interface ClipRecorderOptions {
  fps?: number;
  durationSec?: number;
  timesliceMs?: number;
}

const CODEC_PRIORITY = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;

export class ClipRecorder {
  private canvas: HTMLCanvasElement;
  private fps: number;
  private durationSec: number;
  private timesliceMs: number;
  private capacity: number;
  private buffer: Blob[] = [];
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private mimeType: string | null = null;
  private running = false;

  constructor(canvas: HTMLCanvasElement, opts: ClipRecorderOptions = {}) {
    this.canvas = canvas;
    this.fps = opts.fps ?? 30;
    this.durationSec = opts.durationSec ?? 15;
    this.timesliceMs = opts.timesliceMs ?? 500;
    this.capacity = Math.max(
      1,
      Math.ceil((this.durationSec * 1000) / this.timesliceMs),
    );
    this.mimeType = this.pickMimeType();
  }

  selectedMimeType(): string | null {
    return this.mimeType;
  }

  isAvailable(): boolean {
    const hasMR = typeof (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder !== 'undefined';
    const hasStream = typeof (this.canvas as unknown as { captureStream?: unknown }).captureStream === 'function';
    return hasMR && hasStream && this.mimeType !== null;
  }

  start(): void {
    if (this.running || !this.isAvailable() || !this.mimeType) return;
    try {
      const stream = (this.canvas as unknown as {
        captureStream: (fps?: number) => MediaStream;
      }).captureStream(this.fps);
      this.stream = stream;
      const recorder = new MediaRecorder(stream, { mimeType: this.mimeType });
      this.recorder = recorder;
      recorder.ondataavailable = (e: BlobEvent) => {
        if (!e.data || e.data.size === 0) return;
        this.buffer.push(e.data);
        if (this.buffer.length > this.capacity) {
          this.buffer.splice(0, this.buffer.length - this.capacity);
        }
      };
      recorder.start(this.timesliceMs);
      this.running = true;
    } catch {
      this.running = false;
    }
  }

  stop(): void {
    if (!this.running) return;
    try {
      this.recorder?.stop();
    } catch { /* already stopped */ }
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.running = false;
    this.buffer = [];
  }

  bufferedChunkCount(): number {
    return this.buffer.length;
  }

  async saveLast(triggerDownload: (blob: Blob) => void): Promise<Blob | null> {
    if (this.buffer.length === 0) return null;
    const blob = new Blob(this.buffer, { type: this.mimeType ?? 'video/webm' });
    triggerDownload(blob);
    return blob;
  }

  private pickMimeType(): string | null {
    const MR = (globalThis as unknown as { MediaRecorder?: { isTypeSupported: (t: string) => boolean } }).MediaRecorder;
    if (!MR) return null;
    for (const codec of CODEC_PRIORITY) {
      if (MR.isTypeSupported(codec)) return codec;
    }
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/clipRecorder.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/clipRecorder.ts src/utils/clipRecorder.test.ts
git commit -m "feat(capture): ClipRecorder — MediaRecorder ring buffer"
```

---

### Task 10: GameScene clip lifecycle

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add field + imports**

At the top of `src/scenes/GameScene.ts`, add the import:

```typescript
import { ClipRecorder } from '@/utils/clipRecorder';
```

Inside the `GameScene` class, add a private field:

```typescript
private clipRecorder: ClipRecorder | null = null;
```

- [ ] **Step 2: Start recorder in `create()`**

At the end of `create()` (after all other setup, before any scene.start calls), add:

```typescript
if (getSettingsManager().load().captureEnabled) {
  const canvas = this.game.canvas;
  if (canvas) {
    this.clipRecorder = new ClipRecorder(canvas, { fps: 30, durationSec: 15 });
    if (this.clipRecorder.isAvailable()) {
      this.clipRecorder.start();
    } else {
      this.clipRecorder = null;
    }
  }
}
```

- [ ] **Step 3: Stop recorder in `shutdown()`**

Find the `shutdown()` method. Add near the top:

```typescript
this.clipRecorder?.stop();
this.clipRecorder = null;
```

- [ ] **Step 4: Expose a getter for the pause/gameover surfaces**

Add to GameScene:

```typescript
public getClipRecorder(): ClipRecorder | null {
  return this.clipRecorder;
}
```

- [ ] **Step 5: Run build + lint + tests**

Run: `npm run ci`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(capture): GameScene clip lifecycle — start on create, stop on shutdown"
```

---

### Task 11: GameOverScene "Save clip" button

**Files:**
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Add the button next to Save frame**

Directly after the `Save frame` button block added in Task 6, add:

```typescript
const recorder = (this.scene.get('Game') as GameScene | undefined)?.getClipRecorder();
if (getSettingsManager().load().captureEnabled && recorder?.isAvailable()) {
  const saveClipBtn = createGameButton(this, {
    x: <same x as save frame>,
    y: <offset y by button height + 8>,
    width: <same>,
    height: <same>,
    tier: 'secondary',
    labelKey: 'ui.gameover.save_clip',
    onPress: () => {
      void this.handleSaveClip(recorder);
    },
  });
}
```

Replace placeholders with literal values matching the previous button.

- [ ] **Step 2: Add the handler**

Inside GameOverScene class:

```typescript
private async handleSaveClip(recorder: ClipRecorder): Promise<void> {
  const payload = this.payload;
  const filename = buildCaptureFilename('clip', {
    mode: payload.mode,
    variantLabel: payload.variantLabel ?? '',
    timeSurvivedSec: payload.timeSurvivedSec,
    seedCode: payload.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  const blob = await recorder.saveLast((b) => this.triggerBlobDownload(b, filename));
  const color = blob ? TOAST_COLORS.positive : TOAST_COLORS.warning;
  const key = blob === null
    ? 'ui.toast.clip_empty'
    : 'ui.toast.clip_saved';
  this.juice?.showToast(t(key), color);
}

private triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Add the `ClipRecorder` import at the top.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`, play for ≥15s, die/win, click "Save clip".
Expected: WebM file downloads with correct filename.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat(capture): GameOver Save clip button"
```

---

### Task 12: PauseMenu "Save last 15s" entry

**Files:**
- Modify: `src/scenes/game/PauseMenu.ts`

- [ ] **Step 1: Add the entry after Save screenshot**

Directly after the `Save screenshot` entry block from Task 7:

```typescript
const recorder = (scene as GameScene).getClipRecorder?.();
if (getSettingsManager().load().captureEnabled && recorder?.isAvailable()) {
  this.createEntry({
    labelKey: 'ui.pause.save_clip',
    onPress: () => {
      void this.handleSaveClip(recorder);
    },
  });
}
```

- [ ] **Step 2: Add handler**

Inside PauseMenu:

```typescript
private async handleSaveClip(recorder: ClipRecorder): Promise<void> {
  const scene = this.scene as GameScene;
  const ctx = scene.getRunContextForCapture();
  const filename = buildCaptureFilename('clip', {
    mode: ctx.mode,
    variantLabel: ctx.variantLabel,
    timeSurvivedSec: ctx.timeSurvivedSec,
    seedCode: ctx.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  const blob = await recorder.saveLast((b) => {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  const color = blob ? TOAST_COLORS.positive : TOAST_COLORS.warning;
  const key = blob === null ? 'ui.toast.clip_empty' : 'ui.toast.clip_saved';
  scene.juiceSystem?.showToast(t(key), color);
}
```

Add `ClipRecorder` import at top.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/scenes/game/PauseMenu.ts
git commit -m "feat(capture): Pause Save last 15s entry"
```

---

### Task 13: F9 clip keybind + save debounce

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add F9 keybind in `create()`**

Near the F10 binding added in Task 8, add:

```typescript
let lastClipSaveAt = 0;
this.input.keyboard?.on('keydown-F9', () => {
  if (!getSettingsManager().load().captureEnabled) return;
  const recorder = this.clipRecorder;
  if (!recorder?.isAvailable()) return;
  const now = performance.now();
  if (now - lastClipSaveAt < 500) return;
  lastClipSaveAt = now;

  const ctx = this.getRunContextForCapture();
  const filename = buildCaptureFilename('clip', {
    mode: ctx.mode,
    variantLabel: ctx.variantLabel,
    timeSurvivedSec: ctx.timeSurvivedSec,
    seedCode: ctx.seedCode,
    dateYmd: formatLocalYmd(new Date()),
  });
  void recorder.saveLast((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }).then((blob) => {
    const key = blob === null ? 'ui.toast.clip_empty' : 'ui.toast.clip_saved';
    const color = blob ? TOAST_COLORS.positive : TOAST_COLORS.warning;
    this.juiceSystem?.showToast(t(key), color);
  });
});
```

- [ ] **Step 2: Run build + tests**

Run: `npm run ci`
Expected: PASS

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`, play ≥15s, press F9. Press F9 again within 500ms — second press must be ignored.
Expected: 1 WebM file per press, debounce works.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(capture): F9 clip keybind with 500ms save debounce"
```

---

### Task 14: Playwright smoke test

**Files:**
- Create: `e2e/capture-smoke.spec.ts`

- [ ] **Step 1: Write the e2e smoke**

```typescript
// e2e/capture-smoke.spec.ts
import { expect, test } from '@playwright/test';

test('capture: F9 triggers a webm download during gameplay', async ({ page }) => {
  // Wait for download event before pressing
  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });

  await page.goto('/');

  // Click through to start a run. Adapt selectors to current menu structure —
  // the goal is to land in GameScene with a few seconds of gameplay recorded.
  await page.getByRole('button', { name: /play|start/i }).click({ timeout: 5_000 });

  // Let the game record for ~2s (enough chunks for a saveable blob).
  await page.waitForTimeout(2_500);

  // Trigger F9 clip save
  await page.keyboard.press('F9');

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^whs_(victory|death)_.*\.webm$/);
});

test('capture: F10 triggers a png download during gameplay', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });

  await page.goto('/');
  await page.getByRole('button', { name: /play|start/i }).click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  await page.keyboard.press('F10');

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^whs_(victory|death)_.*\.png$/);
});
```

If the menu selector pattern differs locally, match the existing e2e specs under `e2e/` (e.g. `e2e/w2-moor-road.spec.ts`). The filename regex is the load-bearing assertion.

- [ ] **Step 2: Build + run e2e**

Run: `npm run build && npm run test:e2e`
Expected: PASS — both capture cases + all existing e2e tests

- [ ] **Step 3: Commit**

```bash
git add e2e/capture-smoke.spec.ts
git commit -m "test(capture): e2e smoke for F9 clip + F10 screenshot"
```

---

### Task 15: Kill-criterion verification

**Files:** none — verification only.

- [ ] **Step 1: Capture post-2b bundle size**

Run: `npm run build`
Record the `dist/assets/index-*.js` gzip size. Subtract the Phase 2a baseline recorded in Task 8 Step 3.

- [ ] **Step 2: Check kill criterion #1 (bundle)**

If delta (post-2b − Phase-2a-baseline) > 200 KB, the plan has failed the bundle kill criterion. Stop. Revert 2b. Keep 2a. Open a follow-up to investigate.

Expected: delta ≈ 5–15 KB (the two new utility files are tiny).

- [ ] **Step 3: Check kill criterion #2 (CPU)**

Run: `npm run dev`. Open Chrome DevTools → Performance tab. Record a 30 s profile of mid-game combat with clip recording enabled. Then toggle `captureEnabled` off via Settings, restart the run, and record another 30 s profile.

Compute the mean CPU delta between the two runs. If > 3%, fail the CPU kill criterion. Stop. Revert 2b. Keep 2a.

Expected: <1% delta — `captureStream` runs in the compositor thread separately from the JS main thread.

- [ ] **Step 4: Update the spec with verified numbers**

Edit `docs/superpowers/specs/2026-04-22-w27-capture-pipeline-phase2-design.md`. At the bottom, add:

```markdown
---

## Verification (post-ship)

- Bundle delta (Phase 2b over Phase 2a baseline): <record number> KB. Kill criterion (≤200 KB): ✅ PASS.
- Mid-game CPU delta with clip recording enabled: <record %>. Kill criterion (≤3%): ✅ PASS.
- Playwright capture smoke: 2 / 2 PASS.
- All other tests green at final commit.
```

Replace `<record number>` and `<record %>` with the measured values.

- [ ] **Step 5: Commit the verification**

```bash
git add docs/superpowers/specs/2026-04-22-w27-capture-pipeline-phase2-design.md
git commit -m "docs(capture): W27 Phase 2 kill-criterion verification — PASS"
```

- [ ] **Step 6: Final CI gate**

Run: `npm run ci:all`
Expected: PASS — full CI including e2e.

---

## Summary

**Phase 2a (tasks 1–8):** screenshot pipeline. Ships independently. Smallest risk.
**Phase 2b (tasks 9–15):** clip pipeline. Builds on the pattern established by 2a.

Total new modules: 3 (`captureFilename`, `screenshot`, `clipRecorder`) + tests.
Total modified scenes: 3 (GameScene, GameOverScene, PauseMenu) + SettingsManager + SettingsScene + i18n.
New e2e: 1 file, 2 tests.
Kill criteria verified at the end; if any fails, the plan descopes cleanly to 2a + parked 2b.
