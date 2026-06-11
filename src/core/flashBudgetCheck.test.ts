/**
 * Negative-control tests for `scripts/check-flash-budget.mjs`. Importing
 * the .mjs script directly into vitest would run its `main()` against
 * the real codebase, which is fine for the happy path but doesn't tell
 * us the regex/extractor pair actually catches a regression. Instead we
 * spawn the script in a child process against synthetic source strings
 * placed in a temp directory, and assert the script exits non-zero with
 * the expected error fragment.
 *
 * Why a process-spawning shape over a unit shape: the script reads files
 * relative to `process.cwd()` and walks `src/` as a tree. Refactoring the
 * regex helpers out for direct unit testing would couple the test to the
 * script's internal API; spawning preserves the contract that matters
 * (CLI exit code + stderr text).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT_REL = 'scripts/check-flash-budget.mjs';

function setupFakeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'flash-budget-test-'));
  mkdirSync(join(dir, 'scripts'));
  mkdirSync(join(dir, 'src', 'systems'), { recursive: true });
  mkdirSync(join(dir, 'src', 'scenes', 'game'), { recursive: true });
  // Copy the real script unchanged — we want to exercise the production
  // logic, just against a controlled file tree.
  copyFileSync(
    resolve(process.cwd(), SCRIPT_REL),
    join(dir, SCRIPT_REL),
  );
  return dir;
}

function writeJuiceStub(dir: string, body: string): void {
  writeFileSync(join(dir, 'src', 'systems', 'JuiceSystem.ts'), body);
}

function runScript(dir: string): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [SCRIPT_REL], {
    cwd: dir,
    encoding: 'utf8',
  });
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

const HAPPY_JUICE = `
import { scaledFlashAlpha, scaledFlashDurationMs } from '../core/a11yMotion';

export class JuiceSystem {
  flashWhite(duration = 200): void {
    const alpha = scaledFlashAlpha(0.4);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: scaledFlashDurationMs(duration) });
  }
  flashRed(duration = 150): void {
    const alpha = scaledFlashAlpha(0.25);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: scaledFlashDurationMs(duration) });
  }
  private flashColored(color: number, duration: number): void {
    const alpha = scaledFlashAlpha(0.35);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: scaledFlashDurationMs(duration) });
  }
}
`;

describe('check-flash-budget', () => {
  let dir: string;

  beforeEach(() => {
    dir = setupFakeRepo();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes when flash methods route through a11yMotion ladder', () => {
    writeJuiceStub(dir, HAPPY_JUICE);
    const r = runScript(dir);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain('OK — flash methods + overlay allowlist clean');
  });

  it('fails when flashWhite drops scaledFlashAlpha', () => {
    writeJuiceStub(
      dir,
      HAPPY_JUICE.replace(
        'flashWhite(duration = 200): void {\n    const alpha = scaledFlashAlpha(0.4);',
        'flashWhite(duration = 200): void {\n    const alpha = 0.6;',
      ),
    );
    const r = runScript(dir);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('flashWhite: missing scaledFlashAlpha');
  });

  it('fails when flashRed drops scaledFlashDurationMs', () => {
    writeJuiceStub(
      dir,
      HAPPY_JUICE.replace(
        'duration: scaledFlashDurationMs(duration) });\n  }\n  private flashColored',
        'duration: 150 });\n  }\n  private flashColored',
      ).replace(
        // ensure only flashRed loses the duration scalar
        'flashWhite(duration = 200): void {\n    const alpha = scaledFlashAlpha(0.4);\n    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: 150 });',
        'flashWhite(duration = 200): void {\n    const alpha = scaledFlashAlpha(0.4);\n    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: scaledFlashDurationMs(duration) });',
      ),
    );
    const r = runScript(dir);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('flashRed: missing scaledFlashDurationMs');
  });

  it('flags a new full-screen flash overlay outside the allowlist', () => {
    writeJuiceStub(dir, HAPPY_JUICE);
    // Drop a synthetic file in `src/scenes/game/` that creates a
    // viewport-sized rect AND tweens it up to alpha 1.
    writeFileSync(
      join(dir, 'src', 'scenes', 'game', 'EvilFlashOverlay.ts'),
      `
import * as Phaser from 'phaser';

export function evilFlash(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const r = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0);
  scene.tweens.add({ targets: r, alpha: 0.85, duration: 80 });
}
      `,
    );
    const r = runScript(dir);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('EvilFlashOverlay.ts');
    expect(r.stderr).toContain('full-screen rectangle outside allowlist');
  });

  it('does not flag static dim backdrops that never tween up to a flash alpha', () => {
    writeJuiceStub(dir, HAPPY_JUICE);
    writeFileSync(
      join(dir, 'src', 'scenes', 'game', 'StaticBackdrop.ts'),
      `
import * as Phaser from 'phaser';

export function paint(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  scene.add.rectangle(width / 2, height / 2, width, height, 0x111111, 1);
  // dim alpha tween — does not exceed 0.4 PEAT cap, so not a flash
  const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
  scene.tweens.add({ targets: dim, alpha: 0.3, duration: 200 });
}
      `,
    );
    const r = runScript(dir);
    expect(r.code).toBe(0);
  });
});
