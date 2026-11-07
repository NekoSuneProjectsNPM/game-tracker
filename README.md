# NekoSune Game Tracker — Local JSON / Direct API / Hybrid module template

> **TEMPLATE ONLY.** This branch does not implement an actual game API. No invented API endpoints or API requirements are claimed.

Each tracker can use **bundled local JSON, GitHub-synced cached JSON, a verified direct API, or both**. No custom API URL is exposed to package consumers. API keys are required only for providers that need them. Local data works offline.

## Expected consumer experience (illustrative APEX package)

Once a real `apex-api` tracker exists and its methods are implemented:

```js
const APEX = require('@nekosuneprojects/apex-api');

const apexTracker = APEX({
  apiKey: process.env.APEX_API_KEY
});

const apexStats = await apexTracker.getPlayerStats('example-player');
console.log(apexStats);
```

The Apex package, provider URL, API-key requirement and supported methods above are **examples only**, not claims of an existing working integration.

### Loading environment variables

Node.js 20.6+ supports `node --env-file=.env app.js`. Or use `dotenv` in your consuming app (not required by this template):

```js
require('dotenv').config();
const APEX = require('@nekosuneprojects/apex-api');
const apexTracker = APEX({ apiKey: process.env.APEX_API_KEY });
```

Do not commit `.env` or credentials. When a game API requires **no key**, initialise it simply:

```js
const GAME = require('@nekosuneprojects/game-api');
const gameTracker = GAME();
```

## Collision-free naming for multiple games

Always use a **game-specific module and instance name** in documentation and integration examples; avoid generic `const tracker = ...` or `const stats = ...` when documenting a published tracker. Each game's factory remains isolated in its npm module.

```js
const Fortnite = require('@nekosuneprojects/fortnite-api');
const APEX = require('@nekosuneprojects/apex-api');
const WarThunder = require('@nekosuneprojects/war-thunder-api');

const fortniteTracker = Fortnite({ apiKey: process.env.FORTNITE_API_KEY });
const apexTracker = APEX({ apiKey: process.env.APEX_API_KEY });
const warThunderTracker = WarThunder(); // Only if the chosen provider needs no API key

// API methods are defined by each game's verified provider, and may differ.
```

These are **illustrative imports only**; no unimplemented package is claimed as published. If a game-specific tracker needs a different method name, document the real method in its own README. Separate variables and objects avoid name collisions; CommonJS modules are already independently scoped. Use per-game environment variable names where multiple trackers are installed.

## Game information: `About()`

Each tracker reads the game's own `meta.json` from local bundled or cached JSON, without requiring an API key or API URL. The method preserves the JSON fields as authored (including `name`, `title`, `Platform`, `engine`, `Genre`, `developers`, `publisher`, `description` and any extra game-specific fields). The method does not invent fields or change their casing.

```js
// Example once a Warframe tracker has been built and configured:
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeData = Warframe();

await warframeData.data.sync(); // Optional, checks JsonData on GitHub
const warframeAbout = await warframeData.About();
console.log(warframeAbout.name, warframeAbout.Platform);
```

The `About()` method returns the complete `games/<gameId>/meta.json` object. If there is no bundled or cached `meta.json`, it rejects with an `ENOENT` error rather than making up game information. To read while offline, synchronize first or include `data/meta.json` in the game package.

Currently identified game metadata folders in `JsonData`: `arknightsendfield`, `fortnite`, `genshinimpact`, `honkaistarrail`, `nte`, `toweroffantasy`, `vrchat`, `warframe`, `wutheringwaves` and `zenlesszonezero`. Set `gameId` to the exact folder name in each future tracker branch. This doesn't create those tracker packages automatically.

The `JsonData/codes/` directory is deliberately left untouched for later work.

## Missing JSON file downloads

`data.sync()` discovers files newly added to GitHub, downloads missing or changed JSON and leaves unchanged files cached. For new characters, `character(id)` tries local data first and performs a GitHub sync only when the exact record is absent. `search(query, { refresh: true })` checks for new files before searching, while `data.ensure('characters/record.json', { refresh: true })` forces a check for updated content. No automatic npm version bump or publishing occurs.

## Search and open JSON records in any game

Search scans locally bundled and cached JSON files by name, ID, filename, aliases and string content. It returns separate matches rather than automatically choosing between similar names. Exact lookups load the complete JSON record.

```js
// Example only: future Warframe tracker created from TEMPLATE
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeTracker = Warframe();

const found = await warframeTracker.search('Ash');
console.log(found.results);
// [{ id:'ash', name:'Ash', type:'characters', path:'characters/ash.json' },
//  { id:'ashprime', name:'Ash Prime', type:'characters', path:'characters/ashprime.json' }]

const normalAsh = await warframeTracker.character('ash');
const primeAsh = await warframeTracker.character('ashprime');
```

