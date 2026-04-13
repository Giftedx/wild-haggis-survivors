# Ralph Fix Plan

## High Priority
- [x] **Kill the last 7 scene reach-throughs** (`this.scene as unknown`) — done 2026-04-13, ISceneContext covers all sites
- [x] **Production `as any`** — eliminated (see journal); remaining `as any` only in tests / comments
- [x] Phaser vendor chunk ~1.48MB ungz — split to `vendor-phaser`; caching strategy documented in backlog
- [x] PWA precache ~1943 KiB — confirmed acceptable (backlog)
- [x] Exercise the Comfort panel end-to-end in CI via a smoke test — `settingsComfort.smoke.test.ts` (i18n keys + settings round-trip)
- [x] Main menu + pause menu i18n smoke — `hearthUi.i18n.smoke.test.ts` (all `t('ui.*')` keys used there)
- [x] Economy / run UI i18n smoke — `economyRunUi.i18n.smoke.test.ts` (shop, meta shop, curses, loadout menu, game-over, Post-Bell toasts)
- [x] Chronicle / Deeds i18n smoke — `chronicleDeeds.i18n.smoke.test.ts`
- [x] In-run HUD / juice i18n smoke — `gameHudJuice.i18n.smoke.test.ts`
- [x] Fix `ui.captions.*` → `captions.*` (victory/death/low-HP a11y lines) + `auxiliaryRunUi.i18n.smoke.test.ts`
- [x] Biome i18n smoke — `biomeI18n.smoke.test.ts` (`BIOMES` name + entry keys)
- [x] Document the a11y matrix in `docs/DESIGN_SOUL.md` for designers
- [x] `banter.ts` structure + weapon evolution banter — tests + feature shipped (journal)
- [x] Banter **weapon evolution moments** — implemented (journal loop 38b)
- [x] Ship a telemetry toggle (opt-in) for run-completion distribution — `telemetryOptIn`, `run_start`/`run_end` gated
- [x] DebugOverlay: surface active pool sizes, tween count, timers
- [x] **a11yText.contrastColor** — `hcOverride === undefined` guard + test (empty string honored when HC on)


## Medium Priority


## Low Priority


## Completed
- [x] Project enabled for Ralph

## Notes
- Focus on MVP functionality first
- Ensure each feature is properly tested
- Update this file after each major milestone
