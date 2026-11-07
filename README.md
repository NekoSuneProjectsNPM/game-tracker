# @nekosuneprojects/nte-api

Local-first **Neverness to Everness (NTE)** game, characters and redeem codes SDK. Node.js 18+. Source version 1.0.0; not yet published.

## Bundled data

- 24 character records (`data/characters/*.json`) and game metadata (`data/meta.json`) copied directly from the `JsonData` branch.
- Historical redeem-code archive `data/codes/neverness-to-everness.json` with **3 reported Active, 17 Expired, 16 Unknown** original source labels.
- Independently sourced and dated community reports in `data/codes/reported-codes.json`.

**Source-status warnings:** The 7 November audit removed invalid scraper strings including `Copy` and `000`. The archived `codes.active()` is not a list of verified working codes; use `codes.candidates()` to filter obvious malformed entries and `codes.reported()` to see separately collected recent reports. No code has been redeemed by the SDK; `codes.verifiedActive()` returns `[]`.

November 2026 trackers disagree: [GachaFeed](https://gachafeed.moe/nte/codes/) lists `NTENIGHT1021`, `BLACKBIRDHERE`, `COMEBACK`, `NTEGIFT`, while [Prydwen](https://www.prydwen.gg/neverness-to-everness/codes) says none active and considers `NTEGIFT` expired. [SenseOS](https://senseos.gg/guides/neverness-to-everness/redeem-codes/) lists `EXENORESPONSE`, `INVALIDNUMBER` and `HIOLDFRIEND` expired after November 1. Reported expiry timestamps have unknown precise timezones and must not be treated as official promises.

## Install after npm release

```bash
npm install @nekosuneprojects/nte-api@1.0.0
```

## Usage

```js
const NTE=require('@nekosuneprojects/nte-api');
const api=NTE();
const game=await api.About();
const adler=await api.character('adler');
const characters=await api.characters.list();
const matches=await api.characters.search('Incantation');
const archivedCodes=await api.codes.snapshot();
const reportedCodes=await api.codes.reported();
const candidates=await api.codes.candidates();
console.log(game.name,adler.name,characters.length,matches.total,reportedCodes,candidates);
```

### Methods

| API | Description |
| --- | --- |
| `About()` | Local game metadata |
| `character(id)`, `characters.get(id)`, `characters.list()`, `characters.search(query)` | Local character lookups |
| `search(query,{category,limit})` | Full local search |
| `codes.snapshot()`, `codes.active()`, `codes.expired()`, `codes.unknown()`, `codes.all()` | Historical code archive |
| `codes.get(code)`, `codes.search(query)` | Search archived entries |
| `codes.candidates({now})` | Historical active labels minus obvious scrape junk and elapsed expiries |
| `codes.reported({now,includeExpired})` | Community reports, separately tagged; default excludes date-expired reports |
| `codes.verifiedActive()` | Empty until account-level redemption verified |
| `data.sync()`, `codes.sync()` | Manual GitHub JsonData sync; no automatic network access |

All ordinary methods work with bundled JSON and without an API key. The archived code data and recent reports are separate, and reports aren't silently overwritten by manual code archive sync.

## CI & publishing

```bash
npm ci
npm run check
npm test
npm pack --dry-run
```

This branch uses `.github/workflows/test-nte.yml` for validation. No npm or GitHub Packages release is triggered by commits to `nte-api`; publish later via main's manual workflow by selecting `tracker_branch=nte-api`.

## Current data audit — 7 November 2026

- Added **Linko** (S-rank Anima, released September 9), **Blackbird** (S-rank Psyche, released September 30) and **Akane Rin** (S-rank Lakshana, released October 21), bringing the local character roster to **24**. Sources: [Official Linko notice](https://nte.perfectworld.com/en/article/news/gamenews/20260908/263947.html), [Official 1.4 patch notes](https://nte.perfectworld.com/en/article/news/gamenews/20260929/264409.html).
- **Elyms and Exe** are announced for Version 1.5 (starting November 11); they are not included as already-playable characters.
- Deleted six invalid scrape fragments, and inserted new code records for `NTENIGHT1021`, `BLACKBIRDHERE`, `961251AXACTTZDNY`, `EXENORESPONSE`, `HIOLDFRIEND`, and `INVALIDNUMBER`.
- Moved disputed codes into Unknown, including `NTEGIFT`, `DREAMWALK0603`, `TOMATO100` and `RACENOLIMIT`. Cross-referenced [GachaFeed](https://gachafeed.moe/nte/codes/), [Mobalytics](https://mobalytics.gg/neverness-to-everness/redemption-codes), [Game Guide](https://www.game.guide/neverness-to-everness-codes), and [Prydwen](https://www.prydwen.gg/neverness-to-everness/codes).
- Audited archive counts: **3 Active (reported, not account-verified), 17 Expired and 16 Unknown (36 total)**. Any `expiresAt` whose exact time is not reported should be understood as an approximate boundary. No actual redemption has been tested.
