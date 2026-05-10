/**
 * REVIEW S4 — static allowlist for `Math.random()` outside the seeded
 * `runRng` discipline.
 *
 * ADR-0002 Phase 3 + the rng.ts policy split RNG into two streams:
 *   - **runRng (seeded)** for gameplay state — card draws, elite rolls,
 *     loot tables, crit, weighted spawns, hazard placement, anything a
 *     replay must reproduce byte-for-byte.
 *   - **`Math.random()`** for *cosmetic* layers — particle scatter,
 *     audio detune, ambient weather, music phrasing, UI tip selection,
 *     cosmetic run-name generation.
 *
 * The carve-out is honour-system in source. This guard makes it
 * **enforced**: every shipped `.ts` file under `src/` that mentions
 * `Math.random` must appear in the allowlist below with a one-line
 * justification. A new file using `Math.random` for state-affecting
 * randomness would be silent replay drift — this test forces a
 * conscious choice (allowlist + justification, or wire `runRng`).
 *
 * Closes REVIEW.md S4 (2026-05-10).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const SRC_ROOT = resolve(__dirname, '..');

/**
 * File paths are stored relative to `src/` and use forward slashes so
 * the allowlist is stable across Windows / POSIX. Block-comment text
 * counts as a hit (the regex is dumb on purpose) — files that mention
 * `Math.random` only inside a docstring still need a `comment-only`
 * justification, which is what we want: the prose claim itself is a
 * contract that future edits can drift from.
 */
interface AllowlistEntry {
  path: string;
  reason: string;
}

const ALLOWLIST: AllowlistEntry[] = [
  // ── Cosmetic randomness — visual particle / tween jitter ────────────
  {
    path: 'systems/JuiceSystem.ts',
    reason: 'cosmetic — tween durations + burst dot scatter, no replay-side effect',
  },
  {
    path: 'systems/juice/bossSpectacle.ts',
    reason: 'cosmetic — gold-shower particle angles + durations',
  },
  {
    path: 'systems/juice/evolutionSpectacle.ts',
    reason: 'cosmetic — evolution-burst particle angles + durations',
  },
  {
    path: 'systems/WeaponSystem.ts',
    reason: 'cosmetic — 4-spark scatter angle on hit (visual only)',
  },
  {
    path: 'entities/Player.ts',
    reason: 'cosmetic — Burn Leap visual ring (explicit per-method docstring)',
  },
  {
    path: 'entities/Enemy.ts',
    reason: 'cosmetic — bobPhase, snowflake roll, particle scatter, tween durations',
  },
  {
    path: 'entities/XPGem.ts',
    reason: 'cosmetic — idle breathe + spin tween durations',
  },
  {
    path: 'scenes/game/RunLifecycle.ts',
    reason: 'cosmetic — death-burst particle angles + durations',
  },
  {
    path: 'scenes/game/wireWeaponSystemListeners.ts',
    reason: 'cosmetic — projectile trail color jitter (inline comment)',
  },
  {
    path: 'scenes/game/PickupSpawner.ts',
    reason: 'cosmetic — placement rotation + `rand: Math.random` parameter to seeded helpers (positions are visual; trigger time is gameplay)',
  },
  {
    path: 'scenes/game/FilmGrainOverlay.ts',
    reason: 'cosmetic — film grain drift duration jitter',
  },
  {
    path: 'art/sprites/fx/filmGrain.ts',
    reason: 'cosmetic — texture-bake noise (run once at startup)',
  },

  // ── Cosmetic randomness — audio / music ─────────────────────────────
  {
    path: 'systems/AudioSystem.ts',
    reason: 'cosmetic — sfx detune + noise-buffer fill, no replay-side effect',
  },
  {
    path: 'systems/music/Conductor.ts',
    reason: 'cosmetic — phrase contour + degree pick + velocity jitter (audio only)',
  },
  {
    path: 'systems/music/PercussionLayer.ts',
    reason: 'cosmetic — high-pass freq jitter on percussion hit',
  },
  {
    path: 'systems/music/ProceduralMusicEngine.ts',
    reason: 'cosmetic — piano-flourish gating probability',
  },

  // ── Cosmetic randomness — ambient / wildlife ────────────────────────
  {
    path: 'systems/AmbientWeatherSystem.ts',
    reason: 'cosmetic — seasonal weather overlay; pure visual, no state effect',
  },
  {
    path: 'systems/WildlifeSystem.ts',
    reason: 'cosmetic — wildlife flee-angle jitter (no damage state, no replay)',
  },

  // ── UI / scene chrome — between-runs or non-gameplay scenes ─────────
  {
    path: 'scenes/MainMenuScene.ts',
    reason: 'cosmetic — menu ember alpha jitter',
  },
  {
    path: 'scenes/CroftScene.ts',
    reason: 'between-run hub UI — trophy-quip a/b pick (no replay determinism concern)',
  },
  {
    path: 'scenes/game-over/runResultContent.ts',
    reason: 'cosmetic — post-run UI tip fallback selector',
  },
  {
    path: 'scenes/game/runIntroToasts.ts',
    reason: 'cosmetic — debug rngSample + ancestral-whisper kin pick (UI text only)',
  },
  {
    path: 'scenes/game/GameTickers.ts',
    reason: 'cosmetic — haggis ambient bark gap jitter (banter timing, not state)',
  },
  {
    path: 'scenes/GameScene.ts',
    reason: 'cosmetic — runName generated outside runRng (per rng.ts policy, inline comment)',
  },

  // ── Banter / upgrade rng — injectable, defaults to Math.random ──────
  {
    path: 'systems/BanterSystem.ts',
    reason: 'banter selection rng injectable; default Math.random; banter is not replay-recorded',
  },
  {
    path: 'data/upgrades.ts',
    reason: 'drawCards rng injectable (default Math.random for unit tests; gameplay passes runRng)',
  },

  // ── Hazard fallback (seeded path is wired in production; warns on miss) ──
  {
    path: 'systems/HazardsSystem.ts',
    reason: 'last-resort fallback with console.warn when getRunRng not wired (test stubs only); production uses runRng',
  },

  // ── Seed bootstrap ──────────────────────────────────────────────────
  {
    path: 'utils/rng.ts',
    reason: 'seedFromBrowser fallback when crypto.getRandomValues unavailable (one-time at run start)',
  },

  // ── Dev-only tooling (not in production builds) ─────────────────────
  {
    path: 'dev/StressTest.ts',
    reason: 'dev-only stress spawner; not on production code path',
  },

  // ── Comment-only mentions (the prose contract itself is the hit) ────
  {
    path: 'core/ISceneContext.ts',
    reason: 'comment-only — interface docstring describing the cosmetic-vs-seeded split',
  },
  {
    path: 'entities/enemyAngleSeed.ts',
    reason: 'comment-only — declares the never-use-Math.random contract for orbit/spawner angles',
  },
  {
    path: 'scenes/game/runeSystemController.ts',
    reason: 'comment-only — declares the controller never calls Math.random',
  },
  {
    path: 'scenes/game/runtimeTickHooks.ts',
    reason: 'comment-only — declares the hooks never introduce a fresh Math.random',
  },
  {
    path: 'scenes/game/CairnStackingScheduler.ts',
    reason: 'comment-only — explains gap jitter uses runRng; PickupSpawner placement is cosmetic',
  },
  {
    path: 'utils/save/types.ts',
    reason: 'comment-only — documents that runName is Math.random-generated outside runRng',
  },
];

