# @nekosuneprojects/warframe-api

**Warframe live-game information, fully local game/character JSON, and redeem-code/glyph records.** A CommonJS npm package by NekoSuneVR, currently version **1.0.0**.

- Live data: [WarframeStat.us](https://api.warframestat.us/) — public community API for worldstate, equipment, drops, rivens and supported profiles (not an official Digital Extremes API).
- Local character data: **129 bundled JSON files** from [game-tracker → JsonData → games/warframe](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData/games/warframe), including `meta.json`, **Narin** and **Citrine Prime** (Update 44).
- Local codes: **one bundled `codes/games/warframe.json` snapshot** from [JsonData](https://github.com/NekoSuneProjectsNPM/game-tracker/blob/JsonData/codes/games/warframe.json), containing 503 `Active`, 32 `Expired`, and 0 `Unknown` entries at the time of integration. Status information is a *snapshot*, not a promise that any code is still redeemable.
- Optional separate GitHub synchronization for characters and codes. Offline queries work immediately using bundled JSON, with no API key or download required.
- Direct API URL is fixed in the package. **Do not configure a custom API URL.** The documented WarframeStat.us public endpoints do not require an API key.

## Installation

Once manually released to npmjs.org:

```bash
npm install @nekosuneprojects/warframe-api
```

**Status:** The source is on the `warframe-api` branch. Creating this branch does not publish the npm package. GitHub Actions publishing remains manual and uses the committed `package.json` version exactly.

## Initialise a Warframe tracker

```js
const Warframe = require('@nekosuneprojects/warframe-api');

const warframeData = Warframe({
  platform: 'pc',
  language: 'en',
  timeoutMs: 15000,
  // Optional for live GitHub sync only:
  cacheDir: './storage/warframe',
  githubToken: process.env.GITHUB_DATA_TOKEN
});
```

No credential is required for bundled JSON or the public WarframeStat.us API. A **GitHub read-only Contents token** may be required to update JSON from the `JsonData` branch if the GitHub repository is private. Store it in an environment variable, not in source control.

### Local game metadata — `About()`

```js
const aboutWarframe = await warframeData.About();
console.log(aboutWarframe.name);
console.log(aboutWarframe.Platform);
console.log(aboutWarframe.developers);
```

Reads the full `meta.json`, including developer, publisher, genre, description and supported platforms. The stored field names are preserved unchanged.

### Local Warframe characters — `search()` and `character()`

```js
const matches = await warframeData.search('Ash');
// Each match contains an id, name, type and path.
// Select an exact result: Ash vs Ash Prime.

const normalAsh = await warframeData.character('ash');
const primeAsh = await warframeData.character('ashprime');
console.log(normalAsh.abilities, primeAsh.armor);
```

Search scans local JSON filenames, names, aliases, and nested strings. Results are objects with `query`, `total`, `results`, `message`. A search with no results returns an empty list and a not-found message. Exact character lookups return the **full JSON record**, including nested details and abilities, or throw `NOT_FOUND`.

Convenience methods: `warframeData.record(category,id)`, `warframeData.item(id)`, `warframeData.map(id)`, `warframeData.data.get(relativePath)`, `warframeData.data.list()`. If that category is not present in the Warframe JSON source, exact lookup returns `NOT_FOUND`.

## Warframe game codes and creator glyphs

The codes source has a different structure from character records: it is a **single JSON object with `Active`, `Expired`, and `Unknown` arrays**. Individual entries include `id`, `game`, `code` (sometimes `null`), `category`, `status`, `verificationStatus`, `items`, `expiry`, `redeemUrl`, `claimType`, `requirements` and source metadata.

**Some active creator-glyph entries have `code: null`.** They describe giveaways, social links or eligibility requirements, not text redeem codes. The module preserves them, and `hasCode` allows filtering.

```js
// Full, original grouped JSON:
const grouped = await warframeData.codes.raw();

// Read lists with optional filters:
const active = await warframeData.codes.active();
const expired = await warframeData.codes.expired();
const unknown = await warframeData.codes.unknown();

// Actual text codes only:
const activeRedeemCodes = await warframeData.codes.active({
  hasCode: true
});

// Creator-glyph acquisition instructions without text codes:
const glyphInstructions = await warframeData.codes.active({
  category: 'creator-glyph',
  hasCode: false,
  limit: 20
});

// Search by code, item name, ID, type, or notes:
const codeMatches = await warframeData.codes.search('QUINCY');

// Get one full code/glyph entry by text code or numeric ID:
const quincy = await warframeData.codes.get('1999-QUINCY');
const sameEntry = await warframeData.code(quincy.id);

const summary = await warframeData.codes.summary();
console.log(summary);
```

| Method | Description |
| --- | --- |
| `codes.raw()` | Full `Active` / `Expired` / `Unknown` JSON |
| `codes.list({status,category,claimType,hasCode,limit})` | Flatten entries and apply filters |
| `codes.active(options)` | Entries marked active in the stored dataset |
| `codes.expired(options)` | Entries marked expired in the stored dataset |
| `codes.unknown(options)` | Entries with unknown status |
| `codes.search(query,options)` | Search code strings, IDs, reward names, notes and categories |
| `codes.get(codeOrId)` | Return a complete unique record; throws `NOT_FOUND` or `AMBIGUOUS` |
| `code(codeOrId)` | Game-level alias for `codes.get` |
| `codes.summary()` | Counts by status and whether an actual code string exists |
| `codes.sync()` | Explicitly refresh only `JsonData/codes/games/warframe.json` |

**Data freshness:** An `active` label reflects the supplied JSON snapshot and its verification timestamps, not a live check of redemption availability. For real-world usage, inspect `expiry`, `verificationStatus`, `lastVerifiedAt`, `requirements` and `sourceUrls`.

### Missing Warframe JSON and automatic retrieval on exact lookups

The bundled character snapshot already includes Narin and Citrine Prime. If another character is added to `JsonData` later and is not bundled or cached, an exact `character(id)` lookup will attempt one GitHub synchronization and then read the newly downloaded record:

```js
// Character is fetched from JsonData if not found locally:
const futureCharacter = await warframeData.character('futurecharacterid');

// Explicitly discover new files in search results:
const matches = await warframeData.search('Future', { refresh: true });

// Skip GitHub if you require strictly offline behaviour:
const onlyLocal = await warframeData.search('Ash');
const character = await warframeData.character('ash', { refresh: false });
```

Existing local records are read immediately without network requests. For updates to *existing* records, call `data.sync()` explicitly (or use `data.ensure('characters/ash.json', { refresh: true })`). This keeps offline usage fast and avoids silently making network requests for every search. Missing files, changed files, and missing cached copies are downloaded using GitHub SHA comparisons; successfully cached data survives offline operation. A private repository still requires a read token to fetch additions.

### Separate incremental JSON synchronization

```js
// Characters and meta.json (games/warframe/)
const characterSync = await warframeData.data.sync();

// Warframe codes only (codes/games/warframe.json)
const codeSync = await warframeData.codes.sync();

console.log(characterSync, codeSync);
```

Synchronization compares GitHub blob SHA values, downloads changed JSON only and caches it atomically. Unchanged files are skipped; existing local data remains available offline. A successful sync can refresh data without publishing a new npm version. The two sync methods use separate cache directories, so their manifests do not conflict. **No timer or automatic background synchronization is started.**

When the source is private, pass a suitable `githubToken` option. GitHub API rate limits, internet access, and repository permissions apply. Failed updates do not invalidate previously bundled data.

## Live WarframeStat.us endpoints

```js
const alerts = await warframeData.api.alerts();
const fissures = await warframeData.api.fissures();
const invasions = await warframeData.api.invasions();
const sortie = await warframeData.api.sortie();
const cycles = await warframeData.api.cetusCycle();
const trader = await warframeData.api.voidTrader();
const liveWorldstate = await warframeData.api.worldstate();

const liveWarframes = await warframeData.api.warframes();
const weapon = await warframeData.api.weapon('Soma');
const drops = await warframeData.api.drops();

const playerProfile = await warframeData.api.profile('PlayerName');
const playerStats = await warframeData.api.profileStats('PlayerName');
```

All live methods are grouped under `api` so the live equipment endpoints never overwrite offline JSON methods. Network requests use the built-in WarframeStat.us URL; availability and response content depend on the upstream service.

### Full method reference

| Category | Exported methods |
| --- | --- |
| Live worldstate | `api.worldstate()`, `api.worldstateField(field,options)` |
| Worldstate convenience methods | `api.alerts()`, `api.arbitration()`, `api.archonHunt()`, `api.cambionCycle()`, `api.cetusCycle()`, `api.conclaveChallenges()`, `api.constructionProgress()`, `api.dailyDeals()`, `api.darvo()`, `api.earthCycle()`, `api.events()`, `api.fissures()`, `api.flashSales()`, `api.globalUpgrades()`, `api.invasions()`, `api.kuva()`, `api.news()`, `api.nightwave()`, `api.persistentEnemies()`, `api.sentientOutposts()`, `api.simaris()`, `api.sortie()`, `api.steelPath()`, `api.syndicateMissions()`, `api.thermia()`, `api.vallisCycle()`, `api.voidTrader()`, `api.weeklyChallenges()` |
| Equipment and static item data | `api.warframes()`, `api.weapons()`, `api.items()`, `api.mods()`, `api.warframe(name)`, `api.weapon(name)`, `api.item(name)`, `api.mod(name)` |
| Equipment search | `api.searchWarframes(query)`, `api.searchWeapons(query)`, `api.searchItems(query)`, `api.searchMods(query)`, `api.list(kind)`, `api.get(kind,name)`, `api.search(kind,query)` |
| Drops and rivens | `api.drops()`, `api.searchDrops(query,options)`, `api.rivens()`, `api.searchRivens(weapon)` |
| Player profile | `api.profile(playerId)`, `api.profileStats(playerId)`, `api.profileXP(playerId)`, `getPlayerStats(playerId)` |
| Other static and feeds | `api.staticData(key)`, `api.searchStatic(key,query)`, `api.arcanes()`, `api.synthTargets()`, `api.rss()`, `api.twitter()`, `api.wfinfoFilteredItems()`, `api.wfinfoPrices()` |
| Diagnostics | `api.health()` |
| WFCD datasets | `wfcd.drops.*`, `wfcd.items.*`, `wfcd.relics.*`, `wfcd.patchlogs.*` |
| Optional WFCD modules | `market(options)`, `createUpdateMonitor(options)` |
| Offline game and characters | `About()`, `search(query,{refresh})`, `character(id,{refresh})`, `record(category,id)`, `data.get(path)`, `data.ensure(path,{refresh})`, `data.list()`, `data.sync()` |
| Offline codes | `codes.raw()`, `codes.list()`, `codes.active()`, `codes.expired()`, `codes.unknown()`, `codes.search()`, `codes.get()`, `codes.summary()`, `codes.sync()`, `code(codeOrId)` |

Some community API endpoints may return 404, change behaviour, or be temporarily unavailable. HTTP failures are surfaced as `TrackerError` with `status` when available. Check [WarframeStat.us docs](https://docs.warframestat.us/) for current upstream availability.

## Warframe Community Developers (WFCD) integrations

Four upstream WFCD datasets are available through fixed, on-demand GitHub sources with **persistent disk caching and SHA verification**. Data is downloaded only when requested, not at package startup. These repositories are third-party community sources and may contain upstream-stale records. The default package does not bulk-download all their assets.

| WFCD project | Integrated access | What it provides |
| --- | --- | --- |
| [warframe-drop-data](https://github.com/WFCD/warframe-drop-data) | `wfcd.drops` | Drop tables, relic drops, mission rewards, bounty rewards, build metadata |
| [warframe-items](https://github.com/WFCD/warframe-items) | `wfcd.items` | Compiled items, Warframes, weapons, mods, arcanes, crafting data |
| [warframe-relic-data](https://github.com/WFCD/warframe-relic-data) | `wfcd.relics` | Relic JSON from the upstream `development` branch; the upstream project warns its data may be stale |
| [warframe-patchlogs](https://github.com/WFCD/warframe-patchlogs) | `wfcd.patchlogs` | Parsed patch note JSON |
| [warframe-nexus-query](https://github.com/WFCD/warframe-nexus-query) | `market()` | Optional market price query library using Warframe.Market |
| [warframe-updates](https://github.com/WFCD/warframe-updates) | `createUpdateMonitor()` | Optional event-driven patch deployment monitor |

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeData = Warframe({ cacheDir: './storage/warframe' });

// Directly read individual WFCD JSON files; cached locally after first use.
const dropInfo = await warframeData.wfcd.drops.info();
const drops = await warframeData.wfcd.drops.all();
const missionRewards = await warframeData.wfcd.drops.missionRewards();

const allWarframes = await warframeData.wfcd.items.warframes();
const weapons = await warframeData.wfcd.items.weapons();
const mods = await warframeData.wfcd.items.mods();
const arcanes = await warframeData.wfcd.items.arcanes();

const relics = await warframeData.wfcd.relics.all();
const patchlogs = await warframeData.wfcd.patchlogs.all();

// Refresh a particular upstream file by checking its Git blob hash:
const latestWarframes = await warframeData.wfcd.items.refresh('Warframes.json');
```

Each dataset also exposes `get(filename)`, `refresh(filename)`, and `files`, a list of supported JSON filenames. Filename selection is restricted to verified source directories and known files, not arbitrary URL inputs. Cached files remain usable offline; `refresh()` needs GitHub connectivity. Some categories, particularly large item data files, may require significant download bandwidth and memory.

### Optional WFCD market pricing and patch update monitoring

The two upstream libraries are **optional**, not npm dependencies bundled into this project. Install them separately in the consuming application:

```bash
npm install warframe-nexus-query warframe-updates
```

```js
// Market query package is loaded on demand (ESM dynamic import).
const marketQuery = await warframeData.market({ logger: console });
const pricing = await marketQuery.priceCheckQuery('loki prime', 'pc');
await marketQuery.stopUpdating();

// Patch monitor is an EventEmitter supplied by the upstream package.
// It may poll periodically; stop/cleanup according to the upstream API.
const patchMonitor = warframeData.createUpdateMonitor({ interval: 60000 });
patchMonitor.on('update', update => console.log(update));
```

**Compatibility note:** The two optional integrations wrap the documented upstream constructors and require those packages to be installed. Their runtime compatibility and live availability are not yet end-to-end verified. The other four WFCD sources do **not** require an additional npm dependency. No third-party source code is bundled into this package.

## Supported runtime and packaging

- Node.js 18+; `require()` CommonJS; native `fetch`.
- `platform`: `pc`, `ps4`, `psn`, `xb1`, `swi`, `ns`. Default `pc`.
- `language`: two-letter language code. Default `en`.
- `timeoutMs`: positive integer, default `15000`.
- `cacheDir`: optional writable disk path for character cache; codes use a separate `codes/` subdirectory.
- `githubToken`: optional GitHub Contents read token for private `JsonData` sync.
- `fetchImpl`: optional mocked fetch implementation for tests.
- Package entry `index.js`, license MIT, author NekoSuneVR.
- WFCD datasets are optional on-demand downloads; market and update monitor require separate installation of their upstream packages.
- No npm dependency on `gaming-infos`; all bundled JSON comes from the **JsonData branch in this repository**.

### Manual publishing: no RELEASE_TOKEN required

The **Manually publish tracker version** action runs only when started with **Run workflow**. Select a tracker branch (never `main`, `TEMPLATE`, or `JsonData`) and choose `both`, `npmjs`, or `github`. All jobs use that branch's **exact committed `package.json` version**, with no automatic version bump.

The publishing jobs now run **directly inside the manual workflow**. It uses the built-in `GITHUB_TOKEN` to publish GitHub Packages and create the GitHub Release, so no `RELEASE_TOKEN` secret is required. npmjs publishing still requires repository secret `NPM_TOKEN` with correct permissions and any npm 2FA/trusted publishing configuration. GitHub-hosted `ubuntu-latest` runners are used; no self-hosted runner is needed. The GitHub package namespace must have suitable rights for the package scope.

The separate older `release: published` workflows remain available for releases explicitly created outside this manual workflow. Releases created here with `GITHUB_TOKEN` will **not retrigger them**, preventing duplicate uploads.

If one registry succeeds and another fails, its package version may already be published. Choose only the failed registry on a subsequent manual run rather than trying to republish the same version to both.

## Development, validation and release

```bash
npm ci
npm run check
npm test
npm pack --dry-run
```

Normal pushes do **not** publish anything. The manual GitHub Actions workflow validates the selected branch, the `package-lock.json` and tests; it creates a release for the exact `package.json` version. Choose `warframe-api` only after verifying the package.

[Manual publish workflow](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml) · [Source branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/warframe-api) · [Issues](https://github.com/NekoSuneProjectsNPM/game-tracker/issues)

Copyright © 2026 NekoSuneVR · MIT

## Registry authentication and retrying a failed manual publish

The manual action has **registry** (both/npmjs/github) and **npm_auth** (token/trusted) selections. It runs on GitHub-hosted Ubuntu runners and uses the exact selected tracker's `package.json` version.

- **npmjs.org package:** `@nekosuneprojects/<tracker-branch>` (unchanged).
- **GitHub Packages package:** `@nekosuneprojectsnpm/<tracker-branch>` (temporarily renamed only in the GitHub Packages publish job, matching repository organisation `NekoSuneProjectsNPM`). The committed package metadata keeps its npmjs name.
- **npm_auth = token:** Configure `NPM_TOKEN` in GitHub Actions secrets with a granular npm publishing token permitted to bypass interactive 2FA for CI. A standard token that returns `EOTP` cannot complete unattended GitHub Actions publishing; replace it or choose trusted publishing. Do not share the token.
- **npm_auth = trusted:** Configure npmjs [Trusted publishing](https://docs.npmjs.com/trusted-publishers/) for GitHub organisation/user `NekoSuneProjectsNPM`, repository `game-tracker`, workflow filename `publish.yml`, allowing direct `npm publish`. This uses OIDC (`id-token: write`) and Node.js 24 on GitHub-hosted runners; `NPM_TOKEN` is ignored in this mode. For an unpublished package, first publication may require a properly permissioned npm token before package settings permit Trusted Publisher configuration.

A failed job does not mean the package was published: check the registry package listing. If only one registry succeeded, re-run with **registry = npmjs** or **registry = github** to avoid re-publishing an existing immutable version. The workflow does not automatically bump any version and does not publish on pushes.

