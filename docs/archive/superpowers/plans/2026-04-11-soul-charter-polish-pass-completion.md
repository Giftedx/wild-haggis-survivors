# Soul Charter Polish Pass Completion — Implementation Plan

> **STATUS: ✅ SHIPPED** — `docs/DESIGN_SOUL.md` published and referenced from `CLAUDE.md` / `AGENTS.md`; `.cursor/` + `.serena/` in `.gitignore`; polish pass + i18n data-file migration landed. Checklist below was not re-ticked post-ship; treat as historical reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the in-flight Soul Charter polish pass and close all 27 loose threads identified by the audit, landing the work as 4 atomic bisect-friendly commits.

**Architecture:** Each phase maps to one git commit. Phase 1 publishes the charter. Phase 2 ignores AI-tool metadata. Phase 3 lands the existing polish pass plus accessibility/craft/balance fixes. Phase 4 completes the i18n data-file migration using the `nameKey`/`descriptionKey` pattern already proven by `BalanceConfig.EVOLUTION_RECIPES` and `ACHIEVEMENT_DEFS`. New regression-fence tests in `i18n.test.ts` prevent future drift.

**Tech Stack:** Phaser 3.90+, TypeScript, Vite, Vitest. All work is local to the repo — no new dependencies.

**Companion Spec:** `docs/superpowers/specs/2026-04-11-soul-charter-polish-pass-completion-design.md` (committed as `1708d24`).

**Pre-flight (before Phase 1):**
- Confirm you are on branch `master` (already where the uncommitted polish pass lives).
- Run `npm test -- --run` — expect 136 tests passing.
- Run `npm run build` — expect `tsc --noEmit` clean and Vite build green.
- Do NOT run `git add -A` at any point in this plan. Stage files explicitly to avoid picking up stray untracked files.

---

## Phase 1 — Commit 1: Publish the Soul Charter

Goal: Commit the charter document and its references.

### Task 1.1: Stage and commit the charter doc

**Files:**
- Stage: `docs/DESIGN_SOUL.md` (new)
- Stage: `CLAUDE.md` (modified — add charter reference lines)
- Stage: `AGENTS.md` (modified — add charter reference lines)

- [ ] **Step 1: Verify file contents match intent**

Run: `git diff CLAUDE.md AGENTS.md`

Expected: `CLAUDE.md` has a new line near the top mentioning `docs/DESIGN_SOUL.md` as the "Tone & UX north star"; `AGENTS.md` has a new "Player experience & tone" section with the same reference. `docs/DESIGN_SOUL.md` is 55 lines, defines the Soul Charter + weave matrix + objectives.

- [ ] **Step 2: Stage the three files explicitly**

Run:
```bash
git add docs/DESIGN_SOUL.md CLAUDE.md AGENTS.md
```

- [ ] **Step 3: Verify stage is clean**

Run: `git status --short`

Expected output includes exactly:
```
A  docs/DESIGN_SOUL.md
M  CLAUDE.md
M  AGENTS.md
```
Plus the rest of the working-tree changes as **unstaged** (they land in later commits).

- [ ] **Step 4: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs: introduce DESIGN_SOUL charter as UX north star

Establishes docs/DESIGN_SOUL.md as the player-facing tone and UX
anchor for Wild Haggis Survivors. Non-negotiable soul charter (warm,
handcrafted, compassionate failure, celebratory progression), five
design principles, the soul-weave matrix for where soul must appear,
and the shipping objectives that guide ordering of polish work.

CLAUDE.md and AGENTS.md now point at the charter so contributors
(human or agent) find it before touching player-facing surfaces.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify commit landed**

Run: `git log --oneline -1`

Expected: a commit with the title `docs: introduce DESIGN_SOUL charter as UX north star`.

---

## Phase 2 — Commit 2: Ignore AI tool metadata

Goal: Prevent `.cursor/` and `.serena/` from polluting future `git add -A` operations.

### Task 2.1: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read the current .gitignore**

Run: `cat .gitignore`

Expected: existing sections for Dependencies / Build output / Logs / OS-editor / Tooling caches. `.vscode/` and `.idea/` are already there.

- [ ] **Step 2: Append the AI-tool metadata lines**

Add these three lines at the end of the `# OS / editor` block (after `.idea/`):

```
# AI tool metadata (Cursor, Serena, etc.)
.cursor/
.serena/
```

Use the Edit tool with:
- `old_string`: `.vscode/\n.idea/\n\n# Tooling caches`
- `new_string`: `.vscode/\n.idea/\n\n# AI tool metadata (Cursor, Serena, etc.)\n.cursor/\n.serena/\n\n# Tooling caches`

- [ ] **Step 3: Verify the file**

Run: `git diff .gitignore`

Expected: three lines added under `.idea/`, nothing removed, `# Tooling caches` block unchanged.

- [ ] **Step 4: Verify the untracked dirs are now ignored**

Run: `git status --short | grep -E '\.cursor|\.serena' || echo "no matches"`

Expected: `no matches` — the directories should not appear in `git status` anymore.

- [ ] **Step 5: Stage and commit**

Run:
```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: ignore AI tool metadata directories

.cursor/ and .serena/ are local caches written by AI coding tools
(Cursor IDE, Serena MCP server). Neither belongs in the repo, and
without ignoring them any future `git add -A` would accidentally
include them.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify commit**

Run: `git log --oneline -2`

Expected: the new chore commit plus the docs commit from Phase 1.

---

## Phase 3 — Commit 3: Soul Charter polish pass

Goal: Land the 39 modified + 9 new files from the existing polish pass, delete the orphaned `uiSafeViewport.ts`, and add the accessibility / craft / magic-number fixes. This is the biggest commit.

**Approach:** The existing polish pass is *already in the working tree* and passing tests. The fixes in this phase modify files on top of the existing polish work. All changes get committed together in Task 3.17. Each intermediate task leaves the working tree in a green state (tests + build pass).

**Phase 3 baseline:** Before starting, run `npm test -- --run` and `npm run build`. Both must be green. If they are not, STOP — something is wrong with the working tree baseline that this plan assumes.

### Task 3.1: Delete the orphaned uiSafeViewport.ts

**Files:**
- Delete: `src/ui/uiSafeViewport.ts`

- [ ] **Step 1: Confirm no imports exist**

Run: `grep -rn "uiSafeViewport\|getUiSafeViewport\|getUiSafeViewportFixed" src/ 2>&1 | grep -v "uiSafeViewport.ts:"`

Expected: empty output (only the file itself references those names).

- [ ] **Step 2: Delete the file**

Run: `rm src/ui/uiSafeViewport.ts`

- [ ] **Step 3: Re-run tests and build**

Run: `npm test -- --run 2>&1 | tail -5 && npm run build 2>&1 | tail -5`

Expected: 136 tests passing, build green. `cameraViewport.ts` already handles the safe-area use cases correctly, so deleting the unused sibling has no runtime effect.

### Task 3.2: HUD high-contrast extension

**Files:**
- Modify: `src/ui/HUD.ts`
- Modify: `src/ui/HUD.test.ts` (add new test first)

- [ ] **Step 1: Write failing test for high-contrast coverage**

Add this test case to `src/ui/HUD.test.ts` inside the existing `describe('HUD', () => { ... })` block (after the existing three `it()` blocks, before the closing `});`):

```typescript
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
    expect((hud as any).hpText.text).toBeDefined();
    // Colors set via setColor() are captured on MockObject via the setColor stub.
    // If a real implementation forgets to recolor one of these, this test fails.
    const coloredTargets = [
      'hpText', 'levelText', 'timerText', 'killText', 'pauseText', 'bossNameText',
    ];
    for (const key of coloredTargets) {
      const obj = (hud as any)[key];
      expect(obj, `HUD.${key} must exist`).toBeDefined();
    }
    // Sanity: at least timer and kill colors should match the HC palette.
    // (Individual element checks happen via the setColor spy below.)
    expect((hud as any).timerText.color ?? (hud as any).timerText._color)
      .toBe(palette.timer);
    expect((hud as any).killText.color ?? (hud as any).killText._color)
      .toBe(palette.kill);

    vi.doUnmock('../core/SettingsManager');
  });
```

The `MockObject` class in `HUD.test.ts` currently does not persist `setColor` into a property. Update it to do so:

Find in `HUD.test.ts`:
```typescript
  setColor() { return this; }
```

Replace with:
```typescript
  setColor(color: string) { (this as any).color = color; return this; }
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `npm test -- --run src/ui/HUD.test.ts 2>&1 | tail -20`

Expected: the new test fails because `HUD.ts` currently only repaints `hpBarBg`, `xpBarBg`, `objectiveText`, `dpsText`. The other elements still use default colors.

- [ ] **Step 3: Extend HUD high-contrast palette**

In `src/ui/HUD.ts`, find the block:
```typescript
    if (this.highContrastUi) {
      this.hpBarBg.setFillStyle(0x080b12, 0.95);
      this.xpBarBg.setFillStyle(0x080b12, 0.95);
      this.objectiveText.setColor('#e6efff');
      this.dpsText.setColor('#d9e4ff');
    }
```

Replace with:
```typescript
    if (this.highContrastUi) {
      // High-contrast palette — recolors every HUD text surface + bar backgrounds
      // so the entire HUD shifts together, not just the objective/dps line.
      const hc = {
        text: '#f0f6ff',   // general white-on-dark for numeric / label text
        timer: '#fff4d0',  // warmer timer to stand out against the wave ladder
        kill: '#e0e8ff',   // kill / enemy readout
        boss: '#ff9595',   // boss name — lifted from the default dim red
        objective: '#e6efff',
        dps: '#d9e4ff',
        bg: 0x080b12,
        bgAlpha: 0.95,
        slotStroke: 0x8fb4ff,
      };
      this.hpBarBg.setFillStyle(hc.bg, hc.bgAlpha);
      this.xpBarBg.setFillStyle(hc.bg, hc.bgAlpha);
      this.objectiveText.setColor(hc.objective);
      this.dpsText.setColor(hc.dps);
      this.hpText.setColor(hc.text);
      this.levelText.setColor(hc.text);
      this.timerText.setColor(hc.timer);
      this.killText.setColor(hc.kill);
      this.pauseText.setColor(hc.text);
      this.bossNameText.setColor(hc.boss);
      // Cache slot stroke for weapon slot construction (applied in updateWeaponSlots)
      this.hcSlotStroke = hc.slotStroke;
    }
```

Add the cached field near the top of the class (after the other private fields around line 74):
```typescript
  private hcSlotStroke: number | null = null;
```

Then in `updateWeaponSlots`, find the line where the slot bg is created with `setStrokeStyle(2, 0x666666)` (around line 420) and update to:
```typescript
const normalStroke = this.hcSlotStroke ?? 0x666666;
const bg = this.addEl(this.scene.add.rectangle(x, y, size, size, 0x1a1a2e, 0.85)
  .setOrigin(0, 0).setStrokeStyle(2, normalStroke)
  .setScrollFactor(0).setDepth(this.DEPTH));
```

And where the slot stroke is updated in the per-slot refresh loop (around line 461), find:
```typescript
slot.bg.setStrokeStyle(2, w.evolved ? 0xddaa00 : 0x666666);
```

Replace with:
```typescript
slot.bg.setStrokeStyle(2, w.evolved ? 0xddaa00 : (this.hcSlotStroke ?? 0x666666));
```

- [ ] **Step 4: Run test again — expect PASS**

Run: `npm test -- --run src/ui/HUD.test.ts 2>&1 | tail -20`

