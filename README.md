# @nekosuneprojects/zenlesszonezero-api

Standalone local-first Zenless Zone Zero SDK for Node.js **18+**. Version **1.0.0** is source-only until published; its default game, Agent and redeem-code APIs require no network or API keys.

## Local JSON snapshot

- `data/meta.json` — game metadata from the repository's `JsonData` branch.
- `data/characters/*.json` — **61 playable Agent entries**, manually assembled from a public [October 30, 2026 roster](https://timesaver.gg/blog/zzz-characters-list) and checked against [HoYoverse's official character page](https://zenless.hoyoverse.com/en-us/main).
- `data/codes/zenless-zone-zero.json` — audited historical **4 reported Active / 109 Expired / 2 Unknown** JSON records from `JsonData`.

**Important:** As of 7 November 2026, Severian Lowell is *announced for November 11* and is **not included** as an already-released Agent. Characters with a separate playable variant (e.g. Soldier 0 - Anby and Starlight - Billy Kid) have separate records. This snapshot has fields `name`, `slug`, `rank`, `rarity`, `attribute`, `specialty`, `faction`, `version`, `releaseDate` and source; it does not invent unverified stats, skills or weapons.

The November 7 audit removed nine scraped reward fragments (`Denny`, `Polychrome`, `x300`, etc.), moved stale codes to Expired, and flagged disputed entries under Unknown. `codes.active()` shows **four codes reported as active** by contemporary sources, but none were tested against a player account. `codes.candidates()` returns the same four with `reported-active-unverified` status. `codes.verifiedActive()` returns `[]` until genuine redemption verification is possible. Never advertise these four as confirmed working. Redeem codes at <https://zenless.hoyoverse.com/redemption>.

## Installation (after npm publication)

```sh
npm install @nekosuneprojects/zenlesszonezero-api@1.0.0
```

## Usage

```js
const ZZZ=require('@nekosuneprojects/zenlesszonezero-api');
const zzz=ZZZ();

const game=await zzz.About();
const ellen=await zzz.character('ellenjoe');
const phoenix=await zzz.character('Phoenix Reffaella');
const allAgents=await zzz.characters.list();
const fireAgents=await zzz.characters.search('Fire');
const archival=await zzz.codes.snapshot();
const candidates=await zzz.codes.candidates();
const verifiedCodes=await zzz.codes.verifiedActive(); // []
console.log(game.name,ellen.name,phoenix.name,fireAgents.total);
```

## API

| Method | Description |
|---|---|
| `About()` | Local game metadata |
| `character(id)`, `characters.get(id)` | Single Agent by slug/name |
| `characters.list()` | All bundled playable Agents |
| `characters.search(query,{limit})`, `search(query,options)` | Search locally by name, attribute, faction, role etc. |
| `codes.snapshot()` | Audited Active/Expired/Unknown code archive |
| `codes.all()`, `codes.get(codeOrId)`, `codes.search(query)` | Historical code lookups |
| `codes.active()`, `codes.expired()`, `codes.unknown()` | Audited source-status groups; Active is not account-verified |
| `codes.candidates()` | Four community-reported codes, **not tested for redemption** |
| `codes.verifiedActive()` | Empty list until independent verification |
| `data.sync()`, `codes.sync()` | Optional manual on-demand GitHub `JsonData` sync |

Normal reads use bundled JSON and optional disk cache. No background fetching. `data.sync()` checks `games/zenlesszonezero/` on `JsonData`; `codes.sync()` independently updates `codes/games/zenless-zone-zero.json`. All 61 Agent records are now also mirrored into the `JsonData` branch for on-demand syncing.

## Validate and publish

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Use the shared manual release workflow in `main` with `tracker_branch=zenlesszonezero-api`, after tests pass. Do not reuse an npm version that is already published.

## Audit (7 November 2026)

- **61 released Agents** checked against the [Version 3.3 roster](https://timesaver.gg/blog/zzz-characters-list) and [HoYoverse 3.3 Phase I notice](https://zenless.hoyoverse.com/en-us/news/166964). No confirmed missing released Agent as of that date. Severian is expected in Phase II, not yet released.
- Source `JsonData/games/zenlesszonezero/characters/` now includes the 61 Agent files so `data.sync()` can discover them.
- Removed **nine scraped reward fragments** incorrectly recorded as redeem codes.
- Recorded **4 reported-active codes**: `ZENLESSGIFT`, `LEVELUP33`, `INKSHIFT33`, `HOLLOWRUN33`. Source: [Icy Veins](https://www.icy-veins.com/zenless-zone-zero/redemption-codes), [GachaFeed](https://gachafeed.moe/zzz/codes/). No account redemption performed.
- `ZZZ31REMIELLE` and `ZZZMEIJI` were moved to Expired; additionally archived `JRNY2SKY`, `FLINTWORKS`, `ZZZVOID32`, `ZZZINK32`, and `ZZZGRIND32` as expired. `JRNY2SKY` expired 11 October according to [HoYoverse](https://zenless.hoyoverse.com/en-us/news/166644).
- `ZZZ2YEAR` and `SUNBRINGER` are **Unknown** due to conflicting reports. Source disagreement is preserved rather than inventing a deadline.
- The local code archive now contains **115 entries**: **4 Active (unverified)**, **109 Expired**, and **2 Unknown**. `codes.verifiedActive()` remains empty until there is actual redemption verification.

Always treat a community listing as reported availability, not proof that the specific account can redeem a code.

## Optional Enka.Network ZZZ player profiles

Read public Zenless Zone Zero UID profiles via `https://enka.network/api/zzz/uid/{UID}`. This uses Enka's *ZZZ-specific* response shape, not Genshin's `playerInfo` or Star Rail's `detailInfo`. The original capitalization and all numeric IDs and equipment attributes are preserved.

```js
const ZZZ = require('@nekosuneprojects/zenlesszonezero-api');
const zzz = ZZZ();

const uid = '1300528351'; // Example only; supply your own UID
const player = await zzz.enka.player(uid); // Alias: zzz.player(uid)
console.log(player.PlayerInfo.SocialDetail.ProfileDetail.Nickname);
console.log(player.PlayerInfo.SocialDetail.ProfileDetail.Level);

const agents = await zzz.enka.agents(uid);
for (const agent of agents) {
  console.log(agent.Id, agent.Level);
  console.log(agent.Weapon);        // W-Engine
  console.log(agent.EquippedList);  // Drive Discs, main and sub-properties
  console.log(agent.SkillLevelList);
}
const profile = await zzz.enka.info(uid); // Cached SocialDetail.ProfileDetail
const social = await zzz.enka.social(uid); // SocialDetail, medals and description
```

| Method | Purpose |
| --- | --- |
| `enka.get(uid)`, `enka.player(uid)`, `player(uid)` | Raw original response including `PlayerInfo`, `ttl`, `uid`, `region` |
| `enka.info(uid)` | `PlayerInfo.SocialDetail.ProfileDetail`, or `null` if unavailable |
| `enka.social(uid)` | `PlayerInfo.SocialDetail`, or `null` |
| `enka.agents(uid)`, `enka.avatars(uid)` | `PlayerInfo.ShowcaseDetail.AvatarList`, or `[]` for a closed/empty showcase |
| `enka.clearCache(uid?)` | Remove cached UID or clear entire in-memory cache |
| `enka.player(uid,{refresh:true,signal})` | Bypass cache or supply an AbortSignal |

The Enka API has dynamic UID rate limits. To avoid unnecessary requests, the module uses the server's `ttl` (seconds) with a maximum one-hour memory cache and deduplicates concurrent requests. Requests supply a custom User-Agent and support a configurable timeout, `fetchImpl`, and `enkaOptions`. HTTP 400, 404, 424, 429, 500 and 503 errors are mapped to typed `EnkaError` exceptions, including `retryAfter` when reported. There is no account authentication, private showcase bypass, or automated UID scanning.

Read [Enka's ZZZ data documentation](https://github.com/EnkaNetwork/API-docs/blob/master/docs/zzz/api.md) for `AvatarList`, W-Engine and Drive Disc field definitions. Item IDs are **not automatically decoded to item names**; doing so requires an additional local game-data mapping. Use a Node.js backend for live requests, since setting User-Agent is restricted in browsers.

All ordinary `character()`, `characters.list()`, and `codes` methods remain offline. Live Enka responses are only fetched when an `enka` or `player` method is called.