If no match exists, `search` returns `{ total:0, results:[], message:"We don't have anything related to ..."}`. Missing exact records throw `NOT_FOUND`. Search results include distinct IDs and paths for selection. Other game trackers reuse the same functions `search(query)`, `character(id)`, `item(id)`, `code(id)`, `map(id)`, and `record(category,id)` as appropriate for that game's data.

Each game must use its own `gameId` in `src/data-source.js`. The default remote source is **this repository's JsonData branch**, under `games/<gameId>/`. The `gaming-infos` project is only a layout reference; no JSON is copied from it.

## Local JSON data and GitHub synchronization

Game metadata, characters, game codes, weapons, maps and other JSON records can all be organised in files. A tracker branch chooses its *own* data source in `src/data-source.js`. The template ships a harmless `data/example.json` file; no game-specific source is enabled by default.

### Source: game-tracker / JsonData

In a Warframe package branch, set `gameId: 'warframe'` in `src/data-source.js`. The preconfigured remote source resolves to `NekoSuneProjectsNPM/game-tracker` → `JsonData` → `games/warframe`.

```js
const Warframe = require('@nekosuneprojects/warframe-api'); // illustrative future module
const warframeTracker = Warframe({ cacheDir: './storage/warframe' });
await warframeTracker.data.sync();
const matches = await warframeTracker.search('Ash');
const ash = await warframeTracker.character('ash');
```

JSON changes in `JsonData` are independent of npm versions. For offline use, read any previously synchronized or bundled files without `sync()`.

### Update and caching behaviour

- `data.get('relative/file.json')` reads **cached files first**, otherwise bundled `data/` files.
- `data.list()` recursively lists JSON files from the cache and bundled data.
- `data.sync()` explicitly checks the configured GitHub repository tree and compares each JSON file's Git blob SHA with a persistent cache manifest.
- Unchanged cached files are skipped; new or changed files are downloaded, checksum-verified, validated as JSON, and atomically saved under `~/.cache/nekosune-game-tracker/<gameId>/` by default.
- `cacheDir` can be set in the initial game tracker config for writable storage (for example in Docker). There is **no** custom remote API URL option.
- Failed downloads do not replace an existing cached file. `get()` can still use previously stored data offline.
- Sync does not automatically delete locally cached files removed from GitHub; this prevents unintended data loss. Future pruning should be explicit and opt-in.
- Sync is **on demand** by design. It does not perform background polling or start network calls on package import. Applications may schedule their own refreshes if desired.
- The source must be a readable public GitHub repository for unauthenticated syncing in the current template. GitHub rate limits apply.
- Large trees may be truncated by GitHub; the synchronizer refuses incomplete trees instead of mistaking missing files for deletions. Each JSON file has a 5 MiB size limit in this starter.

### Game codes and editable JSON

Store codes as individual files in `data/codes/<code>.json` (or `games/<gameId>/codes/<code>.json` in JsonData) and expose game-specific accessor methods when the relevant branch is implemented. Codes and expiration details must be based on verified sources; the template does not fabricate redemption codes.

To update files using GPT, use [the reusable JSON-maintenance prompt](docs/AI-JSON-PROMPT.md). Review the generated JSON, commit it to the correct game's GitHub data folder, then call `gameTracker.data.sync()` locally. Updating data files on GitHub **does not publish a new npm version**.

## Build an individual game module

1. Branch from `TEMPLATE` (e.g. `apex-api`). Change `package.json` name to `@nekosuneprojects/apex-api`, description and keywords.
2. Choose local-only, direct API, or hybrid. Configure a verified GitHub JSON source under `src/data-source.js` if needed. Only request API documentation/credentials for API-based features.
3. For API-based features, set the **fixed internal** API base URL and authentication style in `src/provider.js`; define real routes. Pure JSON trackers do not need an API URL.
4. Implement the game's supported methods in `src/tracker.js` using `data.get`, `data.list`, optional `data.sync`, and/or API requests. Keep distinct game-specific methods and instance names.
5. Only require `apiKey` when the provider actually needs one. Support public/no-key APIs with `GAME()`. Never hard-code credentials.
6. Replace this README with that individual tracker's installation, supported methods, auth, configuration, examples, rate limits and known limitations. Always use game-specific JavaScript identifiers (`fortniteTracker`, `apexTracker`) and per-game key names.
7. Update tests with mocked valid responses, run `npm test`, `npm run check`, `npm pack --dry-run`.
8. Manually start the publishing workflow in GitHub Actions after configuring publishing credentials.

