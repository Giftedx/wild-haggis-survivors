/**
 * Hot-loop math benchmark. Simulates the per-frame work the game's
 * Enemy / Projectile / XPGem / WeaponSystem hot paths actually perform
 * (post-refactor: distSq gates + geometric form, no atan2/cos/sin
 * round-trips). Pure JS — no Phaser draw, no GPU, no DOM.
 *
 * What it answers: "given N enemies + M projectiles + K gems, can the
 * JS hot loop complete a frame in under 16.67ms (60fps)?"
 *
 * What it does NOT answer: Phaser draw cost, GPU fill rate, browser
 * compositor overhead. Those are measured in-browser, not here.
 *
 * Usage: `node scripts/bench-hot-loop.mjs`
 */

const WORLD_W = 4000;
const WORLD_H = 4000;
const FRAMES = 600;            // 10 seconds at 60fps
const FRAME_BUDGET_MS = 1000 / 60;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeEnemy() {
  return {
    x: rand(0, WORLD_W),
    y: rand(0, WORLD_H),
    speed: rand(60, 180),
    vx: 0,
    vy: 0,
    active: true,
    hp: 100,
    maxHp: 100,
    burnTimer: 0,
    poisonTimer: 0,
    behavior: 'chase',
  };
}

function makeProjectile() {
  const speed = rand(300, 700);
  const angle = rand(0, Math.PI * 2);
  return {
    x: rand(0, WORLD_W),
    y: rand(0, WORLD_H),
    spawnX: 0,
    spawnY: 0,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    maxRange: 600,
    active: true,
    pierce: 2,
  };
}

function makeGem() {
  return {
    x: rand(0, WORLD_W),
    y: rand(0, WORLD_H),
    vx: 0,
    vy: 0,
    magnetized: false,
    active: true,
  };
}

/** Mirrors Enemy.behaviorChase post-refactor: dx/dist, dy/dist. */
function tickEnemyChase(e, px, py) {
  if (!e.active) return;
  const dx = px - e.x;
  const dy = py - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) { e.vx = 0; e.vy = 0; return; }
  const inv = e.speed / dist;
  e.vx = dx * inv;
  e.vy = dy * inv;
}

/** Mirrors WeaponSystem.buildEnemyCache: sort by distSq. */
function buildSortedEnemyCache(enemies, px, py, sortedOut, distSqOut) {
  let count = 0;
  for (let i = 0, len = enemies.length; i < len; i++) {
    const e = enemies[i];
    if (!e.active) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    sortedOut[count] = e;
    distSqOut[count] = dx * dx + dy * dy;
    count++;
  }
  // Insertion-sort-ish by distSq — match WeaponSystem's actual sort.
  // For benchmark realism we use Array.sort on (e, dSq) tuples.
  const idx = Array.from({ length: count }, (_, i) => i);
  idx.sort((a, b) => distSqOut[a] - distSqOut[b]);
  // Apply permutation (allocation-free benchmark would use a different
  // approach; this matches the cost shape of a per-frame O(n log n) sort).
  const tmpE = sortedOut.slice(0, count);
  const tmpD = distSqOut.slice(0, count);
  for (let i = 0; i < count; i++) {
    sortedOut[i] = tmpE[idx[i]];
    distSqOut[i] = tmpD[idx[i]];
  }
  return count;
}

/** Mirrors Projectile.update post-refactor: distSq vs range². */
function tickProjectile(p, dt) {
  if (!p.active) return;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  const dx = p.x - p.spawnX;
  const dy = p.y - p.spawnY;
  if (dx * dx + dy * dy > p.maxRange * p.maxRange) p.active = false;
}

/** Mirrors XPGem.updateMagnet + XPSystem.update collect ring. */
function tickGem(g, px, py, pickupRadius, collectDistSq) {
  if (!g.active) return;
  const dx = px - g.x;
  const dy = py - g.y;
  const distSq = dx * dx + dy * dy;
  if (distSq < pickupRadius * pickupRadius) g.magnetized = true;
  if (g.magnetized) {
    const dist = Math.sqrt(distSq);
    if (dist > 1e-6) {
      const speed = Math.max(400, 800 - dist * 2);
      const inv = speed / dist;
      g.vx = dx * inv;
      g.vy = dy * inv;
    }
  }
  if (distSq < collectDistSq) {
    // Simulate collect — no-op in bench, but match the branch.
    g.active = g.active;
  }
}

