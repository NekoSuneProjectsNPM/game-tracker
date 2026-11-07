# @nekosuneprojects/nte-api

Local-first **Neverness to Everness (NTE)** game, characters and redeem codes SDK. Node.js 18+. Source version 1.0.0; not yet published.

## Bundled data

- 21 character records (`data/characters/*.json`) and game metadata (`data/meta.json`) copied directly from the `JsonData` branch.
- Historical redeem-code archive `data/codes/neverness-to-everness.json` with **11 Active, 25 Expired, 0 Unknown** original source labels.
- Independently sourced and dated community reports in `data/codes/reported-codes.json`.

**Source-status warnings:** The historical archive includes scraped invalid code strings such as `Copy` and `000`. The archived `codes.active()` is not a list of verified working codes; use `codes.candidates()` to filter obvious malformed entries and `codes.reported()` to see separately collected recent reports. No code has been redeemed by the SDK; `codes.verifiedActive()` returns `[]`.

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
