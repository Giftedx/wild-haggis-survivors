# ha.ggis Hub New Repository Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after the repo is created.

**Goal:** Create a new standalone project repo for `ha.ggis.xyz`, the playable haggis hub that links into Wild Haggis Survivors as the first game.

**Architecture:** `ggis.xyz` is the simple public entry point and redirects to `ha.ggis.xyz`. `ha.ggis.xyz` hosts a small playable hub where the visitor controls the haggis and enters doors/portals to launch haggis-themed games. Wild Haggis Survivors remains its own game project and is linked/embedded from the hub rather than being swallowed into the hub repo.

**Tech Stack:** Vite + TypeScript + Phaser, matching Wild Haggis Survivors enough to share knowledge and visual/game-feel conventions. Deployment target can be Cloudflare Pages, Netlify, Vercel, or any static host; Cloudflare is the cleanest fit if DNS is already managed there.

---

## Vision Summary

The important domain joke is:

```text
ha.ggis.xyz
ha + ggis = haggis
```

`ha` also reads as laughter: “ha”, “haha”. The domain itself should feel like part of the game’s personality.

The hub should not be a normal marketing page first. It should be a tiny playable place: a haggis in a room, bothy, arcade, glen, or hallway. The player can walk to doors. Each door represents a haggis game. The first real door launches Wild Haggis Survivors.

The hub must still respect the player experience question from Wild Haggis Survivors:

> Can a real human play this change without a contributor walking them through it?

So the hub should include an obvious direct “Play Wild Haggis Survivors” action, even if walking to the door is the more charming version.

---

## Recommended Domain Shape

```text
https://ggis.xyz
  -> permanent redirect to https://ha.ggis.xyz

https://ha.ggis.xyz/
  -> playable Haggis Hub

https://ha.ggis.xyz/wild-haggis-survivors
  -> direct launch page / route for Wild Haggis Survivors

https://ha.ggis.xyz/about
  -> optional lightweight about/credits route later

https://ha.ggis.xyz/news
  -> optional patch notes/devlog route later
```

Do not make `ggis.xyz` the real app yet. Keep it as the front-door redirect. The memorable destination is `ha.ggis.xyz` because that is where the haggis domain pun lives.

---

## Repository Strategy

Create a new sibling repo next to Wild Haggis Survivors:

```text
C:/Users/aggis/dev/active/ha-ggis-hub
```

Suggested GitHub repo name:

```text
ha-ggis-hub
```

Suggested package name:

```json
"name": "ha-ggis-hub"
```

Do not put the hub inside the Wild Haggis Survivors repo. Keep the hub as an umbrella/launcher project, and keep WHS as a standalone game. This prevents the first game from accidentally becoming the whole platform.

Sibling layout:

```text
C:/Users/aggis/dev/active/
  wild-haggis-survivors/
  ha-ggis-hub/
```

Long-term optional layout if more games appear:

```text
C:/Users/aggis/dev/active/
  ha-ggis-hub/
  wild-haggis-survivors/
  haggis-game-2/
  haggis-game-3/
```

---

## Integration Model

Use the hub as a separate app that links to game builds.

Phase 1 should use a plain link:

```ts
window.location.href = '/wild-haggis-survivors';
```

or, if Wild Haggis Survivors is deployed separately at first:

```ts
window.location.href = 'https://wild-haggis-survivors-host.example';
```

Later, when deployment is settled, prefer this clean public URL:

```text
https://ha.ggis.xyz/wild-haggis-survivors
```

Possible deployment setups:

### Setup A: Hub owns path routing, WHS deployed as static subfolder

```text
ha.ggis.xyz/                         hub build
ha.ggis.xyz/wild-haggis-survivors/   WHS build copied/mounted here
```

Pros:
- Best public UX.
- One canonical domain.
- The first game feels part of the haggis hub.

Cons:
- Deployment pipeline needs to collect two builds.
- WHS Vite `base` may need to support `/wild-haggis-survivors/`.

### Setup B: Hub links to separate WHS deployment

```text
ha.ggis.xyz/                         hub
wild-haggis-survivors.pages.dev      WHS, or another subdomain
```

Pros:
- Fastest to launch.
- Minimal changes to WHS.

Cons:
- Slightly less polished.
- Later migration needed for canonical URL.

### Setup C: Use a game registry file

The hub stores games in a data file:

```ts
export const games = [
  {
    id: 'wild-haggis-survivors',
    title: 'Wild Haggis Survivors',
    route: '/wild-haggis-survivors',
    status: 'playable',
  },
  {
    id: 'future-game',
    title: 'Coming Soon',
    route: null,
    status: 'coming-soon',
  },
];
```

This is recommended even in Phase 1. It keeps the hub data-driven and prevents hard-coded door logic from spreading through scenes.

---

## MVP Scope

The first hub version should be tiny but real.

MVP includes:

