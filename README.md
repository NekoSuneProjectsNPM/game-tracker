# @nekosuneprojects/zenlesszonezero-api

Standalone local-first Zenless Zone Zero SDK for Node.js **18+**. Version **1.0.0** is source-only until published; its default game, Agent and redeem-code APIs require no network or API keys.

## Local JSON snapshot

- `data/meta.json` — game metadata from the repository's `JsonData` branch.
- `data/characters/*.json` — **61 playable Agent entries**, manually assembled from a public [October 30, 2026 roster](https://timesaver.gg/blog/zzz-characters-list) and checked against [HoYoverse's official character page](https://zenless.hoyoverse.com/en-us/main).
- `data/codes/zenless-zone-zero.json` — original historical **13 Active / 102 Expired / 0 Unknown** JSON records from `JsonData`, preserved without modifying original history.

**Important:** As of 7 November 2026, Severian Lowell is *announced for November 11* and is **not included** as an already-released Agent. Characters with a separate playable variant (e.g. Soldier 0 - Anby and Starlight - Billy Kid) have separate records. This snapshot has fields `name`, `slug`, `rank`, `rarity`, `attribute`, `specialty`, `faction`, `version`, `releaseDate` and source; it does not invent unverified stats, skills or weapons.

The old redeem-code archive contains scraped **reward text mistaken for codes** (`Denny`, `Polychrome`, `x300`). `codes.active()` exposes the **unchanged raw status group** for archive compatibility, *not* currently working codes. `codes.candidates()` omits those nine reward fragments and labels the remaining four as `unverified-snapshot`. `codes.verifiedActive()` returns `[]` until genuine redemption verification is possible. Never advertise these four as confirmed working. Redeem codes at <https://zenless.hoyoverse.com/redemption>.

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
| `codes.snapshot()` | Original Active/Expired/Unknown code archive |
| `codes.all()`, `codes.get(codeOrId)`, `codes.search(query)` | Historical code lookups |
| `codes.active()`, `codes.expired()`, `codes.unknown()` | Original source-status groups |
| `codes.candidates()` | Four possible code strings, **not verified working** |
| `codes.verifiedActive()` | Empty list until independent verification |
| `data.sync()`, `codes.sync()` | Optional manual on-demand GitHub `JsonData` sync |

Normal reads use bundled JSON and optional disk cache. No background fetching. `data.sync()` checks `games/zenlesszonezero/` on `JsonData`; `codes.sync()` independently updates `codes/games/zenless-zone-zero.json`. Characters are bundled in the package because the current `JsonData` branch does not yet contain an Agent catalog. Newer character updates can be committed to `JsonData` later.

## Validate and publish

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Use the shared manual release workflow in `main` with `tracker_branch=zenlesszonezero-api`, after tests pass. Do not reuse an npm version that is already published.
