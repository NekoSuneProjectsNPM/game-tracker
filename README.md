# NekoSune Game Tracker

**Independent game-information and player-profile APIs for Node.js.**  
Maintained by **NekoSuneVR** · **MIT License** · npm scope: `@nekosuneprojects`

This repository hosts standalone game SDKs on **separate Git branches**. Every game branch contains its own `package.json`, source code, tests, bundled JSON datasets, and README. The `main` branch is the **project directory and manual publishing workflow**, not one combined npm package.

The modules use local JSON by default when that data is available; some also support public game APIs, authorized third-party integrations, and optional GitHub JSON synchronization.

## Package directory

| Game | Source branch | npm package / current source version | Main capabilities |
| --- | --- | --- | --- |
| Warframe | [`warframe-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/warframe-api) | `@nekosuneprojects/warframe-api@1.0.1` | Warframes, offline game JSON, redeem codes, WarframeStat.us world-state, optional WFCD datasets |
| VRChat | [`vrchat-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/vrchat-api) | `@nekosuneprojects/vrchat-api@1.0.1` | Worlds, groups, public information, optional online world and avatar search |
| Genshin Impact | [`genshinimpact-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/genshinimpact-api) | `@nekosuneprojects/genshinimpact-api@1.0.0` | Character JSON, code archive, optional Enka.Network UID profiles |
| Honkai: Star Rail | [`honkaistarrail-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/honkaistarrail-api) | `@nekosuneprojects/honkaistarrail-api@1.0.0` | Characters, redeem codes, optional Enka.Network UID profiles |
| Zenless Zone Zero | [`zenlesszonezero-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/zenlesszonezero-api) | `@nekosuneprojects/zenlesszonezero-api@1.0.0` | Agents, redeem codes, optional Enka.Network UID/showcase data |
| Arknights: Endfield | [`arknightsendfield-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/arknightsendfield-api) | `@nekosuneprojects/arknightsendfield-api@1.0.0` | Operators, redeem codes, optional Enka.Network player business cards |
| Neverness to Everness | [`nte-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/nte-api) | `@nekosuneprojects/nte-api@1.0.0` | Characters, historical codes, separately labelled community code reports |
| Wuthering Waves | [`wutheringwaves-api`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/wutheringwaves-api) | `@nekosuneprojects/wutheringwaves-api@1.0.0` | Resonators, code history and date-aware reported-code candidates |

**Version note:** The table shows versions committed in each branch's `package.json` (checked November 7, 2026). **A source branch/version is not proof that its npm tarball has been published.** Confirm a release exists in the [npm organization](https://www.npmjs.com/org/nekosuneprojects) before installing, or check the branch's own release instructions.

Additional branches:

- [`JsonData`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData) — shared, publicly sourced per-game JSON records and code archives.
- [`TEMPLATE`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE) — starter for new game trackers; **not** a publishable package.
- [`main`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/main) — this index and the manual release workflow.

## Installation

Each game API is independently installable **once its exact version is published**:

```bash
npm install @nekosuneprojects/warframe-api@1.0.1
npm install @nekosuneprojects/vrchat-api@1.0.1
npm install @nekosuneprojects/genshinimpact-api@1.0.0
npm install @nekosuneprojects/honkaistarrail-api@1.0.0
npm install @nekosuneprojects/zenlesszonezero-api@1.0.0
npm install @nekosuneprojects/arknightsendfield-api@1.0.0
npm install @nekosuneprojects/nte-api@1.0.0
npm install @nekosuneprojects/wutheringwaves-api@1.0.0
```

**Requirements:** Node.js 18 or later; examples use CommonJS and `async`/`await`. Some online provider features require network access, credentials, or availability of third-party services. Normal offline JSON reads do **not** require an API key.

### Game information, characters and redeem-code archive

The six character-based API packages expose a consistent local-first entry point. Individual models, categories and extra methods are documented in each branch.

```js
const Genshin = require('@nekosuneprojects/genshinimpact-api');
const HSR = require('@nekosuneprojects/honkaistarrail-api');
const ZZZ = require('@nekosuneprojects/zenlesszonezero-api');
const Endfield = require('@nekosuneprojects/arknightsendfield-api');
const NTE = require('@nekosuneprojects/nte-api');
const WuWa = require('@nekosuneprojects/wutheringwaves-api');

async function main() {
  const games = {
    genshin: Genshin(),
    hsr: HSR(),
    zzz: ZZZ(),
    endfield: Endfield(),
    nte: NTE(),
    wuwa: WuWa()
  };

  for (const [id, api] of Object.entries(games)) {
    const game = await api.About();
    const characters = await api.characters.list();
    const codes = await api.codes.snapshot();
    console.log(id, game.name, characters.length, codes.Active.length);
  }

  const hsin = await games.wuwa.character('hsin');
  const akekuri = await games.endfield.character('akekuri');
  console.log(hsin.name, akekuri.name);
}

main().catch(console.error);
```

You can also load only the game your application needs. There is no requirement to install all eight packages together.

### Optional Enka.Network profiles

Genshin Impact, Honkai: Star Rail, Zenless Zone Zero and Arknights: Endfield support public UID lookups through [Enka.Network](https://enka.network/). Network calls only happen when explicitly invoked:

```js
const Endfield = require('@nekosuneprojects/arknightsendfield-api');
const ZZZ = require('@nekosuneprojects/zenlesszonezero-api');

async function main() {
  const endfield = Endfield();
  const card = await endfield.enka.businessCard('6976332004');

  const zzz = ZZZ();
  const profile = await zzz.enka.player('1300528351');

  console.log(card?.adventureLevel, profile.region);
}

main().catch(console.error);
```

Only publicly available profile details are accessible. Hidden or unshared character showcases must not be inferred. Respect third-party rate limits and avoid bulk UID enumeration.

### Warframe and VRChat

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const VRChat = require('@nekosuneprojects/vrchat-api');

async function main() {
  const warframe = Warframe({ platform: 'pc' });
  const ash = await warframe.character('ash');
  const alerts = await warframe.api.alerts(); // Live public world-state API

  const vrchat = VRChat();
  const world = await vrchat.world('theblackcat');
  const results = await vrchat.worlds.search('Black Cat');

  console.log(ash.name, alerts.length, world.name, results.total);
}

main().catch(console.error);
```

For additional Warframe drop/item/relic/patchlog sources and online VRChat search, read the respective branch READMEs. Remote services may be unavailable, rate-limited or subject to authentication rules.

## Data sources and accuracy

[**JsonData**](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData) maintains shared game records such as:

```text
games/<game-id>/meta.json
games/<game-id>/characters/<character>.json
codes/games/<game-id>.json
```

Actual folder identifiers and available dataset types vary by game (for example, `games/nte` for Neverness to Everness and `games/wutheringwaves` for Wuthering Waves). Follow the [JsonData data-layout guide](https://github.com/NekoSuneProjectsNPM/game-tracker/blob/JsonData/docs/DATA-LAYOUT.md) rather than guessing paths.

- **Offline first:** Bundled JSON is available without contacting a live API.
- **Explicit sync:** Where supported, `api.data.sync()` and `api.codes.sync()` fetch updated public JSON on demand. Local source changes and npm releases are independent.
- **Code status is not a redemption guarantee:** `Active`, `Expired` and `Unknown` are recorded/source-reported categories. Codes can expire or be disputed. Provider-specific `codes.candidates()`, `codes.reported()` and `codes.verifiedActive()` distinguish likely, historic and actually validated entries where implemented.
- **No fabricated profile information:** Public API responses are retained as returned, including missing/empty showcase fields. Online player details depend on the provider and on what the user has shared publicly.
- **Attribution:** Source links and public-data notes belong in the game-specific JSON and README. Check each upstream service's terms.

## Alternative: one combined SDK

If you want a single registry and `createClient('game-id')` interface instead of importing each standalone module, see [`@nekosuneprojects/gaming-infos`](https://github.com/NekoSuneProjectsNPM/gaming-infos). Its [draft PR #1](https://github.com/NekoSuneProjectsNPM/gaming-infos/pull/1) prepares the eight-provider `3.0.2` integration. This is a **separate repository and package**, not part of `game-tracker/main`; the draft version is not a published release merely because it has passed CI.

## Developing a new game tracker

1. Start from [`TEMPLATE`](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE) and create a new game-specific branch.
2. Add your game adapter under `src/`, expose the factory in `index.js` and configure `@nekosuneprojects/<tracker-branch>` in `package.json`.
3. Update `package-lock.json` to the same exact version and document the available data, authentication needs, limitations and code-status caveats in the branch README.
4. Add local and mocked-network tests; check that offline methods do not perform unnecessary API requests.
5. Validate with `npm ci`, `npm run check`, `npm test` and `npm pack --dry-run`.
6. Publish only when ready through the manual workflow described below.

The source and release histories remain independent for each branch. Do not put the combined package's dependencies or runtime in this `main` branch.

## Manual publishing — no automatic releases on push

The [**Manually publish tracker version** workflow](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml) runs on explicit **Run workflow** requests from `main`. It **does not publish on pushes**, and `main`, `TEMPLATE` and `JsonData` are blocked from release.

1. Open the [publishing workflow](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml) and select **Run workflow** from `main`.
2. Enter `tracker_branch`, such as `wutheringwaves-api`. The workflow checks that `package.json` name matches the branch.
3. Select `registry`: `npmjs`, `github` or `both`.
4. Choose `npm_auth`: `token` or `trusted` for npmjs publishing.
5. The workflow checks the exact `package.json` / lockfile version, installs and tests the package, then attempts the selected publication(s). A successful publish leads to a GitHub release tag named `<tracker-branch>-v<version>`.

**Publishing authentication:** `token` requires repository secret `NPM_TOKEN` with appropriate npm publish permissions and noninteractive 2FA eligibility. `trusted` requires a matching npm Trusted Publisher (OIDC) configuration for repository `NekoSuneProjectsNPM/game-tracker` and workflow `publish.yml`, as well as a compatible npm CLI. GitHub Packages uses the built-in `GITHUB_TOKEN` and temporarily changes the scope to `@nekosuneprojectsnpm/` inside the publishing job; committed source names remain `@nekosuneprojects/`.

The workflow checks whether npmjs already has the exact package version. **Never reuse an immutable published version.** If one registry succeeds and another fails, inspect the workflow and current registry state before retrying.

## Links

- [GitHub repository](https://github.com/NekoSuneProjectsNPM/game-tracker)
- [Game-tracker branches](https://github.com/NekoSuneProjectsNPM/game-tracker/branches)
- [JsonData source branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData)
- [Template branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE)
- [Manual publish workflow](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml)
- [npm organization](https://www.npmjs.com/org/nekosuneprojects)
- [Issues and feature requests](https://github.com/NekoSuneProjectsNPM/game-tracker/issues)
- [GitHub releases](https://github.com/NekoSuneProjectsNPM/game-tracker/releases)

**MIT © NekoSuneVR**
