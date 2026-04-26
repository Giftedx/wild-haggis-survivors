import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN_STRINGS, type LocaleTree } from '../core/i18n';
import { SCS_STRINGS } from '../core/i18n.scs';
import { BANTER_KEYS } from './banter';

type ReviewStatus = 'needs_human_review' | 'partially_verified_needs_editorial_review' | 'approved';
type ReleaseDecision = 'blocked_until_review' | 'ship_release';

interface ReviewEvidence {
  reviewerRole: string;
  reviewerScope: string;
  date: string;
  evidenceRef: string;
  outcome: string;
}

interface CulturalReviewGate {
  id: string;
  title: string;
  reviewDomain: string;
  requiredReviewer: string;
  status: ReviewStatus;
  releaseBlocking: boolean;
  releaseDecision: ReleaseDecision;
  reviewEvidence: ReviewEvidence[];
  sourceDocs: string[];
  reviewAsk: string;
  lineKeys: string[];
}

interface CulturalReviewStatus {
  schemaVersion: number;
  updated: string;
  sourceOfTruth: string;
  releaseRule: string;
  gates: CulturalReviewGate[];
}

const STATUS_PATH = new URL('../../docs/status/cultural/CULTURAL_REVIEW_STATUS.json', import.meta.url);
const REPO_ROOT = new URL('../../', import.meta.url);
const STATUS = JSON.parse(readFileSync(STATUS_PATH, 'utf8')) as CulturalReviewStatus;

const REQUIRED_GATE_IDS = [
  'doric_quinie_dialect',
  'peerie_shetlander_dialect',
  'burns_canongate_editorial',
  'gaelic_cailleach_sensitivity',
] as const;

/**
 * Per-gate classifier regexes. Each lineKey in a gate's `lineKeys` MUST
 * match exactly one of these patterns under that gate's id. This is how
 * we prove a key is filed under the CORRECT gate, not just *some* gate.
 *
 * Adding a new culturally-sensitive surface requires:
 *   1. extending the matching gate's pattern list, AND
 *   2. adding the line keys to the manifest under that gate.
 *
 * The drift-detection test below scans live data files for keys that
 * match any of these patterns but are absent from the manifest.
 */
const GATE_PATTERNS: Readonly<Record<string, readonly RegExp[]>> = {
  doric_quinie_dialect: [
    /^variant\.doric_quinie\.(name|flavor|lore)$/,
    /^ui\.banter\.(low_hp|level_up|first_blood|kill_streak|recover|idle)\.doric_quinie\./,
    /^ui\.banter\.first_time\.variant_doric_quinie_unlocked\./,
  ],
  peerie_shetlander_dialect: [
    /^variant\.peerie_shetlander\.(name|flavor|lore)$/,
    /^ui\.banter\.(low_hp|level_up|first_blood|kill_streak|recover|idle)\.peerie_shetlander\./,
    /^ui\.banter\.first_time\.variant_peerie_shetlander_unlocked\./,
  ],
  burns_canongate_editorial: [
    /^variant\.burns_wee_beastie\.(name|flavor|lore)$/,
    /^variant\.unlock\.burns_night_full_evo$/,
    /^ui\.banter\.(low_hp|level_up|first_blood|kill_streak|recover|idle)\.burns_wee_beastie\./,
    /^ui\.banter\.first_time\.variant_burns_wee_beastie_unlocked\./,
    /^ui\.banter\.burns_citation\./,
    /^ui\.banter\.seasonal_event\.burns_night\./,
    /^seasonalEvent\.burns_night\.(name|description|badge_suffix|ceremony_banner)$/,
  ],
  gaelic_cailleach_sensitivity: [
    /^variant\.cailleach\.(name|flavor|lore)$/,
    /^ui\.banter\.(low_hp|level_up|first_blood|kill_streak|recover|idle)\.cailleach\./,
    /^ui\.banter\.first_time\.variant_cailleach_unlocked\./,
    /^ui\.banter\.cailleach_whisper\./,
    /^ui\.banter\.seasonal_event\.(samhain|beltane)\./,
    /^seasonalEvent\.(samhain|beltane)\.(name|description|badge_suffix|ceremony_banner)$/,
  ],
};

function flattenStrings(tree: LocaleTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flattenStrings(value, path);
  });
}

