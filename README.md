# @nekosuneprojects/genshinimpact-api

Standalone **local-first Genshin Impact JSON SDK** for Node.js 18+, following the same provider architecture as `warframe-api`. Initial package version: **1.0.0**, not published yet.

## Included offline data

Sourced from the [`JsonData` branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData):

- `games/genshinimpact/meta.json` — game metadata
- `games/genshinimpact/characters/*.json` — **124 character entries**
- `codes/games/genshin-impact.json` — **0 confirmed Active**, **252 Expired**, **8 Unknown/unverified** codes in the source snapshot

The November 7, 2026 audit removed 13 scraped reward fragments from the code list and moved outdated or disputed statuses out of Active. Six newly reported codes are retained under Unknown with source URLs. **No code is confirmed currently redeemable** without an official check or successful redemption. Code expiry and redemption availability must be checked with the official redemption site. No API keys, account access or real-time HoYoverse connections are required.

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
const codeDetails = await gi.codes.get('GENSHINGIFT'); // audited status: unknown

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

## Code and character audit — 7 November 2026

- Added three verified missing character records: **Mitya**, **Valeriy** (official Version 7.2 update), and **Vodyanitsa** (official character trailer).
- Removed 13 malformed reward-text entries (such as `Mora`, `Primogem`, `x100`) mistakenly scraped as redeem codes.
- Reclassified `BALLETCOLLAB`, `XVIZDH2B9WGX`, `MySnezhnayaCareer`, and `LEGEDILJKSGM` as expired.
- Moved `GENSHINGIFT` and `2BJ64QRZ7RT8` to Unknown pending independent confirmation due to conflicting sources.
- Added `PJ2KEBRAYSRM`, `6LS3F3LS5K87`, `OPERACOLLAB`, `Y6JYMKV6JKSL`, `KeepUpWithMitya` and `MIJIQ23V2437` under Unknown (`verificationStatus: reported-active-unverified`) because they are listed by recent trackers, but were not tested in-game.
- Historical code data is an archive; an old `lastVerifiedAt` is not proof a code still works.

Primary character source: [HoYoverse's 7.2 patch notes](https://genshin.hoyoverse.com/en/news/detail/167187). Code-reference sources are attached per entry. Codes will only be promoted to Active after suitable verification.

## Optional Enka.Network player UID API

Use public Genshin profile/showcase data from [Enka.Network](https://enka.network/) separately from local JSON records. No API key is needed, but Enka requires a custom User-Agent, discourages UID enumeration, and applies dynamic rate limits.

```js
const Genshin=require('@nekosuneprojects/genshinimpact-api');
const gi=Genshin();
const uid='123456789'; // Pass the player's real 9-digit UID

const player=await gi.enka.player(uid); // Alias: gi.player(uid)
console.log(player.playerInfo.nickname,player.playerInfo.level);
console.log(player.avatarInfoList ?? []); // Full showcase builds and equipment

const basic=await gi.enka.info(uid); // ?info, player details only
const avatars=await gi.enka.avatars(uid); // Public detailed builds or []
```

By default this integration requests **`https://enka.network/api/gi/uid/{UID}/`**, as supplied. The [documented Enka endpoint](https://github.com/EnkaNetwork/API-docs/blob/master/api.md) is `/api/uid/{UID}/`; select it explicitly if the newer route fails:

```js
const gi=Genshin({enkaOptions:{endpoint:'legacy'}});
await gi.enka.player('123456789');
```

| Method | Function |
|---|---|
| `enka.player(uid)`, `enka.get(uid)`, `player(uid)` | Full original Enka response |
| `enka.info(uid)` | Only `playerInfo` (`?info`) |
| `enka.avatars(uid)` | Detailed public showcase array; empty if absent |
| `enka.clearCache(uid?)` | Delete one or all in-memory cached profiles |
| `enka.player(uid,{refresh:true,signal})` | Bypass TTL cache, optional AbortSignal |

The response is preserved without losing `playerInfo`, `avatarInfoList`, `propMap`, `fightPropMap`, `equipList`, `ttl`, `uid` or `region`. It does not claim raw numerical IDs are mapped to locally named items. `ttl` is respected via in-memory caching (up to one hour), and overlapping reads are deduplicated. No persistent UID database or background scanning is created.

Errors are typed `EnkaError` exceptions with `code`, `status`, `retryAfter` as available. HTTP 400, 404, 424, 429, 500 and 503 are handled. No private showcase bypasses or automatic retry loops are implemented. Use this API in Node.js/server code rather than browser clients where setting User-Agent is restricted.

**Verification:** The implementation has mocked API tests, but the specific `/api/gi/uid/` path was not live-tested from this environment. Use the documented `legacy` path if required.