/** Mirrors WeaponSystem.fireAoePulse: distSq gate + knockback reuse. */
function tickAoePulse(enemies, px, py, radius) {
  const radiusSq = radius * radius;
  let hits = 0;
  for (let i = 0, len = enemies.length; i < len; i++) {
    const e = enemies[i];
    if (!e.active) continue;
    const dx = e.x - px;
    const dy = e.y - py;
    const distSq = dx * dx + dy * dy;
    if (distSq <= radiusSq) {
      hits++;
      const dist = Math.sqrt(distSq);
      if (dist > 1e-6) {
        const kb = 100 / dist;
        e.vx += dx * kb;
        e.vy += dy * kb;
      }
    }
  }
  return hits;
}

function runScenario(label, nEnemies, nProjectiles, nGems) {
  const enemies = Array.from({ length: nEnemies }, makeEnemy);
  const projectiles = Array.from({ length: nProjectiles }, makeProjectile);
  const gems = Array.from({ length: nGems }, makeGem);
  const sortedScratch = new Array(nEnemies);
  const distSqScratch = new Array(nEnemies);

  let px = WORLD_W / 2;
  let py = WORLD_H / 2;
  const dt = 1 / 60;

  // Warm-up — let JIT settle
  for (let f = 0; f < 60; f++) {
    for (const e of enemies) tickEnemyChase(e, px, py);
    for (const p of projectiles) tickProjectile(p, dt);
    for (const g of gems) tickGem(g, px, py, 80, 30 * 30);
    buildSortedEnemyCache(enemies, px, py, sortedScratch, distSqScratch);
    tickAoePulse(enemies, px, py, 200);
  }

  // Reset projectiles since some may have ranged out
  for (const p of projectiles) {
    p.active = true;
    p.spawnX = p.x;
    p.spawnY = p.y;
  }

  const samples = [];
  let totalHits = 0;
  for (let f = 0; f < FRAMES; f++) {
    px += Math.cos(f * 0.01) * 2;
    py += Math.sin(f * 0.01) * 2;

    const t0 = performance.now();

    // Enemy AI tick
    for (const e of enemies) tickEnemyChase(e, px, py);

    // Projectile update
    for (const p of projectiles) {
      if (!p.active) {
        // Recycle so the bench keeps a stable in-flight count.
        p.active = true;
        p.spawnX = px;
        p.spawnY = py;
        const angle = Math.random() * Math.PI * 2;
        const speed = 500;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.x = px;
        p.y = py;
      }
      tickProjectile(p, dt);
    }

    // XP gem ticks
    for (const g of gems) tickGem(g, px, py, 80, 30 * 30);

    // WeaponSystem cache build (per frame, once)
    buildSortedEnemyCache(enemies, px, py, sortedScratch, distSqScratch);

    // Simulate 8 weapons firing — most fire ~1×/sec, but on hot frames
    // multiple fire at once. Model as ~2 AoE pulses + 1 cache scan/frame
    // average.
    if (f % 3 === 0) totalHits += tickAoePulse(enemies, px, py, 200);
    if (f % 5 === 0) totalHits += tickAoePulse(enemies, px, py, 280);

    const t1 = performance.now();
    samples.push(t1 - t0);
  }

  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const p99 = samples[Math.floor(samples.length * 0.99)];
  const max = samples[samples.length - 1];
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length;

  const equivalentFps = (ms) => Math.round(1000 / ms);

  console.log(`\n── ${label} ──`);
  console.log(`  enemies=${nEnemies}  projectiles=${nProjectiles}  gems=${nGems}  (${totalHits} aoe hits over ${FRAMES} frames)`);
  console.log(`  per-frame ms:  median ${median.toFixed(3)}  mean ${mean.toFixed(3)}  p95 ${p95.toFixed(3)}  p99 ${p99.toFixed(3)}  max ${max.toFixed(3)}`);
  console.log(`  equivalent fps (JS only): median ${equivalentFps(median)}  p95 ${equivalentFps(p95)}  p99 ${equivalentFps(p99)}`);
  console.log(`  budget vs 60fps (16.67ms): median ${(median / FRAME_BUDGET_MS * 100).toFixed(1)}%  p99 ${(p99 / FRAME_BUDGET_MS * 100).toFixed(1)}%`);
}

console.log('Wild Haggis Survivors — JS hot-loop benchmark');
console.log(`Frames per scenario: ${FRAMES}  (frame budget: ${FRAME_BUDGET_MS.toFixed(2)} ms for 60fps)`);
console.log('Measures: enemy chase + projectile range + gem magnet + sorted enemy cache + AoE pulses');
console.log('Does NOT measure: Phaser physics overlap, sprite draw, GPU fill, tween updates');

runScenario('half load',           200, 175, 250);
runScenario('config caps',         400, 350, 500);
runScenario('2x caps (stress)',    800, 700, 1000);
runScenario('4x caps (extreme)',  1600, 1400, 2000);
runScenario('8x caps (cliff)',    3200, 2800, 4000);