Expected: all HUD tests including the new high-contrast test now pass.

- [ ] **Step 5: Run full suite**

Run: `npm test -- --run 2>&1 | tail -10`

Expected: 137 tests passing (was 136, +1 for the new HUD test). No regressions.

### Task 3.3: SpawnSystem boss warning respects uiScale and highContrastUi

**Files:**
- Modify: `src/systems/SpawnSystem.ts`
- Modify: `src/systems/SpawnSystem.ui.test.ts` (extend existing test)

- [ ] **Step 1: Write failing test for accessibility-aware boss warning**

Add this test inside the existing `describe('SpawnSystem boss warning layout', () => { ... })` block in `src/systems/SpawnSystem.ui.test.ts` (after the existing `it()`):

```typescript
  it('scales boss warning font by uiScale and swaps palette for high contrast', async () => {
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
          uiScale: 1.3,
          highContrastUi: true,
        }),
      }),
    }));
    const { SpawnSystem: SS2 } = await import('./SpawnSystem');
    const textStyles: Array<Record<string, unknown>> = [];
    const scene: any = {
      scale: { width: 1280, height: 720 },
      cameras: { main: { zoom: 1 } },
      add: {
        rectangle: () => ({
          setScrollFactor() { return this; },
          setDepth() { return this; },
          destroy() {},
        }),
        text: (_x: number, _y: number, _text: string, style: Record<string, unknown>) => {
          textStyles.push(style);
          return {
            setOrigin() { return this; },
            setScrollFactor() { return this; },
            setDepth() { return this; },
            destroy() {},
          };
        },
      },
      tweens: { add: vi.fn() },
    };

    const ss: any = Object.create(SS2.prototype);
    ss.scene = scene;
    ss.showBossWarning('Incoming menace');

    // Font size scales with uiScale (36 * 1.3 → 46 or 47 px, rounded)
    const style = textStyles[0];
    const fontSize = String(style.fontSize);
    expect(fontSize).toMatch(/4[67]px/);
    // High-contrast color should NOT be the default #ff4444
    expect(style.color).not.toBe('#ff4444');

    vi.doUnmock('../core/SettingsManager');
  });
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- --run src/systems/SpawnSystem.ui.test.ts 2>&1 | tail -15`

Expected: the new test fails — boss warning ignores settings.

- [ ] **Step 3: Make SpawnSystem respect settings**

In `src/systems/SpawnSystem.ts`, add a getter for the settings-driven text style. Find the `showBossWarning` method (around line 242):

```typescript
  private showBossWarning(text: string): void {
    audio.playBossWarning();
    const { width, height } = this.getUiViewport();

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, 76, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(150);
    const label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
```

Replace with:
```typescript
  private showBossWarning(text: string): void {
    audio.playBossWarning();
    const { width, height } = this.getUiViewport();
    const settings = getSettingsManager().load();
    // Accessibility: scale font by uiScale, swap palette when high-contrast.
    // Boss warning is a Soul-critical moment — kindness applies here too.
    const baseFontPx = 36;
    const scaledFontPx = Math.round(baseFontPx * settings.uiScale);
    const label_color = settings.highContrastUi ? '#ffd8d8' : '#ff4444';
    const strokeThickness = settings.highContrastUi ? 6 : 5;

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, 76, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(150);
    const label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: 'monospace',
      fontSize: `${scaledFontPx}px`,
      color: label_color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- --run src/systems/SpawnSystem.ui.test.ts 2>&1 | tail -10`

Expected: both SpawnSystem UI tests pass.

- [ ] **Step 5: Run full suite**

Run: `npm test -- --run 2>&1 | tail -5`

Expected: 138 tests passing.

### Task 3.4: Create fx_snowflake texture in BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/core/AssetValidator.ts` (register the new required texture)

- [ ] **Step 1: Add fx_snowflake to required textures**

In `src/core/AssetValidator.ts`, find the `hud` requirements block (around line 77-83):

```typescript
  for (const k of [
    { id: 'hud_shield', key: 'hud_shield' },
    { id: 'hud_dash_pip_full', key: 'hud_dash_pip_full' },
    { id: 'hud_dash_pip_empty', key: 'hud_dash_pip_empty' },
  ] as const) {
    pushKey(out, seen, 'hud', k.id, k.key);
  }
```

Add a new `fx` category block right after it:

```typescript
  for (const k of [
    { id: 'fx_snowflake', key: 'fx_snowflake' },
  ] as const) {
    pushKey(out, seen, 'fx', k.id, k.key);
  }
```

- [ ] **Step 2: Generate the fx_snowflake texture in BootScene**

In `src/scenes/BootScene.ts`, find `createHudChromeTextures` (around line 117). Add a snowflake generator at the end of the method, before the final `}`:

```typescript
    // Snowflake particle for Enemy freeze FX — replaces the raw ❄ emoji
    // that used to be rendered as text. Keeps Enemy.ts consistent with the
    // HUD's "no emoji / font glyphs" principle.
    const snow = 10;
    const gs = this.add.graphics();
    const scx = snow / 2;
    const scy = snow / 2;
    gs.lineStyle(1.5, 0xcce6ff, 1);
    // 6 arms
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      gs.beginPath();
      gs.moveTo(scx, scy);
      gs.lineTo(scx + Math.cos(a) * 4.5, scy + Math.sin(a) * 4.5);
      gs.strokePath();
    }
    gs.fillStyle(0xffffff, 1);
    gs.fillCircle(scx, scy, 1.3);
    gs.generateTexture('fx_snowflake', snow, snow);
    gs.destroy();
```

- [ ] **Step 3: Run AssetValidator tests to confirm no regression**

Run: `npm test -- --run src/core/AssetValidator.test.ts 2>&1 | tail -10`

Expected: AssetValidator tests pass. The new required key is registered.

### Task 3.5: Replace emoji snowflake in Enemy.ts with the sprite

**Files:**
- Modify: `src/entities/Enemy.ts:771-779`

- [ ] **Step 1: Replace the text-based snowflake with an image**

In `src/entities/Enemy.ts`, find the freeze particle block:

```typescript
      } else if (this.active && Math.random() < 0.08) {
        const flake = this.scene.add.text(
          this.x + Phaser.Math.Between(-10, 10), this.y - 12,
          '❄', { fontSize: '14px', color: '#88ccff' }
        ).setDepth(15).setOrigin(0.5);
        this.scene.tweens.add({
          targets: flake, y: flake.y - 12, alpha: 0, duration: 500,
          onComplete: () => flake.destroy(),
        });
      }
```

Replace with:
```typescript
      } else if (this.active && Math.random() < 0.08) {
        // Sprite-based snowflake — no emoji, no font-dependent glyph fallback.
        // Texture generated in BootScene.createHudChromeTextures().
        const flake = this.scene.add.image(
          this.x + Phaser.Math.Between(-10, 10), this.y - 12,
          'fx_snowflake'
        ).setDepth(15).setOrigin(0.5).setScale(1.2).setAlpha(0.9);
        this.scene.tweens.add({
          targets: flake, y: flake.y - 12, alpha: 0, duration: 500,
          onComplete: () => flake.destroy(),
        });
      }
```

- [ ] **Step 2: Run tests + build**

Run: `npm test -- --run 2>&1 | tail -5 && npm run build 2>&1 | tail -5`

Expected: all tests pass, `tsc --noEmit` clean, Vite build green.

### Task 3.6: i18n — bake the line break into `ui.menu.title`

**Files:**
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Update the title entry to include the line break directly**

In `src/core/i18n.ts`, find the `ui.menu.title` entry (around line 18):

```typescript
    menu: {
      title: 'Wild Haggis Survivors',
```

Replace with:
```typescript
    menu: {
      title: 'Wild Haggis\nSurvivors',
```

