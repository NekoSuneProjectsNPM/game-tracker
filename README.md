# @nekosuneprojects/warframe-api

Warframe game tracker combining **public WarframeStat.us live API** with **offline-local Warframe character JSON**, searchable by name and ID. CommonJS package, Node.js 18+, no WarframeStat.us API key required.

**Sources:** [WarframeStat.us](https://api.warframestat.us), [API reference](https://docs.warframestat.us/), and [NekoSune JsonData](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData/games/warframe). WarframeStat.us is a community project, not the official Digital Extremes API.

## Install

```sh
npm install @nekosuneprojects/warframe-api
```

**Publishing status:** This branch contains the package source but is not automatically published. Run the manual GitHub Actions workflow for `warframe-api` after reviewing and confirming the desired package version. The npm package name will only be installable after successful publication.

## Local JSON: bundled characters and game details

**127 JSON files (current JsonData snapshot, ~6.28 MB)** are included directly in `data/`: `meta.json` and 126 Warframe character records. They work offline without API keys or setup.

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeData = Warframe();

const warframeAbout = await warframeData.About(); // bundled meta.json
const found = await warframeData.search('Ash');
console.log(found.results); // Contains Ash and Ash Prime; may include other related matches
const ash = await warframeData.character('ash');
const ashPrime = await warframeData.character('ashprime');
console.log(ash.abilities, ashPrime.isPrime);
```

The `search(query)` result contains `query`, `total`, `results` and a human-readable `message`. Each match provides `id`, `name`, `type`, `path`. Search includes names, filenames and nested string values. Missing searches return `total: 0` and an empty list; missing specific records throw `NOT_FOUND`. The returned JSON preserves all its original fields.

## Incremental JsonData synchronization

The package ships with a fixed GitHub source: `NekoSuneProjectsNPM/game-tracker`, `JsonData`, `games/warframe/`. Update local JSON on demand:

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeData = Warframe({
  cacheDir: './storage/warframe',
  githubToken: process.env.GITHUB_DATA_TOKEN // optional for public repos; required if private
});
const summary = await warframeData.data.sync();
console.log(summary.updated,summary.unchanged);
const ash = await warframeData.character('ash'); // cached new version takes priority
```

The `game-tracker` repository may be private. If so, downloading new JSON from `JsonData` requires a GitHub token with **read-only Contents** access to that repository. The bundled data never requires a token. Do not commit tokens. Synchronization uses the GitHub Git Tree + Blob APIs, compares Git SHA-1 blob hashes, verifies JSON, and atomically caches only changed files. It does not delete local files or automatically publish an npm version.

## Live WarframeStat.us API

The direct endpoint `https://api.warframestat.us/` is internal. No custom URL, key or configuration is required.

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeData = Warframe({ platform:'pc', language:'en', timeoutMs:15000 });

const alerts = await warframeData.api.alerts();
const fissures = await warframeData.api.fissures();
const trader = await warframeData.api.voidTrader();
const sorties = await warframeData.api.sortie();
const activeEvents = await warframeData.api.events();
const worldstate = await warframeData.api.worldstate();
const weapon = await warframeData.api.weapon('Soma');
const liveWarframes = await warframeData.api.warframes();
const player = await warframeData.api.profile('YourPlayerName');
const stats = await warframeData.api.profileStats('YourPlayerName');
```

### API method directory

| Category | Supported methods |
| --- | --- |
| Worldstate | `api.worldstate()`, `api.worldstateField(field,{filter})` |
| Individual worldstate fields | `api.alerts()`, `api.fissures()`, `api.invasions()`, `api.sortie()`, `api.archonHunt()`, `api.nightwave()`, `api.cetusCycle()`, `api.vallisCycle()`, `api.cambionCycle()`, `api.earthCycle()`, `api.voidTrader()`, `api.steelPath()`, `api.arbitration()`, `api.kuva()`, `api.news()`, `api.events()`, `api.syndicateMissions()`, `api.constructionProgress()`, `api.darvo()`, `api.dailyDeals()`, `api.flashSales()`, `api.simaris()`, `api.thermia()`, `api.conclaveChallenges()`, `api.persistentEnemies()`, `api.sentientOutposts()`, `api.globalUpgrades()`, `api.weeklyChallenges()` |
| Items & equipment | `api.warframes()`, `api.weapons()`, `api.items()`, `api.mods()`, `api.warframe(name)`, `api.weapon(name)`, `api.item(name)`, `api.mod(name)`, `api.searchWarframes(query)`, `api.searchWeapons(query)`, `api.searchItems(query)`, `api.searchMods(query)`; generic `api.list(type)`, `api.get(type,name)`, `api.search(type,query)` |
| Drops | `api.drops()`, `api.searchDrops(query,{grouped_by:'location'})` |
| Riven data | `api.rivens()`, `api.searchRivens(weapon)` |
| Profiles | `api.profile(playerId)`, `api.profileStats(playerId)`, `api.profileXP(playerId)` |
| Static data | `api.staticData(key)`, `api.searchStatic(key,query)`, `api.synthTargets()`, `api.arcanes()` |
| Feeds & integration | `api.rss()`, `api.twitter()`, `api.wfinfoFilteredItems()`, `api.wfinfoPrices()` |
| Diagnostics | `api.health()` |
| Local JSON | `About()`, `search(query)`, `character(id)`, `record(category,id)`, `data.list()`, `data.get(path)`, `data.sync()` |

`worldstateField()` and `staticData()` allow access to additional documented fields without changing the npm package. Some upstream features (Twitter/WFInfo, profile endpoints, non-PC worldstate) can be unavailable or redirect; such failures are surfaced as `TrackerError` with HTTP status when available.

### Configuration

```js
const warframeData = Warframe({
  platform: 'pc', // pc, ps4, psn, xb1, swi, ns
  language: 'en',
  timeoutMs: 15000,
  cacheDir: './storage/warframe',
  githubToken: process.env.GITHUB_DATA_TOKEN
});
```

Requests use native `fetch`; errors are `TrackerError` with `status` for HTTP errors. No client-supplied API URL is supported. `fetchImpl` may be supplied for testing.

## Testing and releasing

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Pushes to `warframe-api` do not publish automatically. To publish, open [GitHub Actions → Manually publish tracker version](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml), select the `main` workflow ref, enter `warframe-api`, and ensure npm/GitHub Packages credentials and runners are configured. The workflow reads `package.json` version exactly: currently **2.5.0**. The `JsonData/codes` folder is not used or changed.

MIT © NekoSuneVR