/**
 * Walk `src/` recursively and return every shipped `.ts` file (excludes
 * `.test.ts` + `.d.ts`). Paths are returned forward-slash-relative to
 * `src/` for stable allowlist matching across platforms.
 */
function listSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = `${dir}${sep}${entry}`;
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.endsWith('.ts')) continue;
      if (entry.endsWith('.test.ts')) continue;
      if (entry.endsWith('.d.ts')) continue;
      const rel = full.slice(SRC_ROOT.length + 1).split(sep).join('/');
      out.push(rel);
    }
  };
  walk(SRC_ROOT);
  return out;
}

function findFilesUsingMathRandom(): Set<string> {
  const hits = new Set<string>();
  for (const rel of listSourceFiles()) {
    const text = readFileSync(`${SRC_ROOT}${sep}${rel.split('/').join(sep)}`, 'utf8');
    if (text.includes('Math.random')) hits.add(rel);
  }
  return hits;
}

describe('REVIEW S4 — Math.random allowlist enforces cosmetic-only carve-out', () => {
  const hits = findFilesUsingMathRandom();
  const allowedPaths = new Set(ALLOWLIST.map((e) => e.path));

  it('every file using Math.random is on the allowlist with a justification', () => {
    const orphans: string[] = [];
    for (const file of hits) {
      if (!allowedPaths.has(file)) orphans.push(file);
    }
    if (orphans.length > 0) {
      const detail = orphans
        .map(
          (f) =>
            `  - src/${f}\n    Add an entry to ALLOWLIST in src/replay/replayMathRandomAllowlist.test.ts.\n    If the use is gameplay state, route it through getRunRng() instead.`,
        )
        .join('\n');
      throw new Error(
        `New Math.random use(s) detected outside the cosmetic-only carve-out:\n${detail}`,
      );
    }
    expect(orphans).toEqual([]);
  });

  it('no allowlist entry is stale (file no longer uses Math.random)', () => {
    const stale = ALLOWLIST.filter((e) => !hits.has(e.path));
    if (stale.length > 0) {
      const detail = stale
        .map((e) => `  - src/${e.path} (reason: ${e.reason})`)
        .join('\n');
      throw new Error(
        `Stale allowlist entries — file no longer matches Math.random:\n${detail}\nRemove from ALLOWLIST in src/replay/replayMathRandomAllowlist.test.ts.`,
      );
    }
    expect(stale).toEqual([]);
  });

  it('every allowlist entry points to a file that exists', () => {
    const allFiles = new Set(listSourceFiles());
    const dangling = ALLOWLIST.filter((e) => !allFiles.has(e.path));
    if (dangling.length > 0) {
      const detail = dangling.map((e) => `  - src/${e.path}`).join('\n');
      throw new Error(`Allowlist references non-existent files:\n${detail}`);
    }
    expect(dangling).toEqual([]);
  });
});
