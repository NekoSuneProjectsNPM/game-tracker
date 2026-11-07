# @nekosuneprojects/honkaistarrail-api

Node.js 18+ **local-first Honkai: Star Rail** SDK (v1.0.0, not yet published). This standalone branch is independent from the Genshin package.

## Bundled local JSON
- Game metadata: `data/meta.json`
- **91** source character JSON records: `data/characters/*.json`
- Code archive: `data/codes/honkai-star-rail.json` (source labels: **0 verified Active**, **224 Expired**, **12 Unknown/unverified**)

**Important:** These code-status labels come from an older scraped source snapshot, *not* live redemption verification. The 7 November 2026 audit removed 81 incorrectly scraped character names and reward fragments, moved eight historically listed codes to Unknown, and added four newer code reports under Unknown. **No entries are verified currently redeemable**. `codes.active()` is intentionally empty pending actual verification. `codes.verifiedActive()` intentionally returns an empty array until reliable code verification is implemented. Redemption: https://hsr.hoyoverse.com/gift

## Installation after release
```sh
npm install @nekosuneprojects/honkaistarrail-api@1.0.0
```

## Usage
```js
const HSR = require('@nekosuneprojects/honkaistarrail-api');
const hsr = HSR();
const game = await hsr.About();
const character = await hsr.character('acheron');
const allCharacters = await hsr.characters.list();
const results = await hsr.characters.search('Lightning');
const historicalCodes = await hsr.codes.snapshot();
const unverifiedCodeReports = await hsr.codes.unknown();
const verified = await hsr.codes.verifiedActive(); // [] until verified
console.log(game.name,character.name,allCharacters.length,results.total);
```

### Optional live Enka.Network HSR player lookup
```js
const uid='601499975'; // Example only; never hardcoded by the SDK
const profile=await hsr.enka.player(uid); // Alias: hsr.player(uid)
console.log(profile.detailInfo.nickname,profile.detailInfo.level);
const displayed=await hsr.enka.avatars(uid);
console.log(displayed[0]?.relicList,displayed[0]?.equipment,displayed[0]?.skillTreeList);
const info=await hsr.enka.info(uid); // Returns detailInfo only, from the same cached request
```

The live endpoint is `https://enka.network/api/hsr/uid/{UID}`; it returns the raw `detailInfo`, optional `avatarDetailList`, `recordInfo`, relics, Light Cone equipment, `ttl`, UID and region. No response properties are renamed. An account's public showcase may be empty or disabled. Enka's policies require a custom User-Agent, avoiding UID enumeration, and observing dynamic rate limits. <https://github.com/EnkaNetwork/API-docs>

## API
- `About()`, `character(id)`, `characters.get(id)`, `characters.list()`, `characters.search(query)`, `search(query)` — bundled game and character data.
- `codes.snapshot()`, `codes.active()`, `codes.expired()`, `codes.unknown()`, `codes.all()`, `codes.get(codeOrId)`, `codes.search(query)` — archival JSON status lookups; **not verified live**.
- `codes.verifiedActive()` — intentionally empty until code verification is implemented.
- `data.sync()`, `codes.sync()` — optional on-demand sync from the public `JsonData` branch; never automatic on local reads.
- `enka.player(uid,{refresh,signal})`/`enka.get(uid)` — live Enka response, with in-memory `ttl` caching capped at one hour.
- `enka.avatars(uid)` — detailed showcased characters or an empty list.
- `enka.info(uid)` — `detailInfo` from the cached full response (not a separate info-only HTTP endpoint).
- `enka.clearCache(uid?)` — clear UID cache.
- Failed requests throw `EnkaError` with `code`, `status` and `retryAfter`; no infinite retries or private-profile bypass.

## Build and publish
```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Use the shared manual publishing workflow in `main` with `tracker_branch=honkaistarrail-api` after successful tests. Publishing should use npm Trusted Publishing or an appropriately authorised token. No release is triggered by a source push.

## November 7, 2026 data audit

The bundled JSON is synchronized with the corrected `JsonData` source archive:

- **91 character records**: newly added **Pearl**, **Aventurine • Waveflair** and **Robin • Summeretto**. Sources: [HoYoverse Pearl event warp](https://www.hoyolab.com/article/47142215), [released Version 4.6 game data](https://hsr.gachabase.net/characters/release/4.6.0/16707949?lang=en).
- **81 incorrect code tokens removed** (including character names `Acheron` and `Bronya`, reward text `Credit`, `Fuel` and quantities).
- **8 older plausible codes** moved to Unknown because August statuses are stale and live redemption was not tested.
- **4 reported November codes** added under Unknown: `DSLSPNBREASP`, `PEARLAPPRAISE`, `CTK5DRQVT48F`, `SunsweptRobin`. Source claims conflict; do not call them verified.
- **3 Version 4.7 livestream codes** added as expired: `NEVERGONNAGIVE`, `NEVERGONNAMAKE`, `AHABLESSYOU`; [HoYoLAB source specifies October 31 expiry](https://www.hoyolab.com/article/47252739?reply=1).
- Two codes, `5S6ZHRWTDNJB` and `4TKSX77Y58QK`, remain in the historic Expired bucket; recent trackers disagree about their current status. Do not promote without reliable verification.

The 7 November playable roster excludes Aeon ★ Aha, whose debut is officially announced for **11 November 2026**. No future character was marked released in this package. Data synchronization is optional and may refresh local content from `JsonData`.