## Manual releases (no automatic publishing on push)

Normal commits and pushes **never** publish or increment package versions. Set `package.json` version yourself, run `npm install --package-lock-only`, and commit both package files with your code.

Open [Actions: Manually publish tracker version](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml), choose **Run workflow** using the `main` workflow ref, and enter `tracker_branch` (such as `fortnite-api`). The input is text rather than a dynamic branch dropdown. `main` and `TEMPLATE` are blocked. The workflow reads the **exact version in the selected branch's package.json**, verifies the lockfile and tests, then creates tag `<branch>-v<version>`. No version files are edited or committed.

Only that manually created published GitHub Release triggers the npmjs.org and GitHub Packages release workflows. `RELEASE_TOKEN` with Contents write is needed so that release-created workflows are triggered. The registries also require valid publishing credentials and GitHub-hosted runner availability.

### Manual publishing: no RELEASE_TOKEN required

The **Manually publish tracker version** action runs only when started with **Run workflow**. Select a tracker branch (never `main`, `TEMPLATE`, or `JsonData`) and choose `both`, `npmjs`, or `github`. All jobs use that branch's **exact committed `package.json` version**, with no automatic version bump.

The publishing jobs now run **directly inside the manual workflow**. It uses the built-in `GITHUB_TOKEN` to publish GitHub Packages and create the GitHub Release, so no `RELEASE_TOKEN` secret is required. npmjs publishing still requires repository secret `NPM_TOKEN` with correct permissions and any npm 2FA/trusted publishing configuration. GitHub-hosted `ubuntu-latest` runners are used; no self-hosted runner is needed. The GitHub package namespace must have suitable rights for the package scope.

The separate older `release: published` workflows remain available for releases explicitly created outside this manual workflow. Releases created here with `GITHUB_TOKEN` will **not retrigger them**, preventing duplicate uploads.

If one registry succeeds and another fails, its package version may already be published. Choose only the failed registry on a subsequent manual run rather than trying to republish the same version to both.

## Project conventions

- `main` = central package directory; `TEMPLATE` = starter; both excluded from automatic release.
- Every other tracker branch matches its own npm package name: `@nekosuneprojects/<branch>`.
- CommonJS: `main: "index.js"`, `type: "commonjs"`. The default export is the game tracker factory, callable as `APEX({ apiKey })` and assignable to `apexTracker` or another game-specific instance identifier.
- API URLs/endpoints stay internal and must be sourced from verified documentation. GitHub data repositories are configured internally per game branch; these are not game API URLs.
- Never expose a `baseUrl` or `apiUrl` user option unless the project owner explicitly requests that feature for a particular tracker.
- Package versions are manually controlled in `package.json`; `.github/workflows/publish.yml` manually releases the selected tracker version, while `release: published` workflows publish it to registries. JSON GitHub updates do not change npm versions.
- Use Node.js 18+ and npm for normal development.

MIT © NekoSuneVR · https://github.com/NekoSuneProjectsNPM/game-tracker

## Registry authentication and retrying a failed manual publish

The manual action has **registry** (both/npmjs/github) and **npm_auth** (token/trusted) selections. It runs on GitHub-hosted Ubuntu runners and uses the exact selected tracker's `package.json` version.

- **npmjs.org package:** `@nekosuneprojects/<tracker-branch>` (unchanged).
- **GitHub Packages package:** `@nekosuneprojectsnpm/<tracker-branch>` (temporarily renamed only in the GitHub Packages publish job, matching repository organisation `NekoSuneProjectsNPM`). The committed package metadata keeps its npmjs name.
- **npm_auth = token:** Configure `NPM_TOKEN` in GitHub Actions secrets with a granular npm publishing token permitted to bypass interactive 2FA for CI. A standard token that returns `EOTP` cannot complete unattended GitHub Actions publishing; replace it or choose trusted publishing. Do not share the token.
- **npm_auth = trusted:** Configure npmjs [Trusted publishing](https://docs.npmjs.com/trusted-publishers/) for GitHub organisation/user `NekoSuneProjectsNPM`, repository `game-tracker`, workflow filename `publish.yml`, allowing direct `npm publish`. This uses OIDC (`id-token: write`) and Node.js 24 on GitHub-hosted runners; `NPM_TOKEN` is ignored in this mode. For an unpublished package, first publication may require a properly permissioned npm token before package settings permit Trusted Publisher configuration.

A failed job does not mean the package was published: check the registry package listing. If only one registry succeeded, re-run with **registry = npmjs** or **registry = github** to avoid re-publishing an existing immutable version. The workflow does not automatically bump any version and does not publish on pushes.

