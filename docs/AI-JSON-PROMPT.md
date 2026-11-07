# Game JSON update prompt — reusable template

Copy the prompt below when asking GPT to add, fix or expand the JSON files for a particular game.

> Update the **[GAME]** JSON data under **[REPOSITORY]/data/[GAME]**. Inspect the existing JSON schema and related files first. Add only **[SPECIFIC ITEMS, CHARACTERS OR REDEMPTION CODES]** using reliable evidence that I supply or that you can verify. Preserve existing keys and compatible field types; do not invent names, active codes, expiration dates, statistics, URLs or descriptions. Do not overwrite unrelated entries. If the source lacks evidence for a field, omit it or mark it explicitly unknown according to the schema. Return valid JSON, explain exactly which files changed, and include source links where appropriate. Never modify package.json, npm versions or GitHub Actions when updating data only. Do not push or publish until explicitly instructed.

After reviewing and committing those JSON files to the source repository, an installed game tracker can call:

```js
const Warframe = require('@nekosuneprojects/warframe-api');
const warframeTracker = Warframe({ cacheDir: './storage/warframe' });
const syncResult = await warframeTracker.data.sync();
console.log(syncResult);
```

This code illustrates a future tracker branch. The GitHub source directory needs to be configured by the tracker developer in `src/data-source.js`. No npm release or API key is required for a public JSON-only synchronization.

## Suggested JSON sections

- `meta.json` — game name, developer, platform, links and description
- `characters/*.json` — character details and attributes
- `codes.json` or `codes/*.json` — redeemable codes, source, status, expiration where verified
- `items/*.json` — game items and equipment
- `maps/*.json` — geographic/game map metadata

These paths are *conventions*, not guaranteed to exist for every game. Inspect the existing repository before writing.
