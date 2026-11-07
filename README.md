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
| Offline game and characters | `About()`, `search(query,{refresh})`, `character(id,{refresh})`, `record(category,id)`, `data.get(path)`, `data.ensure(path,{refresh})`, `data.list()`, `data.sync()` |
| Offline codes | `codes.raw()`, `codes.list()`, `codes.active()`, `codes.expired()`, `codes.unknown()`, `codes.search()`, `codes.get()`, `codes.summary()`, `codes.sync()`, `code(codeOrId)` |

Some community API endpoints may return 404, change behaviour, or be temporarily unavailable. HTTP failures are surfaced as `TrackerError` with `status` when available. Check [WarframeStat.us docs](https://docs.warframestat.us/) for current upstream availability.

## Supported runtime and packaging

- Node.js 18+; `require()` CommonJS; native `fetch`.
- `platform`: `pc`, `ps4`, `psn`, `xb1`, `swi`, `ns`. Default `pc`.
- `language`: two-letter language code. Default `en`.
- `timeoutMs`: positive integer, default `15000`.
- `cacheDir`: optional writable disk path for character cache; codes use a separate `codes/` subdirectory.
- `githubToken`: optional GitHub Contents read token for private `JsonData` sync.
- `fetchImpl`: optional mocked fetch implementation for tests.
- Package entry `index.js`, license MIT, author NekoSuneVR.
- No npm dependency on `gaming-infos`; all bundled JSON comes from the **JsonData branch in this repository**.

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