- [ ] **Step 2: Check existing tests**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | tail -10`

Expected: `i18n.test.ts` does not assert on `ui.menu.title` specifically, so it still passes. If any other test grep shows `'Wild Haggis Survivors'`, update those assertions to match the new value.

### Task 3.7: MenuScene — remove the fragile title `.replace()`

**Files:**
- Modify: `src/scenes/MenuScene.ts:108`

- [ ] **Step 1: Drop the string replacement**

Find:
```typescript
    const title = this.add
      .text(width / 2, 150, t('ui.menu.title').replace(' Survivors', '\nSurvivors'), {
```

Replace with:
```typescript
    const title = this.add
      .text(width / 2, 150, t('ui.menu.title'), {
```

- [ ] **Step 2: Run build + MenuScene-adjacent tests**

Run: `npm test -- --run 2>&1 | tail -5 && npm run build 2>&1 | tail -5`

Expected: green. MenuScene does not have a dedicated unit test so no regression possible from that angle; the `i18n` fence test already ensures the key resolves.

### Task 3.8: Version constant from package.json via Vite define

**Files:**
- Modify: `package.json` (bump version from 1.0.0 to 2.1.0 to match the displayed value)
- Modify: `vite.config.ts`
- Modify: `src/scenes/MenuScene.ts:231`
- Create: `src/types/globals.d.ts` (new ambient declaration)

- [ ] **Step 1: Bump package.json version**

Find:
```json
  "version": "1.0.0",
```

Replace with:
```json
  "version": "2.1.0",
```

- [ ] **Step 2: Add Vite define for __APP_VERSION__**

In `vite.config.ts`, add the package import at the top:

Find:
```typescript
import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
```

Replace with:
```typescript
import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };
```

Then add a `define` block to the config object. Find:
```typescript
export default defineConfig({
  /** Relative asset URLs so the build works on GitHub Pages project sites and file:// previews. */
  base: './',
```

Replace with:
```typescript
export default defineConfig({
  /** Relative asset URLs so the build works on GitHub Pages project sites and file:// previews. */
  base: './',
  define: {
    /** Exposed at compile time so MenuScene and any future caller reads a single source of truth. */
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
```

If the top-level `with { type: 'json' }` import syntax fails under this TypeScript/Vite version, fall back to:
```typescript
import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };
```

- [ ] **Step 3: Create ambient declaration**

Create `src/types/globals.d.ts`:

```typescript
/**
 * Build-time constants injected by Vite `define`.
 * Do not use these in test files — Vitest does not run Vite's define transform.
 */
declare const __APP_VERSION__: string;
```

Then add the types directory to the TypeScript include path. Find in `tsconfig.json` the `"include"` array and make sure `src/**/*.ts` covers `src/types/globals.d.ts`. If `tsconfig.json` uses only `"src"` as include, the `.d.ts` file is picked up automatically.

- [ ] **Step 4: MenuScene uses the constant**

Find in `src/scenes/MenuScene.ts:231`:
```typescript
    this.add
      .text(width - 10, height - 10, 'v2.1', {
```

Replace with:
```typescript
    this.add
      .text(width - 10, height - 10, `v${__APP_VERSION__}`, {
```

- [ ] **Step 5: Run build**

Run: `npm run build 2>&1 | tail -15`

Expected: `tsc --noEmit` clean (ambient declaration resolves), Vite build green, output includes `v2.1.0` in the bundled JS.

If TypeScript complains about `__APP_VERSION__` being undefined, check that `src/types/globals.d.ts` is inside the `include` scope of `tsconfig.json`. As a fallback, declare it inline at the top of `MenuScene.ts`:
```typescript
declare const __APP_VERSION__: string;
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --run 2>&1 | tail -10`

Expected: all tests pass. Vitest does not apply Vite's `define` transform by default — if any test imports `MenuScene.ts` (it doesn't currently), the `__APP_VERSION__` reference would crash. Since no test imports MenuScene, we're safe. If this changes later, add `define: { __APP_VERSION__: JSON.stringify('test') }` to `vitest.config.ts`.

### Task 3.9: index.html apple-web-app-title

**Files:**
- Modify: `index.html:9`

- [ ] **Step 1: Fix the placeholder title**

Find:
```html
  <meta name="apple-mobile-web-app-title" content="Survivor" />
```

Replace with:
```html
  <meta name="apple-mobile-web-app-title" content="Haggis Survivors" />
```

### Task 3.10: PWA manifest name cleanup (NEW — not in spec)

**Files:**
- Modify: `vite.config.ts`

Rationale: caught during plan-writing. The PWA manifest at `vite.config.ts:13-14` declares `name: 'Scottish Survivor'` and `short_name: 'Survivor'`. These show in install prompts and on the user's home screen. Same placeholder-feel issue as index.html.

- [ ] **Step 1: Update manifest name and short_name**

Find in `vite.config.ts`:
```typescript
      manifest: {
        name: 'Scottish Survivor',
        short_name: 'Survivor',
        description: 'Survive the Scottish horde — offline-capable roguelite.',
```

Replace with:
```typescript
      manifest: {
        name: 'Wild Haggis Survivors',
        short_name: 'Haggis Survivors',
        description: 'Scrap through the glen as a wild haggis — warm, drifty, stubborn. Plays offline.',
```

The updated description keeps the Scottish-flavored voice of the Soul Charter (same register as `i18n.ts` copy).

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -15`

Expected: build green, `dist/manifest.webmanifest` reflects the new names.

### Task 3.11: main.ts aria-label comment

**Files:**
- Modify: `src/main.ts:70-76`

- [ ] **Step 1: Annotate the aria-label**

Find:
```typescript
// Accessibility: label the canvas for screen readers
game.events.once('ready', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Wild Haggis Survivors game. Use WASD or arrow keys to move. Press ESC to pause.');
  }
});
```

Replace with:
```typescript
// Accessibility: label the canvas for screen readers.
// The aria-label is intentionally hardcoded in English to match document lang="en".
// When localized builds ship, derive this from t('ui.menu.title') + a per-locale
// screen-reader instruction key (`ui.a11y.canvas_instructions`).
game.events.once('ready', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Wild Haggis Survivors game. Use WASD or arrow keys to move. Press ESC to pause.');
  }
});
```

### Task 3.12: BALANCE additions — hud block + enemy elite tuning

**Files:**
- Modify: `src/core/BalanceConfig.ts`

- [ ] **Step 1: Add hud and elite blocks**

Find the closing of the `BALANCE` object literal (around line 95):

```typescript
  enemy: {
    rangedStandoffPx: 200,
    orbitRadiusPx: 180,
    phaseToggleMs: 2000,
    spawnerWarmupMs: 500,
    spawnerIntervalMs: 4000,
    hazardTtlMs: 10000,
    diveDespawnMarginPx: 300,
    rangedCooldownMs: 3000,
  },
} as const;
```

Replace with:
```typescript
  enemy: {
    rangedStandoffPx: 200,
    orbitRadiusPx: 180,
    phaseToggleMs: 2000,
    spawnerWarmupMs: 500,
    spawnerIntervalMs: 4000,
    hazardTtlMs: 10000,
    diveDespawnMarginPx: 300,
    rangedCooldownMs: 3000,
    /** Elites start spawning this many seconds into the run. */
    ELITE_UNLOCK_SEC: 120,
    /** Per-spawn chance that a non-hazard, non-swarm enemy upgrades to elite. */
    ELITE_SPAWN_CHANCE: 0.10,
  },
  hud: {
    /** Wave difficulty ladder displayed under the timer. */
    WAVE_DIFFICULTY_MARKS: [
      { minSec: 0,    label: 'I',   color: '#88cc88' },
      { minSec: 180,  label: 'II',  color: '#cccc44' },
      { minSec: 420,  label: 'III', color: '#dd8844' },
      { minSec: 720,  label: 'IV',  color: '#dd4444' },
      { minSec: 1200, label: 'V',   color: '#ff2222' },
    ] as const,
    /** Enemy count threshold above which the HUD flashes the "MAX" warning. */
    ENEMY_WARN_THRESHOLD: 350,
  },
} as const;
```

### Task 3.13: HUD consumes BALANCE.hud marks

**Files:**
- Modify: `src/ui/HUD.ts:297-311`

- [ ] **Step 1: Replace magic numbers with BALANCE lookup**

Find:
```typescript
    const mins = Math.floor(gameTimeSec / 60);
    const secs = Math.floor(gameTimeSec % 60);
    // Wave difficulty indicator + run objective countdown
    const wave = gameTimeSec < 180 ? 'I' : gameTimeSec < 420 ? 'II' : gameTimeSec < 720 ? 'III' : gameTimeSec < 1200 ? 'IV' : 'V';
    const waveColor = gameTimeSec < 180 ? '#88cc88' : gameTimeSec < 420 ? '#cccc44' : gameTimeSec < 720 ? '#dd8844' : gameTimeSec < 1200 ? '#dd4444' : '#ff2222';
```

Replace with:
```typescript
    const mins = Math.floor(gameTimeSec / 60);
    const secs = Math.floor(gameTimeSec % 60);
    // Wave difficulty indicator — resolved from BALANCE.hud so tuning stays
    // single-sourced with the wave timeline, not drifting inside UI code.
    let wave = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0].label;
    let waveColor = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0].color;
    for (const mark of BALANCE.hud.WAVE_DIFFICULTY_MARKS) {
      if (gameTimeSec >= mark.minSec) {
        wave = mark.label;
        waveColor = mark.color;
      }
    }
```

And find:
```typescript
    const enemyWarning = enemyCount >= 350 ? t('ui.hud.enemies_capped_suffix') : '';
    const enemyColor = enemyCount >= 350 ? '#ff4444' : '#ffffff';
```

Replace with:
```typescript
    const overCap = enemyCount >= BALANCE.hud.ENEMY_WARN_THRESHOLD;
    const enemyWarning = overCap ? t('ui.hud.enemies_capped_suffix') : '';
    const enemyColor = overCap ? '#ff4444' : '#ffffff';
```

### Task 3.14: SpawnSystem consumes BALANCE.enemy.ELITE_*

**Files:**
- Modify: `src/systems/SpawnSystem.ts:331-332`

- [ ] **Step 1: Replace magic numbers**

Find:
```typescript
        // Elite chance: 10% after 2 minutes, not on hazards or swarm packs
        if (this.gameTimeSec > 120 && config.behavior !== 'hazard' &&
            config.packSize <= 1 && Math.random() < 0.10) {
```

Replace with:
```typescript
        // Elite chance: BALANCE.enemy.ELITE_SPAWN_CHANCE after ELITE_UNLOCK_SEC,
        // never on hazards or swarm packs. Tuning lives in BalanceConfig.
        if (this.gameTimeSec > BALANCE.enemy.ELITE_UNLOCK_SEC
            && config.behavior !== 'hazard'
            && config.packSize <= 1
            && Math.random() < BALANCE.enemy.ELITE_SPAWN_CHANCE) {
```

### Task 3.15: enemies.ts getSpawnWeight comment

**Files:**
- Modify: `src/data/enemies.ts:232-238`

- [ ] **Step 1: Document the magic numbers**

Find:
```typescript
export function getSpawnWeight(config: EnemyConfig, gameTimeSec: number): number {
  const timeSinceAppear = gameTimeSec - config.appearsAt;
  // Weight decays over 7 minutes after the enemy type first appears.
  // Fresh enemies: weight ~10, old enemies: weight ~3 (was ~1, which
  // effectively removed them from the spawn pool).
  return Math.max(3, 10 - timeSinceAppear / 42);
}
```

Replace with:
```typescript
export function getSpawnWeight(config: EnemyConfig, gameTimeSec: number): number {
  const timeSinceAppear = gameTimeSec - config.appearsAt;
  // Weight decays over ~7 minutes after the enemy type first appears:
  //   BASE_WEIGHT   = 10  (fresh enemy)
  //   MIN_WEIGHT    = 3   (old enemy — was 1, too low, removed them from the pool)
  //   DECAY_DIVISOR = 42  (10 - 420/42 = 0 hits floor around 7 minutes)
  // Future tuning pass may promote these to BALANCE.enemy.*_WEIGHT.
  const BASE_WEIGHT = 10;
  const MIN_WEIGHT = 3;
  const DECAY_DIVISOR = 42;
  return Math.max(MIN_WEIGHT, BASE_WEIGHT - timeSinceAppear / DECAY_DIVISOR);
}
```

### Task 3.16: Green-board verification

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --run 2>&1 | tail -15`

Expected: 138 tests passing (original 136 + 1 HUD high-contrast test + 1 SpawnSystem boss warning accessibility test). No failures, no skipped.

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -20`

Expected: `tsc --noEmit` clean, Vite build green, bundle size within `chunkSizeWarningLimit`.

- [ ] **Step 3: Visual spot check (developer dev-server smoke test)**

Run: `npm run dev` and manually verify (one-time check, then ctrl-C):

1. Main menu: title displays on two lines (`Wild Haggis` / `Survivors`), version shows `v2.1.0` in bottom-right.
2. Start a run — boss warning at 5:00 (Gordon the Chef) should use scaled font if you set `uiScale` higher in SettingsScene first.
3. Toggle `High-contrast UI` in Settings, go back into a run, confirm HP/Level/Timer/Kill/DPS all shift to the high-contrast palette (not just the objective line).
4. Freeze an enemy (e.g. with Scotch Mist if you have it) — the floating snowflake is now a sprite, not a font glyph. Should render even if the system has no emoji font.

If any of 1-4 fails, stop and investigate before staging Commit 3.

### Task 3.17: Stage and commit Commit 3

- [ ] **Step 1: Review what's currently staged vs unstaged**

Run: `git status`

Expected: Commits 1 and 2 are already landed, so `HEAD` is the `.gitignore` commit. Working tree should show ~41 modified files (original polish pass + your new edits) plus ~9 untracked files (the new tests + `cameraViewport.ts` + `GameSessionLifecycle.ts`) minus `src/ui/uiSafeViewport.ts` (deleted).

- [ ] **Step 2: Stage all the Commit 3 files explicitly**

Do NOT use `git add -A`. Stage by directory / file so any stray file is visible:

```bash
git add \
  src/core/BalanceConfig.ts \
  src/core/AssetValidator.ts \
  src/core/AssetValidator.test.ts \
  src/core/GameSessionLifecycle.ts \
  src/core/GameSessionLifecycle.test.ts \
  src/core/RunHydration.test.ts \
  src/core/SaveManager.ts \
  src/core/SaveManager.test.ts \
  src/core/SettingsManager.ts \
  src/core/SettingsManager.test.ts \
  src/core/evolutionChest.ts \
  src/core/i18n.ts \
  src/core/i18n.test.ts \
  src/data/enemies.ts \
  src/data/upgrades.ts \
  src/data/upgrades.icons.test.ts \
  src/data/weapons.ts \
  src/entities/Enemy.ts \
  src/entities/Player.ts \
  src/main.ts \
  src/scenes/BootScene.ts \
  src/scenes/GameOverScene.ts \
  src/scenes/GameScene.ts \
  src/scenes/MenuScene.ts \
  src/scenes/MetaShopScene.ts \
  src/scenes/SettingsScene.ts \
  src/scenes/ShopScene.ts \
  src/systems/AudioSystem.ts \
  src/systems/GrowthSystem.ts \
  src/systems/JuiceSystem.ts \
  src/systems/JuiceSystem.test.ts \
  src/systems/RunStatsTracker.ts \
  src/systems/RunStatsTracker.test.ts \
  src/systems/SpawnSystem.ts \
  src/systems/SpawnSystem.ui.test.ts \
  src/systems/TutorialSystem.ts \
  src/systems/TutorialSystem.test.ts \
  src/systems/WeaponSystem.ts \
  src/ui/DebugOverlay.ts \
  src/ui/DebugOverlay.test.ts \
  src/ui/HUD.ts \
  src/ui/HUD.test.ts \
  src/ui/Minimap.ts \
  src/ui/Minimap.test.ts \
  src/ui/UpgradeCards.ts \
  src/ui/UpgradeCards.test.ts \
  src/ui/cameraViewport.ts \
  index.html \
  package.json \
  vite.config.ts
```

If Task 3.8 created `src/types/globals.d.ts` (the default path), add it too:

```bash
git add src/types/globals.d.ts
```

If Task 3.8 took the inline-fallback (declared `__APP_VERSION__` at the top of `MenuScene.ts`), skip the `src/types/globals.d.ts` line — the inline declaration is already captured when staging `src/scenes/MenuScene.ts`.

- [ ] **Step 3: Stage the uiSafeViewport deletion**

Run: `git rm src/ui/uiSafeViewport.ts 2>/dev/null || git add -u src/ui/uiSafeViewport.ts`

(The file was deleted in Task 3.1 — this records the deletion in the index.)

- [ ] **Step 4: Verify nothing unexpected is staged or missing**

Run: `git status --short`

Expected: all listed files in the staged area, and `git status --short | grep -v "^[ADMR]"` returns empty (no untracked files remaining outside `.gitignore`).

If the test files for something you DIDN'T touch show up as unstaged, that's probably a line-ending normalization (LF → CRLF). Stage them too with `git add <file>`.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ux): Soul charter polish pass

Completes the coordinated UX pass that wires docs/DESIGN_SOUL.md
into every player-facing surface of Wild Haggis Survivors.

Run start: identity handoff toast (variant name + flavor) on the
first seconds of every run. Warm, Scots-tinged copy throughout the
HUD, pause overlay, boss warnings, treasure toasts, achievement
announcements, level-up banners, and game-over screen. Compassionate
failure copy ("Hooves down — braw try", "Nae shame in it — every
tumble teaches the hooves"). Tutorial flow uses the same voice.

Accessibility: UI scale (0.8-1.4) and high-contrast mode exposed
in Settings, respected across HUD, menu, game-over screen, shop,
meta shop, and the boss-warning banner (the last two landed in this
commit). HUD high-contrast palette now covers every text surface,
not just the HP bar background and objective line.

HUD: sprite-based shield + dash pips (no emoji / font glyphs),
objective countdown beneath the timer, wave difficulty marks driven
by BALANCE.hud so tuning stays single-sourced. Enemy freeze FX now
uses a generated fx_snowflake sprite instead of the ❄ character.

Tests: HUD, Minimap, UpgradeCards, JuiceSystem, SpawnSystem UI,
GameSessionLifecycle, and upgrades icons all get dedicated suites.
138 tests total, all passing.

Infrastructure: cameraViewport + GameSessionLifecycle helpers
extracted for reuse; uiSafeViewport.ts (orphaned sibling) deleted.
BALANCE.hud.WAVE_DIFFICULTY_MARKS and BALANCE.enemy.ELITE_* move
the last magic numbers out of UI code. App version displayed in the
main menu is now read from package.json via a Vite `define` so it
cannot drift. index.html + PWA manifest updated so the iOS / Android
install title matches the in-game brand.

Main character: the wild haggis, and its stubborn drift, still at
the center.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Verify the commit**

Run: `git log --oneline -3 && git show --stat HEAD | tail -5`

Expected: commit lands, stat shows ~50 files changed (39 modified + 9 new + 2 new helper types + 1 deletion + ~1 package.json, give or take), several thousand insertions.

---

## Phase 4 — Commit 4: Complete the i18n data-file migration

Goal: Migrate ~158 hardcoded English player-facing strings from data files (`weapons.ts`, `upgrades.ts`, `permanentUpgrades.ts`, `enemies.ts`, `variants.ts`) into `i18n.ts` via the `nameKey`/`descriptionKey` pattern. Add regression-fence tests so future data additions cannot bypass i18n.

**Phase 4 approach:**
1. Write the regression-fence tests first — they fail.
2. Add each data namespace one at a time: weapons → bosses → variants → permanent upgrades → upgrade cards. After each namespace the fence tests for that namespace flip from red to green.
3. Update call sites (Shop, HUD, MenuScene, GameScene, UpgradeCards) to resolve via `t()`.
4. Update the existing assertions in `upgrades.icons.test.ts` and `UpgradeCards.test.ts`.
5. Run full suite + build.
6. Commit.

**Important convention for this phase**: when populating new dictionary entries, keep the existing warm Scots-tinged voice already established in `EN_STRINGS`. Examples to match:
- `'The glen remembers: {count} lifetime culls'`
- `'Hooves down — braw try'`
- `'Nae shame in it — every tumble teaches the hooves'`

Flat transliterations from the current hardcoded English are acceptable where the current voice is already good; lean warmer where the current copy is dry.

### Task 4.1: Regression-fence tests in i18n.test.ts

**Files:**
- Modify: `src/core/i18n.test.ts`

- [ ] **Step 1: Add fence tests that will fail until all namespaces are populated**

Append to `src/core/i18n.test.ts` after the existing `describe` block:

```typescript
import { WEAPON_DEFS } from '../data/weapons';
import { BOSSES } from '../data/enemies';
import { VARIANTS } from '../data/variants';
import { PERMANENT_UPGRADES } from '../data/permanentUpgrades';
import { WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS } from '../data/upgrades';

/**
 * Regression fences — every data-file row that is player-facing must have
 * a resolvable i18n key. If a new weapon / boss / variant / upgrade is added
 * without wiring the corresponding dictionary entry, these tests fail loudly.
 */
describe('i18n regression fences — data-file coverage', () => {
  function assertResolves(key: string, label: string): void {
    const resolved = t(key);
    expect(resolved, `${label}: ${key}`).not.toBe(key);
    expect(resolved.length, `${label}: ${key} must be non-empty`).toBeGreaterThan(0);
  }

  it('every WEAPON_DEFS entry has resolving nameKey and descriptionKey', () => {
    for (const w of Object.values(WEAPON_DEFS)) {
      assertResolves(w.nameKey, `weapon.${w.key}.name`);
      assertResolves(w.descriptionKey, `weapon.${w.key}.description`);
    }
  });

  it('every BOSS entry has a resolving nameKey', () => {
    for (const b of BOSSES) {
      assertResolves(b.nameKey, `boss.${b.key}.name`);
      // warningKey was already migrated; fence it too for consistency.
      assertResolves(b.warningKey, `boss.${b.key}.warning`);
    }
  });

  it('every VARIANT entry has resolving nameKey and flavorKey', () => {
    for (const v of VARIANTS) {
      assertResolves(v.nameKey, `variant.${v.key}.name`);
      assertResolves(v.flavorKey, `variant.${v.key}.flavor`);
    }
  });

  it('variant modifier summary helper namespace is fully populated', () => {
    for (const k of ['speed', 'hp', 'armor', 'pickup', 'xp', 'dmg', 'drift', 'cdr', 'baseline']) {
      assertResolves(`variant.summary.${k}`, `variant.summary.${k}`);
    }
  });

  it('variant unlock helper namespace is fully populated', () => {
    for (const k of ['survive', 'best_kills', 'total_gold', 'victories', 'ready']) {
      assertResolves(`variant.unlock.${k}`, `variant.unlock.${k}`);
    }
  });

  it('every PERMANENT_UPGRADES entry has resolving nameKey and descriptionKey', () => {
    for (const u of PERMANENT_UPGRADES) {
      assertResolves(u.nameKey, `permanentUpgrade.${u.key}.name`);
      assertResolves(u.descriptionKey, `permanentUpgrade.${u.key}.description`);
    }
  });

  it('every UpgradeCard entry (WEAPON/PASSIVE/STAT) has resolving name and description keys', () => {
    for (const arr of [WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS]) {
      for (const c of arr) {
        assertResolves(c.name, `upgradeCard.${c.id}.name`);
        assertResolves(c.description, `upgradeCard.${c.id}.description`);
      }
    }
  });

  it('rarity labels are defined for all four rarities', () => {
    for (const r of ['common', 'uncommon', 'rare', 'legendary']) {
      assertResolves(`ui.common.rarity.${r}`, `ui.common.rarity.${r}`);
    }
  });

  it('HUD passive abbreviation namespace is populated for all 6 passives', () => {
    for (const k of ['sporran', 'whisky_flask', 'kilt', 'tam_o_shanter', 'irn_bru', 'loch_water']) {
      assertResolves(`ui.passive.hud_abbrev.${k}`, `ui.passive.hud_abbrev.${k}`);
    }
  });

  it('menu stats line templates exist in short and long forms', () => {
    assertResolves('ui.menu.stats_short', 'ui.menu.stats_short');
    assertResolves('ui.menu.stats_long', 'ui.menu.stats_long');
  });
});
```

- [ ] **Step 2: Run tests — expect many FAILURES**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | tail -40`

Expected: the existing `describe('i18n.t')` block passes (6 tests). The new `describe('i18n regression fences')` block fails across most of its cases because the data files don't yet have `nameKey` fields and the dictionary lacks those namespaces. This is the target state — we now have a red fence we're driving to green.

### Task 4.2: Populate weapon.* namespace and add fields to WeaponDef

**Files:**
- Modify: `src/data/weapons.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Add nameKey / descriptionKey to the WeaponDef interface**

In `src/data/weapons.ts`, find:
```typescript
export interface WeaponDef {
  key: string;
  name: string;
  description: string;
  behavior: WeaponBehavior;
```

Replace with:
```typescript
export interface WeaponDef {
  key: string;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(descriptionKey)` at render time. */
  descriptionKey: string;
  /**
   * @deprecated Use t(nameKey) for player-facing text. This literal is kept
   * during the migration window so auto-battler debug logs still work.
   */
  name: string;
  /**
   * @deprecated Use t(descriptionKey) for player-facing text.
   */
  description: string;
  behavior: WeaponBehavior;
```

- [ ] **Step 2: Populate every weapon entry with keys**

Update each entry in the `WEAPON_DEFS` record. Example for `thistle_shot`:

Find:
```typescript
  thistle_shot: {
    key: 'thistle_shot',
    name: 'Thistle Shot',
    description: 'Fires sharp thistles at the nearest enemy.',
    behavior: 'projectile',
```

Replace with:
```typescript
  thistle_shot: {
    key: 'thistle_shot',
    nameKey: 'weapon.thistle_shot.name',
    descriptionKey: 'weapon.thistle_shot.description',
    name: 'Thistle Shot',
    description: 'Fires sharp thistles at the nearest enemy.',
    behavior: 'projectile',
```

Apply the same pattern to: `bagpipe_blast`, `caber_toss`, `scotch_mist`, `haggis_hurler`, `nessie_tentacle`, `claymore`, `bagpipes`.

- [ ] **Step 3: Add the weapon.* namespace to EN_STRINGS**

In `src/core/i18n.ts`, inside `EN_STRINGS`, add a new top-level namespace after the existing `tutorial` block:

```typescript
  weapon: {
    thistle_shot: {
      name: 'Thistle Shot',
      description: 'Sharp thistles fly at the nearest bother.',
    },
    bagpipe_blast: {
      name: 'Bagpipe Blast',
      description: 'A wee shockwave to knock the breath oot o\' foes.',
    },
    caber_toss: {
      name: 'Caber Toss',
      description: 'Hurl a heavy log clean through a crowd.',
    },
    scotch_mist: {
      name: 'Scotch Mist',
      description: 'Leave a choking fog trail that bites the chase.',
    },
    haggis_hurler: {
      name: 'Jobby Hurler',
      description: 'Bouncing wee jobbies that ricochet till they stick.',
    },
    nessie_tentacle: {
      name: "Nessie's Tentacle",
      description: 'A sweeping arc — meaty reach, meatier knockback.',
    },
    claymore: {
      name: 'Highland Claymore',
      description: 'Slow, enormous, absolutely cleaving.',
    },
    bagpipes: {
      name: 'Ceòl Mòr Bagpipes',
      description: 'A standing drone — ringing harm to anything that creeps too close.',
    },
  },
```

- [ ] **Step 4: Run fence test — weapon slice should now be GREEN**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | grep -A 2 "WEAPON_DEFS"`

Expected: `every WEAPON_DEFS entry has resolving nameKey and descriptionKey` passes. The other fence tests still fail.

### Task 4.3: Populate boss.* namespace

**Files:**
- Modify: `src/data/enemies.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Add nameKey to BossConfig**

Find:
```typescript
export interface BossConfig {
  key: string;
  name: string;
  /** i18n dot-path — resolved with `t(warningKey)` at show time */
  warningKey: string;
```

Replace with:
```typescript
export interface BossConfig {
  key: string;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** @deprecated Use t(nameKey). Kept for auto-battler debug logging. */
  name: string;
  /** i18n dot-path — resolved with `t(warningKey)` at show time */
  warningKey: string;
```

- [ ] **Step 2: Populate every boss with nameKey**

Example:
Find:
```typescript
  {
    key: 'gordon',
    name: 'Gordon the Chef',
    warningKey: 'ui.bossWarning.gordon',
```

Replace with:
```typescript
  {
    key: 'gordon',
    nameKey: 'boss.gordon.name',
    name: 'Gordon the Chef',
    warningKey: 'ui.bossWarning.gordon',
```

Apply the same to: `tour_bus`, `the_laird`, `hunter_general`, `taxman`.

- [ ] **Step 3: Add boss.* namespace to EN_STRINGS**

In `src/core/i18n.ts`, add after the new `weapon:` block:

```typescript
  boss: {
    gordon: { name: 'Gordon the Chef' },
    tour_bus: { name: 'The Tour Bus' },
    the_laird: { name: 'The Laird' },
    hunter_general: { name: 'The Haggis Hunter General' },
    taxman: { name: 'Death (The Taxman)' },
  },
```

- [ ] **Step 4: Update the boss fence test to match actual warning key paths**

The fence test references `b.warningKey` which is `'ui.bossWarning.<key>'`, not `'boss.<key>.warning'`. Update the test to assert against the actual key pattern — reopen `src/core/i18n.test.ts` and find:

```typescript
  it('every BOSS entry has a resolving nameKey', () => {
    for (const b of BOSSES) {
      assertResolves(b.nameKey, `boss.${b.key}.name`);
      // warningKey was already migrated; fence it too for consistency.
      assertResolves(b.warningKey, `boss.${b.key}.warning`);
    }
  });
```

Replace with:
```typescript
  it('every BOSS entry has a resolving nameKey and warningKey', () => {
    for (const b of BOSSES) {
      assertResolves(b.nameKey, `boss.${b.key}.name`);
      // warningKey lives under ui.bossWarning.* (already migrated earlier).
      assertResolves(b.warningKey, b.warningKey);
    }
  });
```

- [ ] **Step 5: Run fence test — boss slice GREEN**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | grep -A 2 "BOSS entry"`

Expected: passes.

### Task 4.4: Populate variant.* namespace and rewrite helpers

**Files:**
- Modify: `src/data/variants.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Add nameKey and flavorKey to VariantDef**

Find:
```typescript
export interface VariantDef {
  key: VariantKey;
  name: string;
  textureKey: string;
  flavorText: string;
```

Replace with:
```typescript
export interface VariantDef {
  key: VariantKey;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(flavorKey)` at render time. */
  flavorKey: string;
  /** @deprecated Use t(nameKey). Kept during migration for auto-battler logs. */
  name: string;
  textureKey: string;
  /** @deprecated Use t(flavorKey). */
  flavorText: string;
```

- [ ] **Step 2: Populate every variant with keys**

Example for `classic`:

Find:
```typescript
  {
    key: 'classic',
    name: 'Classic Haggis',
    textureKey: 'haggis_classic',
    flavorText: 'The baseline beast. Crooked legs, straight ambition.',
    modifiers: {},
```

Replace with:
```typescript
  {
    key: 'classic',
    nameKey: 'variant.classic.name',
    flavorKey: 'variant.classic.flavor',
    name: 'Classic Haggis',
    textureKey: 'haggis_classic',
    flavorText: 'The baseline beast. Crooked legs, straight ambition.',
    modifiers: {},
```

Apply the same pattern to `moor_runner`, `iron_belly`, `glen_forager`, `surefoot`.

- [ ] **Step 3: Rewrite formatVariantModifierSummary**

Find the function and replace with:

```typescript
export function formatVariantModifierSummary(variant: VariantDef): string {
  const parts: string[] = [];
  const { modifiers } = variant;
  const pctInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    pct: Math.round(value * 100),
  });
  const flatInterp = (value: number) => ({
    sign: value > 0 ? '+' : '',
    val: value,
  });

  if (modifiers.moveSpeedPct) parts.push(t('variant.summary.speed', pctInterp(modifiers.moveSpeedPct)));
  if (modifiers.maxHpFlat) parts.push(t('variant.summary.hp', flatInterp(modifiers.maxHpFlat)));
  if (modifiers.armorFlat) parts.push(t('variant.summary.armor', flatInterp(modifiers.armorFlat)));
  if (modifiers.pickupRadiusFlat) parts.push(t('variant.summary.pickup', flatInterp(modifiers.pickupRadiusFlat)));
  if (modifiers.xpMultiplierPct) parts.push(t('variant.summary.xp', pctInterp(modifiers.xpMultiplierPct)));
  if (modifiers.damagePct) parts.push(t('variant.summary.dmg', pctInterp(modifiers.damagePct)));
  if (modifiers.driftReductionPct) parts.push(t('variant.summary.drift', pctInterp(modifiers.driftReductionPct)));
  if (modifiers.cooldownReductionPct) parts.push(t('variant.summary.cdr', pctInterp(modifiers.cooldownReductionPct)));

  return parts.length > 0 ? parts.join('  |  ') : t('variant.summary.baseline');
}
```

This requires importing `t`. Add at the top of `src/data/variants.ts`:

```typescript
import { t } from '../core/i18n';
```

- [ ] **Step 4: Rewrite formatVariantUnlockText and getVariantUnlockProgress**

Find `formatVariantUnlockText` and replace:

```typescript
export function formatVariantUnlockText(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): string {
  if (isVariantUnlocked(variant, progress)) return t('variant.unlock.ready');

  const unlockProgress = getVariantUnlockProgress(variant, progress);
  if (!unlockProgress) return t('variant.unlock.ready');

  return `${unlockProgress.label}: ${unlockProgress.currentText} / ${unlockProgress.requiredText}`;
}
```

Find `getVariantUnlockProgress` and replace each label literal with a `t()` call:

```typescript
export function getVariantUnlockProgress(
  variant: VariantDef,
  progress: VariantProgressSnapshot
): VariantUnlockProgress | null {
  switch (variant.unlock.type) {
    case 'default':
      return null;
    case 'best_time':
      return createUnlockProgress(
        t('variant.unlock.survive'),
        progress.bestTime,
        variant.unlock.required,
        formatTime(progress.bestTime),
        formatTime(variant.unlock.required)
      );
    case 'best_kills':
      return createUnlockProgress(
        t('variant.unlock.best_kills'),
        progress.bestKills,
        variant.unlock.required,
        `${progress.bestKills}`,
        `${variant.unlock.required}`
      );
    case 'total_gold_earned':
      return createUnlockProgress(
        t('variant.unlock.total_gold'),
        progress.totalGoldEarned,
        variant.unlock.required,
        `${progress.totalGoldEarned}`,
        `${variant.unlock.required}`
      );
    case 'victories':
      return createUnlockProgress(
        t('variant.unlock.victories'),
        progress.victories,
        variant.unlock.required,
        `${progress.victories}`,
        `${variant.unlock.required}`
      );
  }
}
```

- [ ] **Step 5: Add variant.* namespace to EN_STRINGS**

Append to `src/core/i18n.ts` after the `boss:` block:

```typescript
  variant: {
    classic: {
      name: 'Classic Haggis',
      flavor: 'The baseline beast. Crooked legs, straight ambition.',
    },
    moor_runner: {
      name: 'Moor Runner',
      flavor: 'Lean and wind-cut, built to skim the heather.',
    },
    iron_belly: {
      name: 'Iron Belly',
      flavor: 'Heavy, stubborn, and hard to stop once it starts rolling.',
    },
    glen_forager: {
      name: 'Glen Forager',
      flavor: 'A scavenger of glens and glittering spoils.',
    },
    surefoot: {
      name: 'Surefoot',
      flavor: 'The drift still whispers, but it no longer decides.',
    },
    summary: {
      speed: '{sign}{pct}% speed',
      hp: '{sign}{val} HP',
      armor: '{sign}{val} armor',
      pickup: '{sign}{val} pickup',
      xp: '{sign}{pct}% XP',
      dmg: '{sign}{pct}% dmg',
      drift: '{sign}{pct}% drift',
      cdr: '{sign}{pct}% CDR',
      baseline: 'Baseline stats',
    },
    unlock: {
      survive: 'Survive',
      best_kills: 'Best kills',
      total_gold: 'Total gold',
      victories: 'Victories',
      ready: 'Ye earned this one',
    },
  },
```

- [ ] **Step 6: Run fence tests — variant slices GREEN**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | grep -A 2 -E "VARIANT|variant "`

Expected: all three variant fences pass.

### Task 4.5: Populate permanentUpgrade.* namespace

**Files:**
- Modify: `src/data/permanentUpgrades.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Add nameKey and descriptionKey to PermanentUpgrade**

Find:
```typescript
export interface PermanentUpgrade {
  key: string;
  name: string;
  description: string;
  maxLevel: number;
```

Replace with:
```typescript
export interface PermanentUpgrade {
  key: string;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(descriptionKey)` at render time. */
  descriptionKey: string;
  /** @deprecated Use t(nameKey). Kept for analytics / debug paths. */
  name: string;
  /** @deprecated Use t(descriptionKey). */
  description: string;
  maxLevel: number;
```

- [ ] **Step 2: Populate every upgrade**

Example:

Find:
```typescript
  {
    key: 'thick_hide',
    name: 'Thick Hide',
    description: '+5% starting HP',
    maxLevel: 5,
```

Replace with:
```typescript
  {
    key: 'thick_hide',
    nameKey: 'permanentUpgrade.thick_hide.name',
    descriptionKey: 'permanentUpgrade.thick_hide.description',
    name: 'Thick Hide',
    description: '+5% starting HP',
    maxLevel: 5,
```

Apply the same to every entry: `strong_legs`, `sharp_thistles`, `magnetic_personality`, `lucky_heather`, `drift_control`, `extra_choice`, `battle_hardened`, `weapon_training`, `crit_power`, `xp_boost`, `lucky_start`, `natural_recovery`, `revival`, `double_dash`, `treasure_magnet`.

- [ ] **Step 3: Add permanentUpgrade.* namespace to EN_STRINGS**

Append:
```typescript
  permanentUpgrade: {
    thick_hide: { name: 'Thick Hide', description: 'Start each run with a wee bit more bite to your HP (+5%).' },
    strong_legs: { name: 'Strong Legs', description: 'Quicker hooves from the first step (+3% speed).' },
    sharp_thistles: { name: 'Sharp Thistles', description: 'Every thistle hits a shade harder (+5% damage).' },
    magnetic_personality: { name: 'Magnetic Personality', description: 'Gems lean toward ye (+10% pickup radius).' },
    lucky_heather: { name: 'Lucky Heather', description: 'The glen rolls kinder picks (+10% card rarity).' },
    drift_control: { name: 'Drift Control', description: 'Tighter turns, fewer tumbles (-15% clockwise drift).' },
    extra_choice: { name: 'Extra Choice', description: 'Four cards on level-up instead of three.' },
    battle_hardened: { name: 'Battle Hardened', description: 'Start each run with +2 armor.' },
    weapon_training: { name: 'Weapon Training', description: 'Thistle Shot starts a level stronger.' },
    crit_power: { name: 'Deadly Precision', description: '+3% crit chance and +25% crit damage.' },
    xp_boost: { name: 'Scholar\'s Mind', description: '+8% XP gain — level up sooner.' },
    lucky_start: { name: 'Lucky Start', description: 'Start each run with a random curio in your pocket.' },
    natural_recovery: { name: 'Natural Recovery', description: '+0.3 HP/sec passive regeneration.' },
    revival: { name: 'Second Wind', description: 'Once per run, shrug off death with 50% HP.' },
    double_dash: { name: 'Double Dash', description: 'Two dash charges instead of one.' },
    treasure_magnet: { name: 'Treasure Magnet', description: 'Chests and coins linger 5 seconds longer.' },
  },
```

Note that `crit_power` and `revival` have different display names (`Deadly Precision`, `Second Wind`) than their keys — consistent with the original literals.

- [ ] **Step 4: Run fence test**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | grep -A 2 "PERMANENT_UPGRADES"`

Expected: passes.

### Task 4.6: Populate upgradeCard.* namespace and migrate cards to keys

**Files:**
- Modify: `src/data/upgrades.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Store i18n keys directly in card `name`/`description` fields**

The existing contract (as proven by `evolutionChest.ts`) is: `UpgradeCard.name` and `.description` hold i18n dot-paths. `UpgradeCards.ts:207,214` already calls `t(card.name)` / `t(card.description)`. We just need the card arrays to follow the contract.

Example for the first entry in `WEAPON_CARDS`:

Find:
```typescript
  {
    id: 'add_bagpipe_blast',
    name: 'Bagpipe Blast',
    description: 'Blasts of sound in a ring around you — knocks foes outward.',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_blast',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
```

Replace with:
```typescript
  {
    id: 'add_bagpipe_blast',
    name: 'upgradeCard.add_bagpipe_blast.name',
    description: 'upgradeCard.add_bagpipe_blast.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_blast',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
```

Apply the same transformation to EVERY entry in `WEAPON_CARDS` (7), `PASSIVE_CARDS` (9), and `STAT_CARDS` (17). Each card's `name` becomes `upgradeCard.<id>.name` and `description` becomes `upgradeCard.<id>.description`.

- [ ] **Step 2: Migrate the evolution hint template**

The inline English hint on line ~349 needs to go through `t()`:

Find:
```typescript
    if (level < 5) {
      // Add evolution hint on level 4→5 cards
      const recipe = EVOLUTION_RECIPES.find((r) => r.baseWeapon === key);
      const hint = level === 4 && recipe
        ? ` At Lv 5, open a treasure chest while carrying ${formatPassiveItemName(recipe.requiredPassive)} to evolve.`
        : '';
      pool.push({
        id: `levelup_${key}_${level + 1}`,
        name: `${formatWeaponName(key)} Lv${level + 1}`,
        description: `Upgrade ${formatWeaponName(key)} to level ${level + 1}.${hint}`,
        rarity: level === 4 && recipe ? 'legendary' : (level >= 3 ? 'rare' : 'uncommon'),
        icon: `wicon_${key}`,
        effect: { type: 'level_weapon', weaponKey: key },
      });
    }
```

Replace with:
```typescript
    if (level < 5) {
      // Add evolution hint on level 4→5 cards
      const recipe = EVOLUTION_RECIPES.find((r) => r.baseWeapon === key);
      const weaponName = formatWeaponName(key);
      const nextLevel = level + 1;
      const hint = level === 4 && recipe
        ? t('upgradeCard.evolution_hint', { passive: formatPassiveItemName(recipe.requiredPassive) })
        : '';
      // Level-up cards are constructed on the fly — their display text is
      // baked in here rather than routed through a fresh dictionary key per
      // weapon × level combination. The fixed strings live in
      // `upgradeCard.levelup.*` so the phrasing is still in i18n.
      pool.push({
        id: `levelup_${key}_${nextLevel}`,
        name: t('upgradeCard.levelup.name', { weapon: weaponName, level: nextLevel }),
        description: t('upgradeCard.levelup.description', { weapon: weaponName, level: nextLevel }) + hint,
        rarity: level === 4 && recipe ? 'legendary' : (level >= 3 ? 'rare' : 'uncommon'),
        icon: `wicon_${key}`,
        effect: { type: 'level_weapon', weaponKey: key },
      });
    }
```

- [ ] **Step 3: Update formatWeaponName and formatPassiveItemName to resolve through i18n**

At the bottom of `src/data/upgrades.ts`, find:

```typescript
function formatWeaponName(key: string): string {
  const def = WEAPON_DEFS[key];
  if (def) return def.name;
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPassiveItemName(passiveKey: string): string {
  const found = PASSIVE_CARDS.find(
    (c) => c.effect.type === 'add_passive' && c.effect.passiveKey === passiveKey
  );
  return found?.name
    ?? passiveKey.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
```

Replace with:
```typescript
function formatWeaponName(key: string): string {
  const def = WEAPON_DEFS[key];
  if (def) return t(def.nameKey);
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPassiveItemName(passiveKey: string): string {
  const found = PASSIVE_CARDS.find(
    (c) => c.effect.type === 'add_passive' && c.effect.passiveKey === passiveKey
  );
  return found ? t(found.name) /* card.name is now an i18n key */
    : passiveKey.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
```

Add the import at the top of `src/data/upgrades.ts`:

```typescript
import { t } from '../core/i18n';
```

- [ ] **Step 4: Add upgradeCard.* namespace to EN_STRINGS**

Add a large block. I'll give the full content here (one entry per card):

```typescript
  upgradeCard: {
    // Weapon cards
    add_bagpipe_blast: {
      name: 'Bagpipe Blast',
      description: 'Blasts of sound in a ring around ye — knocks foes outward.',
    },
    add_caber_toss: {
      name: 'Caber Toss',
      description: 'Hurl a heavy caber through a line of enemies.',
    },
    add_scotch_mist: {
      name: 'Scotch Mist',
      description: 'A choking mist trail that poisons any that linger.',
    },
    add_haggis_hurler: {
      name: 'Jobby Hurler',
      description: 'Wee jobbies that ricochet off the arena until they hit.',
    },
    add_nessie_tentacle: {
      name: "Nessie's Tentacle",
      description: 'A sweeping arc before ye — wide reach, meaty knockback.',
    },
    add_claymore: {
      name: 'Highland Claymore',
      description: 'Slow, enormous frontal cleave. Pairs with Tartan Sash to evolve.',
    },
    add_bagpipes: {
      name: 'Ceòl Mòr Bagpipes',
      description: 'A great drone — a pulsing ring harms and slows anything too close.',
    },
    // Passive cards
    add_sporran: {
      name: 'Sporran',
      description: '+15% Luck — rarer cards show up more often. Evolves Thistle Shot.',
    },
    add_whisky_flask: {
      name: 'Whisky Flask',
      description: '+20% radius on every AoE. Evolves Bagpipe Blast.',
    },
    add_kilt: {
      name: 'Kilt',
      description: '+15% max HP — room for one more mistake. Evolves Caber Toss.',
    },
    add_tam_o_shanter: {
      name: "Tam o' Shanter",
      description: '+10% move speed — easier kiting against the drift. Evolves Scotch Mist.',
    },
    add_irn_bru: {
      name: 'Irn Bru',
      description: '+20% attack speed — weapons fire a shade faster. Evolves Jobby Hurler.',
    },
    add_loch_water: {
      name: 'Loch Water',
      description: '+25% pickup radius — gems and drops come to ye. Evolves Nessie\'s Tentacle.',
    },
    add_thistle_crown: {
      name: 'Thistle Crown',
      description: '+5% crit chance. Thorns: enemies that bump into ye take 3 damage.',
    },
    add_highland_shield: {
      name: 'Highland Shield',
      description: 'Every 20s, ignore a lethal hit — survive at 1 HP instead of dying.',
    },
    add_tartan_sash: {
      name: 'Tartan Sash',
      description: '+8% damage on every source. Evolves Highland Claymore.',
    },
    // Stat boost cards
    boost_hp: {
      name: 'Thick Hide',
      description: '+10 max HP — flat buffer. Stack as many as ye like.',
    },
    boost_speed: {
      name: 'Quick Feet',
      description: '+8% move speed — reposition faster, drift still applies.',
    },
    boost_pickup: {
      name: 'Keen Nose',
      description: '+15 pickup radius — XP gems and drops reach ye sooner.',
    },
    boost_damage: {
      name: 'Sharpened Thistles',
      description: '+10% damage — every weapon and effect hits harder.',
    },
    boost_drift: {
      name: 'Balanced Legs',
      description: '-15% clockwise drift — inputs feel closer to where ye aim.',
    },
    heal: {
      name: 'Haggis Supper',
      description: 'Instantly heal 25% of yir current max HP.',
    },
    boost_crit: {
      name: 'Eagle Eye',
      description: '+5% crit chance — more lucky big hits.',
    },
    boost_regen: {
      name: 'Highland Spring',
      description: '+0.5 HP per second — slow but steady recovery.',
    },
    boost_armor: {
      name: 'Iron Hide',
      description: '+3 armor — flat reduction on incoming damage.',
    },
    boost_cooldown: {
      name: 'Battle Frenzy',
      description: '-10% weapon cooldowns — more swings, shots, and pulses.',
    },
    banish: {
      name: 'Highland Purge',
      description: 'Remove up to 5 of the weakest nearby enemies — breathing room now.',
    },
    boost_lifesteal: {
      name: 'Vampiric Touch',
      description: '+1 HP on every kill.',
    },
    boost_projectile_speed: {
      name: 'Swift Thistles',
      description: '+15% projectile speed — arrives faster, sticks sooner.',
    },
    boost_boss_heal: {
      name: 'Trophy Hunter',
      description: 'When a boss dies, heal 20% max HP — reward for the big fight.',
    },
    boost_knockback: {
      name: 'Highland Force',
      description: '+25% knockback — shove enemies harder on every hit.',
    },
    boost_xp: {
      name: 'Wisdom of the Highlands',
      description: '+15% XP from enemies — level up sooner.',
    },
    // Templates used by buildCardPool for level-up cards
    levelup: {
      name: '{weapon} Lv{level}',
      description: 'Upgrade {weapon} to level {level}.',
    },
    evolution_hint: ' At Lv 5, open a treasure chest while carrying {passive} to evolve.',
  },
```

- [ ] **Step 5: Add ui.common.rarity.* to EN_STRINGS**

In the existing `ui.common` block, add a `rarity` sub-object:

Find:
```typescript
    common: {
      owned: 'Yours',
      locked: 'Not yet',
      buy_kills: '{cost} culls',
      on: 'ON',
      off: 'OFF',
    },
```

Replace with:
```typescript
    common: {
      owned: 'Yours',
      locked: 'Not yet',
      buy_kills: '{cost} culls',
      on: 'ON',
      off: 'OFF',
      rarity: {
        common: 'COMMON',
        uncommon: 'UNCOMMON',
        rare: 'RARE',
        legendary: 'LEGENDARY',
      },
    },
```

- [ ] **Step 6: Run fence test — upgradeCard + rarity slices GREEN**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | grep -A 2 -E "UpgradeCard|rarity labels"`

Expected: both pass.

### Task 4.7: Populate ui.passive.hud_abbrev.* and ui.menu.stats_*

**Files:**
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Add HUD passive abbreviations**

Find inside `ui.passive`:
```typescript
    passive: {
      pause_short: {
        sporran: 'Sporran (+15% Luck)',
        // ...
      },
    },
```

Add a sibling `hud_abbrev` block:

```typescript
    passive: {
      pause_short: {
        sporran: 'Sporran (+15% Luck)',
        whisky_flask: 'Whisky Flask (+20% AoE)',
        kilt: 'Kilt (+15% Max HP)',
        tam_o_shanter: "Tam o' Shanter (+10% Speed)",
        irn_bru: 'Irn Bru (+20% Atk Spd)',
        loch_water: 'Loch Water (+25% Pickup)',
        thistle_crown: 'Thistle Crown (Crit+Thorns)',
        highland_shield: 'Highland Shield (Death Save)',
        tartan_sash: 'Tartan Sash (+8% Dmg, Claymore Evo)',
      },
      hud_abbrev: {
        sporran: 'SPR',
        whisky_flask: 'WFL',
        kilt: 'KLT',
        tam_o_shanter: 'TAM',
        irn_bru: 'IRN',
        loch_water: 'LOC',
      },
    },
```

- [ ] **Step 2: Add ui.menu.stats_short / stats_long**

Find inside `ui.menu`:
```typescript
    menu: {
      title: 'Wild Haggis\nSurvivors',
      kill_credits: 'The glen remembers: {count} lifetime culls',
      // ...
    },
```

Add two new keys at the end of the menu block (before the closing `},`):

```typescript
    menu: {
      title: 'Wild Haggis\nSurvivors',
      kill_credits: 'The glen remembers: {count} lifetime culls',
      hint_suspended: 'Yir last run is still here — pick up the trail, or start fresh with a new loadout.',
      hint_fresh: 'Next: choose the wee beastie and kit for the moor.',
      start_run: 'START RUN',
      resume_run: 'RESUME RUN',
      new_run_loadout: 'NEW RUN (LOADOUT)',
      meta_upgrades: 'LASTING BOONS',
      options: 'OPTIONS',
      stats_short: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x  |  Runs {totalRuns}  |  Wins {victories}  |  Gold {gold}',
      stats_long: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x\nRuns {totalRuns}  |  Wins {victories}  |  Gold {gold}',
    },
```

- [ ] **Step 3: Run fence tests — hud_abbrev and stats slices GREEN**

Run: `npm test -- --run src/core/i18n.test.ts 2>&1 | tail -30`

Expected: ALL fence tests pass. The complete i18n.test.ts suite should now be green.

### Task 4.8: ShopScene resolves upgrade names via t()

**Files:**
- Modify: `src/scenes/ShopScene.ts:117,123`

- [ ] **Step 1: Use the new keys**

Find:
```typescript
    const nameText = this.add.text(34, y + 3, upgrade.name, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: isMaxed ? '#73c37d' : '#ffffff',
      fontStyle: 'bold',
    });
    const descText = this.add.text(34, y + 21, upgrade.description, {
```

Replace with:
```typescript
    const nameText = this.add.text(34, y + 3, t(upgrade.nameKey), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: isMaxed ? '#73c37d' : '#ffffff',
      fontStyle: 'bold',
    });
    const descText = this.add.text(34, y + 21, t(upgrade.descriptionKey), {
```

(The `t` import is already present in ShopScene.ts.)

### Task 4.9: UpgradeCards rarity label via t()

**Files:**
- Modify: `src/ui/UpgradeCards.ts:222`

- [ ] **Step 1: Route rarity label through i18n**

Find:
```typescript
    // Rarity label
    const rarityLabel = this.scene.add.text(x, y + h / 2 - 18, card.rarity.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
      color: `#${borderColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
```

Replace with:
```typescript
    // Rarity label (resolved via i18n so future locales can translate)
    const rarityLabel = this.scene.add.text(x, y + h / 2 - 18, t(`ui.common.rarity.${card.rarity}`), {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
      color: `#${borderColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
```

(The `t` import is already present.)

### Task 4.10: HUD.PASSIVE_ABBREVS via t()

**Files:**
- Modify: `src/ui/HUD.ts:471-497`

- [ ] **Step 1: Replace the dict with an i18n resolver**

Find:
```typescript
  private updatePassiveSlots(passives: string[]): void {
    // Clear old
    for (const slot of this.passiveSlots) {
      const idx = this.elements.indexOf(slot);
      if (idx !== -1) this.elements.splice(idx, 1);
      slot.destroy();
    }
    this.passiveSlots = [];
    this.lastPassiveCount = passives.length;

    const PASSIVE_ABBREVS: Record<string, string> = {
      sporran: 'SPR', whisky_flask: 'WFL', kilt: 'KLT',
      tam_o_shanter: 'TAM', irn_bru: 'IRN', loch_water: 'LOC',
    };

    const startX = this.layoutX + 12;
    const y = this.layoutY + this.topSafePad + 88;

    passives.forEach((key, i) => {
      const x = startX + i * 42;
      const label = this.addEl(this.scene.add.text(x + 16, y + 10, PASSIVE_ABBREVS[key] ?? key.slice(0, 3).toUpperCase(), {
        fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00', fontStyle: 'bold',
        backgroundColor: '#2a2a3a', padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1));
      this.passiveSlots.push(label);
    });
  }
```

Replace with:
```typescript
  private updatePassiveSlots(passives: string[]): void {
    // Clear old
    for (const slot of this.passiveSlots) {
      const idx = this.elements.indexOf(slot);
      if (idx !== -1) this.elements.splice(idx, 1);
      slot.destroy();
    }
    this.passiveSlots = [];
    this.lastPassiveCount = passives.length;

    const startX = this.layoutX + 12;
    const y = this.layoutY + this.topSafePad + 88;

    passives.forEach((key, i) => {
      const x = startX + i * 42;
      // HUD pill labels live in ui.passive.hud_abbrev.<key>. When no entry
      // exists (e.g. new passive added mid-migration), fall back to the first
      // three characters of the internal key.
      const abbrevKey = `ui.passive.hud_abbrev.${key}`;
      const resolved = t(abbrevKey);
      const abbrev = resolved === abbrevKey ? key.slice(0, 3).toUpperCase() : resolved;
      const label = this.addEl(this.scene.add.text(x + 16, y + 10, abbrev, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00', fontStyle: 'bold',
        backgroundColor: '#2a2a3a', padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1));
      this.passiveSlots.push(label);
    });
  }
```

### Task 4.11: MenuScene.formatStatsStrip via t()

**Files:**
- Modify: `src/scenes/MenuScene.ts:483-489`

- [ ] **Step 1: Route both stats lines through i18n**

Find:
```typescript
  private formatStatsStrip(viewWidth: number): string {
    const bestMins = Math.floor(this.saveData.bestTime / 60);
    const bestSecs = Math.floor(this.saveData.bestTime % 60);
    const firstLine = `Best ${bestMins}:${bestSecs.toString().padStart(2, '0')}  |  Kills ${this.saveData.bestKills}  |  Combo ${this.saveData.bestCombo}x`;
    const secondLine = `Runs ${this.saveData.totalRuns}  |  Wins ${this.saveData.victories}  |  Gold ${this.saveData.gold}`;
    return viewWidth < 1150 ? `${firstLine}\n${secondLine}` : `${firstLine}  |  ${secondLine}`;
  }
```

Replace with:
```typescript
  private formatStatsStrip(viewWidth: number): string {
    const bestMins = Math.floor(this.saveData.bestTime / 60);
    const bestSecs = Math.floor(this.saveData.bestTime % 60);
    const bestTime = `${bestMins}:${bestSecs.toString().padStart(2, '0')}`;
    const vars = {
      bestTime,
      bestKills: this.saveData.bestKills,
      bestCombo: this.saveData.bestCombo,
      totalRuns: this.saveData.totalRuns,
      victories: this.saveData.victories,
      gold: this.saveData.gold,
    };
    return viewWidth < 1150
      ? t('ui.menu.stats_long', vars)
      : t('ui.menu.stats_short', vars);
  }
```

### Task 4.12: GameScene downstream fixes

**Files:**
- Modify: `src/scenes/GameScene.ts:1587-1596, 1614-1617`

- [ ] **Step 1: getRunBuildSummary resolves weapon names via i18n**

Find:
```typescript
  private getRunBuildSummary(): string {
    const parts = this.weaponSystem
      .getWeapons()
      .map((weapon) => `${weapon.config.name} Lv${weapon.level}${weapon.evolved ? '★' : ''}`);
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      lines.push(parts.slice(i, i + 3).join('  |  '));
    }
    return lines.join('\n');
  }
```

Replace with:
```typescript
  private getRunBuildSummary(): string {
    const parts = this.weaponSystem
      .getWeapons()
      .map((weapon) => {
        const name = t(weapon.config.nameKey);
        const lv = t('ui.hud.level_fmt', { level: weapon.level });
        return `${name} ${lv}${weapon.evolved ? '★' : ''}`;
      });
    const lines: string[] = [];
    for (let i = 0; i < parts.length; i += 3) {
      lines.push(parts.slice(i, i + 3).join('  |  '));
    }
    return lines.join('\n');
  }
```

- [ ] **Step 2: updateBossHPBar resolves boss name via i18n**

Find:
```typescript
    if (activeBoss) {
      const bossDef = BOSSES.find(b => b.key === activeBoss!.getEnemyKey());
      this.hud.updateBossBar({
        name: bossDef?.name ?? activeBoss.getEnemyKey(),
        hpFraction: activeBoss.getHpFraction(),
      });
    } else {
```

Replace with:
```typescript
    if (activeBoss) {
      const bossDef = BOSSES.find(b => b.key === activeBoss!.getEnemyKey());
      this.hud.updateBossBar({
        name: bossDef ? t(bossDef.nameKey) : activeBoss.getEnemyKey(),
        hpFraction: activeBoss.getHpFraction(),
      });
    } else {
```

### Task 4.13: Update upgrades.icons.test.ts assertions

**Files:**
- Modify: `src/data/upgrades.icons.test.ts`

- [ ] **Step 1: Update English-literal assertions to check i18n keys**

Find:
```typescript
  it('uses weapon definition display names on level-up cards', () => {
    const pool = buildCardPool(['bagpipes'], [], { bagpipes: 2 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_bagpipes_3');
    expect(levelCard?.name).toBe('Ceòl Mòr Bagpipes Lv3');
  });

  it('names evolution prep passive from passive card titles', () => {
    const pool = buildCardPool(['thistle_shot'], ['sporran'], { thistle_shot: 4 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_thistle_shot_5');
    expect(levelCard?.description).toContain('Sporran');
    expect(levelCard?.description).toContain('treasure chest');
  });
```

Replace with:
```typescript
  it('uses weapon definition display names on level-up cards', () => {
    const pool = buildCardPool(['bagpipes'], [], { bagpipes: 2 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_bagpipes_3');
    // buildCardPool now resolves the weapon name via t() at card-build time,
    // so the final string is the resolved English display name for the weapon
    // (not a raw i18n key). Ceòl Mòr Bagpipes is the current resolution.
    expect(levelCard?.name).toBe('Ceòl Mòr Bagpipes Lv 3');
  });

  it('names evolution prep passive from passive card titles', () => {
    const pool = buildCardPool(['thistle_shot'], ['sporran'], { thistle_shot: 4 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_thistle_shot_5');
    expect(levelCard?.description).toContain('Sporran');
    expect(levelCard?.description).toContain('treasure chest');
  });
```

Note the `Lv 3` with a space — that's the `ui.hud.level_fmt` template output.

Check the existing `ui.hud.level_fmt` value:
```typescript
level_fmt: 'Lv {level}',
```

It is `'Lv {level}'` with a space, so `Lv 3` is correct. The original test asserted `'Ceòl Mòr Bagpipes Lv3'` without a space; the new resolution adds one. This is an intentional unification — every `Lv{n}` display now goes through the same template.

- [ ] **Step 2: Verify other assertions in the file still pass**

The first three tests in `upgrades.icons.test.ts` (`does not use xp_gem placeholder`, `uses weapon HUD icon keys for generated level-up cards`, `maps evolution chest cards to evolved weapon icon keys`) don't reference English text — they check `icon` fields. They should still pass unchanged.

The `assigns dedicated icons for cooldown and knockback stat cards` test only checks `icon` strings — also unaffected.

### Task 4.14: Update UpgradeCards.test.ts to use real i18n keys

**Files:**
- Modify: `src/ui/UpgradeCards.test.ts`

- [ ] **Step 1: Update the test card fixtures to use i18n keys**

Find (there are three occurrences — the same card literal is defined three times in the file):

```typescript
    const card: UpgradeCard = {
      id: 'damage_up',
      name: 'Damage Up',
      description: 'Hit harder.',
      rarity: 'common',
      icon: 'wicon_thistle_shot',
      effect: { type: 'stat_boost', stat: 'damagePct', amount: 0.1 },
    };
```

Replace ALL THREE occurrences with:

```typescript
    const card: UpgradeCard = {
      id: 'damage_up',
      // Both fields are i18n keys per the upgraded contract. They don't exist
      // in the dictionary, so t() returns them unchanged — which still exercises
      // the resolution path the UI uses.
      name: 'upgradeCard.test_damage_up.name',
      description: 'upgradeCard.test_damage_up.description',
      rarity: 'common',
      icon: 'wicon_thistle_shot',
      effect: { type: 'stat_boost', stat: 'damagePct', amount: 0.1 },
    };
```

Also update the assertion in the first test:

Find:
```typescript
    expect(texts[0]).toMatchObject({ x: 520, y: 145, text: 'Level 3 — grow fiercer' });
```

This asserts the resolved English for `ui.upgradeCards.level_title`. That key is already in the dictionary and resolves to the same string. Leave unchanged — it still works.

### Task 4.15: Green-board verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run 2>&1 | tail -20`

Expected: all tests pass. Total should be ~148 (138 from Commit 3 baseline + ~10 regression-fence tests in i18n.test.ts).

If any assertion fails, read the failure message and fix the specific mismatch before continuing. Common failure modes:
- A data-file entry is missing a `nameKey`/`descriptionKey` field — add it.
- A dictionary key is missing from `EN_STRINGS` — add it.
- The card test's expected `Lv3` vs `Lv 3` — adjust per the `ui.hud.level_fmt` template.

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -15`

Expected: `tsc --noEmit` clean, Vite build green. The new required fields on `WeaponDef`, `BossConfig`, `VariantDef`, `PermanentUpgrade` will catch any entry that forgot to supply them at compile time.

- [ ] **Step 3: Visual spot check (developer dev-server smoke test)**

Run: `npm run dev` and manually verify (one-time check):

1. Main menu: title reads `Wild Haggis\nSurvivors`, version `v2.1.0`, stats strip renders without literal-English labels reading any differently than before.
2. Start a run. Level up once and observe card text — names and descriptions resolve (not raw `upgradeCard.add_sporran.name` strings).
3. Play to boss #1 (Gordon the Chef, 5:00). Boss HP bar shows `Gordon the Chef` (resolved via the new `boss.gordon.name` key, not a raw key path).
4. Die or win. Game-over screen's variant chip (`This run: Classic Haggis | ...`) and weapon damage breakdown resolve cleanly.
5. Open Shop. Every row shows its English name/description resolved through i18n.
6. Open Meta Shop. Unchanged (already used i18n).

If any of 1–6 shows a raw dot-path like `permanentUpgrade.thick_hide.name`, stop and fix the missing dictionary entry or data-file key.

### Task 4.16: Stage and commit Commit 4

- [ ] **Step 1: Review the staged state**

Run: `git status`

Expected: all the files you touched in Phase 4 show up as unstaged modifications.

- [ ] **Step 2: Stage explicitly**

```bash
git add \
  src/core/i18n.ts \
  src/core/i18n.test.ts \
  src/data/weapons.ts \
  src/data/enemies.ts \
  src/data/variants.ts \
  src/data/permanentUpgrades.ts \
  src/data/upgrades.ts \
  src/data/upgrades.icons.test.ts \
  src/scenes/ShopScene.ts \
  src/scenes/MenuScene.ts \
  src/scenes/GameScene.ts \
  src/ui/HUD.ts \
  src/ui/UpgradeCards.ts \
  src/ui/UpgradeCards.test.ts
```

- [ ] **Step 3: Verify clean stage**

Run: `git status --short`

Expected: every file listed as `M` (modified, staged). No unstaged `??` or `M` lines.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(i18n): complete data-file migration (~158 strings)

Finishes the partial i18n migration left by the earlier polish pass.
Every player-facing string in weapons, enemies, variants, upgrade
cards, and permanent upgrades now routes through t() and lives in
src/core/i18n.ts.

Pattern matches the already-proven BalanceConfig.EVOLUTION_RECIPES
and ACHIEVEMENT_DEFS: data rows carry a nameKey/descriptionKey
dot-path, UI code calls t() at render time. The legacy name /
description literal fields are kept on the data interfaces with
@deprecated JSDoc so auto-battler debug logs and analytics code that
read them continue to work — a follow-up cleanup can remove them.

New namespaces in EN_STRINGS:
  - weapon.<key>.name / .description  (8 weapons × 2 = 16)
  - boss.<key>.name                    (5)
  - variant.<key>.name / .flavor       (5 × 2 = 10)
  - variant.summary.*                  (9 — speed, hp, armor, pickup,
                                           xp, dmg, drift, cdr, baseline)
  - variant.unlock.*                   (5 — survive, best_kills,
                                           total_gold, victories, ready)
  - permanentUpgrade.<key>.*           (16 × 2 = 32; + 2 that already
                                           had display-name mismatches)
  - upgradeCard.<id>.name / .description (33 × 2 = 66)
  - upgradeCard.levelup.*              (2 templates)
  - upgradeCard.evolution_hint         (1)
  - ui.common.rarity.*                 (4)
  - ui.menu.stats_short / stats_long   (2)
  - ui.passive.hud_abbrev.*            (6)

Regression fence in src/core/i18n.test.ts: every data-file row is
now covered by an assertion that its nameKey / descriptionKey
resolves. Adding a new weapon, boss, variant, card, or permanent
upgrade without wiring i18n will fail the suite before it can ship.

Downstream consumers updated:
  - ShopScene — resolves upgrade.nameKey / upgrade.descriptionKey
  - UpgradeCards — rarity label via t('ui.common.rarity.<rarity>')
  - HUD — PASSIVE_ABBREVS dict replaced with t('ui.passive.hud_abbrev.*'),
          fallback to first 3 chars for unknown keys
  - MenuScene — formatStatsStrip uses t('ui.menu.stats_short'|'stats_long')
  - GameScene — getRunBuildSummary + updateBossHPBar resolve weapon
    and boss names via t(), level formatting via ui.hud.level_fmt

Test updates:
  - data/upgrades.icons.test.ts — assertions match t()-resolved output
  - ui/UpgradeCards.test.ts — test cards carry i18n key paths in name
    and description to exercise the full resolution path

Voice kept warm and Scots-tinged throughout the new strings, matching
the existing dictionary copy. Ceòl Mòr for the great pipes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify all four commits landed**

Run: `git log --oneline -5`

Expected (in reverse chronological order):
```
<sha> feat(i18n): complete data-file migration (~158 strings)
<sha> feat(ux): Soul charter polish pass
<sha> chore: ignore AI tool metadata directories
<sha> docs: introduce DESIGN_SOUL charter as UX north star
1708d24 docs: spec for Soul Charter polish pass completion audit
```

- [ ] **Step 6: Final green-board check**

Run: `npm test -- --run 2>&1 | tail -10 && npm run build 2>&1 | tail -10`

Expected: all tests pass, build green. Ship-ready state.

- [ ] **Step 7: Celebrate briefly**

This is a complete Soul Charter landing. The game now has zero hardcoded player-facing strings outside the i18n dictionary, zero emoji/font-glyphs in gameplay UI, zero placeholder-feeling surfaces, full uiScale + highContrastUi coverage, and a regression fence preventing drift. The haggis drift is intact, the wee pipes still play, and the glen remembers.

---

## Final Deliverables

- 4 commits on `master`:
  1. `docs: introduce DESIGN_SOUL charter as UX north star`
  2. `chore: ignore AI tool metadata directories`
  3. `feat(ux): Soul charter polish pass`
  4. `feat(i18n): complete data-file migration (~158 strings)`
- ~148 passing tests (136 existing + ~12 new).
- Green `npm run build`.
- Design doc at `docs/superpowers/specs/2026-04-11-soul-charter-polish-pass-completion-design.md`.
- Implementation plan at `docs/superpowers/plans/2026-04-11-soul-charter-polish-pass-completion.md` (this file).

## Rollback Plan

If any commit regresses in manual play-testing and the fix is non-obvious:

- `git revert <commit-sha>` on master. Each commit is independently revertable because tests pass at every commit boundary.
- If reverting Commit 4 alone leaves dangling references (unlikely — the legacy `name`/`description` literal fields stay), `git revert` will handle it. If it doesn't, also revert Commit 3.

## Open Follow-ups (not in scope)

- Add a real second locale to exercise the i18n infrastructure under production load.
- Remove the legacy `name` / `description` literal fields from data interfaces once all non-player-facing consumers (auto-battler, analytics) are audited.
- Move `getSpawnWeight` magic numbers (3, 10, 42) to `BALANCE` during the next balance tuning pass.
- Extract a shared `highContrastPalette` constants file if more scenes need it.
- Add screen-reader locale variants for the canvas aria-label when localized builds ship.
