# @nekosuneprojects/arknightsendfield-api

**Local-first Arknights: Endfield SDK for Node.js 18+.** Source version `1.0.0` has not been published.

## Bundled data

The [`JsonData` branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData) is the source of all bundled records.

- `games/arknightsendfield/meta.json` — game information
- `games/arknightsendfield/characters/*.json` — **34 Operator profiles** with original source attributes, class, element, weapon, rarity, faction and available biography fields
- `codes/games/arknights-endfield.json` — audited code archive of **4 reported Active**, **4 Expired**, **0 Unknown** records

**Important:** The November 7, 2026 audit removed 18 invalid scraped reward names/quantity fragments and moved expired codes to the right group. `codes.active()` exposes **4 reported codes**, but does not guarantee that an account can redeem them. `codes.candidates({now})` removes codes once their recorded expiry passes, and `codes.verifiedActive()` intentionally returns `[]` without an account-level redemption test.

The available sources report `ENDFIELDSTEAM` as valid through 25 November 2026 at 15:59 UTC. `ENDFIELDGIFT`, `ENDFIELD4PC` (PC-only), and `ZAU2SYXHWX5L4ZH` are reported active by several recent trackers. Expired codes are `AKENDFIELDSUB`, `ENDFIELDRENEW`, `ALLFIELD` and `RETURNOFALL`. Sources: [GamesRadar](https://www.gamesradar.com/games/rpg/arknights-endfield-codes/), [Game Guide](https://www.game.guide/arknights-endfield-codes), [Gaming Route](https://gamingroute.com/arknights-endfield-codes/).

## Install (after publishing)

```sh
npm install @nekosuneprojects/arknightsendfield-api@1.0.0
```

## Example

```js
const Endfield=require('@nekosuneprojects/arknightsendfield-api');
const api=Endfield();

const info=await api.About();
const akekuri=await api.character('akekuri');
const operators=await api.characters.list();
const matches=await api.characters.search('Vanguard');
const archive=await api.codes.snapshot();
const candidateCodes=await api.codes.candidates();
const definitelyVerified=await api.codes.verifiedActive(); // []

console.log(info.name,akekuri.name,operators.length,matches.total);
console.log(archive.Active.length,candidateCodes.length);
```

## Public API

| Method | Purpose |
| --- | --- |
| `About()` | Game metadata from local JSON |
| `character(id)`, `characters.get(id)` | Operator by name or slug |
| `characters.list()` | All local Operator records |
| `characters.search(query,{limit})`, `search(query,options)` | Offline search across record fields |
| `codes.snapshot()`, `codes.all()` | Read complete source code archive |
| `codes.active()`, `codes.expired()`, `codes.unknown()` | Original status groups (historical only) |
| `codes.candidates({now})` | Filter non-code reward text and already-expired dates; **not guaranteed valid** |
| `codes.verifiedActive()` | Empty until properly verified |
| `codes.get(value)`, `codes.search(query)` | Code and reward lookup |
| `data.get(path)`, `data.list()` | Local JSON storage |
| `data.sync()`, `codes.sync()` | Optional manual GitHub synchronization |

The SDK does **not** initiate network requests on normal local reads. On-demand synchronization uses GitHub tree and blob SHA verification, then caches downloaded JSON locally. Character, game, and code data can be refreshed independently. New and removed upstream records are not automatically removed from local caches.

## Development and release

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

The branch's CI runs Node 24 on push and on pull requests targeting the branch. Use the shared main-branch manual release workflow and select `tracker_branch=arknightsendfield-api` when you are ready to publish; do not release until its CI succeeds. Nothing is published by adding the source branch.

## Operator roster audit (7 November 2026)

Added **Si** (six-star Cryo Supporter, Great Sword, Version 1.6) and **Argent Flow** (six-star Electric Guard, Sword, Version 1.6) to both the `JsonData` source branch and this bundled npm snapshot. Sources: [Endfield Talos Wiki — Si](https://endfield.wiki.gg/wiki/Si), [Argent Flow 1.6 profile](https://www.enfieldbuild.com/characters/argent-flow), [Icy Veins operator roster](https://www.icy-veins.com/arknights-endfield/operators). The SDK now contains 34 Operator records.

## Optional Enka.Network Endfield UID lookup

The optional provider performs a live request to `https://enka.network/api/ef/uid/{UID}` only when a method on `enka` is called. It does **not** change the offline game, Operator or redemption-code behavior.

```js
const Endfield=require('@nekosuneprojects/arknightsendfield-api');
const endfield=Endfield();

const uid='6976332004'; // Example public UID; substitute another valid Endfield UID
const response=await endfield.enka.player(uid); // Alias: endfield.player(uid)
console.log(response.playerInfo.businessCard.name);
console.log(response.playerInfo.businessCard.adventureLevel);

const card=await endfield.enka.businessCard(uid);
const achievements=await endfield.enka.achievements(uid);
const domains=await endfield.enka.domains(uid);
const stats=await endfield.enka.statistics(uid);
const characters=await endfield.enka.operators(uid);
console.log(card.signature,achievements,domains,stats,characters);
```

| Method | Data returned |
|---|---|
| `enka.player(uid)`, `enka.get(uid)`, `player(uid)` | Entire original raw response, including `playerInfo`, `ttl`, `uid`, `region` |
| `enka.profile(uid)` | `playerInfo` object |
| `enka.businessCard(uid)` | `playerInfo.businessCard` or null |
| `enka.operators(uid)`, `enka.characters(uid)` | Available public `businessCard.charList` or `playerInfo.charData`; empty array if absent |
| `enka.achievements(uid)` | Achievement display and info lists |
| `enka.domains(uid)` | Domain development details, or empty array |
| `enka.statistics(uid)` | Public `charNum`, `weaponNum`, `docNum` and other statistics, if available |
| `enka.clearCache(uid?)` | Clear one UID's in-memory cache or the whole cache |
| `enka.player(uid,{refresh:true,signal})` | Skip cache or pass an AbortSignal |

The example's `businessCard.charList` is empty; that is **not** evidence that the player owns zero Operators. The `statistic.charNum` field represents a separate profile statistic. The integration preserves the response's original names, ID types and nested structure, and never guesses private characters or hidden details.

Enka's [API guidelines](https://github.com/EnkaNetwork/API-docs/blob/master/api.md) request a custom User-Agent, discourage mass UID enumeration, and describe a dynamic rate limit. The SDK caches by returned `ttl` in memory (maximum one hour) and coalesces duplicate in-flight lookups. There are no automatic retry loops and no persistent UID database. HTTP 400, 404, 424, 429, 500 and 503 become typed `EnkaError` exceptions including `retryAfter` if provided.

`fetchImpl`, `enkaOptions.userAgent`, and `enkaOptions.timeoutMs` can be configured when constructing the SDK. Use a Node.js backend for this integration because browsers cannot set custom User-Agent headers. The live Endfield route is based on the supplied Enka response; automated unit tests mock the response rather than contacting Enka itself.
