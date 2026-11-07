# @nekosuneprojects/vrchat-api

**Local-first VRChat JSON catalog for Node.js 18+**, built in the same modular style as Warframe API. Initial source version **1.0.0**. The package is not yet published.

## Data first: `JsonData/games/vrchat`

This package bundles all 54 source JSON files from [game-tracker's JsonData branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData/games/vrchat): `meta.json`, 17 `players/` profiles, 14 `groups/` entries and 22 `worlds/` entries. The `avatars/` category is reserved for future JSON; the source currently contains **no avatar records**.

These are community-curated snapshots, **not live official VRChat account information**. This release doesn't perform authenticated VRChat API calls, logins, private status queries or avatar scraping. No API keys are necessary to read bundled data.

## Install after the first npm release

```bash
npm install @nekosuneprojects/vrchat-api@1.0.0
```

## API

```js
const VRChat = require('@nekosuneprojects/vrchat-api');
const vrchat = VRChat({ cacheDir: './storage/vrchat' });

console.log(await vrchat.About());
console.log(await vrchat.player('nekosunevr'));
console.log(await vrchat.group('nekosunecommunity'));
console.log(await vrchat.world('theblackcat'));

const results = await vrchat.search('Black Cat');
const worlds = await vrchat.worlds.list();
const matchingGroups = await vrchat.groups.search('club');
const avatars = await vrchat.avatars.list(); // [] until JsonData has avatars
```

| Method | Purpose |
| --- | --- |
| `About()` | Return full `meta.json` |
| `search(query, {category, limit, refresh})` | Search names, aliases, slugs and record fields |
| `record(category,id)` | Return a complete matching JSON record |
| `player(id)`, `group(id)`, `world(id)`, `avatar(id)` | Exact category lookups |
| `players/groups/worlds/avatars.list()` | Return locally available records |
| `players/groups/worlds/avatars.search(query)` | Search one category |
| `players/groups/worlds/avatars.get(id)` | Exact category lookup |
| `data.get('worlds/theblackcat.json')` | Read a bundled or cached JSON file |
| `data.list()` | List available file paths |
| `data.sync()` | Verify GitHub blob SHA values and download changed/new JSON files |
| `data.ensure(path,{refresh:true})` | Explicitly refresh a missing/changed JSON |

Missing exact records attempt one sync unless `{refresh:false}` is supplied. Existing bundled records stay offline-first. New records can be discovered through `search(query,{refresh:true})`. Sync is explicit and additive; it never removes old cached files. GitHub API rate limits apply.

### Private GitHub data source

For private `JsonData` only, optionally pass a read-only token: `VRChat({githubToken:process.env.GITHUB_DATA_TOKEN})`. Never embed tokens in files. Public bundled JSON requires no credentials.

## Build and test

```bash
npm ci
npm run check
npm test
npm pack --dry-run
```

Manual release uses the existing shared workflow on the `main` branch. Select `tracker_branch=vrchat-api`, then publish to npmjs or GitHub Packages. npm Trusted Publishing needs a package-specific setup; first publication may need interactive npm authentication. No release was created here.

## Optional public avatar-search integrations (experimental)

Eight user-supplied external services are registered with **fixed HTTPS endpoints**. All searches send `?search=<encoded query>` and a browser-style User-Agent. No authenticated VRChat requests or scraping of access-controlled content is implemented.

```js
const VRChat=require('@nekosuneprojects/vrchat-api');
const vrc=VRChat();
const result=await vrc.avatars.searchOnline('Rindo');
console.log(result.successful,result.failed,result.total);
for(const provider of result.providers){
  console.log(provider.provider,provider.status,provider.state,provider.count);
}
```

Call `vrc.avatarSearch('Rindo')` as a shortcut or `vrc.avatars.checkProviders({query:'Rindo'})` for diagnostics. `vrc.avatars.search('Rindo')` **still searches bundled local JSON**, which is currently empty; `searchOnline` uses external providers. Choose a subset with `{providers:['avtrdb','nekosune']}`. A 403/404/500, timeout, HTML page, or incompatible JSON becomes a provider-specific result; other services remain available.

| Provider ID | Endpoint |
|---|---|
| `avtr-icu` | https://avtr.icu/search |
| `worldbalancer` | https://avatarwbvrcxsearch.worldbalancer.com/vrcx_search |
| `fumikoecho` | https://avtr.fumikoecho.net/api/integrations/avatars/vrcx |
| `vrcdb` | https://vrcx.vrcdb.com/avatars/Avatar/VRCX |
| `paw` | https://paw-api.amelia.fun/vrcx_search |
| `nekosune` | https://vrcavatarsearch.nekosunevr.co.uk/vrcx_search |
| `avtr-zip` | https://vrcx.avtr.zip/ |
| `avtrdb` | https://api.avtrdb.com/v3/avatar/search/vrcx |

**Live compatibility is unverified** until network diagnostics are run from an environment with access. Endpoint formats and third-party access policies may change. Do not treat a non-JSON page as an avatar list. Responses are returned as the providers supply them; the module does not download private avatars, bypass 403 errors, or claim permission to use assets.

To run a real probe with query `Rindo` on your machine or GitHub runner:

```bash
npm run test:avatar-providers:live
```

The probe prints each provider's HTTP status, response state, count, timing and errors, and is deliberately non-blocking for expected third-party outages.
