# @nekosuneprojects/arknightsendfield-api

**Local-first Arknights: Endfield SDK for Node.js 18+.** Source version `1.0.0` has not been published.

## Bundled data

The [`JsonData` branch](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/JsonData) is the source of all bundled records.

- `games/arknightsendfield/meta.json` — game information
- `games/arknightsendfield/characters/*.json` — **32 Operator profiles** with original source attributes, class, element, weapon, rarity, faction and available biography fields
- `codes/games/arknights-endfield.json` — original code archive of **15 Active**, **11 Expired**, **0 Unknown** records

**Important:** The code archive was last synced in August 2026 and contains invalid scraped reward labels (including `Oroberyl`, `Sticker`, `T-Creds`, `x100`). `ENDFIELDRENEW` has a recorded expiry of 30 August 2026 despite appearing in the Active group. The original `codes.active()` is **historical source data, not verified current availability**.

Use `codes.candidates()` for potential code strings that are not simple reward fragments and whose recorded expiry has not passed; this produces **two unverified candidates as of 7 November 2026** (`AKENDFIELDSUB` and `ZAU2SYXHWX5L4ZH`). `codes.verifiedActive()` deliberately returns `[]` because no account redemption test was performed. No API keys or account logins are required.

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
