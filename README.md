# @nekosuneprojects/wutheringwaves-api

Standalone **Wuthering Waves (WuWa)** local-first Node.js 18+ API. Version `1.0.0` is source-only until published.

## Local JSON data

- `data/meta.json` — game metadata from `JsonData/games/wutheringwaves`.
- `data/characters/*.json` — **57 playable Resonator records** through Version **3.7** (30 September–11 November 2026).
- `data/codes/wuthering-waves.json` — **4 reported Active, 68 historical Expired, 0 Unknown** codes. Seven scraped non-code fragments have been removed.

The 57-Resonator snapshot is grounded in [Kuro Games Version 3.7 patch notes](https://wutheringwaves.kurogames.com/en/main/news/detail/5571), earlier patch notes, and [SenseOS's roster cross-check](https://senseos.gg/wiki/wuthering-waves/resonators/). Every record contains name, rarity, version and optional element/weapon when documented by reviewed sources. **Null means unknown, not absence.** Rover's alternate elements are not separate characters. Future Version 3.8 additions are intentionally excluded until release.

## Redeem-code status (7 November 2026)

| Code | Reward | Published expiry |
| --- | --- | --- |
| `TRAINOFSOULS` | 100 Astrite + materials | 8 Nov 2026 15:59 UTC |
| `BLOOMINGFLOWERS` | 100 Astrite + materials | 8 Nov 2026 15:59 UTC |
| `SCHOOLLIFE` | 100 Astrite + materials | 8 Nov 2026 15:59 UTC |
| `WUTHERINGGIFT` | 50 Astrite + materials | No announced end date |

Three livestream codes were published during the [6 November Version 3.8 preview](https://www.pockettactics.com/wuthering-waves/codes). They expire **8 November 07:59 PST / 15:59 UTC** per [reviewed sources](https://timesaver.gg/blog/wuthering-waves-codes). `codes.candidates({now})` automatically excludes these after their expiry. No account-level redemption was performed; all Active statuses mean **reported active**, not guaranteed. `codes.verifiedActive()` returns `[]` until genuinely verified.

Redeem in game: reach Union Level 2, then **Settings → Other Settings → Redemption Code**. There is no confirmed official web redemption endpoint. Some trackers disagree about historical codes and the exact reward quantity.

## Example

```js
const WuWa = require('@nekosuneprojects/wutheringwaves-api');
const api = WuWa();

const game = await api.About();
const hsin = await api.character('hsin');
const resonators = await api.characters.list();
const electro = await api.characters.search('Electro');

const archive = await api.codes.snapshot();
const candidates = await api.codes.candidates(); // Expires date-scoped entries automatically
console.log(game.name,hsin.name,resonators.length,electro.total,candidates);
```

## Methods

| API | Purpose |
| --- | --- |
| `About()` | Game metadata |
| `character(id)`, `characters.get(id)`, `characters.list()`, `characters.search(query)` | Offline Resonator JSON |
| `search(query,{category,limit})` | General local search |
| `codes.snapshot()`, `codes.all()`, `codes.get(code)`, `codes.search(query)` | Redeem-code history |
| `codes.active()`, `codes.expired()`, `codes.unknown()` | Raw code labels |
| `codes.candidates({now})` | Unexpired reported codes, not verified redemptions |
| `codes.verifiedActive()` | Empty list unless verified in the future |
| `data.sync()`, `codes.sync()` | Explicit GitHub JsonData synchronization |

Normal methods use bundled data with no API keys or network calls. Optional `sync()` fetches changed JSON from the public `JsonData` branch and verifies Git blob hashes.

## Validate and publish

```sh
npm ci
npm run check
npm test
npm pack --dry-run
```

Use the dedicated branch Actions workflow to validate and the shared manual npm workflow (with `tracker_branch=wutheringwaves-api`) when ready. No publish or merge is automatically triggered.