- `ha.ggis.xyz` title/brand treatment.
- A playable haggis character in a small room/bothy/hall.
- Keyboard movement with WASD and arrow keys.
- One clearly marked Wild Haggis Survivors door.
- A direct “Play Wild Haggis Survivors” button.
- At least two “Coming soon” doors or blocked silhouettes to communicate the larger vision.
- Simple collision/interaction prompt: “Press E to play”.
- Basic responsive fallback for mobile/touch: tappable “Play” button is enough for MVP.
- Link out or route to WHS.

MVP does not include:

- Account system.
- Shared cloud save.
- Multiplayer presence.
- Complex inventory.
- Hub achievements.
- A big overworld.
- Multiple finished rooms.

---

## Art/Theme Direction

Recommended initial fiction:

```text
The Haggis Bothy
```

A bothy is warmer and more Scottish than a generic arcade. It can still contain weird arcade doors/portals.

Initial room objects:

- Main playable haggis.
- Door/sign: “Wild Haggis Survivors”.
- Locked future door: “More mischief brewing”.
- Noticeboard: “ha.ggis — say it without the dot”.
- Optional trophy shelf placeholder.

Domain gag treatment ideas:

```text
ha.ggis
say it without the dot
```

or

```text
ha.ggis.xyz
home of the haggis games
```

or animation:

```text
ha . ggis
haggis
```

---

## Save/Settings Boundary

Keep hub save separate from WHS save.

Suggested keys:

```text
ggis_hub_save
ggis_hub_settings
```

Do not write to these existing WHS keys from the hub:

```text
whs_save
whs_meta_save
whs_game_settings
```

Later, if the hub wants to show WHS trophies/progress, expose a small read-only summary API/module from WHS or use a postMessage/localStorage summary contract. Do not let the hub become an owner of WHS progression.

---

## Task Plan

### Task 1: Create the new repo folder

**Objective:** Start a standalone Vite + Phaser TypeScript app for the hub.

**Files:**
- Create repo at `C:/Users/aggis/dev/active/ha-ggis-hub`

**Steps:**

```bash
cd /c/Users/aggis/dev/active
npm create vite@latest ha-ggis-hub -- --template vanilla-ts
cd ha-ggis-hub
npm install
npm install phaser
npm install -D vitest eslint typescript-eslint @types/node
```

Initialize git:

```bash
git init
git add .
git commit -m "chore: create ha.ggis hub app"
```

Verification:

```bash
npm run dev
```

Expected: Vite dev server starts and the starter app opens.

---

### Task 2: Add project identity

**Objective:** Rename package and document the domain vision.

**Files:**
- Modify: `package.json`
- Create: `README.md`
- Create: `docs/VISION.md`

**Package target:**

```json
{
  "name": "ha-ggis-hub",
  "private": true,
  "type": "module"
}
```

**README should say:**

```md
# ha.ggis Hub

Playable hub for haggis-themed games.

`ha.ggis.xyz` is the joke: `ha` + `ggis` = `haggis`, with `ha` carrying the laugh.

The first playable game linked from the hub is Wild Haggis Survivors.
```

Verification:

```bash
npm run build
```

Expected: TypeScript/Vite build succeeds.

---

### Task 3: Create the game registry

**Objective:** Represent hub doors/games as data.

**Files:**
- Create: `src/data/games.ts`
- Create: `src/data/games.test.ts`

**Implementation:**

```ts
export type HubGameStatus = 'playable' | 'coming-soon';

export interface HubGameDefinition {
  id: string;
  title: string;
  subtitle: string;
  route: string | null;
  status: HubGameStatus;
}

export const HUB_GAMES: HubGameDefinition[] = [
  {
    id: 'wild-haggis-survivors',
    title: 'Wild Haggis Survivors',
    subtitle: 'Survive the moor. Become the menace.',
    route: '/wild-haggis-survivors',
    status: 'playable',
  },
  {
    id: 'coming-soon-1',
    title: 'More Haggis Mischief',
    subtitle: 'Another door rattles in the bothy.',
    route: null,
    status: 'coming-soon',
  },
];
```

Test expectations:

- There is exactly one playable game in MVP.
- The playable game id is `wild-haggis-survivors`.
- Playable games must have a route.
- Coming-soon games may have `route: null`.

Verification:

```bash
npm test
```

Expected: game registry tests pass.

---

### Task 4: Replace starter app with Phaser boot

**Objective:** Boot a Phaser scene instead of the default Vite content.

**Files:**
- Modify: `src/main.ts`
- Create: `src/scenes/HubScene.ts`
- Modify: `src/style.css`

**Scene behavior:**

- Black/dark background.
- Display `ha.ggis.xyz` title text.
- Display subtitle: `say it without the dot`.
- Display instruction: `Move: WASD / arrows. Interact: E.`

Verification:

```bash
npm run dev
```

Expected: Browser shows Phaser canvas with hub title text.

---

### Task 5: Add simple haggis movement

**Objective:** Let the visitor move a placeholder haggis around the room.

**Files:**
- Modify: `src/scenes/HubScene.ts`

**Implementation notes:**

Use placeholder graphics first:

- Brown oval/circle body.
- Tiny legs or dots optional.
- Movement via cursor keys and WASD.
- Clamp player to canvas bounds.

Do not block on final art.

Verification:

```bash
npm run dev
```