function resolve(tree: LocaleTree, key: string): string | undefined {
  let cursor: string | LocaleTree | undefined = tree;
  for (const part of key.split('.')) {
    if (!cursor || typeof cursor === 'string') return undefined;
    cursor = cursor[part];
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

/** True if `key` matches any gate's regex set (i.e. it is culturally sensitive). */
function isAnyGateKey(key: string): boolean {
  return Object.values(GATE_PATTERNS).some((patterns) =>
    patterns.some((pattern) => pattern.test(key))
  );
}

/** Returns the gate id that owns `key`, or undefined if no gate claims it. */
function gateForKey(key: string): string | undefined {
  for (const [id, patterns] of Object.entries(GATE_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(key))) return id;
  }
  return undefined;
}

describe('cultural review release gate', () => {
  it('tracks each required human-review gate once', () => {
    const ids = STATUS.gates.map((gate) => gate.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of REQUIRED_GATE_IDS) {
      expect(ids, `missing cultural review gate ${id}`).toContain(id);
    }
  });

  it('every gate carries the metadata reviewers need', () => {
    expect(STATUS.schemaVersion, 'manifest must declare a schemaVersion').toBeGreaterThan(0);
    expect(STATUS.sourceOfTruth, 'manifest must point reviewers at the packet').toMatch(
      /CULTURAL_REVIEW_PACKET\.md$/
    );
    expect(STATUS.releaseRule.length, 'manifest must state the release rule').toBeGreaterThan(0);

    for (const gate of STATUS.gates) {
      expect(gate.title.length, `${gate.id} missing title`).toBeGreaterThan(0);
      expect(gate.reviewDomain.length, `${gate.id} missing reviewDomain`).toBeGreaterThan(0);
      expect(gate.requiredReviewer.length, `${gate.id} missing requiredReviewer`).toBeGreaterThan(0);
      expect(gate.reviewAsk.length, `${gate.id} missing reviewAsk`).toBeGreaterThan(0);
      expect(typeof gate.releaseBlocking, `${gate.id} releaseBlocking must be boolean`).toBe(
        'boolean'
      );
      expect(['needs_human_review', 'partially_verified_needs_editorial_review', 'approved']).toContain(
        gate.status
      );
      expect(['blocked_until_review', 'ship_release']).toContain(gate.releaseDecision);
      expect(Array.isArray(gate.reviewEvidence), `${gate.id} reviewEvidence must be an array`).toBe(
        true
      );
      expect(Array.isArray(gate.sourceDocs), `${gate.id} sourceDocs must be an array`).toBe(true);
      expect(gate.sourceDocs.length, `${gate.id} sourceDocs must list at least one ref`).toBeGreaterThan(
        0
      );
      expect(Array.isArray(gate.lineKeys), `${gate.id} lineKeys must be an array`).toBe(true);
      expect(gate.lineKeys.length, `${gate.id} must claim at least one line key`).toBeGreaterThan(0);
    }
  });

  it('every gate has a classifier pattern set so its lineKeys are unambiguously owned', () => {
    for (const id of STATUS.gates.map((g) => g.id)) {
      expect(GATE_PATTERNS[id], `gate ${id} has no classifier pattern set`).toBeDefined();
    }
  });

  it('every lineKey is owned by exactly the gate it lives under', () => {
    for (const gate of STATUS.gates) {
      for (const key of gate.lineKeys) {
        const owner = gateForKey(key);
        expect(owner, `lineKey ${key} (in gate ${gate.id}) does not match any gate pattern`).toBe(
          gate.id
        );
      }
    }
  });

  it('no lineKey appears in more than one gate', () => {
    const seen = new Map<string, string>();
    for (const gate of STATUS.gates) {
      for (const key of gate.lineKeys) {
        const prior = seen.get(key);
        expect(
          prior,
          `lineKey ${key} appears in both ${prior} and ${gate.id} — assign to exactly one gate`
        ).toBeUndefined();
        seen.set(key, gate.id);
      }
    }
  });

  it('keeps every sensitive cultural review key in the manifest', () => {
    const liveSensitiveKeys = flattenStrings(EN_STRINGS).filter(isAnyGateKey).sort();
    const manifestKeys = STATUS.gates.flatMap((gate) => gate.lineKeys).sort();
    expect(manifestKeys).toEqual(liveSensitiveKeys);
  });

  it('detects culturally-sensitive keys present in data files but missing from the manifest', () => {
    // Drift detection: a future agent who adds a new Doric/Shetlandic/
    // Burns/Cailleach line under `ui.banter.*` (via banter.ts pool entry)
    // must also file it in the manifest, or this test fails. We check
    // both the live i18n EN tree (already covered) AND the BANTER_KEYS
    // surface (so a banter pool that lists a sensitive key without an
    // i18n leaf still trips the manifest fence).
    const manifestKeys = new Set(STATUS.gates.flatMap((gate) => gate.lineKeys));
    const banterDriftKeys = BANTER_KEYS.filter(isAnyGateKey).filter(
      (key) => !manifestKeys.has(key)
    );
    expect(
      banterDriftKeys,
      `banter pool declares culturally-sensitive keys absent from CULTURAL_REVIEW_STATUS.json: ${banterDriftKeys.join(', ')}`
    ).toEqual([]);

    const i18nDriftKeys = flattenStrings(EN_STRINGS)
      .filter(isAnyGateKey)
      .filter((key) => !manifestKeys.has(key));
    expect(
      i18nDriftKeys,
      `EN i18n tree carries culturally-sensitive keys absent from CULTURAL_REVIEW_STATUS.json: ${i18nDriftKeys.join(', ')}`
    ).toEqual([]);
  });

  it('all manifest keys resolve in both EN and SCS without fallback', () => {
    const banterKeys = new Set(BANTER_KEYS);
    for (const gate of STATUS.gates) {
      for (const key of gate.lineKeys) {
        const en = resolve(EN_STRINGS, key);
        const scs = resolve(SCS_STRINGS, key);
        expect(en, `EN missing ${key}`).toEqual(expect.any(String));
        expect(scs, `SCS missing ${key}`).toEqual(expect.any(String));
        expect(en!.length, `EN empty ${key}`).toBeGreaterThan(0);
        expect(scs!.length, `SCS empty ${key}`).toBeGreaterThan(0);
        if (key.startsWith('ui.banter.')) {
          expect(banterKeys.has(key), `banter manifest key is not wired: ${key}`).toBe(true);
        }
      }
    }
  });

  it('every sourceDocs path is well-formed and points at a docs reference', () => {
    // Path-shape check (always runs). Catches typos like trailing
    // slashes, absolute paths, missing `docs/` prefix.
    for (const gate of STATUS.gates) {
      for (const docPath of gate.sourceDocs) {
        expect(typeof docPath, `${gate.id} sourceDocs entry must be a string`).toBe('string');
        expect(
          docPath.startsWith('docs/'),
          `${gate.id} sourceDocs entry ${docPath} must be a repo-relative docs/ path`
        ).toBe(true);
        expect(
          /\.(md|txt|json)$/i.test(docPath),
          `${gate.id} sourceDocs entry ${docPath} must end with a known doc extension`
        ).toBe(true);
        expect(
          docPath.includes('..'),
          `${gate.id} sourceDocs entry ${docPath} must not traverse upward`
        ).toBe(false);
      }
    }
  });

  it('the manifest sourceOfTruth points at the packet and the packet exists on disk', () => {
    // Sanity anchor: the packet is the single SOT for reviewers and
    // lives in the same directory as the manifest. If THIS pair drifts
    // apart, the whole reviewer flow is broken. Other sourceDocs paths
    // (research dossiers, audit briefs) are not existence-checked here
    // because partial worktrees don't always materialise them
    // (memory: `worktree_isolation_hazard`); their authoritative drift
    // check lives in master CI when the full tree is present.
    expect(STATUS.sourceOfTruth).toBe('docs/status/cultural/CULTURAL_REVIEW_PACKET.md');
    const packetUrl = new URL(STATUS.sourceOfTruth, REPO_ROOT);
    const packetPath = fileURLToPath(packetUrl);
    expect(
      existsSync(packetPath),
      `CULTURAL_REVIEW_PACKET.md must exist at ${STATUS.sourceOfTruth}`
    ).toBe(true);
  });

  it('does not allow release-blocked content to be marked shippable without evidence', () => {
    for (const gate of STATUS.gates) {
      if (gate.releaseDecision !== 'ship_release') continue;

      expect(gate.status, `${gate.id} is ship_release without approval`).toBe('approved');
      expect(gate.reviewEvidence.length, `${gate.id} needs human review evidence`).toBeGreaterThan(0);
      for (const evidence of gate.reviewEvidence) {
        expect(evidence.reviewerRole.length, `${gate.id} evidence missing reviewerRole`).toBeGreaterThan(0);
        expect(evidence.reviewerScope, `${gate.id} evidence missing reviewerScope`).toBe(gate.id);
        expect(evidence.date, `${gate.id} evidence missing date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(evidence.evidenceRef.length, `${gate.id} evidence missing evidenceRef`).toBeGreaterThan(0);
        expect(evidence.outcome.length, `${gate.id} evidence missing outcome`).toBeGreaterThan(0);
      }
    }
  });

  it('every approved gate has at least one piece of review evidence', () => {
    // Catches the half-flip case: someone marks `status: approved` but
    // forgets to record evidence (or leaves `releaseDecision` blocked).
    // The earlier guard only fires when `releaseDecision === ship_release`,
    // so this rule prevents an `approved` flag from sitting there
    // unsubstantiated and getting silently promoted later.
    for (const gate of STATUS.gates) {
      if (gate.status !== 'approved') continue;
      expect(
        gate.reviewEvidence.length,
        `${gate.id} is marked approved but has no reviewEvidence — record reviewer + date + evidenceRef`
      ).toBeGreaterThan(0);
      for (const evidence of gate.reviewEvidence) {
        expect(
          evidence.reviewerRole.length,
          `${gate.id} approved evidence missing reviewerRole`
        ).toBeGreaterThan(0);
        expect(
          evidence.date,
          `${gate.id} approved evidence missing ISO date`
        ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(
          evidence.evidenceRef.length,
          `${gate.id} approved evidence missing evidenceRef`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('keeps currently unapproved release-blocking gates blocked', () => {
    for (const gate of STATUS.gates) {
      if (!gate.releaseBlocking || gate.status === 'approved') continue;
      expect(gate.releaseDecision, `${gate.id} must stay blocked until approved`).toBe('blocked_until_review');
    }
  });
});
