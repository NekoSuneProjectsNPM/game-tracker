# @nekosuneprojects/genshinimpact-api

Standalone **local-first Genshin Impact JSON SDK** for Node.js 18+, following the same provider architecture as `warframe-api`. Initial package version: **1.0.0**, not published yet.

## Included offline data

Sourced from the [`JsonData` branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData):

- `games/genshinimpact/meta.json` — game metadata
- `games/genshinimpact/characters/*.json` — **121 character entries**
- `codes/games/genshin-impact.json` — **19 Active**, **248 Expired**, **0 Unknown** codes in the source snapshot

These classifications reflect the saved JSON snapshot, **not a guarantee that an Active code is still redeemable today**. Code expiry and redemption availability must be checked with the official redemption site. No API keys, account access or real-time HoYoverse connections are required.

## Install (after npm publication)

```bash
npm install @nekosuneprojects/genshinimpact-api@1.0.0
```

## Usage

```js
const Genshin = require('@nekosuneprojects/genshinimpact-api');
const gi = Genshin();

const about = await gi.About();
const amber = await gi.character('amber');
const furina = await gi.character('furina');
const characters = await gi.characters.list();
const matches = await gi.search('Pyro', {category:'characters'});

// Offline code archive
const activeInSnapshot = await gi.codes.active();
const expiredInSnapshot = await gi.codes.expired();
const allCodes = await gi.codes.all();
const codeMatches = await gi.codes.search('Primogems');
const codeDetails = await gi.codes.get(activeInSnapshot[0].code);

console.log(about.name, amber.name, furina.name);
console.log(characters.length, matches.total, activeInSnapshot.length);
```

## API reference

| Method | Description |
| --- | --- |
| `About()` | Full bundled game metadata |
| `character(id)` / `characters.get(id)` | Lookup a character by ID/name |
| `characters.list()` | List all locally stored character JSON |
| `characters.search(query,{limit})` / `search(query,{category,limit})` | Search character records |
| `codes.snapshot()` | Read original `Active` / `Expired` / `Unknown` object |
| `codes.all({hasCode,status,category,limit})` | List code entries across groups |
| `codes.active(options)` / `codes.expired(options)` / `codes.unknown(options)` | Filter source status groups |
| `codes.get(codeOrId)` | Get a code entry with reward, expiry, source and redemption fields |
| `codes.search(query,options)` | Find codes by code text, rewards or classification |
| `data.get(path)` / `data.list()` | Read local game JSON |
| `data.sync()` | Sync character JSON by Git blob SHA |
| `codes.sync()` | Independently sync the redeem-code file from `codes/games` |

## Updating JSON on demand

```js
const gi = Genshin({githubToken:process.env.GITHUB_DATA_TOKEN}); // optional for a private source
const characterUpdate = await gi.data.sync();
const codeUpdate = await gi.codes.sync();
const refreshedCodes = await gi.codes.snapshot();
const refreshedCharacters = await gi.characters.search('new character', {refresh:true});
console.log(characterUpdate,codeUpdate,refreshedCodes.Active.length);
```

There is **no automatic network access** during normal local reads. Synchronisation downloads new or changed JSON from the `JsonData` branch, validates Git blob hashes and JSON content, then writes atomically to a persistent cache. JSON sync is additive: deleted upstream records are not automatically deleted from the local cache.

## Checks and publishing

```bash
npm ci
npm run check
npm test
npm pack --dry-run
```

This branch supports the shared manual publish workflow in `main`, selecting `tracker_branch=genshinimpact-api`. Publishing must use a unique version and appropriate npmjs authentication (Trusted Publisher OIDC or token permitted by npm account policy). No npm release is created by this commit.