Expected: The placeholder haggis moves smoothly and cannot leave the visible room.

---

### Task 6: Add doors from game registry

**Objective:** Render one door per game definition.

**Files:**
- Modify: `src/scenes/HubScene.ts`
- Use: `src/data/games.ts`

**Behavior:**

- Wild Haggis Survivors door is visually active.
- Coming soon door is dimmed/locked.
- Each door has title text.
- Nearby door shows interaction prompt.

Verification:

```bash
npm run dev
```

Expected: Player can walk near the WHS door and sees `Press E to play Wild Haggis Survivors`.

---

### Task 7: Implement launch action

**Objective:** Let the WHS door route the player to the first game.

**Files:**
- Modify: `src/scenes/HubScene.ts`
- Create: `src/navigation/launchGame.ts`
- Create: `src/navigation/launchGame.test.ts`

**Implementation:**

```ts
import type { HubGameDefinition } from '../data/games';

export function getLaunchUrl(game: HubGameDefinition): string | null {
  if (game.status !== 'playable') return null;
  return game.route;
}

export function launchGame(game: HubGameDefinition): void {
  const url = getLaunchUrl(game);
  if (!url) return;
  window.location.href = url;
}
```

Test `getLaunchUrl`; do not directly test `window.location.href` unless using a controlled jsdom setup.

Verification:

```bash
npm test
npm run dev
```

Expected: Pressing E near the WHS door navigates to `/wild-haggis-survivors`.

---

### Task 8: Add direct play button outside the canvas

**Objective:** Make the site usable even for visitors who do not understand the playable hub immediately.

**Files:**
- Modify: `index.html`
- Modify: `src/main.ts`
- Modify: `src/style.css`

**Behavior:**

Add a visible button:

```text
Play Wild Haggis Survivors
```

Clicking it launches the WHS route.

Verification:

```bash
npm run dev
```

Expected: A non-gamer can immediately click the button without walking to a door.

---

### Task 9: Add deployment config

**Objective:** Prepare static deployment for `ha.ggis.xyz`.

**Files, if using Cloudflare Pages:**
- Create: `wrangler.toml` or configure via Cloudflare dashboard
- Document: `docs/DEPLOYMENT.md`

**Recommended Cloudflare Pages settings:**

```text
Build command: npm run build
Build output directory: dist
Node version: 20+
Custom domain: ha.ggis.xyz
```

DNS:

```text
ha.ggis.xyz -> Cloudflare Pages custom domain target
```

Redirect:

```text
ggis.xyz/* -> https://ha.ggis.xyz/$1
```

Use a 301/308 only after you are sure the routing is final. During early testing, a 302/307 is safer because browser caches are less annoying.

Verification:

```bash
npm run build
```

Expected: `dist/` builds locally. Cloudflare Pages preview loads.

---

### Task 10: Decide how WHS is mounted

**Objective:** Choose the first real integration path between the hub and Wild Haggis Survivors.

**Option A for launch speed:**

- Deploy WHS wherever it currently builds cleanly.
- Set the hub game route to the WHS live URL.
- Later move to `/wild-haggis-survivors`.

**Option B for polished canonical launch:**

- Configure WHS Vite base for `/wild-haggis-survivors/`.
- Build WHS.
- Copy WHS `dist/` under hub deployment output at `dist/wild-haggis-survivors/`.
- Ensure refresh/deep link works.

If using Option B, add a script in hub repo later:

```json
{
  "scripts": {
    "build:whs": "cd ../wild-haggis-survivors && npm run build",
    "copy:whs": "node scripts/copy-whs-build.mjs",
    "build:all": "npm run build && npm run build:whs && npm run copy:whs"
  }
}
```

Do not implement this until the simple hub works.

---

## Initial GitHub Issues / Backlog

Create these issues in the new repo:

1. `Create playable ha.ggis hub MVP`
2. `Add game registry and WHS door`
3. `Add direct Play Wild Haggis Survivors button`
4. `Set up ha.ggis.xyz deployment`
5. `Decide WHS mount strategy under /wild-haggis-survivors`
6. `Add final haggis/bothy placeholder art pass`
7. `Add accessibility and reduced-motion settings`
8. `Add hub save/settings boundary`

---

## Acceptance Criteria for First Public Version

- Visiting `https://ggis.xyz` redirects to `https://ha.ggis.xyz`.
- Visiting `https://ha.ggis.xyz` shows the playable hub.
- The domain joke is visible somewhere: `ha + ggis = haggis` or `say it without the dot`.
- A player can move the haggis with keyboard controls.
- A player can launch Wild Haggis Survivors from the hub.
- A player can launch Wild Haggis Survivors without understanding movement controls, using a direct button.
- Coming-soon doors communicate the broader haggis game universe.
- The hub has its own repo and does not mutate WHS save data.
- Build succeeds with `npm run build`.

---

## Recommended Next Action

Create `C:/Users/aggis/dev/active/ha-ggis-hub` as a new Vite + Phaser TypeScript repo, then implement Tasks 1-4 as the first batch. Stop after the Phaser title screen boots, commit, then continue into movement and doors.
