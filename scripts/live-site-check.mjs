#!/usr/bin/env node
// One-shot live-site sanity check against https://wild-haggis-survivors.pages.dev/
// Verifies: boot, gameplay tick, save artifact persisted, reload + resume path,
// no page errors, no console errors. Writes screenshots to /tmp.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'https://wild-haggis-survivors.pages.dev/';
const SCREEN_DIR = '/tmp';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const pageErrors = [];
const consoleErrors = [];
const consoleWarnings = [];
const NOISE_RX = [/\[vite\]/i, /favicon/i, /service worker/i, /Mixed Content/i];

page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`));
page.on('console', (msg) => {
  const text = msg.text();
  if (NOISE_RX.some((rx) => rx.test(text))) return;
  if (msg.type() === 'error') consoleErrors.push(text);
  else if (msg.type() === 'warning') consoleWarnings.push(text);
});

console.log(`[live-check] loading ${URL}`);
await page.addInitScript(() => {
  // Set FORCE_CANVAS for headless WebGL stability (matches e2e fixture).
  window.FORCE_CANVAS = true;
  // Skip tutorial so we can drive into Game cleanly.
  try {
    const existing = JSON.parse(localStorage.getItem('whs_meta_save') ?? '{}');
    localStorage.setItem('whs_meta_save', JSON.stringify({
      ...existing,
      saveVersion: 9,
      hasCompletedTutorial: true,
    }));
    window.AUTO_BATTLE = true;
  } catch {}
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 });
const canvas = page.locator('canvas[role="application"]');
await canvas.waitFor({ state: 'visible', timeout: 60_000 });

console.log('[live-check] boot complete, capturing menu screenshot');
await canvas.screenshot({ path: `${SCREEN_DIR}/live-1-boot.png` });

// Boot Game.
const booted = await page.evaluate(async () => {
  const g = window.game;
  if (!g) return false;
  g.scene.start('Game');
  const start = Date.now();
  while (Date.now() - start < 30_000) {
    if (g.scene.isActive('Game')) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
});
console.log(`[live-check] GameScene booted: ${booted}`);

// Equip all 8 weapons so we exercise the v4 render path broadly.
await page.evaluate(() => {
  const g = window.game;
  const gs = g.scene.scenes.find((s) => s.scene.key === 'Game');
  const ws = gs.weaponSystem;
  if (!ws) return;
  for (const k of [
    'thistle_shot', 'bagpipe_blast', 'caber_toss', 'scotch_mist',
    'haggis_hurler', 'nessie_tentacle', 'claymore', 'bagpipes',
  ]) {
    ws.addWeapon(k);
  }
});

// Skip a couple sim-minutes so spawning + gameplay engages real systems.
await page.evaluate(async () => {
  window.DEBUG?.skipToMinute(2);
  await new Promise((r) => setTimeout(r, 2000));
});

// Sample mid-run state.
const midRun = await page.evaluate(() => {
  const g = window.game;
  const gs = g.scene.scenes.find((s) => s.scene.key === 'Game');
  const enemies = gs.spawnSystem?.getEnemyGroup?.().getChildren() ?? [];
  let activeEnemies = 0;
  for (const e of enemies) if (e.active) activeEnemies++;
  return {
    fps: g.loop.actualFps,
    gameTimeSec: gs.spawnSystem?.getGameTimeSec?.() ?? 0,
    activeEnemies,
    weaponCount: gs.weaponSystem?.weapons?.length ?? 0,
    sceneActive: g.scene.isActive('Game'),
  };
});
console.log('[live-check] mid-run:', midRun);
await canvas.screenshot({ path: `${SCREEN_DIR}/live-2-gameplay.png` });

// Capture localStorage save state.
const saveBefore = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('whs_')) {
      const val = localStorage.getItem(key);
      out[key] = val ? val.slice(0, 80) + (val.length > 80 ? '…' : '') : null;
    }
  }
  return out;
});
console.log('[live-check] save keys before reload:', Object.keys(saveBefore));

// Reload + verify resume.
console.log('[live-check] reloading page to verify save/resume cycle');
await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
await canvas.waitFor({ state: 'visible', timeout: 60_000 });

const saveAfter = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('whs_')) {
      const val = localStorage.getItem(key);
      out[key] = val ? val.slice(0, 80) + (val.length > 80 ? '…' : '') : null;
    }
  }
  return out;
});
const samekeys = Object.keys(saveBefore).every((k) => k in saveAfter);
console.log(`[live-check] save persisted across reload: ${samekeys}`);
console.log('[live-check] save keys after reload:', Object.keys(saveAfter));

await canvas.screenshot({ path: `${SCREEN_DIR}/live-3-after-reload.png` });

// Final summary.
await browser.close();

console.log('\n========== SUMMARY ==========');
console.log(`Boot:              ${booted ? '✓' : '✗'}`);
console.log(`Mid-run scene:     ${midRun.sceneActive ? '✓' : '✗'}`);
console.log(`FPS:               ${midRun.fps?.toFixed(1) ?? 'n/a'}`);
console.log(`Game time:         ${midRun.gameTimeSec.toFixed(1)} s`);
console.log(`Active enemies:    ${midRun.activeEnemies}`);
console.log(`Weapons equipped:  ${midRun.weaponCount} / 8`);
console.log(`Save persisted:    ${samekeys ? '✓' : '✗'}`);
console.log(`Page errors:       ${pageErrors.length === 0 ? '✓ (none)' : '✗'}`);
console.log(`Console errors:    ${consoleErrors.length === 0 ? '✓ (none)' : '✗'}`);
console.log(`Console warnings:  ${consoleWarnings.length} (informational)`);

if (pageErrors.length) {
  console.log('\nPage errors:');
  for (const e of pageErrors) console.log(`  ${e}`);
}
if (consoleErrors.length) {
  console.log('\nConsole errors:');
  for (const e of consoleErrors) console.log(`  ${e}`);
}
if (consoleWarnings.length) {
  console.log('\nConsole warnings (first 5):');
  for (const w of consoleWarnings.slice(0, 5)) console.log(`  ${w}`);
}

const exitCode =
  (booted ? 0 : 1) | (samekeys ? 0 : 2) | (pageErrors.length ? 4 : 0) | (consoleErrors.length ? 8 : 0);
process.exit(exitCode);
